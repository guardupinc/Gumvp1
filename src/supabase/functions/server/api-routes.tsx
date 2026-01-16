// ============================================================================
// API ROUTES - GUARD UP MVP
// ============================================================================
// Comprehensive API routes for reports, guards, incidents, shifts, and vault

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import * as data from "./data.tsx";
import * as auth from "./auth.tsx";
import * as email from "./email.tsx";
import * as storage from "./storage.tsx";
import type { Context } from "npm:hono";

const api = new Hono();

// ============================================================================
// REPORT ROUTES
// ============================================================================

/**
 * Get all reports with role-based filtering
 * - Admins see all reports
 * - Guards see only their own reports
 */
api.get('/reports', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const allReports = await kv.getByPrefix('report:');
    
    // Filter based on role and org_id
    let reports: any[];
    if (user.role === 'GUARD') {
      // Guards only see their own reports (match by guardId or guardName) from their org
      const guardProfile = await kv.get(`guard:${user.guardId}`);
      const guardName = guardProfile?.name || '';
      
      reports = allReports.filter((r: any) => {
        // Handle legacy reports without org_id - treat as 'default_org'
        const reportOrgId = r.org_id || 'default_org';
        return reportOrgId === user.org_id && ( // Org filter
          r.submittedById === user.id || 
          r.guardName === guardName ||
          (user.guardId && r.guardId === user.guardId)
        );
      });
    } else {
      // Admins see all reports from their organization only
      // Handle legacy reports without org_id - treat as 'default_org'
      reports = allReports.filter((r: any) => {
        const reportOrgId = r.org_id || 'default_org';
        return reportOrgId === user.org_id;
      });
    }
    
    return c.json({ 
      success: true, 
      reports: reports.sort((a: any, b: any) => b.id - a.id) // Sort by ID descending
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

/**
 * Get single report by ID with role-based access control
 */
api.get('/reports/:id', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportId = c.req.param('id');
    const report = await kv.get(`report:${reportId}`);
    
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // ============================================================================
    // DEBUG: Log law enforcement fields when fetching incident report
    // ============================================================================
    if (report.reportType === 'incident') {
      console.log('='.repeat(80));
      console.log('[Reports API - GET ONE] Incident Report Law Enforcement Fields:');
      console.log('Report ID:', reportId);
      console.log('police_called:', report.police_called);
      console.log('pd_case_number:', report.pd_case_number);
      console.log('='.repeat(80));
    }
    
    // Guards can only view their own reports
    if (user.role === 'GUARD') {
      const guardProfile = await kv.get(`guard:${user.guardId}`);
      const guardName = guardProfile?.name || '';
      
      if (report.submittedById !== user.id && 
          report.guardName !== guardName &&
          report.guardId !== user.guardId) {
        return c.json({ error: 'Forbidden - You can only view your own reports' }, 403);
      }
    }
    
    return c.json({ success: true, report });
  } catch (error) {
    console.error('Get report error:', error);
    return c.json({ error: 'Failed to fetch report' }, 500);
  }
});

/**
 * Create new report with automatic report code generation
 * IMPORTANT: This creates the report immediately with a DRAFT status and generates the official Case ID.
 * The Case ID is immutable and persists through draft -> submitted -> approved lifecycle.
 */
api.post('/reports', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportData = await c.req.json();
    
    console.log(`[Reports API] Creating report for ${user.name} (${user.role})`);
    
    // ============================================================================
    // DEBUG: Log incident report law enforcement fields
    // ============================================================================
    if (reportData.reportType === 'incident') {
      console.log('='.repeat(80));
      console.log('[Reports API - CREATE] Incident Report Law Enforcement Fields:');
      console.log('police_called:', reportData.police_called);
      console.log('pd_case_number:', reportData.pd_case_number);
      console.log('='.repeat(80));
    }
    
    // Generate next report ID
    const nextId = await data.getNextSequence('report:');
    
    // Generate report code using the sequencer (THIS IS THE IMMUTABLE CASE ID)
    const reportCode = await generateReportCode(reportData.reportType);
    const caseId = `#${reportCode}`; // Add # prefix for display
    
    const now = new Date().toISOString();
    
    // Determine initial status: 'draft' or 'pending'
    const initialStatus = reportData.status || 'draft';
    
    // Create report with metadata using clean field names
    const report = {
      ...reportData,
      id: nextId,
      reportCode,
      caseId, // IMMUTABLE CASE ID - this never changes
      referenceId: `REF-${Date.now()}-${nextId}`,
      timestamp: now,
      
      // Organization ID for multi-tenant filtering
      org_id: user.org_id || 'default_org',
      
      // Clean attribution fields
      created_by_user_id: user.id,
      created_by_name: user.name,
      created_by_role: user.role,
      
      // Submission tracking (null until actually submitted)
      submitted_by_user_id: initialStatus === 'pending' ? user.id : null,
      submitted_by_name: initialStatus === 'pending' ? user.name : null,
      submitted_by_role: initialStatus === 'pending' ? user.role : null,
      
      // Review tracking (null until reviewed)
      reviewed_by_user_id: null,
      reviewed_by_name: null,
      reviewed_by_role: null,
      decision: null, // 'APPROVED' or 'REJECTED'
      decision_note: null,
      
      // Legacy fields (keep for backwards compatibility)
      submittedById: initialStatus === 'pending' ? user.id : null,
      submittedBy: initialStatus === 'pending' ? user.name : null,
      
      // Status
      status: initialStatus,
      
      // Timestamps (all ISO strings in UTC)
      created_at: now,
      submitted_at: initialStatus === 'pending' ? now : null,
      reviewed_at: null,
      updated_at: now
    };
    
    await kv.set(`report:${nextId}`, report);
    
    console.log(`[Reports API] ✅ Created report ${reportCode} (${caseId}) by ${user.name} with status: ${initialStatus}`);
    
    return c.json({ success: true, report });
  } catch (error) {
    console.error('[Reports API] ❌ Create report error:', error);
    return c.json({ error: `Failed to create report: ${error.message}` }, 500);
  }
});

/**
 * Update existing report
 */
api.put('/reports/:id', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingReport = await kv.get(`report:${reportId}`);
    if (!existingReport) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // Guards can only update their own pending OR rejected reports
    if (user.role === 'GUARD') {
      const guardProfile = await kv.get(`guard:${user.guardId}`);
      const guardName = guardProfile?.name || '';
      
      if (existingReport.submittedById !== user.id && 
          existingReport.guardName !== guardName) {
        return c.json({ error: 'Forbidden - You can only update your own reports' }, 403);
      }
      
      // Guards can edit pending reports and rejected reports (for revision)
      if (existingReport.status !== 'pending' && existingReport.status !== 'rejected') {
        return c.json({ error: 'Cannot update a report that has already been approved' }, 400);
      }
    }
    
    const updatedReport = {
      ...existingReport,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`report:${reportId}`, updatedReport);
    
    console.log(`[Reports API] Updated report ${reportId} by ${user.name}`);
    
    return c.json({ success: true, report: updatedReport });
  } catch (error) {
    console.error('Update report error:', error);
    return c.json({ error: 'Failed to update report' }, 500);
  }
});

/**
 * Approve report (admin only)
 */
api.post('/reports/:id/approve', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportId = c.req.param('id');
    const { notifyGuard, updates, reviewerName, reviewerRole, reviewerId } = await c.req.json();
    
    console.log('[Approve] Starting approval process for report:', reportId);
    console.log('[Approve] Server auth user:', { name: user.name, role: user.role });
    console.log('[Approve] Client reviewer metadata:', { reviewerName, reviewerRole, reviewerId });
    console.log('[Approve] Updates from client:', updates);
    
    const report = await kv.get(`report:${reportId}`);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    console.log('[Approve] Original report author:', {
      guardName: report.guardName,
      createdBy: report.createdBy,
      submittedBy: report.submittedBy
    });
    
    // Use reviewer metadata from client if provided, otherwise fall back to server auth
    const actualReviewerId = reviewerId || user.id;
    const actualReviewerName = reviewerName || user.name;
    const actualReviewerRole = reviewerRole || (user.role === 'SECURITY_ADMIN' ? 'Supervisor' : user.role);
    
    console.log('[Approve] Resolved reviewer:', { actualReviewerId, actualReviewerName, actualReviewerRole });
    
    // ============================================================================
    // CRITICAL VALIDATION: Prevent guards from approving reports
    // ============================================================================
    if (actualReviewerRole === 'Guard' || actualReviewerRole === 'GUARD') {
      console.error('[Approve] ❌ SECURITY VIOLATION: Guard role cannot approve reports!');
      console.error('[Approve] Rejected approval attempt by:', { actualReviewerName, actualReviewerRole });
      return c.json({ 
        error: 'Authorization error: Guards cannot approve reports. Please use a Supervisor or Admin account.',
        code: 'GUARD_CANNOT_APPROVE'
      }, 403);
    }
    
    // Build approved report with reviewer metadata
    // CRITICAL: Apply reviewer fields AFTER updates to prevent override
    // Remove any reviewer fields from updates to prevent contamination
    const sanitizedUpdates = { ...updates };
    delete sanitizedUpdates.approvedBy;
    delete sanitizedUpdates.approvedByRole;
    delete sanitizedUpdates.approvedAt;
    delete sanitizedUpdates.rejectedBy;
    delete sanitizedUpdates.rejectedByRole;
    delete sanitizedUpdates.rejectedAt;
    delete sanitizedUpdates.reviewed_by_user_id;
    delete sanitizedUpdates.reviewed_by_name;
    delete sanitizedUpdates.reviewed_by_role;
    delete sanitizedUpdates.reviewed_at;
    delete sanitizedUpdates.decision;
    delete sanitizedUpdates.decision_note;
    
    console.log('[Approve] Sanitized updates (after removing reviewer fields):', sanitizedUpdates);
    
    const now = new Date().toISOString();
    
    const approvedReport = {
      ...report,
      ...sanitizedUpdates,
      status: 'approved',
      
      // NEW CLEAN FIELDS (Priority - Source of Truth)
      reviewed_by_user_id: actualReviewerId,
      reviewed_by_name: actualReviewerName,
      reviewed_by_role: actualReviewerRole,
      reviewed_at: now,
      decision: 'APPROVED',
      decision_note: null,
      
      // LEGACY FIELDS (Keep for backwards compatibility)
      // These are formatted for direct display in UI
      approvedBy: actualReviewerName, // Just the name for display
      approvedByRole: actualReviewerRole,
      approvedAt: now, // ISO timestamp - UI will format this
      
      // Clear any rejection metadata since this is now approved
      rejection_note: undefined,
      rejectionNote: undefined,
      rejectedBy: undefined,
      rejectedByRole: undefined,
      rejectedAt: undefined,
      
      updated_at: now
    };
    
    console.log('[Approve] Final approved report reviewer fields:', {
      reviewed_by_user_id: approvedReport.reviewed_by_user_id,
      reviewed_by_name: approvedReport.reviewed_by_name,
      reviewed_by_role: approvedReport.reviewed_by_role,
      reviewed_at: approvedReport.reviewed_at,
      decision: approvedReport.decision,
      approvedBy: approvedReport.approvedBy,
      approvedAt: approvedReport.approvedAt
    });
    
    await kv.set(`report:${reportId}`, approvedReport);
    
    // File to vault
    await fileReportToVault(approvedReport);
    
    // Send notification if requested
    if (notifyGuard) {
      // TODO: Send push notification to guard
      console.log(`[Reports API] Notification sent to guard for report ${report.reportCode}`);
    }
    
    console.log(`[Reports API] ✅ Approved report ${report.reportCode} by ${actualReviewerName}`);
    
    return c.json({ success: true, report: approvedReport });
  } catch (error) {
    console.error('Approve report error:', error);
    return c.json({ error: 'Failed to approve report' }, 500);
  }
});

/**
 * Reject report (admin only)
 */
api.post('/reports/:id/reject', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportId = c.req.param('id');
    const { rejectionNote, reviewerName, reviewerRole, reviewerId } = await c.req.json();
    
    console.log('[Reject] Starting rejection process for report:', reportId);
    console.log('[Reject] Rejection note:', rejectionNote);
    
    const report = await kv.get(`report:${reportId}`);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // Use reviewer metadata from client if provided, otherwise fall back to server auth
    const actualReviewerId = reviewerId || user.id;
    const actualReviewerName = reviewerName || user.name;
    const actualReviewerRole = reviewerRole || (user.role === 'SECURITY_ADMIN' ? 'Supervisor' : user.role);
    
    console.log('[Reject] Resolved reviewer:', { actualReviewerId, actualReviewerName, actualReviewerRole });
    
    // ============================================================================
    // CRITICAL VALIDATION: Prevent guards from rejecting reports
    // ============================================================================
    if (actualReviewerRole === 'Guard' || actualReviewerRole === 'GUARD') {
      console.error('[Reject] ❌ SECURITY VIOLATION: Guard role cannot reject reports!');
      console.error('[Reject] Rejected rejection attempt by:', { actualReviewerName, actualReviewerRole });
      return c.json({ 
        error: 'Authorization error: Guards cannot reject reports. Please use a Supervisor or Admin account.',
        code: 'GUARD_CANNOT_REJECT'
      }, 403);
    }
    
    const now = new Date().toISOString();
    
    const rejectedReport = {
      ...report,
      status: 'rejected',
      
      // NEW CLEAN FIELDS (Priority - Source of Truth)
      reviewed_by_user_id: actualReviewerId,
      reviewed_by_name: actualReviewerName,
      reviewed_by_role: actualReviewerRole,
      reviewed_at: now,
      decision: 'REJECTED',
      decision_note: rejectionNote,
      
      // LEGACY FIELDS (Keep for backwards compatibility)
      rejectionNote,
      rejectedBy: actualReviewerName, // Just the name for display
      rejectedByRole: actualReviewerRole,
      rejectedAt: now, // ISO timestamp - UI will format this
      
      // Clear any approval metadata since this is now rejected
      approvedBy: undefined,
      approvedByRole: undefined,
      approvedAt: undefined,
      
      updated_at: now
    };
    
    await kv.set(`report:${reportId}`, rejectedReport);
    
    console.log(`[Reports API] ✅ Rejected report ${report.reportCode} by ${actualReviewerName}`);
    console.log(`[Reports API] Rejection note: ${rejectionNote}`);
    
    return c.json({ success: true, report: rejectedReport });
  } catch (error) {
    console.error('Reject report error:', error);
    return c.json({ error: 'Failed to reject report' }, 500);
  }
});

/**
 * Resubmit report (guard only - for rejected reports)
 */
api.post('/reports/:id/resubmit', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportId = c.req.param('id');
    const updates = await c.req.json();
    
    const report = await kv.get(`report:${reportId}`);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // Verify guard owns this report
    if (user.role === 'GUARD') {
      const guardProfile = await kv.get(`guard:${user.guardId}`);
      const guardName = guardProfile?.name || '';
      
      if (report.submittedById !== user.id && 
          report.guardName !== guardName &&
          report.guardId !== user.guardId) {
        return c.json({ error: 'Forbidden - You can only resubmit your own reports' }, 403);
      }
    }
    
    // Can only resubmit rejected reports
    if (report.status !== 'rejected') {
      return c.json({ error: 'Only rejected reports can be resubmitted' }, 400);
    }
    
    const time = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    
    // Update report and change status back to pending
    const resubmittedReport = {
      ...report,
      ...updates,
      status: 'pending',
      resubmittedAt: time,
      // Keep rejection history but clear the rejected status fields
      previousRejectionNote: report.rejectionNote,
      previousRejectedBy: report.rejectedBy,
      previousRejectedAt: report.rejectedAt,
      rejectionNote: undefined,
      rejectedBy: undefined,
      rejectedAt: undefined,
      rejectedByRole: undefined,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`report:${reportId}`, resubmittedReport);
    
    console.log(`[Reports API] Resubmitted report ${report.reportCode} by ${user.name}`);
    
    return c.json({ success: true, report: resubmittedReport });
  } catch (error) {
    console.error('Resubmit report error:', error);
    return c.json({ error: 'Failed to resubmit report' }, 500);
  }
});

/**
 * Submit draft report (convert draft -> pending)
 * IMPORTANT: This updates the existing draft record to pending status and sets submission timestamps.
 * The Case ID remains unchanged.
 */
api.post('/reports/:id/submit', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportId = c.req.param('id');
    const updates = await c.req.json();
    
    console.log(`[Reports API] Submitting draft ${reportId} by ${user.name}`);
    
    const report = await kv.get(`report:${reportId}`);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // Verify guard owns this draft
    if (user.role === 'GUARD') {
      const guardProfile = await kv.get(`guard:${user.guardId}`);
      const guardName = guardProfile?.name || '';
      
      if (report.created_by_user_id !== user.id && 
          report.guardName !== guardName &&
          report.guardId !== user.guardId) {
        return c.json({ error: 'Forbidden - You can only submit your own drafts' }, 403);
      }
    }
    
    // Can only submit drafts
    if (report.status !== 'draft') {
      return c.json({ error: 'Only draft reports can be submitted' }, 400);
    }
    
    const now = new Date().toISOString();
    
    // Update report and change status to pending
    const submittedReport = {
      ...report,
      ...updates,
      status: 'pending',
      
      // Set submission tracking fields
      submitted_by_user_id: user.id,
      submitted_by_name: user.name,
      submitted_by_role: user.role,
      submitted_at: now,
      
      // Legacy fields
      submittedById: user.id,
      submittedBy: user.name,
      
      // CRITICAL: Case ID and reportCode remain unchanged
      caseId: report.caseId,
      reportCode: report.reportCode,
      
      updated_at: now
    };
    
    await kv.set(`report:${reportId}`, submittedReport);
    
    console.log(`[Reports API] ✅ Submitted draft ${report.reportCode} (${report.caseId}) by ${user.name}`);
    
    return c.json({ success: true, report: submittedReport });
  } catch (error) {
    console.error('[Reports API] ❌ Submit draft error:', error);
    return c.json({ error: `Failed to submit draft: ${error.message}` }, 500);
  }
});

/**
 * Delete report (soft delete for safety)
 * - Guards can only delete their own drafts
 * - Admins can delete any draft
 * - Cannot delete submitted reports (pending/approved/rejected)
 */
api.delete('/reports/:id', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const reportId = c.req.param('id');
    
    const report = await kv.get(`report:${reportId}`);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    
    // Only allow deletion of drafts
    if (report.status !== 'draft') {
      return c.json({ error: 'Only draft reports can be deleted' }, 400);
    }
    
    // Verify ownership for guards
    if (user.role === 'GUARD') {
      if (report.createdBy !== user.name && report.submittedById !== user.id) {
        return c.json({ error: 'Forbidden - You can only delete your own drafts' }, 403);
      }
    }
    
    // Permanently delete the report
    await kv.del(`report:${reportId}`);
    
    console.log(`[Reports API] Deleted draft ${report.reportCode} by ${user.name}`);
    
    return c.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    return c.json({ error: 'Failed to delete report' }, 500);
  }
});

// ============================================================================
// PDF GENERATION ROUTE REMOVED
// ============================================================================
// PDF generation has been removed from Vault viewing flow
// Vault documents now open directly in new tabs via signed URLs
// System reports without uploaded files show a "coming soon" message

// ============================================================================
// GUARD ROUTES
// ============================================================================

/**
 * Get all guards (admin only)
 */
api.get('/guards', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const guards = await kv.getByPrefix('guard:');
    return c.json({ 
      success: true, 
      guards: guards.sort((a: any, b: any) => a.id - b.id)
    });
  } catch (error) {
    console.error('Get guards error:', error);
    return c.json({ error: 'Failed to fetch guards' }, 500);
  }
});

/**
 * Get guard profile (guards can only get their own)
 */
api.get('/guards/:id', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const guardId = parseInt(c.req.param('id'));
    
    // Guards can only view their own profile
    if (user.role === 'GUARD' && user.guardId !== guardId) {
      return c.json({ error: 'Forbidden - You can only view your own profile' }, 403);
    }
    
    const guard = await kv.get(`guard:${guardId}`);
    if (!guard) {
      return c.json({ error: 'Guard not found' }, 404);
    }
    
    return c.json({ success: true, guard });
  } catch (error) {
    console.error('Get guard error:', error);
    return c.json({ error: 'Failed to fetch guard' }, 500);
  }
});

/**
 * Create new guard (admin only)
 */
api.post('/guards', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const guardData = await c.req.json();
    
    const nextId = await data.getNextSequence('guard:');
    
    const guard = {
      ...guardData,
      id: nextId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.name
    };
    
    await kv.set(`guard:${nextId}`, guard);
    
    console.log(`[Guards API] Created guard ${guard.name} by ${user.name}`);
    
    return c.json({ success: true, guard });
  } catch (error) {
    console.error('Create guard error:', error);
    return c.json({ error: 'Failed to create guard' }, 500);
  }
});

/**
 * Update guard (admin only)
 */
api.put('/guards/:id', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const guardId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingGuard = await kv.get(`guard:${guardId}`);
    if (!existingGuard) {
      return c.json({ error: 'Guard not found' }, 404);
    }
    
    const updatedGuard = {
      ...existingGuard,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.name
    };
    
    await kv.set(`guard:${guardId}`, updatedGuard);
    
    console.log(`[Guards API] Updated guard ${guardId} by ${user.name}`);
    
    return c.json({ success: true, guard: updatedGuard });
  } catch (error) {
    console.error('Update guard error:', error);
    return c.json({ error: 'Failed to update guard' }, 500);
  }
});

// ============================================================================
// INCIDENT ROUTES
// ============================================================================

/**
 * Get all incidents with role-based filtering
 */
api.get('/incidents', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const allIncidents = await kv.getByPrefix('incident:');
    
    let incidents: any[];
    if (user.role === 'GUARD') {
      // Guards only see incidents they reported
      incidents = allIncidents.filter((i: any) => i.guardId === user.guardId);
    } else {
      // Admins see all incidents
      incidents = allIncidents;
    }
    
    return c.json({ 
      success: true, 
      incidents: incidents.sort((a: any, b: any) => b.id - a.id)
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    return c.json({ error: 'Failed to fetch incidents' }, 500);
  }
});

/**
 * Create new incident
 */
api.post('/incidents', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const incidentData = await c.req.json();
    
    const nextId = await data.getNextSequence('incident:');
    
    const incident = {
      ...incidentData,
      id: nextId,
      reportedBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`incident:${nextId}`, incident);
    
    // Send email alert for critical/high severity incidents
    if (incident.severity === 'critical' || incident.severity === 'high') {
      // TODO: Send incident alert email
      console.log(`[Incidents API] High-priority incident ${nextId} created`);
    }
    
    return c.json({ success: true, incident });
  } catch (error) {
    console.error('Create incident error:', error);
    return c.json({ error: 'Failed to create incident' }, 500);
  }
});

/**
 * Update incident
 */
api.put('/incidents/:id', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const incidentId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingIncident = await kv.get(`incident:${incidentId}`);
    if (!existingIncident) {
      return c.json({ error: 'Incident not found' }, 404);
    }
    
    const updatedIncident = {
      ...existingIncident,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`incident:${incidentId}`, updatedIncident);
    
    console.log(`[Incidents API] Updated incident ${incidentId} by ${user.name}`);
    
    return c.json({ success: true, incident: updatedIncident });
  } catch (error) {
    console.error('Update incident error:', error);
    return c.json({ error: 'Failed to update incident' }, 500);
  }
});

// ============================================================================
// SHIFT ROUTES
// ============================================================================

/**
 * Get all shifts with role-based filtering
 */
api.get('/shifts', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const allShifts = await kv.getByPrefix('shift:');
    
    let shifts: any[];
    if (user.role === 'GUARD') {
      // Guards only see their own shifts
      shifts = allShifts.filter((s: any) => s.guardId === user.guardId);
    } else {
      // Admins see all shifts
      shifts = allShifts;
    }
    
    return c.json({ 
      success: true, 
      shifts: shifts.sort((a: any, b: any) => b.id - a.id)
    });
  } catch (error) {
    console.error('Get shifts error:', error);
    return c.json({ error: 'Failed to fetch shifts' }, 500);
  }
});

/**
 * Create new shift (admin only)
 */
api.post('/shifts', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const shiftData = await c.req.json();
    
    const nextId = await data.getNextSequence('shift:');
    
    const shift = {
      ...shiftData,
      id: nextId,
      assignedBy: user.name,
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`shift:${nextId}`, shift);
    
    console.log(`[Shifts API] Created shift ${nextId} for guard ${shift.guardName}`);
    
    return c.json({ success: true, shift });
  } catch (error) {
    console.error('Create shift error:', error);
    return c.json({ error: 'Failed to create shift' }, 500);
  }
});

/**
 * Update shift (admin only)
 */
api.put('/shifts/:id', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const shiftId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingShift = await kv.get(`shift:${shiftId}`);
    if (!existingShift) {
      return c.json({ error: 'Shift not found' }, 404);
    }
    
    const updatedShift = {
      ...existingShift,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`shift:${shiftId}`, updatedShift);
    
    console.log(`[Shifts API] Updated shift ${shiftId} by ${user.name}`);
    
    return c.json({ success: true, shift: updatedShift });
  } catch (error) {
    console.error('Update shift error:', error);
    return c.json({ error: 'Failed to update shift' }, 500);
  }
});

/**
 * Delete shift (admin only)
 */
api.delete('/shifts/:id', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const shiftId = c.req.param('id');
    
    const shift = await kv.get(`shift:${shiftId}`);
    if (!shift) {
      return c.json({ error: 'Shift not found' }, 404);
    }
    
    await kv.del(`shift:${shiftId}`);
    
    console.log(`[Shifts API] Deleted shift ${shiftId}`);
    
    return c.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Delete shift error:', error);
    return c.json({ error: 'Failed to delete shift' }, 500);
  }
});

// ============================================================================
// VAULT DOCUMENT ROUTES
// ============================================================================

/**
 * Get all vault documents
 */
api.get('/vault', auth.requireAuth, async (c: Context) => {
  try {
    const documents = await kv.getByPrefix('vault:');
    return c.json({ 
      success: true, 
      documents: documents.sort((a: any, b: any) => b.id - a.id)
    });
  } catch (error) {
    console.error('Get vault documents error:', error);
    return c.json({ error: 'Failed to fetch vault documents' }, 500);
  }
});

/**
 * Create vault document
 */
api.post('/vault', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const docData = await c.req.json();
    
    const nextId = await data.getNextSequence('vault:');
    
    const document = {
      ...docData,
      id: nextId,
      uploadedBy: user.name,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    
    await kv.set(`vault:${nextId}`, document);
    
    console.log(`[Vault API] Created document ${document.name}`);
    
    return c.json({ success: true, document });
  } catch (error) {
    console.error('Create vault document error:', error);
    return c.json({ error: 'Failed to create vault document' }, 500);
  }
});

/**
 * Get openable URL for vault document
 * POST /api/vault/open-url
 * Returns a signed URL for private storage or generates PDF on-demand for reports
 */
api.post('/vault/open-url', auth.requireAuth, async (c: Context) => {
  try {
    const user = auth.getCurrentUser(c);
    const { documentId } = await c.req.json();
    
    if (!documentId) {
      return c.json({ error: 'documentId is required' }, 400);
    }
    
    console.log(`[Vault Open] User ${user.name} requesting URL for document ${documentId}`);
    
    // Fetch vault document
    const vaultDoc = await kv.get(`vault:${documentId}`);
    
    if (!vaultDoc) {
      console.error(`[Vault Open] Document ${documentId} not found`);
      return c.json({ error: 'Document not found' }, 404);
    }
    
    console.log(`[Vault Open] Found document: ${vaultDoc.name}`);
    console.log(`[Vault Open] storage_path: ${!!vaultDoc.storage_path}, fileUrl: ${!!vaultDoc.fileUrl}, reportRef: ${!!vaultDoc.reportReferenceId}`);
    
    // CASE A: Document has storage_path
    if (vaultDoc.storage_path) {
      try {
        const signedUrl = await storage.getSignedUrl(vaultDoc.storage_path, 600);
        console.log(`[Vault Open] ✅ Generated signed URL`);
        return c.json({ success: true, signedUrl });
      } catch (error) {
        console.error(`[Vault Open] Signed URL error:`, error);
        return c.json({ error: 'Failed to generate signed URL' }, 500);
      }
    }
    
    // CASE B: Document has fileUrl (legacy)
    if (vaultDoc.fileUrl) {
      try {
        const signedUrl = await storage.getSignedUrl(vaultDoc.fileUrl, 600);
        console.log(`[Vault Open] ✅ Generated signed URL (legacy)`);
        return c.json({ success: true, signedUrl });
      } catch (error) {
        console.error(`[Vault Open] Signed URL error:`, error);
        return c.json({ error: 'Failed to generate signed URL' }, 500);
      }
    }
    
    // CASE C: Report reference - generate PDF
    if (vaultDoc.reportReferenceId) {
      console.log(`[Vault Open] Generating PDF for ${vaultDoc.reportReferenceId}`);
      
      const allReports = await kv.getByPrefix('report:');
      const report = allReports.find((r: any) => 
        r.reportCode === vaultDoc.reportReferenceId || 
        r.caseId === vaultDoc.reportReferenceId ||
        r.caseId === `#${vaultDoc.reportReferenceId}`
      );
      
      if (!report) {
        console.error(`[Vault Open] Report not found: ${vaultDoc.reportReferenceId}`);
        return c.json({ error: 'Report not found' }, 404);
      }
      
      console.log(`[Vault Open] Found report: ${report.reportCode}`);
      
      try {
        // Fetch organization data
        const orgId = user.org_id || 'default_org';
        const organization = await kv.get(`org:${orgId}`);
        
        const { generateReportPDF } = await import('./vault-pdf-helper.tsx');
        const pdfBytes = await generateReportPDF(report, organization);
        console.log(`[Vault Open] PDF generated: ${pdfBytes.byteLength} bytes`);
        
        const storagePath = `orgs/${orgId}/vault/reports/${vaultDoc.reportReferenceId}.pdf`;
        
        const { createClient } = await import('npm:@supabase/supabase-js@2.39.3');
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        const { error: uploadError } = await supabase.storage
          .from('make-e7fd76e8-guardup-files')
          .upload(storagePath, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`[Vault Open] Upload error:`, uploadError);
          return c.json({ error: 'Failed to upload PDF' }, 500);
        }
        
        await kv.set(`vault:${documentId}`, { ...vaultDoc, storage_path: storagePath });
        
        const signedUrl = await storage.getSignedUrl(storagePath, 600);
        console.log(`[Vault Open] ✅ PDF uploaded and signed`);
        return c.json({ success: true, signedUrl });
        
      } catch (error) {
        console.error(`[Vault Open] PDF generation error:`, error);
        return c.json({ error: 'Failed to generate PDF' }, 500);
      }
    }
    
    // CASE D: No file source
    console.error(`[Vault Open] No file source for document ${documentId}`);
    return c.json({ error: 'Document has no file attached', code: 'DOCUMENT_NO_FILE_SOURCE' }, 400);
    
  } catch (error) {
    console.error('[Vault Open] Error:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

// ============================================================================
// SITE ROUTES
// ============================================================================

/**
 * Get all sites
 */
api.get('/sites', auth.requireAuth, async (c: Context) => {
  try {
    const sites = await kv.getByPrefix('site:');
    return c.json({ 
      success: true, 
      sites: sites.sort((a: any, b: any) => a.id - b.id)
    });
  } catch (error) {
    console.error('Get sites error:', error);
    return c.json({ error: 'Failed to fetch sites' }, 500);
  }
});

/**
 * Update site (admin only)
 */
api.put('/sites/:id', auth.requireRole('SECURITY_ADMIN', 'COMPANY_ADMIN'), async (c: Context) => {
  try {
    const siteId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingSite = await kv.get(`site:${siteId}`);
    if (!existingSite) {
      return c.json({ error: 'Site not found' }, 404);
    }
    
    const updatedSite = {
      ...existingSite,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`site:${siteId}`, updatedSite);
    
    console.log(`[Sites API] Updated site ${siteId}`);
    
    return c.json({ success: true, site: updatedSite });
  } catch (error) {
    console.error('Update site error:', error);
    return c.json({ error: 'Failed to update site' }, 500);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate report code with global sequential numbering
 * ENHANCED: Uses atomic increment to prevent race conditions
 */
async function generateReportCode(reportType: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Map report type to prefix
  const prefixMap: { [key: string]: string } = {
    'incident': 'IR',
    'dar': 'DAR',
    'maintenance': 'MNT',
    'disciplinary': 'DIS',
    'shift_pass_on': 'SPO',
    'other': 'OTH'
  };
  
  const prefix = prefixMap[reportType] || 'OTH';
  
  // Get current sequence for this report type and year
  const sequenceKey = `sequence:${prefix}:${year}`;
  
  // ============================================================================
  // ATOMIC INCREMENT WITH RETRY LOGIC
  // ============================================================================
  let sequence: number;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      
      // Get current sequence
      let currentSequence = await kv.get<number>(sequenceKey);
      
      if (currentSequence === null || currentSequence === undefined) {
        currentSequence = 0;
      }
      
      // Increment
      sequence = currentSequence + 1;
      
      // Set new value
      await kv.set(sequenceKey, sequence);
      
      // Add a small random delay on retry to reduce collision probability
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      }
      
      // Successfully got a sequence number
      console.log(`[generateReportCode] Generated ${prefix}-${year}-${String(sequence).padStart(6, '0')} (attempt ${attempts})`);
      break;
      
    } catch (error) {
      console.error(`[generateReportCode] Attempt ${attempts} failed:`, error);
      
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to generate report code after ${maxAttempts} attempts`);
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts - 1)));
    }
  }
  
  // Format: PREFIX-YEAR-XXXXXX (e.g., IR-2026-000001)
  const paddedSequence = String(sequence!).padStart(6, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * File report to vault system (IDEMPOTENT - UPSERT based on reportCode)
 * This is the SINGLE SOURCE OF TRUTH for vault document creation.
 * Prevents duplicates by checking if vault doc already exists for this report.
 */
async function fileReportToVault(report: any) {
  // ============================================================================
  // DUPLICATE PREVENTION: Check if vault doc already exists for this report
  // ============================================================================
  const allVaultDocs = await kv.getByPrefix('vault:');
  const existingDoc = allVaultDocs.find((doc: any) => 
    doc.reportReferenceId === report.reportCode
  );
  
  if (existingDoc) {
    console.log(`[Vault] Document already exists for ${report.reportCode}, skipping duplicate creation`);
    return existingDoc;
  }
  
  // ============================================================================
  // VAULT CATEGORIZATION
  // ============================================================================
  const vaultCategoryMap: { [key: string]: string } = {
    'incident': 'Incident Reports',
    'dar': 'Daily Reports',
    'maintenance': 'Maintenance',
    'disciplinary': 'HR & Internal',
    'shift_pass_on': 'Internal Ops',
    'other': 'HR & Internal'
  };
  
  const category = vaultCategoryMap[report.reportType] || 'HR & Internal';
  
  // ============================================================================
  // STANDARDIZED FILENAME: {CASE_ID} - {REPORT_TYPE}.pdf
  // ============================================================================
  const reportTypeNames: { [key: string]: string } = {
    'incident': 'Incident Report',
    'dar': 'Daily Activity Report',
    'maintenance': 'Maintenance Request',
    'disciplinary': 'Disciplinary Report',
    'shift_pass_on': 'Shift Pass-On Log',
    'other': 'Report'
  };
  
  const reportTypeName = reportTypeNames[report.reportType] || 'Report';
  const standardizedFilename = `${report.reportCode} - ${reportTypeName}.pdf`;
  
  // ============================================================================
  // UPLOADED BY: Use report author (guard/filer), not the reviewer
  // ============================================================================
  // The vault "Uploaded By" represents who created/filed the original report
  // This should be the guard who wrote the report, not the admin who approved it
  let uploadedBy = report.guardName || report.submittedBy || report.createdBy || 'Unknown';
  
  // ============================================================================
  // CREATE VAULT DOCUMENT
  // ============================================================================
  const nextId = await data.getNextSequence('vault:');
  
  const vaultDoc = {
    id: nextId,
    name: standardizedFilename,
    category,
    uploadedBy,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    size: '1.8 MB',
    status: 'Active',
    reportReferenceId: report.reportCode
  };
  
  await kv.set(`vault:${nextId}`, vaultDoc);
  
  console.log(`[Vault] Created vault document for ${report.reportCode} in ${category}`);
  console.log(`[Vault] Document name: ${standardizedFilename}`);
  console.log(`[Vault] Uploaded by: ${uploadedBy}`);
  
  return vaultDoc;
}

export default api;