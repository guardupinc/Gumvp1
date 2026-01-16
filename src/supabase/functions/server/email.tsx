import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Email sending options interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Uint8Array; // base64 string or buffer
  }>;
  from?: string;
  replyTo?: string;
}

// Send email using Resend API
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, attachments, from, replyTo } = options;
  
  try {
    const response = await resend.emails.send({
      from: from || 'Guard Up Inc. <noreply@guardupinc.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments,
      replyTo,
    });
    
    console.log('Email sent successfully:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export interface ClientReportTemplateData {
  clientName: string;
  siteName: string;
  date: string;
  reportCount: number;
  customMessage?: string;
}

export interface ShiftAssignmentTemplateData {
  guardName: string;
  guardEmail: string;
  siteName: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType?: string;
  specialInstructions?: string;
}

export interface IncidentAlertTemplateData {
  incidentId: string;
  incidentType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  siteName: string;
  location: string;
  reportedBy: string;
  timestamp: string;
  summary: string;
  actionTaken?: string;
}

export interface LicenseExpirationTemplateData {
  guardName: string;
  guardEmail: string;
  licenseType: string;
  expirationDate: string;
  daysRemaining: number;
}

// Pre-built email templates
export const templates = {
  // Client Report Delivery Template
  clientReport: (data: ClientReportTemplateData) => {
    const defaultMessage = `Please find attached the official Security Operations Report for ${data.date}.

This document serves as a consolidated record of all patrol activities, verified incidents, and site observations recorded by our team during the reporting period.

All entries have been reviewed by a supervisor for accuracy.`;

    return {
      subject: `Security Operations Report - ${data.siteName} - ${data.date}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Operations Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B1220 0%, #1a2332 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Security Operations Report</h1>
              <p style="margin: 8px 0 0 0; color: #A7B0C0; font-size: 14px;">${data.siteName}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 16px 0; color: #0B1220; font-size: 15px; line-height: 1.6;">
                To the Management Team at <strong>${data.siteName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px; line-height: 1.6; white-space: pre-line;">
${data.customMessage || defaultMessage}
              </p>
              
              <!-- Report Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #3BD16F; border-radius: 4px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #0B1220; font-size: 16px; font-weight: 600;">Report Summary</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #4a5568; font-size: 14px;">Total Reports:</td>
                        <td style="padding: 4px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.reportCount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #4a5568; font-size: 14px;">Site:</td>
                        <td style="padding: 4px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.siteName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #4a5568; font-size: 14px;">Date:</td>
                        <td style="padding: 4px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                Respectfully,<br>
                <strong style="color: #0B1220;">Security Operations Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px; line-height: 1.5;">
                Guard Up Security Operations<br>
                Professional Security Management Platform<br>
                <a href="https://guardupinc.com" style="color: #FF7A18; text-decoration: none;">guardupinc.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  },

  // Guard Shift Assignment Template
  shiftAssignment: (data: ShiftAssignmentTemplateData) => ({
    subject: `New Shift Assignment - ${data.siteName} - ${data.date}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Shift Assignment</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B1220 0%, #1a2332 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">New Shift Assignment</h1>
              <p style="margin: 8px 0 0 0; color: #3BD16F; font-size: 14px; font-weight: 600;">📋 You've Been Scheduled</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #0B1220; font-size: 15px; line-height: 1.6;">
                Hello <strong>${data.guardName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                You have been assigned to a new shift. Please review the details below:
              </p>
              
              <!-- Shift Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #3BD16F 0%, #2ba35a 100%); border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 14px;">🏢 Site:</td>
                        <td style="padding: 8px 0; color: #ffffff; font-size: 15px; font-weight: 700; text-align: right;">${data.siteName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 14px;">📅 Date:</td>
                        <td style="padding: 8px 0; color: #ffffff; font-size: 15px; font-weight: 700; text-align: right;">${data.date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 14px;">⏰ Time:</td>
                        <td style="padding: 8px 0; color: #ffffff; font-size: 15px; font-weight: 700; text-align: right;">${data.startTime} - ${data.endTime}</td>
                      </tr>
                      ${data.shiftType ? `
                      <tr>
                        <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 14px;">🌙 Shift Type:</td>
                        <td style="padding: 8px 0; color: #ffffff; font-size: 15px; font-weight: 700; text-align: right;">${data.shiftType}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              ${data.specialInstructions ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #FF7A18; border-radius: 4px; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 600;">⚠️ Special Instructions</p>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">${data.specialInstructions}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 20px 0 0 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                Please log in to the <strong>Guard Portal</strong> to view full shift details, confirm your availability, and access site-specific procedures.
              </p>
              
              <p style="margin: 16px 0 0 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                Stay safe,<br>
                <strong style="color: #0B1220;">Guard Up Operations</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px; line-height: 1.5; text-align: center;">
                Guard Up Security | <a href="https://guardupinc.com" style="color: #FF7A18; text-decoration: none;">guardupinc.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  // Incident Alert Template
  incidentAlert: (data: IncidentAlertTemplateData) => {
    const severityColors = {
      critical: { bg: '#dc2626', text: '#ffffff', badge: '#fecaca' },
      high: { bg: '#ea580c', text: '#ffffff', badge: '#fed7aa' },
      medium: { bg: '#f59e0b', text: '#ffffff', badge: '#fde68a' },
      low: { bg: '#10b981', text: '#ffffff', badge: '#d1fae5' },
    };
    
    const colors = severityColors[data.severity];
    
    return {
      subject: `🚨 ${data.severity.toUpperCase()} Security Incident - ${data.siteName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Incident Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 4px solid ${colors.bg};">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #0B1220; font-size: 24px; font-weight: 700;">🚨 Security Incident Alert</h1>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background-color: ${colors.bg}; color: ${colors.text}; font-size: 12px; font-weight: 700; text-transform: uppercase; border-radius: 4px; letter-spacing: 0.5px;">${data.severity}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Alert Banner -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.badge}; border-left: 4px solid ${colors.bg}; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #0B1220; font-size: 15px; font-weight: 600;">
                      ${data.incidentType}
                    </p>
                    <p style="margin: 4px 0 0 0; color: #4a5568; font-size: 13px;">
                      Case ID: <strong>${data.incidentId}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <!-- Incident Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px; width: 120px;">🏢 Site:</td>
                        <td style="padding: 6px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.siteName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px;">📍 Location:</td>
                        <td style="padding: 6px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.location}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px;">⏰ Time:</td>
                        <td style="padding: 6px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.timestamp}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px;">👤 Reported By:</td>
                        <td style="padding: 6px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.reportedBy}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Summary -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; color: #0B1220; font-size: 15px; font-weight: 600;">Incident Summary</p>
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                  ${data.summary}
                </p>
              </div>
              
              ${data.actionTaken ? `
              <!-- Action Taken -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; color: #0B1220; font-size: 15px; font-weight: 600;">Immediate Action Taken</p>
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                  ${data.actionTaken}
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 20px 0 0 0; padding: 16px; background-color: #fff3cd; border-radius: 4px; color: #856404; font-size: 13px; line-height: 1.5;">
                ⚠️ <strong>Action Required:</strong> Please review this incident in the Admin Portal and take appropriate follow-up action.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px; line-height: 1.5; text-align: center;">
                Guard Up Security Operations | <a href="https://guardupinc.com" style="color: #FF7A18; text-decoration: none;">guardupinc.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  },

  // License Expiration Warning Template
  licenseExpiration: (data: LicenseExpirationTemplateData) => {
    const urgencyLevel = data.daysRemaining <= 7 ? 'critical' : data.daysRemaining <= 14 ? 'warning' : 'notice';
    const urgencyColors = {
      critical: { bg: '#dc2626', text: '#ffffff', banner: '#fecaca' },
      warning: { bg: '#f59e0b', text: '#ffffff', banner: '#fde68a' },
      notice: { bg: '#FF7A18', text: '#ffffff', banner: '#fed7aa' },
    };
    
    const colors = urgencyColors[urgencyLevel];
    
    return {
      subject: `${data.daysRemaining <= 7 ? '🚨 URGENT' : '⚠️'} License Expiration - ${data.guardName} - ${data.daysRemaining} Days`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>License Expiration Warning</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 4px solid ${colors.bg};">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <h1 style="margin: 0; color: #0B1220; font-size: 24px; font-weight: 700;">
                ${data.daysRemaining <= 7 ? '🚨' : '⚠️'} License Expiration Warning
              </h1>
            </td>
          </tr>
          
          <!-- Alert Banner -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.banner}; border-left: 4px solid ${colors.bg}; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: ${colors.bg}; font-size: 18px; font-weight: 700; text-align: center;">
                      ${data.daysRemaining} Day${data.daysRemaining !== 1 ? 's' : ''} Until Expiration
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <p style="margin: 0 0 20px 0; color: #0B1220; font-size: 15px; line-height: 1.6;">
                Hello <strong>${data.guardName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                ${data.daysRemaining <= 7 
                  ? 'This is an <strong style="color: #dc2626;">URGENT</strong> reminder that your security license is expiring very soon.' 
                  : 'This is a reminder that your security license is approaching expiration.'
                }
              </p>
              
              <!-- License Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #0B1220; font-size: 16px; font-weight: 600;">License Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px; width: 140px;">Guard Name:</td>
                        <td style="padding: 6px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.guardName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px;">License Type:</td>
                        <td style="padding: 6px 0; color: #0B1220; font-size: 14px; font-weight: 600;">${data.licenseType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px;">Expiration Date:</td>
                        <td style="padding: 6px 0; color: ${colors.bg}; font-size: 14px; font-weight: 700;">${data.expirationDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #718096; font-size: 13px;">Days Remaining:</td>
                        <td style="padding: 6px 0; color: ${colors.bg}; font-size: 16px; font-weight: 700;">${data.daysRemaining}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Action Required Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #3BD16F 0%, #2ba35a 100%); border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #ffffff; font-size: 16px; font-weight: 700;">✓ Next Steps</p>
                    <ul style="margin: 0; padding-left: 20px; color: rgba(255,255,255,0.95); font-size: 14px; line-height: 1.8;">
                      <li>Submit your license renewal documentation as soon as possible</li>
                      <li>Upload renewal documents to the Document Vault in the Guard Portal</li>
                      <li>Contact HR if you need assistance with the renewal process</li>
                      ${data.daysRemaining <= 7 ? '<li style="font-weight: 700;">⚠️ Work assignments may be affected if license expires</li>' : ''}
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                Please take immediate action to avoid any work interruptions. If you have already submitted your renewal, please disregard this notice.
              </p>
              
              <p style="margin: 16px 0 0 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                Thank you,<br>
                <strong style="color: #0B1220;">Guard Up HR Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px; line-height: 1.5; text-align: center;">
                Guard Up Security | <a href="https://guardupinc.com" style="color: #FF7A18; text-decoration: none;">guardupinc.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  },
};

// Template type validator
export function isValidTemplate(template: string): template is keyof typeof templates {
  return template in templates;
}
