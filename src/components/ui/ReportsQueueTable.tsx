import React from 'react';
import { AlertTriangle, ClipboardList, Wrench, UserX, FileSignature, Paperclip, Clock } from 'lucide-react';
import type { Report } from '../pages/Reports';

// ============================================================================
// DATE FORMATTING UTILITIES - Convert ISO timestamps to human-readable format
// ============================================================================

/**
 * Formats a date string (ISO or locale string) to human-readable format
 * @param dateString - ISO timestamp (e.g., "2026-01-08T05:44:44.442Z") or locale string
 * @returns Formatted string like "Jan 8, 2026 · 12:44 AM" or original if already formatted
 */
const formatTimestamp = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  // If it's already in the desired format (contains "·" or "•"), return as-is
  if (dateString.includes('·') || dateString.includes('•')) {
    return dateString;
  }
  
  // Check if it's an ISO timestamp (contains 'T' or 'Z')
  if (dateString.includes('T') || dateString.includes('Z')) {
    const date = new Date(dateString);
    
    // Format: "Jan 8, 2026 · 12:44 AM"
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' ·');
  }
  
  // Return as-is if it's not ISO format
  return dateString;
};

interface ReportsQueueTableProps {
  reports: Report[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onRowClick: (reportId: number) => void;
  showPendingColumns?: boolean;
}

export function ReportsQueueTable({ 
  reports, 
  selectedIds, 
  onToggleSelect, 
  onRowClick,
  showPendingColumns = false 
}: ReportsQueueTableProps) {
  
  // Helper to get report type icon and label
  const getReportTypeInfo = (report: Report) => {
    const type = report.reportType || report.type.toLowerCase();
    
    if (type === 'incident' || report.type === 'Incident') {
      return { icon: <AlertTriangle size={16} />, label: 'IR', color: '#EF4444' };
    } else if (type === 'dar' || report.type === 'DAR') {
      return { icon: <ClipboardList size={16} />, label: 'DAR', color: '#3B82F6' };
    } else if (type === 'maintenance' || report.type === 'Maintenance') {
      return { icon: <Wrench size={16} />, label: 'MNT', color: '#F59E0B' };
    } else if (type === 'disciplinary' || report.type === 'Disciplinary') {
      return { icon: <UserX size={16} />, label: 'DIS', color: '#8B5CF6' };
    } else if (type === 'shift_pass_on' || report.type === 'Shift Pass-On') {
      return { icon: <FileSignature size={16} />, label: 'SPO', color: '#10B981' };
    }
    
    return { icon: <ClipboardList size={16} />, label: 'DAR', color: '#3B82F6' };
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="queue-status-badge queue-status-pending">
          <Clock size={12} />
          Pending
        </span>
      );
    } else if (status === 'approved') {
      return (
        <span className="queue-status-badge queue-status-approved">
          Approved
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="queue-status-badge queue-status-rejected">
          Rejected
        </span>
      );
    }
    return <span className="queue-status-badge">{status}</span>;
  };

  // Helper to calculate age
  const calculateAge = (timestamp: string): { text: string; urgency: 'normal' | 'warning' | 'critical' } => {
    // Handle both ISO and formatted timestamps
    let reportDate: Date;
    
    if (timestamp.includes('T') || timestamp.includes('Z')) {
      // ISO format: "2026-01-08T05:44:44.442Z"
      reportDate = new Date(timestamp);
    } else {
      // Formatted timestamp: "Jan 07, 2026 • 2:30 PM"
      const dateStr = timestamp.split('•')[0].trim();
      reportDate = new Date(dateStr);
    }
    
    const now = new Date();
    const diffMs = now.getTime() - reportDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 5) {
      return { text: `${diffDays}d`, urgency: 'critical' };
    } else if (diffDays > 2) {
      return { text: `${diffDays}d`, urgency: 'warning' };
    } else if (diffHours > 24) {
      return { text: `${diffDays}d`, urgency: 'normal' };
    } else if (diffHours > 0) {
      return { text: `${diffHours}h`, urgency: 'normal' };
    } else {
      return { text: '<1h', urgency: 'normal' };
    }
  };

  // Helper to format date/time
  const formatDateTime = (timestamp: string) => {
    // Input: "Jan 07, 2026 • 2:30 PM"
    return timestamp;
  };

  return (
    <div className="queue-table-wrapper">
      <table className="queue-table">
        <thead>
          <tr>
            {showPendingColumns && <th className="queue-th-checkbox"></th>}
            <th className="queue-th-type">Type</th>
            <th className="queue-th-site">Site / Location</th>
            <th className="queue-th-filed">Filed By</th>
            <th className="queue-th-datetime">Date / Time</th>
            {showPendingColumns && <th className="queue-th-age">Age</th>}
            {showPendingColumns && <th className="queue-th-assigned">Assigned</th>}
            <th className="queue-th-status">Status</th>
            <th className="queue-th-attachments">Attachments</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const typeInfo = getReportTypeInfo(report);
            const attachmentCount = report.attachments?.length || 0;
            const age = showPendingColumns ? calculateAge(report.timestamp) : null;
            const assigned = report.assignedTo || 'Unassigned'; // Will use from report data when available

            return (
              <tr 
                key={report.id}
                className={`queue-row ${selectedIds.has(report.id) ? 'queue-row-selected' : ''}`}
                onClick={() => onRowClick(report.id)}
              >
                {showPendingColumns && (
                  <td 
                    className="queue-td-checkbox"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(report.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(report.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelect(report.id);
                      }}
                      className="queue-checkbox"
                    />
                  </td>
                )}
                
                <td className="queue-td-type">
                  <div className="queue-type-cell" style={{ color: typeInfo.color }}>
                    {typeInfo.icon}
                    <span className="queue-type-label">{typeInfo.label}</span>
                  </div>
                </td>
                
                <td className="queue-td-site">
                  <span className="queue-site-text">{report.site}</span>
                  {report.location && (
                    <span className="queue-location-text">{report.location}</span>
                  )}
                </td>
                
                <td className="queue-td-filed">
                  <span className="queue-filed-text">{report.guardName}</span>
                </td>
                
                <td className="queue-td-datetime">
                  <span className="queue-datetime-text">{formatTimestamp(report.timestamp)}</span>
                </td>
                
                {showPendingColumns && age && (
                  <td className="queue-td-age">
                    <span className={`queue-age-badge queue-age-${age.urgency}`}>
                      {age.text}
                    </span>
                  </td>
                )}
                
                {showPendingColumns && (
                  <td className="queue-td-assigned">
                    {assigned === 'Unassigned' ? (
                      <button 
                        className="queue-assign-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement assign to me logic
                          console.log('Assign to me:', report.id);
                        }}
                      >
                        Assign to me
                      </button>
                    ) : (
                      <span className="queue-assigned-text">{assigned}</span>
                    )}
                  </td>
                )}
                
                <td className="queue-td-status">
                  {getStatusBadge(report.status)}
                </td>
                
                <td className="queue-td-attachments">
                  {attachmentCount > 0 ? (
                    <div className="queue-attachments-cell">
                      <Paperclip size={14} />
                      <span>{attachmentCount}</span>
                    </div>
                  ) : (
                    <span className="queue-attachments-empty">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}