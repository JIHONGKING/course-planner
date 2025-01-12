// __tests__/lib/doubleMajorValidator.test.ts

import { GraduationValidator } from '@/lib/graduationValidator';
import type { Course, AcademicPlan } from '@/types/course';
import type { GraduationRequirement } from '@/types/graduation';

describe('Double Major and Minor Validation', () => {
  let primaryRequirements: GraduationRequirement;
  let secondaryRequirements: GraduationRequirement;
  
  // 테스트 헬퍼 함수
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
    // CS 전공 요건
    primaryRequirements = {
      id: 'cs-major',
      name: 'Computer Science Major',
      totalCredits: 120,
      requiredCredits: 40,
      minimumGPA: 2.0,
      requiredGPA: 2.0,
      distribution: {
        'COMP SCI': 40,
        'MATH': 15,
        'STAT': 9
      },
      coreCourses: []
    };

    // 수학 전공 요건
    secondaryRequirements = {
      id: 'math-major',
      name: 'Mathematics Major',
      totalCredits: 120,
      requiredCredits: 36,
      minimumGPA: 2.0,
      requiredGPA: 2.0,
      distribution: {
        'MATH': 36,
        'COMP SCI': 6
      },
      coreCourses: []
    };
  });

  describe('Double Major Requirements', () => {
    it('should validate overlapping course requirements', () => {
      const courses = [
        // CS 과목
        createCourse('cs1', 'COMP SCI 300', 'COMP SCI', 3, '90.0'),
        createCourse('cs2', 'COMP SCI 400', 'COMP SCI', 3, '85.0'),
        // 수학 과목
        createCourse('math1', 'MATH 234', 'MATH', 4, '88.0'),
        createCourse('math2', 'MATH 340', 'MATH', 3, '82.0'),
        // 통계 과목
        createCourse('stat1', 'STAT 324', 'STAT', 3, '85.0')
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

      // CS 전공 검증
      const csValidator = new GraduationValidator(plan, primaryRequirements, courses);
      const csResults = csValidator.validateAll();
      
      // 수학 전공 검증
      const mathValidator = new GraduationValidator(plan, secondaryRequirements, courses);
      const mathResults = mathValidator.validateAll();

      // CS 전공 검증
      const csDistribution = csResults.find(r => r.type === 'distribution');
      expect(csDistribution?.details.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'COMP SCI',
            current: 6,
            required: 40,
            satisfied: false
          }),
          expect.objectContaining({
            name: 'MATH',
            current: 7,
            required: 15,
            satisfied: false
          })
        ])
      );

      // 수학 전공 검증
      const mathDistribution = mathResults.find(r => r.type === 'distribution');
      expect(mathDistribution?.details.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'MATH',
            current: 7,
            required: 36,
            satisfied: false
          }),
          expect.objectContaining({
            name: 'COMP SCI',
            current: 6,
            required: 6,
            satisfied: true
          })
        ])
      );
    });

    it('should validate major-specific GPA requirements', () => {
      const courses = [
        createCourse('cs1', 'COMP SCI 300', 'COMP SCI', 3, '90.0'),  // 3.6 GPA
        createCourse('cs2', 'COMP SCI 400', 'COMP SCI', 3, '85.0'),  // 3.4 GPA
        createCourse('math1', 'MATH 234', 'MATH', 4, '95.0'),        // 3.8 GPA
        createCourse('math2', 'MATH 340', 'MATH', 3, '80.0')         // 3.2 GPA
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

      const csValidator = new GraduationValidator(plan, primaryRequirements, courses);
      const mathValidator = new GraduationValidator(plan, secondaryRequirements, courses);

      const csResults = csValidator.validateAll();
      const mathResults = mathValidator.validateAll();

      const csGPA = csResults.find(r => r.type === 'gpa');
      const mathGPA = mathResults.find(r => r.type === 'gpa');

      // CS GPA: (3.6 * 3 + 3.4 * 3) / 6 = 3.5
      expect(csGPA?.current).toBeCloseTo(3.5, 1);
      
      // Math GPA: (3.8 * 4 + 3.2 * 3) / 7 = 3.57
      expect(mathGPA?.current).toBeCloseTo(3.57, 1);
    });
  });

  describe('Credit Overlap Rules', () => {
    it('should apply credit overlap restrictions', () => {
      // 과목이 양쪽 전공에서 모두 인정되는 경우 테스트
      const sharedCourse = createCourse('math1', 'MATH 240', 'MATH', 3, '85.0');
      
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
                courses: [sharedCourse]
              }
            ]
          }
        ],
        savedCourses: []
      };

      const csValidator = new GraduationValidator(plan, primaryRequirements, [sharedCourse]);
      const mathValidator = new GraduationValidator(plan, secondaryRequirements, [sharedCourse]);

      const csResults = csValidator.validateAll();
      const mathResults = mathValidator.validateAll();

      // 양쪽 전공 모두에서 학점이 인정되는지 확인
      expect(csResults.find(r => r.type === 'credits')?.current).toBe(3);
      expect(mathResults.find(r => r.type === 'credits')?.current).toBe(3);
    });
  });
});