# Assignments & Submissions Implementation

## ✅ Implementation Complete

### Files Created

#### Service Layer
1. **`src/services/assignmentService.js`**
   - `createAssignment(assignmentData)` - Create new assignment
   - `getAssignmentsByCourse(courseId)` - Get all assignments for a course
   - `getAssignmentById(assignmentId)` - Get single assignment

2. **`src/services/submissionService.js`**
   - `submitAssignment(submissionData)` - Submit assignment
   - `getSubmissionsByAssignment(assignmentId, trainerId)` - Get submissions (trainer only)
   - `getStudentSubmissions(studentId)` - Get student's submissions

#### Controller Layer
3. **`src/controllers/assignmentController.js`**
   - `createAssignment()` - POST /api/assignments
   - `getAssignmentsByCourse()` - GET /api/assignments/course/:courseId

4. **`src/controllers/submissionController.js`**
   - `submitAssignment()` - POST /api/submissions
   - `getSubmissionsByAssignment()` - GET /api/submissions/assignment/:assignmentId
   - `getMySubmissions()` - GET /api/submissions/my

#### Routes
5. **`src/routes/assignmentRoutes.js`**
   - Assignment route definitions

6. **`src/routes/submissionRoutes.js`**
   - Submission route definitions

#### Documentation
7. **`API-DOCUMENTATION.md`** - Complete API reference
8. **`test-assignments.sh`** - Testing script
9. **`ASSIGNMENTS-IMPLEMENTATION.md`** - This file

#### Updates
10. **`src/routes/index.js`** - Registered new routes

---

## API Endpoints Summary

### Assignments

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/assignments | ✅ | Trainer | Create assignment |
| GET | /api/assignments/course/:courseId | ❌ | - | Get course assignments |

### Submissions

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/submissions | ✅ | Student | Submit assignment |
| GET | /api/submissions/assignment/:assignmentId | ✅ | Trainer | View submissions |
| GET | /api/submissions/my | ✅ | Any | Get my submissions |

---

## Business Logic Implemented

### Assignment Creation (Trainer)
1. ✅ Verify user is authenticated
2. ✅ Verify user role is 'trainer'
3. ✅ Verify course exists
4. ✅ Validate required fields (title, description, courseId)
5. ✅ Insert assignment into database
6. ✅ Log creation event
7. ✅ Return created assignment

### Assignment Submission (Student)
1. ✅ Verify user is authenticated
2. ✅ Verify user role is 'student'
3. ✅ Verify assignment exists
4. ✅ Verify student is enrolled in the course
5. ✅ Check for duplicate submission
6. ✅ Validate required fields (assignmentId, attachmentUrl)
7. ✅ Insert submission into database
8. ✅ Log submission event
9. ✅ Return created submission

### View Submissions (Trainer)
1. ✅ Verify user is authenticated
2. ✅ Verify user role is 'trainer'
3. ✅ Verify assignment exists
4. ✅ Verify trainer owns the assignment
5. ✅ Fetch submissions with student profile data
6. ✅ Return submissions ordered by submission date

### View My Submissions (Student)
1. ✅ Verify user is authenticated
2. ✅ Fetch submissions for authenticated user
3. ✅ Include assignment details
4. ✅ Return submissions ordered by submission date

---

## Security & Validation

### Authentication
- ✅ All endpoints use `verifyToken` middleware
- ✅ JWT token verified with Supabase
- ✅ User profile fetched and attached to request

### Authorization
- ✅ Role-based access control
- ✅ Trainers can only create assignments
- ✅ Students can only submit assignments
- ✅ Trainers can only view their own assignment submissions

### Validation
- ✅ Required field validation
- ✅ Course existence check
- ✅ Assignment existence check
- ✅ Enrollment verification
- ✅ Duplicate submission prevention
- ✅ Trainer ownership verification

### Error Handling
- ✅ 400 Bad Request - Missing fields, validation errors
- ✅ 401 Unauthorized - Invalid token, not authorized
- ✅ 403 Forbidden - Wrong role
- ✅ 404 Not Found - Resource not found
- ✅ 409 Conflict - Duplicate submission

---

## Testing Instructions

### Prerequisites
1. Backend server running: `npm run dev`
2. Database tables created in Supabase
3. At least one course exists in the database

### Manual Testing

#### 1. Create Assignment (as Trainer)
```bash
# Login as trainer
TRAINER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# Create assignment
curl -X POST http://localhost:5000/api/assignments \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Linux Hardening Task",
    "description": "Secure an Ubuntu server",
    "courseId": "<COURSE_UUID>",
    "dueDate": "2026-05-01T23:59:59Z"
  }'
```

#### 2. View Course Assignments
```bash
curl http://localhost:5000/api/assignments/course/<COURSE_UUID>
```

#### 3. Enroll Student in Course
```bash
# Login as student
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# Enroll
curl -X POST http://localhost:5000/api/courses/enroll \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"<COURSE_UUID>"}'
```

#### 4. Submit Assignment (as Student)
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "<ASSIGNMENT_UUID>",
    "attachmentUrl": "https://github.com/student/linux-hardening"
  }'
```

#### 5. View My Submissions (as Student)
```bash
curl http://localhost:5000/api/submissions/my \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

#### 6. View Assignment Submissions (as Trainer)
```bash
curl http://localhost:5000/api/submissions/assignment/<ASSIGNMENT_UUID> \
  -H "Authorization: Bearer $TRAINER_TOKEN"
```

### Automated Testing

```bash
chmod +x test-assignments.sh
./test-assignments.sh
```

---

## Expected Workflow

### Trainer Workflow
1. Login → Get access token
2. Create assignment for a course
3. View submissions from students
4. Grade submissions (future phase)

### Student Workflow
1. Login → Get access token
2. View available courses
3. Enroll in a course
4. View course assignments
5. Submit assignment
6. View own submissions and grades

---

## Database Relationships

```
profiles (users)
    ↓
assignments ← created by trainer
    ↓
submissions ← submitted by student
    ↓
enrollments ← student must be enrolled
```

**Key Constraints:**
- Assignment must belong to a course
- Submission must reference valid assignment
- Student must be enrolled in course to submit
- Each student can submit only once per assignment
- Only assignment creator (trainer) can view submissions

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
✅ No changes to database schema  
✅ No changes to server configuration  

---

## Logging

All operations are logged:
- ✅ Assignment creation
- ✅ Assignment submission
- ✅ Error conditions
- ✅ Authorization failures

Check logs in `backend/logs/` directory.

---

## Next Steps

**Suggested Phase 5: Grading System**
- Trainer grades submissions
- Add feedback to submissions
- Update submission status
- Notify students of grades

**Suggested Phase 6: Course Materials**
- Upload course materials
- Download materials
- Organize by modules/lessons

---

## Quick Reference

### Create Assignment
```bash
POST /api/assignments
Headers: Authorization: Bearer <trainer_token>
Body: { title, description, courseId, dueDate }
```

### Submit Assignment
```bash
POST /api/submissions
Headers: Authorization: Bearer <student_token>
Body: { assignmentId, attachmentUrl }
```

### View Submissions
```bash
GET /api/submissions/assignment/:assignmentId
Headers: Authorization: Bearer <trainer_token>
```

### View My Submissions
```bash
GET /api/submissions/my
Headers: Authorization: Bearer <student_token>
```

---

**Status:** ✅ Ready for Testing  
**Version:** 1.0.0  
**Last Updated:** Phase 4 Complete
