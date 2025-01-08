// src/types/graduation.ts

export interface CourseRequirement {
    courseId: string;
    required: boolean;
    grade?: string;
    alternatives?: string[];  // 대체 가능한 과목 코드들
    minimumGrade?: string;  // 옵셔널 필드 추가
  }
  
  export interface CategoryRequirement {
    name: string;
    courses: string[];
    requiredCredits: number;
    minimumGrade?: string;
  }
  
  export interface RequirementBase {
    id: string;
    name: string;
    description?: string;
  }
  
  // 졸업 요건 타입들
  export interface CreditRequirement extends RequirementBase {
    type: 'credits';
    totalCredits: number;
    minimumPerCategory?: Record<string, number>;  // { "COMP SCI": 40, "MATH": 15 }
  }
  
  export interface CoreRequirement extends RequirementBase {
    type: 'core';
    courses: CourseRequirement[];
  }
  
  export interface BreadthRequirement extends RequirementBase {
    type: 'breadth';
    categories: CategoryRequirement[];
    minimumCategories?: number;
  }
  
  export interface MajorRequirement extends RequirementBase {
    type: 'major';
    majorCode: string;
    requiredCourses: CourseRequirement[];
    electiveCourses: string[];
    electiveCredits: number;
    requiredCategories?: CategoryRequirement[];
  }
  
  export interface LevelRequirement extends RequirementBase {
    type: 'level';
    minimumUpperLevel: number;  // 300레벨 이상 최소 학점
    levels: Record<string, number>;  // { "300": 20, "400": 9 }
  }
  
  export interface GPARequirement extends RequirementBase {
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
  
  // 검증 결과 타입들
  export interface RequirementItem {
    name: string;
    satisfied: boolean;
    current: number;
    required: number;
  }
  
  export interface RequirementValidationResult {
    type: Requirement['type'];
    satisfied: boolean;
    current: number;
    required: number;
    details: {
      message: string;
      items: RequirementItem[];
    };
  }
  
  // 전체 졸업 요건
  export interface GraduationRequirements {
    major: string;
    requirements: Requirement[];
    concentrations?: {
      name: string;
      requirements: Requirement[];
    }[];
  }