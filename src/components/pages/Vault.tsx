import React, { useState } from 'react';
import { Plus, Search, FileText, Folder, Wrench, Users, FileCheck, AlertTriangle, ClipboardList, Calendar } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { useAppState } from '../../contexts/AppStateContext';
import { SelectReportTypeModal } from '../ui/SelectReportTypeModal';
import { FileUploadModal } from '../ui/FileUploadModal';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { api } from '../../utils/api';

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
  fileUrl?: string; // Storage path for preview
}

export function Vault() {
  const { appState, currentUser, addVaultDocument, reports, addReport } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Removed expandable group state - using flat list now
  
  // NEW: Multi-step upload flow
  const [isSelectReportTypeModalOpen, setIsSelectReportTypeModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon'>('incident');
  const [generatedReportNumber, setGeneratedReportNumber] = useState('');

  /**
   * SINGLE FUNCTION: openVaultDocument
   * Opens a vault document PDF in a new tab
   * Uses the new /api/vault/open-url endpoint
   */
  const openVaultDocument = (doc: Document, event?: React.MouseEvent) => {
    // Prevent any default behavior that might interfere
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log("=== [VaultOpen] Starting document open ===");
    console.log("[VaultOpen] Document ID:", doc.id);
    console.log("[VaultOpen] Document Name:", doc.name);
    console.log("[VaultOpen] Document Category:", doc.category);
    console.log("[VaultOpen] Report Reference ID:", doc.reportReferenceId);
    
    // PDF VERIFICATION: Log report type and code for testing
    if (doc.reportReferenceId) {
      const reportCode = doc.reportReferenceId;
      const prefix = reportCode.split('-')[0];
      const reportTypeMap: Record<string, string> = {
        'IR': 'incident',
        'DAR': 'dar',
        'MNT': 'maintenance',
        'DIS': 'disciplinary',
        'SPO': 'shift_pass_on'
      };
      const reportType = reportTypeMap[prefix] || 'other';
      
      console.log('━'.repeat(80));
      console.log('📄 VAULT PDF OPEN VERIFICATION');
      console.log('━'.repeat(80));
      console.log(`🔹 Report Type: ${reportType} (Prefix: ${prefix})`);
      console.log(`🔹 Report Code: ${reportCode}`);
      console.log(`🔹 Category: ${doc.category}`);
      console.log(`🔹 Expected PDF Sections:`);
      
      const sections: Record<string, string[]> = {
        'incident': ['Header', 'Key Facts', 'Narrative', 'Actions Taken', 'Police Response (conditional)', 'Attachments', 'Supervisor Review'],
        'dar': ['Header', 'Key Facts', 'Narrative', 'Shift Details', 'Equipment Status (conditional)', 'Attachments', 'Supervisor Review'],
        'maintenance': ['Header', 'Key Facts', 'Narrative', 'Maintenance Details', 'Attachments', 'Supervisor Review'],
        'disciplinary': ['Header', 'Key Facts', 'Narrative', 'Disciplinary Details', 'Corrective Action (conditional)', 'Attachments', 'Supervisor Review'],
        'shift_pass_on': ['Header', 'Key Facts', 'Narrative', 'Attachments', 'Supervisor Review'],
      };
      
      (sections[reportType] || sections['shift_pass_on']).forEach(section => {
        console.log(`   - ${section}`);
      });
      console.log('━'.repeat(80));
      console.log('');
    }

    // CRITICAL: Open window IMMEDIATELY (synchronously) to avoid pop-up blocker
    // Using 'about:blank' is more reliable than empty string
    console.log("[VaultOpen] Opening blank window synchronously...");
    const newWindow = window.open('about:blank', '_blank');
    
    if (!newWindow) {
      console.error('[VaultOpen] ❌ Pop-up blocked by browser');
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }
    
    // Show loading state in the new window
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading Document...</title>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              background: #0B1220;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 3px solid rgba(255, 255, 255, 0.1);
              border-top: 3px solid #FF7A18;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .title {
              font-size: 18px;
              margin-bottom: 10px;
              font-weight: 500;
            }
            .subtitle {
              color: #8899AA;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <div class="title">Loading PDF...</div>
            <div class="subtitle">Please wait</div>
          </div>
        </body>
      </html>
    `);
    newWindow.document.close(); // Important: close the document to finish writing

    // Now handle the async part
    handleAsyncPdfLoad(newWindow, doc);
  };

  // Separated async function to keep window.open() synchronous
  const handleAsyncPdfLoad = async (newWindow: Window, doc: Document) => {
    try {
      toast.info('Loading document...');

      // Call the new API endpoint using the api client
      console.log("[VaultOpen] Calling API: /api/vault/open-url");
      const data = await api.post('/api/vault/open-url', { documentId: doc.id });
      
      console.log("[VaultOpen] API Response:", data);
      
      if (data.success && data.signedUrl) {
        console.log('[VaultOpen] ✅ Received signed URL');
        console.log('[VaultOpen] URL length:', data.signedUrl.length);
        console.log('[VaultOpen] Redirecting window to PDF...');
        
        // Redirect the already-open window to the PDF URL
        newWindow.location.href = data.signedUrl;
        
        console.log('[VaultOpen] ✅ Document opened successfully');
        toast.success('Document opened');
      } else {
        console.error('[VaultOpen] ❌ Invalid API response:', data);
        
        // Show error in the window
        newWindow.document.open();
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error</title>
              <meta charset="utf-8">
              <style>
                body {
                  margin: 0;
                  padding: 40px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                  background: #0B1220;
                  color: #fff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                }
                .error {
                  text-align: center;
                  max-width: 400px;
                }
                .title {
                  font-size: 18px;
                  margin-bottom: 10px;
                  color: #EF4444;
                  font-weight: 500;
                }
                .subtitle {
                  color: #8899AA;
                  font-size: 14px;
                  line-height: 1.5;
                }
              </style>
            </head>
            <body>
              <div class="error">
                <div class="title">Unable to open document</div>
                <div class="subtitle">Please try again or contact support if the problem persists.</div>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
        
        toast.error("Unable to open document. Please try again.");
      }

    } catch (error: any) {
      console.error('[VaultOpen] ❌ Error occurred:', error);
      console.error('[VaultOpen] Error message:', error.message);
      console.error('[VaultOpen] Error stack:', error.stack);
      
      // Show error in the window
      newWindow.document.open();
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
            <meta charset="utf-8">
            <style>
              body {
                margin: 0;
                padding: 40px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                background: #0B1220;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
              }
              .error {
                text-align: center;
                max-width: 400px;
              }
              .title {
                font-size: 18px;
                margin-bottom: 10px;
                color: #EF4444;
                font-weight: 500;
              }
              .subtitle {
                color: #8899AA;
                font-size: 14px;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <div class="title">Error loading document</div>
              <div class="subtitle">Please try again or contact support.</div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
      
      toast.error('Unable to open document. Please try again.');
    }
    
    console.log("=== [VaultOpen] Completed ===");
  };

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

  // Helper function to format current date
  const formatCurrentDate = (): string => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Generate report number based on type
  const generateReportNumber = (type: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon'): string => {
    const prefix = type === 'incident' ? 'IR' 
      : type === 'dar' ? 'DAR' 
      : type === 'maintenance' ? 'MNT' 
      : type === 'disciplinary' ? 'DIS' 
      : 'SPO';
    
    const year = new Date().getFullYear();
    const prefixPattern = `${prefix}-${year}-`;
    
    // Find all existing reports with this prefix pattern (checking both reportNumber and caseId)
    const existingNumbers = (appState.reports || [])
      .filter(r => {
        const id = r.reportNumber || r.caseId || '';
        return id.replace('#', '').startsWith(prefixPattern);
      })
      .map(r => {
        const id = (r.reportNumber || r.caseId || '').replace('#', '');
        const parts = id.split('-');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart, 10);
      })
      .filter(num => !isNaN(num));
    
    // Find the maximum number (or default to 0 if none exist)
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNum + 1;
    
    // Use 6-digit format for report numbers
    return `${prefix}-${year}-${String(nextNumber).padStart(6, '0')}`;
  };

  // Handle report type selection
  const handleSelectReportType = (type: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon') => {
    setSelectedReportType(type);
    const reportNum = generateReportNumber(type);
    setGeneratedReportNumber(reportNum);
    setIsSelectReportTypeModalOpen(false);
    setIsFileUploadModalOpen(true);
  };

  // Handle file save
  const handleFileSave = (file: File) => {
    // Get category based on report type - simplified for MVP
    const getCategory = (type: string) => {
      if (type === 'incident') return 'Incident Reports';
      if (type === 'dar') return 'Daily Reports';
      if (type === 'maintenance') return 'Maintenance';
      if (type === 'disciplinary') return 'HR & Internal';
      if (type === 'shift-passon') return 'Internal Ops';
      // Default to Compliance for manual uploads
      return 'Compliance';
    };

    // Add to vault
    addVaultDocument({
      name: `${generatedReportNumber} - ${file.name}`,
      category: getCategory(selectedReportType),
      uploadedBy: currentUser.name,
      date: formatCurrentDate(),
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'Active',
      reportReferenceId: generatedReportNumber
    });

    // Also create a report entry in the backend
    const reportTypeLabel = selectedReportType === 'incident' ? 'Incident' 
      : selectedReportType === 'dar' ? 'DAR' 
      : selectedReportType === 'maintenance' ? 'Maintenance' 
      : selectedReportType === 'disciplinary' ? 'Disciplinary' 
      : 'Shift Pass-On';

    if (addReport) {
      addReport({
        type: reportTypeLabel as 'Incident' | 'DAR' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On',
        reportNumber: generatedReportNumber,
        site: 'Uploaded via Vault',
        location: 'N/A',
        filedBy: currentUser.name,
        filedOn: new Date().toISOString(),
        dateTime: new Date().toISOString(),
        status: 'approved',
        description: `Document uploaded: ${file.name}`,
        hasAttachments: true
      });
    }

    setIsFileUploadModalOpen(false);
  };

  // Convert VaultDocuments from global state to Document format
  const allDocuments: Document[] = appState.vaultDocuments.map((vaultDoc, index) => ({
    id: vaultDoc.id, // Use the unique vault document ID as the key
    name: vaultDoc.name,
    type: getCategoryType(vaultDoc.category),
    category: vaultDoc.category,
    uploadedBy: vaultDoc.uploadedBy,
    uploadedDate: vaultDoc.date,
    size: vaultDoc.size,
    status: vaultDoc.status.toLowerCase() as 'active' | 'expired' | 'pending',
    reportReferenceId: vaultDoc.reportReferenceId,
    fileUrl: vaultDoc.fileUrl // Storage path for preview
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
      
      // MVP SIMPLIFIED CATEGORIES
      case 'incident_reports':
        return allDocuments.filter(d => d.category === 'Incident Reports').length;
      
      case 'daily_reports':
        return allDocuments.filter(d => d.category === 'Daily Reports' || d.category === 'Internal Ops').length;
      
      case 'maintenance_reports':
        return allDocuments.filter(d => d.category === 'Maintenance').length;
      
      case 'disciplinary_reports':
        return allDocuments.filter(d => d.category === 'HR & Internal').length;
      
      case 'shift_passon_logs':
        return allDocuments.filter(d => d.category === 'Internal Ops').length;
      
      case 'compliance':
        return allDocuments.filter(d => 
          d.category === 'Licenses' || 
          d.category === 'Certifications' ||
          d.category === 'Compliance'
        ).length;
      
      default:
        return 0;
    }
  };

  const filteredDocuments = allDocuments.filter((doc) => {
    // Search filter
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter - simplified for MVP
    let matchesCategory = false;
    
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'incident_reports') {
      matchesCategory = doc.category === 'Incident Reports';
    } else if (selectedCategory === 'daily_reports') {
      matchesCategory = doc.category === 'Daily Reports' || doc.category === 'Internal Ops';
    } else if (selectedCategory === 'maintenance_reports') {
      matchesCategory = doc.category === 'Maintenance';
    } else if (selectedCategory === 'disciplinary_reports') {
      matchesCategory = doc.category === 'HR & Internal';
    } else if (selectedCategory === 'shift_passon_logs') {
      matchesCategory = doc.category === 'Internal Ops';
    } else if (selectedCategory === 'compliance') {
      matchesCategory = doc.category === 'Licenses' || 
                       doc.category === 'Certifications' ||
                       doc.category === 'Compliance';
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
          onClick: () => setIsSelectReportTypeModalOpen(true),
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
              {/* All Documents */}
              <button
                className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <Folder size={18} />
                <span className="category-label">All Documents</span>
                <span className="category-count">{getCategoryCount('all')}</span>
              </button>

              {/* MVP SIMPLIFIED CATEGORIES - FLAT LIST */}
              
              {/* Incident Reports */}
              <button
                className={`category-item ${selectedCategory === 'incident_reports' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('incident_reports')}
              >
                <AlertTriangle size={18} />
                <span className="category-label">Incident Reports</span>
                <span className="category-count">{getCategoryCount('incident_reports')}</span>
              </button>

              {/* Daily Activity Reports */}
              <button
                className={`category-item ${selectedCategory === 'daily_reports' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('daily_reports')}
              >
                <ClipboardList size={18} />
                <span className="category-label">Daily Activity Reports</span>
                <span className="category-count">{getCategoryCount('daily_reports')}</span>
              </button>

              {/* Maintenance Reports */}
              <button
                className={`category-item ${selectedCategory === 'maintenance_reports' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('maintenance_reports')}
              >
                <Wrench size={18} />
                <span className="category-label">Maintenance Reports</span>
                <span className="category-count">{getCategoryCount('maintenance_reports')}</span>
              </button>

              {/* Disciplinary Reports */}
              <button
                className={`category-item ${selectedCategory === 'disciplinary_reports' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('disciplinary_reports')}
              >
                <Users size={18} />
                <span className="category-label">Disciplinary Reports</span>
                <span className="category-count">{getCategoryCount('disciplinary_reports')}</span>
              </button>

              {/* Shift Pass-On Logs */}
              <button
                className={`category-item ${selectedCategory === 'shift_passon_logs' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('shift_passon_logs')}
              >
                <Calendar size={18} />
                <span className="category-label">Shift Pass-On Logs</span>
                <span className="category-count">{getCategoryCount('shift_passon_logs')}</span>
              </button>

              {/* Compliance */}
              <button
                className={`category-item ${selectedCategory === 'compliance' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('compliance')}
              >
                <FileCheck size={18} />
                <span className="category-label">Compliance</span>
                <span className="category-count">{getCategoryCount('compliance')}</span>
              </button>
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
            {/* Div-based table with CSS grid layout */}
            <div className="vault-table-container">
              {/* Header Row */}
              <div 
                className="vault-table-header"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.6fr 0.4fr 0.4fr',
                  gap: '16px',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                <div>Document Name</div>
                <div className="hide-mobile">Category</div>
                <div className="hide-mobile">Uploaded By</div>
                <div>Date</div>
                <div className="hide-mobile">Size</div>
                <div>Status</div>
              </div>

              {/* Document Rows */}
              <div className="vault-table-body">
                {filteredDocuments.length === 0 ? (
                  <div style={{ 
                    padding: '48px 24px', 
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    No documents found
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={(e) => openVaultDocument(doc, e)}
                      onKeyDown={(e) => {
                        // Keyboard support: Enter or Space
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openVaultDocument(doc);
                        }
                      }}
                      aria-label={`Open document ${doc.name}`}
                      className={`vault-table-row ${doc.isNewEntry ? 'vault-new-entry' : ''}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.6fr 0.4fr 0.4fr',
                        gap: '16px',
                        padding: '16px',
                        borderBottom: '1px solid var(--border)',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        position: 'relative',
                        zIndex: 1,
                        fontSize: '14px',
                        fontWeight: 400,
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        pointerEvents: 'auto'
                      }}
                    >
                      {/* Document Name */}
                      <div 
                        className="flex items-center gap-2" 
                        style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          minWidth: 0
                        }}
                      >
                        <FileText size={16} className="text-accent" style={{ flexShrink: 0 }} />
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {doc.name}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="hide-mobile">
                        <span className="table-badge">{doc.category}</span>
                      </div>

                      {/* Uploaded By */}
                      <div className="hide-mobile">
                        {doc.uploadedBy}
                      </div>

                      {/* Date */}
                      <div style={{ color: 'var(--text-muted)' }}>
                        {doc.uploadedDate}
                      </div>

                      {/* Size */}
                      <div className="hide-mobile" style={{ color: 'var(--text-muted)' }}>
                        {doc.size}
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`status-badge ${doc.status}`}>{doc.status}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Select Report Type Modal */}
      <SelectReportTypeModal
        isOpen={isSelectReportTypeModalOpen}
        onClose={() => setIsSelectReportTypeModalOpen(false)}
        onSelectType={handleSelectReportType}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
        reportType={selectedReportType}
        reportNumber={generatedReportNumber}
        onSave={handleFileSave}
      />
    </div>
  );
}