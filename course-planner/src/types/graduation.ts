// src/types/graduation.ts

export type RequirementType = 
  | 'credits'     // 총 학점
  | 'core'        // 핵심 과목
  | 'breadth'     // 폭넓은 학습
  | 'major'       // 전공 요구사항
  | 'level'       // 수준별 요구사항
  | 'gpa';        // 평점 요구사항

export interface CourseRequirement {
  courseId: string;
  required: boolean;
  alternatives?: string[];  // 대체 가능한 과목 목록
  minimumGrade?: string;   // 최소 성적 요구사항
}

export interface CreditRequirement {
  type: 'credits';
  totalCredits: number;
  minimumPerCategory?: {
    [category: string]: number;
  };
}

export interface CoreRequirement {
  type: 'core';
  courses: CourseRequirement[];
}

export interface BreadthRequirement {
  type: 'breadth';
  categories: {
    name: string;
    requiredCredits: number;
    courses: string[];
  }[];
}

export interface MajorRequirement {
  type: 'major';
  name: string;
  requiredCredits: number;
  requiredCourses: CourseRequirement[];
  electiveCredits: number;
  electiveCourses: string[];
}

export interface LevelRequirement {
  type: 'level';
  minimumUpperLevel: number;  // 상위 레벨 최소 학점
  levels: {
    [level: string]: number;
  };
}

export interface GPARequirement {
  type: 'gpa';
  minimumGPA: number;
  minimumMajorGPA?: number;
}

export type Requirement =
  | CreditRequirement
  | CoreRequirement
  | BreadthRequirement
  | MajorRequirement
  | LevelRequirement
  | GPARequirement;

export interface GraduationRequirements {
  major: string;
  requirements: Requirement[];
}

export interface RequirementValidationResult {
  type: RequirementType;
  satisfied: boolean;
  current: number;
  required: number;
  details: {
    message: string;
    items?: {
      name: string;
      satisfied: boolean;
      current: number;
      required: number;
    }[];
  };
}