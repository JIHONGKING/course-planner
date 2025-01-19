// src/utils/graduationUtils.ts

import type { Course, AcademicPlan } from '@/types/course';
import type {
  RequirementType,
  GraduationRequirement,
  RequirementValidationResult,
  CourseRequirement,
  BreadthRequirement,
  MajorRequirement,
  LevelRequirement,
  RequirementItem
} from '@/types/graduation';
import { getGradeA } from '@/utils/gradeUtils';

export class GraduationValidator {
  private completedCourses: Course[];
  private totalCredits: number;
  private categories: Record<string, number>;

  constructor(
    private plan: AcademicPlan,
    private requirements: GraduationRequirement,
    private allCourses: Course[]
  ) {
    this.completedCourses = this.getCompletedCourses();
    this.totalCredits = this.calculateTotalCredits();
    this.categories = this.categorizeCourses();
  }

  validateAll(): RequirementValidationResult[] {
    const baseResults: RequirementValidationResult[] = [
      this.validateCreditRequirement(),
      this.validateCoreRequirement(),
      this.validateGPARequirement(),
      this.validateDistributionRequirement()
    ];

    const additionalResults = (this.requirements.requirements || [])
      .map((req) => this.validateRequirement(req))
      .filter((result): result is RequirementValidationResult => result !== null);

    return [...baseResults, ...additionalResults];
  }

  private validateRequirement(req: RequirementType): RequirementValidationResult | null {
    switch (req.type) {
      case 'credits':
        return this.validateCreditRequirement(req);
      case 'core':
        return this.validateCoreRequirement(req);
      case 'breadth':
        return this.validateBreadthRequirement(req as BreadthRequirement);
      case 'major':
        return this.validateMajorRequirement(req as MajorRequirement);
      case 'level':
        return this.validateLevelRequirement(req as LevelRequirement);
      case 'gpa':
        return this.validateGPARequirement(req);
      default:
        return null;
    }
  }

  private validateCreditRequirement(requirement?: RequirementType & { type: 'credits' }): RequirementValidationResult {
    const requiredCredits = requirement?.totalCredits || this.requirements.totalCredits;
    const categoryItems = Object.entries(this.requirements.distribution).map(
      ([category, required]): RequirementItem => ({
        name: category,
        satisfied: (this.categories[category] || 0) >= required,
        current: this.categories[category] || 0,
        required
      })
    );

    return {
      type: 'credits',
      satisfied: this.totalCredits >= requiredCredits,
      current: this.totalCredits,
      required: requiredCredits,
      details: {
        message: `총 학점 이수 현황`,
        items: categoryItems
      }
    };
  }

  private validateCoreRequirement(requirement?: RequirementType & { type: 'core' }): RequirementValidationResult {
    const validations = (requirement?.courses || this.requirements.coreCourses).map(
      (course): RequirementItem => ({
        name: course.name,
        satisfied: this.completedCourses.some((c) => c.code === course.code),
        current: this.completedCourses.filter((c) => c.code === course.code).length,
        required: 1
      })
    );

    return {
      type: 'core',
      satisfied: validations.every((v) => v.satisfied),
      current: validations.filter((v) => v.satisfied).length,
      required: validations.length,
      details: {
        message: '필수 과목 이수 현황',
        items: validations
      }
    };
  }

  private validateBreadthRequirement(requirement: BreadthRequirement): RequirementValidationResult {
    const validations = requirement.categories.map(
      (category): RequirementItem => {
        const completedCredits = this.completedCourses
          .filter((course) => category.courses.includes(course.code))
          .reduce((sum, course) => sum + course.credits, 0);

        return {
          name: category.name,
          satisfied: completedCredits >= category.requiredCredits,
          current: completedCredits,
          required: category.requiredCredits
        };
      }
    );

    return {
      type: 'breadth',
      satisfied: validations.filter((v) => v.satisfied).length >= (requirement.minimumCategories || validations.length),
      current: validations.filter((v) => v.satisfied).length,
      required: requirement.minimumCategories || validations.length,
      details: {
        message: '영역별 이수 요건',
        items: validations
      }
    };
  }

  private validateMajorRequirement(requirement: MajorRequirement): RequirementValidationResult {
    const requiredValidations = requirement.requiredCourses.map(
      (course): RequirementItem => ({
        name: course.name,
        satisfied: this.completedCourses.some((c) => c.code === course.code),
        current: this.completedCourses.some((c) => c.code === course.code) ? 1 : 0,
        required: 1
      })
    );

    const electiveCredits = this.completedCourses
      .filter((course) => requirement.electiveCourses.includes(course.code))
      .reduce((sum, course) => sum + course.credits, 0);

    const items: RequirementItem[] = [
      ...requiredValidations,
      {
        name: '선택과목 이수학점',
        satisfied: electiveCredits >= requirement.electiveCredits,
        current: electiveCredits,
        required: requirement.electiveCredits
      }
    ];

    return {
      type: 'major',
      satisfied: items.every((item) => item.satisfied),
      current: items.filter((item) => item.satisfied).length,
      required: items.length,
      details: {
        message: '전공 이수 요건',
        items
      }
    };
  }

  private validateLevelRequirement(requirement: LevelRequirement): RequirementValidationResult {
    const levelValidations = Object.entries(requirement.levels).map(
      ([level, required]): RequirementItem => {
        const credits = this.completedCourses
          .filter((course) => course.level === level)
          .reduce((sum, course) => sum + course.credits, 0);

        return {
          name: `${level} 레벨`,
          satisfied: credits >= required,
          current: credits,
          required
        };
      }
    );

    const upperLevelCredits = this.completedCourses
      .filter((course) => parseInt(course.level) >= 300)
      .reduce((sum, course) => sum + course.credits, 0);

    return {
      type: 'level',
      satisfied: upperLevelCredits >= requirement.minimumUpperLevel && levelValidations.every((v) => v.satisfied),
      current: upperLevelCredits,
      required: requirement.minimumUpperLevel,
      details: {
        message: '과목 레벨 요건',
        items: levelValidations
      }
    };
  }

  private validateGPARequirement(requirement?: RequirementType & { type: 'gpa' }): RequirementValidationResult {
    const gpa = this.calculateGPA();
    const requiredGPA = requirement?.minimumGPA || this.requirements.minimumGPA;

    return {
      type: 'gpa',
      satisfied: gpa >= requiredGPA,
      current: Math.floor(gpa * 100),
      required: Math.floor(requiredGPA * 100),
      details: {
        message: `GPA 요건`,
        items: [
          {
            name: '전체 평점',
            satisfied: gpa >= requiredGPA,
            current: Math.floor(gpa * 100),
            required: Math.floor(requiredGPA * 100)
          }
        ]
      }
    };
  }

  private validateDistributionRequirement(): RequirementValidationResult {
    const results = Object.entries(this.requirements.distribution).map(
      ([category, required]): RequirementItem => ({
        name: category,
        satisfied: (this.categories[category] || 0) >= required,
        current: this.categories[category] || 0,
        required
      })
    );

    return {
      type: 'distribution',
      satisfied: results.every((r) => r.satisfied),
      current: results.filter((r) => r.satisfied).length,
      required: results.length,
      details: {
        message: '분포 이수 요건',
        items: results
      }
    };
  }

  private calculateGPA(): number {
    if (this.completedCourses.length === 0) return 0;

    const { points, credits } = this.completedCourses.reduce(
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

  private getCompletedCourses(): Course[] {
    return this.plan.years.flatMap((year) =>
      year.semesters.flatMap((semester) => semester.courses)
    );
  }

  private calculateTotalCredits(): number {
    return this.completedCourses.reduce((sum, course) => sum + course.credits, 0);
  }

  private categorizeCourses(): Record<string, number> {
    return this.completedCourses.reduce((categories, course) => {
      categories[course.department] = (categories[course.department] || 0) + course.credits;
      return categories;
    }, {} as Record<string, number>);
  }
}

export const graduationValidator = new GraduationValidator(
  { id: '', userId: '', years: [], savedCourses: [] },
  {
    id: 'default',
    name: 'Default Requirements',
    totalCredits: 120,
    minimumGPA: 2.0,
    coreCourses: [],
    distribution: {},
    requiredCredits: 120,
    requiredGPA: 2.0,
    requirements: []
  },
  []
);