-- Migration: Align assignments table columns with application code
-- Run this in your Supabase SQL Editor

-- Step 1: Rename content_source to content_type
ALTER TABLE assignments
RENAME COLUMN content_source TO content_type;

-- Step 2: Rename page columns to match code expectations
ALTER TABLE assignments
RENAME COLUMN page_start TO page_range_start;

ALTER TABLE assignments
RENAME COLUMN page_end TO page_range_end;

-- Step 3: Update the content_type constraint to use new values
ALTER TABLE assignments
DROP CONSTRAINT IF EXISTS assignments_content_source_check;

ALTER TABLE assignments
ADD CONSTRAINT assignments_content_type_check
CHECK (content_type IN ('book', 'pasted_text'));

-- Step 4: Update existing data if any exists
-- Change 'existing-book' to 'book'
UPDATE assignments
SET content_type = 'book'
WHERE content_type = 'existing-book';

-- Change 'paste-text' to 'pasted_text'
UPDATE assignments
SET content_type = 'pasted_text'
WHERE content_type = 'paste-text';

-- Step 5: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignments'
AND column_name IN ('content_type', 'page_range_start', 'page_range_end', 'status')
ORDER BY ordinal_position;
