// src/components/course-planner/PrerequisiteGraph.tsx

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Info, AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface Node {
  id: string;
  code: string;
  level: number;
  credits: number;
  gradeA: number;
  prerequisites: string[];
  type: 'required' | 'recommended';
}

interface PrerequisiteGraphProps {
  course: Course;
  allCourses: Course[];
  completedCourses?: Course[];
  onCourseSelect?: (courseCode: string) => void;
}

function getCourseStatus(code: string, completedCourses: Course[] = []) {
  return completedCourses.some(c => c.code === code) ? 'completed' : 'pending';
}

export default function PrerequisiteGraph({ 
  course, 
  allCourses,
  completedCourses = [],
  onCourseSelect 
}: PrerequisiteGraphProps) {
  // 선수과목 트리 및 레벨 구성
  const { nodes, levels, maxLevel } = useMemo(() => {
    const nodes = new Map<string, Node>();
    const levels = new Map<number, Node[]>();
    let maxLevel = 0;

    const addNode = (course: Course, level: number) => {
      if (!nodes.has(course.code)) {
        const node: Node = {
          id: course.id,
          code: course.code,
          level,
          credits: course.credits,
          gradeA: parseFloat(getGradeA(course.gradeDistribution)),
          prerequisites: course.prerequisites.map(p => p.courseId),
          type: 'required'
        };
        nodes.set(course.code, node);
        
        const levelNodes = levels.get(level) || [];
        levelNodes.push(node);
        levels.set(level, levelNodes);
        maxLevel = Math.max(maxLevel, level);
        
        // 선수과목 재귀적 추가
        course.prerequisites.forEach(prereq => {
          const prereqCourse = allCourses.find(c => c.code === prereq.courseId);
          if (prereqCourse) {
            addNode(prereqCourse, level - 1);
          }
        });
      }
    };

    addNode(course, 0);
    return { nodes, levels, maxLevel };
  }, [course, allCourses]);

  // 차트 데이터 구성
  const chartData = useMemo(() => {
    return Array.from(levels.entries())
      .sort(([a], [b]) => b - a)
      .map(([level, nodes]) => ({
        level,
        count: nodes.length,
        avgCredits: Number((nodes.reduce((sum, n) => sum + n.credits, 0) / nodes.length).toFixed(1)),
        avgGradeA: Number((nodes.reduce((sum, n) => sum + n.gradeA, 0) / nodes.length).toFixed(1)),
        courses: nodes.map(n => n.code)
      }));
  }, [levels]);

  // 과목 간 관계 분석
  const relationships = useMemo(() => {
    const requiredBy = new Map<string, string[]>();
    Array.from(nodes.values()).forEach(node => {
      node.prerequisites.forEach(prereq => {
        const courses = requiredBy.get(prereq) || [];
        courses.push(node.code);
        requiredBy.set(prereq, courses);
      });
    });
    return requiredBy;
  }, [nodes]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-medium">
            {course.code}의 선수과목 관계도
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          총 선수과목: {nodes.size - 1}개
        </div>
      </div>

      // src/components/course-planner/PrerequisiteGraph.tsx (continued)

{/* 선수과목이 없는 경우 */}
{nodes.size === 1 && (
  <div className="flex items-center gap-2 text-gray-500 p-4 bg-gray-50 rounded-lg">
    <AlertCircle className="h-5 w-5" />
    <p>이 과목은 선수과목이 없습니다</p>
  </div>
)}

{/* 선수과목 그래프 */}
{nodes.size > 1 && (
  <>
    {/* 차트 */}
    <div className="h-64 mb-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="level" 
            label={{ 
              value: '선수과목 레벨',
              position: 'bottom'
            }} 
          />
          <YAxis
            yAxisId="left"
            label={{
              value: '과목 수',
              angle: -90,
              position: 'left'
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: '평균 학점',
              angle: 90,
              position: 'right'
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">레벨 {data.level}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-600">과목 수: {data.count}개</p>
                      <p className="text-gray-600">평균 학점: {data.avgCredits}</p>
                      <p className="text-gray-600">평균 A학점 비율: {data.avgGradeA}%</p>
                      <div className="mt-2 pt-2 border-t">
                        <p className="font-medium mb-1">과목:</p>
                        {data.courses.map((code: string) => (
                          <button
                            key={code}
                            onClick={() => onCourseSelect?.(code)}
                            className="block text-blue-600 hover:text-blue-800"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 6 }}
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgGradeA"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 6 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* 선수과목 목록 */}
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">선수과목 목록</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from(nodes.values())
          .filter(node => node.code !== course.code)
          .map(node => (
            <button
              key={node.code}
              onClick={() => onCourseSelect?.(node.code)}
              className={`p-3 rounded-lg text-left transition-colors duration-200 ${
                getCourseStatus(node.code, completedCourses) === 'completed'
                  ? 'bg-green-50 hover:bg-green-100'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <h4 className={`font-medium ${
                getCourseStatus(node.code, completedCourses) === 'completed'
                  ? 'text-green-700'
                  : 'text-gray-900'
              }`}>
                {node.code}
              </h4>
              <div className="mt-1 text-sm space-y-1">
                <p className="text-gray-600">레벨 {Math.abs(node.level)}</p>
                <p className="text-gray-600">{node.credits} 학점</p>
                {(relationships.get(node.code)?.length ?? 0) > 0 && (
  <p className="text-blue-600">
    {relationships.get(node.code)?.length ?? 0}개 과목의 선수과목
  </p>
)}


              </div>
            </button>
          ))}
      </div>
    </div>

    {/* 과목 연결 관계 */}
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-medium text-blue-900 mb-3">과목 간 연결 관계</h3>
      <div className="space-y-2">
        {Array.from(relationships.entries())
          .filter(([_, requiredBy]) => requiredBy.length > 0)
          .map(([prereq, requiredBy]) => (
            <div key={prereq} className="flex items-start gap-2 text-sm">
              <button
                onClick={() => onCourseSelect?.(prereq)}
                className="text-blue-700 hover:text-blue-900 font-medium"
              >
                {prereq}
              </button>
              <span className="text-gray-500">→</span>
              <div className="flex flex-wrap gap-2">
                {requiredBy.map(code => (
                  <button
                    key={code}
                    onClick={() => onCourseSelect?.(code)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  </>
)}
</div>
);
}