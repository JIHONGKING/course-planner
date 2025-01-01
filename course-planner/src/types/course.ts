// src/types/course.ts

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  level: string;
  prerequisites: string[];
  term: string[];
  gradeDistribution: string;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  term: 'Fall' | 'Spring' | 'Summer';
  year: number;
  courses: Course[];
}

export interface AcademicYear {
  id: string;
  startYear: number;
  yearName: string;
  semesters: Semester[];
}

export interface AcademicPlan {
  id: string;
  userId: string;
  years: AcademicYear[];
  savedCourses: Course[];
}

export type ClassStanding = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';

export interface UserPreferences {
  school: string;
  major: string;
  classStanding: string;
  graduationYear: string;
  planningStrategy: 'GPA' | 'Workload' | 'Balance';
}