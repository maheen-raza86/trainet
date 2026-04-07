/**
 * Test Endpoint Structure and Validation
 * Tests endpoints without authentication to verify they exist and validate properly
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const symbol = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${name} – ${passed ? 'PASS' : 'FAIL'}`, color);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
}

async function testCreateCourseEndpoint() {
  try {
    log('\n🧪 Testing: POST /api/courses (without auth)', 'blue');
    
    const response = await axios.post(`${BASE_URL}/courses`, {
      title: 'Test Course',
      description: 'Test Description'
    });
    
    logTest('Create Course Endpoint', false, 'Should have rejected without auth');
    return false;
  } catch (error) {
    const passed = error.response?.status === 401;
    const details = passed 
      ? 'Correctly requires authentication'
      : `Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`;
    
    logTest('Create Course Endpoint', passed, details);
    return passed;
  }
}

async function testCreateCourseValidation() {
  try {
    log('\n🧪 Testing: POST /api/courses validation (short title)', 'blue');
    
    const response = await axios.post(`${BASE_URL}/courses`, {
      title: 'AB', // Too short
      description: 'Valid description that is long enough'
    });
    
    logTest('Create Course Validation', false, 'Should have rejected short title');
    return false;
  } catch (error) {
    const passed = error.response?.status === 401; // Should hit auth first
    const details = passed 
      ? 'Authentication check works (validation would be next)'
      : `Status: ${error.response?.status}`;
    
    logTest('Create Course Validation', passed, details);
    return passed;
  }
}

async function testGradeSubmissionEndpoint() {
  try {
    log('\n🧪 Testing: PUT /api/submissions/:id/grade (without auth)', 'blue');
    
    const response = await axios.put(`${BASE_URL}/submissions/test-id/grade`, {
      grade: 85,
      feedback: 'Good work on this assignment'
    });
    
    logTest('Grade Submission Endpoint', false, 'Should have rejected without auth');
    return false;
  } catch (error) {
    const passed = error.response?.status === 401;
    const details = passed 
      ? 'Correctly requires authentication'
      : `Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`;
    
    logTest('Grade Submission Endpoint', passed, details);
    return passed;
  }
}

async function testEditAssignmentEndpoint() {
  try {
    log('\n🧪 Testing: PUT /api/assignments/:id (checking if implemented)', 'blue');
    
    const response = await axios.put(`${BASE_URL}/assignments/test-id`, {
      title: 'Updated Assignment'
    });
    
    logTest('Edit Assignment Endpoint', false, 'Should have rejected without auth');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Edit Assignment Endpoint', true, 'Endpoint exists and requires auth');
      return true;
    } else if (error.response?.status === 404) {
      logTest('Edit Assignment Endpoint', false, 'Endpoint not implemented yet');
      return false;
    } else {
      logTest('Edit Assignment Endpoint', false, `Unexpected error: ${error.response?.status}`);
      return false;
    }
  }
}

async function testExistingEndpoints() {
  try {
    log('\n🧪 Testing: Existing endpoints still work', 'blue');
    
    // Test GET courses (public)
    const coursesResponse = await axios.get(`${BASE_URL}/courses`);
    const coursesWork = coursesResponse.status === 200 && coursesResponse.data.success;
    
    // Test POST assignments (should require auth)
    let assignmentsWork = false;
    try {
      await axios.post(`${BASE_URL}/assignments`, {});
    } catch (error) {
      assignmentsWork = error.response?.status === 401;
    }
    
    logTest('GET /api/courses', coursesWork, coursesWork ? `Found ${coursesResponse.data.data.count} courses` : 'Failed');
    logTest('POST /api/assignments', assignmentsWork, assignmentsWork ? 'Correctly requires auth' : 'Unexpected behavior');
    
    return coursesWork && assignmentsWork;
  } catch (error) {
    logTest('Existing Endpoints', false, error.message);
    return false;
  }
}

async function runStructureTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║        TRAINET Backend - Endpoint Structure Test      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const results = {
    passed: 0,
    failed: 0,
  };

  const tests = [
    { name: 'Create Course Endpoint', fn: testCreateCourseEndpoint },
    { name: 'Create Course Validation', fn: testCreateCourseValidation },
    { name: 'Grade Submission Endpoint', fn: testGradeSubmissionEndpoint },
    { name: 'Edit Assignment Endpoint', fn: testEditAssignmentEndpoint },
    { name: 'Existing Endpoints', fn: testExistingEndpoints },
  ];

  for (const test of tests) {
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║                    TEST SUMMARY                        ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTotal Tests: ${results.passed + results.failed}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.failed === 0) {
    log('\n🎉 All endpoint structure tests passed!', 'green');
    log('✅ CREATE COURSE endpoint: Implemented and secured', 'green');
    log('✅ GRADE SUBMISSION endpoint: Implemented and secured', 'green');
    log('⚠️  EDIT ASSIGNMENT endpoint: May need implementation', 'yellow');
  } else {
    log('\n⚠️  Some tests failed. Check implementation.', 'red');
  }
  
  log('\n📝 Next Steps:', 'blue');
  log('1. Wait for rate limit to reset (usually 15 minutes)', 'yellow');
  log('2. Create test users using create-test-users.js', 'yellow');
  log('3. Run full authentication tests with test-trainer-endpoints.js', 'yellow');
  log('4. Or use manual curl commands from test-manual-curl.md', 'yellow');
}

runStructureTests().catch((error) => {
  log('\n❌ Test suite failed with error:', 'red');
  console.error(error);
  process.exit(1);
});