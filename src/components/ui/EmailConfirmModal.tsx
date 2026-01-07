import React, { useState } from 'react';
import { X, Mail, FileText, Send, Eye, Loader2 } from 'lucide-react';
import '../../email-confirm-modal.css';

interface ClientPackage {
  id: number;
  clientName: string;
  siteName: string;
  reportCount: number;
  date?: string;
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
  onPreviewPDF?: () => void; // New prop to trigger PDF preview
  isSending?: boolean; // Loading state
}

export function EmailConfirmModal({ isOpen, onClose, onEmailSend, package: pkg, sentPackageIds, onPreviewPDF, isSending }: EmailConfirmModalProps) {
  if (!isOpen || !pkg) return null;

  // Generate email content with generic professional template
  const getEmailData = () => {
    const currentDate = pkg.date || new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return {
      to: 'security@client.com',
      subject: `Security Operations Report - ${pkg.siteName} - ${currentDate}`,
      defaultBody: `To the Management Team at ${pkg.siteName},

Please find attached the official Security Operations Report for ${currentDate}.

This document serves as a consolidated record of all patrol activities, verified incidents, and site observations recorded by our team during the reporting period.

All entries have been reviewed by a supervisor for accuracy.

Respectfully,
Security Operations Team`,
      attachmentName: `${pkg.siteName.replace(/\s+/g, '_')}_Security_Report_${currentDate.replace(/\s+/g, '_')}.pdf`
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
          <div 
            className="email-attachment group cursor-pointer hover:bg-white/5 transition-colors" 
            onClick={onPreviewPDF}
            title="Click to preview PDF"
          >
            <FileText size={18} className="attachment-icon" />
            <span className="attachment-name">{emailData.attachmentName}</span>
            <span className="attachment-size">(PDF Document)</span>
            {onPreviewPDF && (
              <Eye size={16} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-blue-400" />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="email-confirm-footer">
          <button className="email-cancel-btn" onClick={onClose} disabled={isSending}>
            Cancel
          </button>
          <button 
            className="email-send-btn" 
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Email Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}