// /Users/jihong/Desktop/AutoClassfinder/course-planner/src/lib/planGenerator/OptimizedPlanGenerator.ts


import type { Course, AcademicPlan } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface CourseNode {
  course: Course;
  score: number;
  dependencies: Set<string>;
  dependents: Set<string>;
}

interface PlanPreferences {
  prioritizeGrades: boolean;
  balanceWorkload: boolean;
  includeRequirements: boolean;
}

export class OptimizedPlanGenerator {
  private courseGraph: Map<string, CourseNode> = new Map();
  private termWorkload: Map<string, number> = new Map();

  constructor(private courses: Course[]) {
    this.buildCourseGraph();
  }

  private buildCourseGraph(): void {
    for (const course of this.courses) {
      const node: CourseNode = {
        course,
        score: this.calculateBaseScore(course),
        dependencies: new Set(course.prerequisites.map((p) => p.courseId)),
        dependents: new Set(),
      };
      this.courseGraph.set(course.id, node);
    }

    for (const [id, node] of this.courseGraph) {
      for (const depId of node.dependencies) {
        const depNode = this.courseGraph.get(depId);
        if (depNode) {
          depNode.dependents.add(id);
        }
      }
    }
  }

  private calculateBaseScore(course: Course): number {
    let score = 0;

    const gradeA = parseFloat(getGradeA(course.gradeDistribution));
    score += (gradeA / 100) * 40;

    const prerequisiteCount = course.prerequisites.length;
    const dependentScore = prerequisiteCount ? 30 / prerequisiteCount : 30;
    score += dependentScore;

    const level = parseInt(course.level);
    score += (level / 500) * 20;

    score += (course.credits / 5) * 10;

    return score;
  }

  private calculateTermWorkloadScore(term: string, course: Course): number {
    const currentWorkload = this.termWorkload.get(term) || 0;
    const targetWorkload = 15;
    const newWorkload = currentWorkload + course.credits;

    return -Math.abs(targetWorkload - newWorkload) * 2;
  }

  private findOptimalTerm(course: Course, availableTerms: string[]): string {
    let bestTerm = availableTerms[0];
    let bestScore = -Infinity;

    for (const term of availableTerms) {
      if (!course.term.includes(term.split('-')[1])) continue;

      const workloadScore = this.calculateTermWorkloadScore(term, course);

      if (workloadScore > bestScore) {
        bestScore = workloadScore;
        bestTerm = term;
      }
    }

    return bestTerm;
  }

  public generateOptimalPlan(preferences: PlanPreferences): AcademicPlan {
    const startYear = new Date().getFullYear();
    const yearNames = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
    const terms = ['Fall', 'Spring', 'Summer'];

    const plan: AcademicPlan = {
      id: `plan-${Date.now()}`,
      userId: '',
      years: yearNames.map((yearName, index) => ({
        id: `year-${index}`,
        name: yearName,
        yearName,
        year: `${yearName} Year`,
        startYear: startYear + index,
        semesters: terms.map((term) => ({
          id: `${yearName.toLowerCase()}-${term.toLowerCase()}`,
          term,
          year: startYear + index,
          courses: [],
          academicYearId: `year-${index}`,
        })),
      })),
      savedCourses: [],
    };

    const assignedCourses = this.optimizeCourseDistribution(preferences);

    plan.years.forEach((year) => {
      year.semesters.forEach((semester) => {
        const key = `${year.yearName}-${semester.term}`;
        semester.courses = assignedCourses.get(key) || [];
      });
    });

    return plan;
  }

  private optimizeCourseDistribution(preferences: PlanPreferences): Map<string, Course[]> {
    const distribution = new Map<string, Course[]>();
    const available = new Set<string>();
    const assigned = new Set<string>();

    this.courseGraph.forEach((node, id) => {
      if (node.dependencies.size === 0) {
        available.add(id);
      }
    });

    const termKeys = [
      'Freshman-Fall',
      'Freshman-Spring',
      'Sophomore-Fall',
      'Sophomore-Spring',
      'Junior-Fall',
      'Junior-Spring',
      'Senior-Fall',
      'Senior-Spring',
    ];
    termKeys.forEach((term) => distribution.set(term, []));

    while (available.size > 0) {
      const sorted = Array.from(available)
        .map((id) => this.courseGraph.get(id)!)
        .sort((a, b) => b.score - a.score);

      for (const node of sorted) {
        const optimalTerm = this.findOptimalTerm(
          node.course,
          termKeys.filter((term) => !assigned.has(term))
        );
        const termCourses = distribution.get(optimalTerm)!;

        const termCredits = termCourses.reduce((sum, c) => sum + c.credits, 0);
        if (termCredits + node.course.credits <= 18) {
          termCourses.push(node.course);
          available.delete(node.course.id);
          assigned.add(node.course.id);
          this.termWorkload.set(optimalTerm, termCredits + node.course.credits);

          for (const depId of node.dependents) {
            const depNode = this.courseGraph.get(depId)!;
            if (Array.from(depNode.dependencies).every((id) => assigned.has(id))) {
              available.add(depId);
            }
          }
        }
      }
    }

    return distribution;
  }
}
