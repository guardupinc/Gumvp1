import React, { useState, useEffect } from 'react';
import { X, Hash, Calendar, UploadCloud, Tag } from 'lucide-react';

interface ManualLicenseEntryModalProps {
  isOpen: boolean;
  guardName: string;
  onClose: () => void;
  onSave: (licenseData: {
    type: string;
    number: string;
    expiry: string;
  }) => void;
  editingLicense?: {
    id: number;
    type: string;
    number: string;
    expiry: string;
  } | null;
}

export function ManualLicenseEntryModal({ isOpen, guardName, onClose, onSave, editingLicense }: ManualLicenseEntryModalProps) {
  const [licenseData, setLicenseData] = useState({
    type: '',
    number: '',
    expiry: ''
  });

  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingLicense) {
      setLicenseData({
        type: editingLicense.type,
        number: editingLicense.number,
        expiry: editingLicense.expiry
      });
      // Skip upload step when editing
      setUploadedFile('existing');
    } else {
      // Reset form for new license
      setLicenseData({
        type: '',
        number: '',
        expiry: ''
      });
      setUploadedFile(null);
    }
  }, [editingLicense, isOpen]);

  const handleSave = () => {
    onSave(licenseData);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangeFile = () => {
    setUploadedFile(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="manual-license-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="manual-license-modal">
        {/* Header - Full Width */}
        <div className="manual-license-header">
          <h3 className="manual-license-title">
            {editingLicense ? `Edit License for ${guardName}` : `Add License for ${guardName}`}
          </h3>
          <button className="manual-license-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Main Content - Conditional Rendering */}
        {!uploadedFile ? (
          // Upload View - Full Width
          <div className="manual-license-upload-view">
            <input
              type="file"
              id="license-file-input"
              className="hidden-file-input"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />
            <label
              htmlFor="license-file-input"
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-dropzone-content">
                <UploadCloud size={32} className="upload-icon" />
                <p className="upload-text">Click to upload or drag & drop</p>
                <p className="upload-subtext">PDF, JPG, PNG (Max 5MB)</p>
              </div>
            </label>
          </div>
        ) : (
          // 50/50 Split View - After Upload
          <div className="manual-license-content">
            {/* Left Pane - Document Viewer */}
            <div className="manual-license-viewer">
              <div className="license-preview-container">
                <img 
                  src={uploadedFile}
                  alt="Security Guard License"
                  className="license-preview-image"
                />
              </div>
              
              {/* Change File Button */}
              <button className="change-file-button" onClick={handleChangeFile}>
                Change File
              </button>
            </div>

            {/* Vertical Divider */}
            <div className="manual-license-divider"></div>

            {/* Right Pane - Data Entry */}
            <div className="manual-license-form">
              {/* License Type Field */}
              <div className="manual-form-group">
                <label className="manual-form-label">LICENSE TYPE</label>
                <div className="manual-form-input-wrapper">
                  <Tag size={18} className="manual-form-icon" />
                  <input
                    type="text"
                    className="manual-form-input"
                    placeholder="e.g., Security Guard Card"
                    value={licenseData.type}
                    onChange={(e) => setLicenseData({ ...licenseData, type: e.target.value })}
                  />
                </div>
              </div>

              {/* License Number Field */}
              <div className="manual-form-group">
                <label className="manual-form-label">LICENSE NUMBER</label>
                <div className="manual-form-input-wrapper">
                  <Hash size={18} className="manual-form-icon" />
                  <input
                    type="text"
                    className="manual-form-input"
                    value={licenseData.number}
                    onChange={(e) => setLicenseData({ ...licenseData, number: e.target.value })}
                  />
                </div>
              </div>

              {/* Expiration Date Field */}
              <div className="manual-form-group">
                <label className="manual-form-label">EXPIRATION DATE</label>
                <div className="manual-form-input-wrapper">
                  <Calendar size={18} className="manual-form-icon" />
                  <input
                    type="text"
                    className="manual-form-input"
                    placeholder="MM/DD/YYYY"
                    value={licenseData.expiry}
                    onChange={(e) => setLicenseData({ ...licenseData, expiry: e.target.value })}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="manual-form-actions">
                <button className="manual-save-button" onClick={handleSave}>
                  Save License
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}