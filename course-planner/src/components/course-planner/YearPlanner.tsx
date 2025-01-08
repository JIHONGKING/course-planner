// src/components/course-planner/YearPlanner.tsx

import React, { useMemo, useCallback } from 'react';  // useCallback 추가
import { useDrop } from 'react-dnd';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import type { Course, AcademicYear } from '@/types/course';



interface YearPlannerProps {
  year: AcademicYear;
  onDrop: (courseId: string, targetSemesterId: string) => void;
  draggedCourse: Course | null;
}

interface SemesterDropZoneProps {
  semesterId: string;
  term: string;
  courses: Course[];
  onDrop: (courseId: string, targetSemesterId: string) => void;
  isActive: boolean;
  children: React.ReactNode;
}

function SemesterDropZone({
    semesterId,
    term,
    courses,
    onDrop,
    isActive,
    children
  }: SemesterDropZoneProps) {
    const [{ isOver, canDrop }, dropRef] = useDrop({
      accept: 'course',
      drop: (item: { id: string }) => {
        onDrop(item.id, semesterId);
      },
      canDrop: () => courses.length < 6,
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop()
      })
    });
  
    // ref를 useCallback으로 감싸서 안정적인 참조 제공
    const setDropRef = useCallback((node: HTMLDivElement | null) => {
      if (node) {
        dropRef(node);
      }
    }, [dropRef]);
  
    return (
      <div
        ref={setDropRef}  // 수정된 ref 적용
        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
          isOver && canDrop
            ? 'border-blue-500 bg-blue-50'
            : isOver && !canDrop
            ? 'border-red-500 bg-red-50'
            : isActive
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-200'
        }`}
      >
        {children}
      </div>
    );
  }


export default function YearPlanner({ year, onDrop, draggedCourse }: YearPlannerProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  

  // 학기별 통계 계산
  const semesterStats = useMemo(() => {
    return year.semesters.map(semester => ({
      id: semester.id,
      totalCredits: semester.courses.reduce((sum, course) => sum + course.credits, 0),
      courseCount: semester.courses.length
    }));
  }, [year.semesters]);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
            <h2 className="text-lg font-medium">{year.yearName} Year</h2>
            <span className="text-sm text-gray-500">
              ({year.startYear}-{year.startYear + 1})
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Total Credits: {semesterStats.reduce((sum, stat) => sum + stat.totalCredits, 0)}
          </div>
        </button>
      </div>

      {/* 학기 컨테이너 */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {year.semesters.map((semester, index) => (
              <SemesterDropZone
              key={semester.id}
              semesterId={semester.id}
              term={semester.term}
              courses={semester.courses}
              onDrop={onDrop}
              isActive={!!draggedCourse?.term.includes(semester.term)}  // boolean으로 확실하게 변환
            >
                <div className="space-y-4">
                  {/* 학기 헤더 */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{semester.term}</h3>
                    <div className="text-sm text-gray-500">
                      {semesterStats[index].totalCredits} Credits
                    </div>
                  </div>

                  {/* 과목 목록 */}
                  <div className="space-y-2">
                    {semester.courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-2 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{course.code}</h4>
                            <p className="text-sm text-gray-500">{course.name}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {course.credits} cr
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* 빈 상태 */}
                    {semester.courses.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Info className="h-5 w-5 mb-2" />
                        <p className="text-sm">
                          {draggedCourse
                            ? '여기에 과목을 놓으세요'
                            : '과목을 드래그하여 추가하세요'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 학기 통계 */}
                  {semesterStats[index].courseCount > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>과목 수: {semesterStats[index].courseCount}</span>
                        <span>평균 학점: {(semesterStats[index].totalCredits / semesterStats[index].courseCount).toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </SemesterDropZone>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}