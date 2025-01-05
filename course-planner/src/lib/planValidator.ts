// src/lib/planValidator.ts
import type { AcademicPlan } from '@/types/course';

export interface PlanIssue {
  type: 'error' | 'warning';
  message: string;
  semester?: string;
  course?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: PlanIssue[];
}

export class PlanValidator {
  validatePlan(plan: AcademicPlan): ValidationResult {
    const issues: PlanIssue[] = [];
    
    this.validateCredits(plan, issues);
    this.validatePrerequisites(plan, issues);
    this.validateWorkloadBalance(plan, issues);
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private validateCredits(plan: AcademicPlan, issues: PlanIssue[]): void {
    const maxCreditsPerSemester = 18;

    for (const year of plan.years) {
      for (const semester of year.semesters) {
        const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        if (credits > maxCreditsPerSemester) {
          issues.push({
            type: 'error',
            message: `Too many credits (${credits}) in ${year.name} ${semester.term}`,
            semester: semester.id
          });
        }
      }
    }
  }

  private validatePrerequisites(plan: AcademicPlan, issues: PlanIssue[]): void {
    for (const year of plan.years) {
      for (const semester of year.semesters) {
        for (const course of semester.courses) {
          for (const prereq of course.prerequisites) {
            const isPrereqTaken = this.isPrerequisiteTaken(
              prereq.courseId,
              plan,
              year.startYear,
              semester.term
            );
            
            if (!isPrereqTaken) {
              issues.push({
                type: 'error',
                message: `Prerequisite ${prereq.courseId} not taken before ${course.code}`,
                course: course.id,
                semester: semester.id
              });
            }
          }
        }
      }
    }
  }

  private validateWorkloadBalance(plan: AcademicPlan, issues: PlanIssue[]): void {
    const targetCredits = 15;
    const tolerance = 3;

    for (const year of plan.years) {
      for (const semester of year.semesters) {
        const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        if (Math.abs(credits - targetCredits) > tolerance) {
          issues.push({
            type: 'warning',
            message: `Unbalanced workload (${credits} credits) in ${year.name} ${semester.term}`,
            semester: semester.id
          });
        }
      }
    }
  }

  private isPrerequisiteTaken(
    prerequisiteId: string,
    plan: AcademicPlan,
    currentYear: number,
    currentTerm: string
  ): boolean {
    const termOrder = ['Fall', 'Spring', 'Summer'];
    const currentTermIndex = termOrder.indexOf(currentTerm);

    for (const year of plan.years) {
      if (year.startYear > currentYear) continue;

      for (const semester of year.semesters) {
        if (year.startYear === currentYear && 
            termOrder.indexOf(semester.term) >= currentTermIndex) {
          continue;
        }

        if (semester.courses.some(course => course.id === prerequisiteId)) {
          return true;
        }
      }
    }

    return false;
  }
}