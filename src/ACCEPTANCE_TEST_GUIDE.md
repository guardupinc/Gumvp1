# 🧪 Acceptance Test - Police Called / PD Case # Fix

## ✅ All Fixes Applied

1. ✅ **Guard Portal** (`MyReports.tsx`) - Fixed field mapping
2. ✅ **Admin Portal** (`Reports.tsx`) - Fixed field mapping  
3. ✅ **Backend API** - Already working (uses spread operator)
4. ✅ **Supervisor Review Modal** - Already working (backward compatible)
5. ✅ **PDF Generator** - Already working (backward compatible + correct branding)

---

## 🎯 Test Case 1: Create Report with Police Called = YES

### Steps:

1. **Login** to Guard Up MVP
   - Use Guard or Admin portal

2. **Create New Incident Report**
   - Click "Create Report" → Select "Incident Report"
   
3. **Fill Out Form**
   - **Site**: Downtown Plaza
   - **Location**: Main Entrance
   - **Incident Type**: Trespassing
   - **Date**: Today's date
   - **Time**: Current time
   - **Urgency**: Critical
   - **Police Called?**: Toggle to **YES** ✅
   - **PD Case #**: Enter "FL-26-000198" ✅
   - **Narrative**: "Individual refused to leave premises after being asked multiple times. Police were called and responded to the scene."

4. **Submit Report**
   - Click "Submit Report"
   - Should see success message

### Expected Console Logs:

```
================================================================================
[CreateReportModal - SUBMIT] Law Enforcement Fields:
policeCalled (state): true
pdCaseNumber (state): FL-26-000198
About to submit with:
police_called: true
pd_case_number: FL-26-000198
================================================================================

================================================================================
[Reports API - CREATE] Incident Report Law Enforcement Fields:
police_called: true
pd_case_number: FL-26-000198
================================================================================
```

### Expected Results:

- ✅ Report appears in Reports list
- ✅ No console errors
- ✅ Report status shows "Pending Review"

---

## 🎯 Test Case 2: Open Supervisor Review Modal

### Steps:

1. **Navigate to Reports Tab** (Admin Portal)
2. **Find the report** you just created
3. **Click on the report** to open Supervisor Review modal

### Expected Console Logs:

```
================================================================================
[EditReportModal] Opening Supervisor Review for Report:
Report ID: 42
Report Code: IR-2026-000042
--- Police/Law Enforcement Fields ---
police_called (new): true
policeCalled (legacy): undefined
pd_case_number (new): FL-26-000198
pdCaseNumber (legacy): undefined
================================================================================
```

### Expected Results:

- ✅ Modal opens with all report details
- ✅ Under "Police Response" section:
  - Shows "**Police Called?:** Yes" ✅
  - Shows "**PD Case #:** FL-26-000198" ✅
- ✅ Both fields display correctly with proper styling

---

## 🎯 Test Case 3: Approve Report and Generate PDF

### Steps:

1. **In Supervisor Review Modal**
   - Review all fields
   - Click "Approve & Finalize"
   - Should see success message

2. **Navigate to Vault Tab**
   - Find the newly filed report in the Vault
   - Should see: "IR-2026-000042 - Incident Report.pdf"

3. **Open PDF**
   - Click on the vault row to open the PDF
   - PDF should open in a new tab

### Expected Console Logs (Backend):

```
================================================================================
[generateReportPDF] Generating PDF for report:
Report ID: 42
Report Code: IR-2026-000042
--- Police/Law Enforcement Fields ---
police_called (new): true
policeCalled (legacy): undefined
pd_case_number (new): FL-26-000198
pdCaseNumber (legacy): undefined
Organization: ACME SECURITY
================================================================================
```

### Expected PDF Content:

**HEADER**:
```
ACME SECURITY
INCIDENT REPORT
Generated via Guard Up (Security Management Software)
═══════════════════════════════════════════════
```

**KEY FACTS** (should show all standard fields)

**NARRATIVE** (should show the narrative text)

**POLICE RESPONSE** section (MUST be present):
```
POLICE RESPONSE
─────────────────────────────────────────────
Police Called: Yes
PD Case #: FL-26-000198
```

**APPROVAL** section (should show approver info)

### Expected Results:

- ✅ PDF header shows **customer organization name** (not "Guard Up Security")
- ✅ Software attribution shows "Generated via Guard Up (Security Management Software)"
- ✅ "POLICE RESPONSE" section is present
- ✅ Shows "Police Called: Yes"
- ✅ Shows "PD Case #: FL-26-000198"
- ✅ NO placeholder fields for Agency, Officer Name/Unit (these don't exist in form)

---

## 🎯 Test Case 4: Create Report with Police Called = NO

### Steps:

1. **Create Another Incident Report**
   - Fill out all required fields
   - **Police Called?**: Leave toggle at **NO** ❌
   - **PD Case #**: Should be hidden (not visible when toggle is No)
   - Submit report

2. **Approve the Report**

3. **Open PDF from Vault**

### Expected Results:

- ✅ Supervisor Review shows "Police Called?: No"
- ✅ No PD Case # field shown in modal
- ✅ PDF **does NOT show** "POLICE RESPONSE" section at all
  - Section is conditionally hidden when police_called = false
- ✅ PDF looks clean with no empty sections

---

## 🎯 Test Case 5: Backward Compatibility (If Old Reports Exist)

### Steps:

1. **Find an old report** (created before the fix)
   - Look for reports that might have `policeCalled` or `pdCaseNumber` in old format

2. **Open in Supervisor Review**
   - Should still display correctly thanks to fallback logic

3. **Generate PDF**
   - Should still work correctly thanks to fallback logic

### Expected Results:

- ✅ Old reports with `policeCalled`/`pdCaseNumber` still display correctly
- ✅ No console errors
- ✅ PDFs generate successfully
- ✅ Fallback logic works: `report.police_called || report.policeCalled`

---

## ❌ What Should NOT Happen

- ❌ "Police Called?" showing "No" when it was toggled to "Yes"
- ❌ PD Case Number appearing empty when a value was entered
- ❌ PDF showing "Guard Up Security" as the organization name
- ❌ PDF showing placeholder fields for Agency, Officer Name/Unit
- ❌ Console errors about undefined fields
- ❌ Data persistence issues

---

## 🔍 Troubleshooting

If tests fail, check:

1. **Console Logs**: Look for the debug output at each step
   - Form submission
   - Backend save
   - Backend fetch
   - Modal open
   - PDF generation

2. **Field Names**: Verify the report object has:
   - `police_called` (not `policeCalled`)
   - `pd_case_number` (not `pdCaseNumber`)

3. **Network Tab**: Check API requests/responses for correct data

4. **Browser Cache**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

---

## ✅ Success Criteria

All tests pass when:

1. ✅ Police Called toggle value persists correctly
2. ✅ PD Case Number persists correctly
3. ✅ Supervisor Review shows correct values
4. ✅ PDF shows correct values with proper branding
5. ✅ No console errors
6. ✅ Backward compatibility maintained

---

## 📊 Test Results Log

Record your test results here:

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Create Report (Yes) | ⬜ Pass / ⬜ Fail | |
| 2. Supervisor Review | ⬜ Pass / ⬜ Fail | |
| 3. PDF Generation | ⬜ Pass / ⬜ Fail | |
| 4. Create Report (No) | ⬜ Pass / ⬜ Fail | |
| 5. Backward Compat | ⬜ Pass / ⬜ Fail | |

---

**Date Tested**: _________________

**Tested By**: _________________

**Overall Result**: ⬜ All Tests Pass ⬜ Some Failures

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
