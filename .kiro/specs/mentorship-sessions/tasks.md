# Tasks: Mentorship Sessions

## Task List

- [x] 1. Database Migration
  - [x] 1.1 Create `backend/database/migrations/007_mentorship_sessions.sql` with tables: `guidance_requests`, `mentorship_sessions`, `mentorship_materials`, `mentorship_feedback` — including all columns, FK constraints, CHECK constraints, UNIQUE constraint on feedback, and `updated_at` triggers

- [x] 2. Backend Service
  - [x] 2.1 Create `backend/src/services/guidanceService.js` with `createRequest(userId, role, body)` — validates topic (≥3 chars), description (≥10 chars), sets student_id from userId, inserts into guidance_requests, fires notification to alumni
  - [x] 2.2 Add `getStudentRequests(userId, role)` and `getAlumniRequests(userId, role)` to guidanceService — admin bypasses user filter, others filter by student_id/alumni_id respectively
  - [x] 2.3 Add `respondToRequest(requestId, alumniUserId, status)` to guidanceService — validates ownership, pending status, valid status value (accepted/rejected), updates record, fires notification to student
  - [x] 2.4 Add `createSession(alumniUserId, body)` to guidanceService — validates guidance_request is accepted and owned by this alumni, validates required fields, validates end_date > start_date, sets student_id/alumni_id from linked request, inserts session, fires notification to student
  - [x] 2.5 Add `getStudentSessions(userId, role)`, `getAlumniSessions(userId, role)`, `getSessionById(sessionId, userId, role)` to guidanceService — with ownership checks and admin bypass
  - [x] 2.6 Add `updateSession(sessionId, alumniUserId, body)` to guidanceService — validates ownership, blocks update on completed/cancelled sessions, enforces VALID_TRANSITIONS table for status changes, applies partial update, fires notifications on status transitions
  - [x] 2.7 Add `uploadMaterial(sessionId, alumniUserId, body)` and `getMaterials(sessionId, userId, role)` to guidanceService — validates ownership, validates type in ['pdf','slides','image','document','link'], sets uploaded_by from userId, fires notification to student; getMaterials ordered by created_at asc with student ownership check
  - [x] 2.8 Add `submitFeedback(sessionId, studentId, body)` and `getFeedback(sessionId, alumniUserId, role)` to guidanceService — validates session is completed, student ownership, rating 1–5, uniqueness; fires notification to alumni

- [x] 3. Backend Controller
  - [x] 3.1 Create `backend/src/controllers/guidanceController.js` with thin handler functions for all 14 endpoints — each extracts req.user/params/body, calls service, returns `{ success, message, data }` with appropriate HTTP status codes (201 for creates, 200 for reads/updates)

- [x] 4. Backend Routes
  - [x] 4.1 Create `backend/src/routes/guidanceRoutes.js` — register all 14 routes with `verifyToken` and `authorizeRoles` middleware; ensure `sessions/student` and `sessions/alumni` are registered before `sessions/:id`; trainer role excluded from all routes

- [x] 5. Register Routes in Index
  - [x] 5.1 Add `import guidanceRoutes from './guidanceRoutes.js'` and `router.use('/guidance', guidanceRoutes)` to `backend/src/routes/index.js`

- [x] 6. Frontend API Client
  - [x] 6.1 Create `frontend/lib/api/guidance.ts` exporting `guidanceApi` object with typed functions for all 14 endpoints using `apiClient`

- [x] 7. Frontend: Student Guidance Page
  - [x] 7.1 Create `frontend/app/student/guidance/page.tsx` — DashboardLayout, lists guidance requests and sessions in separate sections, status badges (pending=yellow, active=blue, completed=green, cancelled=red), links to session detail

- [x] 8. Frontend: Student Session Detail Page
  - [x] 8.1 Create `frontend/app/student/guidance/[id]/page.tsx` — DashboardLayout, sections: Info (title, topic, dates, status badge), Meeting (meeting_link with "Join" button), Materials (list from GET materials), Notes (session_notes read-only), Chat link to `/alumni/messages/[alumniId]`; feedback form shown when status=completed

- [x] 9. Frontend: Alumni Requests Page
  - [x] 9.1 Create `frontend/app/alumni/requests/page.tsx` — DashboardLayout, tabs for pending/accepted/rejected guidance requests, accept/reject buttons on pending requests, "Create Session" button on accepted requests that opens a modal form with fields: title, topic, description, start_date, end_date, meeting_link, schedule_text, duration_text

- [x] 10. Frontend: Alumni Sessions List Page
  - [x] 10.1 Create `frontend/app/alumni/sessions/page.tsx` — DashboardLayout, lists all alumni sessions with status badges, links to session detail

- [x] 11. Frontend: Alumni Session Detail Page
  - [x] 11.1 Create `frontend/app/alumni/sessions/[id]/page.tsx` — DashboardLayout, sections: Info (read-only), Meeting (editable meeting_link with save button), Materials (upload form with title/file_url/type fields + list of existing materials), Notes (editable session_notes with save button), Chat link; status transition buttons (e.g., "Mark Active", "Mark Completed", "Cancel") based on current status

- [x] 12. Frontend: Sidebar Update
  - [x] 12.1 Add `{ name: 'Guidance', href: '/student/guidance', icon: SparklesIcon }` to student nav in `frontend/components/layout/Sidebar.tsx`
  - [x] 12.2 Add `{ name: 'Requests', href: '/alumni/requests', icon: ClipboardDocumentListIcon }` and `{ name: 'Sessions', href: '/alumni/sessions', icon: AcademicCapIcon }` to alumni nav in `frontend/components/layout/Sidebar.tsx`

- [x] 13. Frontend: Chat Page Integration (additive only)
  - [x] 13.1 Add "Request Guidance" button to the chat header in `frontend/app/alumni/messages/[userId]/page.tsx` — opens a modal with form fields: topic (required), description (required), preferred_duration (optional), preferred_schedule (optional); on submit calls `guidanceApi.createRequest`, shows success toast, closes modal. Do NOT modify existing fetchMessages, handleSend, or message rendering logic.
  - [x] 13.2 Add active session card to the chat sidebar in `frontend/app/alumni/messages/[userId]/page.tsx` — on mount, call `GET /api/guidance/sessions/student` (or alumni equivalent), find any session where the other participant matches `userId` and status is `active`, display card with session title, status badge, start_date, and "View Session" link. Do NOT modify existing message logic.

- [-] 14. Property-Based Tests
  - [ ] 14.1 Install `fast-check` in backend dev dependencies and create `backend/src/tests/guidance.property.test.js`
  - [x] 14.2 Write Property 1 test: generate random student_id overrides in body, verify returned student_id always equals authenticated user's id — `// Feature: mentorship-sessions, Property 1: Guidance Request Ownership Invariant`
  - [x] 14.3 Write Property 2 test: generate random student_id/alumni_id overrides in session creation body, verify they are always overridden by linked request values — `// Feature: mentorship-sessions, Property 2: Session Ownership Derivation Invariant`
  - [ ] 14.4 Write Property 3 test: generate all (current_status, target_status) pairs, verify only valid transitions return 2xx and all others return 409 — `// Feature: mentorship-sessions, Property 3: Session Status Transition Validity`
  - [ ] 14.5 Write Property 4 test: generate integer ratings across wide range, verify 400 for values outside [1,5] and 201 for values inside [1,5] — `// Feature: mentorship-sessions, Property 4: Feedback Rating Bounds`
  - [ ] 14.6 Write Property 5 test: verify trainer role always receives 403 on all /api/guidance/* endpoints — `// Feature: mentorship-sessions, Property 5: Role-Based Access Denial for Trainers`
  - [ ] 14.7 Write Property 6 test: upload K random valid materials, verify GET returns exactly N+K records — `// Feature: mentorship-sessions, Property 6: Material Upload Count Invariant`
  - [ ] 14.8 Write Property 7 test: create sessions for multiple students, verify each student's GET only returns their own sessions — `// Feature: mentorship-sessions, Property 7: Student Data Isolation`
  - [ ] 14.9 Write Property 8 test: generate strings of varying lengths for topic and description, verify 400 for below-minimum and 201 for valid — `// Feature: mentorship-sessions, Property 8: Guidance Request Validation Bounds`
  - [ ] 14.10 Write Property 9 test: create requests owned by alumni A, attempt respond as alumni B ≠ A, verify always 403 — `// Feature: mentorship-sessions, Property 9: Respond Ownership Invariant`
  - [ ] 14.11 Write Property 10 test: generate random strings for material type, verify 400 for any value not in valid set — `// Feature: mentorship-sessions, Property 10: Material Type Validation`
