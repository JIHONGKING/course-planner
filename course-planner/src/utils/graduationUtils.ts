// src/utils/graduationUtils.ts

import type { 
    GraduationRequirements,
    Requirement,
    RequirementValidationResult,
    CourseRequirement
  } from '@/types/graduation';
  import type { Course, AcademicPlan } from '@/types/course';
  import { parseGradeDistribution } from './gradeUtils';
  
  export class GraduationValidator {
    private plan: AcademicPlan;
    private requirements: GraduationRequirements;
    private allCourses: Map<string, Course>;
  
    constructor(plan: AcademicPlan, requirements: GraduationRequirements, courses: Course[]) {
      this.plan = plan;
      this.requirements = requirements;
      this.allCourses = new Map(courses.map(course => [course.code, course]));
    }
  
    validateAll(): RequirementValidationResult[] {
      return this.requirements.requirements.map(req => {
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
        }
      });
    }
  
    private validateCreditRequirement(requirement: Requirement & { type: 'credits' }): RequirementValidationResult {
      const totalCredits = this.calculateTotalCredits();
      const categories = this.categorizeCourses();
      
      const categoryValidation = requirement.minimumPerCategory ? 
        Object.entries(requirement.minimumPerCategory).map(([category, required]) => ({
          name: category,
          satisfied: (categories[category] || 0) >= required,
          current: categories[category] || 0,
          required
        })) : [];
  
      return {
        type: 'credits',
        satisfied: totalCredits >= requirement.totalCredits && 
                  categoryValidation.every(v => v.satisfied),
        current: totalCredits,
        required: requirement.totalCredits,
        details: {
          message: `총 ${totalCredits}/${requirement.totalCredits} 학점 이수`,
          items: categoryValidation
        }
      };
    }
  
    private validateCoreRequirement(requirement: Requirement & { type: 'core' }): RequirementValidationResult {
      const completedCourses = this.getCompletedCourses();
      const validations = requirement.courses.map(req => {
        const completed = this.validateCourseRequirement(req, completedCourses);
        return {
          name: req.courseId,
          satisfied: completed,
          current: completed ? 1 : 0,
          required: 1
        };
      });
  
      return {
        type: 'core',
        satisfied: validations.every(v => v.satisfied),
        current: validations.filter(v => v.satisfied).length,
        required: requirement.courses.length,
        details: {
          message: '핵심 과목 이수 현황',
          items: validations
        }
      };
    }
  
    private validateBreadthRequirement(requirement: Requirement & { type: 'breadth' }): RequirementValidationResult {
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
        satisfied: validations.every(v => v.satisfied),
        current: validations.filter(v => v.satisfied).length,
        required: requirement.categories.length,
        details: {
          message: '폭넓은 학습 요건 이수 현황',
          items: validations
        }
      };
    }
  
    private validateMajorRequirement(requirement: Requirement & { type: 'major' }): RequirementValidationResult {
      const completedCourses = this.getCompletedCourses();
      
      // 필수 과목 검증
      const requiredValidations = requirement.requiredCourses.map(req => {
        const completed = this.validateCourseRequirement(req, completedCourses);
        return {
          name: req.courseId,
          satisfied: completed,
          current: completed ? 1 : 0,
          required: 1
        };
      });
  
      // 전공 선택 학점 검증
      const electiveCredits = completedCourses
        .filter(course => requirement.electiveCourses.includes(course.code))
        .reduce((sum, course) => sum + course.credits, 0);
  
      const validations = [
        ...requiredValidations,
        {
          name: '전공 선택 학점',
          satisfied: electiveCredits >= requirement.electiveCredits,
          current: electiveCredits,
          required: requirement.electiveCredits
        }
      ];
  
      return {
        type: 'major',
        satisfied: validations.every(v => v.satisfied),
        current: validations.filter(v => v.satisfied).length,
        required: validations.length,
        details: {
          message: `${requirement.name} 전공 요건 이수 현황`,
          items: validations
        }
      };
    }

    // src/utils/graduationUtils.ts (continued)

  private validateLevelRequirement(requirement: Requirement & { type: 'level' }): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const levelCounts = completedCourses.reduce((counts, course) => {
      counts[course.level] = (counts[course.level] || 0) + course.credits;
      return counts;
    }, {} as Record<string, number>);

    const upperLevelCredits = Object.entries(levelCounts)
      .filter(([level]) => parseInt(level) >= 300)
      .reduce((sum, [_, credits]) => sum + credits, 0);

    const validations = Object.entries(requirement.levels).map(([level, required]) => ({
      name: `${level} 레벨 과목`,
      satisfied: (levelCounts[level] || 0) >= required,
      current: levelCounts[level] || 0,
      required
    }));

    return {
      type: 'level',
      satisfied: upperLevelCredits >= requirement.minimumUpperLevel &&
                validations.every(v => v.satisfied),
      current: upperLevelCredits,
      required: requirement.minimumUpperLevel,
      details: {
        message: '과목 레벨 요건 이수 현황',
        items: validations
      }
    };
  }

  private validateGPARequirement(requirement: Requirement & { type: 'gpa' }): RequirementValidationResult {
    const completedCourses = this.getCompletedCourses();
    const gpa = this.calculateGPA(completedCourses);
    const majorGpa = requirement.minimumMajorGPA ? 
      this.calculateMajorGPA(completedCourses) : null;

    const validations = [
      {
        name: '전체 평점',
        satisfied: gpa >= requirement.minimumGPA,
        current: gpa,
        required: requirement.minimumGPA
      }
    ];

    if (majorGpa !== null && requirement.minimumMajorGPA) {
      validations.push({
        name: '전공 평점',
        satisfied: majorGpa >= requirement.minimumMajorGPA,
        current: majorGpa,
        required: requirement.minimumMajorGPA
      });
    }

    return {
      type: 'gpa',
      satisfied: validations.every(v => v.satisfied),
      current: gpa,
      required: requirement.minimumGPA,
      details: {
        message: 'GPA 요건',
        items: validations
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

  private validateCourseRequirement(req: CourseRequirement, completedCourses: Course[]): boolean {
    const courseCompleted = completedCourses.find(course =>
      course.code === req.courseId || (req.alternatives || []).includes(course.code)
    );

    if (!courseCompleted) return false;

    if (req.minimumGrade) {
      const gradeDistribution = parseGradeDistribution(courseCompleted.gradeDistribution);
      const gradeValue = this.getGradeValue(gradeDistribution);
      const requiredGradeValue = this.getGradeValue(req.minimumGrade);
      return gradeValue >= requiredGradeValue;
    }

    return true;
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
      this.requirements.requirements.some(req =>
        req.type === 'major' && (
          req.requiredCourses.some(r => r.courseId === course.code) ||
          req.electiveCourses.includes(course.code)
        )
      )
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

    // 가중 평균 계산
    return (
      (parseFloat(grade.A) * 4.0 +
      parseFloat(grade.AB) * 3.5 +
      parseFloat(grade.B) * 3.0 +
      parseFloat(grade.BC) * 2.5 +
      parseFloat(grade.C) * 2.0 +
      parseFloat(grade.D) * 1.0) / 100
    );
  }

  private canTakeCourse(course: Course, completedCourses: Course[]): boolean {
    // 선수과목 요건 검사
    for (const prereq of course.prerequisites) {
      if (!completedCourses.some(c => c.code === prereq.courseId)) {
        return false;
      }
    }
    return true;
  }

  private findAlternativeCourses(course: Course): Course[] {
    // 비슷한 레벨과 학점을 가진 같은 학과의 과목들을 찾음
    return Array.from(this.allCourses.values())
      .filter(c => 
        c.id !== course.id &&
        c.department === course.department &&
        c.level === course.level &&
        c.credits === course.credits
      )
      .slice(0, 3); // 최대 3개까지 추천
  }
}
