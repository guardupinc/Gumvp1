// Shared active shift data - synced with Scheduling tab
// In production: This would query the database for scheduled shifts

export interface ActiveGuard {
  id: number;
  name: string;
  location: string;
}

export interface ScheduleShift {
  id: number;
  guardId: number;
  guardName: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  hours: number;
  isOvertime?: boolean;
  isDoubleShift?: boolean;
}

// Complete schedule data from Scheduling tab
// This data matches the scheduleData from Scheduling.tsx
const scheduleData: ScheduleShift[] = [
  // Maria Garcia - 48 hours (OVERTIME RISK on Saturday)
  { id: 1, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Monday', date: 'Dec 29', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 2, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Tuesday', date: 'Dec 30', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 3, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Wednesday', date: 'Dec 31', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 4, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Thursday', date: 'Jan 1', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 5, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Friday', date: 'Jan 2', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 6, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Saturday', date: 'Jan 3', startTime: '08:00', endTime: '20:00', location: 'Building B', hours: 12, isOvertime: true, isDoubleShift: true },
  
  // John Smith - 40 hours (STANDARD)
  { id: 7, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Monday', date: 'Dec 29', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 8, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Tuesday', date: 'Dec 30', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 9, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Wednesday', date: 'Dec 31', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 10, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Thursday', date: 'Jan 1', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 11, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Friday', date: 'Jan 2', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  
  // David Lee - 32 hours (UNDER-UTILIZED)
  { id: 12, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Monday', date: 'Dec 29', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 13, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Tuesday', date: 'Dec 30', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 14, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Wednesday', date: 'Dec 31', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 15, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Thursday', date: 'Jan 1', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  
  // Sarah Chen - 40 hours (STANDARD)
  { id: 16, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Monday', date: 'Dec 29', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 17, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Tuesday', date: 'Dec 30', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 18, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Wednesday', date: 'Dec 31', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 19, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Thursday', date: 'Jan 1', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 20, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Friday', date: 'Jan 2', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  
  // Robert Brown - 24 hours (PART-TIME)
  { id: 21, guardId: 5, guardName: 'Robert Brown', dayOfWeek: 'Monday', date: 'Dec 29', startTime: '08:00', endTime: '16:00', location: 'Building D', hours: 8 },
  { id: 22, guardId: 5, guardName: 'Robert Brown', dayOfWeek: 'Wednesday', date: 'Dec 31', startTime: '08:00', endTime: '16:00', location: 'Building D', hours: 8 },
  { id: 23, guardId: 5, guardName: 'Robert Brown', dayOfWeek: 'Friday', date: 'Jan 2', startTime: '08:00', endTime: '16:00', location: 'Building D', hours: 8 },
];

// Get the current day of week
const getCurrentDayOfWeek = (): string => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  return dayNames[today.getDay()];
};

// Get today's scheduled shifts based on current day of week
export const getTodaysScheduledShifts = (): ScheduleShift[] => {
  const todayDayName = getCurrentDayOfWeek();
  return scheduleData.filter(shift => shift.dayOfWeek === todayDayName);
};

// Get list of guards currently on active shifts (based on today's schedule)
// This data is the single source of truth for guard shift status
export function getActiveShiftGuards(): ActiveGuard[] {
  const todaysShifts = getTodaysScheduledShifts();
  
  // Map today's shifts to ActiveGuard format
  return todaysShifts.map(shift => ({
    id: shift.guardId,
    name: shift.guardName,
    location: shift.location
  }));
}

// Check if a guard is currently on an active shift
export function isGuardOnShift(guardId: number): boolean {
  const activeGuards = getActiveShiftGuards();
  return activeGuards.some(guard => guard.id === guardId);
}

// Get the total count of active guards
export function getActiveShiftCount(): number {
  return getActiveShiftGuards().length;
}