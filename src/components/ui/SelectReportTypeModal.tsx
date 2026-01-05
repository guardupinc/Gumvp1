import React from 'react';
import { X, AlertTriangle, ClipboardList, Wrench, UserX, FileSignature } from 'lucide-react';

interface SelectReportTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon') => void;
}

export function SelectReportTypeModal({ isOpen, onClose, onSelectType }: SelectReportTypeModalProps) {
  if (!isOpen) return null;

  const handleCardClick = (type: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon') => {
    onSelectType(type);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="select-report-type-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Report Type</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Section 1: Client-Facing Reports */}
          <div className="report-type-section">
            <h3 className="section-header">📋 Client-Facing Reports</h3>
            <p className="section-subtext">Reports the client will eventually see</p>
            
            <div className="report-type-cards">
              <button 
                className="report-type-card report-type-incident"
                onClick={() => handleCardClick('incident')}
              >
                <div className="report-card-icon">
                  <AlertTriangle size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Incident Report (IR)</h4>
                  <p>For thefts, accidents, or security breaches.</p>
                </div>
              </button>

              <button 
                className="report-type-card report-type-dar"
                onClick={() => handleCardClick('dar')}
              >
                <div className="report-card-icon">
                  <ClipboardList size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Daily Activity (DAR)</h4>
                  <p>Routine patrols and shift logs.</p>
                </div>
              </button>

              <button 
                className="report-type-card report-type-maintenance"
                onClick={() => handleCardClick('maintenance')}
              >
                <div className="report-card-icon">
                  <Wrench size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Maintenance Request</h4>
                  <p>Report broken equipment or site hazards.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Internal Operations */}
          <div className="report-type-section">
            <h3 className="section-header">🔒 Internal Operations</h3>
            <p className="section-subtext">Private reports for company use only</p>
            
            <div className="report-type-cards">
              <button 
                className="report-type-card report-type-disciplinary"
                onClick={() => handleCardClick('disciplinary')}
              >
                <div className="report-card-icon">
                  <UserX size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Disciplinary Form</h4>
                  <p>Staff performance or policy violations (Private).</p>
                </div>
              </button>

              <button 
                className="report-type-card report-type-shift"
                onClick={() => handleCardClick('shift-passon')}
              >
                <div className="report-card-icon">
                  <FileSignature size={24} />
                </div>
                <div className="report-card-content">
                  <h4>Shift Pass-On Log</h4>
                  <p>Notes for the next shift supervisor (Private).</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
