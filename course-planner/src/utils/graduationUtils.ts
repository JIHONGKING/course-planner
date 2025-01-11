// src/utils/graduationUtils.ts

import type { 
  GraduationRequirements, 
  RequirementValidationResult,
  CourseRequirement,
  RequirementType,
  RequirementItem // RequirementItem 추가
} from '@/types/graduation';
import type { Course, AcademicPlan } from '@/types/course';
import { parseGradeDistribution } from '@/utils/gradeUtils';

export class GraduationValidator {
  private plan: AcademicPlan;
  private requirements: GraduationRequirements;
  private allCourses: Map<string, Course>;

  constructor(
    plan: AcademicPlan,
    requirements: GraduationRequirements,
    courses: Course[],
  ) {
    this.plan = plan;
    this.requirements = requirements;
    this.allCourses = new Map(courses.map(course => [course.code, course]));
  }

  validateAll(): RequirementValidationResult[] {
    const baseResults: RequirementValidationResult[] = [
      this.validateCreditRequirement(),
      this.validateCoreRequirement(),
      this.validateGPARequirement()
    ];

    // src/utils/graduationUtils.ts
const additionalResults = (this.requirements.requirements?.map(req => {
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
}).filter((result): result is RequirementValidationResult => result !== null)) || [];

    return [...baseResults, ...additionalResults];
  }

  private validateCreditRequirement(requirement?: RequirementType & { type: 'credits' }): RequirementValidationResult {
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
      satisfied: totalCredits >= (requirement?.totalCredits || 0) &&
                categoryValidation.every(v => v.satisfied),
      current: totalCredits,
      required: requirement?.totalCredits || 0,
      details: {
        message: `총 ${totalCredits}/${requirement?.totalCredits || 0} 학점 이수`,
        items: categoryValidation
      }
    };
  }

  private validateCoreRequirement(requirement?: RequirementType & { type: 'core' }): RequirementValidationResult {
  const completedCourses = this.getCompletedCourses();
  
  const validations = (requirement?.courses || []).map(req => {
    const result = this.validateCourseRequirement(req, completedCourses);
    return {
      name: req.courseId,
      satisfied: result.satisfied, // RequirementItem의 satisfied 속성 사용
      current: result.current,
      required: result.required
    };
  });

  return {
    type: 'core',
    satisfied: validations.every(v => v.satisfied),
    current: validations.filter(v => v.satisfied).length,
    required: requirement?.courses?.length || 0,
    details: {
      message: '핵심 과목 이수 현황',
      items: validations
    }
  };
}

  private validateGPARequirement(requirement?: RequirementType & { type: 'gpa' }): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const gpa = this.calculateGPA(completedCourses);
    const majorGpa = requirement?.minimumMajorGPA ? 
      this.calculateMajorGPA(completedCourses) : null;
  
    const items: RequirementItem[] = [
      {
        name: '전체 평점',
        satisfied: gpa >= (requirement?.minimumGPA || 0),
        current: Math.floor(gpa * 100),
        required: Math.floor((requirement?.minimumGPA || 0) * 100)
      }
    ];
  
    if (majorGpa !== null && requirement?.minimumMajorGPA) {
      items.push({
        name: '전공 평점',
        satisfied: majorGpa >= requirement.minimumMajorGPA,
        current: Math.floor(majorGpa * 100),
        required: Math.floor(requirement.minimumMajorGPA * 100)
      });
    }
  
    return {
      type: 'gpa',
      satisfied: items.every(item => item.satisfied),
      current: Math.floor(gpa * 100),
      required: Math.floor((requirement?.minimumGPA || 0) * 100),
      details: {
        message: 'GPA 요건',
        items
      }
    };
  }

  private validateBreadthRequirement(requirement?: RequirementType & { type: 'breadth' }): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const validations = requirement?.categories.map(category => {
      const completedCredits = completedCourses
        .filter(course => category.courses.includes(course.code))
        .reduce((sum, course) => sum + course.credits, 0);

      return {
        name: category.name,
        satisfied: completedCredits >= category.requiredCredits,
        current: completedCredits,
        required: category.requiredCredits
      };
    }) || [];

    const totalRequired = requirement?.minimumCategories || validations.length;

    return {
      type: 'breadth',
      satisfied: validations.filter(v => v.satisfied).length >= totalRequired,
      current: validations.filter(v => v.satisfied).length,
      required: totalRequired,
      details: {
        message: '영역별 이수 요건',
        items: validations
      }
    };
  }

  private validateMajorRequirement(requirement?: RequirementType & { type: 'major' }): RequirementValidationResult {
    if (!requirement) {
      return {
        type: 'major',
        satisfied: true,
        current: 0,
        required: 0,
        details: {
          message: '전공 요건 없음',
          items: []
        }
      };
    }

    const completedCourses = this.getCompletedCourses();
    const requiredValidations = requirement.requiredCourses.map(req => 
      this.validateCourseRequirement(req, completedCourses)
    );

    const electiveCredits = completedCourses
      .filter(course => requirement.electiveCourses.includes(course.code))
      .reduce((sum, course) => sum + course.credits, 0);

    return {
      type: 'major',
      satisfied: requiredValidations.every(v => v.satisfied) && 
                electiveCredits >= requirement.electiveCredits,
      current: electiveCredits,
      required: requirement.electiveCredits,
      details: {
        message: '전공 이수 요건',
        items: [
          ...requiredValidations,
          {
            name: '전공선택',
            satisfied: electiveCredits >= requirement.electiveCredits,
            current: electiveCredits,
            required: requirement.electiveCredits
          }
        ]
      }
    };
  }

  private validateLevelRequirement(requirement?: RequirementType & { type: 'level' }): RequirementValidationResult {
    if (!requirement) {
      return {
        type: 'level',
        satisfied: true,
        current: 0,
        required: 0,
        details: {
          message: '과목 레벨 요건 없음',
          items: []
        }
      };
    }

    const completedCourses = this.getCompletedCourses();
    const upperLevelCredits = completedCourses
      .filter(course => parseInt(course.level) >= 300)
      .reduce((sum, course) => sum + course.credits, 0);

    const levelValidations = Object.entries(requirement.levels).map(([level, required]) => {
      const credits = completedCourses
        .filter(course => course.level === level)
        .reduce((sum, course) => sum + course.credits, 0);

      return {
        name: `${level} 레벨`,
        satisfied: credits >= required,
        current: credits,
        required
      };
    });

    return {
      type: 'level',
      satisfied: upperLevelCredits >= requirement.minimumUpperLevel &&
                levelValidations.every(v => v.satisfied),
      current: upperLevelCredits,
      required: requirement.minimumUpperLevel,
      details: {
        message: '과목 레벨 요건',
        items: levelValidations
      }
    };
  }

  private calculateTotalCredits(): number {
    return this.getCompletedCourses().reduce((sum, course) => sum + course.credits, 0);
  }

  private categorizeCourses(): Record<string, number> {
    return this.getCompletedCourses().reduce((categories, course) => {
      const category = course.department;
      categories[category] = (categories[category] || 0) + course.credits;
      return categories;
    }, {} as Record<string, number>);
  }

  private getCompletedCourses(): Course[] {
    return this.plan.years.flatMap(year =>
      year.semesters.flatMap(semester =>
        semester.courses
      )
    );
  }

  private validateCourseRequirement(
    req: CourseRequirement,
    completedCourses: Course[]
  ): RequirementItem {
    const courseCompleted = completedCourses.some(course =>
      course.code === req.courseId || (req.alternatives || []).includes(course.code)
    );
  
    if (req.minimumGrade && courseCompleted) {
      const course = completedCourses.find(c => c.code === req.courseId);
      const grade = course ? this.getGradeValue(course.gradeDistribution) : 0;
      const requiredGrade = this.getGradeValue(req.minimumGrade);
      
      return {
        name: req.courseId,
        satisfied: grade >= requiredGrade,
        current: Math.floor(grade * 100),
        required: Math.floor(requiredGrade * 100)
      };
    }
  
    return {
      name: req.courseId,
      satisfied: courseCompleted,
      current: courseCompleted ? 1 : 0,
      required: 1
    };
  }

  private calculateGPA(courses: Course[]): number {
    if (courses.length === 0) return 0;

    const totalPoints = courses.reduce((sum, course) => {
      const gradeDistribution = parseGradeDistribution(course.gradeDistribution);
      return sum + (this.getGradeValue(gradeDistribution) * course.credits);
    }, 0);

    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    return Number((totalPoints / totalCredits).toFixed(2));
  }

  private calculateMajorGPA(courses: Course[]): number {
    const majorCourses = courses.filter(course =>
      this.requirements.requirements?.some(req =>
        req.type === 'major' && (
          req.requiredCourses?.some(r => r.courseId === course.code) ||
          req.electiveCourses?.includes(course.code)
        )
      ) || false
    );

    return this.calculateGPA(majorCourses);
  }

  private getGradeValue(grade: string | any): number {
    if (typeof grade === 'string') {
      const gradeMap: Record<string, number> = {
        'A': 4.0, 'AB': 3.5, 'B': 3.0,
        'BC': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0
      };
      return gradeMap[grade] || 0;
    }

    return (
      (parseFloat(grade.A) * 4.0 +
      parseFloat(grade.AB) * 3.5 +
      parseFloat(grade.B) * 3.0 +
      parseFloat(grade.BC) * 2.5 +
      parseFloat(grade.C) * 2.0 +
      parseFloat(grade.D) * 1.0) / 100
    );
  }
}
