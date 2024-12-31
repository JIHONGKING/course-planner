import { useState, useMemo, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, Filter, AlertCircle, Check } from 'lucide-react';
import type { Course } from '@/src/types/course';
import { COURSE_LEVELS, DEPARTMENTS } from '@/src/data/constants';

interface CourseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (course: Course) => void;
  courses: Course[];
  currentCourses: Course[];
  semesterId: string;
}

export default function CourseSelectionModal({
  isOpen,
  onClose,
  onSelect,
  courses: initialCourses, // 이름 변경: initialCourses
  currentCourses,
  semesterId
}: CourseSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    department: '',
    credits: 'all'
  });
  const [courses, setCourses] = useState<Course[]>(initialCourses); // courses 상태 변수 추가

  useEffect(() => {
    setCourses(initialCourses); // initialCourses를 사용하여 courses 상태 초기화
  }, [initialCourses]); // initialCourses가 변경될 때마다 useEffect 실행

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearchTerm = 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel = !filters.level || course.level === filters.level;
      const matchesDepartment = !filters.department || course.department.toLowerCase().includes(filters.department.toLowerCase());
      const matchesCredits = 
        filters.credits === 'all' ||
        (filters.credits === 'under 4' && course.credits < 4) ||
        (filters.credits === '4+' && course.credits >= 4);

      return matchesSearchTerm && matchesLevel && matchesDepartment && matchesCredits;
    });
  }, [courses, searchTerm, filters]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleConfirm = () => {
    if (selectedCourse) {
      onSelect(selectedCourse);
      onClose();
      setSelectedCourse(null);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium">
                Select Course
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <Filter className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            </div>

            {/* Filters */}
            {filterOpen && (
              <div className="mb-4 border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">Filters</h3>
                <div className="space-y-2">
                  <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                      Level
                    </label>
                    <select
                      id="level"
                      value={filters.level}
                      onChange={e => setFilters({ ...filters, level: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                    >
                      <option value="">All Levels</option>
                      {COURSE_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      id="department"
                      value={filters.department}
                      onChange={e => setFilters({ ...filters, department: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                    >
                      <option value="">All Departments</option>
                      {DEPARTMENTS.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add other filters here (e.g., credits) */}
                </div>
              </div>
            )}

            {/* Course List */}
            <ul className="max-h-96 overflow-y-auto">
              {filteredCourses.map(course => (
                <li
                  key={course.id}
                  onClick={() => handleCourseSelect(course)}
                  className={`cursor-pointer p-3 rounded-md hover:bg-gray-100 ${
                    selectedCourse?.id === course.id ? 'bg-gray-200' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{course.id}</h4>
                      <p className="text-sm text-gray-500">{course.title}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">{course.credits} cr</span>
                      {currentCourses.some(c => c.id === course.id) && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" /> 
                      )}
                      {selectedCourse?.id === course.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Confirm Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleConfirm}
                disabled={!selectedCourse}
                className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Confirm
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}