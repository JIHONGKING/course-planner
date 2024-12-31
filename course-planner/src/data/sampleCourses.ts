// src/data/sampleCourses.ts
import type { Course } from '@/src/types/course';

export const sampleCourses: Course[] = [
  {
    id: 'cs300',
    code: 'COMP SCI 300',
    name: 'Programming II',
    description: 'Introduction to Object-Oriented Programming',
    credits: 3,
    gradeDistribution: {
      A: 45.2,
      AB: 30.1,
      B: 15.3,
      BC: 5.2,
      C: 2.1,
      D: 1.1,
      F: 1.0
    },
    prerequisites: [],
    term: ['Fall', 'Spring'],
    title: 'Programming II',
    department: 'COMP SCI',
    level: '300'
  },
  {
    id: 'cs400',
    code: 'COMP SCI 400',
    name: 'Programming III',
    description: 'Advanced Programming and Data Structures',
    credits: 3,
    gradeDistribution: {
      A: 38.5,
      AB: 28.3,
      B: 20.1,
      BC: 7.2,
      C: 3.8,
      D: 1.2,
      F: 0.9
    },
    prerequisites: [],
    term: ['Fall', 'Spring'],
    title: 'Programming II',
    department: 'COMP SCI',
    level: '300'
  },
  {
    id: 'cs540',
    code: 'COMP SCI 540',
    name: 'Introduction to Artificial Intelligence',
    description: 'Basic concepts and algorithms of artificial intelligence',
    credits: 3,
    gradeDistribution: {
      A: 42.1,
      AB: 31.2,
      B: 16.4,
      BC: 5.8,
      C: 2.9,
      D: 1.0,
      F: 0.6
    },
    prerequisites: [],
    term: ['Fall', 'Spring'],
    title: 'Programming II',
    department: 'COMP SCI',
    level: '300'
  },
  {
    id: 'cs577',
    code: 'COMP SCI 577',
    name: 'Introduction to Algorithms',
    description: 'Design and analysis of computer algorithms',
    credits: 4,
    gradeDistribution: {
      A: 35.5,
      AB: 25.3,
      B: 22.1,
      BC: 10.2,
      C: 4.8,
      D: 1.2,
      F: 0.9
    },
    prerequisites: [],
    term: ['Fall', 'Spring'],
    title: 'Programming II',
    department: 'COMP SCI',
    level: '300'
  },
  {
    id: 'math222',
    code: 'MATH 222',
    name: 'Calculus and Analytic Geometry II',
    description: 'Continuation of MATH 221',
    credits: 4,
    gradeDistribution: {
      A: 32.5,
      AB: 27.3,
      B: 23.1,
      BC: 9.2,
      C: 5.8,
      D: 1.2,
      F: 0.9
    },
    prerequisites: [],
    term: ['Fall', 'Spring'],
    title: 'Programming II',
    department: 'COMP SCI',
    level: '300'
  },
  {
    id: 'stat324',
    code: 'STAT 324',
    name: 'Introductory Applied Statistics for Engineers',
    description: 'Statistical methods for engineering applications',
    credits: 3,
    gradeDistribution: {
      A: 36.5,
      AB: 29.3,
      B: 20.1,
      BC: 8.2,
      C: 3.8,
      D: 1.2,
      F: 0.9
    },
    prerequisites: [],
    term: ['Fall', 'Spring'],
    title: 'Programming II',
    department: 'COMP SCI',
    level: '300'
  }
];

// Function to generate more sample courses if needed
export const generateMoreCourses = (): Course[] => {
  const departments = ['COMP SCI', 'MATH', 'STAT', 'ECE'];
  const courses: Course[] = [...sampleCourses];

  departments.forEach((dept, deptIndex) => {
    for (let i = 1; i <= 5; i++) {
      const courseNumber = 300 + i * 50 + deptIndex * 10;
      courses.push({
        id: `${dept.toLowerCase()}-${courseNumber}`,
        code: `${dept} ${courseNumber}`,
        name: `Sample ${dept} Course ${i}`,
        description: `This is a sample ${dept} course description`,
        credits: 3,
        gradeDistribution: {
          A: 40 + Math.random() * 20,
          AB: 25 + Math.random() * 15,
          B: 15 + Math.random() * 10,
          BC: 5 + Math.random() * 5,
          C: 2 + Math.random() * 3,
          D: 1 + Math.random() * 2,
          F: Math.random() * 2
        },
        prerequisites: [],
    term: ['Fall', 'Spring'],
    title: 'Programming II',
    department: 'COMP SCI',
    level: '300'
  });
    }
  });

  return courses;
};