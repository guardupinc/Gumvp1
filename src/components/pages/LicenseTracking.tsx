import React from 'react';
import { Plus, Award, User, Calendar, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';

interface License {
  id: number;
  guardName: string;
  licenseType: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

const licenses: License[] = [
  { id: 1, guardName: 'John Smith', licenseType: 'Security Guard License', licenseNumber: 'SG-2024-1234', issueDate: 'Jan 15, 2024', expiryDate: 'Jan 15, 2026', status: 'valid' },
  { id: 2, guardName: 'Maria Garcia', licenseType: 'Armed Security', licenseNumber: 'AS-2023-5678', issueDate: 'Mar 20, 2023', expiryDate: 'Mar 20, 2025', status: 'valid' },
  { id: 3, guardName: 'David Lee', licenseType: 'Security Guard License', licenseNumber: 'SG-2023-9012', issueDate: 'Jun 10, 2023', expiryDate: 'Jan 30, 2025', status: 'expiring' },
  { id: 4, guardName: 'Robert Brown', licenseType: 'First Aid Certification', licenseNumber: 'FA-2022-3456', issueDate: 'Apr 5, 2022', expiryDate: 'Apr 5, 2024', status: 'expired' },
  { id: 5, guardName: 'Lisa Wang', licenseType: 'Security Guard License', licenseNumber: 'SG-2024-7890', issueDate: 'Feb 28, 2024', expiryDate: 'Feb 28, 2026', status: 'valid' },
];

const licenseColumns: Column<License>[] = [
  {
    key: 'guardName',
    header: 'Guard Name',
    render: (row) => (
      <div className="flex items-center gap-2">
        <User size={16} className="text-muted" />
        <span>{row.guardName}</span>
      </div>
    ),
    width: '160px',
  },
  {
    key: 'licenseType',
    header: 'License Type',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Award size={16} className="text-muted" />
        <span>{row.licenseType}</span>
      </div>
    ),
  },
  {
    key: 'licenseNumber',
    header: 'License #',
    render: (row) => <span className="text-muted">{row.licenseNumber}</span>,
    width: '140px',
    hideOnMobile: true,
  },
  {
    key: 'expiryDate',
    header: 'Expiry Date',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-muted" />
        <span>{row.expiryDate}</span>
      </div>
    ),
    width: '140px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <div className="flex items-center gap-2">
        {row.status === 'expiring' || row.status === 'expired' ? (
          <AlertTriangle size={16} className={row.status === 'expired' ? 'text-error' : 'text-warning'} />
        ) : null}
        <span className={`status-badge ${row.status}`}>{row.status}</span>
      </div>
    ),
    width: '120px',
  },
];

export function LicenseTracking() {
  return (
    <div className="page-container">
      <PageHeader
        title="License & Certification Tracking"
        description="Monitor guard licenses and certifications to maintain compliance"
        primaryAction={{
          label: 'Add License',
          onClick: () => console.log('Add license'),
          icon: <Plus size={16} />,
        }}
      />

      <div className="alert-banner warning">
        <AlertTriangle size={20} />
        <div>
          <p className="alert-banner-title">3 licenses require attention</p>
          <p className="alert-banner-description">1 expired, 2 expiring within 30 days</p>
        </div>
      </div>

      <Card padding="none">
        <Table columns={licenseColumns} data={licenses} />
      </Card>
    </div>
  );
}
