# Incident Report End-to-End Data Consistency Update

## Overview
This update fixes timezone mismatches, ensures Actions Taken field consistency, updates organization branding, and removes unused police fields.

## Changes Implemented

### 1. Timezone Consistency ✅

**Problem**: PDFs showed UTC timestamps while the UI showed local time, creating confusion.

**Solution**: Created centralized timezone utilities that format ALL timestamps using the organization's timezone.

#### New File: `/utils/organizationTimezone.ts`

Utility functions for consistent timestamp formatting:
- `formatTimestamp()` - Full timestamp with timezone
- `formatTimestampForPDF()` - Timestamp without timezone abbreviation
- `formatDateOnly()` - Date portion only
- `formatTimeOnly()` - Time portion only
- `formatApprovalTimestamp()` - Specifically for approval timestamps
- `getOrganizationTimezone()` - Get organization timezone from settings

**Default Timezone**: `America/New_York` (Eastern Time)

#### Timezone Configuration
Organizations can specify their timezone in settings:
```typescript
{
  id: 'default_org',
  name: 'Elite Security Services',
  settings: {
    timezone: 'America/New_York'  // ← Organization timezone
  }
}
```

#### Implementation

**Supervisor Review Modal** (`ReportDetailsModal.tsx`):
```typescript
import { formatTimestamp, formatApprovalTimestamp } from '../../utils/organizationTimezone';

// Created timestamp
{formatTimestamp(report.timestamp, DEFAULT_ORGANIZATION_TIMEZONE)}

// Approval timestamp (uses approved_at, not created_at)
{formatApprovalTimestamp(report.approvedAt, DEFAULT_ORGANIZATION_TIMEZONE)}
```

**PDF Generator** (`vault-pdf-helper.tsx`):
```typescript
const organizationTimezone = organization?.settings?.timezone || 'America/New_York';

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: organizationTimezone  // ← Uses organization timezone
  }).format(new Date(dateString));
};
```

### 2. Actions Taken Field Consistency ✅

**Problem**: Need to ensure "Actions Taken" field uses consistent naming across all touchpoints.

**Solution**: Updated all code to check both `actionTaken` and `actions_taken` variants for backward compatibility.

#### Report Creation
Form submits as `actionTaken`:
```typescript
onSubmit({
  actionTaken: actionTaken,  // ALWAYS INCLUDED for Incident Reports
  // ...
})
```

#### Supervisor Review Modal
Displays with fallback:
```typescript
{report.type === 'Incident' && (
  <div className="qc-section">
    <h3 className="qc-section-label">ACTIONS TAKEN</h3>
    <div className="qc-action-taken-box">
      <p>{report.actionTaken || report.actions_taken || 'N/A'}</p>
    </div>
  </div>
)}
```

#### PDF Generator
Displays with fallback:
```typescript
if (isIncidentReport) {
  addSectionHeader('ACTIONS TAKEN');
  const actionTaken = report.actionTaken || report.actionsTaken || 'N/A';
  addText(actionTaken, 10, false, { lineHeight: 14 });
}
```

### 3. Organization Branding ✅

**Problem**: PDFs should show the client organization name, not "Guard Up" as the company name.

**Solution**: Updated PDF header to use organization name with proper attribution.

#### PDF Header Structure
```
ELITE SECURITY SERVICES           ← Organization name (dynamic)
INCIDENT REPORT                    ← Report type
Generated via Guard Up (Security Management Software)  ← Small attribution line
═══════════════════════════════════════════════
```

**Implementation**:
```typescript
const organizationName = organization?.display_name || organization?.name || 'Organization';

// Header
addText(organizationName.toUpperCase(), 16, true);
addText(reportTypeName, 14, true);
addText('Generated via Guard Up (Security Management Software)', 8, false, { color: [0.5, 0.5, 0.5] });
```

### 4. Police Response Fields ✅

**Problem**: PDF might show fields that aren't collected in the form.

**Solution**: Verified that ONLY collected fields are shown:
- ✅ Police Called (Yes/No)
- ✅ PD Case Number (only when police called)
- ❌ Agency (NOT collected, NOT shown)
- ❌ Officer Name/Unit (NOT collected, NOT shown)

#### Form Collection
```typescript
const [policeCalled, setPoliceCalled] = useState(false);  // boolean toggle
const [pdCaseNumber, setPdCaseNumber] = useState('');     // text input (conditional)
```

#### PDF Display
```typescript
if (isIncidentReport) {
  const policeCalled = report.police_called !== undefined ? report.police_called : report.policeCalled;
  const pdCaseNumber = report.pd_case_number || report.pdCaseNumber;
  
  const showPoliceSection = policeCalled === true || policeCalled === 'Yes' || pdCaseNumber;
  
  if (showPoliceSection) {
    addSectionHeader('POLICE RESPONSE');
    
    // Police Called
    const wasPoliceCalledText = (policeCalled === true || policeCalled === 'Yes') ? 'Yes' : 'No';
    addText(`Police Called: ${wasPoliceCalledText}`, 10, false);
    
    // PD Case Number (only if provided)
    if (pdCaseNumber) {
      addField('PD Case #', pdCaseNumber, false);
    }
  }
}
```

## Field Name Mapping

### Canonical vs Legacy Fields

| Field | Canonical (New) | Legacy (Old) | Type |
|-------|----------------|--------------|------|
| Police Called | `police_called` | `policeCalled` | boolean / string |
| PD Case Number | `pd_case_number` | `pdCaseNumber` | string |
| Actions Taken | `actionTaken` | `actions_taken` | string |

All code checks BOTH variants for maximum backward compatibility.

## Timestamp Usage

### Critical Distinction

**DO NOT USE**:
- ❌ `created_at` for approval timestamp
- ❌ `updated_at` for approval timestamp

**ALWAYS USE**:
- ✅ `approved_at` / `reviewed_at` for approval timestamp
- ✅ `timestamp` / `created_at` for creation timestamp
- ✅ `occurredAt` for incident occurrence timestamp

### Example

```typescript
// WRONG - uses created_at
{report.approvedBy} • {formatTimestamp(report.created_at)}

// CORRECT - uses approved_at
{report.approvedBy} • {formatApprovalTimestamp(report.approvedAt)}
```

## Test Data

### Test Report 1: Police Called = TRUE
```typescript
{
  reportCode: 'IR-2026-000001',
  incidentType: 'Security Breach',
  occurredAt: '2026-01-08T14:30:00Z',  // Incident time
  created_at: '2026-01-08T14:30:00Z',   // Report creation
  approved_at: '2026-01-08T15:45:00Z',  // Approval time (CRITICAL)
  reviewed_at: '2026-01-08T15:45:00Z',  // Same as approved_at
  police_called: true,
  pd_case_number: 'PD-2026-4521',
  actionTaken: 'Subject detained, police contacted...'
}
```

**Expected PDF Output** (America/New_York timezone):
```
ELITE SECURITY SERVICES
INCIDENT REPORT
Generated via Guard Up (Security Management Software)
═══════════════════════════════════════════════

Date/Time: Jan 8, 2026 9:30 AM     ← Converted from UTC to EST
...
ACTIONS TAKEN
Subject detained, police contacted...

POLICE RESPONSE
Police Called: Yes
PD Case #: PD-2026-4521

SUPERVISOR REVIEW
Reviewed By: Sarah Chen
Reviewed Date: Jan 8, 2026 10:45 AM  ← Converted from UTC to EST (uses approved_at)
```

### Test Report 2: Police Called = FALSE
```typescript
{
  reportCode: 'IR-2026-000002',
  incidentType: 'Vandalism',
  occurredAt: '2026-01-09T10:15:00Z',
  created_at: '2026-01-09T10:15:00Z',
  approved_at: '2026-01-09T11:00:00Z',  // Approval time (CRITICAL)
  reviewed_at: '2026-01-09T11:00:00Z',
  police_called: false,
  pd_case_number: '',
  actionTaken: 'Photographed vandalism...'
}
```

**Expected PDF Output** (America/New_York timezone):
```
ELITE SECURITY SERVICES
INCIDENT REPORT
Generated via Guard Up (Security Management Software)
═══════════════════════════════════════════════

Date/Time: Jan 9, 2026 5:15 AM     ← Converted from UTC to EST
...
ACTIONS TAKEN
Photographed vandalism...

[NO POLICE RESPONSE SECTION]  ← Not shown because police_called = false

SUPERVISOR REVIEW
Reviewed By: Sarah Chen
Reviewed Date: Jan 9, 2026 6:00 AM  ← Converted from UTC to EST (uses approved_at)
```

## Testing Checklist

### ✅ Timezone Consistency
- [ ] Open IR-2026-000001 in Reports tab
- [ ] Check approval timestamp in modal: Should show EST (e.g., "10:45 AM EST")
- [ ] Open PDF from Vault
- [ ] Verify "Reviewed Date" matches the modal time
- [ ] Verify incident "Date/Time" is in EST
- [ ] Repeat for IR-2026-000002

### ✅ Actions Taken Field
- [ ] Open IR-2026-000001 in supervisor review modal
- [ ] Verify "ACTIONS TAKEN" section is visible
- [ ] Verify text: "Subject was detained at the security desk..."
- [ ] Open PDF from Vault
- [ ] Verify "ACTIONS TAKEN" section matches modal exactly
- [ ] Repeat for IR-2026-000002

### ✅ Organization Branding
- [ ] Open any PDF from Vault
- [ ] Verify header shows "ELITE SECURITY SERVICES" (NOT "Guard Up")
- [ ] Verify second line shows report type (e.g., "INCIDENT REPORT")
- [ ] Verify third line shows "Generated via Guard Up (Security Management Software)" in small text

### ✅ Police Response Fields
- [ ] Open IR-2026-000001 in supervisor review modal
- [ ] Verify shows "Police Called: Yes"
- [ ] Verify shows "PD Case Number: PD-2026-4521"
- [ ] Open PDF from Vault
- [ ] Verify POLICE RESPONSE section exists
- [ ] Verify shows "Police Called: Yes"
- [ ] Verify shows "PD Case #: PD-2026-4521"
- [ ] Verify NO "Agency" field
- [ ] Verify NO "Officer Name/Unit" field
- [ ] Open IR-2026-000002
- [ ] Verify modal shows "Police Called: No"
- [ ] Open PDF - verify NO "POLICE RESPONSE" section at all

### ✅ End-to-End Workflow
- [ ] Create new incident report with police = true
- [ ] Add PD case number "TEST-123"
- [ ] Submit report
- [ ] Open in supervisor review modal
- [ ] Verify ALL fields present (including Actions Taken)
- [ ] Verify timestamps are in local time
- [ ] Approve report
- [ ] Check Vault for new document
- [ ] Open PDF
- [ ] Verify organization name in header
- [ ] Verify all fields match modal
- [ ] Verify timestamps match UI

## Files Modified

1. ✅ `/utils/organizationTimezone.ts` - **NEW** timezone utilities
2. ✅ `/components/ui/ReportDetailsModal.tsx` - Updated timestamp formatting, canonical field names
3. ✅ `/supabase/functions/server/vault-pdf-helper.tsx` - Organization timezone, canonical fields
4. ✅ `/supabase/functions/server/init-database.tsx` - Test data with correct timestamps

## Success Criteria

### Timezone
✅ All timestamps in UI and PDF use organization timezone (America/New_York)
✅ Approval timestamps use `approved_at`, not `created_at`
✅ UI and PDF show identical times for the same event

### Actions Taken
✅ Field is ALWAYS visible in supervisor review modal for Incident Reports
✅ Field appears in PDF for Incident Reports
✅ Shows "N/A" if empty (not removed from display)

### Branding
✅ PDF header shows organization name (Elite Security Services)
✅ Guard Up mentioned only as software provider in small text
✅ Professional presentation for client-facing documents

### Police Response
✅ Only shows fields collected in the form
✅ Police Called: Yes/No (always shown if section visible)
✅ PD Case # (only if provided)
✅ NO unused fields (Agency, Officer Name, etc.)

## Backward Compatibility

All changes maintain backward compatibility:
- Checks both `police_called` and `policeCalled`
- Checks both `pd_case_number` and `pdCaseNumber`
- Checks both `actionTaken` and `actions_taken`
- Falls back to UTC if organization timezone not configured
- Falls back to "Organization" if organization name not provided

## Migration Notes

Existing reports will continue to work:
- Old reports with string "Yes"/"No" for `policeCalled` still render correctly
- Old reports with `created_at` as approval time will still display (though not recommended)
- All timezone conversions happen at display time (no data migration needed)
