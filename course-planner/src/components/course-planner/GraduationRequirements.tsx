// src/components/course-planner/GraduationRequirements.tsx

import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import type { RequirementValidationResult, GraduationRequirement } from '@/types/graduation';
import { GraduationValidator } from '@/utils/graduationUtils';
import { usePlanner } from '@/hooks/usePlanner';
import { useCourseData } from '@/hooks/useCourseData';
import { Card } from '@/components/ui/card';

interface RequirementSectionProps {
  result: RequirementValidationResult;
  expanded: boolean;
  onToggle: () => void;
}

function RequirementSection({ result, expanded, onToggle }: RequirementSectionProps) {
  const getStatusColor = (satisfied: boolean) => 
    satisfied ? 'text-green-600' : 'text-yellow-600';

  const getStatusBg = (satisfied: boolean) =>
    satisfied ? 'bg-green-50' : 'bg-yellow-50';

  const getStatusIcon = (satisfied: boolean) =>
    satisfied ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-yellow-600" />
    );

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between ${getStatusBg(result.satisfied)}`}
      >
        <div className="flex items-center space-x-3">
          {getStatusIcon(result.satisfied)}
          <div className="text-left">
            <h3 className="font-medium">{result.details.message}</h3>
            <p className="text-sm text-gray-600">
              {result.current} / {result.required}
              {result.type === 'gpa' ? ' GPA' : result.type === 'credits' ? ' 학점' : ''}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 bg-white">
          <div className="space-y-3">
            {result.details.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.satisfied)}
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className={`text-sm font-medium ${getStatusColor(item.satisfied)}`}>
                  {item.current} / {item.required}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="absolute h-full bg-blue-600 transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
}

export default function GraduationRequirements() {
  const { academicPlan } = usePlanner();
  const { courses: allCourses } = useCourseData();
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  const graduationRequirements: GraduationRequirement = {
    id: 'cs-graduation-requirements',
    name: 'Computer Science Graduation Requirements',
    totalCredits: 120,
    coreCourses: [
      { code: 'COMP SCI 300', name: 'Programming II', required: true },
      { code: 'COMP SCI 400', name: 'Programming III', required: true },
      { code: 'MATH 222', name: 'Calculus II', required: true }
    ],
    minimumGPA: 2.0,
    distribution: {
      'COMP SCI': 40,
      'MATH': 15,
      'Communications': 6
    },
    requiredCredits: 120,
    requiredGPA: 2.0
  };

  const validationResults = useMemo(() => {
    const validator = new GraduationValidator(
      {
        id: 'current-plan',
        userId: '',
        years: academicPlan,
        savedCourses: []
      },
      graduationRequirements,
      allCourses
    );

    return validator.validateAll();
  }, [academicPlan, allCourses]);

  const overallProgress = useMemo(() => {
    const satisfied = validationResults.filter(r => r.satisfied).length;
    return Math.round((satisfied / validationResults.length) * 100);
  }, [validationResults]);

  const toggleSection = (type: string) => {
    setExpandedSections(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const remainingRequirements = validationResults.filter(r => !r.satisfied);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {/* ... 나머지 JSX 코드는 동일 ... */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">졸업 요건 진행 상황</h2>
          <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
        </div>

        <div className="mb-6">
          <ProgressBar percentage={overallProgress} />
        </div>

        {remainingRequirements.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            {/* ... 경고 메시지 섹션 ... */}
          </div>
        )}

        <div className="space-y-4">
          {validationResults.map((result) => (
            <RequirementSection
              key={result.type}
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