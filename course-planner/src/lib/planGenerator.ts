// src/lib/planGenerator.ts

import type { Course, AcademicPlan, AcademicYear, Semester, GradeDistribution } from '@/types/course';

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

interface CourseNode {
  course: Course;
  score: number;
  dependents: Set<string>;
  prerequisites: Set<string>;
}

export class PlanGenerator {
  private readonly TARGET_CREDITS_PER_SEMESTER = 15;
  private readonly MIN_CREDITS_PER_SEMESTER = 12;
  private readonly MAX_CREDITS_PER_SEMESTER = 18;
  private readonly COURSE_GRAPH: Map<string, CourseNode> = new Map();

  generatePlan(
    courses: Course[],
    preferences: PlanPreferences,
    constraints: PlanConstraints
  ): AcademicPlan {
    // 1. 과목 그래프 구축
    this.buildCourseGraph(courses);

    // 2. 선수과목 분석 및 레벨 할당
    const courseLevels = this.assignCourseLevels();

    // 3. 과목 점수 계산 및 정렬
    const scoredCourses = this.scoreCourses(courses, preferences);

    // 4. 연도/학기 초기화
    const years = this.initializeYears();
    let currentYear = 0;
    let currentTerm = 0;

    // 5. 필수 과목 먼저 배치
    const requiredCourses = scoredCourses.filter(c => 
      constraints.requiredCourses.includes(c.course.code)
    );
    const electiveCourses = scoredCourses.filter(c => 
      !constraints.requiredCourses.includes(c.course.code)
    );

    // 6. 과목 배치
    [...requiredCourses, ...electiveCourses].forEach(({ course }) => {
      let placed = false;
      while (!placed && currentYear < years.length) {
        const semester = years[currentYear].semesters[currentTerm];
        
        if (this.canPlaceCourse(course, semester, years, constraints)) {
          semester.courses.push({
            ...course,
            semesterId: semester.id
          });
          placed = true;
        } else {
          currentTerm = (currentTerm + 1) % 3;
          if (currentTerm === 0) currentYear++;
        }
      }
    });

    // 7. 워크로드 밸런싱
    if (preferences.balanceWorkload) {
      this.balanceWorkload(years);
    }

    return {
      id: `plan-${Date.now()}`,
      userId: '',
      years,
      savedCourses: []
    };
  }

  private buildCourseGraph(courses: Course[]): void {
    // 그래프 초기화
    this.COURSE_GRAPH.clear();

    // 노드 생성
    courses.forEach(course => {
      this.COURSE_GRAPH.set(course.id, {
        course,
        score: 0,
        dependents: new Set(),
        prerequisites: new Set(course.prerequisites.map(p => p.courseId))
      });
    });

    // 의존성 관계 설정
    this.COURSE_GRAPH.forEach((node, courseId) => {
      node.prerequisites.forEach(prereqId => {
        const prereqNode = this.COURSE_GRAPH.get(prereqId);
        if (prereqNode) {
          prereqNode.dependents.add(courseId);
        }
      });
    });
  }

  private assignCourseLevels(): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const assignLevel = (courseId: string, level: number = 0) => {
      if (visited.has(courseId)) return;
      
      visited.add(courseId);
      levels.set(courseId, Math.max(level, levels.get(courseId) || 0));

      const node = this.COURSE_GRAPH.get(courseId);
      if (node) {
        node.dependents.forEach(depId => {
          assignLevel(depId, level + 1);
        });
      }
    };

    // 선수과목이 없는 과목부터 시작
    this.COURSE_GRAPH.forEach((node, courseId) => {
      if (node.prerequisites.size === 0) {
        assignLevel(courseId);
      }
    });

    return levels;
  }

  private scoreCourses(
    courses: Course[],
    preferences: PlanPreferences
  ): { course: Course; score: number }[] {
    return courses.map(course => ({
      course,
      score: this.calculateCourseScore(course, preferences)
    })).sort((a, b) => b.score - a.score);
  }

  private calculateCourseScore(course: Course, preferences: PlanPreferences): number {
    let score = 0;
    const node = this.COURSE_GRAPH.get(course.id);
    
    if (preferences.prioritizeGrades) {
      const gradeDistribution = typeof course.gradeDistribution === 'string'
        ? JSON.parse(course.gradeDistribution)
        : course.gradeDistribution;
      score += parseFloat(gradeDistribution.A) * 2;
    }

    if (preferences.includeRequirements && node) {
      // 선수과목이 많은 과목에 높은 점수
      score += node.prerequisites.size * 10;
      // 후속 과목이 많은 과목에 높은 점수
      score += node.dependents.size * 15;
    }

    // 기본 점수 (학점 기반)
    score += course.credits * 5;

    return score;
  }

  private canPlaceCourse(
    course: Course,
    semester: Semester,
    years: AcademicYear[],
    constraints: PlanConstraints
  ): boolean {
    // 1. 학기 제공 여부 확인
    if (!course.term.includes(semester.term)) return false;

    // 2. 학점 제한 확인
    const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
    if (currentCredits + course.credits > constraints.maxCreditsPerSemester) return false;

    // 3. 선수과목 이수 여부 확인
    const completedCourses = new Set(
      years.flatMap(y => y.semesters)
        .filter(s => s.id !== semester.id)
        .flatMap(s => s.courses)
        .map(c => c.code)
    );

    return course.prerequisites.every(prereq => completedCourses.has(prereq.courseId));
  }

  private balanceWorkload(years: AcademicYear[]): void {
    let balanced = false;
    const attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (!balanced && attempts < MAX_ATTEMPTS) {
      balanced = true;

      years.forEach(year => {
        year.semesters.forEach(semester => {
          const credits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
          
          if (credits < this.MIN_CREDITS_PER_SEMESTER || 
              credits > this.MAX_CREDITS_PER_SEMESTER) {
            balanced = false;
            this.rebalanceSemester(semester, years);
          }
        });
      });
    }
  }

  private rebalanceSemester(semester: Semester, years: AcademicYear[]): void {
    const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
    
    if (currentCredits > this.MAX_CREDITS_PER_SEMESTER) {
      // 과목 이동 시도
      const coursesToMove = semester.courses
        .filter(course => {
          const node = this.COURSE_GRAPH.get(course.id);
          return node && node.dependents.size === 0; // 후속 과목이 없는 과목 우선
        })
        .sort((a, b) => a.credits - b.credits);

      for (const course of coursesToMove) {
        const targetSemester = this.findBestSemesterForMove(course, years, semester);
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
    years: AcademicYear[],
    currentSemester: Semester
  ): Semester | null {
    return years
      .flatMap(y => y.semesters)
      .filter(s => s.id !== currentSemester.id)
      .filter(s => this.canPlaceCourse(course, s, years, {
        maxCreditsPerSemester: this.MAX_CREDITS_PER_SEMESTER,
        requiredCourses: [],
        preferredTerms: {}
      }))
      .sort((a, b) => {
        const creditsA = a.courses.reduce((sum, c) => sum + c.credits, 0);
        const creditsB = b.courses.reduce((sum, c) => sum + c.credits, 0);
        return creditsA - creditsB;
      })[0] || null;
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
}