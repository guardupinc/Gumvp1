// Shared active shift data - synced with LiveOperations
// In production: This would query the database for guards with status = 'On Shift'

export interface ActiveGuard {
  id: number;
  name: string;
  location: string;
}

// Get list of guards currently on active shifts
// This data is the single source of truth for guard shift status
export function getActiveShiftGuards(): ActiveGuard[] {
  return [
    { id: 1, name: 'John Smith', location: 'Building A - Main Entrance' },
    { id: 2, name: 'Maria Garcia', location: 'Building B - Parking Lot' },
    { id: 4, name: 'Sarah Chen', location: 'Building A - Security Office' },
    { id: 5, name: 'Robert Brown', location: 'Building B - Loading Dock' },
    { id: 6, name: 'Lisa Wang', location: 'Parking Structure C' },
    { id: 7, name: 'Alex Johnson', location: 'Building A' },
    { id: 8, name: 'Kevin Torres', location: 'Manufacturing Wing D' },
  ];
}

// Check if a guard is currently on an active shift
export function isGuardOnShift(guardId: number): boolean {
  const activeGuards = getActiveShiftGuards();
  return activeGuards.some(guard => guard.id === guardId);
}

// Get the total count of active guards
export function getActiveShiftCount(): number {
  return getActiveShiftGuards().length;
}
