// src/components/course-planner/PrerequisiteGraph.tsx
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Info, AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';

interface Node {
  id: string;
  code: string;
  level: number;
  prerequisites: string[];
  type: 'required' | 'recommended';
}

interface PrerequisiteGraphProps {
  course: Course;
  allCourses: Course[];
  onCourseSelect?: (courseCode: string) => void;
}

const PrerequisiteGraph = ({ 
  course, 
  allCourses,
  onCourseSelect 
}: PrerequisiteGraphProps) => {
  // 선수과목 트리 구성
  const { nodes, levels } = useMemo(() => {
    const nodes = new Map<string, Node>();
    const levels = new Map<number, Node[]>();
    
    const addNode = (course: Course, level: number) => {
      if (!nodes.has(course.code)) {
        const node: Node = {
          id: course.id,
          code: course.code,
          level,
          prerequisites: course.prerequisites.map(p => p.courseId),
          type: 'required'
        };
        nodes.set(course.code, node);
        
        const levelNodes = levels.get(level) || [];
        levelNodes.push(node);
        levels.set(level, levelNodes);
        
        // 재귀적으로 선수과목 추가
        course.prerequisites.forEach(prereq => {
          const prereqCourse = allCourses.find(c => c.code === prereq.courseId);
          if (prereqCourse) {
            addNode(prereqCourse, level - 1);
          }
        });
      }
    };

    addNode(course, 0);

    return { nodes, levels };
  }, [course, allCourses]);

  // 차트 데이터 구성
  const chartData = useMemo(() => {
    return Array.from(levels.entries())
      .sort(([a], [b]) => b - a) // 레벨 역순 정렬
      .map(([level, nodes]) => ({
        level,
        count: nodes.length,
        courses: nodes.map(n => n.code)
      }));
  }, [levels]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-medium">
            Prerequisites for {course.code}
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          Total prerequisites: {nodes.size - 1}
        </div>
      </div>

      {/* 선수과목이 없는 경우 */}
      {nodes.size === 1 && (
        <div className="flex items-center gap-2 text-gray-500 p-4 bg-gray-50 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <p>No prerequisites required for this course</p>
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
                    value: 'Prerequisites Level',
                    position: 'bottom'
                  }} 
                />
                <YAxis
                  label={{
                    value: 'Number of Courses',
                    angle: -90,
                    position: 'left'
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">Level {data.level}</p>
                          <ul className="mt-2 space-y-1">
                            {data.courses.map((code: string) => (
                              <li 
                                key={code}
                                className="text-sm text-gray-600 hover:text-blue-500 cursor-pointer"
                                onClick={() => onCourseSelect?.(code)}
                              >
                                {code}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 선수과목 목록 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Required Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(nodes.values())
                .filter(node => node.code !== course.code)
                .map(node => (
                  <button
                    key={node.code}
                    onClick={() => onCourseSelect?.(node.code)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 
                             text-left transition-colors duration-200"
                  >
                    <h4 className="font-medium text-gray-900">{node.code}</h4>
                    <p className="text-sm text-gray-500">
                      Level {node.level}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrerequisiteGraph;