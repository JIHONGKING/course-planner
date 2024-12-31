// prisma/seed.ts
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제
  await prisma.course.deleteMany();

  // 과목 데이터 생성
  const courses = [
    {
      code: 'COMP SCI 300',
      name: 'Programming II',
      description: 'Introduction to Object-Oriented Programming',
      credits: 3.0,
      department: 'COMP SCI',
      level: '300',
      prerequisites: [],
      term: ['Fall', 'Spring'],
      gradeDistribution: {
        A: 45.2,
        AB: 30.1,
        B: 15.3,
        BC: 5.2,
        C: 2.1,
        D: 1.1,
        F: 1.0
      }
    },
    {
      code: 'COMP SCI 400',
      name: 'Programming III',
      description: 'Advanced Programming and Data Structures',
      credits: 3.0,
      department: 'COMP SCI',
      level: '400',
      prerequisites: ['COMP SCI 300'],
      term: ['Fall', 'Spring'],
      gradeDistribution: {
        A: 38.5,
        AB: 28.3,
        B: 20.1,
        BC: 7.2,
        C: 3.8,
        D: 1.2,
        F: 0.9
      }
    },
    {
      code: 'COMP SCI 540',
      name: 'Introduction to Artificial Intelligence',
      description: 'Basic concepts and algorithms of artificial intelligence',
      credits: 3.0,
      department: 'COMP SCI',
      level: '500',
      prerequisites: ['COMP SCI 400'],
      term: ['Fall', 'Spring'],
      gradeDistribution: {
        A: 42.1,
        AB: 31.2,
        B: 16.4,
        BC: 5.8,
        C: 2.9,
        D: 1.0,
        F: 0.6
      }
    },
    {
      code: 'MATH 221',
      name: 'Calculus and Analytic Geometry 1',
      description: 'Functions, limits, continuity, differentiation, integration',
      credits: 5.0,
      department: 'MATH',
      level: '200',
      prerequisites: [],
      term: ['Fall', 'Spring'],
      gradeDistribution: {
        A: 32.5,
        AB: 27.3,
        B: 23.1,
        BC: 9.2,
        C: 5.8,
        D: 1.2,
        F: 0.9
      }
    }
  ];

  for (const course of courses) {
    await prisma.course.create({
      data: {
        ...course,
        gradeDistribution: JSON.stringify(course.gradeDistribution)
      }
    });
  }

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });