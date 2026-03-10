/**
 * Jest Test Setup
 * Global setup for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

// Global test utilities
global.testUtils = {
  // Generate random email for testing
  generateTestEmail: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `test-${timestamp}-${random}@example.com`;
  },

  // Generate random string
  generateRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },
};

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
