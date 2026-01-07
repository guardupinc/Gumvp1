import React, { useState, useEffect } from 'react';
import { GuardSidebar } from './GuardSidebar';
import { GuardTopBar } from './GuardTopBar';
import { GuardDashboard } from './pages/GuardDashboard';
import { MyGuardCard } from './pages/MyGuardCard';
import { MySchedule } from './pages/MySchedule';
import { PatrolOps } from './pages/PatrolOps';
import { MyReports } from './pages/MyReports';
import { AppStateProvider } from '../../contexts/AppStateContext';

export type GuardPageId = 
  | 'dashboard' 
  | 'my-schedule' 
  | 'patrol-ops'
  | 'my-reports'
  | 'my-metrics'
  | 'my-guardcard'
  | 'guard-vault'
  | 'settings';

interface GuardPortalProps {
  onLogout: () => void;
}

function GuardPortalContent({ onLogout }: GuardPortalProps) {
  const [currentPage, setCurrentPage] = useState<GuardPageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case 'dashboard':
        return <GuardDashboard />;
      case 'my-schedule':
        return <MySchedule />;
      case 'patrol-ops':
        return <PatrolOps />;
      case 'my-reports':
        return <MyReports />;
      case 'my-metrics':
        return <div className="page-container"><h1>My Metrics</h1><p>View your performance metrics</p></div>;
      case 'my-guardcard':
        return <MyGuardCard />;
      case 'guard-vault':
        return <div className="page-container"><h1>Guard Vault</h1><p>Access your documents and certifications</p></div>;
      case 'settings':
        return <div className="page-container"><h1>Settings</h1><p>Manage your account settings</p></div>;
      default:
        return <GuardDashboard />;
    }
  };

  return (
    <div className="app-shell">
      <GuardSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        onToggle={handleToggleSidebar}
        onLogout={onLogout}
      />
      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <GuardTopBar
          currentPage={currentPage}
          onToggleSidebar={handleToggleSidebar}
          userName="John Smith"
          userRole="Guard"
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export function GuardPortal({ onLogout }: GuardPortalProps) {
  return (
    <AppStateProvider>
      <GuardPortalContent onLogout={onLogout} />
    </AppStateProvider>
  );
}