# Test Reports Quick Reference

## Purpose
Two sample Incident Reports to verify schema consistency across Report Creation → Supervisor Review → PDF Generation.

## Test Report 1: Police Called = TRUE

### Metadata
- **Report ID**: `IR-2026-000001`
- **Status**: Approved
- **Type**: Incident Report
- **Organization**: Elite Security Services

### Incident Details
- **Site**: Downtown Plaza
- **Location**: Main Entrance - Lobby Area
- **Guard**: John Smith
- **Date/Time**: Jan 8, 2026 @ 2:30 PM
- **Incident Type**: Security Breach
- **Urgency**: Critical

### Narrative
Unauthorized individual attempted to bypass security checkpoint at the main entrance. Subject refused to present identification and became aggressive when questioned by security personnel. Building security protocol was immediately activated.

### Actions Taken ✅
Subject was detained at the security desk. Local police were contacted and arrived within 8 minutes. Individual was escorted off the premises by law enforcement. All entry points were secured and additional patrols were deployed. Incident was documented with security camera footage from angles A1, A2, and B3.

### Police Response ✅
- **Police Called**: ✅ **YES**
- **PD Case #**: **PD-2026-4521**

### Expected Behavior
1. **Supervisor Review Modal**: Should show all fields including Actions Taken and Police Response
2. **PDF**: Should show POLICE RESPONSE section with:
   - "Police Called: Yes"
   - "PD Case #: PD-2026-4521"

---

## Test Report 2: Police Called = FALSE

### Metadata
- **Report ID**: `IR-2026-000002`
- **Status**: Approved
- **Type**: Incident Report
- **Organization**: Elite Security Services

### Incident Details
- **Site**: Tech Campus Building A
- **Location**: Parking Garage Level 2
- **Guard**: Mike Johnson
- **Date/Time**: Jan 9, 2026 @ 10:15 AM
- **Incident Type**: Vandalism
- **Urgency**: Normal

### Narrative
Discovered graffiti on concrete support column in parking garage. Tag approximately 2 feet by 3 feet in size. No damage to vehicles or other property observed. Area was documented with photographs.

### Actions Taken ✅
Photographed vandalism from multiple angles for documentation. Notified building maintenance via work order #4521. Increased patrol frequency in parking garage. No suspects identified at time of discovery.

### Police Response
- **Police Called**: ❌ **NO**
- **PD Case #**: N/A

### Expected Behavior
1. **Supervisor Review Modal**: Should show all fields including Actions Taken; Police Called shows "No"
2. **PDF**: Should **NOT** show POLICE RESPONSE section (no police involvement)

---

## Vault Access

Both reports are available in the Vault:

### Vault Document 1
- **ID**: `vault-ir-1`
- **Name**: IR-2026-000001 - Security Breach Incident Report.pdf
- **Category**: Incident Reports
- **Size**: 0.8 MB
- **Uploaded By**: Sarah Chen
- **Date**: Jan 8, 2026

### Vault Document 2
- **ID**: `vault-ir-2`
- **Name**: IR-2026-000002 - Vandalism Incident Report.pdf
- **Category**: Incident Reports
- **Size**: 0.6 MB
- **Uploaded By**: Sarah Chen
- **Date**: Jan 9, 2026

---

## Testing Checklist

### ✅ Report Creation
- [ ] Create incident report with police called = true
- [ ] Add PD case number
- [ ] Create incident report with police called = false
- [ ] Leave PD case number empty
- [ ] Verify both save correctly

### ✅ Supervisor Review Modal
- [ ] Open IR-2026-000001
- [ ] Verify "Actions Taken" section is visible
- [ ] Verify "Police Called: Yes" is displayed
- [ ] Verify "PD Case #: PD-2026-4521" is displayed
- [ ] Open IR-2026-000002
- [ ] Verify "Actions Taken" section is visible
- [ ] Verify "Police Called: No" is displayed
- [ ] Verify "PD Case #: N/A" is displayed

### ✅ PDF Generation
- [ ] Open vault document for IR-2026-000001
- [ ] Verify PDF header shows "ELITE SECURITY SERVICES" (not "Guard Up")
- [ ] Verify "Generated via Guard Up (Security Management Software)" text
- [ ] Verify "ACTIONS TAKEN" section exists
- [ ] Verify "POLICE RESPONSE" section exists with:
  - "Police Called: Yes"
  - "PD Case #: PD-2026-4521"
- [ ] Open vault document for IR-2026-000002
- [ ] Verify PDF header shows "ELITE SECURITY SERVICES"
- [ ] Verify "ACTIONS TAKEN" section exists
- [ ] Verify "POLICE RESPONSE" section does NOT exist

### ✅ Field Consistency
- [ ] All fields from creation appear in review modal
- [ ] All fields from review modal appear in PDF
- [ ] No field disappearance during workflow
- [ ] Organization name consistent across all touchpoints

---

## Expected PDF Layout

### Report 1 (Police = Yes)

```
ELITE SECURITY SERVICES
INCIDENT REPORT
Generated via Guard Up (Security Management Software)
═══════════════════════════════════════════════

CASE ID: IR-2026-000001    SITE: Downtown Plaza
SPECIFIC LOCATION: Main Entrance - Lobby Area
GUARD: John Smith          DATE/TIME: Jan 8, 2026 2:30 PM
STATUS: APPROVED           INCIDENT TYPE: Security Breach
URGENCY: Critical

NARRATIVE
Unauthorized individual attempted to bypass security checkpoint...

ACTIONS TAKEN
Subject was detained at the security desk. Local police were contacted...

POLICE RESPONSE
Police Called: Yes
PD Case #: PD-2026-4521

EVIDENCE / ATTACHMENTS
None

SUPERVISOR REVIEW
Reviewed By: Sarah Chen
Reviewed Date: Jan 8, 2026 3:45 PM
```

### Report 2 (Police = No)

```
ELITE SECURITY SERVICES
INCIDENT REPORT
Generated via Guard Up (Security Management Software)
═══════════════════════════════════════════════

CASE ID: IR-2026-000002    SITE: Tech Campus Building A
SPECIFIC LOCATION: Parking Garage Level 2
GUARD: Mike Johnson        DATE/TIME: Jan 9, 2026 10:15 AM
STATUS: APPROVED           INCIDENT TYPE: Vandalism
URGENCY: Normal

NARRATIVE
Discovered graffiti on concrete support column in parking garage...

ACTIONS TAKEN
Photographed vandalism from multiple angles for documentation...

[NO POLICE RESPONSE SECTION - police not called]

EVIDENCE / ATTACHMENTS
None

SUPERVISOR REVIEW
Reviewed By: Sarah Chen
Reviewed Date: Jan 9, 2026 11:00 AM
```

---

## Success Criteria

✅ **Schema Consistency**: Same fields appear in creation → review → PDF
✅ **Organization Branding**: "Elite Security Services" appears in PDF header
✅ **Guard Up Attribution**: Small text attribution present
✅ **Actions Taken**: Always visible for Incident Reports
✅ **Police Response**: Conditionally shown based on police involvement
✅ **Backward Compatibility**: Both canonical and legacy fields work
✅ **No Field Loss**: No disappearing fields during workflow
