// src/types/graduation.ts

export interface GraduationRequirements {
  totalCredits: number;
  coreCourses: Array<{
    code: string;
    name: string;
  }>;
  minimumGPA: number;
  distribution: {
    [department: string]: number;
  };
  requirements?: RequirementType[];
}

export interface DistributionRequirement extends RequirementBase {
  type: 'distribution';
  categories: {
    name: string;
    required: number;
  }[];
  minimumCategories?: number;
}

export type RequirementType =
  | CreditRequirement
  | CoreRequirement
  | BreadthRequirement
  | MajorRequirement
  | LevelRequirement
  | GPARequirement
  | DistributionRequirement;

  export interface RequirementBase {
    id: string;
    type: 'credits' | 'core' | 'breadth' | 'major' | 'level' | 'gpa' | 'distribution';
    name: string;
    description?: string;
  }

export interface CreditRequirement extends RequirementBase {
  type: 'credits';
  totalCredits: number;
  minimumPerCategory?: Record<string, number>;
}

export interface CourseRequirement {
  courseId: string;
  required: boolean;
  alternatives?: string[];
  minimumGrade?: string;
}

export interface CoreRequirement extends RequirementBase {
  type: 'core';
  courses: CourseRequirement[];
}

export interface CategoryRequirement {
  name: string;
  courses: string[];
  requiredCredits: number;
  minimumGrade?: string;
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
  minimumUpperLevel: number;
  levels: Record<string, number>;
}

export interface GPARequirement extends RequirementBase {
  type: 'gpa';
  minimumGPA: number;
  minimumMajorGPA?: number;
}

export interface RequirementItem {
  name: string;
  satisfied: boolean;
  current: number;
  required: number;
}

export interface RequirementValidationResult {
  type: RequirementType['type'];
  satisfied: boolean;
  current: number;
  required: number;
  details: {
    message: string;
    items: RequirementItem[];
  };
}