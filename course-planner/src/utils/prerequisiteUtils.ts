// src/utils/prerequisiteUtils.ts
import type { Course, Prerequisite, PrerequisiteValidation } from '@/types/course';
import prisma from '@/lib/prisma';

interface PrerequisiteRecord {
  courseId: string;
  prerequisiteId: string;
  type: string;
  minGrade?: string;
}

export async function fetchPrerequisites(courseId: string) {
    try {
      // Updated to use prerequisites field from Course table
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });
  
      if (!course) return [];
  
      return course.prerequisites.map(prerequisiteId => ({
        courseId: prerequisiteId,
        type: 'required' as const,
        grade: undefined,
        // Additional course details would need to be fetched separately
      }));
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
      return [];
    }
  }

  export function parsePrerequisitesFromDescription(description: string): Prerequisite[] {
    const prerequisites: Prerequisite[] = [];
    
    // "Prerequisites:" 또는 "Prereq:" 다음에 오는 텍스트 찾기
    const prereqMatch = description.match(/(?:Prerequisites?|Prereq):([^.]+)/i);
    
    if (prereqMatch) {
      const prereqText = prereqMatch[1].trim();
      
      // 과목 코드 패턴 (예: "COMP SCI 300" 또는 "MATH 222")
      const coursePattern = /([A-Z]+ [A-Z]+) (\d{3})/g;
      
      // 모든 과목 코드 매칭
      let match;
      while ((match = coursePattern.exec(prereqText)) !== null) {
        const courseCode = match[0];
        const isRequired = !prereqText.includes(`recommended: ${courseCode}`);
        
        prerequisites.push({
          courseId: courseCode,
          type: isRequired ? 'required' : 'recommended',
          grade: prereqText.includes('grade of') ? parseGradeRequirement(prereqText) : undefined
        });
      }
    }
    
    return prerequisites;
  }
  
  function parseGradeRequirement(text: string): string | undefined {
    const gradeMatch = text.match(/grade of ([A-F])/i);
    return gradeMatch ? gradeMatch[1].toUpperCase() : undefined;
  }

export async function syncPrerequisitesWithDatabase(course: Course): Promise<Prerequisite[]> {
  try {
    // Update the course's prerequisites field directly
    await prisma.course.update({
      where: { id: course.id },
      data: {
        prerequisites: {
          set: course.prerequisites.map(p => p.courseId)
        }
      }
    });

    return course.prerequisites;
  } catch (error) {
    console.error('Error syncing prerequisites:', error);
    return [];
  }
}

export function validatePrerequisites(
  course: Course,
  completedCourses: Course[],
  currentTermCourses: Course[]
): PrerequisiteValidation {
  const missingPrerequisites: Prerequisite[] = [];
  let isValid = true;

  for (const prereq of course.prerequisites) {
    const isCompleted = completedCourses.some(c => c.id === prereq.courseId);
    const isConcurrent = currentTermCourses.some(c => c.id === prereq.courseId);

    if (!isCompleted && (prereq.type === 'required' && !isConcurrent)) {
      isValid = false;
      missingPrerequisites.push(prereq);
    }
  }

  let message = isValid 
    ? 'All prerequisite requirements are met.' 
    : 'The following prerequisites are needed:';

  if (!isValid) {
    const missingCoursesList = missingPrerequisites
      .map(p => `• ${p.courseId} (${p.type === 'required' ? 'Required' : 'Recommended'})`)
      .join('\n');
    message += '\n' + missingCoursesList;
  }

      return {
    isValid,
    missingPrerequisites,
    message
  };
}

/**
 * 현재 학기에 수강 가능한 과목인지 확인합니다.
 */
export function canTakeCourse(
  course: Course,
  completedCourses: Course[],
  currentTermCourses: Course[],
  term: string
): {canTake: boolean; reason?: string} {
  // 학기 제공 여부 확인
  if (!course.term.includes(term)) {
    return {
      canTake: false,
      reason: `This course is not offered in ${term} term.`
    };
  }

  // 선수과목 검증
  const prereqValidation = validatePrerequisites(
    course,
    completedCourses,
    currentTermCourses
  );

  if (!prereqValidation.isValid) {
    return {
      canTake: false,
      reason: prereqValidation.message
    };
  }

  return { canTake: true };
}