import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, User, MapPin, Clock } from 'lucide-react';

interface Shift {
  id: number;
  guardName: string;
  location: string;
  startTime: string;
  endTime: string;
  date: Date;
  status: 'scheduled' | 'pending' | 'completed';
}

interface ShiftCalendarProps {
  shifts?: Shift[];
  onShiftClick?: (shift: Shift) => void;
  onAddShift?: (date: Date, timeSlot: string) => void;
  className?: string;
}

const timeSlots = [
  { label: 'Morning', time: '6:00 AM - 2:00 PM', value: 'morning' },
  { label: 'Day', time: '2:00 PM - 10:00 PM', value: 'day' },
  { label: 'Night', time: '10:00 PM - 6:00 AM', value: 'night' },
];

export function ShiftCalendar({ shifts = [], onShiftClick, onAddShift, className = '' }: ShiftCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Sunday
    return new Date(today.setDate(diff));
  });

  const getDaysOfWeek = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const getShiftsForDateAndSlot = (date: Date, timeSlot: string) => {
    return shifts.filter(shift => {
      if (!isSameDay(shift.date, date)) return false;
      
      const hour = parseInt(shift.startTime.split(':')[0]);
      if (timeSlot === 'morning' && hour >= 6 && hour < 14) return true;
      if (timeSlot === 'day' && hour >= 14 && hour < 22) return true;
      if (timeSlot === 'night' && (hour >= 22 || hour < 6)) return true;
      return false;
    });
  };

  const daysOfWeek = getDaysOfWeek(currentWeekStart);
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = currentWeekStart.toLocaleDateString('en-US', options);
    const end = weekEnd.toLocaleDateString('en-US', options);
    const year = currentWeekStart.getFullYear();
    return `${start} - ${end}, ${year}`;
  };

  return (
    <div className={`shift-calendar ${className}`}>
      <div className="shift-calendar-header">
        <button
          className="calendar-nav-button"
          onClick={handlePreviousWeek}
          aria-label="Previous week"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="calendar-title">{formatDateRange()}</h3>
        <button
          className="calendar-nav-button"
          onClick={handleNextWeek}
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="shift-calendar-grid">
        {/* Header row with days */}
        <div className="shift-grid-header">
          <div className="time-slot-label-header">Time Slot</div>
          {daysOfWeek.map((day, index) => (
            <div
              key={index}
              className={`day-header ${isToday(day) ? 'today' : ''}`}
            >
              <div className="day-name">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="day-date">
                {day.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots with shifts */}
        {timeSlots.map((timeSlot) => (
          <div key={timeSlot.value} className="shift-grid-row">
            <div className="time-slot-label">
              <div className="slot-name">{timeSlot.label}</div>
              <div className="slot-time">{timeSlot.time}</div>
            </div>
            {daysOfWeek.map((day, dayIndex) => {
              const dayShifts = getShiftsForDateAndSlot(day, timeSlot.value);
              return (
                <div
                  key={dayIndex}
                  className={`shift-cell ${isToday(day) ? 'today' : ''}`}
                >
                  {dayShifts.length > 0 ? (
                    dayShifts.map((shift) => (
                      <button
                        key={shift.id}
                        className={`shift-block ${shift.status}`}
                        onClick={() => onShiftClick?.(shift)}
                      >
                        <div className="shift-block-guard">
                          <User size={12} />
                          <span>{shift.guardName}</span>
                        </div>
                        <div className="shift-block-location">
                          <MapPin size={12} />
                          <span>{shift.location}</span>
                        </div>
                        <div className="shift-block-time">
                          <Clock size={12} />
                          <span>{shift.startTime} - {shift.endTime}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <button
                      className="shift-cell-empty"
                      onClick={() => onAddShift?.(day, timeSlot.value)}
                    >
                      <Plus size={16} />
                      <span>Add Shift</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="shift-calendar-legend">
        <div className="legend-item">
          <span className="legend-indicator scheduled"></span>
          <span>Scheduled</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator pending"></span>
          <span>Pending Assignment</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator completed"></span>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
