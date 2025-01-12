import type { Course, AcademicPlan } from '@/types/course';
import type { 
  GraduationRequirement, 
  RequirementValidationResult,
  RequirementItem,
  RequirementCriteria,
  RequirementProgress,
  GraduationProgress
} from '@/types/graduation';
import { getGradeA } from '@/utils/gradeUtils';

export class GraduationValidator {
  constructor(
    private plan: AcademicPlan,
    private requirements: GraduationRequirement,
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

  private isGraduationComplete(progress: GraduationProgress): boolean {
    return (
      progress.totalCredits >= this.requirements.requiredCredits &&
      progress.currentGPA >= this.requirements.requiredGPA &&
      progress.remainingRequirements.length === 0
    );
  }

  private validateCriteria(criteria: RequirementCriteria): RequirementProgress {
    const completedCourses = this.getCompletedCourses();
    let current = 0;
    let courses: string[] = [];
  
    switch (criteria.type) {
      case 'credits':
        current = completedCourses.reduce((sum, course) => sum + course.credits, 0);
        courses = completedCourses.map(course => course.code);
        break;
        
      case 'courses':
        // coreCourses 배열의 code 속성만 추출하여 비교
        const requiredCourseCodes = this.requirements.coreCourses.map(course => course.code);
        current = completedCourses.filter(course => 
          requiredCourseCodes.includes(course.code)
        ).length;
        courses = completedCourses
          .filter(course => requiredCourseCodes.includes(course.code))
          .map(course => course.code);
        break;
  
      case 'gpa':
        current = this.calculateGPA(completedCourses);
        break;
  
        case 'distribution':
          const departmentCredits = new Map<string, number>();
          
          // 학과별 이수 학점 계산
          completedCourses.forEach(course => {
            const currentCredits = departmentCredits.get(course.department) || 0;
            departmentCredits.set(course.department, currentCredits + course.credits);
          });
        
          // distribution 요건 검증
          let totalDistributionCredits = 0;
          let satisfiedCategories = 0;
          const distributionRequirements = this.requirements.distribution;
        
          Object.entries(distributionRequirements).forEach(([dept, required]) => {
            const completed = departmentCredits.get(dept) || 0;
            totalDistributionCredits += completed;
            if (completed >= required) {
              satisfiedCategories++;
            }
          });
        
          current = totalDistributionCredits;
          courses = completedCourses
            .filter(course => distributionRequirements[course.department])
            .map(course => course.code);
          break;
    }
  
    return {
      criteriaId: criteria.id,
      current,
      required: criteria.required,
      completed: current >= criteria.required,
      courses
    };
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
    const coreResults: RequirementItem[] = this.requirements.coreCourses.map(req => {
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
      type: 'core' as const,
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
    
    const results: RequirementItem[] = Object.entries(requirements).map(([category, required]) => {
      const current = completedCourses.reduce((sum, course) => {
        return sum + (course.department === category ? course.credits : 0);
      }, 0);

      return {
        name: category,
        satisfied: current >= (required as number),
        current,
        required: required as number
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
      // A학점 비율을 4.0 스케일로 변환
      const gpaPoints = (gradeA / 100) * 4.0;
      return sum + (gpaPoints * course.credits);
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
