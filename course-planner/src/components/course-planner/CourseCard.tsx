import { X } from 'lucide-react';

interface Course {
  code: string;
  name: string;
  credits: number;
  gradeDistribution: {
    A: number;
    // 다른 등급들도 추가할 수 있습니다.
  };
  prerequisites: string[];
}

interface CourseCardProps {
  course: Course;
  onRemove: () => void;
}

export default function CourseCard({ course, onRemove }: CourseCardProps) {
  return (
    <div className="group relative border border-gray-200 rounded-md p-3 hover:bg-gray-50">
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex justify-between pr-6">
        <div>
          <h3 className="font-medium text-gray-900">{course.code}</h3>
          <p className="text-sm text-gray-500">{course.name}</p>
        </div>
        <div className="text-right">
          <div className="text-gray-900">{course.credits.toFixed(2)} Cr</div>
          <div className="text-sm text-green-600 font-medium">
            A: {course.gradeDistribution.A.toFixed(1)}%
          </div>
        </div>
      </div>
      {course.prerequisites.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Prerequisites: {course.prerequisites.join(', ')}
        </div>
      )}
    </div>
  );
}