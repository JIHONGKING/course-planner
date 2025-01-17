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
  courseSchedules: CourseSchedule[];
  createdAt?: string;
  updatedAt?: string;
  semesterId?: string;
}

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface CourseSchedule {
  id?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  courseId?: string;
  endTime: string;
}

export interface Prerequisite {
  courseId: string;
  type: 'required' | 'concurrent' | 'recommended';
  grade?: string;
}

export interface ValidationResult {
  isValid: boolean;
  conflicts: {
    course1: Course;
    course2: Course;
    overlappingSlots: {
      slot1: CourseSchedule;
      slot2: CourseSchedule;
    };
  }[];
  messages: string[];
  totalCredits: number;
}


export interface Schedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  yearName: string;  // Display name
  year: string;      // e.g., "2023-2024"
  startYear: number; // e.g., 2023
  semesters: Semester[];
}

export interface Semester {
  id: string;
  term: string;
  year: number;
  courses: Course[];
  academicYearId: string;
}

export interface AcademicPlan {
  id: string;
  userId: string;
  years: AcademicYear[];
  savedCourses: Course[];
}

export interface UserPreferences {
  school: string;
  major: string;
  classStanding: string;
  graduationYear: string;
  planningStrategy: 'GPA' | 'Workload' | 'Balance';
}