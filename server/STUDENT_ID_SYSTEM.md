# 🎓 Student ID System Documentation

## Overview

This system automatically generates unique student IDs for each student when they register for courses. Student IDs follow the format: **MP-PST25.1-001**

### ID Format Breakdown
- **MP**: Institute prefix (Maritime Pilot Training)
- **PST**: Course code (from courses table)
- **25**: Year (2025 → 25)
- **1**: Batch number (1st batch of the year)
- **001**: Sequential student number within that course/batch

## Features

✅ **Automatic ID Generation** - No manual input required  
✅ **Sequential Numbering** - Students get consecutive numbers  
✅ **Course-Specific** - IDs are unique per course  
✅ **Year-Based** - Separate sequences for each year  
✅ **Batch Support** - Different batch numbers for same course  
✅ **Thread-Safe** - Handles concurrent registrations  
✅ **Validation** - Built-in format validation  
✅ **Migration Support** - Scripts for existing students  

## Database Schema

### New Tables

#### `student_id_sequences`
```sql
CREATE TABLE student_id_sequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  batch_id INT,
  year INT NOT NULL,
  batch_number INT NOT NULL DEFAULT 1,
  current_sequence INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_course_batch_year (course_id, batch_id, year, batch_number),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);
```

### Modified Tables

#### `students` table
- Added `student_id VARCHAR(50) UNIQUE` column
- Added index on `student_id` for fast lookups

## API Endpoints

### Student Registration
- **POST** `/api/students` - Now automatically generates student ID
- **Response includes**: `student_id` field

### Student ID Management
- **GET** `/api/student-ids/stats` - Get ID generation statistics
- **GET** `/api/student-ids/search/:studentId` - Find student by ID
- **POST** `/api/student-ids/generate` - Generate test ID
- **POST** `/api/student-ids/validate` - Validate ID format
- **GET** `/api/student-ids/next/:courseId` - Preview next ID

### Example Response
```json
{
  "success": true,
  "studentId": 15,
  "student_id": "MP-PST25.1-001",
  "message": "Student registered successfully with ID: MP-PST25.1-001"
}
```

## Services

### StudentIdGenerator
Located: `src/services/studentIdGenerator.js`

#### Key Methods
```javascript
// Generate new student ID
await studentIdGenerator.generateStudentId(courseId, batchId, year)

// Validate ID format
studentIdGenerator.validateStudentId("MP-PST25.1-001")

// Parse ID components
studentIdGenerator.parseStudentId("MP-PST25.1-001")

// Get statistics
await studentIdGenerator.getStudentIdStats(courseId, year)
```

### BatchManager
Located: `src/services/batchManager.js`

#### Key Methods
```javascript
// Create batch with auto batch numbering
await batchManager.createBatch(courseId, batchData)

// Get batch details
await batchManager.getBatchDetails(batchId)

// Enroll student in batch
await batchManager.enrollStudent(studentId, batchId)
```

## Migration Scripts

### For Existing Students
```bash
# Migrate existing students
node migrate_student_ids.js

# Test the system
node migrate_student_ids.js --test

# Show help
node migrate_student_ids.js --help
```

### Test System
```bash
# Run comprehensive tests
node test_student_id_system.js
```

## Frontend Integration

### Student Registration Form
- Updated to show generated student ID upon successful registration
- Displays student ID in console for easy copying

### Student Profile
- Shows student ID prominently in profile card
- Highlighted with special styling for easy identification

### Example Frontend Usage
```javascript
// After successful registration
if (response.success && response.student_id) {
  setNotificationMessage(
    `Student registered successfully!\nStudent ID: ${response.student_id}\n\nPlease save this ID for future reference.`
  );
  console.log(`🎓 New Student ID: ${response.student_id}`);
}
```

## Configuration

### Institute Prefix
Change in `src/services/studentIdGenerator.js`:
```javascript
this.institutePrefix = 'MP'; // Change this for different institutes
```

### Course Codes
Course codes are taken from the `courseId` field in the `courses` table.
Format: `MP-PST` becomes `PST` in student ID.

## Examples

### Student ID Generation Flow

1. **Student registers for "Personal Survival Techniques" course**
2. **System looks up course code**: `MP-PST`
3. **Determines year**: 2025 → `25`
4. **Gets batch number**: First batch of 2025 → `1`
5. **Gets next sequence**: First student → `001`
6. **Generates ID**: `MP-PST25.1-001`

### Multiple Students Same Course
- Student 1: `MP-PST25.1-001`
- Student 2: `MP-PST25.1-002`
- Student 3: `MP-PST25.1-003`

### Different Courses
- PST Student: `MP-PST25.1-001`
- STCW Student: `MP-STCW25.1-001`
- Fire Fighting: `MP-FF25.1-001`

### Multiple Batches
- Batch 1: `MP-PST25.1-001`, `MP-PST25.1-002`
- Batch 2: `MP-PST25.2-001`, `MP-PST25.2-002`

## Error Handling

### Common Issues
1. **Course not found**: Check course ID exists
2. **Duplicate generation**: Atomic operations prevent this
3. **Invalid format**: Use validation functions
4. **Missing sequence**: Auto-created on first use

### Troubleshooting
```bash
# Check database structure
node test_student_id_system.js

# Verify specific course
SELECT * FROM courses WHERE id = ?;

# Check sequence table
SELECT * FROM student_id_sequences WHERE course_id = ?;

# View generated IDs
SELECT student_id, full_name FROM students WHERE student_id IS NOT NULL;
```

## Security & Performance

### Thread Safety
- Uses atomic database operations
- Handles concurrent registrations
- Race condition protection

### Performance
- Indexed student_id column
- Optimized sequence queries
- Minimal database calls

### Validation
- Format validation on all IDs
- Course existence checks
- Batch capacity validation

## Monitoring

### Statistics Available
- Total students per course
- Students per batch
- ID generation trends
- Course enrollment numbers

### Admin Dashboard Integration
Use `/api/student-ids/stats` endpoint to display:
- Current sequence numbers
- Students enrolled per batch
- Course popularity metrics

## Backup & Recovery

### Important Data
- `student_id_sequences` table
- `students.student_id` column
- Course and batch mappings

### Recovery Process
1. Restore database from backup
2. Run migration script for any missing IDs
3. Verify sequence integrity
4. Test ID generation

## Support

### Testing Commands
```bash
# Test ID generation
curl -X POST http://localhost:5003/api/student-ids/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"course_id": 1}'

# Validate ID format
curl -X POST http://localhost:5003/api/student-ids/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"student_id": "MP-PST25.1-001"}'

# Search student
curl http://localhost:5003/api/student-ids/search/MP-PST25.1-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Logs
Student ID generation events are logged with timestamps and details for audit purposes.

---

**Implementation Date**: January 2025  
**Version**: 1.0  
**Last Updated**: [Current Date] 