import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, User } from 'lucide-react';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (shiftData: ShiftFormData) => void;
  prefilledDate?: Date;
  prefilledTimeSlot?: string;
}

export interface ShiftFormData {
  guardName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export function AddShiftModal({ isOpen, onClose, onSubmit, prefilledDate, prefilledTimeSlot }: AddShiftModalProps) {
  const [formData, setFormData] = useState<ShiftFormData>({
    guardName: '',
    location: '',
    date: prefilledDate ? prefilledDate.toISOString().split('T')[0] : '',
    startTime: prefilledTimeSlot === 'morning' ? '08:00' : prefilledTimeSlot === 'day' ? '16:00' : prefilledTimeSlot === 'night' ? '00:00' : '',
    endTime: prefilledTimeSlot === 'morning' ? '16:00' : prefilledTimeSlot === 'day' ? '00:00' : prefilledTimeSlot === 'night' ? '08:00' : '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    // Reset form
    setFormData({
      guardName: '',
      location: '',
      date: '',
      startTime: '',
      endTime: '',
      notes: '',
    });
  };

  const handleChange = (field: keyof ShiftFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-header">
          <h2>Add New Shift</h2>
          <button className="modal-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Guard Name
              </label>
              <select
                className="form-input"
                value={formData.guardName}
                onChange={(e) => handleChange('guardName', e.target.value)}
                required
              >
                <option value="">Select a guard</option>
                <option value="John Smith">John Smith</option>
                <option value="Maria Garcia">Maria Garcia</option>
                <option value="David Lee">David Lee</option>
                <option value="Lisa Wang">Lisa Wang</option>
                <option value="Robert Brown">Robert Brown</option>
                <option value="Mike Johnson">Mike Johnson</option>
                <option value="Sarah Chen">Sarah Chen</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} />
                Location
              </label>
              <select
                className="form-input"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
              >
                <option value="">Select a location</option>
                <option value="Building A">Building A</option>
                <option value="Building B">Building B</option>
                <option value="Building C">Building C</option>
                <option value="Building D">Building D</option>
                <option value="Building E">Building E</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                Date
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                Start Time
              </label>
              <input
                type="time"
                className="form-input"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                End Time
              </label>
              <input
                type="time"
                className="form-input"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any additional notes about this shift..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary">
              Add Shift
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
