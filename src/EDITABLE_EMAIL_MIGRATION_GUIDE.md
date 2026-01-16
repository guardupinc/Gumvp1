# Migration Guide: Adding Editable Email Fields

## 📋 Overview

This guide helps you migrate from read-only to editable email fields in the Client Outbox.

---

## 🎯 Who Needs This?

**Existing users with:**
- Active Guard Up MVP deployment
- `client_packets` table already created
- Reports being sent via Client Outbox

**New users:**
- Run `/CREATE_CLIENT_PACKETS_TABLE.sql` (includes new fields)
- Skip to "Verify Installation" section

---

## 🔧 Migration Steps

### Step 1: Backup Your Database

```sql
-- Backup client_packets table
CREATE TABLE client_packets_backup AS 
SELECT * FROM client_packets;

-- Verify backup
SELECT COUNT(*) FROM client_packets_backup;
```

---

### Step 2: Add New Columns

```sql
-- Add email_subject column
ALTER TABLE client_packets 
ADD COLUMN IF NOT EXISTS email_subject VARCHAR;

-- Add email_body column
ALTER TABLE client_packets 
ADD COLUMN IF NOT EXISTS email_body TEXT;

-- Verify columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_packets'
  AND column_name IN ('email_subject', 'email_body');
```

**Expected output:**
```
 column_name   | data_type
---------------+-----------
 email_subject | varchar
 email_body    | text
```

---

### Step 3: Deploy Code Changes

**Via Git:**
```bash
# Pull latest changes
git pull origin main

# Verify files updated
git log --oneline -5

# Rebuild if needed
npm run build
```

**Via Figma Make:**
- Changes already deployed
- Refresh browser to see updates

---

### Step 4: Test Migration

**Test 1: View existing packets**
```sql
-- Should return rows without errors
SELECT id, site_name, email_subject, email_body
FROM client_packets
LIMIT 5;
```

**Test 2: Create new packet**
1. Navigate to Client Outbox
2. Send a package
3. Edit email fields
4. Verify packet created

**Test 3: Check new data**
```sql
-- Find most recent packet
SELECT id, email_subject, email_body
FROM client_packets
ORDER BY sent_at DESC
LIMIT 1;
```

Should show:
- `email_subject`: Your edited subject or NULL
- `email_body`: Your edited body or NULL

---

## 🔍 Verify Installation

### Check 1: Database Schema
```sql
-- Run this query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_packets'
ORDER BY ordinal_position;
```

**Expected columns:**
- id
- org_id
- site_name
- client_email
- **email_subject** ← NEW
- **email_body** ← NEW
- sent_by_user_id
- sent_by_name
- sent_at
- status
- report_count
- pdf_url
- message_id
- error_message
- created_at

---

### Check 2: UI Features

**Open Email Modal and verify:**
- ✅ "Reset" button in header
- ✅ To field is editable (input box)
- ✅ Subject field is editable (input box)
- ✅ Message field is editable (textarea)
- ✅ Character counters appear
- ✅ Required field indicators (*)
- ✅ Can type and edit freely

**Test validation:**
- ✅ Clear To field → see error
- ✅ Type invalid email → see error
- ✅ Fields turn red when invalid
- ✅ Send button disables when invalid

---

### Check 3: Console Logs

**Open browser console and send packet:**

Look for:
```
[Packet] Creating for Site Alpha with 3 reports
[Packet] Email data: { to: 'client@example.com', subject: 'Security...', bodyLength: 245 }
[POST /packets/create] ✅ Created packet PACKET-...
```

---

## 📊 Backward Compatibility

### Existing Packets (Before Migration)
- `email_subject`: NULL (no data)
- `email_body`: NULL (no data)
- **Status:** Still functional
- **Impact:** No breaking changes

### New Packets (After Migration)
- `email_subject`: User's edited subject
- `email_body`: User's edited body
- **Status:** Full audit trail
- **Impact:** Complete history

---

## ⚠️ Breaking Changes

**NONE** - This is a backward-compatible upgrade.

**Modal signature change:**
```typescript
// OLD
onEmailSend: () => void

// NEW
onEmailSend: (emailData: { to: string; subject: string; body: string }) => void
```

**Impact:** Only affects `Reports.tsx` (already updated)

---

## 🐛 Troubleshooting

### Issue: Migration fails

**Error:** `column "email_subject" does not exist`

**Solution:**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'client_packets' AND column_name = 'email_subject';

-- If not found, add it
ALTER TABLE client_packets ADD COLUMN email_subject VARCHAR;
```

---

### Issue: Send button always disabled

**Possible causes:**
1. Browser cache (old code)
2. Validation errors (check console)
3. Missing required fields

**Solution:**
```bash
# Clear browser cache
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or hard refresh
Ctrl+F5
```

---

### Issue: Email fields not saving

**Check database:**
```sql
-- Find recent packet
SELECT id, email_subject, email_body 
FROM client_packets 
WHERE sent_at > NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC;
```

**If NULL:**
- Check API logs in Supabase
- Verify columns added correctly
- Check RLS policies

---

### Issue: Old packets show NULL

**This is normal!**

Old packets created before migration won't have email data.

**To populate old data (optional):**
```sql
-- Generate default subject for old packets
UPDATE client_packets
SET email_subject = 'Security Operations Report - ' || site_name || ' - ' || DATE(sent_at)
WHERE email_subject IS NULL;

-- Generate default body for old packets
UPDATE client_packets
SET email_body = 'Professional security operations report.'
WHERE email_body IS NULL;
```

---

## 📈 Rollback Plan

**If you need to rollback:**

### Step 1: Restore code
```bash
git revert HEAD
git push
```

### Step 2: Remove columns (optional)
```sql
-- Only if needed
ALTER TABLE client_packets DROP COLUMN email_subject;
ALTER TABLE client_packets DROP COLUMN email_body;
```

### Step 3: Restore from backup
```sql
-- If something went wrong
DROP TABLE client_packets;
CREATE TABLE client_packets AS SELECT * FROM client_packets_backup;
```

---

## ✅ Post-Migration Checklist

- [ ] Database columns added successfully
- [ ] Code deployed to production
- [ ] Test packet sent successfully
- [ ] Email fields saved to database
- [ ] Validation working correctly
- [ ] Reset button functioning
- [ ] No console errors
- [ ] Existing packets still viewable
- [ ] Documentation updated
- [ ] Team notified of new feature

---

## 📊 Migration Statistics

Track your migration success:

```sql
-- Total packets
SELECT COUNT(*) as total_packets FROM client_packets;

-- Packets with email data (after migration)
SELECT COUNT(*) as packets_with_email 
FROM client_packets 
WHERE email_subject IS NOT NULL;

-- Migration coverage
SELECT 
  ROUND(100.0 * COUNT(*) FILTER (WHERE email_subject IS NOT NULL) / COUNT(*), 2) 
    as coverage_percentage
FROM client_packets;
```

---

## 🎓 Training Users

**Key points to communicate:**

1. **Email fields are now editable**
   - Can customize To, Subject, and Message
   - Strong defaults provided
   - Reset button available

2. **Validation prevents errors**
   - Invalid emails blocked
   - Required fields enforced
   - Character limits shown

3. **Audit trail preserved**
   - Exact email content saved
   - Can view what was sent
   - Compliance friendly

4. **No workflow changes**
   - Same process as before
   - Just more flexible
   - Optional customization

---

## 📞 Support

**Need help?**

1. Check troubleshooting section above
2. Review test scenarios document
3. Check Supabase logs
4. Verify migration steps completed
5. Test in isolated environment

**Common questions:**

**Q: Do I have to edit the email?**
A: No! Defaults work fine. Editing is optional.

**Q: What happens to old packets?**
A: They continue to work. New fields are NULL for old data.

**Q: Can I use HTML in the body?**
A: Not yet. Plain text only (future enhancement).

**Q: How do I view sent email content?**
A: Query `client_packets` table or wait for Sent Packets history UI.

---

## 📅 Timeline

**Estimated migration time:**
- Small deployment (<100 packets): 5 minutes
- Medium deployment (<1000 packets): 15 minutes
- Large deployment (>1000 packets): 30 minutes

**Includes:**
- Database migration: 1 minute
- Code deployment: 2 minutes
- Testing: 2-5 minutes
- Verification: 5-10 minutes

**Zero downtime:** App remains functional during migration.

---

## 🎉 Success Criteria

Migration is successful when:

✅ Database columns exist  
✅ UI shows editable fields  
✅ Validation works correctly  
✅ New packets save email data  
✅ Old packets still accessible  
✅ No console errors  
✅ Team can use new features  
✅ Documentation reviewed  

---

**Migration Version:** 1.0  
**Compatible With:** Guard Up MVP v2.0+  
**Last Updated:** January 10, 2026  
**Status:** ✅ Production Ready
