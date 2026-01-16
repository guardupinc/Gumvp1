import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2 } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon';
  reportNumber: string;
  onSave: (file: File) => void;
}

export function FileUploadModal({ isOpen, onClose, reportType, reportNumber, onSave }: FileUploadModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getReportTypeLabel = () => {
    switch (reportType) {
      case 'incident':
        return 'Incident Report';
      case 'dar':
        return 'Daily Activity Report';
      case 'maintenance':
        return 'Maintenance Request';
      case 'disciplinary':
        return 'Disciplinary Action';
      case 'shift-passon':
        return 'Shift Pass-On Log';
      default:
        return 'Report';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Accept PDF, Word docs, images
      if (file.type === 'application/pdf' || 
          file.type === 'application/msword' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type.startsWith('image/')) {
        setUploadedFile(file);
      } else {
        alert('Please upload a PDF, Word document, or image file.');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleDeleteFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (uploadedFile) {
      onSave(uploadedFile);
      setUploadedFile(null);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <FileText size={24} style={{ color: '#3B82F6' }} />
            <div>
              <h2>Upload Document</h2>
              <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
                {getReportTypeLabel()} • {reportNumber}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Drag and Drop Zone */}
          <div
            className={`file-upload-dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploadedFile && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#3B82F6' : uploadedFile ? '#3BD16F' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '12px',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: uploadedFile ? 'default' : 'pointer',
              background: isDragging ? 'rgba(59, 130, 246, 0.05)' : uploadedFile ? 'rgba(59, 209, 111, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {!uploadedFile ? (
              <>
                <Upload size={48} style={{ color: isDragging ? '#3B82F6' : '#6B7280', margin: '0 auto 16px' }} />
                <p style={{ color: '#E5E7EB', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  {isDragging ? 'Drop your file here' : 'Drag & Drop your document here'}
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '16px' }}>
                  or click to browse files
                </p>
                <p style={{ color: '#6B7280', fontSize: '12px' }}>
                  Supports: PDF, Word (.doc, .docx), Images (JPG, PNG)
                </p>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <FileText size={32} style={{ color: '#3B82F6', flexShrink: 0 }} />
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#E5E7EB', fontSize: '14px', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {uploadedFile.name}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '12px' }}>
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile();
                  }}
                  style={{
                    padding: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#EF4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
            <p style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: '1.5' }}>
              <strong style={{ color: '#3B82F6' }}>Note:</strong> This document will be automatically classified as{' '}
              <strong style={{ color: '#E5E7EB' }}>{getReportTypeLabel()}</strong> and assigned report number{' '}
              <strong style={{ color: '#E5E7EB' }}>{reportNumber}</strong>.
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            className="button-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={handleSave}
            disabled={!uploadedFile}
            style={{ 
              flex: 1,
              opacity: uploadedFile ? 1 : 0.5,
              cursor: uploadedFile ? 'pointer' : 'not-allowed'
            }}
          >
            Save Document
          </button>
        </div>
      </div>
    </div>
  );
}