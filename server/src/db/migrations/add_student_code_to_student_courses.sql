-- ================================================
-- Add student_code column to student_courses table
-- ================================================
-- This migration adds a student_code column to store 
-- formatted IDs like "MP-PST25.1-001" for each course enrollment
-- ================================================

-- Step 1: Add student_code column to student_courses table
ALTER TABLE student_courses 
ADD COLUMN student_code VARCHAR(50) NULL 
AFTER course_id;

-- Step 2: Add index for performance
ALTER TABLE student_courses 
ADD INDEX idx_student_courses_student_code (student_code);

-- Step 3: Add comment for clarity
ALTER TABLE student_courses 
MODIFY COLUMN student_code VARCHAR(50) NULL 
COMMENT 'Formatted student ID for this course enrollment (e.g., MP-PST25.1-001)';

-- Completion message
SELECT 'Migration completed: student_code column added to student_courses table' AS message;
SELECT 'Format: MP-{COURSE}YY.B-NNN (e.g., MP-PST25.1-001)' AS format_info; 