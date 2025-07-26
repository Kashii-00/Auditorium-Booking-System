-- Migration: Create lecturer_work_experiences table
-- Date: 2025-01-15
-- Description: Creates table to store lecturer work experience/professional background

CREATE TABLE IF NOT EXISTS lecturer_work_experiences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT NOT NULL,
  institution VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  start_year INT NOT NULL,
  end_year INT NULL,
  department VARCHAR(255) NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
  INDEX idx_lecturer_work_exp_lecturer (lecturer_id),
  INDEX idx_lecturer_work_exp_years (start_year, end_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 