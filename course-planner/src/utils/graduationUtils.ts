import type { Course, AcademicPlan } from '@/types/course';
import type {
  RequirementType,
  GraduationRequirement,
  RequirementValidationResult,
  RequirementItem,
  BreadthRequirement,
  MajorRequirement,
  LevelRequirement,
  GPARequirement,
  CoreCourse,
  CourseRequirement
} from '@/types/graduation';
import { getGradeA } from '@/utils/gradeUtils';

export class GraduationValidator {
  constructor(
    private plan: AcademicPlan,
    private requirements: GraduationRequirement,
    private allCourses: Course[]
  ) {}

  validateAll(): RequirementValidationResult[] {
    const baseResults: RequirementValidationResult[] = [
      this.validateCreditRequirement(),
      this.validateCoreRequirement(),
      this.validateGPARequirement()
    ];

    // Handle additional requirements if they exist
    const additionalResults = (this.requirements.requirements || [])
      .map((req) => {
        switch (req.type) {
          case 'credits':
            return this.validateCreditRequirement(req);
          case 'core':
            return this.validateCoreRequirement(req);
          case 'breadth':
            return this.validateBreadthRequirement(req);
          case 'major':
            return this.validateMajorRequirement(req);
          case 'level':
            return this.validateLevelRequirement(req);
          case 'gpa':
            return this.validateGPARequirement(req);
          default:
            return null;
        }
      })
      .filter((result): result is RequirementValidationResult => result !== null);

    return [...baseResults, ...additionalResults];
  }

  protected validateCreditRequirement(requirement?: RequirementType & { type: 'credits' }): RequirementValidationResult {
    const totalCredits = this.calculateTotalCredits();
    const categories = this.categorizeCourses();

    const categoryValidation = Object.entries(requirement?.minimumPerCategory || this.requirements.distribution).map(([category, required]) => ({
      name: category,
      satisfied: (categories[category] || 0) >= Number(required),
      current: categories[category] || 0,
      required: Number(required)
    }));

    return {
      type: 'credits',
      satisfied: totalCredits >= (requirement?.totalCredits || 0),
      current: totalCredits,
      required: requirement?.totalCredits || 0,
      details: {
        message: `총 학점 이수 현황`,
        items: categoryValidation
      }
    };
  }

  protected validateCoreRequirement(requirement?: RequirementType & { type: 'core' }): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const coreResults = (requirement?.courses || this.requirements.coreCourses).map(course => ({
      name: 'code' in course ? course.code : course.name,
      satisfied: this.isCourseCompleted('code' in course ? course.code : course.id, completedCourses),
      current: this.isCourseCompleted('code' in course ? course.code : course.id, completedCourses) ? 1 : 0,
      required: 1
    }));

    return {
      type: 'core',
      satisfied: coreResults.every(r => r.satisfied),
      current: coreResults.filter(r => r.satisfied).length,
      required: coreResults.length,
      details: {
        message: '필수 과목 이수 현황',
        items: coreResults
      }
    };
  }

  protected validateBreadthRequirement(requirement: BreadthRequirement): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const validations = requirement.categories.map(category => {
      const completedCredits = completedCourses
        .filter(course => category.courses.includes(course.code))
        .reduce((sum, course) => sum + course.credits, 0);

      return {
        name: category.name,
        satisfied: completedCredits >= category.requiredCredits,
        current: completedCredits,
        required: category.requiredCredits
      };
    });

    return {
      type: 'breadth',
      satisfied: validations.filter(v => v.satisfied).length >= (requirement.minimumCategories || validations.length),
      current: validations.filter(v => v.satisfied).length,
      required: requirement.minimumCategories || validations.length,
      details: {
        message: '영역별 이수 요건',
        items: validations
      }
    };
  }

  protected validateMajorRequirement(requirement: MajorRequirement): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const requiredValidations = requirement.requiredCourses.map(course => ({
      name: course.name,
      satisfied: completedCourses.some(c => c.code === course.id),
      current: completedCourses.some(c => c.code === course.id) ? 1 : 0,
      required: 1
    }));

    const electiveCredits = completedCourses
      .filter(course => requirement.electiveCourses.includes(course.code))
      .reduce((sum, course) => sum + course.credits, 0);

    return {
      type: 'major',
      satisfied: requiredValidations.every(v => v.satisfied) && electiveCredits >= requirement.electiveCredits,
      current: electiveCredits,
      required: requirement.electiveCredits,
      details: {
        message: '전공 이수 요건',
        items: [
          ...requiredValidations,
          {
            name: '선택과목',
            satisfied: electiveCredits >= requirement.electiveCredits,
            current: electiveCredits,
            required: requirement.electiveCredits
          }
        ]
      }
    };
  }

  protected validateLevelRequirement(requirement: LevelRequirement): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const upperLevelCredits = completedCourses
      .filter(course => parseInt(course.level) >= 300)
      .reduce((sum, course) => sum + course.credits, 0);

    const levelValidations = Object.entries(requirement.levels).map(([level, required]) => ({
      name: `${level} 레벨`,
      satisfied: this.getLevelCredits(level, completedCourses) >= required,
      current: this.getLevelCredits(level, completedCourses),
      required
    }));

    return {
      type: 'level',
      satisfied: upperLevelCredits >= requirement.minimumUpperLevel && levelValidations.every(v => v.satisfied),
      current: upperLevelCredits,
      required: requirement.minimumUpperLevel,
      details: {
        message: '과목 레벨 요건',
        items: levelValidations
      }
    };
  }

  protected validateGPARequirement(requirement?: RequirementType & { type: 'gpa' }): RequirementValidationResult {
    const gpa = this.calculateGPA(this.getCompletedCourses());
    return {
      type: 'gpa',
      satisfied: gpa >= (requirement?.minimumGPA || this.requirements.minimumGPA),
      current: Math.floor(gpa * 100),
      required: Math.floor((requirement?.minimumGPA || this.requirements.minimumGPA) * 100),
      details: {
        message: `GPA 요건`,
        items: [{
          name: 'Overall GPA',
          satisfied: gpa >= (requirement?.minimumGPA || this.requirements.minimumGPA),
          current: Math.floor(gpa * 100),
          required: Math.floor((requirement?.minimumGPA || this.requirements.minimumGPA) * 100)
        }]
      }
    };
  }

  private calculateTotalCredits(): number {
    return this.getCompletedCourses().reduce((sum, course) => sum + course.credits, 0);
  }

  private getCompletedCourses(): Course[] {
    return this.plan.years.flatMap(year =>
      year.semesters.flatMap(semester => semester.courses)
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

  private categorizeCourses(): Record<string, number> {
    return this.getCompletedCourses().reduce((acc, course) => {
      acc[course.department] = (acc[course.department] || 0) + course.credits;
      return acc;
    }, {} as Record<string, number>);
  }

  private getLevelCredits(level: string, courses: Course[]): number {
    return courses
      .filter(course => course.level === level)
      .reduce((sum, course) => sum + course.credits, 0);
  }

  private isCourseCompleted(courseId: string, completedCourses: Course[]): boolean {
    return completedCourses.some(course => course.code === courseId);
  }
}