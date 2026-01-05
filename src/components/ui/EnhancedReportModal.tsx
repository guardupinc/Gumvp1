import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface ReportMode {
  type: 'maintenance' | 'incident' | 'dar' | 'disciplinary' | 'shift-passon';
  title: string;
  reportIdPrefix: string;
  themeColor: string;
  recipientRole: string;
  narrativeLabel: string;
  submitButtonText: string;
  icon: string;
}

interface EnhancedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ReportMode;
  officerName: string;
  onSubmit: (data: {
    reportId: string;
    title: string;
    content: string;
    site: string;
    priority: 'normal' | 'high';
    themeColor: string;
    recipientRole: string;
  }) => void;
}

export function EnhancedReportModal({ isOpen, onClose, mode, officerName, onSubmit }: EnhancedReportModalProps) {
  // Row 1: Time Log
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  
  // Row 2: Classification
  const [incidentCategory, setIncidentCategory] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'critical'>('normal');
  
  // Row 3: Narrative
  const [detailedNarrative, setDetailedNarrative] = useState('');
  
  // Row 4: Police & Parties
  const [policeCalled, setPoliceCalled] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');

  // Generate auto-incrementing report ID
  const [reportId, setReportId] = useState('');

  useEffect(() => {
    if (isOpen && mode) {
      // Generate unique report ID based on mode
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 900) + 100;
      setReportId(`${mode.reportIdPrefix}-${year}-${randomNum}`);
      
      // Auto-fill incident date/time with current date/time
      if (mode.type === 'incident') {
        const now = new Date();
        setIncidentDate(now.toISOString().split('T')[0]); // YYYY-MM-DD
        setIncidentTime(now.toTimeString().slice(0, 5)); // HH:MM
      }
    }
  }, [isOpen, mode]);

  if (!isOpen || !mode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDate || !incidentTime || !incidentCategory || !detailedNarrative) {
      return;
    }
    onSubmit({
      reportId,
      title: mode.title,
      content: detailedNarrative,
      site: 'N/A', // Not collected in this simplified form
      priority: urgency === 'critical' ? 'high' : urgency,
      themeColor: mode.themeColor,
      recipientRole: mode.recipientRole,
    });
    // Reset form
    setIncidentDate('');
    setIncidentTime('');
    setIncidentCategory('');
    setUrgency('normal');
    setDetailedNarrative('');
    setPoliceCalled(false);
    setCaseNumber('');
    onClose();
  };

  // Only render incident form for incident type
  if (mode.type !== 'incident') {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="incident-report-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="incident-modal-header">
          <div className="modal-title-section">
            <div className="report-badge-incident">
              <span className="badge-icon">{mode.icon}</span>
              <span className="badge-text">{mode.title}</span>
              <span className="badge-id">{reportId}</span>
            </div>
            <p className="modal-subtitle-incident">
              Officer: <span>{officerName}</span>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="incident-modal-body">
          {/* ROW 1: Time Log */}
          <div className="form-row-split">
            <div className="form-field">
              <label htmlFor="incident-date" className="form-label">
                <Calendar size={16} className="label-icon" />
                Date of Incident
              </label>
              <input
                type="date"
                id="incident-date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="date-input"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="incident-time" className="form-label">
                <Clock size={16} className="label-icon" />
                Time of Incident
              </label>
              <input
                type="time"
                id="incident-time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="time-input"
                required
              />
            </div>
          </div>

          {/* ROW 2: Classification */}
          <div className="form-row-split">
            <div className="form-field">
              <label htmlFor="incident-category" className="form-label">
                Incident Category
              </label>
              <select
                id="incident-category"
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value)}
                className="category-dropdown"
                required
              >
                <option value="">Select Type...</option>
                <option value="theft">Theft</option>
                <option value="trespassing">Trespassing</option>
                <option value="vandalism">Vandalism</option>
                <option value="medical-emergency">Medical Emergency</option>
                <option value="fire-alarm">Fire Alarm</option>
                <option value="assault">Assault</option>
                <option value="noise-complaint">Noise Complaint</option>
                <option value="suspicious-activity">Suspicious Activity</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Urgency</label>
              <div className="urgency-segmented-control">
                <button
                  type="button"
                  className={`urgency-option ${urgency === 'normal' ? 'active' : ''}`}
                  onClick={() => setUrgency('normal')}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={`urgency-option urgency-high ${urgency === 'high' ? 'active' : ''}`}
                  onClick={() => setUrgency('high')}
                >
                  High
                </button>
                <button
                  type="button"
                  className={`urgency-option urgency-critical ${urgency === 'critical' ? 'active' : ''}`}
                  onClick={() => setUrgency('critical')}
                >
                  <AlertTriangle size={16} />
                  Critical
                </button>
              </div>
            </div>
          </div>

          {/* ROW 3: The Narrative */}
          <div className="form-field">
            <label htmlFor="detailed-narrative" className="form-label">
              Detailed Narrative
            </label>
            <textarea
              id="detailed-narrative"
              value={detailedNarrative}
              onChange={(e) => setDetailedNarrative(e.target.value)}
              placeholder="Who, what, where, when..."
              className="narrative-textarea"
              rows={10}
              required
            />
          </div>

          {/* ROW 4: Police & Parties */}
          <div className="authorities-section">
            <h3 className="section-header">Authorities & Witnesses</h3>
            
            <div className="police-toggle-row">
              <label className="toggle-label">Police Called?</label>
              <div className="toggle-switch-container">
                <button
                  type="button"
                  className={`toggle-switch ${policeCalled ? 'active' : ''}`}
                  onClick={() => setPoliceCalled(!policeCalled)}
                >
                  <div className="toggle-slider"></div>
                  <span className="toggle-text">{policeCalled ? 'Yes' : 'No'}</span>
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="case-number" className="form-label">
                Case Number / Officer Name
              </label>
              <input
                type="text"
                id="case-number"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g., Case #2026-001234 or Officer Badge #5678"
                className="case-input"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions-incident">
            <button type="button" className="button-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="button-submit-incident"
            >
              {mode.submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
