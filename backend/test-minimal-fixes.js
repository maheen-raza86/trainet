/**
 * TRAINET Backend - Minimal Fixes Verification Test
 * Tests that the fixes were applied correctly
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[96m',
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

async function testGetCoursesCatalog() {
  try {
    log('\n🧪 Testing: GET /api/courses (catalog)', 'blue');
    
    const response = await axios.get(`${BASE_URL}/courses`);

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      Array.isArray(response.data.data.courses);

    if (passed) {
      logTest('GET /api/courses (catalog)', true, `Found ${response.data.data.count} courses`);
    } else {
      logTest('GET /api/courses (catalog)', false, 'Invalid response format');
    }

    return passed;
  } catch (error) {
    logTest('GET /api/courses (catalog)', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testPostCoursesRemoved() {
  try {
    log('\n🧪 Testing: POST /api/courses (should be removed)', 'blue');
    
    try {
      await axios.post(`${BASE_URL}/courses`, {
        title: 'Test Course',
        description: 'This should not work',
      });
      
      // If we get here, the endpoint still exists
      logTest('POST /api/courses removed', false, 'Endpoint still exists');
      return false;
    } catch (error) {
      // Endpoint should return 404 or similar error
      if (error.response?.status === 404 || error.response?.status === 405) {
        logTest('POST /api/courses removed', true, 'Endpoint correctly removed');
        return true;
      }
      logTest('POST /api/courses removed', false, `Unexpected error: ${error.response?.status}`);
      return false;
    }
  } catch (error) {
    logTest('POST /api/courses removed', false, error.message);
    return false;
  }
}

async function testCatalogDuplicateRemoved() {
  try {
    log('\n🧪 Testing: GET /api/courses/catalog (should be removed)', 'blue');
    
    try {
      await axios.get(`${BASE_URL}/courses/catalog`);
      
      // If we get here, the duplicate endpoint still exists
      logTest('Duplicate /catalog removed', false, 'Duplicate endpoint still exists');
      return false;
    } catch (error) {
      // Endpoint should return 404
      if (error.response?.status === 404) {
        logTest('Duplicate /catalog removed', true, 'Duplicate correctly removed');
        return true;
      }
      logTest('Duplicate /catalog removed', false, `Unexpected error: ${error.response?.status}`);
      return false;
    }
  } catch (error) {
    logTest('Duplicate /catalog removed', false, error.message);
    return false;
  }
}

async function testCourseOfferingsAvailable() {
  try {
    log('\n🧪 Testing: GET /api/course-offerings/available', 'blue');
    
    const response = await axios.get(`${BASE_URL}/course-offerings/available`);

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      Array.isArray(response.data.data.offerings);

    if (passed) {
      logTest('GET /api/course-offerings/available', true, `Found ${response.data.data.count} offerings`);
    } else {
      logTest('GET /api/course-offerings/available', false, 'Invalid response format');
    }

    return passed;
  } catch (error) {
    logTest('GET /api/course-offerings/available', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testHealthCheck() {
  try {
    log('\n🧪 Testing: GET /api/health', 'blue');
    
    const response = await axios.get(`${BASE_URL}/health`);

    const passed =
      response.status === 200 &&
      response.data.success === true &&
      response.data.data.status === 'healthy';

    if (passed) {
      logTest('Health Check', true, `Server is ${response.data.data.status}`);
    } else {
      logTest('Health Check', false, 'Server not healthy');
    }

    return passed;
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   TRAINET Backend - Minimal Fixes Verification            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    passed: 0,
    failed: 0,
  };

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'GET /api/courses (catalog)', fn: testGetCoursesCatalog },
    { name: 'POST /api/courses removed', fn: testPostCoursesRemoved },
    { name: 'Duplicate /catalog removed', fn: testCatalogDuplicateRemoved },
    { name: 'Course Offerings Available', fn: testCourseOfferingsAvailable },
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
    log('\n🎉 All minimal fixes verified successfully!', 'green');
    log('✅ POST /api/courses removed', 'green');
    log('✅ Duplicate /catalog endpoint removed', 'green');
    log('✅ GET /api/courses works as catalog', 'green');
    log('✅ Course offerings endpoints functional', 'green');
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
