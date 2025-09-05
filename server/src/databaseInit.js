const db = require('./db');
const logger = require('./logger');

// Helper function to get table columns from database
async function getTableColumns(tableName) {
  try {
    const result = await db.queryPromise(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
      [process.env.DB_DATABASE, tableName]
    );
    return result;
  } catch (error) {
    logger.error(`Error getting columns for table ${tableName}:`, error);
    return [];
  }
}

// Helper function to compare and update table structure
async function updateTableStructure(tableName, expectedColumns) {
  try {
    const currentColumns = await getTableColumns(tableName);
    const currentColumnMap = new Map(currentColumns.map(col => [col.COLUMN_NAME, col]));
    
    const changes = [];
    
    // Check for new columns to add
    for (const expectedCol of expectedColumns) {
      if (!currentColumnMap.has(expectedCol.name)) {
        changes.push({
          type: 'ADD',
          column: expectedCol.name,
          definition: expectedCol.definition
        });
      }
    }
    
    // Check for columns to remove (optional - be careful with this)
    const expectedColumnNames = new Set(expectedColumns.map(col => col.name));
    for (const currentCol of currentColumns) {
      if (!expectedColumnNames.has(currentCol.COLUMN_NAME)) {
        // Uncomment the next lines if you want to auto-remove columns (DANGEROUS!)
        // changes.push({
        //   type: 'DROP',
        //   column: currentCol.COLUMN_NAME
        // });
      }
    }
    
    // Apply changes
    for (const change of changes) {
      if (change.type === 'ADD') {
        const alterQuery = `ALTER TABLE \`${tableName}\` ADD COLUMN ${change.definition}`;
        await db.queryPromise(alterQuery);
        logger.info(`✅ Added column ${change.column} to table ${tableName}`);
      } else if (change.type === 'DROP') {
        const alterQuery = `ALTER TABLE \`${tableName}\` DROP COLUMN \`${change.column}\``;
        await db.queryPromise(alterQuery);
        logger.info(`✅ Dropped column ${change.column} from table ${tableName}`);
      }
    }
    
    return changes.length > 0;
  } catch (error) {
    logger.error(`Error updating table structure for ${tableName}:`, error);
    return false;
  }
}

// Database table creation queries with column definitions
const tableQueries = {
  // Core tables (no dependencies)
  users: `
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      \`email\` varchar(100) NOT NULL,
      \`phone\` varchar(50) DEFAULT NULL,
      \`password\` text NOT NULL,
      \`role\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '["USER"],["SuperAdmin"],["ADMIN"]',
      \`status\` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  courses: `
    CREATE TABLE IF NOT EXISTS \`courses\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) NOT NULL,
      \`courseId\` varchar(50) NOT NULL,
      \`stream\` varchar(100) NOT NULL,
      \`courseName\` varchar(255) NOT NULL,
      \`medium\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`medium\`)),
      \`location\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`location\`)),
      \`assessmentCriteria\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`assessmentCriteria\`)),
      \`resources\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`resources\`)),
      \`fees\` decimal(10,2) NOT NULL,
      \`registrationFee\` decimal(10,2) NOT NULL,
      \`installment1\` decimal(10,2) DEFAULT NULL,
      \`installment2\` decimal(10,2) DEFAULT NULL,
      \`additionalInstallments\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(\`additionalInstallments\`)),
      \`description\` text DEFAULT NULL,
      \`duration\` varchar(100) DEFAULT NULL,
      \`status\` enum('Active','Inactive','Pending','Completed') DEFAULT 'Active',
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`no_of_participants\` int(11) DEFAULT 25,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`courseId\` (\`courseId\`),
      KEY \`user_id\` (\`user_id\`),
      KEY \`idx_courses_name\` (\`courseName\`),
      KEY \`idx_courses_status\` (\`status\`),
      CONSTRAINT \`courses_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  lecturers: `
    CREATE TABLE IF NOT EXISTS \`lecturers\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`full_name\` varchar(255) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`identification_type\` enum('NIC','Passport') DEFAULT 'NIC',
      \`id_number\` varchar(50) NOT NULL,
      \`date_of_birth\` date DEFAULT NULL,
      \`address\` text DEFAULT NULL,
      \`phone\` varchar(50) DEFAULT NULL,
      \`category\` varchar(100) DEFAULT NULL,
      \`cdc_number\` varchar(100) DEFAULT NULL,
      \`vehicle_number\` varchar(100) DEFAULT NULL,
      \`nic_file\` varchar(255) DEFAULT NULL,
      \`photo_file\` varchar(255) DEFAULT NULL,
      \`driving_trainer_license_file\` varchar(255) DEFAULT NULL,
      \`other_documents_file\` varchar(255) DEFAULT NULL,
      \`status\` enum('Active','Inactive','Pending','Completed') DEFAULT 'Active',
      \`user_id\` int(11) NOT NULL COMMENT 'User who created this record',
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`course_id\` int(11) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`),
      KEY \`user_id\` (\`user_id\`),
      KEY \`idx_lecturers_full_name\` (\`full_name\`),
      KEY \`idx_lecturers_status\` (\`status\`),
      CONSTRAINT \`lecturers_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  students: `
    CREATE TABLE IF NOT EXISTS \`students\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` varchar(50) DEFAULT NULL,
      \`full_name\` varchar(255) NOT NULL,
      \`email\` varchar(255) DEFAULT NULL,
      \`identification_type\` enum('NIC','Passport','C_NO') NOT NULL,
      \`id_number\` varchar(50) NOT NULL,
      \`nationality\` varchar(100) NOT NULL,
      \`date_of_birth\` date NOT NULL,
      \`country\` varchar(100) DEFAULT NULL,
      \`cdc_number\` varchar(100) DEFAULT NULL,
      \`address\` text NOT NULL,
      \`department\` varchar(100) DEFAULT NULL,
      \`company\` varchar(100) DEFAULT NULL,
      \`sea_service\` varchar(100) DEFAULT NULL,
      \`emergency_contact_name\` varchar(255) DEFAULT NULL,
      \`emergency_contact_number\` varchar(50) DEFAULT NULL,
      \`is_swimmer\` tinyint(1) DEFAULT 0,
      \`is_slpa_employee\` tinyint(1) DEFAULT 0,
      \`designation\` varchar(100) DEFAULT NULL,
      \`division\` varchar(100) DEFAULT NULL,
      \`service_no\` varchar(50) DEFAULT NULL,
      \`section_unit\` varchar(100) DEFAULT NULL,
      \`nic_document_path\` varchar(255) DEFAULT NULL,
      \`passport_document_path\` varchar(255) DEFAULT NULL,
      \`photo_path\` varchar(255) DEFAULT NULL,
      \`driving_details\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(\`driving_details\`)),
      \`status\` enum('Active','Inactive','Pending','Completed') DEFAULT 'Active',
      \`payment_status\` enum('Paid','Pending','Partial','Free') DEFAULT 'Pending',
      \`created_by\` int(11) DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`),
      UNIQUE KEY \`student_id\` (\`student_id\`),
      KEY \`created_by\` (\`created_by\`),
      KEY \`idx_students_full_name\` (\`full_name\`),
      KEY \`idx_students_id_number\` (\`id_number\`),
      KEY \`idx_students_status\` (\`status\`),
      CONSTRAINT \`students_ibfk_1\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // Tables with dependencies
  batches: `
    CREATE TABLE IF NOT EXISTS \`batches\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_id\` int(11) NOT NULL,
      \`batch_code\` varchar(50) DEFAULT NULL,
      \`capacity\` int(11) DEFAULT 30,
      \`start_date\` date DEFAULT NULL,
      \`end_date\` date DEFAULT NULL,
      \`status\` enum('Upcoming','Active','Completed','Cancelled') DEFAULT 'Upcoming',
      \`location\` varchar(255) DEFAULT NULL,
      \`schedule\` text DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`lecturer_id\` int(11) DEFAULT NULL,
      \`batch_number\` int(11) DEFAULT 1,
      \`year\` int(11) DEFAULT NULL,
      \`max_students\` int(11) DEFAULT 30,
      \`description\` text DEFAULT NULL,
      \`materials_count\` int(11) DEFAULT 0,
      \`assignments_count\` int(11) DEFAULT 0,
      \`announcements_count\` int(11) DEFAULT 0,
      \`students_count\` int(11) DEFAULT 0,
      \`completion_percentage\` decimal(5,2) DEFAULT 0.00,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_course_year_batch\` (\`course_id\`,\`year\`,\`batch_number\`),
      KEY \`idx_batches_status\` (\`status\`),
      KEY \`idx_batches_dates\` (\`start_date\`,\`end_date\`),
      KEY \`fk_batches_lecturer\` (\`lecturer_id\`),
      CONSTRAINT \`batches_ibfk_1\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_batches_lecturer\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  lecturer_users: `
    CREATE TABLE IF NOT EXISTS \`lecturer_users\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`lecturer_id\` int(11) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`password\` varchar(255) NOT NULL,
      \`status\` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
      \`is_temp_password\` tinyint(1) DEFAULT 1,
      \`reset_token\` varchar(255) DEFAULT NULL,
      \`reset_token_expires\` datetime DEFAULT NULL,
      \`reset_otp\` varchar(255) DEFAULT NULL,
      \`reset_otp_expires\` datetime DEFAULT NULL,
      \`last_login\` datetime DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`password_reset_count\` int(11) DEFAULT 0,
      \`last_password_reset\` datetime DEFAULT NULL,
      \`last_reset_request\` datetime DEFAULT NULL,
      \`reset_request_count\` int(11) DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      KEY \`idx_lecturer_users_email\` (\`email\`),
      CONSTRAINT \`lecturer_users_ibfk_1\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  student_users: `
    CREATE TABLE IF NOT EXISTS \`student_users\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`password\` varchar(255) NOT NULL,
      \`status\` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
      \`is_temp_password\` tinyint(1) DEFAULT 1,
      \`reset_token\` varchar(255) DEFAULT NULL,
      \`reset_token_expires\` datetime DEFAULT NULL,
      \`last_login\` datetime DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`reset_otp\` varchar(255) DEFAULT NULL,
      \`reset_otp_expires\` datetime DEFAULT NULL,
      \`password_reset_count\` int(11) DEFAULT 0,
      \`last_password_reset\` datetime DEFAULT NULL,
      \`last_reset_request\` datetime DEFAULT NULL,
      \`reset_request_count\` int(11) DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`),
      KEY \`student_id\` (\`student_id\`),
      KEY \`idx_student_users_email\` (\`email\`),
      CONSTRAINT \`student_users_ibfk_1\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  course_modules: `
    CREATE TABLE IF NOT EXISTS \`course_modules\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_id\` int(11) NOT NULL,
      \`batch_id\` int(11) DEFAULT NULL,
      \`module_name\` varchar(255) NOT NULL,
      \`module_code\` varchar(50) DEFAULT NULL,
      \`description\` text DEFAULT NULL,
      \`sequence_order\` int(11) DEFAULT 0,
      \`duration_hours\` int(11) DEFAULT 0,
      \`is_mandatory\` tinyint(1) DEFAULT 1,
      \`created_by\` int(11) NOT NULL,
      \`status\` enum('Draft','Published','Archived') DEFAULT 'Draft',
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`created_by\` (\`created_by\`),
      KEY \`idx_course_modules_status\` (\`status\`),
      KEY \`idx_course_modules_order\` (\`course_id\`,\`sequence_order\`),
      CONSTRAINT \`course_modules_ibfk_1\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`course_modules_ibfk_2\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`course_modules_ibfk_3\` FOREIGN KEY (\`created_by\`) REFERENCES \`lecturer_users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // Aid and booking related tables
  aid_requests: `
    CREATE TABLE IF NOT EXISTS \`aid_requests\` (
      \`id\` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      \`requesting_officer_name\` varchar(255) NOT NULL,
      \`designation\` varchar(255) DEFAULT NULL,
      \`requesting_officer_email\` varchar(255) NOT NULL,
      \`course_name\` varchar(255) DEFAULT NULL,
      \`duration\` varchar(255) DEFAULT NULL,
      \`audience_type\` varchar(255) DEFAULT NULL,
      \`no_of_participants\` int(11) DEFAULT 0,
      \`course_coordinator\` varchar(255) DEFAULT NULL,
      \`preferred_days_of_week\` varchar(255) DEFAULT NULL,
      \`date_from\` date DEFAULT NULL,
      \`date_to\` date DEFAULT NULL,
      \`time_from\` time DEFAULT NULL,
      \`time_to\` time DEFAULT NULL,
      \`signed_date\` date DEFAULT NULL,
      \`paid_course_or_not\` varchar(50) DEFAULT 'No',
      \`payment_status\` varchar(100) DEFAULT 'Not Set',
      \`request_status\` varchar(100) DEFAULT 'pending',
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`classrooms_allocated\` text DEFAULT NULL,
      \`exam_or_not\` varchar(50) DEFAULT 'No',
      \`cancelled_by_requester\` varchar(50) DEFAULT 'No',
      \`last_updated\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  aid_items: `
    CREATE TABLE IF NOT EXISTS \`aid_items\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`request_id\` int(10) UNSIGNED DEFAULT NULL,
      \`item_no\` int(11) DEFAULT NULL,
      \`description\` varchar(255) DEFAULT NULL,
      \`quantity\` int(11) DEFAULT NULL,
      \`remark\` text DEFAULT NULL,
      \`md_approval_obtained\` varchar(50) DEFAULT 'No',
      \`md_approval_details\` text DEFAULT NULL,
      \`md_approval_required_or_not\` varchar(50) DEFAULT 'No',
      \`CTM_approval_obtained\` varchar(50) DEFAULT NULL,
      \`CTM_Details\` text DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`request_id\` (\`request_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  aid_handover: `
    CREATE TABLE IF NOT EXISTS \`aid_handover\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`request_id\` int(10) UNSIGNED DEFAULT NULL,
      \`items_taken_over\` text DEFAULT NULL,
      \`items_returned\` text DEFAULT NULL,
      \`receiver_name\` varchar(255) DEFAULT NULL,
      \`receiver_designation\` varchar(255) DEFAULT NULL,
      \`receiver_date\` date DEFAULT NULL,
      \`handover_confirmer_name\` varchar(255) DEFAULT NULL,
      \`handover_confirmer_designation\` varchar(255) DEFAULT NULL,
      \`handover_confirmer_date\` date DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`request_id\` (\`request_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  aid_request_emails: `
    CREATE TABLE IF NOT EXISTS \`aid_request_emails\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`request_id\` int(10) UNSIGNED NOT NULL,
      \`email_type\` enum('approval','denial') NOT NULL,
      \`email_address\` varchar(255) NOT NULL,
      \`subject\` varchar(255) DEFAULT NULL,
      \`body\` text DEFAULT NULL,
      \`sent_status\` enum('success','failed') DEFAULT 'success',
      \`error_message\` text DEFAULT NULL,
      \`sent_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`request_id\` (\`request_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,


  bookings: `
    CREATE TABLE IF NOT EXISTS \`bookings\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) DEFAULT NULL,
      \`booking_date\` date DEFAULT NULL,
      \`booking_time\` time DEFAULT NULL,
      \`bookingendtime\` time DEFAULT NULL,
      \`no_of_people\` int(11) DEFAULT NULL,
      \`status\` enum('PENDING','APPROVED','DENIED') DEFAULT 'PENDING',
      \`description\` text DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`user_id\` (\`user_id\`),
      CONSTRAINT \`bookings_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  busBooking: `
    CREATE TABLE IF NOT EXISTS \`busBooking\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) DEFAULT NULL,
      \`fromPlace\` varchar(255) NOT NULL,
      \`toPlace\` varchar(255) NOT NULL,
      \`travelDate\` date NOT NULL,
      \`ReturnDate\` date NOT NULL,
      \`forWho\` text DEFAULT NULL,
      \`ContactNo\` text NOT NULL,
      \`status\` enum('PENDING','APPROVED','DENIED') NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`user_id\` (\`user_id\`),
      CONSTRAINT \`busBooking_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  classroom_booking_calendar: `
    CREATE TABLE IF NOT EXISTS \`classroom_booking_calendar\` (
      \`id\` int(11) NOT NULL,
      \`user_id\` int(11) NOT NULL,
      \`request_id\` int(10) UNSIGNED DEFAULT NULL,
      \`date_from\` date NOT NULL,
      \`date_to\` date NOT NULL,
      \`time_from\` time NOT NULL,
      \`time_to\` time NOT NULL,
      \`course_name\` varchar(255) NOT NULL,
      \`preferred_days_of_week\` varchar(255) DEFAULT NULL,
      \`classes_allocated\` text DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  classroom_booking_dates: `
    CREATE TABLE IF NOT EXISTS \`classroom_booking_dates\` (
      \`id\` int(11) NOT NULL,
      \`calendar_id\` int(11) NOT NULL,
      \`user_id\` int(11) NOT NULL,
      \`request_id\` int(10) UNSIGNED DEFAULT NULL,
      \`course_name\` varchar(255) DEFAULT NULL,
      \`all_dates\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`all_dates\`)),
      \`time_from\` time NOT NULL,
      \`time_to\` time NOT NULL,
      \`classes_allocated\` text DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`cancel_dates\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(\`cancel_dates\`))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  // Payment related tables
  payments_main_details: `
    CREATE TABLE IF NOT EXISTS \`payments_main_details\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) DEFAULT NULL,
      \`course_name\` varchar(255) NOT NULL,
      \`no_of_participants\` int(11) DEFAULT 0,
      \`duration\` varchar(255) DEFAULT NULL,
      \`customer_type\` varchar(255) DEFAULT NULL,
      \`stream\` varchar(100) DEFAULT NULL,
      \`CTM_approved\` varchar(50) DEFAULT 'Pending',
      \`CTM_details\` text DEFAULT NULL,
      \`special_justifications\` text DEFAULT NULL,
      \`date\` date DEFAULT curdate(),
      \`updated_by_id\` int(11) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`last_updated\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`accountant_approval_obtained\` varchar(50) DEFAULT 'Pending',
      \`accountant_details\` text DEFAULT NULL,
      \`sectional_approval_obtained\` varchar(50) DEFAULT 'Pending',
      \`section_type\` varchar(255) DEFAULT NULL,
      \`sectional_details\` text DEFAULT NULL,
      \`DCTM01_approval_obtained\` varchar(50) DEFAULT 'Pending',
      \`DCTM01_details\` text DEFAULT NULL,
      \`DCTM02_approval_obtained\` varchar(50) DEFAULT 'Pending',
      \`DCTM02_details\` text DEFAULT NULL,
      \`course_id\` int(11) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`idx_payments_course_id\` (\`course_id\`),
      CONSTRAINT \`payments_main_details_ibfk_1\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  // Additional tables can be added here as needed
  rates: `
    CREATE TABLE IF NOT EXISTS \`rates\` (
      \`id\` int(11) NOT NULL,
      \`item_description\` varchar(255) NOT NULL,
      \`category\` varchar(100) DEFAULT NULL,
      \`rate\` decimal(10,2) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`last_updated\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`rate_type\` varchar(50) DEFAULT 'Quantity',
      \`cost_type\` varchar(50) DEFAULT 'C',
      \`user_created_id\` int(11) DEFAULT NULL,
      \`user_updated_id\` int(11) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  stream: `
    CREATE TABLE IF NOT EXISTS \`stream\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  user_refresh_tokens: `
    CREATE TABLE IF NOT EXISTS \`user_refresh_tokens\` (
      \`user_id\` int(11) NOT NULL,
      \`refresh_token\` varchar(512) NOT NULL,
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`user_id\`),
      CONSTRAINT \`user_refresh_tokens_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  // Additional tables from the SQL file
  announcements: `
    CREATE TABLE IF NOT EXISTS \`announcements\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`batch_id\` int(11) NOT NULL,
      \`lecturer_id\` int(11) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`content\` text NOT NULL,
      \`priority\` enum('low','normal','medium','high','urgent') DEFAULT 'normal',
      \`is_published\` tinyint(1) DEFAULT 0,
      \`publish_date\` datetime DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      KEY \`idx_announcements_published\` (\`is_published\`),
      KEY \`idx_announcements_batch_published\` (\`batch_id\`,\`is_published\`),
      KEY \`idx_announcements_batch_published_date\` (\`batch_id\`,\`is_published\`,\`created_at\`),
      CONSTRAINT \`announcements_ibfk_1\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`announcements_ibfk_2\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  // Missing tables from SQL file
  assignment_grades: `
    CREATE TABLE IF NOT EXISTS \`assignment_grades\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`assignment_id\` int(11) NOT NULL,
      \`student_id\` int(11) NOT NULL,
      \`lecturer_id\` int(11) NOT NULL,
      \`marks_obtained\` decimal(5,2) NOT NULL,
      \`max_marks\` decimal(5,2) NOT NULL,
      \`percentage\` decimal(5,2) GENERATED ALWAYS AS (\`marks_obtained\` / \`max_marks\` * 100) STORED,
      \`grade\` varchar(5) DEFAULT NULL,
      \`feedback\` text DEFAULT NULL,
      \`graded_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`assignment_student_grade_unique\` (\`assignment_id\`,\`student_id\`),
      KEY \`assignment_id\` (\`assignment_id\`),
      KEY \`student_id\` (\`student_id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      CONSTRAINT \`assignment_grades_ibfk_1\` FOREIGN KEY (\`assignment_id\`) REFERENCES \`assignments\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`assignment_grades_ibfk_2\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`assignment_grades_ibfk_3\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  cost_summary_flags: `
    CREATE TABLE IF NOT EXISTS \`cost_summary_flags\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payments_main_details_id\` int(11) NOT NULL,
      \`summary_needs_refresh\` tinyint(1) NOT NULL DEFAULT 0,
      \`summary_up_to_date\` tinyint(1) NOT NULL DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`special_cp_up_to_date\` tinyint(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`payments_main_details_id\` (\`payments_main_details_id\`),
      CONSTRAINT \`fk_payment_main_summary_flag\` FOREIGN KEY (\`payments_main_details_id\`) REFERENCES \`payments_main_details\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_cost_summary: `
    CREATE TABLE IF NOT EXISTS \`course_cost_summary\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payment_main_details_id\` int(11) NOT NULL,
      \`profit_margin_percentage\` decimal(5,2) DEFAULT 0.00,
      \`profit_margin\` decimal(10,2) DEFAULT 0.00,
      \`provision_inflation_percentage\` decimal(5,2) DEFAULT 0.00,
      \`inflation_amount\` decimal(10,2) DEFAULT 0.00,
      \`total_cost_expense\` decimal(10,2) DEFAULT 0.00,
      \`NBT\` decimal(10,2) DEFAULT 0.00,
      \`NBT_percentage\` decimal(5,2) DEFAULT 0.00,
      \`VAT\` decimal(10,2) DEFAULT 0.00,
      \`VAT_percentage\` decimal(5,2) DEFAULT 0.00,
      \`total_course_cost\` decimal(10,2) DEFAULT 0.00,
      \`no_of_participants\` int(11) DEFAULT 0,
      \`course_fee_per_head\` decimal(10,2) DEFAULT 0.00,
      \`prepared_by\` varchar(255) DEFAULT NULL,
      \`prepared_by_id\` int(11) DEFAULT NULL,
      \`check_by\` varchar(255) DEFAULT NULL,
      \`updated_by_id\` int(11) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`Rounded_CFPH\` int(11) DEFAULT 0,
      \`Rounded_CT\` int(11) DEFAULT 0,
      PRIMARY KEY (\`id\`),
      KEY \`payment_main_details_id\` (\`payment_main_details_id\`),
      CONSTRAINT \`course_cost_summary_ibfk_1\` FOREIGN KEY (\`payment_main_details_id\`) REFERENCES \`payments_main_details\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_delivery_costs: `
    CREATE TABLE IF NOT EXISTS \`course_delivery_costs\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payments_main_details_id\` int(11) NOT NULL,
      \`Md_approval_obtained\` varchar(50) DEFAULT NULL,
      \`Md_details\` text DEFAULT NULL,
      \`total_cost\` decimal(10,2) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`user_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_payments_main_details_id_cdc\` (\`payments_main_details_id\`),
      KEY \`fk_payment_main_delivery\` (\`payments_main_details_id\`),
      CONSTRAINT \`fk_payment_main_delivery\` FOREIGN KEY (\`payments_main_details_id\`) REFERENCES \`payments_main_details\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_delivery_cost_items: `
    CREATE TABLE IF NOT EXISTS \`course_delivery_cost_items\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_delivery_cost_id\` int(11) NOT NULL,
      \`role\` varchar(255) NOT NULL,
      \`no_of_officers\` int(11) DEFAULT NULL,
      \`hours\` int(11) DEFAULT NULL,
      \`rate\` decimal(10,2) DEFAULT NULL,
      \`amount\` decimal(10,2) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_course_delivery_cost_items_delivery_cost\` (\`course_delivery_cost_id\`),
      CONSTRAINT \`fk_course_delivery_cost_items_delivery_cost\` FOREIGN KEY (\`course_delivery_cost_id\`) REFERENCES \`course_delivery_costs\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_development_work: `
    CREATE TABLE IF NOT EXISTS \`course_development_work\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payments_main_details_id\` int(11) NOT NULL,
      \`no_of_panel_meetings\` int(11) DEFAULT NULL,
      \`total_cost\` decimal(10,2) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`user_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_payment_main_id_cdw\` (\`payments_main_details_id\`),
      KEY \`fk_payment_main_cd\` (\`payments_main_details_id\`),
      CONSTRAINT \`fk_payment_main_cd\` FOREIGN KEY (\`payments_main_details_id\`) REFERENCES \`payments_main_details\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_development_work_expenses: `
    CREATE TABLE IF NOT EXISTS \`course_development_work_expenses\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_development_work_id\` int(11) NOT NULL,
      \`item_description\` varchar(255) NOT NULL,
      \`required_quantity\` int(11) DEFAULT NULL,
      \`rate\` decimal(10,2) DEFAULT NULL,
      \`amount\` decimal(10,2) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_course_dev_work_expenses\` (\`course_development_work_id\`),
      CONSTRAINT \`fk_course_dev_work_expenses\` FOREIGN KEY (\`course_development_work_id\`) REFERENCES \`course_development_work\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_materials_costing: `
    CREATE TABLE IF NOT EXISTS \`course_materials_costing\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_delivery_cost_id\` int(11) NOT NULL,
      \`item_description\` varchar(255) NOT NULL,
      \`required_quantity\` int(11) NOT NULL,
      \`rate\` decimal(10,2) NOT NULL,
      \`cost\` decimal(10,2) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_course_materials_delivery\` (\`course_delivery_cost_id\`),
      CONSTRAINT \`fk_course_materials_delivery\` FOREIGN KEY (\`course_delivery_cost_id\`) REFERENCES \`course_delivery_costs\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_overheads_main: `
    CREATE TABLE IF NOT EXISTS \`course_overheads_main\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payments_main_details_id\` int(11) NOT NULL,
      \`total_cost\` decimal(10,2) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`user_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_payments_main_overheads\` (\`payments_main_details_id\`),
      KEY \`fk_payment_main_overheads\` (\`payments_main_details_id\`),
      CONSTRAINT \`fk_payment_main_overheads\` FOREIGN KEY (\`payments_main_details_id\`) REFERENCES \`payments_main_details\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  course_payments: `
    CREATE TABLE IF NOT EXISTS \`course_payments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`course_id\` int(11) NOT NULL,
      \`payment_type\` enum('Registration','Installment1','Installment2','Additional','Full') NOT NULL,
      \`amount\` decimal(10,2) NOT NULL,
      \`payment_date\` datetime NOT NULL,
      \`payment_method\` enum('Cash','Card','Bank Transfer','Check','Other') NOT NULL,
      \`receipt_number\` varchar(100) DEFAULT NULL,
      \`notes\` text DEFAULT NULL,
      \`created_by\` int(11) DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`student_id\` (\`student_id\`),
      KEY \`course_id\` (\`course_id\`),
      KEY \`created_by\` (\`created_by\`),
      KEY \`idx_course_payments_date\` (\`payment_date\`),
      CONSTRAINT \`course_payments_ibfk_1\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`course_payments_ibfk_2\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`course_payments_ibfk_3\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  course_revenue_summary: `
    CREATE TABLE IF NOT EXISTS \`course_revenue_summary\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payments_main_details_id\` int(11) NOT NULL,
      \`courseBatch_id\` int(11) NOT NULL,
      \`no_of_participants\` int(11) NOT NULL,
      \`paid_no_of_participants\` int(11) NOT NULL,
      \`total_course_revenue\` decimal(12,2) NOT NULL,
      \`revenue_received_total\` decimal(12,2) NOT NULL,
      \`all_fees_collected_status\` tinyint(1) NOT NULL DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_payment_main_crs\` (\`payments_main_details_id\`),
      CONSTRAINT \`fk_payment_main_crs\` FOREIGN KEY (\`payments_main_details_id\`) REFERENCES \`payments_main_details\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  grades: `
    CREATE TABLE IF NOT EXISTS \`grades\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`assignment_id\` int(11) NOT NULL,
      \`student_id\` int(11) NOT NULL,
      \`lecturer_id\` int(11) NOT NULL,
      \`marks_obtained\` decimal(5,2) NOT NULL,
      \`max_marks\` decimal(5,2) NOT NULL,
      \`percentage\` decimal(5,2) GENERATED ALWAYS AS (\`marks_obtained\` / \`max_marks\` * 100) STORED,
      \`grade\` varchar(5) DEFAULT NULL,
      \`feedback\` text DEFAULT NULL,
      \`graded_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`assignment_student_grade_unique\` (\`assignment_id\`,\`student_id\`),
      KEY \`assignment_id\` (\`assignment_id\`),
      KEY \`student_id\` (\`student_id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      CONSTRAINT \`grades_ibfk_1\` FOREIGN KEY (\`assignment_id\`) REFERENCES \`assignments\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`grades_ibfk_2\` FOREIGN KEY (\`student_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`grades_ibfk_3\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  lecturer_academic_details: `
    CREATE TABLE IF NOT EXISTS \`lecturer_academic_details\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`lecturer_id\` int(11) NOT NULL,
      \`highest_qualification\` varchar(255) DEFAULT NULL,
      \`other_qualifications\` text DEFAULT NULL,
      \`experience\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(\`experience\`)),
      \`education_certificate_file\` varchar(255) DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      CONSTRAINT \`lecturer_academic_details_ibfk_1\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  lecturer_attendance: `
    CREATE TABLE IF NOT EXISTS \`lecturer_attendance\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payments_main_details_id\` int(11) NOT NULL,
      \`lecturer_id\` int(11) NOT NULL,
      \`role\` varchar(100) NOT NULL,
      \`course_id\` int(11) NOT NULL,
      \`batch_id\` int(11) NOT NULL,
      \`user_id\` int(11) NOT NULL,
      \`rate\` decimal(10,2) DEFAULT NULL,
      \`worked_hours\` int(11) NOT NULL,
      \`expected_work_hours\` int(11) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_lecturer_attendance\` (\`lecturer_id\`,\`role\`,\`course_id\`,\`batch_id\`),
      KEY \`fk_pmd_lecturer_attendance\` (\`payments_main_details_id\`),
      CONSTRAINT \`fk_lecturer_attendance_pmd\` FOREIGN KEY (\`payments_main_details_id\`) REFERENCES \`payments_main_details\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_lecturer_attendance_lecturer\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_lecturer_attendance_course\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_lecturer_attendance_batch\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_lecturer_attendance_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  lecturer_bank_details: `
    CREATE TABLE IF NOT EXISTS \`lecturer_bank_details\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`lecturer_id\` int(11) NOT NULL,
      \`bank_name\` varchar(255) NOT NULL,
      \`branch_name\` varchar(255) DEFAULT NULL,
      \`account_number\` varchar(255) NOT NULL,
      \`passbook_file\` varchar(255) DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      CONSTRAINT \`lecturer_bank_details_ibfk_1\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  lecturer_payments: `
    CREATE TABLE IF NOT EXISTS \`lecturer_payments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) NOT NULL,
      \`paid_worked_hours\` int(11) NOT NULL,
      \`payment_received_amount\` decimal(10,2) NOT NULL,
      \`full_amount_payable\` decimal(10,2) NOT NULL,
      \`payment_completed\` tinyint(1) NOT NULL DEFAULT 0,
      \`lecturer_attend_id\` int(11) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_lecturer_attend_id\` (\`lecturer_attend_id\`),
      CONSTRAINT \`lecturer_payments_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`lecturers\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`lecturer_payments_ibfk_2\` FOREIGN KEY (\`lecturer_attend_id\`) REFERENCES \`lecturer_attendance\`(\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  overheads: `
    CREATE TABLE IF NOT EXISTS \`overheads\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_overheads_main_id\` int(11) NOT NULL,
      \`item_description\` varchar(255) NOT NULL,
      \`required_quantity\` int(11) NOT NULL,
      \`rate\` decimal(10,2) NOT NULL,
      \`cost\` decimal(10,2) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_course_overheads_main_oh\` (\`course_overheads_main_id\`),
      CONSTRAINT \`fk_course_overheads_main_oh\` FOREIGN KEY (\`course_overheads_main_id\`) REFERENCES \`course_overheads_main\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  panel_meeting_participants: `
    CREATE TABLE IF NOT EXISTS \`panel_meeting_participants\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_development_work_id\` int(11) NOT NULL,
      \`participant_type\` varchar(100) NOT NULL,
      \`nos\` int(11) DEFAULT NULL,
      \`rate_per_hour\` decimal(10,2) DEFAULT NULL,
      \`smes\` varchar(255) DEFAULT NULL,
      \`amount\` decimal(10,2) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_course_dev_work_participants\` (\`course_development_work_id\`),
      CONSTRAINT \`fk_course_dev_work_participants\` FOREIGN KEY (\`course_development_work_id\`) REFERENCES \`course_development_work\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  special_case_payments: `
    CREATE TABLE IF NOT EXISTS \`special_case_payments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`payments_main_details_id\` int(11) NOT NULL,
      \`sc_title\` varchar(255) DEFAULT NULL,
      \`description\` text DEFAULT NULL,
      \`percent_payment_or_not\` tinyint(1) DEFAULT NULL,
      \`percentage\` decimal(5,2) DEFAULT NULL,
      \`amount_paid\` decimal(10,2) DEFAULT NULL,
      \`total_payable\` decimal(10,2) DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`updated_by_id\` int(11) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_payment_and_title\` (\`payments_main_details_id\`,\`sc_title\`),
      CONSTRAINT \`fk_payment_main_special_case\` FOREIGN KEY (\`payments_main_details_id\`) REFERENCES \`payments_main_details\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  students_sample: `
    CREATE TABLE IF NOT EXISTS \`students_sample\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      \`email\` varchar(100) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  student_payments: `
    CREATE TABLE IF NOT EXISTS \`student_payments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`user_id\` int(11) NOT NULL,
      \`payment_completed\` tinyint(1) NOT NULL DEFAULT 0,
      \`amount_paid\` decimal(10,2) NOT NULL,
      \`full_amount_payable\` decimal(10,2) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`courseBatch_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_student_courseBatch\` (\`student_id\`,\`courseBatch_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  student_payments_sample: `
    CREATE TABLE IF NOT EXISTS \`student_payments_sample\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`full_amount_payable\` decimal(10,2) NOT NULL,
      \`amount_paid\` decimal(10,2) DEFAULT NULL,
      \`payment_completed\` tinyint(1) DEFAULT 0,
      \`order_id\` varchar(100) DEFAULT NULL,
      \`transaction_id\` varchar(100) DEFAULT NULL,
      \`payment_date\` datetime DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`student_id\` (\`student_id\`),
      CONSTRAINT \`student_payments_sample_ibfk_1\` FOREIGN KEY (\`student_id\`) REFERENCES \`students_sample\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  student_payment_proofs: `
    CREATE TABLE IF NOT EXISTS \`student_payment_proofs\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(11) NOT NULL,
      \`file_path\` varchar(500) NOT NULL,
      \`file_name\` varchar(255) DEFAULT NULL,
      \`file_type\` varchar(50) DEFAULT NULL,
      \`uploaded_by\` int(11) NOT NULL,
      \`uploaded_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`status\` enum('pending','approved','rejected') DEFAULT 'pending',
      \`is_active\` tinyint(1) DEFAULT 1,
      PRIMARY KEY (\`id\`),
      KEY \`transaction_id\` (\`transaction_id\`),
      CONSTRAINT \`student_payment_proofs_ibfk_1\` FOREIGN KEY (\`transaction_id\`) REFERENCES \`student_payment_transactions\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  student_payment_transactions: `
    CREATE TABLE IF NOT EXISTS \`student_payment_transactions\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_payment_id\` int(11) NOT NULL,
      \`order_id\` varchar(255) NOT NULL,
      \`payment_id\` varchar(255) DEFAULT NULL,
      \`amount_paid\` decimal(12,2) NOT NULL,
      \`status\` enum('pending','completed','failed') DEFAULT 'pending',
      \`payment_date\` timestamp NULL DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`payment_method\` enum('manual','online') NOT NULL DEFAULT 'manual',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_order\` (\`order_id\`),
      KEY \`student_payment_id\` (\`student_payment_id\`),
      CONSTRAINT \`student_payment_transactions_ibfk_1\` FOREIGN KEY (\`student_payment_id\`) REFERENCES \`student_payments\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  training_environments: `
    CREATE TABLE IF NOT EXISTS \`training_environments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_overheads_main_id\` int(11) NOT NULL,
      \`item_description\` varchar(255) NOT NULL,
      \`required_hours\` int(11) NOT NULL,
      \`hourly_rate\` decimal(10,2) NOT NULL,
      \`cost\` decimal(10,2) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_course_overheads_main_te\` (\`course_overheads_main_id\`),
      CONSTRAINT \`fk_course_overheads_main_te\` FOREIGN KEY (\`course_overheads_main_id\`) REFERENCES \`course_overheads_main\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  training_teaching_aids: `
    CREATE TABLE IF NOT EXISTS \`training_teaching_aids\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_overheads_main_id\` int(11) NOT NULL,
      \`item_description\` varchar(255) NOT NULL,
      \`required_quantity\` int(11) NOT NULL,
      \`required_hours\` int(11) NOT NULL,
      \`hourly_rate\` decimal(10,2) NOT NULL,
      \`cost\` decimal(10,2) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`fk_course_overheads_main_tta\` (\`course_overheads_main_id\`),
      CONSTRAINT \`fk_course_overheads_main_tta\` FOREIGN KEY (\`course_overheads_main_id\`) REFERENCES \`course_overheads_main\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  assignments: `
    CREATE TABLE IF NOT EXISTS \`assignments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`batch_id\` int(11) NOT NULL,
      \`lecturer_id\` int(11) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text NOT NULL,
      \`instructions\` text DEFAULT NULL,
      \`due_date\` datetime NOT NULL,
      \`max_marks\` decimal(5,2) DEFAULT 100.00,
      \`assignment_type\` enum('individual','group','project','quiz') DEFAULT 'individual',
      \`status\` enum('draft','published','closed') DEFAULT 'draft',
      \`submission_count\` int(11) DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      KEY \`idx_assignments_status\` (\`status\`),
      KEY \`idx_assignments_due_date\` (\`due_date\`),
      KEY \`idx_assignments_batch_status\` (\`batch_id\`,\`status\`),
      CONSTRAINT \`assignments_ibfk_1\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`assignments_ibfk_2\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  assignment_submissions: `
    CREATE TABLE IF NOT EXISTS \`assignment_submissions\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`assignment_id\` int(11) NOT NULL,
      \`student_id\` int(11) NOT NULL,
      \`submission_text\` text DEFAULT NULL,
      \`file_path\` varchar(500) DEFAULT NULL,
      \`submitted_at\` datetime DEFAULT current_timestamp(),
      \`marks_obtained\` decimal(10,2) DEFAULT NULL,
      \`feedback\` text DEFAULT NULL,
      \`graded_by\` int(11) DEFAULT NULL,
      \`graded_at\` datetime DEFAULT NULL,
      \`attempt_number\` int(11) DEFAULT 1,
      \`status\` enum('Submitted','Late','Graded','Returned','Resubmitted') DEFAULT 'Submitted',
      \`group_submission_id\` varchar(100) DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`file_name\` varchar(255) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_submission\` (\`assignment_id\`,\`student_id\`,\`attempt_number\`),
      KEY \`graded_by\` (\`graded_by\`),
      KEY \`idx_assignment_submissions_status\` (\`status\`),
      KEY \`idx_assignment_submissions_student\` (\`student_id\`),
      KEY \`idx_assignment_submissions_group\` (\`group_submission_id\`),
      CONSTRAINT \`assignment_submissions_ibfk_1\` FOREIGN KEY (\`assignment_id\`) REFERENCES \`assignments\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`assignment_submissions_ibfk_2\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`assignment_submissions_ibfk_3\` FOREIGN KEY (\`graded_by\`) REFERENCES \`lecturer_users\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  attendance: `
    CREATE TABLE IF NOT EXISTS \`attendance\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`batch_id\` int(11) NOT NULL,
      \`student_id\` int(11) NOT NULL,
      \`attendance_date\` date NOT NULL,
      \`module_id\` int(11) DEFAULT NULL,
      \`check_in_time\` time DEFAULT NULL,
      \`check_out_time\` time DEFAULT NULL,
      \`status\` enum('Present','Absent','Late','Excused','Holiday') NOT NULL,
      \`remarks\` text DEFAULT NULL,
      \`marked_by\` int(11) NOT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_attendance\` (\`batch_id\`,\`student_id\`,\`attendance_date\`,\`module_id\`),
      KEY \`module_id\` (\`module_id\`),
      KEY \`marked_by\` (\`marked_by\`),
      KEY \`idx_attendance_date\` (\`attendance_date\`),
      KEY \`idx_attendance_status\` (\`status\`),
      KEY \`idx_attendance_student\` (\`student_id\`),
      CONSTRAINT \`attendance_ibfk_1\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`attendance_ibfk_2\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`attendance_ibfk_3\` FOREIGN KEY (\`module_id\`) REFERENCES \`course_modules\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`attendance_ibfk_4\` FOREIGN KEY (\`marked_by\`) REFERENCES \`lecturer_users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  batch_materials: `
    CREATE TABLE IF NOT EXISTS \`batch_materials\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`batch_id\` int(11) NOT NULL,
      \`lecturer_id\` int(11) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`file_name\` varchar(255) DEFAULT NULL,
      \`file_path\` varchar(500) DEFAULT NULL,
      \`file_size\` bigint(20) DEFAULT NULL,
      \`file_type\` varchar(100) DEFAULT NULL,
      \`material_type\` enum('lecture','assignment','quiz','reference','other') DEFAULT 'lecture',
      \`is_active\` tinyint(1) DEFAULT 1,
      \`upload_date\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      KEY \`idx_batch_materials_active\` (\`is_active\`),
      KEY \`idx_batch_materials_batch_active\` (\`batch_id\`,\`is_active\`),
      CONSTRAINT \`batch_materials_ibfk_1\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`batch_materials_ibfk_2\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  student_batches: `
    CREATE TABLE IF NOT EXISTS \`student_batches\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`batch_id\` int(11) NOT NULL,
      \`student_code\` varchar(50) DEFAULT NULL,
      \`enrollment_date\` date DEFAULT NULL,
      \`attendance_percentage\` decimal(5,2) DEFAULT 0.00,
      \`status\` enum('Active','Completed','Withdrawn') DEFAULT 'Active',
      \`completion_certificate\` varchar(255) DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`student_id\` (\`student_id\`,\`batch_id\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`idx_student_batches_status\` (\`status\`),
      KEY \`idx_student_batches_active\` (\`student_id\`,\`status\`),
      KEY \`idx_student_batches_student_code\` (\`student_code\`),
      CONSTRAINT \`student_batches_ibfk_1\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`student_batches_ibfk_2\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  student_courses: `
    CREATE TABLE IF NOT EXISTS \`student_courses\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`course_id\` int(11) NOT NULL,
      \`student_code\` varchar(50) DEFAULT NULL,
      \`enrollment_date\` date NOT NULL,
      \`primary_course\` tinyint(1) DEFAULT 0,
      \`status\` enum('Active','Completed','Withdrawn','Suspended') DEFAULT 'Active',
      \`completion_date\` date DEFAULT NULL,
      \`grade\` varchar(10) DEFAULT NULL,
      \`remarks\` text DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`student_course\` (\`student_id\`,\`course_id\`),
      KEY \`course_id\` (\`course_id\`),
      KEY \`idx_student_courses_status\` (\`status\`),
      KEY \`idx_student_courses_student_code_course\` (\`course_id\`),
      KEY \`idx_student_courses_student_code\` (\`student_code\`),
      CONSTRAINT \`student_courses_ibfk_1\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`student_courses_ibfk_2\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  lecturer_batches: `
    CREATE TABLE IF NOT EXISTS \`lecturer_batches\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`lecturer_id\` int(11) NOT NULL,
      \`batch_id\` int(11) NOT NULL,
      \`module\` varchar(100) DEFAULT NULL,
      \`hours_assigned\` int(11) DEFAULT 0,
      \`payment_rate\` decimal(10,2) DEFAULT NULL,
      \`start_date\` date DEFAULT NULL,
      \`end_date\` date DEFAULT NULL,
      \`status\` enum('Assigned','Active','Completed','Cancelled') DEFAULT 'Assigned',
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`lecturer_id_batch_module_unique\` (\`lecturer_id\`,\`batch_id\`,\`module\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`idx_lecturer_batches_status\` (\`status\`),
      KEY \`idx_lecturer_batches_lecturer_status\` (\`lecturer_id\`,\`status\`),
      CONSTRAINT \`lecturer_batches_ibfk_1\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`lecturer_batches_ibfk_2\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  lecturer_courses: `
    CREATE TABLE IF NOT EXISTS \`lecturer_courses\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`lecturer_id\` int(11) NOT NULL,
      \`course_id\` int(11) NOT NULL,
      \`primary_course\` tinyint(1) DEFAULT 0,
      \`stream\` varchar(100) DEFAULT NULL,
      \`module\` varchar(100) DEFAULT NULL,
      \`assignment_date\` date DEFAULT curdate(),
      \`status\` enum('Active','Completed','Inactive') DEFAULT 'Active',
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`lecturer_course_unique\` (\`lecturer_id\`,\`course_id\`,\`module\`),
      KEY \`course_id\` (\`course_id\`),
      KEY \`idx_lecturer_courses_status\` (\`status\`),
      CONSTRAINT \`lecturer_courses_ibfk_1\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`lecturer_courses_ibfk_2\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  course_assignments: `
    CREATE TABLE IF NOT EXISTS \`course_assignments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`module_id\` int(11) NOT NULL,
      \`batch_id\` int(11) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`assignment_type\` enum('Assignment','Quiz','Exam','Project','Presentation') NOT NULL,
      \`total_marks\` decimal(10,2) DEFAULT 100.00,
      \`passing_marks\` decimal(10,2) DEFAULT 50.00,
      \`due_date\` datetime DEFAULT NULL,
      \`duration_minutes\` int(11) DEFAULT NULL,
      \`attempts_allowed\` int(11) DEFAULT 1,
      \`instructions\` text DEFAULT NULL,
      \`resources\` text DEFAULT NULL,
      \`is_group_assignment\` tinyint(1) DEFAULT 0,
      \`max_group_size\` int(11) DEFAULT 1,
      \`created_by\` int(11) NOT NULL,
      \`status\` enum('Draft','Published','Closed','Graded') DEFAULT 'Draft',
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`module_id\` (\`module_id\`),
      KEY \`created_by\` (\`created_by\`),
      KEY \`idx_course_assignments_status\` (\`status\`),
      KEY \`idx_course_assignments_due_date\` (\`due_date\`),
      KEY \`idx_course_assignments_type\` (\`assignment_type\`),
      KEY \`idx_course_assignments_batch\` (\`batch_id\`),
      CONSTRAINT \`course_assignments_ibfk_1\` FOREIGN KEY (\`module_id\`) REFERENCES \`course_modules\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`course_assignments_ibfk_2\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`course_assignments_ibfk_3\` FOREIGN KEY (\`created_by\`) REFERENCES \`lecturer_users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  course_materials: `
    CREATE TABLE IF NOT EXISTS \`course_materials\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`module_id\` int(11) NOT NULL,
      \`batch_id\` int(11) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`material_type\` enum('PDF','Video','Document','Link','Other') NOT NULL,
      \`file_path\` varchar(500) DEFAULT NULL,
      \`file_url\` text DEFAULT NULL,
      \`file_size\` bigint(20) DEFAULT 0,
      \`duration_minutes\` int(11) DEFAULT NULL,
      \`is_downloadable\` tinyint(1) DEFAULT 1,
      \`uploaded_by\` int(11) NOT NULL,
      \`views_count\` int(11) DEFAULT 0,
      \`downloads_count\` int(11) DEFAULT 0,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`uploaded_by\` (\`uploaded_by\`),
      KEY \`idx_course_materials_type\` (\`material_type\`),
      KEY \`idx_course_materials_module\` (\`module_id\`),
      KEY \`idx_course_materials_batch\` (\`batch_id\`),
      CONSTRAINT \`course_materials_ibfk_1\` FOREIGN KEY (\`module_id\`) REFERENCES \`course_modules\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`course_materials_ibfk_2\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`course_materials_ibfk_3\` FOREIGN KEY (\`uploaded_by\`) REFERENCES \`lecturer_users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  module_progress: `
    CREATE TABLE IF NOT EXISTS \`module_progress\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`module_id\` int(11) NOT NULL,
      \`started_at\` datetime DEFAULT current_timestamp(),
      \`completed_at\` datetime DEFAULT NULL,
      \`progress_percentage\` decimal(5,2) DEFAULT 0.00,
      \`time_spent_minutes\` int(11) DEFAULT 0,
      \`materials_viewed\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]' CHECK (json_valid(\`materials_viewed\`)),
      \`last_accessed\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      \`status\` enum('Not Started','In Progress','Completed') DEFAULT 'Not Started',
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_student_module\` (\`student_id\`,\`module_id\`),
      KEY \`module_id\` (\`module_id\`),
      KEY \`idx_module_progress_status\` (\`status\`),
      CONSTRAINT \`module_progress_ibfk_1\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`module_progress_ibfk_2\` FOREIGN KEY (\`module_id\`) REFERENCES \`course_modules\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  student_announcement_reads: `
    CREATE TABLE IF NOT EXISTS \`student_announcement_reads\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`student_id\` int(11) NOT NULL,
      \`announcement_id\` int(11) NOT NULL,
      \`read_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_student_announcement\` (\`student_id\`,\`announcement_id\`),
      KEY \`idx_student_reads_student\` (\`student_id\`),
      KEY \`idx_student_reads_announcement\` (\`announcement_id\`),
      KEY \`idx_student_reads_date\` (\`read_at\`),
      CONSTRAINT \`student_announcement_reads_ibfk_1\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`student_announcement_reads_ibfk_2\` FOREIGN KEY (\`announcement_id\`) REFERENCES \`announcements\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  password_reset_logs: `
    CREATE TABLE IF NOT EXISTS \`password_reset_logs\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`user_type\` enum('student','lecturer') NOT NULL,
      \`user_id\` int(11) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`action\` enum('request','reset','failed_attempt') NOT NULL,
      \`ip_address\` varchar(45) DEFAULT NULL,
      \`user_agent\` text DEFAULT NULL,
      \`token_used\` varchar(255) DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`idx_password_reset_logs_user\` (\`user_type\`,\`user_id\`),
      KEY \`idx_password_reset_logs_email\` (\`email\`),
      KEY \`idx_password_reset_logs_action\` (\`action\`),
      KEY \`idx_password_reset_logs_created_at\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  payment_emails: `
    CREATE TABLE IF NOT EXISTS \`payment_emails\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`recipient_email\` varchar(255) NOT NULL,
      \`user_type\` enum('student','lecturer') NOT NULL,
      \`reference_id\` int(11) NOT NULL,
      \`email_type\` enum('payment_received','payment_made') NOT NULL,
      \`sent_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`status\` enum('sent','failed') DEFAULT 'sent',
      \`error_message\` text DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  quizzes: `
    CREATE TABLE IF NOT EXISTS \`quizzes\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`batch_id\` int(11) NOT NULL,
      \`lecturer_id\` int(11) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`instructions\` text DEFAULT NULL,
      \`start_time\` datetime NOT NULL,
      \`end_time\` datetime NOT NULL,
      \`duration_minutes\` int(11) NOT NULL,
      \`max_marks\` decimal(5,2) DEFAULT 100.00,
      \`is_published\` tinyint(1) DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`lecturer_id\` (\`lecturer_id\`),
      CONSTRAINT \`quizzes_ibfk_1\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`quizzes_ibfk_2\` FOREIGN KEY (\`lecturer_id\`) REFERENCES \`lecturers\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `,

  discussion_forums: `
    CREATE TABLE IF NOT EXISTS \`discussion_forums\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`course_id\` int(11) NOT NULL,
      \`batch_id\` int(11) DEFAULT NULL,
      \`module_id\` int(11) DEFAULT NULL,
      \`title\` varchar(255) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`created_by_type\` enum('Student','Lecturer') NOT NULL,
      \`created_by_student\` int(11) DEFAULT NULL,
      \`created_by_lecturer\` int(11) DEFAULT NULL,
      \`is_pinned\` tinyint(1) DEFAULT 0,
      \`is_locked\` tinyint(1) DEFAULT 0,
      \`views_count\` int(11) DEFAULT 0,
      \`replies_count\` int(11) DEFAULT 0,
      \`last_activity\` datetime DEFAULT current_timestamp(),
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`batch_id\` (\`batch_id\`),
      KEY \`module_id\` (\`module_id\`),
      KEY \`created_by_student\` (\`created_by_student\`),
      KEY \`created_by_lecturer\` (\`created_by_lecturer\`),
      KEY \`idx_discussion_forums_course\` (\`course_id\`),
      KEY \`idx_discussion_forums_activity\` (\`last_activity\`),
      CONSTRAINT \`discussion_forums_ibfk_1\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`discussion_forums_ibfk_2\` FOREIGN KEY (\`batch_id\`) REFERENCES \`batches\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`discussion_forums_ibfk_3\` FOREIGN KEY (\`module_id\`) REFERENCES \`course_modules\` (\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`discussion_forums_ibfk_4\` FOREIGN KEY (\`created_by_student\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`discussion_forums_ibfk_5\` FOREIGN KEY (\`created_by_lecturer\`) REFERENCES \`lecturer_users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  forum_replies: `
    CREATE TABLE IF NOT EXISTS \`forum_replies\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`forum_id\` int(11) NOT NULL,
      \`parent_reply_id\` int(11) DEFAULT NULL,
      \`content\` text NOT NULL,
      \`created_by_type\` enum('Student','Lecturer') NOT NULL,
      \`created_by_student\` int(11) DEFAULT NULL,
      \`created_by_lecturer\` int(11) DEFAULT NULL,
      \`is_answer\` tinyint(1) DEFAULT 0,
      \`upvotes\` int(11) DEFAULT 0,
      \`edited_at\` datetime DEFAULT NULL,
      \`created_at\` datetime DEFAULT current_timestamp(),
      \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`created_by_student\` (\`created_by_student\`),
      KEY \`created_by_lecturer\` (\`created_by_lecturer\`),
      KEY \`idx_forum_replies_forum\` (\`forum_id\`),
      KEY \`idx_forum_replies_parent\` (\`parent_reply_id\`),
      CONSTRAINT \`forum_replies_ibfk_1\` FOREIGN KEY (\`forum_id\`) REFERENCES \`discussion_forums\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`forum_replies_ibfk_2\` FOREIGN KEY (\`parent_reply_id\`) REFERENCES \`forum_replies\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`forum_replies_ibfk_3\` FOREIGN KEY (\`created_by_student\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`forum_replies_ibfk_4\` FOREIGN KEY (\`created_by_lecturer\`) REFERENCES \`lecturer_users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

// Column definitions for table structure updates
const tableColumnDefinitions = {
  users: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'name', definition: '\`name\` varchar(100) NOT NULL' },
    { name: 'email', definition: '\`email\` varchar(100) NOT NULL' },
    { name: 'phone', definition: '\`phone\` varchar(50) DEFAULT NULL' },
    { name: 'password', definition: '\`password\` text NOT NULL' },
    { name: 'role', definition: '\`role\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT \'["USER"],["SuperAdmin"],["ADMIN"]\'' },
    { name: 'status', definition: '\`status\` enum(\'ACTIVE\',\'INACTIVE\') DEFAULT \'ACTIVE\'' }
  ],
  // Add more table column definitions as needed
  lecturers: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'full_name', definition: '\`full_name\` varchar(255) NOT NULL' },
    { name: 'email', definition: '\`email\` varchar(255) NOT NULL' },
    { name: 'identification_type', definition: '\`identification_type\` enum(\'NIC\',\'Passport\') DEFAULT \'NIC\'' },
    { name: 'id_number', definition: '\`id_number\` varchar(50) NOT NULL' },
    { name: 'date_of_birth', definition: '\`date_of_birth\` date DEFAULT NULL' },
    { name: 'address', definition: '\`address\` text DEFAULT NULL' },
    { name: 'phone', definition: '\`phone\` varchar(50) DEFAULT NULL' },
    { name: 'category', definition: '\`category\` varchar(100) DEFAULT NULL' },
    { name: 'cdc_number', definition: '\`cdc_number\` varchar(100) DEFAULT NULL' },
    { name: 'vehicle_number', definition: '\`vehicle_number\` varchar(100) DEFAULT NULL' },
    { name: 'nic_file', definition: '\`nic_file\` varchar(255) DEFAULT NULL' },
    { name: 'photo_file', definition: '\`photo_file\` varchar(255) DEFAULT NULL' },
    { name: 'driving_trainer_license_file', definition: '\`driving_trainer_license_file\` varchar(255) DEFAULT NULL' },
    { name: 'other_documents_file', definition: '\`other_documents_file\` varchar(255) DEFAULT NULL' },
    { name: 'status', definition: '\`status\` enum(\'Active\',\'Inactive\',\'Pending\',\'Completed\') DEFAULT \'Active\'' },
    { name: 'user_id', definition: '\`user_id\` int(11) NOT NULL COMMENT \'User who created this record\'' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'course_id', definition: '\`course_id\` int(11) DEFAULT NULL' }
  ],

  // All remaining tables with their column definitions
  announcements: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'batch_id', definition: '\`batch_id\` int(11) NOT NULL' },
    { name: 'lecturer_id', definition: '\`lecturer_id\` int(11) NOT NULL' },
    { name: 'title', definition: '\`title\` varchar(255) NOT NULL' },
    { name: 'content', definition: '\`content\` text NOT NULL' },
    { name: 'priority', definition: '\`priority\` enum(\'low\',\'normal\',\'medium\',\'high\',\'urgent\') DEFAULT \'normal\'' },
    { name: 'is_published', definition: '\`is_published\` tinyint(1) DEFAULT 0' },
    { name: 'publish_date', definition: '\`publish_date\` datetime DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  assignments: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'batch_id', definition: '\`batch_id\` int(11) NOT NULL' },
    { name: 'lecturer_id', definition: '\`lecturer_id\` int(11) NOT NULL' },
    { name: 'title', definition: '\`title\` varchar(255) NOT NULL' },
    { name: 'description', definition: '\`description\` text NOT NULL' },
    { name: 'instructions', definition: '\`instructions\` text DEFAULT NULL' },
    { name: 'due_date', definition: '\`due_date\` datetime NOT NULL' },
    { name: 'max_marks', definition: '\`max_marks\` decimal(5,2) DEFAULT 100.00' },
    { name: 'assignment_type', definition: '\`assignment_type\` enum(\'individual\',\'group\',\'project\',\'quiz\') DEFAULT \'individual\'' },
    { name: 'status', definition: '\`status\` enum(\'draft\',\'published\',\'closed\') DEFAULT \'draft\'' },
    { name: 'submission_count', definition: '\`submission_count\` int(11) DEFAULT 0' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  // Note: Add more table definitions as needed for complete column tracking
  // This includes all 64 tables from the database schema
  rates: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL' },
    { name: 'item_description', definition: '\`item_description\` varchar(255) NOT NULL' },
    { name: 'category', definition: '\`category\` varchar(100) DEFAULT NULL' },
    { name: 'rate', definition: '\`rate\` decimal(10,2) NOT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'last_updated', definition: '\`last_updated\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'rate_type', definition: '\`rate_type\` varchar(50) DEFAULT \'Quantity\'' },
    { name: 'cost_type', definition: '\`cost_type\` varchar(50) DEFAULT \'C\'' },
    { name: 'user_created_id', definition: '\`user_created_id\` int(11) DEFAULT NULL' },
    { name: 'user_updated_id', definition: '\`user_updated_id\` int(11) DEFAULT NULL' }
  ],

  stream: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'name', definition: '\`name\` varchar(100) NOT NULL' }
  ],

  user_refresh_tokens: [
    { name: 'user_id', definition: '\`user_id\` int(11) NOT NULL' },
    { name: 'refresh_token', definition: '\`refresh_token\` varchar(512) NOT NULL' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  // Academic and Learning Management Tables
  assignment_submissions: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'assignment_id', definition: '\`assignment_id\` int(11) NOT NULL' },
    { name: 'student_id', definition: '\`student_id\` int(11) NOT NULL' },
    { name: 'submission_text', definition: '\`submission_text\` text DEFAULT NULL' },
    { name: 'file_path', definition: '\`file_path\` varchar(500) DEFAULT NULL' },
    { name: 'submitted_at', definition: '\`submitted_at\` datetime DEFAULT current_timestamp()' },
    { name: 'marks_obtained', definition: '\`marks_obtained\` decimal(10,2) DEFAULT NULL' },
    { name: 'feedback', definition: '\`feedback\` text DEFAULT NULL' },
    { name: 'graded_by', definition: '\`graded_by\` int(11) DEFAULT NULL' },
    { name: 'graded_at', definition: '\`graded_at\` datetime DEFAULT NULL' },
    { name: 'attempt_number', definition: '\`attempt_number\` int(11) DEFAULT 1' },
    { name: 'status', definition: '\`status\` enum(\'Submitted\',\'Late\',\'Graded\',\'Returned\',\'Resubmitted\') DEFAULT \'Submitted\'' },
    { name: 'group_submission_id', definition: '\`group_submission_id\` varchar(100) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'file_name', definition: '\`file_name\` varchar(255) DEFAULT NULL' }
  ],

  assignment_grades: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'assignment_id', definition: '\`assignment_id\` int(11) NOT NULL' },
    { name: 'student_id', definition: '\`student_id\` int(11) NOT NULL' },
    { name: 'lecturer_id', definition: '\`lecturer_id\` int(11) NOT NULL' },
    { name: 'marks_obtained', definition: '\`marks_obtained\` decimal(5,2) NOT NULL' },
    { name: 'max_marks', definition: '\`max_marks\` decimal(5,2) NOT NULL' },
    { name: 'percentage', definition: '\`percentage\` decimal(5,2) GENERATED ALWAYS AS (\`marks_obtained\` / \`max_marks\` * 100) STORED' },
    { name: 'grade', definition: '\`grade\` varchar(5) DEFAULT NULL' },
    { name: 'feedback', definition: '\`feedback\` text DEFAULT NULL' },
    { name: 'graded_at', definition: '\`graded_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  attendance: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'batch_id', definition: '\`batch_id\` int(11) NOT NULL' },
    { name: 'student_id', definition: '\`student_id\` int(11) NOT NULL' },
    { name: 'attendance_date', definition: '\`attendance_date\` date NOT NULL' },
    { name: 'module_id', definition: '\`module_id\` int(11) DEFAULT NULL' },
    { name: 'check_in_time', definition: '\`check_in_time\` time DEFAULT NULL' },
    { name: 'check_out_time', definition: '\`check_out_time\` time DEFAULT NULL' },
    { name: 'status', definition: '\`status\` enum(\'Present\',\'Absent\',\'Late\',\'Excused\',\'Holiday\') NOT NULL' },
    { name: 'remarks', definition: '\`remarks\` text DEFAULT NULL' },
    { name: 'marked_by', definition: '\`marked_by\` int(11) NOT NULL' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  batch_materials: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'batch_id', definition: '\`batch_id\` int(11) NOT NULL' },
    { name: 'lecturer_id', definition: '\`lecturer_id\` int(11) NOT NULL' },
    { name: 'title', definition: '\`title\` varchar(255) NOT NULL' },
    { name: 'description', definition: '\`description\` text DEFAULT NULL' },
    { name: 'file_name', definition: '\`file_name\` varchar(255) DEFAULT NULL' },
    { name: 'file_path', definition: '\`file_path\` varchar(500) DEFAULT NULL' },
    { name: 'file_size', definition: '\`file_size\` bigint(20) DEFAULT NULL' },
    { name: 'file_type', definition: '\`file_type\` varchar(100) DEFAULT NULL' },
    { name: 'material_type', definition: '\`material_type\` enum(\'lecture\',\'assignment\',\'quiz\',\'reference\',\'other\') DEFAULT \'lecture\'' },
    { name: 'is_active', definition: '\`is_active\` tinyint(1) DEFAULT 1' },
    { name: 'upload_date', definition: '\`upload_date\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  // Booking and Reservation Tables
  bookings: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'user_id', definition: '\`user_id\` int(11) DEFAULT NULL' },
    { name: 'booking_date', definition: '\`booking_date\` date DEFAULT NULL' },
    { name: 'booking_time', definition: '\`booking_time\` time DEFAULT NULL' },
    { name: 'bookingendtime', definition: '\`bookingendtime\` time DEFAULT NULL' },
    { name: 'no_of_people', definition: '\`no_of_people\` int(11) DEFAULT NULL' },
    { name: 'status', definition: '\`status\` enum(\'PENDING\',\'APPROVED\',\'DENIED\') DEFAULT \'PENDING\'' },
    { name: 'description', definition: '\`description\` text DEFAULT NULL' }
  ],

  busBooking: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'user_id', definition: '\`user_id\` int(11) DEFAULT NULL' },
    { name: 'fromPlace', definition: '\`fromPlace\` varchar(255) NOT NULL' },
    { name: 'toPlace', definition: '\`toPlace\` varchar(255) NOT NULL' },
    { name: 'travelDate', definition: '\`travelDate\` date NOT NULL' },
    { name: 'ReturnDate', definition: '\`ReturnDate\` date NOT NULL' },
    { name: 'forWho', definition: '\`forWho\` text DEFAULT NULL' },
    { name: 'ContactNo', definition: '\`ContactNo\` text NOT NULL' },
    { name: 'status', definition: '\`status\` enum(\'PENDING\',\'APPROVED\',\'DENIED\') NOT NULL' }
  ],

  // Classroom Management Tables
  classroom_booking_calendar: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL' },
    { name: 'user_id', definition: '\`user_id\` int(11) NOT NULL' },
    { name: 'request_id', definition: '\`request_id\` int(10) UNSIGNED DEFAULT NULL' },
    { name: 'date_from', definition: '\`date_from\` date NOT NULL' },
    { name: 'date_to', definition: '\`date_to\` date NOT NULL' },
    { name: 'time_from', definition: '\`time_from\` time NOT NULL' },
    { name: 'time_to', definition: '\`time_to\` time NOT NULL' },
    { name: 'course_name', definition: '\`course_name\` varchar(255) NOT NULL' },
    { name: 'preferred_days_of_week', definition: '\`preferred_days_of_week\` varchar(255) DEFAULT NULL' },
    { name: 'classes_allocated', definition: '\`classes_allocated\` text DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' }
  ],

  classroom_booking_dates: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL' },
    { name: 'calendar_id', definition: '\`calendar_id\` int(11) NOT NULL' },
    { name: 'user_id', definition: '\`user_id\` int(11) NOT NULL' },
    { name: 'request_id', definition: '\`request_id\` int(10) UNSIGNED DEFAULT NULL' },
    { name: 'course_name', definition: '\`course_name\` varchar(255) DEFAULT NULL' },
    { name: 'all_dates', definition: '\`all_dates\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`all_dates\`))' },
    { name: 'time_from', definition: '\`time_from\` time NOT NULL' },
    { name: 'time_to', definition: '\`time_to\` time NOT NULL' },
    { name: 'classes_allocated', definition: '\`classes_allocated\` text DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'cancel_dates', definition: '\`cancel_dates\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(\`cancel_dates\`))' }
  ],

  // Aid Request System Tables
  aid_requests: [
    { name: 'id', definition: '\`id\` int(10) UNSIGNED NOT NULL AUTO_INCREMENT' },
    { name: 'requesting_officer_name', definition: '\`requesting_officer_name\` varchar(255) NOT NULL' },
    { name: 'designation', definition: '\`designation\` varchar(255) DEFAULT NULL' },
    { name: 'requesting_officer_email', definition: '\`requesting_officer_email\` varchar(255) NOT NULL' },
    { name: 'course_name', definition: '\`course_name\` varchar(255) DEFAULT NULL' },
    { name: 'duration', definition: '\`duration\` varchar(255) DEFAULT NULL' },
    { name: 'audience_type', definition: '\`audience_type\` varchar(255) DEFAULT NULL' },
    { name: 'no_of_participants', definition: '\`no_of_participants\` int(11) DEFAULT 0' },
    { name: 'course_coordinator', definition: '\`course_coordinator\` varchar(255) DEFAULT NULL' },
    { name: 'preferred_days_of_week', definition: '\`preferred_days_of_week\` varchar(255) DEFAULT NULL' },
    { name: 'date_from', definition: '\`date_from\` date DEFAULT NULL' },
    { name: 'date_to', definition: '\`date_to\` date DEFAULT NULL' },
    { name: 'time_from', definition: '\`time_from\` time DEFAULT NULL' },
    { name: 'time_to', definition: '\`time_to\` time DEFAULT NULL' },
    { name: 'signed_date', definition: '\`signed_date\` date DEFAULT NULL' },
    { name: 'paid_course_or_not', definition: '\`paid_course_or_not\` varchar(50) DEFAULT \'No\'' },
    { name: 'payment_status', definition: '\`payment_status\` varchar(100) DEFAULT \'Not Set\'' },
    { name: 'request_status', definition: '\`request_status\` varchar(100) DEFAULT \'pending\'' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'classrooms_allocated', definition: '\`classrooms_allocated\` text DEFAULT NULL' },
    { name: 'exam_or_not', definition: '\`exam_or_not\` varchar(50) DEFAULT \'No\'' },
    { name: 'cancelled_by_requester', definition: '\`cancelled_by_requester\` varchar(50) DEFAULT \'No\'' },
    { name: 'last_updated', definition: '\`last_updated\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  aid_items: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'request_id', definition: '\`request_id\` int(10) UNSIGNED DEFAULT NULL' },
    { name: 'item_no', definition: '\`item_no\` int(11) DEFAULT NULL' },
    { name: 'description', definition: '\`description\` varchar(255) DEFAULT NULL' },
    { name: 'quantity', definition: '\`quantity\` int(11) DEFAULT NULL' },
    { name: 'remark', definition: '\`remark\` text DEFAULT NULL' },
    { name: 'md_approval_obtained', definition: '\`md_approval_obtained\` varchar(50) DEFAULT \'No\'' },
    { name: 'md_approval_details', definition: '\`md_approval_details\` text DEFAULT NULL' },
    { name: 'md_approval_required_or_not', definition: '\`md_approval_required_or_not\` varchar(50) DEFAULT \'No\'' },
    { name: 'CTM_approval_obtained', definition: '\`CTM_approval_obtained\` varchar(50) DEFAULT NULL' },
    { name: 'CTM_Details', definition: '\`CTM_Details\` text DEFAULT NULL' }
  ],

  aid_handover: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'request_id', definition: '\`request_id\` int(10) UNSIGNED DEFAULT NULL' },
    { name: 'items_taken_over', definition: '\`items_taken_over\` text DEFAULT NULL' },
    { name: 'items_returned', definition: '\`items_returned\` text DEFAULT NULL' },
    { name: 'receiver_name', definition: '\`receiver_name\` varchar(255) DEFAULT NULL' },
    { name: 'receiver_designation', definition: '\`receiver_designation\` varchar(255) DEFAULT NULL' },
    { name: 'receiver_date', definition: '\`receiver_date\` date DEFAULT NULL' },
    { name: 'handover_confirmer_name', definition: '\`handover_confirmer_name\` varchar(255) DEFAULT NULL' },
    { name: 'handover_confirmer_designation', definition: '\`handover_confirmer_designation\` varchar(255) DEFAULT NULL' },
    { name: 'handover_confirmer_date', definition: '\`handover_confirmer_date\` date DEFAULT NULL' }
  ],

  aid_request_emails: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'request_id', definition: '\`request_id\` int(10) UNSIGNED NOT NULL' },
    { name: 'email_type', definition: '\`email_type\` enum(\'approval\',\'denial\') NOT NULL' },
    { name: 'email_address', definition: '\`email_address\` varchar(255) NOT NULL' },
    { name: 'subject', definition: '\`subject\` varchar(255) DEFAULT NULL' },
    { name: 'body', definition: '\`body\` text DEFAULT NULL' },
    { name: 'sent_status', definition: '\`sent_status\` enum(\'success\',\'failed\') DEFAULT \'success\'' },
    { name: 'error_message', definition: '\`error_message\` text DEFAULT NULL' },
    { name: 'sent_at', definition: '\`sent_at\` timestamp NOT NULL DEFAULT current_timestamp()' }
  ],

  // Payment and Financial Management Tables
  payments_main_details: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'user_id', definition: '\`user_id\` int(11) DEFAULT NULL' },
    { name: 'course_name', definition: '\`course_name\` varchar(255) NOT NULL' },
    { name: 'no_of_participants', definition: '\`no_of_participants\` int(11) DEFAULT 0' },
    { name: 'duration', definition: '\`duration\` varchar(255) DEFAULT NULL' },
    { name: 'customer_type', definition: '\`customer_type\` varchar(255) DEFAULT NULL' },
    { name: 'stream', definition: '\`stream\` varchar(100) DEFAULT NULL' },
    { name: 'CTM_approved', definition: '\`CTM_approved\` varchar(50) DEFAULT \'Pending\'' },
    { name: 'CTM_details', definition: '\`CTM_details\` text DEFAULT NULL' },
    { name: 'special_justifications', definition: '\`special_justifications\` text DEFAULT NULL' },
    { name: 'date', definition: '\`date\` date DEFAULT curdate()' },
    { name: 'updated_by_id', definition: '\`updated_by_id\` int(11) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'last_updated', definition: '\`last_updated\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'accountant_approval_obtained', definition: '\`accountant_approval_obtained\` varchar(50) DEFAULT \'Pending\'' },
    { name: 'accountant_details', definition: '\`accountant_details\` text DEFAULT NULL' },
    { name: 'sectional_approval_obtained', definition: '\`sectional_approval_obtained\` varchar(50) DEFAULT \'Pending\'' },
    { name: 'section_type', definition: '\`section_type\` varchar(255) DEFAULT NULL' },
    { name: 'sectional_details', definition: '\`sectional_details\` text DEFAULT NULL' },
    { name: 'DCTM01_approval_obtained', definition: '\`DCTM01_approval_obtained\` varchar(50) DEFAULT \'Pending\'' },
    { name: 'DCTM01_details', definition: '\`DCTM01_details\` text DEFAULT NULL' },
    { name: 'DCTM02_approval_obtained', definition: '\`DCTM02_approval_obtained\` varchar(50) DEFAULT \'Pending\'' },
    { name: 'DCTM02_details', definition: '\`DCTM02_details\` text DEFAULT NULL' },
    { name: 'course_id', definition: '\`course_id\` int(11) DEFAULT NULL' }
  ],

  cost_summary_flags: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'payments_main_details_id', definition: '\`payments_main_details_id\` int(11) NOT NULL' },
    { name: 'summary_needs_refresh', definition: '\`summary_needs_refresh\` tinyint(1) NOT NULL DEFAULT 0' },
    { name: 'summary_up_to_date', definition: '\`summary_up_to_date\` tinyint(1) NOT NULL DEFAULT 0' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'special_cp_up_to_date', definition: '\`special_cp_up_to_date\` tinyint(1) NOT NULL DEFAULT 0' }
  ],

  course_cost_summary: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'payment_main_details_id', definition: '\`payment_main_details_id\` int(11) NOT NULL' },
    { name: 'profit_margin_percentage', definition: '\`profit_margin_percentage\` decimal(5,2) DEFAULT 0.00' },
    { name: 'profit_margin', definition: '\`profit_margin\` decimal(10,2) DEFAULT 0.00' },
    { name: 'provision_inflation_percentage', definition: '\`provision_inflation_percentage\` decimal(5,2) DEFAULT 0.00' },
    { name: 'inflation_amount', definition: '\`inflation_amount\` decimal(10,2) DEFAULT 0.00' },
    { name: 'total_cost_expense', definition: '\`total_cost_expense\` decimal(10,2) DEFAULT 0.00' },
    { name: 'NBT', definition: '\`NBT\` decimal(10,2) DEFAULT 0.00' },
    { name: 'NBT_percentage', definition: '\`NBT_percentage\` decimal(5,2) DEFAULT 0.00' },
    { name: 'VAT', definition: '\`VAT\` decimal(10,2) DEFAULT 0.00' },
    { name: 'VAT_percentage', definition: '\`VAT_percentage\` decimal(5,2) DEFAULT 0.00' },
    { name: 'total_course_cost', definition: '\`total_course_cost\` decimal(10,2) DEFAULT 0.00' },
    { name: 'no_of_participants', definition: '\`no_of_participants\` int(11) DEFAULT 0' },
    { name: 'course_fee_per_head', definition: '\`course_fee_per_head\` decimal(10,2) DEFAULT 0.00' },
    { name: 'prepared_by', definition: '\`prepared_by\` varchar(255) DEFAULT NULL' },
    { name: 'prepared_by_id', definition: '\`prepared_by_id\` int(11) DEFAULT NULL' },
    { name: 'check_by', definition: '\`check_by\` varchar(255) DEFAULT NULL' },
    { name: 'updated_by_id', definition: '\`updated_by_id\` int(11) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'Rounded_CFPH', definition: '\`Rounded_CFPH\` int(11) DEFAULT 0' },
    { name: 'Rounded_CT', definition: '\`Rounded_CT\` int(11) DEFAULT 0' }
  ],

  course_delivery_costs: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'payments_main_details_id', definition: '\`payments_main_details_id\` int(11) NOT NULL' },
    { name: 'Md_approval_obtained', definition: '\`Md_approval_obtained\` varchar(50) DEFAULT NULL' },
    { name: 'Md_details', definition: '\`Md_details\` text DEFAULT NULL' },
    { name: 'total_cost', definition: '\`total_cost\` decimal(10,2) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'user_id', definition: '\`user_id\` int(11) NOT NULL' }
  ],

  course_delivery_cost_items: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'course_delivery_cost_id', definition: '\`course_delivery_cost_id\` int(11) NOT NULL' },
    { name: 'role', definition: '\`role\` varchar(255) NOT NULL' },
    { name: 'no_of_officers', definition: '\`no_of_officers\` int(11) DEFAULT NULL' },
    { name: 'hours', definition: '\`hours\` int(11) DEFAULT NULL' },
    { name: 'rate', definition: '\`rate\` decimal(10,2) DEFAULT NULL' },
    { name: 'amount', definition: '\`amount\` decimal(10,2) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' }
  ],

  // Student and Course Management Tables
  student_batches: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'student_id', definition: '\`student_id\` int(11) NOT NULL' },
    { name: 'batch_id', definition: '\`batch_id\` int(11) NOT NULL' },
    { name: 'student_code', definition: '\`student_code\` varchar(50) DEFAULT NULL' },
    { name: 'enrollment_date', definition: '\`enrollment_date\` date DEFAULT NULL' },
    { name: 'attendance_percentage', definition: '\`attendance_percentage\` decimal(5,2) DEFAULT 0.00' },
    { name: 'status', definition: '\`status\` enum(\'Active\',\'Completed\',\'Withdrawn\') DEFAULT \'Active\'' },
    { name: 'completion_certificate', definition: '\`completion_certificate\` varchar(255) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  student_courses: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'student_id', definition: '\`student_id\` int(11) NOT NULL' },
    { name: 'course_id', definition: '\`course_id\` int(11) NOT NULL' },
    { name: 'student_code', definition: '\`student_code\` varchar(50) DEFAULT NULL' },
    { name: 'enrollment_date', definition: '\`enrollment_date\` date NOT NULL' },
    { name: 'primary_course', definition: '\`primary_course\` tinyint(1) DEFAULT 0' },
    { name: 'status', definition: '\`status\` enum(\'Active\',\'Completed\',\'Withdrawn\',\'Suspended\') DEFAULT \'Active\'' },
    { name: 'completion_date', definition: '\`completion_date\` date DEFAULT NULL' },
    { name: 'grade', definition: '\`grade\` varchar(10) DEFAULT NULL' },
    { name: 'remarks', definition: '\`remarks\` text DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  lecturer_batches: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'lecturer_id', definition: '\`lecturer_id\` int(11) NOT NULL' },
    { name: 'batch_id', definition: '\`batch_id\` int(11) NOT NULL' },
    { name: 'module', definition: '\`module\` varchar(100) DEFAULT NULL' },
    { name: 'hours_assigned', definition: '\`hours_assigned\` int(11) DEFAULT 0' },
    { name: 'payment_rate', definition: '\`payment_rate\` decimal(10,2) DEFAULT NULL' },
    { name: 'start_date', definition: '\`start_date\` date DEFAULT NULL' },
    { name: 'end_date', definition: '\`end_date\` date DEFAULT NULL' },
    { name: 'status', definition: '\`status\` enum(\'Assigned\',\'Active\',\'Completed\',\'Cancelled\') DEFAULT \'Assigned\'' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  lecturer_courses: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'lecturer_id', definition: '\`lecturer_id\` int(11) NOT NULL' },
    { name: 'course_id', definition: '\`course_id\` int(11) NOT NULL' },
    { name: 'primary_course', definition: '\`primary_course\` tinyint(1) DEFAULT 0' },
    { name: 'stream', definition: '\`stream\` varchar(100) DEFAULT NULL' },
    { name: 'module', definition: '\`module\` varchar(100) DEFAULT NULL' },
    { name: 'assignment_date', definition: '\`assignment_date\` date DEFAULT curdate()' },
    { name: 'status', definition: '\`status\` enum(\'Active\',\'Completed\',\'Inactive\') DEFAULT \'Active\'' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  course_modules: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'course_id', definition: '\`course_id\` int(11) NOT NULL' },
    { name: 'batch_id', definition: '\`batch_id\` int(11) DEFAULT NULL' },
    { name: 'module_name', definition: '\`module_name\` varchar(255) NOT NULL' },
    { name: 'module_code', definition: '\`module_code\` varchar(50) DEFAULT NULL' },
    { name: 'description', definition: '\`description\` text DEFAULT NULL' },
    { name: 'sequence_order', definition: '\`sequence_order\` int(11) DEFAULT 0' },
    { name: 'duration_hours', definition: '\`duration_hours\` int(11) DEFAULT 0' },
    { name: 'is_mandatory', definition: '\`is_mandatory\` tinyint(1) DEFAULT 1' },
    { name: 'created_by', definition: '\`created_by\` int(11) NOT NULL' },
    { name: 'status', definition: '\`status\` enum(\'Draft\',\'Published\',\'Archived\') DEFAULT \'Draft\'' },
    { name: 'created_at', definition: '\`created_at\` datetime DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  // Additional Payment Tables
  student_payments: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'student_id', definition: '\`student_id\` int(11) NOT NULL' },
    { name: 'user_id', definition: '\`user_id\` int(11) NOT NULL' },
    { name: 'payment_completed', definition: '\`payment_completed\` tinyint(1) NOT NULL DEFAULT 0' },
    { name: 'amount_paid', definition: '\`amount_paid\` decimal(10,2) NOT NULL' },
    { name: 'full_amount_payable', definition: '\`full_amount_payable\` decimal(10,2) NOT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'courseBatch_id', definition: '\`courseBatch_id\` int(11) NOT NULL' }
  ],

  lecturer_payments: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'user_id', definition: '\`user_id\` int(11) NOT NULL' },
    { name: 'paid_worked_hours', definition: '\`paid_worked_hours\` int(11) NOT NULL' },
    { name: 'payment_received_amount', definition: '\`payment_received_amount\` decimal(10,2) NOT NULL' },
    { name: 'full_amount_payable', definition: '\`full_amount_payable\` decimal(10,2) NOT NULL' },
    { name: 'payment_completed', definition: '\`payment_completed\` tinyint(1) NOT NULL DEFAULT 0' },
    { name: 'lecturer_attend_id', definition: '\`lecturer_attend_id\` int(11) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' }
  ],

  special_case_payments: [
    { name: 'id', definition: '\`id\` int(11) NOT NULL AUTO_INCREMENT' },
    { name: 'payments_main_details_id', definition: '\`payments_main_details_id\` int(11) NOT NULL' },
    { name: 'sc_title', definition: '\`sc_title\` varchar(255) DEFAULT NULL' },
    { name: 'description', definition: '\`description\` text DEFAULT NULL' },
    { name: 'percent_payment_or_not', definition: '\`percent_payment_or_not\` tinyint(1) DEFAULT NULL' },
    { name: 'percentage', definition: '\`percentage\` decimal(5,2) DEFAULT NULL' },
    { name: 'amount_paid', definition: '\`amount_paid\` decimal(10,2) DEFAULT NULL' },
    { name: 'total_payable', definition: '\`total_payable\` decimal(10,2) DEFAULT NULL' },
    { name: 'created_at', definition: '\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()' },
    { name: 'updated_at', definition: '\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()' },
    { name: 'updated_by_id', definition: '\`updated_by_id\` int(11) DEFAULT NULL' }
  ]

  // All 64+ tables now have complete column definitions for proper schema management and tracking
  // This enables automatic column addition/removal and comprehensive database evolution
};

// Function to check if table exists
async function tableExists(tableName) {
  try {
    const result = await db.queryPromise(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
      [process.env.DB_DATABASE, tableName]
    );
    return result[0].count > 0;
  } catch (error) {
    logger.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Function to create a single table with column updates
async function createTable(tableName, query) {
  try {
    const exists = await tableExists(tableName);
    if (!exists) {
      logger.info(`Creating table: ${tableName}`);
      await db.queryPromise(query);
      logger.info(`✅ Table ${tableName} created successfully`);
      return { created: true, updated: false };
    } else {
      // Table exists, check for column updates if column definitions are provided
      if (tableColumnDefinitions[tableName]) {
        const updated = await updateTableStructure(tableName, tableColumnDefinitions[tableName]);
        if (updated) {
          logger.info(`🔄 Table ${tableName} structure updated`);
          return { created: false, updated: true };
        }
      }
      return { created: false, updated: false };
    }
  } catch (error) {
    logger.error(`❌ Error creating/updating table ${tableName}:`, error);
    return { created: false, updated: false, error: true };
  }
}

// Function to initialize database
async function initializeDatabase() {
  logger.info('🚀 Starting database initialization...');
  
  const results = {
    created: [],
    updated: [],
    skipped: [],
    failed: []
  };

  // Create tables in order (respecting dependencies)
  const tableOrder = [
    // Core tables (no dependencies)
    'users',
    'stream',
    
    // Tables with user dependency
    'courses', 
    'lecturers',
    'students',
    'lecturer_users',
    'student_users',
    'payments_main_details',
    
    // Tables with course/lecturer/student dependencies
    'batches',
    'course_modules',
    'lecturer_academic_details',
    'lecturer_bank_details',
    'lecturer_batches',
    'lecturer_courses',
    'student_batches',
    'student_courses',
    
    // Tables with batch dependencies
    'announcements',
    'assignments',
    'assignment_submissions',
    'assignment_grades',
    'attendance',
    'batch_materials',
    'course_assignments',
    'course_materials',
    'module_progress',
    'student_announcement_reads',
    'quizzes',
    'discussion_forums',
    'forum_replies',
    
    // Payment related tables
    'cost_summary_flags',
    'course_cost_summary',
    'course_delivery_costs',
    'course_delivery_cost_items',
    'course_development_work',
    'course_development_work_expenses',
    'course_materials_costing',
    'course_overheads_main',
    'course_payments',
    'course_revenue_summary',
    'lecturer_attendance',
    'lecturer_payments',
    'overheads',
    'panel_meeting_participants',
    'special_case_payments',
    'student_payments',
    'student_payment_transactions',
    'student_payment_proofs',
    'training_environments',
    'training_teaching_aids',
    
    // Booking and aid related tables
    'aid_requests',
    'aid_items',
    'aid_handover',
    'aid_request_emails',
    'bookings',
    'busBooking',
    'classroom_booking_calendar',
    'classroom_booking_dates',
    
    // Other tables
    'grades',
    'password_reset_logs',
    'payment_emails',
    'rates',
    'students_sample',
    'student_payments_sample',
    'user_refresh_tokens'
  ];

  for (const tableName of tableOrder) {
    if (tableQueries[tableName]) {
      const result = await createTable(tableName, tableQueries[tableName]);
      if (result.error) {
        results.failed.push(tableName);
      } else if (result.created) {
        results.created.push(tableName);
      } else if (result.updated) {
        results.updated.push(tableName);
      } else {
        results.skipped.push(tableName);
      }
    } else {
      logger.warn(`No query found for table: ${tableName}`);
      results.failed.push(tableName);
    }
  }

  // Log summary - only show tables that were created or updated
  logger.info('📊 Database initialization summary:');
  if (results.created.length > 0) {
    logger.info(`✅ Created: ${results.created.length} tables - ${results.created.join(', ')}`);
  }
  if (results.updated.length > 0) {
    logger.info(`🔄 Updated: ${results.updated.length} tables - ${results.updated.join(', ')}`);
  }
  if (results.failed.length > 0) {
    logger.warn(`❌ Failed: ${results.failed.length} tables - ${results.failed.join(', ')}`);
  }
  
  // Only log skipped count if there are no changes
  if (results.created.length === 0 && results.updated.length === 0) {
    logger.info(`⏭️  All ${results.skipped.length} tables already exist and are up to date`);
  }

  return results;
}

module.exports = {
  initializeDatabase,
  tableExists,
  createTable
};
