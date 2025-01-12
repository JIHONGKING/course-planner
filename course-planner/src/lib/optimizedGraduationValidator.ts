// src/lib/optimizedGraduationValidator.ts

// src/lib/optimizedGraduationValidator.ts

import type { Course, AcademicPlan } from '@/types/course';
import type { 
  GraduationRequirement, 
  RequirementValidationResult 
} from '@/types/graduation';
import { getGradeA } from '@/utils/gradeUtils';

interface CacheKey {
  planId: string;
  requirementId: string;
  type: string;
}

interface ValidationCache {
  key: CacheKey;
  result: RequirementValidationResult;
  timestamp: number;
}

export class OptimizedGraduationValidator {
  private static cacheTimeout = 5 * 60 * 1000; // 5분
  private static cache: Map<string, ValidationCache> = new Map();
  private calculatedGPAs: Map<string, number> = new Map();
  private departmentCredits: Map<string, number> = new Map();

  constructor(
    private plan: AcademicPlan,
    private primaryRequirements: GraduationRequirement,
    private allCourses: Course[],
    private secondaryRequirements?: GraduationRequirement
  ) {
    // 초기화 시 자주 사용되는 계산 결과 캐싱
    this.precalculateCommonValues();
  }

  private precalculateCommonValues(): void {
    const completedCourses = this.getCompletedCourses();
    
    // 학과별 이수 학점 미리 계산
    completedCourses.forEach(course => {
      const current = this.departmentCredits.get(course.department) || 0;
      this.departmentCredits.set(course.department, current + course.credits);
    });

    // 학과별 GPA 미리 계산
    const departments = new Set(completedCourses.map(c => c.department));
    departments.forEach(dept => {
      const deptCourses = completedCourses.filter(c => c.department === dept);
      const gpa = this.calculateGPA(deptCourses);
      this.calculatedGPAs.set(dept, gpa);
    });
  }

  private getCacheKey(type: string, requirementId: string): string {
    return `${this.plan.id}:${requirementId}:${type}`;
  }

  private getFromCache(type: string, requirementId: string): RequirementValidationResult | null {
    const key = this.getCacheKey(type, requirementId);
    const cached = OptimizedGraduationValidator.cache.get(key);

    if (!cached) return null;

    // 캐시 만료 확인
    if (Date.now() - cached.timestamp > OptimizedGraduationValidator.cacheTimeout) {
      OptimizedGraduationValidator.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  private saveToCache(type: string, requirementId: string, result: RequirementValidationResult): void {
    const key = this.getCacheKey(type, requirementId);
    OptimizedGraduationValidator.cache.set(key, {
      key: { planId: this.plan.id, requirementId, type },
      result,
      timestamp: Date.now()
    });
  }

  validateAll(): RequirementValidationResult[] {
    const primaryResults = this.validatePrimaryRequirements();
    if (!this.secondaryRequirements) return primaryResults;

    const secondaryResults = this.validateSecondaryRequirements();
    return [...primaryResults, ...secondaryResults];
  }

  private validatePrimaryRequirements(): RequirementValidationResult[] {
    return [
      this.validateTotalCredits(this.primaryRequirements),
      this.validateCoreCourses(this.primaryRequirements),
      this.validateGPA(this.primaryRequirements),
      this.validateDistribution(this.primaryRequirements)
    ];
  }

  private validateSecondaryRequirements(): RequirementValidationResult[] {
    if (!this.secondaryRequirements) return [];

    return [
      this.validateTotalCredits(this.secondaryRequirements),
      this.validateCoreCourses(this.secondaryRequirements),
      this.validateGPA(this.secondaryRequirements),
      this.validateDistribution(this.secondaryRequirements)
    ];
  }

  private validateTotalCredits(requirements: GraduationRequirement): RequirementValidationResult {
    const cacheKey = this.getCacheKey('credits', requirements.id);
    const cached = this.getFromCache('credits', requirements.id);
    if (cached) return cached;

    // 캐시된 학과별 학점 사용하여 계산
    const totalCredits = Array.from(this.departmentCredits.entries())
      .filter(([dept]) => requirements.distribution[dept])
      .reduce((sum, [_, credits]) => sum + credits, 0);

    const result: RequirementValidationResult = {
      type: 'credits',
      satisfied: totalCredits >= requirements.requiredCredits,
      current: totalCredits,
      required: requirements.requiredCredits,
      details: {
        message: `총 ${totalCredits}/${requirements.requiredCredits} 학점 이수`,
        items: [
          {
            name: '총 이수 학점',
            satisfied: totalCredits >= requirements.requiredCredits,
            current: totalCredits,
            required: requirements.requiredCredits
          }
        ]
      }
    };

    this.saveToCache('credits', requirements.id, result);
    return result;
  }

  private validateGPA(requirements: GraduationRequirement): RequirementValidationResult {
    const cacheKey = this.getCacheKey('gpa', requirements.id);
    const cached = this.getFromCache('gpa', requirements.id);
    if (cached) return cached;

    // 캐시된 학과별 GPA 사용
    const relevantDepartments = Object.keys(requirements.distribution);
    let totalPoints = 0;
    let totalCredits = 0;

    relevantDepartments.forEach(dept => {
      const credits = this.departmentCredits.get(dept) || 0;
      const gpa = this.calculatedGPAs.get(dept) || 0;
      totalPoints += gpa * credits;
      totalCredits += credits;
    });

    const overallGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

    const result: RequirementValidationResult = {
      type: 'gpa',
      satisfied: overallGPA >= requirements.minimumGPA,
      current: overallGPA,
      required: requirements.minimumGPA,
      details: {
        message: `GPA: ${overallGPA.toFixed(2)}/${requirements.minimumGPA.toFixed(2)}`,
        items: [
          {
            name: 'Overall GPA',
            satisfied: overallGPA >= requirements.minimumGPA,
            current: overallGPA,
            required: requirements.minimumGPA
          }
        ]
      }
    };

    this.saveToCache('gpa', requirements.id, result);
    return result;
  }

  private validateCoreCourses(requirements: GraduationRequirement): RequirementValidationResult {
    const cached = this.getFromCache('core', requirements.id);
    if (cached) return cached;

    const completedCourses = this.getCompletedCourses();
    const coreResults = requirements.coreCourses.map(req => {
      const completed = completedCourses.some(course => course.code === req.code);
      return {
        name: req.code,
        satisfied: completed,
        current: completed ? 1 : 0,
        required: 1
      };
    });

    const result: RequirementValidationResult = {
      type: 'core',
      satisfied: coreResults.every(r => r.satisfied),
      current: coreResults.filter(r => r.satisfied).length,
      required: requirements.coreCourses.length,
      details: {
        message: '필수 과목 이수 현황',
        items: coreResults
      }
    };

    this.saveToCache('core', requirements.id, result);
    return result;
  }

  private validateDistribution(requirements: GraduationRequirement): RequirementValidationResult {
    const cached = this.getFromCache('distribution', requirements.id);
    if (cached) return cached;

    const results = Object.entries(requirements.distribution).map(([category, required]) => {
      const current = this.departmentCredits.get(category) || 0;
      return {
        name: category,
        satisfied: current >= (required as number),
        current,
        required: required as number
      };
    });

    const result: RequirementValidationResult = {
      type: 'distribution',
      satisfied: results.every(r => r.satisfied),
      current: results.filter(r => r.satisfied).length,
      required: results.length,
      details: {
        message: '영역별 이수 현황',
        items: results
      }
    };

    this.saveToCache('distribution', requirements.id, result);
    return result;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  private getCompletedCourses(): Course[] {
    return this.plan.years.flatMap(year =>
      year.semesters.flatMap(semester =>
        semester.courses
      )
    );
  }

  private calculateGPA(courses: Course[]): number {
    if (courses.length === 0) return 0;

    const { points, credits } = courses.reduce(
      (acc, course) => {
        const gradeA = parseFloat(getGradeA(course.gradeDistribution));
        const gpaPoints = (gradeA / 100) * 4.0 * course.credits;
        return {
          points: acc.points + gpaPoints,
          credits: acc.credits + course.credits
        };
      },
      { points: 0, credits: 0 }
    );

    return credits > 0 ? points / credits : 0;
  }
}