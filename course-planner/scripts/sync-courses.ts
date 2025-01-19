// scripts/sync-courses.ts
import { prisma } from '../src/lib/db';
import type { Prisma } from '@prisma/client';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  level: string;
  prerequisites: string[];
  term: string[];
  gradeDistribution: any;
}

interface GradeDistribution {
  A: string;
  AB: string;
  B: string;
  BC: string;
  C: string;
  D: string;
  F: string;
}

// 선수과목 추출 함수
async function extractPrerequisites(description: string): Promise<Array<{ courseId: string; type: 'required' }>> {
  const prerequisites = [];
  const pattern = /(?:Prerequisites?|Prereq):\s*([^.]+)/i;
  const match = description.match(pattern);

  if (match) {
    const text = match[1].trim();
    const coursePattern = /([A-Z]+(?:\s+[A-Z]+)*)\s+(\d{3})/g;
    let courseMatch;

    while ((courseMatch = coursePattern.exec(text)) !== null) {
      prerequisites.push({
        courseId: courseMatch[0],
        type: 'required' as const
      });
    }
  }

  return prerequisites;
}

// 성적 분포 기본값 생성 함수
function getDefaultGradeDistribution(): GradeDistribution {
  return {
    A: '0',
    AB: '0',
    B: '0',
    BC: '0',
    C: '0',
    D: '0',
    F: '0'
  };
}

// 선수과목 생성 함수
async function createMissingPrerequisite(courseId: string): Promise<void> {
  const existingPrereq = await prisma.course.findFirst({ where: { code: courseId } });

  if (!existingPrereq) {
    const createData: Prisma.CourseCreateInput = {
      id: `temp-${courseId.replace(/\s+/g, '-')}`,
      code: courseId,
      name: `Temporary ${courseId}`,
      description: 'No description available',
      credits: 3,
      department: courseId.split(' ')[0],
      level: courseId.split(' ')[1].substring(0, 1) + '00',
      prerequisites: [],
      term: ['Fall', 'Spring'],
      gradeDistribution: JSON.stringify(getDefaultGradeDistribution())
    };

    await prisma.course.create({ data: createData });
  }
}

// 마이그레이션 함수
async function migratePrerequisites() {
  console.log('Starting prerequisites migration...');
  const batchSize = 50;
  let processedCount = 0;
  let errorCount = 0;

  try {
    const courses = await prisma.course.findMany();
    console.log(`Found ${courses.length} courses to process`);

    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (course) => {
          try {
            const prerequisites = await extractPrerequisites(course.description || '');
            const gradeDistributionJson =
              course.gradeDistribution && course.gradeDistribution !== '{}'
                ? JSON.stringify(course.gradeDistribution)
                : JSON.stringify(getDefaultGradeDistribution());

            await prisma.course.update({
              where: { id: course.id },
              data: {
                prerequisites: prerequisites.map((p) => p.courseId),
                gradeDistribution: gradeDistributionJson
              }
            });

            // 누락된 선수과목 생성
            await Promise.all(
              prerequisites.map((prereq) => createMissingPrerequisite(prereq.courseId))
            );

            processedCount++;
            if (processedCount % 10 === 0) {
              console.log(`Processed ${processedCount}/${courses.length} courses`);
            }
          } catch (error) {
            errorCount++;
            console.error(`Error processing course ${course.code}:`, error);
          }
        })
      );

      // 속도 제한 준수
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('\nMigration completed:');
    console.log(`- Total courses processed: ${processedCount}`);
    console.log(`- Errors encountered: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
migratePrerequisites()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
