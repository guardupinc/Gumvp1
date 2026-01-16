import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { useAppState } from '../../../contexts/AppStateContext';
import { toast } from 'sonner';

interface Shift {
  id: number;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  site: string;
  hours: number;
  status: 'confirmed' | 'pending';
  instructions?: string;
  guardId: number;
}

export function MySchedule() {
  const { appState, currentUser, updateScheduledShift } = useAppState();
  
  // Helper function to check if shift is in the future
  const isFutureShift = (shift: any): boolean => {
    const today = new Date('2026-01-07'); // Current date: Wednesday, January 7, 2026
    const shiftDate = new Date(shift.date);
    
    // Reset time to start of day for comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const shiftStart = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
    
    // Only include shifts from tomorrow onwards (exclude today)
    return shiftStart.getTime() > todayStart.getTime();
  };
  
  // Filter shifts for the current logged-in guard - only future shifts (tomorrow and beyond)
  const myShifts = appState.scheduledShifts
    .filter(shift => shift.guardId === currentUser.id)
    .filter(isFutureShift)
    .sort((a, b) => {
      // Sort by date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const handleConfirm = (shiftId: number) => {
    const shift = myShifts.find(s => s.id === shiftId);
    updateScheduledShift(shiftId, { status: 'confirmed' });
    
    if (shift) {
      toast.success(`Shift confirmed: ${shift.site} on ${shift.dayOfWeek}, ${shift.date}`, {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="My Upcoming Shifts"
        description="Review and confirm your scheduled assignments"
      />

      <Card className="schedule-card">
        <div className="daily-ops-timeline">
          <div className="daily-ops-list">
            {myShifts.map((shift) => (
              <div key={shift.id} className="ops-row shift-row">
                {/* Date & Time Column */}
                <div className="ops-time">
                  <div className="ops-time-main">{shift.dayOfWeek}</div>
                  <div className="ops-time-sub">{shift.date}</div>
                </div>

                {/* Shift Details Column */}
                <div className="ops-site shift-details">
                  <div className="shift-time-range">
                    <Clock size={16} />
                    <span>{shift.startTime} - {shift.endTime}</span>
                    <span className="shift-duration">({shift.hours} hours)</span>
                  </div>
                  <div className="ops-site-name">
                    <MapPin size={16} />
                    {shift.site}
                  </div>
                  {shift.instructions && (
                    <div className="shift-instructions">
                      {shift.instructions}
                    </div>
                  )}
                </div>

                {/* Status & Action Column */}
                <div className="ops-status shift-actions">
                  {shift.status === 'confirmed' ? (
                    <div className="ops-status-pill confirmed">
                      <CheckCircle size={14} />
                      Confirmed
                    </div>
                  ) : (
                    <>
                      <div className="ops-status-pill pending-confirm">
                        Pending Confirmation
                      </div>
                      <button 
                        className="button-primary shift-confirm-btn"
                        onClick={() => handleConfirm(shift.id)}
                      >
                        <CheckCircle size={16} />
                        Confirm
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="schedule-summary">
        <div className="summary-stat">
          <span className="summary-value">{myShifts.length}</span>
          <span className="summary-label">Total Upcoming Shifts</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">{myShifts.filter(s => s.status === 'pending').length}</span>
          <span className="summary-label">Awaiting Confirmation</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">{myShifts.reduce((acc, s) => acc + s.hours, 0)}</span>
          <span className="summary-label">Scheduled Hours</span>
        </div>
      </div>
    </div>
  );
}