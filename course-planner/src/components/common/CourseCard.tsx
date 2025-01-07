// src/components/common/CourseCard.tsx
import React from 'react';
import { Info, Plus, X } from 'lucide-react';
import type { Course } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface CourseCardProps {
  course: Course;
  onAdd?: (course: Course) => void;
  onRemove?: () => void;
  onInfo?: (course: Course) => void;
  onClick?: () => void;
  showPrerequisites?: boolean;
  isInPlan?: boolean;
  className?: string;
}

 export default function CourseCard({
  course, 
  onAdd,
  onRemove,
  onInfo,
  onClick,
  showPrerequisites = true,
  isInPlan = false,
  className = ''
}: CourseCardProps) {
    console.log('Rendering CourseCard:', course.code);  // 디버그 로그 추가
  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  return (
    <div 
      onClick={handleClick}
      className={`group relative border border-gray-200 rounded-md p-4 
                 ${onClick ? 'cursor-pointer' : ''} 
                 hover:bg-gray-50 transition-colors
                 ${className}`}
    >
      {/* 삭제 버튼 */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 
                   transition-opacity text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex justify-between pr-6">
        <div>
          {/* 과목 기본 정보 */}
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{course.code}</h3>
            <span className="px-2 py-0.5 text-sm bg-gray-100 rounded-full text-gray-600">
              {course.credits} credits
            </span>
          </div>
          <p className="text-gray-600">{course.name}</p>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {course.description}
          </p>

          {/* 선수과목 정보 */}
          {showPrerequisites && course.prerequisites.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Info className="w-4 h-4" />
                <span>Prerequisites:</span>
              </div>
              <ul className="mt-1 space-y-1">
                {course.prerequisites.map((prereq) => (
                  <li key={prereq.courseId} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      prereq.type === 'required' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    {prereq.courseId}
                    {prereq.grade && (
                      <span className="text-xs">({prereq.grade} or higher)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 성적 및 학기 정보 */}
        <div className="text-right">
          <div className="text-sm text-green-600 font-medium">
            A: {getGradeA(course.gradeDistribution)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {course.term.join(', ')}
          </div>

          {/* 액션 버튼들 */}
          {(onAdd || onInfo) && (
            <div className="mt-4 space-x-2">
              {onInfo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInfo(course);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="View course details"
                >
                  <Info className="h-5 w-5" />
                </button>
              )}
              {onAdd && !isInPlan && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(course);
                  }}
                  className="p-1 text-blue-500 hover:text-blue-600"
                  title="Add to plan"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}