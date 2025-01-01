// app/api/courses/route.ts
import { NextResponse } from 'next/server';

const DEPARTMENT_CODES: { [key: string]: string } = {
  '266': 'COMP SCI',
  '600': 'MATH',
  // 다른 학과 코드들도 추가
};

async function getGradeDistribution(courseUuid: string) {
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
    // 가장 최근 학기의 데이터 사용
    const latestTerm = Math.max(...data.courseOfferings.map((o: any) => o.termCode));
    const latestOffering = data.courseOfferings.find((o: any) => o.termCode === latestTerm);

    if (!latestOffering?.cumulative) return null;

    const total = latestOffering.cumulative.total;
    if (total === 0) return null;

    return {
      A: (latestOffering.cumulative.aCount / total * 100).toFixed(1),
      AB: (latestOffering.cumulative.abCount / total * 100).toFixed(1),
      B: (latestOffering.cumulative.bCount / total * 100).toFixed(1),
      BC: (latestOffering.cumulative.bcCount / total * 100).toFixed(1),
      C: (latestOffering.cumulative.cCount / total * 100).toFixed(1),
      D: (latestOffering.cumulative.dCount / total * 100).toFixed(1),
      F: (latestOffering.cumulative.fCount / total * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (!query) {
      return NextResponse.json({ courses: [], total: 0 });
    }
    
    // Madgrades API 호출
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
    
    // 검색어로 필터링
    const searchTerms = query.toLowerCase().split(' ');
    const filteredCourses = data.results.filter((course: any) => {
      const deptCode = course.subjects[0]?.code;
      const deptName = DEPARTMENT_CODES[deptCode] || deptCode;
      const courseCode = `${deptName} ${course.number}`.toLowerCase();
      
      return searchTerms.every(term => courseCode.includes(term));
    });

    // 상위 5개 결과에 대해 성적 정보 가져오기
    const coursesWithGrades = await Promise.all(
      filteredCourses.slice(0, 5).map(async (course: any) => {
        const grades = await getGradeDistribution(course.uuid);
        const deptCode = course.subjects[0]?.code;
        
        return {
          id: course.uuid,
          code: `${DEPARTMENT_CODES[deptCode] || deptCode} ${course.number}`,
          name: course.name,
          description: course.description || 'No description available',
          credits: 3,
          department: DEPARTMENT_CODES[deptCode] || deptCode,
          level: String(Math.floor(course.number / 100) * 100),
          prerequisites: [],
          term: ['Fall', 'Spring'],
          gradeDistribution: JSON.stringify(grades || {
            A: '45.2',
            AB: '30.1',
            B: '15.3',
            BC: '5.2',
            C: '2.1',
            D: '1.1',
            F: '1.0'
          })
        };
      })
    );

    return NextResponse.json({
      courses: coursesWithGrades,
      total: coursesWithGrades.length
    });

  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}