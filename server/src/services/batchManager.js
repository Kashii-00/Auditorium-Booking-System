const db = require('../db');

class BatchManager {
  /**
   * Create a new batch with automatic batch number assignment
   */
  async createBatch(courseId, batchData) {
    try {
      const year = batchData.year || new Date().getFullYear();
      
      // Get the next batch number for this course and year
      const batchNumberQuery = `
        SELECT COALESCE(MAX(batch_number), 0) + 1 as next_batch_number 
        FROM batches 
        WHERE course_id = ? AND year = ?
      `;
      
      const batchNumberResult = await db.queryPromise(batchNumberQuery, [courseId, year]);
      const nextBatchNumber = batchNumberResult[0].next_batch_number;
      
      // Generate batch code if not provided
      let batchCode = batchData.batch_code;
      if (!batchCode) {
        const courseQuery = `SELECT courseId FROM courses WHERE id = ?`;
        const courseResult = await db.queryPromise(courseQuery, [courseId]);
        const courseCode = courseResult[0].courseId;
        
        const shortYear = year.toString().slice(-2);
        batchCode = `${courseCode}${shortYear}.${nextBatchNumber}`;
      }
      
      // Create the batch
      const insertQuery = `
        INSERT INTO batches (
          course_id, batch_code, batch_number, year, 
          capacity, start_date, end_date, status, location, 
          description, lecturer_id, max_students, schedule
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        courseId,
        batchCode,
        nextBatchNumber,
        year,
        batchData.capacity || 30,
        batchData.start_date,
        batchData.end_date,
        batchData.status || 'Upcoming',
        batchData.location,
        batchData.description,
        batchData.lecturer_id,
        batchData.max_students || 30,
        batchData.schedule || ''
      ];
      
      const result = await db.queryPromise(insertQuery, values);
      
      console.log(`Batch created with ID: ${result.insertId}, Code: ${batchCode}`);
      return {
        id: result.insertId,
        batch_code: batchCode,
        batch_number: nextBatchNumber,
        year: year
      };
      
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  /**
   * Get batch details with student count
   */
  async getBatchDetails(batchId) {
    try {
      const query = `
        SELECT 
          b.*,
          c.courseId,
          c.courseName,
          COUNT(sb.student_id) as enrolled_students
        FROM batches b
        JOIN courses c ON b.course_id = c.id
        LEFT JOIN student_batches sb ON b.id = sb.batch_id AND sb.status = 'Active'
        WHERE b.id = ?
        GROUP BY b.id
      `;
      
      const result = await db.queryPromise(query, [batchId]);
      return result[0] || null;
      
    } catch (error) {
      console.error('Error getting batch details:', error);
      throw error;
    }
  }

  /**
   * Get available courses for batch creation
   */
  async getAvailableCourses() {
    try {
      const query = `
        SELECT id, courseId, courseName, stream, status
        FROM courses
        WHERE status = 'Active'
        ORDER BY courseName
      `;
      
      return await db.queryPromise(query);
      
    } catch (error) {
      console.error('Error getting available courses:', error);
      throw error;
    }
  }

  /**
   * Get batches for a specific course
   */
  async getCourseBatches(courseId, year = null) {
    try {
      let query = `
        SELECT 
          b.*,
          c.courseId,
          c.courseName,
          COUNT(sb.student_id) as enrolled_students
        FROM batches b
        JOIN courses c ON b.course_id = c.id
        LEFT JOIN student_batches sb ON b.id = sb.batch_id AND sb.status = 'Active'
        WHERE b.course_id = ?
      `;
      
      const params = [courseId];
      
      if (year) {
        query += ` AND b.year = ?`;
        params.push(year);
      }
      
      query += ` GROUP BY b.id ORDER BY b.year DESC, b.batch_number DESC`;
      
      return await db.queryPromise(query, params);
      
    } catch (error) {
      console.error('Error getting course batches:', error);
      throw error;
    }
  }

  /**
   * Update batch information
   */
  async updateBatch(batchId, updateData) {
    try {
      const allowedFields = [
        'capacity', 'start_date', 'end_date', 
        'status', 'location', 'description', 'lecturer_id', 'max_students', 'schedule'
      ];
      
      const updateFields = [];
      const values = [];
      
      Object.keys(updateData).forEach(field => {
        if (allowedFields.includes(field) && updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(batchId);
      
      const query = `
        UPDATE batches 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = await db.queryPromise(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Batch not found');
      }
      
      console.log(`Batch ${batchId} updated successfully`);
      return await this.getBatchDetails(batchId);
      
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  }

  /**
   * Delete a batch (only if no students enrolled)
   */
  async deleteBatch(batchId) {
    try {
      // Check if batch has enrolled students
      const studentsQuery = `
        SELECT COUNT(*) as student_count 
        FROM student_batches 
        WHERE batch_id = ? AND status = 'Active'
      `;
      
      const studentsResult = await db.queryPromise(studentsQuery, [batchId]);
      
      if (studentsResult[0].student_count > 0) {
        throw new Error('Cannot delete batch with enrolled students');
      }
      
      // Delete the batch
      const deleteQuery = `DELETE FROM batches WHERE id = ?`;
      const result = await db.queryPromise(deleteQuery, [batchId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Batch not found');
      }
      
      console.log(`Batch ${batchId} deleted successfully`);
      return { success: true, message: 'Batch deleted successfully' };
      
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }

  /**
   * Enroll student in batch
   */
  async enrollStudent(studentId, batchId, enrollmentData = {}) {
    try {
      // Check if student is already enrolled in this batch
      const existingQuery = `
        SELECT id FROM student_batches 
        WHERE student_id = ? AND batch_id = ?
      `;
      
      const existing = await db.queryPromise(existingQuery, [studentId, batchId]);
      
      if (existing.length > 0) {
        throw new Error('Student is already enrolled in this batch');
      }
      
      // Check batch capacity
      const capacityQuery = `
        SELECT 
          b.max_students,
          COUNT(sb.student_id) as current_enrollment
        FROM batches b
        LEFT JOIN student_batches sb ON b.id = sb.batch_id AND sb.status = 'Active'
        WHERE b.id = ?
        GROUP BY b.id
      `;
      
      const capacityResult = await db.queryPromise(capacityQuery, [batchId]);
      
      if (capacityResult.length === 0) {
        throw new Error('Batch not found');
      }
      
      const { max_students, current_enrollment } = capacityResult[0];
      
      if (current_enrollment >= max_students) {
        throw new Error('Batch is at full capacity');
      }
      
      // Enroll the student
      const enrollQuery = `
        INSERT INTO student_batches (
          student_id, batch_id, enrollment_date, status, attendance_percentage
        ) VALUES (?, ?, CURDATE(), 'Active', 0)
      `;
      
      const result = await db.queryPromise(enrollQuery, [studentId, batchId]);
      
      console.log(`Student ${studentId} enrolled in batch ${batchId}`);
      return { success: true, enrollment_id: result.insertId };
      
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
  }
}

module.exports = new BatchManager(); 