# GUARD UP MVP - TEST SUITE
## Concurrency & Lifecycle Verification

---

## 🧪 TEST SUITE OVERVIEW

This document provides comprehensive testing procedures to verify the Reports lifecycle implementation.

---

## 1. CONCURRENCY TESTS

### **Test 1.1: Basic Concurrency (20 requests)**

**Objective:** Verify no duplicate case IDs with 20 concurrent requests

**Setup:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_USER_TOKEN="your-test-user-jwt-token"
```

**Execute:**
```bash
cd /supabase/functions/server
deno run --allow-all test-concurrency.ts
```

**Expected Result:**
```
✅ Successful: 20/20
📊 Case ID Analysis:
   Generated:  20
   Unique:     20
   Duplicates: 0
✅ TEST PASSED: All requests successful, no duplicates
```

---

### **Test 1.2: High Concurrency (100 requests)**

**Objective:** Verify no duplicate case IDs under high load

**Setup:**
```bash
# Edit test-concurrency.ts
const NUM_CONCURRENT_REQUESTS = 100;
```

**Execute:**
```bash
deno run --allow-all test-concurrency.ts
```

**Expected Result:**
```
✅ Successful: 100/100
📊 Case ID Analysis:
   Generated:  100
   Unique:     100
   Duplicates: 0
✅ TEST PASSED: All requests successful, no duplicates
```

---

### **Test 1.3: Multi-Type Concurrency**

**Objective:** Verify different report types can be created concurrently

**Manual Steps:**
1. Open 5 browser tabs
2. Login as different guards in each tab
3. Click "Create Report" in each tab simultaneously
4. Create different report types (Incident, DAR, Maintenance, etc.)
5. Check that all reports have unique case IDs

**Expected Result:**
```
IR-2026-000001
DAR-2026-000001
MNT-2026-000001
DIS-2026-000001
SPO-2026-000001
```
All unique, different sequences per type.

---

## 2. CASE ID IMMUTABILITY TESTS

### **Test 2.1: Draft → Submit Flow**

**Steps:**
1. Create draft report
   ```bash
   POST /api/reports
   { "reportType": "incident", "status": "draft", ... }
   ```
   
2. Note the returned case ID (e.g., `#IR-2026-000037`)

3. Submit the draft
   ```bash
   POST /api/reports/{id}/submit
   ```

4. Verify case ID unchanged in response

5. Query database:
   ```sql
   SELECT report_code FROM reports WHERE id = '{id}';
   ```

**Expected Result:**
- Create response: `caseId: "#IR-2026-000037"`
- Submit response: `caseId: "#IR-2026-000037"` (same)
- Database: `report_code: "IR-2026-000037"` (unchanged)

---

### **Test 2.2: Attempt to Modify Case ID**

**Steps:**
1. Create report, get ID

2. Attempt to update report_code:
   ```bash
   PUT /api/reports/{id}
   { "report_code": "HACKED-2026-999999" }
   ```

**Expected Result:**
```
❌ ERROR: Cannot modify report_code (Case ID is immutable)
HTTP 500 - Trigger error from database
```

---

### **Test 2.3: Approval Flow Immutability**

**Steps:**
1. Create draft → Submit → Approve
2. Check case ID at each step
3. Check vault document filename

**Expected Result:**
```
Draft:    #IR-2026-000037
Pending:  #IR-2026-000037 (same)
Approved: #IR-2026-000037 (same)
Vault:    IR-2026-000037 - Incident Report.pdf (same code)
```

---

## 3. ATTRIBUTION TESTS

### **Test 3.1: Correct Creator Attribution**

**Steps:**
1. Login as Guard "John Doe"
2. Create report
3. Check report in database:
   ```sql
   SELECT created_by_name, submitted_by_name, reviewed_by_name
   FROM reports WHERE id = '{id}';
   ```

**Expected Result:**
```
created_by_name:   "John Doe"
submitted_by_name: "John Doe"
reviewed_by_name:  NULL (not yet reviewed)
```

---

### **Test 3.2: Correct Reviewer Attribution**

**Steps:**
1. Guard "John Doe" creates and submits report
2. Login as Admin "Sarah Chen"
3. Approve the report
4. Check UI displays: "Approved by Supervisor Sarah Chen"
5. Check database:
   ```sql
   SELECT reviewed_by_name, reviewed_by_role, decision
   FROM reports WHERE id = '{id}';
   ```

**Expected Result:**
```
reviewed_by_name: "Sarah Chen"
reviewed_by_role: "Supervisor"
decision:         "APPROVED"
```

**UI Display:**
```
✅ Approved by Supervisor Sarah Chen • Jan 8, 2026 • 2:51 AM
```

---

### **Test 3.3: Cannot Approve Own Report**

**Steps:**
1. Login as Admin "Sarah Chen"
2. Create report as Sarah
3. Attempt to approve same report

**Expected Result:**
```
❌ ERROR: You cannot approve your own report
HTTP 403 - Authorization error
```

---

### **Test 3.4: Guard Cannot Approve**

**Steps:**
1. Login as Guard "John Doe"
2. Attempt to approve any report:
   ```bash
   POST /api/reports/{id}/approve
   Authorization: Bearer {guard-token}
   ```

**Expected Result:**
```
❌ ERROR: Forbidden - Insufficient permissions
HTTP 403 - Role check failed
```

---

## 4. TIMEZONE TESTS

### **Test 4.1: UTC Storage Verification**

**Steps:**
1. Create report at exactly 11:00 PM EST (Jan 8, 2026)
2. Check database:
   ```sql
   SELECT created_at FROM reports WHERE id = '{id}';
   ```

**Expected Result:**
```
created_at: "2026-01-09T04:00:00Z"  (UTC, next day)
```

---

### **Test 4.2: Display Timezone Conversion**

**Steps:**
1. Report created at `2026-01-09T04:00:00Z` (UTC)
2. Check UI display in America/New_York

**Expected Result:**
```
Display: "Jan 8, 2026 • 11:00 PM"
NOT:     "Jan 9, 2026 • 4:00 AM"
```

---

### **Test 4.3: Approval Timestamp Display**

**Steps:**
1. Approve report at 2:51 AM EST (Jan 8)
2. Database stores: `2026-01-08T07:51:00Z`
3. UI displays timestamp

**Expected Result:**
```
✅ Approved by Supervisor Sarah Chen • Jan 8, 2026 • 2:51 AM
```

---

## 5. VAULT IDEMPOTENCY TESTS

### **Test 5.1: Single Approval**

**Steps:**
1. Create and submit report
2. Approve report
3. Check vault:
   ```sql
   SELECT COUNT(*) FROM vault_documents WHERE report_id = '{id}';
   ```

**Expected Result:**
```
COUNT: 1
Filename: "IR-2026-000037 - Incident Report.pdf"
Category: "Incident Reports"
Uploaded By: "John Doe" (guard who created it)
```

---

### **Test 5.2: Duplicate Approval Attempt**

**Steps:**
1. Approve report (creates vault entry)
2. Manually call approval endpoint again
3. Check vault count

**Expected Result:**
```
COUNT: 1 (still only 1 entry)
Database enforces: UNIQUE(org_id, report_id, category)
```

---

### **Test 5.3: Concurrent Approvals**

**Steps:**
1. Two admins approve same report simultaneously
2. Check vault documents table

**Expected Result:**
```
COUNT: 1
One succeeds, one hits unique constraint (silently handled)
```

---

## 6. RLS (ROW LEVEL SECURITY) TESTS

### **Test 6.1: Guard Can Only See Own Reports**

**Steps:**
1. Guard A creates 3 reports
2. Guard B creates 3 reports
3. Guard A queries:
   ```bash
   GET /api/reports
   Authorization: Bearer {guard-a-token}
   ```

**Expected Result:**
```
Returns: 3 reports (only Guard A's reports)
```

---

### **Test 6.2: Admin Sees All Reports**

**Steps:**
1. Multiple guards create reports
2. Admin queries:
   ```bash
   GET /api/reports
   Authorization: Bearer {admin-token}
   ```

**Expected Result:**
```
Returns: All reports in organization
```

---

### **Test 6.3: Guard Cannot Update Other Guard's Report**

**Steps:**
1. Guard A creates report (ID: abc-123)
2. Guard B attempts to update:
   ```bash
   PUT /api/reports/abc-123
   Authorization: Bearer {guard-b-token}
   ```

**Expected Result:**
```
❌ ERROR: Forbidden or Not Found
HTTP 403 or 404 (RLS filters it out)
```

---

### **Test 6.4: Guard Cannot Delete Submitted Report**

**Steps:**
1. Guard creates draft
2. Guard submits draft (status: pending)
3. Guard attempts to delete:
   ```bash
   DELETE /api/reports/{id}
   ```

**Expected Result:**
```
❌ ERROR: Only draft reports can be deleted
HTTP 400
```

---

## 7. BUTTON FUNCTIONALITY TESTS

### **Test 7.1: Save as Draft Button**

**Steps:**
1. Click "Create Report"
2. Fill in required fields
3. Click "Save as Draft"
4. Observe loading state
5. Check success toast

**Expected Result:**
```
✅ Loading spinner appears
✅ Toast: "Draft saved successfully"
✅ Modal closes
✅ Report appears in "Drafts" tab
✅ Case ID visible immediately: "#IR-2026-000037"
```

---

### **Test 7.2: Submit Button (from Draft)**

**Steps:**
1. Open draft report
2. Click "Submit"
3. Observe behavior

**Expected Result:**
```
✅ Loading spinner appears
✅ Toast: "Report submitted successfully"
✅ Report moves from "Drafts" to "Pending"
✅ Case ID unchanged
```

---

### **Test 7.3: Create Report Button (Direct Submit)**

**Steps:**
1. Click "Create Report"
2. Fill in required fields
3. Click "Create Report" (not Save as Draft)
4. Observe behavior

**Expected Result:**
```
✅ Loading spinner appears
✅ Toast: "Report submitted successfully"
✅ Report appears in "Pending" tab
✅ Case ID generated and visible
```

---

### **Test 7.4: Approve & Finalize Button**

**Steps:**
1. Navigate to pending report
2. Click "Approve & Finalize"
3. Observe behavior

**Expected Result:**
```
✅ Loading spinner appears
✅ Toast: "Report approved successfully"
✅ Report moves to "Approved" tab
✅ Vault entry created
✅ UI shows: "Approved by Supervisor {name} • {timestamp}"
```

---

### **Test 7.5: Reject Button**

**Steps:**
1. Navigate to pending report
2. Click "Reject"
3. Enter rejection reason
4. Submit

**Expected Result:**
```
✅ Loading spinner appears
✅ Toast: "Report rejected"
✅ Report moves to "Rejected" tab
✅ UI shows: "Rejected by Supervisor {name} • {timestamp}"
✅ Rejection note displayed
✅ NOT filed to vault
```

---

### **Test 7.6: Error Handling**

**Steps:**
1. Disconnect internet
2. Click "Create Report"
3. Observe behavior

**Expected Result:**
```
✅ Loading spinner appears
✅ Toast: "Failed to create report: Network error"
✅ Button re-enabled
✅ Form data preserved
✅ Console logs error details
```

---

## 8. LOAD TESTING

### **Test 8.1: Sequential Report Creation**

**Objective:** Verify system stability with many reports

**Setup:**
```typescript
for (let i = 0; i < 1000; i++) {
  await createReport({ ... });
}
```

**Expected Result:**
```
✅ All 1000 reports created successfully
✅ Case IDs: IR-2026-000001 through IR-2026-001000
✅ No duplicates
✅ No gaps in sequence
```

---

### **Test 8.2: Batch Operations**

**Objective:** Verify batch approval works correctly

**Steps:**
1. Create 50 pending reports
2. Select all 50
3. Click "Approve Selected"
4. Wait for completion

**Expected Result:**
```
✅ All 50 approved successfully
✅ 50 vault entries created
✅ No duplicate vault entries
✅ Correct reviewer attribution on all
```

---

## 9. EDGE CASE TESTS

### **Test 9.1: Year Rollover**

**Steps:**
1. Set system time to Dec 31, 2025, 11:59 PM
2. Create report → Case ID: `IR-2025-000123`
3. Set system time to Jan 1, 2026, 12:01 AM
4. Create report → Case ID: `IR-2026-000001`

**Expected Result:**
```
✅ New year starts new sequence
✅ No collision between years
```

---

### **Test 9.2: Sequence Overflow**

**Steps:**
1. Set counter to 999998
2. Create 5 reports

**Expected Result:**
```
IR-2026-999998
IR-2026-999999
IR-2026-1000000 (7 digits)
IR-2026-1000001
IR-2026-1000002
```

---

### **Test 9.3: Network Interruption During Creation**

**Steps:**
1. Start creating report
2. Disable network mid-request
3. Re-enable network
4. Retry creation

**Expected Result:**
```
✅ First request fails (no case ID assigned)
✅ Retry succeeds with new case ID
✅ No orphaned records in database
```

---

## 10. REGRESSION TESTS

Run after any code changes:

```bash
# 1. Concurrency test
deno run --allow-all test-concurrency.ts

# 2. Manual smoke tests
- Create draft → Submit → Approve (full flow)
- Check case ID consistency
- Check attribution correctness
- Check timestamp display
- Check vault entry

# 3. Database integrity checks
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT report_code) as unique_codes,
  COUNT(*) - COUNT(DISTINCT report_code) as duplicates
FROM reports;
-- Expected: duplicates = 0
```

---

## 📊 TEST RESULTS TRACKING

### **Test Run: [DATE]**

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| 1.1 | Concurrency 20 | ⬜ | |
| 1.2 | Concurrency 100 | ⬜ | |
| 2.1 | Draft → Submit | ⬜ | |
| 3.2 | Reviewer Attribution | ⬜ | |
| 4.2 | Timezone Display | ⬜ | |
| 5.1 | Vault Idempotency | ⬜ | |
| 6.1 | RLS Guard | ⬜ | |
| 7.1-7.6 | All Buttons | ⬜ | |

**Legend:** ⬜ Not Run | ✅ Passed | ❌ Failed

---

## 🚨 CRITICAL TESTS (Must Pass)

These tests MUST pass before deploying to production:

1. ✅ **Test 1.1**: 20 concurrent requests, no duplicates
2. ✅ **Test 2.1**: Case ID immutability (draft → submit)
3. ✅ **Test 3.2**: Correct reviewer attribution
4. ✅ **Test 3.3**: Cannot approve own report
5. ✅ **Test 4.2**: Timezone display correctness
6. ✅ **Test 5.1**: Vault idempotency
7. ✅ **Test 6.1**: RLS guard isolation
8. ✅ **Test 7.1-7.6**: All buttons work with error handling

---

## 📝 NOTES

- Run tests in a staging environment first
- Keep test data separate from production
- Clean up test data after each test run
- Document any test failures with screenshots
- Re-run failed tests after fixes

---

**Test Suite Version:** 1.0
**Last Updated:** January 9, 2026
