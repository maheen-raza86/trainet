# TRAINET Frontend - Implementation Scope (Phase 1)

## Current Backend API Support

Based on the existing backend implementation, the following APIs are available:

### ✅ Authentication APIs
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/verify-email
- GET /api/users/me
- PUT /api/users/profile

### ✅ Course APIs
- GET /api/courses
- GET /api/courses/:id
- POST /api/courses (trainer only)
- PUT /api/courses/:id (trainer only)
- DELETE /api/courses/:id (trainer only)

### ✅ Enrollment APIs
- POST /api/enrollments
- GET /api/enrollments/my
- GET /api/enroll/qr/:token

### ✅ Assignment APIs
- GET /api/assignments/course/:courseId
- POST /api/assignments (trainer only)
- PUT /api/assignments/:id (trainer only)
- DELETE /api/assignments/:id (trainer only)

### ✅ Submission APIs
- POST /api/submissions
- GET /api/submissions/assignment/:assignmentId
- PUT /api/submissions/:id/grade (trainer only)

## Implementation Scope - Phase 1

### Module 1: Authentication UI ✅
**Pages to Implement:**
1. Landing Page
2. Signup Page
3. Login Page
4. Email Verification Page
5. Forgot Password Page (UI only, backend may not be ready)
6. Reset Password Page (UI only, backend may not be ready)

**Components:**
- LoginForm
- SignupForm
- AuthLayout
- Hero Section
- Features Section

### Module 2: Student Portal ✅
**Pages to Implement:**
1. Student Dashboard
2. Course List Page
3. Course Details Page
4. Assignments Page
5. Assignment Submission Page
6. Student Profile Page

**Components:**
- CourseCard
- AssignmentCard
- SubmissionForm
- DashboardLayout
- Sidebar (Student)
- Navbar

### Module 3: Trainer Portal ✅
**Pages to Implement:**
1. Trainer Dashboard
2. Course Management Page (List, Create, Edit)
3. Assignment Management Page (List, Create, Edit)
4. Submissions Review Page
5. Grading Interface
6. Trainer Profile Page

**Components:**
- CourseForm
- AssignmentForm
- SubmissionReviewCard
- GradingForm
- Sidebar (Trainer)

### Module 4: Basic Admin Portal ✅
**Pages to Implement:**
1. Admin Dashboard
2. User List Page
3. Course List Page (View All)

**Components:**
- UserTable
- CourseTable
- StatsCard
- Sidebar (Admin)

## NOT Implementing (Backend APIs Don't Exist Yet)

### ❌ Alumni Portal
- Mentorship features
- Alumni profile showcase
- Mentorship requests

### ❌ Recruiter Portal
- Talent pool
- Candidate search
- Messaging interface

### ❌ Advanced Features
- Practice tasks module
- AI personalization
- Certificate generation and verification
- Advanced analytics
- Real-time messaging
- QR code enrollment (UI exists but may not be fully functional)

## Implementation Order

### Phase 1: Foundation (Week 1)
1. ✅ Project setup
2. ✅ Design system
3. ✅ Base UI components
4. ✅ Layout components
5. ✅ API client setup
6. ✅ State management (Auth context)
7. ✅ Routing and middleware

### Phase 2: Authentication (Days 1-3)
1. ✅ Landing page
2. ✅ Login page
3. ✅ Signup page
4. ✅ Email verification
5. ✅ Password reset (UI only)

### Phase 3: Student Portal (Days 4-7)
1. ✅ Student dashboard
2. ✅ Course browsing
3. ✅ Course details
4. ✅ Enrollment
5. ✅ Assignments list
6. ✅ Assignment submission
7. ✅ Profile management

### Phase 4: Trainer Portal (Days 8-11)
1. ✅ Trainer dashboard
2. ✅ Course management
3. ✅ Assignment management
4. ✅ Submission review
5. ✅ Grading interface

### Phase 5: Admin Portal (Days 12-13)
1. ✅ Admin dashboard
2. ✅ User management
3. ✅ Course monitoring

### Phase 6: Polish (Days 14-15)
1. ✅ Responsive design
2. ✅ Error handling
3. ✅ Loading states
4. ✅ Testing
5. ✅ Documentation

## Backend API Endpoints Reference

### Authentication
```
POST /api/auth/signup
Body: { email, password, firstName, lastName, role }
Response: { success, message, data: { user } }

POST /api/auth/login
Body: { email, password }
Response: { success, message, data: { accessToken, refreshToken, user } }

POST /api/auth/verify-email
Body: { token }
Response: { success, message, data: { email } }

GET /api/users/me
Headers: { Authorization: Bearer <token> }
Response: { success, data: { id, email, firstName, lastName, role } }

PUT /api/users/profile
Headers: { Authorization: Bearer <token> }
Body: { firstName, lastName, bio, avatar_url }
Response: { success, message, data: { profile } }
```

### Courses
```
GET /api/courses
Response: { success, data: [courses] }

GET /api/courses/:id
Response: { success, data: { course } }

POST /api/courses (Trainer only)
Headers: { Authorization: Bearer <token> }
Body: { title, description, category }
Response: { success, message, data: { course } }

PUT /api/courses/:id (Trainer only)
Headers: { Authorization: Bearer <token> }
Body: { title, description, category }
Response: { success, message, data: { course } }

DELETE /api/courses/:id (Trainer only)
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

### Enrollments
```
POST /api/enrollments
Headers: { Authorization: Bearer <token> }
Body: { courseId }
Response: { success, message, data: { enrollment } }

GET /api/enrollments/my
Headers: { Authorization: Bearer <token> }
Response: { success, data: [enrollments] }
```

### Assignments
```
GET /api/assignments/course/:courseId
Headers: { Authorization: Bearer <token> }
Response: { success, data: [assignments] }

POST /api/assignments (Trainer only)
Headers: { Authorization: Bearer <token> }
Body: { courseId, title, description, dueDate, maxScore }
Response: { success, message, data: { assignment } }

PUT /api/assignments/:id (Trainer only)
Headers: { Authorization: Bearer <token> }
Body: { title, description, dueDate, maxScore }
Response: { success, message, data: { assignment } }

DELETE /api/assignments/:id (Trainer only)
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

### Submissions
```
POST /api/submissions
Headers: { Authorization: Bearer <token> }
Body: { assignmentId, attachmentUrl, notes }
Response: { success, message, data: { submission } }

GET /api/submissions/assignment/:assignmentId (Trainer only)
Headers: { Authorization: Bearer <token> }
Response: { success, data: [submissions] }

PUT /api/submissions/:id/grade (Trainer only)
Headers: { Authorization: Bearer <token> }
Body: { score, feedback }
Response: { success, message, data: { submission } }
```

## Notes

1. **File Uploads:** Backend expects `attachment_url` (not file upload). Frontend should handle file upload separately or use a URL.

2. **Role-Based Access:** Frontend must check user role and show/hide features accordingly.

3. **Token Management:** Store JWT token in localStorage or cookies, include in Authorization header.

4. **Error Handling:** Backend returns `{ success: false, message: "error" }` format.

5. **Loading States:** Show loading spinners during API calls.

6. **Validation:** Client-side validation before API calls.

---

**Status:** Ready to implement
**Scope:** Focused on existing backend APIs only
**Timeline:** 2-3 weeks for core features
