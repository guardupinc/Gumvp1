// ============================================================================
// LICENSE EXPIRATION CHECKER & EMAIL NOTIFICATION SYSTEM
// ============================================================================
// This utility automatically checks for expiring licenses and sends email
// warnings at 30, 14, and 7 days before expiration.

import { GUARDS_MASTER_LIST, Guard } from './guardsData';
import { projectId, publicAnonKey } from './supabase/info';

interface LicenseAlert {
  guard: Guard;
  licenseType: 'Security Guard Card' | 'General License' | 'Certification';
  expirationDate: string;
  daysRemaining: number;
  urgencyLevel: 'notice' | 'warning' | 'critical';
}

// Helper function to calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

// Parse date string in various formats (e.g., "Sep 15, 2025" or "10/15/2025")
function parseExpiryDate(dateStr: string): Date | null {
  try {
    // Try parsing as MM/DD/YYYY
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    // Try parsing as "Mon DD, YYYY"
    return new Date(dateStr);
  } catch (error) {
    console.error(`Failed to parse date: ${dateStr}`, error);
    return null;
  }
}

// Get urgency level based on days remaining
function getUrgencyLevel(daysRemaining: number): 'notice' | 'warning' | 'critical' {
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 14) return 'warning';
  return 'notice';
}

// Send license expiration warning email
async function sendLicenseWarningEmail(alert: LicenseAlert): Promise<void> {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e7fd76e8/email/send-license-warning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        guardEmail: alert.guard.email,
        guardName: alert.guard.name,
        licenseType: alert.licenseType,
        expirationDate: alert.expirationDate,
        daysRemaining: alert.daysRemaining
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send license warning');
    }

    console.log(`✓ License warning sent to ${alert.guard.name} (${alert.daysRemaining} days remaining)`);
    return await response.json();
  } catch (error) {
    console.error('License warning email error:', error);
    throw error;
  }
}

// Check all guards for expiring licenses
export function checkExpiringLicenses(): LicenseAlert[] {
  const alerts: LicenseAlert[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  GUARDS_MASTER_LIST.forEach(guard => {
    // Check Security Guard Card
    if (guard.securityGuardCard) {
      const expiryDate = parseExpiryDate(guard.securityGuardCard.expiryDate);
      if (expiryDate) {
        const daysRemaining = daysBetween(today, expiryDate);
        
        // Alert at 30, 14, and 7 days (or if already expired)
        if (daysRemaining <= 30 && daysRemaining >= 0) {
          alerts.push({
            guard,
            licenseType: 'Security Guard Card',
            expirationDate: guard.securityGuardCard.expiryDate,
            daysRemaining,
            urgencyLevel: getUrgencyLevel(daysRemaining)
          });
        }
      }
    }

    // Check General License Expiry
    if (guard.licenseExpiry) {
      const expiryDate = parseExpiryDate(guard.licenseExpiry);
      if (expiryDate) {
        const daysRemaining = daysBetween(today, expiryDate);
        
        if (daysRemaining <= 30 && daysRemaining >= 0) {
          alerts.push({
            guard,
            licenseType: 'General License',
            expirationDate: guard.licenseExpiry,
            daysRemaining,
            urgencyLevel: getUrgencyLevel(daysRemaining)
          });
        }
      }
    }

    // Check Certification Expiry
    if (guard.certExpiry) {
      const expiryDate = parseExpiryDate(guard.certExpiry);
      if (expiryDate) {
        const daysRemaining = daysBetween(today, expiryDate);
        
        if (daysRemaining <= 30 && daysRemaining >= 0) {
          alerts.push({
            guard,
            licenseType: 'Certification',
            expirationDate: guard.certExpiry,
            daysRemaining,
            urgencyLevel: getUrgencyLevel(daysRemaining)
          });
        }
      }
    }
  });

  return alerts;
}

// Send email notifications for expiring licenses
export async function sendLicenseExpirationNotifications(): Promise<void> {
  const alerts = checkExpiringLicenses();
  
  if (alerts.length === 0) {
    console.log('✓ No expiring licenses found');
    return;
  }

  console.log(`Found ${alerts.length} expiring license(s), sending notifications...`);

  // Filter alerts that should trigger emails (30, 14, 7 days)
  const criticalAlerts = alerts.filter(alert => 
    alert.daysRemaining === 30 || 
    alert.daysRemaining === 14 || 
    alert.daysRemaining === 7 ||
    alert.daysRemaining <= 3 // Daily alerts for final 3 days
  );

  // Send emails for critical alerts
  const emailPromises = criticalAlerts.map(alert => sendLicenseWarningEmail(alert));
  
  try {
    await Promise.allSettled(emailPromises);
    console.log(`✓ Sent ${criticalAlerts.length} license warning email(s)`);
  } catch (error) {
    console.error('Error sending license warning emails:', error);
  }
}

// Get summary of expiring licenses for dashboard display
export function getExpiringLicensesSummary(): {
  critical: number; // ≤7 days
  warning: number;  // ≤14 days
  notice: number;   // ≤30 days
  total: number;
} {
  const alerts = checkExpiringLicenses();
  
  return {
    critical: alerts.filter(a => a.urgencyLevel === 'critical').length,
    warning: alerts.filter(a => a.urgencyLevel === 'warning').length,
    notice: alerts.filter(a => a.urgencyLevel === 'notice').length,
    total: alerts.length
  };
}

// Schedule automatic daily checks (call this on app initialization)
export function initializeLicenseExpirationChecker(): void {
  // Run check immediately on initialization
  sendLicenseExpirationNotifications().catch(error => {
    console.error('Failed to send initial license notifications:', error);
  });

  // Schedule daily checks at 9:00 AM
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(9, 0, 0, 0);
  
  // If it's past 9 AM today, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const timeUntilFirstRun = scheduledTime.getTime() - now.getTime();
  
  setTimeout(() => {
    // Run the check
    sendLicenseExpirationNotifications().catch(error => {
      console.error('Failed to send scheduled license notifications:', error);
    });
    
    // Then run every 24 hours
    setInterval(() => {
      sendLicenseExpirationNotifications().catch(error => {
        console.error('Failed to send scheduled license notifications:', error);
      });
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, timeUntilFirstRun);
  
  console.log(`✓ License expiration checker initialized. Next check at ${scheduledTime.toLocaleString()}`);
}
