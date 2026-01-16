// ============================================================================
// CENTRALIZED GUARDS DATA - SINGLE SOURCE OF TRUTH
// ============================================================================
// This file serves as the single source of truth for all guard data in the app.
// All guards MUST be defined in the Workforce Management tab first.
// Any component that needs guard information should import from this file.
//
// WORKFLOW:
// 1. Guards are created/added in the Workforce Management tab
// 2. The GUARDS_MASTER_LIST is the authoritative source
// 3. All other components (Scheduling, Operations, Reports, etc.) import from here
// 4. This ensures data consistency across the entire application
//
// USAGE:
// import { getAllGuards, getGuardById, getGuardNames } from './utils/guardsData';

export interface Guard {
  id: number;
  name: string;
  badgeId: string;
  role: string;
  status: 'active' | 'on-shift' | 'off-duty';
  phone: string;
  email: string;
  licenseExpiry: string;
  certExpiry: string;
  lastShift: string;
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
  securityGuardCard?: {
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
    daysUntilExpiry: number;
  };
}

// ============================================================================
// MASTER GUARDS LIST
// ============================================================================
// This is the authoritative source for all guards in the system.
// Guards can only be added through the Workforce Management interface.

export const GUARDS_MASTER_LIST: Guard[] = [
  {
    id: 1,
    name: 'John Smith',
    badgeId: 'BADGE-1024',
    role: 'Senior Guard',
    status: 'on-shift',
    phone: '(555) 123-4567',
    email: 'john.smith@example.com',
    licenseExpiry: 'Sep 15, 2025',
    certExpiry: 'Jun 20, 2025',
    lastShift: 'Today, 8:00 AM',
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
    status: 'active',
    phone: '(555) 234-5678',
    email: 'maria.garcia@example.com',
    licenseExpiry: 'Mar 22, 2026',
    certExpiry: 'Feb 28, 2025',
    lastShift: 'Yesterday, 4:00 PM',
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
    status: 'on-shift',
    phone: '(555) 345-6789',
    email: 'david.lee@example.com',
    licenseExpiry: 'Jul 18, 2025',
    certExpiry: 'Sep 12, 2025',
    lastShift: 'Today, 4:00 PM',
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
    status: 'active',
    phone: '(555) 456-7890',
    email: 'sarah.chen@example.com',
    licenseExpiry: 'Nov 08, 2026',
    certExpiry: 'Dec 15, 2025',
    lastShift: 'Today, 12:00 PM',
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
    status: 'off-duty',
    phone: '(555) 567-8901',
    email: 'robert.brown@example.com',
    licenseExpiry: 'Apr 30, 2025',
    certExpiry: 'May 10, 2025',
    lastShift: 'Dec 20, 8:00 AM',
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
    status: 'on-shift',
    phone: '(555) 678-9012',
    email: 'lisa.wang@example.com',
    licenseExpiry: 'Feb 14, 2026',
    certExpiry: 'Mar 1, 2025',
    lastShift: 'Today, 12:00 AM',
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all guards in the system
 */
export function getAllGuards(): Guard[] {
  return GUARDS_MASTER_LIST;
}

/**
 * Get a guard by ID
 */
export function getGuardById(id: number): Guard | undefined {
  return GUARDS_MASTER_LIST.find(guard => guard.id === id);
}

/**
 * Get a guard by name
 */
export function getGuardByName(name: string): Guard | undefined {
  return GUARDS_MASTER_LIST.find(guard => guard.name === name);
}

/**
 * Get a guard by badge ID
 */
export function getGuardByBadgeId(badgeId: string): Guard | undefined {
  return GUARDS_MASTER_LIST.find(guard => guard.badgeId === badgeId);
}

/**
 * Get all guards with a specific role
 */
export function getGuardsByRole(role: string): Guard[] {
  return GUARDS_MASTER_LIST.filter(guard => guard.role === role);
}

/**
 * Get all active guards (not frozen)
 */
export function getActiveGuards(): Guard[] {
  return GUARDS_MASTER_LIST.filter(guard => !guard.isFrozen && guard.status !== 'off-duty');
}

/**
 * Check if a guard exists
 */
export function guardExists(id: number): boolean {
  return GUARDS_MASTER_LIST.some(guard => guard.id === id);
}

/**
 * Get guard names for dropdown/select components
 */
export function getGuardNames(): string[] {
  return GUARDS_MASTER_LIST.map(guard => guard.name);
}

/**
 * Get guards formatted for scheduling (with badgeId calculated)
 */
export function getGuardsForScheduling() {
  return GUARDS_MASTER_LIST.map(guard => ({
    id: guard.id,
    name: guard.name,
    badgeId: guard.badgeId,
    role: guard.role,
    hoursThisWeek: guard.hoursThisWeek,
    canWorkOvertime: guard.role === 'Guard' // Only regular guards can work overtime in this demo
  }));
}