// src/lib/graduationValidator.ts
import type { Course, AcademicPlan } from '@/types/course';
import type { GraduationRequirements, RequirementValidationResult } from '@/types/graduation';
import { getGradeA } from '@/utils/gradeUtils';

export class GraduationValidator {
  constructor(
    private plan: AcademicPlan,
    private requirements: GraduationRequirements,
    private allCourses: Course[]
  ) {}

  validateAll(): RequirementValidationResult[] {
    return [
      this.validateTotalCredits(),
      this.validateCoreCourses(),
      this.validateGPA(),
      this.validateDistribution()
    ];
  }

  private validateTotalCredits(): RequirementValidationResult {
    const totalCredits = this.calculateTotalCredits();
    const required = this.requirements.totalCredits;

    return {
      type: 'credits',
      satisfied: totalCredits >= required,
      current: totalCredits,
      required,
      details: {
        message: `총 ${totalCredits}/${required} 학점 이수`,
        items: [
          {
            name: '총 이수 학점',
            satisfied: totalCredits >= required,
            current: totalCredits,
            required
          }
        ]
      }
    };
  }

  private validateCoreCourses(): RequirementValidationResult {
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

    const satisfied = coreResults.every(result => result.satisfied);

    return {
      type: 'core',
      satisfied,
      current: coreResults.filter(r => r.satisfied).length,
      required: this.requirements.coreCourses.length,
      details: {
        message: '필수 과목 이수 현황',
        items: coreResults
      }
    };
  }

  private validateGPA(): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const gpa = this.calculateGPA(completedCourses);
    const required = this.requirements.minimumGPA;

    return {
      type: 'gpa',
      satisfied: gpa >= required,
      current: gpa,
      required,
      details: {
        message: `GPA: ${gpa.toFixed(2)}/${required.toFixed(2)}`,
        items: [
          {
            name: '전체 GPA',
            satisfied: gpa >= required,
            current: gpa,
            required
          }
        ]
      }
    };
  }

  private validateDistribution(): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const requirements = this.requirements.distribution;
    
    const results = Object.entries(requirements).map(([category, required]) => {
      const current = completedCourses.reduce((sum, course) => {
        return sum + (course.department === category ? course.credits : 0);
      }, 0);

      return {
        name: category,
        satisfied: current >= required,
        current,
        required
      };
    });

    return {
      type: 'distribution',
      satisfied: results.every(r => r.satisfied),
      current: results.filter(r => r.satisfied).length,
      required: results.length,
      details: {
        message: '영역별 이수 현황',
        items: results
      }
    };
  }

  private calculateTotalCredits(): number {
    return this.getCompletedCourses().reduce((sum, course) => sum + course.credits, 0);
  }

  private calculateGPA(courses: Course[]): number {
    if (courses.length === 0) return 0;

    const totalPoints = courses.reduce((sum, course) => {
      const gradeA = parseFloat(getGradeA(course.gradeDistribution));
      return sum + (gradeA * course.credits);
    }, 0);

    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    return totalPoints / totalCredits;
  }

  private getCompletedCourses(): Course[] {
    return this.plan.years.flatMap(year =>
      year.semesters.flatMap(semester =>
        semester.courses
      )
    );
  }
}