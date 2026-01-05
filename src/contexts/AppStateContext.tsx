import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CurrentUser {
  id: number;
  name: string;
  role: string;
  email: string;
}

export interface GlobalReport {
  id: number;
  referenceId: string;
  caseId?: string;
  type: 'DAR' | 'Incident' | 'Maintenance';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionNote?: string;
  clientName?: string;
  approvedBy?: string;
  approvedByRole?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByRole?: string;
  rejectedAt?: string;
  location?: string;
  attachments?: Array<{ id: number; url: string; name: string }>;
  date?: string;
  time?: string;
  incidentType?: string;
  urgency?: string;
  policeCalled?: string;
  narrativeOnly?: string;
  // DAR-specific fields
  shiftStart?: string;
  shiftEnd?: string;
  reliefGuard?: string;
  equipmentStatus?: string;
  // Maintenance-specific fields
  maintenanceCategory?: string;
  specificArea?: string;
  assetId?: string;
}

export interface ActiveGuard {
  id: number;
  name: string;
  badgeId: string;
  status: 'active' | 'on-break' | 'clocked-out';
  site: string;
  clockInTime: string;
  location: string;
  initials: string;
}

export interface IncidentLog {
  id: number;
  guardId: number;
  guardName: string;
  site: string;
  timestamp: string;
  incidentType: 'sos' | 'security-breach' | 'medical' | 'fire' | 'suspicious-activity' | 'maintenance' | 'general';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  reportedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  images?: string[];
  actions?: string[];
}

export interface EmployeeHistoryRecord {
  reportId: string;
  reportType: 'DAR' | 'Incident';
  status: 'approved' | 'rejected';
  approvedBy: string;
  approvedAt: string;
  site: string;
  timestamp: string;
}

export interface RosterGuard {
  id: number;
  name: string;
  badgeId: string;
  role: string;
  phone: string;
  email: string;
  licenseExpiry: string;
  certExpiry: string;
  location: string;
  shiftsThisWeek: number;
  hoursThisWeek: number;
  imageUrl?: string;
  isFrozen?: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  dateOfHire?: string;
  roleClassification?: string;
  primarySite?: string;
  employeeHistory?: EmployeeHistoryRecord[];
  securityGuardCard?: {
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
    daysUntilExpiry: number;
  };
}

export interface SiteData {
  id: number;
  name: string;
  status: 'all-clear' | 'critical';
  statusText: string;
  activeGuards: number;
  guards: Array<{ id: number; name: string; initials: string }>;
  shiftProgress: number;
  shiftStatusText: string;
  taskMetrics: {
    patrolsCompleted: number;
    patrolsTotal: number;
    reportsDrafted: number;
  };
}

export interface LatestReportData {
  name: string;
  user: string;
  date: string;
  status: 'Active' | 'Inactive';
  reportId: string;
  reportType: 'DAR' | 'Incident';
  site: string;
  category: string; // Vault category: 'Incident Reports' | 'Daily Reports' | etc.
}

export interface VaultDocument {
  id: number;
  name: string;
  category: 'Incident Reports' | 'Daily Reports' | 'Maintenance' | 'Licenses' | 'Certifications' | 'Receipts' | 'Contracts';
  uploadedBy: string;
  date: string;
  size: string;
  status: 'Active' | 'Archived';
  reportReferenceId?: string;
}

// ============================================================================
// GLOBAL APP STATE
// ============================================================================

interface AppState {
  // Active guards currently on shift
  activeGuards: ActiveGuard[];
  
  // All incident logs and reports
  incidentLogs: IncidentLog[];
  
  // Full roster of all guards
  roster: RosterGuard[];
  
  // Site information
  sites: SiteData[];
  
  // Global Vault Broadcasting System
  newVaultEntry: boolean;
  latestReportData: LatestReportData | null;
  
  // Centralized Report Management
  reports: GlobalReport[];
  
  // Vault Document Management
  vaultDocuments: VaultDocument[];
}

interface AppStateContextType {
  appState: AppState;
  currentUser: CurrentUser;
  
  // Guard Management Actions
  clockInGuard: (guard: ActiveGuard) => void;
  clockOutGuard: (guardId: number) => void;
  updateGuardStatus: (guardId: number, status: ActiveGuard['status']) => void;
  
  // Incident Management Actions
  createIncident: (incident: Omit<IncidentLog, 'id'>) => void;
  updateIncident: (incidentId: number, updates: Partial<IncidentLog>) => void;
  resolveIncident: (incidentId: number, resolvedBy: string) => void;
  
  // Roster Management Actions
  addGuardToRoster: (guard: RosterGuard) => void;
  updateGuardInRoster: (guardId: number, updates: Partial<RosterGuard>) => void;
  removeGuardFromRoster: (guardId: number) => void;
  syncReportToGuardVault: (guardName: string, reportRecord: EmployeeHistoryRecord) => void;
  broadcastVaultEntry: (reportData: LatestReportData) => void;
  clearVaultEntry: () => void;
  
  // Site Management Actions
  updateSiteStatus: (siteId: number, updates: Partial<SiteData>) => void;
  
  // Report Management Actions
  addReport: (report: Omit<GlobalReport, 'id' | 'referenceId' | 'timestamp'>) => void;
  updateReportStatus: (id: number, status: GlobalReport['status'], note?: string) => void;
  updateReport: (id: number, updates: Partial<GlobalReport>) => void;
  getPreviewId: (type: 'Incident' | 'DAR' | 'Maintenance') => string;
  
  // Computed Values
  getActiveGuardCount: () => number;
  getIncidentCount: (status?: IncidentLog['status']) => number;
  isGuardOnShift: (guardId: number) => boolean;
  getGuardCurrentSite: (guardId: number) => string | null;
  
  // Vault Document Management Actions
  addVaultDocument: (doc: Omit<VaultDocument, 'id'>) => void;
}

// ============================================================================
// INITIAL DATA
// ============================================================================

const initialActiveGuards: ActiveGuard[] = [
  { id: 1, name: 'John Smith', badgeId: 'BADGE-1024', status: 'active', site: 'Building A', clockInTime: '8:00 AM', location: 'Building A - Main Entrance', initials: 'JS' },
  { id: 2, name: 'Maria Garcia', badgeId: 'BADGE-1025', status: 'active', site: 'Building B', clockInTime: '8:00 AM', location: 'Building B - Parking Lot', initials: 'MG' },
  { id: 4, name: 'Sarah Chen', badgeId: 'BADGE-1027', status: 'active', site: 'Building A', clockInTime: '8:00 AM', location: 'Building A - Security Office', initials: 'SC' },
  { id: 5, name: 'Robert Brown', badgeId: 'BADGE-1028', status: 'active', site: 'Building B', clockInTime: '9:00 AM', location: 'Building B - Loading Dock', initials: 'RB' },
  { id: 6, name: 'Lisa Wang', badgeId: 'BADGE-1029', status: 'active', site: 'Parking Structure C', clockInTime: '7:00 AM', location: 'Parking Structure C', initials: 'LW' },
  { id: 7, name: 'Alex Johnson', badgeId: 'BADGE-1030', status: 'active', site: 'Building A', clockInTime: '8:00 AM', location: 'Building A', initials: 'AJ' },
  { id: 8, name: 'Kevin Torres', badgeId: 'BADGE-1031', status: 'active', site: 'Manufacturing Wing D', clockInTime: '6:00 AM', location: 'Manufacturing Wing D', initials: 'KT' },
  { id: 17, name: 'Marcus Chen', badgeId: 'BADGE-1042', status: 'active', site: 'Building B', clockInTime: '8:00 AM', location: 'Building B', initials: 'MC' },
];

const initialIncidentLogs: IncidentLog[] = [
  {
    id: 1,
    guardId: 2,
    guardName: 'Maria Garcia',
    site: 'Building B',
    timestamp: '2:45 PM',
    incidentType: 'sos',
    severity: 'critical',
    title: 'SOS Alert Triggered',
    description: 'Emergency button pressed in Building B parking lot. Possible threat detected.',
    status: 'in-progress',
    reportedAt: 'Jan 1, 2026 2:45 PM',
    images: [],
    actions: ['Security team dispatched', 'Local authorities notified']
  },
  {
    id: 2,
    guardId: 1,
    guardName: 'John Smith',
    site: 'Building A',
    timestamp: '1:30 PM',
    incidentType: 'suspicious-activity',
    severity: 'medium',
    title: 'Suspicious Individual Near Entrance',
    description: 'Unidentified person loitering near main entrance for 20+ minutes.',
    status: 'resolved',
    reportedAt: 'Jan 1, 2026 1:30 PM',
    resolvedAt: 'Jan 1, 2026 2:00 PM',
    resolvedBy: 'John Smith',
    actions: ['Individual questioned', 'Asked to leave premises', 'No further action needed']
  },
  {
    id: 3,
    guardId: 4,
    guardName: 'Sarah Chen',
    site: 'Building A',
    timestamp: '11:15 AM',
    incidentType: 'maintenance',
    severity: 'low',
    title: 'Broken Security Camera',
    description: 'Camera #A-12 in north corridor is offline.',
    status: 'open',
    reportedAt: 'Jan 1, 2026 11:15 AM',
    actions: ['Maintenance team notified']
  }
];

const initialRoster: RosterGuard[] = [
  {
    id: 1,
    name: 'John Smith',
    badgeId: 'BADGE-1024',
    role: 'Senior Guard',
    phone: '(555) 123-4567',
    email: 'john.smith@example.com',
    licenseExpiry: 'Sep 15, 2025',
    certExpiry: 'Jun 20, 2025',
    location: 'Building A - Main Entrance',
    shiftsThisWeek: 5,
    hoursThisWeek: 38,
    roleClassification: 'Senior Guard - Armed',
    emergencyContact: 'Jane Smith',
    emergencyPhone: '(555) 123-4568',
    dateOfHire: 'Oct 12, 2021',
    primarySite: 'Building A',
    securityGuardCard: {
      expiryDate: '10/15/2025',
      status: 'valid',
      daysUntilExpiry: 289
    }
  },
  {
    id: 2,
    name: 'Maria Garcia',
    badgeId: 'BADGE-1025',
    role: 'Guard',
    phone: '(555) 234-5678',
    email: 'maria.garcia@example.com',
    licenseExpiry: 'Mar 22, 2026',
    certExpiry: 'Feb 28, 2025',
    location: 'Building B - Parking Lot',
    shiftsThisWeek: 3,
    hoursThisWeek: 24,
    roleClassification: 'Guard - Unarmed',
    emergencyContact: 'Carlos Garcia',
    emergencyPhone: '(555) 234-5679',
    dateOfHire: 'Jan 5, 2022',
    primarySite: 'Building B',
    securityGuardCard: {
      expiryDate: '08/20/2025',
      status: 'valid',
      daysUntilExpiry: 233
    }
  },
  {
    id: 3,
    name: 'David Lee',
    badgeId: 'BADGE-1026',
    role: 'Guard',
    phone: '(555) 345-6789',
    email: 'david.lee@example.com',
    licenseExpiry: 'Jul 18, 2025',
    certExpiry: 'Sep 12, 2025',
    location: 'Building C - Lobby',
    shiftsThisWeek: 4,
    hoursThisWeek: 28,
    roleClassification: 'Guard - Armed',
    emergencyContact: 'Susan Lee',
    emergencyPhone: '(555) 345-6780',
    dateOfHire: 'Mar 20, 2021',
    primarySite: 'Building C',
    securityGuardCard: {
      expiryDate: '02/10/2025',
      status: 'expiring',
      daysUntilExpiry: 42
    }
  },
  {
    id: 4,
    name: 'Sarah Chen',
    badgeId: 'BADGE-1027',
    role: 'Senior Guard',
    phone: '(555) 456-7890',
    email: 'sarah.chen@example.com',
    licenseExpiry: 'Nov 08, 2026',
    certExpiry: 'Dec 15, 2025',
    location: 'Building A - Security Office',
    shiftsThisWeek: 5,
    hoursThisWeek: 40,
    roleClassification: 'Senior Guard - Armed',
    emergencyContact: 'Michael Chen',
    emergencyPhone: '(555) 456-7891',
    dateOfHire: 'Jun 15, 2020',
    primarySite: 'Building A',
    securityGuardCard: {
      expiryDate: '11/30/2025',
      status: 'valid',
      daysUntilExpiry: 335
    }
  },
  {
    id: 5,
    name: 'Robert Brown',
    badgeId: 'BADGE-1028',
    role: 'Guard',
    phone: '(555) 567-8901',
    email: 'robert.brown@example.com',
    licenseExpiry: 'Apr 30, 2025',
    certExpiry: 'May 10, 2025',
    location: 'Building D - Loading Dock',
    shiftsThisWeek: 2,
    hoursThisWeek: 16,
    roleClassification: 'Guard - Unarmed',
    emergencyContact: 'Emily Brown',
    emergencyPhone: '(555) 567-8902',
    dateOfHire: 'Sep 1, 2022',
    primarySite: 'Building D',
    securityGuardCard: {
      expiryDate: '01/15/2025',
      status: 'expiring',
      daysUntilExpiry: 16
    }
  },
  {
    id: 6,
    name: 'Lisa Wang',
    badgeId: 'BADGE-1029',
    role: 'Guard',
    phone: '(555) 678-9012',
    email: 'lisa.wang@example.com',
    licenseExpiry: 'Feb 14, 2026',
    certExpiry: 'Mar 1, 2025',
    location: 'Building B - North Wing',
    shiftsThisWeek: 4,
    hoursThisWeek: 32,
    roleClassification: 'Guard - Armed',
    emergencyContact: 'Kevin Wang',
    emergencyPhone: '(555) 678-9013',
    dateOfHire: 'Nov 10, 2021',
    primarySite: 'Building B',
    securityGuardCard: {
      expiryDate: '06/25/2025',
      status: 'valid',
      daysUntilExpiry: 177
    }
  },
];

const initialSites: SiteData[] = [
  {
    id: 2,
    name: 'Building B',
    status: 'critical',
    statusText: 'CRITICAL - SOS Triggered',
    activeGuards: 3,
    guards: [
      { id: 2, name: 'Maria Garcia', initials: 'MG' },
      { id: 5, name: 'Robert Brown', initials: 'RB' },
      { id: 17, name: 'Marcus Chen', initials: 'MC' }
    ],
    shiftProgress: 20,
    shiftStatusText: 'Shift paused - Incident',
    taskMetrics: {
      patrolsCompleted: 3,
      patrolsTotal: 4,
      reportsDrafted: 1
    }
  },
  {
    id: 1,
    name: 'Building A',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 3,
    guards: [
      { id: 1, name: 'John Smith', initials: 'JS' },
      { id: 4, name: 'Sarah Chen', initials: 'SC' },
      { id: 7, name: 'Alex Johnson', initials: 'AJ' }
    ],
    shiftProgress: 85,
    shiftStatusText: 'Shift ending in 1h',
    taskMetrics: {
      patrolsCompleted: 3,
      patrolsTotal: 4,
      reportsDrafted: 1
    }
  },
  {
    id: 3,
    name: 'Parking Structure C',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 1,
    guards: [
      { id: 6, name: 'Lisa Wang', initials: 'LW' }
    ],
    shiftProgress: 80,
    shiftStatusText: 'Shift ending in 1h',
    taskMetrics: {
      patrolsCompleted: 4,
      patrolsTotal: 5,
      reportsDrafted: 2
    }
  },
  {
    id: 4,
    name: 'Manufacturing Wing D',
    status: 'all-clear',
    statusText: 'All Clear',
    activeGuards: 1,
    guards: [
      { id: 8, name: 'Kevin Torres', initials: 'KT' }
    ],
    shiftProgress: 60,
    shiftStatusText: 'Shift ending in 1.5h',
    taskMetrics: {
      patrolsCompleted: 3,
      patrolsTotal: 4,
      reportsDrafted: 1
    }
  }
];

const initialReports: GlobalReport[] = [
  {
    id: 1,
    referenceId: '#IR-2026-1',
    caseId: '#IR-2026-1',
    type: 'Incident',
    priority: 'high',
    guardName: 'John Smith',
    site: 'Building A - Main Entrance',
    timestamp: 'Jan 4, 2026 • 11:45 PM',
    content: 'Observed unauthorized individual attempting to enter through rear loading dock. Individual was escorted off premises. No physical altercation occurred. Police were notified and arrived at 23:52.',
    status: 'pending',
    location: 'Building A - Main Entrance',
    date: 'Jan 4, 2026',
    time: '11:45 PM',
    incidentType: 'Unauthorized Access',
    urgency: 'High',
    policeCalled: 'Yes'
  },
  {
    id: 2,
    referenceId: '#DAR-2026-1',
    caseId: '#DAR-2026-1',
    type: 'DAR',
    priority: 'normal',
    guardName: 'Maria Garcia',
    site: 'Parking Structure B',
    timestamp: 'Jan 4, 2026 • 10:30 PM',
    content: 'Completed hourly patrol of all 5 levels. All emergency exits secure. Lighting operational on all floors. No vehicles observed in restricted areas. Total vehicle count: 47 vehicles. Weather: Clear, temperature 68°F.',
    status: 'pending',
    location: 'Parking Structure B',
    date: 'Jan 4, 2026',
    time: '10:30 PM'
  }
];

const initialVaultDocuments: VaultDocument[] = [
  {
    id: 1,
    name: 'Incident Report #IR-2026-1.pdf',
    category: 'Incident Reports',
    uploadedBy: 'John Smith',
    date: 'Jan 4, 2026',
    size: '2.5 MB',
    status: 'Active',
    reportReferenceId: '#IR-2026-1'
  },
  {
    id: 2,
    name: 'Daily Activity Report #DAR-2026-1.pdf',
    category: 'Daily Reports',
    uploadedBy: 'Maria Garcia',
    date: 'Jan 4, 2026',
    size: '1.8 MB',
    status: 'Active',
    reportReferenceId: '#DAR-2026-1'
  }
];

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>({
    activeGuards: initialActiveGuards,
    incidentLogs: initialIncidentLogs,
    roster: initialRoster,
    sites: initialSites,
    newVaultEntry: false,
    latestReportData: null,
    reports: initialReports,
    vaultDocuments: initialVaultDocuments
  });

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: 55,
    name: 'Sarah Chen',
    role: 'Supervisor',
    email: 'sarah.chen@guardupmatrix.com'
  });

  // ============================================================================
  // GUARD MANAGEMENT ACTIONS
  // ============================================================================

  const clockInGuard = (guard: ActiveGuard) => {
    setAppState(prev => ({
      ...prev,
      activeGuards: [...prev.activeGuards, guard]
    }));
  };

  const clockOutGuard = (guardId: number) => {
    setAppState(prev => ({
      ...prev,
      activeGuards: prev.activeGuards.filter(g => g.id !== guardId)
    }));
  };

  const updateGuardStatus = (guardId: number, status: ActiveGuard['status']) => {
    setAppState(prev => ({
      ...prev,
      activeGuards: prev.activeGuards.map(g =>
        g.id === guardId ? { ...g, status } : g
      )
    }));
  };

  // ============================================================================
  // INCIDENT MANAGEMENT ACTIONS
  // ============================================================================

  const createIncident = (incident: Omit<IncidentLog, 'id'>) => {
    const newId = Math.max(...appState.incidentLogs.map(i => i.id), 0) + 1;
    setAppState(prev => ({
      ...prev,
      incidentLogs: [{ ...incident, id: newId }, ...prev.incidentLogs]
    }));
  };

  const updateIncident = (incidentId: number, updates: Partial<IncidentLog>) => {
    setAppState(prev => ({
      ...prev,
      incidentLogs: prev.incidentLogs.map(i =>
        i.id === incidentId ? { ...i, ...updates } : i
      )
    }));
  };

  const resolveIncident = (incidentId: number, resolvedBy: string) => {
    const now = new Date();
    const resolvedAt = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    setAppState(prev => ({
      ...prev,
      incidentLogs: prev.incidentLogs.map(i =>
        i.id === incidentId
          ? { ...i, status: 'resolved', resolvedAt, resolvedBy }
          : i
      )
    }));
  };

  // ============================================================================
  // ROSTER MANAGEMENT ACTIONS
  // ============================================================================

  const addGuardToRoster = (guard: RosterGuard) => {
    setAppState(prev => ({
      ...prev,
      roster: [...prev.roster, guard]
    }));
  };

  const updateGuardInRoster = (guardId: number, updates: Partial<RosterGuard>) => {
    setAppState(prev => ({
      ...prev,
      roster: prev.roster.map(g =>
        g.id === guardId ? { ...g, ...updates } : g
      )
    }));
  };

  const removeGuardFromRoster = (guardId: number) => {
    setAppState(prev => ({
      ...prev,
      roster: prev.roster.filter(g => g.id !== guardId)
    }));
  };

  const syncReportToGuardVault = (guardName: string, reportRecord: EmployeeHistoryRecord) => {
    const guardIndex = appState.roster.findIndex(g => g.name === guardName);
    if (guardIndex !== -1) {
      const updatedRoster = [...appState.roster];
      if (!updatedRoster[guardIndex].employeeHistory) {
        updatedRoster[guardIndex].employeeHistory = [];
      }
      updatedRoster[guardIndex].employeeHistory.push(reportRecord);
      setAppState(prev => ({
        ...prev,
        roster: updatedRoster
      }));
    }
  };

  const broadcastVaultEntry = (reportData: LatestReportData) => {
    setAppState(prev => ({
      ...prev,
      newVaultEntry: true,
      latestReportData: reportData
    }));
  };

  const clearVaultEntry = () => {
    setAppState(prev => ({
      ...prev,
      newVaultEntry: false,
      latestReportData: null
    }));
  };

  // ============================================================================
  // SITE MANAGEMENT ACTIONS
  // ============================================================================

  const updateSiteStatus = (siteId: number, updates: Partial<SiteData>) => {
    setAppState(prev => ({
      ...prev,
      sites: prev.sites.map(s =>
        s.id === siteId ? { ...s, ...updates } : s
      )
    }));
  };

  // ============================================================================
  // REPORT MANAGEMENT ACTIONS
  // ============================================================================

  // Helper function to generate sequential auto-incrementing IDs
  const generateNextId = (type: 'Incident' | 'DAR' | 'Maintenance'): string => {
    // Get the current year (e.g., 2026)
    const currentYear = new Date().getFullYear();
    
    // Define the prefix based on type
    let prefix: string;
    if (type === 'Incident') {
      prefix = 'IR';
    } else if (type === 'Maintenance') {
      prefix = 'MNT';
    } else {
      prefix = 'DAR';
    }
    
    // Filter appState.reports to find all existing IDs matching #PREFIX-YEAR-
    const matchingReports = appState.reports.filter(r => 
      r.referenceId.startsWith(`#${prefix}-${currentYear}-`)
    );
    
    // Extract the sequence numbers from those IDs (the part after the last dash)
    const sequenceNumbers = matchingReports.map(r => {
      const parts = r.referenceId.split('-');
      const lastPart = parts[parts.length - 1];
      return parseInt(lastPart, 10);
    }).filter(num => !isNaN(num));
    
    // Find the maximum number. Defaults to 0 if none exist
    const maxNumber = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    
    // Return the formatted string: #{prefix}-{year}-{max + 1}
    return `#${prefix}-${currentYear}-${maxNumber + 1}`;
  };

  const addReport = (report: Omit<GlobalReport, 'id' | 'referenceId' | 'timestamp'>) => {
    const newId = Math.max(...appState.reports.map(r => r.id), 0) + 1;
    
    // Generate sequential ID using generateNextId
    const referenceId = generateNextId(report.type);
    
    // Generate timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    setAppState(prev => ({
      ...prev,
      reports: [{ ...report, id: newId, referenceId, timestamp }, ...prev.reports]
    }));
  };

  const updateReportStatus = (id: number, status: GlobalReport['status'], note?: string) => {
    setAppState(prev => ({
      ...prev,
      reports: prev.reports.map(r =>
        r.id === id
          ? { ...r, status, rejectionNote: note }
          : r
      )
    }));
  };

  const updateReport = (id: number, updates: Partial<GlobalReport>) => {
    setAppState(prev => ({
      ...prev,
      reports: prev.reports.map(r =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  };

  const getPreviewId = (type: 'Incident' | 'DAR' | 'Maintenance'): string => {
    // Get the current year (e.g., 2026)
    const currentYear = new Date().getFullYear();
    
    // Define the prefix based on type
    let prefix: string;
    if (type === 'Incident') {
      prefix = 'IR';
    } else if (type === 'Maintenance') {
      prefix = 'MNT';
    } else {
      prefix = 'DAR';
    }
    
    // Filter appState.reports to find all existing IDs matching #PREFIX-YEAR-
    const matchingReports = appState.reports.filter(r => 
      r.referenceId.startsWith(`#${prefix}-${currentYear}-`)
    );
    
    // Extract the sequence numbers from those IDs (the part after the last dash)
    const sequenceNumbers = matchingReports.map(r => {
      const parts = r.referenceId.split('-');
      const lastPart = parts[parts.length - 1];
      return parseInt(lastPart, 10);
    }).filter(num => !isNaN(num));
    
    // Find the maximum number. Defaults to 0 if none exist
    const maxNumber = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    
    // Return the formatted string: #{prefix}-{year}-{max + 1}
    return `#${prefix}-${currentYear}-${maxNumber + 1}`;
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const getActiveGuardCount = () => {
    return appState.activeGuards.filter(g => g.status === 'active').length;
  };

  const getIncidentCount = (status?: IncidentLog['status']) => {
    if (!status) return appState.incidentLogs.length;
    return appState.incidentLogs.filter(i => i.status === status).length;
  };

  const isGuardOnShift = (guardId: number) => {
    return appState.activeGuards.some(g => g.id === guardId);
  };

  const getGuardCurrentSite = (guardId: number) => {
    const guard = appState.activeGuards.find(g => g.id === guardId);
    return guard ? guard.site : null;
  };

  // ============================================================================
  // VAULT DOCUMENT MANAGEMENT ACTIONS
  // ============================================================================

  const addVaultDocument = (doc: Omit<VaultDocument, 'id'>) => {
    const newId = Math.max(...appState.vaultDocuments.map(d => d.id), 0) + 1;
    setAppState(prev => ({
      ...prev,
      vaultDocuments: [{ ...doc, id: newId }, ...prev.vaultDocuments]
    }));
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AppStateContextType = {
    appState,
    currentUser,
    clockInGuard,
    clockOutGuard,
    updateGuardStatus,
    createIncident,
    updateIncident,
    resolveIncident,
    addGuardToRoster,
    updateGuardInRoster,
    removeGuardFromRoster,
    syncReportToGuardVault,
    broadcastVaultEntry,
    clearVaultEntry,
    updateSiteStatus,
    addReport,
    updateReportStatus,
    updateReport,
    getPreviewId,
    getActiveGuardCount,
    getIncidentCount,
    isGuardOnShift,
    getGuardCurrentSite,
    addVaultDocument
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}