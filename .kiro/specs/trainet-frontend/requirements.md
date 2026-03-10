# TRAINET Frontend - Requirements Document

## Project Overview

**Project Name:** TRAINET Frontend Application
**Type:** Web-based Learning and Career Development Platform
**Technology Stack:** Next.js 14 (App Router), React, TailwindCSS, Axios, Supabase Client
**Backend Integration:** Existing REST API (already implemented)

## Purpose

Build a complete, production-ready frontend for TRAINET that:
- Integrates with existing backend APIs
- Supports 5 user roles (Student, Trainer, Alumni, Recruiter, Admin)
- Implements all modules defined in TRAINET SRDS
- Provides role-based dashboards and navigation
- Follows modern UI/UX best practices

## Scope

### In Scope
- Complete authentication system (login, signup, email verification, password reset)
- Role-based dashboards for all 5 user roles
- Student learning portal (courses, assignments, submissions, certificates)
- Trainer portal (course management, assignment creation, grading)
- Alumni portal (mentorship, profile management)
- Recruiter portal (talent pool, candidate search, messaging)
- Admin portal (user management, analytics, system monitoring)
- Work & Practice module
- Certification module with QR verification
- AI personalization UI (skill analysis, recommendations)
- Reusable component library
- Responsive design for all screen sizes

### Out of Scope
- Backend API modifications
- New features not in SRDS
- Mobile native applications
- Real-time chat (unless specified in SRDS)
- Payment processing (unless specified in SRDS)

## User Roles

### 1. Student
**Primary Goals:**
- Enroll in courses
- Complete assignments
- Submit work
- View certificates
- Track learning progress

**Key Features:**
- Course browsing and enrollment
- Assignment submission
- Certificate viewing
- Progress tracking
- Profile management

### 2. Trainer
**Primary Goals:**
- Create and manage courses
- Create assignments
- Grade submissions
- Post practice tasks
- Monitor student progress

**Key Features:**
- Course creation and editing
- Assignment management
- Submission review and grading
- Student analytics
- Profile management

### 3. Alumni
**Primary Goals:**
- Offer mentorship
- Share experience
- Guide students
- Build professional network

**Key Features:**
- Mentorship session management
- Student communication
- Profile showcase
- Experience sharing

### 4. Recruiter
**Primary Goals:**
- Find qualified candidates
- Review portfolios
- Contact potential hires
- Track recruitment pipeline

**Key Features:**
- Candidate search and filtering
- Portfolio review
- Messaging interface
- Talent pool management

### 5. Admin
**Primary Goals:**
- Manage users
- Monitor platform
- View analytics
- Maintain system health

**Key Features:**
- User management
- Course monitoring
- Platform analytics
- System logs

## Functional Requirements

### FR-AUTH: Authentication Module

#### FR-AUTH-1: Landing Page
**Description:** Public landing page introducing TRAINET
**Components:**
- Hero section with platform overview
- Features showcase
- Benefits section
- Call-to-action buttons (Login, Sign Up)
- Footer with links

#### FR-AUTH-2: User Registration
**Description:** Allow new users to create accounts
**Fields:**
- First Name (required)
- Last Name (required)
- Email (required, validated)
- Password (required, min 8 characters)
- Role Selection (Student, Trainer, Alumni, Recruiter)

**Validation:**
- Email format validation
- Password strength indicator
- Role selection required
- Duplicate email check

**Flow:**
1. User fills registration form
2. Submit to POST /api/auth/signup
3. Show success message
4. Redirect to email verification page

#### FR-AUTH-3: Email Verification
**Description:** Verify user email address
**Flow:**
1. User receives verification email
2. Clicks verification link
3. Frontend calls POST /api/auth/verify-email
4. Show success/error message
5. Redirect to login

#### FR-AUTH-4: User Login
**Description:** Authenticate existing users
**Fields:**
- Email (required)
- Password (required)

**Flow:**
1. User enters credentials
2. Submit to POST /api/auth/login
3. Store access token
4. Redirect to role-specific dashboard

**Error Handling:**
- Invalid credentials
- Unverified email
- Account disabled

#### FR-AUTH-5: Password Reset
**Description:** Allow users to reset forgotten passwords
**Pages:**
- Forgot Password (request reset)
- Reset Password (set new password)

**Flow:**
1. User requests password reset
2. Receives reset email
3. Clicks reset link
4. Sets new password
5. Redirects to login

### FR-STUDENT: Student Portal

#### FR-STUDENT-1: Student Dashboard
**Description:** Overview of student's learning journey
**Widgets:**
- Enrolled courses (with progress)
- Upcoming assignment deadlines
- Recent activity feed
- Learning statistics
- Quick actions

#### FR-STUDENT-2: Course Browsing
**Description:** Browse and search available courses
**Features:**
- Course cards with:
  - Course title
  - Trainer name
  - Description preview
  - Enroll button
- Search functionality
- Filter by category/trainer
- Pagination

#### FR-STUDENT-3: Course Details
**Description:** Detailed view of a specific course
**Sections:**
- Course overview
- Learning materials
- Assignments list
- Trainer information
- Enrollment status
- Progress tracking

**Actions:**
- Enroll in course (if not enrolled)
- View materials
- Navigate to assignments

#### FR-STUDENT-4: Assignments View
**Description:** List of assignments for enrolled courses
**Display:**
- Assignment title
- Course name
- Due date
- Status (Pending, Submitted, Graded)
- Score (if graded)

**Filters:**
- By course
- By status
- By due date

#### FR-STUDENT-5: Assignment Submission
**Description:** Submit assignment work
**Features:**
- File upload (multiple files)
- Text notes/comments
- Submission confirmation
- View previous submissions

**Validation:**
- File size limits
- Allowed file types
- Required fields

#### FR-STUDENT-6: Certificates
**Description:** View earned certificates
**Display:**
- Certificate cards showing:
  - Course name
  - Issue date
  - QR verification badge
- Download certificate
- Verify certificate

#### FR-STUDENT-7: Student Profile
**Description:** Manage student profile
**Editable Fields:**
- Profile picture
- Bio
- Skills
- Portfolio links
- Contact information

### FR-TRAINER: Trainer Portal

#### FR-TRAINER-1: Trainer Dashboard
**Description:** Overview of trainer's courses and activities
**Widgets:**
- Courses created
- Total students
- Pending submissions
- Recent activity
- Analytics summary

#### FR-TRAINER-2: Course Management
**Description:** Create and manage courses
**Features:**
- Create new course
- Edit course details
- Upload learning materials
- Manage course visibility
- Delete course

**Course Form Fields:**
- Title
- Description
- Category
- Materials (files/links)
- Prerequisites

#### FR-TRAINER-3: Assignment Management
**Description:** Create and manage assignments
**Features:**
- Create assignment
- Set due date
- Attach resources
- Edit assignment
- Delete assignment

**Assignment Form:**
- Title
- Description
- Due date
- Max score
- Attachments

#### FR-TRAINER-4: Submission Review
**Description:** Review and grade student submissions
**Features:**
- View submission details
- Download submitted files
- Add feedback/comments
- Assign grade
- Mark as reviewed

**Display:**
- Student name
- Submission date
- Files submitted
- Previous feedback

#### FR-TRAINER-5: Practice Tasks
**Description:** Post mini projects and coding challenges
**Features:**
- Create practice task
- Set difficulty level
- Add description
- Attach resources
- View submissions

#### FR-TRAINER-6: Trainer Profile
**Description:** Manage trainer profile
**Editable Fields:**
- Profile picture
- Bio
- Expertise areas
- Qualifications
- Contact information

### FR-ALUMNI: Alumni Portal

#### FR-ALUMNI-1: Alumni Dashboard
**Description:** Overview of mentorship activities
**Widgets:**
- Active mentorship sessions
- Pending requests
- Student messages
- Profile views

#### FR-ALUMNI-2: Alumni Profile
**Description:** Showcase professional experience
**Sections:**
- Professional experience
- Achievements
- Portfolio
- Skills
- Mentorship areas

#### FR-ALUMNI-3: Mentorship Management
**Description:** Manage mentorship sessions
**Features:**
- View mentorship requests
- Accept/decline requests
- Schedule sessions
- Communicate with students
- Track mentorship history

### FR-RECRUITER: Recruiter Portal

#### FR-RECRUITER-1: Recruiter Dashboard
**Description:** Overview of recruitment activities
**Widgets:**
- Candidate recommendations
- Recent searches
- Active conversations
- Saved candidates

#### FR-RECRUITER-2: Talent Pool
**Description:** Search and filter candidates
**Features:**
- Search by:
  - Skills
  - Projects
  - Certificates
  - Experience
- Advanced filters
- Sort options
- Save searches

#### FR-RECRUITER-3: Candidate Profile
**Description:** Detailed view of candidate
**Sections:**
- Portfolio
- Projects
- Certificates
- Skills
- Experience
- Contact information

**Actions:**
- Send message
- Save candidate
- Download resume

#### FR-RECRUITER-4: Messaging Interface
**Description:** Communicate with candidates
**Features:**
- Message list
- Conversation view
- Send messages
- Attach files
- Message history

### FR-ADMIN: Admin Portal

#### FR-ADMIN-1: Admin Dashboard
**Description:** Platform overview and statistics
**Widgets:**
- Total users (by role)
- Active courses
- Platform activity
- System health
- Quick actions

#### FR-ADMIN-2: User Management
**Description:** Manage platform users
**Features:**
- View all users
- Search users
- Filter by role
- Change user role
- Disable/enable accounts
- View user details

#### FR-ADMIN-3: Course Monitoring
**Description:** Monitor all courses
**Features:**
- View all courses
- Course statistics
- Trainer performance
- Student engagement
- Course approval (if required)

#### FR-ADMIN-4: Analytics
**Description:** Platform analytics and insights
**Charts:**
- User growth over time
- Course completion rates
- Active users
- Popular courses
- Engagement metrics

#### FR-ADMIN-5: System Logs
**Description:** View system activity logs
**Features:**
- Filter by date
- Filter by type
- Search logs
- Export logs

### FR-WORK: Work & Practice Module

#### FR-WORK-1: Practice Tasks List
**Description:** Display practice tasks for students
**Features:**
- Task cards showing:
  - Title
  - Difficulty level
  - Deadline
  - Trainer name
- Filter by difficulty
- Sort by deadline

#### FR-WORK-2: Task Submission
**Description:** Submit solutions to practice tasks
**Features:**
- Upload solution files
- Add description
- Submit for review
- View feedback

### FR-CERT: Certification Module

#### FR-CERT-1: Certificate Display
**Description:** Display earned certificates
**Features:**
- Certificate design
- Course information
- Student name
- Issue date
- QR verification code

#### FR-CERT-2: Certificate Verification
**Description:** Verify certificate authenticity
**Features:**
- Scan QR code
- Enter certificate ID
- Display verification result
- Show certificate details

### FR-AI: AI Personalization

#### FR-AI-1: Skill Analysis
**Description:** Display learner skill profile
**Features:**
- Skill radar chart
- Strength areas
- Improvement areas
- Skill recommendations

#### FR-AI-2: Course Recommendations
**Description:** Recommend courses based on profile
**Features:**
- Recommended course cards
- Relevance score
- Personalized reasons
- Quick enroll

#### FR-AI-3: Candidate Matching
**Description:** AI-powered candidate recommendations for recruiters
**Features:**
- Match score
- Matching criteria
- Candidate highlights
- Contact options

## Non-Functional Requirements

### NFR-1: Performance
- Page load time < 3 seconds
- API response handling with loading states
- Optimized images and assets
- Code splitting for faster initial load

### NFR-2: Responsiveness
- Mobile-first design
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- Touch-friendly UI elements
- Responsive navigation

### NFR-3: Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- Sufficient color contrast
- Alt text for images

### NFR-4: Security
- Secure token storage
- XSS prevention
- CSRF protection
- Input validation
- Secure API communication (HTTPS)

### NFR-5: Usability
- Intuitive navigation
- Consistent UI patterns
- Clear error messages
- Helpful tooltips
- Confirmation dialogs for destructive actions

### NFR-6: Maintainability
- Modular component structure
- Reusable components
- Clear code organization
- Comprehensive documentation
- TypeScript for type safety (optional)

## Design System

### Color Palette
- **Primary:** Pastel Blue (#A8DADC)
- **Secondary:** Teal (#457B9D)
- **Accent:** Coral (#F1FAEE)
- **Neutral:** Light Grey (#E5E5E5)
- **Background:** White (#FFFFFF)
- **Text:** Dark Grey (#1D3557)
- **Success:** Green (#06D6A0)
- **Warning:** Yellow (#FFD166)
- **Error:** Red (#EF476F)

### Typography
- **Headings:** Inter (Bold, Semi-Bold)
- **Body:** Inter (Regular, Medium)
- **Code:** Fira Code (Monospace)

**Scale:**
- H1: 2.5rem (40px)
- H2: 2rem (32px)
- H3: 1.5rem (24px)
- H4: 1.25rem (20px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

### Border Radius
- Small: 4px
- Medium: 8px
- Large: 12px
- XLarge: 16px
- Full: 9999px (pills)

### Shadows
- Small: 0 1px 3px rgba(0,0,0,0.12)
- Medium: 0 4px 6px rgba(0,0,0,0.1)
- Large: 0 10px 15px rgba(0,0,0,0.1)
- XLarge: 0 20px 25px rgba(0,0,0,0.15)

## API Integration

### Backend Endpoints (Existing)

#### Authentication
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/verify-email
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

#### Users
- GET /api/users/me
- PUT /api/users/profile

#### Courses
- GET /api/courses
- GET /api/courses/:id
- POST /api/courses (trainer)
- PUT /api/courses/:id (trainer)
- DELETE /api/courses/:id (trainer)

#### Enrollments
- POST /api/enrollments
- GET /api/enrollments/my
- GET /api/enroll/qr/:token

#### Assignments
- GET /api/assignments/course/:courseId
- POST /api/assignments (trainer)
- PUT /api/assignments/:id (trainer)
- DELETE /api/assignments/:id (trainer)

#### Submissions
- POST /api/submissions
- GET /api/submissions/assignment/:assignmentId
- PUT /api/submissions/:id/grade (trainer)

### API Client Configuration
- Base URL: http://localhost:5000/api
- Authentication: Bearer token in Authorization header
- Error handling: Centralized error interceptor
- Loading states: Global loading context

## Success Criteria

### Must Have
- ✅ All 5 role dashboards functional
- ✅ Complete authentication flow
- ✅ Course browsing and enrollment
- ✅ Assignment submission and grading
- ✅ Certificate viewing
- ✅ Responsive design
- ✅ API integration working

### Should Have
- ✅ Practice tasks module
- ✅ Mentorship features
- ✅ Recruiter talent pool
- ✅ Admin analytics
- ✅ Profile management

### Nice to Have
- AI recommendations UI
- Advanced search filters
- Real-time notifications
- Dark mode

## Constraints

### Technical Constraints
- Must use Next.js 14 App Router
- Must integrate with existing backend (no modifications)
- Must support modern browsers (Chrome, Firefox, Safari, Edge)
- Must be deployable on Vercel

### Business Constraints
- Must follow SRDS strictly
- No features outside SRDS scope
- Must support all 5 user roles
- Must be production-ready

## Assumptions

1. Backend APIs are fully functional and tested
2. Backend handles all business logic and validation
3. Email service is configured on backend
4. Database schema matches API responses
5. Authentication tokens are JWT-based
6. File uploads are handled by backend

## Dependencies

### External Dependencies
- Next.js 14
- React 18
- TailwindCSS 3
- Axios
- Supabase Client
- React Hook Form
- Zod (validation)
- Recharts (analytics)
- React Icons
- Date-fns

### Backend Dependencies
- Backend API must be running
- Database must be accessible
- Email service must be configured

## Risks and Mitigation

### Risk 1: API Changes
**Mitigation:** Use API client abstraction layer

### Risk 2: Performance Issues
**Mitigation:** Implement code splitting, lazy loading, caching

### Risk 3: Browser Compatibility
**Mitigation:** Use polyfills, test on multiple browsers

### Risk 4: Security Vulnerabilities
**Mitigation:** Follow security best practices, regular audits

## Timeline Estimate

### Phase 1: Foundation (Week 1)
- Project setup
- Authentication system
- Layout components
- Design system implementation

### Phase 2: Student Portal (Week 2)
- Student dashboard
- Course browsing
- Assignment submission
- Certificate viewing

### Phase 3: Trainer Portal (Week 3)
- Trainer dashboard
- Course management
- Assignment creation
- Submission grading

### Phase 4: Other Roles (Week 4)
- Alumni portal
- Recruiter portal
- Admin portal

### Phase 5: Additional Features (Week 5)
- Practice tasks
- AI personalization UI
- Analytics
- Polish and testing

## Acceptance Criteria

1. All pages render without errors
2. Authentication flow works end-to-end
3. Role-based navigation displays correctly
4. API integration successful for all endpoints
5. Responsive design works on mobile, tablet, desktop
6. No console errors or warnings
7. Loading states display during API calls
8. Error messages are user-friendly
9. Forms validate input correctly
10. All SRDS requirements implemented

---

**Version:** 1.0.0
**Date:** March 8, 2026
**Status:** Requirements Approved
