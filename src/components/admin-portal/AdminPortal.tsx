import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from '../pages/Dashboard';
import { ReportView, ClientType } from '../pages/ReportView';
import { Scheduling } from '../pages/Scheduling';
import { Metrics } from '../pages/Metrics';
import { WorkforceManagement } from '../pages/WorkforceManagement';
import { Vault } from '../pages/Vault';
import { Settings } from '../pages/Settings';
import { LiveOperations } from '../pages/LiveOperations';
import { Reports } from '../pages/Reports';
import { AppStateProvider, useAppState } from '../../contexts/AppStateContext';

// Placeholder components for new pages
const HR = () => <div className="page-container"><h1>HR</h1><p>Coming soon...</p></div>;
const Billing = () => <div className="page-container"><h1>Billing</h1><p>Coming soon...</p></div>;
const GuardCard = () => <div className="page-container"><h1>Guard Card</h1><p>Coming soon...</p></div>;
const GuardNexus = () => <div className="page-container"><h1>Guard Nexus</h1><p>Coming soon...</p></div>;

export type AdminPageId = 
  | 'dashboard' 
  | 'scheduling' 
  | 'operations'
  | 'reports'
  | 'report-view'
  | 'metrics' 
  | 'workforce-management'
  | 'hr'
  | 'billing'
  | 'vault'
  | 'guard-card'
  | 'guard-nexus'
  | 'settings';

interface AdminPortalProps {
  onLogout: () => void;
}

function AdminPortalContent({ onLogout }: AdminPortalProps) {
  const { appState } = useAppState();
  const [currentPage, setCurrentPage] = useState<AdminPageId>('dashboard');
  const [reportClientType, setReportClientType] = useState<ClientType>('building-a');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Persistent approval states (survive navigation)
  const [is_IR2024_1156_Approved, setIs_IR2024_1156_Approved] = useState(false);
  const [is_DAR445_Approved, setIs_DAR445_Approved] = useState(false);
  const [is_DAR446_Approved, setIs_DAR446_Approved] = useState(false);

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

  const handleNavigateToReport = (clientType: ClientType) => {
    setReportClientType(clientType);
    setCurrentPage('report-view');
  };

  const handleBackToReports = () => {
    setCurrentPage('reports');
  };

  const handleNavigateToPendingReports = () => {
    setCurrentPage('reports');
    // The Reports component will default to the 'pending' tab
  };

  const handleNavigateToOperations = () => {
    setCurrentPage('operations');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            reports={appState.reports}
            onNavigateToPendingReports={handleNavigateToPendingReports}
            onNavigateToOperations={handleNavigateToOperations}
          />
        );
      case 'scheduling':
        return <Scheduling />;
      case 'operations':
        return <LiveOperations />;
      case 'reports':
        return <Reports 
          reports={appState.reports}
          onNavigateToReport={handleNavigateToReport}
          is_IR2024_1156_Approved={is_IR2024_1156_Approved}
          setIs_IR2024_1156_Approved={setIs_IR2024_1156_Approved}
          is_DAR445_Approved={is_DAR445_Approved}
          setIs_DAR445_Approved={setIs_DAR445_Approved}
          is_DAR446_Approved={is_DAR446_Approved}
          setIs_DAR446_Approved={setIs_DAR446_Approved}
        />; 
      case 'report-view':
        return <ReportView clientType={reportClientType} onBack={handleBackToReports} />;
      case 'metrics':
        return <Metrics />;
      case 'workforce-management':
        return <WorkforceManagement />;
      case 'hr':
        return <HR />;
      case 'billing':
        return <Billing />;
      case 'vault':
        return <Vault />;
      case 'guard-card':
        return <GuardCard />;
      case 'guard-nexus':
        return <GuardNexus />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard 
            reports={appState.reports}
            onNavigateToPendingReports={handleNavigateToPendingReports}
            onNavigateToOperations={handleNavigateToOperations}
          />
        );
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
          userRole="Security Admin"
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export function AdminPortal({ onLogout }: AdminPortalProps) {
  return (
    <AppStateProvider>
      <AdminPortalContent onLogout={onLogout} />
    </AppStateProvider>
  );
}