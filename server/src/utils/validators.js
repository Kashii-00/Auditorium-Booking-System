/**
 * Validates batch data
 * @param {Object} data - Batch data to validate
 * @returns {Object} - Validation result with isValid flag and errors
 */
function validateBatch(data) {
  const errors = []

  if (!data.course_id) {
    errors.push("Course ID is required")
  }


  if (!data.start_date) {
    errors.push("Start date is required")
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data.start_date)) {
      errors.push("Start date must be in YYYY-MM-DD format")
    }
  }

  if (data.end_date) {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data.end_date)) {
      errors.push("End date must be in YYYY-MM-DD format")
    }

    // Validate end date is after start date
    if (data.start_date && new Date(data.end_date) <= new Date(data.start_date)) {
      errors.push("End date must be after start date")
    }
  }

  if (data.capacity !== undefined) {
    if (isNaN(data.capacity) || data.capacity < 1) {
      errors.push("Capacity must be a positive number")
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  }
}

/**
 * Validates student data
 * @param {Object} data - Student data to validate
 * @returns {Object} - Validation result with isValid flag and errors
 */
function validateStudent(data) {
  const errors = []

  if (!data.full_name) {
    errors.push("Full name is required")
  }

  if (!data.email) {
    errors.push("Email is required")
  } else {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format")
    }
  }

  if (!data.phone) {
    errors.push("Phone number is required")
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  }
}

/**
 * Validates lecturer data
 * @param {Object} data - Lecturer data to validate
 * @returns {Object} - Validation result with isValid flag and errors
 */
function validateLecturer(data) {
  const errors = []

  if (!data.full_name) {
    errors.push("Full name is required")
  }

  if (!data.email) {
    errors.push("Email is required")
  } else {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format")
    }
  }

  if (!data.phone) {
    errors.push("Phone number is required")
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  }
}

module.exports = {
  validateBatch,
  validateStudent,
  validateLecturer,
}
