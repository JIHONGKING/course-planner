// src/lib/madgrades.ts

export const DEPARTMENT_CODES: { [key: string]: string } = {
  '250': 'AFRICAN',
  '448': 'SCAND ST',
  '266': 'COMP SCI',
  '600': 'MATH',
  '146': 'CHEM',
  '205': 'PHYSICS',
  '200': 'STAT'
  // 추가 학과 코드들은 필요에 따라 추가
};

interface MadgradesGrades {
  aCount: number;
  abCount: number;
  bCount: number;
  bcCount: number;
  cCount: number;
  dCount: number;
  fCount: number;
  total: number;
}

export interface MadgradesCourse {
  uuid: string;
  number: number;
  name: string;
  subjects: Array<{
    code: string;
    name: string;
  }>;
  description?: string;
}

interface GradeDistribution {
  A: string;
  AB: string;
  B: string;
  BC: string;
  C: string;
  D: string;
  F: string;
}

export async function getGradeDistribution(courseUuid: string): Promise<GradeDistribution | null> {
  try {
    const response = await fetch(
      `https://api.madgrades.com/v1/courses/${courseUuid}/grades`,
      {
        headers: {
          'Authorization': `Token token=${process.env.MADGRADES_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const latestTerm = Math.max(...data.courseOfferings.map((o: any) => o.termCode));
    const latestOffering = data.courseOfferings.find((o: any) => o.termCode === latestTerm);

    if (!latestOffering?.cumulative) return null;

    const grades: MadgradesGrades = latestOffering.cumulative;
    const total = grades.total;
    
    if (total === 0) return null;

    return {
      A: (grades.aCount / total * 100).toFixed(1),
      AB: (grades.abCount / total * 100).toFixed(1),
      B: (grades.bCount / total * 100).toFixed(1),
      BC: (grades.bcCount / total * 100).toFixed(1),
      C: (grades.cCount / total * 100).toFixed(1),
      D: (grades.dCount / total * 100).toFixed(1),
      F: (grades.fCount / total * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    return null;
  }
}

export async function searchCourses(query: string): Promise<MadgradesCourse[]> {
  try {
    const response = await fetch(
      `https://api.madgrades.com/v1/courses?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Token token=${process.env.MADGRADES_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Madgrades API');
    }

    const data = await response.json();
    const searchTerms = query.toLowerCase().split(' ');
    
    return data.results.filter((course: MadgradesCourse) => {
      const deptCode = course.subjects[0]?.code;
      const deptName = DEPARTMENT_CODES[deptCode] || deptCode;
      const courseCode = `${deptName} ${course.number}`.toLowerCase();
      
      return searchTerms.every(term => 
        courseCode.includes(term.toLowerCase()) || 
        course.name.toLowerCase().includes(term.toLowerCase())
      );
    });
  } catch (error) {
    console.error('Error searching courses:', error);
    return [];
  }
}

export function convertToAppCourse(madgradesCourse: MadgradesCourse, grades: GradeDistribution | null) {
  const deptCode = madgradesCourse.subjects[0]?.code;
  
  return {
    id: madgradesCourse.uuid,
    code: `${DEPARTMENT_CODES[deptCode] || deptCode} ${madgradesCourse.number}`,
    name: madgradesCourse.name,
    description: madgradesCourse.description || 'No description available',
    credits: 3,
    department: DEPARTMENT_CODES[deptCode] || deptCode,
    level: String(Math.floor(madgradesCourse.number / 100) * 100),
    prerequisites: [],
    term: ['Fall', 'Spring'],
    gradeDistribution: grades || {
      A: '45.2',
      AB: '30.1',
      B: '15.3',
      BC: '5.2',
      C: '2.1',
      D: '1.1',
      F: '1.0'
    }
  };
}