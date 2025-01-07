// src/components/common/PrerequisiteValidator.tsx
import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Course } from '@/types/course';

interface PrerequisiteValidatorProps {
  course: Course;
  completedCourses: Course[];
  currentTermCourses: Course[];
}

export default function PrerequisiteValidator({
  course,
  completedCourses,
  currentTermCourses
}: PrerequisiteValidatorProps) {
  const prereqStatus = course.prerequisites.map(prereq => {
    const isCompleted = completedCourses.some(c => c.code === prereq.courseId);
    const isInCurrentTerm = currentTermCourses.some(c => c.code === prereq.courseId);
    
    return {
      courseId: prereq.courseId,
      status: isCompleted ? 'completed' : isInCurrentTerm ? 'current' : 'missing',
      type: prereq.type,
      grade: prereq.grade
    };
  });

  const allPrereqsMet = prereqStatus.every(
    status => status.status === 'completed' || 
    (status.type !== 'required' && status.status === 'current')
  );

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        {allPrereqsMet ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <span className="text-sm font-medium">
          Prerequisites Status
        </span>
      </div>

      {prereqStatus.length > 0 ? (
        <div className="space-y-1">
          {prereqStatus.map(status => (
            <div 
              key={status.courseId}
              className="flex items-center gap-2 text-sm"
            >
              <span 
                className={`w-2 h-2 rounded-full ${
                  status.status === 'completed' ? 'bg-green-500' :
                  status.status === 'current' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}
              />
              <span className="text-gray-700">{status.courseId}</span>
              {status.grade && (
                <span className="text-xs text-gray-500">
                  (Grade {status.grade} or higher required)
                </span>
              )}
              <span className={`text-xs ${
                status.type === 'required' ? 'text-red-500' : 'text-yellow-500'
              }`}>
                ({status.type})
              </span>
              <span className={`text-xs ${
                status.status === 'completed' ? 'text-green-500' :
                status.status === 'current' ? 'text-blue-500' :
                'text-yellow-500'
              }`}>
                {status.status === 'completed' ? 'Completed' :
                 status.status === 'current' ? 'In Progress' :
                 'Not Taken'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No prerequisites required</p>
      )}
    </div>
  );
}