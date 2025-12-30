import React, { useState, useEffect } from 'react';
import { X, Upload, File, AlertCircle } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (documentData: {
    name: string;
    category: 'legal' | 'training' | 'employment';
    expiryDate?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    signedDate?: string;
    taxYear?: string;
    submittedDate?: string;
  }) => void;
  editingDocument?: {
    id: number;
    name: string;
    category: 'legal' | 'training' | 'employment';
    expiryDate?: string;
    fileUrl?: string;
    signedDate?: string;
    taxYear?: string;
    submittedDate?: string;
  } | null;
}

export function DocumentModal({ isOpen, onClose, onSave, editingDocument }: DocumentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'legal' as 'legal' | 'training' | 'employment',
    expiryDate: '',
    hasExpiry: false,
    signedDate: '',
    taxYear: '',
    submittedDate: ''
  });

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    url: string;
  } | null>(null);

  const [dragActive, setDragActive] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (editingDocument) {
      setFormData({
        name: editingDocument.name,
        category: editingDocument.category,
        expiryDate: editingDocument.expiryDate || '',
        hasExpiry: !!editingDocument.expiryDate,
        signedDate: editingDocument.signedDate || '',
        taxYear: editingDocument.taxYear || '',
        submittedDate: editingDocument.submittedDate || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'legal',
        expiryDate: '',
        hasExpiry: false,
        signedDate: '',
        taxYear: '',
        submittedDate: ''
      });
      setUploadedFile(null);
    }
  }, [editingDocument, isOpen]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Create a fake URL for demo purposes
    const reader = new FileReader();
    reader.onloadend = () => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFile({
        name: file.name,
        size: `${sizeInMB} MB`,
        url: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!formData.name) return;

    onSave({
      name: formData.name,
      category: formData.category,
      expiryDate: formData.hasExpiry ? formData.expiryDate : undefined,
      fileUrl: uploadedFile?.url,
      fileName: uploadedFile?.name,
      fileSize: uploadedFile?.size,
      signedDate: formData.signedDate,
      taxYear: formData.taxYear,
      submittedDate: formData.submittedDate
    });

    // Reset form
    setFormData({
      name: '',
      category: 'legal',
      expiryDate: '',
      hasExpiry: false,
      signedDate: '',
      taxYear: '',
      submittedDate: ''
    });
    setUploadedFile(null);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      category: 'legal',
      expiryDate: '',
      hasExpiry: false,
      signedDate: '',
      taxYear: '',
      submittedDate: ''
    });
    setUploadedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={handleCancel} />

      {/* Modal */}
      <div className="modal-container" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {editingDocument ? 'Edit Document' : 'Add Document'}
          </h2>
          <button className="modal-close-button" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Document Name */}
          <div className="form-field">
            <label className="form-label">
              Document Name <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Security Guard License"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="form-field">
            <label className="form-label">
              Category <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as 'legal' | 'training' | 'employment' })}
            >
              <option value="legal">Legal & Identity</option>
              <option value="training">Training & Certifications</option>
              <option value="employment">Employment Documents</option>
            </select>
          </div>

          {/* Has Expiry Checkbox */}
          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.hasExpiry}
                onChange={(e) => setFormData({ ...formData, hasExpiry: e.target.checked, expiryDate: '' })}
                style={{ marginRight: '8px' }}
              />
              This document has an expiry date
            </label>
          </div>

          {/* Expiry Date (conditional) */}
          {formData.hasExpiry && (
            <div className="form-field">
              <label className="form-label">
                Expiry Date <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          )}

          {/* Employment Document Specific Fields */}
          {formData.name === 'Signed Offer Letter' && (
            <div className="form-field">
              <label className="form-label">
                Signed Date
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.signedDate}
                onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
              />
            </div>
          )}

          {formData.name === 'W-4 Tax Form' && (
            <div className="form-field">
              <label className="form-label">
                Tax Year
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., 2024"
                value={formData.taxYear}
                onChange={(e) => setFormData({ ...formData, taxYear: e.target.value })}
              />
            </div>
          )}

          {formData.name === 'Direct Deposit Authorization' && (
            <div className="form-field">
              <label className="form-label">
                Submitted Date
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.submittedDate}
                onChange={(e) => setFormData({ ...formData, submittedDate: e.target.value })}
              />
            </div>
          )}

          {/* File Upload */}
          <div className="form-field">
            <label className="form-label">Upload File</label>
            <div
              className={`upload-dropzone ${dragActive ? 'dragging' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('document-file-upload')?.click()}
              style={{ 
                minHeight: '160px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <input
                type="file"
                id="document-file-upload"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="upload-dropzone-content">
                {uploadedFile ? (
                  <>
                    <File size={32} style={{ color: '#3BD16F' }} />
                    <p style={{ color: '#F1F5F9', margin: '8px 0 4px' }}>{uploadedFile.name}</p>
                    <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>{uploadedFile.size}</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} style={{ color: '#64748B' }} />
                    <p style={{ color: '#F1F5F9', margin: '8px 0 4px' }}>
                      {dragActive ? 'Drop file here' : 'Click to upload or drag & drop'}
                    </p>
                    <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
                      PDF, JPG, PNG (Max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
            {!editingDocument && !uploadedFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <AlertCircle size={14} style={{ color: '#64748B' }} />
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  File upload is optional for new documents
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="button-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="button-primary" 
            onClick={handleSubmit}
            disabled={!formData.name || (formData.hasExpiry && !formData.expiryDate)}
          >
            {editingDocument ? 'Save Changes' : 'Add Document'}
          </button>
        </div>
      </div>
    </>
  );
}