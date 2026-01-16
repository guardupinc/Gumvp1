// ============================================================================
// DASHBOARD / METRICS ROUTES
// ============================================================================

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import * as auth from "./auth.tsx";
import * as email from "./email.tsx";
import type { Context } from "npm:hono";

const api = new Hono();

// Get dashboard metrics
api.get('/dashboard/metrics', auth.requireAuth, async (c) => {
  try {
    const [guards, reports, incidents, shifts] = await Promise.all([
      kv.getByPrefix('guard:'),
      kv.getByPrefix('report:'),
      kv.getByPrefix('incident:'),
      kv.getByPrefix('shift:')
    ]);
    
    const metrics = {
      totalGuards: guards.length,
      activeGuards: guards.filter((g: any) => g.status === 'on-shift').length,
      totalReports: reports.length,
      pendingReports: reports.filter((r: any) => r.status === 'pending').length,
      openIncidents: incidents.filter((i: any) => i.status === 'open').length,
      upcomingShifts: shifts.filter((s: any) => s.status === 'pending').length
    };
    
    return c.json({ success: true, metrics });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    return c.json({ error: 'Failed to fetch dashboard metrics' }, 500);
  }
});

// ============================================================================
// EMAIL ROUTES
// ============================================================================

// Send email (generic endpoint for custom emails)
api.post('/email/send', auth.requireAuth, async (c) => {
  try {
    const { to, subject, html, attachments } = await c.req.json();
    
    if (!to || !subject || !html) {
      return c.json({ error: 'Missing required fields: to, subject, html' }, 400);
    }
    
    const result = await email.sendEmail({
      to,
      subject,
      html,
      attachments
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Send email error:', error);
    return c.json({ error: `Failed to send email: ${error.message}` }, 500);
  }
});

// Send email using template
api.post('/email/send-template', auth.requireAuth, async (c) => {
  try {
    const { template, templateData, to, attachments } = await c.req.json();
    
    if (!template || !templateData || !to) {
      return c.json({ error: 'Missing required fields: template, templateData, to' }, 400);
    }
    
    // Validate template exists
    if (!email.isValidTemplate(template)) {
      return c.json({ error: `Invalid template: ${template}` }, 400);
    }
    
    // Get template function and generate email content
    const templateFn = email.templates[template as keyof typeof email.templates];
    const { subject, html } = templateFn(templateData);
    
    // Send email
    const result = await email.sendEmail({
      to,
      subject,
      html,
      attachments
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Send template email error:', error);
    return c.json({ error: `Failed to send email: ${error.message}` }, 500);
  }
});

// Send client report email (HIGH PRIORITY)
api.post('/email/send-client-report', auth.requireRole('SECURITY_ADMIN'), async (c) => {
  try {
    const { clientEmail, clientName, siteName, reportCount, date, customMessage, pdfAttachment } = await c.req.json();
    
    if (!clientEmail || !siteName) {
      return c.json({ error: 'Missing required fields: clientEmail, siteName' }, 400);
    }
    
    // Generate email using template
    const { subject, html } = email.templates.clientReport({
      clientName: clientName || 'Client',
      siteName,
      date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      reportCount: reportCount || 1,
      customMessage
    });
    
    // Send email with PDF attachment
    const result = await email.sendEmail({
      to: clientEmail,
      subject,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : undefined
    });
    
    // Log the email send for audit trail
    await kv.set(`email-log:${Date.now()}`, {
      type: 'client_report',
      to: clientEmail,
      siteName,
      sentAt: new Date().toISOString(),
      sentBy: auth.getCurrentUser(c).name
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Send client report email error:', error);
    return c.json({ error: `Failed to send client report email: ${error.message}` }, 500);
  }
});

// Send shift assignment notification (MEDIUM PRIORITY)
api.post('/email/send-shift-notification', auth.requireRole('SECURITY_ADMIN'), async (c) => {
  try {
    const { guardEmail, guardName, siteName, date, startTime, endTime, shiftType, specialInstructions } = await c.req.json();
    
    if (!guardEmail || !guardName || !siteName || !date || !startTime || !endTime) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Generate email using template
    const { subject, html } = email.templates.shiftAssignment({
      guardEmail,
      guardName,
      siteName,
      date,
      startTime,
      endTime,
      shiftType,
      specialInstructions
    });
    
    // Send email
    const result = await email.sendEmail({
      to: guardEmail,
      subject,
      html
    });
    
    // Log the email send
    await kv.set(`email-log:${Date.now()}`, {
      type: 'shift_notification',
      to: guardEmail,
      guardName,
      siteName,
      date,
      sentAt: new Date().toISOString(),
      sentBy: auth.getCurrentUser(c).name
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Send shift notification error:', error);
    return c.json({ error: `Failed to send shift notification: ${error.message}` }, 500);
  }
});

// Send incident alert (MEDIUM PRIORITY)
api.post('/email/send-incident-alert', auth.requireAuth, async (c) => {
  try {
    const { supervisorEmails, incidentId, incidentType, severity, siteName, location, reportedBy, timestamp, summary, actionTaken } = await c.req.json();
    
    if (!supervisorEmails || !incidentId || !severity || !siteName) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Generate email using template
    const { subject, html } = email.templates.incidentAlert({
      incidentId,
      incidentType: incidentType || 'Security Incident',
      severity,
      siteName,
      location: location || 'Not specified',
      reportedBy: reportedBy || 'Security Guard',
      timestamp: timestamp || new Date().toLocaleString(),
      summary,
      actionTaken
    });
    
    // Send email to all supervisors
    const result = await email.sendEmail({
      to: supervisorEmails,
      subject,
      html
    });
    
    // Log the email send
    await kv.set(`email-log:${Date.now()}`, {
      type: 'incident_alert',
      to: supervisorEmails,
      incidentId,
      severity,
      siteName,
      sentAt: new Date().toISOString(),
      sentBy: auth.getCurrentUser(c).name
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Send incident alert error:', error);
    return c.json({ error: `Failed to send incident alert: ${error.message}` }, 500);
  }
});

// Send license expiration warning (MEDIUM PRIORITY)
api.post('/email/send-license-warning', auth.requireAuth, async (c) => {
  try {
    const { guardEmail, guardName, licenseType, expirationDate, daysRemaining } = await c.req.json();
    
    if (!guardEmail || !guardName || !licenseType || !expirationDate || daysRemaining === undefined) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Generate email using template
    const { subject, html } = email.templates.licenseExpiration({
      guardEmail,
      guardName,
      licenseType,
      expirationDate,
      daysRemaining
    });
    
    // Send email
    const result = await email.sendEmail({
      to: guardEmail,
      subject,
      html
    });
    
    // Log the email send
    await kv.set(`email-log:${Date.now()}`, {
      type: 'license_warning',
      to: guardEmail,
      guardName,
      licenseType,
      daysRemaining,
      sentAt: new Date().toISOString()
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Send license warning error:', error);
    return c.json({ error: `Failed to send license warning: ${error.message}` }, 500);
  }
});

export default api;