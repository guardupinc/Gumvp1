# Client Outbox Org Scoping Fix - Complete Implementation

## Issue Summary
The Client Outbox was experiencing REPORTS_WRONG_ORG errors when attempting to send emails, indicating that the frontend was attempting to send report IDs that did not belong to the current organization.

## Root Cause Analysis
1. **Incomplete org_id filtering in outbox packages** - The outbox filter checked `r.org_id && r.org_id !== currentOrgId`, which would pass legacy reports without org_id even if they belonged to different orgs
2. **Missing pre-send validation** - No safety check before API call to ensure all report IDs belong to current org
3. **Insufficient debug logging** - Hard to diagnose which reports were causing the issue

## Comprehensive Fixes Applied

### 1. ✅ Enhanced Outbox Data Source Filtering (`/components/pages/Reports.tsx`)

**Location**: `outboxPackages` useMemo (lines 283-357)

**Changes**:
```typescript
// OLD (incomplete):
if (r.org_id && r.org_id !== currentOrgId) return false;

// NEW (comprehensive):
const reportOrgId = r.org_id || 'default_org';
if (reportOrgId !== currentOrgId) return false;
```

**Impact**:
- ✅ Now treats legacy reports without org_id as 'default_org'
- ✅ STRICT equality check - reports MUST match current org
- ✅ No cross-org reports can enter the outbox
- ✅ Added currentUser?.org_id to useMemo dependencies for proper reactivity

### 2. ✅ Pre-Send Debug Logging (`/components/pages/Reports.tsx`)

**Location**: `handleEmailSend` function (lines 794-819)

**Added Debug Logging**:
```typescript
console.log(`[handleEmailSend] 🔍 PRE-SEND DEBUG:`);
console.log(`[handleEmailSend]   Current user org_id: ${currentOrgId}`);
console.log(`[handleEmailSend]   Total report IDs to send: ${reportIds.length}`);
console.log(`[handleEmailSend]   Report IDs: [${reportIds.join(', ')}]`);

// For each report ID, log its org_id, site_name, and status
reportIds.forEach(reportId => {
  const report = reports.find(r => r.id === reportId);
  if (report) {
    const reportOrgId = report.org_id || 'default_org';
    console.log(`[handleEmailSend]   Report ${reportId}: org_id="${reportOrgId}", site="${report.site}", status="${report.status}"`);
  } else {
    console.error(`[handleEmailSend]   Report ${reportId}: ❌ NOT FOUND IN STATE`);
  }
});
```

**Impact**:
- ✅ Logs currentOrgId before every send attempt
- ✅ Logs all reportIds being sent with their org_id, site_name, and status
- ✅ Identifies missing reports immediately
- ✅ Makes debugging org mismatch issues trivial

### 3. ✅ Pre-Send Safety Filter (`/components/pages/Reports.tsx`)

**Location**: `handleEmailSend` function (lines 821-870)

**Safety Filter Logic**:
```typescript
const validReportIds: number[] = [];
const invalidReportIds: number[] = [];

reportIds.forEach(reportId => {
  const report = reports.find(r => r.id === reportId);
  if (!report) {
    invalidReportIds.push(reportId);
    console.error(`[handleEmailSend] ❌ Report ${reportId} not found in state - excluding from send`);
    return;
  }
  
  const reportOrgId = report.org_id || 'default_org';
  if (reportOrgId !== currentOrgId) {
    invalidReportIds.push(reportId);
    console.error(`[handleEmailSend] ❌ Report ${reportId} belongs to org "${reportOrgId}" but current org is "${currentOrgId}" - excluding from send`);
    return;
  }
  
  validReportIds.push(reportId);
});

// If any reports were excluded, show error and stop
if (invalidReportIds.length > 0) {
  console.error(`[handleEmailSend] ❌ ${invalidReportIds.length} report(s) excluded due to org mismatch or missing`);
  console.error(`[handleEmailSend] ❌ Invalid report IDs: [${invalidReportIds.join(', ')}]`);
  
  // Close modal
  setIsEmailModalOpen(false);
  setIsSending(false);
  
  // Show ONE user-friendly error toast
  toast.error(
    `❌ Cannot send: Some reports do not belong to your organization. Please refresh the page and try again.`,
    { duration: 10000 }
  );
  return;
}
```

**Impact**:
- ✅ Validates EVERY report ID before sending
- ✅ Rejects reports not found in state
- ✅ Rejects reports from different org
- ✅ Shows ONE clear error toast if validation fails
- ✅ Prevents invalid API calls entirely

### 4. ✅ Payload Uses Only Validated Report IDs

**Location**: `handleEmailSend` function (line 874)

**Change**:
```typescript
// OLD:
report_ids: reportIds,

// NEW:
report_ids: validReportIds, // Use validated report IDs only
```

**Impact**:
- ✅ Only sends IDs that passed org validation
- ✅ Backend receives clean, validated data

### 5. ✅ Backend Already Has Proper Org Filtering

**Location**: `/supabase/functions/server/api-routes.tsx` (lines 24-62)

**Verification**:
```typescript
// GET /reports endpoint already filters by org_id:
reports = allReports.filter((r: any) => {
  const reportOrgId = r.org_id || 'default_org';
  return reportOrgId === user.org_id; // ✅ Strict org filtering
});
```

**Impact**:
- ✅ Server never returns cross-org reports
- ✅ Guards and Admins only see their org's reports
- ✅ Consistent with frontend filtering

### 6. ✅ Backend Validation Already Handles Org Scoping

**Location**: `/supabase/functions/server/database.tsx` (lines 842-904)

**Verification**:
```typescript
// validateReportsForSending already checks org_id:
const wrongOrgReports = foundReports.filter(r => {
  const reportOrgId = r.org_id || 'default_org';
  return reportOrgId !== orgId; // ✅ Strict validation
});
if (wrongOrgReports.length > 0) {
  return {
    valid: false,
    error: `Reports do not belong to your organization`,
    code: 'REPORTS_WRONG_ORG',
    wrong_org_report_ids: wrongOrgReportIds
  };
}
```

**Impact**:
- ✅ Backend double-validates org_id
- ✅ Returns structured error with wrong_org_report_ids
- ✅ Provides clear error codes for frontend handling

### 7. ✅ Error Handling Shows ONE Toast Per Failure

**Location**: `/components/pages/Reports.tsx` (lines 842-890)

**Verification**:
```typescript
// Existing error handling already shows ONE toast:
if (errorCode === 'REPORTS_NOT_FOUND') {
  toast.error(
    `❌ Some reports are no longer available (IDs: ${missingReportIds.join(', ')}). Refresh and try again.`,
    { duration: 10000 }
  );
} else if (errorCode === 'REPORTS_WRONG_ORG') {
  toast.error(
    `❌ Cannot send: Reports do not belong to your organization. Please refresh the page.`,
    { duration: 10000 }
  );
} else {
  toast.error(
    `❌ Failed to send reports: ${errorMessage}`,
    { duration: 10000 }
  );
}
```

**Impact**:
- ✅ Only ONE toast shown per error
- ✅ Error messages are user-friendly
- ✅ Technical details logged to console
- ✅ No duplicate toasts

## End-to-End Data Flow

### Frontend Outbox Population:
1. ✅ Fetch all reports via GET /reports (org-filtered by backend)
2. ✅ Filter to approved, unsent, client-deliverable reports
3. ✅ Filter to current org only (with legacy fallback)
4. ✅ Group by site into outbox packages

### Frontend Send Flow:
1. ✅ Extract report IDs from emailPackage.reports (not global reports array)
2. ✅ Log current org_id and each report's org_id + site + status
3. ✅ Validate each report belongs to current org
4. ✅ Exclude any invalid reports and show error toast
5. ✅ Send only validated report IDs to backend

### Backend Validation:
1. ✅ Receive report_ids from frontend
2. ✅ Validate all reports exist
3. ✅ Validate all reports belong to user's org
4. ✅ Return structured error if validation fails
5. ✅ Mark reports as sent (status='sent') on success

## Testing Checklist

- [x] Outbox only shows reports from current org
- [x] Outbox excludes legacy reports without org_id (unless default_org)
- [x] Pre-send debug logs show all report details
- [x] Pre-send validation catches cross-org reports
- [x] Invalid reports show ONE clear error toast
- [x] Valid reports send successfully
- [x] Backend returns REPORTS_WRONG_ORG if needed
- [x] Only ONE toast shown per error scenario

## Multi-Tenant Isolation Guarantee

With these fixes, the Client Outbox now has **complete multi-tenant isolation**:

1. ✅ **Frontend Filtering**: Reports filtered by org_id in outboxPackages useMemo
2. ✅ **Pre-Send Validation**: Safety filter validates org_id before API call
3. ✅ **Backend API Filtering**: GET /reports returns only current org's reports
4. ✅ **Backend Send Validation**: validateReportsForSending rejects wrong org reports
5. ✅ **Error Handling**: Structured errors with clear messages and single toasts

**Result**: It is now **IMPOSSIBLE** for a user to send reports from a different organization.

## Files Modified

1. `/components/pages/Reports.tsx`
   - Enhanced outbox filtering (line 292-293)
   - Added currentUser?.org_id to useMemo deps (line 357)
   - Added comprehensive pre-send debug logging (lines 794-819)
   - Added safety filter validation (lines 821-870)
   - Updated payload to use validReportIds (line 874)

## Files Verified (No Changes Needed)

1. `/supabase/functions/server/api-routes.tsx`
   - ✅ GET /reports already filters by org_id (lines 48-50)

2. `/supabase/functions/server/database.tsx`
   - ✅ validateReportsForSending already validates org_id (lines 889-904)

3. `/supabase/functions/server/api-routes-postgres.tsx`
   - ✅ POST /packets/send-direct uses validateReportsForSending (line 303)
   - ✅ Returns structured errors with codes (lines 309-322)

4. `/utils/apiClient.ts`
   - ✅ apiFetch parses structured error responses (lines 30-73)
   - ✅ Includes wrong_org_report_ids in error object (line 51)

## Summary

All 6 requirements have been successfully implemented:

1. ✅ **Debug logging** - Comprehensive pre-send logging with org_id, site, status for each report
2. ✅ **Outbox filtering** - STRICT org_id equality check with legacy fallback
3. ✅ **Payload from emailPackage** - Already using emailPackage.reports, now with validation
4. ✅ **Safety filter** - Pre-send validation excludes cross-org reports with ONE toast
5. ✅ **Backend filtering** - GET /reports already filters by org_id
6. ✅ **Single toast** - Error handling already shows ONE toast per failure

The Client Outbox now has **bulletproof multi-tenant isolation** with complete debugging visibility.
