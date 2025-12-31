import React, { useState } from 'react';
import { X, Mail, FileText, Send } from 'lucide-react';
import '../../email-confirm-modal.css';

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

interface EmailConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSend: () => void;
  package: ClientPackage | null;
  sentPackageIds: Set<number>;
}

export function EmailConfirmModal({ isOpen, onClose, onEmailSend, package: pkg, sentPackageIds }: EmailConfirmModalProps) {
  if (!isOpen || !pkg) return null;

  // Generate email content based on client
  const getEmailData = () => {
    if (pkg.clientName === 'Building A') {
      return {
        to: 'facility.manager@buildinga.com',
        subject: `Security Report: Building A - Incident ${pkg.reports[0].id}`,
        defaultBody: `Good Morning,

Please find attached the Daily Activity Report (DAR) for the shift ending Dec 30, 2025.

Summary: All scheduled patrols were completed. We successfully resolved 1 security incident regarding an unauthorized entry attempt at the loading dock. Full details and evidence photos are included in the attached PDF.

Regards,
Security Operations Team`,
        attachmentName: 'Building_A_Incident_Report_Dec30.pdf'
      };
    } else if (pkg.clientName === 'Global Logistics') {
      return {
        to: 'operations@globallogistics.com',
        subject: `Security Report: Global Logistics - Daily Report ${pkg.reports[0].id}`,
        defaultBody: `Good Morning,

Please find attached the Daily Activity Report (DAR) for the shift ending Dec 30, 2025.

Summary: All scheduled patrols were completed without incident. Facility remained secure throughout the evening shift. All security systems operational and facility properly secured at shift conclusion.

Regards,
Security Operations Team`,
        attachmentName: 'Global_Logistics_Daily_Report_Dec30.pdf'
      };
    } else if (pkg.clientName === 'Tech Innovations') {
      return {
        to: 'facilities@techinnovations.com',
        subject: `Security Report: Tech Innovations - Maintenance Alert ${pkg.reports[0].id}`,
        defaultBody: `Good Morning,

Please find attached the Daily Activity Report (DAR) for the shift ending Dec 30, 2025.

Summary: All scheduled patrols were completed. We identified and coordinated response to 1 maintenance issue (ceiling water leak in Room 2B-14). Issue was resolved by facilities team. Full details included in the attached PDF.

Regards,
Security Operations Team`,
        attachmentName: 'Tech_Innovations_Maintenance_Report_Dec30.pdf'
      };
    }
    
    return {
      to: 'client@example.com',
      subject: 'Security Report',
      defaultBody: 'Please find attached the security report.',
      attachmentName: 'Security_Report.pdf'
    };
  };

  const emailData = getEmailData();
  const [emailBody, setEmailBody] = useState(emailData.defaultBody);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSend = () => {
    onEmailSend();
    onClose();
  };

  return (
    <div className="email-confirm-overlay" onClick={handleOverlayClick}>
      <div className="email-confirm-container">
        {/* Header */}
        <div className="email-confirm-header">
          <div className="email-header-title">
            <Mail size={20} />
            <h3>Review Client Email</h3>
          </div>
          <button className="email-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Email Content */}
        <div className="email-confirm-content">
          {/* To Field */}
          <div className="email-field">
            <label className="email-field-label">To:</label>
            <div className="email-field-value">{emailData.to}</div>
          </div>

          {/* Subject Field */}
          <div className="email-field">
            <label className="email-field-label">Subject:</label>
            <div className="email-field-value">{emailData.subject}</div>
          </div>

          {/* Body Field (Editable) */}
          <div className="email-field email-field-body">
            <label className="email-field-label">Message:</label>
            <textarea
              className="email-body-textarea"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={12}
            />
          </div>

          {/* Attachment */}
          <div className="email-attachment">
            <FileText size={18} className="attachment-icon" />
            <span className="attachment-name">{emailData.attachmentName}</span>
            <span className="attachment-size">(PDF Document)</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="email-confirm-footer">
          <button className="email-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="email-send-btn" onClick={handleSend}>
            <Send size={16} />
            <span>Send Email Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}