# TRAINET — Final Year Project Viva Documentation

> **Complete technical reference for viva preparation.**
> Covers every file, module, flow, and design decision in the system.

---

## TABLE OF CONTENTS

1. Project Overview
2. System Architecture
3. Folder Structure
4. File-by-File Explanation
5. Authentication Flow
6. Trainer Verification System
7. Role-Based Access Control
8. API Design
9. AI Assignment Checking
10. Certificate System
11. Database Design
12. Error Handling
13. Security
14. Mobile Responsiveness
15. Major Bugs and Fixes
16. Algorithms and Logic
17. Deployment
18. Limitations and Future Improvements

---

## 1. PROJECT OVERVIEW

### What is TRAINET?

TRAINET is a **graduate-level online training platform** that connects trainers, students, alumni, and recruiters in a structured learning environment. It is a full-stack web application built as a Final Year Project.

### Problem It Solves

Traditional training platforms lack:
- Automated assignment grading (trainers manually grade everything)
- Plagiarism detection for student submissions
- Verified, tamper-proof certificates
- A structured trainer approval process
- QR-based enrollment to prevent unauthorized access

TRAINET solves all of these by integrating AI grading, QR enrollment, digital certificates with public verification, and a trainer approval workflow.

### Key Features

| Feature | Description |
|---|---|
| Role-based system | 5 roles: student, trainer, alumni, recruiter, admin |
| QR Enrollment | Students enroll via QR code only — no direct enrollment |
| AI Grading | Groq LLM (llama-3.3-70b) grades assignments automatically |
| Plagiarism Detection | TF-IDF + cosine similarity compares submissions |
| Certificate Verification | QR codes on certificates link to a public verification page |
| Trainer Verification | New trainers must be approved by admin before creating courses |
| Work & Practice | Separate task system for real-world projects |
| Alumni Network | Alumni offer guidance and mentorship to students |
| Talent Pool | Recruiters browse student profiles |
| Notifications | Real-time in-app notifications for all events |

---

## 2. SYSTEM ARCHITECTURE

### Technology Stack

**Backend:**
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI Grading:** Groq API (llama-3.3-70b-versatile model)
- **Plagiarism:** Python (scikit-learn TF-IDF + cosine similarity)
- **File Storage:** Supabase Storage (S3-compatible)
- **Authentication:** Supabase Auth (JWT-based)

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Heroicons
- **Forms:** React Hook Form
- **HTTP Client:** Axios

**Infrastructure:**
- **Backend Hosting:** Render (free tier)
- **Frontend Hosting:** Vercel
- **Database:** Supabase (managed PostgreSQL)

### Request Flow

```
User Browser
    │
    ▼
Next.js Frontend (Vercel)
    │  HTTP request with Bearer token
    ▼
Express Backend (Render)
    │
    ├── authMiddleware.verifyToken()
    │       └── supabase.auth.getUser(token)  ──► Supabase Auth
    │       └── supabase.from('profiles').select()  ──► PostgreSQL
    │
    ├── authorizeRoles('trainer')
    │
    ├── requireApprovedTrainer (if needed)
    │
    ▼
Controller → Service → Supabase DB
    │
    ▼
JSON Response → Frontend → React State Update → UI Re-render
```

### Why This Architecture?

- **Supabase** was chosen because it provides PostgreSQL, Auth, and Storage in one managed service — reducing infrastructure complexity.
- **Next.js App Router** enables server-side rendering for public pages (landing, certificate verification) and client-side rendering for dashboards.
- **Python subprocess** for AI evaluation allows using the best ML libraries (scikit-learn) without rewriting them in JavaScript.
- **Separate anon and service role clients** in Supabase ensures RLS is respected for user operations but bypassed for admin operations.

---

## 3. FOLDER STRUCTURE

### Backend (`/backend`)

```
backend/
├── src/
│   ├── server.js              # Entry point — starts HTTP server
│   ├── app.js                 # Express app setup — middleware + routes
│   ├── config/
│   │   ├── env.js             # Loads and validates environment variables
│   │   ├── supabaseClient.js  # Creates Supabase clients (anon + service role)
│   │   └── index.js           # Exports config + CORS options
│   ├── routes/
│   │   ├── index.js           # Master router — mounts all sub-routers
│   │   ├── authRoutes.js      # /api/auth/*
│   │   ├── userRoutes.js      # /api/users/*
│   │   ├── courseRoutes.js    # /api/courses/*
│   │   ├── courseOfferingRoutes.js  # /api/course-offerings/*
│   │   ├── assignmentRoutes.js      # /api/assignments/*
│   │   ├── submissionRoutes.js      # /api/submissions/*
│   │   ├── enrollmentRoutes.js      # /api/enrollments/*
│   │   ├── workPracticeRoutes.js    # /api/tasks/*
│   │   ├── certificateRoutes.js     # /api/certificates/*
│   │   ├── adminRoutes.js           # /api/admin/*
│   │   ├── trainerApplicationRoutes.js  # /api/trainer-application/*
│   │   ├── materialRoutes.js        # /api/materials/*
│   │   ├── progressRoutes.js        # /api/progress/*
│   │   ├── notificationRoutes.js    # /api/notifications/*
│   │   ├── alumniRoutes.js          # /api/alumni/*
│   │   ├── guidanceRoutes.js        # /api/guidance/*
│   │   ├── attendanceRoutes.js      # /api/attendance/*
│   │   ├── recruiterRoutes.js       # /api/recruiter/*
│   │   ├── enrollQRRoutes.js        # /api/enroll/*
│   │   ├── qrEnrollmentRoutes.js    # /api/qr-enrollment/*
│   │   └── aiRoutes.js              # /api/ai/*
│   ├── controllers/
│   │   ├── authController.js        # Handles auth HTTP requests
│   │   ├── userController.js        # Profile, password, QR enrollment
│   │   ├── courseOfferingController.js  # Course offering CRUD
│   │   ├── assignmentController.js  # Assignment CRUD
│   │   ├── submissionController.js  # Submission + AI evaluation
│   │   ├── certificateController.js # Certificate issue + verify
│   │   ├── workPracticeController.js # WP tasks + submissions
│   │   ├── adminController.js       # Admin dashboard + management
│   │   └── trainerApplicationController.js  # Trainer verification
│   ├── services/
│   │   ├── authService.js           # signUp, signIn business logic
│   │   ├── userService.js           # Profile CRUD, QR enrollment
│   │   ├── submissionService.js     # Submit + AI evaluation pipeline
│   │   ├── certificateService.js    # Certificate generation + verification
│   │   ├── aiEvaluationService.js   # Python subprocess bridge
│   │   ├── trainerApplicationService.js  # Trainer approval workflow
│   │   ├── enrollmentService.js     # Enrollment queries
│   │   ├── workPracticeService.js   # WP tasks + AI evaluation
│   │   ├── adminService.js          # Admin queries + logs
│   │   └── notificationService.js  # Notification creation
│   ├── middleware/
│   │   ├── authMiddleware.js        # verifyToken — validates JWT
│   │   ├── roleMiddleware.js        # authorizeRoles — checks user role
│   │   ├── trainerMiddleware.js     # requireApprovedTrainer
│   │   ├── errorMiddleware.js       # Global error handler
│   │   ├── uploadMiddleware.js      # Multer file upload config
│   │   ├── loggingMiddleware.js     # Morgan HTTP logging
│   │   ├── rateLimitMiddleware.js   # Rate limiting
│   │   └── index.js                 # Exports all middleware
│   └── utils/
│       ├── storageService.js        # Supabase Storage upload/download
│       ├── errors.js                # Custom error classes
│       ├── logger.js                # Winston logger
│       └── emailService.js          # Email sending (if used)
├── database/
│   └── migrations/                  # 20 SQL migration files
└── package.json
```

### Frontend (`/frontend`)

```
frontend/
├── app/                             # Next.js App Router pages
│   ├── layout.tsx                   # Root layout with AuthProvider
│   ├── page.tsx                     # Landing page (public)
│   ├── login/page.tsx               # Login page
│   ├── signup/page.tsx              # Signup page
│   ├── verify-email/page.tsx        # Email verification page
│   ├── verify-certificate/[uuid]/   # Public certificate verification
│   ├── student/                     # Student dashboard pages
│   ├── trainer/                     # Trainer dashboard pages
│   ├── admin/                       # Admin dashboard pages
│   ├── alumni/                      # Alumni pages
│   └── recruiter/                   # Recruiter pages
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx      # Main dashboard wrapper
│   │   ├── Sidebar.tsx              # Role-based navigation sidebar
│   │   └── Header.tsx               # Top bar with notifications
│   ├── profile/
│   │   └── ProfilePage.tsx          # Shared profile settings component
│   ├── student/
│   │   └── SubmissionModal.tsx      # Assignment submission modal
│   └── trainer/
│       └── CreateCourseModal.tsx    # Course offering creation modal
├── contexts/
│   └── AuthContext.tsx              # Global auth state management
├── lib/
│   └── api/
│       ├── client.ts                # Axios instance with interceptors
│       └── auth.ts                  # Auth API functions + interfaces
└── public/                          # Static assets
```

### AI Module (`/ai_assignment_checking`)

```
ai_assignment_checking/
├── groq_grading.py      # Groq API integration for grading
├── run_grading.py       # Runner: reads stdin JSON, calls groq_grading
├── plagiarism.py        # TF-IDF cosine similarity plagiarism check
├── run_plagiarism.py    # Runner: reads stdin JSON, calls plagiarism
├── requirements.txt     # Python dependencies
└── .env                 # GROQ_API_KEY (local dev only)
```


---

## 4. FILE-BY-FILE EXPLANATION

### Backend Entry Points

#### `backend/src/server.js`
**Purpose:** The entry point of the entire backend application.

**What it does:**
- Imports the configured Express `app` from `app.js`
- Calls `app.listen(port)` to start the HTTP server
- Calls `ensureBucketExists()` on startup to create the Supabase Storage bucket if it doesn't exist
- Sets up graceful shutdown handlers for `SIGTERM` and `SIGINT` signals
- Logs a startup banner showing environment, port, and API prefix

**Key logic:**
```js
const server = app.listen(config.port, () => {
  ensureBucketExists(); // non-blocking — creates 'uploads' bucket
});
```

**Connects to:** `app.js`, `config/index.js`, `utils/storageService.js`

---

#### `backend/src/app.js`
**Purpose:** Configures the Express application — all middleware and routes are registered here.

**What it does:**
1. Creates the Express app instance
2. Applies security middleware: `helmet` (HTTP security headers), `cors` (cross-origin requests)
3. Applies body parsers: `express.json()` and `express.urlencoded()` — both with 10MB limit
4. Serves static files from `/uploads` with cross-origin headers
5. Applies logging middleware (Morgan)
6. Applies rate limiting middleware
7. Mounts all API routes under `/api` prefix
8. Registers 404 handler and global error handler

**Important detail:** `express.json()` runs globally BEFORE route-level multer middleware. This is critical — when a JSON request hits a multer-protected route, `express.json()` parses the body first, then multer runs but does nothing (not multipart), leaving `req.body` intact.

**Connects to:** All route files, all middleware files

---

#### `backend/src/config/supabaseClient.js`
**Purpose:** Creates and exports two Supabase client instances.

**Two clients explained:**

| Client | Key Used | RLS | Used For |
|---|---|---|---|
| `supabaseAuthClient` | Anon key | Enforced | Auth operations (signUp, signInWithPassword) |
| `supabaseAdminClient` | Service role key | Bypassed | All database operations (profiles, courses, etc.) |

**Why two clients?**
- The anon key respects Row Level Security — correct for auth operations where Supabase needs to know who is signing in
- The service role key bypasses RLS — needed for backend operations where the server acts on behalf of users (e.g., creating profiles, reading all trainer applications)
- The default export `supabase` is the admin client — used in `authMiddleware` for `getUser()` and all service files

**Critical note:** Both clients have `persistSession: false` and `autoRefreshToken: false` because the backend is stateless — it does not maintain sessions between requests.

---

### Middleware Files

#### `backend/src/middleware/authMiddleware.js`
**Purpose:** Validates every authenticated request by verifying the JWT token.

**Step-by-step flow:**
1. Extracts the `Authorization` header — must be `Bearer <token>`
2. Calls `supabase.auth.getUser(token)` — this validates the token against Supabase Auth server
3. If valid, fetches the user's profile from the `profiles` table using the user's ID
4. Attaches `req.user` object with: `id`, `email`, `firstName`, `lastName`, `role`, `trainerStatus`
5. Calls `next()` to proceed to the next middleware

**Why `supabase.auth.getUser()` instead of JWT decode?**
Supabase tokens are JWTs but validating them locally requires the JWT secret. Using `getUser()` delegates validation to Supabase's server, which also checks if the session has been revoked.

**`trainerStatus` in `req.user`:**
```js
trainerStatus: profileData.trainer_status ?? (profileData.role === 'trainer' ? 'approved' : null)
```
If `trainer_status` is `NULL` in the database (legacy trainer), it defaults to `'approved'` — ensuring backward compatibility.

---

#### `backend/src/middleware/roleMiddleware.js`
**Purpose:** Restricts route access to specific roles.

**How it works:**
```js
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission');
    }
    next();
  };
};
```

**Usage pattern:**
```js
router.post('/', verifyToken, authorizeRoles('trainer'), controller.create);
```

Must always be used AFTER `verifyToken` because it reads `req.user.role`.

---

#### `backend/src/middleware/trainerMiddleware.js`
**Purpose:** Blocks trainer actions if the trainer is not approved.

**Three-state logic:**
- `null` → legacy trainer → **approved** (backward compatibility)
- `'approved'` → **allowed**
- `'pending'` → **403 Forbidden** with message "under review"
- `'rejected'` → **403 Forbidden** with message "not approved"

**Usage:**
```js
router.post('/', verifyToken, authorizeRoles('trainer'), requireApprovedTrainer, controller.create);
```

Applied to: course offering creation/update, assignment creation/update, WP task creation/update.

---

#### `backend/src/middleware/errorMiddleware.js`
**Purpose:** Centralized error handling for all Express routes.

**Two functions:**
1. `notFound` — catches any request that didn't match a route, returns 404
2. `errorHandler` — catches all errors thrown by controllers/services:
   - `ApiError` instances → use their `statusCode` and `message`
   - `JsonWebTokenError` → 401 "Invalid token"
   - `TokenExpiredError` → 401 "Token expired"
   - Unknown errors → 500 "Internal Server Error"

**Custom error classes** (from `utils/errors.js`):
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)

---

#### `backend/src/middleware/uploadMiddleware.js`
**Purpose:** Configures Multer for file uploads using memory storage.

**Two upload configurations:**
1. `upload` (default export) — for submissions, assignments, WP files (50MB limit, allows PDF/ZIP/code files)
2. `uploadAvatar` — for profile pictures (5MB limit, images only)

**Memory storage:** Files are held in `req.file.buffer` — never written to disk. The actual upload to Supabase Storage happens in the controller after validation.

---

### Service Files

#### `backend/src/services/authService.js`
**Purpose:** Business logic for user registration and login.

**`signUp()` function:**
1. Checks if registration is enabled (from settings table)
2. Creates user in Supabase Auth using `supabaseAuthClient.auth.signUp()` — this sends a verification email
3. Inserts a profile record in the `profiles` table using `supabaseAdminClient`
4. Sets `trainer_status: 'pending'` for trainer role, `null` for all others
5. Returns basic user info (no token — user must verify email first)

**`signIn()` function:**
1. Calls `supabaseAuthClient.auth.signInWithPassword()` — validates credentials
2. Fetches the user's profile from `profiles` table
3. Syncs email verification status from Supabase Auth to profiles table
4. Checks if email is verified — rejects login if not
5. Returns `accessToken`, `refreshToken`, `expiresIn`, and full user object including `trainerStatus`

**Critical fix applied:** The original code had `supabaseAuthClient.auth.signOut()` before `signInWithPassword()`. This was removed because `supabaseAuthClient` is a shared singleton — calling `signOut()` on it would invalidate the previous user's session globally, causing cross-device logout.

---

#### `backend/src/services/userService.js`
**Purpose:** Profile management and QR enrollment logic.

**Key functions:**
- `getUserProfile(userId)` — fetches full profile including `trainerStatus`
- `updateUserProfile(userId, profileData)` — partial update with validation; handles avatar removal (explicit `null` values)
- `changePassword(userId, currentPassword, newPassword)` — verifies current password by re-authenticating, then updates via Supabase Auth
- `validateAndEnrollViaQR(studentId, token, role)` — validates QR token, checks expiry, checks single-use, creates enrollment

**Avatar removal logic:**
```js
if (profileData.profile_picture_url === null || profileData.avatar_url === null) {
  updateData.profile_picture_url = null;
  updateData.avatar_url = null;
}
```
This early check ensures null values are always processed before the "no valid fields" guard.

---

#### `backend/src/services/submissionService.js`
**Purpose:** Handles assignment submission and the complete AI evaluation pipeline.

**`submitAssignment()` flow:**
1. Verifies assignment exists and deadline hasn't passed
2. Verifies student is enrolled in the course offering
3. Checks for duplicate submission
4. Creates submission record in database
5. **Auto-runs AI evaluation** (non-blocking):
   - Downloads and extracts text from the submitted file
   - Fetches all other submissions for plagiarism comparison
   - Calls `evaluateSubmission()` from `aiEvaluationService`
   - Saves AI score, feedback, plagiarism percentage, and status to database
   - Auto-issues certificate if student becomes eligible

**`runAiEvaluation()` — trainer-triggered:**
Same pipeline as auto-evaluation but triggered manually by the trainer.

**`finalizeSubmission()` — trainer override:**
Sets `final_score` (can override AI score), `trainer_feedback`, `ai_status: 'Finalized'`.

---

#### `backend/src/services/aiEvaluationService.js`
**Purpose:** Bridge between Node.js backend and Python AI scripts.

**Python executable detection:**
At startup, probes for `python3` then `python` — caches the result. This handles both Linux (Render) and Windows (local dev).

**`runPython()` function:**
- Serializes payload to JSON
- Passes it to Python script via `stdin` using `spawnSync`
- Reads JSON response from `stdout`
- Timeout: 90 seconds (increased from 35s to handle Groq API latency)
- Explicitly forwards `GROQ_API_KEY` in the subprocess environment

**`evaluateSubmission()` pipeline:**
1. Run plagiarism check against all other submissions
2. If similarity > 70% → flag, skip grading, return "Flagged for Plagiarism"
3. Otherwise → call `gradeWithGroq()` for AI scoring
4. Determine `aiStatus`: "AI Checked", "AI Check Failed", "Pending Trainer Review", or "Flagged for Plagiarism"

**Startup dependency check:**
Runs `setImmediate()` to verify Python packages are installed — non-blocking, purely diagnostic. Uses 60-second timeout to survive Render cold starts.

---

#### `backend/src/services/certificateService.js`
**Purpose:** Certificate generation, eligibility checking, and public verification.

**Eligibility criteria:**
- Student must be enrolled in the offering
- Must have submitted ≥ 100% of required assignments
- Must have ≥ 85% attendance (if attendance records exist)
- Required assignments = `hours_per_week × duration_weeks`

**`issueCertificate()` flow:**
1. Check if certificate generation is enabled (settings)
2. Check for existing certificate (idempotent — returns existing if found)
3. Fetch offering and course info
4. Run eligibility check
5. Generate unique UUID for the certificate
6. Generate QR code encoding `{FRONTEND_URL}/verify-certificate/{uuid}`
7. Insert certificate record
8. Log "generated" event
9. Send notification to student

**`verifyCertificate()` — public endpoint:**
1. Fetch certificate by UUID
2. If not found → return `{ status: 'INVALID' }`
3. If revoked → return `{ status: 'REVOKED', revokedAt, revokeReason }`
4. If valid → return `{ status: 'VALID', details: { studentName, courseName, ... } }`
5. Log "verified" event

---

#### `backend/src/services/trainerApplicationService.js`
**Purpose:** Manages the trainer verification workflow.

**`submitApplication()` — trainer submits:**
- Validates required fields (experience, skills, bio ≥ 20 chars)
- Optionally uploads CV to Supabase Storage
- Uses `upsert` with `onConflict: 'trainer_id'` — allows re-submission after rejection
- Resets `trainer_status` to `'pending'` on re-submission

**`listAllTrainers()` — admin fetches all trainers:**
Uses **two separate queries** instead of a PostgREST join:
1. Query 1: `SELECT ... FROM profiles WHERE role = 'trainer'`
2. Query 2: `SELECT ... FROM trainer_applications WHERE trainer_id IN (...)`
3. Merge in JavaScript

**Why two queries?** PostgREST (Supabase's REST layer) uses a schema cache. After running a migration that creates a new table, the cache may not refresh immediately, causing join queries to fail. Two flat queries always work regardless of cache state.

**`reviewApplication()` — admin approves/rejects:**
1. Updates `trainer_status` in `profiles` table
2. Updates `reviewed_at`, `reviewed_by`, `admin_notes` in `trainer_applications`

---

### Frontend Files

#### `frontend/contexts/AuthContext.tsx`
**Purpose:** Global authentication state management using React Context.

**State managed:**
- `user` — full user object (id, email, name, role, trainerStatus, avatar)
- `token` — Supabase access token
- `isAuthenticated` — boolean (true if both token and user exist)
- `isLoading` — true during initial localStorage read
- `isOffline` — true when browser detects no network

**`login()` function:**
1. Calls `authAPI.login()` (POST /api/auth/login)
2. On success: clears old storage, sets new token and user in state and localStorage
3. Does NOT clear storage before the request — preserves session if request fails

**`logout()` function:**
1. Clears React state (token, user)
2. Removes from localStorage
3. Calls `authAPI.logout()` fire-and-forget (tells backend to sign out from Supabase)

**Offline handling:**
- Detects `navigator.onLine` changes
- When offline: does NOT redirect to login even if not authenticated
- Prevents false 401 errors from being treated as auth failures

---

#### `frontend/lib/api/client.ts`
**Purpose:** Configured Axios instance with request/response interceptors.

**Request interceptor:**
1. Checks `navigator.onLine` — if offline, rejects immediately with `isOfflineError: true`
2. Reads token from `localStorage` and adds `Authorization: Bearer <token>` header
3. If data is `FormData`, removes `Content-Type` header (lets browser set multipart boundary)

**Response interceptor:**
1. On success: returns `response.data` (unwraps Axios wrapper)
2. On network error (no response): returns user-friendly message, does NOT clear auth
3. On 401: checks if it's a "genuine auth failure" by matching exact error strings:
   - `"Invalid or expired token"` — from authMiddleware
   - `"Token expired"` — from errorMiddleware
   - `"jwt expired"`, `"jwt malformed"` — from JWT library
4. If genuine auth failure: clears localStorage and redirects to `/login`
5. If 401 but not genuine (e.g., "Invalid or expired QR token"): just surfaces the error

**Why exact string matching?** To avoid false logouts. A 401 from "Invalid or expired QR token" should NOT log the user out — it's a domain error, not an auth failure.

---

#### `frontend/components/layout/DashboardLayout.tsx`
**Purpose:** Wrapper component for all authenticated dashboard pages.

**What it renders:**
- Loading spinner while auth is initializing
- Offline holding screen if not authenticated and offline
- Redirects to `/login` if not authenticated and online
- Full layout: Sidebar + Header + main content area

**Mobile sidebar state:**
- Manages `mobileSidebarOpen` boolean
- Passes it to `Sidebar` as `mobileOpen` prop
- Passes `onMenuClick` to `Header` to open the sidebar

**Responsive layout:**
- Root div: `flex min-h-screen overflow-x-hidden`
- Main content: `flex-1 flex flex-col min-w-0` — `min-w-0` prevents flex overflow
- Content padding: `p-4 md:p-6` — smaller on mobile

---

#### `frontend/components/layout/Sidebar.tsx`
**Purpose:** Role-based navigation sidebar with mobile drawer support.

**Desktop behavior (md+):**
- Fixed left column, `w-72` (expanded) or `w-20` (collapsed)
- Collapse/expand toggle button
- Shows role badge at bottom

**Mobile behavior (<md):**
- Hidden by default (`-translate-x-full`)
- When `mobileOpen=true`: slides in as fixed overlay (`translate-x-0`)
- Dark backdrop behind it — clicking backdrop closes it
- Close (✕) button replaces collapse toggle
- Tapping any nav link closes the drawer

**Navigation items:** Different per role — student, trainer, alumni, recruiter, admin each have their own nav array.

---

#### `frontend/components/layout/Header.tsx`
**Purpose:** Top navigation bar with notifications and profile dropdown.

**Components:**
- Hamburger button (mobile only, `md:hidden`) — calls `onMenuClick` to open sidebar
- Page title and subtitle
- Notification bell with unread count badge
- Profile dropdown with avatar, name, role, and logout

**Notifications:**
- Fetches from `/api/notifications` on mount and every 30 seconds
- Marks as read when notification panel is opened
- Shows type-specific emoji icons

---
## 5. AUTHENTICATION FLOW

Test

---

## 5. AUTHENTICATION FLOW

### Step 1 � Signup

1. User fills the signup form at `/signup` (firstName, lastName, email, password, role)
2. Frontend calls `POST /api/auth/signup`
3. `authController.signup()` validates all fields (email format, password length, name length, valid role)
4. `authService.signUp()` is called:
   - Checks if registration is enabled (reads from `settings` table)
   - Calls `supabaseAuthClient.auth.signUp()` � creates user in Supabase Auth, sends verification email
   - Inserts profile record in `profiles` table via `supabaseAdminClient`
   - Sets `trainer_status: 'pending'` for trainers, `null` for all other roles
5. Returns user object (no token � user must verify email first)
6. Frontend redirects to `/verify-email?message=check`

### Step 2 � Email Verification

- Supabase sends a verification email automatically
- User clicks the link in the email
- Supabase marks `email_confirmed_at` in their Auth system
- On next login, `authService.signIn()` syncs this to `profiles.email_verified = true`

### Step 3 � Login

1. User submits email + password at `/login`
2. Frontend calls `POST /api/auth/login`
3. `authService.signIn()` is called:
   - Calls `supabaseAuthClient.auth.signInWithPassword()` � validates credentials
   - Fetches profile from `profiles` table
   - Syncs email verification status if needed
   - Rejects login if `email_verified = false`
   - Returns `accessToken`, `refreshToken`, `expiresIn`, and full user object
4. `AuthContext.login()` stores token and user in `localStorage`
5. `shouldRedirect` state triggers `router.push('/{role}/dashboard')`

### Step 4 � Authenticated Requests

Every API request that requires authentication:

```
Frontend (apiClient.ts)
  ? reads token from localStorage
  ? adds header: Authorization: Bearer <token>
  ? sends request to backend

Backend (authMiddleware.verifyToken)
  ? extracts token from Authorization header
  ? calls supabase.auth.getUser(token)  [validates with Supabase server]
  ? fetches profile from profiles table
  ? attaches req.user = { id, email, role, trainerStatus, ... }
  ? calls next()

Controller ? Service ? Database ? Response
```

### Step 5 � Token Expiry and 401 Handling

- Supabase access tokens expire (default ~1 hour, extended via Supabase dashboard)
- When a token expires, `supabase.auth.getUser(token)` returns an error
- Backend throws `UnauthorizedError('Invalid or expired token')`
- Frontend `apiClient` response interceptor catches the 401
- Checks if the error message matches known auth failure strings
- If genuine auth failure: clears `localStorage` and redirects to `/login`
- If 401 from a domain error (e.g., "Invalid or expired QR token"): does NOT logout

### Step 6 � Logout

1. User clicks Logout
2. `AuthContext.logout()` is called:
   - Clears React state (token, user set to null)
   - Removes `token` and `user` from `localStorage`
   - Calls `authAPI.logout()` fire-and-forget ? `POST /api/auth/logout`
3. Backend `authController.logout()` calls `supabaseAuthClient.auth.signOut()`
4. User is redirected to `/login`

### The signOut Bug (Critical for Viva)

**What was wrong:**
```js
// ORIGINAL CODE � BUGGY
export const signIn = async (credentials) => {
  try {
    // This line was the bug:
    await supabaseAuthClient.auth.signOut();  // ? REMOVED
    
    const { data: authData } = await supabaseAuthClient.auth.signInWithPassword(...)
```

**Why it caused cross-device logout:**
- `supabaseAuthClient` is a **singleton** shared across all HTTP requests on the server
- When User A logs in, `signInWithPassword()` sets User A's session in the singleton's memory
- When User B logs in later, `signOut()` is called on the same singleton
- Supabase's `signOut()` with no scope defaults to **global** � invalidates ALL sessions for the user currently in the singleton's memory (User A)
- User A's next request gets 401 ? frontend clears storage ? User A is logged out

**Fix:** Removed the `signOut()` call entirely. The comment said "prevents session conflicts" but this is only valid for browser-side code, not a shared server singleton.

---
