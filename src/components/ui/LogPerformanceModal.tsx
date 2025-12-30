import React, { useState, useEffect } from 'react';
import { X, CheckCircle, MinusCircle, AlertCircle } from 'lucide-react';

interface LogPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardName: string;
  onSave: (logData: {
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
    description: string;
    notifyGuard: boolean;
  }) => void;
  getCategoryLabel: (category: string) => string;
  editingLog?: {
    id: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
    description: string;
    notifyGuard: boolean;
  } | null;
}

type Sentiment = 'positive' | 'neutral' | 'negative';

export function LogPerformanceModal({ isOpen, onClose, guardName, onSave, editingLog }: LogPerformanceModalProps) {
  const [sentiment, setSentiment] = useState<Sentiment>(editingLog?.sentiment || 'neutral');
  const [category, setCategory] = useState(editingLog?.category || '');
  const [description, setDescription] = useState(editingLog?.description || '');
  const [notifyGuard, setNotifyGuard] = useState(editingLog?.notifyGuard || false);

  // Update form when editingLog changes
  useEffect(() => {
    if (editingLog) {
      setSentiment(editingLog.sentiment);
      setCategory(editingLog.category);
      setDescription(editingLog.description);
      setNotifyGuard(editingLog.notifyGuard);
    } else {
      setSentiment('neutral');
      setCategory('');
      setDescription('');
      setNotifyGuard(false);
    }
  }, [editingLog]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving performance log:', { sentiment, category, description, notifyGuard });
    onSave({ sentiment, category, description, notifyGuard });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="performance-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="performance-modal-header">
          <div>
            <h2 className="performance-modal-title">{editingLog ? 'Edit Performance Event' : 'Log Performance Event'}</h2>
            <p className="performance-modal-subtitle">
              {editingLog ? 'Editing' : 'Adding'} note for <span className="performance-modal-guard-name">{guardName}</span>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Sentiment Selector */}
        <div className="performance-modal-section">
          <div className="sentiment-selector">
            <button
              className={`sentiment-button positive ${sentiment === 'positive' ? 'active' : ''}`}
              onClick={() => setSentiment('positive')}
            >
              <CheckCircle size={18} />
              <span>Positive</span>
            </button>
            <button
              className={`sentiment-button neutral ${sentiment === 'neutral' ? 'active' : ''}`}
              onClick={() => setSentiment('neutral')}
            >
              <MinusCircle size={18} />
              <span>Neutral</span>
            </button>
            <button
              className={`sentiment-button negative ${sentiment === 'negative' ? 'active' : ''}`}
              onClick={() => setSentiment('negative')}
            >
              <AlertCircle size={18} />
              <span>Negative</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="performance-modal-section">
          <label className="performance-form-label">Category</label>
          <select
            className="performance-form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">General Note</option>
            <option value="attendance">Attendance</option>
            <option value="conduct">Conduct</option>
            <option value="performance">Performance</option>
            <option value="client-feedback">Client Feedback</option>
            <option value="training">Training</option>
            <option value="incident">Incident</option>
          </select>
        </div>

        <div className="performance-modal-section">
          <label className="performance-form-label">Description</label>
          <textarea
            className="performance-form-textarea"
            placeholder="Enter details about the event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Notification Option */}
        <div className="performance-modal-section">
          <label className="performance-checkbox-row">
            <input
              type="checkbox"
              className="performance-checkbox"
              checked={notifyGuard}
              onChange={(e) => setNotifyGuard(e.target.checked)}
            />
            <div className="performance-checkbox-label">
              <span className="performance-checkbox-text">Notify Guard via App</span>
              <span className="performance-checkbox-subtext">They will receive a push notification immediately.</span>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="performance-modal-footer">
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button-primary" onClick={handleSave}>
            Save Log
          </button>
        </div>
      </div>
    </div>
  );
}