// src/components/course-planner/CourseScheduleEditor.tsx

import React, { useState, useCallback } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { Schedule } from '@/types/course';

interface CourseScheduleEditorProps {
  schedule: Schedule[];
  onChange: (schedule: Schedule[]) => void;
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' }
] as const;

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8; // Starting from 8 AM
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export default function CourseScheduleEditor({
  schedule,
  onChange,
  className = ''
}: CourseScheduleEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const validateTimeSlot = useCallback((slot: Schedule): boolean => {
    const start = slot.startTime;
    const end = slot.endTime;
    
    if (start >= end) {
      setError('End time must be after start time');
      return false;
    }
    
    // Check for overlaps within the same day
    const overlappingSlot = schedule.find(
      existing => 
        existing !== slot &&
        existing.dayOfWeek === slot.dayOfWeek &&
        ((start >= existing.startTime && start < existing.endTime) ||
         (end > existing.startTime && end <= existing.endTime) ||
         (start <= existing.startTime && end >= existing.endTime))
    );

    if (overlappingSlot) {
      setError('Time slots cannot overlap on the same day');
      return false;
    }

    setError(null);
    return true;
  }, [schedule]);

  const addTimeSlot = useCallback(() => {
    const newSlot: Schedule = {
      dayOfWeek: 'MON',
      startTime: '09:00',
      endTime: '10:00'
    };

    if (validateTimeSlot(newSlot)) {
      onChange([...schedule, newSlot]);
    }
  }, [schedule, onChange, validateTimeSlot]);

  const updateTimeSlot = useCallback((index: number, updates: Partial<Schedule>) => {
    const updatedSchedule = [...schedule];
    const updatedSlot = { ...updatedSchedule[index], ...updates };
    
    if (validateTimeSlot(updatedSlot)) {
      updatedSchedule[index] = updatedSlot;
      onChange(updatedSchedule);
    }
  }, [schedule, onChange, validateTimeSlot]);

  const removeTimeSlot = useCallback((index: number) => {
    onChange(schedule.filter((_, i) => i !== index));
  }, [schedule, onChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Schedule
        </h3>
        <button
          onClick={addTimeSlot}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Time Slot
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {schedule.map((slot, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50"
          >
            <select
              value={slot.dayOfWeek}
              onChange={(e) => updateTimeSlot(index, { dayOfWeek: e.target.value as Schedule['dayOfWeek'] })}
              className="block w-32 text-sm rounded-md border-gray-300 shadow-sm"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>

            <select
              value={slot.startTime}
              onChange={(e) => updateTimeSlot(index, { startTime: e.target.value })}
              className="block w-24 text-sm rounded-md border-gray-300 shadow-sm"
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <span className="text-gray-500">to</span>

            <select
              value={slot.endTime}
              onChange={(e) => updateTimeSlot(index, { endTime: e.target.value })}
              className="block w-24 text-sm rounded-md border-gray-300 shadow-sm"
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <button
              onClick={() => removeTimeSlot(index)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {schedule.length === 0 && (
          <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg">
            No time slots added yet
          </div>
        )}
      </div>
    </div>
  );
}