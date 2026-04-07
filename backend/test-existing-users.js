/**
 * Test with existing users
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const testCredentials = [
  { email: 'trainer@example.com', password: 'password123', role: 'trainer' },
  { email: 'student@example.com', password: 'password123', role: 'student' },
  { email: 'admin@trainet.com', password: 'admin123', role: 'admin' },
  { email: 'trainer@trainet.com', password: 'trainer123', role: 'trainer' },
  { email: 'student@trainet.com', password: 'student123', role: 'student' },
  { email: 'test@test.com', password: 'test123', role: 'test' },
];

async function tryLogin(credentials) {
  try {
    console.log(`Trying login: ${credentials.email}`);
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: credentials.email,
      password: credentials.password,
    });
    
    if (response.data.success) {
      console.log(`✓ Login successful for ${credentials.email}`);
      console.log(`  Role: ${response.data.data.user.role}`);
      console.log(`  Token: ${response.data.data.accessToken.substring(0, 20)}...`);
      return {
        success: true,
        token: response.data.data.accessToken,
        user: response.data.data.user
      };
    }
    return { success: false };
  } catch (error) {
    console.log(`✗ Login failed for ${credentials.email}: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

async function findWorkingCredentials() {
  console.log('🔍 Searching for existing users...\n');
  
  const workingCredentials = {
    trainer: null,
    student: null
  };
  
  for (const creds of testCredentials) {
    const result = await tryLogin(creds);
    if (result.success) {
      if (result.user.role === 'trainer' && !workingCredentials.trainer) {
        workingCredentials.trainer = { ...creds, token: result.token };
      } else if (result.user.role === 'student' && !workingCredentials.student) {
        workingCredentials.student = { ...creds, token: result.token };
      }
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📋 Results:');
  if (workingCredentials.trainer) {
    console.log(`✓ Found trainer: ${workingCredentials.trainer.email}`);
  } else {
    console.log('✗ No trainer found');
  }
  
  if (workingCredentials.student) {
    console.log(`✓ Found student: ${workingCredentials.student.email}`);
  } else {
    console.log('✗ No student found');
  }
  
  return workingCredentials;
}

findWorkingCredentials().catch(console.error);