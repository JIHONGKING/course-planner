// src/data/constants.ts

export const SCHOOLS = [
  { id: 'L&S', name: 'College of Letters & Science' },
  { id: 'ENGR', name: 'College of Engineering' },
  { id: 'BUS', name: 'School of Business' },
  { id: 'CDIS', name: 'School of Computer, Data & Information Sciences' },
  { id: 'EDUC', name: 'School of Education' },
  { id: 'CALS', name: 'College of Agricultural & Life Sciences' }
] as const;

export const MAJORS = {
  'CDIS': [
    { id: 'CS', name: 'Computer Sciences, BS' },
    { id: 'DS', name: 'Data Science, BS' },
    { id: 'IS', name: 'Information Science, BS' }
  ],
  'L&S': [
    { id: 'MATH', name: 'Mathematics, BS' },
    { id: 'STAT', name: 'Statistics, BS' },
    { id: 'ECON', name: 'Economics, BS' }
  ],
  'ENGR': [
    { id: 'ECE', name: 'Electrical Engineering, BS' },
    { id: 'ME', name: 'Mechanical Engineering, BS' }
  ]
} as const;

export const CLASS_STANDINGS = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior'
] as const;

export const PLANNING_STRATEGIES = [
  { id: 'GPA', name: 'Prioritize A Grade %' },
  { id: 'Workload', name: 'Balance Workload' },
  { id: 'Balance', name: 'Mix Required/Electives' }
] as const;

export const TERMS = ['Fall', 'Spring', 'Summer'] as const;

export const CREDITS_PER_SEMESTER = {
  min: 12,
  max: 18,
  recommended: 15
} as const;

export const COURSE_LEVELS = [
  { id: '100', name: 'Elementary' },
  { id: '200', name: 'Intermediate' },
  { id: '300', name: 'Intermediate' },
  { id: '400', name: 'Advanced' },
  { id: '500', name: 'Advanced' },
  { id: '600', name: 'Graduate' }
] as const;

export const DEPARTMENTS = [
  { id: 'COMP SCI', name: 'Computer Sciences' },
  { id: 'MATH', name: 'Mathematics' },
  { id: 'STAT', name: 'Statistics' },
  { id: 'ECE', name: 'Electrical and Computer Engineering' }
] as const;