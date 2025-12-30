import React, { useState } from 'react';
import { X, Shield, Mail, Phone, Upload, User } from 'lucide-react';

interface AddNewGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guardData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    badgeId: string;
    role: string;
    guardCardNumber: string;
    expiryDate: string;
    imageUrl?: string;
  }) => void;
}

export function AddNewGuardModal({ isOpen, onClose, onSave }: AddNewGuardModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    badgeId: 'G-1029',
    role: 'Security Guard',
    guardCardNumber: '',
    expiryDate: ''
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSave({ ...formData, imageUrl: photoPreview });
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      badgeId: 'G-1029',
      role: 'Security Guard',
      guardCardNumber: '',
      expiryDate: ''
    });
    setPhotoPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="add-guard-modal-overlay" onClick={handleClose} />

      {/* Modal */}
      <div className="add-guard-modal">
        {/* Header */}
        <div className="add-guard-modal-header">
          <div className="add-guard-modal-title-section">
            <div className="add-guard-modal-icon">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="add-guard-modal-title">Add New Security Guard</h2>
              <p className="add-guard-modal-subtitle">Enter details to send invite.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="add-guard-modal-content">
          {/* Photo Upload */}
          <div className="add-guard-photo-upload">
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              className="add-guard-photo-input"
              onChange={handlePhotoUpload}
            />
            <label htmlFor="photo-upload" className="add-guard-photo-label">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="add-guard-photo-preview" />
              ) : (
                <>
                  <User size={32} className="add-guard-photo-icon" />
                  <span className="add-guard-photo-text">Upload Photo</span>
                </>
              )}
            </label>
          </div>

          {/* Row 1: First Name | Last Name */}
          <div className="add-guard-form-row">
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">First Name</label>
              <input
                type="text"
                className="add-guard-form-input"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">Last Name</label>
              <input
                type="text"
                className="add-guard-form-input"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          {/* Row 2: Email | Phone */}
          <div className="add-guard-form-row">
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">Email</label>
              <div className="add-guard-input-with-icon">
                <Mail size={18} className="add-guard-input-icon" />
                <input
                  type="email"
                  className="add-guard-form-input add-guard-input-with-icon-input"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">Phone</label>
              <div className="add-guard-input-with-icon">
                <Phone size={18} className="add-guard-input-icon" />
                <input
                  type="tel"
                  className="add-guard-form-input add-guard-input-with-icon-input"
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Badge ID | Role */}
          <div className="add-guard-form-row">
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">Badge ID</label>
              <input
                type="text"
                className="add-guard-form-input add-guard-badge-input"
                value={formData.badgeId}
                onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })}
              />
            </div>
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">Role</label>
              <select
                className="add-guard-form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Security Guard">Security Guard</option>
                <option value="Senior Guard">Senior Guard</option>
                <option value="Lead Guard">Lead Guard</option>
                <option value="Supervisor">Supervisor</option>
              </select>
            </div>
          </div>

          {/* Section Divider */}
          <div className="add-guard-section-divider">
            <span className="add-guard-section-title">License Details</span>
          </div>

          {/* Row 4: Guard Card Number | Expiry Date */}
          <div className="add-guard-form-row">
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">Guard Card Number</label>
              <input
                type="text"
                className="add-guard-form-input"
                placeholder="Enter card number"
                value={formData.guardCardNumber}
                onChange={(e) => setFormData({ ...formData, guardCardNumber: e.target.value })}
              />
            </div>
            <div className="add-guard-form-field">
              <label className="add-guard-form-label">Expiry Date</label>
              <input
                type="date"
                className="add-guard-form-input"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="add-guard-modal-footer">
          <button className="add-guard-btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button className="add-guard-btn-submit" onClick={handleSubmit}>
            Create & Invite
          </button>
        </div>
      </div>
    </>
  );
}