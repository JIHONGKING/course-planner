// src/lib/validators/scheduleConflictValidator.ts

interface TimeSlot {
    dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  }
  
  interface CourseSchedule {
    courseId: string;
    courseName: string;
    timeSlots: TimeSlot[];
  }
  
  export class ScheduleConflictValidator {
    private convertTimeToMinutes(time: string): number {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    }
  
    private doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
      if (slot1.dayOfWeek !== slot2.dayOfWeek) return false;
  
      const start1 = this.convertTimeToMinutes(slot1.startTime);
      const end1 = this.convertTimeToMinutes(slot1.endTime);
      const start2 = this.convertTimeToMinutes(slot2.startTime);
      const end2 = this.convertTimeToMinutes(slot2.endTime);
  
      return (start1 < end2 && end1 > start2);
    }
  
    findConflicts(schedules: CourseSchedule[]): Array<[string, string]> {
      const conflicts: Array<[string, string]> = [];
  
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const schedule1 = schedules[i];
          const schedule2 = schedules[j];
  
          // Check each combination of time slots
          const hasConflict = schedule1.timeSlots.some(slot1 =>
            schedule2.timeSlots.some(slot2 =>
              this.doTimeSlotsOverlap(slot1, slot2)
            )
          );
  
          if (hasConflict) {
            conflicts.push([schedule1.courseId, schedule2.courseId]);
          }
        }
      }
  
      return conflicts;
    }
  
    validateSchedule(
      existingSchedules: CourseSchedule[],
      newCourse: CourseSchedule
    ): {
      isValid: boolean;
      conflicts: Array<{
        courseId: string;
        courseName: string;
        conflictingSlots: Array<{
          existing: TimeSlot;
          new: TimeSlot;
        }>;
      }>;
    } {
      const conflicts = [];
  
      for (const existingSchedule of existingSchedules) {
        const conflictingSlots = [];
  
        for (const newSlot of newCourse.timeSlots) {
          for (const existingSlot of existingSchedule.timeSlots) {
            if (this.doTimeSlotsOverlap(newSlot, existingSlot)) {
              conflictingSlots.push({
                existing: existingSlot,
                new: newSlot
              });
            }
          }
        }
  
        if (conflictingSlots.length > 0) {
          conflicts.push({
            courseId: existingSchedule.courseId,
            courseName: existingSchedule.courseName,
            conflictingSlots
          });
        }
      }
  
      return {
        isValid: conflicts.length === 0,
        conflicts
      };
    }
  
    formatTimeConflictMessage(conflict: {
      courseId: string;
      courseName: string;
      conflictingSlots: Array<{
        existing: TimeSlot;
        new: TimeSlot;
      }>;
    }): string {
      return `Schedule conflict with ${conflict.courseName} (${conflict.courseId}): ` +
        conflict.conflictingSlots.map(slot =>
          `${slot.new.dayOfWeek} ${slot.new.startTime}-${slot.new.endTime} ` +
          `overlaps with ${slot.existing.startTime}-${slot.existing.endTime}`
        ).join(', ');
    }
  }