// src/components/course-planner/AcademicYear.tsx
import { useState } from 'react';
import { ChevronDown, Trash2, Plus, X } from 'lucide-react';
import type { AcademicYear as AcademicYearType } from '../../types/course';
import type { Semester, Course } from '../../types/course';
import CourseSelectionModal from './CourseSelectionModal';

interface AcademicYearProps {
 year: AcademicYearType;
 onRemoveCourse: (semesterId: string, courseId: string) => void;
 onAddCourse: (semesterId: string, course: Course) => void;
}

interface SemesterSummaryProps {
 semester: Semester;
 onRemoveCourse: (courseId: string) => void;
 onAddCourse: (course: Course) => void;
}

export default function AcademicYear({ year, onRemoveCourse, onAddCourse }: AcademicYearProps) {
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

 const handleAddCourse = (semesterId: string) => {
   setSelectedSemesterId(semesterId);
   setIsModalOpen(true);
 };

 const handleCourseSelect = (course: Course) => {
   if (selectedSemesterId) {
     onAddCourse(selectedSemesterId, course);
   }
 };

 const calculateTotalCredits = (semester: Semester): number => {
   return semester.courses.reduce((sum: number, course: Course) => sum + course.credits, 0);
 };

 const totalCredits = year.semesters.reduce(
   (sum: number, semester: Semester) => sum + calculateTotalCredits(semester),
   0
 );

 const targetCredits = 30; // Credits target per year

 return (
   <>
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
           {year.semesters.map((semester: Semester) => (
             <div key={semester.id} className="border border-gray-200 rounded-lg">
               <div className="p-4 border-b bg-gray-50">
                 <div className="flex justify-between items-center">
                   <h3 className="text-lg font-medium text-gray-900">
                     {`${semester.term} ${semester.year}`}
                   </h3>
                   <div className="flex items-center space-x-2">
                     <span className="text-sm font-medium text-gray-700">
                       {calculateTotalCredits(semester).toFixed(2)} credits
                     </span>
                     <button
                       className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                       title="Clear All Courses"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 </div>
               </div>

               <div className="p-4 space-y-2">
                 {semester.courses.map((course: Course) => (
                   <div key={course.id} className="group border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors relative">
                     <button 
                       className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                       title="Remove Course"
                       onClick={() => onRemoveCourse(semester.id, course.id)}
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
                           A: {JSON.parse(course.gradeDistribution).A.toFixed(1)}%
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
                 
                 {[...Array(6 - semester.courses.length)].map((_, i) => (
                   <div key={`empty-${i}`} className="group border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors relative">
                     <div className="flex justify-center items-center min-h-[60px]">
                       <button 
                         onClick={() => handleAddCourse(semester.id)}
                         className="flex items-center space-x-1 text-gray-400 hover:text-gray-600"
                       >
                         <Plus className="h-4 w-4" />
                         <span>Add Course</span>
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>

     <CourseSelectionModal
       isOpen={isModalOpen}
       onClose={() => setIsModalOpen(false)}
       onSelect={handleCourseSelect}
     />
   </>
 );
}