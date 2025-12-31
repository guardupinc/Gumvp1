import React from 'react';
import { Clock, AlertTriangle, Radio } from 'lucide-react';

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

// Mock data generator
export const generateTodayOperations = (): ShiftOperation[] => {
  return [
    {
      id: 1,
      startTime: '06:00 AM',
      endTime: '02:00 PM',
      site: 'Building A - Main Entrance',
      status: 'active',
      progress: 75,
      guard: {
        id: 1,
        name: 'John Smith',
        initials: 'JS'
      },
      lastScan: {
        minutesAgo: 2,
        isLate: false
      }
    },
    {
      id: 2,
      startTime: '08:00 AM',
      endTime: '04:00 PM',
      site: 'Building B - Security Office',
      status: 'unassigned'
    },
    {
      id: 3,
      startTime: '08:00 AM',
      endTime: '04:00 PM',
      site: 'Parking Structure C - Level 1',
      status: 'active',
      progress: 50,
      guard: {
        id: 3,
        name: 'David Lee',
        initials: 'DL'
      },
      lastScan: {
        minutesAgo: 45,
        isLate: true
      }
    },
    {
      id: 4,
      startTime: '10:00 AM',
      endTime: '06:00 PM',
      site: 'Manufacturing Wing D - Floor 2',
      status: 'active',
      progress: 35,
      guard: {
        id: 8,
        name: 'Kevin Torres',
        initials: 'KT'
      },
      lastScan: {
        minutesAgo: 8,
        isLate: false
      }
    },
    {
      id: 5,
      startTime: '12:00 PM',
      endTime: '08:00 PM',
      site: 'East Campus Security - Gate 3',
      status: 'upcoming',
      startsIn: '2h'
    },
    {
      id: 6,
      startTime: '02:00 PM',
      endTime: '10:00 PM',
      site: 'Building A - South Wing',
      status: 'upcoming',
      startsIn: '4h',
      guard: {
        id: 4,
        name: 'Sarah Chen',
        initials: 'SC'
      }
    },
    {
      id: 7,
      startTime: '04:00 PM',
      endTime: '12:00 AM',
      site: 'West Perimeter - Patrol Route',
      status: 'unassigned'
    },
    {
      id: 8,
      startTime: '06:00 PM',
      endTime: '02:00 AM',
      site: 'Parking Structure C - Level 3',
      status: 'upcoming',
      startsIn: '8h',
      guard: {
        id: 6,
        name: 'Lisa Wang',
        initials: 'LW'
      }
    }
  ];
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
          className="button-ghost"
          onClick={onViewFullSchedule}
        >
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