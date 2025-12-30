import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Shield, Send } from 'lucide-react';

interface SiteCard {
  id: number;
  name: string;
  status: 'all-clear' | 'critical';
  statusText: string;
  activeGuards: number;
  guards: { id: number; name: string; initials: string }[];
}

interface ActivityEvent {
  id: number;
  message: string;
  timestamp: string;
  severity: 'success' | 'warning' | 'critical';
}

const siteData: SiteCard[] = [
  {
    id: 2,
    name: 'Building B',
    status: 'critical',
    statusText: 'CRITICAL - SOS Triggered',
    activeGuards: 2,
    guards: [
      { id: 2, name: 'Maria Garcia', initials: 'MG' },
      { id: 5, name: 'Robert Brown', initials: 'RB' }
    ]
  },
  {
    id: 1,
    name: 'Building A',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 3,
    guards: [
      { id: 1, name: 'John Smith', initials: 'JS' },
      { id: 4, name: 'Sarah Chen', initials: 'SC' },
      { id: 7, name: 'Alex Johnson', initials: 'AJ' }
    ]
  },
  {
    id: 3,
    name: 'Parking Structure C',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 2,
    guards: [
      { id: 3, name: 'David Lee', initials: 'DL' },
      { id: 6, name: 'Lisa Wang', initials: 'LW' }
    ]
  },
  {
    id: 4,
    name: 'Manufacturing Wing D',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 4,
    guards: [
      { id: 8, name: 'Kevin Torres', initials: 'KT' },
      { id: 9, name: 'Nina Patel', initials: 'NP' },
      { id: 10, name: 'James Kim', initials: 'JK' },
      { id: 11, name: 'Emma Wilson', initials: 'EW' }
    ]
  },
  {
    id: 5,
    name: 'East Campus Security',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 3,
    guards: [
      { id: 12, name: 'Carlos Rivera', initials: 'CR' },
      { id: 13, name: 'Amy Zhang', initials: 'AZ' },
      { id: 14, name: 'Tom Anderson', initials: 'TA' }
    ]
  },
  {
    id: 6,
    name: 'West Perimeter',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 2,
    guards: [
      { id: 15, name: 'Rachel Green', initials: 'RG' },
      { id: 16, name: 'Mike Ross', initials: 'MR' }
    ]
  }
];

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
  const [activities, setActivities] = useState(initialActivities);

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

  return (
    <div className="live-ops-container">
      {/* Top HUD Metrics */}
      <div className="live-ops-hud">
        <div className="hud-metric-card">
          <div className="hud-metric-icon success">
            <Users size={20} />
          </div>
          <div className="hud-metric-content">
            <div className="hud-metric-value">42</div>
            <div className="hud-metric-label">Active Guards</div>
          </div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-icon critical">
            <AlertTriangle size={20} />
          </div>
          <div className="hud-metric-content">
            <div className="hud-metric-value">1</div>
            <div className="hud-metric-label">Critical Incident</div>
          </div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-icon success">
            <Shield size={20} />
          </div>
          <div className="hud-metric-content">
            <div className="hud-metric-value">98%</div>
            <div className="hud-metric-label">Coverage</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="live-ops-content">
        {/* Site Health Grid */}
        <div className="site-health-grid-container">
          <div className="site-grid-header">
            <h2 className="site-grid-title">Site Health Status</h2>
            <div className="site-grid-count">{siteData.length} Active Sites</div>
          </div>

          <div className="site-health-grid">
            {siteData.map(site => (
              <div
                key={site.id}
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

                  {site.status === 'critical' && (
                    <button
                      className="dispatch-button"
                      onClick={() => handleDispatch(site.name)}
                    >
                      <Send size={16} />
                      Dispatch
                    </button>
                  )}
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
    </div>
  );
}
