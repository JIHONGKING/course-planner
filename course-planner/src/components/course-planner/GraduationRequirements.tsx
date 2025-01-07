// src/components/course-planner/GraduationRequirements.tsx

import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import type { RequirementValidationResult } from '@/types/graduation';
import { GraduationValidator } from '../../utils/graduationUtils';
import { usePlanner } from '@/hooks/usePlanner';  // useAcademicPlan 대신 usePlanner 사용

interface RequirementSectionProps {
  result: RequirementValidationResult;
  expanded: boolean;
  onToggle: () => void;
}

function RequirementSection({ result, expanded, onToggle }: RequirementSectionProps) {
  const getStatusColor = (satisfied: boolean) => 
    satisfied ? 'text-green-600' : 'text-red-600';

  const getStatusBg = (satisfied: boolean) =>
    satisfied ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between ${getStatusBg(result.satisfied)}`}
      >
        <div className="flex items-center space-x-3">
          {result.satisfied ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <div className="text-left">
            <h3 className="font-medium">{result.details.message}</h3>
            <p className="text-sm text-gray-600">
              진행률: {result.current}/{result.required}
              {result.type === 'gpa' && ' GPA'}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {expanded && result.details.items && (
        <div className="p-4 bg-white">
          <div className="space-y-3">
            {result.details.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center space-x-2">
                  {item.satisfied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className={`text-sm font-medium ${getStatusColor(item.satisfied)}`}>
                  {item.current}/{item.required}
                  {result.type === 'gpa' && ' GPA'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GraduationRequirements() {
    const { academicPlan } = usePlanner();  // useAcademicPlan 대신 usePlanner 사용
    const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

    const validationResults = useMemo(() => {
        const validator = new GraduationValidator(
          {
            id: 'current-plan',  // 현재 계획의 임시 ID
            userId: '',          // 실제 구현시 사용자 ID 필요
            years: academicPlan,
            savedCourses: []     // 저장된 과목들
          },
          {
            major: "Computer Science",
            requirements: [
              {
                type: 'credits' as const,
                totalCredits: 120,
                minimumPerCategory: {
                  'COMP SCI': 40,
                  'MATH': 15,
                  'Communications': 6,
                }
              },
              {
                type: 'core' as const,
                courses: [
                  { courseId: 'COMP SCI 300', required: true },
                  { courseId: 'COMP SCI 400', required: true },
                  { courseId: 'MATH 222', required: true }
                ]
              },
              {
                type: 'gpa' as const,
                minimumGPA: 2.0,
                minimumMajorGPA: 2.5
              }
            ]
          },
          [] // 전체 과목 목록
        );
      
        return validator.validateAll();
      }, [academicPlan]);

      const toggleSection = (type: string) => {
        setExpandedSections(prev =>
          prev.includes(type)
            ? prev.filter((t: string) => t !== type)
            : [...prev, type]
        );
      };

      const overallProgress = useMemo(() => {
        const satisfied = validationResults.filter((r: RequirementValidationResult) => r.satisfied).length;
        return Math.round((satisfied / validationResults.length) * 100);
      }, [validationResults]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">졸업 요건 진행 상황</h2>
          <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
        </div>

        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {!validationResults.every(r => r.satisfied) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">남은 졸업 요건</h3>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                  {validationResults
                    .filter(r => !r.satisfied)
                    .map((r, i) => (
                      <li key={i}>{r.details.message}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {validationResults.map((result, index) => (
            <RequirementSection
              key={index}
              result={result}
              expanded={expandedSections.includes(result.type)}
              onToggle={() => toggleSection(result.type)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}