# Design Document: Trainer Backend Endpoints

## Overview

This design document specifies the implementation of three missing trainer backend endpoints for the TRAINET Learning Management System. The frontend trainer dashboard already has modals for creating courses, grading submissions, and editing assignments, but the backend lacks the corresponding API endpoints. This implementation will complete the trainer functionality by adding:

1. **POST /api/courses** - Create new courses
2. **PUT /api/submissions/:id/grade** - Grade student submissions
3. **PUT /api/assignments/:id** - Edit existing assignments

The implementation follows the existing architectural patterns in the codebase, using the Express.js framework with a three-layer architecture (routes, controllers, services), Supabase for database operations, and JWT-based authentication with role-based authorization.

## Architecture

### System Context

The trainer backend endpoints integrate into the existing TRAINET backend architecture:

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
│  - CreateCourse │
│  - GradeSubmit  │
│  - EditAssign   │
└────────┬────────┘
         │ HTTP/JSON
         │ JWT Auth
         ▼
┌─────────────────┐
│  Express API    │
│  - Routes       │
│  - Controllers  │
│  - Services     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  (PostgreSQL)   │
│  - courses      │
│  - assignments  │
│  - submissions  │
└─────────────────┘
```

### Architectural Layers

The implementation follows the existing three-layer architecture:

1. **Routes Layer** (`backend/src/routes/`)
   - Define HTTP endpoints and methods
   - Apply authentication and authorization middleware
   - Route requests to appropriate controllers

2. **Controllers Layer** (`backend/src/controllers/`)
   - Handle HTTP request/response
   - Validate request parameters and body
   - Call service layer for business logic
   - Format responses according to API standards

3. **Services Layer** (`backend/src/services/`)
   - Implement business logic
   - Interact with Supabase database
   - Handle data validation and transformation
   - Throw appropriate errors for error handling

### Authentication & Authorization Flow

```
Request → verifyToken → authorizeRoles → Controller → Service → Database
          (JWT check)   (role check)     (validate)   (logic)    (persist)
```

## Components and Interfaces

### 1. Create Course Endpoint

**Route:** `POST /api/courses`

**Middleware Chain:**
- `verifyToken` - Validates JWT and attaches user to request
- `authorizeRoles('trainer')` - Ensures user has trainer role

**Request Interface:**
```typescript
interface CreateCourseRequest {
  title: string;      // 3-100 characters
  description: string; // 10-500 characters
}
```

**Response Interface:**
```typescript
interface CreateCourseResponse {
  success: true;
  message: string;
  data: {
    id: string;
    title: string;
    description: string;
    created_at: string;
  }
}
```

**Controller Responsibilities:**
- Validate title length (3-100 characters)
- Validate description length (10-500 characters)
- Extract trainer ID from `req.user.id`
- Call service layer with validated data
- Return 201 status on success

**Service Responsibilities:**
- Insert course record into Supabase `courses` table
- Log course creation event
- Return created course data

### 2. Grade Submission Endpoint

**Route:** `PUT /api/submissions/:id/grade`

**Middleware Chain:**
- `verifyToken` - Validates JWT and attaches user to request
- `authorizeRoles('trainer')` - Ensures user has trainer role

**Request Interface:**
```typescript
interface GradeSubmissionRequest {
  grade: number;    // 0-100
  feedback: string; // minimum 10 characters
}
```

**Response Interface:**
```typescript
interface GradeSubmissionResponse {
  success: true;
  message: string;
  data: {
    id: string;
    assignment_id: string;
    student_id: string;
    attachment_url: string;
    status: string;
    submitted_at: string;
    grade: number;
    feedback: string;
    graded_at: string;
  }
}
```

**Controller Responsibilities:**
- Extract submission ID from URL parameter
- Validate grade range (0-100)
- Validate feedback length (minimum 10 characters)
- Extract trainer ID from `req.user.id`
- Call service layer with validated data
- Return 200 status on success

**Service Responsibilities:**
- Verify submission exists
- Retrieve associated assignment
- Verify trainer owns the assignment
- Update submission with grade, feedback, and graded_at timestamp
- Update submission status to 'graded'
- Log grading event
- Return updated submission data

### 3. Edit Assignment Endpoint

**Route:** `PUT /api/assignments/:id`

**Middleware Chain:**
- `verifyToken` - Validates JWT and attaches user to request
- `authorizeRoles('trainer')` - Ensures user has trainer role

**Request Interface:**
```typescript
interface EditAssignmentRequest {
  title?: string;       // optional, 3+ characters if provided
  description?: string; // optional, 10+ characters if provided
  dueDate?: string;     // optional, ISO 8601 format if provided
}
```

**Response Interface:**
```typescript
interface EditAssignmentResponse {
  success: true;
  message: string;
  data: {
    id: string;
    course_id: string;
    trainer_id: string;
    title: string;
    description: string;
    due_date: string;
    created_at: string;
    updated_at: string;
  }
}
```

**Controller Responsibilities:**
- Extract assignment ID from URL parameter
- Validate at least one field is provided
- Validate title length if provided (minimum 3 characters)
- Validate description length if provided (minimum 10 characters)
- Validate dueDate format if provided (ISO 8601)
- Extract trainer ID from `req.user.id`
- Call service layer with validated data
- Return 200 status on success

**Service Responsibilities:**
- Verify assignment exists
- Verify trainer owns the assignment
- Update assignment with provided fields
- Add updated_at timestamp
- Log update event
- Return updated assignment data

## Data Models

### Database Schema

The implementation uses existing Supabase tables:

**courses table:**
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**assignments table:**
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**submissions table:**
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attachment_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE
);
```

### Data Transformations

**Database to API (snake_case to camelCase):**
- `created_at` → `created_at` (keep as-is for consistency with existing API)
- `course_id` → `course_id` (keep as-is for consistency)
- `trainer_id` → `trainer_id` (keep as-is for consistency)
- `due_date` → `due_date` (keep as-is for consistency)
- `attachment_url` → `attachment_url` (keep as-is for consistency)
- `submitted_at` → `submitted_at` (keep as-is for consistency)
- `graded_at` → `graded_at` (keep as-is for consistency)

Note: The existing codebase uses snake_case in API responses to match database column names, so we maintain this convention for consistency.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several redundant properties that can be consolidated:

**Redundancies Identified:**
1. Properties 1.8 and 1.9 both test response format - can be combined into one comprehensive property
2. Properties 2.6 and 2.7 both test non-existent submission handling - can be combined
3. Properties 2.11 and 2.12 both test response format - can be combined
4. Properties 3.6 and 3.7 both test non-existent assignment handling - can be combined
5. Properties 3.11 and 3.12 both test response format - can be combined
6. All validation properties (1.3-1.6, 2.3-2.5, 3.3-3.5) can be grouped by endpoint
7. Response format properties (1.8, 2.11, 3.11, 4.7, 5.8) can be consolidated into one universal property

**Consolidated Approach:**
- Combine all response format checks into a single property about API consistency
- Group validation properties by endpoint for clarity
- Combine existence checks with their error responses
- Focus on unique validation value for each property

### Property 1: API Response Format Consistency

*For any* successful API response from the trainer endpoints (POST /api/courses, PUT /api/submissions/:id/grade, PUT /api/assignments/:id), the response should follow the format `{ success: true, message: string, data: object }` where data contains the created or updated resource with all expected fields.

**Validates: Requirements 1.8, 1.9, 2.11, 2.12, 3.11, 3.12, 5.8**

### Property 2: Error Response Format Consistency

*For any* error response from the trainer endpoints, the response should follow the format `{ success: false, message: string, error: string }` and should not expose sensitive database details.

**Validates: Requirements 4.3, 4.7**

### Property 3: Course Creation Input Validation

*For any* course creation request, if the title is less than 3 characters or exceeds 100 characters, or if the description is less than 10 characters or exceeds 500 characters, the API should return a 400 status code with a validation error message.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

### Property 4: Course Creation Authorization

*For any* authenticated user without the trainer role attempting to create a course, the API should return a 403 status code with a forbidden error message.

**Validates: Requirements 1.10**

### Property 5: Course Creation Success

*For any* valid course creation request from an authenticated trainer, the API should create a course record in the database and return a 201 status code with the course data including id, title, description, and created_at.

**Validates: Requirements 1.2, 1.7**

### Property 6: Submission Grading Input Validation

*For any* submission grading request, if the grade is less than 0 or exceeds 100, or if the feedback is less than 10 characters, the API should return a 400 status code with a validation error message.

**Validates: Requirements 2.3, 2.4, 2.5**

### Property 7: Submission Grading Resource Validation

*For any* submission grading request with a non-existent submission ID, the API should return a 404 status code with a not found error message.

**Validates: Requirements 2.6, 2.7**

### Property 8: Submission Grading Authorization

*For any* authenticated trainer attempting to grade a submission for an assignment they do not own, the API should return a 403 status code with an unauthorized error message.

**Validates: Requirements 2.9**

### Property 9: Submission Grading Success

*For any* valid grading request from an authenticated trainer who owns the assignment, the API should update the submission record with the grade, feedback, and graded_at timestamp, and return a 200 status code with the updated submission data.

**Validates: Requirements 2.2, 2.10**

### Property 10: Assignment Edit Input Validation

*For any* assignment edit request, if no fields are provided, or if the title is provided and less than 3 characters, or if the description is provided and less than 10 characters, or if the dueDate is provided and not a valid ISO 8601 date string, the API should return a 400 status code with a validation error message.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 11: Assignment Edit Resource Validation

*For any* assignment edit request with a non-existent assignment ID, the API should return a 404 status code with a not found error message.

**Validates: Requirements 3.6, 3.7**

### Property 12: Assignment Edit Authorization

*For any* authenticated user without the trainer role, or any authenticated trainer attempting to edit an assignment they do not own, the API should return a 403 status code with a forbidden error message.

**Validates: Requirements 3.9, 3.13**

### Property 13: Assignment Edit Success

*For any* valid assignment edit request from an authenticated trainer who owns the assignment, the API should update the assignment record with the provided fields and return a 200 status code with the updated assignment data.

**Validates: Requirements 3.10**

## Error Handling

### Error Types and HTTP Status Codes

The implementation uses existing error classes from `backend/src/utils/errors.js`:

| Error Type | Status Code | Usage |
|------------|-------------|-------|
| BadRequestError | 400 | Invalid input, validation failures |
| UnauthorizedError | 401 | Missing or invalid authentication token |
| ForbiddenError | 403 | Insufficient permissions (wrong role or not resource owner) |
| NotFoundError | 404 | Resource not found (course, assignment, submission) |
| InternalServerError | 500 | Unexpected server errors |

### Error Response Format

All errors follow the standard format:
```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": "Error type name"
}
```

### Validation Error Handling

**Course Creation Validation:**
- Missing title or description → 400 BadRequestError
- Title < 3 or > 100 characters → 400 BadRequestError
- Description < 10 or > 500 characters → 400 BadRequestError

**Submission Grading Validation:**
- Missing grade or feedback → 400 BadRequestError
- Grade < 0 or > 100 → 400 BadRequestError
- Feedback < 10 characters → 400 BadRequestError
- Submission not found → 404 NotFoundError
- Trainer doesn't own assignment → 403 ForbiddenError

**Assignment Edit Validation:**
- No fields provided → 400 BadRequestError
- Title provided and < 3 characters → 400 BadRequestError
- Description provided and < 10 characters → 400 BadRequestError
- Invalid ISO 8601 date format → 400 BadRequestError
- Assignment not found → 404 NotFoundError
- Trainer doesn't own assignment → 403 ForbiddenError

### Authorization Error Handling

**Authentication Errors (401):**
- No Authorization header
- Invalid Bearer token format
- Expired JWT token
- Invalid JWT signature

**Authorization Errors (403):**
- User role is not 'trainer'
- Trainer attempting to grade submission for assignment they don't own
- Trainer attempting to edit assignment they don't own

### Database Error Handling

All database errors are caught and logged without exposing sensitive details:
```javascript
try {
  // Database operation
} catch (error) {
  logger.error('Database error:', error);
  throw new BadRequestError('Failed to perform operation');
}
```

### Logging Strategy

Following Requirement 4, all operations are logged:

**Success Logging:**
```javascript
logger.info(`Course created: ${courseId} by trainer ${trainerId}`);
logger.info(`Submission ${submissionId} graded by trainer ${trainerId}`);
logger.info(`Assignment ${assignmentId} updated by trainer ${trainerId}`);
```

**Error Logging:**
```javascript
logger.error('Error creating course:', error);
logger.warn(`Unauthorized grading attempt by trainer ${trainerId} for submission ${submissionId}`);
```

## Testing Strategy

### Dual Testing Approach

The implementation requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples of successful operations
- Edge cases (empty strings, boundary values)
- Error conditions (missing auth, wrong role, non-existent resources)
- Integration points between layers

**Property-Based Tests:**
- Universal properties across all inputs
- Validation rules with randomized inputs
- Authorization checks with various user roles
- Response format consistency

### Property-Based Testing Configuration

**Library:** [fast-check](https://github.com/dubzzz/fast-check) for JavaScript/Node.js

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: trainer-backend-endpoints, Property {number}: {property_text}`

**Example Property Test Structure:**
```javascript
describe('Feature: trainer-backend-endpoints, Property 3: Course Creation Input Validation', () => {
  it('should reject courses with invalid title or description lengths', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.oneof(
            fc.string({ maxLength: 2 }),  // Too short
            fc.string({ minLength: 101 }) // Too long
          ),
          description: fc.string({ minLength: 10, maxLength: 500 })
        }),
        async (courseData) => {
          const response = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${trainerToken}`)
            .send(courseData);
          
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**Course Creation Tests:**
- ✓ Create course with valid data (trainer role)
- ✓ Reject course creation without authentication
- ✓ Reject course creation with student role
- ✓ Reject course with title too short (2 chars)
- ✓ Reject course with title too long (101 chars)
- ✓ Reject course with description too short (9 chars)
- ✓ Reject course with description too long (501 chars)
- ✓ Reject course with missing title
- ✓ Reject course with missing description

**Submission Grading Tests:**
- ✓ Grade submission with valid data (trainer owns assignment)
- ✓ Reject grading without authentication
- ✓ Reject grading with student role
- ✓ Reject grading with grade < 0
- ✓ Reject grading with grade > 100
- ✓ Reject grading with feedback too short (9 chars)
- ✓ Reject grading non-existent submission
- ✓ Reject grading submission for assignment trainer doesn't own
- ✓ Reject grading with missing grade
- ✓ Reject grading with missing feedback

**Assignment Edit Tests:**
- ✓ Edit assignment with valid data (trainer owns assignment)
- ✓ Reject edit without authentication
- ✓ Reject edit with student role
- ✓ Reject edit with no fields provided
- ✓ Reject edit with title too short (2 chars)
- ✓ Reject edit with description too short (9 chars)
- ✓ Reject edit with invalid date format
- ✓ Reject edit of non-existent assignment
- ✓ Reject edit of assignment trainer doesn't own
- ✓ Edit only title (partial update)
- ✓ Edit only description (partial update)
- ✓ Edit only dueDate (partial update)
- ✓ Edit multiple fields simultaneously

### Integration Testing

**Test Database Setup:**
- Use Supabase test instance or local PostgreSQL
- Seed test data (users, courses, assignments, submissions)
- Clean up after each test suite

**Test User Setup:**
```javascript
const trainerUser = {
  email: 'trainer@test.com',
  role: 'trainer',
  token: '<jwt_token>'
};

const studentUser = {
  email: 'student@test.com',
  role: 'student',
  token: '<jwt_token>'
};
```

### Test Execution

**Run all tests:**
```bash
npm test
```

**Run specific test suite:**
```bash
npm test -- courseController.test.js
```

**Run with coverage:**
```bash
npm test -- --coverage
```

**Target Coverage:**
- Line coverage: > 80%
- Branch coverage: > 75%
- Function coverage: > 80%
