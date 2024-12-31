import { ChevronDown } from 'lucide-react';
import { AcademicYear as AcademicYearType, Semester, Course } from '@/types/course'; // 타입 이름 변경

interface AcademicYearProps {
  year: AcademicYearType;
  onRemoveCourse: (semesterId: string, courseId: string) => void;
  onAddCourse: (semesterId: string, course: Course) => void;
}


export default function AcademicYear({ year, onRemoveCourse, onAddCourse }: AcademicYearProps) {
  const totalCredits = year.semesters.reduce(
    (sum: number, semester: Semester) =>
      sum + semester.courses.reduce((semSum: number, course: Course) => semSum + course.credits, 0),
    0
  );


  const targetCredits = 30; // Credits target per year

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {`${year.yearName} Year (${year.startYear}-${year.startYear + 1})`}
          </h2>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${
              totalCredits > targetCredits ? 'text-red-600' : 'text-gray-600'
            }`}>
              Total Credits: {totalCredits}/{targetCredits}
            </span>
            <button className="text-gray-400 hover:text-gray-600">
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid md:grid-cols-3 gap-6">
          {year.semesters.map(semester => (
            <Semester
              key={semester.id}
              semester={semester}
              onAddCourse={() => onAddCourse(semester.id)}
              onRemoveCourse={(courseId) => onRemoveCourse(semester.id, courseId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}