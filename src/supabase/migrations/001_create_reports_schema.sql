-- ============================================================================
-- GUARD UP MVP - REPORTS SCHEMA WITH CONCURRENCY SAFETY
-- ============================================================================
-- This migration creates the core reports schema with:
-- - UUID primary keys
-- - Atomic counter-based report code generation
-- - Proper constraints for concurrency safety
-- - RLS policies for role-based access control
-- - Immutability enforcement via triggers
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS TABLE (if multi-tenant)
-- ============================================================================
-- For now, we'll use a default org_id, but structure supports multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default organization
INSERT INTO organizations (id, name, timezone) 
VALUES ('00000000-0000-0000-0000-000000000001'::UUID, 'Default Organization', 'America/New_York')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. USERS TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('GUARD', 'SECURITY_ADMIN', 'COMPANY_ADMIN', 'CLIENT')),
  guard_id INTEGER, -- For guards, links to legacy guard data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 3. REPORT CODE COUNTERS TABLE (for atomic ID generation)
-- ============================================================================
-- This table ensures atomic, non-duplicating report code generation
-- Key: (org_id, year, report_type)
-- Value: current sequence number
CREATE TABLE IF NOT EXISTS report_code_counters (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('incident', 'dar', 'maintenance', 'disciplinary', 'shift_pass_on', 'other')),
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, year, report_type)
);

-- Index for SELECT FOR UPDATE performance
CREATE INDEX IF NOT EXISTS idx_report_code_counters_lookup 
  ON report_code_counters(org_id, year, report_type);

-- ============================================================================
-- 4. REPORTS TABLE (core table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization (for multi-tenancy)
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- IMMUTABLE CANONICAL REPORT CODE (e.g., "IR-2026-000037")
  -- This is the single source of truth for case ID
  report_code TEXT NOT NULL,
  
  -- Report Metadata
  report_type TEXT NOT NULL CHECK (report_type IN ('incident', 'dar', 'maintenance', 'disciplinary', 'shift_pass_on', 'other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  
  -- Core Report Data
  guard_name TEXT NOT NULL,
  site TEXT NOT NULL,
  location TEXT,
  content TEXT NOT NULL,
  
  -- Report-type specific fields (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::JSONB,
  
  -- Attribution: Created By (IMMUTABLE after creation)
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  
  -- Attribution: Submitted By (set when draft -> pending)
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by_name TEXT,
  submitted_by_role TEXT,
  
  -- Attribution: Reviewed By (set when approved/rejected)
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_name TEXT,
  reviewed_by_role TEXT,
  decision TEXT CHECK (decision IN ('APPROVED', 'REJECTED')),
  decision_note TEXT,
  
  -- Timestamps (all in UTC)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- CRITICAL CONSTRAINT: Unique report code per organization
  UNIQUE(org_id, report_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_org_id ON reports(org_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_code ON reports(report_code);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_submitted_by ON reports(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================================================
-- 5. VAULT DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vault_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  
  -- Document Metadata
  filename TEXT NOT NULL,
  category TEXT NOT NULL,
  size_bytes BIGINT,
  storage_path TEXT, -- Path in Supabase Storage
  
  -- Attribution
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_by_name TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- CRITICAL: Prevent duplicate vault entries for same report
  UNIQUE(org_id, report_id, category)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vault_documents_org_id ON vault_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_vault_documents_report_id ON vault_documents(report_id);
CREATE INDEX IF NOT EXISTS idx_vault_documents_category ON vault_documents(category);

-- ============================================================================
-- 6. IMMUTABILITY TRIGGERS
-- ============================================================================
-- Prevent modification of immutable fields after creation

CREATE OR REPLACE FUNCTION enforce_report_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changes to immutable fields
  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'Cannot modify report id';
  END IF;
  
  IF OLD.org_id IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'Cannot modify report org_id';
  END IF;
  
  IF OLD.report_code IS DISTINCT FROM NEW.report_code THEN
    RAISE EXCEPTION 'Cannot modify report_code (Case ID is immutable)';
  END IF;
  
  IF OLD.created_by_user_id IS DISTINCT FROM NEW.created_by_user_id THEN
    RAISE EXCEPTION 'Cannot modify created_by_user_id';
  END IF;
  
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at timestamp';
  END IF;
  
  -- Update updated_at automatically
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER report_immutability_trigger
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION enforce_report_immutability();

-- ============================================================================
-- 7. AUDIT LOG TRIGGER
-- ============================================================================
-- Track all changes to reports for compliance

CREATE TABLE IF NOT EXISTS report_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB
);

CREATE INDEX IF NOT EXISTS idx_report_audit_log_report_id ON report_audit_log(report_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_log_changed_at ON report_audit_log(changed_at DESC);

CREATE OR REPLACE FUNCTION log_report_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO report_audit_log (report_id, action, new_status, details)
    VALUES (NEW.id, 'CREATED', NEW.status, jsonb_build_object('created_by', NEW.created_by_name));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO report_audit_log (report_id, action, old_status, new_status, changed_by_user_id, details)
      VALUES (NEW.id, 'STATUS_CHANGE', OLD.status, NEW.status, 
              COALESCE(NEW.reviewed_by_user_id, NEW.submitted_by_user_id, NEW.created_by_user_id),
              jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER report_audit_trigger
AFTER INSERT OR UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION log_report_changes();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_code_counters ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR REPORTS
-- ============================================================================

-- Guards can SELECT their own reports only
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

-- Admins can SELECT all reports in their org
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

-- Guards can INSERT reports (creates as draft or pending)
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

-- Guards can UPDATE their own draft or rejected reports
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

-- Admins can UPDATE any report in their org (for approval/rejection)
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

-- Guards can DELETE their own draft reports only
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

-- ============================================================================
-- RLS POLICIES FOR VAULT DOCUMENTS
-- ============================================================================

-- All authenticated users can view vault documents in their org
CREATE POLICY "Users can view vault documents in their org"
ON vault_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND vault_documents.org_id = users.org_id
  )
);

-- Only admins and the system can create vault documents
CREATE POLICY "Admins can create vault documents"
ON vault_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('SECURITY_ADMIN', 'COMPANY_ADMIN')
    AND vault_documents.org_id = users.org_id
  )
);

-- ============================================================================
-- RLS POLICIES FOR USERS
-- ============================================================================

-- Users can view other users in their org
CREATE POLICY "Users can view users in their org"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users AS current_user
    WHERE current_user.id = auth.uid()
    AND users.org_id = current_user.org_id
  )
);

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to validate guard cannot approve their own report
CREATE OR REPLACE FUNCTION validate_cannot_approve_own_report(report_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  report_creator UUID;
  current_user_id UUID;
BEGIN
  SELECT created_by_user_id INTO report_creator FROM reports WHERE id = report_id;
  current_user_id := auth.uid();
  
  IF report_creator = current_user_id THEN
    RAISE EXCEPTION 'Cannot approve your own report';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON reports TO authenticated;
GRANT SELECT ON vault_documents TO authenticated;
GRANT INSERT ON vault_documents TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON report_audit_log TO authenticated;

-- Grant sequence permissions if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This schema provides:
-- ✅ UUID primary keys
-- ✅ Unique constraints on (org_id, report_code)
-- ✅ Atomic counter table for ID generation
-- ✅ Immutability enforcement via triggers
-- ✅ Proper attribution fields
-- ✅ RLS policies for role-based access
-- ✅ Audit logging
-- ✅ Vault document uniqueness
-- ============================================================================
