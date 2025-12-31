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

// Report type for shared state
interface Report {
  id: number;
  referenceId: string;
  type: 'DAR' | 'Incident';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionNote?: string;
}

const mockReports: Report[] = [
  {
    id: 1,
    referenceId: '#IR-2024-1156',
    type: 'Incident',
    priority: 'high',
    guardName: 'John Smith',
    site: 'Building A - Main Entrance',
    timestamp: 'Dec 30, 2025 • 11:45 PM',
    content: 'Observed unauthorized individual attempting to enter through rear loading dock. Individual was escorted off premises. No physical altercation occurred. Police were notified and arrived at 23:52. Incident number #IR-2024-1156.',
    status: 'pending'
  },
  {
    id: 2,
    referenceId: '#DAR-445',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Maria Garcia',
    site: 'Parking Structure B',
    timestamp: 'Dec 30, 2025 • 10:30 PM',
    content: 'Completed hourly patrol of all 5 levels. All emergency exits secure. Lighting operational on all floors. No vehicles observed in restricted areas. Total vehicle count: 47 vehicles. Weather: Clear, temperature 68°F.',
    status: 'pending'
  },
  {
    id: 3,
    referenceId: '#IR-2024-1157',
    type: 'Incident',
    priority: 'high',
    guardName: 'Robert Chen',
    site: 'Office Tower C',
    timestamp: 'Dec 30, 2025 • 9:15 PM',
    content: 'Fire alarm activated on 12th floor at 21:10. Initiated evacuation protocol per SOP. Fire department notified and arrived at 21:18. Cause determined to be burnt popcorn in break room. All clear given at 21:35. Building re-occupied at 21:40.',
    status: 'pending'
  },
  {
    id: 4,
    referenceId: '#DAR-446',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Sarah Johnson',
    site: 'Retail Complex D',
    timestamp: 'Dec 30, 2025 • 8:00 PM',
    content: 'Evening shift commenced at 20:00. Perimeter check completed - all doors secured. Video surveillance systems operational. Received delivery at loading dock 20:45 - verified credentials and escorted vendor. No incidents to report.',
    status: 'pending'
  },
  {
    id: 5,
    referenceId: '#IR-2024-1158',
    type: 'Incident',
    priority: 'normal',
    guardName: 'Michael Torres',
    site: 'Building A - Lobby',
    timestamp: 'Dec 30, 2025 • 7:30 PM',
    content: 'Assisted visitor who locked keys in vehicle. Contacted parking management. Locksmith arrived at 19:45. Issue resolved. Visitor departed at 20:00. No damage to property.',
    status: 'rejected',
    rejectionNote: 'Please attach a photo of the damaged lock.'
  },
  {
    id: 6,
    referenceId: '#DAR-447',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Lisa Anderson',
    site: 'Distribution Center E',
    timestamp: 'Dec 29, 2025 • 6:45 PM',
    content: 'Shift change completed. Equipment inspection performed - all radios, flashlights, and emergency equipment operational. Logbook reviewed with outgoing guard. Building secure. Temperature monitoring systems showing normal readings.',
    status: 'pending'
  },
  {
    id: 7,
    referenceId: '#IR-2024-1159',
    type: 'Incident',
    priority: 'high',
    guardName: 'David Martinez',
    site: 'Medical Plaza F',
    timestamp: 'Dec 29, 2025 • 5:20 PM',
    content: 'Medical emergency in suite 304. Visitor experienced chest pain. Called 911 at 17:18. Administered first aid and remained with patient until paramedics arrived at 17:24. Patient transported to hospital. Family notified.',
    status: 'pending'
  },
  {
    id: 8,
    referenceId: '#DAR-448',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Jessica Lee',
    site: 'Corporate Campus G',
    timestamp: 'Dec 29, 2025 • 4:15 PM',
    content: 'Afternoon patrol completed. Inspected all perimeter gates - functioning properly. Parking lot inspection revealed no suspicious activity. Greeted employees during shift change. Weather conditions: Partly cloudy, no weather advisories.',
    status: 'rejected',
    rejectionNote: 'Report missing timestamp for gate inspections. Please include specific times for each checkpoint.'
  },
  {
    id: 9,
    referenceId: '#IR-2024-1160',
    type: 'Incident',
    priority: 'normal',
    guardName: 'Thomas Brown',
    site: 'Warehouse H',
    timestamp: 'Dec 29, 2025 • 3:00 PM',
    content: 'Water leak detected in northwest corner of warehouse. Immediately contacted facilities management. Area cordoned off with caution tape. Maintenance arrived at 15:15. Leak source identified and repairs initiated. No inventory damage.',
    status: 'pending'
  },
  {
    id: 10,
    referenceId: '#DAR-449',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Amanda Wilson',
    site: 'Research Facility I',
    timestamp: 'Dec 28, 2025 • 2:30 PM',
    content: 'Mid-day security check completed. All access control systems operational. Verified badge reader functionality at all entry points. Escorted contractor crew working on HVAC system. Crew departed at 14:45. All areas secured.',
    status: 'pending'
  },
  {
    id: 11,
    referenceId: '#IR-2024-1161',
    type: 'Incident',
    priority: 'high',
    guardName: 'Christopher Davis',
    site: 'Data Center J',
    timestamp: 'Dec 28, 2025 • 1:45 PM',
    content: 'Unauthorized access attempt detected at server room. Individual claimed to be new IT contractor but could not provide valid credentials. Access denied. IT director contacted and confirmed individual not authorized. Subject escorted off property. Incident logged.',
    status: 'rejected',
    rejectionNote: 'Incident report incomplete. Please include subject description, vehicle information, and follow-up actions taken.'
  },
  {
    id: 12,
    referenceId: '#DAR-450',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Emily Taylor',
    site: 'Building A - Rooftop',
    timestamp: 'Dec 27, 2025 • 12:30 PM',
    content: 'Rooftop access inspection performed. All doors properly secured. HVAC equipment area clear of debris. No unauthorized personnel observed. Bird deterrent systems functioning. Weather monitoring equipment operational.',
    status: 'approved'
  },
  {
    id: 13,
    referenceId: '#IR-2024-1162',
    type: 'Incident',
    priority: 'high',
    guardName: 'Brandon White',
    site: 'Shopping Mall K',
    timestamp: 'Dec 26, 2025 • 11:15 AM',
    content: 'Shoplifting incident reported by retail staff. Suspect detained at store exit. Police called and arrived at 11:22. Subject arrested without incident. Store manager provided video footage. Incident report filed with local PD. Case #SL-2025-0891.',
    status: 'approved'
  },
  {
    id: 14,
    referenceId: '#DAR-451',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Nicole Green',
    site: 'Financial District L',
    timestamp: 'Dec 26, 2025 • 10:00 AM',
    content: 'Morning shift security briefing completed. All entry points checked and verified secure. Badge access system tested and operational. Visitor log reviewed - 23 visitors checked in/out previous night. All contractors properly escorted.',
    status: 'approved'
  }
];

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

export function AdminPortal({ onLogout }: AdminPortalProps) {
  const [currentPage, setCurrentPage] = useState<AdminPageId>('dashboard');
  const [reportClientType, setReportClientType] = useState<ClientType>('building-a');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Shared reports state (used by both Dashboard and Reports)
  const [reports, setReports] = useState<Report[]>(mockReports);
  
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            reports={reports}
            onNavigateToPendingReports={handleNavigateToPendingReports}
          />
        );
      case 'scheduling':
        return <Scheduling />;
      case 'operations':
        return <LiveOperations />;
      case 'reports':
        return <Reports 
          reports={reports}
          setReports={setReports}
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
            reports={reports}
            onNavigateToPendingReports={handleNavigateToPendingReports}
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