// src/components/course-planner/PrerequisiteGraph.tsx
import React from 'react';
import { Course } from '@/types/course';

interface PrerequisiteGraphProps {
  courses: Course[];
  selectedCourse?: Course;
}

export function PrerequisiteGraph({ courses, selectedCourse }: PrerequisiteGraphProps) {
  return (
    <div className="prerequisite-graph p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">Course Prerequisites</h3>
      {/* 과목간 관계를 시각적으로 표현 */}
      {/* 예: 화살표로 연결된 박스들 */}
    </div>
  );
}