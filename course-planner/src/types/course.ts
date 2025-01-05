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
  requirements: string[];  // requirements를 필수 필드로 변경
  page?: number; // 추가된 page 옵션
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  level: string;
  prerequisites: Prerequisite[];  // string[] 에서 Prerequisite[] 로 변경
  term: string[];
  gradeDistribution: string | GradeDistribution;
  createdAt?: string;
  updatedAt?: string;
}

export interface Prerequisite {
  courseId: string;       // 선수과목 ID
  type: 'required' | 'concurrent' | 'recommended';  // 필수, 동시수강가능, 권장
  grade?: string;         // 최소 학점 요구사항 (e.g., "C" 이상)
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
  courses: SemesterCourse[];
}


export interface AcademicYear {
  id: string;
  name: string;
  year: string;
  semesters: Semester[];
  yearName: string;  // 필드 추가
  startYear: number; 
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