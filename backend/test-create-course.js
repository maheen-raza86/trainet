/**
 * Test Create Course Endpoint
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testCreateCourseWithoutAuth() {
  try {
    console.log('Testing CREATE COURSE without authentication...');
    const response = await axios.post(`${BASE_URL}/courses`, {
      title: 'Test Course',
      description: 'This is a test course for validation'
    });
    console.log('✗ Unexpected success - should have failed without auth');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected without authentication');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data?.message);
    } else {
      console.log('✗ Unexpected error');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }
  }
}

async function testCreateCourseWithInvalidData() {
  try {
    console.log('\nTesting CREATE COURSE with invalid data (no auth)...');
    const response = await axios.post(`${BASE_URL}/courses`, {
      title: 'AB', // Too short
      description: 'Short' // Too short
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing CREATE COURSE endpoint...\n');
  
  await testCreateCourseWithoutAuth();
  await testCreateCourseWithInvalidData();
  
  console.log('\n✅ Tests complete');
}

runTests().catch(console.error);