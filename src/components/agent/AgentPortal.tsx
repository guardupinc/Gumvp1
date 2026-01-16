import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Overview } from './pages/Overview';
import { Tenants } from './pages/Tenants';
import { BillingRevenue } from './pages/BillingRevenue';
import { PlatformHealth } from './pages/PlatformHealth';
import { SecurityAuditLogs } from './pages/SecurityAuditLogs';
import { SupportAccessRequests } from './pages/SupportAccessRequests';
import { Settings } from './pages/Settings';

export type AgentPageId = 
  | 'overview' 
  | 'tenants' 
  | 'billing-revenue'
  | 'platform-health'
  | 'security-audit'
  | 'support-requests'
  | 'settings';

interface AgentPortalProps {
  onLogout: () => void;
}

export function AgentPortal({ onLogout }: AgentPortalProps) {
  const [currentPage, setCurrentPage] = useState<AgentPageId>('overview');
  
  // Persist sidebar collapsed state in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('guardUpSidebarCollapsed');
    return saved !== null ? saved === 'true' : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [breakGlassActive, setBreakGlassActive] = useState(false);
  
  // Save to localStorage when sidebar state changes
  useEffect(() => {
    localStorage.setItem('guardUpSidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Handle Escape key to close/collapse sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (window.innerWidth <= 768) {
          setSidebarOpen(false);
        } else {
          setSidebarCollapsed(true);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleCloseSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    } else {
      setSidebarCollapsed(true);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview breakGlassActive={breakGlassActive} onBreakGlassChange={setBreakGlassActive} />;
      case 'tenants':
        return <Tenants />;
      case 'billing-revenue':
        return <BillingRevenue />;
      case 'platform-health':
        return <PlatformHealth />;
      case 'security-audit':
        return <SecurityAuditLogs breakGlassActive={breakGlassActive} />;
      case 'support-requests':
        return <SupportAccessRequests />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview breakGlassActive={breakGlassActive} onBreakGlassChange={setBreakGlassActive} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onLogout={onLogout}
        onToggle={handleToggleSidebar}
      />
      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <TopBar
          currentPage={currentPage}
          onToggleSidebar={handleToggleSidebar}
          userRole="Agent"
          breakGlassActive={breakGlassActive}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}