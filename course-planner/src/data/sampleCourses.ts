// src/data/sampleCourses.ts
import type { Course } from '@/types/course';

export const sampleCourses: Course[] = [
  {
    id: 'cs300',
    code: 'COMP SCI 300',
    name: 'Programming II',
    description: 'Introduction to Object-Oriented Programming',
    credits: 3,
    department: 'COMP SCI',
    level: '300',
    prerequisites: [],
    term: ['Fall', 'Spring'],
    courseSchedules: [
      {
        id: 'cs300-mon',
        dayOfWeek: 'MON',
        startTime: '09:00',
        endTime: '09:50',
        courseId: 'cs300'
      },
      {
        id: 'cs300-wed',
        dayOfWeek: 'WED',
        startTime: '09:00',
        endTime: '09:50',
        courseId: 'cs300'
      }
    ],
    gradeDistribution: JSON.stringify({
      A: '45.2',
      AB: '30.1',
      B: '15.3',
      BC: '5.2',
      C: '2.1',
      D: '1.1',
      F: '1.0'
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function generateMoreCourses(): Course[] {
  const departments = ['COMP SCI', 'MATH', 'STAT', 'ECE'];
  const courses: Course[] = [...sampleCourses];

  departments.forEach((dept, deptIndex) => {
    for (let i = 1; i <= 5; i++) {
      const courseNumber = 300 + i * 50 + deptIndex * 10;
      const courseId = `${dept.toLowerCase()}-${courseNumber}`;
      courses.push({
        id: courseId,
        code: `${dept} ${courseNumber}`,
        name: `Sample ${dept} Course ${i}`,
        description: `This is a sample ${dept} course description`,
        credits: 3,
        department: dept,
        level: String(Math.floor(courseNumber / 100) * 100),
        prerequisites: [],
        term: ['Fall', 'Spring'],
        courseSchedules: [
          {
            id: `${courseId}-mon`,
            dayOfWeek: 'MON',
            startTime: '09:00',
            endTime: '09:50',
            courseId: courseId
          }
        ],
        gradeDistribution: JSON.stringify({
          A: String(40 + Math.random() * 20),
          AB: String(25 + Math.random() * 15),
          B: String(15 + Math.random() * 10),
          BC: String(5 + Math.random() * 5),
          C: String(2 + Math.random() * 3),
          D: String(1 + Math.random() * 2),
          F: String(Math.random() * 2)
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  return courses;
}