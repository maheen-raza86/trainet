# Requirements Document

## Introduction

The Mentorship Sessions feature extends the existing TRAINET alumni chat system with a structured, topic-specific guidance workflow. When an alumni accepts a basic mentorship request (existing flow), they can now create a full **Mentorship Session** — a lightweight, personal, short-term engagement that includes a meeting link, uploaded materials, a schedule, and session notes. This feature introduces two new request types (`guidance_requests` and `mentorship_sessions`) and four new database tables, without modifying any existing tables or routes.

The feature adds:
- A student-initiated **Guidance Request** (topic-specific, separate from the existing `mentorship_requests`)
- An alumni-created **Mentorship Session** linked to an accepted guidance request
- Material uploads, session notes, and student feedback
- A "Request Guidance" button inside the existing chat page (additive only)
- A session card in the chat sidebar when an active session exists between the two users
- Role-based access control and lifecycle notifications

---

## Glossary

- **Guidance_Request**: A topic-specific help request submitted by a student to a specific alumni, stored in the `guidance_requests` table. Distinct from the existing `mentorship_requests`.
- **Mentorship_Session**: A structured session created by an alumni after accepting a Guidance_Request, stored in the `mentorship_sessions` table.
- **Session_Material**: A file or link uploaded by an alumni to a Mentorship_Session, stored in `mentorship_materials`.
- **Session_Feedback**: A rating and comment submitted by a student after a Mentorship_Session reaches `completed` status, stored in `mentorship_feedback`.
- **Guidance_API**: The backend service handling all `/api/guidance/*` routes.
- **Student**: A user with role `student`.
- **Alumni**: A user with role `alumni`.
- **Admin**: A user with role `admin`.
- **Trainer**: A user with role `trainer`.
- **Notification_Service**: The existing service at `/api/notifications` used to deliver in-app notifications.
- **Chat_Page**: The existing page at `/alumni/messages/[userId]`.
- **DashboardLayout**: The existing shared layout component used across student and alumni dashboards.

---

## Requirements

### Requirement 1: Student Creates a Guidance Request

**User Story:** As a Student, I want to submit a topic-specific guidance request to an alumni I am chatting with, so that I can get structured help on a specific subject.

#### Acceptance Criteria

1. WHEN a Student submits a guidance request with a valid `topic`, `description`, `preferred_duration`, `preferred_schedule`, and `alumni_id`, THE Guidance_API SHALL create a record in `guidance_requests` with `status = pending` and return the created record.
2. THE Guidance_API SHALL set the `student_id` field on every created Guidance_Request to the authenticated user's id, regardless of any value supplied in the request body.
3. IF a Student submits a guidance request with a missing `topic` or `description`, THEN THE Guidance_API SHALL return HTTP 400 with a descriptive error message.
4. IF a Student submits a guidance request with a `topic` shorter than 3 characters, THEN THE Guidance_API SHALL return HTTP 400.
5. IF a Student submits a guidance request with a `description` shorter than 10 characters, THEN THE Guidance_API SHALL return HTTP 400.
6. WHERE an `attachment_url` is provided, THE Guidance_API SHALL store it on the Guidance_Request; where it is absent, THE Guidance_API SHALL store `null`.
7. WHEN a Guidance_Request is created, THE Notification_Service SHALL send a notification to the target alumni with title "New Guidance Request" and type `mentorship`.
8. WHEN a Student requests their own guidance requests via `GET /api/guidance/student`, THE Guidance_API SHALL return only records where `student_id` equals the authenticated user's id.
9. IF a Trainer calls any `/api/guidance/*` endpoint, THEN THE Guidance_API SHALL return HTTP 403.

---

### Requirement 2: Alumni Responds to a Guidance Request

**User Story:** As an Alumni, I want to accept or reject incoming guidance requests, so that I can manage my availability and commit to sessions I can support.

#### Acceptance Criteria

1. WHEN an Alumni calls `PUT /api/guidance/:id/respond` with `status = accepted` or `status = rejected`, THE Guidance_API SHALL update the Guidance_Request's status to the submitted value and return the updated record.
2. IF an Alumni calls `PUT /api/guidance/:id/respond` on a Guidance_Request whose `alumni_id` does not match the authenticated user's id, THEN THE Guidance_API SHALL return HTTP 403.
3. IF an Alumni calls `PUT /api/guidance/:id/respond` with a `status` value other than `accepted` or `rejected`, THEN THE Guidance_API SHALL return HTTP 400.
4. IF an Alumni calls `PUT /api/guidance/:id/respond` on a Guidance_Request that is not in `pending` status, THEN THE Guidance_API SHALL return HTTP 409 with message "Request is no longer pending".
5. WHEN an Alumni accepts a Guidance_Request, THE Notification_Service SHALL send a notification to the student with title "Guidance Request Accepted" and type `mentorship`.
6. WHEN an Alumni rejects a Guidance_Request, THE Notification_Service SHALL send a notification to the student with title "Guidance Request Rejected" and type `mentorship`.
7. WHEN an Alumni calls `GET /api/guidance/alumni`, THE Guidance_API SHALL return only Guidance_Requests where `alumni_id` equals the authenticated user's id.

---

### Requirement 3: Alumni Creates a Mentorship Session

**User Story:** As an Alumni, I want to create a Mentorship Session after accepting a guidance request, so that I can provide a structured, scheduled engagement with the student.

#### Acceptance Criteria

1. WHEN an Alumni calls `POST /api/guidance/sessions` with a valid `guidance_request_id`, `title`, `topic`, `start_date`, `end_date`, and `meeting_link`, THE Guidance_API SHALL create a Mentorship_Session with `status = pending` and return the created record.
2. THE Guidance_API SHALL set the `alumni_id` and `student_id` on every created Mentorship_Session to the values from the linked Guidance_Request, regardless of any values supplied in the request body.
3. IF an Alumni calls `POST /api/guidance/sessions` with a `guidance_request_id` that is not in `accepted` status, THEN THE Guidance_API SHALL return HTTP 409 with message "Guidance request must be accepted before creating a session".
4. IF an Alumni calls `POST /api/guidance/sessions` with a `guidance_request_id` that belongs to a different alumni, THEN THE Guidance_API SHALL return HTTP 403.
5. IF an Alumni calls `POST /api/guidance/sessions` with a missing `title`, `topic`, `start_date`, `end_date`, or `meeting_link`, THEN THE Guidance_API SHALL return HTTP 400 with a descriptive error message.
6. IF an Alumni calls `POST /api/guidance/sessions` with an `end_date` that is before or equal to `start_date`, THEN THE Guidance_API SHALL return HTTP 400 with message "end_date must be after start_date".
7. WHEN a Mentorship_Session is created, THE Notification_Service SHALL send a notification to the student with title "Mentorship Session Created" and type `mentorship`.
8. WHERE `allow_group_session` is `true` and `max_students` is provided, THE Guidance_API SHALL store those values on the Mentorship_Session; where absent, THE Guidance_API SHALL default `allow_group_session` to `false` and `max_students` to `1`.

---

### Requirement 4: Session Status Lifecycle

**User Story:** As an Alumni, I want to update the status of a Mentorship Session through its lifecycle, so that students and I can track progress clearly.

#### Acceptance Criteria

1. THE Guidance_API SHALL enforce the following status transitions for Mentorship_Sessions: `pending → active`, `active → completed`, `active → cancelled`, `pending → cancelled`. All other transitions SHALL be rejected with HTTP 409.
2. WHEN an Alumni calls `PUT /api/guidance/sessions/:id` with a valid status transition, THE Guidance_API SHALL update the session status and return the updated record.
3. IF an Alumni calls `PUT /api/guidance/sessions/:id` on a session whose `alumni_id` does not match the authenticated user's id, THEN THE Guidance_API SHALL return HTTP 403.
4. WHEN a Mentorship_Session transitions to `active`, THE Notification_Service SHALL send a notification to the student with title "Your Session is Now Active" and type `mentorship`.
5. WHEN a Mentorship_Session transitions to `completed`, THE Notification_Service SHALL send a notification to the student with title "Session Completed" and type `mentorship`.
6. WHEN a Mentorship_Session transitions to `cancelled`, THE Notification_Service SHALL send a notification to the student with title "Session Cancelled" and type `mentorship`.
7. IF applying the same status transition twice (idempotent check), THEN THE Guidance_API SHALL return HTTP 409 on the second call because the session is already in that state.

---

### Requirement 5: Alumni Updates Session Details

**User Story:** As an Alumni, I want to update session details such as meeting link, schedule, and notes, so that I can keep the student informed of any changes.

#### Acceptance Criteria

1. WHEN an Alumni calls `PUT /api/guidance/sessions/:id` with updated fields (`title`, `description`, `meeting_link`, `schedule_text`, `session_notes`, `duration_text`), THE Guidance_API SHALL update only the provided fields and return the full updated session record.
2. IF an Alumni calls `PUT /api/guidance/sessions/:id` on a session in `completed` or `cancelled` status, THEN THE Guidance_API SHALL return HTTP 409 with message "Cannot update a completed or cancelled session".
3. THE Guidance_API SHALL NOT allow a Student or Trainer to call `PUT /api/guidance/sessions/:id`; such calls SHALL return HTTP 403.

---

### Requirement 6: Alumni Uploads Materials to a Session

**User Story:** As an Alumni, I want to upload files and links to a Mentorship Session, so that the student has access to relevant learning resources.

#### Acceptance Criteria

1. WHEN an Alumni calls `POST /api/guidance/sessions/:id/materials` with a valid `title`, `file_url`, and `type`, THE Guidance_API SHALL create a Session_Material record linked to the session and return the created record.
2. THE Guidance_API SHALL set `uploaded_by` on every Session_Material to the authenticated user's id.
3. IF an Alumni calls `POST /api/guidance/sessions/:id/materials` on a session whose `alumni_id` does not match the authenticated user's id, THEN THE Guidance_API SHALL return HTTP 403.
4. IF an Alumni calls `POST /api/guidance/sessions/:id/materials` with a `type` not in `[pdf, slides, image, document, link]`, THEN THE Guidance_API SHALL return HTTP 400.
5. WHEN a Session_Material is uploaded, THE Notification_Service SHALL send a notification to the student with title "New Material Added" and type `mentorship`.
6. WHEN a Student or Alumni calls `GET /api/guidance/sessions/:id/materials`, THE Guidance_API SHALL return all Session_Materials linked to that session, ordered by `created_at` ascending.
7. IF a Student calls `GET /api/guidance/sessions/:id/materials` for a session whose `student_id` does not match the authenticated user's id, THEN THE Guidance_API SHALL return HTTP 403.

---

### Requirement 7: Student Views Sessions and Session Detail

**User Story:** As a Student, I want to view all my Mentorship Sessions and drill into a specific session, so that I can access meeting links, materials, notes, and session status.

#### Acceptance Criteria

1. WHEN a Student calls `GET /api/guidance/sessions/student`, THE Guidance_API SHALL return all Mentorship_Sessions where `student_id` equals the authenticated user's id, ordered by `created_at` descending.
2. WHEN a Student calls `GET /api/guidance/sessions/:id`, THE Guidance_API SHALL return the full session record including `guidance_request_id`, `meeting_link`, `schedule_text`, `session_notes`, `status`, `start_date`, `end_date`, and the alumni's profile name.
3. IF a Student calls `GET /api/guidance/sessions/:id` for a session whose `student_id` does not match the authenticated user's id, THEN THE Guidance_API SHALL return HTTP 403.
4. THE Student_Dashboard SHALL display sessions at `/student/guidance` using DashboardLayout with status badges: `pending = yellow`, `active = blue`, `completed = green`, `cancelled = red`.
5. THE Student_Dashboard SHALL display a session detail page at `/student/guidance/[id]` with sections: Info, Meeting (Google Meet link + Join button), Materials, Notes, and a link to the existing Chat_Page.

---

### Requirement 8: Alumni Views and Manages Sessions

**User Story:** As an Alumni, I want to view all my created sessions and manage each one from a dedicated page, so that I can track my commitments and update session details.

#### Acceptance Criteria

1. WHEN an Alumni calls `GET /api/guidance/sessions/alumni`, THE Guidance_API SHALL return all Mentorship_Sessions where `alumni_id` equals the authenticated user's id, ordered by `created_at` descending.
2. THE Alumni_Dashboard SHALL display incoming guidance requests at `/alumni/requests` using DashboardLayout, with tabs for `pending`, `accepted`, and `rejected` requests.
3. THE Alumni_Dashboard SHALL display created sessions at `/alumni/sessions` using DashboardLayout with status badges matching the color scheme in Requirement 7.4.
4. THE Alumni_Dashboard SHALL display a session management page at `/alumni/sessions/[id]` with sections: Info, Meeting (editable meeting link), Materials (upload form + list), Notes (editable), and a link to the existing Chat_Page.
5. IF an Alumni calls `GET /api/guidance/sessions/alumni` and has no sessions, THE Guidance_API SHALL return an empty array with HTTP 200.

---

### Requirement 9: Student Submits Feedback

**User Story:** As a Student, I want to submit a rating and comment after a session completes, so that I can share my experience and help the alumni improve.

#### Acceptance Criteria

1. WHEN a Student calls `POST /api/guidance/sessions/:id/feedback` with a `rating` between 1 and 5 (inclusive) and an optional `comment`, THE Guidance_API SHALL create a Session_Feedback record and return it.
2. IF a Student calls `POST /api/guidance/sessions/:id/feedback` on a session that is not in `completed` status, THEN THE Guidance_API SHALL return HTTP 409 with message "Feedback can only be submitted for completed sessions".
3. IF a Student calls `POST /api/guidance/sessions/:id/feedback` with a `rating` outside the range 1–5, THEN THE Guidance_API SHALL return HTTP 400 with message "Rating must be between 1 and 5".
4. IF a Student calls `POST /api/guidance/sessions/:id/feedback` on a session whose `student_id` does not match the authenticated user's id, THEN THE Guidance_API SHALL return HTTP 403.
5. IF a Student calls `POST /api/guidance/sessions/:id/feedback` when feedback already exists for that session from that student, THEN THE Guidance_API SHALL return HTTP 409 with message "Feedback already submitted".
6. WHEN a Student submits feedback, THE Notification_Service SHALL send a notification to the alumni with title "Student Submitted Feedback" and type `mentorship`.
7. WHEN an Alumni calls `GET /api/guidance/sessions/:id/feedback`, THE Guidance_API SHALL return all Session_Feedback records for that session.

---

### Requirement 10: Chat Page Integration (Additive)

**User Story:** As a Student, I want to request guidance directly from the chat page, so that I can initiate a structured session without leaving the conversation.

#### Acceptance Criteria

1. THE Chat_Page SHALL display a "Request Guidance" button in the chat header area that is visible to both Students and Alumni.
2. WHEN a user clicks "Request Guidance", THE Chat_Page SHALL open a modal containing a form with fields: `topic` (required), `description` (required), `preferred_duration` (optional), `preferred_schedule` (optional), and an optional file attachment field.
3. WHEN the guidance request form is submitted successfully, THE Chat_Page SHALL close the modal and display a success toast notification.
4. IF an active Mentorship_Session exists between the two chat participants, THE Chat_Page SHALL display a session card in the chat sidebar showing: session title, status badge, start date, and a "View Session" link.
5. THE Chat_Page integration SHALL NOT modify any existing message sending, conversation fetching, or inbox functionality.

---

### Requirement 11: Admin Read-Only Access

**User Story:** As an Admin, I want to view all guidance requests and mentorship sessions across the platform, so that I can monitor activity and ensure quality.

#### Acceptance Criteria

1. WHEN an Admin calls `GET /api/guidance/sessions/:id`, `GET /api/guidance/sessions/student`, or `GET /api/guidance/sessions/alumni`, THE Guidance_API SHALL return the requested data without filtering by user id.
2. IF an Admin calls `POST`, `PUT`, or `DELETE` endpoints under `/api/guidance/*`, THEN THE Guidance_API SHALL return HTTP 403.
3. THE Guidance_API SHALL NOT expose a dedicated admin UI page for this feature; admin access is via the existing admin dashboard or direct API calls.

---

### Requirement 12: Data Integrity and Ownership Invariants

**User Story:** As a system operator, I want all guidance and session records to maintain correct ownership fields, so that data cannot be tampered with by unauthorized users.

#### Acceptance Criteria

1. THE Guidance_API SHALL ensure that for every created Guidance_Request, the `student_id` field equals the `id` of the authenticated user who made the POST request.
2. THE Guidance_API SHALL ensure that for every created Mentorship_Session, the `student_id` and `alumni_id` fields are copied from the linked Guidance_Request and cannot be overridden by the request body.
3. THE Guidance_API SHALL ensure that for every created Session_Material, the `uploaded_by` field equals the `id` of the authenticated user who made the POST request.
4. THE Guidance_API SHALL ensure that for every created Session_Feedback, the `student_id` field equals the `id` of the authenticated user who made the POST request.
5. IF any request body includes `student_id`, `alumni_id`, or `uploaded_by` fields that differ from the server-derived values, THE Guidance_API SHALL silently ignore those values and use the server-derived values.

---

## Correctness Properties for Property-Based Testing

### Property 1: Guidance Request Ownership Invariant
For any valid guidance request creation call by an authenticated student with id `S`, the `student_id` field on the returned record SHALL always equal `S`, regardless of any `student_id` value supplied in the request body.

*Pattern: Invariant — the student_id is always server-derived.*

### Property 2: Session Ownership Derivation Invariant
For any valid mentorship session creation call linked to a Guidance_Request with `student_id = S` and `alumni_id = A`, the created session's `student_id` SHALL equal `S` and `alumni_id` SHALL equal `A`, regardless of any values supplied in the request body.

*Pattern: Invariant — ownership fields are always copied from the linked request.*

### Property 3: Session Status Transition Validity
For any Mentorship_Session in state `X`, calling `PUT /api/guidance/sessions/:id` with a target state `Y` where `(X, Y)` is NOT in `{(pending, active), (active, completed), (active, cancelled), (pending, cancelled)}`, THE Guidance_API SHALL return a non-2xx response.

*Pattern: Metamorphic — invalid transitions always fail regardless of session content.*

### Property 4: Feedback Rating Bounds
For any feedback submission with `rating = R`, if `R < 1` or `R > 5`, THE Guidance_API SHALL return HTTP 400. If `1 ≤ R ≤ 5`, THE Guidance_API SHALL return HTTP 201 (given all other conditions are met).

*Pattern: Error conditions — boundary values are enforced consistently.*

### Property 5: Role-Based Access Denial for Trainers
For any endpoint under `/api/guidance/*`, a request authenticated with role `trainer` SHALL always receive HTTP 403, regardless of the endpoint method or path parameters.

*Pattern: Metamorphic — role denial is consistent across all inputs.*

### Property 6: Material Upload Count Invariant
For a Mentorship_Session with `N` existing materials, after uploading `K` additional valid materials, `GET /api/guidance/sessions/:id/materials` SHALL return exactly `N + K` records.

*Pattern: Invariant — material count grows monotonically with uploads.*

### Property 7: Student Data Isolation
For any student with id `S1`, `GET /api/guidance/sessions/student` SHALL never return a session whose `student_id` is not `S1`, regardless of how many sessions exist in the system for other students.

*Pattern: Invariant — data isolation is preserved across all system states.*
