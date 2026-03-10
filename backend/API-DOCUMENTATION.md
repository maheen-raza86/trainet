# TRAINET Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

Get the access token by logging in via `POST /api/auth/login`.

---

## Endpoints

### 🔓 Public Endpoints (No Authentication Required)

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "TRAINET API is running",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development",
    "version": "1.0.0"
  }
}
```

---

### 🔐 Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Roles:** `student`, `trainer`, `alumni`, `recruiter`, `admin`

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

**Note:** A verification email will be sent to the provided email address. The user must verify their email before they can log in.

#### Verify Email
```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "student@example.com"
  }
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `400` - Email already verified

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `401` - Email not verified (must verify email first)

---

### 👤 User Endpoints

#### Get Current User
```http
GET /api/users/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }
}
```

---

### 📚 Course Endpoints

#### Get All Courses
```http
GET /api/courses
```

**Response (200):**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "courses": [
      {
        "id": "uuid",
        "title": "Linux System Administration",
        "description": "Learn Linux fundamentals",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "count": 1
  }
}
```

#### Get Course by ID
```http
GET /api/courses/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "Linux System Administration",
    "description": "Learn Linux fundamentals",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Enroll in Course
```http
POST /api/courses/enroll
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "courseId": "course-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "id": "enrollment-uuid",
    "student_id": "user-uuid",
    "course_id": "course-uuid",
    "status": "active",
    "progress": 0,
    "enrolled_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error (409 Conflict):**
```json
{
  "success": false,
  "message": "Student is already enrolled in this course",
  "error": "Conflict"
}
```

#### Get My Enrolled Courses
```http
GET /api/courses/my-courses
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Enrolled courses retrieved successfully",
  "data": {
    "enrollments": [
      {
        "id": "enrollment-uuid",
        "student_id": "user-uuid",
        "course_id": "course-uuid",
        "status": "active",
        "progress": 25,
        "enrolled_at": "2024-01-01T00:00:00Z",
        "courses": {
          "id": "course-uuid",
          "title": "Linux System Administration",
          "description": "Learn Linux fundamentals"
        }
      }
    ],
    "count": 1
  }
}
```

---

### 📝 Assignment Endpoints

#### Create Assignment (Trainer Only)
```http
POST /api/assignments
```

**Headers:**
```
Authorization: Bearer <trainer_access_token>
```

**Request Body:**
```json
{
  "title": "Linux Hardening Task",
  "description": "Secure an Ubuntu server following best practices",
  "courseId": "course-uuid",
  "dueDate": "2026-05-01T23:59:59Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": "assignment-uuid",
    "course_id": "course-uuid",
    "trainer_id": "trainer-uuid",
    "title": "Linux Hardening Task",
    "description": "Secure an Ubuntu server following best practices",
    "due_date": "2026-05-01T23:59:59Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "Only trainers can create assignments",
  "error": "Forbidden"
}
```

#### Get Assignments for Course
```http
GET /api/assignments/course/:courseId
```

**Response (200):**
```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "data": {
    "assignments": [
      {
        "id": "assignment-uuid",
        "course_id": "course-uuid",
        "trainer_id": "trainer-uuid",
        "title": "Linux Hardening Task",
        "description": "Secure an Ubuntu server",
        "due_date": "2026-05-01T23:59:59Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### 📤 Submission Endpoints

#### Submit Assignment (Student Only)
```http
POST /api/submissions
```

**Headers:**
```
Authorization: Bearer <student_access_token>
```

**Request Body:**
```json
{
  "assignmentId": "assignment-uuid",
  "attachmentUrl": "https://github.com/student/linux-hardening"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Assignment submitted successfully",
  "data": {
    "id": "submission-uuid",
    "assignment_id": "assignment-uuid",
    "student_id": "student-uuid",
    "attachment_url": "https://github.com/student/linux-hardening",
    "status": "submitted",
    "submitted_at": "2024-01-01T00:00:00Z",
    "grade": null,
    "feedback": null
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "You must be enrolled in the course to submit this assignment",
  "error": "Bad Request"
}
```

**Error (409 Conflict):**
```json
{
  "success": false,
  "message": "You have already submitted this assignment",
  "error": "Conflict"
}
```

**Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "Only students can submit assignments",
  "error": "Forbidden"
}
```

#### Get Submissions for Assignment (Trainer Only)
```http
GET /api/submissions/assignment/:assignmentId
```

**Headers:**
```
Authorization: Bearer <trainer_access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "id": "submission-uuid",
        "assignment_id": "assignment-uuid",
        "student_id": "student-uuid",
        "attachment_url": "https://github.com/student/repo",
        "status": "submitted",
        "submitted_at": "2024-01-01T00:00:00Z",
        "grade": null,
        "feedback": null,
        "profiles": {
          "id": "student-uuid",
          "email": "student@example.com",
          "first_name": "John",
          "last_name": "Doe"
        }
      }
    ],
    "count": 1
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "You are not authorized to view submissions for this assignment",
  "error": "Unauthorized"
}
```

**Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "Only trainers can view assignment submissions",
  "error": "Forbidden"
}
```

#### Get My Submissions (Student)
```http
GET /api/submissions/my
```

**Headers:**
```
Authorization: Bearer <student_access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Your submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "id": "submission-uuid",
        "assignment_id": "assignment-uuid",
        "student_id": "student-uuid",
        "attachment_url": "https://github.com/student/repo",
        "status": "submitted",
        "submitted_at": "2024-01-01T00:00:00Z",
        "grade": 85,
        "feedback": "Good work!",
        "assignments": {
          "id": "assignment-uuid",
          "title": "Linux Hardening Task",
          "description": "Secure an Ubuntu server",
          "due_date": "2026-05-01T23:59:59Z",
          "course_id": "course-uuid"
        }
      }
    ],
    "count": 1
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists",
  "error": "Conflict"
}
```

---

## Complete API Flow Examples

### Example 1: Student Workflow

```bash
# 1. Sign up as student
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 3. View available courses
curl http://localhost:5000/api/courses

# 4. Enroll in a course
curl -X POST http://localhost:5000/api/courses/enroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"<course-uuid>"}'

# 5. View my enrolled courses
curl http://localhost:5000/api/courses/my-courses \
  -H "Authorization: Bearer $TOKEN"

# 6. View assignments for a course
curl http://localhost:5000/api/assignments/course/<course-uuid>

# 7. Submit an assignment
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId":"<assignment-uuid>",
    "attachmentUrl":"https://github.com/student/project"
  }'

# 8. View my submissions
curl http://localhost:5000/api/submissions/my \
  -H "Authorization: Bearer $TOKEN"
```

### Example 2: Trainer Workflow

```bash
# 1. Sign up as trainer
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "trainer"
  }'

# 2. Login
TRAINER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 3. Create an assignment
curl -X POST http://localhost:5000/api/assignments \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Linux Hardening Task",
    "description": "Secure an Ubuntu server",
    "courseId": "<course-uuid>",
    "dueDate": "2026-05-01T23:59:59Z"
  }'

# 4. View submissions for an assignment
curl http://localhost:5000/api/submissions/assignment/<assignment-uuid> \
  -H "Authorization: Bearer $TRAINER_TOKEN"
```

---

## Authorization Matrix

| Endpoint | Public | Student | Trainer | Admin |
|----------|--------|---------|---------|-------|
| POST /api/auth/signup | ✅ | ✅ | ✅ | ✅ |
| POST /api/auth/login | ✅ | ✅ | ✅ | ✅ |
| GET /api/users/me | ❌ | ✅ | ✅ | ✅ |
| GET /api/courses | ✅ | ✅ | ✅ | ✅ |
| GET /api/courses/:id | ✅ | ✅ | ✅ | ✅ |
| POST /api/courses/enroll | ❌ | ✅ | ✅ | ✅ |
| GET /api/courses/my-courses | ❌ | ✅ | ✅ | ✅ |
| POST /api/assignments | ❌ | ❌ | ✅ | ✅ |
| GET /api/assignments/course/:courseId | ✅ | ✅ | ✅ | ✅ |
| POST /api/submissions | ❌ | ✅ | ❌ | ❌ |
| GET /api/submissions/assignment/:id | ❌ | ❌ | ✅ | ✅ |
| GET /api/submissions/my | ❌ | ✅ | ❌ | ❌ |

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes
- **Authentication endpoints:** 5 requests per 15 minutes

---

## Database Tables

### profiles
- `id` (uuid, primary key)
- `email` (text, unique)
- `first_name` (text)
- `last_name` (text)
- `role` (text: student, trainer, admin)
- `avatar` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### courses
- `id` (uuid, primary key)
- `title` (text)
- `description` (text)
- `created_at` (timestamp)

### enrollments
- `id` (uuid, primary key)
- `student_id` (uuid, foreign key → profiles.id)
- `course_id` (uuid, foreign key → courses.id)
- `status` (text)
- `progress` (integer)
- `enrolled_at` (timestamp)

### assignments
- `id` (uuid, primary key)
- `course_id` (uuid, foreign key → courses.id)
- `trainer_id` (uuid, foreign key → profiles.id)
- `title` (text)
- `description` (text)
- `due_date` (timestamp)
- `created_at` (timestamp)

### submissions
- `id` (uuid, primary key)
- `assignment_id` (uuid, foreign key → assignments.id)
- `student_id` (uuid, foreign key → profiles.id)
- `attachment_url` (text)
- `status` (text)
- `submitted_at` (timestamp)
- `grade` (integer, nullable)
- `feedback` (text, nullable)

---

## Testing with Postman

1. **Import Environment Variables:**
   - `BASE_URL`: `http://localhost:5000/api`
   - `STUDENT_TOKEN`: (set after login)
   - `TRAINER_TOKEN`: (set after login)

2. **Create Collections:**
   - Authentication
   - Users
   - Courses
   - Assignments
   - Submissions

3. **Test Flow:**
   - Sign up users (student and trainer)
   - Login and save tokens
   - Test protected endpoints with tokens
   - Test role restrictions

---

## Common Issues

**"No token provided"**
- Ensure Authorization header is present
- Format: `Authorization: Bearer <token>`

**"Invalid or expired token"**
- Token might have expired
- Login again to get a fresh token

**"Only trainers can create assignments"**
- User role must be 'trainer'
- Check user profile: `GET /api/users/me`

**"Only students can submit assignments"**
- User role must be 'student'
- Trainers cannot submit assignments

**"You must be enrolled in the course"**
- Student must enroll first: `POST /api/courses/enroll`
- Check enrollments: `GET /api/courses/my-courses`

**"You have already submitted this assignment"**
- Each student can only submit once per assignment
- Check existing submissions: `GET /api/submissions/my`

---

## Development

Start the server:
```bash
cd backend
npm run dev
```

Run tests:
```bash
npm test
```

Lint code:
```bash
npm run lint
```

Format code:
```bash
npm run format
```
