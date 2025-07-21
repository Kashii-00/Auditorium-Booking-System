-- ================================================
-- Rename student_id to student_code in student_courses table
-- ================================================
-- This migration renames the formatted student ID column 
-- from student_id to student_code for better clarity
-- ================================================

-- Step 1: Rename the column from student_id to student_code
ALTER TABLE student_courses 
CHANGE COLUMN student_id student_code VARCHAR(50) NULL;

-- Step 2: Update the index name if it exists
-- First drop the old index if it exists
DROP INDEX IF EXISTS idx_student_courses_student_id ON student_courses;

-- Create new index with updated name
ALTER TABLE student_courses 
ADD INDEX idx_student_courses_student_code (student_code);

-- Completion message
SELECT 'Migration completed: student_id column renamed to student_code in student_courses table' AS message; 