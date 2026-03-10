# Enrollment API Implementation

## ✅ Implementation Complete

### Files Created

#### Service Layer
1. **`src/services/enrollmentService.js`**
   - `enrollStudent(studentId, courseId)` - Enroll student in course
   - `getStudentEnrollments(studentId)` - Get student's enrollments

#### Controller Layer
2. **`src/controllers/enrollmentController.js`**
   - `enrollInCourse()` - POST /api/enrollments
   - `getMyEnrollments()` - GET /api/enrollments/my

#### Routes
3. **`src/routes/enrollmentRoutes.js`**
   - Enrollment route definitions

#### Updates
4. **`src/routes/index.js`** - Registered enrollment routes

---

## API Endpoints Summary

### Enrollments

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/enrollments | ✅ | Student | Enroll in course |
| GET | /api/enrollments/my | ✅ | Any | Get my enrollments |

---

## Business Logic Implemented

### Enroll in Course (Student)
1. ✅ Verify user is authenticated
2. ✅ Verify user role is 'student'
3. ✅ Validate courseId is provided
4. ✅ Verify course exists
5. ✅ Check for duplicate enrollment
6. ✅ Insert enrollment into database
7. ✅ Log enrollment event
8. ✅ Return created enrollment

### Get My Enrollments
1. ✅ Verify user is authenticated
2. ✅ Fetch enrollments for authenticated user
3. ✅ Include course details
4. ✅ Return enrollments ordered by creation date

---

## API Documentation

### Enroll in Course

**Endpoint:** `POST /api/enrollments`

**Authentication:** Required (Bearer token)

**Authorization:** Student only

**Request Body:**
```json
{
  "courseId": "course-uuid"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "id": "enrollment-uuid",
    "student_id": "student-uuid",
    "course_id": "course-uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing courseId:**
```json
{
  "success": false,
  "message": "Course ID is required",
  "error": "Validation Error"
}
```

**403 Forbidden - Not a student:**
```json
{
  "success": false,
  "message": "Only students can enroll in courses",
  "error": "Forbidden"
}
```

**404 Not Found - Course doesn't exist:**
```json
{
  "success": false,
  "message": "Course not found",
  "error": "Not Found"
}
```

**409 Conflict - Already enrolled:**
```json
{
  "success": false,
  "message": "Already enrolled in this course",
  "error": "Conflict"
}
```

---

### Get My Enrollments

**Endpoint:** `GET /api/enrollments/my`

**Authentication:** Required (Bearer token)

**Authorization:** Any authenticated user

**Success Response (200):**
```json
{
  "success": true,
  "message": "Enrollments retrieved successfully",
  "data": {
    "enrollments": [
      {
        "id": "enrollment-uuid",
        "student_id": "student-uuid",
        "course_id": "course-uuid",
        "created_at": "2024-01-01T00:00:00Z",
        "courses": {
          "id": "course-uuid",
          "title": "Linux System Administration",
          "description": "Learn Linux fundamentals",
          "created_at": "2024-01-01T00:00:00Z"
        }
      }
    ],
    "count": 1
  }
}
```

---

## Testing Instructions

### Prerequisites
1. Backend server running: `npm run dev`
2. Database tables created in Supabase
3. At least one course exists in the database
4. Student account created

### Manual Testing

#### 1. Create Student Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'
```

#### 2. Login as Student
```bash
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

echo "Student Token: $STUDENT_TOKEN"
```

#### 3. Get Available Courses
```bash
curl http://localhost:5000/api/courses | jq
```

#### 4. Enroll in Course
```bash
# Replace <COURSE_UUID> with actual course ID
curl -X POST http://localhost:5000/api/enrollments \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "<COURSE_UUID>"
  }' | jq
```

#### 5. Get My Enrollments
```bash
curl http://localhost:5000/api/enrollments/my \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```

#### 6. Test Duplicate Enrollment (Should Fail)
```bash
# Try to enroll in same course again
curl -X POST http://localhost:5000/api/enrollments \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "<COURSE_UUID>"
  }' | jq
```

#### 7. Test Trainer Enrollment (Should Fail)
```bash
# Login as trainer
TRAINER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# Try to enroll (should fail)
curl -X POST http://localhost:5000/api/enrollments \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "<COURSE_UUID>"
  }' | jq
```

---

## Database Schema

### enrollments table
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);
```

**Key Constraints:**
- `student_id` must reference a valid profile
- `course_id` must reference a valid course
- `UNIQUE(student_id, course_id)` prevents duplicate enrollments

---

## Security & Validation

### Authentication
- ✅ All endpoints use `verifyToken` middleware
- ✅ JWT token verified with Supabase
- ✅ User profile fetched and attached to request

### Authorization
- ✅ Only students can enroll in courses
- ✅ Any authenticated user can view their own enrollments

### Validation
- ✅ Required field validation (courseId)
- ✅ Course existence check
- ✅ Duplicate enrollment prevention
- ✅ Role-based access control

### Error Handling
- ✅ 400 Bad Request - Missing fields, validation errors
- ✅ 403 Forbidden - Wrong role
- ✅ 404 Not Found - Course not found
- ✅ 409 Conflict - Already enrolled

---

## Expected Workflow

### Student Workflow
1. Login → Get access token
2. View available courses
3. Enroll in a course
4. View enrolled courses
5. Access course materials and assignments

---

## Response Format

All responses follow the standard format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error Type"
}
```

---

## What Was NOT Modified

✅ No changes to authentication system
✅ No changes to existing middleware
✅ No changes to course service
✅ No changes to assignment/submission APIs
✅ No changes to database schema
✅ No changes to server configuration

---

## Logging

All operations are logged:
- ✅ Enrollment creation
- ✅ Error conditions
- ✅ Authorization failures

Check logs in `backend/logs/` directory.

---

## Integration with Existing APIs

### Course API
- Students can view courses: `GET /api/courses`
- Students can view course details: `GET /api/courses/:id`

### Assignment API
- Students can view course assignments: `GET /api/assignments/course/:courseId`
- Students can submit assignments (requires enrollment): `POST /api/submissions`

### Submission API
- Submission validation checks enrollment status
- Students can only submit assignments for enrolled courses

---

## Quick Reference

### Enroll in Course
```bash
POST /api/enrollments
Headers: Authorization: Bearer <student_token>
Body: { "courseId": "uuid" }
```

### Get My Enrollments
```bash
GET /api/enrollments/my
Headers: Authorization: Bearer <token>
```

---

## Common Issues

**"Only students can enroll in courses"**
- User role must be 'student'
- Trainers and admins cannot enroll
- Check user profile: `GET /api/users/me`

**"Already enrolled in this course"**
- Each student can only enroll once per course
- Check existing enrollments: `GET /api/enrollments/my`

**"Course not found"**
- Verify the course ID is correct
- Check available courses: `GET /api/courses`

**"Course ID is required"**
- Ensure request body includes `courseId` field
- Verify JSON format is correct

---

## Status

✅ **Implementation Complete**
- Service layer created
- Controller layer created
- Routes configured
- Registered in main router
- No syntax errors
- Ready for testing

**Version:** 1.4.0
**Date:** Enrollment API implemented
**Impact:** New enrollment endpoints available
