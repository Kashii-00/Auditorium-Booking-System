-- Add password reset tracking fields to student_users and lecturer_users tables
-- This migration enhances security by preventing password reset abuse

-- Add password reset tracking fields to student_users (MariaDB compatible)
ALTER TABLE `student_users` ADD COLUMN `password_reset_count` INT DEFAULT 0;
ALTER TABLE `student_users` ADD COLUMN `last_password_reset` DATETIME DEFAULT NULL;
ALTER TABLE `student_users` ADD COLUMN `last_reset_request` DATETIME DEFAULT NULL;
ALTER TABLE `student_users` ADD COLUMN `reset_request_count` INT DEFAULT 0;

-- Add password reset tracking fields to lecturer_users (MariaDB compatible)
ALTER TABLE `lecturer_users` ADD COLUMN `password_reset_count` INT DEFAULT 0;
ALTER TABLE `lecturer_users` ADD COLUMN `last_password_reset` DATETIME DEFAULT NULL;
ALTER TABLE `lecturer_users` ADD COLUMN `last_reset_request` DATETIME DEFAULT NULL;
ALTER TABLE `lecturer_users` ADD COLUMN `reset_request_count` INT DEFAULT 0;

-- Create password reset logs table for auditing
CREATE TABLE IF NOT EXISTS `password_reset_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_type` ENUM('student', 'lecturer') NOT NULL,
  `user_id` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `action` ENUM('request', 'reset', 'failed_attempt') NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `token_used` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_logs_user (user_type, user_id),
  INDEX idx_password_reset_logs_email (email),
  INDEX idx_password_reset_logs_action (action),
  INDEX idx_password_reset_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create view for recent password reset activity
CREATE OR REPLACE VIEW `recent_password_resets` AS
SELECT 
  user_type,
  user_id,
  email,
  action,
  created_at,
  TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
FROM password_reset_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC; 