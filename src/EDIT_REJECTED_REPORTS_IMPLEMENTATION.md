# Edit Rejected Reports - Implementation Summary

## Overview
Implemented a secure, audit-trail-preserving system for users to edit and resubmit ONLY their own rejected reports in the Admin Portal. The original rejected report remains immutable, and revisions are created as new Draft reports with proper lineage tracking.

## Key Features

### 1. Permission-Based UI Access
- **Rejected Tab**: Shows "Edit & Resubmit" button ONLY when `report.createdBy === currentUser.name`
- **Other Users' Reports**: Shows only "View Full Report" button (read-only access)
- **Visual Distinction**: Edit & Resubmit button has orange accent styling to differentiate from View button

### 2. Revision Creation Flow
When user clicks "Edit & Resubmit":
1. **Permission Check**: Validates that `report.createdBy === currentUser.name`
2. **Create New Draft**: Creates a completely new report with status='draft'
3. **Pre-fill Data**: Copies all data from rejected report
4. **Add Lineage**: Sets `revisionOfReportId` to the original rejected report's ID
5. **Clear Metadata**: Removes rejection/approval metadata (fresh start)
6. **Temporary ID**: Assigns temporary `DRAFT-XXX` code
7. **Route to Editor**: Opens draft in edit mode
8. **Switch Tab**: Automatically navigates to Drafts tab to show the new draft

### 3. Immutable Audit Trail
- **Original Report**: Stays in Rejected tab, completely unchanged
- **No Modifications**: System prevents any edits to rejected reports
- **Full History**: Both rejected original and new revision exist independently
- **Traceability**: `revisionOfReportId` field links revision back to original

### 4. Draft Submission
When user submits the revision draft:
1. **Permanent Code**: Generates permanent report code (e.g., IR-2026-000042)
2. **Status Change**: Updates status from 'draft' to 'pending'
3. **Preserve Lineage**: Maintains `revisionOfReportId` reference
4. **Toast Message**: Shows "✓ Revised Incident Report #IR-2026-000042 submitted for review (revision of IR-2026-000035)."
5. **Review Queue**: Moves to Pending tab for supervisor review

## Technical Implementation

### 1. Updated Type Definitions

#### `/components/pages/Reports.tsx`
```typescript
export interface Report {
  // ... existing fields
  createdBy?: string;   // User who created this report
  revisionOfReportId?: number;  // Reference to original rejected report
}
```

#### `/contexts/AppStateContext.tsx`
```typescript
export interface GlobalReport {
  // ... existing fields
  createdBy?: string;
  revisionOfReportId?: number;
}
```

### 2. New Handler: `handleEditAndResubmit`

**Location**: `/components/pages/Reports.tsx` (line ~480)

```typescript
const handleEditAndResubmit = async (rejectedReport: Report) => {
  // Permission check
  if (rejectedReport.createdBy !== currentUser.name) {
    toast.error('You can only edit rejected reports you created');
    return;
  }

  // Create revision draft
  const revisionDraft = {
    ...rejectedReport,
    id: undefined,
    status: 'draft',
    reportCode: `DRAFT-${getDraftCounter()}`,
    revisionOfReportId: rejectedReport.id,
    createdBy: currentUser.name,
    timestamp: new Date().toISOString(),
    // Clear rejection metadata
    rejectionNote: undefined,
    rejectedBy: undefined,
    rejectedAt: undefined,
    // Clear approval metadata
    approvedBy: undefined,
    approvedAt: undefined,
  };

  await addReport(revisionDraft);
  toast.success(`Revision created from Rejected report ${rejectedReport.reportCode}`);
  setStatusTab('drafts');
};
```

### 3. Updated ReportCard Component

**Location**: `/components/ui/ReportCard.tsx`

**New Props**:
```typescript
interface ReportCardProps {
  // ... existing props
  onEditAndResubmit?: (id: number) => void;
  createdBy?: string;
  currentUserName?: string;
}
```

**Conditional Button Logic** (line ~224):
```typescript
{status === 'rejected' && (
  <div className="report-approved-footer">
    {/* Edit & Resubmit - Only for creator */}
    {createdBy === currentUserName && onEditAndResubmit && (
      <button 
        className="view-details-link"
        onClick={() => onEditAndResubmit(id)}
        style={{
          background: 'rgba(255, 122, 24, 0.1)',
          color: '#FF7A18',
          border: '1px solid rgba(255, 122, 24, 0.3)',
        }}
      >
        <Edit size={14} />
        <span>Edit & Resubmit</span>
      </button>
    )}
    
    {/* View - For all other users */}
    {(!createdBy || createdBy !== currentUserName) && (
      <button className="view-details-link" onClick={() => onViewDetails?.(id)}>
        <span>View Full Report</span>
        <ArrowRight size={14} />
      </button>
    )}
    
    {/* Rejection Badge */}
    <div className="report-status-badge rejected">
      <AlertTriangle size={16} />
      <span>Rejected</span>
    </div>
  </div>
)}
```

### 4. Updated Draft Submission Handler

**Location**: `/components/pages/Reports.tsx` (line ~1097)

**Enhanced to preserve revision lineage**:
```typescript
const handleSubmitDraft = (draftId: number, reportData: any) => {
  const draft = reports.find(r => r.id === draftId);
  // ... code generation
  
  updateReport(draftId, {
    ...reportData,
    reportCode: permanentReportCode,
    status: 'pending',
    revisionOfReportId: draft.revisionOfReportId // ✅ Preserve revision reference
  });
  
  // Show revision-aware toast message
  if (draft.revisionOfReportId) {
    const originalReport = reports.find(r => r.id === draft.revisionOfReportId);
    const originalCode = originalReport?.reportCode || `Report #${draft.revisionOfReportId}`;
    toast.success(`✓ Revised ${reportTypeName} #${permanentReportCode} submitted for review (revision of ${originalCode}).`);
  } else {
    toast.success(`✓ ${reportTypeName} #${permanentReportCode} submitted for review.`);
  }
};
```

### 5. Backend Support

**Location**: `/supabase/functions/server/api-routes.tsx`

- **POST /reports**: Already supports arbitrary fields including `revisionOfReportId`
- **PUT /reports/:id**: Passes through all updates including revision reference
- **Permission Checks**: Guards can only edit their own drafts/pending reports

## Permission Enforcement

### UI Level
1. **Button Visibility**: Edit & Resubmit only shown when `createdBy === currentUser.name`
2. **Handler Check**: `handleEditAndResubmit` validates ownership before creating revision
3. **Toast Feedback**: Clear error message if permission denied

### Backend Level
1. **Draft Creation**: Uses authenticated user's ID/name
2. **Draft Updates**: Guards can only update reports where `submittedById === user.id`
3. **Organization Scoping**: All reports filtered by `org_id`

## User Experience Flow

### Scenario: Guard Edits Their Rejected Report

1. **Guard logs into Admin Portal**
2. **Navigates to Reports > Rejected tab**
3. **Sees their rejected report** with orange "Edit & Resubmit" button
4. **Clicks "Edit & Resubmit"**
   - System validates permission
   - Creates new draft pre-filled with rejected report data
   - Links back to original via `revisionOfReportId`
   - Shows success: "Revision created from Rejected report IR-2026-000035"
   - Switches to Drafts tab
5. **Draft appears in Drafts tab** with "Continue Editing" button
6. **Guard edits the draft** to address rejection feedback
7. **Guard clicks "Submit Report"**
   - System assigns permanent code (e.g., IR-2026-000042)
   - Changes status to 'pending'
   - Preserves `revisionOfReportId` reference
   - Shows: "✓ Revised Incident Report #IR-2026-000042 submitted for review (revision of IR-2026-000035)."
8. **Report moves to Pending tab** for supervisor review
9. **Original rejected report** remains unchanged in Rejected tab

### Scenario: Supervisor Views Another Guard's Rejected Report

1. **Supervisor logs into Admin Portal**
2. **Navigates to Reports > Rejected tab**
3. **Sees rejected reports from various guards**
4. **For reports not created by them**: Only "View Full Report" button visible
5. **Clicks "View Full Report"**: Opens read-only detail modal
6. **No edit capability**: Cannot modify another user's rejected report

## Status Messaging

### Success Messages
- **Revision Created**: `"Revision created from Rejected report IR-2026-000035"`
- **Revision Submitted**: `"✓ Revised Incident Report #IR-2026-000042 submitted for review (revision of IR-2026-000035)."`
- **Regular Submission**: `"✓ Incident Report #IR-2026-000042 submitted for review."`

### Error Messages
- **Permission Denied**: `"You can only edit rejected reports you created"`
- **Creation Failed**: `"Failed to create revision"`

## Data Integrity Guarantees

1. **Immutable Rejected Reports**: Original rejected reports cannot be modified
2. **Independent Revisions**: Each revision is a new, independent report
3. **Clear Lineage**: `revisionOfReportId` provides audit trail
4. **Status Isolation**: Draft/Pending/Rejected tabs show proper segmentation
5. **User Scoping**: Drafts filtered by creator in both Admin and Guard portals

## Display Logic

### Drafts Tab
- Shows: New revision draft
- Filter: `status === 'draft' && createdBy === currentUser.name`
- Actions: Continue Editing, Submit, Delete

### Rejected Tab
- Shows: Original rejected report (unchanged)
- Filter: `status === 'rejected'`
- Actions: 
  - **If creator**: Edit & Resubmit
  - **If not creator**: View Full Report (read-only)

### Pending Tab
- Shows: Submitted revision (after draft submitted)
- Filter: `status === 'pending'`
- Metadata: `revisionOfReportId` preserved for audit trail

## Testing Scenarios

### ✅ Test Case 1: Creator Edits Own Rejected Report
1. Login as Guard "John Smith"
2. Navigate to Reports > Rejected
3. Find rejected report created by "John Smith"
4. Verify "Edit & Resubmit" button is visible
5. Click button
6. Verify new draft created in Drafts tab
7. Verify draft has `revisionOfReportId` pointing to original
8. Edit and submit draft
9. Verify submitted report appears in Pending with lineage preserved

### ✅ Test Case 2: Non-Creator Views Rejected Report
1. Login as Supervisor "Jane Admin"
2. Navigate to Reports > Rejected
3. Find rejected report created by "John Smith"
4. Verify ONLY "View Full Report" button visible (no Edit & Resubmit)
5. Click "View Full Report"
6. Verify read-only modal opens
7. Verify no edit capability

### ✅ Test Case 3: Original Report Remains Immutable
1. Create revision from rejected report IR-2026-000035
2. Submit revision (becomes IR-2026-000042)
3. Navigate back to Rejected tab
4. Verify IR-2026-000035 still exists unchanged
5. Verify all original metadata intact (rejection note, timestamp, etc.)

### ✅ Test Case 4: Revision Lineage Tracked
1. Create revision from rejected report
2. Submit revision
3. Query database for submitted report
4. Verify `revisionOfReportId` field contains ID of original rejected report
5. Verify toast message includes "revision of IR-2026-XXXXX"

## Security Considerations

1. **Frontend Validation**: UI prevents unauthorized users from seeing edit buttons
2. **Backend Validation**: API enforces ownership checks on all draft operations
3. **Audit Trail**: Original rejected reports preserved for compliance
4. **Organization Scoping**: All operations filtered by `org_id`
5. **Role-Based Access**: Guards can only edit their own drafts

## Future Enhancements

1. **Revision History View**: UI to show all revisions of a report
2. **Comparison Tool**: Side-by-side diff of original vs revision
3. **Revision Counter**: Display "Revision 2 of 3" badge
4. **Auto-Link in Details**: Show "This is a revision of IR-2026-000035" in detail view
5. **Supervisor Notes**: Allow supervisors to add guidance when rejecting

## Migration Notes

### Backward Compatibility
- Existing reports without `createdBy` field: Edit & Resubmit button won't appear
- Existing reports without `revisionOfReportId`: Treated as original reports
- System gracefully handles missing fields

### Data Migration (Optional)
```sql
-- Populate createdBy field for existing reports
UPDATE reports 
SET createdBy = guardName 
WHERE createdBy IS NULL AND status != 'draft';
```

## Success Criteria

✅ **Permission Enforcement**: Only creators can edit their rejected reports  
✅ **Immutable Originals**: Rejected reports cannot be modified  
✅ **Clean Lineage**: `revisionOfReportId` field tracks revision chain  
✅ **User Feedback**: Clear toast messages at each step  
✅ **Tab Segregation**: Drafts, Pending, Rejected tabs properly segmented  
✅ **Audit Compliance**: Full history preserved for both original and revisions  

## Conclusion

This implementation provides a secure, user-friendly way for users to edit and resubmit their own rejected reports while maintaining complete audit integrity. The system prevents modification of original rejected reports, clearly tracks revision lineage, and enforces proper permissions at both UI and backend levels.
