/**
 * TRAINET Backend - Course Offerings Test Script
 * Tests the new SRDS-compliant course offering workflow
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
let trainerToken = '';
let studentToken = '';
let catalogCourseId = '';
let offeringId = '';
let enrollmentId = '';

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[96m',
  magenta: '\x1b[95m',
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

async function testGetCourseCatalog() {
  try {
    log('\n🧪 Testing: Get Course Catalog (GET /api/courses/catalog)', 'blue');
    
    const response = await axios.get(`${BASE_URL}/courses/catalog`);

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      Array.isArray(response.data.data.courses) &&
      response.data.data.courses.length > 0;

    if (passed) {
      catalogCourseId = response.data.data.courses[0].id;
      logTest('Get Course Catalog', true, `Found ${response.data.data.count} courses in catalog`);
      log(`  Sample course: "${response.data.data.courses[0].title}"`, 'cyan');
    } else {
      logTest('Get Course Catalog', false, 'No courses found in catalog');
    }

    return passed;
  } catch (error) {
    logTest('Get Course Catalog', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateCourseOffering() {
  try {
    log('\n🧪 Testing: Create Course Offering (POST /api/course-offerings)', 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/course-offerings`,
      {
        courseId: catalogCourseId,
        durationWeeks: 8,
        hoursPerWeek: 4,
        outline: 'Comprehensive course covering Linux security fundamentals, penetration testing, and system hardening techniques.',
        startDate: '2026-04-01T00:00:00Z',
        endDate: '2026-05-27T23:59:59Z',
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );

    const passed =
      response.status === 201 &&
      response.data.success === true &&
      response.data.data.id &&
      response.data.data.course_id === catalogCourseId &&
      response.data.data.duration_weeks === 8;

    if (passed) {
      offeringId = response.data.data.id;
      logTest('Create Course Offering', true, `Offering ID: ${offeringId}`);
      log(`  Course: ${response.data.data.courses?.title}`, 'cyan');
      log(`  Duration: ${response.data.data.duration_weeks} weeks`, 'cyan');
    } else {
      logTest('Create Course Offering', false, 'Response validation failed');
    }

    return passed;
  } catch (error) {
    logTest('Create Course Offering', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetTrainerOfferings() {
  try {
    log('\n🧪 Testing: Get Trainer Offerings (GET /api/course-offerings/trainer)', 'blue');
    
    const response = await axios.get(
      `${BASE_URL}/course-offerings/trainer`,
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      Array.isArray(response.data.data.offerings) &&
      response.data.data.offerings.some((o) => o.id === offeringId);

    if (passed) {
      logTest('Get Trainer Offerings', true, `Found ${response.data.data.count} offering(s)`);
    } else {
      logTest('Get Trainer Offerings', false, 'Offering not found in list');
    }

    return passed;
  } catch (error) {
    logTest('Get Trainer Offerings', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetAvailableOfferings() {
  try {
    log('\n🧪 Testing: Get Available Offerings (GET /api/course-offerings/available)', 'blue');
    
    const response = await axios.get(`${BASE_URL}/course-offerings/available`);

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      Array.isArray(response.data.data.offerings) &&
      response.data.data.offerings.some((o) => o.id === offeringId);

    if (passed) {
      logTest('Get Available Offerings', true, `Found ${response.data.data.count} available offering(s)`);
      const offering = response.data.data.offerings.find((o) => o.id === offeringId);
      if (offering) {
        log(`  Course: ${offering.courses?.title}`, 'cyan');
        log(`  Trainer: ${offering.profiles?.first_name} ${offering.profiles?.last_name}`, 'cyan');
      }
    } else {
      logTest('Get Available Offerings', false, 'Offering not found in available list');
    }

    return passed;
  } catch (error) {
    logTest('Get Available Offerings', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testEnrollInOffering() {
  try {
    log('\n🧪 Testing: Enroll in Offering (POST /api/course-offerings/enroll)', 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/course-offerings/enroll`,
      {
        offeringId: offeringId,
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );

    const passed =
      response.status === 201 &&
      response.data.success === true &&
      response.data.data.offering_id === offeringId;

    if (passed) {
      enrollmentId = response.data.data.id;
      logTest('Enroll in Offering', true, `Enrollment ID: ${enrollmentId}`);
    } else {
      logTest('Enroll in Offering', false, 'Response validation failed');
    }

    return passed;
  } catch (error) {
    // If already enrolled, that's okay
    if (error.response?.status === 409) {
      logTest('Enroll in Offering', true, 'Student already enrolled');
      return true;
    }
    logTest('Enroll in Offering', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testUpdateOffering() {
  try {
    log('\n🧪 Testing: Update Offering (PUT /api/course-offerings/:id)', 'blue');
    
    const response = await axios.put(
      `${BASE_URL}/course-offerings/${offeringId}`,
      {
        hoursPerWeek: 5,
        outline: 'Updated comprehensive course covering Linux security fundamentals, advanced penetration testing, and system hardening techniques with hands-on labs.',
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      response.data.data.hours_per_week === 5;

    if (passed) {
      logTest('Update Offering', true, `Hours per week updated to ${response.data.data.hours_per_week}`);
    } else {
      logTest('Update Offering', false, 'Response validation failed');
    }

    return passed;
  } catch (error) {
    logTest('Update Offering', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testTrainerLimit() {
  try {
    log('\n🧪 Testing: Trainer 5 Offering Limit', 'blue');
    
    // Try to create 5 more offerings to test the limit
    const offerings = [];
    for (let i = 0; i < 5; i++) {
      try {
        const response = await axios.post(
          `${BASE_URL}/course-offerings`,
          {
            courseId: catalogCourseId,
            durationWeeks: 4,
            hoursPerWeek: 3,
            outline: `Test offering ${i + 1} for limit validation with sufficient content length.`,
          },
          {
            headers: { Authorization: `Bearer ${trainerToken}` },
          }
        );
        if (response.data.success) {
          offerings.push(response.data.data.id);
        }
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.message?.includes('5 active')) {
          logTest('Trainer 5 Offering Limit', true, 'Limit enforced correctly');
          return true;
        }
      }
    }

    // If we got here, limit wasn't enforced
    logTest('Trainer 5 Offering Limit', false, 'Limit not enforced (created more than 5)');
    return false;
  } catch (error) {
    logTest('Trainer 5 Offering Limit', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   TRAINET Backend - Course Offerings Test Suite           ║', 'cyan');
  log('║              SRDS-Compliant Architecture                   ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

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
    { name: 'Get Course Catalog', fn: testGetCourseCatalog },
    { name: 'Create Course Offering', fn: testCreateCourseOffering },
    { name: 'Get Trainer Offerings', fn: testGetTrainerOfferings },
    { name: 'Get Available Offerings', fn: testGetAvailableOfferings },
    { name: 'Enroll in Offering', fn: testEnrollInOffering },
    { name: 'Update Offering', fn: testUpdateOffering },
    { name: 'Trainer 5 Offering Limit', fn: testTrainerLimit },
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
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    TEST SUMMARY                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`\nTotal Tests: ${results.passed + results.failed}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.failed === 0) {
    log('\n🎉 All tests passed! Course offerings system is working correctly.', 'green');
    log('✅ SRDS-compliant architecture verified', 'green');
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
