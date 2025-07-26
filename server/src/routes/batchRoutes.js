// routes/batches.js
const express = require("express")
const router = express.Router()
const db = require("../db")
const auth = require("../auth")
const moment = require("moment")
const logger = require("../logger")
const batchManager = require("../services/batchManager")

// GET /batches?course_id=...&year=...
router.get("/", auth.authMiddleware, async (req, res) => {
  try {
    const { course_id, year } = req.query
    let sql = `
      SELECT b.*, c.courseName, c.courseId 
      FROM batches b 
      LEFT JOIN courses c ON b.course_id = c.id 
      WHERE 1=1
    `
    const params = []

    if (course_id) {
      sql += ` AND b.course_id = ?`
      params.push(course_id)
    }
    if (year) {
      sql += ` AND YEAR(b.start_date) = ?`
      params.push(year)
    }
    sql += ` ORDER BY b.start_date`

    const batches = await db.queryPromise(sql, params)

    // Add student_count and lecturer_count for each batch
    const batchIds = batches.map((b) => b.id)
    const studentCounts = {}
    const lecturerCounts = {}

    if (batchIds.length > 0) {
      // Get student counts
      const studentRows = await db.queryPromise(
        `SELECT batch_id, COUNT(*) as count FROM student_batches WHERE batch_id IN (${batchIds.map(() => "?").join(",")}) GROUP BY batch_id`,
        batchIds,
      )
      studentRows.forEach((row) => {
        studentCounts[row.batch_id] = row.count
      })

      // Get lecturer counts
      const lecturerRows = await db.queryPromise(
        `SELECT batch_id, COUNT(*) as count FROM lecturer_batches WHERE batch_id IN (${batchIds.map(() => "?").join(",")}) GROUP BY batch_id`,
        batchIds,
      )
      lecturerRows.forEach((row) => {
        lecturerCounts[row.batch_id] = row.count
      })
    }

    const batchesWithCounts = batches.map((b) => ({
      ...b,
      student_count: studentCounts[b.id] || 0,
      lecturer_count: lecturerCounts[b.id] || 0,
    }))

    res.json(batchesWithCounts)
  } catch (err) {
    console.error("Error loading batches:", err)
    res.status(500).json({ error: "Failed to load batches" })
  }
})

// GET /batches/:id
router.get("/:id", auth.authMiddleware, async (req, res) => {
  try {
    const [batch] = await db.queryPromise(
      `SELECT b.*, c.courseName, c.courseId,
        (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id) AS student_count,
        (SELECT COUNT(*) FROM lecturer_batches lb WHERE lb.batch_id = b.id) AS lecturer_count
       FROM batches b 
       LEFT JOIN courses c ON b.course_id = c.id 
       WHERE b.id = ?`,
      [req.params.id],
    )

    if (!batch) return res.status(404).json({ error: "Batch not found" })
    res.json(batch)
  } catch (err) {
    console.error("Error getting batch info:", err)
    res.status(500).json({ error: "Failed to get batch info" })
  }
})

// POST /batches
router.post("/", auth.authMiddleware, async (req, res) => {
  const { 
    course_id, 

    start_date, 
    end_date = null, 
    capacity = 30, 
    location = "", 
    schedule = "",
    lecturer_id = null,
    description = "",
    year = null
  } = req.body

  if (!course_id || !start_date) {
    return res.status(400).json({ error: "course_id, and start_date are required" })
  }

  try {
    // Use batch manager to create batch with automatic batch number and code generation
    const batchData = {
      start_date,
      end_date,
      capacity,
      location,
      description,
      lecturer_id,
      max_students: capacity,
      year: year || new Date(start_date).getFullYear(),
      schedule
    };

    const result = await batchManager.createBatch(course_id, batchData);
    
    logger.info(`(${result.batch_code}) created by ${req.user.name} at ${moment().format()}`);
    
    res.status(201).json({ 
      success: true, 
      batchId: result.id,
      batch_code: result.batch_code,
      batch_number: result.batch_number,
      year: result.year,
      message: `Batch created successfully with code: ${result.batch_code}` 
    });
  } catch (err) {
    logger.error("POST /batches error", err);
    res.status(500).json({ 
      error: err.message || "Failed to create batch" 
    });
  }
})

// PUT /batches/:id
router.put("/:id", auth.authMiddleware, async (req, res) => {
  const { id } = req.params
  const {start_date, end_date = null, capacity, location, schedule } = req.body

  if (!start_date) {
    return res.status(400).json({ error: "start_date are required" })
  }

  const sql = `
    UPDATE batches SET  start_date = ?, end_date = ?, capacity = ?, location = ?, schedule = ?
    WHERE id = ?
  `

  try {
    const result = await db.queryPromise(sql, [
      start_date,
      end_date,
      capacity || 30,
      location || "",
      schedule || "",
      id,
    ])
    if (result.affectedRows === 0) return res.status(404).json({ error: "Batch not found" })
    logger.info(`Batch ${id} updated by ${req.user.name} at ${moment().format()}`)
    res.json({ success: true })
  } catch (err) {
    logger.error(`PUT /batches/${id} error`, err)
    res.status(500).json({ error: "Failed to update batch" })
  }
})

// DELETE /batches/:id
router.delete("/:id", auth.authMiddleware, async (req, res) => {
  const { id } = req.params
  try {
    // Check for enrolled students
    const [{ count }] = await db.queryPromise("SELECT COUNT(*) AS count FROM student_batches WHERE batch_id = ?", [id])
    if (count > 0) {
      return res.status(400).json({ error: "Cannot delete batch with enrolled students" })
    }

    const result = await db.queryPromise("DELETE FROM batches WHERE id = ?", [id])
    if (result.affectedRows === 0) return res.status(404).json({ error: "Batch not found" })
    logger.info(`Batch ${id} deleted by ${req.user.name} at ${moment().format()}`)
    res.json({ success: true })
  } catch (err) {
    logger.error(`DELETE /batches/${id} error`, err)
    res.status(500).json({ error: "Failed to delete batch" })
  }
})

// Get students assigned to a batch
router.get("/:batchId/students", auth.authMiddleware, async (req, res) => {
  try {
    const rows = await db.queryPromise(
      `SELECT s.id, s.full_name, s.email, s.id_number, s.emergency_contact_number, sb.status, sb.created_at as enrollment_date
       FROM student_batches sb
       JOIN students s ON sb.student_id = s.id
       WHERE sb.batch_id = ?
       ORDER BY s.full_name`,
      [req.params.batchId],
    )
    res.json(rows)
  } catch (err) {
    console.error("Error loading batch students:", err)
    res.status(500).json({ error: "Failed to load batch students" })
  }
})

// Get lecturers assigned to a batch
router.get("/:batchId/lecturers", auth.authMiddleware, async (req, res) => {
  try {
    const rows = await db.queryPromise(
      `SELECT l.id, l.full_name, l.email, l.phone, lb.module, lb.status
       FROM lecturer_batches lb
       JOIN lecturers l ON lb.lecturer_id = l.id
       WHERE lb.batch_id = ?
       ORDER BY l.full_name`,
      [req.params.batchId],
    )
    res.json(rows)
  } catch (err) {
    console.error("Error loading batch lecturers:", err)
    res.status(500).json({ error: "Failed to load batch lecturers" })
  }
})

// Get available students for a specific batch (filtered by course enrollment)
router.get("/:batchId/available-students", auth.authMiddleware, async (req, res) => {
  try {
    const batchId = req.params.batchId

    // Get batch course information
    const [batch] = await db.queryPromise(`SELECT course_id FROM batches WHERE id = ?`, [batchId])

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    // Get students enrolled in the batch's course but not already in this batch
    // Using the proper relational structure with student_courses table
    const availableStudents = await db.queryPromise(
      `SELECT DISTINCT s.id, s.full_name, s.email, s.id_number, s.emergency_contact_number
       FROM students s
       INNER JOIN student_courses sc ON s.id = sc.student_id
       WHERE sc.course_id = ?
       AND sc.status = 'Active'
       AND s.id NOT IN (
         SELECT student_id FROM student_batches WHERE batch_id = ?
       )
       ORDER BY s.full_name`,
      [batch.course_id, batchId],
    )

    res.json(availableStudents)
  } catch (err) {
    console.error("Error loading available students:", err)
    res.status(500).json({ error: "Failed to load available students" })
  }
})

// Assign students to a batch
router.post("/:batchId/students", auth.authMiddleware, async (req, res) => {
  try {
    let { student_ids } = req.body

    // Handle both array and JSON-stringified array
    if (typeof student_ids === "string") {
      try {
        student_ids = JSON.parse(student_ids)
      } catch (e) {
        // If parsing fails, treat as comma-separated string
        student_ids = student_ids
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id)
      }
    }

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: "No students selected" })
    }

    // Validate student IDs are numbers
    const validStudentIds = student_ids.filter((id) => !isNaN(Number.parseInt(id))).map((id) => Number.parseInt(id))
    if (validStudentIds.length === 0) {
      return res.status(400).json({ error: "Invalid student IDs provided" })
    }

    // Check batch exists and get capacity and course_id
    const [batch] = await db.queryPromise(
      `SELECT id, capacity, course_id,
        (SELECT COUNT(*) FROM student_batches WHERE batch_id = ?) AS student_count 
       FROM batches WHERE id = ?`,
      [req.params.batchId, req.params.batchId],
    )

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    // Check capacity
    if (batch.student_count + validStudentIds.length > batch.capacity) {
      return res.status(400).json({
        error: `Batch capacity exceeded. Current: ${batch.student_count}, Capacity: ${batch.capacity}, Trying to add: ${validStudentIds.length}`,
      })
    }

    // Check if students exist and are enrolled in the batch's course
    const existingStudents = await db.queryPromise(
      `SELECT DISTINCT s.id FROM students s
       INNER JOIN student_courses sc ON s.id = sc.student_id
       WHERE s.id IN (${validStudentIds.map(() => "?").join(",")})
       AND sc.course_id = ?
       AND sc.status = 'Active'`,
      [...validStudentIds, batch.course_id],
    )

    const existingStudentIds = existingStudents.map((s) => s.id)
    const nonExistentIds = validStudentIds.filter((id) => !existingStudentIds.includes(id))

    if (nonExistentIds.length > 0) {
      return res.status(400).json({
        error: `Students not found or not enrolled in this course: ${nonExistentIds.join(", ")}`,
      })
    }

    // Insert student-batch assignments and generate student codes
    const studentIdGenerator = require('../services/studentIdGenerator');
    let successCount = 0
    
    for (const studentId of existingStudentIds) {
      try {
        // Generate student code first
        const studentCode = await studentIdGenerator.generateStudentCode(batch.course_id, req.params.batchId);
        
        // Insert into student_batches with student code
        const result = await db.queryPromise(
          `INSERT IGNORE INTO student_batches (student_id, batch_id, student_code, status, created_at) 
           VALUES (?, ?, ?, 'Active', NOW())`,
          [studentId, req.params.batchId, studentCode],
        )
        
        if (result.affectedRows > 0) {
          // Update the student_courses record with the generated student code
          await db.queryPromise(
            `UPDATE student_courses 
             SET student_code = ? 
             WHERE student_id = ? AND course_id = ? AND student_code IS NULL`,
            [studentCode, studentId, batch.course_id]
          );
          
          console.log(`Generated student code: ${studentCode} for student ${studentId} in batch ${req.params.batchId}`);
          successCount++
        }
      } catch (err) {
        console.error(`Error inserting student ${studentId} into batch:`, err)
      }
    }

    if (successCount === 0) {
      return res.status(400).json({ error: "All selected students are already in this batch" })
    }

    logger.info(`${successCount} students assigned to batch ${req.params.batchId} by ${req.user.name}`)
    res.json({
      success: true,
      message: `Successfully assigned ${successCount} student(s) to batch`,
      assigned_count: successCount,
    })
  } catch (err) {
    console.error("Error assigning students to batch:", err)
    res.status(500).json({ error: "Failed to assign students to batch" })
  }
})

// Assign lecturers to a batch
router.post("/:batchId/lecturers", auth.authMiddleware, async (req, res) => {
  try {
    let { lecturer_ids } = req.body

    // Handle both array and JSON-stringified array
    if (typeof lecturer_ids === "string") {
      try {
        lecturer_ids = JSON.parse(lecturer_ids)
      } catch (e) {
        lecturer_ids = lecturer_ids
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id)
      }
    }

    if (!Array.isArray(lecturer_ids) || lecturer_ids.length === 0) {
      return res.status(400).json({ error: "No lecturers selected" })
    }

    // Validate lecturer IDs
    const validLecturerIds = lecturer_ids.filter((id) => !isNaN(Number.parseInt(id))).map((id) => Number.parseInt(id))
    if (validLecturerIds.length === 0) {
      return res.status(400).json({ error: "Invalid lecturer IDs provided" })
    }

    // Check batch exists
    const [batch] = await db.queryPromise("SELECT id FROM batches WHERE id = ?", [req.params.batchId])
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    // Insert lecturer-batch assignments (ignore duplicates)
    let successCount = 0
    for (const lecturerId of validLecturerIds) {
      try {
        const result = await db.queryPromise(
          `INSERT IGNORE INTO lecturer_batches (lecturer_id, batch_id, status, created_at) 
           VALUES (?, ?, 'Assigned', NOW())`,
          [lecturerId, req.params.batchId],
        )
        if (result.affectedRows > 0) {
          successCount++
        }
      } catch (err) {
        console.error(`Error inserting lecturer ${lecturerId} into batch:`, err)
      }
    }

    logger.info(`${successCount} lecturers assigned to batch ${req.params.batchId} by ${req.user.name}`)
    res.json({
      success: true,
      message: `Successfully assigned ${successCount} lecturer(s) to batch`,
      assigned_count: successCount,
    })
  } catch (err) {
    console.error("Error assigning lecturers to batch:", err)
    res.status(500).json({ error: "Failed to assign lecturers to batch" })
  }
})

// DELETE student from batch
router.delete("/:batchId/students/:studentId", auth.authMiddleware, async (req, res) => {
  try {
    const { batchId, studentId } = req.params
    const result = await db.queryPromise(`DELETE FROM student_batches WHERE batch_id = ? AND student_id = ?`, [
      batchId,
      studentId,
    ])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found in batch" })
    }
    res.json({ success: true })
  } catch (err) {
    console.error("Error removing student from batch:", err)
    res.status(500).json({ error: "Failed to remove student from batch" })
  }
})

// DELETE lecturer from batch
router.delete("/:batchId/lecturers/:lecturerId", auth.authMiddleware, async (req, res) => {
  try {
    const { batchId, lecturerId } = req.params
    const result = await db.queryPromise(`DELETE FROM lecturer_batches WHERE batch_id = ? AND lecturer_id = ?`, [
      batchId,
      lecturerId,
    ])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Lecturer not found in batch" })
    }
    res.json({ success: true })
  } catch (err) {
    console.error("Error removing lecturer from batch:", err)
    res.status(500).json({ error: "Failed to remove lecturer from batch" })
  }
})

// GET comprehensive batch details including course, students, and lecturers
router.get("/details/:batchId", auth.authMiddleware, async (req, res) => {
  try {
    const batchId = req.params.batchId

    // Get batch details with course information
    const [batch] = await db.queryPromise(
      `SELECT b.*, c.courseName, c.courseId, c.stream, c.description as course_description,
              c.duration as course_duration, c.fees, c.medium, c.location as course_location,
              (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id) AS student_count,
              (SELECT COUNT(*) FROM lecturer_batches lb WHERE lb.batch_id = b.id) AS lecturer_count
       FROM batches b 
       LEFT JOIN courses c ON b.course_id = c.id 
       WHERE b.id = ?`,
      [batchId],
    )

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    // Get students in this batch
    const students = await db.queryPromise(
      `SELECT s.id, s.full_name, s.email, s.id_number, s.emergency_contact_number, 
              sb.status, sb.created_at as enrollment_date, sb.attendance_percentage
       FROM student_batches sb
       JOIN students s ON sb.student_id = s.id
       WHERE sb.batch_id = ?
       ORDER BY s.full_name`,
      [batchId],
    )

    // Get lecturers in this batch
    const lecturers = await db.queryPromise(
      `SELECT l.id, l.full_name, l.email, l.phone, l.category,
              lb.module, lb.status, lb.hours_assigned, lb.payment_rate
       FROM lecturer_batches lb
       JOIN lecturers l ON lb.lecturer_id = l.id
       WHERE lb.batch_id = ?
       ORDER BY l.full_name`,
      [batchId],
    )

    // Parse JSON fields if they exist
    if (batch.medium && typeof batch.medium === "string") {
      try {
        batch.medium = JSON.parse(batch.medium)
      } catch (e) {
        batch.medium = []
      }
    }

    if (batch.course_location && typeof batch.course_location === "string") {
      try {
        batch.course_location = JSON.parse(batch.course_location)
      } catch (e) {
        batch.course_location = []
      }
    }

    // Combine all data
    const batchDetails = {
      ...batch,
      students,
      lecturers,
    }

    res.json(batchDetails)
  } catch (err) {
    console.error("Error loading batch details:", err)
    res.status(500).json({ error: "Failed to load batch details" })
  }
})

module.exports = router
