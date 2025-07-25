-- Migration: Add nationality column to lecturers table
-- This fixes the issue where lecturer nationality data was not being stored or retrieved

-- Add nationality column to lecturers table
ALTER TABLE lecturers 
ADD COLUMN nationality varchar(100) DEFAULT NULL 
AFTER id_number;

-- Update existing records to have a default nationality if needed
-- UPDATE lecturers SET nationality = 'Sri Lankan' WHERE nationality IS NULL;

-- Verify the change
-- DESCRIBE lecturers; 