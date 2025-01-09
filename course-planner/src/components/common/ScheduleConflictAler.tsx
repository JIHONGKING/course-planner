// src/components/common/ScheduleConflictAlert.tsx 

import { AlertTriangle } from 'lucide-react';

interface ScheduleConflictAlertProps {
  conflicts: Array<{
    courseId: string;
    courseName: string;
    conflictingSlots: Array<{
      existing: {
        dayOfWeek: string;
        startTime: string;
        endTime: string;
      };
      new: {
        dayOfWeek: string;
        startTime: string;
        endTime: string;
      };
    }>;
  }>;
  onClose?: () => void;
}

export default function ScheduleConflictAlert({
  conflicts,
  onClose
}: ScheduleConflictAlertProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
      <div className="flex gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Schedule Conflicts Detected</h3>
          <div className="mt-2 space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={conflict.courseId} className="text-sm text-red-700">
                <p className="font-medium">{conflict.courseName}</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {conflict.conflictingSlots.map((slot, slotIndex) => (
                    <li key={slotIndex}>
                      {slot.new.dayOfWeek} {slot.new.startTime}-{slot.new.endTime}
                      {' '}overlaps with{' '}
                      {slot.existing.startTime}-{slot.existing.endTime}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-3 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}