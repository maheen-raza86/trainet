/**
 * Create Test Users for TRAINET Backend Testing
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createUser(userData) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/signup`, userData);
    if (response.data.success) {
      log(`✓ Created ${userData.role}: ${userData.email}`, 'green');
      return true;
    }
    return false;
  } catch (error) {
    if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
      log(`ℹ User already exists: ${userData.email}`, 'blue');
      return true;
    }
    log(`✗ Failed to create ${userData.email}: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function createTestUsers() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║          Creating Test Users for TRAINET              ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');

  const users = [
    {
      email: 'trainer@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Trainer',
      role: 'trainer',
    },
    {
      email: 'student@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
    },
  ];

  for (const user of users) {
    await createUser(user);
  }

  log('\n✅ Test users setup complete!', 'green');
  log('\nYou can now run: node test-trainer-endpoints.js', 'blue');
}

createTestUsers().catch((error) => {
  log('\n❌ Failed to create test users:', 'red');
  console.error(error);
  process.exit(1);
});
