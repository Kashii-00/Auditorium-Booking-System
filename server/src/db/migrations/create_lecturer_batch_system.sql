-- Migration for Lecturer Batch Management System
-- Create tables for batches, materials, assignments, grades, and announcements

-- Create batches table
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
  `enrolled_students` int(11) DEFAULT 0,
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

-- Create batch_students table for student enrollments
CREATE TABLE IF NOT EXISTS `batch_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `enrollment_date` timestamp DEFAULT current_timestamp(),
  `status` enum('active','inactive','completed','dropped') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch_student_unique` (`batch_id`, `student_id`),
  KEY `batch_id` (`batch_id`),
  KEY `student_id` (`student_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create batch_materials table
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

-- Create assignments table
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

-- Create assignment_submissions table
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

-- Create grades table
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

-- Create announcements table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
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

-- Create quizzes table
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

-- Insert sample data for demonstration
INSERT INTO `batches` (`course_id`, `lecturer_id`, `batch_name`, `batch_code`, `start_date`, `end_date`, `status`, `max_students`, `enrolled_students`, `description`) VALUES
(1, 4, 'JavaScript Advanced - Batch A', 'JS-2024-A', '2024-01-15', '2024-04-15', 'current', 45, 42, 'Advanced JavaScript programming concepts including ES6+, async/await, and modern frameworks'),
(2, 5, 'Database Management - Batch B', 'DB-2024-B', '2024-02-01', '2024-05-01', 'current', 32, 30, 'Comprehensive database management covering SQL, NoSQL, and database design principles'),
(3, 6, 'Web Development Fundamentals - Batch C', 'WEB-2024-C', '2024-03-01', '2024-06-01', 'current', 50, 48, 'Full-stack web development from HTML/CSS to modern JavaScript frameworks'),
(1, 4, 'JavaScript Basics - Batch D', 'JS-2024-D', '2024-06-01', '2024-09-01', 'upcoming', 40, 0, 'Introduction to JavaScript programming for beginners'),
(2, 5, 'Advanced Database - Batch E', 'DB-2024-E', '2023-09-01', '2023-12-01', 'past', 25, 25, 'Advanced database optimization and performance tuning');

-- Insert sample materials
INSERT INTO `batch_materials` (`batch_id`, `lecturer_id`, `title`, `description`, `material_type`) VALUES
(1, 4, 'JavaScript ES6+ Features', 'Comprehensive guide to modern JavaScript features', 'lecture'),
(1, 4, 'Async Programming Assignment', 'Practice exercises for promises and async/await', 'assignment'),
(2, 5, 'SQL Query Optimization', 'Advanced techniques for optimizing database queries', 'lecture'),
(3, 6, 'HTML5 & CSS3 Fundamentals', 'Modern web markup and styling techniques', 'lecture');

-- Insert sample assignments
INSERT INTO `assignments` (`batch_id`, `lecturer_id`, `title`, `description`, `due_date`, `max_marks`, `status`) VALUES
(1, 4, 'Build a Todo App', 'Create a fully functional todo application using vanilla JavaScript', '2024-02-15 23:59:00', 100.00, 'published'),
(2, 5, 'Database Design Project', 'Design and implement a normalized database for an e-commerce system', '2024-03-01 23:59:00', 150.00, 'published'),
(3, 6, 'Responsive Portfolio Website', 'Build a responsive portfolio website using HTML, CSS, and JavaScript', '2024-04-01 23:59:00', 120.00, 'published');

-- Insert sample announcements
INSERT INTO `announcements` (`batch_id`, `lecturer_id`, `title`, `content`, `priority`, `is_published`, `publish_date`) VALUES
(1, 4, 'Midterm Exam Schedule', 'The midterm examination will be held on March 15th, 2024. Please review all materials covered so far.', 'high', true, '2024-03-01 09:00:00'),
(2, 5, 'Guest Lecture on NoSQL', 'We will have a special guest lecture on NoSQL databases next week. Attendance is mandatory.', 'medium', true, '2024-03-05 10:00:00'),
(3, 6, 'Project Submission Guidelines', 'Please ensure your final projects follow the submission guidelines posted in the materials section.', 'medium', true, '2024-03-10 14:00:00'); 