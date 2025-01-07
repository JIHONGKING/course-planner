// src/components/course-planner/CourseSelectionModal.tsx
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, Filter } from 'lucide-react';
import type { Course, GradeDistribution } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface CourseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (course: Course) => void;
  currentSemesterCourses?: Course[];
}

export default function CourseSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentSemesterCourses = []
}: CourseSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    department: '',
    level: '',
  });

  useEffect(() => {
    const searchCourses = async () => {
      if (!searchTerm) {
        setCourses([]);
        return;
      }
      
      setLoading(true);
      try {
        const params = new URLSearchParams({
          query: searchTerm,
          page: String(page),
          ...filters
        });

        const response = await fetch(`/api/courses/search?${params}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch courses');
        }

        const filteredCourses = data.courses.filter(
          (course: Course) => !currentSemesterCourses?.some(c => c.id === course.id)
        );
        
        setCourses(filteredCourses);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Failed to search courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchCourses, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, page, filters, currentSemesterCourses]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium">
              Search Courses
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by course name, code, or description"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">All Departments</option>
                <option value="COMP SCI">Computer Science</option>
                <option value="MATH">Mathematics</option>
                <option value="STAT">Statistics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">All Levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>
          </div>

          {/* Course List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? 'No courses found' : 'Start typing to search courses'}
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onSelect(course)}
                  className={`p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{course.code}</h3>
                      <p className="text-sm text-gray-500">{course.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{course.credits} Credits</div>
                      <div className="text-xs text-green-600">
                         A: {getGradeA(course.gradeDistribution)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 rounded-md ${
                    page === i + 1
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}