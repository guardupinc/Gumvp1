import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface AttachmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    url: string;
    name: string;
    type?: string;
    mimeType?: string;
    uploadedAt?: string;
    uploadedBy?: string;
  } | null;
}

export function AttachmentViewer({ isOpen, onClose, attachment }: AttachmentViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fitToScreen, setFitToScreen] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset zoom when attachment changes
  useEffect(() => {
    setZoomLevel(100);
    setFitToScreen(true);
  }, [attachment?.url]);

  if (!isOpen || !attachment) return null;

  // Determine file type from URL or mimeType
  const getFileType = (): 'image' | 'video' | 'pdf' | 'other' => {
    const mimeType = attachment.mimeType || attachment.type || '';
    const url = attachment.url.toLowerCase();

    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) {
      return 'image';
    }
    if (mimeType.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(url)) {
      return 'video';
    }
    if (mimeType === 'application/pdf' || url.endsWith('.pdf')) {
      return 'pdf';
    }
    return 'other';
  };

  const fileType = getFileType();

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
    setFitToScreen(false);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
    setFitToScreen(false);
  };

  const handleFitToScreen = () => {
    setFitToScreen(true);
    setZoomLevel(100);
  };

  const handleDownload = () => {
    // Open in new tab for download
    window.open(attachment.url, '_blank');
  };

  return (
    <div 
      className="attachment-viewer-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {/* Header Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0B1220',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10001
      }}>
        <div>
          <div style={{ 
            color: '#E2E8F0', 
            fontSize: '16px', 
            fontWeight: 600,
            marginBottom: '4px'
          }}>
            {attachment.name}
          </div>
          {attachment.uploadedBy && attachment.uploadedAt && (
            <div style={{ color: '#94A3B8', fontSize: '13px' }}>
              Uploaded by {attachment.uploadedBy} • {attachment.uploadedAt}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Zoom controls for images */}
          {fileType === 'image' && (
            <>
              <button
                onClick={handleZoomOut}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ color: '#94A3B8', fontSize: '13px', minWidth: '50px', textAlign: 'center' }}>
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={handleFitToScreen}
                style={{
                  backgroundColor: fitToScreen ? 'rgba(255, 122, 24, 0.15)' : 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: fitToScreen ? '#FF7A18' : '#E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
                title="Fit to Screen"
              >
                <Maximize2 size={16} />
                Fit
              </button>
            </>
          )}

          {/* Download/Open button */}
          <button
            onClick={handleDownload}
            style={{
              backgroundColor: 'rgba(59, 209, 111, 0.15)',
              border: '1px solid rgba(59, 209, 111, 0.3)',
              borderRadius: '6px',
              padding: '8px 16px',
              color: '#3BD16F',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <Download size={16} />
            Download
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '6px',
              padding: '8px',
              color: '#E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        marginTop: '80px',
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Image Viewer */}
        {fileType === 'image' && (
          <img
            src={attachment.url}
            alt={attachment.name}
            style={{
              maxWidth: fitToScreen ? '100%' : 'none',
              maxHeight: fitToScreen ? 'calc(100vh - 120px)' : 'none',
              width: fitToScreen ? 'auto' : `${zoomLevel}%`,
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}
          />
        )}

        {/* Video Viewer */}
        {fileType === 'video' && (
          <video
            src={attachment.url}
            controls
            autoPlay
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 120px)',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            Your browser does not support the video tag.
          </video>
        )}

        {/* PDF Viewer */}
        {fileType === 'pdf' && (
          <iframe
            src={attachment.url}
            title={attachment.name}
            style={{
              width: '90vw',
              height: 'calc(100vh - 120px)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              backgroundColor: '#FFFFFF'
            }}
          />
        )}

        {/* Unsupported File Type */}
        {fileType === 'other' && (
          <div style={{
            backgroundColor: '#1E293B',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Download size={36} color="#94A3B8" />
            </div>
            <div style={{
              color: '#E2E8F0',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              Preview Not Available
            </div>
            <div style={{
              color: '#94A3B8',
              fontSize: '14px',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              This file type cannot be previewed in the browser. Click the download button to view it on your device.
            </div>
            <button
              onClick={handleDownload}
              style={{
                backgroundColor: '#FF7A18',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={18} />
              Open File
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(11, 18, 32, 0.9)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        padding: '12px 20px',
        color: '#94A3B8',
        fontSize: '13px'
      }}>
        Press <kbd style={{ 
          backgroundColor: 'rgba(148, 163, 184, 0.2)', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>ESC</kbd> to close • Click outside to close
      </div>
    </div>
  );
}
