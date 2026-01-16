-- ============================================================================
-- CREATE CLIENT PACKETS TABLE
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to enable packet tracking
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================================

-- Create client_packets table
CREATE TABLE IF NOT EXISTS client_packets (
  id VARCHAR PRIMARY KEY,
  org_id UUID NOT NULL,
  site_name VARCHAR NOT NULL,
  client_email VARCHAR NOT NULL,
  email_subject VARCHAR,  -- NEW: Editable email subject for auditability
  email_body TEXT,        -- NEW: Editable email body for auditability
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_packets_org_id ON client_packets(org_id);
CREATE INDEX IF NOT EXISTS idx_client_packets_status ON client_packets(status);
CREATE INDEX IF NOT EXISTS idx_client_packets_sent_at ON client_packets(sent_at DESC);

-- Grant access to authenticated users (adjust as needed for your RLS policy)
ALTER TABLE client_packets ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (modify based on your auth setup)
CREATE POLICY "Users can view their org's packets"
  ON client_packets
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can create packets"
  ON client_packets
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('SECURITY_ADMIN', 'COMPANY_ADMIN')
  ));

CREATE POLICY "Admins can update packets"
  ON client_packets
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('SECURITY_ADMIN', 'COMPANY_ADMIN')
  ));

-- Success message
SELECT 'client_packets table created successfully!' AS status;
