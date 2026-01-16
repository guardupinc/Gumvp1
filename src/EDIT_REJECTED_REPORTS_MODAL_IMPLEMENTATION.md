# Edit Rejected Reports - Modal-Based Resubmission Implementation

## Overview
Updated the Edit & Resubmit functionality to open a modal instead of auto-creating a draft. Users can now edit their rejected reports in a familiar modal interface and choose between "Save Draft" or "Resubmit for Review".

## Changes Made

### 1. Updated `handleEditAndResubmit` in `/components/pages/Reports.tsx`
**Before**: Automatically created a draft and navigated to Drafts tab  
**After**: Opens CreateReportModal in edit/resubmission mode with pre-filled data

```typescript
const handleEditAndResubmit = (rejectedReport: Report) => {
  // Permission check
  if (rejectedReport.createdBy !== currentUser.name) {
    toast.error('You can only edit rejected reports you created');
    return;
  }

  // Set rejected report as editing target with resubmission flag
  setEditingReport({
    ...rejectedReport,
    isResubmission: true,
    revisionOfReportId: rejectedReport.id
  });
  
  // Determine report type and open modal
  const modalReportType = reportTypeMap[rejectedReport.type] || 'incident';
  setCreateReportType(modalReportType);
  setIsCreateReportModalOpen(true);
};
```

### 2. Added New Handlers in `/components/pages/Reports.tsx`

#### `handleResubmissionSaveDraft` (line ~1133)
- Creates a new draft report from edited data
- Status: 'draft'
- Navigates to Drafts tab after saving
- Toast: "✓ Draft saved (revision of IR-2026-XXXXX). Continue editing in Drafts tab."

#### `handleResubmitForReview` (line ~1177)
- Creates a new pending report from edited data
- Status: 'pending' (goes directly to review queue)
- Generates permanent report code
- Navigates to Pending tab after submission
- Toast: "✓ Revised Incident Report #IR-2026-XXXXX submitted for review (revision of IR-2026-YYYYY)."

### 3. Updated CreateReportModal Props in `/components/pages/Reports.tsx` (line ~1374)

```typescript
<CreateReportModal
  isOpen={isCreateReportModalOpen}
  onClose={() => {
    setIsCreateReportModalOpen(false);
    setEditingReport(null);
  }}
  reportType={createReportType}
  officerName={currentUser.name}
  caseId={generatedCaseId}
  initialData={
    editingReport?.status === 'draft' 
      ? editingReport 
      : (editingReport as any)?.isResubmission 
        ? editingReport 
        : undefined
  }
  isResubmission={(editingReport as any)?.isResubmission || false}
  rejectionNote={(editingReport as any)?.isResubmission ? editingReport?.rejectionNote : undefined}
  onSubmit={(data) => { /* ... */ }}
  onSaveAsDraft={
    (editingReport as any)?.isResubmission 
      ? handleResubmissionSaveDraft 
      : handleSaveAsDraft
  }
  onResubmitForReview={
    (editingReport as any)?.isResubmission 
      ? handleResubmitForReview 
      : undefined
  }
/>
```

### 4. Updated CreateReportModal Component (`/components/ui/CreateReportModal.tsx`)

#### Added New Prop (line ~59)
```typescript
onResubmitForReview?: (data: any) => void;  // Optional: Resubmit rejected report for review
```

#### Added New Handler (line ~627)
```typescript
const handleResubmitForReview = () => {
  if (!onResubmitForReview) return;
  
  // Collect all form data (same structure as Save as Draft)
  let reportData: any = { caseId: caseId };
  
  if (reportType === 'incident') {
    reportData = {
      // ... all incident report fields
    };
  } else if (reportType === 'dar') {
    // ... all DAR fields
  } // ... etc for other report types
  
  onResubmitForReview(reportData);
  resetIncidentForm();
  onClose();
};
```

#### Updated Action Buttons (line ~1259 for Incident Reports)
**Resubmission Mode** (when `isResubmission` is true):
- Cancel button
- Save Draft button (creates draft, validation disabled if form invalid)
- **Resubmit for Review button** (creates pending report, validation disabled if form invalid)

**Normal Mode** (create new report or edit draft):
- Cancel button
- Save as Draft button (optional, if `onSaveAsDraft` provided)
- Submit/Create Report button

```typescript
{isResubmission && onResubmitForReview ? (
  <>
    {/* Save Draft button */}
    <button onClick={handleSaveAsDraft} disabled={!isIncidentFormValid}>
      Save Draft
    </button>
    
    {/* Resubmit for Review button */}
    <button onClick={handleResubmitForReview} disabled={!isIncidentFormValid}>
      Resubmit for Review
    </button>
  </>
) : (
  <>
    {/* Normal Save as Draft (optional) */}
    {onSaveAsDraft && <button onClick={handleSaveAsDraft}>Save as Draft</button>}
    
    {/* Submit/Create Report */}
    <button type="submit">
      {initialData ? 'Submit Report' : 'Create Report'}
    </button>
  </>
)}
```

## User Flow

### Scenario: Guard Edits Rejected Report

1. **Guard clicks "Edit & Resubmit"** on their rejected report in Admin Portal
2. **Permission Check**: System verifies `report.createdBy === currentUser.name`
3. **Modal Opens**: CreateReportModal opens in resubmission mode
   - All fields pre-filled with rejected report data
   - Rejection notice displayed at top (orange banner)
   - Modal title shows "Revise & Resubmit - Incident Report"
4. **Guard Edits Form**: Makes necessary corrections based on rejection feedback
5. **Guard Has Two Options**:

#### Option A: Save Draft
- Clicks "Save Draft" button
- System creates new draft report with `revisionOfReportId` pointing to original
- Toast: "✓ Draft saved (revision of IR-2026-000035). Continue editing in Drafts tab."
- Automatically navigates to Drafts tab
- Guard can continue editing later

#### Option B: Resubmit for Review
- Clicks "Resubmit for Review" button
- System creates new pending report with permanent code (e.g., IR-2026-000042)
- `revisionOfReportId` preserved for audit trail
- Toast: "✓ Revised Incident Report #IR-2026-000042 submitted for review (revision of IR-2026-000035)."
- Automatically navigates to Pending tab
- Report enters supervisor review queue

6. **Original Rejected Report**: Remains unchanged in Rejected tab (immutable)

## Button States & Validation

### Resubmission Mode

**Save Draft Button**:
- Enabled: When all required fields are filled and no validation errors
- Disabled: When required fields missing OR date/time validation errors
- Visual: Blue accent (`rgba(59, 130, 246, 0.1)`)
- Cursor: `not-allowed` when disabled

**Resubmit for Review Button**:
- Enabled: When all required fields are filled and no validation errors
- Disabled: When required fields missing OR date/time validation errors
- Visual: Primary orange button (#FF7A18)
- Cursor: `not-allowed` when disabled
- Text changes to "Processing..." during submission

### Normal Mode (Create/Edit Draft)

**Save as Draft Button** (optional):
- Only shown if `onSaveAsDraft` handler provided
- Can save with incomplete data BUT NOT with validation errors
- Disabled only when date/time validation errors present

**Submit/Create Report Button**:
- Requires all required fields filled
- Requires no validation errors
- Text: "Create Report" (new) or "Submit Report" (editing draft)

## Rejection Notice Display

When `isResubmission` is true and `rejectionNote` exists, modal shows:

```tsx
<div style={{ 
  padding: '1rem', 
  backgroundColor: 'rgba(255, 122, 24, 0.1)', 
  borderRadius: '8px',
  marginBottom: '1.5rem',
  border: '1px solid rgba(255, 122, 24, 0.3)'
}}>
  <h4 style={{ 
    color: '#FF7A18', 
    fontSize: '0.875rem', 
    fontWeight: 600, 
    marginBottom: '0.5rem' 
  }}>
    ⚠️ Report Rejected - Revisions Required
  </h4>
  <p style={{ color: '#9CA3AF', fontSize: '0.875rem', lineHeight: 1.5 }}>
    <strong>Reason:</strong> {rejectionNote}
  </p>
</div>
```

## Data Flow

### Save Draft Flow
```
User clicks "Save Draft"
  ↓
handleResubmissionSaveDraft()
  ↓
Collect form data
  ↓
Create new report:
  - id: undefined (assigned by backend)
  - status: 'draft'
  - reportCode: 'DRAFT-XXX'
  - revisionOfReportId: originalRejectedReport.id
  - createdBy: currentUser.name
  - Clear rejection/approval metadata
  ↓
addReport(newDraft)
  ↓
Toast success message
  ↓
Navigate to Drafts tab
```

### Resubmit for Review Flow
```
User clicks "Resubmit for Review"
  ↓
handleResubmitForReview()
  ↓
Generate permanent report code (e.g., IR-2026-000042)
  ↓
Collect form data
  ↓
Create new report:
  - id: undefined (assigned by backend)
  - status: 'pending'
  - reportCode: 'IR-2026-000042'
  - caseId: '#IR-2026-000042'
  - revisionOfReportId: originalRejectedReport.id
  - createdBy: currentUser.name
  - Clear rejection/approval metadata
  ↓
addReport(newReport)
  ↓
Toast success message with lineage
  ↓
Navigate to Pending tab
```

## Remaining TODOs

### ✅ Completed
- ✅ Updated handleEditAndResubmit to open modal
- ✅ Added handleResubmissionSaveDraft handler
- ✅ Added handleResubmitForReview handler
- ✅ Updated CreateReportModal to accept onResubmitForReview prop
- ✅ Added handleResubmitForReview handler in CreateReportModal
- ✅ Updated action buttons for Incident Report form

### 🔄 In Progress
- Update action buttons for DAR form
- Update action buttons for Maintenance form
- Update action buttons for Disciplinary form
- Update action buttons for Shift Pass-On form

## Benefits of Modal-Based Approach

1. **Familiar UI**: Users edit in same interface they use to create reports
2. **No Auto-Creation**: No draft created until user explicitly chooses
3. **Clear Choice**: Two distinct actions (Save Draft vs Resubmit)
4. **Validation Feedback**: Real-time validation while editing
5. **Rejection Context**: Rejection note visible while editing
6. **Flexible Workflow**: Can save draft and continue later, or resubmit immediately
7. **Clean Audit Trail**: Original rejected report remains immutable

## Testing Scenarios

### ✅ Test Case 1: Open Edit Modal
1. Login as Guard "John Smith"
2. Navigate to Reports > Rejected tab
3. Find rejected report created by "John Smith"
4. Click "Edit & Resubmit"
5. Verify modal opens with:
   - All fields pre-filled
   - Rejection notice at top
   - Title shows "Revise & Resubmit"
   - Two buttons: Save Draft + Resubmit for Review

### ✅ Test Case 2: Save as Draft
1. Open edit modal for rejected report
2. Make edits to address rejection feedback
3. Click "Save Draft"
4. Verify:
   - New draft created in Drafts tab
   - Has `revisionOfReportId` pointing to original
   - Navigated to Drafts tab
   - Toast shows revision reference
   - Original rejected report unchanged

### ✅ Test Case 3: Resubmit for Review
1. Open edit modal for rejected report
2. Make edits to address rejection feedback
3. Click "Resubmit for Review"
4. Verify:
   - New pending report created with permanent code
   - Has `revisionOfReportId` pointing to original
   - Navigated to Pending tab
   - Toast shows revision reference
   - Original rejected report unchanged

### ✅ Test Case 4: Validation Enforcement
1. Open edit modal for rejected report
2. Clear required field (e.g., location)
3. Verify both buttons disabled
4. Enter future date
5. Verify both buttons disabled
6. Fix validation errors
7. Verify buttons enabled

### ✅ Test Case 5: Permission Check
1. Login as Supervisor "Jane Admin"
2. Navigate to Reports > Rejected
3. Find rejected report created by "John Smith"
4. Verify NO "Edit & Resubmit" button (only "View Full Report")
5. Try to manually call handler (should fail permission check)

## Success Criteria

✅ **Modal Opens**: Edit & Resubmit opens modal, not auto-creates draft  
✅ **Pre-filled Data**: All fields populated from rejected report  
✅ **Rejection Notice**: Orange banner shows rejection reason  
✅ **Two Button Options**: Save Draft + Resubmit for Review  
✅ **Validation Works**: Both buttons disabled when validation fails  
✅ **Save Draft**: Creates draft with `revisionOfReportId`, navigates to Drafts  
✅ **Resubmit**: Creates pending with permanent code, navigates to Pending  
✅ **Original Immutable**: Rejected report remains unchanged  
✅ **Permission Enforced**: Only creator can open edit modal  

## Conclusion

The modal-based approach provides a more intuitive and flexible user experience. Users can see the rejection feedback while editing, have clear control over whether to save a draft or resubmit immediately, and benefit from real-time validation. The original rejected report remains completely immutable, ensuring full audit compliance.
