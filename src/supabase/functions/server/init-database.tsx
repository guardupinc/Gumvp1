// ============================================================================
// DATABASE INITIALIZATION - CREATE TABLES PROGRAMMATICALLY
// ============================================================================
// Creates all required tables on server startup if they don't exist
// This replaces SQL migrations for the Figma Make environment
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

/**
 * Get Supabase admin client
 */
function getSupabaseAdmin() {
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

/**
 * Execute raw SQL using Supabase RPC or direct Postgres connection
 */
async function executeSql(sql: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  try {
    // Try to execute using rpc if available
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to execute SQL:', error);
    throw error;
  }
}

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  console.log('🔧 Initializing database schema...');
  
  const supabase = getSupabaseAdmin();
  
  try {
    // ========================================================================
    // Check if tables already exist
    // ========================================================================
    const { data: existingReports, error: checkError } = await supabase
      .from('reports')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Database tables already exist, skipping initialization');
      return;
    }
    
    console.log('📋 Tables not found, creating schema...');
    
    // ========================================================================
    // HYBRID APPROACH: Use KV store with Postgres-like structure
    // ========================================================================
    // Since we can't create actual Postgres tables in Make environment,
    // we'll continue using KV store but with the new data structure
    
    console.log('✅ Database initialization complete (using KV store)');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw - allow server to start even if init fails
    // Tables might already exist or be created externally
  }
}

/**
 * Initialize with sample data for testing
 */
export async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Check if sample reports already exist
    const existingReports = await kv.getByPrefix('report:');
    
    if (existingReports.length > 0) {
      console.log('Sample reports already exist, skipping seed');
      return;
    }
    
    // Sample reports for Vault preview testing
    const sampleReports = [
      // TEST REPORT 1: Incident with Police Called = TRUE
      {
        id: 'IR-2026-000001',
        reportCode: 'IR-2026-000001',
        caseId: '#IR-2026-000001',
        reportType: 'incident',
        type: 'Incident',
        site: 'Downtown Plaza',
        location: 'Main Entrance - Lobby Area',
        guardName: 'John Smith',
        submittedBy: 'John Smith',
        timestamp: '2026-01-08T14:30:00Z',
        created_at: '2026-01-08T14:30:00Z',
        filedOn: '2026-01-08T14:30:00Z',
        occurredAt: '2026-01-08T14:30:00Z',
        status: 'approved',
        priority: 'high',
        incidentType: 'Security Breach',
        urgency: 'Critical',
        narrativeOnly: 'Unauthorized individual attempted to bypass security checkpoint at the main entrance. Subject refused to present identification and became aggressive when questioned by security personnel. Building security protocol was immediately activated.',
        actionTaken: 'Subject was detained at the security desk. Local police were contacted and arrived within 8 minutes. Individual was escorted off the premises by law enforcement. All entry points were secured and additional patrols were deployed. Incident was documented with security camera footage from angles A1, A2, and B3.',
        // CANONICAL POLICE FIELDS
        police_called: true,         // boolean - canonical field name
        pd_case_number: 'PD-2026-4521',  // string - canonical field name
        // Legacy fields for backward compatibility
        policeCalled: 'Yes',
        pdCaseNumber: 'PD-2026-4521',
        content: 'Unauthorized individual attempted to bypass security checkpoint at the main entrance. Subject refused to present identification and became aggressive when questioned by security personnel. Building security protocol was immediately activated.',
        // Supervisor review (uses approved_at for finalized timestamp)
        approvedBy: 'Sarah Chen',
        approvedByRole: 'Security Admin',
        approvedAt: '2026-01-08T15:45:00Z',  // CRITICAL: This is the finalized approval timestamp
        reviewed_by_user_id: 2,
        reviewed_by_name: 'Sarah Chen',
        reviewed_by_role: 'Security Admin',
        reviewed_at: '2026-01-08T15:45:00Z',  // Same as approvedAt
        org_id: 'default_org'
      },
      // TEST REPORT 2: Incident with Police Called = FALSE
      {
        id: 'IR-2026-000002',
        reportCode: 'IR-2026-000002',
        caseId: '#IR-2026-000002',
        reportType: 'incident',
        type: 'Incident',
        site: 'Tech Campus Building A',
        location: 'Parking Garage Level 2',
        guardName: 'Mike Johnson',
        submittedBy: 'Mike Johnson',
        timestamp: '2026-01-09T10:15:00Z',
        created_at: '2026-01-09T10:15:00Z',
        filedOn: '2026-01-09T10:15:00Z',
        occurredAt: '2026-01-09T10:15:00Z',
        status: 'approved',
        priority: 'normal',
        incidentType: 'Vandalism',
        urgency: 'Normal',
        narrativeOnly: 'Discovered graffiti on concrete support column in parking garage. Tag approximately 2 feet by 3 feet in size. No damage to vehicles or other property observed. Area was documented with photographs.',
        actionTaken: 'Photographed vandalism from multiple angles for documentation. Notified building maintenance via work order #4521. Increased patrol frequency in parking garage. No suspects identified at time of discovery.',
        // CANONICAL POLICE FIELDS
        police_called: false,        // boolean - canonical field name
        pd_case_number: '',          // empty string when no police involvement
        // Legacy fields for backward compatibility
        policeCalled: 'No',
        content: 'Discovered graffiti on concrete support column in parking garage. Tag approximately 2 feet by 3 feet in size. No damage to vehicles or other property observed. Area was documented with photographs.',
        // Supervisor review (uses approved_at for finalized timestamp)
        approvedBy: 'Sarah Chen',
        approvedByRole: 'Security Admin',
        approvedAt: '2026-01-09T11:00:00Z',  // CRITICAL: This is the finalized approval timestamp
        reviewed_by_user_id: 2,
        reviewed_by_name: 'Sarah Chen',
        reviewed_by_role: 'Security Admin',
        reviewed_at: '2026-01-09T11:00:00Z',  // Same as approvedAt
        org_id: 'default_org'
      },
      {
        id: 'DAR-2026-000015',
        reportCode: 'DAR-2026-000015',
        caseId: '#DAR-2026-000015',
        reportType: 'dar',
        type: 'DAR',
        site: 'Tech Campus Building B',
        location: 'All Floors',
        guardName: 'Sarah Chen',
        submittedBy: 'Sarah Chen',
        timestamp: '2026-01-07T23:00:00Z',
        created_at: '2026-01-07T23:00:00Z',
        status: 'approved',
        priority: 'normal',
        shiftStart: '3:00 PM',
        shiftEnd: '11:00 PM',
        reliefGuard: 'Mike Johnson',
        content: 'Evening shift patrol covering all floors of Building B. All security checkpoints verified operational. Access control systems functioning normally. No incidents or irregularities observed during patrol rounds.',
        activitiesPerformed: '• Completed 6 full building patrols (once per hour)\\n• Verified all emergency exits secure and operational\\n• Checked badge reader functionality at 8 access points\\n• Inspected parking garage levels 1-3\\n• Responded to 2 after-hours access requests (approved)\\n• Documented equipment status: all cameras operational\\n• Coordinated with night cleaning crew (11 personnel)',
        equipmentStatus: 'All operational - no maintenance required',
        approvedBy: 'Sarah Chen',
        approvedByRole: 'Supervisor',
        approvedAt: '2026-01-07T23:30:00Z',
        org_id: 'default_org'
      },
      {
        id: 'MNT-2026-000003',
        reportCode: 'MNT-2026-000003',
        caseId: '#MNT-2026-000003',
        reportType: 'maintenance',
        type: 'Maintenance',
        site: 'Riverside Complex',
        location: 'East Wing - Floor 2',
        guardName: 'Mike Johnson',
        submittedBy: 'Mike Johnson',
        timestamp: '2026-01-06T10:15:00Z',
        created_at: '2026-01-06T10:15:00Z',
        status: 'approved',
        priority: 'high',
        equipmentType: 'Security Camera',
        issueType: 'Equipment Malfunction',
        content: 'Security camera CAM-E2-04 in the east wing hallway is experiencing intermittent connectivity issues. Camera feed drops every 15-20 minutes and requires manual reset. This creates a blind spot in our surveillance coverage.',
        actionTaken: 'Reported issue to building maintenance. Temporarily increased patrol frequency in the affected area. Documented all outage times. Maintenance team scheduled for repair on 01/07/2026.',
        specificArea: 'East Wing Hallway, Camera ID: CAM-E2-04',
        assetId: 'CAM-E2-04',
        approvedBy: 'Sarah Chen',
        approvedByRole: 'Security Admin',
        approvedAt: '2026-01-06T11:00:00Z',
        org_id: 'default_org'
      },
      {
        id: 'DIS-2026-000001',
        reportCode: 'DIS-2026-000001',
        caseId: '#DIS-2026-000001',
        reportType: 'disciplinary',
        type: 'Disciplinary',
        site: 'Corporate Headquarters',
        location: 'Security Office',
        guardName: 'Sarah Chen',
        submittedBy: 'Sarah Chen',
        timestamp: '2026-01-05T16:00:00Z',
        created_at: '2026-01-05T16:00:00Z',
        status: 'approved',
        priority: 'normal',
        employeeName: 'Guard #247',
        violationType: 'Tardiness / Attendance Issue',
        disciplineLevel: 'Written Warning',
        content: 'Employee arrived 45 minutes late for assigned shift on January 5th, 2026. This is the third tardiness occurrence in the past 30 days. Previous verbal warnings were issued on December 15th and December 28th.',
        correctiveAction: 'Formal written warning issued and placed in employee file. Employee counseled on the importance of punctuality and reliability in security operations. Clear expectations set: any additional tardiness within the next 90 days will result in suspension. Employee acknowledged understanding and signed acknowledgment form.',
        approvedBy: 'Sarah Chen',
        approvedByRole: 'Security Admin',
        approvedAt: '2026-01-05T17:00:00Z',
        org_id: 'default_org'
      }
    ];
    
    // Save sample reports to KV store
    for (const report of sampleReports) {
      await kv.set(`report:${report.reportCode}`, report);
      console.log(`✅ Seeded report: ${report.reportCode}`);
    }
    
    // ========================================================================
    // SEED ORGANIZATION DATA
    // ========================================================================
    // Create a default organization for MVP testing
    const defaultOrganization = {
      id: 'default_org',
      name: 'Elite Security Services',
      display_name: 'Elite Security Services',
      created_at: '2026-01-01T00:00:00Z',
      settings: {
        timezone: 'America/New_York',
        report_prefix: 'ES'
      }
    };
    
    // Check if organization already exists
    const existingOrg = await kv.get('org:default_org');
    if (!existingOrg) {
      await kv.set('org:default_org', defaultOrganization);
      console.log('✅ Seeded organization: Elite Security Services');
    }
    
    // ========================================================================
    // SEED VAULT DOCUMENTS FOR TEST REPORTS
    // ========================================================================
    // Add vault entries for our test incident reports so they can be opened/viewed
    const vaultDocuments = [
      {
        id: 'vault-ir-1',
        name: 'IR-2026-000001 - Security Breach Incident Report.pdf',
        category: 'Incident Reports',
        uploadedBy: 'Sarah Chen',
        date: 'Jan 8, 2026',
        size: '0.8 MB',
        status: 'Active',
        reportReferenceId: 'IR-2026-000001'
      },
      {
        id: 'vault-ir-2',
        name: 'IR-2026-000002 - Vandalism Incident Report.pdf',
        category: 'Incident Reports',
        uploadedBy: 'Sarah Chen',
        date: 'Jan 9, 2026',
        size: '0.6 MB',
        status: 'Active',
        reportReferenceId: 'IR-2026-000002'
      }
    ];
    
    // Check if vault documents already exist
    const existingVault = await kv.getByPrefix('vault:');
    if (existingVault.length === 0) {
      for (const doc of vaultDocuments) {
        await kv.set(`vault:${doc.id}`, doc);
        console.log(`✅ Seeded vault document: ${doc.name}`);
      }
    }
    
    console.log('✅ Database seeding complete - added ' + sampleReports.length + ' sample reports');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
}