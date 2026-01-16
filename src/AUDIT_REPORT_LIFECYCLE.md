# Guard Up - Report Lifecycle Functional Audit

## 1. REPORT STATE MACHINE (Current Implementation)

### Status Values Used:
- **`draft`** - Report created but not submitted for review
- **`pending`** - Report submitted and awaiting admin/supervisor review  
- **`approved`** - Report reviewed and approved by admin/supervisor
- **`rejected`** - Report reviewed and rejected by admin/supervisor (guard can resubmit)

### Database Schema (Current - KV Store):
```typescript
{
  id: number,                          // Sequential ID
  reportCode: string,                  // e.g., "IR-2026-000001" (immutable)
  referenceId: string,                 // e.g., "REF-1736393044442-123"
  type: string,                        // "Incident" | "DAR" | "Maintenance" | "Disciplinary"
  reportType: ReportType,              // Normalized: 'incident' | 'dar' | 'maintenance' | 'disciplinary'
  
  // Timestamps (ISSUE: Some are formatted strings, not ISO)
  timestamp: string,                   // ISO string (created time)
  createdAt: string,                   // ISO string
  updatedAt: string,                   // ISO string
  
  // Attribution (ISSUE: Poor data model)
  submittedById: number,               // User ID who created
  submittedBy: string,                 // User name who created
  guardName: string,                   // Guard who wrote the report
  createdBy: string,                   // Redundant with submittedBy
  
  // Approval fields (ISSUE: Formatted strings, not clean data)
  approvedBy: string,                  // e.g., "by Supervisor Sarah Chen"
  approvedByRole: string,              // e.g., "Supervisor"
  approvedAt: string,                  // Formatted date (NOT ISO)
  
  // Rejection fields (ISSUE: Same as approval)
  rejectedBy: string,                  // e.g., "by Supervisor Sarah Chen"
  rejectedByRole: string,              // e.g., "Supervisor"
  rejectedAt: string,                  // Formatted date (NOT ISO)
  rejectionNote: string,               // Rejection reason
  
  status: 'draft' | 'pending' | 'approved' | 'rejected',
  
  // Report-specific fields
  site: string,
  location: string,
  content: string,
  ...
}
```

## 2. CRITICAL ISSUES IDENTIFIED

### Issue #1: No separate `reviewed_by_user_id` field
❌ **Problem**: `approvedBy` and `rejectedBy` are formatted strings ("by Supervisor Sarah Chen"), not user IDs
✅ **Fix Needed**: Add `reviewed_by_user_id: number` field

### Issue #2: No separate `submitted_at` timestamp
❌ **Problem**: `createdAt` is used for both draft creation and submission
✅ **Fix Needed**: Add `submitted_at: string` (ISO timestamp when status changes from draft→pending)

### Issue #3: No `reviewed_at` ISO timestamp
❌ **Problem**: `approvedAt` and `rejectedAt` are formatted locale strings, not ISO timestamps
✅ **Fix Needed**: Add `reviewed_at: string` (ISO timestamp)

### Issue #4: Server formats timestamps instead of storing ISO
❌ **Problem**: Lines 199-206 and 299-306 in api-routes.tsx use `toLocaleString()` on server
✅ **Fix Needed**: Store ISO timestamps, format only on display (client-side)

### Issue #5: Attribution confusion
❌ **Problem**: Multiple overlapping fields: `submittedBy`, `submittedById`, `guardName`, `createdBy`
✅ **Fix Needed**: Standardize to:
  - `created_by_user_id` (or `submitted_by_user_id`) - who created the report
  - `reviewed_by_user_id` - who approved/rejected

## 3. PROPOSED DATABASE SCHEMA (Fixed)

```typescript
{
  // Identity
  id: number,
  reportCode: string,                  // Immutable canonical ID
  referenceId: string,
  
  // Type
  type: string,                        // Display type
  reportType: ReportType,              // Normalized type
  
  // Timestamps (ALL ISO strings in UTC)
  created_at: string,                  // When first created (ISO)
  submitted_at: string | null,         // When submitted for review (ISO)
  reviewed_at: string | null,          // When approved/rejected (ISO)
  updated_at: string,                  // Last update (ISO)
  
  // Attribution (Clean IDs + names for display)
  created_by_user_id: number,          // User ID who created
  created_by_name: string,             // Name for display
  created_by_role: string,             // Role for display
  
  reviewed_by_user_id: number | null,  // User ID who approved/rejected
  reviewed_by_name: string | null,     // Name for display
  reviewed_by_role: string | null,     // Role for display
  
  // Status & Review
  status: 'draft' | 'pending' | 'approved' | 'rejected',
  rejection_note: string | null,       // Only if rejected
  
  // Report Content
  site: string,
  location: string,
  content: string,
  guardName: string,                   // Keep for backwards compat
  ...
}
```

## 4. STATE TRANSITIONS

```
┌─────────┐
│  DRAFT  │ ◄──────────────────────────┐
└────┬────┘                             │
     │ Submit (Guard)                   │
     ▼                                  │
┌─────────┐                             │
│ PENDING │                             │
└────┬────┘                             │
     │                                  │
     ├─── Approve (Admin) ──► APPROVED │
     │                                  │
     └─── Reject (Admin) ───► REJECTED │
                                   │    │
                              Resubmit  │
                              (Guard)   │
                                   └────┘
```

## 5. API ROUTES AUDIT

### ✅ GET `/reports` - Working
- Role-based filtering (guards see own, admins see all)
- Returns sorted by ID descending

### ✅ POST `/reports` - Working
- Generates sequential reportCode
- Sets `submittedById`, `submittedBy`, `createdAt`
- Status defaults to 'pending'

### ⚠️ POST `/reports/:id/approve` - NEEDS FIX
**Issues:**
1. Formats timestamp with `toLocaleString()` instead of ISO (lines 199-206)
2. Uses signature string "by Supervisor Name" instead of clean fields
3. No `reviewed_at` ISO timestamp
4. No `reviewed_by_user_id` field

**Fix Required:**
```typescript
// BEFORE (current)
approvedBy: `by ${role} ${name}`,    // Formatted string
approvedAt: time,                     // Locale string

// AFTER (fixed)
reviewed_by_user_id: user.id,
reviewed_by_name: user.name,
reviewed_by_role: user.role,
reviewed_at: new Date().toISOString(), // ISO timestamp
```

### ⚠️ POST `/reports/:id/reject` - NEEDS FIX
**Same issues as approve**

## 6. VAULT ROUTING AUDIT

**Current Implementation (Line 268 in api-routes.tsx):**
```typescript
await fileReportToVault(approvedReport);
```

✅ **Vault filing happens only on approval** (correct)
❌ **Rejected reports do NOT create vault entries** (correct)

**Vault categories mapped correctly:**
- Incident → "Incident Reports"  
- DAR → "Daily Activity Reports"
- Maintenance → "Maintenance Requests"
- Disciplinary → "Personnel Records" (internal only)
- Shift Pass-On → Auto-approved to vault

## 7. ACCEPTANCE TEST CHECKLIST

- [ ] A) Guard submits report → appears in Admin Pending with "Submitted by Guard X"
- [ ] B) Admin approves → moves to Approved, shows "Approved by Supervisor/Admin Y", reviewed_at is correct
- [ ] C) Admin rejects → moves to Rejected, shows "Rejected by Supervisor/Admin Y"  
- [ ] D) Counts update instantly and match DB
- [ ] E) Vault entry created only for Approved, category matches report type
- [ ] F) No future timestamps; everything displays in America/New_York
- [ ] G) All buttons work reliably with visible error feedback on failure

## 8. REQUIRED FIXES

### Priority 1: Database Schema Migration
1. Add `reviewed_by_user_id: number | null`
2. Add `submitted_at: string | null` (ISO)
3. Add `reviewed_at: string | null` (ISO)
4. Add `created_by_user_id: number` (rename from `submittedById`)
5. Deprecate `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt` (keep for migration)

### Priority 2: Server-Side Timestamp Fixes
1. Replace `toLocaleString()` with `toISOString()` in approve/reject routes
2. Use timezone utility on client-side for display only

### Priority 3: API Route Updates
1. Update `/reports/:id/approve` to use new schema
2. Update `/reports/:id/reject` to use new schema
3. Update `/reports` POST to set `submitted_at` when status is 'pending'

### Priority 4: Frontend Updates
1. Update `approveReport()` in AppStateContext to use new fields
2. Update `rejectReport()` in AppStateContext to use new fields
3. Update report display components to show proper attribution
4. Use timezone utilities for all date/time displays

### Priority 5: Counter & Filter Fixes
1. Verify Pending count = reports where status='pending'
2. Verify Approved count = reports where status='approved'
3. Verify Rejected count = reports where status='rejected'
4. Verify Drafts count = reports where status='draft'
