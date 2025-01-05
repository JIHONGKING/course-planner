// src/lib/prerequisites.ts
import prisma from '@/lib/prisma';
import type { Course, Prerequisite } from '@/types/course';

interface PrerequisitePattern {
  pattern: RegExp;
  type: 'required' | 'concurrent' | 'recommended';
}

const PREREQUISITE_PATTERNS: PrerequisitePattern[] = [
  {
    pattern: /(?:Prerequisites?|Prereq):\s*([^.]+)/i,
    type: 'required'
  },
  {
    pattern: /Concurrent Registration:\s*([^.]+)/i,
    type: 'concurrent'
  },
  {
    pattern: /Recommended:\s*([^.]+)/i,
    type: 'recommended'
  }
];

const COURSE_CODE_PATTERN = /([A-Z]+(?:\s+[A-Z]+)*)\s+(\d{3})/g;
const GRADE_REQUIREMENT_PATTERN = /grade of ([A-F])(?: or better)?/i;

export function extractPrerequisites(description: string): Prerequisite[] {
  const prerequisites: Prerequisite[] = [];
  
  for (const { pattern, type } of PREREQUISITE_PATTERNS) {
    const match = description.match(pattern);
    if (match) {
      const text = match[1].trim();
      let courseMatch;
      
      while ((courseMatch = COURSE_CODE_PATTERN.exec(text)) !== null) {
        const courseCode = courseMatch[0];
        const gradeMatch = text.match(new RegExp(`${courseCode}[^.]*${GRADE_REQUIREMENT_PATTERN.source}`, 'i'));
        
        prerequisites.push({
          courseId: courseCode,
          type: type,
          grade: gradeMatch ? gradeMatch[1].toUpperCase() : undefined
        });
      }
    }
  }

  return prerequisites;
}

export async function syncPrerequisites(course: Course) {
  try {
    const prerequisites = extractPrerequisites(course.description);
    
    // 과목의 prerequisites 필드 업데이트
    await prisma.course.update({
      where: { id: course.id },
      data: {
        prerequisites: prerequisites.map(p => p.courseId)
      }
    });

    // 선수과목들이 DB에 존재하는지 확인하고 없으면 생성
    for (const prereq of prerequisites) {
      await prisma.course.upsert({
        where: { code: prereq.courseId },
        create: {
          id: `temp-${prereq.courseId}`,
          code: prereq.courseId,
          name: `Temporary ${prereq.courseId}`,
          description: 'Temporary prerequisite course',
          credits: 3,
          department: prereq.courseId.split(' ')[0],
          level: prereq.courseId.split(' ')[1].substring(0, 1) + '00',
          prerequisites: [],
          term: ['Fall', 'Spring'],
          gradeDistribution: '{}'
        },
        update: {}
      });
    }

    return prerequisites;
  } catch (error) {
    console.error('Error syncing prerequisites:', error);
    return [];
  }
}

export async function validatePrerequisites(
  courseId: string,
  completedCourseIds: string[]
): Promise<{ isValid: boolean; missingPrerequisites: string[] }> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const missingPrerequisites = course.prerequisites
      .filter(prereqId => !completedCourseIds.includes(prereqId));

    return {
      isValid: missingPrerequisites.length === 0,
      missingPrerequisites
    };
  } catch (error) {
    console.error('Error validating prerequisites:', error);
    return { isValid: false, missingPrerequisites: [] };
  }
}