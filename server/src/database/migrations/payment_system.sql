-- Add fee column to courses table
ALTER TABLE courses ADD COLUMN fee DECIMAL(10,2) DEFAULT 0.00;

-- Create student_payments table
CREATE TABLE IF NOT EXISTS student_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  batch_id INT,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'OTHER') DEFAULT 'CASH',
  reference_number VARCHAR(100),
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
);

-- Add payment_status to student_courses for tracking
ALTER TABLE student_courses ADD COLUMN payment_status ENUM('UNPAID', 'PARTIAL', 'PAID') DEFAULT 'UNPAID';
ALTER TABLE student_courses ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0.00;
