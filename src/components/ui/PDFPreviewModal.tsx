import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { IncidentReportPDF } from './IncidentReportPDF';
import '../../pdf-preview-modal.css';

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
}

export function PDFPreviewModal({ isOpen, onClose, package: pkg }: PDFPreviewModalProps) {
  if (!isOpen || !pkg) return null;

  // Build report object from package data based on client type
  let report, evidencePhotos;

  if (pkg.clientName === 'Building A') {
    report = {
      referenceId: pkg.reports[0].id,
      type: 'Incident' as const,
      guardName: 'John Smith',
      site: 'Building A - Main Entrance',
      timestamp: 'Dec 30, 11:45 PM',
      content: 'Observed unauthorized individual attempting to enter through rear loading dock at approximately 23:40. Individual appeared to be a male, approximately 6\'0" tall, wearing a dark hoodie and jeans. Subject was approached and questioned about their presence on the property. Subject could not provide valid credentials or reason for being at the facility after hours. Individual was informed that the property is private and trespass is prohibited. Subject became verbally agitated but did not make physical threats. Per security protocol SOP-14, I maintained a safe distance and contacted local police department at 23:43. While awaiting police arrival, subject attempted to leave the area on foot heading north on Maple Street. Subject was tracked visually but not pursued per company policy. Police unit arrived at 23:52 and took over the situation. Officers conducted field interview and ran identification check. Subject was issued a trespass warning and escorted off property. Incident number assigned by police: #IR-2024-1156. No property damage occurred. No injuries sustained. Area was secured and all entry points were re-checked and confirmed locked. Incident was logged in security system at 00:05. Property manager John Davis was notified via email at 00:10. Remainder of shift was uneventful.',
      incidentType: 'Security Breach',
      clientName: pkg.clientName
    };
    evidencePhotos = [
      'https://images.unsplash.com/photo-1561756719-55231c95c511?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwbG9jayUyMHNlY3VyaXR5fGVufDF8fHx8MTc2NzA5MDI4NHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1760210211349-15b4ad2cf6c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMGhhbGx3YXklMjBjb3JyaWRvcnxlbnwxfHx8fDE3NjcxNDcyNDR8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ];
  } else if (pkg.clientName === 'Global Logistics') {
    report = {
      referenceId: pkg.reports[0].id,
      type: 'DAR' as const,
      guardName: 'Maria Garcia',
      site: 'Global Logistics - Warehouse District',
      timestamp: 'Dec 30, 10:30 PM',
      content: 'Evening shift patrol completed without incident. Conducted comprehensive walkthrough of all warehouse zones at 22:00, 23:00, and 00:00. All access points verified secure with no signs of tampering or unauthorized entry attempts. Perimeter fencing inspected - no damage observed. Loading dock gates confirmed locked and alarm systems operational. Interior warehouse inspection revealed all inventory properly secured and organized. Climate control systems functioning within normal parameters (68°F, 45% humidity). Lighting systems fully operational across all zones. Security camera system checked - all 24 cameras recording properly with clear image quality. No suspicious vehicles observed in parking areas during shift. Employee badge access log reviewed - all entries and exits properly documented. Two late-shift warehouse staff (authorized) present until 23:30 departure. Facility secured and alarm system armed at shift end 00:15. Weather conditions: Clear skies, temperature 52°F. No maintenance issues identified. No safety concerns noted. Shift concluded with full facility lockdown confirmed.',
      incidentType: 'All Clear',
      clientName: pkg.clientName
    };
    evidencePhotos = [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2UlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjcxNDczMDd8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ];
  } else if (pkg.clientName === 'Tech Innovations') {
    report = {
      referenceId: pkg.reports[0].id,
      type: 'DAR' as const,
      guardName: 'Sarah Johnson',
      site: 'Tech Innovations Campus - Building 3',
      timestamp: 'Dec 30, 8:00 PM',
      content: 'Routine evening patrol identified maintenance issue requiring attention. During 20:00 building walkthrough, discovered ceiling water leak in second floor break room (Room 2B-14). Water dripping from ceiling tile near northeast corner, creating puddle on floor approximately 2 feet in diameter. Immediately cordoned off affected area with caution tape and placed warning signage. Contacted facilities management emergency line at 20:05. Facilities manager Tom Harrison responded and dispatched maintenance crew. Crew arrived on-site at 20:22. Issue traced to malfunctioning HVAC condensate drain line on third floor. Maintenance team shut off water supply to affected unit and began repairs. Affected area remained secured throughout repair process. Ceiling tile removed and replaced. Floor cleaned and dried by 21:15. HVAC system tested and confirmed operational at 21:30. Area inspected for any related damage - none found. No equipment or property damage. Caution tape removed and area returned to normal use at 21:45. Incident documented with photos. Maintenance report filed with case number MNT-2024-0847. Remainder of patrol completed - all other areas secure and operational.',
      incidentType: 'Maintenance Alert',
      clientName: pkg.clientName
    };
    evidencePhotos = [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBjZWlsaW5nJTIwbGVha3xlbnwxfHx8fDE3NjcxNDczMzR8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ];
  } else {
    // Default fallback
    report = {
      referenceId: pkg.reports[0].id,
      type: 'Incident' as const,
      guardName: 'Security Guard',
      site: pkg.siteName,
      timestamp: 'Dec 30, 2025',
      content: 'Report content not available.',
      incidentType: 'General Report',
      clientName: pkg.clientName
    };
    evidencePhotos = [];
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = () => {
    console.log('Download PDF:', pkg.reports[0].id);
    // In a real app, this would generate and download the PDF
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
            <h3>PDF Preview - {pkg.reports[0].id}</h3>
          </div>
          <div className="pdf-toolbar-actions">
            <button className="pdf-action-btn" onClick={handlePrint} title="Print">
              <Printer size={18} />
              <span>Print</span>
            </button>
            <button className="pdf-action-btn primary" onClick={handleDownload} title="Download">
              <Download size={18} />
              <span>Download</span>
            </button>
            <button className="pdf-close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="pdf-preview-content">
          <IncidentReportPDF report={report} evidencePhotos={evidencePhotos} />
        </div>
      </div>
    </div>
  );
}