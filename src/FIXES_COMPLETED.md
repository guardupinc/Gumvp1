# Guard Up - Reports Tab Functional Audit - FIXES COMPLETED

## Executive Summary

✅ **COMPLETED**: Server-side fixes for report attribution, timestamps, and database schema
🟡 **IN PROGRESS**: Frontend updates to display new fields with timezone formatting
⏳ **PENDING**: Full end-to-end testing

---

## 1. REPORT STATE MACHINE - CONFIRMED ✅

### Status Values (Canonical):
- **`draft`** - Report created/saved but not submitted
- **`pending`** - Report submitted for review
- **`approved`** - Report reviewed and approved by admin/supervisor
- **`rejected`** - Report reviewed and rejected by admin/supervisor

### State Transitions:
```
DRAFT → Submit → PENDING
         ↓
    Approve → APPROVED (→ Vault)
         ↓
    Reject → REJECTED → Resubmit → PENDING
```

---

## 2. DATABASE SCHEMA FIXES - COMPLETED ✅

### NEW Clean Fields (Added to all reports):

**Attribution Fields:**
- `created_by_user_id: number` - User ID who created the report
- `created_by_name: string` - Name for display
- `created_by_role: string` - Role for display
- `reviewed_by_user_id: number | null` - User ID who approved/rejected
- `reviewed_by_name: string | null` - Reviewer name for display
- `reviewed_by_role: string | null` - Reviewer role for display

**Timestamp Fields (ALL ISO strings in UTC):**
- `created_at: string` - When first created (ISO)
- `submitted_at: string | null` - When submitted for review (ISO)
- `reviewed_at: string | null` - When approved/rejected (ISO)
- `updated_at: string` - Last update (ISO)

**Rejection Fields:**
- `rejection_note: string | null` - Clean field name

### Legacy Fields (Kept for backwards compatibility):
- `submittedById`, `submittedBy`, `createdBy` (redundant but preserved)
- `approvedBy`, `approvedByRole`, `approvedAt` (now ISO, not formatted)
- `rejectedBy`, `rejectedByRole`, `rejectedAt`, `rejectionNote` (now ISO)

---

## 3. SERVER-SIDE API FIXES - COMPLETED ✅

### POST `/reports` - Create Report ✅
**Fixed:**
- Added `created_by_user_id`, `created_by_name`, `created_by_role`
- Added `created_at`, `submitted_at`, `reviewed_at`, `updated_at` (all ISO)
- Sets `submitted_at = now` only if status is 'pending', 'approved', or 'rejected'
- Sets `reviewed_at = null` initially

### POST `/reports/:id/approve` - Approve Report ✅
**Fixed:**
- Stores `reviewed_by_user_id`, `reviewed_by_name`, `reviewed_by_role` from authenticated user
- Stores `reviewed_at` as ISO timestamp (UTC)
- Changed `approvedAt` to ISO instead of formatted string
- Sanitizes updates to prevent client from overriding reviewer fields
- Clears rejection metadata on approval
- Files to vault automatically

### POST `/reports/:id/reject` - Reject Report ✅
**Fixed:**
- Stores `reviewed_by_user_id`, `reviewed_by_name`, `reviewed_by_role`, `reviewed_at` (ISO)
- Stores `rejection_note` (clean field name)
- Changed `rejectedAt` to ISO instead of formatted string
- Clears approval metadata on rejection

### PUT `/reports/:id` - Update Report ✅
**Fixed:**
- Updates `updated_at` with ISO timestamp

---

## 4. ATTRIBUTION BUG - FIXED ✅

### Problem (Before):
```javascript
// Server was creating formatted strings:
approvedBy: "by Supervisor Sarah Chen"  // ❌ Not queryable
approvedAt: "Jan 8, 2026, 11:35 PM"     // ❌ Not UTC, not ISO
```

### Solution (After):
```javascript
// Clean, queryable fields:
reviewed_by_user_id: 2,                 // ✅ User ID for queries
reviewed_by_name: "Sarah Chen",         // ✅ Clean name
reviewed_by_role: "Supervisor",         // ✅ Clean role
reviewed_at: "2026-01-09T04:35:00Z",    // ✅ ISO timestamp in UTC

// Legacy fields (for backwards compatibility):
approvedBy: "by Supervisor Sarah Chen", // ✅ Still populated
approvedAt: "2026-01-09T04:35:00Z"      // ✅ NOW ISO (was formatted before)
```

---

## 5. TIMEZONE FIXES - COMPLETED ✅

### Server-Side (Fixed):
- ✅ All timestamps now stored as ISO strings in UTC
- ✅ `created_at`, `submitted_at`, `reviewed_at`, `updated_at` all use `new Date().toISOString()`
- ✅ Removed `toLocaleString()` from approval/rejection routes (was causing timezone bugs)

### Client-Side (/utils/timezone.ts created):
- ✅ `formatTimestamp()` - Converts UTC to local timezone for display
- ✅ `getTodayLocalDate()` - Returns YYYY-MM-DD in local timezone (not UTC!)
- ✅ `getCurrentLocalTime()` - Returns HH:MM in local timezone
- ✅ `formatDateOnly()` - Formats date-only strings with validation
- ✅ `formatTimeOnly()` - Formats time-only strings to 12-hour format
- ✅ All utilities handle invalid inputs gracefully

### Fixes Applied:
- ✅ Fixed CreateReportModal to use `getTodayLocalDate()` instead of `new Date().toISOString().split('T')[0]`
- ✅ Fixed all date `max` attributes to use local date
- ✅ Updated Reports.tsx to use timezone-aware formatTimestamp()
- ✅ Updated MyReports.tsx to use timezone utilities
- ✅ Updated EditReportModal to format dates/times properly
- ✅ Updated ClientReportPDF to format times properly

---

## 6. VAULT ROUTING - VERIFIED ✅

### Current Implementation:
- ✅ Vault filing happens ONLY on approval (not rejection)
- ✅ `fileReportToVault()` is idempotent (checks for duplicates by reportCode)
- ✅ Vault categories mapped correctly:
  - Incident → "Incident Reports"
  - DAR → "Daily Reports"
  - Maintenance → "Maintenance"
  - Disciplinary → "HR & Internal"
  - Shift Pass-On → "Internal Ops"
- ✅ Vault "Uploaded By" = report author (guard), NOT reviewer (admin)
- ✅ No vault entry created for rejected reports

---

## 7. CODE CHANGES SUMMARY

### Files Modified:

#### Backend (Server):
1. **`/supabase/functions/server/api-routes.tsx`** - MAJOR CHANGES
   - POST `/reports` - Added new clean fields, ISO timestamps
   - POST `/reports/:id/approve` - Fixed reviewer attribution, ISO timestamps
   - POST `/reports/:id/reject` - Fixed reviewer attribution, ISO timestamps
   - `fileReportToVault()` - Verified correct implementation

#### Frontend:
2. **`/utils/timezone.ts`** - NEW FILE (Created comprehensive timezone utilities)
3. **`/components/ui/CreateReportModal.tsx`** - Fixed to use `getTodayLocalDate()` and `getCurrentLocalTime()`
4. **`/components/pages/Reports.tsx`** - Updated formatTimestamp to use timezone utility, **FIXED 10-report limit bug**
5. **`/components/guard-portal/pages/MyReports.tsx`** - Added timezone imports, fixed date formatting
6. **`/components/ui/EditReportModal.tsx`** - Added timezone utilities for date/time display
7. **`/components/ui/ClientReportPDF.tsx`** - Fixed time display formatting

#### Documentation:
8. **`/AUDIT_REPORT_LIFECYCLE.md`** - NEW FILE (Comprehensive audit documentation)
9. **`/FIXES_COMPLETED.md`** - THIS FILE

---

## 8. ACCEPTANCE TESTS STATUS

### ✅ Tests that should now PASS:

**A) Guard submits report → appears in Admin Pending**
- ✅ Server sets `created_by_user_id`, `created_by_name`, `created_by_role`
- ✅ Server sets `submitted_at` when status = 'pending'
- ✅ Display should show "Submitted by Guard X" (needs frontend update)

**B) Admin approves → moves to Approved**
- ✅ Server sets `reviewed_by_user_id`, `reviewed_by_name`, `reviewed_by_role`
- ✅ Server sets `reviewed_at` (ISO timestamp)
- ✅ Display should show "Approved by Supervisor Y" (needs frontend update)

**C) Admin rejects → moves to Rejected**
- ✅ Server sets `reviewed_by_user_id`, `reviewed_by_name`, `reviewed_by_role`
- ✅ Server sets `reviewed_at` (ISO timestamp)
- ✅ Server sets `rejection_note`
- ✅ Display should show "Rejected by Supervisor Y" (needs frontend update)

**D) Counts update instantly**
- ✅ **FIXED** - Removed 10-report limit, all reports now visible
- ✅ Counts should match DB filters (proper date-based filtering)

**E) Vault entry created only for Approved**
- ✅ `fileReportToVault()` called only in approve route
- ✅ Vault category matches report type
- ✅ No duplicates (idempotent check)

**F) No future timestamps; displays in America/New_York**
- ✅ Server stores all timestamps as ISO (UTC)
- ✅ Client timezone utilities convert to local timezone
- ✅ CreateReportModal uses local date/time for defaults
- ⏳ NEEDS VERIFICATION - Check actual display in UI

**G) All buttons work reliably with error feedback**
- ⏳ NEEDS TESTING - Create, Submit, Approve, Reject, Save Draft buttons

---

## 9. REMAINING WORK (Frontend Display Updates)

### TODO: Update Frontend Display Components

The server now returns clean fields, but the frontend needs updates to display them:

**1. Update ReportsQueueTable.tsx / ReportCard.tsx:**
```typescript
// BEFORE:
<span>{report.approvedBy}</span> // "by Supervisor Sarah Chen"

// AFTER (use new clean fields):
<span>Approved by {report.reviewed_by_role} {report.reviewed_by_name}</span>
// OR if reviewed_at exists:
<span>
  {formatTimestamp(report.reviewed_at)} by {report.reviewed_by_role} {report.reviewed_by_name}
</span>
```

**2. Update EditReportModal.tsx:**
```typescript
// Show submission info:
Submitted by: {report.created_by_role} {report.created_by_name}
Submitted at: {formatTimestamp(report.submitted_at)}

// Show review info (if approved/rejected):
{report.status === 'approved' && (
  <div>
    Approved by: {report.reviewed_by_role} {report.reviewed_by_name}
    Approved at: {formatTimestamp(report.reviewed_at)}
  </div>
)}

{report.status === 'rejected' && (
  <div>
    Rejected by: {report.reviewed_by_role} {report.reviewed_by_name}
    Rejected at: {formatTimestamp(report.reviewed_at)}
    Reason: {report.rejection_note}
  </div>
)}
```

**3. Update GlobalReport TypeScript interface:**
Add new fields to the type definition in `/contexts/AppStateContext.tsx`:
```typescript
export interface GlobalReport {
  // ... existing fields ...
  
  // NEW CLEAN FIELDS:
  created_by_user_id?: number;
  created_by_name?: string;
  created_by_role?: string;
  reviewed_by_user_id?: number | null;
  reviewed_by_name?: string | null;
  reviewed_by_role?: string | null;
  created_at?: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  updated_at?: string;
  rejection_note?: string | null;
}
```

---

## 10. SQL MIGRATION (If using Postgres instead of KV)

**Note**: Current implementation uses KV store, but if migrating to Postgres:

```sql
-- Add new attribution columns
ALTER TABLE reports 
  ADD COLUMN created_by_user_id INTEGER,
  ADD COLUMN created_by_name VARCHAR(255),
  ADD COLUMN created_by_role VARCHAR(100),
  ADD COLUMN reviewed_by_user_id INTEGER,
  ADD COLUMN reviewed_by_name VARCHAR(255),
  ADD COLUMN reviewed_by_role VARCHAR(100);

-- Add new timestamp columns (all timestamptz for UTC)
ALTER TABLE reports
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN submitted_at TIMESTAMPTZ,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add rejection note
ALTER TABLE reports
  ADD COLUMN rejection_note TEXT;

-- Create indexes for queries
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_by ON reports(created_by_user_id);
CREATE INDEX idx_reports_reviewed_by ON reports(reviewed_by_user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_reviewed_at ON reports(reviewed_at DESC);

-- Migrate existing data
UPDATE reports SET
  created_by_user_id = submittedById,
  created_by_name = submittedBy,
  created_at = timestamp::timestamptz,
  updated_at = timestamp::timestamptz
WHERE created_by_user_id IS NULL;
```

---

## 11. TESTING CHECKLIST

### Manual Testing Required:

- [ ] **Guard Portal - Create Report**
  - [ ] Create Incident Report as draft → check fields
  - [ ] Submit Incident Report → check status = 'pending', submitted_at is set
  - [ ] Verify date/time defaults to local time (not UTC +1 day)

- [ ] **Admin Portal - Reports Tab**
  - [ ] View Pending reports → verify count matches
  - [ ] Approve a report → verify reviewed_by fields are set correctly
  - [ ] Check Approved tab → verify report appears with correct reviewer
  - [ ] Reject a report → verify reviewed_by fields and rejection_note
  - [ ] Check Rejected tab → verify report appears

- [ ] **Vault Tab**
  - [ ] Approve an Incident Report → verify it appears in "Incident Reports" category
  - [ ] Approve a DAR → verify it appears in "Daily Reports" category
  - [ ] Approve a Disciplinary Report → verify it appears in "HR & Internal"
  - [ ] Reject a report → verify it does NOT appear in Vault

- [ ] **Timezone Verification**
  - [ ] Set system time to 11:35 PM local time
  - [ ] Create report → verify date defaults to current day (not next day)
  - [ ] Verify all displayed timestamps show local time, not UTC

- [ ] **Counters**
  - [ ] Verify Pending count = number of pending reports
  - [ ] Verify Approved count = number of approved reports
  - [ ] Verify Rejected count = number of rejected reports
  - [ ] Verify Drafts count = number of draft reports

---

## 12. KNOWN ISSUES / LIMITATIONS

### Current Limitations:
1. **No company/user timezone preferences** - Currently using browser timezone only
   - Future: Add `company.timezone` and `user.profile.timezone` settings
   
2. **Legacy field cleanup** - Old fields still present for backwards compatibility
   - Future: Can remove `approvedBy`, `rejectedBy`, `submittedBy` once all code updated

3. **Frontend display not fully updated** - Server is fixed, but UI components need updates
   - See section 9 above for required frontend changes

### Performance Considerations:
- KV store queries filter client-side (fine for MVP, but use DB indexes in production)
- Consider adding pagination for Reports tab (currently loads all reports)

---

## 13. DEPLOYMENT NOTES

### Pre-Deployment Checklist:
- ✅ Server API routes updated
- ✅ Timezone utilities created
- ✅ CreateReportModal fixed
- ⏳ Frontend display components need updates (see section 9)
- ⏳ End-to-end testing required

### Post-Deployment Verification:
1. Check server logs for approval/rejection operations
2. Verify vault documents are created correctly
3. Monitor for any timezone-related issues
4. Verify attribution shows correct reviewer (not guard)

---

## SUMMARY

### ✅ COMPLETED (Server-Side):
- Fixed attribution: Added `reviewed_by_user_id`, `reviewed_by_name`, `reviewed_by_role`
- Fixed timestamps: All ISO strings in UTC (`created_at`, `submitted_at`, `reviewed_at`, `updated_at`)
- Fixed timezone bugs: Server stores ISO, client formats to local timezone
- Created comprehensive timezone utilities
- Verified vault routing is correct
- Updated approval/rejection routes to use clean fields

### 🟡 IN PROGRESS (Client-Side):
- Frontend display components need updates to show new fields
- Type definitions need new fields added
- Report cards/tables need to use `reviewed_by_*` instead of `approvedBy`

### ⏳ PENDING:
- End-to-end testing of complete flow
- Counter verification
- Button reliability testing
- Error handling verification

### 🎯 NEXT STEPS:
1. Update frontend display components (see section 9)
2. Add type definitions for new fields
3. Run full acceptance tests (section 8)
4. Deploy and monitor

---

**Last Updated**: 2026-01-09  
**Status**: Server fixes complete, frontend updates in progress  
**Priority**: Medium - App functional but needs frontend polish
