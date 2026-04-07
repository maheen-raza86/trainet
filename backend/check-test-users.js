/**
 * Check if test users exist by attempting login
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function checkUser(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    if (response.data.token) {
      console.log(`✓ ${email} exists and can login (role: ${response.data.user.role})`);
      return true;
    }
  } catch (error) {
    console.log(`✗ ${email} cannot login: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function main() {
  console.log('\nChecking test users...\n');
  
  await checkUser('trainer@example.com', 'password123');
  await checkUser('student@example.com', 'password123');
  
  console.log('\n');
}

main();
