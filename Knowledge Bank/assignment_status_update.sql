-- Migration: Add status field to assignments table for draft/published workflow
-- Run this in your Supabase SQL Editor

-- Step 1: Add status column to assignments table
ALTER TABLE assignments
ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Step 2: Add comment for clarity
COMMENT ON COLUMN assignments.status IS 'Assignment status: draft (work in progress) or published (live for students)';

-- Step 3: Create index for filtering by status
CREATE INDEX idx_assignments_status ON assignments(status);

-- Step 4: Update existing assignments to 'published' (assuming they were already live)
UPDATE assignments SET status = 'published' WHERE status IS NULL;

-- Verify the changes
SELECT id, title, status, created_at
FROM assignments
ORDER BY created_at DESC
LIMIT 5;
