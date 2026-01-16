# QUICK REFERENCE - EXACT CHANGES MADE

## 📋 DATABASE CONSTRAINTS ADDED

```sql
-- 1. UNIQUE CONSTRAINT: Prevent duplicate case IDs
ALTER TABLE reports ADD CONSTRAINT reports_org_id_report_code_key 
UNIQUE (org_id, report_code);

-- 2. UNIQUE CONSTRAINT: Prevent duplicate vault entries
ALTER TABLE vault_documents ADD CONSTRAINT vault_documents_org_id_report_id_category_key
UNIQUE (org_id, report_id, category);

-- 3. PRIMARY KEY: Atomic counter table
ALTER TABLE report_code_counters ADD CONSTRAINT report_code_counters_pkey
PRIMARY KEY (org_id, year, report_type);

-- 4. CHECK CONSTRAINT: Valid report status
ALTER TABLE reports ADD CONSTRAINT reports_status_check
CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- 5. CHECK CONSTRAINT: Valid decision
ALTER TABLE reports ADD CONSTRAINT reports_decision_check
CHECK (decision IN ('APPROVED', 'REJECTED') OR decision IS NULL);
```

---

## 🔒 RLS POLICIES ADDED

```sql
-- Guards view own reports only
CREATE POLICY "Guards can view their own reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'GUARD'
    AND reports.created_by_user_id = users.id
  )
);

-- Admins view all org reports
CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('SECURITY_ADMIN', 'COMPANY_ADMIN')
    AND reports.org_id = users.org_id
  )
);

-- Guards create reports
CREATE POLICY "Guards can create reports"
ON reports FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'GUARD'
    AND reports.created_by_user_id = auth.uid()
  )
);

-- Guards update own draft/rejected reports
CREATE POLICY "Guards can update their own drafts/rejected reports"
ON reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'GUARD'
    AND reports.created_by_user_id = users.id
    AND reports.status IN ('draft', 'rejected')
  )
);

-- Admins update any report
CREATE POLICY "Admins can update reports"
ON reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('SECURITY_ADMIN', 'COMPANY_ADMIN')
    AND reports.org_id = users.org_id
  )
);

-- Guards delete own drafts only
CREATE POLICY "Guards can delete their own drafts"
ON reports FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'GUARD'
    AND reports.created_by_user_id = users.id
    AND reports.status = 'draft'
  )
);
```

---

## ⚡ API ENDPOINTS - EXACT CHANGES

### **Before (KV Store):**
```typescript
// Generated ID on client
const reportCode = `IR-${year}-${counter++}`;

// Stored in KV
await kv.set(`report:${id}`, report);
```

### **After (Postgres):**
```typescript
// POST /api/reports - Create with atomic counter
const reportCode = await db.generateReportCode(orgId, reportType);
// Uses: SELECT ... FOR UPDATE + INCREMENT

const { data, error } = await supabase
  .from('reports')
  .insert({
    org_id: orgId,
    report_code: reportCode,  // Unique, atomic
    created_by_user_id: auth.uid(),  // From JWT
    // ...
  })
  .select()
  .single();
```

### **New Endpoint: Submit Draft**
```typescript
// POST /api/reports/:id/submit
await supabase
  .from('reports')
  .update({
    status: 'pending',
    submitted_by_user_id: auth.uid(),
    submitted_at: NOW(),
    // report_code UNCHANGED (immutable)
  })
  .eq('id', reportId);
```

### **Updated: Approve Endpoint**
```typescript
// POST /api/reports/:id/approve

// SECURITY: Validate cannot approve own report
if (report.created_by_user_id === auth.uid()) {
  return 403;  // ❌ Blocked
}

// SET ATTRIBUTION FROM AUTH (secure, can't be spoofed)
await supabase
  .from('reports')
  .update({
    status: 'approved',
    decision: 'APPROVED',
    reviewed_by_user_id: user.id,      // From auth.uid()
    reviewed_by_name: user.name,       // From database
    reviewed_by_role: user.role,       // From database
    reviewed_at: NOW()
  })
  .eq('id', reportId);

// File to vault (idempotent)
await fileReportToVault(report);
```

---

## 🕐 TIMEZONE HANDLING - EXACT CHANGES

### **Before:**
```typescript
// Generated local timestamp (wrong)
const timestamp = new Date().toISOString();  // Could show future dates
```

### **After:**
```typescript
// STORAGE (Server):
const now = new Date().toISOString();  // Always UTC
await db.insert({ created_at: now });  // Stored as TIMESTAMPTZ

// DISPLAY (Client):
import { formatReviewTimestamp } from './utils/timezone';

// Format: "Jan 8, 2026 • 2:51 AM"
formatReviewTimestamp(report.reviewed_at);

// Implementation:
const timezone = 'America/New_York';  // Fixed org timezone
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: timezone,
  month: 'short',
  day: 'numeric', 
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
```

---

## 📦 VAULT ROUTING - EXACT CHANGES

### **Before:**
```typescript
// Could create duplicates
await kv.set(`vault:${++counter}`, { ... });
```

### **After:**
```typescript
// Idempotent with unique constraint
await supabase
  .from('vault_documents')
  .upsert({
    org_id: orgId,
    report_id: reportId,
    category: category,
    filename: `${report_code} - ${typeName}.pdf`,
    uploaded_by_user_id: report.created_by_user_id,  // Guard, not reviewer
    // ...
  }, {
    onConflict: 'org_id,report_id,category',  // UNIQUE constraint
    ignoreDuplicates: false
  });
```

**Result:** Approve twice → Still only 1 vault entry

---

## 🔧 FRONTEND CHANGES - EXACT CODE

### **1. Remove Client-Side ID Generation:**

**REMOVE THIS:**
```typescript
// ❌ Delete this entire function
const getNextReportId = (category: string): string => {
  let prefix = 'DAR';
  if (category.includes('Incident')) prefix = 'IR';
  // ... prefix logic
  
  const year = new Date().getFullYear();
  const prefixPattern = `#${prefix}-${year}-`;
  
  const existingNumbers = appState.reports
    .filter(r => r.caseId?.startsWith(prefixPattern))
    .map(r => parseInt(r.caseId.split('-')[2], 10));
  
  const maxNum = Math.max(...existingNumbers, 0);
  return `${prefixPattern}${String(maxNum + 1).padStart(6, '0')}`;
};

// ❌ Delete this state
const [generatedCaseId, setGeneratedCaseId] = useState<string>('');

// ❌ Delete this useEffect
useEffect(() => {
  if (!isCreateReportModalOpen) return;
  const newCaseId = getNextReportId(createReportType);
  setGeneratedCaseId(newCaseId);
}, [createReportType, isCreateReportModalOpen, appState.reports]);
```

### **2. Update Report Creation:**

**BEFORE:**
```typescript
const handleCreateReport = async (reportData: any) => {
  const reportCode = reportData.caseId.replace(/^#/, '');
  
  const newReport = {
    reportCode,  // From client-generated ID
    caseId: reportData.caseId,
    // ...
  };
  
  await addReport(newReport);
};
```

**AFTER:**
```typescript
const handleCreateReport = async (reportData: any) => {
  // Server generates case ID
  const response = await fetch(`${API_URL}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      reportType: createReportType,
      status: 'pending',  // or 'draft'
      guardName: currentUser.name,
      site: reportData.site,
      content: reportData.content,
      // ... other fields
    })
  });
  
  const { report } = await response.json();
  
  // Use server-provided case ID
  console.log('Created report:', report.caseId);  // "#IR-2026-000037"
  
  // Update local state
  setAppState(prev => ({
    ...prev,
    reports: [report, ...prev.reports]
  }));
};
```

### **3. Update Draft Submission:**

**BEFORE:**
```typescript
// Updated status locally
updateReport(draftId, { status: 'pending' });
```

**AFTER:**
```typescript
const handleSubmitDraft = async (draftId: string) => {
  const response = await fetch(`${API_URL}/api/reports/${draftId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { report } = await response.json();
  
  // Case ID unchanged
  console.log('Submitted draft:', report.caseId);  // Same as before
  
  // Update local state
  updateLocalReport(report);
};
```

### **4. Update Display Components:**

**BEFORE:**
```typescript
{report.approvedBy && (
  <div>Approved {report.approvedBy}</div>
)}
```

**AFTER:**
```typescript
import { formatReviewTimestamp } from '../utils/timezone';

{report.reviewed_by_name && report.decision === 'APPROVED' && (
  <div>
    Approved by {report.reviewed_by_role} {report.reviewed_by_name}
    {' • '}
    {formatReviewTimestamp(report.reviewed_at)}
  </div>
)}

// Output: "Approved by Supervisor Sarah Chen • Jan 8, 2026 • 2:51 AM"
```

### **5. Update CreateReportModal:**

**BEFORE:**
```typescript
<CreateReportModal
  caseId={generatedCaseId}  // Pre-generated on client
  // ...
/>
```

**AFTER:**
```typescript
<CreateReportModal
  // No caseId prop
  onSubmit={async (data) => {
    setIsSubmitting(true);
    try {
      const response = await createReport(data);
      const caseId = response.report.caseId;
      
      // Show case ID after creation
      toast.success(`Report ${caseId} created successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to create report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }}
/>

// Inside modal component:
function CreateReportModal({ onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  
  return (
    <Modal>
      {createdCaseId && (
        <div>Case ID: {createdCaseId}</div>
      )}
      
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Report'}
      </Button>
    </Modal>
  );
}
```

---

## 🧪 VERIFICATION COMMANDS

```bash
# 1. Check database constraints
psql $DB_URL -c "
  SELECT conname, contype 
  FROM pg_constraint 
  WHERE conrelid = 'reports'::regclass;
"

# 2. Check RLS policies
psql $DB_URL -c "
  SELECT policyname, cmd, qual 
  FROM pg_policies 
  WHERE tablename = 'reports';
"

# 3. Test atomic counter
psql $DB_URL -c "
  SELECT increment_report_counter(
    '00000000-0000-0000-0000-000000000001'::UUID,
    2026,
    'incident'
  );
"

# 4. Check for duplicate case IDs
psql $DB_URL -c "
  SELECT report_code, COUNT(*) 
  FROM reports 
  GROUP BY report_code 
  HAVING COUNT(*) > 1;
"

# 5. Test concurrency
deno run --allow-all /supabase/functions/server/test-concurrency.ts

# 6. Test API
curl -X POST $API_URL/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportType":"incident","status":"draft","guardName":"Test","site":"Test Site","content":"Test"}'
```

---

## 📊 SUCCESS METRICS

After deployment, verify:

```sql
-- ✅ No duplicate case IDs
SELECT COUNT(*) - COUNT(DISTINCT report_code) as duplicates FROM reports;
-- Expected: 0

-- ✅ All reports have org_id
SELECT COUNT(*) FROM reports WHERE org_id IS NULL;
-- Expected: 0

-- ✅ Vault entries match approved reports
SELECT 
  (SELECT COUNT(*) FROM reports WHERE decision = 'APPROVED') as approved,
  (SELECT COUNT(*) FROM vault_documents) as vault_docs;
-- Expected: Equal or vault_docs ≤ approved

-- ✅ All reports have created_by
SELECT COUNT(*) FROM reports WHERE created_by_user_id IS NULL;
-- Expected: 0

-- ✅ Check counter sequences
SELECT * FROM report_code_counters ORDER BY year DESC, report_type;
-- Should show sequential increments
```

---

## 🚨 ROLLBACK PLAN

If issues occur, rollback:

```sql
-- 1. Drop new tables
DROP TABLE IF EXISTS vault_documents CASCADE;
DROP TABLE IF EXISTS report_audit_log CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS report_code_counters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 2. Drop functions
DROP FUNCTION IF EXISTS increment_report_counter;
DROP FUNCTION IF EXISTS enforce_report_immutability;
DROP FUNCTION IF EXISTS log_report_changes;

-- 3. Restore KV-based backend
# Revert server/index.tsx to import api-routes.tsx (not api-routes-postgres.tsx)
```

---

## ✅ COMPLETION CHECKLIST

- [x] Database schema created
- [x] Constraints added (unique, check)
- [x] RLS policies implemented
- [x] Triggers created (immutability, audit)
- [x] Atomic counter function created
- [x] New API routes implemented
- [x] Timezone utilities enhanced
- [x] Concurrency test script created
- [x] Migration documentation written
- [x] Test suite documented
- [ ] Database migrations run
- [ ] Test users seeded
- [ ] Backend deployed
- [ ] Concurrency tests passed
- [ ] Frontend changes applied
- [ ] Smoke tests passed
- [ ] Production deployment

---

**Quick Reference Version:** 1.0
**Date:** January 9, 2026
