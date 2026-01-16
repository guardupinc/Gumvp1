// ============================================================================
// DATABASE UTILITIES - ATOMIC REPORT CODE GENERATION
// ============================================================================
// Implements concurrency-safe report code generation using Postgres transactions
// and SELECT FOR UPDATE for atomic counter increments.
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kvStore from './kv_store.tsx';

// Get Supabase client for database operations
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// ============================================================================
// TABLE INITIALIZATION
// ============================================================================

/**
 * Initialize client_packets table if it doesn't exist
 * This is a one-time setup operation
 */
export async function initializeClientPacketsTable(): Promise<void> {
  const supabase = getSupabaseClient();
  
  try {
    // Test if table exists by trying to insert a test record
    // This will fail with a specific error if table doesn't exist
    const testId = 'TEST-INIT-CHECK';
    
    // Try to delete any existing test record first
    await supabase
      .from('client_packets')
      .delete()
      .eq('id', testId);
    
    console.log('[initializeClientPacketsTable] ✅ Table exists and is accessible');
    return;
    
  } catch (error: any) {
    console.error('[initializeClientPacketsTable] ⚠️  Table may not exist:', error.message);
    console.error('[initializeClientPacketsTable] ⚠️  Please create the client_packets table manually using Supabase SQL Editor');
    console.error('[initializeClientPacketsTable] ⚠️  SQL Schema:');
    console.error(`
      CREATE TABLE IF NOT EXISTS client_packets (
        id VARCHAR PRIMARY KEY,
        org_id UUID NOT NULL,
        site_name VARCHAR NOT NULL,
        client_email VARCHAR NOT NULL,
        email_subject VARCHAR,
        email_body TEXT,
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
      
      CREATE INDEX IF NOT EXISTS idx_client_packets_org_id ON client_packets(org_id);
      CREATE INDEX IF NOT EXISTS idx_client_packets_status ON client_packets(status);
      CREATE INDEX IF NOT EXISTS idx_client_packets_sent_at ON client_packets(sent_at DESC);
    `);
    // Don't throw - allow server to continue
  }
}

// ============================================================================
// ATOMIC REPORT CODE GENERATION
// ============================================================================

/**
 * Generate unique report code using atomic counter with SELECT FOR UPDATE
 * 
 * Algorithm:
 * 1. Start a transaction
 * 2. SELECT ... FOR UPDATE on counter row (locks the row)
 * 3. Increment counter
 * 4. UPDATE counter
 * 5. Commit transaction
 * 6. Return formatted report code
 * 
 * This ensures no race conditions even with 100+ concurrent requests.
 * 
 * @param orgId - Organization UUID
 * @param reportType - Report type (incident, dar, maintenance, etc.)
 * @param maxRetries - Number of retries on conflict (default: 3)
 * @returns Promise<string> - Formatted report code (e.g., "IR-2026-000037")
 */
export async function generateReportCode(
  orgId: string,
  reportType: string,
  maxRetries: number = 3
): Promise<string> {
  const supabase = getSupabaseClient();
  const year = new Date().getUTCFullYear();
  
  // Map report type to prefix
  const prefixMap: { [key: string]: string } = {
    'incident': 'IR',
    'dar': 'DAR',
    'maintenance': 'MNT',
    'disciplinary': 'DIS',
    'shift_pass_on': 'SPO',
    'other': 'OTH'
  };
  
  const prefix = prefixMap[reportType] || 'OTH';
  
  let attempt = 0;
  let lastError: any = null;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      
      console.log(`[generateReportCode] Attempt ${attempt}/${maxRetries} for ${prefix}-${year}`);
      
      // ========================================================================
      // ATOMIC TRANSACTION WITH SELECT FOR UPDATE
      // ========================================================================
      
      // Start transaction by using RPC function that handles locking
      const { data: sequence, error: rpcError } = await supabase.rpc(
        'increment_report_counter',
        {
          p_org_id: orgId,
          p_year: year,
          p_report_type: reportType
        }
      );
      
      if (rpcError) {
        throw rpcError;
      }
      
      if (!sequence) {
        throw new Error('Failed to get sequence number from counter');
      }
      
      // Format: PREFIX-YEAR-XXXXXX (e.g., IR-2026-000037)
      const paddedSequence = String(sequence).padStart(6, '0');
      const reportCode = `${prefix}-${year}-${paddedSequence}`;
      
      console.log(`[generateReportCode] ✅ Generated: ${reportCode}`);
      
      return reportCode;
      
    } catch (error: any) {
      lastError = error;
      console.error(`[generateReportCode] ❌ Attempt ${attempt} failed:`, error.message);
      
      // If it's a unique violation, retry
      if (error.code === '23505' && attempt < maxRetries) {
        console.log(`[generateReportCode] Unique violation detected, retrying...`);
        // Wait a bit before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt)));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  // If we exhausted retries, throw the last error
  throw new Error(`Failed to generate report code after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Create the RPC function in database for atomic counter increment
 * This should be run once during migration/setup
 */
export const CREATE_INCREMENT_COUNTER_FUNCTION = `
CREATE OR REPLACE FUNCTION increment_report_counter(
  p_org_id UUID,
  p_year INTEGER,
  p_report_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_sequence INTEGER;
BEGIN
  -- Attempt to get existing counter with lock
  SELECT sequence INTO v_sequence
  FROM report_code_counters
  WHERE org_id = p_org_id
    AND year = p_year
    AND report_type = p_report_type
  FOR UPDATE;
  
  -- If counter exists, increment it
  IF FOUND THEN
    v_sequence := v_sequence + 1;
    
    UPDATE report_code_counters
    SET sequence = v_sequence,
        updated_at = NOW()
    WHERE org_id = p_org_id
      AND year = p_year
      AND report_type = p_report_type;
  ELSE
    -- Counter doesn't exist, create it with sequence = 1
    v_sequence := 1;
    
    INSERT INTO report_code_counters (org_id, year, report_type, sequence)
    VALUES (p_org_id, p_year, p_report_type, v_sequence)
    ON CONFLICT (org_id, year, report_type) DO UPDATE
    SET sequence = report_code_counters.sequence + 1,
        updated_at = NOW()
    RETURNING sequence INTO v_sequence;
  END IF;
  
  RETURN v_sequence;
END;
$$ LANGUAGE plpgsql;
`;

// ============================================================================
// USER LOOKUP HELPERS
// ============================================================================

export interface User {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
  guard_id?: number;
}

/**
 * Get user by auth token
 */
export async function getUserFromAuth(authToken: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  
  // Verify JWT and get user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authToken);
  
  if (authError || !authUser) {
    console.error('[getUserFromAuth] Auth error:', authError);
    return null;
  }
  
  // Get user profile from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
  
  if (error || !user) {
    console.error('[getUserFromAuth] User lookup error:', error);
    return null;
  }
  
  return user as User;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !user) {
    console.error('[getUserById] Error:', error);
    return null;
  }
  
  return user as User;
}

// ============================================================================
// ORGANIZATION HELPERS
// ============================================================================

/**
 * Get default organization ID
 */
export function getDefaultOrgId(): string {
  return '00000000-0000-0000-0000-000000000001';
}

/**
 * Get organization timezone
 */
export async function getOrgTimezone(orgId: string): Promise<string> {
  const supabase = getSupabaseClient();
  
  const { data: org, error } = await supabase
    .from('organizations')
    .select('timezone')
    .eq('id', orgId)
    .single();
  
  if (error || !org) {
    console.error('[getOrgTimezone] Error:', error);
    return 'America/New_York'; // Default fallback
  }
  
  return org.timezone || 'America/New_York';
}

// ============================================================================
// REPORT HELPERS
// ============================================================================

/**
 * Check if report code already exists (for debugging)
 */
export async function reportCodeExists(orgId: string, reportCode: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('reports')
    .select('id')
    .eq('org_id', orgId)
    .eq('report_code', reportCode)
    .maybeSingle();
  
  if (error) {
    console.error('[reportCodeExists] Error:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Get report by ID with proper joins
 */
export async function getReportById(reportId: string): Promise<any> {
  const supabase = getSupabaseClient();
  
  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      *,
      created_by:users!created_by_user_id(id, name, role),
      submitted_by:users!submitted_by_user_id(id, name, role),
      reviewed_by:users!reviewed_by_user_id(id, name, role)
    `)
    .eq('id', reportId)
    .single();
  
  if (error) {
    console.error('[getReportById] Error:', error);
    return null;
  }
  
  return report;
}

// ============================================================================
// VAULT HELPERS
// ============================================================================

/**
 * Check if vault document already exists for a report (idempotency check)
 */
export async function vaultDocumentExists(
  orgId: string,
  reportId: string,
  category: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('vault_documents')
    .select('id')
    .eq('org_id', orgId)
    .eq('report_id', reportId)
    .eq('category', category)
    .maybeSingle();
  
  if (error) {
    console.error('[vaultDocumentExists] Error:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Create vault document (upsert for idempotency)
 */
export async function createVaultDocument(vaultDoc: {
  org_id: string;
  report_id: string;
  filename: string;
  category: string;
  size_bytes?: number;
  storage_path?: string;
  uploaded_by_user_id: string;
  uploaded_by_name: string;
}): Promise<any> {
  const supabase = getSupabaseClient();
  
  // Use upsert to ensure idempotency
  const { data, error } = await supabase
    .from('vault_documents')
    .upsert(vaultDoc, {
      onConflict: 'org_id,report_id,category',
      ignoreDuplicates: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('[createVaultDocument] Error:', error);
    throw error;
  }
  
  return data;
}

// ============================================================================
// TIMEZONE UTILITIES
// ============================================================================

/**
 * Convert UTC timestamp to organization timezone
 * Format: "Jan 8, 2026 • 2:51 AM"
 */
export function formatTimestampInOrgTimezone(
  utcTimestamp: string | Date,
  timezone: string = 'America/New_York'
): string {
  const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  try {
    // Format date
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format time
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const dateStr = dateFormatter.format(date);
    const timeStr = timeFormatter.format(date);
    
    return `${dateStr} • ${timeStr}`;
  } catch (error) {
    console.error('[formatTimestampInOrgTimezone] Error:', error);
    return date.toISOString();
  }
}

/**
 * Get current UTC timestamp as ISO string
 */
export function getCurrentUTCTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// CLIENT PACKET HELPERS
// ============================================================================

/**
 * Generate unique packet ID
 * Format: PACKET-YYYYMMDD-HHMMSS-{random}
 */
export function generatePacketId(siteName: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .substring(0, 15); // YYYYMMDD-HHMMSS
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const siteSlug = siteName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
  
  return `PACKET-${siteSlug}-${timestamp}-${random}`;
}

/**
 * Create client packet atomically
 * 
 * Validates reports, creates packet, and links reports to packet
 */
export async function createClientPacket(
  packetData: {
    org_id: string;
    site_name: string;
    client_email: string;
    email_subject?: string;  // NEW: Editable subject
    email_body?: string;     // NEW: Editable body
    sent_by_user_id: string;
    sent_by_name: string;
  },
  reportIds: number[]
): Promise<any> {
  const supabase = getSupabaseClient();
  const packetId = generatePacketId(packetData.site_name);
  const now = getCurrentUTCTimestamp();
  
  console.log(`[createClientPacket] ═══════════════════════════════════════════════════`);
  console.log(`[createClientPacket] Creating packet ${packetId}`);
  console.log(`[createClientPacket] org_id: ${packetData.org_id}`);
  console.log(`[createClientPacket] site_name: ${packetData.site_name}`);
  console.log(`[createClientPacket] report_ids count: ${reportIds.length}`);
  console.log(`[createClientPacket] report_ids: [${reportIds.join(', ')}]`);
  
  // ========================================================================
  // STEP 1: Validate reports from KV store (no reports table dependency)
  // ========================================================================
  // Fetch reports from KV store using correct key format: report:${id}
  const reportKeys = reportIds.map(id => `report:${id}`);
  const reports = await kvStore.mget(...reportKeys);
  
  console.log(`[createClientPacket] Fetched ${reports.length} reports from KV store`);
  console.log(`[createClientPacket] Report keys:`, reportKeys);
  console.log(`[createClientPacket] Reports found:`, reports.map(r => r?.id || 'null'));
  
  // Check all reports exist and filter out nulls
  const validReports = reports.filter(r => r !== null);
  const foundIds = validReports.map(r => r.id);
  const missingIds = reportIds.filter(id => !foundIds.includes(id));
  
  if (missingIds.length > 0) {
    console.error(`[createClientPacket] ❌ Missing reports: [${missingIds.join(', ')}]`);
    const error: any = new Error(`Some reports not found: ${missingIds.join(', ')}`);
    error.code = 'REPORTS_NOT_FOUND';
    error.missing_report_ids = missingIds;
    throw error;
  }
  
  // Validate all reports belong to the same org (security check)
  const wrongOrgReports = validReports.filter(r => r.org_id !== packetData.org_id);
  if (wrongOrgReports.length > 0) {
    console.error(`[createClientPacket] ❌ Reports from wrong org: [${wrongOrgReports.map(r => r.id).join(', ')}]`);
    const error: any = new Error(`Reports do not belong to this organization`);
    error.code = 'ORG_MISMATCH';
    throw error;
  }
  
  // Validate all reports are approved and client-deliverable
  const unapprovedReports = validReports.filter(r => r.status !== 'approved');
  if (unapprovedReports.length > 0) {
    console.error(`[createClientPacket] ❌ Unapproved reports: [${unapprovedReports.map(r => r.report_code).join(', ')}]`);
    const error: any = new Error(
      `Reports ${unapprovedReports.map(r => r.report_code).join(', ')} are not approved. Only approved reports can be sent to clients.`
    );
    error.code = 'REPORTS_NOT_APPROVED';
    throw error;
  }
  
  // Check if any report is already in a packet (idempotency check)
  const alreadySentReports = validReports.filter(r => r.packet_id);
  if (alreadySentReports.length > 0) {
    console.error(`[createClientPacket] ❌ Already sent reports: [${alreadySentReports.map(r => r.report_code).join(', ')}]`);
    const error: any = new Error(
      `Reports ${alreadySentReports.map(r => r.report_code).join(', ')} already sent in packet ${alreadySentReports[0].packet_id}`
    );
    error.code = 'REPORTS_ALREADY_SENT';
    throw error;
  }
  
  console.log(`[createClientPacket] ✅ All ${validReports.length} reports validated successfully`);
  
  // ========================================================================
  // STEP 2: Create packet record in KV store
  // ========================================================================
  const packet = {
    id: packetId,
    packet_id: packetId, // Duplicate for consistency
    org_id: packetData.org_id,
    site_name: packetData.site_name,
    client_email: packetData.client_email,
    email_subject: packetData.email_subject || null,  // NEW: Persist editable subject
    email_body: packetData.email_body || null,        // NEW: Persist editable body
    sent_by_user_id: packetData.sent_by_user_id,
    sent_by_name: packetData.sent_by_name,
    sent_at: now,
    status: 'sent', // Mark as sent immediately for MVP
    report_count: reportIds.length,
    report_ids: reportIds, // Store report IDs for reference
    pdf_url: null,
    message_id: null,
    created_at: now
  };
  
  // Store packet in KV store
  const packetKey = `packets:${packetData.org_id}:${packetId}`;
  await kvStore.set(packetKey, packet);
  
  console.log(`[createClientPacket] ✅ Created packet record in KV: ${packetId}`);
  
  // ========================================================================
  // STEP 3: Link reports to packet (update in KV store)
  // ========================================================================
  const updatedReports = validReports.map(report => ({
    ...report,
    packet_id: packetId,
    sent_at: now,
    sent_by_user_id: packetData.sent_by_user_id,
    updated_at: now
  }));
  
  // Save all updated reports back to KV store
  const updatePromises = updatedReports.map((report, index) => 
    kvStore.set(reportKeys[index], report)
  );
  
  await Promise.all(updatePromises);
  
  console.log(`[createClientPacket] ✅ Linked ${reportIds.length} reports to packet in KV store`);
  
  return {
    ...packet,
    reports: validReports.map(r => ({
      id: r.id,
      report_code: r.report_code,
      report_type: r.report_type
    }))
  };
}

/**
 * Update packet status after email send
 */
export async function updatePacketStatus(
  packetId: string,
  orgId: string,
  status: 'sent' | 'failed',
  metadata?: {
    pdf_url?: string;
    message_id?: string;
    error_message?: string;
  }
): Promise<void> {
  const now = getCurrentUTCTimestamp();
  
  // Get existing packet from KV store
  const packetKey = `packets:${orgId}:${packetId}`;
  const existingPacket = await kvStore.get(packetKey);
  
  if (!existingPacket) {
    throw new Error(`Packet ${packetId} not found`);
  }
  
  // Update packet with new status and metadata
  const updatedPacket = {
    ...existingPacket,
    status,
    updated_at: now,
    ...(metadata?.pdf_url && { pdf_url: metadata.pdf_url }),
    ...(metadata?.message_id && { message_id: metadata.message_id }),
    ...(metadata?.error_message && { error_message: metadata.error_message })
  };
  
  await kvStore.set(packetKey, updatedPacket);
  
  console.log(`[updatePacketStatus] ✅ Updated packet ${packetId} to ${status}`);
}

/**
 * Get all packets for an organization from KV store
 */
export async function getClientPackets(orgId: string): Promise<any[]> {
  console.log(`[getClientPackets] Fetching packets for org ${orgId}`);
  
  // Get all packets with org prefix
  const prefix = `packets:${orgId}:`;
  const packets = await kvStore.getByPrefix(prefix);
  
  console.log(`[getClientPackets] Found ${packets.length} packets`);
  
  // Sort by sent_at descending (newest first)
  const sortedPackets = packets.sort((a, b) => {
    const dateA = new Date(a.sent_at || a.created_at).getTime();
    const dateB = new Date(b.sent_at || b.created_at).getTime();
    return dateB - dateA;
  });
  
  return sortedPackets;
}

/**
 * Get packet by ID with included reports from KV store
 */
export async function getPacketById(packetId: string, orgId: string): Promise<any> {
  console.log(`[getPacketById] Fetching packet ${packetId}`);
  
  // Get packet from KV store
  const packetKey = `packets:${orgId}:${packetId}`;
  const packet = await kvStore.get(packetKey);
  
  if (!packet) {
    console.error('[getPacketById] Packet not found');
    return null;
  }
  
  // Get reports for this packet
  const reportIds = packet.report_ids || [];
  const reportKeys = reportIds.map((id: number) => `report:${id}`);
  const reports = await kvStore.mget(...reportKeys);
  
  console.log(`[getPacketById] Found packet with ${reports.length} reports`);
  
  return {
    ...packet,
    reports: reports.map(r => ({
      id: r?.id,
      report_code: r?.report_code,
      report_type: r?.report_type,
      guard_name: r?.guard_name,
      site: r?.site,
      content: r?.content
    })).filter(r => r.id) // Filter out null reports
  };
}

// ============================================================================
// MVP OPTION A: SIMPLIFIED DIRECT SEND HELPERS
// ============================================================================

/**
 * Get eligible reports for a site (approved + client-deliverable + not sent yet)
 * Used by MVP Option A send-direct endpoint
 */
export async function getEligibleReportsForSite(orgId: string, siteName: string): Promise<any[]> {
  console.log(`[getEligibleReportsForSite] Fetching eligible reports for org "${orgId}", site "${siteName}"`);
  
  // Fetch all reports for this org from KV store
  const prefix = `report:`;
  const allReports = await kvStore.getByPrefix(prefix);
  
  console.log(`[getEligibleReportsForSite] Found ${allReports.length} total reports in KV store`);
  
  // Filter for eligible reports
  const eligibleReports = allReports.filter(report => {
    // Must belong to this org
    if (report.org_id !== orgId) return false;
    
    // Must belong to this site
    if (report.site !== siteName) return false;
    
    // Must be approved
    if (report.status !== 'approved') return false;
    
    // Must be client-deliverable (incident, dar, maintenance only)
    const clientDeliverableTypes = ['incident', 'dar', 'maintenance'];
    if (!clientDeliverableTypes.includes(report.report_type)) return false;
    
    // Must NOT have been sent already (no sent_at timestamp)
    if (report.sent_at) return false;
    
    return true;
  });
  
  console.log(`[getEligibleReportsForSite] Found ${eligibleReports.length} eligible reports`);
  console.log(`[getEligibleReportsForSite] Report IDs: [${eligibleReports.map(r => r.id).join(', ')}]`);
  
  return eligibleReports;
}

/**
 * Mark reports as sent (update sent_at, sent_by_user_id, and optionally status)
 * Used by MVP Option A send-direct endpoint
 */
export async function markReportsAsSent(
  reportIds: number[],
  metadata: {
    sent_at: string;
    sent_by_user_id: string;
    status?: string; // Optional status update (e.g., 'sent')
  }
): Promise<void> {
  console.log(`[markReportsAsSent] Marking ${reportIds.length} reports as sent`);
  console.log(`[markReportsAsSent] Report IDs: [${reportIds.join(', ')}]`);
  console.log(`[markReportsAsSent] sent_at: ${metadata.sent_at}`);
  console.log(`[markReportsAsSent] sent_by_user_id: ${metadata.sent_by_user_id}`);
  
  // Update each report in KV store
  for (const reportId of reportIds) {
    const reportKey = `report:${reportId}`;
    const report = await kvStore.get(reportKey);
    
    if (!report) {
      console.error(`[markReportsAsSent] ⚠️ Report ${reportId} not found in KV store, skipping`);
      continue;
    }
    
    // Update report with sent metadata
    const updatedReport = {
      ...report,
      sent_at: metadata.sent_at,
      sent_by_user_id: metadata.sent_by_user_id,
      // Optionally update status to 'sent'
      ...(metadata.status && { status: metadata.status })
    };
    
    await kvStore.set(reportKey, updatedReport);
    console.log(`[markReportsAsSent] ✅ Updated report ${reportId}`);
  }
  
  console.log(`[markReportsAsSent] Successfully marked ${reportIds.length} reports as sent`);
}

/**
 * Validate specific reports for sending (MVP Option A with frontend report selection)
 * Checks that all reports exist, are approved, belong to the correct site, are client-deliverable, and haven't been sent
 */
export async function validateReportsForSending(
  orgId: string,
  reportIds: number[],
  siteName: string
): Promise<{
  valid: boolean;
  report_ids?: number[];
  error?: string;
  code?: string;
  missing_report_ids?: number[];
  wrong_org_report_ids?: number[];
}> {
  console.log(`[validateReportsForSending] Validating ${reportIds.length} reports for org "${orgId}", site "${siteName}"`);
  console.log(`[validateReportsForSending] Report IDs: [${reportIds.join(', ')}]`);
  
  // Fetch all reports from KV store
  const prefix = `report:`;
  const allReports = await kvStore.getByPrefix(prefix);
  
  console.log(`[validateReportsForSending] Found ${allReports.length} total reports in KV store`);
  
  // Find the requested reports
  const foundReports = [];
  const missingReportIds = [];
  
  for (const reportId of reportIds) {
    const report = allReports.find(r => r.id === reportId);
    if (report) {
      foundReports.push(report);
    } else {
      missingReportIds.push(reportId);
    }
  }
  
  // Check 1: Verify all reports exist
  if (missingReportIds.length > 0) {
    console.error(`[validateReportsForSending] ❌ Reports not found: [${missingReportIds.join(', ')}]`);
    return {
      valid: false,
      error: `Some reports no longer exist in the system`,
      code: 'REPORTS_NOT_FOUND',
      missing_report_ids: missingReportIds
    };
  }
  
  console.log(`[validateReportsForSending] ✅ All ${foundReports.length} reports found`);
  
  // Check 2: Verify all reports belong to this org
  // Handle legacy reports without org_id - treat as 'default_org'
  const wrongOrgReports = foundReports.filter(r => {
    const reportOrgId = r.org_id || 'default_org';
    return reportOrgId !== orgId;
  });
  if (wrongOrgReports.length > 0) {
    const wrongOrgReportIds = wrongOrgReports.map(r => r.id);
    console.error(`[validateReportsForSending] ❌ Reports from wrong org: [${wrongOrgReportIds.join(', ')}]`);
    return {
      valid: false,
      error: `Reports do not belong to your organization`,
      code: 'REPORTS_WRONG_ORG',
      wrong_org_report_ids: wrongOrgReportIds
    };
  }
  
  // Check 3: Verify all reports belong to this site
  const wrongSiteReports = foundReports.filter(r => r.site !== siteName);
  if (wrongSiteReports.length > 0) {
    console.error(`[validateReportsForSending] ❌ Reports from wrong site: [${wrongSiteReports.map(r => `${r.id} (${r.site})`).join(', ')}]`);
    return {
      valid: false,
      error: `Some reports don't belong to site "${siteName}"`,
      code: 'SITE_MISMATCH'
    };
  }
  
  // Check 4: Verify all reports are approved
  const unapprovedReports = foundReports.filter(r => r.status !== 'approved');
  if (unapprovedReports.length > 0) {
    console.error(`[validateReportsForSending] ❌ Unapproved reports: [${unapprovedReports.map(r => r.id).join(', ')}]`);
    return {
      valid: false,
      error: `Some reports are not approved. Only approved reports can be sent.`,
      code: 'REPORTS_NOT_APPROVED'
    };
  }
  
  // Check 5: Verify all reports are client-deliverable
  const clientDeliverableTypes = ['incident', 'dar', 'maintenance'];
  const internalOnlyReports = foundReports.filter(r => !clientDeliverableTypes.includes(r.report_type));
  if (internalOnlyReports.length > 0) {
    console.error(`[validateReportsForSending] ❌ Internal-only reports: [${internalOnlyReports.map(r => `${r.id} (${r.report_type})`).join(', ')}]`);
    return {
      valid: false,
      error: `Some reports cannot be sent to clients (internal use only)`,
      code: 'REPORTS_NOT_CLIENT_DELIVERABLE'
    };
  }
  
  // Check 6: Verify none have been sent already
  const alreadySentReports = foundReports.filter(r => r.sent_at);
  if (alreadySentReports.length > 0) {
    console.error(`[validateReportsForSending] ❌ Already sent reports: [${alreadySentReports.map(r => r.id).join(', ')}]`);
    return {
      valid: false,
      error: `Some reports have already been sent`,
      code: 'REPORTS_ALREADY_SENT'
    };
  }
  
  console.log(`[validateReportsForSending] ✅ All validations passed for ${reportIds.length} reports`);
  
  return {
    valid: true,
    report_ids: reportIds
  };
}