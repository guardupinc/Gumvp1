import React from 'react';
import { FileText } from 'lucide-react';
import { getEvidenceUrl, openEvidence } from '../../utils/openEvidence';

interface Attachment {
  id: number;
  url?: string;
  src?: string;
  fileUrl?: string;
  downloadUrl?: string;
  previewUrl?: string;
  name: string;
  type?: string;
  mimeType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface AttachmentGridProps {
  attachments: Attachment[];
}

export function AttachmentGrid({ attachments }: AttachmentGridProps) {
  // Determine if file is an image based on URL or type
  const isImage = (attachment: Attachment): boolean => {
    const url = getEvidenceUrl(attachment);
    if (!url) return false;
    
    const urlLower = url.toLowerCase();
    const type = (attachment.mimeType || attachment.type || '').toLowerCase();
    return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(urlLower);
  };

  const handleAttachmentClick = (e: React.MouseEvent, attachment: Attachment) => {
    // Let default <a> behavior handle Ctrl/Cmd+Click for opening in new tab
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Prevent default and use our utility for normal clicks
    e.preventDefault();
    const success = openEvidence(attachment);
    
    if (!success) {
      alert('⚠️ Attachment unavailable: No valid URL found');
    }
  };

  return (
    <>
      <div className="qc-evidence-grid">
        {attachments.map((attachment) => {
          const url = getEvidenceUrl(attachment);
          
          return (
            <a
              key={attachment.id}
              href={url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleAttachmentClick(e, attachment)}
              className="qc-evidence-item"
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: url ? 'pointer' : 'not-allowed',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                textDecoration: 'none',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                if (url) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 122, 24, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={url ? 'Click to open in new tab' : 'Attachment unavailable'}
            >
              {isImage(attachment) && url ? (
                <img 
                  src={url} 
                  alt={attachment.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  padding: '16px'
                }}>
                  <FileText size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
                  <div style={{
                    color: '#E2E8F0',
                    fontSize: '11px',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    maxWidth: '100%'
                  }}>
                    {attachment.name}
                  </div>
                </div>
              )}
              <div className="qc-evidence-overlay">
                <span>{attachment.name}</span>
              </div>
              {/* Click indicator */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(11, 18, 32, 0.9)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                color: '#FF7A18',
                fontWeight: 600,
                opacity: 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none'
              }}
              className="attachment-click-hint"
              >
                {url ? 'CLICK TO OPEN' : 'UNAVAILABLE'}
              </div>
            </a>
          );
        })}
      </div>

      <style>{`
        .qc-evidence-item:hover .attachment-click-hint {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}