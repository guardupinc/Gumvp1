import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { ClientReportPDF } from './ClientReportPDF';
import '../../pdf-preview-modal.css';

interface Report {
  id: number;
  referenceId: string;
  caseId?: string;
  type: 'DAR' | 'Incident' | 'Maintenance';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  location?: string;
  attachments?: Array<{ id: number; url: string; name: string }>;
  date?: string;
  time?: string;
  incidentType?: string;
  urgency?: string;
  policeCalled?: string;
  narrativeOnly?: string;
  actionTaken?: string;
  pdCaseNumber?: string;
  shiftStart?: string;
  shiftEnd?: string;
  reliefGuard?: string;
  equipmentStatus?: string;
  maintenanceCategory?: string;
  specificArea?: string;
  assetId?: string;
}

interface ClientPackage {
  id: number;
  clientName: string;
  siteName: string;
  reportCount: number;
  reports: {
    type: string;
    id: string;
    status: 'ready' | 'pending';
  }[];
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: ClientPackage | null;
  allReports?: Report[];
}

export function PDFPreviewModal({ isOpen, onClose, package: pkg, allReports = [] }: PDFPreviewModalProps) {
  if (!isOpen || !pkg) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pdf-preview-overlay" onClick={handleOverlayClick}>
      <div className="pdf-preview-container">
        {/* Toolbar */}
        <div className="pdf-toolbar">
          <div className="pdf-toolbar-title">
            <h3>PDF Preview - {pkg.siteName} Daily Packet</h3>
          </div>
          <div className="pdf-toolbar-actions">
            <button className="pdf-action-btn" onClick={handlePrint} title="Print">
              <Printer size={18} />
              <span>Print</span>
            </button>
            <button className="pdf-action-btn primary" onClick={handleDownloadPDF} title="Download">
              <Download size={18} />
              <span>Download</span>
            </button>
            <button className="pdf-close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="pdf-preview-content" id="report-pdf-content">
          <ClientReportPDF package={pkg} allReports={allReports} />
        </div>
      </div>
    </div>
  );
}