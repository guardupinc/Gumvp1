import React, { useState } from 'react';
import { AdminPortal } from './components/admin-portal/AdminPortal';
import { GuardPortal } from './components/guard-portal/GuardPortal';
import { Shield, User, Building2, Lock } from 'lucide-react';
import './portal-selector.css';

// User role types - in production, these would come from your authentication backend
export type UserRole = 'SECURITY_ADMIN' | 'GUARD' | 'COMPANY_ADMIN' | null;

export default function App() {
  // Simulates authenticated user session
  // In production, this would be set by your auth system (JWT, session, etc.)
  const [userRole, setUserRole] = useState<UserRole>(null);

  // In production, attempting to access wrong portal would redirect to 403
  // This is just for demo/testing purposes
  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
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
              onClick={() => handleRoleSelect('SECURITY_ADMIN')}
            >
              <div className="portal-card-icon security-admin">
                <Building2 size={32} />
              </div>
              <h2>Security Admin Portal</h2>
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
              className="portal-card portal-card-disabled"
              disabled
            >
              <div className="portal-card-icon company-admin">
                <Shield size={32} />
              </div>
              <h2>Company Admin Portal</h2>
              <p>GuardUp internal operations and platform management</p>
              <div className="portal-card-badge">Coming Soon</div>
            </button>
          </div>

          <div className="portal-selector-footer">
            <p>© 2024 GuardUp Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate portal based on authenticated role
  return (
    <>
      {userRole === 'SECURITY_ADMIN' && <AdminPortal onLogout={handleLogout} />}
      {userRole === 'GUARD' && <GuardPortal onLogout={handleLogout} />}
      {userRole === 'COMPANY_ADMIN' && (
        <div className="portal-unavailable">
          <h2>Company Admin Portal</h2>
          <p>This portal is under development.</p>
          <button onClick={handleLogout}>Back to Portal Selection</button>
        </div>
      )}
    </>
  );
}
