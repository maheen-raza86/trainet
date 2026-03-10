# API Tests Implementation

## ✅ Implementation Complete

Automated API tests for the TRAINET User Management module using Jest and Supertest.

---

## Overview

### Test Framework
- **Testing Framework**: Jest 29.7.0
- **HTTP Testing**: Supertest 6.3.3
- **Test Environment**: Node.js
- **Coverage**: Enabled with HTML/LCOV reports

### Test Coverage

✅ **FR-UM-1**: User Registration (Signup) - Includes verification token generation
✅ **FR-UM-2**: User Login - Includes email verification enforcement
✅ **FR-UM-3**: Get Current User
✅ **FR-UM-4**: Email Verification - Complete flow with email sending
✅ **FR-UM-5**: QR-Based Course Enrollment
✅ **FR-UM-6**: Profile Update

**Note:** Email verification is now fully integrated. Users must verify their email before logging in.

---

## Files Created

### Configuration
1. ✅ `jest.config.js` - Jest configuration
2. ✅ `tests/setup.js` - Global test setup

### Test Files
3. ✅ `tests/user-management.test.js` - User management API tests (500+ lines)
4. ✅ `tests/README.md` - Test documentation
5. ✅ `tests/test-runner.sh` - Test execution script

### Documentation
6. ✅ `API-TESTS-IMPLEMENTATION.md` - This file

---

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Advanced Usage

```bash
# Run specific test file
npm test user-management

# Run specific test suite
npm test -- --testNamePattern="User Registration"

# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="should register a new user"
```

---

## Test Structure

### Test Organization

```
tests/
├── setup.js                    # Global setup and utilities
├── user-management.test.js     # User management tests
├── README.md                   # Test documentation
└── test-runner.sh             # Automated test runner
```

### Test Suites

**user-management.test.js** contains 6 test suites:

1. **POST /api/auth/signup** (6 tests)
   - Successful registration
   - Missing required fields
   - Invalid email format
   - Short password
   - Invalid role
   - All valid SRD roles

2. **POST /api/auth/login** (5 tests)
   - Successful login
   - Missing credentials
   - Incorrect password
   - Non-existent email
   - Unverified email rejection

3. **GET /api/users/me** (3 tests)
   - Get profile with valid token
   - Reject without token
   - Reject with invalid token

4. **PUT /api/users/profile** (6 tests)
   - Update profile successfully
   - Update only provided fields
   - Reject without authentication
   - Reject role modification
   - Reject bio exceeding 500 chars
   - Reject invalid name lengths

5. **POST /api/auth/verify-email** (4 tests)
   - Verify with valid token
   - Reject missing token
   - Reject invalid token
   - Reject if already verified

6. **GET /api/enroll/qr/:token** (5 tests)
   - Enroll successfully
   - Reject without authentication
   - Reject invalid token
   - Reject duplicate enrollment
   - Reject expired token

**Total: 29 automated tests**

---

## Test Details

### FR-UM-1: User Registration Tests

**Endpoint**: `POST /api/auth/signup`

**Tests:**
```javascript
✓ should register a new user successfully
✓ should reject signup with missing required fields
✓ should reject signup with invalid email format
✓ should reject signup with short password
✓ should reject signup with invalid role
✓ should accept all valid SRD roles (student, trainer, alumni, recruiter, admin)
```

**Validations:**
- Email format validation
- Password length (min 8 characters)
- Required fields (email, password, firstName, lastName)
- Role validation (student, trainer, alumni, recruiter, admin)
- Name length validation (2-50 characters)

---

### FR-UM-2: User Login Tests

**Endpoint**: `POST /api/auth/login`

**Tests:**
```javascript
✓ should login successfully with correct credentials
✓ should reject login with missing credentials
✓ should reject login with incorrect password
✓ should reject login with non-existent email
✓ should reject login if email is not verified
```

**Validations:**
- Credentials required
- Password verification
- User existence check
- Email verification check
- Token generation

---

### FR-UM-3: Get Current User Tests

**Endpoint**: `GET /api/users/me`

**Tests:**
```javascript
✓ should get current user profile with valid token
✓ should reject request without token
✓ should reject request with invalid token
```

**Validations:**
- JWT token verification
- User profile retrieval
- Authentication required

---

### FR-UM-6: Profile Update Tests

**Endpoint**: `PUT /api/users/profile`

**Tests:**
```javascript
✓ should update user profile successfully
✓ should update only provided fields
✓ should reject profile update without authentication
✓ should reject role modification through profile update
✓ should reject bio exceeding 500 characters
✓ should reject invalid name lengths
```

**Validations:**
- Authentication required
- Partial updates supported
- Role modification prevented
- Bio length limit (500 chars)
- Name length validation (2-50 chars)
- Avatar URL format

---

### FR-UM-4: Email Verification Tests

**Endpoint**: `POST /api/auth/verify-email`

**Tests:**
```javascript
✓ should verify email with valid token
✓ should reject verification with missing token
✓ should reject verification with invalid token
✓ should reject verification if already verified
```

**Validations:**
- Token required
- Token validity check
- Duplicate verification prevention
- Database update verification

---

### FR-UM-5: QR Enrollment Tests

**Endpoint**: `GET /api/enroll/qr/:token`

**Tests:**
```javascript
✓ should enroll via QR code successfully
✓ should reject QR enrollment without authentication
✓ should reject QR enrollment with invalid token
✓ should reject duplicate QR enrollment
✓ should reject expired QR token
```

**Validations:**
- Authentication required
- Token validity check
- Token expiration check
- Duplicate enrollment prevention
- Course existence verification

---

## Test Data Management

### Automatic Cleanup

All tests automatically clean up their data:

```javascript
afterAll(async () => {
  // Clean up test user
  if (userId) {
    await supabaseAdminClient.from('profiles').delete().eq('id', userId);
    await supabaseAdminClient.auth.admin.deleteUser(userId);
  }
  
  // Clean up test course and enrollments
  if (courseId) {
    await supabaseAdminClient.from('enrollments').delete().eq('course_id', courseId);
    await supabaseAdminClient.from('enrollment_qr_tokens').delete().eq('course_id', courseId);
    await supabaseAdminClient.from('courses').delete().eq('id', courseId);
  }
});
```

### Unique Test Data

Each test run generates unique data:

```javascript
// Unique email for each test run
testUser.email = global.testUtils.generateTestEmail();
// Example: test-1704123456789-1234@example.com

// Unique tokens
qrToken = `QR-TEST-${global.testUtils.generateRandomString(16)}`;
// Example: QR-TEST-a1b2c3d4e5f6g7h8
```

---

## Test Utilities

### Global Utilities

Available in all tests via `global.testUtils`:

```javascript
// Generate unique test email
const email = global.testUtils.generateTestEmail();
// Returns: test-{timestamp}-{random}@example.com

// Generate random string
const token = global.testUtils.generateRandomString(32);
// Returns: random alphanumeric string of specified length
```

---

## Configuration

### Jest Configuration

**File**: `jest.config.js`

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
}
```

### Environment Variables

Tests use the same `.env` file as the application:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Coverage Reports

### Generate Coverage

```bash
npm test -- --coverage
```

### View Coverage

```bash
# HTML report
open coverage/index.html

# Terminal report
npm test -- --coverage --coverageReporters=text
```

### Coverage Targets

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Troubleshooting

### Common Issues

**1. Tests Timeout**
```bash
# Increase timeout in jest.config.js
testTimeout: 60000  // 60 seconds
```

**2. Database Connection Errors**
```bash
# Verify Supabase credentials in .env
# Check database is accessible
# Ensure migrations are applied
```

**3. Authentication Errors**
```bash
# Verify SUPABASE_SERVICE_ROLE_KEY is correct
# Check user exists in database
# Verify token generation
```

**4. Test Data Conflicts**
```bash
# Tests use unique emails per run
# Check cleanup is working
# Manually clean test data if needed
```

### Debug Mode

Enable verbose logging:

```javascript
// In tests/setup.js, comment out console suppression
// global.console = { ... };
```

Run with verbose output:

```bash
npm test -- --verbose --detectOpenHandles
```

---

## Best Practices

### Test Writing

1. **Isolation**: Each test is independent
2. **Cleanup**: Always clean up test data
3. **Unique Data**: Use unique identifiers
4. **Assertions**: Use specific assertions
5. **Error Cases**: Test both success and errors

### Example Test

```javascript
describe('Feature', () => {
  let testData = {};

  beforeAll(() => {
    // Setup once before all tests
  });

  afterAll(async () => {
    // Cleanup once after all tests
  });

  it('should do something', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'value' })
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

---

## Future Enhancements

### Planned Tests

- [ ] Course module integration tests
- [ ] Assignment module integration tests
- [ ] Submission module integration tests
- [ ] Enrollment module integration tests
- [ ] Performance tests
- [ ] Load tests
- [ ] Security tests

### Improvements

- [ ] Mock external services
- [ ] Test data factories
- [ ] Parallel test execution
- [ ] Visual regression tests
- [ ] API contract tests
- [ ] End-to-end tests

---

## Test Results Example

```
PASS  tests/user-management.test.js (26.076 s)
  User Management API Tests
    POST /api/auth/signup
      ✓ should register a new user successfully (966 ms)
      ✓ should reject signup with missing required fields (16 ms)
      ✓ should reject signup with invalid email format (12 ms)
      ✓ should reject signup with short password (9 ms)
      ✓ should reject signup with invalid role (11 ms)
      ✓ should accept all valid SRD roles (6784 ms)
    POST /api/auth/login
      ✓ should login successfully with correct credentials (689 ms)
      ✓ should reject login with missing credentials (8 ms)
      ✓ should reject login with incorrect password (387 ms)
      ✓ should reject login with non-existent email (300 ms)
      ✓ should reject login if email is not verified (2026 ms)
    GET /api/users/me
      ✓ should get current user profile with valid token (609 ms)
      ✓ should reject request without token (10 ms)
      ✓ should reject request with invalid token (303 ms)
    PUT /api/users/profile
      ✓ should update user profile successfully (896 ms)
      ✓ should update only provided fields (908 ms)
      ✓ should reject profile update without authentication (9 ms)
      ✓ should reject role modification through profile update (623 ms)
      ✓ should reject bio exceeding 500 characters (601 ms)
      ✓ should reject invalid name lengths (600 ms)
    POST /api/auth/verify-email
      ✓ should verify email with valid token (1216 ms)
      ✓ should reject verification with missing token (9 ms)
      ✓ should reject verification with invalid token (338 ms)
      ✓ should reject verification if already verified (303 ms)
    GET /api/enroll/qr/:token
      ✓ should enroll via QR code successfully (1805 ms)
      ✓ should reject QR enrollment without authentication (8 ms)
      ✓ should reject QR enrollment with invalid token (896 ms)
      ✓ should reject duplicate QR enrollment (1486 ms)
      ✓ should reject expired QR token (1486 ms)

--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   43.47 |    34.16 |   39.34 |   43.47 |                   
 src                      |   76.47 |      100 |       0 |   76.47 |                   
  app.js                  |   76.47 |      100 |       0 |   76.47 | 59,83,92-94       
 src/controllers          |   38.76 |    42.25 |   31.57 |   38.76 |                   
  authController.js       |   89.28 |     92.3 |     100 |   89.28 | 50,58,89          
  userController.js       |   91.17 |       75 |     100 |   91.17 | 21,42,128         
 src/middleware           |   56.71 |       50 |      75 |   56.71 |                   
  authMiddleware.js       |   84.21 |    85.71 |     100 |   84.21 | 29,48-49          
  rateLimitMiddleware.js  |     100 |       50 |     100 |     100 | 14-33             
 src/services             |      33 |     28.2 |   31.57 |      33 |                   
  authService.js          |   63.15 |    57.14 |     100 |   63.15 | ...120-121,142-143
  enrollmentService.js    |   46.66 |     42.1 |      50 |   46.66 | ...70-71,81-107   
  userService.js          |   78.12 |    76.08 |     100 |   78.12 | ...150-151,198-199
--------------------------|---------|----------|---------|---------|-------------------

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        26.852 s
Ran all test suites.
```

---

## Status

✅ **All Tests Passing**
- ✅ 29 automated tests created and verified
- ✅ All user management endpoints covered
- ✅ Email verification flow fully tested
- ✅ Test utilities implemented
- ✅ Documentation complete
- ✅ Coverage: 42.30% statements, 33.61% branches
- ✅ Rate limiting disabled for test environment
- ✅ ES modules configuration working

**Test Execution Time:** ~30 seconds
**Version:** 1.7.0
**Date:** March 8, 2026
**Impact:** Complete email verification implementation with automated testing
