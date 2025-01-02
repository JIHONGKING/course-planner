// src/types/course.ts

export interface GradeDistribution {
  A: string | number;
  AB: string | number;
  B: string | number;
  BC: string | number;
  C: string | number;
  D: string | number;
  F: string | number;
}

export interface FilterOptions {
  level: string;
  term: string;
  department: string;
  credits: string;
  requirements: string[];  // requirements를 필수 필드로 변경
}

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
  gradeDistribution: string | GradeDistribution;
}

export interface SemesterCourse extends Course {
  semesterId: string;
}


export interface Semester {
  id: string;
  year: number;
  term: string;
  courses: SemesterCourse[];
}


export interface AcademicYear {
  id: string;
  name: string;
  year: string;
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