// __tests__/lib/prerequisiteValidation.test.ts

import { GraduationValidator } from '@/lib/graduationValidator';
import type { Course, AcademicPlan, Prerequisite } from '@/types/course';
import type { GraduationRequirement } from '@/types/graduation';

describe('Prerequisite Validation', () => {
  let validator: GraduationValidator;
  let requirements: GraduationRequirement;

  // 테스트 헬퍼 함수들
  const createPrerequisite = (courseId: string, type: 'required' | 'concurrent' | 'recommended' = 'required'): Prerequisite => ({
    courseId,
    type,
    grade: undefined
  });

  const createCourse = (
    id: string,
    code: string,
    prerequisites: Prerequisite[] = []
  ): Course => ({
    id,
    code,
    name: `Test Course ${code}`,
    description: 'Test description',
    credits: 3,
    department: 'COMP SCI',
    level: '300',
    prerequisites,
    term: ['Fall', 'Spring'],
    courseSchedules: [],
    gradeDistribution: JSON.stringify({ A: '80.0', AB: '10.0', B: '10.0' })
  });

  beforeEach(() => {
    // 기본 졸업 요건 설정
    requirements = {
      id: 'test-req',
      name: 'Test Requirements',
      totalCredits: 120,
      requiredCredits: 120,
      minimumGPA: 2.0,
      requiredGPA: 2.0,
      distribution: { 'COMP SCI': 40 },
      coreCourses: []
    };
  });

  // 연쇄적 선수과목 테스트
  describe('Chain Prerequisites', () => {
    it('should validate chain of prerequisites (A → B → C)', () => {
      // 과목 설정
      const courseA = createCourse('cs101', 'COMP SCI 101');
      const courseB = createCourse('cs201', 'COMP SCI 201', [
        createPrerequisite('COMP SCI 101')
      ]);
      const courseC = createCourse('cs301', 'COMP SCI 301', [
        createPrerequisite('COMP SCI 201')
      ]);

      // 테스트 학업 계획 생성
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
                courses: [courseA]
              },
              {
                id: 'spring-2024',
                term: 'Spring',
                year: 2024,
                academicYearId: 'year-1',
                courses: [courseB]
              }
            ]
          }
        ],
        savedCourses: []
      };

      // requirements에 테스트 과목들을 추가
      requirements.coreCourses = [
        { code: courseA.code, name: courseA.name, required: true },
        { code: courseB.code, name: courseB.name, required: true },
        { code: courseC.code, name: courseC.name, required: true }
      ];

      // 검증 실행
      validator = new GraduationValidator(plan, requirements, [courseA, courseB, courseC]);
      const validationResults = validator.validateAll();
      const coreRequirements = validationResults.find(r => r.type === 'core');
      
      // 검증
      expect(coreRequirements).toBeDefined();
      expect(coreRequirements?.details.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'COMP SCI 101',
            satisfied: true
          }),
          expect.objectContaining({
            name: 'COMP SCI 201',
            satisfied: true
          }),
          expect.objectContaining({
            name: 'COMP SCI 301',
            satisfied: false  // 아직 수강하지 않음
          })
        ])
      );
    });
  });

  // 복수 선수과목 테스트
  describe('Multiple Prerequisites', () => {
    it('should validate courses with multiple prerequisites', () => {
      // 테스트 과목 생성
      const mathCourse = createCourse('math101', 'MATH 101');
      const csCourse = createCourse('cs101', 'COMP SCI 101');
      const advancedCourse = createCourse('cs401', 'COMP SCI 401', [
        createPrerequisite('MATH 101'),
        createPrerequisite('COMP SCI 101')
      ]);

      // 테스트 계획 생성
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
                courses: [mathCourse, csCourse]
              }
            ]
          }
        ],
        savedCourses: []
      };

      // requirements 설정
      requirements.coreCourses = [
        { code: mathCourse.code, name: mathCourse.name, required: true },
        { code: csCourse.code, name: csCourse.name, required: true },
        { code: advancedCourse.code, name: advancedCourse.name, required: true }
      ];

      // 검증
      validator = new GraduationValidator(plan, requirements, [mathCourse, csCourse, advancedCourse]);
      const validationResults = validator.validateAll();
      const coreRequirements = validationResults.find(r => r.type === 'core');

      expect(coreRequirements).toBeDefined();
      expect(coreRequirements?.details.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'MATH 101',
            satisfied: true
          }),
          expect.objectContaining({
            name: 'COMP SCI 101',
            satisfied: true
          }),
          expect.objectContaining({
            name: 'COMP SCI 401',
            satisfied: false
          })
        ])
      );
    });
  });
});