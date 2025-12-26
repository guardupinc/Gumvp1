import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from '../pages/Dashboard';
import { Scheduling } from '../pages/Scheduling';
import { Metrics } from '../pages/Metrics';
import { WorkforceManagement } from '../pages/WorkforceManagement';
import { Vault } from '../pages/Vault';
import { Settings } from '../pages/Settings';

export type AdminPageId = 
  | 'dashboard' 
  | 'scheduling' 
  | 'metrics' 
  | 'workforce-management' 
  | 'vault' 
  | 'settings';

interface AdminPortalProps {
  onLogout: () => void;
}

export function AdminPortal({ onLogout }: AdminPortalProps) {
  const [currentPage, setCurrentPage] = useState<AdminPageId>('dashboard');
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
        return <Dashboard />;
      case 'scheduling':
        return <Scheduling />;
      case 'metrics':
        return <Metrics />;
      case 'workforce-management':
        return <WorkforceManagement />;
      case 'vault':
        return <Vault />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
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
      />
      <div className={`main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <TopBar
          currentPage={currentPage}
          onToggleSidebar={handleToggleSidebar}
          userRole="Security Admin"
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
