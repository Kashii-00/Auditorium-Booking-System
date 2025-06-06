require('dotenv').config();
const mysql = require('mysql');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
};

// Create necessary directories
['uploads', 'uploads/students', 'uploads/lecturers', 'uploads/courses'].forEach(dir => {
  ensureDirectoryExists(path.join(__dirname, '..', '..', dir));
});

// Create connection pool with optimal settings
const db = mysql.createPool({
  connectionLimit: 20, // Increased for better concurrency
  connectTimeout: 30000, // 30 seconds
  acquireTimeout: 30000,
  timeout: 60000, // 60 seconds
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  timezone: process.env.DB_TIMEZONE,
  charset: 'utf8mb4', // Support all unicode characters
  multipleStatements: true, // Allow multiple statements for transactions
});

// Database schema - organized by entity relationships
const schema = {

  // Course management tables
  courses: `
    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      courseId VARCHAR(50) NOT NULL,
      stream VARCHAR(100) NOT NULL,
      courseName VARCHAR(255) NOT NULL,
      medium JSON NOT NULL,
      location JSON NOT NULL,
      assessmentCriteria JSON NOT NULL,
      resources JSON NOT NULL,
      fees DECIMAL(10,2) NOT NULL,
      registrationFee DECIMAL(10,2) NOT NULL,
      installment1 DECIMAL(10,2) DEFAULT NULL,
      installment2 DECIMAL(10,2) DEFAULT NULL,
      additionalInstallments JSON DEFAULT NULL,
      description TEXT,
      duration VARCHAR(100),
      status ENUM('Active', 'Inactive', 'Pending', 'Completed') DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE KEY (courseId),
      INDEX idx_courses_name (courseName),
      INDEX idx_courses_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Batch management (a course can have multiple batches)
  batches: `
    CREATE TABLE IF NOT EXISTS batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      batch_name VARCHAR(100) NOT NULL,
      capacity INT DEFAULT 30,
      start_date DATE,
      end_date DATE,
      status ENUM('Upcoming', 'Active', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
      location VARCHAR(255),
      schedule TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE KEY (course_id, batch_name),
      INDEX idx_batches_status (status),
      INDEX idx_batches_dates (start_date, end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Student management
  students: `
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      identification_type ENUM('NIC', 'Passport') NOT NULL,
      id_number VARCHAR(50) NOT NULL,
      nationality VARCHAR(100) NOT NULL,
      date_of_birth DATE NOT NULL,
      country VARCHAR(100),
      cdc_number VARCHAR(100),
      address TEXT NOT NULL,
      department VARCHAR(100),
      company VARCHAR(100),
      sea_service VARCHAR(100),
      emergency_contact_name VARCHAR(255) NOT NULL,
      emergency_contact_number VARCHAR(50) NOT NULL,
      is_swimmer BOOLEAN DEFAULT FALSE,
      is_slpa_employee BOOLEAN DEFAULT FALSE,
      designation VARCHAR(100),
      division VARCHAR(100),
      service_no VARCHAR(50),
      section_unit VARCHAR(100),
      nic_document_path VARCHAR(255),
      passport_document_path VARCHAR(255),
      photo_path VARCHAR(255),
      driving_details JSON,
      status ENUM('Active', 'Inactive', 'Pending', 'Completed') DEFAULT 'Active',
      payment_status ENUM('Paid', 'Pending', 'Partial', 'Free') DEFAULT 'Pending',
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE KEY (email),
      INDEX idx_students_full_name (full_name),
      INDEX idx_students_id_number (id_number),
      INDEX idx_students_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Student-Course enrollment (Many-to-Many relationship)
  student_courses: `
    CREATE TABLE IF NOT EXISTS student_courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      enrollment_date DATE NOT NULL,
      primary_course BOOLEAN DEFAULT FALSE,
      status ENUM('Active', 'Completed', 'Withdrawn', 'Suspended') DEFAULT 'Active',
      completion_date DATE,
      grade VARCHAR(10),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE KEY student_course (student_id, course_id),
      INDEX idx_student_courses_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Student-Batch enrollment (Many-to-Many relationship)
  student_batches: `
    CREATE TABLE IF NOT EXISTS student_batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      batch_id INT NOT NULL,
      enrollment_date DATE,
      attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
      status ENUM('Active', 'Completed', 'Withdrawn') DEFAULT 'Active',
      completion_certificate VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
      UNIQUE KEY (student_id, batch_id),
      INDEX idx_student_batches_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Payment tracking for student courses
  course_payments: `
    CREATE TABLE IF NOT EXISTS course_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      payment_type ENUM('Registration', 'Installment1', 'Installment2', 'Additional', 'Full') NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATETIME NOT NULL,
      payment_method ENUM('Cash', 'Card', 'Bank Transfer', 'Check', 'Other') NOT NULL,
      receipt_number VARCHAR(100),
      notes TEXT,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_course_payments_date (payment_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Lecturer management
  lecturers: `
    CREATE TABLE IF NOT EXISTS lecturers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      identification_type ENUM('NIC', 'Passport') DEFAULT 'NIC',
      id_number VARCHAR(50) NOT NULL,
      date_of_birth DATE,
      address TEXT,
      phone VARCHAR(50),
      category VARCHAR(100),
      cdc_number VARCHAR(100),
      vehicle_number VARCHAR(100),
      nic_file VARCHAR(255),
      photo_file VARCHAR(255),
      driving_trainer_license_file VARCHAR(255),
      other_documents_file VARCHAR(255),
      status ENUM('Active', 'Inactive', 'Pending', 'Completed') DEFAULT 'Active',
      user_id INT NOT NULL COMMENT 'User who created this record',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE KEY (email),
      INDEX idx_lecturers_full_name (full_name),
      INDEX idx_lecturers_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Lecturer-Course relationship (Many-to-Many)
  lecturer_courses: `
    CREATE TABLE IF NOT EXISTS lecturer_courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lecturer_id INT NOT NULL,
      course_id INT NOT NULL,
      primary_course BOOLEAN DEFAULT FALSE,
      stream VARCHAR(100),
      module VARCHAR(100),
      assignment_date DATE DEFAULT CURRENT_DATE,
      status ENUM('Active', 'Completed', 'Inactive') DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE KEY (lecturer_id, course_id, module),
      INDEX idx_lecturer_courses_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Lecturer details tables
  lecturer_academic_details: `
    CREATE TABLE IF NOT EXISTS lecturer_academic_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lecturer_id INT NOT NULL,
      highest_qualification VARCHAR(255),
      other_qualifications TEXT,
      experience JSON COMMENT 'JSON array of experience records',
      education_certificate_file VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  lecturer_bank_details: `
    CREATE TABLE IF NOT EXISTS lecturer_bank_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lecturer_id INT NOT NULL,
      bank_name VARCHAR(255) NOT NULL,
      branch_name VARCHAR(255),
      account_number VARCHAR(255) NOT NULL,
      passbook_file VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // Lecturer-Batch assignment (Many-to-Many)
  lecturer_batches: `
    CREATE TABLE IF NOT EXISTS lecturer_batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lecturer_id INT NOT NULL,
      batch_id INT NOT NULL,
      module VARCHAR(100),
      hours_assigned INT DEFAULT 0,
      payment_rate DECIMAL(10,2),
      start_date DATE,
      end_date DATE,
      status ENUM('Assigned', 'Active', 'Completed', 'Cancelled') DEFAULT 'Assigned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
      UNIQUE KEY (lecturer_id, batch_id, module),
      INDEX idx_lecturer_batches_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

};

// Promise wrapper for database queries
function queryPromise(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Add promisified query method to the db object
db.queryPromise = queryPromise;

// Add connection promise methods for transaction handling
db.getConnectionPromise = function() {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        // Add promisified methods to the connection
        connection.queryPromise = function(sql, values) {
          return new Promise((resolve, reject) => {
            this.query(sql, values, (err, results) => {
              if (err) {
                reject(err);
              } else {
                resolve(results);
              }
            });
          });
        };
        
        connection.beginTransactionPromise = function() {
          return new Promise((resolve, reject) => {
            this.beginTransaction(err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        };
        
        connection.commitPromise = function() {
          return new Promise((resolve, reject) => {
            this.commit(err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        };
        
        connection.rollbackPromise = function() {
          return new Promise((resolve, reject) => {
            this.rollback(() => {
              // Always resolve rollback to ensure cleanup
              resolve();
            });
          });
        };
        
        resolve(connection);
      }
    });
  });
};

// Execute schema creation in the correct order (respecting foreign key dependencies)
const createTablesInOrder = async () => {
  try {

    // Course management
    await queryPromise(schema.courses);
    logger.info('Courses table ready');
    
    await queryPromise(schema.batches);
    logger.info('Batches table ready');
    
    // Student management
    await queryPromise(schema.students);
    logger.info('Students table ready');
    
    await queryPromise(schema.student_courses);
    logger.info('Student courses table ready');
    
    await queryPromise(schema.student_batches);
    logger.info('Student batches table ready');
    
    await queryPromise(schema.course_payments);
    logger.info('Course payments table ready');
    
    // Lecturer management
    await queryPromise(schema.lecturers);
    logger.info('Lecturers table ready');
    
    await queryPromise(schema.lecturer_courses);
    logger.info('Lecturer courses table ready');
    
    await queryPromise(schema.lecturer_academic_details);
    logger.info('Lecturer academic details table ready');
    
    await queryPromise(schema.lecturer_bank_details);
    logger.info('Lecturer bank details table ready');
    
    await queryPromise(schema.lecturer_batches);
    logger.info('Lecturer batches table ready');
  

    
    logger.info('All database tables created successfully');
    
    // Create data migration procedures if needed
    await createDataMigrationProcedures();
    
  } catch (error) {
    logger.error('Error creating database tables:', error);
  }
};

// Create stored procedures for data migration from old schema to new schema
const createDataMigrationProcedures = async () => {
  try {
    // Procedure to migrate lecturer data to new schema
    const migrateOldLecturerData = `
      CREATE PROCEDURE IF NOT EXISTS migrate_old_lecturer_data()
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE lecturer_id INT;
        DECLARE course_id INT;
        DECLARE stream_val VARCHAR(100);
        DECLARE module_val VARCHAR(100);
        
        -- Check if there are lecturers with course_id directly in lecturers table
        DECLARE cur CURSOR FOR 
          SELECT id, course_id, stream, module FROM lecturers 
          WHERE course_id IS NOT NULL AND 
          NOT EXISTS (SELECT 1 FROM lecturer_courses WHERE lecturer_id = lecturers.id AND course_id = lecturers.course_id);
        
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
        
        OPEN cur;
        
        read_loop: LOOP
          FETCH cur INTO lecturer_id, course_id, stream_val, module_val;
          IF done THEN
            LEAVE read_loop;
          END IF;
          
          -- Insert into lecturer_courses as primary course
          INSERT IGNORE INTO lecturer_courses 
            (lecturer_id, course_id, primary_course, stream, module) 
          VALUES 
            (lecturer_id, course_id, TRUE, stream_val, module_val);
        END LOOP;
        
        CLOSE cur;
      END
    `;
    
    // Procedure to migrate student data to new schema
    const migrateOldStudentData = `
      CREATE PROCEDURE IF NOT EXISTS migrate_old_student_data()
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE student_id INT;
        DECLARE course_id INT;
        
        -- Check if there are students with course_id directly in students table
        DECLARE cur CURSOR FOR 
          SELECT id, course_id FROM students 
          WHERE course_id IS NOT NULL AND 
          NOT EXISTS (SELECT 1 FROM student_courses WHERE student_id = students.id AND course_id = students.course_id AND primary_course = TRUE);
        
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
        
        OPEN cur;
        
        read_loop: LOOP
          FETCH cur INTO student_id, course_id;
          IF done THEN
            LEAVE read_loop;
          END IF;
          
          -- Insert into student_courses as primary course
          INSERT IGNORE INTO student_courses 
            (student_id, course_id, primary_course, enrollment_date, status) 
          VALUES 
            (student_id, course_id, TRUE, CURDATE(), 'Active');
        END LOOP;
        
        CLOSE cur;
      END
    `;
    
    // Create the procedures
    await queryPromise(migrateOldLecturerData);
    await queryPromise(migrateOldStudentData);
    
    // Run the migration procedures
    await queryPromise('CALL migrate_old_lecturer_data()');
    await queryPromise('CALL migrate_old_student_data()');
    
    logger.info('Data migration procedures created and executed');
  } catch (error) {
    logger.error('Error creating or executing data migration procedures:', error);
  }
};

// Create tables when the module is loaded
createTablesInOrder();

// Keep connection alive
setInterval(() => {
  db.query('SELECT 1', (err) => {
    if (err) {
      logger.error('❌ DB KEEP ALIVE FAILED:', err);
    } else {
      logger.debug('✅ DB KEEP ALIVE SUCCESSFUL');
    }
  });
}, 60 * 60 * 1000); // Every hour

// Initial connection test
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    logger.info('Connected to MySQL database');
    logger.info(`DB HOST: ${process.env.DB_HOST}`);
    logger.info(`DB: ${process.env.DB_DATABASE}`);
  }
});

module.exports = db;
