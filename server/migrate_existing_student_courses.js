const db = require('./src/db');
const studentIdGenerator = require('./src/services/studentIdGenerator');

/**
 * Migrate existing student_courses records to generate student codes
 */
async function migrateExistingStudentCourses() {
  console.log('🔄 Starting migration of existing student_courses records...');
  
  try {
    // Get all student_courses records that don't have student_code yet
    const query = `
      SELECT 
        sc.id,
        sc.student_id,
        sc.course_id,
        sc.primary_course,
        c.courseName,
        c.courseId as course_code,
        s.full_name,
        s.email
      FROM student_courses sc
      INNER JOIN students s ON sc.student_id = s.id
      INNER JOIN courses c ON sc.course_id = c.id
      WHERE sc.student_code IS NULL OR sc.student_code = ''
      ORDER BY sc.student_id, sc.primary_course DESC, sc.enrollment_date ASC
    `;
    
    const records = await db.queryPromise(query);
    console.log(`📊 Found ${records.length} student course enrollments to migrate`);
    
    if (records.length === 0) {
      console.log('✅ No records need migration - all courses already have student codes');
      return;
    }
    
    let migrated = 0;
    let errors = 0;
    
    for (const record of records) {
      try {
        // Generate student code for this course enrollment
        const studentCode = await studentIdGenerator.generateStudentCode(record.course_id);
        
        // Update the student_courses record
        const updateQuery = `
          UPDATE student_courses 
          SET student_code = ?
          WHERE id = ?
        `;
        
        await db.queryPromise(updateQuery, [studentCode, record.id]);
        
        console.log(`✅ Generated code ${studentCode} for ${record.full_name} (${record.email}) in ${record.courseName}`);
        migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating record ID ${record.id} for ${record.full_name}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📈 Migration completed:`);
    console.log(`   ✅ Successfully migrated: ${migrated} records`);
    console.log(`   ❌ Errors: ${errors} records`);
    
    if (errors === 0) {
      console.log(`🎉 All student course enrollments migrated successfully!`);
    } else {
      console.log(`⚠️  Migration completed with ${errors} errors. Please review the error logs above.`);
    }
    
    // Show summary of generated codes
    if (migrated > 0) {
      console.log('\n📋 Summary of generated student codes:');
      const summaryQuery = `
        SELECT 
          c.courseName,
          c.courseId,
          COUNT(sc.id) as students_with_codes
        FROM student_courses sc
        INNER JOIN courses c ON sc.course_id = c.id
        WHERE sc.student_code IS NOT NULL AND sc.student_code != ''
        GROUP BY c.id, c.courseName, c.courseId
        ORDER BY c.courseName
      `;
      
      const summary = await db.queryPromise(summaryQuery);
      summary.forEach(row => {
        console.log(`   📚 ${row.courseName} (${row.courseId}): ${row.students_with_codes} students`);
      });
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration results...');
    
    // Check for any student_courses without codes
    const missingQuery = `
      SELECT COUNT(*) as missing_count
      FROM student_courses 
      WHERE student_code IS NULL OR student_code = ''
    `;
    
    const [{ missing_count }] = await db.queryPromise(missingQuery);
    
    if (missing_count > 0) {
      console.log(`⚠️  Found ${missing_count} student course enrollments still missing codes`);
    } else {
      console.log(`✅ All student course enrollments have codes assigned`);
    }
    
    // Check for duplicate codes
    const duplicateQuery = `
      SELECT student_code, COUNT(*) as count
      FROM student_courses 
      WHERE student_code IS NOT NULL AND student_code != ''
      GROUP BY student_code
      HAVING COUNT(*) > 1
    `;
    
    const duplicates = await db.queryPromise(duplicateQuery);
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate student codes:`);
      duplicates.forEach(dup => {
        console.log(`   🔄 Code ${dup.student_code} appears ${dup.count} times`);
      });
    } else {
      console.log(`✅ All student codes are unique`);
    }
    
    // Show total summary
    const totalQuery = `
      SELECT 
        COUNT(DISTINCT sc.student_id) as total_students,
        COUNT(sc.id) as total_enrollments,
        COUNT(CASE WHEN sc.student_code IS NOT NULL THEN 1 END) as enrollments_with_codes
      FROM student_courses sc
    `;
    
    const [totals] = await db.queryPromise(totalQuery);
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   👥 Total Students: ${totals.total_students}`);
    console.log(`   📚 Total Course Enrollments: ${totals.total_enrollments}`);
    console.log(`   🏷️  Enrollments with Codes: ${totals.enrollments_with_codes}`);
    
  } catch (error) {
    console.error('Error verifying migration:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingStudentCourses()
    .then(() => verifyMigration())
    .then(() => {
      console.log('\n🎯 Migration and verification completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateExistingStudentCourses, verifyMigration }; 