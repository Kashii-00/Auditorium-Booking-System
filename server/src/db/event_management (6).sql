-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 23, 2025 at 12:31 PM
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
(10, 10, 9, 'Heyy Kidss,', 'helooooooooo ', 'medium', 1, '2025-07-19 19:42:51', '2025-07-19 14:12:51', '2025-07-19 14:12:51'),
(11, 12, 9, 'Assignment', 'hello', 'high', 1, '2025-07-22 13:17:13', '2025-07-22 07:47:13', '2025-07-22 07:47:13');

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
(9, 12, 9, 'assingment1', 'assignment1', NULL, '2025-07-24 07:47:00', 100.00, 'individual', 'published', 0, '2025-07-22 07:45:26', '2025-07-22 07:46:35');

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
(7, 9, 990094, 'cscdc', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/assignments/student_990094/assignment_9_1753170545172-MPMA__3_.png', '2025-07-22 13:19:05', 78.00, 'not bad', 1, '2025-07-22 13:20:44', 1, 'Submitted', NULL, '2025-07-22 13:19:05', '2025-07-22 13:20:44', 'MPMA (3).png');

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
  `batch_number` int(11) DEFAULT 1,
  `year` int(11) DEFAULT NULL,
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

INSERT INTO `batches` (`id`, `course_id`, `batch_name`, `capacity`, `start_date`, `end_date`, `status`, `location`, `schedule`, `created_at`, `updated_at`, `lecturer_id`, `batch_code`, `batch_number`, `year`, `max_students`, `description`, `materials_count`, `assignments_count`, `announcements_count`, `students_count`, `completion_percentage`) VALUES
(10, 21, 'TEST', 50, '2025-08-01', '2025-09-01', 'Upcoming', 'ComputerLab', NULL, '2025-07-19 18:53:21', '2025-07-21 13:39:49', NULL, 'MP-PSSR25.1', 1, 2025, 50, '', 1, 0, 1, 1, 0.00),
(11, 21, 'TEST22', 10, '2025-07-20', '2025-07-31', 'Upcoming', 'ComputerHUB', NULL, '2025-07-19 19:13:51', '2025-07-19 19:13:51', NULL, 'MP-PSSR25.2', 2, 2025, 10, '', 0, 0, 0, 0, 0.00),
(12, 21, 'testName', 30, '2025-07-23', '2026-05-23', 'Upcoming', 'test11', NULL, '2025-07-22 13:02:37', '2025-07-22 13:17:13', NULL, 'MP-PSSR25.3', 3, 2025, 30, '', 1, 1, 1, 1, 0.00),
(13, 31, 'test02', 30, '2025-07-24', '2026-03-11', 'Upcoming', 'testlo', NULL, '2025-07-22 13:04:12', '2025-07-22 13:06:30', NULL, 'MP-BOATMASTER25.1', 1, 2025, 30, '', 0, 0, 0, 1, 0.00);

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
(21, 10, 9, 'TESTMeterial', 'TEST', '1.png', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1753085389353-781976441-1.png', 72457, 'image/png', 'lecture', 1, '2025-07-21 08:09:49', '2025-07-21 08:09:49', '2025-07-21 08:09:49'),
(22, 12, 9, 'test', 'lectures', 'Security - My Account Panel - Namecheap.com.pdf', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/batch_materials/1753170259875-834368116-Security - My Account Panel - Namecheap.com.pdf', 47472, 'application/pdf', 'lecture', 1, '2025-07-22 07:44:19', '2025-07-22 07:44:19', '2025-07-22 07:44:19');

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
(185, 75, '2025-07-25', '11:00:00', '14:00:00', 1, 'APPROVED', 'KASHIKA/TEST'),
(186, 75, '2025-07-17', '15:00:00', '18:00:00', 120, 'DENIED', 'TEST1');

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
(18, 43, 'MP-PST', 'Maritime', 'Proficiency in Personal Survival Techniques', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Survival techniques at sea', '2025-08-01', '2025-08-05', '5 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(19, 43, 'MP-FPFF', 'Maritime', 'Proficiency in Fire Prevention & Fire Fighting', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Fire prevention training', '2025-08-03', '2025-08-07', '5 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(20, 43, 'MP-EFA', 'Maritime', 'Proficiency in Elementary First Aid', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Basic first aid training', '2025-08-05', '2025-08-07', '3 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(21, 43, 'MP-PSSR', 'Maritime', 'Proficiency in Personal Safety and Social Responsibility', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Safety and responsibility', '2025-08-07', '2025-08-09', '3 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(22, 43, 'MP-SDSD', 'Maritime', 'Proficiency in Security Training for Seafarers with SDSD', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 6000.00, 5000.00, 5000.00, 5000.00, NULL, 'Security awareness', '2025-08-09', '2025-08-10', '2 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:31:33'),
(23, 43, 'MP-BT', 'Maritime', 'Proficiency in Basic Trauma', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 6000.00, 5000.00, 5000.00, 5000.00, NULL, 'Basic trauma handling', '2025-08-11', '2025-08-13', '3 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:31:44'),
(24, 43, 'MP-RUC', 'Maritime', 'Refresher and Updating Course for Seafarers (PST / FPFF / EFA / PSSR)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 9500.00, 5000.00, 5000.00, 5000.00, NULL, 'Refresher for seafarers', '2025-08-13', '2025-08-16', '4 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:31:57'),
(25, 43, 'MP-ME', 'Maritime', 'Maritime English', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'English for maritime communication', '2025-08-15', '2025-08-24', '10 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(26, 43, 'MP-RIG', 'Maritime', 'Rigging Course', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 10000.00, 5000.00, 5000.00, 5000.00, NULL, 'Rigging operations training', '2025-08-17', '2025-08-23', '7 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:32:15'),
(27, 43, 'MP-WINCH', 'Maritime', 'Winchman Training Course', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Operating winches', '2025-08-19', '2025-08-22', '4 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(28, 43, 'MP-BTOCTCO', 'Maritime', 'Basic Training for Oil and Chemical Tanker Cargo Operation', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Oil/chemical tanker training', '2025-08-21', '2025-08-26', '6 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(29, 43, 'MP-COX', 'Maritime', 'Coxswain with License Fee', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 45000.00, 5000.00, 5000.00, 5000.00, NULL, 'Coxswain operation', '2025-08-23', '2025-08-30', '8 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:32:33'),
(30, 43, 'MP-PRESEA', 'Maritime', 'Pre Sea Training Course for Deck Rating', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 95000.00, 5000.00, 5000.00, 5000.00, NULL, 'Deck crew training', '2025-08-25', '2025-09-23', '30 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:32:45'),
(31, 43, 'MP-BOATMASTER', 'Maritime', 'Boat Master', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 85000.00, 5000.00, 5000.00, 5000.00, NULL, 'Boat command training', '2025-08-27', '2025-09-10', '15 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:32:55'),
(32, 43, 'MP-MCC', 'Electrical', 'Motor Control Circuits', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 10000.00, 5000.00, 5000.00, 5000.00, NULL, 'Motor control training', '2025-08-29', '2025-09-07', '10 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:33:13'),
(33, 43, 'MP-EWIRE', 'Electrical', 'Electrical Wireman', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 10000.00, 5000.00, 5000.00, 5000.00, NULL, 'Electrical wiring', '2025-08-31', '2025-09-19', '20 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:33:19'),
(34, 43, 'MP-MECH', 'Electrical', 'Mechatronic for Beginners', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 20000.00, 5000.00, 5000.00, 5000.00, NULL, 'Intro to mechatronics', '2025-09-02', '2025-09-16', '15 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:33:29'),
(35, 43, 'MP-PLC', 'Electrical', 'Programmable Logic Controller (PLC)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 20000.00, 5000.00, 5000.00, 5000.00, NULL, 'PLC system training', '2025-09-04', '2025-09-15', '12 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:33:37'),
(36, 43, 'MP-CBMSO', 'Management', 'Computer Basic MS Office', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 10000.00, 5000.00, 5000.00, 5000.00, NULL, 'MS Office basics', '2025-09-06', '2025-09-15', '10 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:33:48'),
(37, 43, 'MP-CAIO', 'Management', 'Computer Advanced MS Office – (Internal)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Advanced MS Office (Internal)', '2025-09-08', '2025-09-19', '12 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(38, 43, 'MP-CAEO', 'Management', 'Computer Advanced MS Office – (External)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 17500.00, 5000.00, 5000.00, 5000.00, NULL, 'Advanced MS Office (External)', '2025-09-10', '2025-09-21', '12 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 09:54:22'),
(39, 43, 'MP-CAA', 'Management', 'Computer Application Assistant (NVQ – L3)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 15000.00, 5000.00, 5000.00, 5000.00, NULL, 'Application support NVQ', '2025-09-12', '2025-10-11', '30 days', 'Active', '2025-07-19 15:05:17', '2025-07-19 15:05:17'),
(40, 43, 'MP-PHVP', 'Equipment', 'Private Heavy Vehicle Programme', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 650.00, 5000.00, 5000.00, 5000.00, NULL, 'Heavy vehicle training', '2025-09-14', '2025-09-23', '10 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:49:05'),
(41, 43, 'MP-RC-PMO', 'Equipment', 'Refresher Course – Prime Mover Operator', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 2000.00, 5000.00, 5000.00, 5000.00, NULL, 'Prime mover refresher', '2025-09-16', '2025-09-18', '3 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:52:15'),
(42, 43, 'MP-RC-FGC', 'Equipment', 'Refresher Course – Forklift & Good Carriers', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 1500.00, 5000.00, 5000.00, 5000.00, NULL, 'Forklift refresher', '2025-09-18', '2025-09-20', '3 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:52:28'),
(43, 43, 'MP-RC-LVMC', 'Equipment', 'Refresher Course – Light Vehicle & Motor Coucher', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 1000.00, 5000.00, 5000.00, 5000.00, NULL, 'Light vehicle refresher', '2025-09-20', '2025-09-22', '3 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:52:42'),
(44, 43, 'MP-TT-FPMC', 'Equipment', 'Trade Test (Fork Lift / Prime Mover / Mobile Crane)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 5000.00, 5000.00, 5000.00, 5000.00, NULL, 'Trade test for equipment', '2025-09-22', '2025-09-23', '2 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:49:52'),
(45, 43, 'MP-NTT-FPM', 'Equipment', 'NVQ Trial Test (Forklift / Prime Mover)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 6000.00, 5000.00, 5000.00, 5000.00, NULL, 'NVQ trial test', '2025-09-24', '2025-09-25', '2 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:50:24'),
(46, 43, 'MP-MCO', 'Equipment', 'Mobile Crane Operator', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 23000.00, 5000.00, 5000.00, 5000.00, NULL, 'Crane operator training', '2025-09-26', '2025-10-02', '7 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:50:40'),
(47, 43, 'MP-FTO', 'Equipment', 'Forklift Truck Operator – (NVQ – L3)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 30000.00, 5000.00, 5000.00, 5000.00, NULL, 'Forklift NVQ L3', '2025-09-28', '2025-10-12', '15 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:51:01'),
(48, 43, 'MP-PMO', 'Equipment', 'Prime Mover Operator – (NVQ – L4)', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 35000.00, 5000.00, 5000.00, 5000.00, NULL, 'Prime mover NVQ L4', '2025-09-30', '2025-10-19', '20 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:51:14'),
(49, 43, 'MP-TLTO', 'Equipment', 'Top Lift Truck Operator', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 75000.00, 5000.00, 5000.00, 5000.00, NULL, 'Top lift operation', '2025-10-02', '2025-10-11', '10 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:51:35'),
(50, 43, 'MP-GCO', 'Equipment', 'Gantry Crane Operator', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 250000.00, 5000.00, 5000.00, 5000.00, NULL, 'Gantry crane training', '2025-10-04', '2025-10-13', '10 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:51:52'),
(51, 43, 'MP-TCO', 'Equipment', 'Transfer Crane Operator', '[\"English\"]', '[\"Colombo\"]', '[\"Attendance\", \"Final Test\"]', '[\"Yard\", \"Onboard\"]', 250000.00, 5000.00, 5000.00, 5000.00, NULL, 'Transfer crane operation', '2025-10-06', '2025-10-15', '10 days', 'Active', '2025-07-19 15:05:17', '2025-07-22 08:52:00');

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
-- Table structure for table `course_cost_summary`
--

CREATE TABLE `course_cost_summary` (
  `id` int(11) NOT NULL,
  `payment_main_details_id` int(11) NOT NULL,
  `profit_margin_percentage` decimal(5,2) DEFAULT 0.00,
  `profit_margin` decimal(10,2) DEFAULT 0.00,
  `provision_inflation_percentage` decimal(5,2) DEFAULT 0.00,
  `total_cost_expense` decimal(10,2) DEFAULT 0.00,
  `NBT` decimal(10,2) DEFAULT 0.00,
  `total_course_cost` decimal(10,2) DEFAULT 0.00,
  `no_of_participants` int(11) DEFAULT 0,
  `course_fee_per_head` decimal(10,2) DEFAULT 0.00,
  `Rounded_CFPH` int(11) DEFAULT 0,
  `Rounded_CT` int(11) DEFAULT 0,
  `prepared_by` varchar(255) DEFAULT NULL,
  `prepared_by_id` int(11) DEFAULT NULL,
  `check_by` varchar(255) DEFAULT NULL,
  `updated_by_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_cost_summary`
--

INSERT INTO `course_cost_summary` (`id`, `payment_main_details_id`, `profit_margin_percentage`, `profit_margin`, `provision_inflation_percentage`, `total_cost_expense`, `NBT`, `total_course_cost`, `no_of_participants`, `course_fee_per_head`, `Rounded_CFPH`, `Rounded_CT`, `prepared_by`, `prepared_by_id`, `check_by`, `updated_by_id`, `created_at`, `updated_at`) VALUES
(34, 6, 24.00, 16398.74, 5.00, 64122.00, 1000.00, 84726.84, 24, 3530.29, 3550, 85200, 'SuperAdmin', 73, 'SuperAdmin@gmail.com', 73, '2025-07-15 06:09:36', '2025-07-15 06:09:36'),
(35, 19, 24.00, 5995.18, 5.00, 22838.00, 1000.00, 30975.08, 24, 1290.63, 1300, 31200, 'SuperAdmin', 73, 'SuperAdmin@gmail.com', 73, '2025-07-17 09:04:51', '2025-07-17 09:04:51'),
(36, 20, 24.00, 7255.68, 5.00, 27840.00, 1000.00, 37487.68, 20, 1874.38, 1900, 38000, 'SuperAdmin', 73, 'Admin', 73, '2025-07-17 09:09:45', '2025-07-17 09:09:45'),
(38, 21, 24.00, 16619.50, 5.00, 64998.00, 1000.00, 85867.40, 30, 2862.25, 2900, 87000, 'SuperAdmin', 73, 'SuperAdmin@gmail.com', 73, '2025-07-17 10:00:16', '2025-07-17 10:00:16');

-- --------------------------------------------------------

--
-- Table structure for table `course_delivery_costs`
--

CREATE TABLE `course_delivery_costs` (
  `id` int(11) NOT NULL,
  `payments_main_details_id` int(11) NOT NULL,
  `Md_approval_obtained` varchar(50) DEFAULT NULL,
  `Md_details` text DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_delivery_costs`
--

INSERT INTO `course_delivery_costs` (`id`, `payments_main_details_id`, `Md_approval_obtained`, `Md_details`, `total_cost`, `created_at`) VALUES
(10, 6, 'Yes', 'Bls', 19190.00, '2025-07-04 04:14:06'),
(14, 19, 'Yes', 'Testing', 22838.00, '2025-07-17 09:04:26'),
(15, 20, 'Yes', 'Something....', 9100.00, '2025-07-17 09:08:47'),
(18, 21, 'Yes', 'tes', 37838.00, '2025-07-17 10:00:06');

-- --------------------------------------------------------

--
-- Table structure for table `course_delivery_cost_items`
--

CREATE TABLE `course_delivery_cost_items` (
  `id` int(11) NOT NULL,
  `course_delivery_cost_id` int(11) NOT NULL,
  `role` varchar(255) NOT NULL,
  `no_of_officers` int(11) DEFAULT NULL,
  `hours` int(11) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_delivery_cost_items`
--

INSERT INTO `course_delivery_cost_items` (`id`, `course_delivery_cost_id`, `role`, `no_of_officers`, `hours`, `rate`, `amount`, `created_at`) VALUES
(18, 10, 'Category-B(Outside)', 2, 4, 1500.00, 12000.00, '2025-07-04 04:14:06'),
(19, 10, 'Category-A(SLPA)', 1, 2, 1350.00, 2700.00, '2025-07-04 04:14:06'),
(20, 10, 'Coordination', 1, 2, 1000.00, 2000.00, '2025-07-04 04:14:06'),
(26, 14, 'Senior Training Manager(S.T.M)(MPTI)', 12, 2, 950.00, 22800.00, '2025-07-17 09:04:26'),
(27, 15, 'Senior Training Manager(S.T.M)(MPTI)', 2, 4, 950.00, 7600.00, '2025-07-17 09:08:47'),
(32, 18, 'Training Manager(T.M)(MPTI)', 2, 5, 900.00, 9000.00, '2025-07-17 10:00:06'),
(33, 18, 'Category-A(SLPA)', 2, 6, 1350.00, 16200.00, '2025-07-17 10:00:06'),
(34, 18, 'Category-A(Outside)', 2, 3, 2100.00, 12600.00, '2025-07-17 10:00:06');

-- --------------------------------------------------------

--
-- Table structure for table `course_development_work`
--

CREATE TABLE `course_development_work` (
  `id` int(11) NOT NULL,
  `payments_main_details_id` int(11) NOT NULL,
  `no_of_panel_meetings` int(11) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_development_work`
--

INSERT INTO `course_development_work` (`id`, `payments_main_details_id`, `no_of_panel_meetings`, `total_cost`, `created_at`) VALUES
(5, 6, 12, 23930.00, '2025-07-04 04:10:22'),
(11, 20, 2, 4490.00, '2025-07-17 09:07:50'),
(12, 21, 30, 9100.00, '2025-07-17 09:50:08');

-- --------------------------------------------------------

--
-- Table structure for table `course_development_work_expenses`
--

CREATE TABLE `course_development_work_expenses` (
  `id` int(11) NOT NULL,
  `course_development_work_id` int(11) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `required_quantity` int(11) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_development_work_expenses`
--

INSERT INTO `course_development_work_expenses` (`id`, `course_development_work_id`, `item_description`, `required_quantity`, `rate`, `amount`, `created_at`) VALUES
(13, 5, 'Refreshments', 12, 80.00, 960.00, '2025-07-04 04:10:22'),
(14, 5, 'Transport', 1, 2000.00, 20000.00, '2025-07-04 04:10:22'),
(15, 5, 'Jek', 1, 200.00, 200.00, '2025-07-04 04:10:22'),
(23, 11, 'Refreshments', 28, 80.00, 2240.00, '2025-07-17 09:07:50'),
(24, 12, 'Refreshments', 20, 80.00, 1600.00, '2025-07-17 09:50:08'),
(25, 12, 'Documentation', 1, 2000.00, 2000.00, '2025-07-17 09:50:08');

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
-- Table structure for table `course_materials_costing`
--

CREATE TABLE `course_materials_costing` (
  `id` int(11) NOT NULL,
  `course_delivery_cost_id` int(11) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `required_quantity` int(11) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_materials_costing`
--

INSERT INTO `course_materials_costing` (`id`, `course_delivery_cost_id`, `item_description`, `required_quantity`, `rate`, `cost`, `created_at`) VALUES
(25, 10, 'Other Material', 2, 1000.00, 2000.00, '2025-07-04 04:14:06'),
(26, 10, 'Magi Pen', 3, 150.00, 450.00, '2025-07-04 04:14:06'),
(27, 10, 'Hesk', 2, 20.00, 40.00, '2025-07-04 04:14:06'),
(31, 14, 'H/Sheet', 19, 2.00, 38.00, '2025-07-17 09:04:26'),
(32, 15, 'Magi Pen', 10, 150.00, 1500.00, '2025-07-17 09:08:47'),
(35, 18, 'H/Sheet', 19, 2.00, 38.00, '2025-07-17 10:00:06');

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
-- Table structure for table `course_overheads_main`
--

CREATE TABLE `course_overheads_main` (
  `id` int(11) NOT NULL,
  `payments_main_details_id` int(11) NOT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_overheads_main`
--

INSERT INTO `course_overheads_main` (`id`, `payments_main_details_id`, `total_cost`, `created_at`) VALUES
(61, 6, 21002.00, '2025-07-04 05:03:39'),
(65, 20, 14250.00, '2025-07-17 09:09:27'),
(66, 21, 18060.00, '2025-07-17 09:50:33');

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
-- Table structure for table `course_revenue_summary`
--

CREATE TABLE `course_revenue_summary` (
  `id` int(11) NOT NULL,
  `payments_main_details_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `no_of_participants` int(11) NOT NULL,
  `paid_no_of_participants` int(11) NOT NULL,
  `total_course_revenue` decimal(12,2) NOT NULL,
  `revenue_received_total` decimal(12,2) NOT NULL,
  `all_fees_collected_status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_revenue_summary`
--

INSERT INTO `course_revenue_summary` (`id`, `payments_main_details_id`, `course_id`, `batch_id`, `no_of_participants`, `paid_no_of_participants`, `total_course_revenue`, `revenue_received_total`, `all_fees_collected_status`, `created_at`, `updated_at`) VALUES
(7, 6, 20, 29, 24, 2, 85200.00, 7100.00, 0, '2025-07-15 06:09:36', '2025-07-15 09:21:13'),
(8, 19, 5, 8, 24, 0, 31200.00, 0.00, 0, '2025-07-17 09:04:51', '2025-07-17 09:04:51'),
(9, 20, 40, 50, 20, 0, 38000.00, 0.00, 0, '2025-07-17 09:09:45', '2025-07-17 09:09:45'),
(11, 21, 69, 50, 30, 0, 87000.00, 0.00, 0, '2025-07-17 10:00:16', '2025-07-17 10:00:16');

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
(6, 'Keshan Narangoda', 'test@gmail.com', NULL, '81941713813V', '2025-06-04', 'kandy', '07183912180', 'B', '824618', '913713912113', NULL, NULL, NULL, NULL, 'Active', 43, '2025-06-01 22:00:36', '2025-07-22 13:05:52', NULL),
(7, 'Chami Perera', 'testmul@gmail.com', NULL, '81941713813V', '2025-06-04', 'sss', '0717373755', 'A', '824618', '49141749131', NULL, NULL, NULL, NULL, 'Active', 43, '2025-06-03 14:37:27', '2025-06-03 20:56:01', NULL),
(8, 'Chandula Rajapaksha', 'chandula@nibm.lk', NULL, '81941713813V', '1997-06-19', '23/7 University Avenue, Colombo', '0771234567', 'B', '975386', '913713912113', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/nic_file-1748956937248.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/photo_file-1748956937252.png', '/Users/kashika_hettihewa/Downloads/Movies 💗/event-management/server/uploads/lecturers/chandula_nibm_lk/driving_trainer_license_file-1748956937276.png', NULL, 'Active', 43, '2025-06-03 18:52:17', '2025-06-03 20:56:22', NULL),
(9, 'Kashika Hettihewa', 'kashikabanu@gmail.com', NULL, '81941713813V', '1990-06-06', 'Colombo', '0717373756', 'A', '975386', '913713912113', NULL, NULL, NULL, NULL, 'Active', 43, '2025-06-24 08:53:34', '2025-07-22 15:23:03', NULL),
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
(16, 10, 'BSc', 'DP', '\"[{\\\"institution\\\":\\\"SLIIT\\\",\\\"years\\\":\\\"10\\\",\\\"start\\\":\\\"2015-01-01\\\",\\\"end\\\":\\\"2025-01-01\\\",\\\"designation\\\":\\\"Director\\\",\\\"nature\\\":\\\"Examing\\\"}]\"', NULL, '2025-07-09 20:13:36', '2025-07-09 20:13:36'),
(19, 6, 'PHD', 'BSc', '\"[{\\\"institution\\\":\\\"NIBM\\\",\\\"years\\\":\\\"20\\\",\\\"start\\\":\\\"2013\\\",\\\"end\\\":\\\"2025\\\",\\\"designation\\\":\\\"Junior Lecturer\\\",\\\"nature\\\":\\\"Management \\\"},{\\\"institution\\\":\\\"SLIIT\\\",\\\"years\\\":\\\"2\\\",\\\"start\\\":\\\"2006\\\",\\\"end\\\":\\\"2013\\\",\\\"designation\\\":\\\"Lecturer\\\",\\\"nature\\\":\\\"Management \\\"}]\"', NULL, '2025-07-22 13:05:52', '2025-07-22 13:05:52'),
(20, 9, 'adad', 'adad', '\"[{\\\"institution\\\":\\\"daada\\\",\\\"years\\\":\\\"12\\\",\\\"start\\\":\\\"adad\\\",\\\"end\\\":\\\"dada\\\",\\\"designation\\\":\\\"dada\\\",\\\"nature\\\":\\\"ada\\\"}]\"', NULL, '2025-07-22 15:23:03', '2025-07-22 15:23:03');

-- --------------------------------------------------------

--
-- Table structure for table `lecturer_attendance`
--

CREATE TABLE `lecturer_attendance` (
  `id` int(11) NOT NULL,
  `payments_main_details_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `role` varchar(100) NOT NULL,
  `course_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `worked_hours` int(11) NOT NULL,
  `expected_work_hours` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lecturer_attendance`
--

INSERT INTO `lecturer_attendance` (`id`, `payments_main_details_id`, `lecturer_id`, `role`, `course_id`, `batch_id`, `user_id`, `rate`, `worked_hours`, `expected_work_hours`, `created_at`, `updated_at`) VALUES
(5, 6, 101, 'Category-B(Outside)', 20, 29, 73, 1500.00, 4, 4, '2025-07-16 14:41:25', '2025-07-16 14:45:35'),
(7, 6, 102, 'Coordination', 20, 29, 73, 1000.00, 0, 0, '2025-07-16 14:43:24', '2025-07-16 14:57:20'),
(8, 6, 103, 'Category-B(Outside)', 20, 29, 73, 1500.00, 3, 4, '2025-07-16 14:50:27', '2025-07-16 14:57:26'),
(5, 6, 101, 'Category-B(Outside)', 20, 29, 73, 1500.00, 4, 4, '2025-07-16 14:41:25', '2025-07-16 14:45:35'),
(7, 6, 102, 'Coordination', 20, 29, 73, 1000.00, 0, 0, '2025-07-16 14:43:24', '2025-07-16 14:57:20'),
(8, 6, 103, 'Category-B(Outside)', 20, 29, 73, 1500.00, 3, 4, '2025-07-16 14:50:27', '2025-07-16 14:57:26');

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
(16, 10, 'Bank of Ceylon', 'Colombo', '9319310313', NULL, '2025-07-09 20:13:36', '2025-07-09 20:13:36'),
(19, 6, 'People\'s Bank', 'Boralesgamuwa', '1313131313', NULL, '2025-07-22 13:05:52', '2025-07-22 13:05:52'),
(20, 9, 'People\'s Bank', 'dadadas', '2121121212', NULL, '2025-07-22 15:23:03', '2025-07-22 15:23:03');

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
(10, 6, 10, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-07-19 18:54:40', '2025-07-19 18:54:40'),
(11, 9, 10, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-07-19 19:38:07', '2025-07-19 19:38:07'),
(12, 6, 13, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-07-22 13:06:52', '2025-07-22 13:06:52'),
(13, 9, 12, NULL, 0, NULL, NULL, NULL, 'Assigned', '2025-07-22 13:12:25', '2025-07-22 13:12:25');

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
(24, 6, 31, 1, 'TEST', 'Software Engineering ', '2025-07-22', 'Active', '2025-07-22 13:05:52', '2025-07-22 13:05:52'),
(25, 9, 21, 1, 'IT', 'Software Engineering ', '2025-07-22', 'Active', '2025-07-22 15:23:03', '2025-07-22 15:23:03'),
(26, 9, 18, 0, 'IT', 'Software Engineering ', '2025-07-22', 'Active', '2025-07-22 15:23:03', '2025-07-22 15:23:03'),
(27, 9, 22, 0, 'IT', 'Software Engineering ', '2025-07-22', 'Active', '2025-07-22 15:23:03', '2025-07-22 15:23:03');

-- --------------------------------------------------------

--
-- Table structure for table `lecturer_payments`
--

CREATE TABLE `lecturer_payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `paid_worked_hours` int(11) NOT NULL,
  `payment_received_amount` decimal(10,2) NOT NULL,
  `full_amount_payable` decimal(10,2) NOT NULL,
  `payment_completed` tinyint(1) NOT NULL DEFAULT 0,
  `lecturer_attend_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lecturer_payments`
--

INSERT INTO `lecturer_payments` (`id`, `user_id`, `paid_worked_hours`, `payment_received_amount`, `full_amount_payable`, `payment_completed`, `lecturer_attend_id`, `created_at`, `updated_at`) VALUES
(1, 73, 4, 6000.00, 6000.00, 1, 5, '2025-07-16 15:07:07', '2025-07-16 15:08:35'),
(3, 73, 0, 2000.00, 2000.00, 1, 7, '2025-07-16 15:10:02', '2025-07-16 15:10:02'),
(1, 73, 4, 6000.00, 6000.00, 1, 5, '2025-07-16 15:07:07', '2025-07-16 15:08:35'),
(3, 73, 0, 2000.00, 2000.00, 1, 7, '2025-07-16 15:10:02', '2025-07-16 15:10:02');

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
(1, 9, 'kashikabanu@gmail.com', '$2b$10$pGgubM7P/hqsLV3NTwEO5uGIJ19wha4lxrdzxCjoi3NlBSrlYWXRi', 'ACTIVE', 0, NULL, NULL, NULL, NULL, '2025-07-22 13:20:03', '2025-06-24 08:53:34', '2025-07-22 13:20:03'),
(2, 10, 'lenalfdo351@gmail.com', '$2b$10$2xB9s1o/xYtJEmaOr5Dd9.rCv/WDDYpT4Hf0lkBYUvXSTExLA9hW.', 'ACTIVE', 0, NULL, NULL, NULL, NULL, '2025-07-23 15:54:41', '2025-07-09 20:13:36', '2025-07-23 15:54:41');

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
-- Table structure for table `other_expenses`
--

CREATE TABLE `other_expenses` (
  `id` int(11) NOT NULL,
  `payments_main_details_id` int(11) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `required_quantity` int(11) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `overheads`
--

CREATE TABLE `overheads` (
  `id` int(11) NOT NULL,
  `course_overheads_main_id` int(11) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `required_quantity` int(11) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `overheads`
--

INSERT INTO `overheads` (`id`, `course_overheads_main_id`, `item_description`, `required_quantity`, `rate`, `cost`, `created_at`) VALUES
(32, 61, 'Transport', 3, 100.00, 300.00, '2025-07-04 05:03:39'),
(33, 61, 'Tea (Plain)', 4, 25.00, 100.00, '2025-07-04 05:03:39'),
(34, 61, 'check', 1, 204.00, 204.00, '2025-07-04 05:03:39'),
(38, 65, 'Tea (Plain)', 10, 25.00, 250.00, '2025-07-17 09:09:27'),
(39, 66, 'Tea (Plain)', 10, 25.00, 250.00, '2025-07-17 09:50:33'),
(40, 66, 'Tea (Milk)', 9, 90.00, 810.00, '2025-07-17 09:50:33');

-- --------------------------------------------------------

--
-- Table structure for table `panel_meeting_participants`
--

CREATE TABLE `panel_meeting_participants` (
  `id` int(11) NOT NULL,
  `course_development_work_id` int(11) NOT NULL,
  `participant_type` varchar(100) NOT NULL,
  `nos` int(11) DEFAULT NULL,
  `rate_per_hour` decimal(10,2) DEFAULT NULL,
  `smes` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `panel_meeting_participants`
--

INSERT INTO `panel_meeting_participants` (`id`, `course_development_work_id`, `participant_type`, `nos`, `rate_per_hour`, `smes`, `amount`, `created_at`) VALUES
(15, 5, 'Hes', 1, 20.00, 'No', 20.00, '2025-07-04 04:10:22'),
(16, 5, 'Panal Meeting SME SLPA', 1, 750.00, 'Yes', 750.00, '2025-07-04 04:10:22'),
(17, 5, 'Panal Meeting SME Outsider', 1, 2000.00, 'Yes', 2000.00, '2025-07-04 04:10:22'),
(21, 11, 'Panal Meeting SME SLPA', 3, 750.00, 'Yes', 2250.00, '2025-07-17 09:07:50'),
(22, 12, 'Panal Meeting SME SLPA', 2, 750.00, 'Yes', 1500.00, '2025-07-17 09:50:08'),
(23, 12, 'Panal Meeting SME Outsider', 2, 2000.00, 'Yes', 4000.00, '2025-07-17 09:50:08');

-- --------------------------------------------------------

--
-- Table structure for table `payments_main_details`
--

CREATE TABLE `payments_main_details` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `course_name` varchar(255) NOT NULL,
  `no_of_participants` int(11) DEFAULT 0,
  `duration` varchar(255) DEFAULT NULL,
  `customer_type` varchar(255) DEFAULT NULL,
  `stream` varchar(100) DEFAULT NULL,
  `CTM_approved` varchar(50) DEFAULT 'Pending',
  `CTM_details` text DEFAULT NULL,
  `special_justifications` text DEFAULT NULL,
  `date` date DEFAULT curdate(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments_main_details`
--

INSERT INTO `payments_main_details` (`id`, `user_id`, `course_id`, `batch_id`, `course_name`, `no_of_participants`, `duration`, `customer_type`, `stream`, `CTM_approved`, `CTM_details`, `special_justifications`, `date`, `created_at`, `last_updated`) VALUES
(6, 73, 20, 29, 'Proficiency in Elementary First Aid', 24, '6 days', 'Private', 'MARITIME COURSES', 'Approved', 'Testing...', 'Nothing...', '2025-07-04', '2025-07-04 03:59:15', '2025-07-05 05:13:33'),
(17, 73, 8, 6, 'Proficiency in Basic Trauma', 29, '3 days', 'Private', 'MARITIME COURSES', 'Pending', 'Testing ', 'Nothing...', '2025-07-13', '2025-07-13 05:14:52', '2025-07-13 05:14:52'),
(18, 73, 1, 2, 'Maritime English', 27, '2 days', 'NGO', 'MARITIME COURSES', 'Pending', 'Testing 2', 'fwwf', '2025-07-13', '2025-07-13 05:38:46', '2025-07-13 05:38:46'),
(19, 73, 5, 8, 'Proficiency in Elementary First Aid', 24, '3 days', 'Government', 'MARITIME COURSES', 'Pending', 'Testing ', 'Nothing...', '2025-07-15', '2025-07-15 05:44:25', '2025-07-15 05:44:25'),
(20, 73, 40, 50, 'Proficiency in Elementary First Aid', 20, '3 days', 'Private', 'MARITIME COURSES', 'Pending', 'Testing ', 'fwofjwofjw', '2025-07-16', '2025-07-17 09:07:23', '2025-07-17 09:07:23'),
(21, 73, 69, 50, 'Proficiency in Basic Trauma', 30, '3 days', 'Government', 'MARITIME COURSES', 'Pending', 'Testing ', 'Nothing...', '2025-07-17', '2025-07-17 09:16:42', '2025-07-17 09:16:42');

-- --------------------------------------------------------

--
-- Table structure for table `payment_emails`
--

CREATE TABLE `payment_emails` (
  `id` int(11) NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `user_type` enum('student','lecturer') NOT NULL,
  `reference_id` int(11) NOT NULL,
  `email_type` enum('payment_received','payment_made') NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('sent','failed') DEFAULT 'sent',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Table structure for table `rates`
--

CREATE TABLE `rates` (
  `id` int(11) NOT NULL,
  `user_created_id` int(11) DEFAULT NULL,
  `user_updated_id` int(11) DEFAULT NULL,
  `item_description` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `rate_type` varchar(50) DEFAULT 'Quantity',
  `cost_type` varchar(50) DEFAULT 'C',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rates`
--

INSERT INTO `rates` (`id`, `user_created_id`, `user_updated_id`, `item_description`, `category`, `rate`, `rate_type`, `cost_type`, `created_at`, `last_updated`) VALUES
(4, 73, NULL, 'Panal Meeting SME SLPA', 'Course Development Work', 750.00, 'Hourly', 'A', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(5, 73, NULL, 'Panal Meeting SME Outsider', 'Course Development Work', 2000.00, 'Hourly', 'A', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(6, 73, NULL, 'Refreshments', 'Course Development Work', 80.00, 'Quantity', 'A', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(7, 73, NULL, 'Documentation', 'Course Development Work', 2000.00, 'Full Payment', 'A', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(8, 73, NULL, 'Transport', 'Course Development Work', 2000.00, 'Full Payment', 'A', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(9, 73, NULL, 'Incidental Expenses', 'Course Development Work', 200.00, 'Quantity', 'A', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(10, 73, NULL, 'Miscellaneous', 'Course Development Work', 200.00, 'Full Payment', 'A', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(19, 73, 75, 'Category-B(SLPA)', 'Course Delivery Human Resources', 10050.00, 'Hourly', 'B', '2025-06-16 07:50:03', '2025-07-21 05:02:00'),
(21, 73, NULL, 'Category-A(Outside)', 'Course Delivery Human Resources', 2100.00, 'Hourly', 'B', '2025-06-16 07:50:03', '2025-06-29 04:46:25'),
(22, 73, NULL, 'Category-B(Outside)', 'Course Delivery Human Resources', 1500.00, 'Hourly', 'B', '2025-06-16 07:50:03', '2025-06-29 04:46:43'),
(23, 73, NULL, 'Category-C(Outside)', 'Course Delivery Human Resources', 1000.00, 'Hourly', 'B', '2025-06-16 07:50:03', '2025-06-29 04:46:50'),
(24, 73, NULL, 'Coordination', 'Course Delivery Human Resources', 1000.00, 'Full Payment', 'B', '2025-06-16 07:50:03', '2025-06-29 04:41:26'),
(25, 73, NULL, 'Lecturer Payment(Resource Person)', 'Course Delivery Human Resources', 1000.00, 'Full Payment', 'B', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(26, 73, NULL, 'Examination', 'Course Delivery (Materials)', 1000.00, 'Full Payment', 'B', '2025-06-16 07:50:03', '2025-06-29 04:47:30'),
(27, 73, NULL, 'Handouts', 'Course Delivery (Materials)', 15.00, 'Quantity', 'B', '2025-06-16 07:50:03', '2025-06-29 04:47:17'),
(28, 73, NULL, 'H/Sheet', 'Course Delivery (Materials)', 2.00, 'Quantity', 'B', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(29, 73, NULL, 'Magi Pen', 'Course Delivery (Materials)', 150.00, 'Quantity', 'B', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(30, 73, NULL, 'File Covers', 'Course Delivery (Materials)', 15.00, 'Quantity', 'B', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(31, 73, NULL, 'Other Material', 'Course Delivery (Materials)', 1000.00, 'Full Payment', 'B', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(32, 73, NULL, 'Multimedia Projector', 'Course Delivery (Teaching Aid)', 500.00, 'Quantity_Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(33, 73, NULL, 'Overhead Projector', 'Course Delivery (Teaching Aid)', 500.00, 'Quantity_Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(34, 73, NULL, 'Chart Stand', 'Course Delivery (Teaching Aid)', 100.00, 'Quantity_Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(35, 73, NULL, 'Flannel Board', 'Course Delivery (Teaching Aid)', 100.00, 'Quantity_Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(36, 73, NULL, 'Personal Computer', 'Course Delivery (Teaching Aid)', 500.00, 'Quantity_Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(37, 73, NULL, 'Other Teaching Aid', 'Course Delivery (Teaching Aid)', 500.00, 'Full Payment', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(38, 73, NULL, 'Auditorium', 'Course Delivery (Teaching Env)', 30000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(39, 73, NULL, 'Classroom', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(40, 73, NULL, 'Computer Lab', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(41, 73, NULL, 'Electric & Electronic Lab', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(42, 73, NULL, 'Mechatronic Lab', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(43, 73, NULL, 'Welding Workshop', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(44, 73, NULL, 'Electric & Electronic Workshop', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(45, 73, NULL, 'Training Yard', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(46, 73, NULL, 'Ship Simulator', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(47, 73, NULL, 'Fire Simulator', 'Course Delivery (Teaching Env)', 6000.00, 'Hourly', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(48, 73, NULL, 'Transport', 'Overheads', 100.00, 'Full Payment', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(49, 73, NULL, 'Tea (Plain)', 'Overheads', 25.00, 'Quantity', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(50, 73, NULL, 'Tea (Milk)', 'Overheads', 90.00, 'Quantity', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(51, 73, NULL, 'Snacks', 'Overheads', 100.00, 'Quantity', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(52, 73, NULL, 'Meals', 'Overheads', 550.00, 'Quantity', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(53, 73, NULL, 'Certificates', 'Overheads', 1000.00, 'Quantity', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(54, 73, NULL, 'Certificates Holders', 'Overheads', 200.00, 'Quantity', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(55, 73, NULL, 'Other Overheads', 'Overheads', 100.00, 'Full Payment', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(56, 73, NULL, 'Incidental Overheads', 'Overheads', 1000.00, 'Quantity', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(57, 73, NULL, 'Administration', 'Overheads', 5000.00, 'Full Payment', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(58, 73, NULL, 'Marketing Cost', 'Overheads', 1000.00, 'Full Payment', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(59, 73, NULL, 'Maintenance Cost', 'Overheads', 1000.00, 'Full Payment', 'C', '2025-06-16 07:50:03', '2025-06-16 10:11:57'),
(66, 73, NULL, 'Provision For Inflation Percentage', 'Course Cost Final Report', 5.00, 'Quantity', 'C', '2025-06-29 04:54:23', '2025-06-29 04:54:56'),
(67, 73, 73, 'NBT', 'Course Cost Final Report', 1000.00, 'Quantity', 'C', '2025-06-29 04:54:23', '2025-07-11 04:23:02'),
(68, 73, 73, 'Profit Margin Percentage', 'Course Cost Final Report', 24.00, 'Quantity', 'C', '2025-06-29 04:54:23', '2025-07-15 05:50:12'),
(69, 73, NULL, 'file clip', 'Course Delivery (Materials)', 12.00, 'Quantity', 'C', '2025-07-15 05:46:59', '2025-07-15 05:46:59');

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
  `student_id` varchar(50) DEFAULT NULL,
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

INSERT INTO `students` (`id`, `student_id`, `full_name`, `email`, `identification_type`, `id_number`, `nationality`, `date_of_birth`, `country`, `cdc_number`, `address`, `department`, `company`, `sea_service`, `emergency_contact_name`, `emergency_contact_number`, `is_swimmer`, `is_slpa_employee`, `designation`, `division`, `service_no`, `section_unit`, `nic_document_path`, `passport_document_path`, `photo_path`, `driving_details`, `status`, `payment_status`, `created_by`, `created_at`, `updated_at`) VALUES
(990094, NULL, 'Kashika', 'kashikabanu@gmail.com', 'Passport', '718403413', 'Srilanka', '1997-02-14', 'Srilanka', '313131', 'test', 'test', 'WSO2', '4', 'Krishantha', '0717373756', 1, 1, 'adad', 'dada', '11414141', 'ada', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/students/kashikabanu_gmail_com/nic_document-1753076131409.png', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/students/kashikabanu_gmail_com/passport_document-1753076131414.png', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/students/kashikabanu_gmail_com/photo-1753076131420.png', '{\"driving_license_no\":\"\",\"driving_class\":\"\",\"issue_date\":\"\"}', 'Active', 'Pending', 75, '2025-07-21 11:05:31', '2025-07-23 15:07:01'),
(990095, NULL, 'Kavinda', 'kavindradissanayake97@gmail.com', 'NIC', '718403413V', 'Srilankan', '2000-03-03', 'Srilanka', '675984', 'TEST', 'TEST', 'WSO2', '10', 'Dad', '0717373756', 1, 1, 'TEST', 'TEST', '813139131', 'TEST', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/students/kavindradissanayake97_gmail_com/nic_document-1753158545890.png', NULL, NULL, '{\"driving_license_no\":\"30001291212\",\"driving_class\":\"A\",\"issue_date\":\"2011-11-10\"}', 'Active', 'Pending', 75, '2025-07-21 13:33:42', '2025-07-22 10:25:40'),
(990098, NULL, 'test', 'test@gmail.com', 'NIC', '718403413V', 'Srilanka', '1999-01-29', 'Srilanka', '731319', 'teataea', 'TEST', 'WSO2', '10', 'Krishantha', '0717373756', 0, 1, 'TEST', 'TEST', '13131313', 'TEST', NULL, NULL, NULL, '{\"driving_license_no\":\"\",\"driving_class\":\"\",\"issue_date\":\"\"}', 'Active', 'Pending', 75, '2025-07-22 11:32:07', '2025-07-22 11:49:23'),
(990099, NULL, 'nuwantha', 'nuwanthasiriwardhana@gmail.com', 'NIC', '973872777v', 'Srilanka', '2000-09-11', 'LK', '', 'kandy,\r\nmailapitiya', '', '', '', 'sriyani', '0706244220', 1, 0, '', '', '', '', '/Users/kashika_hettihewa/Desktop/Auditorium-Booking-System/Auditorium-Booking-System/server/uploads/students/nuwanthasiriwardhana_gmail_com/nic_document-1753169431652.png', NULL, NULL, '{\"driving_license_no\":\"72777772777\",\"driving_class\":\"B\",\"issue_date\":\"2024-10-15\"}', 'Active', 'Pending', 75, '2025-07-22 12:59:37', '2025-07-22 13:00:31'),
(990100, NULL, 'Kashika', 'lenalfdo351@gmail.com', 'NIC', '718403413V', 'Srilanka', '1996-10-17', 'Srilanka', NULL, 'sasa', NULL, 'NIBM', NULL, 'Krishantha', '0717373756', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{\"driving_license_no\":\"\",\"driving_class\":\"\",\"issue_date\":\"\"}', 'Active', 'Pending', 75, '2025-07-23 15:09:51', '2025-07-23 15:09:51');

-- --------------------------------------------------------

--
-- Stand-in structure for view `student_announcements_with_status`
-- (See below for the actual view)
--
CREATE TABLE `student_announcements_with_status` (
`id` int(11)
,`batch_id` int(11)
,`lecturer_id` int(11)
,`title` varchar(255)
,`content` text
,`priority` enum('low','normal','medium','high','urgent')
,`is_published` tinyint(1)
,`publish_date` datetime
,`created_at` timestamp
,`updated_at` timestamp
,`batch_name` varchar(100)
,`course_id` int(11)
,`courseName` varchar(255)
,`lecturer_name` varchar(255)
,`student_id` int(11)
,`is_read` int(1)
,`read_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `student_announcement_reads`
--

CREATE TABLE `student_announcement_reads` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `announcement_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_announcement_reads`
--

INSERT INTO `student_announcement_reads` (`id`, `student_id`, `announcement_id`, `read_at`, `created_at`) VALUES
(3, 990094, 11, '2025-07-22 07:49:37', '2025-07-22 07:49:37');

-- --------------------------------------------------------

--
-- Table structure for table `student_batches`
--

CREATE TABLE `student_batches` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `student_code` varchar(50) DEFAULT NULL COMMENT 'Student code assigned when student joined this batch (e.g., MP-PST25.1-001)',
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

INSERT INTO `student_batches` (`id`, `student_id`, `batch_id`, `student_code`, `enrollment_date`, `attendance_percentage`, `status`, `completion_certificate`, `created_at`, `updated_at`) VALUES
(15, 990095, 10, 'MP-PSSR25.1-001', NULL, 0.00, 'Active', NULL, '2025-07-21 13:38:17', '2025-07-21 13:38:17'),
(16, 990099, 13, 'MP-BOATMASTER25.1-001', NULL, 0.00, 'Active', NULL, '2025-07-22 13:06:30', '2025-07-22 13:06:30'),
(17, 990094, 12, 'MP-PSSR25.3-001', NULL, 0.00, 'Active', NULL, '2025-07-22 13:10:07', '2025-07-22 13:10:07');

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
  `student_code` varchar(50) DEFAULT NULL,
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

INSERT INTO `student_courses` (`id`, `student_id`, `student_code`, `course_id`, `enrollment_date`, `primary_course`, `status`, `completion_date`, `grade`, `remarks`, `created_at`, `updated_at`) VALUES
(33, 990094, 'MP-PSSR25.3-001', 21, '2025-07-21', 1, 'Active', NULL, NULL, NULL, '2025-07-21 11:05:31', '2025-07-23 15:07:01'),
(34, 990094, NULL, 20, '2025-07-21', 0, 'Active', NULL, NULL, NULL, '2025-07-21 11:05:31', '2025-07-21 11:05:31'),
(35, 990095, 'MP-PSSR25.1-001', 21, '2025-07-21', 1, 'Active', NULL, NULL, NULL, '2025-07-21 13:33:43', '2025-07-22 09:59:05'),
(36, 990095, NULL, 20, '2025-07-21', 0, 'Active', NULL, NULL, NULL, '2025-07-21 13:33:43', '2025-07-21 13:33:43'),
(37, 990095, NULL, 44, '2025-07-21', 0, 'Active', NULL, NULL, NULL, '2025-07-21 14:00:10', '2025-07-21 14:00:10'),
(40, 990098, NULL, 26, '2025-07-22', 1, 'Active', NULL, NULL, NULL, '2025-07-22 11:32:07', '2025-07-22 11:49:23'),
(41, 990099, 'MP-BOATMASTER25.1-001', 31, '2025-07-22', 1, 'Active', NULL, NULL, NULL, '2025-07-22 12:59:37', '2025-07-22 13:06:30'),
(42, 990099, NULL, 49, '2025-07-22', 0, 'Active', NULL, NULL, NULL, '2025-07-22 12:59:37', '2025-07-22 12:59:37'),
(43, 990100, NULL, 18, '2025-07-23', 1, 'Active', NULL, NULL, NULL, '2025-07-23 15:09:51', '2025-07-23 15:09:51'),
(44, 990100, NULL, 20, '2025-07-23', 0, 'Active', NULL, NULL, NULL, '2025-07-23 15:09:51', '2025-07-23 15:09:51');

-- --------------------------------------------------------

--
-- Table structure for table `student_id_sequences`
--

CREATE TABLE `student_id_sequences` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `year` int(11) NOT NULL,
  `batch_number` int(11) NOT NULL DEFAULT 1,
  `current_sequence` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_payments`
--

CREATE TABLE `student_payments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `payment_completed` tinyint(1) NOT NULL DEFAULT 0,
  `amount_paid` decimal(10,2) NOT NULL,
  `full_amount_payable` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_payments`
--

INSERT INTO `student_payments` (`id`, `student_id`, `course_id`, `batch_id`, `user_id`, `payment_completed`, `amount_paid`, `full_amount_payable`, `created_at`, `updated_at`) VALUES
(4, 2, 20, 29, 73, 1, 3550.00, 3550.00, '2025-07-15 08:48:58', '2025-07-15 09:09:44'),
(5, 4, 20, 29, 73, 1, 3550.00, 3550.00, '2025-07-15 09:16:56', '2025-07-15 09:16:56');

-- --------------------------------------------------------

--
-- Stand-in structure for view `student_unread_announcements`
-- (See below for the actual view)
--
CREATE TABLE `student_unread_announcements` (
`student_id` int(11)
,`batch_id` int(11)
,`unread_count` bigint(21)
,`latest_announcement_date` timestamp
);

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
(13, 990094, 'kashikabanu@gmail.com', '$2b$10$jb5WCNhZyr4tV/0kpD4xGuj.VeyIGXHRSj/ApOYIkHhscHKLGMoYe', 'ACTIVE', 0, NULL, NULL, NULL, '2025-07-21 11:05:31', '2025-07-23 15:28:21', NULL, NULL),
(14, 990095, 'kavindradissanayake97@gmail.com', '$2b$10$v7OybLydGZ3zXlft3GfR2.FIvgziAPqbEVR0WQBxhdrGzxw9Z3T0S', 'ACTIVE', 0, NULL, NULL, NULL, '2025-07-21 13:33:43', '2025-07-21 13:35:35', NULL, NULL),
(17, 990098, 'test@gmail.com', '$2b$10$0F9djXVWr1dkOGU0qJlVoOP2cxPGhj6qC5NKBFXLBxrJNQgR4KHlm', 'ACTIVE', 1, NULL, NULL, NULL, '2025-07-22 11:32:07', '2025-07-22 11:32:07', NULL, NULL),
(18, 990099, 'nuwanthasiriwardhana@gmail.com', '$2b$10$y8gp1bFyF0QfLZJ75cndo.uUYC5Jx.XJzrwZ2lwCV0UKe0iyyFG62', 'ACTIVE', 1, NULL, NULL, NULL, '2025-07-22 12:59:37', '2025-07-22 12:59:37', NULL, NULL),
(19, 990100, 'lenalfdo351@gmail.com', '$2b$10$1z6tWZspu4NassaiYDNU5.MkyHYoyKf0lrcsc9KWm1vDG.ErR.dxS', 'ACTIVE', 1, NULL, NULL, NULL, '2025-07-23 15:09:51', '2025-07-23 15:09:51', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `training_environments`
--

CREATE TABLE `training_environments` (
  `id` int(11) NOT NULL,
  `course_overheads_main_id` int(11) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `required_hours` int(11) NOT NULL,
  `hourly_rate` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `training_environments`
--

INSERT INTO `training_environments` (`id`, `course_overheads_main_id`, `item_description`, `required_hours`, `hourly_rate`, `cost`, `created_at`) VALUES
(82, 61, 'Computer Lab', 1, 6000.00, 6000.00, '2025-07-04 05:03:39'),
(83, 61, 'Auditorium', 3, 3000.00, 9000.00, '2025-07-04 05:03:39'),
(84, 61, 'Rescue', 2, 299.00, 598.00, '2025-07-04 05:03:39'),
(88, 65, 'Electric & Electronic Lab', 2, 6000.00, 12000.00, '2025-07-17 09:09:27'),
(89, 66, 'Classroom', 1, 6000.00, 6000.00, '2025-07-17 09:50:33'),
(90, 66, 'Computer Lab', 1, 6000.00, 6000.00, '2025-07-17 09:50:33');

-- --------------------------------------------------------

--
-- Table structure for table `training_teaching_aids`
--

CREATE TABLE `training_teaching_aids` (
  `id` int(11) NOT NULL,
  `course_overheads_main_id` int(11) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `required_quantity` int(11) NOT NULL,
  `required_hours` int(11) NOT NULL,
  `hourly_rate` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `training_teaching_aids`
--

INSERT INTO `training_teaching_aids` (`id`, `course_overheads_main_id`, `item_description`, `required_quantity`, `required_hours`, `hourly_rate`, `cost`, `created_at`) VALUES
(104, 61, 'Multimedia Projector', 1, 2, 500.00, 1000.00, '2025-07-04 05:03:39'),
(105, 61, 'Other Teaching Aid', 2, 3, 500.00, 3000.00, '2025-07-04 05:03:39'),
(106, 61, 'Chart Stand', 1, 2, 200.00, 400.00, '2025-07-04 05:03:39'),
(107, 61, 'Hes', 1, 2, 200.00, 400.00, '2025-07-04 05:03:39'),
(111, 65, 'Multimedia Projector', 1, 4, 500.00, 2000.00, '2025-07-17 09:09:27'),
(112, 66, 'Overhead Projector', 2, 3, 500.00, 3000.00, '2025-07-17 09:50:33'),
(113, 66, 'Chart Stand', 10, 2, 100.00, 2000.00, '2025-07-17 09:50:33');

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

--
-- Dumping data for table `user_refresh_tokens`
--

INSERT INTO `user_refresh_tokens` (`user_id`, `refresh_token`, `updated_at`) VALUES
(75, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NzUsIm5hbWUiOiJBY2Nlc3NUb2tlbkFkbWluIiwiZW1haWwiOiJTdXBlckFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJbXCJTdXBlckFkbWluXCJdIiwiaWF0IjoxNzUzMjY2Mjk2LCJleHAiOjE3NTU4NTgyOTZ9.cBXC32MZBBrktPCyfM0xxkhEUI_Z4cRZL_fAmYnuMRA', '2025-07-23 15:54:56');

-- --------------------------------------------------------

--
-- Structure for view `batch_overview`
--
DROP TABLE IF EXISTS `batch_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `batch_overview`  AS SELECT `b`.`id` AS `id`, `b`.`batch_name` AS `batch_name`, `b`.`start_date` AS `start_date`, `b`.`end_date` AS `end_date`, `b`.`status` AS `status`, `b`.`students_count` AS `students_count`, `b`.`materials_count` AS `materials_count`, `b`.`assignments_count` AS `assignments_count`, `b`.`announcements_count` AS `announcements_count`, `c`.`courseName` AS `courseName`, `c`.`courseId` AS `courseId`, `l`.`full_name` AS `lecturer_name`, `l`.`email` AS `lecturer_email` FROM ((`batches` `b` join `courses` `c` on(`b`.`course_id` = `c`.`id`)) join `lecturers` `l` on(`b`.`lecturer_id` = `l`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `student_announcements_with_status`
--
DROP TABLE IF EXISTS `student_announcements_with_status`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `student_announcements_with_status`  AS SELECT `a`.`id` AS `id`, `a`.`batch_id` AS `batch_id`, `a`.`lecturer_id` AS `lecturer_id`, `a`.`title` AS `title`, `a`.`content` AS `content`, `a`.`priority` AS `priority`, `a`.`is_published` AS `is_published`, `a`.`publish_date` AS `publish_date`, `a`.`created_at` AS `created_at`, `a`.`updated_at` AS `updated_at`, `b`.`batch_name` AS `batch_name`, `b`.`course_id` AS `course_id`, `c`.`courseName` AS `courseName`, `l`.`full_name` AS `lecturer_name`, `sb`.`student_id` AS `student_id`, CASE WHEN `sar`.`id` is not null THEN 1 ELSE 0 END AS `is_read`, `sar`.`read_at` AS `read_at` FROM (((((`announcements` `a` join `batches` `b` on(`a`.`batch_id` = `b`.`id`)) join `courses` `c` on(`b`.`course_id` = `c`.`id`)) join `lecturers` `l` on(`a`.`lecturer_id` = `l`.`id`)) join `student_batches` `sb` on(`b`.`id` = `sb`.`batch_id`)) left join `student_announcement_reads` `sar` on(`sar`.`student_id` = `sb`.`student_id` and `sar`.`announcement_id` = `a`.`id`)) WHERE `a`.`is_published` = 1 AND `sb`.`status` = 'Active' ORDER BY `a`.`created_at` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `student_unread_announcements`
--
DROP TABLE IF EXISTS `student_unread_announcements`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `student_unread_announcements`  AS SELECT `sb`.`student_id` AS `student_id`, `sb`.`batch_id` AS `batch_id`, count(`a`.`id`) AS `unread_count`, max(`a`.`created_at`) AS `latest_announcement_date` FROM ((`student_batches` `sb` join `announcements` `a` on(`sb`.`batch_id` = `a`.`batch_id`)) left join `student_announcement_reads` `sar` on(`sar`.`student_id` = `sb`.`student_id` and `sar`.`announcement_id` = `a`.`id`)) WHERE `a`.`is_published` = 1 AND `sb`.`status` = 'Active' AND `sar`.`id` is null GROUP BY `sb`.`student_id`, `sb`.`batch_id` ;

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
  ADD KEY `idx_announcements_batch_published` (`batch_id`,`is_published`),
  ADD KEY `idx_announcements_batch_published_date` (`batch_id`,`is_published`,`created_at`);

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
  ADD UNIQUE KEY `unique_course_year_batch` (`course_id`,`year`,`batch_number`),
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
-- Indexes for table `course_cost_summary`
--
ALTER TABLE `course_cost_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_main_details_id` (`payment_main_details_id`);

--
-- Indexes for table `course_delivery_costs`
--
ALTER TABLE `course_delivery_costs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payment_main_delivery` (`payments_main_details_id`);

--
-- Indexes for table `course_delivery_cost_items`
--
ALTER TABLE `course_delivery_cost_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course_delivery_cost_items_delivery_cost` (`course_delivery_cost_id`);

--
-- Indexes for table `course_development_work`
--
ALTER TABLE `course_development_work`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payment_main_cd` (`payments_main_details_id`);

--
-- Indexes for table `course_development_work_expenses`
--
ALTER TABLE `course_development_work_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course_dev_work_expenses` (`course_development_work_id`);

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
-- Indexes for table `course_materials_costing`
--
ALTER TABLE `course_materials_costing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course_materials_delivery` (`course_delivery_cost_id`);

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
-- Indexes for table `course_overheads_main`
--
ALTER TABLE `course_overheads_main`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payment_main_overheads` (`payments_main_details_id`);

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
-- Indexes for table `course_revenue_summary`
--
ALTER TABLE `course_revenue_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payment_main_crs` (`payments_main_details_id`);

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
-- Indexes for table `overheads`
--
ALTER TABLE `overheads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course_overheads_main_oh` (`course_overheads_main_id`);

--
-- Indexes for table `panel_meeting_participants`
--
ALTER TABLE `panel_meeting_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course_dev_work_participants` (`course_development_work_id`);

--
-- Indexes for table `payments_main_details`
--
ALTER TABLE `payments_main_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_emails`
--
ALTER TABLE `payment_emails`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `lecturer_id` (`lecturer_id`);

--
-- Indexes for table `rates`
--
ALTER TABLE `rates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_item_category` (`item_description`,`category`);

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
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_students_full_name` (`full_name`),
  ADD KEY `idx_students_id_number` (`id_number`),
  ADD KEY `idx_students_status` (`status`),
  ADD KEY `idx_student_id` (`student_id`);

--
-- Indexes for table `student_announcement_reads`
--
ALTER TABLE `student_announcement_reads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_announcement` (`student_id`,`announcement_id`),
  ADD KEY `idx_student_reads_student` (`student_id`),
  ADD KEY `idx_student_reads_announcement` (`announcement_id`),
  ADD KEY `idx_student_reads_date` (`read_at`);

--
-- Indexes for table `student_batches`
--
ALTER TABLE `student_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`,`batch_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `idx_student_batches_status` (`status`),
  ADD KEY `idx_student_batches_active` (`student_id`,`status`),
  ADD KEY `idx_student_batches_student_code` (`student_code`);

--
-- Indexes for table `student_courses`
--
ALTER TABLE `student_courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_course` (`student_id`,`course_id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `idx_student_courses_status` (`status`),
  ADD KEY `idx_student_courses_student_code_course` (`course_id`),
  ADD KEY `idx_student_courses_student_code` (`student_code`);

--
-- Indexes for table `student_id_sequences`
--
ALTER TABLE `student_id_sequences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_course_batch_year` (`course_id`,`batch_id`,`year`,`batch_number`),
  ADD KEY `batch_id` (`batch_id`);

--
-- Indexes for table `student_payments`
--
ALTER TABLE `student_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_course_batch` (`student_id`,`course_id`,`batch_id`);

--
-- Indexes for table `student_users`
--
ALTER TABLE `student_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_student_users_email` (`email`);

--
-- Indexes for table `training_environments`
--
ALTER TABLE `training_environments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course_overheads_main_te` (`course_overheads_main_id`);

--
-- Indexes for table `training_teaching_aids`
--
ALTER TABLE `training_teaching_aids`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_course_overheads_main_tta` (`course_overheads_main_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `assignment_grades`
--
ALTER TABLE `assignment_grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `batches`
--
ALTER TABLE `batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `batch_materials`
--
ALTER TABLE `batch_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=187;

--
-- AUTO_INCREMENT for table `busBooking`
--
ALTER TABLE `busBooking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `course_assignments`
--
ALTER TABLE `course_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_cost_summary`
--
ALTER TABLE `course_cost_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `course_delivery_costs`
--
ALTER TABLE `course_delivery_costs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `course_delivery_cost_items`
--
ALTER TABLE `course_delivery_cost_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `course_development_work`
--
ALTER TABLE `course_development_work`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `course_development_work_expenses`
--
ALTER TABLE `course_development_work_expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `course_materials`
--
ALTER TABLE `course_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_materials_costing`
--
ALTER TABLE `course_materials_costing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `course_modules`
--
ALTER TABLE `course_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_overheads_main`
--
ALTER TABLE `course_overheads_main`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `lecturer_bank_details`
--
ALTER TABLE `lecturer_bank_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `lecturer_batches`
--
ALTER TABLE `lecturer_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `lecturer_courses`
--
ALTER TABLE `lecturer_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

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
-- AUTO_INCREMENT for table `overheads`
--
ALTER TABLE `overheads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `panel_meeting_participants`
--
ALTER TABLE `panel_meeting_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `payments_main_details`
--
ALTER TABLE `payments_main_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `payment_emails`
--
ALTER TABLE `payment_emails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rates`
--
ALTER TABLE `rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `stream`
--
ALTER TABLE `stream`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=990101;

--
-- AUTO_INCREMENT for table `student_announcement_reads`
--
ALTER TABLE `student_announcement_reads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_batches`
--
ALTER TABLE `student_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `student_courses`
--
ALTER TABLE `student_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `student_id_sequences`
--
ALTER TABLE `student_id_sequences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `student_payments`
--
ALTER TABLE `student_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `student_users`
--
ALTER TABLE `student_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `training_environments`
--
ALTER TABLE `training_environments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `training_teaching_aids`
--
ALTER TABLE `training_teaching_aids`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=114;

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
-- Constraints for table `course_cost_summary`
--
ALTER TABLE `course_cost_summary`
  ADD CONSTRAINT `course_cost_summary_ibfk_1` FOREIGN KEY (`payment_main_details_id`) REFERENCES `payments_main_details` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_delivery_costs`
--
ALTER TABLE `course_delivery_costs`
  ADD CONSTRAINT `fk_payment_main_delivery` FOREIGN KEY (`payments_main_details_id`) REFERENCES `payments_main_details` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_delivery_cost_items`
--
ALTER TABLE `course_delivery_cost_items`
  ADD CONSTRAINT `fk_course_delivery_cost_items_delivery_cost` FOREIGN KEY (`course_delivery_cost_id`) REFERENCES `course_delivery_costs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_development_work`
--
ALTER TABLE `course_development_work`
  ADD CONSTRAINT `fk_payment_main_cd` FOREIGN KEY (`payments_main_details_id`) REFERENCES `payments_main_details` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_development_work_expenses`
--
ALTER TABLE `course_development_work_expenses`
  ADD CONSTRAINT `fk_course_dev_work_expenses` FOREIGN KEY (`course_development_work_id`) REFERENCES `course_development_work` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD CONSTRAINT `course_materials_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `course_modules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_materials_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_materials_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `lecturer_users` (`id`);

--
-- Constraints for table `course_materials_costing`
--
ALTER TABLE `course_materials_costing`
  ADD CONSTRAINT `fk_course_materials_delivery` FOREIGN KEY (`course_delivery_cost_id`) REFERENCES `course_delivery_costs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_modules`
--
ALTER TABLE `course_modules`
  ADD CONSTRAINT `course_modules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_modules_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `course_modules_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `lecturer_users` (`id`);

--
-- Constraints for table `course_overheads_main`
--
ALTER TABLE `course_overheads_main`
  ADD CONSTRAINT `fk_payment_main_overheads` FOREIGN KEY (`payments_main_details_id`) REFERENCES `payments_main_details` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `overheads`
--
ALTER TABLE `overheads`
  ADD CONSTRAINT `fk_course_overheads_main_oh` FOREIGN KEY (`course_overheads_main_id`) REFERENCES `course_overheads_main` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `panel_meeting_participants`
--
ALTER TABLE `panel_meeting_participants`
  ADD CONSTRAINT `fk_course_dev_work_participants` FOREIGN KEY (`course_development_work_id`) REFERENCES `course_development_work` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `student_announcement_reads`
--
ALTER TABLE `student_announcement_reads`
  ADD CONSTRAINT `student_announcement_reads_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_announcement_reads_ibfk_2` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `student_id_sequences`
--
ALTER TABLE `student_id_sequences`
  ADD CONSTRAINT `student_id_sequences_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_id_sequences_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_users`
--
ALTER TABLE `student_users`
  ADD CONSTRAINT `student_users_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `training_environments`
--
ALTER TABLE `training_environments`
  ADD CONSTRAINT `fk_course_overheads_main_te` FOREIGN KEY (`course_overheads_main_id`) REFERENCES `course_overheads_main` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `training_teaching_aids`
--
ALTER TABLE `training_teaching_aids`
  ADD CONSTRAINT `fk_course_overheads_main_tta` FOREIGN KEY (`course_overheads_main_id`) REFERENCES `course_overheads_main` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_refresh_tokens`
--
ALTER TABLE `user_refresh_tokens`
  ADD CONSTRAINT `user_refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
