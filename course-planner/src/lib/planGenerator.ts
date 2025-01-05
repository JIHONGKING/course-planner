// src/lib/planGenerator.ts 생성
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
    generatePlan(
        courses: Course[], 
        preferences: PlanPreferences,
        constraints: PlanConstraints
      ): AcademicPlan {
        const sortedCourses = this.sortCoursesByPreference(courses, preferences);
        
        if (this.checkCircularDependencies(sortedCourses)) {
          throw new Error('Circular dependencies detected in prerequisites');
        }
        
        const years = this.distributeCoursesIntoYears(sortedCourses, constraints);
        
        // years 배열 전체를 전달하도록 수정
        this.optimizeWorkloadBalance(years);
    
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

      private moveCourseToOtherSemester(
        course: Course,
        fromSemester: Semester,
        years: AcademicYear[],
        constraints: PlanConstraints
      ): boolean {
        // 과목을 이동할 수 있는 가장 적절한 학기 찾기
        for (const year of years) {
          for (const semester of year.semesters) {
            if (semester.id === fromSemester.id) continue; // 현재 학기는 건너뛰기
      
            // 과목 이동 가능성 검사
            if (this.canMoveCourseToSemester(course, semester, constraints)) {
              // 현재 학기에서 제거
              fromSemester.courses = fromSemester.courses.filter(c => c.id !== course.id);
              
              // 새 학기에 추가
              semester.courses.push({
                ...course,
                semesterId: semester.id
              });
              
              return true;
            }
          }
        }
        return false;
      }
      
      private canMoveCourseToSemester(
        course: Course,
        targetSemester: Semester,
        constraints: PlanConstraints
      ): boolean {
        // 1. 학점 제한 확인
        const currentCredits = targetSemester.courses.reduce((sum, c) => sum + c.credits, 0);
        if (currentCredits + course.credits > constraints.maxCreditsPerSemester) {
          return false;
        }
      
        // 2. 선호 학기 확인
        const preferredTerms = constraints.preferredTerms[course.id];
        if (preferredTerms && !preferredTerms.includes(targetSemester.term)) {
          return false;
        }
      
        // 3. 선수과목 관계 확인
        // ... 추가 구현 필요
      
        return true;
      }
      
  // getAverageGrade 메서드 추가
  private getAverageGrade(course: Course): number {
    try {
      const gradeData = typeof course.gradeDistribution === 'string'
        ? JSON.parse(course.gradeDistribution)
        : course.gradeDistribution;
      return parseFloat(gradeData.A || '0');
    } catch (error) {
      return 0;
    }
  }

  private sortCoursesByPreference(courses: Course[], preferences: PlanPreferences): Course[] {
    return [...courses].sort((a, b) => {
      const priorityA = this.calculateCoursePriority(a, preferences);
      const priorityB = this.calculateCoursePriority(b, preferences);
      return priorityB - priorityA;  // 높은 우선순위가 앞으로
    });
  }

  private validatePlanConstraints(plan: AcademicPlan, constraints: PlanConstraints): boolean {
    // 최대 학점 검증
    for (const year of plan.years) {
      for (const semester of year.semesters) {
        const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        if (credits > constraints.maxCreditsPerSemester) {
          return false;
        }
      }
    }

    // 필수과목 포함 여부 검증
    const allCourses = plan.years.flatMap(y => 
      y.semesters.flatMap(s => s.courses.map(c => c.code))
    );
    
    for (const requiredCourse of constraints.requiredCourses) {
      if (!allCourses.includes(requiredCourse)) {
        return false;
      }
    }

    // 선수과목 순서 검증
    for (const year of plan.years) {
      for (const semester of year.semesters) {
        for (const course of semester.courses) {
          if (!this.validatePrerequisites(course, plan, year.startYear, semester.term)) {
            return false;
          }
        }
      }
    }
    return true;
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
      // 현재 연도보다 이후의 연도는 확인할 필요 없음
      if (year.startYear > currentYear) {
        continue;
      }

      for (const semester of year.semesters) {
        // 같은 연도일 경우, 현재 학기 이후는 확인할 필요 없음
        if (year.startYear === currentYear && 
            termOrder.indexOf(semester.term) >= currentTermIndex) {
          continue;
        }

        // 선수과목이 이전 학기에 존재하는지 확인
        const prereqFound = semester.courses.some(course => course.id === prerequisiteId);
        if (prereqFound) {
          return true;
        }
      }
    }

    return false;
  }

  private validatePrerequisites(
    course: Course, 
    plan: AcademicPlan,
    currentYear: number,
    currentTerm: string
  ): boolean {
    const prerequisiteCourses = course.prerequisites;
    
    for (const prereq of prerequisiteCourses) {
      const prereqTaken = this.isPrerequisiteTaken(
        prereq.courseId,
        plan,
        currentYear,
        currentTerm
      );
      
      if (!prereqTaken) return false;
    }
    
    return true;
  }

  // 새로 추가: 과목 간의 순환 참조를 체크하는 메서드
  private checkCircularDependencies(courses: Course[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (courseId: string): boolean => {
      if (recursionStack.has(courseId)) {
        return true; // 순환 참조 발견
      }

      if (visited.has(courseId)) {
        return false; // 이미 확인된 경로
      }

      visited.add(courseId);
      recursionStack.add(courseId);

      const course = courses.find(c => c.id === courseId);
      if (course) {
        for (const prereq of course.prerequisites) {
          if (hasCycle(prereq.courseId)) {
            return true;
          }
        }
      }

      recursionStack.delete(courseId);
      return false;
    };

    for (const course of courses) {
      if (hasCycle(course.id)) {
        return true;
      }
    }

    return false;
  }

  // 새로 추가: 학기별 워크로드 밸런싱
  private balanceWorkload(semesters: Semester[]): void {
    const targetCredits = 15; // 목표 학점
    const tolerance = 3; // 허용 오차

    for (const semester of semesters) {
      const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
      
      if (Math.abs(currentCredits - targetCredits) > tolerance) {
        const diff = currentCredits - targetCredits;
        
        if (diff > 0) {
          // 과목 이동이 필요한 경우
          const coursesToMove = this.findCoursesToMove(semester.courses, diff);
          // TODO: 다른 학기로 이동하는 로직
        }
      }
    }
  }


  
  private calculateCoursePriority(course: Course, preferences: PlanPreferences): number {
    let priority = 0;
    
    // 성적 우선순위
    if (preferences.prioritizeGrades) {
      priority += this.getAverageGrade(course) * 0.5;  // 50% 가중치
    }
  
    // 필수과목 우선순위
    if (preferences.includeRequirements && course.prerequisites.length > 0) {
      priority += 30;  // 선수과목이 있는 과목 우선
    }
  
    // 학점 기반 우선순위
    priority += course.credits * 5;  // 고학점 과목 우선
  
    return priority;
  }

  private optimizeWorkloadBalance(years: AcademicYear[]): void {
    const targetCreditsPerSemester = 15;
    
    for (const year of years) {
      for (const semester of year.semesters) {
        const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        
        if (Math.abs(currentCredits - targetCreditsPerSemester) > 3) {
          this.balanceSemesterCredits(semester, targetCreditsPerSemester);
        }
      }
    }
  }
  

  
  private balanceSemesterCredits(semester: Semester, targetCredits: number): void {
    const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
    
    if (currentCredits > targetCredits) {
      // 과목 이동 필요
      const coursesToMove = this.findCoursesToMove(semester.courses, currentCredits - targetCredits);
      // TODO: 다른 학기로 이동 로직 구현
    }
  }
  
  private findCoursesToMove(courses: Course[], targetCredits: number): Course[] {
  const dp: boolean[][] = Array(courses.length + 1).fill(false)
    .map(() => Array(targetCredits + 1).fill(false));
  dp[0][0] = true;

  // 동적 프로그래밍으로 최적의 과목 조합 찾기
  for (let i = 1; i <= courses.length; i++) {
    for (let j = 0; j <= targetCredits; j++) {
      dp[i][j] = dp[i - 1][j];
      if (j >= courses[i - 1].credits) {
        dp[i][j] = dp[i][j] || dp[i - 1][j - courses[i - 1].credits];
      }
    }
  }

  const result: Course[] = [];
  let currentCredits = targetCredits;
  
  for (let i = courses.length; i > 0 && currentCredits > 0; i--) {
    if (currentCredits >= courses[i - 1].credits && 
        dp[i - 1][currentCredits - courses[i - 1].credits]) {
      result.push(courses[i - 1]);
      currentCredits -= courses[i - 1].credits;
    }
  }

  return result;
}

  
    private distributeCoursesIntoYears(courses: Course[], constraints: PlanConstraints): AcademicYear[] {
      const years: AcademicYear[] = this.initializeYears();
      
      for (const course of courses) {
        const bestSemester = this.findBestSemester(course, years, constraints);
        if (bestSemester) {
          bestSemester.courses.push({
            ...course,
            semesterId: bestSemester.id
          });
        }
      }
  
      return years;
    }
  
    private findBestSemester(
      course: Course, 
      years: AcademicYear[], 
      constraints: PlanConstraints
    ): Semester | null {
      for (const year of years) {
        for (const semester of year.semesters) {
          if (this.canAddCourseToSemester(course, semester, constraints)) {
            return semester;
          }
        }
      }
      return null;
    }
  
    private canAddCourseToSemester(
      course: Course, 
      semester: Semester, 
      constraints: PlanConstraints
    ): boolean {
      const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
      return currentCredits + course.credits <= constraints.maxCreditsPerSemester;
    }
  
    private initializeYears(): AcademicYear[] {
        const startYear = new Date().getFullYear();
        return ['Freshman', 'Sophomore', 'Junior', 'Senior'].map((yearName, index) => ({
          id: `year-${index}`,
          name: yearName,
          year: `${yearName} Year (${startYear + index}-${startYear + index + 1})`, // year 필드 추가
          startYear: startYear + index,
          yearName: yearName,
          semesters: ['Fall', 'Spring', 'Summer'].map(term => ({
            id: `${yearName.toLowerCase()}-${term.toLowerCase()}`,
            term,
            year: startYear + index,
            courses: [],
            academicYearId: `year-${index}`
          }))
        }));
      }
  }