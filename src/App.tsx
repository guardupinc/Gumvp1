import React, { useState } from 'react';
import { AdminPortal } from './components/admin-portal/AdminPortal';
import { GuardPortal } from './components/guard-portal/GuardPortal';
import { AgentPortal } from './components/agent/AgentPortal';
import { Shield, User, Building2, Lock, RotateCcw } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { GUARDS_MASTER_LIST } from './utils/guardsData';
import { AppStateProvider, useAppState } from './contexts/AppStateContext';
import './portal-selector.css';
import './styles/guard-pages.css';
import './agent.css';

// User role types - in production, these would come from your authentication backend
export type UserRole = 'ADMIN' | 'GUARD' | 'AGENT' | null;

function AppContent() {
  // Simulates authenticated user session
  // In production, this would be set by your auth system (JWT, session, etc.)
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null);
  const { resetAppData } = useAppState();

  // In production, attempting to access wrong portal would redirect to 403
  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
  };
  
  const handleGuardSelect = (guardId: number) => {
    setSelectedGuardId(guardId);
    setUserRole('GUARD');
  };

  const handleLogout = () => {
    setUserRole(null);
    setSelectedGuardId(null);
  };

  // Role Selection Screen (simulates post-login portal selection)
  if (!userRole) {
    return (
      <div className="portal-selector">
        <div className="portal-selector-container">
          <div className="portal-selector-header">
            <div className="portal-logo">
              <Shield size={32} className="logo-icon" />
              <h1>GuardUp Matrix</h1>
            </div>
            <p className="portal-subtitle">Select Your Portal</p>
            <div className="portal-auth-note">
              <Lock size={14} />
              <span>In production: Role-based access controlled by authentication system</span>
            </div>
          </div>

          <div className="portal-cards">
            <button 
              className="portal-card"
              onClick={() => handleRoleSelect('ADMIN')}
            >
              <div className="portal-card-icon admin">
                <Building2 size={32} />
              </div>
              <h2>Admin Portal</h2>
              <p>Manage your security company, guards, scheduling, and operations</p>
              <div className="portal-card-features">
                <span>• Dashboard & Metrics</span>
                <span>• Workforce Management</span>
                <span>• Shift Scheduling</span>
                <span>• Document Vault</span>
              </div>
            </button>

            <button 
              className="portal-card"
              onClick={() => handleRoleSelect('GUARD')}
            >
              <div className="portal-card-icon guard">
                <User size={32} />
              </div>
              <h2>Guard Portal</h2>
              <p>View your schedule, submit reports, and manage your shifts</p>
              <div className="portal-card-features">
                <span>• My Schedule</span>
                <span>• Active Shifts</span>
                <span>• Submit Reports</span>
                <span>• My Documents</span>
              </div>
            </button>

            <button 
              className="portal-card"
              onClick={() => handleRoleSelect('AGENT')}
            >
              <div className="portal-card-icon agent">
                <Shield size={32} />
              </div>
              <h2>Agent Portal</h2>
              <p>GuardUp internal operations and platform management</p>
              <div className="portal-card-features">
                <span>• Tenant Management</span>
                <span>• Billing & Revenue</span>
                <span>• Platform Health</span>
                <span>• Security Auditing</span>
              </div>
            </button>
          </div>

          <div className="portal-selector-footer">
            <p>© 2024 GuardUp Inc. All rights reserved.</p>
            <button 
              className="reset-data-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all app data? This will clear all reports, schedules, and return to default state.')) {
                  resetAppData();
                }
              }}
              title="Reset all app data to initial state"
            >
              <RotateCcw size={14} />
              Reset App Data
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Guard Selection Screen (when GUARD role is selected but no guard chosen yet)
  if (userRole === 'GUARD' && !selectedGuardId) {
    return (
      <div className="portal-selector">
        <div className="portal-selector-container">
          <div className="portal-selector-header">
            <div className="portal-logo">
              <Shield size={32} className="logo-icon" />
              <h1>GuardUp Matrix</h1>
            </div>
            <p className="portal-subtitle">Select Your Account</p>
            <div className="portal-auth-note">
              <Lock size={14} />
              <span>Demo Mode: In production, guards auto-login with their credentials</span>
            </div>
          </div>

          <div className="portal-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {GUARDS_MASTER_LIST.slice(0, 6).map((guard) => (
              <button 
                key={guard.id}
                className="portal-card"
                onClick={() => handleGuardSelect(guard.id)}
                style={{ padding: '1.5rem' }}
              >
                <div className="portal-card-icon guard" style={{ marginBottom: '0.75rem' }}>
                  <User size={24} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{guard.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#8899AA' }}>{guard.badgeId}</p>
                <p style={{ fontSize: '0.8rem', color: '#6B7A8F', marginTop: '0.5rem' }}>{guard.primarySite}</p>
              </button>
            ))}
          </div>

          <div className="portal-selector-footer">
            <button 
              onClick={() => setUserRole(null)}
              style={{ 
                background: 'transparent', 
                border: '1px solid #2A3F5F', 
                color: '#8899AA',
                padding: '0.5rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              ← Back to Portal Selection
            </button>
            <p>© 2024 GuardUp Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate portal based on authenticated role
  return (
    <>
      <Toaster />
      {userRole === 'ADMIN' && <AdminPortal onLogout={handleLogout} />}
      {userRole === 'GUARD' && selectedGuardId && <GuardPortal onLogout={handleLogout} guardId={selectedGuardId} />}
      {userRole === 'AGENT' && <AgentPortal onLogout={handleLogout} />}
    </>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}