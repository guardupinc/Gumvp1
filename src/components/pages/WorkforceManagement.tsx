import React, { useState } from 'react';
import { Plus, Search, Users, AlertCircle, Award, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';

interface Guard {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'on-shift' | 'off-duty';
  phone: string;
  email: string;
  licenseExpiry: string;
  certExpiry: string;
  lastShift: string;
  location: string;
  shiftsThisWeek: number;
  hoursThisWeek: number;
  imageUrl?: string;
}

const guards: Guard[] = [
  {
    id: 1,
    name: 'John Smith',
    role: 'Senior Guard',
    status: 'on-shift',
    phone: '(555) 123-4567',
    email: 'john.smith@example.com',
    licenseExpiry: 'Mar 15, 2025',
    certExpiry: 'Jun 20, 2025',
    lastShift: 'Today, 8:00 AM',
    location: 'Building A - Main Entrance',
    shiftsThisWeek: 5,
    hoursThisWeek: 40,
  },
  {
    id: 2,
    name: 'Maria Garcia',
    role: 'Guard',
    status: 'active',
    phone: '(555) 234-5678',
    email: 'maria.garcia@example.com',
    licenseExpiry: 'Jan 10, 2025',
    certExpiry: 'Feb 28, 2025',
    lastShift: 'Yesterday, 4:00 PM',
    location: 'Building B - Parking Lot',
    shiftsThisWeek: 4,
    hoursThisWeek: 32,
  },
  {
    id: 3,
    name: 'David Lee',
    role: 'Guard',
    status: 'on-shift',
    phone: '(555) 345-6789',
    email: 'david.lee@example.com',
    licenseExpiry: 'Aug 5, 2025',
    certExpiry: 'Sep 12, 2025',
    lastShift: 'Today, 4:00 PM',
    location: 'Building C - Lobby',
    shiftsThisWeek: 5,
    hoursThisWeek: 40,
  },
  {
    id: 4,
    name: 'Sarah Chen',
    role: 'Supervisor',
    status: 'active',
    phone: '(555) 456-7890',
    email: 'sarah.chen@example.com',
    licenseExpiry: 'Nov 30, 2025',
    certExpiry: 'Dec 15, 2025',
    lastShift: 'Today, 12:00 PM',
    location: 'Building A - Security Office',
    shiftsThisWeek: 5,
    hoursThisWeek: 40,
  },
  {
    id: 5,
    name: 'Robert Brown',
    role: 'Guard',
    status: 'off-duty',
    phone: '(555) 567-8901',
    email: 'robert.brown@example.com',
    licenseExpiry: 'Apr 22, 2025',
    certExpiry: 'May 10, 2025',
    lastShift: 'Dec 20, 8:00 AM',
    location: 'Building D - Loading Dock',
    shiftsThisWeek: 3,
    hoursThisWeek: 24,
  },
  {
    id: 6,
    name: 'Lisa Wang',
    role: 'Guard',
    status: 'on-shift',
    phone: '(555) 678-9012',
    email: 'lisa.wang@example.com',
    licenseExpiry: 'Feb 14, 2025',
    certExpiry: 'Mar 1, 2025',
    lastShift: 'Today, 12:00 AM',
    location: 'Building B - North Wing',
    shiftsThisWeek: 4,
    hoursThisWeek: 32,
  },
];

export function WorkforceManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);

  const getExpiryWarning = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  const filteredGuards = guards.filter((guard) =>
    guard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guard.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader
        title="Workforce Management"
        description="Manage your security team, track certifications, and review performance"
        primaryAction={{
          label: 'Add Guard',
          onClick: () => console.log('Add guard'),
          icon: <Plus size={16} />,
        }}
      />

      <div className="search-filter-bar">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search guards by name or role..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="guard-cards-grid">
        {filteredGuards.map((guard) => (
          <div key={guard.id} className="guard-card" onClick={() => setSelectedGuard(guard)}>
            {/* Card Header */}
            <div className="guard-card-header">
              <div className="guard-avatar">
                <Users size={24} />
              </div>
              <div className="guard-status-badge">
                <span className={`status-dot ${guard.status === 'on-shift' ? 'success' : guard.status === 'active' ? 'warning' : ''}`} />
                <span className="guard-status-text">{guard.status}</span>
              </div>
            </div>

            {/* Guard Info */}
            <div className="guard-card-info">
              <h3 className="guard-name">{guard.name}</h3>
              <p className="guard-role">{guard.role}</p>
            </div>

            {/* Contact Info */}
            <div className="guard-card-details">
              <div className="guard-detail-item">
                <Phone size={14} />
                <span>{guard.phone}</span>
              </div>
              <div className="guard-detail-item">
                <Mail size={14} />
                <span>{guard.email}</span>
              </div>
              <div className="guard-detail-item">
                <MapPin size={14} />
                <span>{guard.location}</span>
              </div>
            </div>

            {/* Expiry Warnings */}
            <div className="guard-card-expiry">
              <div className={`expiry-item ${getExpiryWarning(guard.licenseExpiry) ? 'warning' : ''}`}>
                <Award size={14} />
                <div className="expiry-info">
                  <span className="expiry-label">License</span>
                  <span className="expiry-date">{guard.licenseExpiry}</span>
                </div>
                {getExpiryWarning(guard.licenseExpiry) && <AlertCircle size={16} className="expiry-warning-icon" />}
              </div>
              <div className={`expiry-item ${getExpiryWarning(guard.certExpiry) ? 'warning' : ''}`}>
                <Award size={14} />
                <div className="expiry-info">
                  <span className="expiry-label">Certification</span>
                  <span className="expiry-date">{guard.certExpiry}</span>
                </div>
                {getExpiryWarning(guard.certExpiry) && <AlertCircle size={16} className="expiry-warning-icon" />}
              </div>
            </div>

            {/* Stats Footer */}
            <div className="guard-card-footer">
              <div className="guard-stat">
                <span className="guard-stat-value">{guard.shiftsThisWeek}</span>
                <span className="guard-stat-label">Shifts</span>
              </div>
              <div className="guard-stat">
                <span className="guard-stat-value">{guard.hoursThisWeek}</span>
                <span className="guard-stat-label">Hours</span>
              </div>
              <div className="guard-stat">
                <Calendar size={14} />
                <span className="guard-stat-label">{guard.lastShift}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* End of Shift Summary Section */}
      <Card className="shift-summary-card">
        <div className="card-header">
          <h3>End of Shift Summaries</h3>
          <button className="button-link">View All</button>
        </div>
        <div className="shift-summaries-list">
          <div className="shift-summary-item">
            <div className="summary-header">
              <div className="summary-guard">
                <Users size={16} />
                <span>John Smith</span>
              </div>
              <span className="summary-time">Today, 4:00 PM</span>
            </div>
            <p className="summary-text">
              Completed morning shift at Building A. All access points checked and secured. No incidents to report. Patrol logs submitted.
            </p>
            <div className="summary-tags">
              <span className="summary-tag">No Incidents</span>
              <span className="summary-tag">On Time</span>
            </div>
          </div>
          <div className="shift-summary-item">
            <div className="summary-header">
              <div className="summary-guard">
                <Users size={16} />
                <span>Maria Garcia</span>
              </div>
              <span className="summary-time">Yesterday, 12:00 AM</span>
            </div>
            <p className="summary-text">
              Night shift completed. Parking lot patrol conducted every 2 hours. Minor issue with gate B lock reported to maintenance.
            </p>
            <div className="summary-tags">
              <span className="summary-tag warning">Maintenance Alert</span>
              <span className="summary-tag">On Time</span>
            </div>
          </div>
          <div className="shift-summary-item">
            <div className="summary-header">
              <div className="summary-guard">
                <Users size={16} />
                <span>David Lee</span>
              </div>
              <span className="summary-time">Dec 21, 8:00 PM</span>
            </div>
            <p className="summary-text">
              Afternoon shift at Building C. Visitor logs updated. Security camera footage reviewed. All systems operational.
            </p>
            <div className="summary-tags">
              <span className="summary-tag">No Incidents</span>
              <span className="summary-tag">Systems OK</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
