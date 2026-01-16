-- ============================================================================
-- ATOMIC COUNTER INCREMENT FUNCTION
-- ============================================================================
-- This function provides atomic, concurrency-safe report code generation
-- using SELECT FOR UPDATE to lock the counter row during increment.
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_report_counter(
  p_org_id UUID,
  p_year INTEGER,
  p_report_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_sequence INTEGER;
BEGIN
  -- Attempt to get existing counter with lock (SELECT FOR UPDATE)
  -- This prevents other concurrent transactions from reading/modifying
  -- the same counter until this transaction commits
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
      
    RAISE NOTICE 'Incremented existing counter to %', v_sequence;
  ELSE
    -- Counter doesn't exist, create it with sequence = 1
    -- Use INSERT ... ON CONFLICT to handle race condition where
    -- two transactions try to create the same counter simultaneously
    v_sequence := 1;
    
    INSERT INTO report_code_counters (org_id, year, report_type, sequence)
    VALUES (p_org_id, p_year, p_report_type, v_sequence)
    ON CONFLICT (org_id, year, report_type) DO UPDATE
    SET sequence = report_code_counters.sequence + 1,
        updated_at = NOW()
    RETURNING sequence INTO v_sequence;
    
    RAISE NOTICE 'Created new counter with sequence %', v_sequence;
  END IF;
  
  RETURN v_sequence;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSION
-- ============================================================================
GRANT EXECUTE ON FUNCTION increment_report_counter TO authenticated;

-- ============================================================================
-- TEST THE FUNCTION (optional, for verification)
-- ============================================================================
-- Run this to test:
-- SELECT increment_report_counter(
--   '00000000-0000-0000-0000-000000000001'::UUID,
--   2026,
--   'incident'
-- );
-- ============================================================================
