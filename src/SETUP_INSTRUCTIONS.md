# 🔧 Quick Setup: Client Packets Table

## ❌ Current Error:
```
API Error [/packets/create]: Error: Unknown error
```

## ✅ Solution: Create the `client_packets` table

The packet tracking system needs a `client_packets` table in your Supabase database. Follow these steps:

---

## 📝 Setup Steps (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run the SQL Script

Copy the entire contents of `/CREATE_CLIENT_PACKETS_TABLE.sql` and paste it into the SQL editor, then click **"Run"**.

Or copy this SQL directly:

```sql
-- Create client_packets table
CREATE TABLE IF NOT EXISTS client_packets (
  id VARCHAR PRIMARY KEY,
  org_id UUID NOT NULL,
  site_name VARCHAR NOT NULL,
  client_email VARCHAR NOT NULL,
  sent_by_user_id UUID NOT NULL,
  sent_by_name VARCHAR NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
  report_count INTEGER NOT NULL,
  pdf_url VARCHAR,
  message_id VARCHAR,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_packets_org_id ON client_packets(org_id);
CREATE INDEX IF NOT EXISTS idx_client_packets_status ON client_packets(status);
CREATE INDEX IF NOT EXISTS idx_client_packets_sent_at ON client_packets(sent_at DESC);

-- Enable RLS
ALTER TABLE client_packets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's packets"
  ON client_packets FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can create packets"
  ON client_packets FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('SECURITY_ADMIN', 'COMPANY_ADMIN')
  ));

CREATE POLICY "Admins can update packets"
  ON client_packets FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('SECURITY_ADMIN', 'COMPANY_ADMIN')
  ));
```

### Step 3: Verify Table Creation

After running the query, you should see:
```
client_packets table created successfully!
```

### Step 4: Test Packet Creation

1. Go back to Guard Up Admin Portal
2. Navigate to Reports → Client Outbox
3. Try sending a packet again
4. ✅ Should work now!

---

## 🎯 What This Does

The `client_packets` table stores:
- **Packet ID** - Unique identifier (e.g., `PACKET-SITE-20260110-AB12CD`)
- **Organization & Site** - Which org and site the packet belongs to
- **Client Email** - Where reports are being sent
- **Status** - `sending`, `sent`, or `failed`
- **Report Count** - How many reports in the packet
- **Timestamps** - When created and sent
- **Optional Fields** - PDF URL, email message ID, error messages

---

## 🔍 Troubleshooting

### If you see "relation does not exist" error:
- Make sure you're running the SQL in the correct project
- Check that you have proper database permissions

### If RLS policies fail:
- Make sure your `users` table exists
- Adjust the RLS policies to match your auth setup
- You can skip RLS for testing: `ALTER TABLE client_packets DISABLE ROW LEVEL SECURITY;`

### If packets still don't work:
- Check browser console for detailed error messages
- Verify Supabase environment variables are correct
- Make sure reports table has `packet_id` column (should already exist)

---

## ✅ After Setup

Once the table is created, the packet system will:
1. ✅ Create packets atomically
2. ✅ Link reports to packets
3. ✅ Filter sent reports from outbox
4. ✅ Track packet history
5. ✅ No more errors!

**Ready to test!** 🚀
