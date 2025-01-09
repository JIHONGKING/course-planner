// src/lib/planGenerator.ts
import type { Course, AcademicPlan, AcademicYear, Semester } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';
import { validatePrerequisites } from '@/utils/prerequisiteUtils';

interface PlanPreferences {
  prioritizeGrades: boolean;     // 높은 학점 우선
  balanceWorkload: boolean;      // 워크로드 균형
  includeRequirements: boolean;  // 졸업 요건 고려
}

interface PlanConstraints {
  maxCreditsPerSemester: number;
  requiredCourses: string[];
  preferredTerms: { [courseId: string]: string[] };
}

export class PlanGenerator {
  private readonly TARGET_CREDITS = 15;
  private readonly MAX_CREDITS = 18;
  private readonly MIN_CREDITS = 12;

  generatePlan(
    courses: Course[],
    preferences: PlanPreferences,
    constraints: PlanConstraints
  ): AcademicPlan {
    // 1. 선수과목 순환 참조 검사
    if (this.checkCircularDependencies(courses)) {
      throw new Error('Circular dependencies detected in prerequisites');
    }

    // 2. 과목별 점수 계산 및 정렬
    const scoredCourses = this.calculateCourseScores(courses, preferences);
    
    // 3. 학기 초기화
    const years = this.initializeYears();
    const semesters = this.flattenSemesters(years);
    const completedCourses: Course[] = [];

    // 4. 과목 배치 (최적화된 알고리즘)
    this.distributeCourses(scoredCourses, semesters, completedCourses, constraints);

    // 5. 워크로드 밸런싱
    if (preferences.balanceWorkload) {
      this.balanceWorkload(semesters);
    }

    return {
      id: `plan-${Date.now()}`,
      userId: '',
      years,
      savedCourses: []
    };
  }

  private calculateCourseScores(courses: Course[], preferences: PlanPreferences): [Course, number][] {
    return courses.map(course => {
      let score = 0;

      // GPA 기반 점수
      if (preferences.prioritizeGrades) {
        const gradeA = parseFloat(getGradeA(course.gradeDistribution));
        score += gradeA * 2;
      }

      // 워크로드 기반 점수
      score += (this.TARGET_CREDITS - Math.abs(this.TARGET_CREDITS - course.credits)) * 1.5;

      // 선수과목 관계 점수
      const prereqCount = course.prerequisites.length;
      score -= prereqCount * 1.2; // 선수과목이 많을수록 먼저 배치되도록

      return [course, score] as [Course, number];
    }).sort((a, b) => b[1] - a[1]); // 높은 점수순 정렬
  }

  private distributeCourses(
    scoredCourses: [Course, number][],
    semesters: Semester[],
    completedCourses: Course[],
    constraints: PlanConstraints
  ): void {
    const remainingCourses = new Set(scoredCourses.map(([course]) => course));
    const maxCredits = constraints.maxCreditsPerSemester;

    // Convert Map iteration to Array
    Array.from(remainingCourses).forEach(course => {
      if (!remainingCourses.has(course)) return;

      // 배치 가능한 가장 이른 학기 찾기
      const bestSemester = this.findBestSemester(course, semesters, completedCourses);
      if (bestSemester) {
        bestSemester.courses.push(course);
        completedCourses.push(course);
        remainingCourses.delete(course);
      } else {
        console.warn(`Could not place course: ${course.code}`);
      }
    });
  }

  private findBestSemester(
    course: Course,
    semesters: Semester[],
    completedCourses: Course[]
  ): Semester | null {
    return semesters
      .filter(semester => {
        // 1. 학기 제공 여부
        if (!course.term.includes(semester.term)) return false;

        // 2. 학점 제한
        const currentCredits = this.calculateSemesterCredits(semester);
        if (currentCredits + course.credits > this.MAX_CREDITS) return false;

        // 3. 선수과목 이수 여부
        return this.canTakeCourse(course, completedCourses, {
          maxCreditsPerSemester: this.MAX_CREDITS,
          requiredCourses: [],
          preferredTerms: {}
        });
      })
      .sort((a, b) => {
        // 최적의 학기 선택 (학점 밸런스 고려)
        const creditsA = this.calculateSemesterCredits(a);
        const creditsB = this.calculateSemesterCredits(b);
        const diffA = Math.abs(this.TARGET_CREDITS - (creditsA + course.credits));
        const diffB = Math.abs(this.TARGET_CREDITS - (creditsB + course.credits));
        return diffA - diffB;
      })[0] || null;
  }

  private canTakeCourse(
    course: Course, 
    completedCourses: Course[],
    constraints: PlanConstraints
  ): boolean {
    // 선수과목 검사
    return course.prerequisites.every(prereq =>
      completedCourses.some(completed => completed.code === prereq.courseId)
    );
  }

  private balanceWorkload(semesters: Semester[]): void {
    let balanced = false;
    const maxIterations = 10;
    let iterations = 0;

    while (!balanced && iterations < maxIterations) {
      balanced = true;
      iterations++;

      for (let i = 0; i < semesters.length - 1; i++) {
        const currentCredits = this.calculateSemesterCredits(semesters[i]);
        const nextCredits = this.calculateSemesterCredits(semesters[i + 1]);
        const diff = currentCredits - nextCredits;

        if (Math.abs(diff) > 3) {
          this.balanceSemesters(semesters[i], semesters[i + 1]);
          balanced = false;
        }
      }
    }
  }

  private moveCourse(course: Course, fromSemester: Semester, toSemester: Semester): void {
    if (!this.canMoveCourse(course, toSemester)) {
      return;
    }
  
    // 기존 학기에서 과목 제거
    const courseIndex = fromSemester.courses.findIndex(c => c.id === course.id);
    if (courseIndex !== -1) {
      fromSemester.courses.splice(courseIndex, 1);
    }
  
    // 새 학기에 과목 추가
    toSemester.courses.push(course);
  }
  

  private balanceSemesters(semesterA: Semester, semesterB: Semester): void {
    const creditsA = this.calculateSemesterCredits(semesterA);
    const creditsB = this.calculateSemesterCredits(semesterB);

    if (Math.abs(creditsA - creditsB) <= 3) return;

    if (creditsA > creditsB) {
      // 과목 이동 시도
      for (const course of semesterA.courses) {
        if (this.canMoveCourse(course, semesterB)) {
          this.moveCourse(course, semesterA, semesterB);
          return;
        }
      }
    } else {
      // 반대 방향 이동
      for (const course of semesterB.courses) {
        if (this.canMoveCourse(course, semesterA)) {
          this.moveCourse(course, semesterB, semesterA);
          return;
        }
      }
    }
  }

  private canMoveCourse(course: Course, targetSemester: Semester): boolean {
    // 1. 학기 제공 여부
    if (!course.term.includes(targetSemester.term)) return false;

    // 2. 학점 제한
    const targetCredits = this.calculateSemesterCredits(targetSemester);
    if (targetCredits + course.credits > this.MAX_CREDITS) return false;

    return true;
  }

  private calculateSemesterCredits(semester: Semester): number {
    return semester.courses.reduce((sum, course) => sum + course.credits, 0);
  }

  private initializeYears(): AcademicYear[] {
    const startYear = new Date().getFullYear();
    const yearNames = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
    
    return yearNames.map((name, index) => ({
      id: `year-${index}`,
      name,
      yearName: name,
      year: `${name} Year`,
      startYear: startYear + index,
      semesters: ['Fall', 'Spring', 'Summer'].map(term => ({
        id: `${name.toLowerCase()}-${term.toLowerCase()}`,
        term,
        year: startYear + index,
        courses: [],
        academicYearId: `year-${index}`
      }))
    }));
  }

  private checkCircularDependencies(courses: Course[]): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (courseId: string): boolean => {
      if (recStack.has(courseId)) return true;
      if (visited.has(courseId)) return false;

      visited.add(courseId);
      recStack.add(courseId);

      const course = courses.find(c => c.id === courseId);
      if (course) {
        for (const prereq of course.prerequisites) {
          if (dfs(prereq.courseId)) return true;
        }
      }

      recStack.delete(courseId);
      return false;
    };

    return courses.some(course => dfs(course.id));
  }

  private flattenSemesters(years: AcademicYear[]): Semester[] {
    return years.flatMap(year => year.semesters);
  }
}