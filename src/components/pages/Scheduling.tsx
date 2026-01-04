import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, MapPin, Clock, User, Filter, ChevronDown, AlertTriangle, DollarSign, Users, CheckCircle, Search } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { useAppState } from '../../contexts/AppStateContext';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ScheduleShift {
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

interface GuardWeeklySchedule {
  guardId: number;
  guardName: string;
  badgeId: string;
  totalHours: number;
  hasOvertimeRisk: boolean;
  overtimeCost?: number;
  shifts: Record<string, ScheduleShift[]>; // dayOfWeek -> shifts
}

interface UnassignedShift {
  id: number;
  dayOfWeek: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  hours: number;
}

interface AvailableGuard {
  id: number;
  name: string;
  badgeId: string;
  role: string;
  hoursThisWeek: number;
  canWorkOvertime: boolean;
}

// ============================================================================
// SAMPLE DATA (Week of Dec 28, 2025 - Jan 3, 2026)
// ============================================================================

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekDates = ['Dec 29', 'Dec 30', 'Dec 31', 'Jan 1', 'Jan 2', 'Jan 3', 'Jan 4'];

// Site color coding
const siteColors: Record<string, string> = {
  'Building A': '#3B82F6', // Blue
  'Building B': '#8B5CF6', // Purple
  'Building C': '#10B981', // Green
  'Building D': '#F59E0B', // Amber
};

// Site abbreviations for cleaner display
const siteAbbreviations: Record<string, string> = {
  'Building A': 'Main',
  'Building B': 'North',
  'Building C': 'West',
  'Building D': 'East',
};

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

const unassignedShifts: UnassignedShift[] = [
  { id: 101, dayOfWeek: 'Friday', date: 'Jan 2', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 102, dayOfWeek: 'Saturday', date: 'Jan 3', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
];

const availableGuards: AvailableGuard[] = [
  { id: 6, name: 'Lisa Wang', badgeId: 'BADGE-1029', role: 'Guard', hoursThisWeek: 32, canWorkOvertime: true },
  { id: 7, name: 'Alex Johnson', badgeId: 'BADGE-1030', role: 'Guard', hoursThisWeek: 16, canWorkOvertime: true },
  { id: 8, name: 'Kevin Torres', badgeId: 'BADGE-1031', role: 'Senior Guard', hoursThisWeek: 0, canWorkOvertime: false },
  { id: 9, name: 'Maria Garcia', badgeId: 'BADGE-1032', role: 'Guard', hoursThisWeek: 40, canWorkOvertime: true },
  { id: 10, name: 'James Wilson', badgeId: 'BADGE-1033', role: 'Guard', hoursThisWeek: 24, canWorkOvertime: true },
  { id: 11, name: 'Patricia Moore', badgeId: 'BADGE-1034', role: 'Senior Guard', hoursThisWeek: 36, canWorkOvertime: false },
  { id: 12, name: 'Michael Davis', badgeId: 'BADGE-1035', role: 'Guard', hoursThisWeek: 8, canWorkOvertime: true },
  { id: 13, name: 'Jennifer Taylor', badgeId: 'BADGE-1036', role: 'Guard', hoursThisWeek: 20, canWorkOvertime: true },
  { id: 14, name: 'Christopher Lee', badgeId: 'BADGE-1037', role: 'Guard', hoursThisWeek: 40, canWorkOvertime: true },
  { id: 15, name: 'Amanda Martinez', badgeId: 'BADGE-1038', role: 'Senior Guard', hoursThisWeek: 12, canWorkOvertime: false },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function Scheduling() {
  const { appState } = useAppState();
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [showOvertimeDetails, setShowOvertimeDetails] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOpenShiftsDrawer, setShowOpenShiftsDrawer] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [highlightedGuardId, setHighlightedGuardId] = useState<number | null>(null);
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  const [approvedOvertimeShifts, setApprovedOvertimeShifts] = useState<Set<number>>(new Set());
  const [approvingOT, setApprovingOT] = useState(false);
  const [flashingOvertimeRows, setFlashingOvertimeRows] = useState<Set<number>>(new Set());
  const [isOtApproved, setIsOtApproved] = useState(false);
  const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);
  const [assignedShifts, setAssignedShifts] = useState<Set<number>>(new Set());
  const [assigningShiftId, setAssigningShiftId] = useState<number | null>(null);
  const [newlyAssignedShifts, setNewlyAssignedShifts] = useState<ScheduleShift[]>([]);
  const [confirmationModal, setConfirmationModal] = useState<{
    open: boolean;
    guardName: string;
    guardId: number;
    shiftId: number;
    shiftDetails: string;
    isOvertimeRisk: boolean;
    overtimeCost?: number;
  } | null>(null);
  
  // Grid Click Context (for opening drawer from grid)
  const [gridClickContext, setGridClickContext] = useState<{
    shiftId: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string;
    hours: number;
  } | null>(null);
  
  // Guard Search State
  const [guardSearchQuery, setGuardSearchQuery] = useState('');
  
  // Create Shift Form State
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null);
  const [selectedShiftSite, setSelectedShiftSite] = useState<string>('Building A');
  const [shiftStartTime, setShiftStartTime] = useState<string>('08:00');
  const [shiftEndTime, setShiftEndTime] = useState<string>('16:00');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Calculate which day is today and current time percentage
  const getTodayInfo = () => {
    const now = currentTime;
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    const date = now.getDate();

    // Week dates: Mon Dec 29 2025, Tue Dec 30 2025, Wed Dec 31 2025, Thu Jan 1 2026, Fri Jan 2 2026, Sat Jan 3 2026, Sun Jan 4 2026
    const weekFullDates = [
      new Date(2025, 11, 29), // Monday Dec 29, 2025
      new Date(2025, 11, 30), // Tuesday Dec 30, 2025
      new Date(2025, 11, 31), // Wednesday Dec 31, 2025
      new Date(2026, 0, 1),   // Thursday Jan 1, 2026
      new Date(2026, 0, 2),   // Friday Jan 2, 2026
      new Date(2026, 0, 3),   // Saturday Jan 3, 2026
      new Date(2026, 0, 4),   // Sunday Jan 4, 2026
    ];

    // Find which day matches today
    let todayIndex = -1;
    weekFullDates.forEach((weekDate, idx) => {
      if (weekDate.getFullYear() === year && 
          weekDate.getMonth() === month && 
          weekDate.getDate() === date) {
        todayIndex = idx;
      }
    });

    // Calculate current time percentage (0-100% of the day)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timePercentage = ((hours * 60 + minutes) / (24 * 60)) * 100;

    // Format for header clock
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayOfWeekName = dayNames[now.getDay()];
    const monthName = monthNames[now.getMonth()];
    const liveClock = `${dayOfWeekName} ${monthName} ${date} • ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return {
      todayIndex,
      isToday: todayIndex !== -1,
      dayName: todayIndex !== -1 ? weekDays[todayIndex] : '',
      timePercentage,
      currentTimeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      currentHourMinute: hours * 60 + minutes, // Total minutes since midnight
      liveClock
    };
  };

  const todayInfo = getTodayInfo();

  // Helper function to determine shift time status
  const getShiftTimeStatus = (startTime: string, endTime: string, dayOfWeek: string) => {
    // Only calculate for today's shifts
    if (todayInfo.dayName !== dayOfWeek) {
      return 'future'; // Not today, treat as future
    }

    // Parse time strings to minutes since midnight
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      // Handle midnight crossing (00:00 is treated as 24:00 for end time)
      if (hours === 0 && timeStr === endTime) {
        return 24 * 60; // End of day
      }
      return hours * 60 + minutes;
    };

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    const currentMinutes = todayInfo.currentHourMinute;

    // Determine status
    if (currentMinutes < startMinutes) {
      return 'future'; // Shift hasn't started yet
    } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return 'active'; // Shift is happening now
    } else {
      return 'past'; // Shift has ended
    }
  };

  // Process schedule data into guard-based rows
  const processScheduleData = (): GuardWeeklySchedule[] => {
    const guardMap = new Map<number, GuardWeeklySchedule>();

    // Combine original schedule data with newly assigned shifts
    const allShifts = [...scheduleData, ...newlyAssignedShifts];

    allShifts.forEach(shift => {
      if (!guardMap.has(shift.guardId)) {
        guardMap.set(shift.guardId, {
          guardId: shift.guardId,
          guardName: shift.guardName,
          badgeId: `BADGE-10${20 + shift.guardId}`,
          totalHours: 0,
          hasOvertimeRisk: false,
          shifts: {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: []
          }
        });
      }

      const guardSchedule = guardMap.get(shift.guardId)!;
      guardSchedule.shifts[shift.dayOfWeek].push(shift);
      guardSchedule.totalHours += shift.hours;

      // Check for overtime (>40 hours per week)
      if (guardSchedule.totalHours > 40) {
        guardSchedule.hasOvertimeRisk = true;
        const overtimeHours = guardSchedule.totalHours - 40;
        // $17/hr base + 1.5x overtime = $25.50/hr OT rate
        guardSchedule.overtimeCost = Math.round(overtimeHours * 25.5);
      }
    });

    return Array.from(guardMap.values());
  };

  const guardSchedules = processScheduleData();
  
  // Compute updated available guards list with newly assigned shifts included
  const computedAvailableGuards = availableGuards.map(guard => {
    // Find if this guard has been assigned any new shifts
    const additionalHours = newlyAssignedShifts
      .filter(shift => shift.guardId === guard.id)
      .reduce((sum, shift) => sum + shift.hours, 0);
    
    const updatedHours = guard.hoursThisWeek + additionalHours;
    const hasOvertimeRisk = updatedHours > 40;
    
    return {
      ...guard,
      hoursThisWeek: updatedHours,
      hasOvertimeRisk
    };
  });

  // Calculate overtime guards dynamically
  const calculateOvertime = () => {
    const overtimeGuards = guardSchedules
      .filter(guard => guard.totalHours > 40)
      .map(guard => {
        const overtimeHours = guard.totalHours - 40;
        const baseRate = 25.50;
        const overtimeRate = baseRate * 1.5;
        const overtimeCost = overtimeHours * overtimeRate;
        
        return {
          guardId: guard.guardId,
          guardName: guard.guardName,
          badgeId: guard.badgeId,
          totalHours: guard.totalHours,
          overtimeHours,
          overtimeCost: Math.round(overtimeCost * 100) / 100, // Round to 2 decimals
          baseRate,
          overtimeRate
        };
      });
    
    const totalOvertimeCost = overtimeGuards.reduce((sum, g) => sum + g.overtimeCost, 0);
    
    return {
      overtimeGuards,
      totalOvertimeCost: Math.round(totalOvertimeCost * 100) / 100
    };
  };

  const overtimeData = calculateOvertime();

  // Calculate KPIs
  const totalHours = guardSchedules.reduce((sum, g) => sum + g.totalHours, 0);
  const overtimeRisks = guardSchedules.filter(g => g.hasOvertimeRisk).length;
  const totalOvertimeCost = guardSchedules.reduce((sum, g) => sum + (g.overtimeCost || 0), 0);
  const openShifts = unassignedShifts.length;

  // Get ranked guard suggestions for Smart Popover
  const getRankedGuards = (shiftHours: number) => {
    const baseRate = 25.0; // $25/hr standard rate
    const overtimeRate = 37.5; // $25 * 1.5 = $37.50/hr
    
    // Calculate for each available guard
    const rankedGuards = computedAvailableGuards.map(guard => {
      const currentHours = guard.hoursThisWeek;
      const newTotalHours = currentHours + shiftHours;
      const willCauseOvertime = newTotalHours > 40;
      
      let cost = shiftHours * baseRate; // Base cost
      let overtimeCost = 0;
      
      if (willCauseOvertime) {
        const hoursIntoOvertime = newTotalHours - 40;
        const regularHours = shiftHours - hoursIntoOvertime;
        cost = (regularHours * baseRate) + (hoursIntoOvertime * overtimeRate);
        overtimeCost = hoursIntoOvertime * (overtimeRate - baseRate); // Extra cost due to OT
      }
      
      return {
        id: guard.id,
        name: guard.name,
        currentHours,
        newTotalHours,
        willCauseOvertime,
        cost: Math.round(cost),
        overtimeCost: Math.round(overtimeCost),
        isAvailable: !guard.hasOvertimeRisk // Available if not already in OT
      };
    });
    
    // Sort by: Available first, then by lowest current hours (best fit)
    rankedGuards.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1; // Available guards first
      }
      return a.currentHours - b.currentHours; // Lower hours = better fit
    });
    
    return rankedGuards.slice(0, 3); // Return top 3
  };

  // Get ALL guards with risk analysis and conflict detection
  const getAllGuardsWithAnalysis = (shiftHours: number, dayOfWeek: string, startTime: string, endTime: string) => {
    const baseRate = 25.0; // $25/hr standard rate
    const overtimeRate = 37.5; // $25 * 1.5 = $37.50/hr
    
    // Calculate for ALL available guards
    const analyzedGuards = availableGuards.map(guard => {
      const currentHours = guard.hoursThisWeek;
      const newTotalHours = currentHours + shiftHours;
      const willCauseOvertime = newTotalHours > 40;
      
      // Check for scheduling conflict (already working this time slot)
      const hasConflict = [...scheduleData, ...newlyAssignedShifts].some(shift => 
        shift.guardId === guard.id &&
        shift.dayOfWeek === dayOfWeek &&
        shift.startTime === startTime &&
        shift.endTime === endTime
      );
      
      let cost = shiftHours * baseRate; // Base cost
      let overtimeCost = 0;
      
      if (willCauseOvertime) {
        const hoursIntoOvertime = newTotalHours - 40;
        const regularHours = shiftHours - hoursIntoOvertime;
        cost = (regularHours * baseRate) + (hoursIntoOvertime * overtimeRate);
        overtimeCost = hoursIntoOvertime * (overtimeRate - baseRate); // Extra cost due to OT
      }
      
      return {
        id: guard.id,
        name: guard.name,
        role: guard.role,
        currentHours,
        newTotalHours,
        willCauseOvertime,
        cost: Math.round(cost),
        overtimeCost: Math.round(overtimeCost),
        overtimeHourlyRate: overtimeRate,
        standardRate: baseRate,
        isAvailable: !willCauseOvertime,
        hasConflict,
        canWorkOvertime: guard.canWorkOvertime
      };
    });
    
    // Sort by: No conflict first, then available (no OT), then by lowest current hours
    analyzedGuards.sort((a, b) => {
      if (a.hasConflict !== b.hasConflict) {
        return a.hasConflict ? 1 : -1; // No conflict first
      }
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1; // Available guards first
      }
      return a.currentHours - b.currentHours; // Lower hours = better fit
    });
    
    // Separate into Top 3 and Full Roster
    const topRecommendations = analyzedGuards.slice(0, 3);
    const fullRoster = analyzedGuards.slice(3);
    
    return { topRecommendations, fullRoster, allGuards: analyzedGuards };
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Scheduling"
        primaryAction={{
          label: 'Create Shift',
          onClick: () => setShowCreateShiftModal(true),
          icon: <Plus size={16} />,
        }}
      />

      {/* Alert Buttons Container */}
      <div className="scheduling-alert-buttons">
        <button className="scheduling-alert-btn scheduling-alert-critical" onClick={() => {
          setGridClickContext(null); // Clear grid context when opening from top button
          setShowOpenShiftsDrawer(true);
        }}>
          <AlertTriangle size={18} />
          <span>{unassignedShifts.length - assignedShifts.size} Open Shift{unassignedShifts.length - assignedShifts.size !== 1 ? 's' : ''}</span>
        </button>
        <button 
          className={`scheduling-alert-btn ${isOtApproved ? 'scheduling-alert-success' : 'scheduling-alert-warning'}`}
          onClick={() => setShowOvertimeModal(true)}
        >
          {isOtApproved ? <CheckCircle size={18} /> : <Clock size={18} />}
          <span>{isOtApproved ? '1 OT Authorized' : '1 Overtime Risk'}</span>
        </button>
      </div>

      {/* Main Grid Container */}
      <div className="scheduling-grid-container-clean">
        <Card className="schedule-roster-card-clean">
          {/* Grid Header */}
          <div className="roster-grid-header-clean">
            <div className="roster-header-cell-clean employee-column">Guard</div>
            {weekDays.map((day, idx) => {
              const isToday = todayInfo.todayIndex === idx;
              return (
                <div 
                  key={day} 
                  className={`roster-header-cell-clean day-column ${isToday ? 'day-column-today' : ''}`}
                  style={isToday ? {
                    borderTop: '3px solid #F59E0B',
                    boxShadow: '0 0 10px #F59E0B',
                    borderLeft: '1px solid #F59E0B',
                    borderRight: '1px solid #F59E0B',
                    background: 'linear-gradient(to bottom, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)'
                  } : {}}
                >
                  <div className="day-header-clean" style={isToday ? { color: '#F59E0B', fontWeight: 700 } : {}}>
                    <span className="day-name-clean">{day.substring(0, 3)}</span>
                    <span className="day-date-clean">{weekDates[idx]}</span>
                    {isToday && (
                      <>
                        <span className="today-badge">TODAY</span>
                        <span className="live-clock">{todayInfo.liveClock}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guard Rows */}
          <div className="roster-grid-body-clean">
            {/* PRIORITY ROW #1: Unassigned/Open Shifts - MOVED TO TOP */}
            <div className="roster-grid-row-timeline">
              <div className="roster-cell-timeline employee-info-timeline">
                <div className="employee-avatar-timeline unassigned-avatar">
                  <AlertTriangle size={20} />
                </div>
                <div className="employee-details-timeline">
                  <span className="employee-name-timeline">Open Shifts</span>
                  <span className="employee-hours-timeline">{unassignedShifts.reduce((sum, s) => sum + s.hours, 0)}h unassigned</span>
                </div>
              </div>

              {weekDays.map((day, idx) => {
                const openShift = unassignedShifts.find(s => s.dayOfWeek === day);
                // Hide shift if it's been assigned
                const isAssigned = openShift && assignedShifts.has(openShift.id);
                const isToday = todayInfo.todayIndex === idx;
                const shiftStatus = openShift ? getShiftTimeStatus(openShift.startTime, openShift.endTime, day) : null;
                
                return (
                  <div 
                    key={day} 
                    className={`roster-cell-timeline day-cell-timeline ${isToday ? 'day-cell-today' : ''}`}
                    style={isToday ? {
                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      borderLeft: '1px solid #F59E0B',
                      borderRight: '1px solid #F59E0B'
                    } : {
                      backgroundColor: 'rgba(255, 255, 255, 0.04)'
                    }}
                  >
                    {openShift && !isAssigned && (
                      <div 
                        className={`shift-pill shift-pill-ghost ${shiftStatus === 'active' ? 'shift-pill-active-urgent' : ''} ${shiftStatus === 'past' ? 'shift-pill-past' : ''}`}
                        title={`${openShift.startTime}-${openShift.endTime} @ ${openShift.location}`}
                        onClick={() => {
                          setGridClickContext({
                            shiftId: openShift.id,
                            dayOfWeek: openShift.dayOfWeek,
                            startTime: openShift.startTime,
                            endTime: openShift.endTime,
                            location: openShift.location,
                            hours: openShift.hours
                          });
                          setShowOpenShiftsDrawer(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <Plus size={24} className="shift-pill-ghost-icon" />
                        <span className="shift-pill-ghost-label">Add Guard</span>
                        {shiftStatus === 'active' && <span className="live-badge-urgent">LIVE</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Regular Guard Rows */}
            {guardSchedules.map(guard => {
              const isFlashing = flashingOvertimeRows.has(guard.guardId);
              const isHighlighted = highlightedGuardId === guard.guardId;
              
              return (
              <div 
                key={guard.guardId} 
                className={`roster-grid-row-timeline ${isFlashing ? 'overtime-flash' : ''}`}
                data-guard-id={guard.guardId}
                style={isHighlighted ? {
                  background: 'rgba(245, 158, 11, 0.05)'
                } : {}}
              >
                {/* Employee Info */}
                <div className="roster-cell-timeline employee-info-timeline">
                  <div className="employee-avatar-timeline">
                    <User size={20} />
                  </div>
                  <div className="employee-details-timeline">
                    <span className="employee-name-timeline">{guard.guardName}</span>
                    <span className="employee-hours-timeline">
                      {guard.totalHours}h
                      {guard.hasOvertimeRisk && <span className="ot-badge-timeline">OT</span>}
                    </span>
                  </div>
                </div>

                {/* Day Columns */}
                {weekDays.map((day, idx) => {
                  const dayShifts = guard.shifts[day];
                  const isToday = todayInfo.todayIndex === idx;
                  return (
                    <div 
                      key={day} 
                      className={`roster-cell-timeline day-cell-timeline ${isToday ? 'day-cell-today' : ''}`}
                      style={isToday ? {
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        borderLeft: '1px solid #F59E0B',
                        borderRight: '1px solid #F59E0B'
                      } : {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      {dayShifts.map(shift => {
                        const shiftStatus = getShiftTimeStatus(shift.startTime, shift.endTime, day);
                        const isApproved = approvedOvertimeShifts.has(shift.id);
                        return (
                          <div
                            key={shift.id}
                            className={`shift-pill ${shift.isOvertime && !isApproved ? 'shift-pill-overtime' : 'shift-pill-standard'} ${shiftStatus === 'active' ? 'shift-pill-active' : ''} ${shiftStatus === 'past' ? 'shift-pill-past' : ''}`}
                            title={`${shift.startTime}-${shift.endTime} @ ${shift.location}`}
                            style={isApproved && shift.isOvertime ? {
                              borderColor: '#10B981'
                            } : {}}
                          >
                            <div className="shift-pill-color-strip" style={{ backgroundColor: siteColors[shift.location] || '#888' }}></div>
                            <div className="shift-pill-content-main">
                              <div className="shift-pill-time">{shift.startTime} - {shift.endTime}</div>
                              <div className="shift-pill-location">
                                {siteAbbreviations[shift.location] || shift.location} Gate
                              </div>
                            </div>
                            {shift.isOvertime && (
                              <div 
                                className="shift-pill-ot-badge"
                                style={isApproved ? {
                                  background: '#10B981',
                                  color: '#FFFFFF'
                                } : {}}
                              >
                                {isApproved ? 'OT ✓' : 'OT'}
                              </div>
                            )}
                            {shiftStatus === 'active' && <span className="live-badge">LIVE</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
            })}
          </div>
        </Card>

        {/* Available Staff Sidebar */}
        <Card className="available-staff-sidebar-clean">
          <div className="sidebar-header-clean">
            <Users size={18} />
            <h3>Available Staff</h3>
          </div>

          <div className="available-staff-list-clean">
            {computedAvailableGuards.map(guard => {
              const statusColor = guard.hasOvertimeRisk ? '#F59E0B' : '#3BD16F';
              return (
                <div key={guard.id} className="available-guard-card-clean" draggable>
                  <div className="guard-avatar-minimal">
                    <User size={16} />
                  </div>
                  <div className="guard-info-minimal">
                    <div className="guard-info-row">
                      <span className="guard-name-minimal">
                        <span 
                          style={{
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            marginRight: '6px'
                          }}
                        />
                        {guard.name}
                      </span>
                      <span className="guard-hours-minimal" style={{
                        color: guard.hasOvertimeRisk ? '#F59E0B' : '#9CA3AF'
                      }}>
                        {guard.hoursThisWeek}h / 40h
                      </span>
                    </div>
                    <span className="guard-role-minimal">{guard.role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Open Shifts Drawer */}
      {showOpenShiftsDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => {
            setShowOpenShiftsDrawer(false);
            setGridClickContext(null);
            setGuardSearchQuery('');
          }} />
          <div className="scheduling-drawer">
            <div className="drawer-header">
              {gridClickContext ? (
                <>
                  <div>
                    <h2>Assign Shift: {gridClickContext.dayOfWeek} ({gridClickContext.startTime} - {gridClickContext.endTime})</h2>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#9CA3AF', 
                      marginTop: '4px',
                      fontWeight: 400 
                    }}>
                      {gridClickContext.location} • {gridClickContext.hours} Hours
                    </p>
                  </div>
                </>
              ) : (
                <h2>Unfilled Shifts ({unassignedShifts.length - assignedShifts.size})</h2>
              )}
              <button className="drawer-close-btn" onClick={() => {
                setShowOpenShiftsDrawer(false);
                setGridClickContext(null);
                setGuardSearchQuery('');
              }}>
                ×
              </button>
            </div>
            <div className="drawer-content">
              {gridClickContext ? (
                // Show ALL guards with two-tier list + search
                <>
                  {/* Sticky Search Bar */}
                  <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#0B1220',
                    padding: '16px',
                    borderBottom: '1px solid #2A3441',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      position: 'relative'
                    }}>
                      <Search 
                        size={16} 
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9CA3AF'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search guard..."
                        value={guardSearchQuery}
                        onChange={(e) => setGuardSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          background: '#1A2332',
                          border: '1px solid #2A3441',
                          borderRadius: '8px',
                          color: '#F3F4F6',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #3B82F6';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid #2A3441';
                        }}
                      />
                    </div>
                  </div>

                  {(() => {
                    const { topRecommendations, fullRoster } = getAllGuardsWithAnalysis(
                      gridClickContext.hours,
                      gridClickContext.dayOfWeek,
                      gridClickContext.startTime,
                      gridClickContext.endTime
                    );

                    // Filter by search query
                    const filteredTopRecs = topRecommendations.filter(g => 
                      g.name.toLowerCase().includes(guardSearchQuery.toLowerCase())
                    );
                    const filteredFullRoster = fullRoster.filter(g => 
                      g.name.toLowerCase().includes(guardSearchQuery.toLowerCase())
                    );

                    const renderGuardCard = (guard: any, isTopRecommendation: boolean, idx: number) => {
                      const isRecommended = isTopRecommendation && idx === 0 && guard.isAvailable && !guard.hasConflict;
                      const isWarning = guard.willCauseOvertime;
                      const isConflict = guard.hasConflict;
                    
                    return (
                      <div
                        key={guard.id}
                        style={{
                          background: isConflict 
                            ? 'rgba(107, 114, 128, 0.1)' 
                            : isWarning 
                              ? 'rgba(239, 68, 68, 0.05)' 
                              : '#1A2332',
                          border: isConflict
                            ? '2px solid #EF4444'
                            : isRecommended 
                              ? '2px solid #3BD16F' 
                              : isWarning
                                ? '2px solid #F59E0B'
                                : '1px solid #2A3441',
                          borderRadius: '12px',
                          padding: '20px',
                          marginBottom: '12px',
                          transition: 'all 0.2s ease',
                          opacity: isConflict ? 0.7 : 1
                        }}
                      >
                        {/* Guard Header */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <User size={20} style={{ color: '#3B82F6' }} />
                            </div>
                            <div>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#F3F4F6',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                {isRecommended && (
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#3BD16F',
                                    flexShrink: 0
                                  }} />
                                )}
                                {guard.name}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#9CA3AF'
                              }}>
                                {guard.currentHours}h / 40h this week
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isConflict && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#EF4444',
                                background: 'rgba(239, 68, 68, 0.15)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                ⚠️ Conflict
                              </span>
                            )}
                            {!isConflict && isWarning && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#F59E0B',
                                background: 'rgba(245, 158, 11, 0.15)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                ⚠️ OT Risk
                              </span>
                            )}
                            {!isConflict && !isWarning && guard.isAvailable && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#3BD16F',
                                background: 'rgba(59, 209, 111, 0.15)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Standard Rate
                              </span>
                            )}
                            {isRecommended && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#3BD16F',
                                background: 'rgba(59, 209, 111, 0.15)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                border: '1px solid #3BD16F'
                              }}>
                                Best Match
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cost Info */}
                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          marginBottom: '16px',
                          padding: '12px',
                          background: isWarning ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                          borderRadius: '8px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '11px',
                              color: '#9CA3AF',
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {isWarning ? 'OT Rate' : 'Hourly Rate'}
                            </div>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: isWarning ? '#F59E0B' : '#3BD16F'
                            }}>
                              ${isWarning ? guard.overtimeHourlyRate : guard.standardRate}/hr
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '11px',
                              color: '#9CA3AF',
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Shift Cost
                            </div>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: isWarning ? '#F59E0B' : '#3BD16F'
                            }}>
                              ${guard.cost}
                            </div>
                          </div>
                          {guard.willCauseOvertime && (
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '11px',
                                color: '#9CA3AF',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                OT Penalty
                              </div>
                              <div style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#EF4444'
                              }}>
                                +${guard.overtimeCost}
                              </div>
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '11px',
                              color: '#9CA3AF',
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              New Total
                            </div>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: isWarning ? '#F59E0B' : '#F3F4F6'
                            }}>
                              {guard.newTotalHours}h
                            </div>
                          </div>
                        </div>

                        {/* Warning Messages */}
                        {isConflict && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}>
                            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                            <span style={{
                              fontSize: '13px',
                              color: '#EF4444',
                              fontWeight: 600
                            }}>
                              {guard.name} is already assigned to this time slot. Double-booking is not allowed.
                            </span>
                          </div>
                        )}
                        {!isConflict && guard.willCauseOvertime && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}>
                            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                            <span style={{
                              fontSize: '13px',
                              color: '#F59E0B'
                            }}>
                              This assignment will push {guard.name} into overtime ({guard.newTotalHours}h total)
                            </span>
                          </div>
                        )}

                        {/* Assign Button */}
                        <button
                          disabled={isConflict}
                          onClick={async () => {
                            if (isConflict) return;
                            // Close drawer
                            setShowOpenShiftsDrawer(false);
                            setGridClickContext(null);
                            setGuardSearchQuery('');
                            
                            // Execute assignment instantly
                            const shift = unassignedShifts.find(s => s.id === gridClickContext.shiftId);
                            if (!shift) return;
                            
                            // Show brief loading
                            setAssigningShiftId(gridClickContext.shiftId);
                            await new Promise(resolve => setTimeout(resolve, 400));
                            
                            // Create new shift
                            const newShift: ScheduleShift = {
                              id: 1000 + gridClickContext.shiftId,
                              guardId: guard.id,
                              guardName: guard.name,
                              dayOfWeek: shift.dayOfWeek,
                              date: shift.date,
                              startTime: shift.startTime,
                              endTime: shift.endTime,
                              location: shift.location,
                              hours: shift.hours,
                              isOvertime: guard.willCauseOvertime
                            };
                            
                            // Update states
                            setNewlyAssignedShifts(prev => [...prev, newShift]);
                            setAssignedShifts(prev => new Set(prev).add(gridClickContext.shiftId));
                            setAssigningShiftId(null);
                            
                            // Show toast
                            toast.success(`${guard.name} assigned to ${shift.location}`, {
                              duration: 3000,
                              position: 'top-center'
                            });
                          }}
                          style={{
                            width: '100%',
                            padding: '14px',
                            background: isConflict
                              ? '#4B5563'
                              : isWarning 
                                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                                : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            color: isConflict ? '#9CA3AF' : '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: isConflict ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            opacity: isConflict ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!isConflict) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = isWarning
                                ? '0 8px 20px rgba(239, 68, 68, 0.4)'
                                : '0 8px 20px rgba(59, 130, 246, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isConflict) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }
                          }}
                        >
                          {isConflict 
                            ? 'Cannot Assign (Conflict)' 
                            : isWarning 
                              ? '⚠️ Assign with Overtime' 
                              : `Assign ${guard.name}`
                          }
                        </button>
                      </div>
                    );
                    };

                    return (
                      <div style={{ padding: '0 16px 16px' }}>
                        {/* Section 1: Top Recommendations */}
                        {filteredTopRecs.length > 0 && (
                          <>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#3BD16F',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '4px',
                                height: '16px',
                                background: '#3BD16F',
                                borderRadius: '2px'
                              }} />
                              Top Recommendations
                            </div>
                            {filteredTopRecs.map((guard, idx) => renderGuardCard(guard, true, idx))}
                          </>
                        )}

                        {/* Section 2: Full Roster */}
                        {filteredFullRoster.length > 0 && (
                          <>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#9CA3AF',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              marginTop: filteredTopRecs.length > 0 ? '24px' : '0',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '4px',
                                height: '16px',
                                background: '#6B7280',
                                borderRadius: '2px'
                              }} />
                              Full Roster ({filteredFullRoster.length})
                            </div>
                            {filteredFullRoster.map((guard, idx) => renderGuardCard(guard, false, idx))}
                          </>
                        )}

                        {/* No Results */}
                        {filteredTopRecs.length === 0 && filteredFullRoster.length === 0 && guardSearchQuery && (
                          <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: '#9CA3AF'
                          }}>
                            <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                              No guards found
                            </div>
                            <div style={{ fontSize: '12px' }}>
                              Try searching with a different name
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                // Show all unfilled shifts (original drawer content)
                unassignedShifts.map((shift, idx) => {
                // Check if Kevin Torres is recommended for first shift
                const isRecommended = idx === 0;
                const isExpanded = expandedShiftId === shift.id;
                const isAssigned = assignedShifts.has(shift.id);
                const isAssigning = assigningShiftId === shift.id;
                
                // Hide assigned cards after brief display
                if (isAssigned && !isExpanded && !isAssigning) {
                  return null;
                }
                
                return (
                  <div key={shift.id} className={`unfilled-shift-card ${isExpanded ? 'expanded' : ''} ${isAssigned ? 'assigned' : ''}`}>
                    {isAssigned && (
                      <div className="assigned-success-overlay">
                        <CheckCircle size={32} />
                        <span>Assigned to Kevin Torres</span>
                      </div>
                    )}
                    <div className="unfilled-shift-header">
                      <div className="unfilled-shift-info">
                        <MapPin size={16} className="shift-icon" />
                        <span className="shift-location">{shift.location}</span>
                      </div>
                      <div className="unfilled-shift-time">
                        <Clock size={16} className="shift-icon" />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                    </div>
                    <div className="unfilled-shift-meta">
                      <span className="shift-day">{shift.dayOfWeek}, {shift.date}</span>
                      <span className="shift-hours">{shift.hours} hours</span>
                    </div>
                    {isRecommended && !isExpanded && (
                      <div className="recommended-guard-badge">
                        <User size={14} />
                        <span>Recommended: Kevin Torres</span>
                      </div>
                    )}
                    <button 
                      className="find-replacement-btn"
                      onClick={() => setExpandedShiftId(isExpanded ? null : shift.id)}
                      disabled={isAssigned}
                    >
                      {isExpanded ? 'Hide Candidates' : 'Find Replacement'}
                    </button>
                    
                    {/* Smart Candidate Expansion */}
                    {isExpanded && (
                      <div className="candidate-expansion">
                        <div className="candidate-expansion-header">
                          <span className="candidate-header-text">Ranked by Best Fit</span>
                        </div>
                        
                        {/* Candidate 1: Kevin Torres - Best Choice */}
                        <div className="candidate-card candidate-preferred">
                          <div className="candidate-info">
                            <div className="candidate-avatar">
                              <User size={18} />
                            </div>
                            <div className="candidate-details">
                              <span className="candidate-name">Kevin Torres</span>
                              <div className="candidate-badges">
                                <span className="candidate-badge badge-preferred">Preferred</span>
                                <span className="candidate-badge badge-no-ot">No OT</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="candidate-assign-btn btn-primary"
                            onClick={() => {
                              setConfirmationModal({
                                open: true,
                                guardName: 'Kevin Torres',
                                guardId: 7,
                                shiftId: shift.id,
                                shiftDetails: `Building C (${shift.dayOfWeek} ${shift.date}, ${shift.startTime}-${shift.endTime})`,
                                isOvertimeRisk: false
                              });
                            }}
                          >
                            Assign
                          </button>
                        </div>
                        
                        {/* Candidate 2: Lisa Wang - Standard Option */}
                        <div className="candidate-card candidate-standard">
                          <div className="candidate-info">
                            <div className="candidate-avatar">
                              <User size={18} />
                            </div>
                            <div className="candidate-details">
                              <span className="candidate-name">Lisa Wang</span>
                              <div className="candidate-badges">
                                <span className="candidate-badge badge-standard">Standard Rate</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="candidate-assign-btn btn-secondary"
                            onClick={() => {
                              setConfirmationModal({
                                open: true,
                                guardName: 'Lisa Wang',
                                guardId: 8,
                                shiftId: shift.id,
                                shiftDetails: `Building C (${shift.dayOfWeek} ${shift.date}, ${shift.startTime}-${shift.endTime})`,
                                isOvertimeRisk: false
                              });
                            }}
                          >
                            Assign
                          </button>
                        </div>
                        
                        {/* Candidate 3: Maria Garcia - Expensive Option */}
                        <div className="candidate-card candidate-overtime">
                          <div className="candidate-info">
                            <div className="candidate-avatar">
                              <User size={18} />
                            </div>
                            <div className="candidate-details">
                              <span className="candidate-name">Maria Garcia</span>
                              <div className="candidate-badges">
                                <span className="candidate-badge badge-ot-risk">Overtime Risk</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="candidate-assign-btn btn-ghost"
                            onClick={() => {
                              // Maria already has 40 hours Mon-Fri, 8 more hours = all OT at 1.5x rate
                              // Base rate $17/hr, OT rate $25.50/hr, OT cost = 8 * $25.50 = $204
                              setConfirmationModal({
                                open: true,
                                guardName: 'Maria Garcia',
                                guardId: 2,
                                shiftId: shift.id,
                                shiftDetails: `Building C (${shift.dayOfWeek} ${shift.date}, ${shift.startTime}-${shift.endTime})`,
                                isOvertimeRisk: true,
                                overtimeCost: 204.00
                              });
                            }}
                          >
                            Assign (OT)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>
          </div>
        </>
      )}

      {/* Assignment Confirmation Modal */}
      {confirmationModal && confirmationModal.open && (
        <>
          {/* Backdrop */}
          <div 
            className="confirmation-modal-backdrop" 
            onClick={() => setConfirmationModal(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
          
          {/* Modal */}
          <div 
            className={`confirmation-modal ${confirmationModal.isOvertimeRisk ? 'overtime-warning' : ''}`}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10002,
              background: '#111827',
              border: confirmationModal.isOvertimeRisk ? '2px solid #EF4444' : '2px solid #3B82F6',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: confirmationModal.isOvertimeRisk 
                ? '0 20px 60px rgba(239, 68, 68, 0.4)' 
                : '0 20px 60px rgba(59, 130, 246, 0.3)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {confirmationModal.isOvertimeRisk && (
                <AlertTriangle 
                  size={24} 
                  style={{ color: '#EF4444', flexShrink: 0 }} 
                />
              )}
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0
              }}>
                {confirmationModal.isOvertimeRisk 
                  ? '⚠️ Authorize Overtime Assignment' 
                  : 'Confirm Assignment'}
              </h3>
            </div>
            
            {/* Message */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: confirmationModal.isOvertimeRisk 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: confirmationModal.isOvertimeRisk 
                ? '1px solid rgba(239, 68, 68, 0.3)' 
                : '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#E5E7EB',
                margin: 0,
                lineHeight: '1.6'
              }}>
                {confirmationModal.isOvertimeRisk ? (
                  <>
                    Assigning <strong style={{ color: '#FFFFFF' }}>{confirmationModal.guardName}</strong> will incur{' '}
                    <strong style={{ color: '#EF4444' }}>
                      +${confirmationModal.overtimeCost?.toFixed(2)}
                    </strong> in overtime costs. Are you sure?
                  </>
                ) : (
                  <>
                    Assign <strong style={{ color: '#FFFFFF' }}>{confirmationModal.guardName}</strong> to{' '}
                    <strong style={{ color: '#3B82F6' }}>{confirmationModal.shiftDetails}</strong>?
                  </>
                )}
              </p>
            </div>
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setConfirmationModal(null)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1F2937';
                  e.currentTarget.style.borderColor = '#4B5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#374151';
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const modal = confirmationModal;
                  setConfirmationModal(null);
                  
                  // Find the shift details
                  const unassignedShift = unassignedShifts.find(s => s.id === modal.shiftId);
                  if (!unassignedShift) return;
                  
                  // Calculate guard's current hours (before this shift)
                  const guardCurrentSchedule = guardSchedules.find(gs => gs.guardId === modal.guardId);
                  const currentHours = guardCurrentSchedule?.totalHours || 0;
                  const newTotalHours = currentHours + unassignedShift.hours;
                  const willCauseOvertime = newTotalHours > 40;
                  
                  // Show brief loading
                  setAssigningShiftId(modal.shiftId);
                  await new Promise(resolve => setTimeout(resolve, 600));
                  
                  // Create new shift for the assigned guard
                  const newShift: ScheduleShift = {
                    id: 1000 + modal.shiftId,
                    guardId: modal.guardId,
                    guardName: modal.guardName,
                    dayOfWeek: unassignedShift.dayOfWeek,
                    date: unassignedShift.date,
                    startTime: unassignedShift.startTime,
                    endTime: unassignedShift.endTime,
                    location: unassignedShift.location,
                    hours: unassignedShift.hours,
                    isOvertime: willCauseOvertime  // Mark as overtime if it pushes them over 40h
                  };
                  
                  // Update all states
                  setNewlyAssignedShifts(prev => [...prev, newShift]);
                  setAssignedShifts(prev => new Set(prev).add(modal.shiftId));
                  setAssigningShiftId(null);
                  setExpandedShiftId(null);
                  setShowOpenShiftsDrawer(false);
                  
                  // Show success toast
                  toast.success(`Schedule Updated: ${modal.guardName} assigned to Building C`, {
                    duration: 4000,
                    position: 'top-center',
                  });
                }}
                style={{
                  padding: '10px 20px',
                  background: confirmationModal.isOvertimeRisk ? '#EF4444' : '#3B82F6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: confirmationModal.isOvertimeRisk
                    ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                    : '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = confirmationModal.isOvertimeRisk ? '#DC2626' : '#2563EB';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = confirmationModal.isOvertimeRisk ? '#EF4444' : '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {confirmationModal.isOvertimeRisk ? 'Authorize & Assign' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Overtime Risk Modal */}
      {showOvertimeModal && (
        <>
          {/* Backdrop */}
          <div 
            className="overtime-modal-backdrop" 
            onClick={() => setShowOvertimeModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 99998,
              backdropFilter: 'blur(4px)'
            }}
          />
          
          {/* Modal Container - Force Visibility */}
          <div 
            className="overtime-modal-rebuilt"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              width: '500px',
              background: '#1F2937',
              border: '2px solid #F59E0B',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              opacity: 1,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertTriangle size={24} style={{ color: '#F59E0B' }} />
                ⚠️ Overtime Impact Analysis
              </h2>
              <button 
                onClick={() => setShowOvertimeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0 8px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Body - Force White Text */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {(() => {
                // Force data extraction - Find Maria Garcia or use fallback
                let mariaData = null;
                
                // Try to find Maria in calculated overtime data
                if (overtimeData.overtimeGuards.length > 0) {
                  mariaData = overtimeData.overtimeGuards.find(g => g.guardName === 'Maria Garcia');
                }
                
                // Fallback: If not found, create static example
                if (!mariaData) {
                  const mariaGuard = guardSchedules.find(g => g.guardName === 'Maria Garcia');
                  if (mariaGuard && mariaGuard.totalHours > 0) {
                    const totalHours = mariaGuard.totalHours;
                    const overtimeHours = Math.max(0, totalHours - 40);
                    const baseRate = 25.50;
                    const overtimeRate = baseRate * 1.5;
                    const overtimeCost = overtimeHours * overtimeRate;
                    
                    mariaData = {
                      guardName: 'Maria Garcia',
                      badgeId: 'BADGE-1022',
                      totalHours: totalHours,
                      overtimeHours: overtimeHours,
                      overtimeCost: Math.round(overtimeCost * 100) / 100,
                      baseRate: baseRate,
                      overtimeRate: overtimeRate
                    };
                  } else {
                    // Static fallback if Maria not in schedule
                    mariaData = {
                      guardName: 'Maria Garcia',
                      badgeId: 'BADGE-1022',
                      totalHours: 52,
                      overtimeHours: 12,
                      overtimeCost: 459.00,
                      baseRate: 25.50,
                      overtimeRate: 38.25
                    };
                  }
                }

                // Display all overtime guards or just Maria
                const displayGuards = overtimeData.overtimeGuards.length > 0 
                  ? overtimeData.overtimeGuards 
                  : [mariaData];

                return (
                  <>
                    {/* Overtime Guards List */}
                    <div style={{ marginBottom: '20px' }}>
                      {displayGuards.map((guard, idx) => (
                        <div 
                          key={idx}
                          style={{
                            background: '#111827',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '16px'
                          }}
                        >
                          {/* Employee Info */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px'
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9CA3AF'
                            }}>
                              <User size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                marginBottom: '4px'
                              }}>
                                {guard.guardName}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#9CA3AF'
                              }}>
                                {guard.badgeId}
                              </div>
                            </div>
                            {/* Orange Badge */}
                            <div style={{
                              padding: '6px 12px',
                              background: 'rgba(245, 158, 11, 0.2)',
                              border: '1px solid #F59E0B',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#F59E0B'
                            }}>
                              {guard.overtimeHours}h Overtime
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              padding: '12px',
                              background: '#0B1220',
                              borderRadius: '8px',
                              border: '1px solid #374151'
                            }}>
                              <div style={{
                                fontSize: '11px',
                                color: '#9CA3AF',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Total Hours
                              </div>
                              <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#FFFFFF'
                              }}>
                                {guard.totalHours}h
                              </div>
                            </div>
                            <div style={{
                              padding: '12px',
                              background: '#0B1220',
                              borderRadius: '8px',
                              border: '1px solid #374151'
                            }}>
                              <div style={{
                                fontSize: '11px',
                                color: '#9CA3AF',
                                marginBottom: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Base Rate
                              </div>
                              <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#FFFFFF'
                              }}>
                                ${guard.baseRate}/hr
                              </div>
                            </div>
                          </div>

                          {/* Cost Display - RED */}
                          <div style={{
                            padding: '16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span style={{
                                fontSize: '12px',
                                color: '#D1D5DB',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Estimated Cost
                              </span>
                              <span style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#EF4444'
                              }}>
                                +${guard.overtimeCost.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Calculation Breakdown */}
                          <div style={{
                            fontSize: '11px',
                            color: '#9CA3AF',
                            textAlign: 'center',
                            lineHeight: 1.5
                          }}>
                            ({guard.totalHours}h - 40h) × ${guard.overtimeRate}/hr OT = ${guard.overtimeCost.toFixed(2)}
                          </div>
                          
                          {/* Subtle Math Explanation */}
                          <div style={{
                            marginTop: '8px',
                            fontSize: '10px',
                            color: '#6B7280',
                            textAlign: 'center',
                            fontStyle: 'italic'
                          }}>
                            Based on 1.5x Multiplier (${guard.overtimeRate}/hr)
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary */}
                    {displayGuards.length > 0 && (
                      <div style={{
                        padding: '20px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '2px solid #EF4444',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <DollarSign size={20} style={{ color: '#EF4444' }} />
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#D1D5DB',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Total Overtime Impact
                          </span>
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 700,
                          color: '#EF4444'
                        }}>
                          ${displayGuards.reduce((sum, g) => sum + g.overtimeCost, 0).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #374151',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={async () => {
                  setApprovingOT(true);
                  
                  // Find Maria's OT shift (id: 6)
                  const mariaOTShift = scheduleData.find(s => s.guardName === 'Maria Garcia' && s.isOvertime);
                  
                  // Simulate brief loading
                  await new Promise(resolve => setTimeout(resolve, 600));
                  
                  if (mariaOTShift) {
                    setApprovedOvertimeShifts(prev => new Set(prev).add(mariaOTShift.id));
                  }
                  
                  // Set global OT approved state
                  setIsOtApproved(true);
                  
                  setApprovingOT(false);
                  setShowOvertimeModal(false);
                  
                  // Show toast notification
                  toast.success('Overtime Authorized', {
                    duration: 4000,
                    position: 'top-center',
                  });
                }}
                disabled={approvingOT || isOtApproved}
                style={{
                  padding: '10px 20px',
                  background: isOtApproved ? '#10B981' : (approvingOT ? '#6B7280' : '#374151'),
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (approvingOT || isOtApproved) ? 'not-allowed' : 'pointer',
                  opacity: (approvingOT || isOtApproved) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {approvingOT && (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #FFFFFF',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                )}
                {isOtApproved ? 'Authorized ✓' : (approvingOT ? 'Authorizing...' : 'Approve All OT')}
              </button>
              <button 
                onClick={() => {
                  setShowOvertimeModal(false);
                  
                  // Find first guard with overtime risk
                  const firstOTGuard = guardSchedules.find(g => g.hasOvertimeRisk);
                  
                  if (firstOTGuard) {
                    // Highlight the first OT guard
                    setHighlightedGuardId(firstOTGuard.guardId);
                    
                    // Flash all guards with overtime risk
                    const overtimeGuardIds = guardSchedules
                      .filter(g => g.hasOvertimeRisk)
                      .map(g => g.guardId);
                    setFlashingOvertimeRows(new Set(overtimeGuardIds));
                    
                    // Scroll to first OT guard row
                    setTimeout(() => {
                      const rowElement = document.querySelector(`[data-guard-id="${firstOTGuard.guardId}"]`);
                      if (rowElement) {
                        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                    
                    // Clear highlights and flash after 3 seconds
                    setTimeout(() => {
                      setHighlightedGuardId(null);
                      setFlashingOvertimeRows(new Set());
                    }, 3000);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#F59E0B',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Review Schedule
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Shift Modal */}
      {showCreateShiftModal && (
        <>
          {/* Backdrop */}
          <div 
            className="create-shift-modal-backdrop" 
            onClick={() => setShowCreateShiftModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 99998,
              backdropFilter: 'blur(4px)'
            }}
          />
          
          {/* Modal Container - Force Visibility */}
          <div 
            className="create-shift-modal-rebuilt"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              width: '500px',
              background: '#1F2937',
              border: '2px solid #F59E0B',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              opacity: 1,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Plus size={24} style={{ color: '#F59E0B' }} />
                Create New Shift
              </h2>
              <button 
                onClick={() => setShowCreateShiftModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0 8px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Body - Force White Text */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {(() => {
                // Calculate shift duration in hours
                const calculateDuration = () => {
                  const startParts = shiftStartTime.split(':').map(Number);
                  const endParts = shiftEndTime.split(':').map(Number);
                  const startMinutes = startParts[0] * 60 + startParts[1];
                  const endMinutes = endParts[0] * 60 + endParts[1];
                  let durationMinutes = endMinutes - startMinutes;
                  if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight shifts
                  return durationMinutes / 60;
                };

                const duration = calculateDuration();
                const baseRate = 25.00;

                // Get selected guard info - combine scheduled guards and available guards (deduplicated)
                const guardMap = new Map();
                
                // Add guards from schedule first (they have accurate hour counts)
                guardSchedules.forEach(gs => {
                  guardMap.set(gs.guardId, {
                    id: gs.guardId,
                    name: gs.guardName,
                    badgeId: gs.badgeId,
                    totalHours: gs.totalHours,
                    hasOvertimeRisk: gs.hasOvertimeRisk
                  });
                });
                
                // Add available guards that aren't already in the schedule
                availableGuards.forEach(ag => {
                  if (!guardMap.has(ag.id)) {
                    guardMap.set(ag.id, {
                      id: ag.id,
                      name: ag.name,
                      badgeId: ag.badgeId,
                      totalHours: ag.hoursThisWeek,
                      hasOvertimeRisk: false
                    });
                  }
                });
                
                const allGuards = Array.from(guardMap.values());

                const selectedGuard = selectedGuardId 
                  ? allGuards.find(g => g.id === selectedGuardId)
                  : null;

                // Calculate if this shift would cause overtime
                const currentHours = selectedGuard?.totalHours || 0;
                const newTotalHours = currentHours + duration;
                const willCauseOvertime = newTotalHours > 40;
                const overtimeHours = willCauseOvertime ? Math.max(0, newTotalHours - 40) : 0;
                const regularHours = duration - overtimeHours;

                // Calculate cost
                const regularCost = regularHours * baseRate;
                const overtimeCost = overtimeHours * (baseRate * 1.5);
                const totalCost = regularCost + overtimeCost;

                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    {/* Guard Selection - Smart Dropdown */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#9CA3AF',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Select Guard
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={18} style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9CA3AF',
                          pointerEvents: 'none',
                          zIndex: 1
                        }} />
                        <select
                          value={selectedGuardId || ''}
                          onChange={(e) => setSelectedGuardId(e.target.value ? parseInt(e.target.value) : null)}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            background: '#111827',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="" style={{ color: '#6B7280' }}>Choose a guard...</option>
                          {allGuards.map(guard => (
                            <option 
                              key={guard.id} 
                              value={guard.id}
                            >
                              {guard.name} ({guard.totalHours}h / 40h) - {guard.hasOvertimeRisk ? '⚠️ Overtime Risk' : '✓ Available'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Guard Status Indicator */}
                      {selectedGuard && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          background: willCauseOvertime ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          border: willCauseOvertime ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: willCauseOvertime ? '#F59E0B' : '#10B981'
                          }} />
                          <span style={{
                            color: willCauseOvertime ? '#F59E0B' : '#10B981',
                            fontWeight: 600
                          }}>
                            {willCauseOvertime 
                              ? `⚠️ Will exceed 40h (${newTotalHours.toFixed(1)}h total)`
                              : `✓ Within limits (${newTotalHours.toFixed(1)}h total)`
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Site Selection */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#9CA3AF',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Select Site
                      </label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={18} style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9CA3AF',
                          pointerEvents: 'none',
                          zIndex: 1
                        }} />
                        <select
                          value={selectedShiftSite}
                          onChange={(e) => setSelectedShiftSite(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            background: '#111827',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Building A">Building A - Main Gate</option>
                          <option value="Building B">Building B - North Wing</option>
                          <option value="Building C">Building C - West Entrance</option>
                          <option value="Building D">Building D - East Tower</option>
                        </select>
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#9CA3AF',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Shift Time
                      </label>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        gap: '12px',
                        alignItems: 'center'
                      }}>
                        <div style={{ position: 'relative' }}>
                          <Clock size={18} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9CA3AF',
                            pointerEvents: 'none',
                            zIndex: 1
                          }} />
                          <input
                            type="time"
                            value={shiftStartTime}
                            onChange={(e) => setShiftStartTime(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '12px 12px 12px 40px',
                              background: '#111827',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#FFFFFF',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <span style={{ color: '#9CA3AF', fontSize: '14px', fontWeight: 600 }}>to</span>
                        <div style={{ position: 'relative' }}>
                          <Clock size={18} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9CA3AF',
                            pointerEvents: 'none',
                            zIndex: 1
                          }} />
                          <input
                            type="time"
                            value={shiftEndTime}
                            onChange={(e) => setShiftEndTime(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '12px 12px 12px 40px',
                              background: '#111827',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#FFFFFF',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cost Preview Bar - "Profit Guard" */}
                    <div style={{
                      marginTop: '8px',
                      padding: '16px',
                      background: willCauseOvertime ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: willCauseOvertime ? '2px solid rgba(239, 68, 68, 0.4)' : '2px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#9CA3AF',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Cost Preview
                        </span>
                        <DollarSign size={16} style={{ color: willCauseOvertime ? '#EF4444' : '#10B981' }} />
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '14px', color: '#D1D5DB' }}>
                            Shift Duration: <strong style={{ color: '#FFFFFF' }}>{duration.toFixed(1)}h</strong>
                          </span>
                          <span style={{ color: '#6B7280' }}>•</span>
                          <span style={{ fontSize: '14px', color: '#D1D5DB' }}>
                            Est. Cost: <strong style={{
                              color: willCauseOvertime ? '#EF4444' : '#10B981',
                              fontSize: '18px'
                            }}>
                              ${totalCost.toFixed(2)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Overtime Breakdown */}
                      {willCauseOvertime && overtimeHours > 0 && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                          fontSize: '11px',
                          color: '#9CA3AF',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Regular ({regularHours.toFixed(1)}h × ${baseRate}/hr):</span>
                            <span style={{ color: '#D1D5DB' }}>${regularCost.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Overtime ({overtimeHours.toFixed(1)}h × ${(baseRate * 1.5).toFixed(2)}/hr):</span>
                            <span style={{ color: '#EF4444', fontWeight: 600 }}>+${overtimeCost.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #374151',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={() => setShowCreateShiftModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Publishing shift:', {
                    guardId: selectedGuardId,
                    site: selectedShiftSite,
                    startTime: shiftStartTime,
                    endTime: shiftEndTime
                  });
                  setShowCreateShiftModal(false);
                }}
                disabled={!selectedGuardId}
                style={{
                  padding: '10px 20px',
                  background: selectedGuardId ? '#10B981' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: selectedGuardId ? 'pointer' : 'not-allowed',
                  opacity: selectedGuardId ? 1 : 0.5
                }}
              >
                Publish Schedule
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}