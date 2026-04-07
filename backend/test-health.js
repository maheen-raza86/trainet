/**
 * Simple Health Check Test
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check passed');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('✗ Health check failed');
    console.log('Error:', error.message);
    return false;
  }
}

async function testCourses() {
  try {
    console.log('\nTesting courses endpoint...');
    const response = await axios.get(`${BASE_URL}/courses`);
    console.log('✓ Courses endpoint works');
    console.log('Courses found:', response.data.data?.count || 0);
    return true;
  } catch (error) {
    console.log('✗ Courses endpoint failed');
    console.log('Error:', error.message);
    return false;
  }
}

async function runBasicTests() {
  console.log('🧪 Running basic API tests...\n');
  
  await testHealth();
  await testCourses();
  
  console.log('\n✅ Basic tests complete');
}

runBasicTests().catch(console.error);