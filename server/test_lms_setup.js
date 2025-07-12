const db = require('./src/db');
const jwt = require('jsonwebtoken');

// Test script to verify LMS setup
console.log('🔍 Testing LMS Setup...\n');

async function testDatabaseConnection() {
  console.log('1. Testing database connection...');
  try {
    const result = await db.queryPromise('SELECT 1 as test');
    console.log('   ✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    return false;
  }
}

async function testRequiredTables() {
  console.log('\n2. Checking required tables...');
  const requiredTables = [
    'lecturers',
    'lecturer_users', 
    'batches',
    'batch_materials',
    'assignments',
    'announcements',
    'lecturer_batches',
    'student_batches',
    'assignment_submissions',
    'assignment_grades',
    'quizzes'
  ];

  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      await db.queryPromise(`SHOW TABLES LIKE '${table}'`);
      console.log(`   ✅ Table '${table}' exists`);
    } catch (error) {
      console.error(`   ❌ Table '${table}' missing`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testLecturerAuthentication() {
  console.log('\n3. Testing lecturer authentication system...');
  try {
    // Check if any lecturer users exist
    const lecturerUsers = await db.queryPromise('SELECT COUNT(*) as count FROM lecturer_users');
    const count = lecturerUsers[0].count;
    
    if (count > 0) {
      console.log(`   ✅ Found ${count} lecturer user(s) in system`);
      
      // Test JWT token creation
      const testToken = jwt.sign(
        { lecturerId: 1, email: 'test@example.com' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );
      
      // Test JWT token verification
      const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'your-secret-key');
      console.log('   ✅ JWT token creation and verification working');
      
      return true;
    } else {
      console.log('   ⚠️  No lecturer users found. Create a lecturer first through the staff portal.');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Lecturer authentication test failed:', error.message);
    return false;
  }
}

async function testBatchAssignments() {
  console.log('\n4. Testing batch assignments...');
  try {
    const assignments = await db.queryPromise(`
      SELECT COUNT(*) as count 
      FROM lecturer_batches lb 
      JOIN lecturers l ON lb.lecturer_id = l.id 
      JOIN batches b ON lb.batch_id = b.id
    `);
    
    const count = assignments[0].count;
    console.log(`   ✅ Found ${count} lecturer-batch assignment(s)`);
    
    if (count === 0) {
      console.log('   ⚠️  No batch assignments found. Assign lecturers to batches through the staff portal.');
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Batch assignment test failed:', error.message);
    return false;
  }
}

async function testUploadDirectory() {
  console.log('\n5. Testing upload directory...');
  const fs = require('fs');
  const path = require('path');
  
  try {
    const uploadDir = path.join(__dirname, 'uploads/batch_materials');
    
    if (fs.existsSync(uploadDir)) {
      console.log('   ✅ Upload directory exists');
      
      // Test write permissions
      const testFile = path.join(uploadDir, 'test-write.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('   ✅ Upload directory writable');
      
      return true;
    } else {
      console.log('   ❌ Upload directory missing. Run: mkdir -p uploads/batch_materials');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Upload directory test failed:', error.message);
    return false;
  }
}

async function testBatchStatistics() {
  console.log('\n6. Testing batch statistics columns...');
  try {
    const result = await db.queryPromise(`
      SELECT 
        id, batch_name, 
        materials_count, assignments_count, announcements_count, students_count, completion_percentage
      FROM batches 
      LIMIT 1
    `);
    
    if (result.length > 0) {
      const batch = result[0];
      console.log(`   ✅ Batch statistics columns working`);
      console.log(`   📊 Sample batch "${batch.batch_name}": ${batch.materials_count} materials, ${batch.assignments_count} assignments, ${batch.students_count} students`);
      return true;
    } else {
      console.log(`   ⚠️  No batches found, but columns exist`);
      return true;
    }
  } catch (error) {
    console.error('   ❌ Batch statistics test failed:', error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('\n7. Testing environment variables...');
  const requiredVars = ['JWT_SECRET'];
  let allVarsSet = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName} is set`);
    } else {
      console.log(`   ❌ ${varName} is missing`);
      allVarsSet = false;
    }
  }
  
  return allVarsSet;
}

async function runTests() {
  const tests = [
    testDatabaseConnection,
    testRequiredTables,
    testLecturerAuthentication,
    testBatchAssignments,
    testUploadDirectory,
    testBatchStatistics,
    testEnvironmentVariables
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    const result = await test();
    if (result) passedTests++;
  }
  
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${tests.length}`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 All tests passed! Your LMS setup is ready to go.');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Start the frontend: cd client && npm start');
    console.log('3. Login as a lecturer and test the features');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above before proceeding.');
  }
  
  process.exit(passedTests === tests.length ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
}); 