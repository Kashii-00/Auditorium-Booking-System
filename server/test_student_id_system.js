const db = require('./src/db');
const studentIdGenerator = require('./src/services/studentIdGenerator');
const batchManager = require('./src/services/batchManager');

async function runTests() {
  console.log('🚀 Starting Student ID System Tests...\n');

  try {
    // Test 1: Validate database structure
    console.log('📋 Test 1: Database Structure Validation');
    await testDatabaseStructure();
    console.log('✅ Database structure test passed\n');

    // Test 2: Student ID generation
    console.log('🆔 Test 2: Student ID Generation');
    await testStudentIdGeneration();
    console.log('✅ Student ID generation test passed\n');

    // Test 3: Batch creation
    console.log('📚 Test 3: Batch Creation');
    await testBatchCreation();
    console.log('✅ Batch creation test passed\n');

    // Test 4: Sequential student ID generation
    console.log('🔢 Test 4: Sequential Student IDs');
    await testSequentialGeneration();
    console.log('✅ Sequential generation test passed\n');

    // Test 5: Student ID validation
    console.log('✔️ Test 5: Student ID Validation');
    await testStudentIdValidation();
    console.log('✅ Student ID validation test passed\n');

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    console.log('\n🔚 Closing database connection...');
    process.exit(0);
  }
}

async function testDatabaseStructure() {
  // Check if student_id column exists in students table
  const columnQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'student_id'
  `;
  
  const columns = await db.queryPromise(columnQuery);
  if (columns.length === 0) {
    throw new Error('student_id column not found in students table');
  }
  console.log('  ✓ student_id column exists in students table');

  // Check if student_id_sequences table exists
  const tableQuery = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = 'student_id_sequences'
  `;
  
  const tables = await db.queryPromise(tableQuery);
  if (tables.length === 0) {
    throw new Error('student_id_sequences table not found');
  }
  console.log('  ✓ student_id_sequences table exists');
}

async function testStudentIdGeneration() {
  // Get a test course
  const courseQuery = `SELECT id, courseId, courseName FROM courses WHERE status = 'Active' LIMIT 1`;
  const courses = await db.queryPromise(courseQuery);
  
  if (courses.length === 0) {
    throw new Error('No active courses found for testing');
  }
  
  const course = courses[0];
  console.log(`  📚 Testing with course: ${course.courseName} (${course.courseId})`);
  
  // Generate a student ID
  const studentId = await studentIdGenerator.generateStudentId(course.id);
  console.log(`  🆔 Generated student ID: ${studentId}`);
  
  // Validate format
  const isValid = studentIdGenerator.validateStudentId(studentId);
  if (!isValid) {
    throw new Error(`Generated student ID has invalid format: ${studentId}`);
  }
  console.log('  ✓ Student ID format is valid');
  
  // Parse components
  const parsed = studentIdGenerator.parseStudentId(studentId);
  console.log(`  📝 Parsed components:`, parsed);
  
  // Verify course code matches
  const expectedCourseCode = course.courseId.replace('MP-', '');
  if (parsed.courseCode !== expectedCourseCode) {
    throw new Error(`Course code mismatch: expected ${expectedCourseCode}, got ${parsed.courseCode}`);
  }
  console.log('  ✓ Course code matches');
}

async function testBatchCreation() {
  // Get a test course
  const courseQuery = `SELECT id, courseId, courseName FROM courses WHERE status = 'Active' LIMIT 1`;
  const courses = await db.queryPromise(courseQuery);
  
  const course = courses[0];
  
  // Create a test batch
  const batchData = {
    batch_name: `Test Batch ${Date.now()}`,
    start_date: '2025-02-01',
    end_date: '2025-03-01',
    capacity: 30,
    location: 'Test Location',
    description: 'Test batch for student ID system',
    year: 2025
  };
  
  const result = await batchManager.createBatch(course.id, batchData);
  console.log(`  📊 Created batch: ${result.batch_code} (ID: ${result.id})`);
  
  // Verify batch details
  const batchDetails = await batchManager.getBatchDetails(result.id);
  if (!batchDetails) {
    throw new Error('Failed to retrieve created batch details');
  }
  console.log('  ✓ Batch created and retrieved successfully');
  
  // Clean up test batch
  await db.queryPromise('DELETE FROM batches WHERE id = ?', [result.id]);
  console.log('  🧹 Test batch cleaned up');
}

async function testSequentialGeneration() {
  // Get a test course
  const courseQuery = `SELECT id, courseId, courseName FROM courses WHERE status = 'Active' LIMIT 1`;
  const courses = await db.queryPromise(courseQuery);
  
  const course = courses[0];
  
  // Generate multiple student IDs to test sequencing
  const studentIds = [];
  for (let i = 0; i < 3; i++) {
    const studentId = await studentIdGenerator.generateStudentId(course.id);
    studentIds.push(studentId);
    console.log(`  🔢 Generated ID ${i + 1}: ${studentId}`);
  }
  
  // Verify they are sequential
  for (let i = 1; i < studentIds.length; i++) {
    const parsed1 = studentIdGenerator.parseStudentId(studentIds[i - 1]);
    const parsed2 = studentIdGenerator.parseStudentId(studentIds[i]);
    
    if (parsed2.sequence !== parsed1.sequence + 1) {
      throw new Error(`Non-sequential student IDs: ${parsed1.sequence} -> ${parsed2.sequence}`);
    }
  }
  console.log('  ✓ Student IDs are sequential');
}

async function testStudentIdValidation() {
  const testCases = [
    { id: 'MP-PST25.1-001', valid: true, description: 'Valid student ID' },
    { id: 'MP-STCW25.2-042', valid: true, description: 'Valid student ID with different course' },
    { id: 'MP-PST251-001', valid: false, description: 'Invalid format (missing dot)' },
    { id: 'PST25.1-001', valid: false, description: 'Missing institute prefix' },
    { id: 'MP-PST25.1-1', valid: false, description: 'Invalid sequence format' },
    { id: 'MP-PST25.1-ABC', valid: false, description: 'Non-numeric sequence' },
  ];
  
  for (const testCase of testCases) {
    const isValid = studentIdGenerator.validateStudentId(testCase.id);
    if (isValid !== testCase.valid) {
      throw new Error(`Validation failed for ${testCase.description}: expected ${testCase.valid}, got ${isValid}`);
    }
    console.log(`  ${testCase.valid ? '✓' : '✗'} ${testCase.description}: ${testCase.id}`);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 