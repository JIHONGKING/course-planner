// src/components/common/CourseCard.tsx

import React, { useState } from 'react';
import { Info, Plus, X, Clock } from 'lucide-react';
import type { Course } from '@/types/course';
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
  const { schedule, updateSchedule, isLoading, error } = useCourseSchedule({
    courseId: course.id,
    initialSchedule: course.schedule
  });

  // Schedule display helper
  const formatScheduleDisplay = (schedule: Course['schedule']) => {
    if (!schedule?.length) return null;

    return schedule.map(slot => 
      `${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`
    ).join(', ');
  };

  return (
    <>
      <div 
        onClick={onClick}
        className={`group relative border border-gray-200 rounded-md p-4 
                   ${onClick ? 'cursor-pointer' : ''} 
                   hover:bg-gray-50 transition-colors
                   ${className}`}
      >
        {/* 기존 CourseCard 내용... */}
        
        {/* Schedule Section */}
        {schedule && schedule.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatScheduleDisplay(schedule)}</span>
            </div>
          </div>
        )}

        {/* Schedule Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsScheduleModalOpen(true);
          }}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Clock className="h-4 w-4" />
          {schedule?.length ? 'Edit Schedule' : 'Add Schedule'}
        </button>
      </div>

      {/* Schedule Editor Modal */}
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

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
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