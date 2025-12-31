import React from 'react';
import { IncidentReportPDF } from '../ui/IncidentReportPDF';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import '../../report-view.css';

export type ClientType = 'building-a' | 'global-logistics' | 'tech-innovations';

interface ReportViewProps {
  clientType: ClientType;
  onBack: () => void;
}

export function ReportView({ clientType, onBack }: ReportViewProps) {
  // Generate report data based on client type
  const getReportData = () => {
    switch (clientType) {
      case 'building-a':
        return {
          referenceId: '#IR-2024-1156',
          type: 'Incident' as const,
          guardName: 'Maria Garcia',
          site: 'Building A - Main Entrance',
          timestamp: 'Dec 30, 2024 - 22:45',
          content: 'Unauthorized individual attempting to enter through rear loading dock. Subject was escorted off premises. No physical altercation occurred. Police were notified and arrived at 23:52. Door lock was damaged during the attempt.',
          incidentType: 'Security Breach',
          clientName: 'Building A'
        };
      
      case 'global-logistics':
        return {
          referenceId: '#DAR-882',
          type: 'DAR' as const,
          guardName: 'Robert Brown',
          site: 'Global Logistics - Distribution Center',
          timestamp: 'Dec 30, 2024',
          content: 'Shift completed successfully with all logistics protocols verified. All perimeter checks completed on schedule. No unauthorized vehicles detected. All shipping seals verified and documented. Zero incidents reported throughout operational period.',
          clientName: 'Global Logistics'
        };
      
      case 'tech-innovations':
        return {
          referenceId: '#DAR-993',
          type: 'DAR' as const,
          guardName: 'Sarah Chen',
          site: 'Tech Innovations - Server Room B',
          timestamp: 'Dec 31, 2024 - 02:15',
          content: 'Officer Chen detected unusual water leak in server room hallway during routine patrol. Facilities Manager Sarah Wilson was immediately notified via emergency portal at 02:15. Maintenance alert issued and area cordoned off. Leak contained by 02:45.',
          clientName: 'Tech Innovations'
        };
      
      default:
        return {
          referenceId: '#DAR-000',
          type: 'DAR' as const,
          guardName: 'Unknown',
          site: 'Unknown Location',
          timestamp: 'N/A',
          content: 'No data available',
          clientName: 'Unknown Client'
        };
    }
  };

  // Get evidence photos based on client type
  const getEvidencePhotos = () => {
    if (clientType === 'building-a') {
      return [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        'https://images.unsplash.com/photo-1614359226203-6334ed8c0b8e?w=800'
      ];
    }
    return [];
  };

  const reportData = getReportData();
  const evidencePhotos = getEvidencePhotos();

  const getClientDisplayName = () => {
    switch (clientType) {
      case 'building-a':
        return 'Building A - Security Breach Report';
      case 'global-logistics':
        return 'Global Logistics - Clean Sheet Report';
      case 'tech-innovations':
        return 'Tech Innovations - Maintenance Alert';
      default:
        return 'Client Report';
    }
  };

  return (
    <div className="report-view-container">
      {/* Header Bar */}
      <div className="report-view-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Reports
        </button>
        
        <div className="report-view-actions">
          <button className="action-button action-button-secondary">
            <Share2 size={16} />
            Share
          </button>
          <button className="action-button action-button-primary">
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Report Title */}
      <div className="report-view-title-section">
        <h1 className="report-view-title">{getClientDisplayName()}</h1>
        <p className="report-view-subtitle">Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* PDF Preview */}
      <div className="report-view-pdf-wrapper">
        <IncidentReportPDF 
          report={reportData}
          evidencePhotos={evidencePhotos}
        />
      </div>
    </div>
  );
}
