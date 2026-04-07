# Manual Testing Guide for TRAINET Trainer Endpoints

## Prerequisites
1. Backend server running on http://localhost:5000
2. Test users created (wait for rate limit to reset)

## Step 1: Create Test Users (Run when rate limit resets)

```bash
# Create trainer user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Trainer", 
    "role": "trainer"
  }'

# Create student user  
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Student",
    "role": "student"
  }'
```

## Step 2: Login and Get Tokens

```bash
# Login as trainer
TRAINER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

echo "Trainer token: $TRAINER_TOKEN"

# Login as student
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

echo "Student token: $STUDENT_TOKEN"
```

## Step 3: Test CREATE COURSE

```bash
# Test create course (should work)
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Linux Security Fundamentals",
    "description": "Learn Linux system hardening techniques and best practices"
  }'
```

Expected: Status 201, success: true, course data returned

## Step 4: Test GET COURSES

```bash
# Get all courses (public endpoint)
curl http://localhost:5000/api/courses
```

Expected: Status 200, list of courses including the one just created

## Step 5: Test CREATE ASSIGNMENT

```bash
# First get the course ID from step 3 response, then:
COURSE_ID="<course-id-from-step-3>"

curl -X POST http://localhost:5000/api/courses/$COURSE_ID/assignments \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Linux Hardening Task",
    "description": "Secure an Ubuntu server following best practices",
    "dueDate": "2026-05-01T23:59:59Z",
    "maxScore": 100
  }'
```

Expected: Status 201, assignment created

## Step 6: Test ENROLL STUDENT

```bash
# Enroll student in course
curl -X POST http://localhost:5000/api/courses/enroll \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "'$COURSE_ID'"}'
```

## Step 7: Test SUBMIT ASSIGNMENT

```bash
# Get assignment ID from step 5, then:
ASSIGNMENT_ID="<assignment-id-from-step-5>"

curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "'$ASSIGNMENT_ID'",
    "attachmentUrl": "https://github.com/student/linux-hardening-project"
  }'
```

## Step 8: Test GET SUBMISSIONS

```bash
# Get submissions for assignment (trainer only)
curl http://localhost:5000/api/submissions/assignment/$ASSIGNMENT_ID \
  -H "Authorization: Bearer $TRAINER_TOKEN"
```

## Step 9: Test GRADE SUBMISSION

```bash
# Get submission ID from step 7, then:
SUBMISSION_ID="<submission-id-from-step-7>"

curl -X PUT http://localhost:5000/api/submissions/$SUBMISSION_ID/grade \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": 85,
    "feedback": "Good implementation, but improve code comments and documentation."
  }'
```

Expected: Status 200, submission updated with grade and feedback

## Validation Checklist

- [ ] ✅ CREATE COURSE - Status 201, course created
- [ ] ✅ GET COURSES - Status 200, course appears in list  
- [ ] ✅ CREATE ASSIGNMENT - Status 201, assignment created
- [ ] ✅ ENROLL STUDENT - Status 201, enrollment successful
- [ ] ✅ SUBMIT ASSIGNMENT - Status 201, submission created
- [ ] ✅ GET SUBMISSIONS - Status 200, submission appears
- [ ] ✅ GRADE SUBMISSION - Status 200, grade and feedback saved

## Current Status

✅ **Endpoints Implemented:**
- POST /api/courses (create course)
- PUT /api/submissions/:id/grade (grade submission)

✅ **Server Status:** Running successfully on port 5000

⏳ **Waiting for:** Rate limit reset to test with authentication

🧪 **Basic Tests Passed:**
- Health endpoint: ✅
- Courses endpoint: ✅ (5 existing courses)
- Authentication validation: ✅ (properly rejects without token)