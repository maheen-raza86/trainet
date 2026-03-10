# TRAINET Backend - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
The `.env` file is already configured with Supabase credentials.

### 3. Database Setup
Run this SQL in Supabase SQL Editor:

```sql
-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'trainer', 'admin')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table (if not exists)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table (if not exists)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create assignments table (if not exists)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table (if not exists)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  attachment_url TEXT NOT NULL,
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grade INTEGER,
  feedback TEXT,
  UNIQUE(assignment_id, student_id)
);

-- Insert sample course
INSERT INTO courses (title, description) VALUES
  ('Linux System Administration', 'Learn Linux fundamentals and system administration')
ON CONFLICT DO NOTHING;
```

### 4. Start Server
```bash
npm run dev
```

Server starts on `http://localhost:5000`

---

## 📋 Complete Test Flow

### Step 1: Create Trainer Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Trainer",
    "role": "trainer"
  }'
```

### Step 2: Create Student Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Student",
    "role": "student"
  }'
```

### Step 3: Login as Trainer
```bash
TRAINER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

echo "Trainer Token: $TRAINER_TOKEN"
```

### Step 4: Login as Student
```bash
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

echo "Student Token: $STUDENT_TOKEN"
```

### Step 5: Get Course ID
```bash
COURSE_ID=$(curl -s http://localhost:5000/api/courses | jq -r '.data.courses[0].id')
echo "Course ID: $COURSE_ID"
```

### Step 6: Trainer Creates Assignment
```bash
ASSIGNMENT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/assignments \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Linux Hardening Task\",
    \"description\": \"Secure an Ubuntu server\",
    \"courseId\": \"$COURSE_ID\",
    \"dueDate\": \"2026-05-01T23:59:59Z\"
  }")

echo $ASSIGNMENT_RESPONSE | jq

ASSIGNMENT_ID=$(echo $ASSIGNMENT_RESPONSE | jq -r '.data.id')
echo "Assignment ID: $ASSIGNMENT_ID"
```

### Step 7: Student Enrolls in Course
```bash
curl -X POST http://localhost:5000/api/courses/enroll \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"courseId\": \"$COURSE_ID\"}" | jq
```

### Step 8: Student Submits Assignment
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"assignmentId\": \"$ASSIGNMENT_ID\",
    \"attachmentUrl\": \"https://github.com/student/linux-hardening\"
  }" | jq
```

### Step 9: Trainer Views Submissions
```bash
curl http://localhost:5000/api/submissions/assignment/$ASSIGNMENT_ID \
  -H "Authorization: Bearer $TRAINER_TOKEN" | jq
```

### Step 10: Student Views Own Submissions
```bash
curl http://localhost:5000/api/submissions/my \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```

---

## 🎯 All Available Endpoints

### Authentication (Public)
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login

### Users (Protected)
- `GET /api/users/me` - Get current user

### Courses
- `GET /api/courses` - List all courses (public)
- `GET /api/courses/:id` - Get course details (public)
- `POST /api/courses/enroll` - Enroll in course (protected)
- `GET /api/courses/my-courses` - Get enrolled courses (protected)

### Assignments
- `POST /api/assignments` - Create assignment (trainer only)
- `GET /api/assignments/course/:courseId` - Get course assignments (public)

### Submissions
- `POST /api/submissions` - Submit assignment (student only)
- `GET /api/submissions/assignment/:assignmentId` - View submissions (trainer only)
- `GET /api/submissions/my` - View my submissions (protected)

---

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <process_id> /F

# Or use different port in .env
PORT=5001
```

### "Missing Supabase configuration"
- Check `.env` file exists
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### "Course not found"
- Run the SQL to insert sample course
- Or create course manually in Supabase dashboard

### "You must be enrolled in the course"
- Student must enroll first: `POST /api/courses/enroll`
- Verify enrollment: `GET /api/courses/my-courses`

### "Only trainers can create assignments"
- User role must be 'trainer'
- Check role: `GET /api/users/me`
- Sign up with role: 'trainer'

### "Only students can submit assignments"
- User role must be 'student'
- Trainers cannot submit assignments

---

## 📊 Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ | Backend initialization |
| Phase 2 | ✅ | Supabase integration & auth |
| Phase 3 | ✅ | Auth middleware & protected routes |
| Phase 4 | ✅ | Assignments & submissions API |
| Phase 5 | ⏳ | Grading system (future) |
| Phase 6 | ⏳ | Course materials (future) |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   ├── cors.js
│   │   ├── supabaseClient.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── courseController.js
│   │   ├── assignmentController.js
│   │   └── submissionController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── courseService.js
│   │   ├── assignmentService.js
│   │   └── submissionService.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── loggingMiddleware.js
│   │   ├── rateLimitMiddleware.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── submissionRoutes.js
│   │   └── index.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── errors.js
│   ├── app.js
│   └── server.js
├── logs/
├── .env
├── package.json
└── README.md
```

---

## 🎓 Graduate-Level Features

✅ MVC Architecture  
✅ Service Layer Pattern  
✅ Middleware Pipeline  
✅ JWT Authentication  
✅ Role-Based Access Control  
✅ Error Handling  
✅ Logging  
✅ Rate Limiting  
✅ Security Headers  
✅ CORS Configuration  
✅ Environment Configuration  
✅ ES Modules  
✅ RESTful API Design  

---

**Ready to use!** 🎉
