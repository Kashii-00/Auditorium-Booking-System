-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 11, 2025 at 12:18 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `event_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `aid_handover`
--

CREATE TABLE `aid_handover` (
  `id` int(11) NOT NULL,
  `request_id` int(10) UNSIGNED DEFAULT NULL,
  `items_taken_over` text DEFAULT NULL,
  `items_returned` text DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `receiver_designation` varchar(255) DEFAULT NULL,
  `receiver_date` date DEFAULT NULL,
  `handover_confirmer_name` varchar(255) DEFAULT NULL,
  `handover_confirmer_designation` varchar(255) DEFAULT NULL,
  `handover_confirmer_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `aid_handover`
--

INSERT INTO `aid_handover` (`id`, `request_id`, `items_taken_over`, `items_returned`, `receiver_name`, `receiver_designation`, `receiver_date`, `handover_confirmer_name`, `handover_confirmer_designation`, `handover_confirmer_date`) VALUES
(1, 1, '2', 'ss', 'aaa', 'aaa', '2025-06-10', 'aaa', 'aa', '2025-06-10');

-- --------------------------------------------------------

--
-- Table structure for table `aid_items`
--

CREATE TABLE `aid_items` (
  `id` int(11) NOT NULL,
  `request_id` int(10) UNSIGNED DEFAULT NULL,
  `item_no` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `md_approval_required_or_not` varchar(50) DEFAULT 'No',
  `md_approval_obtained` varchar(50) DEFAULT 'No',
  `md_approval_details` text DEFAULT NULL,
  `CTM_approval_obtained` varchar(50) DEFAULT NULL,
  `CTM_Details` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `aid_items`
--

INSERT INTO `aid_items` (`id`, `request_id`, `item_no`, `description`, `quantity`, `remark`, `md_approval_required_or_not`, `md_approval_obtained`, `md_approval_details`, `CTM_approval_obtained`, `CTM_Details`) VALUES
(1, 1, 2, 'Multimedia projector', 1, 'aa', 'No', 'No', NULL, '-', '-'),
(2, 2, 3, 'Classroom', 1, 'dd', 'No', 'No', NULL, 'Yes', '-ddd'),
(3, 3, 1, 'Auditorium', 1, 'kkk', 'No', 'No', 'kkkk', '-', '-');

-- --------------------------------------------------------

--
-- Table structure for table `aid_requests`
--

CREATE TABLE `aid_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `requesting_officer_name` varchar(255) NOT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `requesting_officer_email` varchar(255) NOT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `audience_type` varchar(255) DEFAULT NULL,
  `no_of_participants` int(11) DEFAULT 0,
  `course_coordinator` varchar(255) DEFAULT NULL,
  `preferred_days_of_week` varchar(255) DEFAULT NULL,
  `date_from` date DEFAULT NULL,
  `date_to` date DEFAULT NULL,
  `time_from` time DEFAULT NULL,
  `time_to` time DEFAULT NULL,
  `signed_date` date DEFAULT NULL,
  `paid_course_or_not` varchar(50) DEFAULT 'No',
  `payment_status` varchar(100) DEFAULT 'Not Set',
  `request_status` varchar(100) DEFAULT 'pending',
  `classrooms_allocated` text DEFAULT NULL,
  `exam_or_not` varchar(50) DEFAULT 'No',
  `cancelled_by_requester` varchar(50) DEFAULT 'No',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `aid_requests`
--

INSERT INTO `aid_requests` (`id`, `requesting_officer_name`, `designation`, `requesting_officer_email`, `course_name`, `duration`, `audience_type`, `no_of_participants`, `course_coordinator`, `preferred_days_of_week`, `date_from`, `date_to`, `time_from`, `time_to`, `signed_date`, `paid_course_or_not`, `payment_status`, `request_status`, `classrooms_allocated`, `exam_or_not`, `cancelled_by_requester`, `created_at`, `last_updated`) VALUES
(1, 'Kashika', 'IT', 'kashikabanu@gmail.com', 'Mobile Crane Operator', '30', 'Internal (SLPA)', 20, 'Lenal', 'Tue', '2025-06-10', '2025-07-10', '09:00:00', '13:00:00', '2025-06-10', 'Yes', 'Paid', 'Approved', 'Auditorium,Class 31 (30)', 'Yes', 'No', '2025-06-08 07:37:57', '2025-06-12 10:44:38'),
(2, 'kashika', 'it', 'kashikabanu@gmail.com', 'Motor Control Circuits', 'it', 'Internal (SLPA)', 10, 'LENAL', 'Tue,Sat', '2025-06-19', '2025-06-28', '12:00:00', '15:00:00', '2025-06-12', 'Yes', 'pending', 'pending', 'Class 26 (30)', 'No', 'No', '2025-06-08 07:47:31', '2025-06-08 07:47:31'),
(3, 'Kashika', 'CTM', 'Kashikabanu@gmail.com', 'Proficiency in Elementary First Aid', '19 days', 'Internal (SLPA)', 10, 'LENAL', 'Tue,Sun,Mon', '2025-06-12', '2025-06-30', '10:00:00', '14:00:00', '2025-06-19', 'Yes', 'pending', 'pending', 'Class 27 (24)', 'No', 'No', '2025-06-12 08:54:52', '2025-06-12 08:54:52');

-- --------------------------------------------------------

--
-- Table structure for table `aid_request_emails`
--

CREATE TABLE `aid_request_emails` (
  `id` int(11) NOT NULL,
  `request_id` int(10) UNSIGNED NOT NULL,
  `email_type` enum('approval','denial') NOT NULL,
  `email_address` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `sent_status` enum('success','failed') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `aid_request_emails`
--

INSERT INTO `aid_request_emails` (`id`, `request_id`, `email_type`, `email_address`, `subject`, `body`, `sent_status`, `error_message`, `sent_at`) VALUES
(1, 1, 'approval', 'kashikabanu@gmail.com', 'Classroom Booking Request Approved', '\nDear Kashika (IT),\n\nYour classroom booking request (Request ID: 1) for the course \"Mobile Crane Operator\" has been approved.\n\nDetails of your request:\n- Duration: 30\n- Audience Type: Internal (SLPA)\n- Number of Participants: 20\n- Course Coordinator: Lenal\n- Preferred Days: Tue\n- Date Range: 2025-06-10 to 2025-07-10\n- Time: 09:00:00 to 13:00:00\n- Paid Course: Yes\n- Payment Status: Paid\n- Exam or Not: Yes\n- Cancelled by Requester: Yes\n- Classrooms Requested: Auditorium, Class 31 (30)\n- Classes Allocated: N/A\n\n\nRequested Aid Items:\n  2. Multimedia projector - Qty: 1 (aa)\n\nIf you have any questions or concerns, please contact the admin team.\n\nRegards,\nAdmin Team\n      ', 'failed', 'Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor d9443c01a7336-236032fcce1sm35925385ad.137 - gsmtp', '2025-06-08 07:45:01'),
(2, 1, 'approval', 'kashikabanu@gmail.com', 'Classroom Booking Request Approved', '\nDear Kashika (IT),\n\nYour classroom booking request (Request ID: 1) for the course \"Mobile Crane Operator\" has been approved.\n\nDetails of your request:\n- Duration: 30\n- Audience Type: Internal (SLPA)\n- Number of Participants: 20\n- Course Coordinator: Lenal\n- Preferred Days: Tue\n- Date Range: 2025-06-10 to 2025-07-10\n- Time: 09:00:00 to 13:00:00\n- Paid Course: Yes\n- Payment Status: Paid\n- Exam or Not: Yes\n- Cancelled by Requester: Yes\n- Classrooms Requested: Auditorium, Class 31 (30)\n- Classes Allocated: Class 26 (30)\n\n\nRequested Aid Items:\n  2. Multimedia projector - Qty: 1 (aa)\n\nIf you have any questions or concerns, please contact the admin team.\n\nRegards,\nAdmin Team\n      ', 'failed', 'Invalid login: 534-5.7.9 Application-specific password required. For more information, go to\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor 98e67ed59e1d1-3134b044ef2sm3732693a91.3 - gsmtp', '2025-06-08 07:50:00'),
(3, 1, 'approval', 'kashikabanu@gmail.com', 'Classroom Booking Request Approved', '\nDear Kashika (IT),\n\nYour classroom booking request (Request ID: 1) for the course \"Mobile Crane Operator\" has been approved.\n\nDetails of your request:\n- Duration: 30\n- Audience Type: Internal (SLPA)\n- Number of Participants: 20\n- Course Coordinator: Lenal\n- Preferred Days: Tue\n- Date Range: 2025-06-10 to 2025-07-10\n- Time: 09:00:00 to 13:00:00\n- Paid Course: Yes\n- Payment Status: Paid\n- Exam or Not: Yes\n- Cancelled by Requester: Yes\n- Classrooms Requested: Auditorium, Class 31 (30)\n- Classes Allocated: Class 26 (30), Class 33 (30)\n\n\nRequested Aid Items:\n  2. Multimedia projector - Qty: 1 (aa)\n\nIf you have any questions or concerns, please contact the admin team.\n\nRegards,\nAdmin Team\n      ', 'success', NULL, '2025-06-12 10:40:03'),
(4, 1, 'approval', 'kashikabanu@gmail.com', 'Classroom Booking Request Approved', '\nDear Kashika (IT),\n\nYour classroom booking request (Request ID: 1) for the course \"Mobile Crane Operator\" has been approved.\n\nDetails of your request:\n- Duration: 30\n- Audience Type: Internal (SLPA)\n- Number of Participants: 20\n- Course Coordinator: Lenal\n- Preferred Days: Tue\n- Date Range: 2025-06-10 to 2025-07-10\n- Time: 09:00:00 to 13:00:00\n- Paid Course: Yes\n- Payment Status: Paid\n- Exam or Not: Yes\n- Cancelled by Requester: Yes\n- Classrooms Requested: Auditorium, Class 31 (30)\n- Classes Allocated: Class 26 (30), Class 33 (30)\n\nCancelled Dates:\n  - 2025-06-20\n\nRequested Aid Items:\n  2. Multimedia projector - Qty: 1 (aa)\n\nIf you have any questions or concerns, please contact the admin team.\n\nRegards,\nAdmin Team\n      ', 'success', NULL, '2025-06-12 10:45:02');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `priority` enum('low','normal','medium','high','urgent') DEFAULT 'normal',
  `is_published` tinyint(1) DEFAULT 0,
  `publish_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `batch_id`, `lecturer_id`, `title`, `content`, `priority`, `is_published`, `publish_date`, `created_at`, `updated_at`) VALUES
(1, 1, 9, 'Midterm Exam Schedule', 'The midterm examination will be held on March 15th, 2024. Please review all materials covered so far.', 'high', 1, '2024-03-01 09:00:00', '2025-07-02 16:07:28', '2025-07-02 16:07:28'),
(2, 2, 7, 'Guest Lecture on NoSQL', 'We will have a special guest lecture on NoSQL databases next week. Attendance is mandatory.', 'medium', 1, '2024-03-05 10:00:00', '2025-07-02 16:07:28', '2025-07-02 16:07:28'),
(3, 3, 6, 'Project Submission Guidelines', 'Please ensure your final projects follow the submission guidelines posted in the materials section.', 'medium', 1, '2024-03-10 14:00:00', '2025-07-02 16:07:28', '2025-07-02 16:07:28'),
(4, 1, 9, 'yooo wattup', 'dddedit', 'normal', 1, '2025-07-10 08:28:30', '2025-07-10 02:58:30', '2025-07-10 03:17:21'),
(6, 1, 9, 'test', 'jdadad', 'high', 1, '2025-07-10 09:19:23', '2025-07-10 03:49:23', '2025-07-10 03:49:23'),
(7, 8, 9, 'yooo sun', 'sasa', 'medium', 1, '2025-07-10 18:28:50', '2025-07-10 12:58:50', '2025-07-10 12:58:50');

--
-- Triggers `announcements`
--
DELIMITER $$
CREATE TRIGGER `update_batch_announcements_count` AFTER INSERT ON `announcements` FOR EACH ROW BEGIN
  UPDATE batches 
  SET announcements_count = (
    SELECT COUNT(*) FROM announcements WHERE batch_id = NEW.batch_id
  )
  WHERE id = NEW.batch_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `instructions` text DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `max_marks` decimal(5,2) DEFAULT 100.00,
  `assignment_type` enum('individual','group','project','quiz') DEFAULT 'individual',
  `status` enum('draft','published','closed') DEFAULT 'draft',
  `submission_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`id`, `batch_id`, `lecturer_id`, `title`, `description`, `instructions`, `due_date`, `max_marks`, `assignment_type`, `status`, `submission_count`, `created_at`, `updated_at`) VALUES
(1, 1, 9, 'Build a Todo App', 'Create a fully functional todo application using vanilla JavaScript', NULL, '2024-02-15 23:59:00', 100.00, 'individual', 'published', 0, '2025-07-02 16:06:28', '2025-07-02 16:06:28'),
(2, 2, 6, 'Database Design Project', 'Design and implement a normalized database for an e-commerce system', NULL, '2024-03-01 23:59:00', 150.00, 'individual', 'published', 0, '2025-07-02 16:06:28', '2025-07-02 16:06:28'),
(3, 3, 7, 'Responsive Portfolio Website', 'Build a responsive portfolio website using HTML, CSS, and JavaScript', NULL, '2024-04-01 23:59:00', 120.00, 'individual', 'published', 0, '2025-07-02 16:06:28', '2025-07-02 16:06:28'),
(4, 1, 9, 'TEST1', 'assesmentedit', NULL, '2025-07-29 13:00:00', 100.00, 'individual', 'published', 0, '2025-07-10 02:56:45', '2025-07-10 03:16:55'),
(5, 8, 9, 'testbatch', 'sasas', NULL, '2025-07-31 18:28:00', 15.00, 'individual', 'published', 0, '2025-07-10 12:58:40', '2025-07-10 12:58:40'),
(6, 8, 9, 'MWD', 'SSSSS', NULL, '2025-07-12 09:39:00', 60.00, 'individual', 'published', 0, '2025-07-11 09:38:19', '2025-07-11 09:39:47'),
(7, 8, 9, 'kkk', 'kkk', NULL, '2025-07-23 15:40:00', 100.00, 'individual', 'published', 0, '2025-07-11 10:07:20', '2025-07-11 10:07:20');

--
-- Triggers `assignments`
--
DELIMITER $$
CREATE TRIGGER `update_batch_assignments_count` AFTER INSERT ON `assignments` FOR EACH ROW BEGIN
  UPDATE batches 
  SET assignments_count = (
    SELECT COUNT(*) FROM assignments WHERE batch_id = NEW.batch_id
  )
  WHERE id = NEW.batch_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `assignment_grades`
--

CREATE TABLE `assignment_grades` (
  `id` int(11) NOT NULL,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `marks_obtained` decimal(5,2) NOT NULL,
  `max_marks` decimal(5,2) NOT NULL,
  `percentage` decimal(5,2) GENERATED ALWAYS AS (`marks_obtained` / `max_marks` * 100) STORED,
  `grade` varchar(5) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `graded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignment_submissions`
--

CREATE TABLE `assignment_submissions` (
  `id` int(11) NOT NULL,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp(),
  `marks_obtained` decimal(10,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `graded_by` int(11) DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `attempt_number` int(11) DEFAULT 1,
  `status` enum('Submitted','Late','Graded','Returned','Resubmitted') DEFAULT 'Submitted',
  `group_submission_id` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `file_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignment_submissions`
--

INSERT INTO `assignment_submissions` (`id`, `assignment_id`, `student_id`, `submission_text`, `file_path`, `submitted_at`, `marks_obtained`, `feedback`, `graded_by`, `graded_at`, `attempt_number`, `status`, `group_submission_id`, `created_at`, `updated_at`, `file_name`) VALUES
(1, 5, 15, 'sasasa', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/assignments/student_15/assignment_5_1752217739270-Security_-_My_Account_Panel_-_Namecheap.com.pdf', '2025-07-11 12:38:59', 10.50, 'Great', 1, '2025-07-11 12:56:16', 1, 'Submitted', NULL, '2025-07-11 12:20:12', '2025-07-11 12:56:16', 'Security - My Account Panel - Namecheap.com.pdf'),
(2, 6, 15, 'IAMAGEGEEE', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/assignments/student_15/assignment_6_1752227616165-MPMA.png', '2025-07-11 15:23:36', NULL, NULL, NULL, NULL, 1, 'Submitted', NULL, '2025-07-11 15:10:25', '2025-07-11 15:23:36', 'MPMA.png'),
(3, 7, 15, 'kkkk', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/assignments/student_15/assignment_7_1752228469967-alpa.jpg', '2025-07-11 15:37:49', NULL, NULL, NULL, NULL, 1, 'Submitted', NULL, '2025-07-11 15:37:49', '2025-07-11 15:37:49', 'alpa.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `module_id` int(11) DEFAULT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `status` enum('Present','Absent','Late','Excused','Holiday') NOT NULL,
  `remarks` text DEFAULT NULL,
  `marked_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `batches`
--

CREATE TABLE `batches` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `batch_name` varchar(100) NOT NULL,
  `capacity` int(11) DEFAULT 30,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Upcoming','Active','Completed','Cancelled') DEFAULT 'Upcoming',
  `location` varchar(255) DEFAULT NULL,
  `schedule` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lecturer_id` int(11) DEFAULT NULL,
  `batch_code` varchar(50) DEFAULT NULL,
  `max_students` int(11) DEFAULT 30,
  `description` text DEFAULT NULL,
  `materials_count` int(11) DEFAULT 0,
  `assignments_count` int(11) DEFAULT 0,
  `announcements_count` int(11) DEFAULT 0,
  `students_count` int(11) DEFAULT 0,
  `completion_percentage` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `batches`
--

INSERT INTO `batches` (`id`, `course_id`, `batch_name`, `capacity`, `start_date`, `end_date`, `status`, `location`, `schedule`, `created_at`, `updated_at`, `lecturer_id`, `batch_code`, `max_students`, `description`, `materials_count`, `assignments_count`, `announcements_count`, `students_count`, `completion_percentage`) VALUES
(1, 2, 'KS25/05MP', 30, '2025-06-01', '2025-06-30', 'Upcoming', NULL, NULL, '2025-06-01 14:38:25', '2025-07-10 18:17:38', 9, '', 30, NULL, 4, 2, 3, 2, 0.00),
(2, 1, 'KS25/05MP', 50, '2025-06-12', '2025-07-11', 'Upcoming', NULL, NULL, '2025-06-03 22:55:59', '2025-07-10 08:12:57', 9, '', 30, NULL, 1, 1, 1, 0, 0.00),
(3, 1, 'TESTLOG/12', 30, '2025-06-11', '2025-06-11', 'Upcoming', NULL, NULL, '2025-06-03 22:56:28', '2025-07-10 08:12:57', 9, '', 30, NULL, 1, 1, 1, 0, 0.00),
(5, 3, 'LOG/68/LK', 20, '2025-06-10', '2025-06-30', 'Upcoming', 'Srilanka', '', '2025-06-07 13:13:08', '2025-07-10 08:12:57', 9, '', 30, NULL, 0, 0, 0, 2, 0.00),
(6, 3, 'TESTLOG/12', 30, '2025-02-07', '2025-08-07', 'Upcoming', 'Srilanka', '', '2025-06-07 14:42:30', '2025-07-10 08:12:57', 9, '', 30, NULL, 0, 0, 0, 1, 0.00),
(7, 3, 'TESTLOG/12/1', 30, '2025-05-07', '2026-07-07', 'Upcoming', 'Srilanka', '', '2025-06-07 14:43:21', '2025-07-10 08:12:57', 9, '', 30, NULL, 0, 0, 0, 1, 0.00),
(8, 2, 'KS25/07MPMA', 150, '2025-07-01', '2025-12-31', 'Upcoming', 'ComputerLab', 'Monday', '2025-07-10 18:25:16', '2025-07-11 15:37:20', NULL, NULL, 30, NULL, 3, 3, 1, 3, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `batch_materials`
--

CREATE TABLE `batch_materials` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `material_type` enum('lecture','assignment','quiz','reference','other') DEFAULT 'lecture',
  `is_active` tinyint(1) DEFAULT 1,
  `upload_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `batch_materials`
--

INSERT INTO `batch_materials` (`id`, `batch_id`, `lecturer_id`, `title`, `description`, `file_name`, `file_path`, `file_size`, `file_type`, `material_type`, `is_active`, `upload_date`, `created_at`, `updated_at`) VALUES
(5, 1, 6, 'Async Programming Assignment', 'Practice exercises for promises and async/await', NULL, NULL, NULL, NULL, 'assignment', 1, '2025-07-02 16:06:28', '2025-07-10 02:42:57', '2025-07-02 16:06:28'),
(6, 2, 7, 'SQL Query Optimization', 'Advanced techniques for optimizing database queries', NULL, NULL, NULL, NULL, 'lecture', 1, '2025-07-02 16:06:28', '2025-07-10 02:42:57', '2025-07-02 16:06:28'),
(7, 3, 8, 'HTML5 & CSS3 Fundamentals', 'Modern web markup and styling techniques', NULL, NULL, NULL, NULL, 'lecture', 1, '2025-07-02 16:06:28', '2025-07-10 02:42:57', '2025-07-02 16:06:28'),
(14, 1, 9, 'ss', 'ss', 'MPMA.png', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1752151542110-580128347-MPMA.png', 270645, 'image/png', 'lecture', 1, '2025-07-10 12:45:42', '2025-07-10 12:45:42', '2025-07-10 12:45:42'),
(15, 1, 9, 'testpdf', 'taas', 'DIP Project.pdf', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1752151589342-727485288-DIP Project.pdf', 112471, 'application/pdf', 'lecture', 1, '2025-07-10 12:46:29', '2025-07-10 12:46:29', '2025-07-10 12:46:29'),
(16, 1, 9, 'testsasa', 'assa', 'Security - My Account Panel - Namecheap.com.pdf', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1752151658925-84521798-Security - My Account Panel - Namecheap.com.pdf', 47472, 'application/pdf', 'lecture', 1, '2025-07-10 12:47:38', '2025-07-10 12:47:38', '2025-07-10 12:47:38'),
(17, 8, 9, 'testbatch', 'sasa', 'MPMA (2).png', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1752152269101-672366184-MPMA (2).png', 102465, 'image/png', 'lecture', 1, '2025-07-10 12:57:49', '2025-07-10 12:57:49', '2025-07-10 12:57:49'),
(18, 8, 10, 'testlenal', 'adad', 'hair.jpg', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1752153038516-797362058-hair.jpg', 279990, 'image/jpeg', 'lecture', 1, '2025-07-10 13:10:38', '2025-07-10 13:10:38', '2025-07-10 13:10:38'),
(19, 8, 9, 'testactivity', 'test', 'hair.jpg', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1752209463959-997680771-hair.jpg', 279990, 'image/jpeg', 'lecture', 1, '2025-07-11 04:51:03', '2025-07-11 04:51:03', '2025-07-11 04:51:03');

--
-- Triggers `batch_materials`
--
DELIMITER $$
CREATE TRIGGER `update_batch_materials_count` AFTER INSERT ON `batch_materials` FOR EACH ROW BEGIN
  UPDATE batches 
  SET materials_count = (
    SELECT COUNT(*) FROM batch_materials WHERE batch_id = NEW.batch_id AND is_active = 1
  )
  WHERE id = NEW.batch_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `batch_overview`
-- (See below for the actual view)
--
CREATE TABLE `batch_overview` (
`id` int(11)
,`batch_name` varchar(100)
,`start_date` date
,`end_date` date
,`status` enum('Upcoming','Active','Completed','Cancelled')
,`students_count` int(11)
,`materials_count` int(11)
,`assignments_count` int(11)
,`announcements_count` int(11)
,`courseName` varchar(255)
,`courseId` varchar(50)
,`lecturer_name` varchar(255)
,`lecturer_email` varchar(255)
);

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `booking_date` date DEFAULT NULL,
  `booking_time` time DEFAULT NULL,
  `bookingendtime` time DEFAULT NULL,
  `no_of_people` int(11) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','DENIED') DEFAULT 'PENDING',
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `booking_date`, `booking_time`, `bookingendtime`, `no_of_people`, `status`, `description`) VALUES
(130, 43, '2025-04-12', '01:30:00', '03:30:00', 100, 'DENIED', 'Test'),
(131, 43, '2025-04-23', '01:30:00', '03:30:00', 100, 'APPROVED', 'Test'),
(133, 68, '2025-05-07', '02:30:00', '05:30:00', 100, 'PENDING', 'Kashika'),
(134, 43, '2025-05-02', '01:00:00', '06:30:00', 1, 'PENDING', 'ff'),
(137, 43, '2025-04-29', '01:00:00', '04:30:00', 10, 'APPROVED', 'kkk'),
(138, 43, '2025-05-12', '02:30:00', '06:00:00', 100, 'DENIED', 'kkk'),
(139, 52, '2025-04-27', '01:00:00', '03:00:00', 100, 'APPROVED', 'Test'),
(140, 43, '2025-04-25', '02:00:00', '05:00:00', 100, 'APPROVED', 'KASHIKA'),
(141, 52, '2025-05-03', '01:30:00', '03:30:00', 1, 'APPROVED', 'Kahika'),
(144, 52, '2025-04-20', '00:30:00', '01:30:00', 1, 'PENDING', 'Test'),
(146, 43, '2025-04-26', '01:30:00', '04:00:00', 100, 'PENDING', 'Test'),
(148, 43, '2025-04-24', '00:30:00', '04:00:00', 100, 'PENDING', 'TEST'),
(149, 43, '2025-04-23', '05:30:00', '12:30:00', 12, 'APPROVED', 'traing'),
(150, 43, '2025-04-30', '09:00:00', '17:30:00', 100, 'PENDING', 'Test\n'),
(152, 43, '2025-04-25', '01:30:00', '05:00:00', 100, 'PENDING', 'Testapi'),
(153, 43, '2025-04-27', '00:30:00', '02:30:00', 5, 'APPROVED', 'TEST%$'),
(154, 43, '2025-04-26', '18:30:00', '20:00:00', 1, 'PENDING', 'yyyy'),
(157, 43, '2025-05-23', '00:30:00', '02:00:00', 100, 'PENDING', 'TEST'),
(158, 43, '2025-05-10', '01:30:00', '05:00:00', 100, 'PENDING', 'KKK'),
(159, 43, '2025-05-23', '00:00:00', '00:30:00', 100, 'DENIED', '30m booking'),
(160, 43, '2025-05-10', '00:00:00', '01:30:00', 100, 'PENDING', '1.30mm'),
(161, 43, '2025-05-28', '04:00:00', '13:30:00', 100, 'PENDING', 'TEST'),
(162, 43, '2025-05-16', '01:30:00', '04:00:00', 100, 'APPROVED', 'TEST'),
(163, 43, '2025-05-24', '01:00:00', '02:30:00', 100, 'PENDING', 'TEST13'),
(164, 43, '2025-05-23', '08:30:00', '20:00:00', 100, 'PENDING', 'TEST8.00PM\n'),
(165, 43, '2025-05-23', '01:30:00', '04:00:00', 100, 'PENDING', 'TEST/23'),
(166, 43, '2025-05-21', '15:00:00', '17:30:00', 100, 'PENDING', 'TESTNEW'),
(167, 43, '2025-05-15', '15:00:00', '17:30:00', 10, 'PENDING', 'TEST/15'),
(168, 43, '2025-05-17', '15:00:00', '16:00:00', 100, 'PENDING', 'KASHIKA'),
(169, 43, '2025-05-24', '16:00:00', '19:00:00', 100, 'PENDING', 'TESTPOPUP'),
(170, 43, '2025-05-15', '20:00:00', '21:00:00', 100, 'PENDING', 'REER'),
(171, 43, '2025-07-04', '08:30:00', '14:00:00', 100, 'PENDING', 'TEST/07/04\n'),
(172, 43, '2025-05-19', '02:00:00', '07:30:00', 100, 'APPROVED', 'TEST\n'),
(173, 43, '2025-05-20', '01:00:00', '03:00:00', 100, 'PENDING', 'TEST'),
(174, 43, '2025-05-23', '17:00:00', '20:00:00', 100, 'PENDING', 'TEEEE'),
(175, 43, '2025-05-22', '22:00:00', '23:00:00', 9, 'PENDING', 'TEST9'),
(176, 43, '2025-05-24', '01:00:00', '02:30:00', 100, 'PENDING', 'Tokentest\n'),
(177, 43, '2025-06-11', '04:30:00', '06:30:00', 120, 'APPROVED', 'TEST67'),
(178, 43, '2025-06-18', '18:00:00', '19:00:00', 1, 'APPROVED', 'TEST'),
(179, 43, '2025-06-18', '20:00:00', '21:00:00', 10, 'DENIED', 'TEST'),
(180, 43, '2025-06-21', '22:00:00', '23:00:00', 1, 'PENDING', 'tt'),
(181, 43, '2025-06-19', '08:00:00', '09:00:00', 1, 'PENDING', 'testcontainer'),
(182, 43, '2025-06-27', '14:00:00', '18:00:00', 20, 'DENIED', 'NESHA_TEST\n'),
(183, 43, '2025-06-18', '11:00:00', '12:00:00', 100, 'PENDING', 'test'),
(184, 52, '2025-06-12', '14:00:00', '15:00:00', 1, 'DENIED', 'testbooking '),
(185, 75, '2025-07-25', '11:00:00', '14:00:00', 1, 'PENDING', 'KASHIKA/TEST');

-- --------------------------------------------------------

--
-- Table structure for table `busBooking`
--

CREATE TABLE `busBooking` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `fromPlace` varchar(255) NOT NULL,
  `toPlace` varchar(255) NOT NULL,
  `travelDate` date NOT NULL,
  `ReturnDate` date NOT NULL,
  `forWho` text DEFAULT NULL,
  `ContactNo` text NOT NULL,
  `status` enum('PENDING','APPROVED','DENIED') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `busBooking`
--

INSERT INTO `busBooking` (`id`, `user_id`, `fromPlace`, `toPlace`, `travelDate`, `ReturnDate`, `forWho`, `ContactNo`, `status`) VALUES
(45, 57, 'Colombo', 'Kandy', '2025-04-09', '2025-04-16', 'Test', 'Kashikabanu@gmail.com', 'APPROVED'),
(58, 43, 'Colombo', 'Kandy', '2025-05-22', '2025-05-28', 'Kashika', '0717373756', 'DENIED'),
(66, 43, 'Colombo', 'Dehiwala-Mount Lavinia', '2025-05-07', '2025-05-14', 'Kashika', '0717373756', 'APPROVED'),
(67, 43, 'Colombo', 'Negombo', '2025-04-18', '2025-04-18', 'Test', '0762841381', 'APPROVED'),
(68, 43, 'Colombo', 'Kandy', '2025-05-07', '2025-06-05', 'Kashika', '0717373756', 'APPROVED'),
(69, 66, 'Colombo', 'Negombo', '2025-04-14', '2025-04-15', 'Sirr', '0717373756', 'PENDING'),
(71, 43, 'Colombo', 'Kandy', '2025-05-02', '2025-06-06', 'Kashika', '0717373756', 'APPROVED'),
(72, 43, 'Colombo', 'Moratuwa', '2025-05-01', '2025-05-20', 'test', 'test', 'PENDING'),
(73, 43, 'Colombo', 'Sri Jayawardenepura Kotte', '2025-05-09', '2025-06-03', 'test', 'test', 'PENDING'),
(74, 43, 'Colombo', 'Dehiwala-Mount Lavinia', '2025-04-22', '2025-04-25', 'Test', 'Test', 'APPROVED'),
(75, 43, 'Colombo', 'Sri Jayawardenepura Kotte', '2025-04-24', '2025-04-24', 'kashika', '0717373756', 'PENDING'),
(76, 43, 'Colombo', 'Sri Jayawardenepura Kotte', '2025-04-24', '2025-04-25', 'testapi', '1013139', 'APPROVED'),
(79, 43, 'Colombo', 'Marawila', '2025-04-26', '2025-04-27', 'Kashika', 'TestNewDestination', 'DENIED'),
(80, 43, 'Colombo', 'Marawila', '2025-04-28', '2025-04-29', 'Kashika', 'TestNewDestination', 'APPROVED'),
(81, 1, 'Colombo', 'Kandy', '2025-05-08', '2025-05-09', 'test', 'test', 'PENDING'),
(82, 43, 'Colombo', 'Matara', '2025-05-22', '2025-05-23', 'KAshika', '0717373756', 'APPROVED'),
(83, 43, 'Colombo', 'Galle', '2025-05-24', '2025-05-30', 'tets', '0717373756', 'PENDING'),
(84, 43, 'Colombo', 'Matara', '2025-05-31', '2025-06-01', 'kashika', '82919212121', 'PENDING'),
(85, 43, 'Colombo', 'Kandy', '2025-05-22', '2025-05-23', 'Kashika', '0717373756', 'PENDING'),
(86, 43, 'Colombo', 'Kandy', '2025-06-10', '2025-06-20', 'KASHIKA', '0717373756', 'PENDING');

-- --------------------------------------------------------

--
-- Table structure for table `classroom_booking_calendar`
--

CREATE TABLE `classroom_booking_calendar` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `request_id` int(10) UNSIGNED DEFAULT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `time_from` time NOT NULL,
  `time_to` time NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `preferred_days_of_week` varchar(255) DEFAULT NULL,
  `classes_allocated` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classroom_booking_calendar`
--

INSERT INTO `classroom_booking_calendar` (`id`, `user_id`, `request_id`, `date_from`, `date_to`, `time_from`, `time_to`, `course_name`, `preferred_days_of_week`, `classes_allocated`, `created_at`) VALUES
(1, 43, 1, '2025-06-10', '2025-07-11', '10:00:00', '14:30:00', 'Proficiency in Fire Prevention & Fire Fighting', 'Wed, Sat', 'Class 26 (30)', '2025-06-08 07:48:21'),
(2, 43, 1, '2025-06-20', '2025-06-25', '14:00:00', '15:30:00', 'Proficiency in Elementary First Aid', 'Thu, Fri', 'Class 33 (30)', '2025-06-12 10:37:10');

-- --------------------------------------------------------

--
-- Table structure for table `classroom_booking_dates`
--

CREATE TABLE `classroom_booking_dates` (
  `id` int(11) NOT NULL,
  `calendar_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `request_id` int(10) UNSIGNED DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `all_dates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`all_dates`)),
  `time_from` time NOT NULL,
  `time_to` time NOT NULL,
  `classes_allocated` text DEFAULT NULL,
  `cancel_dates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cancel_dates`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classroom_booking_dates`
--

INSERT INTO `classroom_booking_dates` (`id`, `calendar_id`, `user_id`, `request_id`, `course_name`, `all_dates`, `time_from`, `time_to`, `classes_allocated`, `cancel_dates`, `created_at`) VALUES
(1, 1, 43, 1, 'Proficiency in Fire Prevention & Fire Fighting', '[\"2025-06-11\"]', '10:00:00', '14:30:00', 'Class 26 (30)', '[\"2025-06-20\"]', '2025-06-08 07:48:21'),
(2, 2, 43, 1, 'Proficiency in Elementary First Aid', '[\"2025-06-20\"]', '14:00:00', '15:30:00', 'Class 33 (30)', '[]', '2025-06-12 10:37:10');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `courseId` varchar(50) NOT NULL,
  `stream` varchar(100) NOT NULL,
  `courseName` varchar(255) NOT NULL,
  `medium` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`medium`)),
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`location`)),
  `assessmentCriteria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`assessmentCriteria`)),
  `resources` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`resources`)),
  `fees` decimal(10,2) NOT NULL,
  `registrationFee` decimal(10,2) NOT NULL,
  `installment1` decimal(10,2) DEFAULT NULL,
  `installment2` decimal(10,2) DEFAULT NULL,
  `additionalInstallments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additionalInstallments`)),
  `description` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive','Pending','Completed') DEFAULT 'Active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `user_id`, `courseId`, `stream`, `courseName`, `medium`, `location`, `assessmentCriteria`, `resources`, `fees`, `registrationFee`, `installment1`, `installment2`, `additionalInstallments`, `description`, `start_date`, `end_date`, `duration`, `status`, `created_at`, `updated_at`) VALUES
(1, 43, 'KS189CA', 'TEST', 'Information Tec', '[\"English\",\"Sinhala\"]', '[\"Online\"]', '[\"Theory\"]', '[\"Yard\",\"Onboard\"]', 30000.00, 2000.00, 0.00, 0.00, '[]', 'test', NULL, NULL, '', 'Active', '2025-05-30 10:34:18', '2025-06-01 07:39:16'),
(2, 43, 'KS189C', 'MARITIME', 'Computer Science ', '[\"English\"]', '[\"ComputerLab\",\"ClassRoom\"]', '[\"Theory\"]', '[\"Yard\",\"Onboard\"]', 20000.00, 2000.00, 0.00, 0.00, '[]', 'Cozy room with a beautiful view', '2025-05-01', '2026-01-06', '251 days', 'Active', '2025-05-30 10:50:51', '2025-06-01 14:35:58'),
(3, 43, 'KS191CA', 'IT', 'Logistics Management', '[\"English\"]', '[\"ComputerLab\",\"Online\"]', '[\"Theory\",\"Assignment\"]', '[\"Yard\",\"Vehicle\"]', 40000.00, 1000.00, 30000.00, 9000.00, '[]', 'TEST', NULL, NULL, '19 days', 'Active', '2025-06-07 13:11:04', '2025-06-07 13:11:04');

-- --------------------------------------------------------

--
-- Table structure for table `course_assignments`
--

CREATE TABLE `course_assignments` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `assignment_type` enum('Assignment','Quiz','Exam','Project','Presentation') NOT NULL,
  `total_marks` decimal(10,2) DEFAULT 100.00,
  `passing_marks` decimal(10,2) DEFAULT 50.00,
  `due_date` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `attempts_allowed` int(11) DEFAULT 1,
  `instructions` text DEFAULT NULL,
  `resources` text DEFAULT NULL,
  `is_group_assignment` tinyint(1) DEFAULT 0,
  `max_group_size` int(11) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `status` enum('Draft','Published','Closed','Graded') DEFAULT 'Draft',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_materials`
--

CREATE TABLE `course_materials` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `material_type` enum('PDF','Video','Document','Link','Other') NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_url` text DEFAULT NULL,
  `file_size` bigint(20) DEFAULT 0,
  `duration_minutes` int(11) DEFAULT NULL,
  `is_downloadable` tinyint(1) DEFAULT 1,
  `uploaded_by` int(11) NOT NULL,
  `views_count` int(11) DEFAULT 0,
  `downloads_count` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_modules`
--

CREATE TABLE `course_modules` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `module_name` varchar(255) NOT NULL,
  `module_code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sequence_order` int(11) DEFAULT 0,
  `duration_hours` int(11) DEFAULT 0,
  `is_mandatory` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `status` enum('Draft','Published','Archived') DEFAULT 'Draft',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_payments`
--

CREATE TABLE `course_payments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `payment_type` enum('Registration','Installment1','Installment2','Additional','Full') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` datetime NOT NULL,
  `payment_method` enum('Cash','Card','Bank Transfer','Check','Other') NOT NULL,
  `receipt_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discussion_forums`
--

CREATE TABLE `discussion_forums` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `module_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by_type` enum('Student','Lecturer') NOT NULL,
  `created_by_student` int(11) DEFAULT NULL,
  `created_by_lecturer` int(11) DEFAULT NULL,
  `is_pinned` tinyint(1) DEFAULT 0,
  `is_locked` tinyint(1) DEFAULT 0,
  `views_count` int(11) DEFAULT 0,
  `replies_count` int(11) DEFAULT 0,
  `last_activity` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_replies`
--

CREATE TABLE `forum_replies` (
  `id` int(11) NOT NULL,
  `forum_id` int(11) NOT NULL,
  `parent_reply_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `created_by_type` enum('Student','Lecturer') NOT NULL,
  `created_by_student` int(11) DEFAULT NULL,
  `created_by_lecturer` int(11) DEFAULT NULL,
  `is_answer` tinyint(1) DEFAULT 0,
  `upvotes` int(11) DEFAULT 0,
  `edited_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `id` int(11) NOT NULL,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `marks_obtained` decimal(5,2) NOT NULL,
  `max_marks` decimal(5,2) NOT NULL,
  `percentage` decimal(5,2) GENERATED ALWAYS AS (`marks_obtained` / `max_marks` * 100) STORED,
  `grade` varchar(5) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `graded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lecturers`
--

CREATE TABLE `lecturers` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `identification_type` enum('NIC','Passport') DEFAULT 'NIC',
  `id_number` varchar(50) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `cdc_number` varchar(100) DEFAULT NULL,
  `vehicle_number` varchar(100) DEFAULT NULL,
  `nic_file` varchar(255) DEFAULT NULL,
  `photo_file` varchar(255) DEFAULT NULL,
  `driving_trainer_license_file` varchar(255) DEFAULT NULL,
  `other_documents_file` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive','Pending','Completed') DEFAULT 'Active',
  `user_id` int(11) NOT NULL COMMENT 'User who created this record',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `course_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lecturers`
--

INSERT INTO `lecturers` (`id`, `full_name`, `email`, `identification_type`, `id_number`, `date_of_birth`, `address`, `phone`, `category`, `cdc_number`, `vehicle_number`, `nic_file`, `photo_file`, `driving_trainer_license_file`, `other_documents_file`, `status`, `user_id`, `created_at`, `updated_at`, `course_id`) VALUES
(5, 'Thisara Weerasinghe', 'Thisara@nibm.lk', 'NIC', '718403413V', '2025-06-04', 'sss', '0717373755', 'A', NULL, NULL, NULL, NULL, NULL, NULL, 'Active', 43, '2025-06-01 09:08:08', '2025-06-01 09:08:08', NULL),
(6, 'Keshan Narangoda', 'test@gmail.com', NULL, '81941713813V', '2025-06-04', 'kandy', '07183912180', 'B', '824618', '913713912113', NULL, NULL, NULL, NULL, 'Active', 43, '2025-06-01 22:00:36', '2025-06-07 13:13:58', NULL),
(7, 'Chami Perera', 'testmul@gmail.com', NULL, '81941713813V', '2025-06-04', 'sss', '0717373755', 'A', '824618', '49141749131', NULL, NULL, NULL, NULL, 'Active', 43, '2025-06-03 14:37:27', '2025-06-03 20:56:01', NULL),
(8, 'Chandula Rajapaksha', 'chandula@nibm.lk', NULL, '81941713813V', '1997-06-19', '23/7 University Avenue, Colombo', '0771234567', 'B', '975386', '913713912113', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/nic_file-1748956937248.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/photo_file-1748956937252.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/driving_trainer_license_file-1748956937276.png', NULL, 'Active', 43, '2025-06-03 18:52:17', '2025-06-03 20:56:22', NULL),
(9, 'K B S HETTIHEWA', 'kashikabanu@gmail.com', 'NIC', '81941713813V', '1990-06-06', 'Colombo', '0717373756', 'A', '975386', '913713912113', NULL, NULL, NULL, NULL, 'Active', 43, '2025-06-24 08:53:34', '2025-06-24 08:53:34', NULL),
(10, 'Lenal', 'lenalfdo351@gmail.com', 'NIC', '81941713813V', '1996-07-17', 'Colombo', '0717373756', 'A', '824618', '913713912113', NULL, NULL, NULL, NULL, 'Active', 75, '2025-07-09 20:13:36', '2025-07-09 20:13:36', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lecturer_academic_details`
--

CREATE TABLE `lecturer_academic_details` (
  `id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `highest_qualification` varchar(255) DEFAULT NULL,
  `other_qualifications` text DEFAULT NULL,
  `experience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of experience records' CHECK (json_valid(`experience`)),
  `education_certificate_file` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lecturer_academic_details`
--

INSERT INTO `lecturer_academic_details` (`id`, `lecturer_id`, `highest_qualification`, `other_qualifications`, `experience`, `education_certificate_file`, `created_at`, `updated_at`) VALUES
(5, 5, 'sss', 'ss', '[]', NULL, '2025-06-01 09:08:08', '2025-06-01 09:08:08'),
(12, 7, 'asas', 'asas', '\"[{\\\"institution\\\":\\\"IIT\\\",\\\"years\\\":\\\"10\\\",\\\"start\\\":\\\"2015\\\",\\\"end\\\":\\\"2025\\\",\\\"designation\\\":\\\"Director\\\",\\\"nature\\\":\\\"Management\\\"}]\"', NULL, '2025-06-03 20:56:01', '2025-06-03 20:56:01'),
(13, 8, 'PhD in Computer Science', 'MSc Computer Science, BSc IT', '\"[{\\\"institution\\\":\\\"NIBM\\\",\\\"years\\\":\\\"5\\\",\\\"start\\\":\\\"2023\\\",\\\"end\\\":\\\"2025\\\",\\\"designation\\\":\\\"Senior Manager\\\",\\\"nature\\\":\\\"Resourses\\\"}]\"', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/education_certificate_file-1748956937271.png', '2025-06-03 20:56:22', '2025-06-03 20:56:22'),
(14, 6, 'PHD', 'BSc', '\"[{\\\"institution\\\":\\\"NIBM\\\",\\\"years\\\":\\\"20\\\",\\\"start\\\":\\\"2013\\\",\\\"end\\\":\\\"2025\\\",\\\"designation\\\":\\\"Junior Lecturer\\\",\\\"nature\\\":\\\"Management \\\"},{\\\"institution\\\":\\\"SLIIT\\\",\\\"years\\\":\\\"2\\\",\\\"start\\\":\\\"2006\\\",\\\"end\\\":\\\"2013\\\",\\\"designation\\\":\\\"Lecturer\\\",\\\"nature\\\":\\\"Management \\\"}]\"', NULL, '2025-06-07 13:13:58', '2025-06-07 13:13:58'),
(15, 9, 'adad', 'adad', '\"[{\\\"institution\\\":\\\"daada\\\",\\\"years\\\":\\\"12\\\",\\\"start\\\":\\\"adad\\\",\\\"end\\\":\\\"dada\\\",\\\"designation\\\":\\\"dada\\\",\\\"nature\\\":\\\"ada\\\"}]\"', NULL, '2025-06-24 08:53:34', '2025-06-24 08:53:34'),
(16, 10, 'BSc', 'DP', '\"[{\\\"institution\\\":\\\"SLIIT\\\",\\\"years\\\":\\\"10\\\",\\\"start\\\":\\\"2015-01-01\\\",\\\"end\\\":\\\"2025-01-01\\\",\\\"designation\\\":\\\"Director\\\",\\\"nature\\\":\\\"Examing\\\"}]\"', NULL, '2025-07-09 20:13:36', '2025-07-09 20:13:36');

-- --------------------------------------------------------

--
-- Table structure for table `lecturer_bank_details`
--

CREATE TABLE `lecturer_bank_details` (
  `id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) NOT NULL,
  `passbook_file` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lecturer_bank_details`
--

INSERT INTO `lecturer_bank_details` (`id`, `lecturer_id`, `bank_name`, `branch_name`, `account_number`, `passbook_file`, `created_at`, `updated_at`) VALUES
(5, 5, 'People\'s Bank', 'ss', '313131313', NULL, '2025-06-01 09:08:08', '2025-06-01 09:08:08'),
(12, 7, 'Commercial Bank', 'ffff', '313133131311', NULL, '2025-06-03 20:56:01', '2025-06-03 20:56:01'),
(13, 8, 'Hatton National Bank', 'Colombo', '931319313', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/passbook_file-1748956937261.png', '2025-06-03 20:56:22', '2025-06-03 20:56:22'),
(14, 6, 'People\'s Bank', 'Boralesgamuwa', '1313131313', NULL, '2025-06-07 13:13:58', '2025-06-07 13:13:58'),
(15, 9, 'People\'s Bank', 'dadadas', '2121121212', NULL, '2025-06-24 08:53:34', '2025-06-24 08:53:34'),
(16, 10, 'Bank of Ceylon', 'Colombo', '9319310313', NULL, '2025-07-09 20:13:36', '2025-07-09 20:13:36');

-- --------------------------------------------------------

--
-- Table structure for table `lecturer_batches`
--

CREATE TABLE `lecturer_batches` (
  `id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `module` varchar(100) DEFAULT NULL,
  `hours_assigned` int(11) DEFAULT 0,
  `payment_rate` decimal(10,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Assigned','Active','Completed','Cancelled') DEFAULT 'Assigned',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lecturer_batches`
--

INSERT INTO `lecturer_batches` (`id`, `lecturer_id`, `batch_id`, `module`, `hours_assigned`, `payment_rate`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(2, 7, 3, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-06-04 08:22:18', '2025-06-04 08:22:18'),
(6, 6, 5, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-06-07 13:14:40', '2025-06-07 13:14:40'),
(7, 9, 1, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-06-24 09:29:30', '2025-06-24 09:29:30'),
(8, 9, 8, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-07-10 18:26:31', '2025-07-10 18:26:31'),
(9, 10, 8, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-07-10 18:31:17', '2025-07-10 18:31:17');

-- --------------------------------------------------------

--
-- Table structure for table `lecturer_courses`
--

CREATE TABLE `lecturer_courses` (
  `id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `primary_course` tinyint(1) DEFAULT 0,
  `stream` varchar(100) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `assignment_date` date DEFAULT curdate(),
  `status` enum('Active','Completed','Inactive') DEFAULT 'Active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lecturer_courses`
--

INSERT INTO `lecturer_courses` (`id`, `lecturer_id`, `course_id`, `primary_course`, `stream`, `module`, `assignment_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 5, 2, 1, 'it', 'ss', '2025-06-01', 'Active', '2025-06-01 09:08:08', '2025-06-01 09:08:08'),
(10, 7, 1, 1, 'IT', 'Software Engineering ', '2025-06-03', 'Active', '2025-06-03 20:56:01', '2025-06-03 20:56:01'),
(11, 8, 2, 1, 'Engineering', 'CS101', '2025-06-03', 'Active', '2025-06-03 20:56:22', '2025-06-03 20:56:22'),
(12, 8, 1, 0, 'Engineering', 'CS101', '2025-06-03', 'Active', '2025-06-03 20:56:22', '2025-06-03 20:56:22'),
(13, 6, 1, 1, 'IT', 'Enterprise Application Development', '2025-06-07', 'Active', '2025-06-07 13:13:58', '2025-06-07 13:13:58'),
(14, 6, 3, 0, 'IT', 'Enterprise Application Development', '2025-06-07', 'Active', '2025-06-07 13:13:58', '2025-06-07 13:13:58'),
(15, 9, 2, 1, 'IT', 'CS101', '2025-06-24', 'Active', '2025-06-24 08:53:34', '2025-06-24 08:53:34'),
(16, 9, 1, 0, 'IT', 'CS101', '2025-06-24', 'Active', '2025-06-24 08:53:34', '2025-06-24 08:53:34'),
(17, 10, 2, 1, 'Engineering', 'SE', '2025-07-09', 'Active', '2025-07-09 20:13:36', '2025-07-09 20:13:36');

-- --------------------------------------------------------

--
-- Table structure for table `lecturer_users`
--

CREATE TABLE `lecturer_users` (
  `id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `is_temp_password` tinyint(1) DEFAULT 1,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `reset_otp` varchar(255) DEFAULT NULL,
  `reset_otp_expires` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lecturer_users`
--

INSERT INTO `lecturer_users` (`id`, `lecturer_id`, `email`, `password`, `status`, `is_temp_password`, `reset_token`, `reset_token_expires`, `reset_otp`, `reset_otp_expires`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 9, 'kashikabanu@gmail.com', '$2b$10$5qIsH1NH/ZEsA7VybLBX.utluVE0yMaAp89GgwlWH2wvDKMdk5Vkm', 'ACTIVE', 0, NULL, NULL, NULL, NULL, '2025-07-11 15:42:43', '2025-06-24 08:53:34', '2025-07-11 15:42:43'),
(2, 10, 'lenalfdo351@gmail.com', '$2b$10$FwDesAbPxTJqoHfxV5sUC.akbadwPhQJLhitCwY7Xaay3P9TAfJyi', 'ACTIVE', 0, NULL, NULL, NULL, NULL, '2025-07-11 10:36:29', '2025-07-09 20:13:36', '2025-07-11 10:36:29');

-- --------------------------------------------------------

--
-- Table structure for table `module_progress`
--

CREATE TABLE `module_progress` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `started_at` datetime DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  `progress_percentage` decimal(5,2) DEFAULT 0.00,
  `time_spent_minutes` int(11) DEFAULT 0,
  `materials_viewed` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]' CHECK (json_valid(`materials_viewed`)),
  `last_accessed` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('Not Started','In Progress','Completed') DEFAULT 'Not Started',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `max_marks` decimal(5,2) DEFAULT 100.00,
  `is_published` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stream`
--

CREATE TABLE `stream` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `identification_type` enum('NIC','Passport') NOT NULL,
  `id_number` varchar(50) NOT NULL,
  `nationality` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `cdc_number` varchar(100) DEFAULT NULL,
  `address` text NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `sea_service` varchar(100) DEFAULT NULL,
  `emergency_contact_name` varchar(255) NOT NULL,
  `emergency_contact_number` varchar(50) NOT NULL,
  `is_swimmer` tinyint(1) DEFAULT 0,
  `is_slpa_employee` tinyint(1) DEFAULT 0,
  `designation` varchar(100) DEFAULT NULL,
  `division` varchar(100) DEFAULT NULL,
  `service_no` varchar(50) DEFAULT NULL,
  `section_unit` varchar(100) DEFAULT NULL,
  `nic_document_path` varchar(255) DEFAULT NULL,
  `passport_document_path` varchar(255) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `driving_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`driving_details`)),
  `status` enum('Active','Inactive','Pending','Completed') DEFAULT 'Active',
  `payment_status` enum('Paid','Pending','Partial','Free') DEFAULT 'Pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `full_name`, `email`, `identification_type`, `id_number`, `nationality`, `date_of_birth`, `country`, `cdc_number`, `address`, `department`, `company`, `sea_service`, `emergency_contact_name`, `emergency_contact_number`, `is_swimmer`, `is_slpa_employee`, `designation`, `division`, `service_no`, `section_unit`, `nic_document_path`, `passport_document_path`, `photo_path`, `driving_details`, `status`, `payment_status`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 'Kashika', 'test@gmai.com', 'NIC', '718403413V', 'Srilanka', '2025-07-03', 'Srilanka', '1313131', 'sasas', 'dadad', 'adada', '2', 'sasa', '1313313113', 1, 1, 'saas', 'sas', '3131313', 'sas', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/test_gmai_com/nic_document-1749274339360.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/test_gmai_com/passport_document-1749274339361.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/test_gmai_com/photo-1749274339361.png', '\"{\\\"driving_license_no\\\":\\\"\\\",\\\"driving_class\\\":\\\"\\\",\\\"issue_date\\\":\\\"\\\"}\"', 'Active', 'Pending', 43, '2025-06-07 11:02:19', '2025-06-07 11:02:19'),
(3, 'Logistics Student', 'LogisticsStudent@gmail.com', 'NIC', '718403413V', 'Srilanka', '2025-06-05', 'Italy', '422313', 'Verona', 'we', 'WSO2', '2', 'Dad', '01381391313', 1, 1, 'ir', 'it', '31313131', 'rw', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/LogisticsStudent_gmail_com/nic_document-1749282151207.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/LogisticsStudent_gmail_com/passport_document-1749282151208.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/LogisticsStudent_gmail_com/photo-1749282151208.png', '\"{\\\"driving_license_no\\\":\\\"\\\",\\\"driving_class\\\":\\\"\\\",\\\"issue_date\\\":\\\"\\\"}\"', 'Active', 'Pending', 43, '2025-06-07 13:12:31', '2025-06-07 13:12:31'),
(12, 'Kashika', 'kashikabanu@gmail.com', 'NIC', '718403413V', 'Srilanka', '2025-06-27', 'Srilanka', '12212', 'sss', 'ss', 'ss', '1', 'www', '0717373756', 1, 1, 'ss', 'ss', '1212', 'ss', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/kashikabanu_gmail_com/nic_document-1749887203836.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/kashikabanu_gmail_com/passport_document-1749887203836.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/kashikabanu_gmail_com/photo-1749887203836.png', '\"{\\\"driving_license_no\\\":\\\"\\\",\\\"driving_class\\\":\\\"\\\",\\\"issue_date\\\":\\\"\\\"}\"', 'Active', 'Pending', 43, '2025-06-14 13:16:43', '2025-06-14 13:16:43'),
(14, 'lenal', 'lenalfdo351@gmail.com', 'NIC', '718403413V', 'Srilanka', '2025-06-18', 'Srilanka', '3131313', 'sasa', 'sas', 'sas', '12', 'www', '0717373756', 1, 1, 'wsas', 'sa', '1221212', 'asas', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/lenalfdo351_gmail_com/nic_document-1750066447438.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/lenalfdo351_gmail_com/passport_document-1750066447439.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/lenalfdo351_gmail_com/photo-1750066447439.png', '\"{\\\"driving_license_no\\\":\\\"\\\",\\\"driving_class\\\":\\\"\\\",\\\"issue_date\\\":\\\"\\\"}\"', 'Active', 'Pending', 43, '2025-06-16 15:04:07', '2025-06-16 15:04:07'),
(15, 'alixpresskashika', 'alixpresskashika2@gmail.com', 'NIC', '718403413V', 'Srilanka', '2025-07-03', 'Srilanka', '1111', 'aaa', 'ww', 'WSO2', '11', 'www', '0717373756', 1, 1, 'ww', 'www', '111', 'ww', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/alixpresskashika2_gmail_com/nic_document-1750745320897.jpeg', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/alixpresskashika2_gmail_com/passport_document-1750745320919.jpeg', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/students/alixpresskashika2_gmail_com/photo-1750745320930.jpeg', '\"\\\"{\\\\\\\"driving_license_no\\\\\\\":\\\\\\\"\\\\\\\",\\\\\\\"driving_class\\\\\\\":\\\\\\\"\\\\\\\",\\\\\\\"issue_date\\\\\\\":\\\\\\\"\\\\\\\"}\\\"\"', 'Active', 'Pending', 75, '2025-06-17 09:18:50', '2025-06-24 11:38:40');

-- --------------------------------------------------------

--
-- Table structure for table `student_batches`
--

CREATE TABLE `student_batches` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `enrollment_date` date DEFAULT NULL,
  `attendance_percentage` decimal(5,2) DEFAULT 0.00,
  `status` enum('Active','Completed','Withdrawn') DEFAULT 'Active',
  `completion_certificate` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_batches`
--

INSERT INTO `student_batches` (`id`, `student_id`, `batch_id`, `enrollment_date`, `attendance_percentage`, `status`, `completion_certificate`, `created_at`, `updated_at`) VALUES
(2, 3, 5, NULL, 0.00, 'Active', NULL, '2025-06-07 13:15:04', '2025-06-07 13:15:04'),
(3, 3, 6, NULL, 0.00, 'Active', NULL, '2025-06-08 13:47:49', '2025-06-08 13:47:49'),
(4, 12, 7, NULL, 0.00, 'Active', NULL, '2025-06-14 20:27:27', '2025-06-14 20:27:27'),
(5, 2, 1, NULL, 0.00, 'Active', NULL, '2025-06-24 09:29:39', '2025-06-24 09:29:39'),
(6, 12, 1, NULL, 0.00, 'Active', NULL, '2025-06-24 09:29:39', '2025-06-24 09:29:39'),
(7, 15, 5, NULL, 0.00, 'Active', NULL, '2025-06-24 13:43:01', '2025-06-24 13:43:01'),
(8, 2, 8, NULL, 0.00, 'Active', NULL, '2025-07-10 18:26:18', '2025-07-10 18:26:18'),
(9, 12, 8, NULL, 0.00, 'Active', NULL, '2025-07-10 18:26:18', '2025-07-10 18:26:18'),
(10, 15, 8, NULL, 0.00, 'Active', NULL, '2025-07-10 18:26:18', '2025-07-10 18:26:18');

--
-- Triggers `student_batches`
--
DELIMITER $$
CREATE TRIGGER `update_batch_students_count` AFTER INSERT ON `student_batches` FOR EACH ROW BEGIN
  UPDATE batches 
  SET students_count = (
    SELECT COUNT(*) FROM student_batches WHERE batch_id = NEW.batch_id
  )
  WHERE id = NEW.batch_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `student_courses`
--

CREATE TABLE `student_courses` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `enrollment_date` date NOT NULL,
  `primary_course` tinyint(1) DEFAULT 0,
  `status` enum('Active','Completed','Withdrawn','Suspended') DEFAULT 'Active',
  `completion_date` date DEFAULT NULL,
  `grade` varchar(10) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_courses`
--

INSERT INTO `student_courses` (`id`, `student_id`, `course_id`, `enrollment_date`, `primary_course`, `status`, `completion_date`, `grade`, `remarks`, `created_at`, `updated_at`) VALUES
(4, 2, 1, '2025-06-07', 1, 'Active', NULL, NULL, NULL, '2025-06-07 11:02:19', '2025-06-07 11:02:19'),
(5, 2, 2, '2025-06-07', 0, 'Active', NULL, NULL, NULL, '2025-06-07 11:02:19', '2025-06-07 11:02:19'),
(6, 3, 3, '2025-06-07', 1, 'Active', NULL, NULL, NULL, '2025-06-07 13:12:31', '2025-06-07 13:12:31'),
(13, 12, 2, '2025-06-14', 1, 'Active', NULL, NULL, NULL, '2025-06-14 13:16:43', '2025-06-14 13:16:43'),
(14, 12, 3, '2025-06-14', 0, 'Active', NULL, NULL, NULL, '2025-06-14 13:16:43', '2025-06-14 13:16:43'),
(16, 14, 3, '2025-06-16', 1, 'Active', NULL, NULL, NULL, '2025-06-16 15:04:07', '2025-06-16 15:04:07'),
(17, 15, 1, '2025-06-17', 1, 'Active', NULL, NULL, NULL, '2025-06-17 09:18:50', '2025-06-24 11:38:40'),
(18, 15, 3, '2025-06-24', 0, 'Active', NULL, NULL, NULL, '2025-06-24 11:38:40', '2025-06-24 11:38:40'),
(19, 15, 2, '2025-06-24', 0, 'Active', NULL, NULL, NULL, '2025-06-24 11:38:40', '2025-06-24 11:38:40');

-- --------------------------------------------------------

--
-- Table structure for table `student_users`
--

CREATE TABLE `student_users` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `is_temp_password` tinyint(1) DEFAULT 1,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reset_otp` varchar(255) DEFAULT NULL,
  `reset_otp_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_users`
--

INSERT INTO `student_users` (`id`, `student_id`, `email`, `password`, `status`, `is_temp_password`, `reset_token`, `reset_token_expires`, `last_login`, `created_at`, `updated_at`, `reset_otp`, `reset_otp_expires`) VALUES
(4, 12, 'kashikabanu@gmail.com', '$2b$10$f5uCdrR0OrHQP1Qb/rKvQeXMAOCdhPf5330IV.SEWvqTxQA2mdfFq', 'ACTIVE', 0, NULL, NULL, NULL, '2025-06-14 13:16:43', '2025-06-17 09:16:57', NULL, NULL),
(6, 14, 'lenalfdo351@gmail.com', '$2b$10$WsTlXLxVXzYOCko86H2nUe1E7RAPddkd7V5SIOygNz89Xf6Hb8dvW', 'ACTIVE', 0, NULL, NULL, NULL, '2025-06-16 15:04:07', '2025-06-16 15:12:46', NULL, NULL),
(7, 15, 'alixpresskashika2@gmail.com', '$2b$10$Shd18PrRKNlW7RwNBrXgW.a.CzVQhfWWRCzOLRANnukGweplTH9Ke', 'ACTIVE', 0, NULL, NULL, NULL, '2025-06-17 09:18:50', '2025-06-17 09:20:04', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `password` text NOT NULL,
  `role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '["USER"],["SuperAdmin"],["ADMIN"]',
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `status`) VALUES
(43, 'SuperAdmin1', 'SuperAdmin1@gmail.com', '0717373756', '$2b$10$wXkXEReyVGsmvr5sP66h/eHVj5XdJodppR/H6Fu4dHjilswBd.97S', '[\"SuperAdmin\"]', 'ACTIVE'),
(52, 'Test', 'Auditorium@gmail.com', '', '$2b$10$k0ewMsUUU5np0RrmiKW88OigXAPG5Kqqi4xVb4Y4C1e.44K7ZW2nG', '[\"USER\",\"calendar_access\",\"bus_access\",\"student_registration_access\",\"course_registration_access\",\"class_request_access\",\"lecturer_management_access\"]', 'ACTIVE'),
(68, 'YesSirrr', 'YesKashika@gmail.com', '', '$2b$10$TOiFuchLTnkG6Klf2skE5OAjVfZfCq7X0XtW2SwI6M9Iahxl.9cFS', '[\"USER\",\"calendar_access\",\"bookings_access\",\"course_registration_access\"]', 'ACTIVE'),
(75, 'AccessTokenAdmin', 'SuperAdmin@gmail.com', '', '$2b$10$DbieZqk04Ish4tfw2128fuX3a37GY2.xncDlHESLvpNyjzZMMJonO', '[\"SuperAdmin\"]', 'ACTIVE'),
(78, 'classuser', 'classuser@gmail.com', '', '$2b$10$tlPyMJuL9zFpE5XIgHGlMeTQdUZa4vJzE/coLNkee9TSG/CzEIs5m', '[\"USER\",\"cb_SU_access\"]', 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `user_refresh_tokens`
--

CREATE TABLE `user_refresh_tokens` (
  `user_id` int(11) NOT NULL,
  `refresh_token` varchar(512) NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `batch_overview`
--
DROP TABLE IF EXISTS `batch_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `batch_overview`  AS SELECT `b`.`id` AS `id`, `b`.`batch_name` AS `batch_name`, `b`.`start_date` AS `start_date`, `b`.`end_date` AS `end_date`, `b`.`status` AS `status`, `b`.`students_count` AS `students_count`, `b`.`materials_count` AS `materials_count`, `b`.`assignments_count` AS `assignments_count`, `b`.`announcements_count` AS `announcements_count`, `c`.`courseName` AS `courseName`, `c`.`courseId` AS `courseId`, `l`.`full_name` AS `lecturer_name`, `l`.`email` AS `lecturer_email` FROM ((`batches` `b` join `courses` `c` on(`b`.`course_id` = `c`.`id`)) join `lecturers` `l` on(`b`.`lecturer_id` = `l`.`id`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `aid_handover`
--
ALTER TABLE `aid_handover`
  ADD PRIMARY KEY (`id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `aid_items`
--
ALTER TABLE `aid_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `aid_requests`
--
ALTER TABLE `aid_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `aid_request_emails`
--
ALTER TABLE `aid_request_emails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `lecturer_id` (`lecturer_id`),
  ADD KEY `idx_announcements_published` (`is_published`),
  ADD KEY `idx_announcements_batch_published` (`batch_id`,`is_published`);

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `lecturer_id` (`lecturer_id`),
  ADD KEY `idx_assignments_status` (`status`),
  ADD KEY `idx_assignments_due_date` (`due_date`),
  ADD KEY `idx_assignments_batch_status` (`batch_id`,`status`);

--
-- Indexes for table `assignment_grades`
--
ALTER TABLE `assignment_grades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `assignment_student_grade_unique` (`assignment_id`,`student_id`),
  ADD KEY `assignment_id` (`assignment_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `lecturer_id` (`lecturer_id`);

--
-- Indexes for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_submission` (`assignment_id`,`student_id`,`attempt_number`),
  ADD KEY `graded_by` (`graded_by`),
  ADD KEY `idx_assignment_submissions_status` (`status`),
  ADD KEY `idx_assignment_submissions_student` (`student_id`),
  ADD KEY `idx_assignment_submissions_group` (`group_submission_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_attendance` (`batch_id`,`student_id`,`attendance_date`,`module_id`),
  ADD KEY `module_id` (`module_id`),
  ADD KEY `marked_by` (`marked_by`),
  ADD KEY `idx_attendance_date` (`attendance_date`),
  ADD KEY `idx_attendance_status` (`status`),
  ADD KEY `idx_attendance_student` (`student_id`);

--
-- Indexes for table `batches`
--
ALTER TABLE `batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `course_id` (`course_id`,`batch_name`),
  ADD KEY `idx_batches_status` (`status`),
  ADD KEY `idx_batches_dates` (`start_date`,`end_date`),
  ADD KEY `fk_batches_lecturer` (`lecturer_id`);

--
-- Indexes for table `batch_materials`
--
ALTER TABLE `batch_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `lecturer_id` (`lecturer_id`),
  ADD KEY `idx_batch_materials_active` (`is_active`),
  ADD KEY `idx_batch_materials_batch_active` (`batch_id`,`is_active`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `busBooking`
--
ALTER TABLE `busBooking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`) USING BTREE;

--
-- Indexes for table `classroom_booking_calendar`
--
ALTER TABLE `classroom_booking_calendar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `classroom_booking_dates`
--
ALTER TABLE `classroom_booking_dates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `calendar_id` (`calendar_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `courseId` (`courseId`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_courses_name` (`courseName`),
  ADD KEY `idx_courses_status` (`status`),
  ADD KEY `idx_courses_dates` (`start_date`,`end_date`);

--
-- Indexes for table `course_assignments`
--
ALTER TABLE `course_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_id` (`module_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_course_assignments_status` (`status`),
  ADD KEY `idx_course_assignments_due_date` (`due_date`),
  ADD KEY `idx_course_assignments_type` (`assignment_type`),
  ADD KEY `idx_course_assignments_batch` (`batch_id`);

--
-- Indexes for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_course_materials_type` (`material_type`),
  ADD KEY `idx_course_materials_module` (`module_id`),
  ADD KEY `idx_course_materials_batch` (`batch_id`);

--
-- Indexes for table `course_modules`
--
ALTER TABLE `course_modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_course_modules_status` (`status`),
  ADD KEY `idx_course_modules_order` (`course_id`,`sequence_order`);

--
-- Indexes for table `course_payments`
--
ALTER TABLE `course_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_course_payments_date` (`payment_date`);

--
-- Indexes for table `discussion_forums`
--
ALTER TABLE `discussion_forums`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `module_id` (`module_id`),
  ADD KEY `created_by_student` (`created_by_student`),
  ADD KEY `created_by_lecturer` (`created_by_lecturer`),
  ADD KEY `idx_discussion_forums_course` (`course_id`),
  ADD KEY `idx_discussion_forums_activity` (`last_activity`);

--
-- Indexes for table `forum_replies`
--
ALTER TABLE `forum_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by_student` (`created_by_student`),
  ADD KEY `created_by_lecturer` (`created_by_lecturer`),
  ADD KEY `idx_forum_replies_forum` (`forum_id`),
  ADD KEY `idx_forum_replies_parent` (`parent_reply_id`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `assignment_student_grade_unique` (`assignment_id`,`student_id`),
  ADD KEY `assignment_id` (`assignment_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `lecturer_id` (`lecturer_id`);

--
-- Indexes for table `lecturers`
--
ALTER TABLE `lecturers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_lecturers_full_name` (`full_name`),
  ADD KEY `idx_lecturers_status` (`status`);

--
-- Indexes for table `lecturer_academic_details`
--
ALTER TABLE `lecturer_academic_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lecturer_id` (`lecturer_id`);

--
-- Indexes for table `lecturer_bank_details`
--
ALTER TABLE `lecturer_bank_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lecturer_id` (`lecturer_id`);

--
-- Indexes for table `lecturer_batches`
--
ALTER TABLE `lecturer_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lecturer_id` (`lecturer_id`,`batch_id`,`module`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `idx_lecturer_batches_status` (`status`),
  ADD KEY `idx_lecturer_batches_lecturer` (`lecturer_id`,`status`);

--
-- Indexes for table `lecturer_courses`
--
ALTER TABLE `lecturer_courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lecturer_id` (`lecturer_id`,`course_id`,`module`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `idx_lecturer_courses_status` (`status`);

--
-- Indexes for table `lecturer_users`
--
ALTER TABLE `lecturer_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `lecturer_id` (`lecturer_id`),
  ADD KEY `idx_lecturer_users_email` (`email`);

--
-- Indexes for table `module_progress`
--
ALTER TABLE `module_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_module` (`student_id`,`module_id`),
  ADD KEY `module_id` (`module_id`),
  ADD KEY `idx_module_progress_status` (`status`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `lecturer_id` (`lecturer_id`);

--
-- Indexes for table `stream`
--
ALTER TABLE `stream`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_students_full_name` (`full_name`),
  ADD KEY `idx_students_id_number` (`id_number`),
  ADD KEY `idx_students_status` (`status`);

--
-- Indexes for table `student_batches`
--
ALTER TABLE `student_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`,`batch_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `idx_student_batches_status` (`status`);

--
-- Indexes for table `student_courses`
--
ALTER TABLE `student_courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_course` (`student_id`,`course_id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `idx_student_courses_status` (`status`);

--
-- Indexes for table `student_users`
--
ALTER TABLE `student_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_student_users_email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `aid_handover`
--
ALTER TABLE `aid_handover`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `aid_items`
--
ALTER TABLE `aid_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `aid_requests`
--
ALTER TABLE `aid_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `aid_request_emails`
--
ALTER TABLE `aid_request_emails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `assignment_grades`
--
ALTER TABLE `assignment_grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `batches`
--
ALTER TABLE `batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `batch_materials`
--
ALTER TABLE `batch_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=186;

--
-- AUTO_INCREMENT for table `busBooking`
--
ALTER TABLE `busBooking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `classroom_booking_calendar`
--
ALTER TABLE `classroom_booking_calendar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `classroom_booking_dates`
--
ALTER TABLE `classroom_booking_dates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `course_assignments`
--
ALTER TABLE `course_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_materials`
--
ALTER TABLE `course_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_modules`
--
ALTER TABLE `course_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_payments`
--
ALTER TABLE `course_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discussion_forums`
--
ALTER TABLE `discussion_forums`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `forum_replies`
--
ALTER TABLE `forum_replies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lecturers`
--
ALTER TABLE `lecturers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `lecturer_academic_details`
--
ALTER TABLE `lecturer_academic_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `lecturer_bank_details`
--
ALTER TABLE `lecturer_bank_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `lecturer_batches`
--
ALTER TABLE `lecturer_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `lecturer_courses`
--
ALTER TABLE `lecturer_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `lecturer_users`
--
ALTER TABLE `lecturer_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `module_progress`
--
ALTER TABLE `module_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stream`
--
ALTER TABLE `stream`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `student_batches`
--
ALTER TABLE `student_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `student_courses`
--
ALTER TABLE `student_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `student_users`
--
ALTER TABLE `student_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `aid_handover`
--
ALTER TABLE `aid_handover`
  ADD CONSTRAINT `aid_handover_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `aid_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `aid_items`
--
ALTER TABLE `aid_items`
  ADD CONSTRAINT `aid_items_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `aid_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `aid_request_emails`
--
ALTER TABLE `aid_request_emails`
  ADD CONSTRAINT `aid_request_emails_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `aid_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `announcements_ibfk_2` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignment_grades`
--
ALTER TABLE `assignment_grades`
  ADD CONSTRAINT `assignment_grades_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_grades_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_grades_ibfk_3` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_submissions_ibfk_3` FOREIGN KEY (`graded_by`) REFERENCES `lecturer_users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_ibfk_4` FOREIGN KEY (`marked_by`) REFERENCES `lecturer_users` (`id`);

--
-- Constraints for table `batches`
--
ALTER TABLE `batches`
  ADD CONSTRAINT `batches_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_batches_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `batch_materials`
--
ALTER TABLE `batch_materials`
  ADD CONSTRAINT `batch_materials_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `batch_materials_ibfk_2` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `classroom_booking_calendar`
--
ALTER TABLE `classroom_booking_calendar`
  ADD CONSTRAINT `classroom_booking_calendar_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `classroom_booking_calendar_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `aid_requests` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `classroom_booking_dates`
--
ALTER TABLE `classroom_booking_dates`
  ADD CONSTRAINT `classroom_booking_dates_ibfk_1` FOREIGN KEY (`calendar_id`) REFERENCES `classroom_booking_calendar` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `classroom_booking_dates_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `classroom_booking_dates_ibfk_3` FOREIGN KEY (`request_id`) REFERENCES `aid_requests` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `course_assignments`
--
ALTER TABLE `course_assignments`
  ADD CONSTRAINT `course_assignments_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_assignments_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_assignments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `lecturer_users` (`id`);

--
-- Constraints for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD CONSTRAINT `course_materials_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_materials_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_materials_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `lecturer_users` (`id`);

--
-- Constraints for table `course_modules`
--
ALTER TABLE `course_modules`
  ADD CONSTRAINT `course_modules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_modules_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `course_modules_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `lecturer_users` (`id`);

--
-- Constraints for table `course_payments`
--
ALTER TABLE `course_payments`
  ADD CONSTRAINT `course_payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_payments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_payments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `discussion_forums`
--
ALTER TABLE `discussion_forums`
  ADD CONSTRAINT `discussion_forums_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `discussion_forums_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `discussion_forums_ibfk_3` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `discussion_forums_ibfk_4` FOREIGN KEY (`created_by_student`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `discussion_forums_ibfk_5` FOREIGN KEY (`created_by_lecturer`) REFERENCES `lecturer_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `forum_replies`
--
ALTER TABLE `forum_replies`
  ADD CONSTRAINT `forum_replies_ibfk_1` FOREIGN KEY (`forum_id`) REFERENCES `discussion_forums` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_replies_ibfk_2` FOREIGN KEY (`parent_reply_id`) REFERENCES `forum_replies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_replies_ibfk_3` FOREIGN KEY (`created_by_student`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_replies_ibfk_4` FOREIGN KEY (`created_by_lecturer`) REFERENCES `lecturer_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `grades`
--
ALTER TABLE `grades`
  ADD CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grades_ibfk_3` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lecturers`
--
ALTER TABLE `lecturers`
  ADD CONSTRAINT `lecturers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `lecturer_academic_details`
--
ALTER TABLE `lecturer_academic_details`
  ADD CONSTRAINT `lecturer_academic_details_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lecturer_bank_details`
--
ALTER TABLE `lecturer_bank_details`
  ADD CONSTRAINT `lecturer_bank_details_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lecturer_batches`
--
ALTER TABLE `lecturer_batches`
  ADD CONSTRAINT `lecturer_batches_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lecturer_batches_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lecturer_courses`
--
ALTER TABLE `lecturer_courses`
  ADD CONSTRAINT `lecturer_courses_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lecturer_courses_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lecturer_users`
--
ALTER TABLE `lecturer_users`
  ADD CONSTRAINT `lecturer_users_ibfk_1` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `module_progress`
--
ALTER TABLE `module_progress`
  ADD CONSTRAINT `module_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `module_progress_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quizzes_ibfk_2` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_batches`
--
ALTER TABLE `student_batches`
  ADD CONSTRAINT `student_batches_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_batches_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_courses`
--
ALTER TABLE `student_courses`
  ADD CONSTRAINT `student_courses_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_courses_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_users`
--
ALTER TABLE `student_users`
  ADD CONSTRAINT `student_users_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  ADD CONSTRAINT `user_refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
