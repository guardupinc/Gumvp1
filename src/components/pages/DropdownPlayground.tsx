import React, { useState } from 'react';
import { GUSelect } from '../ui/GUSelect';
import { GUCombobox } from '../ui/GUCombobox';

/**
 * Dropdown Playground - Internal test page to verify dropdown consistency
 * Tests both GUSelect and GUCombobox components with various configurations
 */
export function DropdownPlayground() {
  // State for various dropdowns
  const [location, setLocation] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [urgency, setUrgency] = useState('');
  const [shift, setShift] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('normal');

  // Location options (large list - searchable)
  const locationOptions = [
    { value: 'Building A - Main Entrance', label: 'Building A - Main Entrance' },
    { value: 'Building B - Reception Area', label: 'Building B - Reception Area' },
    { value: 'Building C - Conference Room', label: 'Building C - Conference Room' },
    { value: 'Building D - Storage Area', label: 'Building D - Storage Area' },
    { value: 'Building E - Office Suite', label: 'Building E - Office Suite' },
    { value: 'Building F - Kitchen', label: 'Building F - Kitchen' },
    { value: 'Building G - Gym', label: 'Building G - Gym' },
    { value: 'Building H - Library', label: 'Building H - Library' },
    { value: 'Building I - Auditorium', label: 'Building I - Auditorium' },
    { value: 'Building J - Cafeteria', label: 'Building J - Cafeteria' },
    { value: 'Building K - Workshop', label: 'Building K - Workshop' },
    { value: 'Building L - Laboratory', label: 'Building L - Laboratory' },
    { value: 'Building M - Medical Center', label: 'Building M - Medical Center' },
    { value: 'Building N - Security Room', label: 'Building N - Security Room' },
    { value: 'Building O - Maintenance Room', label: 'Building O - Maintenance Room' },
    { value: 'Parking Structure C', label: 'Parking Structure C' },
    { value: 'Manufacturing Wing D', label: 'Manufacturing Wing D' }
  ];

  // Incident type options (searchable)
  const incidentTypeOptions = [
    { value: 'Theft', label: 'Theft' },
    { value: 'Trespassing', label: 'Trespassing' },
    { value: 'Vandalism', label: 'Vandalism' },
    { value: 'Medical Emergency', label: 'Medical Emergency' },
    { value: 'Fire Alarm', label: 'Fire Alarm' },
    { value: 'Assault', label: 'Assault' },
    { value: 'Noise Complaint', label: 'Noise Complaint' },
    { value: 'Suspicious Activity', label: 'Suspicious Activity' },
    { value: 'Property Damage', label: 'Property Damage' },
    { value: 'Unauthorized Access', label: 'Unauthorized Access' },
    { value: 'Other', label: 'Other' }
  ];

  // Urgency options (simple select)
  const urgencyOptions = [
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  // Shift options (simple select)
  const shiftOptions = [
    { value: 'Day', label: 'Day' },
    { value: 'Swing', label: 'Swing' },
    { value: 'Night', label: 'Night' },
    { value: 'Overnight', label: 'Overnight' }
  ];

  // Category options (simple select)
  const categoryOptions = [
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Plumbing', label: 'Plumbing' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'Access Control', label: 'Access Control' },
    { value: 'Safety Hazard', label: 'Safety Hazard' },
    { value: 'General', label: 'General' }
  ];

  // Priority options (simple select)
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Dropdown Playground</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Internal test page to verify dropdown styling and interaction consistency
          </p>
        </div>

        {/* Test Sections */}
        <div className="space-y-8">
          {/* Section 1: Searchable Dropdowns (GUCombobox) */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Searchable Dropdowns (GUCombobox)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GUCombobox
                label="Location / Site"
                value={location}
                onChange={setLocation}
                options={locationOptions}
                placeholder="Select location..."
                searchPlaceholder="Search for site..."
                required
              />
              <GUCombobox
                label="Incident Type"
                value={incidentType}
                onChange={setIncidentType}
                options={incidentTypeOptions}
                placeholder="Select type..."
                searchPlaceholder="Search incident types..."
              />
            </div>
            {/* Display selected values */}
            <div className="mt-4 p-3 bg-[rgba(255,255,255,0.02)] rounded border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">Selected Values:</p>
              <p className="text-sm">
                <span className="text-[var(--text-muted)]">Location:</span>{' '}
                <span className="text-[var(--primary-action)]">{location || 'None'}</span>
              </p>
              <p className="text-sm">
                <span className="text-[var(--text-muted)]">Incident Type:</span>{' '}
                <span className="text-[var(--primary-action)]">{incidentType || 'None'}</span>
              </p>
            </div>
          </div>

          {/* Section 2: Simple Dropdowns (GUSelect) */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Simple Dropdowns (GUSelect)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GUSelect
                label="Urgency"
                value={urgency}
                onChange={setUrgency}
                options={urgencyOptions}
                placeholder="Select urgency..."
                required
              />
              <GUSelect
                label="Shift"
                value={shift}
                onChange={setShift}
                options={shiftOptions}
                placeholder="Select shift..."
              />
              <GUSelect
                label="Category"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                placeholder="Select category..."
              />
              <GUSelect
                label="Priority"
                value={priority}
                onChange={setPriority}
                options={priorityOptions}
              />
            </div>
            {/* Display selected values */}
            <div className="mt-4 p-3 bg-[rgba(255,255,255,0.02)] rounded border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">Selected Values:</p>
              <p className="text-sm">
                <span className="text-[var(--text-muted)]">Urgency:</span>{' '}
                <span className="text-[var(--primary-action)]">{urgency || 'None'}</span>
              </p>
              <p className="text-sm">
                <span className="text-[var(--text-muted)]">Shift:</span>{' '}
                <span className="text-[var(--primary-action)]">{shift || 'None'}</span>
              </p>
              <p className="text-sm">
                <span className="text-[var(--text-muted)]">Category:</span>{' '}
                <span className="text-[var(--primary-action)]">{category || 'None'}</span>
              </p>
              <p className="text-sm">
                <span className="text-[var(--text-muted)]">Priority:</span>{' '}
                <span className="text-[var(--primary-action)]">{priority || 'None'}</span>
              </p>
            </div>
          </div>

          {/* Section 3: Disabled State */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Disabled State</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GUCombobox
                label="Disabled Combobox"
                value="Building A - Main Entrance"
                onChange={() => {}}
                options={locationOptions}
                disabled
              />
              <GUSelect
                label="Disabled Select"
                value="High"
                onChange={() => {}}
                options={urgencyOptions}
                disabled
              />
            </div>
          </div>

          {/* Section 4: Testing Instructions */}
          <div className="bg-[rgba(59,209,111,0.08)] border border-[rgba(59,209,111,0.2)] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 text-[var(--primary-action)]">Testing Checklist</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary-action)] mt-0.5">✓</span>
                <span>Single click on trackpad selects an option (no double-click needed)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary-action)] mt-0.5">✓</span>
                <span>Search input in GUCombobox is properly styled and vertically centered</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary-action)] mt-0.5">✓</span>
                <span>Dropdown trigger matches standard input styling (height, padding, colors)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary-action)] mt-0.5">✓</span>
                <span>Keyboard navigation works (Arrow keys, Enter, Escape)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary-action)] mt-0.5">✓</span>
                <span>Selected items show checkmark on the right</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary-action)] mt-0.5">✓</span>
                <span>Clicking inside search input doesn't close dropdown</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary-action)] mt-0.5">✓</span>
                <span>Disabled dropdowns show proper opacity and cursor</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}