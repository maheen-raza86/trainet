# TRAINET API Quick Reference - Course Offerings

## 🎓 Course Catalog & Offerings

### Get Course Catalog
```http
GET /api/courses/catalog
```
**Public** - Returns all courses available in the catalog

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "uuid",
        "title": "Cybersecurity",
        "description": "Learn security fundamentals"
      }
    ],
    "count": 5
  }
}
```

---

### Create Course Offering
```http
POST /api/course-offerings
Authorization: Bearer <trainer_token>
```
**Trainer Only** - Create a new course offering from catalog

**Request Body:**
```json
{
  "courseId": "uuid",
  "durationWeeks": 8,
  "hoursPerWeek": 4,
  "outline": "Comprehensive course covering...",
  "startDate": "2026-04-01T00:00:00Z",
  "endDate": "2026-05-27T23:59:59Z"
}
```

**Validation:**
- `durationWeeks`: Must be 4, 6, 8, or 12
- `hoursPerWeek`: Must be 1-10
- `outline`: Minimum 20 characters
- Trainer limit: Maximum 5 active offerings

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "course_id": "uuid",
    "trainer_id": "uuid",
    "duration_weeks": 8,
    "hours_per_week": 4,
    "outline": "...",
    "status": "open",
    "courses": {
      "title": "Cybersecurity"
    }
  }
}
```

---

### Get Trainer's Offerings
```http
GET /api/course-offerings/trainer
Authorization: Bearer <trainer_token>
```
**Trainer Only** - Get all offerings created by the trainer

**Response:**
```json
{
  "success": true,
  "data": {
    "offerings": [...],
    "count": 3
  }
}
```

---

### Update Course Offering
```http
PUT /api/course-offerings/:id
Authorization: Bearer <trainer_token>
```
**Trainer Only** - Update own course offering

**Request Body (all optional):**
```json
{
  "durationWeeks": 12,
  "hoursPerWeek": 5,
  "outline": "Updated outline...",
  "startDate": "2026-05-01T00:00:00Z",
  "endDate": "2026-07-27T23:59:59Z",
  "status": "closed"
}
```

**Note:** Cannot modify `course_id`

---

### Get Available Offerings
```http
GET /api/course-offerings/available
```
**Public** - Get all open course offerings

**Response:**
```json
{
  "success": true,
  "data": {
    "offerings": [
      {
        "id": "uuid",
        "duration_weeks": 8,
        "hours_per_week": 4,
        "outline": "...",
        "status": "open",
        "courses": {
          "title": "Cybersecurity"
        },
        "profiles": {
          "first_name": "Ahmed",
          "last_name": "Hassan"
        }
      }
    ],
    "count": 10
  }
}
```

---

### Enroll in Course Offering
```http
POST /api/course-offerings/enroll
Authorization: Bearer <student_token>
```
**Authenticated** - Enroll in a course offering

**Request Body:**
```json
{
  "offeringId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "offering_id": "uuid",
    "status": "active",
    "progress": 0
  }
}
```

---

## 👤 User Profile

### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```
**Authenticated** - Get current user's profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "bio": "...",
    "skills": "...",
    "portfolioUrl": "https://...",
    "emailVerified": true
  }
}
```

---

### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
```
**Authenticated** - Update own profile

**Request Body (all optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software developer...",
  "skills": "JavaScript, Python, Docker",
  "portfolioUrl": "https://johndoe.com"
}
```

---

### Change Password
```http
PUT /api/users/password
Authorization: Bearer <token>
```
**Authenticated** - Change password

**Request Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Validation:**
- `newPassword`: Minimum 8 characters
- `currentPassword`: Must be correct

---

## 🔑 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Get token from login:
```http
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## ⚠️ Error Responses

All endpoints return consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## 📊 Workflow Examples

### Trainer Creates Offering
```bash
# 1. Get catalog
GET /api/courses/catalog

# 2. Create offering
POST /api/course-offerings
{
  "courseId": "<from_catalog>",
  "durationWeeks": 8,
  "hoursPerWeek": 4,
  "outline": "..."
}

# 3. View my offerings
GET /api/course-offerings/trainer
```

### Student Enrolls
```bash
# 1. View available offerings
GET /api/course-offerings/available

# 2. Enroll
POST /api/course-offerings/enroll
{
  "offeringId": "<offering_id>"
}
```

---

## 🔗 Related Endpoints

**Assignments:**
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/course/:courseId` - Get course assignments

**Submissions:**
- `POST /api/submissions` - Submit assignment
- `GET /api/submissions/assignment/:assignmentId` - Get submissions
- `PUT /api/submissions/:id/grade` - Grade submission

---

**Base URL:** `http://localhost:5000/api`

**Documentation:** See `COURSE-OFFERINGS-REFACTOR-SUMMARY.md` for complete details
