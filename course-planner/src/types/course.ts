// src/types/course.ts

export interface GradeDistribution {
  A: string;
  AB: string;
  B: string;
  BC: string;
  C: string;
  D: string;
  F: string;
}

export interface FilterOptions {
  level: string;
  term: string;
  department: string;
  credits: string;
  requirements: string[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  level: string;
  prerequisites: Prerequisite[];
  term: string[];
  gradeDistribution: string | GradeDistribution;
  createdAt?: string;
  semesterId?: string;  // 추가
  updatedAt?: string;
}

export interface Prerequisite {
  courseId: string;
  type: 'required' | 'concurrent' | 'recommended';
  grade?: string;
}

export interface PrerequisiteValidation {
  isValid: boolean;
  missingPrerequisites: Prerequisite[];
  message: string;
}

export interface SemesterCourse extends Course {
  semesterId: string;
}


export interface Semester {
  id: string;
  year: number;
  term: string;
  courses: Course[];
  academicYearId: string;
}


export interface AcademicYear {
  id: string;
  name: string;      // Freshman, Sophomore, etc.
  yearName: string;  // Display name
  year: string;      // e.g., "2023-2024"
  startYear: number; // e.g., 2023
  semesters: Semester[];
}

export interface AcademicPlan {
  id: string;
  userId: string;
  years: AcademicYear[];
  savedCourses: Course[];
}

export interface PlanningPreferences {
  prioritizeGrades: boolean;
  balanceWorkload: boolean;
  includeRequirements: boolean;
}

export type ClassStanding = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';

export interface UserPreferences {
  school: string;
  major: string;
  classStanding: string;
  graduationYear: string;
  planningStrategy: 'GPA' | 'Workload' | 'Balance';
}