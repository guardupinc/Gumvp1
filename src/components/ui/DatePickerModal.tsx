import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../date-picker-modal.css';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateRangeSelect: (dates: [Date, Date]) => void;
}

export function DatePickerModal({ isOpen, onClose, onDateRangeSelect }: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  if (!isOpen) return null;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!startDate || (startDate && endDate)) {
      // Start new range
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (clickedDate < startDate) {
      // Clicked before start, make it the new start
      setEndDate(startDate);
      setStartDate(clickedDate);
    } else {
      // Clicked after start, make it the end
      setEndDate(clickedDate);
    }
  };

  const isDateInRange = (day: number): boolean => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (startDate && endDate) {
      return date >= startDate && date <= endDate;
    }
    return false;
  };

  const isStartDate = (day: number): boolean => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (day: number): boolean => {
    if (!endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === endDate.toDateString();
  };

  const formatDateInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onDateRangeSelect([startDate, endDate]);
      onClose();
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const inRange = isDateInRange(day);
      const isStart = isStartDate(day);
      const isEnd = isEndDate(day);
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${inRange ? 'in-range' : ''} ${isStart ? 'start-date' : ''} ${isEnd ? 'end-date' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Date Range</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Start Date</label>
              <input 
                type="text" 
                readOnly 
                value={formatDateInput(startDate)}
                placeholder="Select start date"
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>End Date</label>
              <input 
                type="text" 
                readOnly 
                value={formatDateInput(endDate)}
                placeholder="Select end date"
                className="date-input"
              />
            </div>
          </div>

          <div className="calendar-container">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                <ChevronLeft size={20} />
              </button>
              <h4>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h4>
              <button className="calendar-nav-btn" onClick={handleNextMonth}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="calendar-grid">
              <div className="calendar-weekday">Sun</div>
              <div className="calendar-weekday">Mon</div>
              <div className="calendar-weekday">Tue</div>
              <div className="calendar-weekday">Wed</div>
              <div className="calendar-weekday">Thu</div>
              <div className="calendar-weekday">Fri</div>
              <div className="calendar-weekday">Sat</div>
              
              {renderCalendarDays()}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="apply-range-btn" 
            onClick={handleApply}
            disabled={!startDate || !endDate}
          >
            Apply Range
          </button>
        </div>
      </div>
    </div>
  );
}