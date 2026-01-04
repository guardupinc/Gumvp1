import React, { useState } from 'react';
import { X, AlertTriangle, Camera, CheckCircle, Clock, FileDown, Check, Send, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';

interface SiteCard {
  id: number;
  name: string;
  status: 'all-clear' | 'critical';
  statusText: string;
  activeGuards: number;
  guards: { id: number; name: string; initials: string }[];
  shiftProgress: number;
  shiftStatusText: string;
  taskMetrics: {
    patrolsCompleted: number;
    patrolsTotal: number;
    reportsDrafted: number;
  };
}

interface LogEvent {
  id: number;
  timestamp: string;
  type: 'sos' | 'patrol' | 'checkpoint' | 'shift-start' | 'ticket-update';
  title: string;
  description: string;
  thumbnailUrl?: string;
  guardName: string;
  guardInitials: string;
  guardAvatar?: string;
  isResolved?: boolean;
  ticketId?: string;
  ticketData?: {
    issueType: string;
    priority: 'Low' | 'Medium' | 'High';
    notes: string;
  };
}

interface SiteLogsDrawerProps {
  site: SiteCard;
  onClose: () => void;
  onResolveIncident: (siteId: number) => void;
}

type FilterTab = 'all' | 'incidents' | 'media';

// Generate mock log data based on site
const generateLogEvents = (site: SiteCard): LogEvent[] => {
  const guards = site.guards;
  
  if (site.status === 'critical') {
    return [
      {
        id: 1,
        timestamp: '10:45 AM',
        type: 'sos',
        title: '🚨 SOS ALERT',
        description: 'Panic button triggered at North Gate. Immediate response required.',
        guardName: guards[0]?.name || 'Unknown Officer',
        guardInitials: guards[0]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        isResolved: false
      },
      {
        id: 2,
        timestamp: '10:30 AM',
        type: 'patrol',
        title: '📷 Patrol Scan',
        description: 'Loading Dock Secure. Photo evidence captured.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
        guardName: guards[1]?.name || 'Unknown Officer',
        guardInitials: guards[1]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
      },
      {
        id: 3,
        timestamp: '10:15 AM',
        type: 'checkpoint',
        title: '✅ Checkpoint',
        description: 'Lobby Entrance verified. All clear.',
        guardName: guards[0]?.name || 'Unknown Officer',
        guardInitials: guards[0]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
      },
      {
        id: 4,
        timestamp: '10:00 AM',
        type: 'shift-start',
        title: '🕒 Shift Started',
        description: `${guards[0]?.name || 'Unknown Officer'} clocked in and began patrol.`,
        guardName: guards[0]?.name || 'Unknown Officer',
        guardInitials: guards[0]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
      }
    ];
  } else {
    return [
      {
        id: 1,
        timestamp: '11:20 AM',
        type: 'patrol',
        title: '📷 Patrol Scan',
        description: 'Perimeter check complete. All areas secure.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
        guardName: guards[0]?.name || 'Unknown Officer',
        guardInitials: guards[0]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
      },
      {
        id: 2,
        timestamp: '10:45 AM',
        type: 'checkpoint',
        title: '✅ Checkpoint',
        description: 'Main entrance verified. No issues reported.',
        guardName: guards[1]?.name || 'Unknown Officer',
        guardInitials: guards[1]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
      },
      {
        id: 3,
        timestamp: '10:15 AM',
        type: 'checkpoint',
        title: '✅ Checkpoint',
        description: 'South wing inspection completed.',
        guardName: guards[0]?.name || 'Unknown Officer',
        guardInitials: guards[0]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
      },
      {
        id: 4,
        timestamp: '10:00 AM',
        type: 'shift-start',
        title: '🕒 Shift Started',
        description: `${guards[0]?.name || 'Unknown Officer'} clocked in and began patrol.`,
        guardName: guards[0]?.name || 'Unknown Officer',
        guardInitials: guards[0]?.initials || 'UN',
        guardAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
      }
    ];
  }
};

export function SiteLogsDrawer({ site, onClose, onResolveIncident }: SiteLogsDrawerProps) {
  const [events, setEvents] = useState(generateLogEvents(site));
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [chatMessage, setChatMessage] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
  
  // Ticket form state
  const [expandedTicketForm, setExpandedTicketForm] = useState<number | null>(null);
  const [ticketIssueType, setTicketIssueType] = useState('Emergency Services Dispatched (Police/Fire)');
  const [ticketPriority, setTicketPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [ticketNotes, setTicketNotes] = useState('');
  
  // Resolve confirmation modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [pendingResolveEventId, setPendingResolveEventId] = useState<number | null>(null);
  
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'Maria G',
      message: 'North Gate secure. Returning to lobby.',
      timestamp: '10:46 AM',
      isDispatch: false
    },
    {
      id: 2,
      sender: 'Sarah Chen',
      role: 'Supervisor',
      message: 'Copy that. Watch for the delivery truck.',
      timestamp: '10:47 AM',
      isDispatch: true
    }
  ]);
  
  const shiftTime = '08:00 - 16:00';
  const officerName = site.guards[0]?.name || 'Unknown Officer';
  
  // Admin identity
  const adminName = 'Sarah Chen';
  const adminFirstName = 'Sarah';
  const adminRole = 'Supervisor';
  const adminInitials = 'SC';

  // Calculate incident count
  const incidentCount = events.filter(e => e.type === 'sos' && !e.isResolved).length;
  const mediaCount = events.filter(e => e.thumbnailUrl).length;

  // Count unread messages (messages from guards that came after last dispatch message)
  const unreadCount = chatMessages.filter(msg => !msg.isDispatch).length > 0 ? 1 : 0;

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    if (activeFilter === 'incidents') {
      return event.type === 'sos';
    }
    if (activeFilter === 'media') {
      return event.thumbnailUrl;
    }
    return true; // 'all' shows everything
  });

  const handleToggleChat = () => {
    setIsChatExpanded(!isChatExpanded);
    if (!isChatExpanded) {
      // Opening chat - mark as read
      setHasUnreadMessages(false);
    }
  };

  const handleExportPDF = () => {
    console.log('Exporting PDF report for', site.name);
    alert(`📄 Generating Daily Report for ${site.name}...`);
  };

  const handleResolveIncident = (eventId: number) => {
    // Show confirmation modal instead of immediate action
    setPendingResolveEventId(eventId);
    setShowResolveModal(true);
  };

  const confirmResolveIncident = () => {
    if (pendingResolveEventId !== null) {
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === pendingResolveEventId 
            ? { ...event, isResolved: true }
            : event
        )
      );
      onResolveIncident(site.id);
    }
    
    // Close modal and reset
    setShowResolveModal(false);
    setPendingResolveEventId(null);
  };

  const cancelResolveIncident = () => {
    setShowResolveModal(false);
    setPendingResolveEventId(null);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        sender: adminName,
        role: adminRole,
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        isDispatch: true
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenTicketForm = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    setExpandedTicketForm(eventId);
    
    // If ticket exists, pre-fill form with saved values
    if (event?.ticketData) {
      setTicketIssueType(event.ticketData.issueType);
      setTicketPriority(event.ticketData.priority);
      setTicketNotes(event.ticketData.notes);
    } else {
      // Reset form to defaults
      setTicketIssueType('Emergency Services Dispatched (Police/Fire)');
      setTicketPriority('High');
      setTicketNotes('');
    }
  };

  const handleCancelTicket = () => {
    setExpandedTicketForm(null);
    setTicketNotes('');
  };

  const handleSubmitTicket = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    const isNewTicket = !event?.ticketId;
    const ticketNumber = isNewTicket ? 'TR-992' : event.ticketId;
    
    // Get the highest event ID to create a new unique ID for the audit trail
    const maxId = Math.max(...events.map(e => e.id), 0);
    
    // Build description with priority, type, and notes
    const summaryLine = `Ticket #${ticketNumber} ${isNewTicket ? 'Created' : 'Updated'} • Priority: ${ticketPriority} • Type: ${ticketIssueType}`;
    const notesLine = ticketNotes.trim() ? `\n\n${ticketNotes}` : '';
    const fullDescription = summaryLine + notesLine;
    
    // Create audit trail entry
    const auditEntry: LogEvent = {
      id: maxId + 1,
      timestamp: 'Just now',
      type: 'ticket-update',
      title: `📝 Ticket #${ticketNumber} ${isNewTicket ? 'Created' : 'Updated'}`,
      description: fullDescription,
      guardName: adminName,
      guardInitials: adminInitials,
      guardAvatar: undefined
    };
    
    // Update events: add audit trail entry at the beginning (most recent first) and save ticket data
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              ticketId: ticketNumber,
              ticketData: { 
                issueType: ticketIssueType, 
                priority: ticketPriority, 
                notes: ticketNotes 
              } 
            }
          : event
      );
      
      // Insert audit trail entry at the beginning
      return [auditEntry, ...updatedEvents];
    });
    
    // Collapse form - visual feedback is sufficient
    setExpandedTicketForm(null);
    
    console.log(`Ticket ${isNewTicket ? 'created' : 'updated'}:`, {
      ticketId: ticketNumber,
      issueType: ticketIssueType,
      priority: ticketPriority,
      notes: ticketNotes
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sos':
        return <AlertTriangle size={20} />;
      case 'patrol':
        return <Camera size={20} />;
      case 'checkpoint':
        return <CheckCircle size={20} />;
      case 'shift-start':
        return <Clock size={20} />;
      case 'ticket-update':
        return <Edit3 size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  const getEventClass = (type: string) => {
    switch (type) {
      case 'sos':
        return 'sos';
      case 'patrol':
        return 'patrol';
      case 'checkpoint':
        return 'checkpoint';
      case 'shift-start':
        return 'shift-start';
      case 'ticket-update':
        return 'ticket-update';
      default:
        return 'checkpoint';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />
      
      {/* Drawer */}
      <div className="site-logs-drawer">
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-content">
            <h2 className="drawer-title">{site.name} - Daily Log</h2>
            <p className="drawer-subtitle">
              Shift: {shiftTime} | Officer: {officerName}
            </p>
          </div>
          <button className="drawer-close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Smart Filters - Sticky */}
        <div className="drawer-filters">
          <button
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Activity
          </button>
          <button
            className={`filter-tab ${activeFilter === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveFilter('incidents')}
          >
            <AlertTriangle size={14} />
            Incidents {incidentCount > 0 && `(${incidentCount})`}
          </button>
          <button
            className={`filter-tab ${activeFilter === 'media' ? 'active' : ''}`}
            onClick={() => setActiveFilter('media')}
          >
            <Camera size={14} />
            Media {mediaCount > 0 && `(${mediaCount})`}
          </button>
        </div>

        {/* Body - Timeline */}
        <div className="drawer-body">
          <div className="timeline-container">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className={`timeline-event ${getEventClass(event.type)}`}>
                {/* Timeline Line */}
                {index !== filteredEvents.length - 1 && <div className="timeline-line" />}
                
                {/* Event Icon */}
                <div className={`timeline-icon ${getEventClass(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>

                {/* Event Content */}
                <div className="timeline-content">
                  {/* Timestamp with Guard Attribution */}
                  <div className="timeline-header">
                    <div className="timeline-timestamp">{event.timestamp}</div>
                    <div className="timeline-guard-attribution">
                      <div 
                        className="guard-avatar-small" 
                        style={{ backgroundImage: `url(${event.guardAvatar})` }}
                        title={event.guardName}
                      >
                        {!event.guardAvatar && event.guardInitials}
                      </div>
                      <span className="guard-name-small">{event.guardName}</span>
                    </div>
                  </div>

                  <div className="timeline-title">{event.title}</div>
                  <div className="timeline-description">{event.description}</div>
                  
                  {/* Photo Thumbnail (if exists) */}
                  {event.thumbnailUrl && (
                    <div className="timeline-thumbnail">
                      <img src={event.thumbnailUrl} alt="Patrol scan" />
                    </div>
                  )}

                  {/* SOS Alert Action Section */}
                  {event.type === 'sos' && (
                    <div className="incident-action-section">
                      <div className="incident-status-row">
                        {/* Badge - Changes from "OPEN TICKET" (Red) to "#TICKET-TR-992" (Yellow) */}
                        {event.ticketId ? (
                          <button 
                            className="incident-badge ticket-created clickable"
                            onClick={() => !event.isResolved && handleOpenTicketForm(event.id)}
                            disabled={event.isResolved}
                          >
                            TICKET #{event.ticketId}
                          </button>
                        ) : (
                          <button 
                            className="incident-badge open clickable"
                            onClick={() => !event.isResolved && handleOpenTicketForm(event.id)}
                            disabled={event.isResolved}
                          >
                            {event.isResolved ? (
                              <>
                                <Check size={12} />
                                RESOLVED
                              </>
                            ) : (
                              'OPEN TICKET'
                            )}
                          </button>
                        )}
                        
                        {/* Mark Resolved Button - Always visible when not resolved */}
                        {!event.isResolved && (
                          <button 
                            className="resolve-incident-button"
                            onClick={() => handleResolveIncident(event.id)}
                          >
                            <Check size={14} />
                            Mark Resolved
                          </button>
                        )}
                      </div>

                      {/* Inline Ticket Form - Slides down (shows for both new and existing tickets) */}
                      {expandedTicketForm === event.id && (
                        <div className="inline-ticket-form">
                          <div className="ticket-form-header">
                            <h3>{event.guardName}</h3>
                          </div>

                          <div className="ticket-form-fields">
                            <div className="ticket-form-field">
                              <label>Issue Type</label>
                              <select 
                                value={ticketIssueType}
                                onChange={(e) => setTicketIssueType(e.target.value)}
                                className="ticket-select"
                              >
                                <option value="Use of Force / Physical Altercation">Use of Force / Physical Altercation</option>
                                <option value="Trespass / Unauthorized Access">Trespass / Unauthorized Access</option>
                                <option value="Emergency Services Dispatched (Police/Fire)">Emergency Services Dispatched (Police/Fire)</option>
                                <option value="Injured Person / Medical Emergency">Injured Person / Medical Emergency</option>
                              </select>
                            </div>

                            <div className="ticket-form-field">
                              <label>Priority</label>
                              <div className="priority-segmented-control">
                                <button
                                  className={`priority-option ${ticketPriority === 'Low' ? 'active' : ''}`}
                                  onClick={() => setTicketPriority('Low')}
                                >
                                  Low
                                </button>
                                <button
                                  className={`priority-option ${ticketPriority === 'Medium' ? 'active' : ''}`}
                                  onClick={() => setTicketPriority('Medium')}
                                >
                                  Medium
                                </button>
                                <button
                                  className={`priority-option ${ticketPriority === 'High' ? 'active' : ''}`}
                                  onClick={() => setTicketPriority('High')}
                                >
                                  High
                                </button>
                              </div>
                            </div>

                            <div className="ticket-form-field">
                              <label>Notes</label>
                              <textarea 
                                value={ticketNotes}
                                onChange={(e) => setTicketNotes(e.target.value)}
                                placeholder="Describe the issue and required action..."
                                className="ticket-textarea"
                                rows={3}
                              />
                            </div>
                          </div>

                          <div className="ticket-form-actions">
                            <button 
                              className="button-primary"
                              onClick={() => handleSubmitTicket(event.id)}
                            >
                              {event.ticketId ? 'Update Ticket' : 'Submit Ticket'}
                            </button>
                            <button 
                              className="button-text"
                              onClick={handleCancelTicket}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Chat Module - Collapsible Smart Drawer */}
        <div className={`drawer-chat-container ${isChatExpanded ? 'expanded' : 'collapsed'}`}>
          {/* Collapsed State - 40px Bar */}
          {!isChatExpanded && (
            <div className="chat-collapsed-bar" onClick={handleToggleChat}>
              <div className="chat-collapsed-content">
                <span className="chat-collapsed-label">💬 Site Team Chat</span>
                {hasUnreadMessages && unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
              <ChevronUp size={18} className="chat-expand-icon" />
            </div>
          )}

          {/* Expanded State - Full Chat Interface */}
          {isChatExpanded && (
            <>
              <div className="chat-header">
                <span className="chat-header-text">💬 Site Team Chat ({site.activeGuards} Active)</span>
                <button className="chat-minimize-button" onClick={handleToggleChat}>
                  <ChevronDown size={18} />
                </button>
              </div>
              
              <div className="chat-messages">
                {chatMessages.slice(-2).map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.isDispatch ? 'dispatch' : 'guard'}`}>
                    {msg.isDispatch && (
                      <div className="chat-avatar-container">
                        <div className="admin-avatar">{adminInitials}</div>
                      </div>
                    )}
                    <div className="chat-bubble">
                      <div className="chat-sender-row">
                        <span className="chat-sender">{msg.sender}</span>
                        {msg.role && <span className="chat-role-badge">{msg.role}</span>}
                      </div>
                      <div className="chat-text">{msg.message}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  placeholder={`Message active team as ${adminFirstName}...`}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  className="chat-send-button" 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button className="export-pdf-button" onClick={handleExportPDF}>
            <FileDown size={18} />
            Export Daily Report (PDF)
          </button>
        </div>
      </div>

      {/* Resolve Incident Confirmation Modal - Visual Clone of Freeze Guard Access Modal */}
      {showResolveModal && (
        <>
          <div className="confirm-modal-overlay" onClick={cancelResolveIncident} />
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper success">
                <CheckCircle size={24} />
              </div>
              <h3 className="confirm-modal-title">Resolve Incident?</h3>
              <p className="confirm-modal-description">
                You are about to mark this SOS Alert as resolved. This will return the site status to All Clear.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="button-secondary" onClick={cancelResolveIncident}>
                Cancel
              </button>
              <button className="button-success" onClick={confirmResolveIncident}>
                Resolve Incident
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}