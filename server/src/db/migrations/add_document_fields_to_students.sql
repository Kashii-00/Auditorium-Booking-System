-- Add document storage columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS nic_document_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS passport_document_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS photo_path VARCHAR(255);

-- Ensure 'driving_details' column exists - add it if it doesn't
-- This is a JSON field to store driving license related information
ALTER TABLE students
ADD COLUMN IF NOT EXISTS driving_details JSON;

-- Notify completion
SELECT 'Migration complete: Added document fields to students table' AS message;
