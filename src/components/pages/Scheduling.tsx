import React, { useState } from 'react';
import { Plus, Calendar as CalendarIcon, MapPin, Clock, User, Filter, Wrench, AlertTriangle, UserCog } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';
import { ShiftCalendar } from '../ui/ShiftCalendar';

interface Shift {
  id: number;
  location: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  guard: string;
  status: 'scheduled' | 'pending' | 'completed';
}

const shifts: Shift[] = [
  { id: 1, location: 'Building A - Main Entrance', date: 'Dec 23, 2024', timeStart: '08:00', timeEnd: '16:00', guard: 'John Smith', status: 'scheduled' },
  { id: 2, location: 'Building B - Parking Lot', date: 'Dec 23, 2024', timeStart: '16:00', timeEnd: '00:00', guard: 'Maria Garcia', status: 'scheduled' },
  { id: 3, location: 'Building A - Main Entrance', date: 'Dec 23, 2024', timeStart: '00:00', timeEnd: '08:00', guard: 'Unassigned', status: 'pending' },
  { id: 4, location: 'Building C - Lobby', date: 'Dec 24, 2024', timeStart: '08:00', timeEnd: '16:00', guard: 'David Lee', status: 'scheduled' },
  { id: 5, location: 'Building A - Main Entrance', date: 'Dec 22, 2024', timeStart: '08:00', timeEnd: '16:00', guard: 'Robert Brown', status: 'completed' },
];

const shiftColumns: Column<Shift>[] = [
  {
    key: 'location',
    header: 'Location',
    render: (row) => (
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-muted" />
        <span>{row.location}</span>
      </div>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    render: (row) => (
      <div className="flex items-center gap-2">
        <CalendarIcon size={16} className="text-muted" />
        <span>{row.date}</span>
      </div>
    ),
    width: '140px',
    hideOnMobile: true,
  },
  {
    key: 'time',
    header: 'Time',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted" />
        <span>{row.timeStart} - {row.timeEnd}</span>
      </div>
    ),
    width: '150px',
  },
  {
    key: 'guard',
    header: 'Guard',
    render: (row) => (
      <div className="flex items-center gap-2">
        <User size={16} className="text-muted" />
        <span className={row.guard === 'Unassigned' ? 'text-warning' : ''}>{row.guard}</span>
      </div>
    ),
    width: '160px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>,
    width: '120px',
  },
];

// Generate sample shift data for calendar
const generateCalendarShifts = () => {
  const today = new Date();
  const calendarShifts = [];
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Morning shifts
    calendarShifts.push({
      id: i * 4 + 1,
      guardName: i % 4 === 0 ? 'John Smith' : i % 4 === 1 ? 'Maria Garcia' : i % 4 === 2 ? 'David Lee' : 'Lisa Wang',
      location: i % 3 === 0 ? 'Building A - Main' : i % 3 === 1 ? 'Building B - Parking' : 'Building C - Lobby',
      startTime: '08:00',
      endTime: '16:00',
      date: new Date(date),
      status: 'scheduled' as const,
    });
    
    // Day shifts
    if (i < 12) {
      calendarShifts.push({
        id: i * 4 + 2,
        guardName: i % 3 === 0 ? 'Robert Brown' : i % 3 === 1 ? 'Mike Johnson' : 'Sarah Parker',
        location: i % 2 === 0 ? 'Building A - Main' : 'Building D - Loading',
        startTime: '16:00',
        endTime: '00:00',
        date: new Date(date),
        status: i === 1 ? 'pending' as const : 'scheduled' as const,
      });
    }
    
    // Night shifts
    if (i < 10) {
      calendarShifts.push({
        id: i * 4 + 3,
        guardName: i % 2 === 0 ? 'Tom Wilson' : 'Alex Chen',
        location: 'Building A - Main',
        startTime: '00:00',
        endTime: '08:00',
        date: new Date(date),
        status: 'scheduled' as const,
      });
    }
  }
  
  return calendarShifts;
};

export function Scheduling() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [showShiftBuilder, setShowShiftBuilder] = useState(false);
  const calendarShifts = generateCalendarShifts();

  const handleShiftClick = (shift: any) => {
    console.log('Shift clicked:', shift);
  };

  const handleAddShift = (date: Date, timeSlot: string) => {
    console.log('Add shift for:', date, timeSlot);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Scheduling"
        description="Manage guard shifts and assignments across all locations"
        primaryAction={{
          label: 'Create Shift',
          onClick: () => console.log('Create shift'),
          icon: <Plus size={16} />,
        }}
        secondaryAction={{
          label: 'Filter',
          onClick: () => console.log('Filter'),
        }}
      />

      {/* Quick Action Buttons */}
      <div className="scheduling-actions">
        <button className="action-button" onClick={() => setShowShiftBuilder(!showShiftBuilder)}>
          <Wrench size={20} />
          <div className="action-button-content">
            <span className="action-button-label">Shift Builder</span>
            <span className="action-button-description">Create recurring shifts</span>
          </div>
        </button>
        <button className="action-button warning">
          <AlertTriangle size={20} />
          <div className="action-button-content">
            <span className="action-button-label">Coverage Warnings</span>
            <span className="action-button-description">2 shifts need coverage</span>
          </div>
        </button>
        <button className="action-button">
          <UserCog size={20} />
          <div className="action-button-content">
            <span className="action-button-label">Assign Roles</span>
            <span className="action-button-description">Manage shift assignments</span>
          </div>
        </button>
      </div>

      <Card className="view-controls-card">
        <div className="view-controls">
          <button
            className={`view-button ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </button>
          <button
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </Card>

      {viewMode === 'calendar' ? (
        <Card className="shift-calendar-card">
          <div className="card-header">
            <h3>Shift Schedule</h3>
            <div className="shift-stats-inline">
              <div className="stat-inline">
                <span className="stat-inline-value">24</span>
                <span className="stat-inline-label">Total Shifts</span>
              </div>
              <div className="stat-inline">
                <span className="stat-inline-value success">22</span>
                <span className="stat-inline-label">Assigned</span>
              </div>
              <div className="stat-inline">
                <span className="stat-inline-value warning">2</span>
                <span className="stat-inline-label">Pending</span>
              </div>
            </div>
          </div>
          <ShiftCalendar 
            shifts={calendarShifts}
            onShiftClick={handleShiftClick}
            onAddShift={handleAddShift}
          />
        </Card>
      ) : (
        <Card padding="none">
          <Table columns={shiftColumns} data={shifts} />
        </Card>
      )}
    </div>
  );
}