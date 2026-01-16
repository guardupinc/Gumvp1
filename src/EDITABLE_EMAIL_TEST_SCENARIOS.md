# Editable Email Field - Test Scenarios

## 🧪 Complete Test Suite

### Test 1: Valid Edit → Successful Send
**Steps:**
1. Navigate to Admin Portal → Reports → Client Outbox tab
2. Select a site with approved reports
3. Click "Send Package" button
4. Observe modal opens with pre-filled template:
   - To: `security@client.com`
   - Subject: `Security Operations Report - [Site Name] - [Date]`
   - Message: Professional template text
5. Edit the "To" field to a valid email (e.g., `test@example.com`)
6. Edit the "Subject" to add custom text (e.g., append ` - URGENT`)
7. Edit the "Message" body to add a custom note
8. Click "Send Email Now"

**Expected Results:**
- ✅ Loading spinner appears on button
- ✅ Button text changes to "Sending..."
- ✅ Button becomes disabled
- ✅ API call succeeds
- ✅ Modal closes automatically
- ✅ Success toast appears: "✅ Packet [ID] created successfully for [Site]"
- ✅ Reports disappear from Client Outbox
- ✅ Database packet record contains edited email values
- ✅ Console shows logs with truncated email data

---

### Test 2: Invalid Email Format
**Steps:**
1. Open email modal
2. Change "To" field to invalid email: `not-an-email`
3. Click outside the field (blur)
4. Try to click "Send Email Now"

**Expected Results:**
- ✅ Red border appears on "To" field
- ✅ Error message appears: "⚠ Please enter a valid email address"
- ✅ Send button is disabled (grayed out)
- ✅ Clicking send button does nothing

---

### Test 3: Empty Required Fields
**Steps:**
1. Open email modal
2. Clear the "To" field completely
3. Clear the "Subject" field completely
4. Clear the "Message" field completely
5. Try to click "Send Email Now"

**Expected Results:**
- ✅ All three fields show red borders
- ✅ Error under "To": "⚠ Email address is required"
- ✅ Error under "Subject": "⚠ Subject is required"
- ✅ Error under "Message": "⚠ Message is required"
- ✅ Send button disabled
- ✅ Cannot proceed with send

---

### Test 4: Character Limit Enforcement
**Steps:**
1. Open email modal
2. Type 141 characters in Subject field
3. Observe character counter
4. Type 10,001 characters in Message field
5. Observe character counter

**Expected Results:**
- ✅ Subject field stops accepting input at 140 chars
- ✅ Counter shows "140/140 characters"
- ✅ Message field stops accepting input at 10,000 chars
- ✅ Counter shows "10,000/10,000 characters"
- ✅ Fields remain valid (not showing errors)

---

### Test 5: Reset to Default Functionality
**Steps:**
1. Open email modal
2. Edit all three fields (To, Subject, Message)
3. Note the edited values
4. Click "Reset" button in header

**Expected Results:**
- ✅ All fields revert to template values
- ✅ "To" becomes `security@client.com`
- ✅ "Subject" becomes original template
- ✅ "Message" becomes original template
- ✅ All validation errors cleared
- ✅ Character counters reset

---

### Test 6: Double-Click Prevention
**Steps:**
1. Open email modal
2. Fill valid data
3. Click "Send Email Now"
4. Immediately click "Send Email Now" again (rapid double-click)
5. Check console logs
6. Check database packets table

**Expected Results:**
- ✅ Button disables after first click
- ✅ Loading spinner appears
- ✅ Second click does nothing
- ✅ Console shows: "[handleEmailSend] Already sending, ignoring duplicate click"
- ✅ Only ONE packet created in database
- ✅ No duplicate API calls

---

### Test 7: API Error - Modal Stays Open
**Steps:**
1. Disconnect from internet OR stop Supabase backend
2. Open email modal
3. Edit fields with valid data
4. Click "Send Email Now"
5. Wait for error

**Expected Results:**
- ✅ Error toast appears with message
- ✅ Modal STAYS OPEN (does not close)
- ✅ All edited field values PRESERVED
- ✅ User can edit and retry
- ✅ Loading state resets (button enabled again)

---

### Test 8: Reports Already Sent - Idempotency
**Steps:**
1. Send a packet successfully (reports get packet_id)
2. Refresh page
3. Navigate to Client Outbox
4. Check if those reports appear

**Expected Results:**
- ✅ Reports with packet_id do NOT appear in outbox
- ✅ Outbox filtered by `!r.packet_id` check
- ✅ Cannot accidentally send same reports twice
- ✅ Clean outbox only shows unsent approved reports

---

### Test 9: Database Table Missing
**Steps:**
1. Ensure client_packets table is NOT created in database
2. Try to send a packet

**Expected Results:**
- ✅ API returns 500 error
- ✅ Error code: `TABLE_NOT_FOUND`
- ✅ Toast appears: "⚠️ Database setup required! Please run the SQL script..."
- ✅ Error message includes instructions
- ✅ Duration is longer (10 seconds)
- ✅ Modal stays open

---

### Test 10: Validation Clears on Fix
**Steps:**
1. Open email modal
2. Clear "To" field (causes error)
3. Red border and error message appear
4. Type valid email address

**Expected Results:**
- ✅ Error message disappears immediately
- ✅ Red border changes to normal gray
- ✅ Send button becomes enabled (if other fields valid)
- ✅ No need to blur or click elsewhere

---

### Test 11: Cancel While Editing
**Steps:**
1. Open email modal
2. Edit all fields
3. Click "Cancel" or "X" button

**Expected Results:**
- ✅ Modal closes immediately
- ✅ No API calls made
- ✅ Reports remain in outbox (unsent)
- ✅ Next time modal opens, fields reset to defaults

---

### Test 12: Close Modal on Success
**Steps:**
1. Send packet successfully
2. Wait for API response

**Expected Results:**
- ✅ Email modal closes automatically
- ✅ Success modal appears with message
- ✅ "Return to Outbox" button available
- ✅ Sent reports no longer in outbox
- ✅ Email package state cleared

---

### Test 13: Packet Audit Trail
**Steps:**
1. Send packet with edited email fields
2. Check database `client_packets` table
3. Query for the packet ID

**Expected Results:**
- ✅ Row exists with packet ID
- ✅ `email_subject` column contains edited subject
- ✅ `email_body` column contains edited body text
- ✅ `client_email` column contains edited To address
- ✅ All three values match exactly what user typed
- ✅ Can retrieve exact email content later

---

### Test 14: Multiple Sites in Outbox
**Steps:**
1. Approve reports for 3 different sites
2. Check Client Outbox
3. Send package for Site A
4. Check outbox again

**Expected Results:**
- ✅ Outbox shows 3 site packages initially
- ✅ After sending Site A, only 2 remain
- ✅ Site A's reports have packet_id
- ✅ Site B and C reports still in outbox
- ✅ No cross-contamination between sites

---

### Test 15: Email Field Persistence in Sent Packets
**Steps:**
1. Send packet with edited email fields
2. Navigate to Admin Portal → Sent Packets
3. View the packet in the history

**Expected Results:**
- ✅ Packet appears in list with site name
- ✅ Sent date shown in org timezone
- ✅ Report count accurate
- ✅ Status shows "Sent"
- ✅ (Future) Can view email subject/body that was sent

---

## 🎯 Edge Cases

### Edge Case 1: Very Long Subject (at limit)
- Subject with exactly 140 characters
- Should work fine, counter shows 140/140

### Edge Case 2: Very Long Body (at limit)
- Message with exactly 10,000 characters
- Should work fine, counter shows 10,000/10,000

### Edge Case 3: Special Characters in Email
- To: `test+alias@example.com` (valid with +)
- Subject: `Report – 2026 "Important"` (quotes, dashes)
- Body: Multi-line with newlines, bullets, etc.
- All should save and display correctly

### Edge Case 4: Empty Template Values
- If for some reason template generation fails
- Fields should be empty (not undefined/null)
- Validation will catch and prevent send

### Edge Case 5: Network Timeout
- Very slow network
- Loading state persists
- User sees "Sending..." for extended time
- Eventually times out with error
- Modal stays open, can retry

---

## 🔍 Console Log Checks

During testing, watch for these logs:

**On Modal Open:**
```
[EmailConfirmModal] Reset fields
```

**On Validation:**
```
(No logs - client-side only)
```

**On Send Click:**
```
[handleEmailSend] Already sending, ignoring duplicate click  // If double-click
[Packet] Creating for [Site] with [N] reports
[Packet] Email data: { to: '...', subject: '...', bodyLength: 1234 }
```

**On Success:**
```
[POST /packets/create] Creating packet for site: ...
[createClientPacket] Creating packet PACKET-... with N reports
[createClientPacket] ✅ Created packet record: PACKET-...
[createClientPacket] ✅ Linked N reports to packet
[POST /packets/create] ✅ Created packet PACKET-...
[Packet] ✅ Created: PACKET-...
[Packet] ✅ Marked as sent
```

---

## 📊 Success Metrics

After all tests pass:
- ✅ 0 instances of double-sends
- ✅ 0 invalid emails accepted
- ✅ 100% accuracy in audit trail
- ✅ Modal UX feels smooth and responsive
- ✅ Error messages are clear and actionable
- ✅ No data loss on errors

---

## 🐛 Known Issues / Limitations

1. **Email not actually sent:**
   - Currently only creates packet record
   - Email sending integration planned for future
   - Packet system serves as audit trail

2. **No email preview:**
   - No WYSIWYG preview of formatted email
   - Consider adding HTML preview modal

3. **No template library:**
   - Only single default template per site
   - Consider adding saved templates feature

---

## 🔗 Related Documentation

- `/EDITABLE_EMAIL_IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `/CREATE_CLIENT_PACKETS_TABLE.sql` - Database schema
- `/PACKET_IMPLEMENTATION_SUMMARY.md` - Original packet system docs

---

**Test Suite Version:** 1.0  
**Last Updated:** January 10, 2026  
**Status:** Ready for QA Testing
