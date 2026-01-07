import React, { useState } from 'react';
import { GuardDetailSlideOver } from '../../ui/GuardDetailSlideOver';
import { Users, Phone, Mail, Shield, Clock, AlertCircle } from 'lucide-react';

// John Smith's guard data - matching the format in WorkforceManagement
const johnSmithData = {
  id: 1,
  name: 'John Smith',
  badgeId: 'BADGE-1024',
  role: 'Senior Guard',
  status: 'on-shift' as const,
  phone: '(555) 123-4567',
  email: 'john.smith@example.com',
  licenseExpiry: 'Sep 15, 2025',
  certExpiry: 'Jun 20, 2025',
  lastShift: 'Today, 8:00 AM',
  location: 'Building A - Main Entrance',
  shiftsThisWeek: 5,
  hoursThisWeek: 38,
  roleClassification: 'Senior Guard - Armed',
  emergencyContact: 'Jane Smith',
  emergencyPhone: '(555) 123-4568',
  dateOfHire: 'Oct 12, 2021',
  primarySite: 'Building A',
  securityGuardCard: {
    expiryDate: '10/15/2025',
    status: 'valid' as const,
    daysUntilExpiry: 289
  }
};

// Initial shifts for John Smith
const johnSmithShifts = [
  {
    id: 1001,
    guardId: 1,
    site: 'Building A',
    date: '2026-01-05',
    startTime: '08:00',
    endTime: '16:00',
    instructions: 'Main entrance patrol, badge check procedures',
    status: 'in-progress' as const,
    hours: 8,
    createdBy: 'Sarah Admin',
    createdAt: '2026-01-01'
  },
  {
    id: 1002,
    guardId: 1,
    site: 'Building A',
    date: '2026-01-06',
    startTime: '08:00',
    endTime: '16:00',
    instructions: 'Main entrance patrol, badge check procedures',
    status: 'scheduled' as const,
    hours: 8,
    createdBy: 'Sarah Admin',
    createdAt: '2026-01-01'
  },
  {
    id: 1003,
    guardId: 1,
    site: 'Building C',
    date: '2026-01-08',
    startTime: '14:00',
    endTime: '22:00',
    instructions: 'Evening shift, parking lot surveillance',
    status: 'scheduled' as const,
    hours: 8,
    createdBy: 'Sarah Admin',
    createdAt: '2026-01-02'
  },
  {
    id: 1004,
    guardId: 1,
    site: 'Building A',
    date: '2026-01-10',
    startTime: '08:00',
    endTime: '16:00',
    instructions: 'Standard patrol route, incident reporting',
    status: 'scheduled' as const,
    hours: 8,
    createdBy: 'Sarah Admin',
    createdAt: '2026-01-02'
  },
  {
    id: 1005,
    guardId: 1,
    site: 'Building B',
    date: '2026-01-13',
    startTime: '06:00',
    endTime: '14:00',
    instructions: 'Morning shift, access control',
    status: 'scheduled' as const,
    hours: 8,
    createdBy: 'Sarah Admin',
    createdAt: '2026-01-03'
  }
];

// Initial documents for John Smith (matching GuardDetailSlideOver structure)
const johnSmithDocuments = {
  1: [
    {
      id: 1,
      name: 'Security Guard Card',
      category: 'legal' as const,
      uploadedDate: 'Dec 15, 2024',
      expiryDate: '10/15/2025',
      status: 'valid' as const,
      daysUntilExpiry: 289,
      fileUrl: '#',
      fileSize: '2.4 MB',
      required: true
    },
    {
      id: 2,
      name: 'Driver License',
      category: 'legal' as const,
      uploadedDate: 'Dec 10, 2024',
      expiryDate: '01/10/2026',
      status: 'valid' as const,
      daysUntilExpiry: 372,
      fileUrl: '#',
      fileSize: '1.8 MB',
      required: true
    },
    {
      id: 3,
      name: 'Passport / Work Visa',
      category: 'legal' as const,
      uploadedDate: 'Nov 20, 2024',
      expiryDate: '08/15/2028',
      status: 'valid' as const,
      daysUntilExpiry: 953,
      fileUrl: '#',
      fileSize: '3.2 MB',
      required: true
    },
    {
      id: 4,
      name: 'Firearm Permit',
      category: 'legal' as const,
      uploadedDate: 'Oct 5, 2024',
      expiryDate: '06/20/2025',
      status: 'expiring' as const,
      daysUntilExpiry: 167,
      fileUrl: '#',
      fileSize: '1.5 MB',
      required: true
    },
    {
      id: 5,
      name: 'CPR Certification',
      category: 'training' as const,
      uploadedDate: 'Sep 15, 2024',
      expiryDate: '02/28/2026',
      status: 'expiring' as const,
      daysUntilExpiry: 54,
      fileUrl: '#',
      fileSize: '890 KB',
      required: true
    },
    {
      id: 6,
      name: 'First Aid Certificate',
      category: 'training' as const,
      uploadedDate: 'Sep 15, 2024',
      expiryDate: '09/15/2026',
      status: 'valid' as const,
      daysUntilExpiry: 253,
      fileUrl: '#',
      fileSize: '1.1 MB',
      required: true
    },
    {
      id: 7,
      name: 'Background Check',
      category: 'legal' as const,
      uploadedDate: 'Oct 10, 2021',
      expiryDate: '',
      status: 'valid' as const,
      fileUrl: '#',
      fileSize: '2.8 MB',
      required: true
    },
    {
      id: 8,
      name: 'Employment Contract',
      category: 'employment' as const,
      uploadedDate: 'Oct 12, 2021',
      signedDate: 'Oct 12, 2021',
      status: 'valid' as const,
      fileUrl: '#',
      fileSize: '450 KB',
      required: true
    },
    {
      id: 9,
      name: 'W-4 Tax Form',
      category: 'employment' as const,
      uploadedDate: 'Oct 12, 2021',
      taxYear: '2021',
      status: 'valid' as const,
      fileUrl: '#',
      fileSize: '280 KB',
      required: true
    },
    {
      id: 10,
      name: 'I-9 Employment Eligibility',
      category: 'employment' as const,
      uploadedDate: 'Oct 12, 2021',
      submittedDate: 'Oct 12, 2021',
      status: 'valid' as const,
      fileUrl: '#',
      fileSize: '340 KB',
      required: true
    }
  ]
};

export function MyGuardCard() {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [guardData, setGuardData] = useState(johnSmithData);
  const [shifts, setShifts] = useState(johnSmithShifts);
  const [documents, setDocuments] = useState(johnSmithDocuments);

  const getSecurityCardWarning = (card?: { status: string; daysUntilExpiry: number }): boolean => {
    if (!card) return false;
    return card.status === 'expiring' || card.status === 'expired' || card.daysUntilExpiry <= 30;
  };

  // Get Security Guard Card from documents
  const getSecurityGuardCard = () => {
    const guardDocs = documents[1];
    if (!guardDocs) return null;
    
    const securityCard = guardDocs.find(doc => doc.name === 'Security Guard Card');
    return securityCard;
  };

  const securityCard = getSecurityGuardCard();

  return (
    <div className="page-container">
      {/* Display the guard card exactly as it appears in Workforce Management */}
      <div className="guard-cards-grid" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div 
          className="guard-card" 
          onClick={() => setIsSlideOverOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          {/* Card Header */}
          <div className="guard-card-header">
            <div className="guard-avatar">
              <Users size={24} />
            </div>
            <div className="guard-status-badge">
              <span className="status-dot success" />
              <span className="guard-status-text">On-Shift</span>
            </div>
          </div>

          {/* Guard Info */}
          <div className="guard-card-info">
            <h3 className="guard-name">{guardData.name}</h3>
            <p className="guard-badge-id">{guardData.badgeId}</p>
            <p className="guard-role">{guardData.roleClassification}</p>
          </div>

          {/* Contact Info */}
          <div className="guard-card-details">
            <div className="guard-detail-item">
              <Phone size={14} />
              <span>{guardData.phone}</span>
            </div>
            <div className="guard-detail-item">
              <Mail size={14} />
              <span>{guardData.email}</span>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="guard-card-actions" style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            marginBottom: '12px'
          }}>
            <a 
              href={`tel:${guardData.phone}`} 
              className="icon-button-outline" 
              title="Call"
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Phone size={16} />
              <span>Call</span>
            </a>
            <a 
              href={`mailto:${guardData.email}`} 
              className="icon-button-outline" 
              title="Email"
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Mail size={16} />
              <span>Email</span>
            </a>
          </div>

          {/* Expiry Warnings */}
          <div className="guard-card-expiry">
            <div className={`expiry-item ${securityCard && getSecurityCardWarning(securityCard) ? 'warning' : ''}`}>
              <Shield size={14} />
              <div className="expiry-info">
                <span className="expiry-label">Security Guard Card</span>
                <span className="expiry-date">
                  {securityCard && securityCard.daysUntilExpiry !== undefined
                    ? `Expires in ${securityCard.daysUntilExpiry} days`
                    : 'Not set'}
                </span>
              </div>
              {securityCard && getSecurityCardWarning(securityCard) && <AlertCircle size={16} className="expiry-warning-icon" />}
            </div>
            <div className="expiry-item">
              <Clock size={14} />
              <div className="expiry-info">
                <span className="expiry-label">Weekly Utilization</span>
                <span 
                  className="expiry-date" 
                  style={{ 
                    color: guardData.role === 'Senior Guard' && guardData.hoursThisWeek >= 35 ? '#FF7A18' : '#3BD16F' 
                  }}
                >
                  {guardData.hoursThisWeek} / 40 Hrs
                </span>
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="guard-card-footer">
            <div className="guard-stat">
              <span className="guard-stat-value">{guardData.shiftsThisWeek}</span>
              <span className="guard-stat-label">Shifts</span>
            </div>
            <div className="guard-stat">
              <span className="guard-stat-value">{guardData.hoursThisWeek}</span>
              <span className="guard-stat-label">Hours</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '24px', 
        color: 'var(--text-muted)',
        fontSize: '14px'
      }}>
        Click your card to view full details, schedules, documents, and performance metrics
      </div>

      {/* Guard Detail Slide Over - Same as Admin Portal */}
      <GuardDetailSlideOver
        guard={isSlideOverOpen ? guardData : null}
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        shifts={shifts}
        onShiftsUpdate={setShifts}
        onUpdate={(updatedGuard) => {
          setGuardData(updatedGuard);
        }}
        documents={documents}
        onDocumentsUpdate={setDocuments}
      />
    </div>
  );
}
