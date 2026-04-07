/**
 * TRAINET Backend - Trainer Endpoints Test Script
 * Tests the complete trainer workflow end-to-end
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
let trainerToken = '';
let studentToken = '';
let courseId = '';
let assignmentId = '';
let submissionId = '';

// ANSI color codes for output
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

async function loginTrainer() {
  try {
    log('\n📝 Logging in as trainer...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'trainer@test.com',
      password: 'password123',
    });

    if (response.data.success && response.data.data.accessToken) {
      trainerToken = response.data.data.accessToken;
      log('✓ Trainer login successful', 'green');
      return true;
    }
    return false;
  } catch (error) {
    log('✗ Trainer login failed', 'red');
    if (error.response) {
      log(`  Error: ${error.response.data.message}`, 'yellow');
    }
    return false;
  }
}

async function loginStudent() {
  try {
    log('\n📝 Logging in as student...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student@test.com',
      password: 'password123',
    });

    if (response.data.success && response.data.data.accessToken) {
      studentToken = response.data.data.accessToken;
      log('✓ Student login successful', 'green');
      return true;
    }
    return false;
  } catch (error) {
    log('✗ Student login failed', 'red');
    if (error.response) {
      log(`  Error: ${error.response.data.message}`, 'yellow');
    }
    return false;
  }
}

async function testCreateCourse() {
  try {
    log('\n🧪 Testing: Create Course (POST /api/courses)', 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/courses`,
      {
        title: 'Linux Security Fundamentals',
        description: 'Learn Linux system hardening techniques and best practices',
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );

    const passed =
      response.status === 201 &&
      response.data.success === true &&
      response.data.data.id &&
      response.data.data.title === 'Linux Security Fundamentals';

    if (passed) {
      courseId = response.data.data.id;
      logTest('Create Course', true, `Course ID: ${courseId}`);
    } else {
      logTest('Create Course', false, 'Response validation failed');
    }

    return passed;
  } catch (error) {
    logTest('Create Course', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetAllCourses() {
  try {
    log('\n🧪 Testing: Get All Courses (GET /api/courses)', 'blue');
    
    const response = await axios.get(`${BASE_URL}/courses`);

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      Array.isArray(response.data.data.courses) &&
      response.data.data.courses.some((c) => c.id === courseId);

    if (passed) {
      logTest('Get All Courses', true, `Found ${response.data.data.count} courses`);
    } else {
      logTest('Get All Courses', false, 'Course not found in list');
    }

    return passed;
  } catch (error) {
    logTest('Get All Courses', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateAssignment() {
  try {
    log('\n🧪 Testing: Create Assignment (POST /api/courses/:courseId/assignments)', 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/courses/${courseId}/assignments`,
      {
        title: 'Linux Hardening Task',
        description: 'Secure an Ubuntu server following best practices',
        dueDate: '2026-05-01T23:59:59Z',
        maxScore: 100,
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );

    const passed =
      response.status === 201 &&
      response.data.success === true &&
      response.data.data.id &&
      response.data.data.course_id === courseId;

    if (passed) {
      assignmentId = response.data.data.id;
      logTest('Create Assignment', true, `Assignment ID: ${assignmentId}`);
    } else {
      logTest('Create Assignment', false, 'Response validation failed');
    }

    return passed;
  } catch (error) {
    logTest('Create Assignment', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testEnrollStudent() {
  try {
    log('\n🧪 Testing: Enroll Student (POST /api/courses/enroll)', 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/courses/enroll`,
      {
        courseId: courseId,
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );

    const passed =
      response.status === 201 &&
      response.data.success === true &&
      response.data.data.course_id === courseId;

    logTest('Enroll Student', passed, passed ? 'Student enrolled successfully' : 'Enrollment failed');

    return passed;
  } catch (error) {
    // If already enrolled, that's okay
    if (error.response?.status === 409) {
      logTest('Enroll Student', true, 'Student already enrolled');
      return true;
    }
    logTest('Enroll Student', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testSubmitAssignment() {
  try {
    log('\n🧪 Testing: Submit Assignment (POST /api/submissions)', 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/submissions`,
      {
        assignmentId: assignmentId,
        attachmentUrl: 'https://github.com/student/linux-hardening-project',
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );

    const passed =
      response.status === 201 &&
      response.data.success === true &&
      response.data.data.id &&
      response.data.data.status === 'submitted';

    if (passed) {
      submissionId = response.data.data.id;
      logTest('Submit Assignment', true, `Submission ID: ${submissionId}`);
    } else {
      logTest('Submit Assignment', false, 'Response validation failed');
    }

    return passed;
  } catch (error) {
    logTest('Submit Assignment', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetSubmissions() {
  try {
    log('\n🧪 Testing: Get Submissions (GET /api/submissions/assignment/:assignmentId)', 'blue');
    
    const response = await axios.get(
      `${BASE_URL}/submissions/assignment/${assignmentId}`,
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      Array.isArray(response.data.data.submissions) &&
      response.data.data.submissions.some((s) => s.id === submissionId);

    if (passed) {
      logTest('Get Submissions', true, `Found ${response.data.data.count} submission(s)`);
    } else {
      logTest('Get Submissions', false, 'Submission not found in list');
    }

    return passed;
  } catch (error) {
    logTest('Get Submissions', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGradeSubmission() {
  try {
    log('\n🧪 Testing: Grade Submission (PUT /api/submissions/:id/grade)', 'blue');
    
    const response = await axios.put(
      `${BASE_URL}/submissions/${submissionId}/grade`,
      {
        grade: 85,
        feedback: 'Good implementation, but improve code comments and documentation.',
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      response.data.data.grade === 85 &&
      response.data.data.status === 'graded' &&
      response.data.data.graded_at;

    if (passed) {
      logTest('Grade Submission', true, `Grade: ${response.data.data.grade}/100`);
    } else {
      logTest('Grade Submission', false, 'Response validation failed');
    }

    return passed;
  } catch (error) {
    logTest('Grade Submission', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║   TRAINET Backend - Trainer Endpoints Test Suite      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const results = {
    passed: 0,
    failed: 0,
  };

  // Step 1: Login as trainer
  if (!(await loginTrainer())) {
    log('\n❌ Cannot proceed without trainer login', 'red');
    return;
  }

  // Step 2: Login as student
  if (!(await loginStudent())) {
    log('\n❌ Cannot proceed without student login', 'red');
    return;
  }

  // Run tests
  const tests = [
    { name: 'Create Course', fn: testCreateCourse },
    { name: 'Get All Courses', fn: testGetAllCourses },
    { name: 'Create Assignment', fn: testCreateAssignment },
    { name: 'Enroll Student', fn: testEnrollStudent },
    { name: 'Submit Assignment', fn: testSubmitAssignment },
    { name: 'Get Submissions', fn: testGetSubmissions },
    { name: 'Grade Submission', fn: testGradeSubmission },
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
    log('\n🎉 All tests passed! Trainer workflow is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'red');
  }
}

// Run the test suite
runTests().catch((error) => {
  log('\n❌ Test suite failed with error:', 'red');
  console.error(error);
  process.exit(1);
});
