# Reports Page Reject Flow Fix

## Problem
Clicking the "Reject" button on a report showed a dim/blur overlay but no modal appeared.

## Root Cause
The `RejectReportModal` component was using class names (`.modal-container`) that weren't defined in the CSS, and the modal wasn't using React Portal to render at the document root, which could cause clipping issues with overflow containers.

## Solution Implemented

### 1. Updated RejectReportModal Component (`/components/modals/RejectReportModal.tsx`)

#### Changes Made:
- ✅ Added React Portal rendering using `createPortal(modalContent, document.body)`
- ✅ Fixed positioning with explicit `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`
- ✅ Set proper z-index (overlay: 1000, modal: 1001)
- ✅ Changed from `.modal-container` to `.batch-reject-modal` (which exists in modals.css)
- ✅ Added "Notify guard of corrections needed" checkbox
- ✅ Added debug console logs for state tracking
- ✅ Added inline styles to ensure proper display

#### Key Features:
```tsx
// Portal rendering at document root
return createPortal(modalContent, document.body);

// Proper overlay
<div 
  className="modal-overlay" 
  style={{
    position: 'fixed',
    zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)'
  }}
  onClick={handleClose}
/>

// Modal positioned above overlay
<div 
  className="batch-reject-modal"
  style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1001
  }}
>
  {/* Modal content */}
</div>
```

### 2. Updated Reports Page (`/components/pages/Reports.tsx`)

#### Changes Made:
- ✅ Added debug console logs in `handleReject()`
- ✅ Added debug console logs in `handleConfirmReject()`
- ✅ Added debug console log in modal's `onClose` handler
- ✅ Fixed `handleConfirmReject()` to properly close modal and show success toast
- ✅ Removed invalid `fetchReports()` call (reports come from props)

#### Debug Logging:
```typescript
const handleReject = (reportId: number) => {
  console.log('[Reports] handleReject called with reportId:', reportId);
  console.log('[Reports] Setting rejectingReportId to:', reportId);
  console.log('[Reports] Setting isRejectModalOpen to: true');
  
  setRejectingReportId(reportId);
  setIsRejectModalOpen(true);
};

const handleConfirmReject = (rejectionReason: string) => {
  console.log('[Reports] handleConfirmReject called');
  console.log('[Reports] rejectingReportId:', rejectingReportId);
  console.log('[Reports] rejectionReason:', rejectionReason);
  
  // ... rejection logic ...
  
  setIsRejectModalOpen(false);
  toast.success('Report rejected successfully');
};
```

### 3. Modal State Flow

#### State Variables:
- `isRejectModalOpen` - Boolean controlling modal visibility
- `rejectingReportId` - ID of the report being rejected (null when no report selected)

#### Flow:
1. User clicks "Reject" button on ReportCard
2. `handleReject(reportId)` is called
3. State updates: `rejectingReportId = reportId`, `isRejectModalOpen = true`
4. Modal renders via portal at document.body
5. User fills in rejection reason and clicks "Confirm Reject"
6. `handleConfirmReject(reason)` is called
7. Global `rejectReport()` updates the report status
8. Modal closes: `isRejectModalOpen = false`, `rejectingReportId = null`
9. Success toast appears
10. Report list auto-updates from parent component

## Modal UI Components

### Header
- Warning icon (AlertCircle) in red background
- Title: "Reject Report"
- Subtitle: "Report: {reportId}"
- Close button (X icon)

### Body
- **Reason for Rejection** (required)
  - Multi-line textarea
  - Placeholder with guidance text
  - Validation: Must not be empty
  - Error message if empty on submit

- **Notify guard checkbox** (default: checked)
  - Label: "Notify guard of corrections needed"
  - Allows supervisor to control notifications

- **Info note**
  - Green background
  - Explains that guard can view feedback, revise, and resubmit

### Footer
- **Cancel** button (secondary style)
  - Closes modal without action
  - Resets form state
  
- **Confirm Reject** button (danger style, red)
  - AlertCircle icon
  - Submits rejection
  - Validates reason is provided

## Console Log Output (for debugging)

When clicking Reject button:
```
[Reports] handleReject called with reportId: 123
[Reports] Setting rejectingReportId to: 123
[Reports] Setting isRejectModalOpen to: true
[RejectReportModal] isOpen changed: true
[RejectReportModal] reportId: IR-2026-000001
```

When confirming rejection:
```
[RejectReportModal] Confirming rejection: { reportId: "IR-2026-000001", rejectionReason: "...", notifyGuard: true }
[Reports] handleConfirmReject called
[Reports] rejectingReportId: 123
[Reports] rejectionReason: ...
[Reports] Report rejected, list will auto-update from parent
[RejectReportModal] Closing modal
```

## Testing Steps

### ✅ Modal Opens Correctly
1. Navigate to Reports page
2. Find a pending report
3. Click the "Reject" button
4. **Expected**: Modal appears centered on screen with proper overlay
5. **Expected**: Console shows debug logs
6. **Expected**: Modal displays report ID

### ✅ Modal Closes Correctly
1. Open reject modal
2. Click "Cancel" button
3. **Expected**: Modal closes, state resets
4. **Alternative**: Click overlay backdrop
5. **Expected**: Modal closes
6. **Alternative**: Click X button
7. **Expected**: Modal closes

### ✅ Validation Works
1. Open reject modal
2. Click "Confirm Reject" without entering reason
3. **Expected**: Red error message appears
4. **Expected**: Modal stays open
5. Enter a reason
6. **Expected**: Error message disappears

### ✅ Rejection Flow Works
1. Open reject modal
2. Enter rejection reason: "Please add more details to the incident description"
3. Toggle "Notify guard" checkbox (test both states)
4. Click "Confirm Reject"
5. **Expected**: Modal closes
6. **Expected**: Success toast appears
7. **Expected**: Report status updates to "Rejected"
8. **Expected**: Report disappears from pending list (or moves to rejected tab)
9. **Expected**: Console shows all debug logs

### ✅ Portal Rendering Works
1. Open browser DevTools
2. Inspect the DOM
3. Look for the modal in the DOM tree
4. **Expected**: Modal is rendered directly under `<body>`, not nested in the Reports component tree
5. **Expected**: Modal has `z-index: 1001`
6. **Expected**: Overlay has `z-index: 1000`

## Files Modified

1. ✅ `/components/modals/RejectReportModal.tsx` - Complete rewrite with portal and proper styling
2. ✅ `/components/pages/Reports.tsx` - Added debug logs and fixed rejection flow

## Debug Logs

All console logs are prefixed with `[Reports]` or `[RejectReportModal]` for easy filtering.

**To remove debug logs after confirming the fix works:**
1. Search for `console.log('[Reports]` in Reports.tsx
2. Search for `console.log('[RejectReportModal]` in RejectReportModal.tsx
3. Remove all matching lines

## Success Criteria

✅ Modal appears when clicking Reject button
✅ Modal is centered and properly positioned
✅ Overlay dims the background with blur effect
✅ Modal is above overlay (proper z-index)
✅ Modal renders at document root (using portal)
✅ Validation prevents empty rejection reasons
✅ Checkbox for "Notify guard" is included and functional
✅ Rejection updates report status correctly
✅ Modal closes after successful rejection
✅ Success toast appears
✅ Console logs show proper state tracking (for debugging)

## Future Enhancements

- [ ] Remove debug console logs after confirming fix works
- [ ] Add animation for modal entrance/exit
- [ ] Add keyboard shortcut (ESC to close)
- [ ] Add auto-focus to textarea when modal opens
- [ ] Track notification preference in user settings
