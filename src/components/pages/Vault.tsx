import React, { useState } from 'react';
import { Plus, Search, FileText, Award, Receipt, FileSignature, Folder, Download, Eye, MoreVertical, Filter, Wrench, Briefcase, Upload, X } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';
import { useAppState } from '../../contexts/AppStateContext';

interface Document {
  id: number | string;
  name: string;
  type: 'report' | 'license' | 'certification' | 'receipt' | 'contract' | 'maintenance' | 'other';
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  status: 'active' | 'expired' | 'pending';
  isNewEntry?: boolean; // Flag for visual highlight
  reportReferenceId?: string; // Link to original report
}

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
  const { appState, currentUser, addVaultDocument } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'Incident Reports' as 'Incident Reports' | 'Daily Reports' | 'Maintenance' | 'Licenses' | 'Certifications' | 'Receipts' | 'Contracts' | 'Client Packets'
  });

  // Helper function to map VaultDocument category to Document type
  const getCategoryType = (category: string): Document['type'] => {
    if (category === 'Incident Reports' || category === 'Daily Reports') return 'report';
    if (category === 'Client Packets') return 'report'; // Client Packets are also reports
    if (category === 'Maintenance') return 'maintenance';
    if (category === 'Licenses') return 'license';
    if (category === 'Certifications') return 'certification';
    if (category === 'Receipts') return 'receipt';
    if (category === 'Contracts') return 'contract';
    return 'other';
  };

  // Helper function to parse size string to KB for calculation
  const parseSizeToKB = (sizeStr: string): number => {
    const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB)$/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    if (unit === 'KB') return value;
    if (unit === 'MB') return value * 1024;
    if (unit === 'GB') return value * 1024 * 1024;
    return 0;
  };

  // Helper function to format size from KB
  const formatSize = (kb: number): string => {
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
  };

  // Helper function to generate random file size (1MB - 5MB)
  const generateRandomSize = (): string => {
    const minMB = 1.0;
    const maxMB = 5.0;
    const randomMB = (Math.random() * (maxMB - minMB) + minMB).toFixed(1);
    return `${randomMB} MB`;
  };

  // Helper function to format current date
  const formatCurrentDate = (): string => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle upload document submission
  const handleUploadDocument = () => {
    if (!uploadForm.name.trim()) {
      return; // Don't upload if name is empty
    }

    addVaultDocument({
      name: uploadForm.name,
      category: uploadForm.category,
      uploadedBy: currentUser.name,
      date: formatCurrentDate(),
      size: generateRandomSize(),
      status: 'Active'
    });

    // Reset form and close modal
    setUploadForm({
      name: '',
      category: 'Incident Reports'
    });
    setShowUploadModal(false);
  };

  // Convert VaultDocuments from global state to Document format
  const allDocuments: Document[] = appState.vaultDocuments.map((vaultDoc, index) => ({
    id: vaultDoc.reportReferenceId || `vault-${vaultDoc.id}-${index}`, // Use reportReferenceId as primary key, fallback to composite
    name: vaultDoc.name,
    type: getCategoryType(vaultDoc.category),
    category: vaultDoc.category,
    uploadedBy: vaultDoc.uploadedBy,
    uploadedDate: vaultDoc.date,
    size: vaultDoc.size,
    status: vaultDoc.status.toLowerCase() as 'active' | 'expired' | 'pending',
    reportReferenceId: vaultDoc.reportReferenceId
  }));

  // Calculate total size dynamically
  const totalSizeKB = allDocuments.reduce((acc, doc) => acc + parseSizeToKB(doc.size), 0);
  const totalSizeFormatted = formatSize(totalSizeKB);

  // Calculate expired documents count
  const expiredCount = allDocuments.filter(d => d.status === 'expired').length;

  // Helper function to get count for each category with strict matching
  const getCategoryCount = (categoryId: string): number => {
    switch (categoryId) {
      case 'all':
        return allDocuments.length;
      case 'reports':
        // Reports = ONLY Incident Reports OR Daily Reports (NOT Client Packets)
        return allDocuments.filter(d => 
          d.category === 'Incident Reports' || d.category === 'Daily Reports'
        ).length;
      case 'client_packets':
        // Client Packets = ONLY Client Packets
        return allDocuments.filter(d => d.category === 'Client Packets').length;
      case 'maintenance':
        // Maintenance = ONLY Maintenance category
        return allDocuments.filter(d => d.category === 'Maintenance').length;
      case 'licenses':
        return allDocuments.filter(d => d.category === 'Licenses').length;
      case 'certifications':
        return allDocuments.filter(d => d.category === 'Certifications').length;
      case 'receipts':
        return allDocuments.filter(d => d.category === 'Receipts').length;
      case 'contracts':
        return allDocuments.filter(d => d.category === 'Contracts').length;
      default:
        return 0;
    }
  };

  const categories = [
    { id: 'all', label: 'All Documents', icon: Folder, count: getCategoryCount('all') },
    { id: 'reports', label: 'Reports', icon: FileText, count: getCategoryCount('reports') },
    { id: 'client_packets', label: 'Client Packets', icon: Briefcase, count: getCategoryCount('client_packets') },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, count: getCategoryCount('maintenance') },
    { id: 'licenses', label: 'Licenses', icon: Award, count: getCategoryCount('licenses') },
    { id: 'certifications', label: 'Certifications', icon: Award, count: getCategoryCount('certifications') },
    { id: 'receipts', label: 'Receipts', icon: Receipt, count: getCategoryCount('receipts') },
    { id: 'contracts', label: 'Contracts', icon: FileSignature, count: getCategoryCount('contracts') },
  ];

  const filteredDocuments = allDocuments.filter((doc) => {
    // Search filter
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter with strict equality checks
    let matchesCategory = false;
    
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'reports') {
      // Reports = ONLY Incident Reports OR Daily Reports (NOT Client Packets)
      matchesCategory = doc.category === 'Incident Reports' || doc.category === 'Daily Reports';
    } else if (selectedCategory === 'client_packets') {
      // Client Packets = ONLY Client Packets
      matchesCategory = doc.category === 'Client Packets';
    } else if (selectedCategory === 'maintenance') {
      // Maintenance = ONLY Maintenance category
      matchesCategory = doc.category === 'Maintenance';
    } else if (selectedCategory === 'licenses') {
      matchesCategory = doc.category === 'Licenses';
    } else if (selectedCategory === 'certifications') {
      matchesCategory = doc.category === 'Certifications';
    } else if (selectedCategory === 'receipts') {
      matchesCategory = doc.category === 'Receipts';
    } else if (selectedCategory === 'contracts') {
      matchesCategory = doc.category === 'Contracts';
    }
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Vault"
        description="Securely store and manage all your documents, reports, and certifications"
        primaryAction={{
          label: 'Upload Document',
          onClick: () => setShowUploadModal(true),
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
                <span className="vault-stat-value">{allDocuments.length}</span>
              </div>
              <div className="vault-stat-item">
                <span className="vault-stat-label">Total Size</span>
                <span className="vault-stat-value">{totalSizeFormatted}</span>
              </div>
              <div className="vault-stat-item">
                <span className="vault-stat-label">Expired</span>
                <span className="vault-stat-value warning">{expiredCount}</span>
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Upload Document</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as 'Incident Reports' | 'Daily Reports' | 'Maintenance' | 'Licenses' | 'Certifications' | 'Receipts' | 'Contracts' | 'Client Packets' })}
                >
                  <option value="Incident Reports">Incident Reports</option>
                  <option value="Daily Reports">Daily Reports</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Licenses">Licenses</option>
                  <option value="Certifications">Certifications</option>
                  <option value="Receipts">Receipts</option>
                  <option value="Contracts">Contracts</option>
                  <option value="Client Packets">Client Packets</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button className="modal-button primary" onClick={handleUploadDocument}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}