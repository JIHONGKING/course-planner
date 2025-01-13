// __tests__/lib/optimizedGraduationValidator.test.ts

import { OptimizedGraduationValidator } from '@/lib/optimizedGraduationValidator';
import type { Course, AcademicPlan } from '@/types/course';
import type { GraduationRequirement } from '@/types/graduation';

describe('OptimizedGraduationValidator', () => {
  let validator: OptimizedGraduationValidator;
  let plan: AcademicPlan;
  let requirements: GraduationRequirement;
  let courses: Course[];

  const createCourse = (
    id: string,
    code: string,
    department: string,
    credits: number,
    gradeA: string = '80.0'
  ): Course => ({
    id,
    code,
    name: `Test Course ${code}`,
    description: 'Test description',
    credits,
    department,
    level: code.match(/\d+/)?.[0]?.substring(0, 1) + '00' || '300',
    prerequisites: [],
    term: ['Fall', 'Spring'],
    courseSchedules: [],
    gradeDistribution: JSON.stringify({
      A: gradeA,
      AB: '10.0',
      B: '10.0',
      BC: '0.0',
      C: '0.0',
      D: '0.0',
      F: '0.0'
    })
  });

  beforeEach(() => {
    requirements = {
      id: 'test-req',
      name: 'Test Requirements',
      totalCredits: 120,
      requiredCredits: 120,
      minimumGPA: 2.0,
      requiredGPA: 2.0,
      distribution: {
        'COMP SCI': 40,
        'MATH': 15
      },
      coreCourses: []
    };

    courses = [
      createCourse('cs1', 'COMP SCI 300', 'COMP SCI', 3, '90.0'),
      createCourse('cs2', 'COMP SCI 400', 'COMP SCI', 3, '85.0'),
      createCourse('math1', 'MATH 222', 'MATH', 4, '80.0')
    ];

    plan = {
      id: 'test-plan',
      userId: 'test-user',
      years: [
        {
          id: 'year-1',
          name: 'Junior',
          yearName: 'Junior Year',
          year: '2023-2024',
          startYear: 2023,
          semesters: [
            {
              id: 'fall-2023',
              term: 'Fall',
              year: 2023,
              academicYearId: 'year-1',
              courses: courses
            }
          ]
        }
      ],
      savedCourses: []
    };

    validator = OptimizedGraduationValidator.getInstance(plan, requirements, courses);
  });

  describe('Caching Behavior', () => {
    it('should cache validation results', () => {
      // 첫 번째 검증 실행
      const firstResults = validator.validateAll();
      const firstStats = validator.getCacheStats();
      expect(firstStats.itemCount).toBeGreaterThan(0);

      // 두 번째 검증 실행 (캐시 사용)
      const secondResults = validator.validateAll();
      expect(secondResults).toEqual(firstResults);
    });

    it('should invalidate cache when clearing', () => {
      validator.validateAll();
      const beforeClear = validator.getCacheStats();
      expect(beforeClear.itemCount).toBeGreaterThan(0);

      validator.clearCache();
      const afterClear = validator.getCacheStats();
      expect(afterClear.itemCount).toBe(0);
    });

    it('should maintain cache size limit', () => {
      // 캐시 크기 제한 테스트를 위한 대량의 검증 수행
      for (let i = 0; i < 2000; i++) {
        validator = OptimizedGraduationValidator.getInstance(
          { ...plan, id: `plan-${i}` },
          requirements,
          courses
        );
        validator.validateAll();
      }

      const stats = validator.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });
  });

  describe('Performance Optimization', () => {
    it('should calculate department credits once', () => {
      const startTime = performance.now();
      
      // 여러 번의 검증 수행
      for (let i = 0; i < 100; i++) {
        validator.validateAll();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 캐시를 사용하지 않는 경우와 비교하여 성능 향상 검증
      validator.clearCache();
      const startTimeNoCache = performance.now();
      
      // 캐시 없이 여러 번의 검증 수행
      for (let i = 0; i < 100; i++) {
        validator = new OptimizedGraduationValidator(plan, requirements, courses);
        validator.validateAll();
      }

      const endTimeNoCache = performance.now();
      const durationNoCache = endTimeNoCache - startTimeNoCache;

      // 캐시를 사용한 경우가 최소 2배 이상 빠른지 확인
      expect(duration * 2).toBeLessThan(durationNoCache);
    });

    it('should optimize GPA calculations', () => {
      const largeNumberOfCourses = Array.from({ length: 100 }, (_, i) => 
        createCourse(
          `course-${i}`,
          `COMP SCI ${300 + i}`,
          'COMP SCI',
          3,
          (80 + Math.random() * 20).toFixed(1)
        )
      );

      const largePlan = {
        ...plan,
        years: [{
          ...plan.years[0],
          semesters: [{
            ...plan.years[0].semesters[0],
            courses: largeNumberOfCourses
          }]
        }]
      };

      const startTime = performance.now();
      validator = OptimizedGraduationValidator.getInstance(largePlan, requirements, largeNumberOfCourses);
      const results = validator.validateAll();
      const endTime = performance.now();

      // GPA 계산이 1초 이내에 완료되어야 함
      expect(endTime - startTime).toBeLessThan(1000);
      expect(results.find(r => r.type === 'gpa')).toBeDefined();
    });
  });

  describe('Validation Accuracy', () => {
    it('should correctly validate total credits', () => {
      const results = validator.validateAll();
      const credits = results.find(r => r.type === 'credits');

      expect(credits).toBeDefined();
      expect(credits?.current).toBe(10); // 3 + 3 + 4 credits
      expect(credits?.required).toBe(120);
      expect(credits?.satisfied).toBe(false);
    });

    it('should correctly calculate GPA with precalculated values', () => {
      const results = validator.validateAll();
      const gpa = results.find(r => r.type === 'gpa');

      // 예상 GPA: ((90 * 3) + (85 * 3) + (80 * 4)) / (3 + 3 + 4) = 84.5
      // 4.0 스케일로 변환: 84.5/100 * 4.0 = 3.38
      expect(gpa?.current).toBeCloseTo(3.38, 2);
      expect(gpa?.satisfied).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid grade distributions', () => {
      const invalidCourse = {
        ...courses[0],
        gradeDistribution: 'invalid-json'
      };

      const planWithInvalidCourse = {
        ...plan,
        years: [{
          ...plan.years[0],
          semesters: [{
            ...plan.years[0].semesters[0],
            courses: [invalidCourse]
          }]
        }]
      };

      validator = OptimizedGraduationValidator.getInstance(planWithInvalidCourse, requirements, [invalidCourse]);
      const results = validator.validateAll();
      const gpa = results.find(r => r.type === 'gpa');

      expect(gpa?.current).toBe(0);
      expect(gpa?.satisfied).toBe(false);
    });

    it('should handle empty course lists', () => {
      const emptyPlan = {
        ...plan,
        years: [{
          ...plan.years[0],
          semesters: [{
            ...plan.years[0].semesters[0],
            courses: []
          }]
        }]
      };

      validator = OptimizedGraduationValidator.getInstance(emptyPlan, requirements, []);
      const results = validator.validateAll();
      
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'credits',
            current: 0,
            satisfied: false
          }),
          expect.objectContaining({
            type: 'gpa',
            current: 0,
            satisfied: false
          })
        ])
      );
    });
  });

  describe('Thread Safety', () => {
    it('should maintain data consistency with concurrent validations', async () => {
      const validations = Array.from({ length: 10 }, async () => {
        const results = validator.validateAll();
        return results.find(r => r.type === 'credits')?.current;
      });

      const results = await Promise.all(validations);
      const allSame = results.every(r => r === results[0]);
      expect(allSame).toBe(true);
    });
  });
});optimizedGraduationValidator