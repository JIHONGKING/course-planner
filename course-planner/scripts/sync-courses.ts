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

interface MadgradesCourse {
  uuid: string;
  number: number;
  name: string;
  subjects: Array<{
    code: string;
    name: string;
  }>;
  description?: string;
  code?: string;
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

async function migratePrerequisites() {
  console.log('Starting prerequisites migration...');
  const batchSize = 50;
  let processedCount = 0;
  let errorCount = 0;

  try {
    // 1. 모든 과목 가져오기
    const courses = await prisma.course.findMany();
    console.log(`Found ${courses.length} courses to process`);

    // 2. 각 과목의 선수과목 처리
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (course: Course) => {
        try {
          // 선수과목 추출
          const prerequisites = await extractPrerequisites(course.description);
          
          // 성적 분포 데이터 업데이트 (없는 경우)
          let gradeDistributionJson = '{}';
          if (!course.gradeDistribution || course.gradeDistribution === '{}') {
            const defaultGrades: GradeDistribution = {
              A: '0',
              AB: '0',
              B: '0',
              BC: '0',
              C: '0',
              D: '0',
              F: '0'
            };
            gradeDistributionJson = JSON.stringify(defaultGrades);
          } else {
            gradeDistributionJson = typeof course.gradeDistribution === 'string' 
              ? course.gradeDistribution 
              : JSON.stringify(course.gradeDistribution);
          }

          // 과목 정보 업데이트
          const updateData: Prisma.CourseUpdateInput = {
            prerequisites: prerequisites.map(p => p.courseId),
            gradeDistribution: gradeDistributionJson
          };

          await prisma.course.update({
            where: { id: course.id },
            data: updateData
          });

          // 누락된 선수과목 생성
          for (const prereq of prerequisites) {
            const existingPrereq = await prisma.course.findFirst({
              where: { code: prereq.courseId }
            });

            if (!existingPrereq) {
              const createData: Prisma.CourseCreateInput = {
                id: `temp-${prereq.courseId.replace(/\s+/g, '-')}`,
                code: prereq.courseId,
                name: `Temporary ${prereq.courseId}`,
                description: 'No description available',
                credits: 3,
                department: prereq.courseId.split(' ')[0],
                level: prereq.courseId.split(' ')[1].substring(0, 1) + '00',
                prerequisites: [],
                term: ['Fall', 'Spring'],
                gradeDistribution: '{}'
              };

              await prisma.course.create({ data: createData });
            }
          }

          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(`Processed ${processedCount}/${courses.length} courses`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error processing course ${course.code}:`, error);
        }
      }));

      // API 속도 제한 준수
      await new Promise(resolve => setTimeout(resolve, 1000));
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