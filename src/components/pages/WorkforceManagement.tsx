import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, AlertCircle, Award, MapPin, Phone, Mail, Calendar, Clock, Shield } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { GuardDetailSlideOver } from '../ui/GuardDetailSlideOver';
import { AddNewGuardModal } from '../ui/AddNewGuardModal';
import { useAppState } from '../../contexts/AppStateContext';
import { useGuards } from '../../contexts/GuardsContext';
import { Guard } from '../../utils/guardsData';
import { toast } from 'sonner@2.0.3';

interface Shift {
  id: number;
  guardId: number;
  site: string;
  date: string;
  startTime: string;
  endTime: string;
  instructions: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  hours: number;
  createdBy: string;
  createdAt: string;
}

interface WorkforceManagementProps {
  autoOpenModal?: 'add-guard';
  onModalOpened?: () => void;
}

export function WorkforceManagement({ autoOpenModal, onModalOpened }: WorkforceManagementProps = {}) {
  // Access global state
  const { isGuardOnShift } = useAppState();
  const { guards: guardsList, addGuard, updateGuard } = useGuards();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [isAddNewGuardModalOpen, setAddNewGuardModalOpen] = useState(false);
  
  // Initialize shifts for all guards
  const [allShifts, setAllShifts] = useState<Shift[]>([]);

  // Store all guard documents - will be managed by GuardDetailSlideOver
  const [allGuardDocuments, setAllGuardDocuments] = useState<Record<number, Array<{
    id: number;
    name: string;
    category: 'legal' | 'training' | 'employment';
    uploadedDate: string;
    expiryDate?: string;
    status: 'valid' | 'expiring' | 'missing';
    daysUntilExpiry?: number;
    fileUrl?: string;
    fileSize?: string;
    required: boolean;
  }>>>({}); 

  // Helper function to get current week start and end dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to subtract to get to Monday (start of week)
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  const isDateInCurrentWeek = (dateStr: string): boolean => {
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day);
    const { weekStart, weekEnd } = getCurrentWeekDates();
    
    date.setHours(0, 0, 0, 0);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    return date >= weekStart && date <= weekEnd;
  };

  const getExpiryWarning = (expiryDate: string): boolean => {
    // Parse the date string manually to avoid timezone issues
    const months: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Parse date in format "MMM DD, YYYY" (e.g., "Sep 15, 2025")
    const parts = expiryDate.split(' ');
    const month = months[parts[0]];
    const day = parseInt(parts[1].replace(',', ''));
    const year = parseInt(parts[2]);
    
    // Create dates at midnight in local timezone
    const expiry = new Date(year, month, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  const getSecurityCardWarning = (card?: { status: string; daysUntilExpiry: number }): boolean => {
    if (!card) return false;
    return card.status === 'expiring' || card.status === 'expired' || card.daysUntilExpiry <= 30;
  };

  // Get Security Guard Card for a specific guard from documents
  const getSecurityGuardCard = (guardId: number) => {
    const guardDocs = allGuardDocuments[guardId];
    if (!guardDocs) return null;
    
    const securityCard = guardDocs.find(doc => doc.name === 'Security Guard Card');
    return securityCard;
  };

  const filteredGuards = guardsList.filter((guard) =>
    guard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guard.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guard.badgeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guard.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guard.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (autoOpenModal === 'add-guard') {
      setAddNewGuardModalOpen(true);
      if (onModalOpened) {
        onModalOpened();
      }
    }
  }, [autoOpenModal, onModalOpened]);

  return (
    <div className="page-container">
      <PageHeader
        title="Workforce Management"
        description="Manage your security team, track certifications, and review performance"
        primaryAction={{
          label: 'Add Guard',
          onClick: () => setAddNewGuardModalOpen(true),
          icon: <Plus size={16} />,
        }}
      />

      <div className="search-filter-bar">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name, role, badge, phone, or email..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="guard-cards-grid">
        {filteredGuards.map((guard) => {
          // Get Security Guard Card from documents
          const securityCard = getSecurityGuardCard(guard.id);
          
          // Check if guard is currently on shift (live sync with Operations)
          const isOnShift = isGuardOnShift(guard.id);
          
          // Determine status based on live shift data
          // In production: This would query real-time database status
          const liveStatus = guard.isFrozen 
            ? 'frozen' 
            : isOnShift 
              ? 'on-shift' 
              : 'available';
          
          // Status badge configuration
          const statusConfig = {
            'frozen': { dot: '#D32F2F', text: 'Frozen', textColor: '#D32F2F' },
            'on-shift': { dot: 'success', text: 'On-Shift', textColor: '' },
            'available': { dot: '', text: 'Available', textColor: '#8E9AAF' },
            'off-duty': { dot: '', text: 'Off-Duty', textColor: '#D32F2F' }
          };
          
          const status = statusConfig[liveStatus as keyof typeof statusConfig];
          
          return (
          <div 
            key={guard.id} 
            className="guard-card" 
            onClick={() => setSelectedGuard(guard)}
            style={{
              opacity: guard.isFrozen ? 0.6 : 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* Card Header */}
            <div className="guard-card-header">
              <div className="guard-avatar">
                {guard.imageUrl ? (
                  <img src={guard.imageUrl} alt={guard.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                ) : (
                  <Users size={24} />
                )}
              </div>
              <div className="guard-status-badge">
                {guard.isFrozen ? (
                  <>
                    <span className="status-dot" style={{ backgroundColor: '#D32F2F' }} />
                    <span className="guard-status-text" style={{ color: '#D32F2F' }}>Frozen</span>
                  </>
                ) : (
                  <>
                    <span 
                      className={`status-dot ${status.dot === 'success' ? 'success' : ''}`}
                      style={status.dot.startsWith('#') ? { backgroundColor: status.dot } : {}}
                    />
                    <span 
                      className="guard-status-text"
                      style={status.textColor ? { color: status.textColor } : {}}
                    >
                      {status.text}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Guard Info */}
            <div className="guard-card-info">
              <h3 className="guard-name">{guard.name}</h3>
              <p className="guard-badge-id">{guard.badgeId}</p>
              <p className="guard-role">{guard.roleClassification}</p>
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
            </div>

            {/* Contact Actions */}
            <div className="guard-card-actions" style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              marginBottom: '12px'
            }}>
              <a 
                href={`tel:${guard.phone}`} 
                className="icon-button-outline" 
                title="Call"
                onClick={(e) => e.stopPropagation()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Phone size={16} />
                <span>Call</span>
              </a>
              <a 
                href={`mailto:${guard.email}`} 
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
                      color: guard.role === 'Senior Guard' && guard.hoursThisWeek >= 35 ? '#FF7A18' : '#3BD16F' 
                    }}
                  >
                    {guard.hoursThisWeek} / 40 Hrs
                  </span>
                </div>
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
            </div>
          </div>
          );
        })}
      </div>

      {/* Guard Detail Slide Over */}
      <GuardDetailSlideOver
        guard={selectedGuard}
        isOpen={selectedGuard !== null}
        onClose={() => setSelectedGuard(null)}
        shifts={allShifts}
        onShiftsUpdate={setAllShifts}
        onUpdate={(updatedGuard) => {
          // Update the guard via context
          updateGuard(updatedGuard);
          // Update selectedGuard to reflect changes immediately
          setSelectedGuard(updatedGuard);
        }}
        documents={allGuardDocuments}
        onDocumentsUpdate={setAllGuardDocuments}
      />

      {/* Add New Guard Modal */}
      <AddNewGuardModal
        isOpen={isAddNewGuardModalOpen}
        onClose={() => setAddNewGuardModalOpen(false)}
        onSave={(guardData) => {
          // Create a new guard object
          const newGuard: Guard = {
            id: Math.max(...guardsList.map(g => g.id)) + 1,
            name: `${guardData.firstName} ${guardData.lastName}`,
            badgeId: guardData.badgeId,
            role: guardData.role,
            status: 'active',
            phone: guardData.phone,
            email: guardData.email,
            licenseExpiry: guardData.expiryDate,
            certExpiry: guardData.expiryDate,
            lastShift: 'Not yet assigned',
            location: 'Not assigned',
            shiftsThisWeek: 0,
            hoursThisWeek: 0,
            imageUrl: guardData.imageUrl
          };
          // Add the new guard via context
          addGuard(newGuard);
          toast.success(`${newGuard.name} has been added to the workforce and is now available for scheduling`);
        }}
      />
    </div>
  );
}