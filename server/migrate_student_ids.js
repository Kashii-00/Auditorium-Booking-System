const db = require('./src/db');
const studentIdGenerator = require('./src/services/studentIdGenerator');

async function migrateExistingStudents() {
  try {
    console.log('🚀 Starting student ID migration...');
    
    // Get all students without student_id
    const studentsQuery = `
      SELECT s.id, s.full_name, sc.course_id, sc.enrollment_date
      FROM students s
      JOIN student_courses sc ON s.id = sc.student_id
      WHERE s.student_id IS NULL AND sc.primary_course = 1
      ORDER BY sc.enrollment_date ASC
    `;
    
    const students = await db.queryPromise(studentsQuery);
    console.log(`📋 Found ${students.length} students to migrate`);
    
    if (students.length === 0) {
      console.log('✅ No students need migration. All students already have student IDs.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    
    for (const student of students) {
      try {
        // Get enrollment year
        const enrollmentYear = new Date(student.enrollment_date).getFullYear();
        
        // Generate student ID
        const studentId = await studentIdGenerator.generateStudentId(
          student.course_id, 
          null, 
          enrollmentYear
        );
        
        // Update student record
        await db.queryPromise(
          'UPDATE students SET student_id = ? WHERE id = ?',
          [studentId, student.id]
        );
        
        console.log(`✅ ${student.full_name}: ${studentId}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating student ${student.full_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${successCount} students`);
    console.log(`❌ Failed migrations: ${errorCount} students`);
    console.log(`📈 Total processed: ${successCount + errorCount} students`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please check the failed students above.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    console.log('\n🔚 Exiting migration script...');
    process.exit(0);
  }
}

// Test function to verify student ID generation
async function testStudentIdGeneration() {
  try {
    console.log('🧪 Testing student ID generation...');
    
    // Get first active course
    const courseQuery = `SELECT id, courseId, courseName FROM courses WHERE status = 'Active' LIMIT 1`;
    const courseResult = await db.queryPromise(courseQuery);
    
    if (courseResult.length === 0) {
      console.log('❌ No active courses found for testing');
      return;
    }
    
    const course = courseResult[0];
    console.log(`📚 Testing with course: ${course.courseName} (${course.courseId})`);
    
    // Generate a test student ID
    const testStudentId = await studentIdGenerator.generateStudentId(course.id);
    console.log(`🆔 Generated test student ID: ${testStudentId}`);
    
    // Validate the format
    const isValid = studentIdGenerator.validateStudentId(testStudentId);
    console.log(`✅ Student ID format valid: ${isValid}`);
    
    // Parse the student ID
    const parsed = studentIdGenerator.parseStudentId(testStudentId);
    console.log(`📝 Parsed components:`, parsed);
    
    console.log('✅ Student ID generation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testStudentIdGeneration();
  } else if (args.includes('--help')) {
    console.log(`
🎓 Student ID Migration Script

Usage:
  node migrate_student_ids.js          - Run migration for existing students
  node migrate_student_ids.js --test   - Test student ID generation
  node migrate_student_ids.js --help   - Show this help message

Description:
  This script generates student IDs for existing students who don't have them yet.
  Student IDs follow the format: MP-PST25.1-001 where:
  - MP: Institute prefix
  - PST: Course code  
  - 25: Year (2025)
  - 1: Batch number
  - 001: Sequential student number

Prerequisites:
  - Database migrations must be run first
  - student_id_sequences table must exist
  - students table must have student_id column
    `);
  } else {
    await migrateExistingStudents();
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main(); 