-- Migration: Add trimester column to test_results table
-- This migration adds a trimester field (1, 2, or 3) that is shown when pregnancy is true

-- Step 1: Add trimester column
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS trimester INTEGER NULL;

-- Step 2: Add CHECK constraint to ensure only valid values (1, 2, or 3)
ALTER TABLE test_results 
DROP CONSTRAINT IF EXISTS check_trimester_valid;

ALTER TABLE test_results 
ADD CONSTRAINT check_trimester_valid 
CHECK (trimester IS NULL OR trimester IN (1, 2, 3));

-- Step 3: Add comment
COMMENT ON COLUMN test_results.trimester IS 'Trimestr těhotenství (1, 2, nebo 3) - zobrazuje se pouze pokud pregnancy = true';

