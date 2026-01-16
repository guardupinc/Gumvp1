import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Shield, Send, FileText, Eye } from 'lucide-react';
import { BroadcastAlertModal } from '../modals/BroadcastAlertModal';
import { SiteLogsDrawer } from '../drawers/SiteLogsDrawer';
import { toast } from 'sonner@2.0.3';
import { useAppState } from '../../contexts/AppStateContext';
import { getTodaysScheduledShifts } from '../../utils/activeShifts';
import '../../styles/drawer.css';

interface SiteCard {
  id: number;
  name: string;
  status: 'all-clear' | 'critical';
  statusText: string;
  activeGuards: number;
  guards: { id: number; name: string; initials: string }[];
  shiftProgress: number; // 0-100 percentage
  shiftStatusText: string; // e.g., "Shift ending in 1h"
  taskMetrics: {
    patrolsCompleted: number;
    patrolsTotal: number;
    reportsDrafted: number;
  };
}

interface ActivityEvent {
  id: number;
  message: string;
  timestamp: string;
  severity: 'success' | 'warning' | 'critical' | 'broadcast';
}

const initialActivities: ActivityEvent[] = [
  {
    id: 1,
    message: 'SOS Alert - Building B - Maria Garcia triggered emergency alert',
    timestamp: '2 min ago',
    severity: 'critical'
  },
  {
    id: 2,
    message: 'Checkpoint Scanned - John Smith at Building A North Wing',
    timestamp: '5 min ago',
    severity: 'success'
  },
  {
    id: 3,
    message: 'Shift Started - David Lee began patrol at Parking C',
    timestamp: '12 min ago',
    severity: 'success'
  },
  {
    id: 4,
    message: 'Patrol Route Completed - Sarah Chen at Building A perimeter',
    timestamp: '18 min ago',
    severity: 'success'
  },
  {
    id: 5,
    message: 'Checkpoint Scanned - Robert Brown at Building B Loading Dock',
    timestamp: '22 min ago',
    severity: 'success'
  },
  {
    id: 6,
    message: 'Suspicious Activity - Lisa Wang reported unidentified person',
    timestamp: '35 min ago',
    severity: 'warning'
  },
  {
    id: 7,
    message: 'Checkpoint Scanned - John Smith at Building A Main Entrance',
    timestamp: '41 min ago',
    severity: 'success'
  },
  {
    id: 8,
    message: 'Shift Started - Maria Garcia began patrol at Building B',
    timestamp: '1 hr ago',
    severity: 'success'
  }
];

export function LiveOperations() {
  // Access global state
  const { appState, getActiveGuardCount } = useAppState();
  
  const [activities, setActivities] = useState(initialActivities);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteCard | null>(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  
  // Generate dynamic site data from today's scheduled shifts
  const generateSiteDataFromSchedule = (): SiteCard[] => {
    const todaysShifts = getTodaysScheduledShifts();
    
    // Group shifts by location (site)
    const siteMap = new Map<string, typeof todaysShifts>();
    
    todaysShifts.forEach(shift => {
      const siteName = shift.location;
      if (!siteMap.has(siteName)) {
        siteMap.set(siteName, []);
      }
      siteMap.get(siteName)!.push(shift);
    });
    
    // Convert to SiteCard format
    const dynamicSites: SiteCard[] = [];
    let siteId = 1;
    
    siteMap.forEach((shifts, siteName) => {
      // Helper function to get initials
      const getInitials = (name: string): string => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
      };
      
      // Calculate shift progress (simulated - in production would be based on actual time)
      const now = new Date();
      const currentHour = now.getHours();
      const shiftProgress = Math.min(Math.max(((currentHour - 8) / 8) * 100, 0), 100);
      
      dynamicSites.push({
        id: siteId++,
        name: siteName,
        status: 'all-clear',
        statusText: 'All Clear',
        activeGuards: shifts.length,
        guards: shifts.map(shift => ({
          id: shift.guardId,
          name: shift.guardName,
          initials: getInitials(shift.guardName)
        })),
        shiftProgress: Math.round(shiftProgress),
        shiftStatusText: shiftProgress > 80 ? 'Shift ending soon' : 'Shift in progress',
        taskMetrics: {
          patrolsCompleted: Math.floor(Math.random() * 4) + 1,
          patrolsTotal: 5,
          reportsDrafted: Math.floor(Math.random() * 2)
        }
      });
    });
    
    return dynamicSites;
  };
  
  const [sites, setSites] = useState<SiteCard[]>(() => generateSiteDataFromSchedule());

  // Get active guards count from today's schedule
  const displayActiveGuardsCount = getTodaysScheduledShifts().length;

  // Calculate shift coverage rate (shift fulfillment)
  const todaysShiftsCount = getTodaysScheduledShifts().length;
  const scheduledShiftCount = todaysShiftsCount; // Total shifts scheduled for today
  const coverageRate = scheduledShiftCount > 0 ? 100 : 0; // If shifts exist, they're all filled
  const missingShiftsCount = 0; // No missing shifts since we're showing only scheduled ones
  
  // Dynamic coverage label and styling
  const coverageLabel = coverageRate === 100 
    ? 'All Shifts Filled' 
    : `${missingShiftsCount} Shift${missingShiftsCount !== 1 ? 's' : ''} Missing`;
  const coverageStatus = coverageRate === 100 ? 'success' : 'critical';

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const messages = [
        'Checkpoint Scanned - Guard completed routine check',
        'Patrol Route Completed - Perimeter sweep finished',
        'Position Update - Guard location verified'
      ];
      const newActivity: ActivityEvent = {
        id: Date.now(),
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: 'Just now',
        severity: 'success'
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 10));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleDispatch = (siteName: string) => {
    alert(`Dispatching emergency response to ${siteName}`);
  };

  const handleBroadcastAlert = (site: SiteCard) => {
    setSelectedSite(site);
    setShowBroadcastModal(true);
  };

  const handleBroadcastConfirm = () => {
    if (selectedSite) {
      // Calculate total active guards (using all guards on site, not just the guard count)
      const totalGuards = selectedSite.guards.length;
      
      // Add broadcast event to Real-Time Events feed
      const broadcastEvent: ActivityEvent = {
        id: Date.now(),
        message: `📢 EMERGENCY BROADCAST SENT - Alert sent to all units at ${selectedSite.name}. Admin triggered manual override.`,
        timestamp: 'Just now',
        severity: 'broadcast'
      };
      
      setActivities(prev => [broadcastEvent, ...prev].slice(0, 10));
      
      // Show success toast
      toast.success(`✅ Alert sent to ${totalGuards} active devices.`);
    }
  };

  const handleViewLogs = (site: SiteCard) => {
    setSelectedSite(site);
    setShowLogsDrawer(true);
  };

  const handleResolveIncident = (siteId: number) => {
    // Update the site status from critical to all-clear
    setSites(prevSites =>
      prevSites.map(site =>
        site.id === siteId
          ? {
              ...site,
              status: 'all-clear',
              statusText: 'All Clear',
              shiftProgress: 85, // Resume normal progress
              shiftStatusText: 'Shift ending in 1h'
            }
          : site
      )
    );

    // Also update the selected site if it's the one being resolved
    setSelectedSite(prevSelected =>
      prevSelected && prevSelected.id === siteId
        ? {
            ...prevSelected,
            status: 'all-clear',
            statusText: 'All Clear',
            shiftProgress: 85,
            shiftStatusText: 'Shift ending in 1h'
          }
        : prevSelected
    );

    // Add success event to activity feed
    const resolvedEvent: ActivityEvent = {
      id: Date.now(),
      message: `✅ INCIDENT RESOLVED - Building B incident cleared. Site status restored to normal.`,
      timestamp: 'Just now',
      severity: 'success'
    };
    
    setActivities(prev => [resolvedEvent, ...prev].slice(0, 10));
    
    // Show success toast
    toast.success('✅ Incident resolved. Site status updated to All Clear.');
  };

  // Calculate critical incident count from live site data
  const criticalIncidentCount = sites.filter(site => site.status === 'critical').length;
  const criticalSites = sites.filter(site => site.status === 'critical');

  // Handle critical incident card click - scroll to critical site and open logs
  const handleCriticalIncidentClick = () => {
    if (criticalIncidentCount > 0) {
      // Find the first critical site
      const criticalSite = criticalSites[0];
      
      // Scroll to the site card
      const siteCardElement = document.getElementById(`site-card-${criticalSite.id}`);
      if (siteCardElement) {
        siteCardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the card briefly
        siteCardElement.classList.add('highlight-pulse');
        setTimeout(() => {
          siteCardElement.classList.remove('highlight-pulse');
        }, 2000);
      }
      
      // Auto-open the View Logs drawer after a brief delay
      setTimeout(() => {
        handleViewLogs(criticalSite);
      }, 600);
    }
  };

  return (
    <div className="live-ops-container">
      {/* Top HUD Metrics */}
      <div className="live-ops-hud">
        <div className="hud-metric-card">
          <div className="hud-metric-icon success">
            <Users size={20} />
          </div>
          <div className="hud-metric-content">
            <div className="hud-metric-value">{displayActiveGuardsCount}</div>
            <div className="hud-metric-label">Active On Site</div>
          </div>
        </div>

        <div 
          className={`hud-metric-card ${criticalIncidentCount > 0 ? 'clickable critical-card' : ''}`}
          onClick={handleCriticalIncidentClick}
          style={{ cursor: criticalIncidentCount > 0 ? 'pointer' : 'default' }}
        >
          <div className={`hud-metric-icon ${criticalIncidentCount > 0 ? 'critical' : 'success'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="hud-metric-content">
            <div className="hud-metric-value">{criticalIncidentCount}</div>
            <div className="hud-metric-label">
              {criticalIncidentCount > 0 ? 'Critical Incident' : 'All Systems Nominal'}
            </div>
          </div>
        </div>

        <div className="hud-metric-card">
          <div className={`hud-metric-icon ${coverageStatus}`}>
            <Shield size={20} />
          </div>
          <div className="hud-metric-content">
            <div className="hud-metric-value">{coverageRate}%</div>
            <div className="hud-metric-label">{coverageLabel}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="live-ops-content">
        {/* Site Health Grid */}
        <div className="site-health-grid-container">
          <div className="site-grid-header">
            <h2 className="site-grid-title">Site Health Status</h2>
            <div className="site-grid-count">{sites.length} Active Sites</div>
          </div>

          <div className="site-health-grid">
            {sites.map(site => (
              <div
                key={site.id}
                id={`site-card-${site.id}`}
                className={`site-status-card ${site.status === 'critical' ? 'critical' : ''}`}
              >
                <div className="site-card-header">
                  <h3 className="site-card-name">{site.name}</h3>
                  <div className={`site-status-indicator ${site.status}`}>
                    <span className="status-dot"></span>
                    {site.statusText}
                  </div>
                </div>

                <div className="site-card-body">
                  {/* Shift Progress Section */}
                  <div className="shift-progress-section">
                    <div className="progress-header">
                      <span className="progress-label">Shift Completion</span>
                      <span className="progress-percentage">{site.shiftProgress}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className={`progress-bar-fill ${site.status === 'critical' ? 'critical' : 'success'}`}
                        style={{ width: `${site.shiftProgress}%` }}
                      />
                    </div>
                    <div className="progress-status-text">{site.shiftStatusText}</div>
                  </div>

                  {/* Task Metrics Section */}
                  <div className="task-metrics-section">
                    <div className="task-metric-item">
                      <span className="task-metric-label">Patrols:</span>
                      <span className="task-metric-value">
                        {site.taskMetrics.patrolsCompleted}/{site.taskMetrics.patrolsTotal} Completed
                      </span>
                    </div>
                    <div className="task-metric-item">
                      <span className="task-metric-label">Reports:</span>
                      <span className="task-metric-value">
                        {site.taskMetrics.reportsDrafted} Drafted
                      </span>
                    </div>
                  </div>

                  {/* Active Guards Info */}
                  <div className="site-guard-info">
                    <div className="guard-count-label">
                      <Users size={16} />
                      {site.activeGuards} Active Guard{site.activeGuards !== 1 ? 's' : ''}
                    </div>
                    
                    <div className="guard-face-pile">
                      {site.guards.map((guard, index) => (
                        <div
                          key={guard.id}
                          className="face-pile-avatar"
                          style={{ zIndex: site.guards.length - index }}
                          title={guard.name}
                        >
                          {guard.initials}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="site-card-actions">
                    {site.status === 'critical' ? (
                      <>
                        <button
                          className="dispatch-button"
                          onClick={() => handleBroadcastAlert(site)}
                        >
                          <Send size={16} />
                          BROADCAST ALERT
                        </button>
                        <button
                          className="view-logs-button"
                          onClick={() => handleViewLogs(site)}
                        >
                          <Eye size={16} />
                          View Logs
                        </button>
                      </>
                    ) : (
                      <button
                        className="view-logs-button"
                        onClick={() => handleViewLogs(site)}
                      >
                        <Eye size={16} />
                        View Logs
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed Sidebar */}
        <div className="live-ops-activity-feed">
          <div className="activity-feed-header">
            <h2 className="activity-feed-title">Real-Time Events</h2>
            <div className="activity-feed-live-indicator">
              <span className="live-dot"></span>
              LIVE
            </div>
          </div>

          <div className="activity-feed-list">
            {activities.map(activity => (
              <div key={activity.id} className={`activity-log-item ${activity.severity}`}>
                <div className="activity-log-content">
                  <div className="activity-log-message">{activity.message}</div>
                  <div className="activity-log-timestamp">{activity.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && selectedSite && (
        <BroadcastAlertModal
          site={selectedSite}
          onClose={() => setShowBroadcastModal(false)}
          onConfirm={handleBroadcastConfirm}
        />
      )}

      {/* Site Logs Drawer */}
      {showLogsDrawer && selectedSite && (
        <SiteLogsDrawer
          site={selectedSite}
          onClose={() => setShowLogsDrawer(false)}
          onResolveIncident={handleResolveIncident}
        />
      )}
    </div>
  );
}