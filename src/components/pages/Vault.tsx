import React, { useState } from 'react';
import { Plus, Search, FileText, Award, Receipt, FileSignature, Folder, Download, Eye, MoreVertical, Filter } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';

interface Document {
  id: number;
  name: string;
  type: 'report' | 'license' | 'certification' | 'receipt' | 'contract' | 'other';
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  status: 'active' | 'expired' | 'pending';
}

const documents: Document[] = [
  { id: 1, name: 'Incident Report - Building A Breach.pdf', type: 'report', category: 'Incident Reports', uploadedBy: 'John Smith', uploadedDate: 'Dec 22, 2024', size: '2.4 MB', status: 'active' },
  { id: 2, name: 'Security License - John Smith.pdf', type: 'license', category: 'Licenses', uploadedBy: 'Admin', uploadedDate: 'Dec 20, 2024', size: '856 KB', status: 'active' },
  { id: 3, name: 'CPR Certification - Maria Garcia.pdf', type: 'certification', category: 'Certifications', uploadedBy: 'Maria Garcia', uploadedDate: 'Dec 18, 2024', size: '1.2 MB', status: 'active' },
  { id: 4, name: 'Equipment Receipt - Radio Units.pdf', type: 'receipt', category: 'Receipts', uploadedBy: 'David Lee', uploadedDate: 'Dec 15, 2024', size: '456 KB', status: 'active' },
  { id: 5, name: 'Service Contract - Building A.pdf', type: 'contract', category: 'Contracts', uploadedBy: 'Admin', uploadedDate: 'Dec 10, 2024', size: '3.1 MB', status: 'active' },
  { id: 6, name: 'Daily Shift Report - Dec 21.pdf', type: 'report', category: 'Daily Reports', uploadedBy: 'Sarah Chen', uploadedDate: 'Dec 21, 2024', size: '892 KB', status: 'active' },
  { id: 7, name: 'Security License - Robert Brown.pdf', type: 'license', category: 'Licenses', uploadedBy: 'Admin', uploadedDate: 'Nov 30, 2024', size: '745 KB', status: 'expired' },
  { id: 8, name: 'Training Certificate - Lisa Wang.pdf', type: 'certification', category: 'Certifications', uploadedBy: 'Lisa Wang', uploadedDate: 'Dec 5, 2024', size: '1.5 MB', status: 'active' },
  { id: 9, name: 'Monthly Compliance Report - November.pdf', type: 'report', category: 'Compliance Reports', uploadedBy: 'Admin', uploadedDate: 'Dec 1, 2024', size: '4.2 MB', status: 'active' },
  { id: 10, name: 'Uniform Receipt - Winter Jackets.pdf', type: 'receipt', category: 'Receipts', uploadedBy: 'Admin', uploadedDate: 'Nov 25, 2024', size: '567 KB', status: 'active' },
];

const documentColumns: Column<Document>[] = [
  {
    key: 'name',
    header: 'Document Name',
    render: (row) => (
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-accent" />
        <span>{row.name}</span>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    render: (row) => <span className="table-badge">{row.category}</span>,
    width: '180px',
    hideOnMobile: true,
  },
  {
    key: 'uploadedBy',
    header: 'Uploaded By',
    render: (row) => row.uploadedBy,
    width: '150px',
    hideOnMobile: true,
  },
  {
    key: 'uploadedDate',
    header: 'Date',
    render: (row) => <span className="text-muted">{row.uploadedDate}</span>,
    width: '120px',
  },
  {
    key: 'size',
    header: 'Size',
    render: (row) => <span className="text-muted">{row.size}</span>,
    width: '100px',
    hideOnMobile: true,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>,
    width: '100px',
  },
];

export function Vault() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Documents', icon: Folder, count: documents.length },
    { id: 'reports', label: 'Reports', icon: FileText, count: documents.filter(d => d.type === 'report').length },
    { id: 'licenses', label: 'Licenses', icon: Award, count: documents.filter(d => d.type === 'license').length },
    { id: 'certifications', label: 'Certifications', icon: Award, count: documents.filter(d => d.type === 'certification').length },
    { id: 'receipts', label: 'Receipts', icon: Receipt, count: documents.filter(d => d.type === 'receipt').length },
    { id: 'contracts', label: 'Contracts', icon: FileSignature, count: documents.filter(d => d.type === 'contract').length },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Vault"
        description="Securely store and manage all your documents, reports, and certifications"
        primaryAction={{
          label: 'Upload Document',
          onClick: () => console.log('Upload document'),
          icon: <Plus size={16} />,
        }}
        secondaryAction={{
          label: 'Filter',
          onClick: () => console.log('Filter'),
        }}
      />

      <div className="vault-layout">
        {/* Categories Sidebar */}
        <div className="vault-sidebar">
          <Card className="categories-card">
            <h3 className="categories-title">Categories</h3>
            <div className="categories-list">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon size={18} />
                    <span className="category-label">{category.label}</span>
                    <span className="category-count">{category.count}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="vault-stats-card">
            <h3 className="vault-stats-title">Storage</h3>
            <div className="vault-stats">
              <div className="vault-stat-item">
                <span className="vault-stat-label">Total Documents</span>
                <span className="vault-stat-value">{documents.length}</span>
              </div>
              <div className="vault-stat-item">
                <span className="vault-stat-label">Total Size</span>
                <span className="vault-stat-value">15.8 MB</span>
              </div>
              <div className="vault-stat-item">
                <span className="vault-stat-label">Expired</span>
                <span className="vault-stat-value warning">1</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="vault-main">
          <div className="search-filter-bar">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search documents..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card padding="none">
            <Table 
              columns={documentColumns} 
              data={filteredDocuments}
              onRowClick={(row) => console.log('View document:', row.id)}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
