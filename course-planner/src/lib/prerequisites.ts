// src/lib/prerequisites.ts

import { PrismaClient } from '@prisma/client';
import type { Course, Prerequisite } from '@/types/course';

const prisma = new PrismaClient();

interface ValidationResult {
  isValid: boolean;
  messages: string[];
  missingPrerequisites: Prerequisite[];
}

export function validatePrerequisites(
  course: Course,
  completedCourses: Course[],
  currentTermCourses: Course[] = []
): ValidationResult {
  const missingPrerequisites: Prerequisite[] = [];
  const messages: string[] = [];

  for (const prereq of course.prerequisites) {
    const isCompleted = completedCourses.some(c => c.code === prereq.courseId);
    const isInProgress = currentTermCourses.some(c => c.code === prereq.courseId);

    if (!isCompleted && !isInProgress) {
      missingPrerequisites.push(prereq);
      messages.push(`Missing prerequisite: ${prereq.courseId}${prereq.grade ? ` (minimum grade: ${prereq.grade})` : ''}`);
    }
  }

  return {
    isValid: missingPrerequisites.length === 0,
    messages,
    missingPrerequisites
  };
}

export async function syncPrerequisitesWithDatabase(course: Course): Promise<void> {
  if (!prisma) {
    throw new Error('Prisma client is not initialized');
  }

  try {
    await prisma.coursePrerequisite.deleteMany({
      where: { courseId: course.id }
    });

    for (const prereq of course.prerequisites) {
      await prisma.coursePrerequisite.create({
        data: {
          courseId: course.id,
          prerequisiteId: prereq.courseId,
          type: prereq.type
        }
      });
    }
  } catch (error) {
    console.error('Failed to sync prerequisites:', error);
    throw error;
  }
}

export function canTakeCourse(
  course: Course,
  completedCourses: Course[],
  currentTermCourses: Course[],
  term: string
): {
  canTake: boolean;
  reason?: string;
} {
  // 학기 제공 여부 확인
  if (!course.term.includes(term)) {
    return {
      canTake: false,
      reason: `This course is not offered in ${term}`
    };
  }

  // 이미 수강한 과목인지 확인
  if (completedCourses.some(c => c.code === course.code)) {
    return {
      canTake: false,
      reason: 'You have already completed this course'
    };
  }

  // 현재 학기에 이미 등록되어 있는지 확인
  if (currentTermCourses.some(c => c.code === course.code)) {
    return {
      canTake: false,
      reason: 'This course is already in your current term'
    };
  }

  // 선수과목 검증
  const prereqValidation = validatePrerequisites(course, completedCourses, currentTermCourses);
  if (!prereqValidation.isValid) {
    return {
      canTake: false,
      reason: prereqValidation.messages.join(', ')
    };
  }

  return { canTake: true };
}

export function parsePrerequisitesFromDescription(description: string): Prerequisite[] {
  const prerequisites: Prerequisite[] = [];
  const pattern = /(?:Prerequisites?|Prereq):\s*([^.]+)/i;
  const match = description.match(pattern);
  
  if (match) {
    const prereqText = match[1].trim();
    const coursePattern = /([A-Z]+(?:\s+[A-Z]+)*)\s+(\d{3})(?:\s*\(([A-F])\))?/g;
    let courseMatch;
    
    while ((courseMatch = coursePattern.exec(prereqText)) !== null) {
      prerequisites.push({
        courseId: courseMatch[1] + ' ' + courseMatch[2],
        type: 'required',
        grade: courseMatch[3] // Optional grade requirement
      });
    }
  }
  
  return prerequisites;
}

export function getPrerequisiteChain(course: Course, allCourses: Course[]): Course[] {
  const chain: Course[] = [];
  const visited = new Set<string>();

  function traverse(currentCourse: Course) {
    if (visited.has(currentCourse.code)) return;
    visited.add(currentCourse.code);
    chain.push(currentCourse);

    for (const prereq of currentCourse.prerequisites) {
      const prereqCourse = allCourses.find(c => c.code === prereq.courseId);
      if (prereqCourse) {
        traverse(prereqCourse);
      }
    }
  }

  traverse(course);
  return chain;
}

export function checkCircularDependencies(courses: Course[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(courseCode: string): boolean {
    if (recursionStack.has(courseCode)) {
      return true;
    }

    if (visited.has(courseCode)) {
      return false;
    }

    visited.add(courseCode);
    recursionStack.add(courseCode);

    const course = courses.find(c => c.code === courseCode);
    if (course) {
      for (const prereq of course.prerequisites) {
        if (dfs(prereq.courseId)) {
          return true;
        }
      }
    }

    recursionStack.delete(courseCode);
    return false;
  }

  return courses.some(course => dfs(course.code));
}

export function calculateRequiredTerms(
  targetCourse: Course,
  allCourses: Course[]
): number {
  const visited = new Set<string>();
  const dp = new Map<string, number>();

  function dfs(courseCode: string): number {
    if (dp.has(courseCode)) {
      return dp.get(courseCode)!;
    }

    visited.add(courseCode);
    let maxPrereqTerms = 0;

    const course = allCourses.find(c => c.code === courseCode);
    if (course) {
      for (const prereq of course.prerequisites) {
        if (!visited.has(prereq.courseId)) {
          maxPrereqTerms = Math.max(maxPrereqTerms, dfs(prereq.courseId));
        }
      }
    }

    const terms = maxPrereqTerms + 1;
    dp.set(courseCode, terms);
    return terms;
  }

  return dfs(targetCourse.code);
}