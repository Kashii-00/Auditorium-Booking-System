-- Migration to adapt existing event_management database for Lecturer Batch Management System
-- This script works with your existing database structure and table names

-- First, let's check if we need to add missing columns to existing tables

-- 1. Update the existing 'courses' table to add missing fields if they don't exist
ALTER TABLE `courses` 
ADD COLUMN IF NOT EXISTS `duration` varchar(100) DEFAULT NULL AFTER `courseName`,
ADD COLUMN IF NOT EXISTS `description` text DEFAULT NULL AFTER `duration`,
ADD COLUMN IF NOT EXISTS `status` enum('active','inactive','draft') DEFAULT 'active' AFTER `description`;


-- 3. Create batches table (adapting to work with existing structure)
CREATE TABLE IF NOT EXISTS `batches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `batch_name` varchar(100) NOT NULL,
  `batch_code` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('upcoming','current','past','completed','cancelled') DEFAULT 'upcoming',
  `max_students` int(11) DEFAULT 30,
  `description` text DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch_code` (`batch_code`),
  KEY `course_id` (`course_id`),
  KEY `lecturer_id` (`lecturer_id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Create student_batches table (using your existing naming convention)
-- Check if it exists, if not create it, if yes, add missing columns
CREATE TABLE IF NOT EXISTS `student_batches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `enrollment_date` timestamp DEFAULT current_timestamp(),
  `status` enum('active','inactive','completed','dropped') DEFAULT 'active',
  `attendance_percentage` decimal(5,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch_student_unique` (`batch_id`, `student_id`),
  KEY `batch_id` (`batch_id`),
  KEY `student_id` (`student_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- If student_batches already exists, add missing columns
ALTER TABLE `student_batches` 
ADD COLUMN IF NOT EXISTS `attendance_percentage` decimal(5,2) DEFAULT 0.00 AFTER `status`;

-- 5. Create batch_materials table
CREATE TABLE IF NOT EXISTS `batch_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `material_type` enum('lecture','assignment','quiz','reference','other') DEFAULT 'lecture',
  `is_active` boolean DEFAULT true,
  `upload_date` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `lecturer_id` (`lecturer_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. Create assignments table
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `instructions` text DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `max_marks` decimal(5,2) DEFAULT 100.00,
  `assignment_type` enum('individual','group','project','quiz') DEFAULT 'individual',
  `status` enum('draft','published','closed') DEFAULT 'draft',
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `lecturer_id` (`lecturer_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Create assignment_submissions table
CREATE TABLE IF NOT EXISTS `assignment_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `submitted_at` timestamp DEFAULT current_timestamp(),
  `is_late` boolean DEFAULT false,
  `status` enum('submitted','graded','returned') DEFAULT 'submitted',
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_student_unique` (`assignment_id`, `student_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `student_id` (`student_id`),
  FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. Create grades table
CREATE TABLE IF NOT EXISTS `grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `marks_obtained` decimal(5,2) NOT NULL,
  `max_marks` decimal(5,2) NOT NULL,
  `percentage` decimal(5,2) GENERATED ALWAYS AS ((marks_obtained / max_marks) * 100) STORED,
  `grade` varchar(5) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `graded_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_student_grade_unique` (`assignment_id`, `student_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `student_id` (`student_id`),
  KEY `lecturer_id` (`lecturer_id`),
  FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. Create announcements table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `priority` enum('low','normal','medium','high','urgent') DEFAULT 'normal',
  `is_published` boolean DEFAULT false,
  `publish_date` datetime DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `lecturer_id` (`lecturer_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 10. Create quizzes table
CREATE TABLE IF NOT EXISTS `quizzes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `max_marks` decimal(5,2) DEFAULT 100.00,
  `is_published` boolean DEFAULT false,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `lecturer_id` (`lecturer_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Sample batches (only insert if batches table is empty)
INSERT INTO `batches` (`course_id`, `lecturer_id`, `batch_name`, `batch_code`, `start_date`, `end_date`, `status`, `max_students`, `description`)
SELECT * FROM (SELECT 
  1 as course_id, 4 as lecturer_id, 'JavaScript Advanced - Batch A' as batch_name, 'JS-2024-A' as batch_code, 
  '2024-01-15' as start_date, '2024-04-15' as end_date, 'current' as status, 45 as max_students, 
  'Advanced JavaScript programming concepts including ES6+, async/await, and modern frameworks' as description
UNION ALL SELECT 
  2, 5, 'Database Management - Batch B', 'DB-2024-B', 
  '2024-02-01', '2024-05-01', 'current', 32, 
  'Comprehensive database management covering SQL, NoSQL, and database design principles'
UNION ALL SELECT 
  3, 6, 'Web Development Fundamentals - Batch C', 'WEB-2024-C', 
  '2024-03-01', '2024-06-01', 'current', 50, 
  'Full-stack web development from HTML/CSS to modern JavaScript frameworks'
UNION ALL SELECT 
  1, 4, 'JavaScript Basics - Batch D', 'JS-2024-D', 
  '2024-06-01', '2024-09-01', 'upcoming', 40, 
  'Introduction to JavaScript programming for beginners'
UNION ALL SELECT 
  2, 5, 'Advanced Database - Batch E', 'DB-2024-E', 
  '2023-09-01', '2023-12-01', 'past', 25, 
  'Advanced database optimization and performance tuning'
) AS sample_data
WHERE NOT EXISTS (SELECT 1 FROM `batches` LIMIT 1);

-- Sample materials (only insert if batch_materials table is empty)
INSERT INTO `batch_materials` (`batch_id`, `lecturer_id`, `title`, `description`, `material_type`)
SELECT * FROM (SELECT 
  1 as batch_id, 4 as lecturer_id, 'JavaScript ES6+ Features' as title, 
  'Comprehensive guide to modern JavaScript features' as description, 'lecture' as material_type
UNION ALL SELECT 
  1, 4, 'Async Programming Assignment', 
  'Practice exercises for promises and async/await', 'assignment'
UNION ALL SELECT 
  2, 5, 'SQL Query Optimization', 
  'Advanced techniques for optimizing database queries', 'lecture'
UNION ALL SELECT 
  3, 6, 'HTML5 & CSS3 Fundamentals', 
  'Modern web markup and styling techniques', 'lecture'
) AS sample_materials
WHERE NOT EXISTS (SELECT 1 FROM `batch_materials` LIMIT 1);

-- Sample assignments (only insert if assignments table is empty)
INSERT INTO `assignments` (`batch_id`, `lecturer_id`, `title`, `description`, `due_date`, `max_marks`, `status`)
SELECT * FROM (SELECT 
  1 as batch_id, 4 as lecturer_id, 'Build a Todo App' as title, 
  'Create a fully functional todo application using vanilla JavaScript' as description, 
  '2024-02-15 23:59:00' as due_date, 100.00 as max_marks, 'published' as status
UNION ALL SELECT 
  2, 5, 'Database Design Project', 
  'Design and implement a normalized database for an e-commerce system', 
  '2024-03-01 23:59:00', 150.00, 'published'
UNION ALL SELECT 
  3, 6, 'Responsive Portfolio Website', 
  'Build a responsive portfolio website using HTML, CSS, and JavaScript', 
  '2024-04-01 23:59:00', 120.00, 'published'
) AS sample_assignments
WHERE NOT EXISTS (SELECT 1 FROM `assignments` LIMIT 1);

-- Sample announcements (only insert if announcements table is empty)
INSERT INTO `announcements` (`batch_id`, `lecturer_id`, `title`, `content`, `priority`, `is_published`, `publish_date`)
SELECT * FROM (SELECT 
  1 as batch_id, 4 as lecturer_id, 'Midterm Exam Schedule' as title, 
  'The midterm examination will be held on March 15th, 2024. Please review all materials covered so far.' as content, 
  'high' as priority, true as is_published, '2024-03-01 09:00:00' as publish_date
UNION ALL SELECT 
  2, 5, 'Guest Lecture on NoSQL', 
  'We will have a special guest lecture on NoSQL databases next week. Attendance is mandatory.', 
  'medium', true, '2024-03-05 10:00:00'
UNION ALL SELECT 
  3, 6, 'Project Submission Guidelines', 
  'Please ensure your final projects follow the submission guidelines posted in the materials section.', 
  'medium', true, '2024-03-10 14:00:00'
) AS sample_announcements
WHERE NOT EXISTS (SELECT 1 FROM `announcements` LIMIT 1);

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_dates ON batches(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_student_batches_status ON student_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_materials_active ON batch_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published);

-- Migration completed successfully!
-- Your existing database structure is now enhanced with batch management capabilities.
-- Table names follow your existing conventions (student_batches instead of batch_students).
-- All foreign key relationships are properly maintained with your existing tables. 