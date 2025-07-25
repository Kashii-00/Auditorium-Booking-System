const db = require('../db');

class StudentIdGenerator {
  constructor() {
    this.institutePrefix = 'MP'; // Maritime Pilot Training Institute
  }

  /**
   * Generate student code in format: MP-PST25.1-001
   * @param {number} courseId - Course ID
   * @param {number} batchId - Batch ID (optional)
   * @param {number} year - Year (optional, defaults to current year)
   * @returns {Promise<string>} Generated student code
   */
  async generateStudentCode(courseId, batchId = null, year = null) {
    try {
      const currentYear = year || new Date().getFullYear();
      let shortYear = currentYear.toString().slice(-2); // 2025 -> 25

      // Get course details
      const courseQuery = `SELECT courseId FROM courses WHERE id = ?`;
      const courseResult = await db.queryPromise(courseQuery, [courseId]);
      
      if (courseResult.length === 0) {
        throw new Error(`Course not found with ID: ${courseId}`);
      }

      const courseCode = courseResult[0].courseId.replace('MP-', ''); // MP-PST -> PST
      
      // Get or create batch information
      let batchNumber = 1;
      if (batchId) {
        const batchQuery = `SELECT batch_number, year FROM batches WHERE id = ?`;
        const batchResult = await db.queryPromise(batchQuery, [batchId]);
        
        if (batchResult.length > 0 && batchResult[0].batch_number) {
          batchNumber = batchResult[0].batch_number;
          
          // If batch has a specific year, use that instead
          if (batchResult[0].year) {
            const batchYear = batchResult[0].year;
            const batchShortYear = batchYear.toString().slice(-2);
            // Update shortYear if batch has specific year
            if (batchYear !== currentYear) {
              shortYear = batchShortYear;
            }
          }
        }
      }

      // Get next available sequence number (fills gaps automatically)
      const nextSequence = await this.getNextAvailableSequence(courseId, batchId, currentYear, batchNumber);
      
      // Format sequence number with leading zeros (001, 002, etc.)
      const sequenceStr = nextSequence.toString().padStart(3, '0');
      
      // Build student code: MP-PST25.1-001
      const studentCode = `${this.institutePrefix}-${courseCode}${shortYear}.${batchNumber}-${sequenceStr}`;
      
      console.log(`Generated student code: ${studentCode} for course ${courseId}`);
      return studentCode;
      
    } catch (error) {
      console.error('Error generating student code:', error);
      throw error;
    }
  }

  /**
   * Assign student code to a course enrollment
   * @param {number} studentDbId - Student's database ID (students.id)
   * @param {number} courseId - Course ID
   * @param {number} batchId - Batch ID (optional)
   * @returns {Promise<string>} Generated and assigned student code
   */
  async assignStudentCodeToCourse(studentDbId, courseId, batchId = null) {
    try {
      // Check if enrollment exists
      const checkQuery = `
        SELECT id, student_code 
        FROM student_courses 
        WHERE student_id = ? AND course_id = ?
      `;
      
      const enrollment = await db.queryPromise(checkQuery, [studentDbId, courseId]);
      
      if (enrollment.length === 0) {
        throw new Error(`No course enrollment found for student ${studentDbId} in course ${courseId}`);
      }

      // If already has a student code, return it
      if (enrollment[0].student_code) {
        console.log(`Student already has code: ${enrollment[0].student_code}`);
        return enrollment[0].student_code;
      }
      
      // Generate new student code for this course
      const studentCode = await this.generateStudentCode(courseId, batchId);
      
      // Update the student_courses table with the generated code
      const updateQuery = `
        UPDATE student_courses 
        SET student_code = ? 
        WHERE student_id = ? AND course_id = ?
      `;
      
      const result = await db.queryPromise(updateQuery, [studentCode, studentDbId, courseId]);
      
      if (result.affectedRows === 0) {
        throw new Error(`Failed to update course enrollment for student ${studentDbId} in course ${courseId}`);
      }
      
      console.log(`Assigned student code ${studentCode} to student ${studentDbId} for course ${courseId}`);
      return studentCode;
      
    } catch (error) {
      console.error('Error assigning student code to course:', error);
      throw error;
    }
  }

  /**
   * Get student code for a specific course enrollment
   * @param {number} studentDbId - Student's database ID
   * @param {number} courseId - Course ID
   * @returns {Promise<string|null>} Student code for the course or null if not found
   */
  async getStudentCodeForCourse(studentDbId, courseId) {
    try {
      const query = `
        SELECT student_code 
        FROM student_courses 
        WHERE student_id = ? AND course_id = ?
      `;
      
      const result = await db.queryPromise(query, [studentDbId, courseId]);
      
      return result.length > 0 ? result[0].student_code : null;
      
    } catch (error) {
      console.error('Error getting student code for course:', error);
      throw error;
    }
  }

  /**
   * Get all student codes for a student across all courses
   * @param {number} studentDbId - Student's database ID
   * @returns {Promise<Array>} Array of course enrollments with student codes
   */
  async getAllStudentCodesForStudent(studentDbId) {
    try {
      const query = `
        SELECT 
          sc.student_code,
          sc.course_id,
          c.courseName,
          c.courseId as course_code,
          sc.primary_course,
          sc.status,
          sc.enrollment_date
        FROM student_courses sc
        INNER JOIN courses c ON sc.course_id = c.id
        WHERE sc.student_id = ?
        ORDER BY sc.primary_course DESC, sc.enrollment_date ASC
      `;
      
      return await db.queryPromise(query, [studentDbId]);
      
    } catch (error) {
      console.error('Error getting all student codes for student:', error);
      throw error;
    }
  }

  /**
   * Get primary student code (from primary course)
   * @param {number} studentDbId - Student's database ID
   * @returns {Promise<string|null>} Primary student code or null
   */
  async getPrimaryStudentCode(studentDbId) {
    try {
      const query = `
        SELECT student_code
        FROM student_courses 
        WHERE student_id = ? AND primary_course = 1
        ORDER BY enrollment_date ASC
        LIMIT 1
      `;
      
      const result = await db.queryPromise(query, [studentDbId]);
      
      return result.length > 0 ? result[0].student_code : null;
      
    } catch (error) {
      console.error('Error getting primary student code:', error);
      throw error;
    }
  }

  /**
   * Search students by student code
   * @param {string} searchTerm - Search term (partial student code)
   * @param {number} limit - Limit results (default 10)
   * @returns {Promise<Array>} Array of matching students with their codes
   */
  async searchStudentsByCode(searchTerm, limit = 10) {
    try {
      const query = `
        SELECT DISTINCT
          s.id,
          s.full_name,
          s.email,
          sc.student_code,
          c.courseName,
          c.courseId as course_code,
          sc.primary_course
        FROM students s
        INNER JOIN student_courses sc ON s.id = sc.student_id
        INNER JOIN courses c ON sc.course_id = c.id
        WHERE sc.student_code LIKE ?
        ORDER BY sc.primary_course DESC, s.full_name ASC
        LIMIT ?
      `;
      
      return await db.queryPromise(query, [`%${searchTerm}%`, limit]);
      
    } catch (error) {
      console.error('Error searching students by code:', error);
      throw error;
    }
  }

  /**
   * Get or create sequence record for course/batch/year combination
   */
  async getOrCreateSequence(courseId, batchId, year, batchNumber) {
    try {
      // First, try to find existing sequence
      const findQuery = `
        SELECT id FROM student_id_sequences 
        WHERE course_id = ? AND 
              (batch_id = ? OR (batch_id IS NULL AND ? IS NULL)) AND 
              year = ? AND batch_number = ?
      `;
      
      const existing = await db.queryPromise(findQuery, [courseId, batchId, batchId, year, batchNumber]);
      
      if (existing.length > 0) {
        return existing[0].id;
      }
      
      // Create new sequence record
      const insertQuery = `
        INSERT INTO student_id_sequences (course_id, batch_id, year, batch_number, current_sequence)
        VALUES (?, ?, ?, ?, 0)
      `;
      
      const result = await db.queryPromise(insertQuery, [courseId, batchId, year, batchNumber]);
      return result.insertId;
      
    } catch (error) {
      // Handle duplicate key error (race condition)
      if (error.code === 'ER_DUP_ENTRY') {
        // Try to find the existing record again
        const findQuery = `
          SELECT id FROM student_id_sequences 
          WHERE course_id = ? AND 
                (batch_id = ? OR (batch_id IS NULL AND ? IS NULL)) AND 
                year = ? AND batch_number = ?
        `;
        
        const existing = await db.queryPromise(findQuery, [courseId, batchId, batchId, year, batchNumber]);
        if (existing.length > 0) {
          return existing[0].id;
        }
      }
      throw error;
    }
  }

  /**
   * Get next sequence number (atomic operation)
   */
  async getNextSequenceNumber(sequenceId) {
    try {
      // Use atomic UPDATE to increment and get the new value
      const updateQuery = `
        UPDATE student_id_sequences 
        SET current_sequence = current_sequence + 1 
        WHERE id = ?
      `;
      
      await db.queryPromise(updateQuery, [sequenceId]);
      
      // Get the updated value
      const selectQuery = `SELECT current_sequence FROM student_id_sequences WHERE id = ?`;
      const result = await db.queryPromise(selectQuery, [sequenceId]);
      
      return result[0].current_sequence;
      
    } catch (error) {
      console.error('Error getting next sequence number:', error);
      throw error;
    }
  }

  /**
   * Reserve a student code without assigning it yet
   * Useful for batch operations
   */
  async reserveStudentCode(courseId, batchId = null, year = null) {
    return await this.generateStudentCode(courseId, batchId, year);
  }

  /**
   * Validate student code format
   */
  validateStudentCode(studentCode) {
    const pattern = /^MP-[A-Z]+\d{2}\.\d+-\d{3}$/;
    return pattern.test(studentCode);
  }

  /**
   * Parse student code to extract components
   */
  parseStudentCode(studentCode) {
    const pattern = /^MP-([A-Z]+)(\d{2})\.(\d+)-(\d{3})$/;
    const match = studentCode.match(pattern);
    
    if (!match) {
      throw new Error(`Invalid student code format: ${studentCode}`);
    }
    
    return {
      institute: 'MP',
      courseCode: match[1],
      year: 2000 + parseInt(match[2]), // 25 -> 2025
      batchNumber: parseInt(match[3]),
      sequence: parseInt(match[4])
    };
  }

  /**
   * Get student code statistics for a course
   */
  async getStudentCodeStats(courseId, year = null) {
    try {
      const currentYear = year || new Date().getFullYear();
      
      const query = `
        SELECT 
          s.batch_number,
          s.current_sequence,
          COUNT(sc.id) as students_enrolled
        FROM student_id_sequences s
        LEFT JOIN student_courses sc ON sc.student_code LIKE CONCAT('%', (
          SELECT CONCAT((SELECT courseId FROM courses WHERE id = ?), SUBSTRING(?, -2), '.', s.batch_number, '-%')
        ))
        WHERE s.course_id = ? AND s.year = ?
        GROUP BY s.batch_number, s.current_sequence
        ORDER BY s.batch_number
      `;
      
      return await db.queryPromise(query, [courseId, currentYear, courseId, currentYear]);
      
    } catch (error) {
      console.error('Error getting student code stats:', error);
      throw error;
    }
  }

  /**
   * Get next available sequence number, filling gaps if they exist
   * @param {number} courseId - Course ID
   * @param {number} batchId - Batch ID  
   * @param {number} year - Year
   * @param {number} batchNumber - Batch number
   * @returns {Promise<number>} Next available sequence number
   */
  async getNextAvailableSequence(courseId, batchId, year, batchNumber) {
    try {
      // Get the course code for building the pattern
      const courseQuery = `SELECT courseId FROM courses WHERE id = ?`;
      const courseResult = await db.queryPromise(courseQuery, [courseId]);
      const courseCode = courseResult[0].courseId.replace('MP-', '');
      const shortYear = year.toString().slice(-2);
      
      // Build the student code pattern
      const codePattern = `MP-${courseCode}${shortYear}.${batchNumber}-%`;
      
      // Get all existing codes for this course/batch/year combination
      const existingCodesQuery = `
        SELECT student_code 
        FROM student_courses 
        WHERE course_id = ? 
          AND student_code LIKE ? 
          AND student_code IS NOT NULL
        ORDER BY student_code
      `;
      
      const existingCodes = await db.queryPromise(existingCodesQuery, [courseId, codePattern]);
      
      // Extract sequence numbers from existing codes
      const existingSequences = existingCodes
        .map(row => {
          const match = row.student_code.match(/-(\d+)$/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(num => num !== null)
        .sort((a, b) => a - b);
      
      // Find the first gap or return the next number
      let nextSequence = 1;
      for (const seq of existingSequences) {
        if (seq === nextSequence) {
          nextSequence++;
        } else if (seq > nextSequence) {
          // Found a gap, use the current nextSequence
          break;
        }
      }
      
      console.log(`Next available sequence for ${codePattern}: ${nextSequence}`);
      return nextSequence;
      
    } catch (error) {
      console.error('Error getting next available sequence:', error);
      throw error;
    }
  }

  // Backward compatibility methods (deprecated)
  /**
   * @deprecated Use generateStudentCode instead
   */
  async generateStudentId(courseId, batchId = null, year = null) {
    console.warn('generateStudentId is deprecated, use generateStudentCode instead');
    return await this.generateStudentCode(courseId, batchId, year);
  }

  /**
   * @deprecated Use validateStudentCode instead
   */
  validateStudentId(studentId) {
    console.warn('validateStudentId is deprecated, use validateStudentCode instead');
    return this.validateStudentCode(studentId);
  }

  /**
   * @deprecated Use parseStudentCode instead
   */
  parseStudentId(studentId) {
    console.warn('parseStudentId is deprecated, use parseStudentCode instead');
    return this.parseStudentCode(studentId);
  }
}

module.exports = new StudentIdGenerator(); 