import React from 'react';
import { Plus, FileText, FolderLock, Calendar, Download } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';

interface Document {
  id: number;
  name: string;
  category: string;
  uploadedBy: string;
  uploadDate: string;
  size: string;
}

const documents: Document[] = [
  { id: 1, name: 'Security Operations Manual v2.1', category: 'SOP', uploadedBy: 'Sarah Chen', uploadDate: 'Dec 15, 2024', size: '2.4 MB' },
  { id: 2, name: 'Emergency Response Procedures', category: 'Policy', uploadedBy: 'John Smith', uploadDate: 'Dec 10, 2024', size: '1.8 MB' },
  { id: 3, name: 'Guard Training Certificates 2024', category: 'Training', uploadedBy: 'Maria Garcia', uploadDate: 'Nov 28, 2024', size: '5.2 MB' },
  { id: 4, name: 'Site Access Control Guidelines', category: 'SOP', uploadedBy: 'David Lee', uploadDate: 'Nov 20, 2024', size: '987 KB' },
  { id: 5, name: 'Incident Report Template', category: 'Form', uploadedBy: 'Sarah Chen', uploadDate: 'Nov 15, 2024', size: '156 KB' },
];

const documentColumns: Column<Document>[] = [
  {
    key: 'name',
    header: 'Document Name',
    render: (row) => (
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-muted" />
        <span>{row.name}</span>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    render: (row) => (
      <div className="flex items-center gap-2">
        <FolderLock size={16} className="text-muted" />
        <span className="table-badge">{row.category}</span>
      </div>
    ),
    width: '130px',
    hideOnMobile: true,
  },
  {
    key: 'uploadedBy',
    header: 'Uploaded By',
    render: (row) => <span className="text-muted">{row.uploadedBy}</span>,
    width: '140px',
    hideOnMobile: true,
  },
  {
    key: 'uploadDate',
    header: 'Date',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-muted" />
        <span className="text-muted">{row.uploadDate}</span>
      </div>
    ),
    width: '140px',
  },
  {
    key: 'size',
    header: 'Size',
    render: (row) => <span className="text-muted">{row.size}</span>,
    width: '100px',
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <button className="icon-button" aria-label="Download document">
        <Download size={16} />
      </button>
    ),
    width: '60px',
  },
];

export function DocumentVault() {
  return (
    <div className="page-container">
      <PageHeader
        title="Document Vault"
        description="Secure storage for SOPs, policies, and compliance documents"
        primaryAction={{
          label: 'Upload Document',
          onClick: () => console.log('Upload document'),
          icon: <Plus size={16} />,
        }}
      />

      <Card padding="none">
        <Table columns={documentColumns} data={documents} />
      </Card>
    </div>
  );
}
