import React from 'react';
import { Plus, User, MapPin, Clock, CheckCircle } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';

interface CheckIn {
  id: number;
  guardName: string;
  location: string;
  checkpoint: string;
  timestamp: string;
  status: 'on-time' | 'late' | 'missed';
}

const checkIns: CheckIn[] = [
  { id: 1, guardName: 'John Smith', location: 'Building A', checkpoint: 'Main Entrance', timestamp: '08:00 AM', status: 'on-time' },
  { id: 2, guardName: 'Maria Garcia', location: 'Building B', checkpoint: 'Parking Lot', timestamp: '08:05 AM', status: 'late' },
  { id: 3, guardName: 'David Lee', location: 'Building C', checkpoint: 'Lobby', timestamp: '08:00 AM', status: 'on-time' },
  { id: 4, guardName: 'Robert Brown', location: 'Building A', checkpoint: 'Roof Access', timestamp: 'N/A', status: 'missed' },
  { id: 5, guardName: 'Lisa Wang', location: 'Building D', checkpoint: 'Loading Dock', timestamp: '08:02 AM', status: 'on-time' },
];

const checkInColumns: Column<CheckIn>[] = [
  {
    key: 'guardName',
    header: 'Guard',
    render: (row) => (
      <div className="flex items-center gap-2">
        <User size={16} className="text-muted" />
        <span>{row.guardName}</span>
      </div>
    ),
    width: '160px',
  },
  {
    key: 'location',
    header: 'Location',
    render: (row) => (
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-muted" />
        <span>{row.location}</span>
      </div>
    ),
    width: '140px',
  },
  {
    key: 'checkpoint',
    header: 'Checkpoint',
    render: (row) => (
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-muted" />
        <span>{row.checkpoint}</span>
      </div>
    ),
  },
  {
    key: 'timestamp',
    header: 'Time',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-muted" />
        <span className={row.status === 'missed' ? 'text-error' : ''}>{row.timestamp}</span>
      </div>
    ),
    width: '120px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>,
    width: '100px',
  },
];

export function GuardAccountability() {
  return (
    <div className="page-container">
      <PageHeader
        title="Guard Accountability"
        description="Monitor guard check-ins and patrol verification across locations"
        primaryAction={{
          label: 'Add Check-in',
          onClick: () => console.log('Add check-in'),
          icon: <Plus size={16} />,
        }}
      />

      <Card padding="none">
        <Table columns={checkInColumns} data={checkIns} />
      </Card>
    </div>
  );
}
