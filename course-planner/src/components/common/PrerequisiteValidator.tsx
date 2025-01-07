import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Course, Prerequisite } from '@/types/course';

interface ValidatorProps {
  course: Course;
  completedCourses: Course[];
  currentTermCourses: Course[];
  term: string;
}

interface ValidationResult {
  isValid: boolean;
  prereqStatus: {
    courseId: string;
    status: 'completed' | 'inProgress' | 'missing';
    type: 'required' | 'concurrent' | 'recommended';
    grade?: string;
  }[];
  messages: string[];
}

export default function PrerequisiteValidator({
  course,
  completedCourses,
  currentTermCourses,
  term
}: ValidatorProps) {
  const validation = useMemo((): ValidationResult => {
    const prereqStatus = course.prerequisites.map(prereq => {
      // 이미 완료한 과목인지 확인
      const isCompleted = completedCourses.some(c => c.code === prereq.courseId);
      
      // 현재 학기에 수강 중인지 확인
      const isInProgress = currentTermCourses.some(c => c.code === prereq.courseId);
      
      // 상태 결정
      let status: 'completed' | 'inProgress' | 'missing';
      if (isCompleted) {
        status = 'completed';
      } else if (isInProgress) {
        status = 'inProgress';
      } else {
        status = 'missing';
      }

      return {
        courseId: prereq.courseId,
        status,
        type: prereq.type,
        grade: prereq.grade
      };
    });

    // 전체 유효성 검사
    const isValid = prereqStatus.every(status => 
      status.status === 'completed' || 
      (status.type !== 'required' && status.status === 'inProgress')
    );

    // 메시지 생성
    const messages: string[] = [];
    
    // 학기 제공 여부 확인
    if (!course.term.includes(term)) {
      messages.push(`This course is not offered in ${term} term`);
    }

    // 선수과목 관련 메시지
    const missingRequired = prereqStatus
      .filter(p => p.status === 'missing' && p.type === 'required')
      .map(p => p.courseId);
    
    if (missingRequired.length > 0) {
      messages.push(
        `Missing required prerequisites: ${missingRequired.join(', ')}`
      );
    }

    const missingRecommended = prereqStatus
      .filter(p => p.status === 'missing' && p.type === 'recommended')
      .map(p => p.courseId);
    
    if (missingRecommended.length > 0) {
      messages.push(
        `Recommended prerequisites: ${missingRecommended.join(', ')}`
      );
    }

    return { isValid, prereqStatus, messages };
  }, [course, completedCourses, currentTermCourses, term]);

  if (!course.prerequisites.length) {
    return (
      <div className="flex items-center gap-2 text-gray-500 p-2">
        <Info className="h-4 w-4" />
        <span>No prerequisites required</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
      {/* 전체 상태 표시 */}
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <span className={`font-medium ${
          validation.isValid ? 'text-green-700' : 'text-yellow-700'
        }`}>
          {validation.isValid 
            ? 'All prerequisites are met' 
            : 'Some prerequisites are missing'}
        </span>
      </div>

      {/* 경고 메시지 */}
      {validation.messages.length > 0 && (
        <div className="space-y-1">
          {validation.messages.map((message, index) => (
            <div key={index} className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 선수과목 상세 상태 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Prerequisites Status:</h4>
        <div className="grid gap-2">
          {validation.prereqStatus.map((status) => (
            <div 
              key={status.courseId}
              className="flex items-center justify-between p-2 bg-white rounded border"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  status.status === 'completed' ? 'bg-green-500' :
                  status.status === 'inProgress' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium">{status.courseId}</span>
                {status.grade && (
                  <span className="text-xs text-gray-500">
                    (Grade {status.grade} or higher required)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  status.type === 'required' 
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {status.type}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  status.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : status.status === 'inProgress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {status.status === 'completed'
                    ? 'Completed'
                    : status.status === 'inProgress'
                    ? 'In Progress'
                    : 'Not Taken'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}