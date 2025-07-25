-- Migration: Remove batch_name column from batches table
-- Date: 2025-01-15
-- Description: Removes the batch_name column as it's no longer needed

ALTER TABLE batches DROP COLUMN batch_name; 