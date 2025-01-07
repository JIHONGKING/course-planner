// src/lib/courseRecommender.ts

import type { Course, AcademicPlan } from '@/types/course';
import type { GraduationRequirements } from '@/types/graduation';
import { GraduationValidator } from '@/utils/graduationUtils';

interface RecommendationCriteria {
  prioritizeGrades?: boolean;    // 높은 학점 우선
  balanceWorkload?: boolean;     // 워크로드 균형
  preferredTerms?: string[];     // 선호 학기
  maxCreditsPerTerm?: number;    // 학기당 최대 학점
}

interface CourseScore {
  course: Course;
  score: number;
  reasons: string[];
}

export class CourseRecommender {
  private allCourses: Course[];
  private plan: AcademicPlan;
  private requirements: GraduationRequirements;
  private validator: GraduationValidator;

  constructor(
    courses: Course[],
    plan: AcademicPlan,
    requirements: GraduationRequirements
  ) {
    this.allCourses = courses;
    this.plan = plan;
    this.requirements = requirements;
    this.validator = new GraduationValidator(plan, requirements, courses);
  }

  recommendCourses(criteria: RecommendationCriteria = {}): CourseScore[] {
    const takenCourses = new Set(
      this.plan.years.flatMap(y => 
        y.semesters.flatMap(s => 
          s.courses.map(c => c.code)
        )
      )
    );

    // 수강 가능한 과목 필터링
    const availableCourses = this.allCourses.filter(course => {
      // 이미 수강한 과목 제외
      if (takenCourses.has(course.code)) return false;

      // 선수과목 체크
      const prerequisites = course.prerequisites.every(prereq =>
        takenCourses.has(prereq.courseId)
      );

      // 학기 제공 여부 체크
      const termAvailable = !criteria.preferredTerms?.length ||
        course.term.some(t => criteria.preferredTerms?.includes(t));

      return prerequisites && termAvailable;
    });

    // 과목별 점수 계산
    const scoredCourses = availableCourses.map(course => {
      const score = this.calculateCourseScore(course, criteria);
      const reasons = this.generateRecommendationReasons(course, criteria);
      
      return {
        course,
        score,
        reasons
      };
    });

    // 점수 기반 정렬
    return scoredCourses.sort((a, b) => b.score - a.score);
  }

  private calculateCourseScore(course: Course, criteria: RecommendationCriteria): number {
    let score = 0;
    const reasons: string[] = [];

    // 1. 졸업 요건 기여도
    const requirementContribution = this.calculateRequirementContribution(course);
    score += requirementContribution * 2;  // 가중치 2배

    // 2. 성적 분포
    if (criteria.prioritizeGrades) {
      const gradeScore = this.calculateGradeScore(course);
      score += gradeScore;
    }

    // 3. 선수과목 관계
    const prerequisiteScore = this.calculatePrerequisiteScore(course);
    score += prerequisiteScore;

    // 4. 워크로드 균형
    if (criteria.balanceWorkload) {
      const workloadScore = this.calculateWorkloadScore(course);
      score += workloadScore;
    }

    return score;
  }

  private calculateRequirementContribution(course: Course): number {
    let contribution = 0;

    // 필수 과목 여부 확인
    const isRequired = this.requirements.requirements.some(req => 
      req.type === 'core' && 
      req.courses.some(c => c.courseId === course.code)
    );
    if (isRequired) contribution += 5;

    // 전공 과목 여부 확인
    const isMajor = this.requirements.requirements.some(req =>
      req.type === 'major' &&
      (req.requiredCourses.some(c => c.courseId === course.code) ||
       req.electiveCourses.includes(course.code))
    );
    if (isMajor) contribution += 3;

    return contribution;
  }

  private calculateGradeScore(course: Course): number {
    const distribution = typeof course.gradeDistribution === 'string'
      ? JSON.parse(course.gradeDistribution)
      : course.gradeDistribution;

    // A 학점 비율을 기반으로 점수 계산
    return parseFloat(distribution.A) / 20;  // 0-5 점 범위로 정규화
  }

  private calculatePrerequisiteScore(course: Course): number {
    // 이 과목이 다른 과목의 선수과목인 경우 가중치 부여
    const isPrerequisiteFor = this.allCourses.filter(c =>
      c.prerequisites.some(p => p.courseId === course.code)
    ).length;

    return isPrerequisiteFor * 0.5;  // 각 후속 과목당 0.5점
  }

  private calculateWorkloadScore(course: Course): number {
    // 현재 학기의 총 학점
    const currentTermCredits = this.getCurrentTermCredits();
    
    // 적정 학점(15)에서 얼마나 벗어났는지 계산
    const creditDiff = Math.abs(15 - (currentTermCredits + course.credits));
    
    // 차이가 적을수록 높은 점수
    return 5 - creditDiff * 0.5;  // 최대 5점
  }

  private getCurrentTermCredits(): number {
    // 현재 학기의 총 학점 계산 로직
    return 0; // TODO: 실제 구현 필요
  }

  private generateRecommendationReasons(course: Course, criteria: RecommendationCriteria): string[] {
    const reasons: string[] = [];

    // 졸업 요건 관련 이유
    if (this.requirements.requirements.some(req => 
      req.type === 'core' && 
      req.courses.some(c => c.courseId === course.code)
    )) {
      reasons.push('필수 과목입니다');
    }

    // 성적 분포 관련 이유
    if (criteria.prioritizeGrades) {
      const gradeScore = this.calculateGradeScore(course);
      if (gradeScore > 4) {
        reasons.push('A학점 비율이 높은 과목입니다');
      }
    }

    // 선수과목 관련 이유
    const prerequisiteCount = this.allCourses.filter(c =>
      c.prerequisites.some(p => p.courseId === course.code)
    ).length;
    
    if (prerequisiteCount > 0) {
      reasons.push(`${prerequisiteCount}개 과목의 선수과목입니다`);
    }

    return reasons;
  }
}