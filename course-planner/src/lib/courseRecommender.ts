// src/lib/courseRecommender.ts

import type { Course, GradeDistribution } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';
import _ from 'lodash';

export interface RecommendationOptions {
  prioritizeGrades?: boolean;
  balanceWorkload?: boolean;
  includeRequirements?: boolean;
  maxCreditsPerTerm?: number;
  preferredTerms?: string[];
  preferredDays?: string[];
  maxResults?: number;  // 추가
}

export interface RecommendationResult {
  course: Course;
  score: number;
  reasons: string[];
}

export class CourseRecommender {
  private readonly courses: Course[];
  private readonly completedCourses: Course[];
  private readonly currentTermCourses: Course[];
  private readonly courseGraph: Map<string, Set<string>>;
  private readonly DEFAULT_MAX_CREDITS = 15;

  constructor(
    courses: Course[],
    completedCourses: Course[] = [],
    currentTermCourses: Course[] = []
  ) {
    this.courses = courses;
    this.completedCourses = completedCourses;
    this.currentTermCourses = currentTermCourses;
    this.courseGraph = this.buildPrerequisiteGraph();
  }

  recommendCourses(options: RecommendationOptions = {}): RecommendationResult[] {
    // 수강 가능한 과목 필터링
    const availableCourses = this.filterAvailableCourses(options);
    
    // 각 과목에 대한 점수 계산 및 이유 생성
    const recommendations = availableCourses.map(course => {
      const baseScore = this.calculateBaseScore(course);
      const contextScore = this.calculateContextScore(course, options);
      const totalScore = baseScore + contextScore;

      return {
        course,
        score: totalScore,
        reasons: this.generateReasons(course, options, totalScore)
      };
    });

    // 점수별 정렬 및 상위 5개 추천
    return _.chain(recommendations)
      .sortBy('score')
      .reverse()
      .take(5)
      .value();
  }

  private calculateBaseScore(course: Course): number {
    let score = 0;

    // 1. 성적 분포 기반 점수 (40%)
    const gradeA = parseFloat(getGradeA(course.gradeDistribution));
    score += (gradeA / 100) * 40;

    // 2. 선수과목 영향도 점수 (30%)
    const dependencyScore = this.calculateDependencyScore(course);
    score += dependencyScore * 30;

    // 3. 과목 레벨 점수 (20%)
    const levelScore = parseInt(course.level) / 500;
    score += levelScore * 20;

    // 4. 학점 균형 점수 (10%)
    const creditScore = (course.credits / 5);
    score += creditScore * 10;

    return score;
  }

  private calculateContextScore(course: Course, options: RecommendationOptions): number {
    let score = 0;

    // 1. 워크로드 밸런스 (0-20점)
    if (options.balanceWorkload) {
      const currentCredits = this.currentTermCourses
        .reduce((sum, c) => sum + c.credits, 0);
      const targetCredits = options.maxCreditsPerTerm || this.DEFAULT_MAX_CREDITS;
      const creditDiff = Math.abs(targetCredits - (currentCredits + course.credits));
      score += Math.max(0, 20 - creditDiff * 4);
    }

    // 2. 선호 학기 매칭 (0-15점)
    if (options.preferredTerms?.length) {
      const termMatch = course.term.some(t => options.preferredTerms?.includes(t));
      if (termMatch) score += 15;
    }

    // 3. 선호 요일 매칭 (0-15점)
    if (options.preferredDays?.length && course.courseSchedules?.length) {
      const dayMatches = course.courseSchedules
        .filter(schedule => options.preferredDays?.includes(schedule.dayOfWeek))
        .length;
      score += (dayMatches / course.courseSchedules.length) * 15;
    }

    return score;
  }

  private calculateDependencyScore(course: Course): number {
    const dependentsCount = this.getDependentCourses(course.code).size;
    const maxDependents = Math.max(...Array.from(this.courseGraph.values()).map(s => s.size));
    return dependentsCount / (maxDependents || 1);
  }

  private filterAvailableCourses(options: RecommendationOptions): Course[] {
    return this.courses.filter(course => {
      // 1. 이미 수강한 과목 제외
      if (this.completedCourses.some(c => c.id === course.id)) return false;

      // 2. 현재 학기 수강 과목 제외
      if (this.currentTermCourses.some(c => c.id === course.id)) return false;

      // 3. 선수과목 요건 확인
      if (!this.canTakeCourse(course)) return false;

      // 4. 학점 제한 확인
      if (options.maxCreditsPerTerm) {
        const currentCredits = this.currentTermCourses
          .reduce((sum, c) => sum + c.credits, 0);
        if (currentCredits + course.credits > options.maxCreditsPerTerm) {
          return false;
        }
      }

      // 5. 선호 학기 확인
      if (options.preferredTerms?.length) {
        return course.term.some(t => options.preferredTerms?.includes(t));
      }

      return true;
    });
  }

  private canTakeCourse(course: Course): boolean {
    return course.prerequisites.every(prereq =>
      this.completedCourses.some(c => c.code === prereq.courseId)
    );
  }

  private buildPrerequisiteGraph(): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    this.courses.forEach(course => {
      if (!graph.has(course.code)) {
        graph.set(course.code, new Set());
      }

      course.prerequisites.forEach(prereq => {
        if (!graph.has(prereq.courseId)) {
          graph.set(prereq.courseId, new Set());
        }
        // 선수과목을 필요로 하는 과목 추가
        graph.get(prereq.courseId)?.add(course.code);
      });
    });

    return graph;
  }

  private getDependentCourses(courseCode: string): Set<string> {
    return this.courseGraph.get(courseCode) || new Set();
  }

  private generateReasons(
    course: Course,
    options: RecommendationOptions,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // 1. 성적 분포 관련 이유
    const gradeA = parseFloat(getGradeA(course.gradeDistribution));
    if (gradeA >= 80) {
      reasons.push('High chance of getting an A grade');
    } else if (gradeA >= 70) {
      reasons.push('Good grade distribution');
    }

    // 2. 선수과목 관련 이유
    const dependents = this.getDependentCourses(course.code);
    if (dependents.size > 0) {
      reasons.push(`Prerequisite for ${dependents.size} other courses`);
    }
    
    if (course.prerequisites.length === 0) {
      reasons.push('No prerequisites required');
    }

    // 3. 워크로드 밸런스 관련 이유
    if (options.balanceWorkload) {
      const currentCredits = this.currentTermCourses
        .reduce((sum, c) => sum + c.credits, 0);
      const targetCredits = options.maxCreditsPerTerm || this.DEFAULT_MAX_CREDITS;
      const newTotal = currentCredits + course.credits;
      
      if (Math.abs(targetCredits - newTotal) <= 2) {
        reasons.push('Helps achieve balanced credit load');
      }
    }

    // 4. 스케줄 관련 이유
    if (options.preferredDays?.length && course.courseSchedules?.length) {
      const dayMatches = course.courseSchedules
        .filter(schedule => options.preferredDays?.includes(schedule.dayOfWeek))
        .length;
      
      if (dayMatches === course.courseSchedules.length) {
        reasons.push('Perfectly matches preferred schedule');
      } else if (dayMatches > 0) {
        reasons.push('Partially matches preferred schedule');
      }
    }

    // 5. 과목 특성 관련 이유
    if (course.term.length > 1) {
      reasons.push('Offered in multiple terms');
    }

    if (score >= 85) {
      reasons.push('Highly recommended based on overall score');
    }

    return reasons;
  }
}