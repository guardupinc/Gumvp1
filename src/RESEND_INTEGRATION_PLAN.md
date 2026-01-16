# Resend API Integration Plan for Guard Up MVP

## Executive Summary
This document identifies all areas in the Guard Up MVP where email functionality is needed and outlines the integration plan for the Resend API.

---

## Areas Requiring Email Functionality

### 🔴 **HIGH PRIORITY - Already Has UI**

#### 1. **Client Report Delivery** (Reports Module)
**Location:** `/components/pages/Reports.tsx` + `/components/ui/EmailConfirmModal.tsx`  
**Current Status:** UI complete, mockup only (no actual sending)  
**Use Case:**
- Send consolidated security reports (Incident, DAR, Maintenance) to clients
- Includes PDF attachments of reports
- Professional email template with customizable message
- Currently shows email preview but uses `setTimeout()` mockup

**Email Details:**
- **To:** Client contact email
- **Subject:** `Security Operations Report - [Site Name] - [Date]`
- **Attachment:** PDF report generated from client package
- **Template:** Professional security report delivery

**Required Changes:**
- Replace `handleEmailSend()` mockup in Reports.tsx (line 467)
- Add actual Resend API call
- Handle PDF attachment upload/generation
- Add error handling and delivery confirmation

---

### 🟡 **MEDIUM PRIORITY - High Value Features**

#### 2. **Guard Schedule Notifications**
**Location:** `/components/pages/Scheduling.tsx` + `/components/pages/WorkforceManagement.tsx`  
**Current Status:** No email functionality  
**Use Cases:**
- Notify guards when assigned to new shifts
- Send shift change/cancellation notifications
- Daily/weekly schedule reminders
- Last-minute coverage requests

**Email Template Needs:**
```
Subject: New Shift Assignment - [Site Name] - [Date]
To: [Guard Email]
Content:
- Shift details (site, time, duration)
- Special instructions
- Check-in requirements
- Contact information
```

#### 3. **Incident Report Alerts**
**Location:** `/components/pages/IncidentReporting.tsx`  
**Current Status:** No email functionality  
**Use Cases:**
- Immediate notification to supervisors for high-priority incidents
- Daily incident summary to management
- Client notification for critical incidents (optional)

**Email Template Needs:**
```
Subject: [URGENT] Security Incident - [Site Name]
To: Supervisor emails
Content:
- Incident summary
- Severity level
- Location
- Immediate actions taken
- Link to full report
```

#### 4. **License Expiration Alerts**
**Location:** `/components/pages/LicenseTracking.tsx`  
**Current Status:** No email functionality  
**Use Cases:**
- 30-day warning for expiring licenses
- 14-day warning for expiring licenses
- 7-day critical warning
- Expired license immediate alert

**Email Template Needs:**
```
Subject: License Expiration Warning - [Guard Name] - [Days Remaining]
To: Admin + affected guard
Content:
- Guard name and ID
- License type expiring
- Expiration date
- Renewal instructions
- Required documentation
```

---

### 🟢 **LOW PRIORITY - Enhancement Features**

#### 5. **Audit Reports Distribution**
**Location:** `/components/pages/AuditReports.tsx`  
**Current Status:** Download only  
**Use Cases:**
- Email quarterly compliance reports to stakeholders
- Send audit summaries to management
- Automated report distribution

#### 6. **Broadcast Alerts**
**Location:** `/components/modals/BroadcastAlertModal.tsx`  
**Current Status:** In-app only  
**Use Cases:**
- Emergency notifications to all active guards
- System-wide announcements
- Policy updates

#### 7. **Guard Onboarding**
**Location:** `/components/ui/AddNewGuardModal.tsx`  
**Use Cases:**
- Welcome email with credentials
- Onboarding checklist
- Training schedule
- Document submission instructions

#### 8. **Performance Reviews**
**Location:** `/components/ui/LogPerformanceModal.tsx`  
**Use Cases:**
- Monthly performance summaries to guards
- Quarterly reviews to supervisors
- Achievement notifications

---

## Technical Implementation Plan

### Step 1: Server-Side Email Service (Backend)
Create `/supabase/functions/server/email.tsx`:

```typescript
import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 or buffer
  }>;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, attachments, from, replyTo } = options;
  
  try {
    const response = await resend.emails.send({
      from: from || 'Guard Up Security <noreply@guardup.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments,
      replyTo,
    });
    
    return { success: true, data: response };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

// Pre-built templates
export const templates = {
  clientReport: (data: {
    clientName: string;
    siteName: string;
    date: string;
    reportCount: number;
  }) => ({
    subject: `Security Operations Report - ${data.siteName} - ${data.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0B1220;">Security Operations Report</h2>
        <p>To the Management Team at ${data.siteName},</p>
        <p>Please find attached the official Security Operations Report for ${data.date}.</p>
        <p>This document serves as a consolidated record of all patrol activities, verified incidents, 
        and site observations recorded by our team during the reporting period.</p>
        <p><strong>Report Summary:</strong></p>
        <ul>
          <li>Total Reports: ${data.reportCount}</li>
          <li>Site: ${data.siteName}</li>
          <li>Date: ${data.date}</li>
        </ul>
        <p>All entries have been reviewed by a supervisor for accuracy.</p>
        <p>Respectfully,<br>Security Operations Team</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">
          Guard Up Security Operations | guardupinc.com
        </p>
      </div>
    `,
  }),
  
  shiftAssignment: (data: {
    guardName: string;
    siteName: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => ({
    subject: `New Shift Assignment - ${data.siteName} - ${data.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0B1220;">New Shift Assignment</h2>
        <p>Hello ${data.guardName},</p>
        <p>You have been assigned to a new shift:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Site:</strong> ${data.siteName}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
        </div>
        <p>Please confirm your availability and log in to the Guard Portal for full shift details.</p>
        <p>Stay safe,<br>Guard Up Operations</p>
      </div>
    `,
  }),
  
  licenseExpiration: (data: {
    guardName: string;
    licenseType: string;
    expirationDate: string;
    daysRemaining: number;
  }) => ({
    subject: `⚠️ License Expiration Warning - ${data.guardName} - ${data.daysRemaining} Days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF7A18;">License Expiration Warning</h2>
        <p>Hello ${data.guardName},</p>
        <p style="color: #d9534f; font-weight: bold;">
          Your ${data.licenseType} license is expiring in ${data.daysRemaining} days.
        </p>
        <div style="background: #fff3cd; border-left: 4px solid #FF7A18; padding: 15px; margin: 20px 0;">
          <p><strong>License:</strong> ${data.licenseType}</p>
          <p><strong>Expiration Date:</strong> ${data.expirationDate}</p>
          <p><strong>Days Remaining:</strong> ${data.daysRemaining}</p>
        </div>
        <p>Please submit your renewal documentation as soon as possible to avoid work interruptions.</p>
        <p>Contact HR immediately if you need assistance with the renewal process.</p>
        <p>Guard Up HR Team</p>
      </div>
    `,
  }),
};
```

### Step 2: API Routes
Add to `/supabase/functions/server/routes.tsx`:

```typescript
// Email sending endpoint
api.post('/send-email', auth.requireAuth, async (c) => {
  try {
    const { to, subject, html, attachments, template, templateData } = await c.req.json();
    
    let emailOptions;
    
    if (template && templateData) {
      // Use pre-built template
      const templateFn = templates[template];
      if (!templateFn) {
        return c.json({ error: 'Invalid template name' }, 400);
      }
      const { subject: templateSubject, html: templateHtml } = templateFn(templateData);
      emailOptions = {
        to,
        subject: templateSubject,
        html: templateHtml,
        attachments,
      };
    } else {
      // Use custom email
      emailOptions = { to, subject, html, attachments };
    }
    
    const result = await sendEmail(emailOptions);
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Email API error:', error);
    return c.json({ error: 'Failed to send email' }, 500);
  }
});
```

### Step 3: Frontend Integration
Update `/components/pages/Reports.tsx`:

```typescript
const handleEmailSend = async () => {
  if (!emailPackage) return;
  
  setIsSending(true);
  
  try {
    // Generate PDF (existing logic)
    const pdfBlob = await generateClientReportPDF(emailPackage);
    
    // Convert PDF to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
      reader.readAsDataURL(pdfBlob);
    });
    const base64PDF = await base64Promise;
    
    // Send email via API
    const response = await fetch(`${API_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        template: 'clientReport',
        templateData: {
          clientName: emailPackage.clientName,
          siteName: emailPackage.siteName,
          date: emailPackage.date || new Date().toLocaleDateString(),
          reportCount: emailPackage.reportCount,
        },
        to: 'security@client.com', // TODO: Get from client config
        attachments: [
          {
            filename: `${emailPackage.siteName}_Security_Report.pdf`,
            content: base64PDF,
          },
        ],
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    // Mark as sent (existing logic)
    setSentPackageIds(prev => new Set([...prev, emailPackage.id]));
    toast.success(`Report successfully sent to ${emailPackage.clientName}`);
    setIsEmailModalOpen(false);
    
  } catch (error) {
    console.error('Email send error:', error);
    toast.error('Failed to send email. Please try again.');
  } finally {
    setIsSending(false);
  }
};
```

---

## Environment Setup

Add to Supabase secrets:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

You'll use the `create_supabase_secret` tool to prompt the user to add this.

---

## Recommended Implementation Order

1. ✅ **Phase 1: Client Report Emails** (Highest ROI)
   - Set up Resend integration
   - Create email service
   - Update Reports.tsx to send real emails
   - Test with PDF attachments

2. ✅ **Phase 2: License Expiration Alerts** (Compliance Critical)
   - Add scheduled check for expiring licenses
   - Send automated warnings
   - Track notification history

3. ✅ **Phase 3: Incident Alerts** (Safety Critical)
   - Real-time notifications for high-priority incidents
   - Escalation logic

4. ✅ **Phase 4: Schedule Notifications** (User Experience)
   - Shift assignment emails
   - Change notifications
   - Reminders

5. ✅ **Phase 5: Enhancement Features**
   - Audit report distribution
   - Broadcast alerts
   - Onboarding emails

---

## Cost Estimation (Resend Pricing)

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for MVP testing

**Pro Tier ($20/month):**
- 50,000 emails/month
- Custom domains
- Better for production

**Expected Usage:**
- Client reports: ~100-200/month
- License alerts: ~50/month
- Incident alerts: ~30/month
- Schedule notifications: ~500-1000/month
- **Total: ~680-1,280 emails/month** (fits Free tier for MVP)

---

## Next Steps

1. **Immediate:** Set up Resend account and get API key
2. **Backend:** Create email service module
3. **Frontend:** Update Reports module to use real email
4. **Testing:** Test with PDF attachments
5. **Deploy:** Add other email features incrementally

---

## Notes

- All email templates use Guard Up branding (#0B1220, #FF7A18, #3BD16F)
- Mobile-responsive HTML email templates
- Include unsubscribe links for marketing emails (not needed for transactional)
- Log all email sends for audit trail
- Consider rate limiting on client-facing endpoints
