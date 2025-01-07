// src/utils/prerequisiteUtils.ts

import type { Course, Prerequisite } from '@/types/course';

interface ValidationContext {
  completedCourses: Course[];
  currentTermCourses: Course[];
  term: string;
}

interface ValidationResult {
  isValid: boolean;
  messages: string[];
  missingPrerequisites: Prerequisite[];
}

/**
 * 순환 참조 검사
 */
export function checkCircularDependencies(courses: Course[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(courseId: string): boolean {
    if (recursionStack.has(courseId)) {
      return true; // 순환 참조 발견
    }

    if (visited.has(courseId)) {
      return false;
    }

    visited.add(courseId);
    recursionStack.add(courseId);

    const course = courses.find(c => c.id === courseId);
    if (course) {
      for (const prereq of course.prerequisites) {
        if (dfs(prereq.courseId)) {
          return true;
        }
      }
    }

    recursionStack.delete(courseId);
    return false;
  }

  return courses.some(course => dfs(course.id));
}

/**
 * 선수과목 관계를 파싱하고 검증
 */
export function parseAndValidatePrerequisites(
  description: string,
  existingCourses: Course[]
): Prerequisite[] {
  const prerequisites: Prerequisite[] = [];
  
  // "Prerequisites:" 또는 "Prereq:" 패턴 매칭
  const prereqMatch = description.match(/(?:Prerequisites?|Prereq):([^.]+)/i);
  if (!prereqMatch) return prerequisites;

  const prereqText = prereqMatch[1].trim();
  
  // AND/OR 조건 파싱
  const orGroups = prereqText.split(/\s+or\s+/i);
  
  orGroups.forEach(group => {
    const andCourses = group.split(/\s+and\s+/i);
    
    andCourses.forEach(courseText => {
      // 과목 코드 매칭 (예: "COMP SCI 300" 또는 "MATH 222")
      const courseMatch = courseText.match(/([A-Z]+ [A-Z]+) (\d{3})/);
      if (courseMatch) {
        const courseCode = courseMatch[0];
        
        // 과목이 실제로 존재하는지 확인
        const exists = existingCourses.some(c => c.code === courseCode);
        
        // 성적 요구사항 파싱
        const gradeMatch = courseText.match(/grade of ([A-F])/i);
        
        prerequisites.push({
          courseId: courseCode,
          type: courseText.toLowerCase().includes('recommended') ? 'recommended' : 'required',
          grade: gradeMatch ? gradeMatch[1].toUpperCase() : undefined
        });
      }
    });
  });

  return prerequisites;
}

/**
 * 선수과목 이수 가능 여부 검증
 */
export function validatePrerequisites(
  course: Course,
  context: ValidationContext
): ValidationResult {
  const missingPrerequisites: Prerequisite[] = [];
  const messages: string[] = [];

  // 1. 학기 제공 여부 확인
  if (!course.term.includes(context.term)) {
    messages.push(`This course is not offered in ${context.term} term`);
  }

  // 2. 선수과목 검증
  for (const prereq of course.prerequisites) {
    const isCompleted = context.completedCourses.some(c => c.code === prereq.courseId);
    const isInProgress = context.currentTermCourses.some(c => c.code === prereq.courseId);

    // 필수 선수과목 검증
    if (prereq.type === 'required' && !isCompleted && !isInProgress) {
      missingPrerequisites.push(prereq);
      messages.push(`Missing required prerequisite: ${prereq.courseId}`);
      if (prereq.grade) {
        messages.push(`Grade ${prereq.grade} or higher required for ${prereq.courseId}`);
      }
    }
    
    // 권장 선수과목 알림
    if (prereq.type === 'recommended' && !isCompleted && !isInProgress) {
      messages.push(`Recommended prerequisite: ${prereq.courseId}`);
    }
  }

  // 3. 동시 수강 과목 검증
  const concurrentPrereqs = course.prerequisites.filter(p => p.type === 'concurrent');
  for (const prereq of concurrentPrereqs) {
    const isTaking = context.currentTermCourses.some(c => c.code === prereq.courseId);
    const hasCompleted = context.completedCourses.some(c => c.code === prereq.courseId);
    
    if (!isTaking && !hasCompleted) {
      messages.push(`Must take ${prereq.courseId} concurrently or complete it first`);
    }
  }

  return {
    isValid: missingPrerequisites.length === 0,
    messages,
    missingPrerequisites
  };
}

/**
 * 선수과목 충족을 위한 최소 학기 수 계산
 */
export function calculateMinimumTerms(
  targetCourse: Course,
  allCourses: Course[]
): number {
  const visited = new Set<string>();
  const memo = new Map<string, number>();

  function dfs(courseId: string): number {
    if (visited.has(courseId)) {
      return memo.get(courseId) || 0;
    }

    visited.add(courseId);
    const course = allCourses.find(c => c.id === courseId);
    
    if (!course || course.prerequisites.length === 0) {
      memo.set(courseId, 1);
      return 1;
    }

    const prereqTerms = course.prerequisites
      .filter(p => p.type === 'required')
      .map(p => dfs(p.courseId));

    const maxPrereqTerms = Math.max(0, ...prereqTerms);
    const terms = maxPrereqTerms + 1;
    
    memo.set(courseId, terms);
    return terms;
  }

  return dfs(targetCourse.id);
}