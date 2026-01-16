// ============================================================================
// CONCURRENCY TEST SCRIPT
// ============================================================================
// Tests atomic report code generation under concurrent load
// Run this script to verify no duplicate case IDs are generated
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'YOUR_ANON_KEY';
const API_URL = `${SUPABASE_URL}/functions/v1/make-server-e7fd76e8/api`;

// Test configuration
const NUM_CONCURRENT_REQUESTS = 20;
const TEST_USER_TOKEN = Deno.env.get('TEST_USER_TOKEN') || 'YOUR_TEST_TOKEN';

interface TestReport {
  reportType: string;
  status: string;
  guardName: string;
  site: string;
  content: string;
  priority: string;
}

interface TestResult {
  success: boolean;
  caseId?: string;
  reportCode?: string;
  error?: string;
  duration: number;
}

/**
 * Create a single report via API
 */
async function createReport(testNum: number): Promise<TestResult> {
  const startTime = Date.now();
  
  const reportData: TestReport = {
    reportType: 'incident',
    status: 'draft',
    guardName: `Test Guard ${testNum}`,
    site: 'Test Site',
    content: `Concurrency test report #${testNum}`,
    priority: 'normal'
  };
  
  try {
    console.log(`[Test ${testNum}] Sending request...`);
    
    const response = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      },
      body: JSON.stringify(reportData)
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[Test ${testNum}] ❌ Failed: ${response.status}`, errorData);
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        duration
      };
    }
    
    const data = await response.json();
    
    if (!data.success || !data.report) {
      console.error(`[Test ${testNum}] ❌ Invalid response:`, data);
      return {
        success: false,
        error: 'Invalid response format',
        duration
      };
    }
    
    console.log(`[Test ${testNum}] ✅ Success: ${data.report.caseId} (${duration}ms)`);
    
    return {
      success: true,
      caseId: data.report.caseId,
      reportCode: data.report.report_code,
      duration
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Test ${testNum}] ❌ Exception:`, error.message);
    return {
      success: false,
      error: error.message,
      duration
    };
  }
}

/**
 * Run concurrency test
 */
async function runConcurrencyTest() {
  console.log('='.repeat(80));
  console.log('GUARD UP MVP - CONCURRENCY TEST');
  console.log('='.repeat(80));
  console.log(`Testing ${NUM_CONCURRENT_REQUESTS} concurrent report creations...`);
  console.log(`API URL: ${API_URL}`);
  console.log('');
  
  const startTime = Date.now();
  
  // Create array of promises for concurrent execution
  const promises = Array.from(
    { length: NUM_CONCURRENT_REQUESTS },
    (_, i) => createReport(i + 1)
  );
  
  // Execute all requests concurrently
  console.log('🚀 Launching concurrent requests...\n');
  const results = await Promise.all(promises);
  
  const totalDuration = Date.now() - startTime;
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS');
  console.log('='.repeat(80));
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length}/${NUM_CONCURRENT_REQUESTS}`);
  console.log(`❌ Failed:     ${failed.length}/${NUM_CONCURRENT_REQUESTS}`);
  console.log(`⏱️  Total time: ${totalDuration}ms`);
  console.log(`⏱️  Avg time:   ${Math.round(totalDuration / NUM_CONCURRENT_REQUESTS)}ms per request`);
  
  // Check for duplicate case IDs
  const caseIds = successful.map(r => r.caseId).filter(Boolean);
  const uniqueCaseIds = new Set(caseIds);
  const duplicates = caseIds.length - uniqueCaseIds.size;
  
  console.log(`\n📊 Case ID Analysis:`);
  console.log(`   Generated:  ${caseIds.length}`);
  console.log(`   Unique:     ${uniqueCaseIds.size}`);
  console.log(`   Duplicates: ${duplicates}`);
  
  if (duplicates > 0) {
    console.log(`\n❌ CRITICAL: ${duplicates} duplicate case IDs detected!`);
    
    // Find and display duplicates
    const counts = new Map<string, number>();
    caseIds.forEach(id => {
      if (id) {
        counts.set(id, (counts.get(id) || 0) + 1);
      }
    });
    
    console.log('\nDuplicate case IDs:');
    counts.forEach((count, id) => {
      if (count > 1) {
        console.log(`  ${id}: ${count} occurrences`);
      }
    });
    
    return false;
  }
  
  // Display generated case IDs
  console.log('\nGenerated Case IDs:');
  caseIds.sort().forEach((id, i) => {
    console.log(`  ${i + 1}. ${id}`);
  });
  
  // Display any errors
  if (failed.length > 0) {
    console.log('\n❌ Failed Requests:');
    failed.forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (successful.length === NUM_CONCURRENT_REQUESTS && duplicates === 0) {
    console.log('✅ TEST PASSED: All requests successful, no duplicates');
    console.log('='.repeat(80));
    return true;
  } else if (duplicates === 0) {
    console.log('⚠️  TEST PARTIAL: No duplicates, but some requests failed');
    console.log('='.repeat(80));
    return false;
  } else {
    console.log('❌ TEST FAILED: Duplicate case IDs detected');
    console.log('='.repeat(80));
    return false;
  }
}

/**
 * Verify database state after test
 */
async function verifyDatabase() {
  console.log('\n' + '='.repeat(80));
  console.log('DATABASE VERIFICATION');
  console.log('='.repeat(80));
  
  const supabase = createClient(SUPABASE_URL, TEST_USER_TOKEN);
  
  // Get all reports created in this test
  const { data: reports, error } = await supabase
    .from('reports')
    .select('report_code, created_at')
    .eq('report_type', 'incident')
    .order('created_at', { ascending: false })
    .limit(NUM_CONCURRENT_REQUESTS + 10);
  
  if (error) {
    console.error('❌ Database query failed:', error);
    return;
  }
  
  console.log(`\nRecent incident reports in database: ${reports?.length || 0}`);
  
  if (reports && reports.length > 0) {
    const reportCodes = reports.map(r => r.report_code);
    const uniqueCodes = new Set(reportCodes);
    
    console.log(`Unique report codes: ${uniqueCodes.size}`);
    
    if (reportCodes.length !== uniqueCodes.size) {
      console.log('❌ CRITICAL: Duplicate report codes found in database!');
    } else {
      console.log('✅ All report codes in database are unique');
    }
  }
  
  console.log('='.repeat(80));
}

/**
 * Main test execution
 */
async function main() {
  try {
    // Check environment variables
    if (!TEST_USER_TOKEN || TEST_USER_TOKEN === 'YOUR_TEST_TOKEN') {
      console.error('❌ ERROR: TEST_USER_TOKEN environment variable not set');
      console.error('Please set TEST_USER_TOKEN to a valid JWT token for a test user');
      Deno.exit(1);
    }
    
    // Run concurrency test
    const testPassed = await runConcurrencyTest();
    
    // Verify database state
    await verifyDatabase();
    
    // Exit with appropriate code
    Deno.exit(testPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    Deno.exit(1);
  }
}

// Run the test
if (import.meta.main) {
  main();
}

export { runConcurrencyTest, createReport, verifyDatabase };
