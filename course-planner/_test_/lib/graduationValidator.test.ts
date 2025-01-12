// __tests__/lib/graduationValidator.test.ts

import { GraduationValidator } from '@/lib/graduationValidator';
import type { Course, AcademicPlan, Prerequisite } from '@/types/course';
import type { GraduationRequirement } from '@/types/graduation';

describe('GraduationValidator', () => {
  let validator: GraduationValidator;
  let plan: AcademicPlan;
  let requirements: GraduationRequirement;
  let allCourses: Course[];

  // Mock data setup
  beforeEach(() => {
    requirements = {
      id: 'cs-req-2024',
      name: 'Computer Science BS Requirements',
      totalCredits: 120,
      requiredCredits: 120,  // Added missing required field
      minimumGPA: 2.0,
      requiredGPA: 2.0,
      distribution: {
        'COMP SCI': 40,
        'MATH': 15,
        'STAT': 9,
        'Communications': 6
      },
      coreCourses: [
        { code: 'COMP SCI 300', name: 'Programming II', required: true },
        { code: 'COMP SCI 400', name: 'Programming III', required: true },
        { code: 'MATH 222', name: 'Calculus II', required: true },
        { code: 'COMP SCI 577', name: 'Algorithms', required: true }
      ]
    };

    // Define proper prerequisite type
    const cs300Prerequisite: Prerequisite = {
      courseId: 'COMP SCI 300',
      type: 'required'
    };

    // Sample courses with different grade distributions
    const sampleCourses: Course[] = [
      {
        id: 'cs300',
        code: 'COMP SCI 300',
        name: 'Programming II',
        description: 'Object-oriented programming',
        credits: 3,
        department: 'COMP SCI',
        level: '300',
        prerequisites: [],
        term: ['Fall', 'Spring'],
        courseSchedules: [],
        gradeDistribution: JSON.stringify({ A: '85.0', AB: '10.0', B: '5.0' })
      },
      {
        id: 'cs400',
        code: 'COMP SCI 400',
        name: 'Programming III',
        description: 'Advanced programming concepts',
        credits: 3,
        department: 'COMP SCI',
        level: '400',
        prerequisites: [cs300Prerequisite],  // Using properly typed prerequisite
        term: ['Fall', 'Spring'],
        courseSchedules: [],
        gradeDistribution: JSON.stringify({ A: '75.0', AB: '15.0', B: '10.0' })
      }
    ];

    plan = {
      id: 'test-plan',
      userId: 'test-user',
      years: [
        {
          id: 'year-1',
          name: 'Freshman',
          yearName: 'Freshman Year',
          year: '2023-2024',
          startYear: 2023,
          semesters: [
            {
              id: 'fall-2023',
              term: 'Fall',
              year: 2023,
              academicYearId: 'year-1',
              courses: [sampleCourses[0]]
            },
            {
              id: 'spring-2024',
              term: 'Spring',
              year: 2024,
              academicYearId: 'year-1',
              courses: [sampleCourses[1]]
            }
          ]
        }
      ],
      savedCourses: []
    };

    allCourses = sampleCourses;
    validator = new GraduationValidator(plan, requirements, allCourses);
  });

  describe('validateAll', () => {
    it('should return all validation results with correct types', () => {
      const results = validator.validateAll();
      
      expect(results).toHaveLength(4);
      expect(results.map(r => r.type)).toEqual(
        expect.arrayContaining(['credits', 'core', 'gpa', 'distribution'])
      );
    });

    it('should properly validate incomplete requirements', () => {
      const results = validator.validateAll();
      const totalCredits = results.find(r => r.type === 'credits');
      
      expect(totalCredits?.satisfied).toBe(false);
      expect(totalCredits?.current).toBe(6); // 3 + 3 credits
      expect(totalCredits?.required).toBe(120);
    });
  });

  describe('validateTotalCredits', () => {
    it('should correctly calculate total credits', () => {
      const results = validator.validateAll();
      const credits = results.find(r => r.type === 'credits');
      
      expect(credits).toBeDefined();
      expect(credits?.current).toBe(6);
      expect(credits?.required).toBe(120);
      expect(credits?.satisfied).toBe(false);
    });

    it('should handle empty plan', () => {
      const emptyPlan = { ...plan, years: [] };
      const emptyValidator = new GraduationValidator(emptyPlan, requirements, allCourses);
      const results = emptyValidator.validateAll();
      const credits = results.find(r => r.type === 'credits');

      expect(credits?.current).toBe(0);
      expect(credits?.satisfied).toBe(false);
    });
  });

  describe('validateGPA', () => {
    it('should correctly calculate GPA', () => {
      const results = validator.validateAll();
      const gpa = results.find(r => r.type === 'gpa');

      expect(gpa).toBeDefined();
      // GPA calculation: ((85% * 4.0 + 75% * 4.0) / 2) * (3 credits each)
      // = ((3.4 + 3.0) / 2) * 3 = 3.2 * 3 = 9.6 grade points / 3 credits = 3.2 GPA
      expect(gpa?.current).toBeCloseTo(3.2, 1);
      expect(gpa?.satisfied).toBe(true);
    });

    it('should handle courses with invalid grade distribution', () => {
      const invalidCourse: Course = {
        ...allCourses[0],
        gradeDistribution: 'invalid-json'
      };
      
      const invalidPlan = {
        ...plan,
        years: [{
          ...plan.years[0],
          semesters: [{
            ...plan.years[0].semesters[0],
            courses: [invalidCourse]
          }]
        }]
      };

      const invalidValidator = new GraduationValidator(invalidPlan, requirements, allCourses);
      const results = invalidValidator.validateAll();
      const gpa = results.find(r => r.type === 'gpa');

      expect(gpa?.current).toBe(0);
      expect(gpa?.satisfied).toBe(false);
    });
  });

  describe('validateDistribution', () => {
    it('should correctly validate department distribution requirements', () => {
      const results = validator.validateAll();
      const distribution = results.find(r => r.type === 'distribution');
      
      expect(distribution).toBeDefined();
      const compSciItem = distribution?.details.items
        .find(item => item.name === 'COMP SCI');
      
      expect(compSciItem).toBeDefined();
      expect(compSciItem?.current).toBe(6); // Two CS courses, 3 credits each
      expect(compSciItem?.required).toBe(40);
      expect(compSciItem?.satisfied).toBe(false);
    });

    it('should mark distribution as unsatisfied if any category is not met', () => {
      const results = validator.validateAll();
      const distribution = results.find(r => r.type === 'distribution');
      
      expect(distribution?.satisfied).toBe(false);
      expect(distribution?.details.items
        .every(item => item.satisfied)).toBe(false);
    });
  });

  describe('validateCoreCourses', () => {
    it('should correctly identify completed core courses', () => {
      const results = validator.validateAll();
      const core = results.find(r => r.type === 'core');
      
      expect(core).toBeDefined();
      expect(core?.details.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'COMP SCI 300',
            satisfied: true,
            current: 1,
            required: 1
          }),
          expect.objectContaining({
            name: 'COMP SCI 400',
            satisfied: true,
            current: 1,
            required: 1
          })
        ])
      );
    });

    it('should identify missing core courses', () => {
      const results = validator.validateAll();
      const core = results.find(r => r.type === 'core');
      
      const missingCore = core?.details.items
        .find(item => item.name === 'COMP SCI 577');
      
      expect(missingCore).toBeDefined();
      expect(missingCore?.satisfied).toBe(false);
      expect(missingCore?.current).toBe(0);
    });
  });
});