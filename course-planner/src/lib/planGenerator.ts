// src/lib/planGenerator.ts
import type { Course, Semester, AcademicPlan, AcademicYear } from '@/types/course';

interface PlanPreferences {
  prioritizeGrades: boolean;
  balanceWorkload: boolean;
  includeRequirements: boolean;
}

interface PlanConstraints {
  maxCreditsPerSemester: number;
  requiredCourses: string[];
  preferredTerms: { [courseId: string]: string[] };
}

export class PlanGenerator {
  private readonly TARGET_CREDITS_PER_SEMESTER = 15;
  private readonly CREDIT_TOLERANCE = 3;

  generatePlan(
    courses: Course[], 
    preferences: PlanPreferences,
    constraints: PlanConstraints
  ): AcademicPlan {
    // 1. 선수과목 순환 참조 검사
    if (this.checkCircularDependencies(courses)) {
      throw new Error('Circular dependencies detected in prerequisites');
    }

    // 2. 과목 우선순위 계산 및 정렬
    const scoredCourses = courses.map(course => ({
      course,
      score: this.calculateCourseScore(course, preferences)
    })).sort((a, b) => b.score - a.score);

    // 3. 필수과목과 선택과목 분리
    const requiredCourses = scoredCourses
      .filter(({ course }) => constraints.requiredCourses.includes(course.code))
      .map(({ course }) => course);

    const electiveCourses = scoredCourses
      .filter(({ course }) => !constraints.requiredCourses.includes(course.code))
      .map(({ course }) => course);

    // 4. 연도 및 학기 초기화
    const years = this.initializeYears();
    const allSemesters = years.flatMap(year => year.semesters);
    const completedCourses: Course[] = [];

    // 5. 과목 배치
    const orderedCourses = [...requiredCourses, ...electiveCourses];
    for (const course of orderedCourses) {
      const bestSemester = this.findBestSemester(course, years, completedCourses, constraints);
      if (bestSemester) {
        bestSemester.courses.push({
          ...course,
          semesterId: bestSemester.id
        });
        completedCourses.push(course);
      }
    }

    // 6. 워크로드 밸런싱
    if (preferences.balanceWorkload) {
      this.balanceWorkload(allSemesters);
    }

    // 7. 계획 생성 및 검증
    const plan: AcademicPlan = {
      id: `plan-${Date.now()}`,
      userId: '',
      years,
      savedCourses: []
    };

    if (!this.validatePlanConstraints(plan, constraints)) {
      throw new Error('Generated plan does not meet constraints');
    }

    return plan;
  }

  private findBestSemester(
    course: Course,
    years: AcademicYear[],
    completedCourses: Course[],
    constraints: PlanConstraints
  ): Semester | null {
    const availableSemesters = years
      .flatMap(year => year.semesters)
      .filter(semester => {
        // 1. 학기 제공 여부
        if (!course.term.includes(semester.term)) return false;

        // 2. 학점 제한
        const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        if (currentCredits + course.credits > constraints.maxCreditsPerSemester) return false;

        // 3. 선호 학기
        const preferredTerms = constraints.preferredTerms[course.id];
        if (preferredTerms && !preferredTerms.includes(semester.term)) return false;

        // 4. 선수과목 이수 여부
        return course.prerequisites.every(prereq =>
          completedCourses.some(completed => completed.code === prereq.courseId)
        );
      });

    if (availableSemesters.length === 0) return null;

    // 학점이 가장 적은 학기 선택
    return availableSemesters.reduce((best, current) => {
      const currentCredits = current.courses.reduce((sum, c) => sum + c.credits, 0);
      const bestCredits = best.courses.reduce((sum, c) => sum + c.credits, 0);
      return currentCredits < bestCredits ? current : best;
    });
  }

  private calculateCourseScore(course: Course, preferences: PlanPreferences): number {
    let score = 0;
    
    // 성적 점수
    if (preferences.prioritizeGrades) {
      const gradeData = typeof course.gradeDistribution === 'string'
        ? JSON.parse(course.gradeDistribution)
        : course.gradeDistribution;
      score += parseFloat(gradeData.A) * 2;
      score += parseFloat(gradeData.AB);
    }

    // 필수과목 점수
    if (preferences.includeRequirements && course.prerequisites.length > 0) {
      score += 50;
    }

    // 학점 기반 점수
    score += course.credits * 5;

    return score;
  }

  private validatePlanConstraints(plan: AcademicPlan, constraints: PlanConstraints): boolean {
    // 1. 학점 제한 검증
    const creditsValid = plan.years.every(year =>
      year.semesters.every(semester => {
        const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        return credits <= constraints.maxCreditsPerSemester;
      })
    );
    if (!creditsValid) return false;

    // 2. 필수과목 포함 검증
    const allCourses = new Set(
      plan.years.flatMap(y => 
        y.semesters.flatMap(s => 
          s.courses.map(c => c.code)
        )
      )
    );
    const requiredCoursesIncluded = constraints.requiredCourses.every(
      code => allCourses.has(code)
    );
    if (!requiredCoursesIncluded) return false;

    // 3. 선수과목 순서 검증
    return plan.years.every(year =>
      year.semesters.every(semester =>
        semester.courses.every(course =>
          this.validatePrerequisites(course, plan, year.startYear, semester.term)
        )
      )
    );
  }

  private checkCircularDependencies(courses: Course[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (courseId: string): boolean => {
      if (recursionStack.has(courseId)) return true;
      if (visited.has(courseId)) return false;

      visited.add(courseId);
      recursionStack.add(courseId);

      const course = courses.find(c => c.id === courseId);
      if (course) {
        for (const prereq of course.prerequisites) {
          if (hasCycle(prereq.courseId)) return true;
        }
      }

      recursionStack.delete(courseId);
      return false;
    };

    return courses.some(course => hasCycle(course.id));
  }

  private balanceWorkload(semesters: Semester[]): void {
    let balanced = false;
    while (!balanced) {
      balanced = true;
      
      for (const semester of semesters) {
        const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        const diff = credits - this.TARGET_CREDITS_PER_SEMESTER;

        if (Math.abs(diff) > this.CREDIT_TOLERANCE) {
          balanced = false;
          this.rebalanceSemester(semester, semesters, diff);
        }
      }
    }
  }

  private rebalanceSemester(
    semester: Semester,
    allSemesters: Semester[],
    creditDiff: number
  ): void {
    if (creditDiff > 0) {  // 학점이 너무 많음
      const coursesToMove = this.findCoursesToMove(semester.courses, creditDiff);
      for (const course of coursesToMove) {
        const targetSemester = this.findBestSemesterForMove(
          course,
          allSemesters.filter(s => s !== semester)
        );
        if (targetSemester) {
          semester.courses = semester.courses.filter(c => c.id !== course.id);
          targetSemester.courses.push(course);
          break;
        }
      }
    }
  }

  private findBestSemesterForMove(
    course: Course,
    semesters: Semester[]
  ): Semester | null {
    return semesters
      .filter(semester => {
        const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        return credits + course.credits <= this.TARGET_CREDITS_PER_SEMESTER + this.CREDIT_TOLERANCE;
      })
      .sort((a, b) => {
        const creditsA = a.courses.reduce((sum, c) => sum + c.credits, 0);
        const creditsB = b.courses.reduce((sum, c) => sum + c.credits, 0);
        return creditsA - creditsB;
      })[0] || null;
  }

  private findCoursesToMove(courses: Course[], targetCredits: number): Course[] {
    return courses
      .filter(course => course.credits <= targetCredits)
      .sort((a, b) => a.credits - b.credits);
  }

  private initializeYears(): AcademicYear[] {
    const startYear = new Date().getFullYear();
    return ['Freshman', 'Sophomore', 'Junior', 'Senior'].map((yearName, index) => ({
      id: `year-${index}`,
      name: yearName,
      yearName: yearName,
      year: `${yearName} Year (${startYear + index}-${startYear + index + 1})`,
      startYear: startYear + index,
      semesters: ['Fall', 'Spring', 'Summer'].map(term => ({
        id: `${yearName.toLowerCase()}-${term.toLowerCase()}`,
        term,
        year: startYear + index,
        courses: [],
        academicYearId: `year-${index}`
      }))
    }));
  }

  private validatePrerequisites(
    course: Course,
    plan: AcademicPlan,
    currentYear: number,
    currentTerm: string
  ): boolean {
    const termOrder = ['Fall', 'Spring', 'Summer'];
    const currentTermIndex = termOrder.indexOf(currentTerm);

    return course.prerequisites.every(prereq => {
      for (const year of plan.years) {
        if (year.startYear > currentYear) continue;

        for (const semester of year.semesters) {
          if (year.startYear === currentYear && 
              termOrder.indexOf(semester.term) >= currentTermIndex) {
            continue;
          }

          if (semester.courses.some(c => c.code === prereq.courseId)) {
            return true;
          }
        }
      }
      return false;
    });
  }
}