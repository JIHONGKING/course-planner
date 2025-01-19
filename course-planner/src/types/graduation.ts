// src/types/graduation.ts


export interface RequirementCriteria {
  id: string;
  name: string;
  type: 'credits' | 'courses' | 'gpa' | 'distribution';
  required: number;
  courseId?: string;
  alternatives?: string[];
  minimumCredits?: number;
  description?: string;
}



export interface GraduationRequirement {
  id: string;
  name: string;
  totalCredits: number;       
  minimumGPA: number;         
  requiredCredits: number;
  requiredGPA: number;
  distribution: {
    [department: string]: number;
  };
  coreCourses: CoreCourse[];
  requirements?: RequirementType[]; // requirementTypes를 requirements로 변경
}


export interface CoreCourse {
  code: string;
  name: string;
  required: boolean;
}


export interface RequirementProgress {
  criteriaId: string;
  current: number;
  required: number;
  completed: boolean;
  courses?: string[];  // 해당 요건에 적용된 과목들
}

export interface GraduationProgress {
  totalCredits: number;
  currentGPA: number;
  completedRequirements: RequirementProgress[];
  remainingRequirements: RequirementProgress[];
  isComplete: boolean;
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
  id: string;
  name: string;
  courseId: string;
  type: 'required' | 'recommended';
  minimumCredits?: number;
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
  type: string;
  satisfied: boolean;
  current: number;
  required: number;
  details: {
    message: string;
    items: RequirementItem[];
  };
}
