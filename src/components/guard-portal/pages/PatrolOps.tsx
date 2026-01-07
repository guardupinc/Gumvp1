import React, { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';

export function PatrolOps() {
  const [sosActive, setSosActive] = useState(false);

  const handleSOS = () => {
    setSosActive(true);
    // In production, this would trigger emergency protocols
    setTimeout(() => {
      setSosActive(false);
    }, 3000);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Current Assignment: Building B"
        description="Active patrol operations and route monitoring"
      />

      {/* Map Container */}
      <div className="patrol-map-container">
        <div className="patrol-map-placeholder">
          {/* Placeholder Map */}
          <div className="map-overlay-label">
            <MapPin size={20} />
            <span>Building B - Main Campus</span>
          </div>
          
          {/* Mock Map Grid */}
          <div className="map-grid">
            <div className="map-building">
              <div className="building-label">Building B</div>
              <div className="patrol-route">
                <div className="route-marker marker-1">1</div>
                <div className="route-marker marker-2">2</div>
                <div className="route-marker marker-3">3</div>
                <div className="route-marker marker-4">4</div>
              </div>
            </div>
          </div>

          {/* Status Overlay Card */}
          <div className="patrol-status-card">
            <div className="status-card-header">
              <div className="status-indicator active">
                <span className="pulse-dot"></span>
                <span>Active Patrol</span>
              </div>
              <div className="shift-time">
                <Clock size={16} />
                <span>08:00 AM - 04:00 PM</span>
              </div>
            </div>

            <div className="current-task">
              <div className="task-label">Current Task</div>
              <div className="task-name">
                <Navigation size={20} />
                Perimeter Check
              </div>
              <div className="task-progress">
                <div className="task-progress-bar">
                  <div className="task-progress-fill" style={{ width: '60%' }}></div>
                </div>
                <span className="task-progress-text">3 of 5 checkpoints</span>
              </div>
            </div>

            {/* Checkpoint List */}
            <div className="checkpoint-list">
              <div className="checkpoint-item completed">
                <CheckCircle size={16} />
                <span>Main Entrance</span>
                <span className="checkpoint-time">10:15 AM</span>
              </div>
              <div className="checkpoint-item completed">
                <CheckCircle size={16} />
                <span>North Perimeter</span>
                <span className="checkpoint-time">10:42 AM</span>
              </div>
              <div className="checkpoint-item completed">
                <CheckCircle size={16} />
                <span>Parking Lot A</span>
                <span className="checkpoint-time">11:05 AM</span>
              </div>
              <div className="checkpoint-item pending">
                <div className="checkpoint-dot"></div>
                <span>East Wing</span>
                <span className="checkpoint-time">Pending</span>
              </div>
              <div className="checkpoint-item pending">
                <div className="checkpoint-dot"></div>
                <span>South Exit</span>
                <span className="checkpoint-time">Pending</span>
              </div>
            </div>

            {/* SOS Button */}
            <button 
              className={`sos-button ${sosActive ? 'active' : ''}`}
              onClick={handleSOS}
            >
              <AlertTriangle size={24} />
              <span className="sos-text">
                {sosActive ? 'ALERT SENT!' : 'SOS / PANIC ALERT'}
              </span>
            </button>

            {sosActive && (
              <div className="sos-confirmation">
                <CheckCircle size={16} />
                Emergency services notified. Help is on the way.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="patrol-actions">
        <button className="action-card">
          <CheckCircle size={20} />
          <span>Complete Checkpoint</span>
        </button>
        <button className="action-card">
          <AlertTriangle size={20} />
          <span>Report Incident</span>
        </button>
        <button className="action-card">
          <Navigation size={20} />
          <span>View Full Route</span>
        </button>
      </div>
    </div>
  );
}
