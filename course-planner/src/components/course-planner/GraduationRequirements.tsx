//src/components/course-planner/GraduationRequirements.tsx


import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import type { RequirementValidationResult } from '@/types/graduation';
import { GraduationValidator } from '@/utils/graduationUtils';
import { usePlanner } from '@/hooks/usePlanner';
import { useCourseData } from '@/hooks/useCourseData';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // 선택적 추가

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

  // 기존 validationResults 계산 로직 유지
  const validationResults = useMemo(() => {
    const validator = new GraduationValidator(
      {
        id: 'current-plan',
        userId: '',
        years: academicPlan,
        savedCourses: []
      },
      {
        totalCredits: 120,
        coreCourses: [
          { code: 'COMP SCI 300', name: 'Programming II', required: true },  // required 추가
          { code: 'COMP SCI 400', name: 'Programming III', required: true },
          { code: 'MATH 222', name: 'Calculus II', required: true }
        ],
        minimumGPA: 2.0,
        distribution: {
          'COMP SCI': 40,
          'MATH': 15,
          'Communications': 6
        },
        requiredCredits: 120,  // 추가
        requiredGPA: 2.0      // 추가
      },
      allCourses
    );

    return validator.validateAll();
  }, [academicPlan, allCourses]);


  // 전체 진행률 계산
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">졸업 요건 진행 상황</h2>
          <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
        </div>

        <div className="mb-6">
          <ProgressBar percentage={overallProgress} />
        </div>

        {remainingRequirements.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">남은 졸업 요건</h3>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                  {remainingRequirements.map((result, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span>• {result.details.message}</span>
                      <span className="text-yellow-600">
                        ({result.current}/{result.required}
                        {result.type === 'gpa' ? ' GPA' : result.type === 'credits' ? ' 학점' : ''})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {validationResults.map((result, index) => (
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