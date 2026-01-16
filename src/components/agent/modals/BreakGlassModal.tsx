import React, { useState } from 'react';
import { X, Lock, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { GUCombobox } from '../../ui/GUCombobox';

interface BreakGlassModalProps {
  onClose: () => void;
  onActivate: (tenant: string, reason: string, duration: number) => void;
}

export function BreakGlassModal({ onClose, onActivate }: BreakGlassModalProps) {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenantOptions = [
    { value: 'acme', label: 'Acme Corporation' },
    { value: 'secureguard', label: 'SecureGuard LLC' },
    { value: 'metro', label: 'Metro Security' },
    { value: 'downtown', label: 'Downtown Security Inc.' },
    { value: 'elite', label: 'Elite Protection' },
    { value: 'nightwatch', label: 'Nightwatch Services' },
  ];

  const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
  ];

  const handleSubmit = () => {
    if (!selectedTenant || !reason.trim()) {
      toast.error('Please select a tenant and provide a reason');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API request to log the break-glass access
    setTimeout(() => {
      const tenantName = tenantOptions.find(t => t.value === selectedTenant)?.label || selectedTenant;
      onActivate(tenantName, reason, parseInt(duration));
      toast.success(`Break-glass access activated for ${duration} minutes`, {
        description: `Access to ${tenantName} granted. Auto-expires at ${new Date(Date.now() + parseInt(duration) * 60000).toLocaleTimeString()}`
      });
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              padding: '8px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={20} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <h2 style={{ marginBottom: '4px' }}>Break-glass Access</h2>
              <p className="text-muted" style={{ fontSize: '13px' }}>Activate emergency tenant access</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Warning Banner */}
          <div style={{
            padding: '12px',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px'
          }}>
            <AlertTriangle size={20} style={{ color: '#FBBF24', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ Security Notice</strong>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                <li>Access auto-expires after selected duration</li>
                <li>All actions are logged to audit trail</li>
                <li>Tenant will be notified of access</li>
                <li>Reason will be included in security reports</li>
              </ul>
            </div>
          </div>

          {/* Select Tenant */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <GUCombobox
              label="Select Tenant"
              value={selectedTenant}
              onChange={setSelectedTenant}
              options={tenantOptions}
              placeholder="Choose a tenant..."
              searchPlaceholder="Search tenants..."
              required
            />
          </div>

          {/* Duration */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Clock size={14} />
              Access Duration <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="flex gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={duration === opt.value ? 'button-primary' : 'button-secondary'}
                  style={{ 
                    flex: 1, 
                    fontSize: '13px',
                    padding: '8px 12px',
                    opacity: duration === opt.value ? 1 : 0.7
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Access Reason */}
          <div className="form-group">
            <label className="form-label">
              Access Reason <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              className="form-input"
              placeholder="Describe why emergency access is required (e.g., 'Customer-reported critical data issue requiring immediate investigation')"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
              Provide a detailed explanation for the audit trail and compliance reporting
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button 
            className="button-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="button-danger"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedTenant || !reason.trim()}
          >
            {isSubmitting ? 'Activating...' : 'Activate Break-glass Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
