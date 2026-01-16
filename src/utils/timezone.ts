/**
 * Timezone Utility
 * 
 * Handles timezone detection and date/time formatting throughout the application.
 * Ensures UTC timestamps from the database are displayed in the user's local timezone.
 */

/**
 * Get the display timezone for the current user.
 * Priority: company.timezone > user.profile.timezone > browser detected timezone
 */
export function getDisplayTimezone(): string {
  // For Guard Up MVP, we use a fixed America/New_York timezone
  // TODO: Once we have company/user timezone preferences in the database,
  // we can fetch them here.
  
  return 'America/New_York'; // Fixed for Guard Up MVP
}

/**
 * Organization timezone (default for Guard Up MVP)
 */
export function getOrgTimezone(): string {
  return 'America/New_York';
}

/**
 * Format a UTC timestamp (from Supabase timestamptz) to local date and time.
 * 
 * @param utcTimestamp - ISO string from database (e.g., "2026-01-09T04:35:00Z")
 * @param options - Optional Intl.DateTimeFormat options
 * @returns Formatted date/time string in local timezone
 * 
 * Example:
 *   Input: "2026-01-09T04:35:00Z" (UTC)
 *   Output: "Jan 8, 2026, 11:35 PM" (America/New_York)
 */
export function formatTimestamp(
  utcTimestamp: string | null | undefined,
  options?: Partial<Intl.DateTimeFormatOptions>
): string {
  if (!utcTimestamp) return 'N/A';
  
  try {
    const displayTz = getDisplayTimezone();
    const date = new Date(utcTimestamp);
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: displayTz,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Failed to format timestamp:', error);
    return utcTimestamp;
  }
}

/**
 * Format a UTC timestamp to just the date portion in local timezone.
 * 
 * @param utcTimestamp - ISO string from database
 * @returns Formatted date string (e.g., "Jan 8, 2026")
 */
export function formatDate(utcTimestamp: string | null | undefined): string {
  if (!utcTimestamp) return 'N/A';
  
  return formatTimestamp(utcTimestamp, {
    hour: undefined,
    minute: undefined
  });
}

/**
 * Format a UTC timestamp to just the time portion in local timezone.
 * 
 * @param utcTimestamp - ISO string from database
 * @returns Formatted time string (e.g., "11:35 PM")
 */
export function formatTime(utcTimestamp: string | null | undefined): string {
  if (!utcTimestamp) return 'N/A';
  
  return formatTimestamp(utcTimestamp, {
    year: undefined,
    month: undefined,
    day: undefined
  });
}

/**
 * Get the current local date in YYYY-MM-DD format.
 * This is safe to use for date-only fields like "Date of Incident".
 * 
 * IMPORTANT: Do NOT use new Date().toISOString().split('T')[0] because
 * that produces UTC date and can jump to the next day at night.
 * 
 * @returns Local date string (e.g., "2026-01-08")
 */
export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get the current local time in HH:MM format.
 * 
 * @returns Local time string (e.g., "23:35")
 */
export function getCurrentLocalTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Format a date-only string (YYYY-MM-DD) for display.
 * 
 * @param dateString - Date string in YYYY-MM-DD format or already formatted
 * @returns Formatted date (e.g., "Jan 8, 2026")
 */
export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    // If it's already formatted (contains letters or commas), return as-is
    if (/[a-zA-Z]/.test(dateString) || dateString.includes(',')) {
      return dateString;
    }
    
    // Check if it's a valid YYYY-MM-DD format
    if (!dateString.includes('-') || dateString.split('-').length !== 3) {
      console.warn('Invalid date format:', dateString);
      return dateString;
    }
    
    // Parse the date string as local date (not UTC)
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Validate the parsed numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.warn('Invalid date values:', { year, month, day });
      return dateString;
    }
    
    // Create date object (month is 0-indexed)
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date object:', dateString);
      return dateString;
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Failed to format date-only:', error, 'Input:', dateString);
    return dateString;
  }
}

/**
 * Format a time string (HH:MM or HH:MM:SS) for display.
 * 
 * @param timeString - Time string in HH:MM format or already formatted
 * @returns Formatted time (e.g., "11:35 PM")
 */
export function formatTimeOnly(timeString: string | null | undefined): string {
  if (!timeString) return 'N/A';
  
  try {
    // If it's already formatted (contains AM/PM or letters), return as-is
    if (/[a-zA-Z]/.test(timeString)) {
      return timeString;
    }
    
    // Check if it contains a colon
    if (!timeString.includes(':')) {
      console.warn('Invalid time format:', timeString);
      return timeString;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Validate the parsed numbers
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('Invalid time values:', { hours, minutes });
      return timeString;
    }
    
    // Validate hour and minute ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Time values out of range:', { hours, minutes });
      return timeString;
    }
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid time object:', timeString);
      return timeString;
    }
    
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Failed to format time-only:', error, 'Input:', timeString);
    return timeString;
  }
}

/**
 * Combine a date-only and time-only string for display.
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format
 * @returns Formatted date and time (e.g., "Jan 8, 2026, 11:35 PM")
 */
export function formatDateAndTime(
  dateString: string | null | undefined,
  timeString: string | null | undefined
): string {
  if (!dateString) return 'N/A';
  
  const datePart = formatDateOnly(dateString);
  
  if (!timeString) return datePart;
  
  const timePart = formatTimeOnly(timeString);
  
  return `${datePart}, ${timePart}`;
}

/**
 * Format a relative time (e.g., "2 hours ago", "3 days ago").
 * 
 * @param utcTimestamp - ISO string from database
 * @returns Relative time string
 */
export function formatRelativeTime(utcTimestamp: string | null | undefined): string {
  if (!utcTimestamp) return 'N/A';
  
  try {
    const date = new Date(utcTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    // For older dates, show the actual date
    return formatDate(utcTimestamp);
  } catch (error) {
    console.error('Failed to format relative time:', error);
    return formatTimestamp(utcTimestamp);
  }
}

/**
 * Format timestamp for approval/rejection display
 * Format: "Jan 8, 2026 • 2:51 AM"
 * 
 * @param utcTimestamp - ISO string from database (UTC)
 * @returns Formatted string with bullet separator
 */
export function formatReviewTimestamp(utcTimestamp: string | null | undefined): string {
  if (!utcTimestamp) return 'N/A';
  
  try {
    const timezone = getOrgTimezone();
    const date = new Date(utcTimestamp);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format date part: "Jan 8, 2026"
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format time part: "2:51 AM"
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const dateStr = dateFormatter.format(date);
    const timeStr = timeFormatter.format(date);
    
    return `${dateStr} • ${timeStr}`;
  } catch (error) {
    console.error('Failed to format review timestamp:', error);
    return utcTimestamp;
  }
}