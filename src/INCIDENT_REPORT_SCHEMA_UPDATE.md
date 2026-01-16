# Incident Report Schema Consistency Update

## Overview
This update establishes a **single canonical Incident Report data model** that is used consistently across all touchpoints: Report Creation, Supervisor Review, and PDF Generation.

## Product Positioning ✅

### Branding
- **Guard Up** is the **SOFTWARE PLATFORM** (not the security company)
- **The client's organization** (e.g., "Elite Security Services") is the security company
- **Organization name appears in report headers**, not "Guard Up"
- Guard Up attribution: Small text line "Generated via Guard Up (Security Management Software)"

### Example PDF Header
```
ELITE SECURITY SERVICES
INCIDENT REPORT
Generated via Guard Up (Security Management Software)
═══════════════════════════════════════════════
```

## Canonical Schema

### File: `/types/incident-report-schema.ts`

Created a TypeScript interface that defines the single source of truth for Incident Report structure:

#### Core Fields
- `id`: number
- `caseId`: string (e.g., "IR-2026-000001")
- `reportCode`: string (same as caseId)

#### Organization & Location
- `org_id`: string
- `organizationName`: string (e.g., "Elite Security Services")
- `site`: string
- `specificLocation`: string (maps to `location` field in legacy code)

#### Personnel
- `guardName`: string
- `created_by_user_id`: number
- `created_by_name`: string

#### Temporal Data
- `dateTime`: ISO 8601 timestamp (incident occurrence)
- `filedOn`: ISO 8601 timestamp (when filed)
- `created_at`: ISO 8601 timestamp (database)

#### Incident Classification
- `incidentType`: string
- `urgency`: 'low' | 'normal' | 'high' | 'critical'

#### Incident Details
- `narrative`: string (detailed description)
- `actionsTaken`: string (**REQUIRED** for Incident Reports)

#### Law Enforcement
- `policeCalled`: **boolean** (canonical field - replaces string 'Yes'/'No')
- `pdCaseNumber`: string (only if policeCalled = true)

#### Evidence
- `attachments`: Array<{id, url, name, size?, uploadedAt?}>

#### Workflow & Status
- `status`: 'draft' | 'pending' | 'approved' | 'rejected' | 'sent'

#### Supervisor Review
- `reviewedBy`: string
- `reviewedByUserId`: number
- `reviewedByRole`: string
- `reviewedAt`: ISO 8601 timestamp
- `rejectionNote`: string (if rejected)

## Field Name Consistency

### Police/Law Enforcement Fields

**CANONICAL (new code)**:
- `police_called` - boolean
- `pd_case_number` - string

**LEGACY (backward compatibility)**:
- `policeCalled` - string ('Yes'/'No')
- `pdCaseNumber` - string

All code checks BOTH field names to ensure backward compatibility.

### Location Fields

**CANONICAL**:
- `specificLocation` - detailed location within site

**MAPS TO**:
- `location` - used in CreateReportModal and handleCreateReport

## Implementation Across Touchpoints

### 1. Report Creation (`/components/ui/CreateReportModal.tsx`)

✅ **Updated**:
- Form submits `actionTaken` field (always included for Incident Reports)
- Uses canonical field names: `police_called` (boolean), `pd_case_number` (string)
- Maps `location` to `specificLocation` in canonical schema
- Includes inline comments clarifying field usage

```typescript
onSubmit({
  location: location || 'Unknown Location',  // This is specificLocation in canonical schema
  actionTaken: actionTaken,                  // ALWAYS INCLUDED for Incident Reports
  police_called: policeCalled,               // boolean - canonical field name
  pd_case_number: pdCaseNumber               // string - canonical field name
})
```

### 2. Supervisor Review (`/components/ui/ReportDetailsModal.tsx`)

✅ **Already Compliant**:
- Always shows "ACTIONS TAKEN" section for Incident Reports
- Displays "N/A" if `actionTaken` is empty
- Shows Police Called and PD Case Number fields
- Backward-compatible field access (checks both `police_called` and `policeCalled`)

```typescript
{report.type === 'Incident' && (
  <div className="qc-section">
    <h3 className="qc-section-label">ACTIONS TAKEN</h3>
    <div className="qc-action-taken-box">
      <p>{report.actionTaken || 'N/A'}</p>
    </div>
  </div>
)}
```

### 3. PDF Generation (`/supabase/functions/server/vault-pdf-helper.tsx`)

✅ **Already Compliant**:
- Uses organization name from database: `organization?.display_name || organization?.name`
- Header shows client organization name (not "Guard Up")
- Shows "Generated via Guard Up (Security Management Software)" in small text
- Always shows "ACTIONS TAKEN" section for Incident Reports
- Conditionally shows "POLICE RESPONSE" section only if data exists
- Backward-compatible field access

```typescript
// Organization branding
const organizationName = organization?.display_name || organization?.name || 'Organization';
addText(organizationName.toUpperCase(), 16, true);

// Actions Taken - ALWAYS SHOW for incident reports
if (isIncidentReport) {
  addSectionHeader('ACTIONS TAKEN');
  const actionTaken = report.actionTaken || report.actionsTaken || 'N/A';
  addText(actionTaken, 10, false, { lineHeight: 14 });
}

// Police Response - ONLY if data exists
if (isIncidentReport) {
  const policeCalled = report.police_called !== undefined ? report.police_called : report.policeCalled;
  const pdCaseNumber = report.pd_case_number || report.pdCaseNumber;
  
  if (policeCalled === true || policeCalled === 'Yes' || pdCaseNumber) {
    addSectionHeader('POLICE RESPONSE');
    // Show Police Called: Yes/No
    // Show PD Case # (if provided)
  }
}
```

## Test Data

### Organization Data
**File**: `/supabase/functions/server/init-database.tsx`

```typescript
{
  id: 'default_org',
  name: 'Elite Security Services',
  display_name: 'Elite Security Services',
  created_at: '2026-01-01T00:00:00Z',
  settings: {
    timezone: 'America/New_York',
    report_prefix: 'ES'
  }
}
```

### Test Report 1: Police Called = TRUE
**Report ID**: `IR-2026-000001`
**Case**: Security Breach at Downtown Plaza
**Police**: Yes (PD Case #: PD-2026-4521)
**Actions Taken**: Subject detained, police contacted, arrived in 8 minutes

**Key Fields**:
```typescript
{
  reportCode: 'IR-2026-000001',
  incidentType: 'Security Breach',
  urgency: 'Critical',
  narrativeOnly: 'Unauthorized individual attempted to bypass security checkpoint...',
  actionTaken: 'Subject was detained at the security desk. Local police were contacted...',
  police_called: true,          // CANONICAL boolean
  pd_case_number: 'PD-2026-4521', // CANONICAL string
  policeCalled: 'Yes',          // LEGACY backward compat
  pdCaseNumber: 'PD-2026-4521'  // LEGACY backward compat
}
```

### Test Report 2: Police Called = FALSE
**Report ID**: `IR-2026-000002`
**Case**: Vandalism at Tech Campus Building A
**Police**: No
**Actions Taken**: Photographed, notified maintenance, increased patrols

**Key Fields**:
```typescript
{
  reportCode: 'IR-2026-000002',
  incidentType: 'Vandalism',
  urgency: 'Normal',
  narrativeOnly: 'Discovered graffiti on concrete support column...',
  actionTaken: 'Photographed vandalism from multiple angles. Notified building maintenance...',
  police_called: false,         // CANONICAL boolean
  pd_case_number: '',           // CANONICAL empty string
  policeCalled: 'No'            // LEGACY backward compat
}
```

### Vault Documents
Both test reports have corresponding vault documents that can be opened to generate PDFs:
- `vault-ir-1`: IR-2026-000001 - Security Breach Incident Report.pdf
- `vault-ir-2`: IR-2026-000002 - Vandalism Incident Report.pdf

## Testing Instructions

### 1. Test Report Creation
1. Navigate to Reports page
2. Click "+ New Report"
3. Select "Incident Report"
4. Fill in all required fields:
   - Date/Time
   - Location
   - Incident Type
   - Urgency
   - Narrative
   - **Actions Taken** ✓
   - Police Called (toggle) ✓
   - PD Case Number (if police called) ✓
5. Submit report
6. Verify all fields are saved

### 2. Test Supervisor Review Modal
1. Navigate to Reports page
2. Click on a pending incident report
3. Verify the following sections are visible:
   - **NARRATIVE** ✓
   - **ACTIONS TAKEN** (shows "N/A" if empty) ✓
   - Police Called: Yes/No ✓
   - PD Case Number (shows "N/A" if not provided) ✓
4. Approve or reject the report
5. Verify decision is saved correctly

### 3. Test PDF Generation
1. Navigate to Vault page
2. Find test reports:
   - IR-2026-000001 (Police = Yes)
   - IR-2026-000002 (Police = No)
3. Click to open each PDF
4. Verify PDF Header shows:
   - **"ELITE SECURITY SERVICES"** (not "Guard Up") ✓
   - **"INCIDENT REPORT"** ✓
   - **"Generated via Guard Up (Security Management Software)"** ✓
5. Verify PDF sections:
   - **NARRATIVE** ✓
   - **ACTIONS TAKEN** (always present) ✓
   - **POLICE RESPONSE** (only if police was called) ✓
     - For IR-2026-000001: Shows "Police Called: Yes" + "PD Case #: PD-2026-4521"
     - For IR-2026-000002: Section should not appear (no police involvement)

### 4. Test End-to-End Flow
1. Create new incident report with police called = true
2. Add PD case number
3. Submit report
4. Open supervisor review modal → Verify all fields present
5. Approve report
6. Check Vault → New document should appear
7. Open PDF from Vault → Verify organization branding and all sections

## Files Modified

1. ✅ `/types/incident-report-schema.ts` - **NEW** canonical schema
2. ✅ `/components/ui/CreateReportModal.tsx` - Updated field submission
3. ✅ `/components/ui/ReportDetailsModal.tsx` - Already compliant (no changes)
4. ✅ `/supabase/functions/server/vault-pdf-helper.tsx` - Already compliant (no changes)
5. ✅ `/supabase/functions/server/init-database.tsx` - Added test data and organization

## Benefits

### Consistency
- Single source of truth for data model
- No field disappearance between creation → review → PDF
- Canonical field names prevent confusion

### Maintainability
- Changes to schema only need to happen in one place
- TypeScript interface provides type safety
- Normalization functions handle legacy data

### Product Positioning
- Clear separation: Guard Up = software, Client = security company
- Professional branding in client-facing documents
- Organization name properly displayed

### Backward Compatibility
- Supports both new (canonical) and legacy field names
- Existing data continues to work
- Gradual migration path

## Migration Notes

### For Existing Reports
The system supports BOTH canonical and legacy field names:
- New reports use `police_called` (boolean) and `pd_case_number` (string)
- Old reports may have `policeCalled` ('Yes'/'No') and `pdCaseNumber`
- All code checks both field names for maximum compatibility

### For Future Development
Always use the canonical schema from `/types/incident-report-schema.ts`:
- Import the `IncidentReport` interface
- Use the `normalizeIncidentReport()` function to convert legacy data
- Use the `createEmptyIncidentReport()` function for new reports
- Use the `isIncidentReport()` type guard for type safety

## Conclusion

All three touchpoints (Report Creation, Supervisor Review, PDF Generation) now use the same canonical Incident Report schema with consistent field names and proper organization branding. The system maintains backward compatibility while providing a clear path forward for new development.
