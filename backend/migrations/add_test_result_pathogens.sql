-- Migration: Multiple pathogens per positive test result
-- Replaces test_results.pathogen_id with test_result_pathogens junction table.
-- Positive = has at least one row in test_result_pathogens.

-- Step 1: Create test_result_pathogens junction table
CREATE TABLE IF NOT EXISTS test_result_pathogens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  pathogen_id UUID NOT NULL REFERENCES pathogens(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (test_result_id, pathogen_id)
);

CREATE INDEX IF NOT EXISTS idx_test_result_pathogens_test_result_id ON test_result_pathogens(test_result_id);
CREATE INDEX IF NOT EXISTS idx_test_result_pathogens_pathogen_id ON test_result_pathogens(pathogen_id);

-- Step 2: Migrate existing pathogen_id data
INSERT INTO test_result_pathogens (test_result_id, pathogen_id, created_at, updated_at)
SELECT id, pathogen_id, created_at, updated_at
FROM test_results
WHERE pathogen_id IS NOT NULL
ON CONFLICT (test_result_id, pathogen_id) DO NOTHING;

-- Step 3: Drop old pathogen_id column and index from test_results
DROP INDEX IF EXISTS idx_test_results_pathogen_id;
ALTER TABLE test_results DROP COLUMN IF EXISTS pathogen_id;
