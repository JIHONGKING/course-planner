// src/lib/courseRecommender.ts
import type { Course } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface RecommendationOptions {
  prioritizeGrades?: boolean;
  balanceWorkload?: boolean;
  includeRequirements?: boolean;
  maxCreditsPerTerm?: number;
  preferredTerms?: string[];
}

export class CourseRecommender {
  private courses: Course[];
  private completedCourses: Course[];
  private currentTermCourses: Course[];

  constructor(
    courses: Course[],
    completedCourses: Course[] = [],
    currentTermCourses: Course[] = []
  ) {
    this.courses = courses;
    this.completedCourses = completedCourses;
    this.currentTermCourses = currentTermCourses;
  }

  recommendCourses(options: RecommendationOptions = {}): Array<{
    course: Course;
    score: number;
    reasons: string[];
  }> {
    const availableCourses = this.filterAvailableCourses(options);
    
    return availableCourses
      .map(course => ({
        course,
        score: this.calculateScore(course, options),
        reasons: this.generateReasons(course, options)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // 상위 5개 추천
  }

  private filterAvailableCourses(options: RecommendationOptions): Course[] {
    return this.courses.filter(course => {
      // 이미 수강한 과목 제외
      if (this.completedCourses.some(c => c.id === course.id)) {
        return false;
      }

      // 현재 수강 중인 과목 제외
      if (this.currentTermCourses.some(c => c.id === course.id)) {
        return false;
      }

      // 선수과목 체크
      const hasPrerequisites = course.prerequisites.every(prereq =>
        this.completedCourses.some(c => c.code === prereq.courseId)
      );

      // 학기 제공 여부 체크
      const termAvailable = !options.preferredTerms?.length ||
        course.term.some(t => options.preferredTerms?.includes(t));

      return hasPrerequisites && termAvailable;
    });
  }

  private calculateScore(course: Course, options: RecommendationOptions): number {
    let score = 0;

    // 성적 분포 점수
    if (options.prioritizeGrades) {
      const gradeA = parseFloat(getGradeA(course.gradeDistribution));
      score += gradeA * 2;
    }

    // 워크로드 밸런스 점수
    if (options.balanceWorkload) {
      const currentCredits = this.currentTermCourses
        .reduce((sum, c) => sum + c.credits, 0);
      const targetCredits = options.maxCreditsPerTerm || 15;
      const creditDiff = Math.abs(targetCredits - (currentCredits + course.credits));
      score += (5 - creditDiff) * 2;
    }

    // 선수과목 관계 점수
    const isPrerequisiteFor = this.courses.filter(c =>
      c.prerequisites.some(p => p.courseId === course.code)
    ).length;
    score += isPrerequisiteFor * 3;

    return score;
  }

  private generateReasons(course: Course, options: RecommendationOptions): string[] {
    const reasons: string[] = [];

    // 성적 관련 이유
    if (options.prioritizeGrades) {
      const gradeA = parseFloat(getGradeA(course.gradeDistribution));
      if (gradeA > 80) {
        reasons.push('높은 A학점 비율');
      }
    }

    // 워크로드 관련 이유
    if (options.balanceWorkload) {
      const currentCredits = this.currentTermCourses
        .reduce((sum, c) => sum + c.credits, 0);
      if (currentCredits + course.credits <= (options.maxCreditsPerTerm || 15)) {
        reasons.push('적절한 학점 배분');
      }
    }

    // 선수과목 관련 이유
    const prerequisiteFor = this.courses.filter(c =>
      c.prerequisites.some(p => p.courseId === course.code)
    );
    if (prerequisiteFor.length > 0) {
      reasons.push(`${prerequisiteFor.length}개 과목의 선수과목`);
    }

    return reasons;
  }
}