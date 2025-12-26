import React, { useState, useEffect } from 'react';
import { GuardSidebar } from './GuardSidebar';
import { GuardTopBar } from './GuardTopBar';
import { GuardDashboard } from './pages/GuardDashboard';

export type GuardPageId = 
  | 'dashboard' 
  | 'my-schedule' 
  | 'active-shift'
  | 'reports'
  | 'my-documents';

interface GuardPortalProps {
  onLogout: () => void;
}

export function GuardPortal({ onLogout }: GuardPortalProps) {
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
        return <div className="page-container"><h1>My Schedule (Coming Soon)</h1></div>;
      case 'active-shift':
        return <div className="page-container"><h1>Active Shift (Coming Soon)</h1></div>;
      case 'reports':
        return <div className="page-container"><h1>My Reports (Coming Soon)</h1></div>;
      case 'my-documents':
        return <div className="page-container"><h1>My Documents (Coming Soon)</h1></div>;
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
        onLogout={onLogout}
      />
      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <GuardTopBar
          currentPage={currentPage}
          onToggleSidebar={handleToggleSidebar}
          userRole="Security Guard"
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
