# TRAINET Backend API Tests

## Overview

Automated API tests for the TRAINET backend using Jest and Supertest.

## Test Coverage

### User Management Module
- **FR-UM-1**: User Registration (Signup)
- **FR-UM-2**: User Login
- **FR-UM-3**: Get Current User
- **FR-UM-4**: Email Verification
- **FR-UM-5**: QR-Based Course Enrollment
- **FR-UM-6**: Profile Update

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test user-management
```

### Run Specific Test Suite
```bash
npm test -- --testNamePattern="User Registration"
```

## Test Structure

```
tests/
├── setup.js                    # Global test setup
├── user-management.test.js     # User management API tests
└── README.md                   # This file
```

## Test Environment

- **Test Environment**: Node.js
- **Test Framework**: Jest
- **HTTP Testing**: Supertest
- **Database**: Supabase (uses actual database)
- **Timeout**: 30 seconds per test

## Prerequisites

Before running tests:

1. **Database Setup**: Ensure Supabase database is running and accessible
2. **Environment Variables**: Set up `.env` file with test credentials
3. **Database Migration**: Run all migrations including:
   - `001_update_role_constraint.sql`
   - `002_user_management_enhancements.sql`

## Test Data

Tests create and clean up their own data:
- Unique email addresses generated for each test run
- Test users are deleted after tests complete
- Test courses and enrollments are cleaned up

## Test Utilities

Global test utilities available in all tests:

```javascript
// Generate unique test email
const email = global.testUtils.generateTestEmail();

// Generate random string
const token = global.testUtils.generateRandomString(32);
```

## Writing New Tests

### Test File Template

```javascript
import request from 'supertest';
import app from '../src/app.js';

describe('Feature Name', () => {
  let testData = {};

  beforeAll(() => {
    // Setup before all tests
  });

  afterAll(async () => {
    // Cleanup after all tests
  });

  describe('Endpoint Name', () => {
    it('should do something', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});
```

## Common Test Patterns

### Testing Protected Endpoints
```javascript
const response = await request(app)
  .get('/api/protected')
  .set('Authorization', `Bearer ${accessToken}`)
  .expect(200);
```

### Testing POST Requests
```javascript
const response = await request(app)
  .post('/api/endpoint')
  .send({ data: 'value' })
  .expect('Content-Type', /json/)
  .expect(201);
```

### Testing Error Responses
```javascript
const response = await request(app)
  .post('/api/endpoint')
  .send({ invalid: 'data' })
  .expect(400);

expect(response.body).toHaveProperty('success', false);
expect(response.body.message).toContain('error message');
```

## Debugging Tests

### Enable Verbose Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- --testNamePattern="should register a new user"
```

### View Console Logs
Uncomment the console suppression in `setup.js` to see logs during tests.

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm test
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Troubleshooting

### Tests Timeout
- Increase timeout in `jest.config.js`
- Check database connection
- Verify Supabase credentials

### Database Errors
- Ensure migrations are applied
- Check database permissions
- Verify table schemas match code

### Authentication Errors
- Verify Supabase keys are correct
- Check token generation
- Ensure user exists in database

## Coverage Reports

After running tests with coverage:
- View HTML report: `open coverage/index.html`
- View text report in terminal
- Coverage files in `coverage/` directory

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Unique Data**: Use unique identifiers for test data
4. **Assertions**: Use specific assertions
5. **Error Cases**: Test both success and error scenarios
6. **Documentation**: Comment complex test logic

## Future Enhancements

- [ ] Add integration tests for course module
- [ ] Add integration tests for assignment module
- [ ] Add integration tests for submission module
- [ ] Add performance tests
- [ ] Add load tests
- [ ] Add security tests
- [ ] Mock external services
- [ ] Add test data factories

## Support

For issues or questions about tests:
1. Check test output for error messages
2. Review test documentation
3. Check application logs
4. Verify database state
