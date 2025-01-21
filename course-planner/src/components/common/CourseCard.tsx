///Users/jihong/Desktop/AutoClassfinder/course-planner/src/components/common/CourseCard.tsx
import React, { useState, useCallback } from 'react';
import { Info, Plus, X, Clock } from 'lucide-react';
import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';
import { getGradeA } from '@/utils/gradeUtils';
import { Dialog } from '@headlessui/react';
import CourseScheduleEditor from '../course-planner/CourseScheduleEditor';
import { useCourseSchedule } from '@/hooks/useCourseSchedule';

interface CourseCardProps {
  course: Course;
  onAdd?: (course: Course) => void;
  onRemove?: () => void;
  onInfo?: (course: Course) => void;
  onClick?: () => void;
  showPrerequisites?: boolean;
  isInPlan?: boolean;
  className?: string;
}

export default function CourseCard({
  course,
  onAdd,
  onRemove,
  onInfo,
  onClick,
  showPrerequisites = true,
  isInPlan = false,
  className = ''
}: CourseCardProps) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { schedule, updateSchedule, isLoading, error } = useCourseSchedule({
    courseId: course.id,
    initialSchedule: course.courseSchedules
  });

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAdd) {
      onAdd(course);
    }
  }, [course, onAdd]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  }, [onRemove]);

  const handleScheduleUpdate = async (newSchedule: Schedule[]) => {
    try {
      console.log('Submitting schedule update:', newSchedule);
      await updateSchedule(newSchedule);
      setIsScheduleModalOpen(false);
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to update schedule:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to update schedule';
      setErrorMessage(errorMessage);
    }
  };

  const handleScheduleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScheduleModalOpen(true);
  }, []);

  const formatScheduleDisplay = useCallback((schedules: Course['courseSchedules']) => {
    if (!schedules?.length) return null;
    return schedules.map(slot => 
      `${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`
    ).join(', ');
  }, []);

  return (
    <>
      <div 
        onClick={onClick}
        className={`group relative border border-gray-200 rounded-md p-4 
                   ${onClick ? 'cursor-pointer' : ''} 
                   hover:bg-gray-50 transition-colors
                   ${className}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">{course.code}</h3>
            <p className="text-sm text-gray-500">{course.name}</p>
            <p className="text-xs text-gray-400">{course.credits} credits</p>
            <div className="text-xs text-green-600">
              A: {getGradeA(course.gradeDistribution)}%
            </div>
          </div>
          
          <div className="flex space-x-2">
            {onAdd && (
              <button
                onClick={handleAdd}
                className="p-1 text-gray-400 hover:text-green-500"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={handleRemove}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {schedule && schedule.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatScheduleDisplay(schedule)}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleScheduleClick}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Clock className="h-4 w-4" />
          {schedule?.length ? 'Edit Schedule' : 'Add Schedule'}
        </button>
      </div>

      <Dialog
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md bg-white rounded-xl p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Edit Course Schedule
            </Dialog.Title>

            <CourseScheduleEditor
              schedule={schedule || []}
              onChange={async (newSchedule) => {
                try {
                  await updateSchedule(newSchedule);
                  setIsScheduleModalOpen(false);
                } catch (err) {
                  console.error('Failed to update schedule:', err);
                }
              }}
            />

            {errorMessage && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
