// src/components/common/PrerequisiteValidator.tsx

import React, { useMemo, useCallback, memo } from 'react';
import { AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';
import type { Course } from '@/types/course';

interface ValidatorProps {
  course: Course;
  completedCourses: Course[];
  currentTermCourses: Course[];
  term: string;
  onPrerequisiteClick?: (courseCode: string) => void;
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
  blockedCourses: string[];  // 이 과목을 수강하지 않으면 들을 수 없는 후속 과목들
}

export default function PrerequisiteValidator({
  course,
  completedCourses,
  currentTermCourses,
  term,
  onPrerequisiteClick
}: ValidatorProps) {
  const validation = useMemo((): ValidationResult => {
    // 선수과목 상태 검사
    const prereqStatus = course.prerequisites.map(prereq => {
      const isCompleted = completedCourses.some(c => c.code === prereq.courseId);
      const isInProgress = currentTermCourses.some(c => c.code === prereq.courseId);
      
      let status: 'completed' | 'inProgress' | 'missing';
      if (isCompleted) status = 'completed';
      else if (isInProgress) status = 'inProgress';
      else status = 'missing';

      return {
        courseId: prereq.courseId,
        status,
        type: prereq.type,
        grade: prereq.grade
      };
    });

    // 학기 제공 여부 검사
    const termValid = course.term.includes(term);

    // 필수 선수과목 검사
    const requiredPrereqsSatisfied = prereqStatus
      .filter(s => s.type === 'required')
      .every(s => s.status === 'completed' || s.status === 'inProgress');

    // 메시지 생성
    const messages: string[] = [];
    if (!termValid) {
      messages.push(`이 과목은 ${term} 학기에 제공되지 않습니다.`);
    }

    const missingRequired = prereqStatus
      .filter(p => p.status === 'missing' && p.type === 'required')
      .map(p => p.courseId);
    
    if (missingRequired.length > 0) {
      messages.push(`필수 선수과목 미이수: ${missingRequired.join(', ')}`);
    }

    const handlePrereqClick = useCallback((courseId: string) => {
      onPrerequisiteClick?.(courseId);
    }, [onPrerequisiteClick]);

    const missingRecommended = prereqStatus
      .filter(p => p.status === 'missing' && p.type === 'recommended')
      .map(p => p.courseId);
    
    if (missingRecommended.length > 0) {
      messages.push(`권장 선수과목: ${missingRecommended.join(', ')}`);
    }

    // 후속 과목 분석
    const blockedCourses = completedCourses
      .filter(c => 
        c.prerequisites.some(p => 
          p.courseId === course.code && p.type === 'required'
        )
      )
      .map(c => c.code);

    return {
      isValid: termValid && requiredPrereqsSatisfied,
      prereqStatus,
      messages,
      blockedCourses
    };
  }, [course, completedCourses, currentTermCourses, term]);

  const PrereqIcon = memo(({ status, type }: { status: string; type: string }) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === 'inProgress') {
      return <Info className="h-4 w-4 text-blue-500" />;
    }
    if (type === 'required') {
      return <Lock className="h-4 w-4 text-red-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  })

  if (!course.prerequisites.length) {
    return (
      <div className="flex items-center gap-2 text-gray-500 p-2">
        <Info className="h-4 w-4" />
        <span>선수과목이 없습니다</span>
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
            ? '모든 선수과목 요건이 충족되었습니다' 
            : '일부 선수과목 요건이 충족되지 않았습니다'}
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

      {/* 선수과목 상태 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">선수과목 현황:</h4>
        <div className="grid gap-2">
          {validation.prereqStatus.map((status) => (
            <button
              key={status.courseId}
              onClick={() => onPrerequisiteClick?.(status.courseId)}
              className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-2">
                <PrereqIcon status={status.status} type={status.type} />
                <span className="text-sm font-medium">{status.courseId}</span>
                {status.grade && (
                  <span className="text-xs text-gray-500">
                    (최소 {status.grade}학점 필요)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  status.type === 'required' 
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {status.type === 'required' ? '필수' : '권장'}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  status.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : status.status === 'inProgress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {status.status === 'completed'
                    ? '이수 완료'
                    : status.status === 'inProgress'
                    ? '수강 중'
                    : '미이수'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 후속 과목 정보 */}
      {validation.blockedCourses.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-blue-700 font-medium">
                이 과목은 다음 과목의 선수과목입니다:
              </p>
              <ul className="mt-1 space-y-1">
                {validation.blockedCourses.map(code => (
                  <li
                    key={code}
                    className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                    onClick={() => onPrerequisiteClick?.(code)}
                  >
                    {code}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}