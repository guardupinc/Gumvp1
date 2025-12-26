import React from 'react';
import { Plus, FileText, Calendar, Download } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';

interface Report {
  id: number;
  name: string;
  type: string;
  period: string;
  generatedDate: string;
  status: 'ready' | 'draft' | 'archived';
}

const reports: Report[] = [
  { id: 1, name: 'Q4 2024 Compliance Report', type: 'Compliance', period: 'Q4 2024', generatedDate: 'Dec 20, 2024', status: 'ready' },
  { id: 2, name: 'November Incident Summary', type: 'Incident', period: 'Nov 2024', generatedDate: 'Dec 1, 2024', status: 'ready' },
  { id: 3, name: 'License Certification Status', type: 'Certification', period: 'Dec 2024', generatedDate: 'Dec 15, 2024', status: 'ready' },
  { id: 4, name: 'Q3 2024 Audit Summary', type: 'Audit', period: 'Q3 2024', generatedDate: 'Oct 5, 2024', status: 'archived' },
  { id: 5, name: 'Annual Training Report', type: 'Training', period: '2024', generatedDate: 'In Progress', status: 'draft' },
];

const reportColumns: Column<Report>[] = [
  {
    key: 'name',
    header: 'Report Name',
    render: (row) => (
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-muted" />
        <span>{row.name}</span>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    render: (row) => <span className="table-badge">{row.type}</span>,
    width: '120px',
    hideOnMobile: true,
  },
  {
    key: 'period',
    header: 'Period',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-muted" />
        <span>{row.period}</span>
      </div>
    ),
    width: '140px',
  },
  {
    key: 'generatedDate',
    header: 'Generated',
    render: (row) => <span className="text-muted">{row.generatedDate}</span>,
    width: '140px',
    hideOnMobile: true,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>,
    width: '100px',
  },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      row.status === 'ready' ? (
        <button className="icon-button" aria-label="Download report">
          <Download size={16} />
        </button>
      ) : null
    ),
    width: '60px',
  },
];

export function AuditReports() {
  return (
    <div className="page-container">
      <PageHeader
        title="Audit-Ready Reports"
        description="Generate and manage compliance and audit documentation"
        primaryAction={{
          label: 'New Report',
          onClick: () => console.log('New report'),
          icon: <Plus size={16} />,
        }}
      />

      <Card padding="none">
        <Table columns={reportColumns} data={reports} />
      </Card>
    </div>
  );
}
