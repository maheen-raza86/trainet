/**
 * TRAINET Bug Fixes Verification Test
 * Tests all 4 bug fixes to ensure they work correctly
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const TRAINER_CREDS = {
  email: 'trainer@example.com',
  password: 'password123'
};

const STUDENT_CREDS = {
  email: 'student@example.com',
  password: 'password123'
};

let trainerToken = null;
let studentToken = null;
let trainerUserId = null;
let studentUserId = null;
let testOfferingId = null;

// Helper function to make authenticated requests
const authRequest = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.yellow}═══ ${msg} ═══${colors.reset}\n`)
};

// Test 1: Login and verify role consistency (Bug 3)
async function testRoleConsistency() {
  log.section('TEST 1: Role Consistency (Bug 3)');
  
  try {
    // Login as trainer
    const trainerLogin = await axios.post(`${API_BASE}/auth/login`, TRAINER_CREDS);
    trainerToken = trainerLogin.data.token;
    trainerUserId = trainerLogin.data.user.id;
    
    if (trainerLogin.data.user.role === 'trainer') {
      log.success('Trainer login: Role is correctly "trainer"');
    } else {
      log.error(`Trainer login: Role is "${trainerLogin.data.user.role}" instead of "trainer"`);
      return false;
    }
    
    // Verify trainer profile
    const trainerProfile = await axios.get(
      `${API_BASE}/users/profile`,
      authRequest(trainerToken)
    );
    
    if (trainerProfile.data.role === 'trainer') {
      log.success('Trainer profile fetch: Role remains "trainer"');
    } else {
      log.error(`Trainer profile fetch: Role changed to "${trainerProfile.data.role}"`);
      return false;
    }
    
    // Login as student
    const studentLogin = await axios.post(`${API_BASE}/auth/login`, STUDENT_CREDS);
    studentToken = studentLogin.data.token;
    studentUserId = studentLogin.data.user.id;
    
    if (studentLogin.data.user.role === 'student') {
      log.success('Student login: Role is correctly "student"');
    } else {
      log.error(`Student login: Role is "${studentLogin.data.user.role}" instead of "student"`);
      return false;
    }
    
    // Verify student profile
    const studentProfile = await axios.get(
      `${API_BASE}/users/profile`,
      authRequest(studentToken)
    );
    
    if (studentProfile.data.role === 'student') {
      log.success('Student profile fetch: Role remains "student"');
    } else {
      log.error(`Student profile fetch: Role changed to "${studentProfile.data.role}"`);
      return false;
    }
    
    log.success('TEST 1 PASSED: Roles are consistent across login and profile fetches');
    return true;
    
  } catch (error) {
    log.error(`TEST 1 FAILED: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Test 2: Profile update reflects in response (Bug 2)
async function testProfileUpdate() {
  log.section('TEST 2: Profile Update Reflection (Bug 2)');
  
  try {
    // Get current trainer profile
    const currentProfile = await axios.get(
      `${API_BASE}/users/profile`,
      authRequest(trainerToken)
    );
    
    const originalLastName = currentProfile.data.last_name;
    log.info(`Current last name: "${originalLastName}"`);
    
    // Update profile with new last name
    const newLastName = `TestName${Date.now()}`;
    const updateResponse = await axios.put(
      `${API_BASE}/users/profile`,
      { last_name: newLastName },
      authRequest(trainerToken)
    );
    
    if (updateResponse.data.last_name === newLastName) {
      log.success(`Profile update response contains new last name: "${newLastName}"`);
    } else {
      log.error(`Profile update response has wrong last name: "${updateResponse.data.last_name}"`);
      return false;
    }
    
    // Fetch profile again to verify persistence
    const updatedProfile = await axios.get(
      `${API_BASE}/users/profile`,
      authRequest(trainerToken)
    );
    
    if (updatedProfile.data.last_name === newLastName) {
      log.success(`Profile fetch after update shows new last name: "${newLastName}"`);
    } else {
      log.error(`Profile fetch shows old last name: "${updatedProfile.data.last_name}"`);
      return false;
    }
    
    // Restore original last name
    await axios.put(
      `${API_BASE}/users/profile`,
      { last_name: originalLastName },
      authRequest(trainerToken)
    );
    log.info(`Restored original last name: "${originalLastName}"`);
    
    log.success('TEST 2 PASSED: Profile updates are immediately reflected');
    return true;
    
  } catch (error) {
    log.error(`TEST 2 FAILED: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Test 3: Create course offering (Bug 1 - backend verification)
async function testCreateOffering() {
  log.section('TEST 3: Create Course Offering (Bug 1 Backend)');
  
  try {
    // Get available courses
    const coursesResponse = await axios.get(
      `${API_BASE}/courses`,
      authRequest(trainerToken)
    );
    
    if (coursesResponse.data.length === 0) {
      log.error('No courses available to create offering');
      return false;
    }
    
    const courseId = coursesResponse.data[0].id;
    log.info(`Using course ID: ${courseId}`);
    
    // Create a new course offering
    const offeringData = {
      course_id: courseId,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_students: 30
    };
    
    const createResponse = await axios.post(
      `${API_BASE}/course-offerings`,
      offeringData,
      authRequest(trainerToken)
    );
    
    testOfferingId = createResponse.data.id;
    
    if (createResponse.data.id && createResponse.data.course_id === courseId) {
      log.success(`Course offering created successfully with ID: ${testOfferingId}`);
    } else {
      log.error('Course offering creation response is invalid');
      return false;
    }
    
    // Verify offering appears in trainer's offerings
    const trainerOfferings = await axios.get(
      `${API_BASE}/course-offerings/trainer`,
      authRequest(trainerToken)
    );
    
    const foundOffering = trainerOfferings.data.find(o => o.id === testOfferingId);
    
    if (foundOffering) {
      log.success('Created offering appears in trainer\'s offerings list');
    } else {
      log.error('Created offering NOT found in trainer\'s offerings list');
      return false;
    }
    
    log.success('TEST 3 PASSED: Course offering creation works correctly');
    return true;
    
  } catch (error) {
    log.error(`TEST 3 FAILED: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Test 4: Assignment service method correctness (Bug 4)
async function testAssignmentService() {
  log.section('TEST 4: Assignment Service Method (Bug 4)');
  
  try {
    if (!testOfferingId) {
      log.error('No test offering ID available (Test 3 must run first)');
      return false;
    }
    
    // Create an assignment for the offering
    const assignmentData = {
      course_offering_id: testOfferingId,
      title: `Test Assignment ${Date.now()}`,
      description: 'Test assignment for bug fix verification',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_score: 100
    };
    
    const createResponse = await axios.post(
      `${API_BASE}/assignments`,
      assignmentData,
      authRequest(trainerToken)
    );
    
    const assignmentId = createResponse.data.id;
    
    if (assignmentId) {
      log.success(`Assignment created with ID: ${assignmentId}`);
    } else {
      log.error('Assignment creation failed');
      return false;
    }
    
    // Test the getAssignmentsByOffering endpoint (Bug 4 fix)
    const offeringAssignments = await axios.get(
      `${API_BASE}/assignments/course-offering/${testOfferingId}`,
      authRequest(trainerToken)
    );
    
    if (Array.isArray(offeringAssignments.data)) {
      log.success('getAssignmentsByOffering endpoint returns array');
    } else {
      log.error('getAssignmentsByOffering endpoint does not return array');
      return false;
    }
    
    const foundAssignment = offeringAssignments.data.find(a => a.id === assignmentId);
    
    if (foundAssignment) {
      log.success('Created assignment found in offering assignments');
    } else {
      log.error('Created assignment NOT found in offering assignments');
      return false;
    }
    
    if (foundAssignment.course_offering_id === testOfferingId) {
      log.success('Assignment has correct course_offering_id');
    } else {
      log.error(`Assignment has wrong course_offering_id: ${foundAssignment.course_offering_id}`);
      return false;
    }
    
    log.success('TEST 4 PASSED: Assignment service method works correctly');
    return true;
    
  } catch (error) {
    log.error(`TEST 4 FAILED: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('TRAINET BUG FIXES VERIFICATION TEST SUITE');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false
  };
  
  // Run tests sequentially
  results.test1 = await testRoleConsistency();
  results.test2 = await testProfileUpdate();
  results.test3 = await testCreateOffering();
  results.test4 = await testAssignmentService();
  
  // Summary
  log.section('TEST SUMMARY');
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  console.log(`Test 1 (Role Consistency):        ${results.test1 ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Test 2 (Profile Update):          ${results.test2 ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Test 3 (Create Offering):         ${results.test3 ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Test 4 (Assignment Service):      ${results.test4 ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${passed}/${total} tests passed`);
  console.log('='.repeat(60) + '\n');
  
  if (passed === total) {
    log.success('ALL TESTS PASSED! All bug fixes are working correctly.');
    process.exit(0);
  } else {
    log.error(`${total - passed} test(s) failed. Please review the output above.`);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
