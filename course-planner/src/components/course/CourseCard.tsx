// src/components/course/CourseCard.tsx

import React from 'react';
import { Info } from 'lucide-react';
import type { Course } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface CourseCardProps {
    course: Course;
    onClick?: () => void;
    onRemove?: () => void;  // 선택적 prop으로 변경
    showPrerequisites?: boolean;
  }

export default function CourseCard({ course, onClick, showPrerequisites = true }: CourseCardProps) {
  return (
    <div 
      className="border p-4 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <h3 className="font-bold text-gray-900">{course.code}</h3>
            <span className="px-2 py-0.5 text-sm bg-gray-100 rounded-full text-gray-600">
              {course.credits} credits
            </span>
          </div>
          <p className="text-gray-600">{course.name}</p>
          
          {/* Description */}
          <p className="text-sm text-gray-500 mt-1">{course.description}</p>
          
          {/* Prerequisites */}
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
                    {prereq.grade && <span className="text-xs">({prereq.grade} or higher)</span>}
                    <span className="text-xs text-gray-500">
                      ({prereq.type === 'required' ? 'Required' : 'Recommended'})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm text-green-600 font-medium">
            A: {getGradeA(course.gradeDistribution)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {course.term.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}