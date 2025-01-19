// __tests__/lib/advancedGraduationValidator.test.ts

import { GraduationValidator } from '@/utils/graduationUtils';
import type { Course, AcademicPlan, Prerequisite } from '@/types/course';
import type { GraduationRequirement } from '@/types/graduation';

describe('Advanced Graduation Validation', () => {
  let validator: GraduationValidator;
  let requirements: GraduationRequirement;

  // 테스트 헬퍼 함수들
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
    gradeDistribution: JSON.stringify({ A: gradeA, AB: '10.0', B: '10.0' })
  });

  beforeEach(() => {
    requirements = {
      id: 'cs-major-2024',
      name: 'Computer Science Major Requirements',
      totalCredits: 120,
      requiredCredits: 120,
      minimumGPA: 2.0,
      requiredGPA: 2.0,
      distribution: {
        'COMP SCI': 40,
        'MATH': 15,
        'STAT': 9,
        'Communications': 6,
        'Science': 12
      },
      coreCourses: []
    };
  });

  describe('Complex Distribution Requirements', () => {
    it('should validate mixed department credit requirements', () => {
      // 다양한 학과의 과목들 생성
      const courses = [
        createCourse('cs1', 'COMP SCI 300', 'COMP SCI', 3),
        createCourse('cs2', 'COMP SCI 400', 'COMP SCI', 3),
        createCourse('math1', 'MATH 222', 'MATH', 4),
        createCourse('math2', 'MATH 234', 'MATH', 4),
        createCourse('stat1', 'STAT 324', 'STAT', 3),
        createCourse('comm1', 'COMM 101', 'Communications', 3),
        createCourse('phys1', 'PHYSICS 201', 'Science', 4)
      ];

      const plan: AcademicPlan = {
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
                courses: [courses[0], courses[2], courses[4]]
              },
              {
                id: 'spring-2024',
                term: 'Spring',
                year: 2024,
                academicYearId: 'year-1',
                courses: [courses[1], courses[3], courses[5], courses[6]]
              }
            ]
          }
        ],
        savedCourses: []
      };

      validator = new GraduationValidator(plan, requirements, courses);
      const results = validator.validateAll();
      const distribution = results.find(r => r.type === 'distribution');

      expect(distribution).toBeDefined();
      expect(distribution?.details.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'COMP SCI',
            current: 6,  // 3 + 3 credits
            required: 40,
            satisfied: false
          }),
          expect.objectContaining({
            name: 'MATH',
            current: 8,  // 4 + 4 credits
            required: 15,
            satisfied: false
          }),
          expect.objectContaining({
            name: 'STAT',
            current: 3,
            required: 9,
            satisfied: false
          }),
          expect.objectContaining({
            name: 'Communications',
            current: 3,
            required: 6,
            satisfied: false
          }),
          expect.objectContaining({
            name: 'Science',
            current: 4,
            required: 12,
            satisfied: false
          })
        ])
      );
    });
  });

  describe('GPA Requirements by Department', () => {
    it('should calculate department-specific GPA correctly', () => {
      const courses = [
        createCourse('cs1', 'COMP SCI 300', 'COMP SCI', 3, '90.0'),  // 3.6 GPA
        createCourse('cs2', 'COMP SCI 400', 'COMP SCI', 3, '85.0'),  // 3.4 GPA
        createCourse('math1', 'MATH 222', 'MATH', 4, '80.0'),        // 3.2 GPA
        createCourse('math2', 'MATH 234', 'MATH', 4, '75.0')         // 3.0 GPA
      ];

      const plan: AcademicPlan = {
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

      validator = new GraduationValidator(plan, requirements, courses);
      const results = validator.validateAll();
      const gpa = results.find(r => r.type === 'gpa');

      expect(gpa).toBeDefined();
      expect(gpa?.current).toBeCloseTo(3.3, 1);  // Overall GPA
      expect(gpa?.satisfied).toBe(true);

      // TODO: Add department-specific GPA calculations when implemented
    });
  });

  describe('Edge Cases', () => {
    it('should handle courses with zero credits', () => {
      const zeroCreditCourse = createCourse('seminar1', 'COMP SCI 1', 'COMP SCI', 0);
      const plan: AcademicPlan = {
        id: 'test-plan',
        userId: 'test-user',
        years: [
          {
            id: 'year-1',
            name: 'Freshman',
            yearName: 'First Year',
            year: '2023-2024',
            startYear: 2023,
            semesters: [
              {
                id: 'fall-2023',
                term: 'Fall',
                year: 2023,
                academicYearId: 'year-1',
                courses: [zeroCreditCourse]
              }
            ]
          }
        ],
        savedCourses: []
      };

      validator = new GraduationValidator(plan, requirements, [zeroCreditCourse]);
      const results = validator.validateAll();
      const credits = results.find(r => r.type === 'credits');

      expect(credits?.current).toBe(0);
      expect(credits?.satisfied).toBe(false);
    });

    it('should handle invalid grade distributions', () => {
      const invalidGradeCourse = {
        ...createCourse('cs1', 'COMP SCI 300', 'COMP SCI', 3),
        gradeDistribution: 'invalid-json'
      };

      const plan: AcademicPlan = {
        id: 'test-plan',
        userId: 'test-user',
        years: [
          {
            id: 'year-1',
            name: 'Freshman',
            yearName: 'First Year',
            year: '2023-2024',
            startYear: 2023,
            semesters: [
              {
                id: 'fall-2023',
                term: 'Fall',
                year: 2023,
                academicYearId: 'year-1',
                courses: [invalidGradeCourse]
              }
            ]
          }
        ],
        savedCourses: []
      };

      validator = new GraduationValidator(plan, requirements, [invalidGradeCourse]);
      const results = validator.validateAll();
      const gpa = results.find(r => r.type === 'gpa');

      expect(gpa?.current).toBe(0);
      expect(gpa?.satisfied).toBe(false);
    });
  });
});