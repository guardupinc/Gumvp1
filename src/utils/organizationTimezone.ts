/**
 * ORGANIZATION TIMEZONE UTILITIES
 * ================================
 * Centralized timezone formatting for consistent display across UI and PDFs.
 * All timestamps should be formatted using the organization's timezone.
 * 
 * DEFAULT TIMEZONE: America/New_York (Eastern Time)
 */

export const DEFAULT_ORGANIZATION_TIMEZONE = 'America/New_York';

/**
 * Format a timestamp to a human-readable string in the organization's timezone
 * 
 * @param isoTimestamp - ISO 8601 timestamp string (e.g., "2026-01-08T14:30:00Z")
 * @param timezone - Organization timezone (defaults to America/New_York)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted timestamp string
 * 
 * @example
 * formatTimestamp("2026-01-08T14:30:00Z") 
 * // => "Jan 8, 2026 9:30 AM EST"
 */
export function formatTimestamp(
  isoTimestamp: string | undefined | null,
  timezone: string = DEFAULT_ORGANIZATION_TIMEZONE,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoTimestamp) return 'N/A';
  
  try {
    const date = new Date(isoTimestamp);
    
    // Default options for full timestamp display
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: timezone,
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a timestamp for PDF output (no timezone abbreviation)
 * 
 * @param isoTimestamp - ISO 8601 timestamp string
 * @param timezone - Organization timezone
 * @returns Formatted timestamp without timezone abbreviation
 * 
 * @example
 * formatTimestampForPDF("2026-01-08T14:30:00Z")
 * // => "Jan 8, 2026 9:30 AM"
 */
export function formatTimestampForPDF(
  isoTimestamp: string | undefined | null,
  timezone: string = DEFAULT_ORGANIZATION_TIMEZONE
): string {
  if (!isoTimestamp) return 'N/A';
  
  try {
    const date = new Date(isoTimestamp);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting timestamp for PDF:', error);
    return 'Invalid Date';
  }
}

/**
 * Format just the date portion (no time)
 * 
 * @param isoTimestamp - ISO 8601 timestamp string
 * @param timezone - Organization timezone
 * @returns Formatted date string
 * 
 * @example
 * formatDateOnly("2026-01-08T14:30:00Z")
 * // => "Jan 8, 2026"
 */
export function formatDateOnly(
  isoTimestamp: string | undefined | null,
  timezone: string = DEFAULT_ORGANIZATION_TIMEZONE
): string {
  if (!isoTimestamp) return 'N/A';
  
  try {
    const date = new Date(isoTimestamp);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timezone
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format just the time portion (no date)
 * 
 * @param isoTimestamp - ISO 8601 timestamp string
 * @param timezone - Organization timezone
 * @returns Formatted time string
 * 
 * @example
 * formatTimeOnly("2026-01-08T14:30:00Z")
 * // => "9:30 AM"
 */
export function formatTimeOnly(
  isoTimestamp: string | undefined | null,
  timezone: string = DEFAULT_ORGANIZATION_TIMEZONE
): string {
  if (!isoTimestamp) return 'N/A';
  
  try {
    const date = new Date(isoTimestamp);
    
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
}

/**
 * Format approval/review timestamp specifically
 * Uses approved_at/reviewed_at (finalized timestamp), not created_at
 * 
 * @param approvedAt - Approval timestamp (ISO 8601)
 * @param timezone - Organization timezone
 * @returns Formatted approval timestamp
 * 
 * @example
 * formatApprovalTimestamp("2026-01-08T15:45:00Z")
 * // => "Jan 8, 2026 10:45 AM EST"
 */
export function formatApprovalTimestamp(
  approvedAt: string | undefined | null,
  timezone: string = DEFAULT_ORGANIZATION_TIMEZONE
): string {
  return formatTimestamp(approvedAt, timezone);
}

/**
 * Get organization timezone from organization object
 * Falls back to default if not specified
 * 
 * @param organization - Organization object with settings
 * @returns Organization timezone string
 */
export function getOrganizationTimezone(organization?: any): string {
  return organization?.settings?.timezone || DEFAULT_ORGANIZATION_TIMEZONE;
}
