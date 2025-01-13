// src/lib/optimizedGraduationValidator.ts

import type { Course, AcademicPlan } from '@/types/course';
import type { 
  GraduationRequirement, 
  RequirementValidationResult,
  RequirementType 
} from '@/types/graduation';
import { getGradeA } from '@/utils/gradeUtils';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface ValidationCache {
  [key: string]: CacheEntry<RequirementValidationResult>;
}

export class OptimizedGraduationValidator {
  private static readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 1000;
  private static instance: OptimizedGraduationValidator;
  private cache: ValidationCache = {};
  private cacheSize = 0;
  private cacheVersion = 1;
  private departmentCredits: Map<string, number> = new Map();
  private calculatedGPAs: Map<string, number> = new Map();

  constructor(
    private plan: AcademicPlan,
    private requirements: GraduationRequirement,
    private allCourses: Course[]
  ) {
    this.initializeCache();
    this.precalculateValues();
  }

  static getInstance(
    plan: AcademicPlan,
    requirements: GraduationRequirement,
    courses: Course[]
  ): OptimizedGraduationValidator {
    if (!OptimizedGraduationValidator.instance) {
      OptimizedGraduationValidator.instance = new OptimizedGraduationValidator(
        plan,
        requirements,
        courses
      );
    }
    return OptimizedGraduationValidator.instance;
  }

  private initializeCache(): void {
    // 캐시 초기화 및 정리
    const now = Date.now();
    Object.entries(this.cache).forEach(([key, entry]) => {
      if (now - entry.timestamp > OptimizedGraduationValidator.CACHE_TIMEOUT || 
          entry.version < this.cacheVersion) {
        delete this.cache[key];
        this.cacheSize--;
      }
    });
  }

  private precalculateValues(): void {
    // 자주 사용되는 값들을 미리 계산
    const completedCourses = this.getCompletedCourses();
    
    // 학과별 이수 학점 계산
    completedCourses.forEach(course => {
      const current = this.departmentCredits.get(course.department) || 0;
      this.departmentCredits.set(course.department, current + course.credits);
    });

    // 학과별 GPA 계산
    const departments = new Set(completedCourses.map(c => c.department));
    departments.forEach(dept => {
      const deptCourses = completedCourses.filter(c => c.department === dept);
      const gpa = this.calculateGPA(deptCourses);
      this.calculatedGPAs.set(dept, gpa);
    });
  }

  private getCacheKey(type: string, requirementId: string): string {
    return `${this.plan.id}:${requirementId}:${type}:${this.cacheVersion}`;
  }

  private getFromCache(type: string, requirementId: string): RequirementValidationResult | null {
    const key = this.getCacheKey(type, requirementId);
    const entry = this.cache[key];

    if (!entry) return null;

    // 캐시 만료 확인
    if (Date.now() - entry.timestamp > OptimizedGraduationValidator.CACHE_TIMEOUT) {
      delete this.cache[key];
      this.cacheSize--;
      return null;
    }

    return entry.data;
  }

  private saveToCache(
    type: string, 
    requirementId: string, 
    result: RequirementValidationResult
  ): void {
    // 캐시 크기 제한 확인
    if (this.cacheSize >= OptimizedGraduationValidator.MAX_CACHE_SIZE) {
      // LRU 방식으로 가장 오래된 항목 제거
      const oldestKey = Object.entries(this.cache)
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      delete this.cache[oldestKey];
      this.cacheSize--;
    }

    const key = this.getCacheKey(type, requirementId);
    this.cache[key] = {
      data: result,
      timestamp: Date.now(),
      version: this.cacheVersion
    };
    this.cacheSize++;
  }

  validateAll(): RequirementValidationResult[] {
    return [
      this.validateTotalCredits(),
      this.validateCoreCourses(),
      this.validateGPA(),
      this.validateDistribution()
    ];
  }

  private validateTotalCredits(): RequirementValidationResult {
    const cached = this.getFromCache('credits', this.requirements.id);
    if (cached) return cached;

    const totalCredits = Array.from(this.departmentCredits.values())
      .reduce((sum, credits) => sum + credits, 0);

    const result: RequirementValidationResult = {
      type: 'credits',
      satisfied: totalCredits >= this.requirements.requiredCredits,
      current: totalCredits,
      required: this.requirements.requiredCredits,
      details: {
        message: `총 ${totalCredits}/${this.requirements.requiredCredits} 학점 이수`,
        items: [
          {
            name: '총 이수 학점',
            satisfied: totalCredits >= this.requirements.requiredCredits,
            current: totalCredits,
            required: this.requirements.requiredCredits
          }
        ]
      }
    };

    this.saveToCache('credits', this.requirements.id, result);
    return result;
  }

  private validateCoreCourses(): RequirementValidationResult {
    const cached = this.getFromCache('core', this.requirements.id);
    if (cached) return cached;

    const completedCourses = this.getCompletedCourses();
    const coreResults = this.requirements.coreCourses.map(req => {
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
      required: this.requirements.coreCourses.length,
      details: {
        message: '필수 과목 이수 현황',
        items: coreResults
      }
    };

    this.saveToCache('core', this.requirements.id, result);
    return result;
  }

  private validateDistribution(): RequirementValidationResult {
    const cached = this.getFromCache('distribution', this.requirements.id);
    if (cached) return cached;

    const results = Object.entries(this.requirements.distribution).map(([category, required]) => {
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

    this.saveToCache('distribution', this.requirements.id, result);
    return result;
  }

  private validateGPA(): RequirementValidationResult {
    const cached = this.getFromCache('gpa', this.requirements.id);
    if (cached) return cached;

    let totalPoints = 0;
    let totalCredits = 0;

    this.departmentCredits.forEach((credits, dept) => {
      const gpa = this.calculatedGPAs.get(dept) || 0;
      totalPoints += gpa * credits;
      totalCredits += credits;
    });

    const overallGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

    const result: RequirementValidationResult = {
      type: 'gpa',
      satisfied: overallGPA >= this.requirements.minimumGPA,
      current: overallGPA,
      required: this.requirements.minimumGPA,
      details: {
        message: `GPA: ${overallGPA.toFixed(2)}/${this.requirements.minimumGPA.toFixed(2)}`,
        items: [
          {
            name: 'Overall GPA',
            satisfied: overallGPA >= this.requirements.minimumGPA,
            current: overallGPA,
            required: this.requirements.minimumGPA
          }
        ]
      }
    };

    this.saveToCache('gpa', this.requirements.id, result);
    return result;
  }

  // 캐시 관리 메서드들
  public invalidateCache(): void {
    this.cache = {};
    this.cacheSize = 0;
    this.cacheVersion++;
  }

  public clearCache(): void {
    this.cache = {};
    this.cacheSize = 0;
  }

  public getCacheStats(): {
    size: number;
    maxSize: number;
    version: number;
    itemCount: number;
  } {
    return {
      size: this.cacheSize,
      maxSize: OptimizedGraduationValidator.MAX_CACHE_SIZE,
      version: this.cacheVersion,
      itemCount: Object.keys(this.cache).length
    };
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