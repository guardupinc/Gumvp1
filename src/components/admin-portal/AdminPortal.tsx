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
import { DropdownPlayground } from '../pages/DropdownPlayground';
import { useAppState } from '../../contexts/AppStateContext';
import { GuardsProvider } from '../../contexts/GuardsContext';
import { initializeLicenseExpirationChecker } from '../../utils/licenseChecker';

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
  | 'settings'
  | 'dropdown-playground';

interface AdminPortalProps {
  onLogout: () => void;
}

function AdminPortalContent({ onLogout }: AdminPortalProps) {
  const { appState, setCurrentUser, currentUser } = useAppState();
  const [currentPage, setCurrentPage] = useState<AdminPageId>('dashboard');
  const [reportClientType, setReportClientType] = useState<ClientType>('building-a');
  
  // State to track which modal should auto-open after navigation
  const [autoOpenModal, setAutoOpenModal] = useState<'add-guard' | 'create-shift' | 'select-report-type' | null>(null);
  
  // CRITICAL: Set current user to Admin/Supervisor when Admin Portal loads
  // This prevents bug where Guard Portal sets currentUser to a guard, then Admin Portal
  // doesn't reset it, causing approval actions to be attributed to the guard
  useEffect(() => {
    console.log('🔐 [AdminPortal] Initializing admin user session');
    console.log('   Current user before initialization:', currentUser);
    
    // Set currentUser to default Admin/Supervisor for Admin Portal
    // In production, this would come from authentication system
    const adminUser = {
      id: 55,
      name: 'Sarah Chen',
      role: 'Supervisor',
      email: 'sarah.chen@guardupmatrix.com'
    };
    
    setCurrentUser(adminUser);
    console.log('   Current user after initialization:', adminUser);
    console.log('   All approval actions will be attributed to:', adminUser.name);
  }, []); // Run once on mount
  
  // Persist sidebar collapsed state in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('guardUpSidebarCollapsed');
    return saved !== null ? saved === 'true' : true; // Default to collapsed
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Save to localStorage when sidebar state changes
  useEffect(() => {
    localStorage.setItem('guardUpSidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Initialize license expiration checker on portal load
  useEffect(() => {
    initializeLicenseExpirationChecker();
  }, []);

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

  const handleReviewAllPendingReports = () => {
    console.log('Dashboard:ReviewAll - Navigating to reports with review-queue mode');
    setAutoOpenModal('review-queue');
    setCurrentPage('reports');
  };

  const handleNavigateToOperations = () => {
    setCurrentPage('operations');
  };

  const handleNavigateToScheduling = () => {
    setCurrentPage('scheduling');
  };

  // Quick Action navigation handlers
  const handleQuickActionAddGuard = () => {
    console.log('QuickAction:AddGuard - Navigating to workforce-management');
    setAutoOpenModal('add-guard');
    setCurrentPage('workforce-management');
  };

  const handleQuickActionCreateShift = () => {
    console.log('QuickAction:CreateShift - Navigating to scheduling');
    setAutoOpenModal('create-shift');
    setCurrentPage('scheduling');
  };

  const handleQuickActionCreateReport = () => {
    console.log('QuickAction:CreateReport - Navigating to reports');
    setAutoOpenModal('select-report-type');
    setCurrentPage('reports');
  };

  // Clear auto-open modal after it's been used
  const handleClearAutoOpenModal = () => {
    setAutoOpenModal(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            reports={appState.reports}
            onNavigateToPendingReports={handleNavigateToPendingReports}
            onNavigateToOperations={handleNavigateToOperations}
            onNavigateToScheduling={handleNavigateToScheduling}
            onQuickActionAddGuard={handleQuickActionAddGuard}
            onQuickActionCreateShift={handleQuickActionCreateShift}
            onQuickActionCreateReport={handleQuickActionCreateReport}
            onReviewAllPendingReports={handleReviewAllPendingReports}
          />
        );
      case 'scheduling':
        return (
          <Scheduling 
            autoOpenModal={autoOpenModal === 'create-shift' ? 'create-shift' : undefined}
            onModalOpened={handleClearAutoOpenModal}
          />
        );
      case 'operations':
        return <LiveOperations />;
      case 'reports':
        return (
          <Reports 
            reports={appState.reports}
            onNavigateToReport={handleNavigateToReport}
            autoOpenModal={
              autoOpenModal === 'select-report-type' ? 'select-report-type' : 
              autoOpenModal === 'review-queue' ? 'review-queue' : 
              undefined
            }
            onModalOpened={handleClearAutoOpenModal}
          />
        ); 
      case 'report-view':
        return <ReportView clientType={reportClientType} onBack={handleBackToReports} />;
      case 'metrics':
        return <Metrics />;
      case 'workforce-management':
        return (
          <WorkforceManagement 
            autoOpenModal={autoOpenModal === 'add-guard' ? 'add-guard' : undefined}
            onModalOpened={handleClearAutoOpenModal}
          />
        );
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
      case 'dropdown-playground':
        return <DropdownPlayground />;
      default:
        return (
          <Dashboard 
            reports={appState.reports}
            onNavigateToPendingReports={handleNavigateToPendingReports}
            onNavigateToOperations={handleNavigateToOperations}
            onNavigateToScheduling={handleNavigateToScheduling}
            onQuickActionAddGuard={handleQuickActionAddGuard}
            onQuickActionCreateShift={handleQuickActionCreateShift}
            onQuickActionCreateReport={handleQuickActionCreateReport}
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
          sidebarCollapsed={sidebarCollapsed}
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
    <GuardsProvider>
      <AdminPortalContent onLogout={onLogout} />
    </GuardsProvider>
  );
}