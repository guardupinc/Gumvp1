// ============================================================================
// DATA PERSISTENCE & INITIALIZATION
// ============================================================================
// This module handles data persistence layer and initial data seeding for the
// Guard Up application using the KV store.

import * as kv from './kv_store.tsx';

// ============================================================================
// DATA SCHEMAS
// ============================================================================

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
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Report {
  id: number;
  referenceId: string;
  caseId?: string;
  reportCode: string;
  type: 'DAR' | 'Incident' | 'Maintenance' | 'Disciplinary' | 'Shift Pass-On';
  reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift_pass_on' | 'other';
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
  actionTaken?: string;
  pdCaseNumber?: string;
  shiftStart?: string;
  shiftEnd?: string;
  reliefGuard?: string;
  equipmentStatus?: string;
  maintenanceCategory?: string;
  specificArea?: string;
  assetId?: string;
  employeeName?: string;
  violationType?: string;
  disciplineLevel?: string;
  correctiveAction?: string;
  submittedBy?: string;
  submittedById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shift {
  id: number;
  guardId: number;
  guardName: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string;
  startTime: string;
  endTime: string;
  site: string;
  hours: number;
  status: 'pending' | 'confirmed';
  instructions?: string;
  isOvertime?: boolean;
  isDoubleShift?: boolean;
  assignedBy?: string;
  assignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Incident {
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
  reportedBy?: string;
  updatedAt?: string;
}

export interface Site {
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
  updatedAt?: string;
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

// ============================================================================
// DATA INITIALIZATION
// ============================================================================

/**
 * Initialize the database with seed data if empty
 */
export async function initializeDatabase() {
  console.log('Checking if database needs initialization...');
  
  // Check if guards already exist
  const existingGuards = await kv.getByPrefix('guard:');
  
  if (existingGuards.length > 0) {
    console.log('Database already initialized, skipping seed data');
    return;
  }
  
  console.log('Initializing database with seed data...');
  
  // Seed guards
  await seedGuards();
  
  // Seed sites
  await seedSites();
  
  console.log('Database initialization complete');
}

/**
 * Seed initial guard data
 */
async function seedGuards() {
  const guards: Guard[] = [
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
      },
      createdAt: new Date().toISOString()
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
      },
      createdAt: new Date().toISOString()
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
      },
      createdAt: new Date().toISOString()
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
      },
      createdAt: new Date().toISOString()
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
      },
      createdAt: new Date().toISOString()
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
      },
      createdAt: new Date().toISOString()
    }
  ];
  
  for (const guard of guards) {
    await kv.set(`guard:${guard.id}`, guard);
  }
  
  console.log(`Seeded ${guards.length} guards`);
}

/**
 * Seed initial site data
 */
async function seedSites() {
  const sites: Site[] = [
    {
      id: 1,
      name: 'Building A',
      status: 'all-clear',
      statusText: 'All Clear',
      activeGuards: 2,
      guards: [
        { id: 1, name: 'John Smith', initials: 'JS' },
        { id: 4, name: 'Sarah Chen', initials: 'SC' }
      ],
      shiftProgress: 75,
      shiftStatusText: '6h remaining',
      taskMetrics: {
        patrolsCompleted: 8,
        patrolsTotal: 12,
        reportsDrafted: 3
      }
    },
    {
      id: 2,
      name: 'Building B',
      status: 'all-clear',
      statusText: 'All Clear',
      activeGuards: 1,
      guards: [
        { id: 6, name: 'Lisa Wang', initials: 'LW' }
      ],
      shiftProgress: 60,
      shiftStatusText: '4h 30m remaining',
      taskMetrics: {
        patrolsCompleted: 6,
        patrolsTotal: 10,
        reportsDrafted: 2
      }
    },
    {
      id: 3,
      name: 'Building C',
      status: 'all-clear',
      statusText: 'All Clear',
      activeGuards: 1,
      guards: [
        { id: 3, name: 'David Lee', initials: 'DL' }
      ],
      shiftProgress: 40,
      shiftStatusText: '5h 15m remaining',
      taskMetrics: {
        patrolsCompleted: 4,
        patrolsTotal: 8,
        reportsDrafted: 1
      }
    },
    {
      id: 4,
      name: 'Building D',
      status: 'all-clear',
      statusText: 'All Clear',
      activeGuards: 0,
      guards: [],
      shiftProgress: 0,
      shiftStatusText: 'No active shift',
      taskMetrics: {
        patrolsCompleted: 0,
        patrolsTotal: 0,
        reportsDrafted: 0
      }
    }
  ];
  
  for (const site of sites) {
    await kv.set(`site:${site.id}`, site);
  }
  
  console.log(`Seeded ${sites.length} sites`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get next sequence number for a given prefix
 */
export async function getNextSequence(prefix: string): Promise<number> {
  const items = await kv.getByPrefix(prefix);
  const maxId = items.reduce((max, item: any) => Math.max(max, item.id || 0), 0);
  return maxId + 1;
}

/**
 * Get all items with a specific prefix
 */
export async function getAllByPrefix<T>(prefix: string): Promise<T[]> {
  return await kv.getByPrefix(prefix) as T[];
}

/**
 * Search items by field value
 */
export async function searchByField<T>(
  prefix: string,
  fieldName: string,
  value: any
): Promise<T[]> {
  const items = await kv.getByPrefix(prefix);
  return items.filter((item: any) => item[fieldName] === value) as T[];
}

/**
 * Batch update multiple items
 */
export async function batchUpdate(updates: Array<{ key: string; value: any }>) {
  const keys = updates.map(u => u.key);
  const values = updates.map(u => u.value);
  await kv.mset(keys, values);
}

/**
 * Delete all items with a specific prefix (use with caution!)
 */
export async function deleteAllByPrefix(prefix: string) {
  const items = await kv.getByPrefix(prefix);
  const keys = items.map((item: any, index: number) => `${prefix}${index}`);
  if (keys.length > 0) {
    await kv.mdel(keys);
  }
}
