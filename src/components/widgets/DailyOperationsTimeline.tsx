import React from 'react';
import { Clock, AlertTriangle, Radio, Calendar } from 'lucide-react';
import { getTodaysScheduledShifts } from '../../utils/activeShifts';

interface Guard {
  id: number;
  name: string;
  avatar?: string;
  initials: string;
}

interface ShiftOperation {
  id: number;
  startTime: string;
  endTime: string;
  site: string;
  status: 'active' | 'unassigned' | 'upcoming' | 'completed';
  progress?: number; // 0-100 for active shifts
  guard?: Guard;
  startsIn?: string; // e.g., "2h", "30m"
  lastScan?: {
    minutesAgo: number;
    isLate: boolean;
  };
}

interface DailyOperationsTimelineProps {
  operations: ShiftOperation[];
  onAssignGuard?: (operationId: number) => void;
  onViewFullSchedule?: () => void;
}

// Generate today's operations from the scheduled shifts
export const generateTodayOperations = (): ShiftOperation[] => {
  const todaysShifts = getTodaysScheduledShifts();
  
  // Helper function to get initials
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Helper function to convert 24h time to 12h format
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Helper function to determine shift status based on current time
  const getShiftStatus = (startTime: string, endTime: string): { status: 'active' | 'upcoming' | 'completed', progress?: number, startsIn?: string } => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinutes;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    
    const [endHour, endMinute] = endTime.split(':').map(Number);
    let endTotalMinutes = endHour * 60 + endMinute;
    // Handle midnight crossing (e.g., 00:00)
    if (endHour < startHour) {
      endTotalMinutes += 24 * 60;
    }
    
    // Determine status
    if (currentTotalMinutes < startTotalMinutes) {
      // Upcoming shift
      const minutesUntilStart = startTotalMinutes - currentTotalMinutes;
      const hoursUntilStart = Math.floor(minutesUntilStart / 60);
      const startsIn = hoursUntilStart > 0 ? `${hoursUntilStart}h` : `${minutesUntilStart}m`;
      return { status: 'upcoming', startsIn };
    } else if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes) {
      // Active shift - calculate progress
      const shiftDuration = endTotalMinutes - startTotalMinutes;
      const elapsed = currentTotalMinutes - startTotalMinutes;
      const progress = Math.round((elapsed / shiftDuration) * 100);
      return { status: 'active', progress };
    } else {
      // Completed shift
      return { status: 'completed' };
    }
  };
  
  // Convert scheduled shifts to operations format
  return todaysShifts.map(shift => {
    const shiftStatus = getShiftStatus(shift.startTime, shift.endTime);
    
    const operation: ShiftOperation = {
      id: shift.id,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      site: shift.location,
      status: shiftStatus.status,
      progress: shiftStatus.progress,
      startsIn: shiftStatus.startsIn,
      guard: {
        id: shift.guardId,
        name: shift.guardName,
        initials: getInitials(shift.guardName)
      }
    };
    
    // Add simulated last scan data for active shifts
    if (shiftStatus.status === 'active') {
      const minutesAgo = Math.floor(Math.random() * 30) + 1;
      operation.lastScan = {
        minutesAgo,
        isLate: minutesAgo > 15 // Consider late if more than 15 minutes
      };
    }
    
    return operation;
  });
};

export function DailyOperationsTimeline({ 
  operations, 
  onAssignGuard,
  onViewFullSchedule 
}: DailyOperationsTimelineProps) {
  const renderStatusPill = (operation: ShiftOperation) => {
    switch (operation.status) {
      case 'active':
        return (
          <div className="ops-status-pill active">
            <span className="status-dot"></span>
            On Shift
          </div>
        );
      case 'unassigned':
        return (
          <div className="ops-status-pill unassigned">
            <AlertTriangle size={14} />
            UNASSIGNED
          </div>
        );
      case 'upcoming':
        return (
          <div className="ops-status-pill upcoming">
            Starts in {operation.startsIn}
          </div>
        );
      case 'completed':
        return (
          <div className="ops-status-pill completed">
            Completed
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="daily-ops-timeline">
      {/* Header */}
      <div className="daily-ops-header">
        <div className="daily-ops-title">
          <Clock size={20} />
          Today's Operations
        </div>
        <button 
          className="button-secondary"
          onClick={onViewFullSchedule}
        >
          <Calendar size={16} />
          View Full Schedule
        </button>
      </div>

      {/* Operations List - Flight Board Style */}
      <div className="daily-ops-list">
        {operations.map((operation) => (
          <div
            key={operation.id}
            className={`ops-row ${operation.status === 'unassigned' ? 'unassigned' : ''}`}
          >
            {/* Time Column */}
            <div className="ops-time">
              <div className="ops-time-main">{operation.startTime}</div>
              <div className="ops-time-sub">to {operation.endTime}</div>
            </div>

            {/* Site Column */}
            <div className="ops-site">
              <div className="ops-site-name">{operation.site}</div>
              {operation.status === 'active' && operation.progress !== undefined && (
                <div className="ops-progress-bar">
                  <div 
                    className="ops-progress-fill"
                    style={{ width: `${operation.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Status Column */}
            <div className="ops-status">
              {renderStatusPill(operation)}
              {/* Live Pulse Indicator for Active Shifts */}
              {operation.status === 'active' && operation.lastScan && (
                <div className={`ops-pulse-indicator ${operation.lastScan.isLate ? 'late' : ''}`}>
                  <Radio size={14} className={operation.lastScan.isLate ? 'pulse-icon' : ''} />
                  <span className="ops-pulse-text">
                    Last scan: {operation.lastScan.minutesAgo}m ago
                    {operation.lastScan.isLate && <span className="late-label"> (LATE)</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Guard Column */}
            <div className="ops-guard">
              {operation.guard ? (
                <div className="ops-guard-info">
                  <span className="ops-guard-name">{operation.guard.name}</span>
                  <div className="ops-guard-avatar">
                    {operation.guard.initials}
                  </div>
                </div>
              ) : operation.status === 'unassigned' ? (
                <button 
                  className="ops-assign-button"
                  onClick={() => onAssignGuard?.(operation.id)}
                >
                  ASSIGN GUARD
                </button>
              ) : (
                <div className="ops-guard-empty">—</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}