import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GUARDS_MASTER_LIST } from '../utils/guardsData';
import { 
  generateReportCode, 
  detectReportTypeFromCode, 
  extractReportCode,
  normalizeReportType,
  getReportVisibility,
  type ReportType as CanonicalReportType
} from '../utils/reportIdentity';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { reportsAPI, incidentsAPI, shiftsAPI, vaultAPI, sitesAPI, syncAPI, packetsAPI } from '../utils/apiClient';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CurrentUser {
  id: number;
  name: string;
  role: string;
  email: string;
  org_id?: string; // Organization ID for multi-tenant filtering
}

// ============================================================================
// ROLE & PERMISSION SYSTEM
// ============================================================================

// Role types for type safety
export type UserRole = 'GUARD' | 'ADMIN' | 'SUPERVISOR';

// Permission helpers
export function normalizeRole(role: string): UserRole {
  const roleUpper = role.toUpperCase();
  if (roleUpper === 'GUARD') return 'GUARD';
  if (roleUpper === 'ADMIN' || roleUpper === 'SUPERVISOR') return 'ADMIN';
  return 'GUARD'; // Default to most restrictive
}

export function canApproveReports(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'ADMIN';
}

export function canEditReport(report: GlobalReport, currentUser: CurrentUser): boolean {
  // Only original author can edit
  const isAuthor = report.author_user_id === currentUser.id || 
                   report.guardName === currentUser.name || 
                   report.createdBy === currentUser.name ||
                   report.createdBy === currentUser.id.toString();
  
  if (!isAuthor) return false;
  
  // Can only edit in DRAFT or REJECTED status
  return report.status === 'draft' || report.status === 'rejected';
}

export function canViewReport(report: GlobalReport, currentUser: CurrentUser): boolean {
  // Admins/supervisors can view all reports
  if (canApproveReports(currentUser.role)) return true;
  
  // Guards can view their own reports
  return report.author_user_id === currentUser.id ||
         report.guardName === currentUser.name || 
         report.createdBy === currentUser.name ||
         report.createdBy === currentUser.id.toString();
}

export function isReportAuthor(report: GlobalReport, currentUser: CurrentUser): boolean {
  return report.author_user_id === currentUser.id ||
         report.guardName === currentUser.name || 
         report.createdBy === currentUser.name ||
         report.createdBy === currentUser.id.toString();
}

// Normalized report type enum
export type ReportType = 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'other';

export interface GlobalReport {
  id: number;
  referenceId: string;
  caseId?: string;
  reportCode: string;              // CANONICAL: Immutable report code (e.g., "DIS-2026-1")
  type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary'; // Legacy field for display
  reportType: ReportType;  // Normalized field for business logic
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';  // Added 'draft' status
  rejectionNote?: string;
  clientName?: string;
  
  // ============================================================================
  // AUTHORSHIP & SUBMISSION TRACKING (IMMUTABLE vs MUTABLE)
  // ============================================================================
  author_user_id: number;         // IMMUTABLE: Original creator, set once on creation, NEVER changes
  author_name: string;            // IMMUTABLE: Original creator's name at time of creation
  createdBy?: string;             // LEGACY: Deprecated, use author_name
  created_at: string;             // IMMUTABLE: UTC timestamp when report was first created
  
  submitted_by_user_id?: number;  // MUTABLE: Who submitted the current version (can change on resubmit)
  submitted_by_name?: string;     // MUTABLE: Name of submitter for current version
  submitted_at?: string;          // MUTABLE: UTC timestamp of most recent submission
  resubmitted_at?: string;        // UTC timestamp of resubmission (if applicable)
  
  org_id?: string; // Organization ID for multi-tenant filtering
  approvedBy?: string;
  approvedByRole?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedByRole?: string;
  rejectedAt?: string;
  // New clean review/decision fields (source of truth)
  decision?: 'APPROVED' | 'REJECTED' | null;
  decision_note?: string;
  reviewed_by_user_id?: number;
  reviewed_by_name?: string;
  reviewed_by_role?: string;
  reviewed_at?: string;
  location?: string;
  attachments?: Array<{ id: number; url: string; name: string }>;
  date?: string;
  time?: string;
  incidentType?: string;
  urgency?: string;
  narrativeOnly?: string;
  actionTaken?: string;
  // Law enforcement fields (incident reports only)
  police_called?: boolean | string; // boolean in new reports, 'Yes'/'No' for backward compat
  pd_case_number?: string;
  // DAR-specific fields
  shiftStart?: string;
  shiftEnd?: string;
  reliefGuard?: string;
  equipmentStatus?: string;
  // Maintenance-specific fields
  maintenanceCategory?: string;
  specificArea?: string;
  assetId?: string;
  // Disciplinary-specific fields
  employeeName?: string;
  violationType?: string;
  disciplineLevel?: string;
  correctiveAction?: string;
  // Revision tracking
  revisionOfReportId?: number;  // Reference to original rejected report if this is a revision
  // Packet tracking
  packet_id?: string;  // ID of client packet this report was sent in (null if not sent)
  sent_at?: string;    // UTC timestamp when packet was sent
  sent_by_user_id?: number;  // User ID who sent the packet
  // Audit trail
  audit_trail?: AuditLogEntry[];
}

// Audit trail entry type
export interface AuditLogEntry {
  id: string;
  action: 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'EDITED' | 'DRAFT_SAVED';
  actor_id: number;
  actor_name: string;
  actor_role: string;
  timestamp: string; // UTC ISO string
  note?: string; // Required for REJECTED, optional for others
  from_status?: string;
  to_status?: string;
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
  reportType: 'DAR' | 'Incident' | 'Disciplinary';
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
  reportType: 'DAR' | 'Incident' | 'Disciplinary';
  site: string;
  category: string; // Vault category: 'Incident Reports' | 'Daily Reports' | 'HR & Internal' | etc.
}

export interface VaultDocument {
  id: number;
  name: string;
  category: 'Incident Reports' | 'Daily Reports' | 'Maintenance' | 'HR & Internal' | 'Internal Ops' | 'Licenses' | 'Certifications' | 'Receipts' | 'Contracts' | 'Client Packets';
  uploadedBy: string;
  date: string;
  size: string;
  status: 'Active' | 'Archived';
  reportReferenceId?: string;
  fileUrl?: string;
}

export interface ScheduledShift {
  id: number;
  guardId: number;
  guardName: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string; // e.g., "Jan 8, 2026"
  startTime: string; // e.g., "08:00 AM"
  endTime: string; // e.g., "04:00 PM"
  site: string; // location/site name
  hours: number;
  status: 'pending' | 'confirmed';
  instructions?: string;
  isOvertime?: boolean;
  isDoubleShift?: boolean;
  assignedBy?: string;
  assignedAt?: string;
}

export interface WeeklyScheduleShift {
  id: number;
  guardId: number;
  guardName: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  hours: number;
  isOvertime?: boolean;
  isDoubleShift?: boolean;
  overtimeApproved?: boolean; // Track if OT has been authorized
}

// Unassigned/Open Shift (not yet assigned to a guard)
export interface UnassignedShift {
  id: number;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  hours: number;
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
  
  // Scheduled Shifts Management
  scheduledShifts: ScheduledShift[];
  
  // Weekly Schedule Data (for Scheduling tab calendar view)
  weeklyScheduleData: WeeklyScheduleShift[];
  
  // Unassigned/Open Shifts (shifts that need to be filled)
  unassignedShifts: UnassignedShift[];
}

interface AppStateContextType {
  appState: AppState;
  currentUser: CurrentUser;
  
  // User Management Actions
  setCurrentUser: (user: CurrentUser) => void;
  
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
  deleteReport: (id: number) => void;  // Delete draft reports
  approveReport: (reportId: number, options?: { notifyGuard?: boolean; updates?: Partial<GlobalReport> }) => void;
  rejectReport: (reportId: number, rejectionNote: string) => void;  // Reject report with reviewer metadata
  getPreviewId: (type: 'Incident' | 'DAR' | 'Maintenance') => string;
  getDraftCounter: () => number;  // Get next draft sequence number
  
  // Computed Values
  getActiveGuardCount: () => number;
  getIncidentCount: (status?: IncidentLog['status']) => number;
  isGuardOnShift: (guardId: number) => boolean;
  getGuardCurrentSite: (guardId: number) => string | null;
  
  // Vault Document Management Actions
  addVaultDocument: (doc: Omit<VaultDocument, 'id'>) => void;
  
  // Scheduled Shifts Management Actions
  addScheduledShift: (shift: Omit<ScheduledShift, 'id'>) => void;
  updateScheduledShift: (shiftId: number, updates: Partial<ScheduledShift>) => void;
  removeScheduledShift: (shiftId: number) => void;
  
  // Weekly Schedule Data Management Actions
  updateWeeklyScheduleShift: (shiftId: number, updates: Partial<WeeklyScheduleShift>) => void;
  addWeeklyScheduleShift: (shift: Omit<WeeklyScheduleShift, 'id'>) => void;
  setWeeklyScheduleData: (shifts: WeeklyScheduleShift[]) => void;
  
  // Unassigned Shifts Management Actions
  addUnassignedShift: (shift: Omit<UnassignedShift, 'id'>) => void;
  removeUnassignedShift: (shiftId: number) => void;
  assignUnassignedShift: (unassignedShiftId: number, guardId: number, guardName: string) => void;
  removeWeeklyScheduleShift: (shiftId: number) => void;
  
  // Data Management Actions
  resetAppData: () => void;
}

// ============================================================================
// INITIAL DATA
// ============================================================================

const initialActiveGuards: ActiveGuard[] = [
  // Only guards from GUARDS_MASTER_LIST can be active
  // Additional guards must be added through Workforce Management tab first
  { id: 1, name: 'John Smith', badgeId: 'BADGE-1024', status: 'active', site: 'Building A', clockInTime: '8:00 AM', location: 'Building A - Main Entrance', initials: 'JS' },
  { id: 2, name: 'Maria Garcia', badgeId: 'BADGE-1025', status: 'active', site: 'Building B', clockInTime: '8:00 AM', location: 'Building B - Parking Lot', initials: 'MG' },
  { id: 4, name: 'Sarah Chen', badgeId: 'BADGE-1027', status: 'active', site: 'Building A', clockInTime: '8:00 AM', location: 'Building A - Security Office', initials: 'SC' },
  { id: 5, name: 'Robert Brown', badgeId: 'BADGE-1028', status: 'active', site: 'Building B', clockInTime: '9:00 AM', location: 'Building B - Loading Dock', initials: 'RB' },
  { id: 6, name: 'Lisa Wang', badgeId: 'BADGE-1029', status: 'active', site: 'Building B', clockInTime: '7:00 AM', location: 'Building B - North Wing', initials: 'LW' },
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

// Initialize roster from centralized guards data
// All guards come from the GUARDS_MASTER_LIST in /utils/guardsData.ts
const initialRoster: RosterGuard[] = GUARDS_MASTER_LIST.map(guard => ({
  id: guard.id,
  name: guard.name,
  badgeId: guard.badgeId,
  role: guard.role,
  phone: guard.phone,
  email: guard.email,
  licenseExpiry: guard.licenseExpiry,
  certExpiry: guard.certExpiry,
  location: guard.location,
  shiftsThisWeek: guard.shiftsThisWeek,
  hoursThisWeek: guard.hoursThisWeek,
  imageUrl: guard.imageUrl,
  isFrozen: guard.isFrozen,
  emergencyContact: guard.emergencyContact,
  emergencyPhone: guard.emergencyPhone,
  dateOfHire: guard.dateOfHire,
  roleClassification: guard.roleClassification,
  primarySite: guard.primarySite,
  securityGuardCard: guard.securityGuardCard,
  employeeHistory: []
}));

const initialSites: SiteData[] = [
  {
    id: 2,
    name: 'Building B',
    status: 'critical',
    statusText: 'CRITICAL - SOS Triggered',
    activeGuards: 3,
    guards: [
      // Only guards from GUARDS_MASTER_LIST
      { id: 2, name: 'Maria Garcia', initials: 'MG' },
      { id: 5, name: 'Robert Brown', initials: 'RB' },
      { id: 6, name: 'Lisa Wang', initials: 'LW' }
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
    activeGuards: 2,
    guards: [
      // Only guards from GUARDS_MASTER_LIST
      { id: 1, name: 'John Smith', initials: 'JS' },
      { id: 4, name: 'Sarah Chen', initials: 'SC' }
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

const initialReports: GlobalReport[] = [];

const initialVaultDocuments: VaultDocument[] = [
  // Report-type documents (generated PDFs from system reports)
  {
    id: 1,
    name: 'IR-2026-000001 - Incident Report.pdf',
    category: 'Incident Reports',
    uploadedBy: 'John Smith',
    date: 'Jan 8, 2026',
    size: '2.3 MB',
    status: 'Active',
    reportReferenceId: 'IR-2026-000001', // Links to a system report
    fileUrl: 'reports/IR-2026-000001-incident-report.pdf' // Real storage path
  },
  {
    id: 2,
    name: 'DAR-2026-000015 - Daily Activity Report.pdf',
    category: 'Daily Reports',
    uploadedBy: 'Sarah Chen',
    date: 'Jan 7, 2026',
    size: '1.8 MB',
    status: 'Active',
    reportReferenceId: 'DAR-2026-000015',
    fileUrl: 'reports/DAR-2026-000015-daily-activity-report.pdf'
  },
  {
    id: 3,
    name: 'MNT-2026-000003 - Maintenance Request.pdf',
    category: 'Maintenance',
    uploadedBy: 'Mike Johnson',
    date: 'Jan 6, 2026',
    size: '1.2 MB',
    status: 'Active',
    reportReferenceId: 'MNT-2026-000003',
    fileUrl: 'reports/MNT-2026-000003-maintenance-request.pdf'
  },
  // Uploaded file documents (PDFs and images with storage paths)
  {
    id: 4,
    name: 'Guard License - John Smith.pdf',
    category: 'Licenses',
    uploadedBy: 'Admin',
    date: 'Dec 15, 2025',
    size: '856 KB',
    status: 'Active',
    fileUrl: 'licenses/guard-license-john-smith.pdf' // Has actual storage path
  },
  {
    id: 5,
    name: 'CPR Certification - Sarah Chen.pdf',
    category: 'Certifications',
    uploadedBy: 'HR Department',
    date: 'Nov 20, 2025',
    size: '1.4 MB',
    status: 'Active',
    fileUrl: 'certifications/cpr-cert-sarah-chen.pdf'
  },
  {
    id: 6,
    name: 'DIS-2026-000001 - Disciplinary Report.pdf',
    category: 'HR & Internal',
    uploadedBy: 'Sarah Chen',
    date: 'Jan 5, 2026',
    size: '987 KB',
    status: 'Active',
    reportReferenceId: 'DIS-2026-000001',
    fileUrl: 'reports/DIS-2026-000001-disciplinary-report.pdf'
  }
];

const initialScheduledShifts: ScheduledShift[] = [
  {
    id: 1,
    guardId: 1,
    guardName: 'John Smith',
    dayOfWeek: 'Monday',
    date: 'Jan 5, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the main entrance and lobby.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 2,
    guardId: 1,
    guardName: 'John Smith',
    dayOfWeek: 'Tuesday',
    date: 'Jan 6, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the main entrance and lobby.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 3,
    guardId: 1,
    guardName: 'John Smith',
    dayOfWeek: 'Wednesday',
    date: 'Jan 7, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the main entrance and lobby.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 4,
    guardId: 1,
    guardName: 'John Smith',
    dayOfWeek: 'Thursday',
    date: 'Jan 8, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the main entrance and lobby.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 5,
    guardId: 1,
    guardName: 'John Smith',
    dayOfWeek: 'Friday',
    date: 'Jan 9, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the main entrance and lobby.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 6,
    guardId: 2,
    guardName: 'Maria Garcia',
    dayOfWeek: 'Monday',
    date: 'Jan 5, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the parking lot and loading dock.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 7,
    guardId: 2,
    guardName: 'Maria Garcia',
    dayOfWeek: 'Tuesday',
    date: 'Jan 6, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the parking lot and loading dock.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 8,
    guardId: 2,
    guardName: 'Maria Garcia',
    dayOfWeek: 'Wednesday',
    date: 'Jan 7, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the parking lot and loading dock.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 9,
    guardId: 2,
    guardName: 'Maria Garcia',
    dayOfWeek: 'Thursday',
    date: 'Jan 8, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the parking lot and loading dock.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 10,
    guardId: 2,
    guardName: 'Maria Garcia',
    dayOfWeek: 'Friday',
    date: 'Jan 9, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Patrol the parking lot and loading dock.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 11,
    guardId: 2,
    guardName: 'Maria Garcia',
    dayOfWeek: 'Saturday',
    date: 'Jan 10, 2026',
    startTime: '08:00 AM',
    endTime: '08:00 PM',
    site: 'Building B',
    hours: 12,
    status: 'pending',
    instructions: 'Extended shift - overtime.',
    isOvertime: true,
    isDoubleShift: true,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 12,
    guardId: 3,
    guardName: 'David Lee',
    dayOfWeek: 'Monday',
    date: 'Jan 5, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building C',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening patrol.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 13,
    guardId: 3,
    guardName: 'David Lee',
    dayOfWeek: 'Tuesday',
    date: 'Jan 6, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building C',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening patrol.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 14,
    guardId: 3,
    guardName: 'David Lee',
    dayOfWeek: 'Wednesday',
    date: 'Jan 7, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building C',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening patrol.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 15,
    guardId: 3,
    guardName: 'David Lee',
    dayOfWeek: 'Thursday',
    date: 'Jan 8, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building C',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening patrol.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 16,
    guardId: 4,
    guardName: 'Sarah Chen',
    dayOfWeek: 'Monday',
    date: 'Jan 5, 2026',
    startTime: '12:00 AM',
    endTime: '08:00 AM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Night shift - security office.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 17,
    guardId: 4,
    guardName: 'Sarah Chen',
    dayOfWeek: 'Tuesday',
    date: 'Jan 6, 2026',
    startTime: '12:00 AM',
    endTime: '08:00 AM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Night shift - security office.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 18,
    guardId: 4,
    guardName: 'Sarah Chen',
    dayOfWeek: 'Wednesday',
    date: 'Jan 7, 2026',
    startTime: '12:00 AM',
    endTime: '08:00 AM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Night shift - security office.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 19,
    guardId: 4,
    guardName: 'Sarah Chen',
    dayOfWeek: 'Thursday',
    date: 'Jan 8, 2026',
    startTime: '12:00 AM',
    endTime: '08:00 AM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Night shift - security office.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 20,
    guardId: 4,
    guardName: 'Sarah Chen',
    dayOfWeek: 'Friday',
    date: 'Jan 9, 2026',
    startTime: '12:00 AM',
    endTime: '08:00 AM',
    site: 'Building A',
    hours: 8,
    status: 'confirmed',
    instructions: 'Night shift - security office.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 21,
    guardId: 5,
    guardName: 'Robert Brown',
    dayOfWeek: 'Monday',
    date: 'Jan 5, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building D',
    hours: 8,
    status: 'confirmed',
    instructions: 'Loading dock patrol.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 22,
    guardId: 5,
    guardName: 'Robert Brown',
    dayOfWeek: 'Wednesday',
    date: 'Jan 7, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building D',
    hours: 8,
    status: 'confirmed',
    instructions: 'Loading dock patrol.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 23,
    guardId: 5,
    guardName: 'Robert Brown',
    dayOfWeek: 'Friday',
    date: 'Jan 9, 2026',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    site: 'Building D',
    hours: 8,
    status: 'confirmed',
    instructions: 'Loading dock patrol.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 24,
    guardId: 6,
    guardName: 'Lisa Wang',
    dayOfWeek: 'Tuesday',
    date: 'Jan 6, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening shift - north wing.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 25,
    guardId: 6,
    guardName: 'Lisa Wang',
    dayOfWeek: 'Wednesday',
    date: 'Jan 7, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening shift - north wing.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 26,
    guardId: 6,
    guardName: 'Lisa Wang',
    dayOfWeek: 'Friday',
    date: 'Jan 9, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening shift - north wing.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  },
  {
    id: 27,
    guardId: 6,
    guardName: 'Lisa Wang',
    dayOfWeek: 'Saturday',
    date: 'Jan 10, 2026',
    startTime: '04:00 PM',
    endTime: '12:00 AM',
    site: 'Building B',
    hours: 8,
    status: 'confirmed',
    instructions: 'Evening shift - north wing.',
    isOvertime: false,
    isDoubleShift: false,
    assignedBy: 'Sarah Chen',
    assignedAt: 'Jan 4, 2026 10:00 AM'
  }
];

const initialWeeklyScheduleData: WeeklyScheduleShift[] = [
  // Maria Garcia - 48 hours (OVERTIME RISK on Saturday)
  { id: 1, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Monday', date: 'Jan 5', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 2, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Tuesday', date: 'Jan 6', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 3, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Wednesday', date: 'Jan 7', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 4, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Thursday', date: 'Jan 8', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 5, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Friday', date: 'Jan 9', startTime: '08:00', endTime: '16:00', location: 'Building B', hours: 8 },
  { id: 6, guardId: 2, guardName: 'Maria Garcia', dayOfWeek: 'Saturday', date: 'Jan 10', startTime: '08:00', endTime: '20:00', location: 'Building B', hours: 12, isOvertime: true, isDoubleShift: true },
  
  // John Smith - 40 hours (STANDARD)
  { id: 7, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Monday', date: 'Jan 5', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 8, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Tuesday', date: 'Jan 6', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 9, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Wednesday', date: 'Jan 7', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 10, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Thursday', date: 'Jan 8', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  { id: 11, guardId: 1, guardName: 'John Smith', dayOfWeek: 'Friday', date: 'Jan 9', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
  
  // David Lee - 32 hours (UNDER-UTILIZED)
  { id: 12, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Monday', date: 'Jan 5', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 13, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Tuesday', date: 'Jan 6', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 14, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Wednesday', date: 'Jan 7', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 15, guardId: 3, guardName: 'David Lee', dayOfWeek: 'Thursday', date: 'Jan 8', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  
  // Sarah Chen - 40 hours (STANDARD)
  { id: 16, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Monday', date: 'Jan 5', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 17, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Tuesday', date: 'Jan 6', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 18, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Wednesday', date: 'Jan 7', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 19, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Thursday', date: 'Jan 8', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  { id: 20, guardId: 4, guardName: 'Sarah Chen', dayOfWeek: 'Friday', date: 'Jan 9', startTime: '00:00', endTime: '08:00', location: 'Building A', hours: 8 },
  
  // Robert Brown - 24 hours (PART-TIME)
  { id: 21, guardId: 5, guardName: 'Robert Brown', dayOfWeek: 'Monday', date: 'Jan 5', startTime: '08:00', endTime: '16:00', location: 'Building D', hours: 8 },
  { id: 22, guardId: 5, guardName: 'Robert Brown', dayOfWeek: 'Wednesday', date: 'Jan 7', startTime: '08:00', endTime: '16:00', location: 'Building D', hours: 8 },
  { id: 23, guardId: 5, guardName: 'Robert Brown', dayOfWeek: 'Friday', date: 'Jan 9', startTime: '08:00', endTime: '16:00', location: 'Building D', hours: 8 },
  
  // Lisa Wang - 32 hours (STANDARD)
  { id: 24, guardId: 6, guardName: 'Lisa Wang', dayOfWeek: 'Tuesday', date: 'Jan 6', startTime: '16:00', endTime: '00:00', location: 'Building B', hours: 8 },
  { id: 25, guardId: 6, guardName: 'Lisa Wang', dayOfWeek: 'Wednesday', date: 'Jan 7', startTime: '16:00', endTime: '00:00', location: 'Building B', hours: 8 },
  { id: 26, guardId: 6, guardName: 'Lisa Wang', dayOfWeek: 'Friday', date: 'Jan 9', startTime: '16:00', endTime: '00:00', location: 'Building B', hours: 8 },
  { id: 27, guardId: 6, guardName: 'Lisa Wang', dayOfWeek: 'Saturday', date: 'Jan 10', startTime: '16:00', endTime: '00:00', location: 'Building B', hours: 8 },
];

const initialUnassignedShifts: UnassignedShift[] = [
  { id: 101, dayOfWeek: 'Friday', date: 'Jan 2', startTime: '16:00', endTime: '00:00', location: 'Building C', hours: 8 },
  { id: 102, dayOfWeek: 'Saturday', date: 'Jan 3', startTime: '08:00', endTime: '16:00', location: 'Building A', hours: 8 },
];

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // ============================================================================
  // STATE INITIALIZATION - Start with empty/initial state, then fetch from server
  // ============================================================================
  const getInitialState = (): AppState => {
    return {
      activeGuards: initialActiveGuards,
      incidentLogs: [],
      roster: initialRoster,
      sites: [],
      newVaultEntry: false,
      latestReportData: null,
      reports: [],
      vaultDocuments: [],
      scheduledShifts: [],
      weeklyScheduleData: initialWeeklyScheduleData,
      unassignedShifts: initialUnassignedShifts
    };
  };

  const loadPersistedUser = (): CurrentUser => {
    try {
      const savedUser = localStorage.getItem('guardUpCurrentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        console.log('[AppState] Loaded persisted user from localStorage:', parsed.name);
        return parsed;
      }
    } catch (error) {
      console.error('[AppState] Failed to load persisted user:', error);
    }
    
    // Return default user if no saved user exists
    return {
      id: 55,
      name: 'Sarah Chen',
      role: 'Supervisor',
      email: 'sarah.chen@guardupmatrix.com',
      org_id: 'default_org' // Default organization for MVP
    };
  };

  const [appState, setAppState] = useState<AppState>(getInitialState());
  const [currentUser, setCurrentUser] = useState<CurrentUser>(loadPersistedUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ============================================================================
  // AUDIT TRAIL HELPER
  // ============================================================================
  const addAuditLogEntry = (
    report: GlobalReport,
    action: AuditLogEntry['action'],
    note?: string,
    from_status?: string,
    to_status?: string
  ): GlobalReport => {
    const entry: AuditLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      actor_id: currentUser.id,
      actor_name: currentUser.name,
      actor_role: currentUser.role,
      timestamp: new Date().toISOString(),
      note,
      from_status,
      to_status
    };

    return {
      ...report,
      audit_trail: [...(report.audit_trail || []), entry]
    };
  };

  // ============================================================================
  // DATA SYNCHRONIZATION - Fetch data from server on mount and poll for updates
  // ============================================================================
  useEffect(() => {
    const fetchDataFromServer = async () => {
      try {
        console.log('[AppState] Fetching data from server...');
        const serverData = await syncAPI.fetchAll();
        
        setAppState(prev => ({
          ...prev,
          reports: serverData.reports,
          incidentLogs: serverData.incidents,
          vaultDocuments: serverData.vaultDocuments,
          sites: serverData.sites,
          scheduledShifts: serverData.shifts
        }));
        
        console.log('[AppState] Successfully loaded data from server:', {
          reports: serverData.reports.length,
          incidents: serverData.incidents.length,
          shifts: serverData.shifts.length,
          vaultDocs: serverData.vaultDocuments.length,
          sites: serverData.sites.length
        });
      } catch (error) {
        console.error('[AppState] Failed to fetch data from server:', error);
        if (isLoading) {
          toast.error('Failed to load data from server. Using local data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchDataFromServer();
    
    // Poll for updates every 30 seconds
    const syncInterval = setInterval(() => {
      fetchDataFromServer();
    }, 30000); // 30 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(syncInterval);
  }, []);

  // ============================================================================
  // USER PERSISTENCE - Save current user to localStorage
  // ============================================================================
  useEffect(() => {
    try {
      localStorage.setItem('guardUpCurrentUser', JSON.stringify(currentUser));
      console.log('[AppState] Persisted current user to localStorage:', currentUser.name);
    } catch (error) {
      console.error('[AppState] Failed to persist user:', error);
    }
  }, [currentUser]);

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

  // Helper function to send incident alert email
  const sendIncidentAlertEmail = async (incidentData: {
    incidentId: string;
    incidentType: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    siteName: string;
    location: string;
    reportedBy: string;
    timestamp: string;
    summary: string;
    actionTaken?: string;
  }) => {
    try {
      // TODO: Replace with actual supervisor emails from database/config
      const supervisorEmails = ['supervisor@guardupinc.com', 'operations@guardupinc.com'];
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e7fd76e8/email/send-incident-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          supervisorEmails,
          ...incidentData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send incident alert');
      }

      return await response.json();
    } catch (error) {
      console.error('Incident alert email error:', error);
      throw error;
    }
  };

  const createIncident = async (incident: Omit<IncidentLog, 'id'>) => {
    try {
      // Create incident via API
      const response = await incidentsAPI.create(incident);
      
      if (response.success && response.incident) {
        // Update local state with the incident from server
        setAppState(prev => ({
          ...prev,
          incidentLogs: [response.incident, ...prev.incidentLogs]
        }));
        
        console.log('[Incident Creation] Successfully created incident:', response.incident.id);
        return;
      }
    } catch (error) {
      console.error('[Incident Creation] Error creating incident:', error);
      toast.error('Failed to create incident. Using local fallback.');
    }
    
    // FALLBACK: Local creation if API fails
    const newId = Math.max(...appState.incidentLogs.map(i => i.id), 0) + 1;
    const newIncident = { ...incident, id: newId };
    
    setAppState(prev => ({
      ...prev,
      incidentLogs: [newIncident, ...prev.incidentLogs]
    }));
    
    // Send email alert for high-priority incidents (critical or high severity)
    if (incident.severity === 'critical' || incident.severity === 'high') {
      sendIncidentAlertEmail({
        incidentId: `#IR-${newId}`,
        incidentType: incident.type || 'Security Incident',
        severity: incident.severity,
        siteName: incident.location || 'Unknown Site',
        location: incident.location || 'Not specified',
        reportedBy: incident.reportedBy || 'Security Guard',
        timestamp: new Date().toLocaleString(),
        summary: incident.description || 'No description provided',
        actionTaken: incident.notes
      }).catch(error => {
        console.error('Failed to send incident alert email:', error);
        // Don't block incident creation if email fails
      });
    }
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
    
    const maxNumber = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    
    // Return the formatted string: #{prefix}-{year}-{max + 1}
    return `#${prefix}-${currentYear}-${maxNumber + 1}`;
  };

  const addReport = async (report: Omit<GlobalReport, 'id' | 'referenceId' | 'timestamp'>) => {
    try {
      // Normalize reportType from legacy type field
      const reportType: ReportType = report.reportType || normalizeReportType(report.type);
      
      // Prepare report data for API (server will generate ID and reportCode)
      const now = new Date().toISOString();
      const reportData = {
        ...report,
        reportType,
        status: report.status || 'pending',
        // IMMUTABLE AUTHOR FIELDS (set once, never change)
        author_user_id: currentUser.id,
        author_name: currentUser.name,
        created_at: now,
        // SUBMISSION TRACKING (can change on resubmit)
        submitted_by_user_id: currentUser.id,
        submitted_by_name: currentUser.name,
        submitted_at: now,
        // Legacy field for backward compatibility
        createdBy: report.createdBy || currentUser.name
      };
      
      console.log('[Report Creation] Sending report to server:', reportData);
      
      // Create report via API
      const response = await reportsAPI.create(reportData);
      
      if (response.success && response.report) {
        // Add audit trail entry for report creation/submission
        const action = report.status === 'draft' ? 'DRAFT_SAVED' : 'SUBMITTED';
        const reportWithAudit = addAuditLogEntry(
          response.report,
          action,
          undefined,
          undefined,
          report.status || 'pending'
        );
        
        // Update local state with the report from server
        setAppState(prev => ({
          ...prev,
          reports: [reportWithAudit, ...prev.reports]
        }));
        
        console.log('[Report Creation] Successfully created report:', response.report.reportCode);
        toast.success(`Report ${response.report.reportCode} created successfully`);
        
        return reportWithAudit;
      } else {
        throw new Error('Failed to create report');
      }
    } catch (error) {
      console.error('[Report Creation] Error creating report:', error);
      toast.error('Failed to create report. Please try again.');
      
      // Fallback to local creation if server fails
      return addReportLocal(report);
    }
  };
  
  // Fallback local report creation (used when server is unavailable)
  const addReportLocal = (report: Omit<GlobalReport, 'id' | 'referenceId' | 'timestamp'>) => {
    const newId = Math.max(...appState.reports.map(r => r.id), 0) + 1;
    
    // ============================================================================
    // CANONICAL REPORT CODE GENERATION (Single Write-Path)
    // ============================================================================
    
    // 1. Normalize reportType from legacy type field
    let reportType: ReportType = report.reportType || normalizeReportType(report.type);
    
    // 2. Determine sequence number for this report type
    const currentYear = new Date().getFullYear();
    const existingReportsOfType = appState.reports.filter(r => r.reportType === reportType);
    
    // Extract sequence numbers from existing reportCodes
    const sequenceNumbers = existingReportsOfType
      .map(r => {
        if (!r.reportCode) return 0;
        const parts = r.reportCode.split('-');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart, 10) || 0;
      })
      .filter(num => !isNaN(num) && num > 0);
    
    const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    const nextSequence = maxSequence + 1;
    
    // 3. Generate IMMUTABLE canonical reportCode
    // If caller provides reportCode (e.g., from legacy disciplinaryCaseId), preserve it
    let reportCode: string;
    if (report.reportCode && report.reportCode.trim()) {
      // Preserve pre-existing code (e.g., from disciplinary form's caseId)
      reportCode = report.reportCode.replace(/^#/, ''); // Strip # prefix if present
      console.log(`[Report Identity] Preserving existing reportCode: ${reportCode}`);
    } else if (report.caseId && report.caseId.trim()) {
      // Fallback: use caseId if reportCode not provided
      reportCode = report.caseId.replace(/^#/, '');
      console.log(`[Report Identity] Using caseId as reportCode: ${reportCode}`);
    } else {
      // Generate new canonical code
      reportCode = generateReportCode(reportType, nextSequence);
      console.log(`[Report Identity] Generated new reportCode: ${reportCode} for type: ${reportType}`);
    }
    
    // 4. Runtime Invariant Check: Verify reportCode matches reportType
    const codePrefix = reportCode.split('-')[0].toUpperCase();
    const expectedPrefixes: Record<ReportType, string[]> = {
      disciplinary: ['DIS'],
      dar: ['DAR'],
      incident: ['INC', 'IR'], // IR is legacy prefix
      maintenance: ['MNT'],
      shift_pass_on: ['SPO'],
      other: ['OTH']
    };
    
    const validPrefixes = expectedPrefixes[reportType] || [];
    if (!validPrefixes.includes(codePrefix)) {
      console.warn(
        `[Report Identity] INVARIANT VIOLATION: reportType="${reportType}" ` +
        `but reportCode="${reportCode}" starts with "${codePrefix}". ` +
        `Expected one of: ${validPrefixes.join(', ')}. Auto-correcting...`
      );
      // Auto-correct by generating proper code
      reportCode = generateReportCode(reportType, nextSequence);
    }
    
    // 5. Generate legacy referenceId for backward compatibility
    const referenceId = generateNextId(report.type);
    
    // 6. Generate timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // 7. Persist report with IMMUTABLE reportCode
    const now = new Date().toISOString();
    const newReport = { 
      ...report, 
      id: newId, 
      referenceId, 
      reportCode,  // CANONICAL: Never recompute this
      timestamp, 
      reportType,
      // IMMUTABLE AUTHOR FIELDS (set once, never change)
      author_user_id: currentUser.id,
      author_name: currentUser.name,
      created_at: now,
      // SUBMISSION TRACKING (can change on resubmit)
      submitted_by_user_id: currentUser.id,
      submitted_by_name: currentUser.name,
      submitted_at: now,
      // Legacy field for backward compatibility
      createdBy: report.createdBy || currentUser.name
    };
    
    setAppState(prev => ({
      ...prev,
      reports: [newReport, ...prev.reports]
    }));
    
    console.log(
      `[Report Identity] Created report ID=${newId} ` +
      `type=${reportType} code=${reportCode} ref=${referenceId}`
    );
    
    // Send email alert for high-priority incident reports
    if (reportType === 'incident' && (report.priority === 'high' || report.urgency === 'Critical')) {
      sendIncidentAlertEmail({
        incidentId: `#${reportCode}`,
        incidentType: report.incidentType || 'Security Incident',
        severity: report.urgency === 'Critical' ? 'critical' : 'high',
        siteName: report.site || 'Unknown Site',
        location: report.location || 'Not specified',
        reportedBy: report.guardName || 'Security Guard',
        timestamp: timestamp,
        summary: report.content || 'No description provided',
        actionTaken: report.actionTaken
      }).catch(error => {
        console.error('Failed to send incident alert email:', error);
        // Don't block report creation if email fails
      });
    }

    // Notify admins/supervisors when a guard submits a new report (status: pending)
    if (report.status === 'pending' && currentUser.role !== 'Admin' && currentUser.role !== 'Supervisor') {
      toast.info('New Report Submitted', {
        description: `${report.guardName} submitted a ${report.type} report (${reportCode}) for review.`,
        duration: 5000,
      });
    }
  };

  const updateReportStatus = (id: number, status: GlobalReport['status'], note?: string) => {
    // Find the report to get guard info before updating
    const report = appState.reports.find(r => r.id === id);
    
    setAppState(prev => ({
      ...prev,
      reports: prev.reports.map(r =>
        r.id === id
          ? { ...r, status, rejectionNote: note }
          : r
      )
    }));

    // Send push notification to guard when status changes
    if (report && report.guardName) {
      let notificationMessage = '';
      let notificationTitle = '';
      
      if (status === 'approved') {
        notificationTitle = 'Report Approved ✓';
        notificationMessage = `Your ${report.type} report (${report.caseId || report.reportCode}) has been approved!`;
      } else if (status === 'rejected') {
        notificationTitle = 'Report Needs Revision';
        notificationMessage = `Your ${report.type} report (${report.caseId || report.reportCode}) requires changes. ${note ? `Note: ${note}` : ''}`;
      } else if (status === 'sent') {
        notificationTitle = 'Report Sent to Client';
        notificationMessage = `Your ${report.type} report (${report.caseId || report.reportCode}) has been sent to the client.`;
      }

      // Display toast notification if the current user is the guard who submitted the report
      if (currentUser.role === 'Guard' && currentUser.name === report.guardName && notificationMessage) {
        toast.success(notificationTitle, {
          description: notificationMessage,
          duration: 5000,
        });
      }
    }
  };

  const updateReport = async (id: number, updates: Partial<GlobalReport>) => {
    // Get current report for audit trail
    const currentReport = appState.reports.find(r => r.id === id);
    
    try {
      // Check if this is a resubmission (rejected → pending)
      const isResubmission = currentReport && 
                             currentReport.status === 'rejected' && 
                             updates.status === 'pending';
      
      // Prepare updates with proper submission tracking
      const now = new Date().toISOString();
      const finalUpdates = {
        ...updates,
        // PRESERVE IMMUTABLE AUTHOR FIELDS (never overwrite)
        author_user_id: currentReport?.author_user_id,
        author_name: currentReport?.author_name,
        created_at: currentReport?.created_at,
        // UPDATE SUBMISSION TRACKING on resubmit
        ...(isResubmission && {
          submitted_by_user_id: currentUser.id,
          submitted_by_name: currentUser.name,
          submitted_at: now,
          resubmitted_at: now
        })
      };
      
      // Update report via API
      const response = await reportsAPI.update(id, finalUpdates);
      
      if (response.success && response.report) {
        let updatedReport = response.report;
        
        if (isResubmission) {
          // Add RESUBMITTED audit trail entry
          updatedReport = addAuditLogEntry(
            response.report,
            'RESUBMITTED',
            undefined,
            'rejected',
            'pending'
          );
        } else if (currentReport && updates.status && currentReport.status !== updates.status) {
          // Track other status changes
          updatedReport = addAuditLogEntry(
            response.report,
            'EDITED',
            'Status changed',
            currentReport.status,
            updates.status
          );
        }
        
        // Update local state with the updated report from server
        setAppState(prev => ({
          ...prev,
          reports: prev.reports.map(r =>
            r.id === id ? updatedReport : r
          )
        }));
        
        console.log('[Report Update] Successfully updated report:', id);
      }
    } catch (error) {
      console.error('[Report Update] Error updating report:', error);
      toast.error('Failed to update report');
      
      // Check if this is a resubmission (rejected → pending)
      const isResubmission = currentReport && 
                             currentReport.status === 'rejected' && 
                             updates.status === 'pending';
      
      const now = new Date().toISOString();
      
      // Fallback to local update with audit trail
      let updatedReport = currentReport ? { 
        ...currentReport, 
        ...updates,
        // PRESERVE IMMUTABLE AUTHOR FIELDS
        author_user_id: currentReport.author_user_id,
        author_name: currentReport.author_name,
        created_at: currentReport.created_at,
        // UPDATE SUBMISSION TRACKING on resubmit
        ...(isResubmission && {
          submitted_by_user_id: currentUser.id,
          submitted_by_name: currentUser.name,
          submitted_at: now,
          resubmitted_at: now
        })
      } : updates;
      
      if (isResubmission) {
        updatedReport = addAuditLogEntry(
          updatedReport as GlobalReport,
          'RESUBMITTED',
          undefined,
          'rejected',
          'pending'
        );
      }
      
      setAppState(prev => ({
        ...prev,
        reports: prev.reports.map(r =>
          r.id === id ? updatedReport : r
        )
      }));
    }
  };

  const deleteReport = async (id: number) => {
    try {
      // Delete report via API
      const response = await reportsAPI.delete(id);
      
      if (response.success) {
        // Remove from local state
        setAppState(prev => ({
          ...prev,
          reports: prev.reports.filter(r => r.id !== id)
        }));
        
        console.log('[Report Delete] Successfully deleted draft:', id);
      }
    } catch (error) {
      console.error('[Report Delete] Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const getDraftCounter = () => {
    // Get all existing drafts and find the highest sequence number
    const draftReports = appState.reports.filter(r => r.status === 'draft' && r.reportCode?.startsWith('DRAFT-'));
    
    if (draftReports.length === 0) {
      return 1; // Start from 1 if no drafts exist
    }
    
    const sequenceNumbers = draftReports.map(r => {
      const parts = r.reportCode.split('-');
      return parseInt(parts[1], 10);
    }).filter(num => !isNaN(num));
    
    const maxNumber = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    return maxNumber + 1;
  };

  // ============================================================================
  // CANONICAL REPORT APPROVAL & VAULT FILING SYSTEM
  // ============================================================================
  
  /**
   * DEPRECATED: Client-side vault filing has been moved to server-side only.
   * This function is kept for reference but should NOT be called.
   * The server's /reports/:id/approve endpoint handles vault creation.
   * 
   * @deprecated Use server-side fileReportToVault in api-routes.tsx instead
   */
  const fileReportToVault_DEPRECATED_DO_NOT_USE = (report: GlobalReport) => {
    const { reportCode, reportType, type, guardName, site, timestamp } = report;
    
    // ============================================================================
    // DEFENSIVE CHECK: Validate reportCode matches reportType
    // ============================================================================
    if (reportType === 'disciplinary' && !reportCode.startsWith('DIS-')) {
      console.warn(
        `⚠️ CRITICAL: Disciplinary report has mismatched reportCode!\n` +
        `Expected: DIS-*, Got: ${reportCode}\n` +
        `Report ID: ${report.id}, Type: ${type}\n` +
        `Auto-correcting vault filing...`
      );
    }
    
    // ============================================================================
    // VAULT CATEGORIZATION: Map reportType to vault category & filename
    // ============================================================================
    let vaultCategory: VaultDocument['category'];
    let reportTypeName: string;
    
    switch (reportType) {
      case 'disciplinary':
        vaultCategory = 'HR & Internal';
        reportTypeName = 'Disciplinary Report';
        break;
      
      case 'incident':
        vaultCategory = 'Incident Reports';
        reportTypeName = 'Incident Report';
        break;
      
      case 'dar':
        vaultCategory = 'Daily Reports';
        reportTypeName = 'Daily Activity Report';
        break;
      
      case 'maintenance':
        vaultCategory = 'Maintenance';
        reportTypeName = 'Maintenance Request';
        break;
      
      case 'shift_pass_on':
        vaultCategory = 'Internal Ops';
        reportTypeName = 'Shift Pass-On Log';
        break;
      
      default:
        // Fallback for 'other' or undefined types
        vaultCategory = 'HR & Internal';
        reportTypeName = 'Report';
        console.warn(`Unknown report type: ${reportType}, filing to HR & Internal`);
    }
    
    // Generate standardized filename using canonical function
    // Format: "{CASE_ID} - {REPORT_TYPE}.pdf" (e.g., "IR-2026-000020 - Incident Report.pdf")
    const documentName = generateVaultFilename(reportCode, reportType);
    
    // ============================================================================
    // SYNC TO GUARD EMPLOYEE HISTORY VAULT
    // ============================================================================
    // Skip guard vault sync for operational logs (shift pass-on)
    if (reportType !== 'shift_pass_on') {
      syncReportToGuardVault(guardName, {
        reportId: reportCode,
        reportType: type,
        status: 'approved',
        approvedBy: report.approvedBy || 'System',
        approvedAt: report.approvedAt || new Date().toLocaleString('en-US'),
        site: site,
        timestamp: timestamp
      });
    }
    
    // ============================================================================
    // BROADCAST GLOBAL VAULT ENTRY
    // ============================================================================
    broadcastVaultEntry({
      name: `${reportTypeName} ${reportCode}`,
      user: guardName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active',
      reportId: reportCode,
      reportType: type,
      site: site,
      category: vaultCategory
    });
    
    // ============================================================================
    // ADD DOCUMENT TO VAULT
    // ============================================================================
    // Extract approver name from report (e.g., "by Supervisor Sarah Chen" -> "Sarah Chen")
    const approverName = report.approvedBy 
      ? report.approvedBy.replace(/^by\s+(Supervisor|Manager|Admin)\s+/, '') 
      : currentUser.name;
    
    addVaultDocument({
      name: documentName,
      category: vaultCategory,
      uploadedBy: approverName, // Use approving admin, not the guard
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: '1.8 MB', // Mock size
      status: 'Active',
      reportReferenceId: reportCode
    });
    
    console.log(
      `[Vault Filing] Filed ${reportTypeName} ${reportCode} to ${vaultCategory}\n` +
      `Document: ${documentName}\n` +
      `Guard: ${guardName}, Site: ${site}`
    );
  };
  
  /**
   * Canonical approval function - SINGLE SOURCE OF TRUTH for report approval.
   * All UI surfaces (list, modal, batch) must call this function.
   * 
   * INVARIANTS:
   * - Only this function can approve/finalize reports
   * - Vault filing always uses canonical reportCode (never regenerated)
   * - Disciplinary reports are always internal-only (never sent to clients)
   */
  const approveReport = async (
    reportId: number, 
    options?: { 
      notifyGuard?: boolean;
      updates?: Partial<GlobalReport>;
    }
  ) => {
    // Find the canonical report from global state
    const report = appState.reports.find(r => r.id === reportId);
    
    if (!report) {
      console.error(`Cannot approve report: Report ${reportId} not found`);
      toast.error('Report not found');
      return;
    }
    
    // ============================================================================
    // CRITICAL DEBUG: Verify currentUser is the reviewer (Admin/Supervisor), NOT the guard
    // ============================================================================
    console.log('🔍 [AppStateContext.approveReport] REVIEWER CHECK:');
    console.log('   Current User (REVIEWER):', {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      email: currentUser.email
    });
    console.log('   Report Author (GUARD):', {
      guardName: report.guardName,
      createdBy: report.createdBy
    });
    
    // VALIDATION: Prevent guards from approving (server-side + client-side)
    if (!canApproveReports(currentUser.role)) {
      console.error('❌ FATAL: User role cannot approve reports!');
      toast.error('Permission denied: Only Admin/Supervisor can approve reports');
      return;
    }
    
    // VALIDATION: Report must be in PENDING status
    if (report.status !== 'pending') {
      console.error('❌ Cannot approve report: Report is not in PENDING status');
      toast.error(`Cannot approve report: Status is ${report.status.toUpperCase()}`);
      return;
    }
    
    // Create reviewer metadata from current authenticated user
    const time = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    
    const signature = `by ${currentUser.role} ${currentUser.name}`;
    
    console.log('   Reviewer Signature:', signature);
    console.log('   Expected in UI: "Approved • ' + signature + ' • ' + time + '"');
    
    try {
      // Approve report via API with reviewer metadata from client
      const response = await reportsAPI.approve(reportId, {
        notifyGuard: options?.notifyGuard,
        updates: options?.updates,
        // Pass reviewer metadata from client (currentUser is the real logged-in user)
        reviewerName: currentUser.name,
        reviewerRole: currentUser.role,
        reviewerId: currentUser.id
      });
      
      if (response.success && response.report) {
        // Add audit trail entry to approved report
        const approvedReportWithAudit = addAuditLogEntry(
          response.report,
          'APPROVED',
          undefined,
          'pending',
          'approved'
        );
        
        // Update local state with approved report from server
        setAppState(prev => ({
          ...prev,
          reports: prev.reports.map(r =>
            r.id === reportId ? approvedReportWithAudit : r
          )
        }));
        
        // ============================================================================
        // VAULT FILING: Server has already filed to vault - no client action needed
        // ============================================================================
        // The server's /reports/:id/approve endpoint calls fileReportToVault()
        // We do NOT call fileReportToVault here to prevent duplicate vault entries
        
        toast.success('Report approved successfully');
        return;
      }
    } catch (error) {
      console.error('[Approval] Error approving report:', error);
      toast.error('Failed to approve report');
      // Continue with fallback local approval
    }
    
    // FALLBACK: Local approval if API fails (use real currentUser, not hardcoded)
    
    // Add audit trail to report
    const reportWithAudit = addAuditLogEntry(
      report,
      'APPROVED',
      undefined,
      report.status,
      'approved'
    );
    
    // Update report status with approval metadata
    const approvalUpdates: Partial<GlobalReport> = {
      ...options?.updates,
      ...reportWithAudit,
      status: 'approved' as const,
      approvedBy: signature,
      approvedByRole: currentUser.role,
      approvedAt: time
    };
    
    updateReport(reportId, approvalUpdates);
    
    // ============================================================================
    // VAULT FILING: In fallback mode, we still skip client-side vault creation
    // ============================================================================
    // The server is the single source of truth for vault documents
    // If this fallback runs, vault may not be updated (acceptable for offline scenarios)
    // When server comes back online, a sync operation can reconcile vault state
    
    // Show success notification
    const reportTypeName = report.type === 'Disciplinary' ? 'Disciplinary Report' :
                           report.type === 'Incident' ? 'Incident Report' :
                           report.type === 'Maintenance' ? 'Maintenance Request' :
                           'Daily Activity Report';
    
    console.log(
      `[Approval] ${reportTypeName} ${report.reportCode} approved\n` +
      `By: ${signature}\n` +
      `At: ${time}\n` +
      `Notify Guard: ${options?.notifyGuard ? 'Yes' : 'No'}`
    );
  };

  const rejectReport = async (reportId: number, rejectionNote: string) => {
    // Find the canonical report from global state
    const report = appState.reports.find(r => r.id === reportId);
    
    if (!report) {
      console.error(`Cannot reject report: Report ${reportId} not found`);
      toast.error('Report not found');
      return;
    }
    
    // VALIDATION: Prevent guards from rejecting (server-side + client-side)
    if (!canApproveReports(currentUser.role)) {
      console.error('❌ FATAL: User role cannot reject reports!');
      toast.error('Permission denied: Only Admin/Supervisor can reject reports');
      return;
    }
    
    // VALIDATION: Report must be in PENDING status
    if (report.status !== 'pending') {
      console.error('❌ Cannot reject report: Report is not in PENDING status');
      toast.error(`Cannot reject report: Status is ${report.status.toUpperCase()}`);
      return;
    }
    
    // VALIDATION: Rejection note is required
    if (!rejectionNote || rejectionNote.trim().length === 0) {
      console.error('❌ Cannot reject report: Rejection note is required');
      toast.error('Rejection note is required');
      return;
    }
    
    console.log('[Rejection] Current authenticated user (reviewer):', {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role
    });
    console.log('[Rejection] Report author (guardName):', report.guardName);
    
    try {
      // Reject report via API with reviewer metadata from client
      const response = await reportsAPI.reject(reportId, rejectionNote, {
        reviewerName: currentUser.name,
        reviewerRole: currentUser.role,
        reviewerId: currentUser.id
      });
      
      if (response.success && response.report) {
        console.log('[Rejection] Server returned rejected report:', {
          reportCode: response.report.reportCode,
          rejectedBy: response.report.rejectedBy,
          rejectedByRole: response.report.rejectedByRole,
          rejectedAt: response.report.rejectedAt
        });
        
        // Add audit trail entry to rejected report
        const rejectedReportWithAudit = addAuditLogEntry(
          response.report,
          'REJECTED',
          rejectionNote,
          'pending',
          'rejected'
        );
        
        // Update local state with rejected report from server
        setAppState(prev => ({
          ...prev,
          reports: prev.reports.map(r =>
            r.id === reportId ? rejectedReportWithAudit : r
          )
        }));
        
        toast.success('Report rejected. Guard will be notified to revise and resubmit.');
        return;
      }
    } catch (error) {
      console.error('[Rejection] Error rejecting report:', error);
      toast.error('Failed to reject report');
      // Continue with fallback local rejection
    }
    
    // FALLBACK: Local rejection if API fails
    const time = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    
    const signature = `by ${currentUser.role} ${currentUser.name}`;
    
    // Add audit trail to report
    const reportWithAudit = addAuditLogEntry(
      report,
      'REJECTED',
      rejectionNote,
      report.status,
      'rejected'
    );
    
    const rejectionUpdates: Partial<GlobalReport> = {
      ...reportWithAudit,
      status: 'rejected' as const,
      rejectionNote,
      rejectedBy: signature,
      rejectedByRole: currentUser.role,
      rejectedAt: time
    };
    
    updateReport(reportId, rejectionUpdates);
    
    console.log(
      `[Rejection] Report ${report.reportCode} rejected\n` +
      `By: ${signature}\n` +
      `At: ${time}\n` +
      `Reason: ${rejectionNote}`
    );
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

  /**
   * Generates standardized vault document filename
   * Format: "{CASE_ID} - {REPORT_TYPE}.pdf"
   * Examples: "IR-2026-000020 - Incident Report.pdf", "DAR-2026-000001 - Daily Activity Report.pdf"
   */
  const generateVaultFilename = (reportCode: string, reportType: ReportType): string => {
    let typeName: string;
    
    switch (reportType) {
      case 'disciplinary':
        typeName = 'Disciplinary Report';
        break;
      case 'incident':
        typeName = 'Incident Report';
        break;
      case 'dar':
        typeName = 'Daily Activity Report';
        break;
      case 'maintenance':
        typeName = 'Maintenance Request';
        break;
      case 'shift_pass_on':
        typeName = 'Shift Pass-On Log';
        break;
      default:
        typeName = 'Report';
    }
    
    return `${reportCode} - ${typeName}.pdf`;
  };

  const addVaultDocument = async (doc: Omit<VaultDocument, 'id'>) => {
    // ============================================================================
    // WARNING: Manual vault document creation (bypasses server-side deduplication)
    // ============================================================================
    // For report approvals, vault documents are automatically created server-side
    // This function should only be used for:
    // - Manual file uploads (non-report documents)
    // - Client Packet bundles
    // - Legacy/fallback scenarios
    console.log('[Vault] Manual vault document creation:', doc.name);
    
    try {
      // Create vault document via API
      const response = await vaultAPI.create(doc);
      
      if (response.success && response.document) {
        // Update local state with the document from server
        setAppState(prev => ({
          ...prev,
          vaultDocuments: [response.document, ...prev.vaultDocuments]
        }));
        
        console.log('[Vault] Successfully created document:', response.document.name);
        return;
      }
    } catch (error) {
      console.error('[Vault] Error creating document:', error);
    }
    
    // FALLBACK: Local creation if API fails
    // ============================================================================
    // UPSERT LOGIC - Prevent duplicates for the same report
    // ============================================================================
    // Check if a vault document already exists for this reportReferenceId
    const existingDocIndex = appState.vaultDocuments.findIndex(
      d => d.reportReferenceId && d.reportReferenceId === doc.reportReferenceId
    );
    
    if (existingDocIndex !== -1) {
      // Update existing document instead of creating a duplicate
      console.log(`[Vault] Updating existing document for ${doc.reportReferenceId}`);
      setAppState(prev => ({
        ...prev,
        vaultDocuments: prev.vaultDocuments.map((vaultDoc, index) =>
          index === existingDocIndex
            ? { ...vaultDoc, ...doc, id: vaultDoc.id } // Preserve existing ID
            : vaultDoc
        )
      }));
    } else {
      // Create new document
      const newId = Math.max(...appState.vaultDocuments.map(d => d.id), 0) + 1;
      console.log(`[Vault] Creating new document for ${doc.reportReferenceId}`);
      setAppState(prev => ({
        ...prev,
        vaultDocuments: [{ ...doc, id: newId }, ...prev.vaultDocuments]
      }));
    }
  };

  // ============================================================================
  // SCHEDULED SHIFTS MANAGEMENT ACTIONS
  // ============================================================================

  const addScheduledShift = (shift: Omit<ScheduledShift, 'id'>) => {
    const newId = Math.max(...appState.scheduledShifts.map(s => s.id), 0) + 1;
    setAppState(prev => ({
      ...prev,
      scheduledShifts: [{ ...shift, id: newId }, ...prev.scheduledShifts]
    }));
  };

  const updateScheduledShift = (shiftId: number, updates: Partial<ScheduledShift>) => {
    setAppState(prev => ({
      ...prev,
      scheduledShifts: prev.scheduledShifts.map(s =>
        s.id === shiftId ? { ...s, ...updates } : s
      )
    }));
  };

  const removeScheduledShift = (shiftId: number) => {
    setAppState(prev => ({
      ...prev,
      scheduledShifts: prev.scheduledShifts.filter(s => s.id !== shiftId)
    }));
  };

  // ============================================================================
  // WEEKLY SCHEDULE DATA MANAGEMENT ACTIONS
  // ============================================================================

  // Helper function to determine shift type from start time
  const getShiftType = (startTime: string): string => {
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 6 && hour < 14) return 'Day Shift';
    if (hour >= 14 && hour < 22) return 'Swing Shift';
    return 'Night Shift';
  };

  // Helper function to send shift notification email
  const sendShiftNotificationEmail = async (data: {
    guardEmail: string;
    guardName: string;
    siteName: string;
    date: string;
    startTime: string;
    endTime: string;
    shiftType?: string;
    specialInstructions?: string;
  }) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e7fd76e8/email/send-shift-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send shift notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Shift notification email error:', error);
      throw error;
    }
  };

  const updateWeeklyScheduleShift = (shiftId: number, updates: Partial<WeeklyScheduleShift>) => {
    setAppState(prev => ({
      ...prev,
      weeklyScheduleData: prev.weeklyScheduleData.map(s =>
        s.id === shiftId ? { ...s, ...updates } : s
      )
    }));
    
    // Send email notification for shift changes
    const updatedShift = appState.weeklyScheduleData.find(s => s.id === shiftId);
    if (updatedShift) {
      const guard = GUARDS_MASTER_LIST.find(g => g.id === updatedShift.guardId);
      if (guard && guard.email) {
        sendShiftNotificationEmail({
          guardEmail: guard.email,
          guardName: updatedShift.guardName,
          siteName: updatedShift.location,
          date: updatedShift.date,
          startTime: updates.startTime || updatedShift.startTime,
          endTime: updates.endTime || updatedShift.endTime,
          shiftType: getShiftType(updates.startTime || updatedShift.startTime),
          specialInstructions: 'Your shift has been updated. Please review the new details.'
        }).catch(error => {
          console.error('Failed to send shift update notification:', error);
        });
      }
    }
  };

  const addWeeklyScheduleShift = (shift: Omit<WeeklyScheduleShift, 'id'>) => {
    const newId = Math.max(...appState.weeklyScheduleData.map(s => s.id), 0) + 1;
    setAppState(prev => ({
      ...prev,
      weeklyScheduleData: [{ ...shift, id: newId }, ...prev.weeklyScheduleData]
    }));
    
    // Send email notification to guard about new shift assignment
    const guard = GUARDS_MASTER_LIST.find(g => g.id === shift.guardId);
    if (guard && guard.email) {
      sendShiftNotificationEmail({
        guardEmail: guard.email,
        guardName: shift.guardName,
        siteName: shift.location,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: getShiftType(shift.startTime)
      }).catch(error => {
        console.error('Failed to send shift notification email:', error);
        // Don't block shift creation if email fails
      });
    }
  };

  const setWeeklyScheduleData = (shifts: WeeklyScheduleShift[]) => {
    setAppState(prev => ({
      ...prev,
      weeklyScheduleData: shifts
    }));
  };

  // ============================================================================
  // UNASSIGNED SHIFTS MANAGEMENT ACTIONS
  // ============================================================================

  const addUnassignedShift = (shift: Omit<UnassignedShift, 'id'>) => {
    const newId = Math.max(...appState.unassignedShifts.map(s => s.id), 0) + 1;
    setAppState(prev => ({
      ...prev,
      unassignedShifts: [{ ...shift, id: newId }, ...prev.unassignedShifts]
    }));
  };

  const removeUnassignedShift = (shiftId: number) => {
    setAppState(prev => ({
      ...prev,
      unassignedShifts: prev.unassignedShifts.filter(s => s.id !== shiftId)
    }));
  };

  const assignUnassignedShift = (unassignedShiftId: number, guardId: number, guardName: string) => {
    const unassignedShiftIndex = appState.unassignedShifts.findIndex(s => s.id === unassignedShiftId);
    if (unassignedShiftIndex !== -1) {
      const unassignedShift = appState.unassignedShifts[unassignedShiftIndex];
      const newScheduledShift: ScheduledShift = {
        id: Math.max(...appState.scheduledShifts.map(s => s.id), 0) + 1,
        guardId,
        guardName,
        dayOfWeek: unassignedShift.dayOfWeek,
        date: unassignedShift.date,
        startTime: unassignedShift.startTime,
        endTime: unassignedShift.endTime,
        site: unassignedShift.location,
        hours: unassignedShift.hours,
        status: 'confirmed',
        isOvertime: false,
        isDoubleShift: false,
        assignedBy: currentUser.name,
        assignedAt: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      setAppState(prev => ({
        ...prev,
        scheduledShifts: [...prev.scheduledShifts, newScheduledShift],
        unassignedShifts: prev.unassignedShifts.filter(s => s.id !== unassignedShiftId)
      }));
    }
  };

  const removeWeeklyScheduleShift = (shiftId: number) => {
    setAppState(prev => ({
      ...prev,
      weeklyScheduleData: prev.weeklyScheduleData.filter(s => s.id !== shiftId)
    }));
  };

  // ============================================================================
  // DATA MANAGEMENT ACTIONS
  // ============================================================================
  
  const resetAppData = () => {
    // Clear localStorage
    localStorage.removeItem('guardUpAppState');
    localStorage.removeItem('guardUpCurrentUser');
    
    // Reset to initial state
    setAppState({
      activeGuards: initialActiveGuards,
      incidentLogs: initialIncidentLogs,
      roster: initialRoster,
      sites: initialSites,
      newVaultEntry: false,
      latestReportData: null,
      reports: initialReports,
      vaultDocuments: initialVaultDocuments,
      scheduledShifts: initialScheduledShifts,
      weeklyScheduleData: initialWeeklyScheduleData,
      unassignedShifts: initialUnassignedShifts
    });
    
    // Reset to default user
    setCurrentUser({
      id: 55,
      name: 'Sarah Chen',
      role: 'Supervisor',
      email: 'sarah.chen@guardupmatrix.com'
    });
    
    toast.success('App data reset successfully!');
    console.log('[AppState] Reset all data to initial state');
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AppStateContextType = {
    appState,
    currentUser,
    setCurrentUser,
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
    deleteReport,
    approveReport,
    rejectReport,
    getPreviewId,
    getDraftCounter,
    getActiveGuardCount,
    getIncidentCount,
    isGuardOnShift,
    getGuardCurrentSite,
    addVaultDocument,
    addScheduledShift,
    updateScheduledShift,
    removeScheduledShift,
    updateWeeklyScheduleShift,
    addWeeklyScheduleShift,
    setWeeklyScheduleData,
    addUnassignedShift,
    removeUnassignedShift,
    assignUnassignedShift,
    removeWeeklyScheduleShift,
    resetAppData
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