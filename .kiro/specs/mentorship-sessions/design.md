# Design Document: Mentorship Sessions

## Overview

The Mentorship Sessions feature extends the TRAINET alumni chat system with a structured, topic-specific guidance workflow. It introduces two new request types — `guidance_requests` and `mentorship_sessions` — and four new database tables, without modifying any existing tables or routes.

The feature follows the existing Express.js + Supabase pattern: routes → controllers → services → supabase client. All new backend code lives under `/api/guidance/*` in three new files (`guidanceRoutes.js`, `guidanceController.js`, `guidanceService.js`) registered in `routes/index.js`. Frontend pages are added under `/student/guidance/*` and `/alumni/requests`, `/alumni/sessions/*`. The existing chat page at `/alumni/messages/[userId]` is extended additively only.

### Key Design Decisions

- **Separate route namespace**: `/api/guidance/*` keeps the new feature fully isolated from existing `/api/alumni/*` routes, avoiding any risk of breaking existing functionality.
- **Ownership fields are always server-derived**: `student_id`, `alumni_id`, and `uploaded_by` are never trusted from the request body — they are always set from the authenticated user or the linked record.
- **Status transitions are enforced in the service layer**: The `guidanceService.js` contains a transition table and rejects invalid moves with `ConflictError(409)`.
- **Notifications are non-blocking**: All `createNotification` calls are fire-and-forget (no `await`), matching the existing pattern in `mentorshipService.js`.
- **Admin read-only access**: Admin users bypass the `student_id`/`alumni_id` filter on GET endpoints but are blocked from all write endpoints with `ForbiddenError(403)`.

---

## Architecture

```mermaid
graph TD
    subgraph Frontend
        A[/student/guidance] --> API
        B[/student/guidance/id] --> API
        C[/alumni/requests] --> API
        D[/alumni/sessions] --> API
        E[/alumni/sessions/id] --> API
        F[/alumni/messages/userId - extended] --> API
    end

    subgraph Backend
        API[/api/guidance/*] --> GC[guidanceController.js]
        GC --> GS[guidanceService.js]
        GS --> SB[(Supabase)]
        GS --> NS[notificationService.js]
    end

    subgraph Database
        SB --> GR[guidance_requests]
        SB --> MS[mentorship_sessions]
        SB --> MM[mentorship_materials]
        SB --> MF[mentorship_feedback]
    end
```

### Request Flow

1. Frontend calls `apiClient` (axios with Bearer token auto-attached)
2. Express router (`guidanceRoutes.js`) applies `verifyToken` + `authorizeRoles` middleware
3. Thin controller extracts params and delegates to service
4. Service validates business rules, queries Supabase, fires notifications
5. Controller returns standardized `{ success, message, data }` response

---

## Components and Interfaces

### Backend

#### `guidanceRoutes.js`
Registers all `/api/guidance/*` routes with appropriate middleware. Trainer role is blocked at the route level via `authorizeRoles`.

```
POST   /api/guidance/request                  verifyToken, authorizeRoles('student', 'alumni', 'admin') — but service blocks non-students
GET    /api/guidance/student                  verifyToken, authorizeRoles('student', 'admin')
GET    /api/guidance/alumni                   verifyToken, authorizeRoles('alumni', 'admin')
PUT    /api/guidance/:id/respond              verifyToken, authorizeRoles('alumni')
POST   /api/guidance/sessions                 verifyToken, authorizeRoles('alumni')
GET    /api/guidance/sessions/student         verifyToken, authorizeRoles('student', 'admin')
GET    /api/guidance/sessions/alumni          verifyToken, authorizeRoles('alumni', 'admin')
GET    /api/guidance/sessions/:id             verifyToken, authorizeRoles('student', 'alumni', 'admin')
PUT    /api/guidance/sessions/:id             verifyToken, authorizeRoles('alumni')
POST   /api/guidance/sessions/:id/materials   verifyToken, authorizeRoles('alumni')
GET    /api/guidance/sessions/:id/materials   verifyToken, authorizeRoles('student', 'alumni', 'admin')
POST   /api/guidance/sessions/:id/feedback    verifyToken, authorizeRoles('student')
GET    /api/guidance/sessions/:id/feedback    verifyToken, authorizeRoles('alumni', 'admin')
```

**Trainer blocking strategy**: `authorizeRoles` middleware already returns 403 for any role not in the allowed list. Since `trainer` is never included in any guidance route's allowed roles, all trainer calls return 403 automatically.

**Route ordering note**: `GET /api/guidance/sessions/student` and `GET /api/guidance/sessions/alumni` must be registered **before** `GET /api/guidance/sessions/:id` to avoid Express matching `student`/`alumni` as `:id`.

#### `guidanceController.js`
Thin controller — extracts `req.user`, `req.params`, `req.body`, calls service, returns response.

```javascript
// Pattern for all handlers:
export const createGuidanceRequest = async (req, res, next) => {
  try {
    const result = await guidanceService.createRequest(req.user.id, req.user.role, req.body);
    res.status(201).json({ success: true, message: 'Guidance request created', data: result });
  } catch (err) { next(err); }
};
```

#### `guidanceService.js`
All business logic. Key functions:

| Function | Description |
|---|---|
| `createRequest(userId, role, body)` | Validates, creates guidance_request, notifies alumni |
| `getStudentRequests(userId, role)` | Returns requests filtered by student_id (admin bypasses filter) |
| `getAlumniRequests(userId, role)` | Returns requests filtered by alumni_id (admin bypasses filter) |
| `respondToRequest(requestId, alumniUserId, status)` | Validates ownership + pending status, updates, notifies student |
| `createSession(alumniUserId, body)` | Validates accepted request + ownership, creates session, notifies student |
| `getStudentSessions(userId, role)` | Returns sessions filtered by student_id |
| `getAlumniSessions(userId, role)` | Returns sessions filtered by alumni_id |
| `getSessionById(sessionId, userId, role)` | Returns session with ownership check |
| `updateSession(sessionId, alumniUserId, body)` | Validates ownership + status guard, applies partial update |
| `uploadMaterial(sessionId, alumniUserId, body)` | Validates ownership, creates material, notifies student |
| `getMaterials(sessionId, userId, role)` | Returns materials with ownership check |
| `submitFeedback(sessionId, studentId, body)` | Validates completed status + uniqueness, creates feedback, notifies alumni |
| `getFeedback(sessionId, alumniUserId, role)` | Returns feedback for session |

**Status transition table** (enforced in `updateSession`):
```javascript
const VALID_TRANSITIONS = {
  pending: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
```

### Frontend

#### New Pages

| Page | Role | Description |
|---|---|---|
| `/student/guidance` | student | Lists all guidance requests + sessions with status badges |
| `/student/guidance/[id]` | student | Session detail: Info, Meeting, Materials, Notes, Chat link |
| `/alumni/requests` | alumni | Incoming guidance requests with pending/accepted/rejected tabs + accept/reject + "Create Session" modal |
| `/alumni/sessions` | alumni | Lists all created sessions with status badges |
| `/alumni/sessions/[id]` | alumni | Session management: Info, editable Meeting link, Materials upload, editable Notes, Chat link |

#### Modified Files (additive only)

- `frontend/app/alumni/messages/[userId]/page.tsx` — adds "Request Guidance" button + modal form + active session card in sidebar. Existing `fetchMessages`, `handleSend`, message rendering are untouched.
- `frontend/components/layout/Sidebar.tsx` — adds "Guidance" to student nav, "Requests" and "Sessions" to alumni nav.

#### API Client Functions (in a new `frontend/lib/api/guidance.ts`)

```typescript
export const guidanceApi = {
  createRequest: (body) => apiClient.post('/guidance/request', body),
  getStudentRequests: () => apiClient.get('/guidance/student'),
  getAlumniRequests: () => apiClient.get('/guidance/alumni'),
  respondToRequest: (id, status) => apiClient.put(`/guidance/${id}/respond`, { status }),
  createSession: (body) => apiClient.post('/guidance/sessions', body),
  getStudentSessions: () => apiClient.get('/guidance/sessions/student'),
  getAlumniSessions: () => apiClient.get('/guidance/sessions/alumni'),
  getSessionById: (id) => apiClient.get(`/guidance/sessions/${id}`),
  updateSession: (id, body) => apiClient.put(`/guidance/sessions/${id}`, body),
  uploadMaterial: (id, body) => apiClient.post(`/guidance/sessions/${id}/materials`, body),
  getMaterials: (id) => apiClient.get(`/guidance/sessions/${id}/materials`),
  submitFeedback: (id, body) => apiClient.post(`/guidance/sessions/${id}/feedback`, body),
  getFeedback: (id) => apiClient.get(`/guidance/sessions/${id}/feedback`),
};
```

---

## Data Models

### `guidance_requests`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| student_id | uuid | FK profiles(id) NOT NULL |
| alumni_id | uuid | FK profiles(id) NOT NULL |
| topic | text | NOT NULL |
| description | text | NOT NULL |
| preferred_duration | text | nullable |
| preferred_schedule | text | nullable |
| attachment_url | text | nullable |
| status | text | default 'pending', CHECK IN ('pending','accepted','rejected') |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `mentorship_sessions`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| guidance_request_id | uuid | FK guidance_requests(id) NOT NULL |
| student_id | uuid | FK profiles(id) NOT NULL |
| alumni_id | uuid | FK profiles(id) NOT NULL |
| title | text | NOT NULL |
| topic | text | NOT NULL |
| description | text | nullable |
| start_date | date | NOT NULL |
| end_date | date | NOT NULL |
| duration_text | text | nullable |
| meeting_link | text | NOT NULL |
| schedule_text | text | nullable |
| session_notes | text | nullable |
| status | text | default 'pending', CHECK IN ('pending','active','completed','cancelled') |
| allow_group_session | boolean | default false |
| max_students | int | default 1 |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `mentorship_materials`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| mentorship_session_id | uuid | FK mentorship_sessions(id) NOT NULL |
| uploaded_by | uuid | FK profiles(id) NOT NULL |
| title | text | NOT NULL |
| file_url | text | NOT NULL |
| type | text | CHECK IN ('pdf','slides','image','document','link') |
| created_at | timestamptz | default now() |

### `mentorship_feedback`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| mentorship_session_id | uuid | FK mentorship_sessions(id) NOT NULL |
| student_id | uuid | FK profiles(id) NOT NULL |
| rating | int | CHECK rating >= 1 AND rating <= 5 |
| comment | text | nullable |
| created_at | timestamptz | default now() |
| — | — | UNIQUE(mentorship_session_id, student_id) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Guidance Request Ownership Invariant

*For any* authenticated student with id `S`, when creating a guidance request with any value (including a different id) in the `student_id` body field, the returned record's `student_id` SHALL always equal `S`.

**Validates: Requirements 1.2, 12.1, 12.5**

---

### Property 2: Session Ownership Derivation Invariant

*For any* valid mentorship session creation linked to a Guidance_Request with `student_id = S` and `alumni_id = A`, the created session's `student_id` SHALL equal `S` and `alumni_id` SHALL equal `A`, regardless of any values supplied in the request body.

**Validates: Requirements 3.2, 12.2, 12.5**

---

### Property 3: Session Status Transition Validity

*For any* Mentorship_Session in state `X` and any target state `Y` where `(X, Y)` is NOT in `{(pending, active), (active, completed), (active, cancelled), (pending, cancelled)}`, calling `PUT /api/guidance/sessions/:id` with `status = Y` SHALL return a non-2xx response (HTTP 409).

**Validates: Requirements 4.1, 4.7**

---

### Property 4: Feedback Rating Bounds

*For any* feedback submission with `rating = R`, if `R < 1` or `R > 5`, the API SHALL return HTTP 400. If `1 ≤ R ≤ 5` and all other conditions are met, the API SHALL return HTTP 201.

**Validates: Requirements 9.3**

---

### Property 5: Role-Based Access Denial for Trainers

*For any* endpoint under `/api/guidance/*` and any request authenticated with role `trainer`, the API SHALL always return HTTP 403, regardless of the endpoint method or path parameters.

**Validates: Requirements 1.9**

---

### Property 6: Material Upload Count Invariant

*For any* Mentorship_Session with `N` existing materials, after uploading `K` additional valid materials, `GET /api/guidance/sessions/:id/materials` SHALL return exactly `N + K` records.

**Validates: Requirements 6.1, 6.6**

---

### Property 7: Student Data Isolation

*For any* student with id `S1`, `GET /api/guidance/sessions/student` SHALL never return a session whose `student_id` is not `S1`, regardless of how many sessions exist in the system for other students.

**Validates: Requirements 7.1, 12.1**

---

### Property 8: Guidance Request Validation Bounds

*For any* guidance request submission, if `topic` has fewer than 3 characters OR `description` has fewer than 10 characters, the API SHALL return HTTP 400. If both meet the minimum length requirements and all other fields are valid, the API SHALL return HTTP 201.

**Validates: Requirements 1.4, 1.5**

---

### Property 9: Respond Ownership Invariant

*For any* Guidance_Request owned by alumni `A`, a call to `PUT /api/guidance/:id/respond` authenticated as any alumni `B` where `B ≠ A` SHALL always return HTTP 403.

**Validates: Requirements 2.2**

---

### Property 10: Material Type Validation

*For any* material upload with a `type` value not in `['pdf', 'slides', 'image', 'document', 'link']`, the API SHALL return HTTP 400.

**Validates: Requirements 6.4**

---

## Error Handling

All errors propagate through Express's `next(err)` to the existing error middleware. The service layer throws typed errors:

| Scenario | Error Class | HTTP Status |
|---|---|---|
| Missing required field | `BadRequestError` | 400 |
| topic < 3 chars | `BadRequestError` | 400 |
| description < 10 chars | `BadRequestError` | 400 |
| Invalid status value | `BadRequestError` | 400 |
| Rating outside 1–5 | `BadRequestError` | 400 |
| Invalid material type | `BadRequestError` | 400 |
| end_date <= start_date | `BadRequestError` | 400 |
| Resource not found | `NotFoundError` | 404 |
| Wrong owner on respond/update/upload | `ForbiddenError` | 403 |
| Student/trainer on write endpoints | `ForbiddenError` | 403 |
| Request not pending (respond) | `ConflictError` | 409 |
| Request not accepted (create session) | `ConflictError` | 409 |
| Invalid status transition | `ConflictError` | 409 |
| Session completed/cancelled (update) | `ConflictError` | 409 |
| Session not completed (feedback) | `ConflictError` | 409 |
| Duplicate feedback | `ConflictError` | 409 |

Frontend error handling: all API calls are wrapped in try/catch. Errors display as toast notifications or inline error messages. The existing `apiClient` interceptor handles 401 token expiry.

---

## Testing Strategy

### Unit Tests (example-based)

Focus on specific scenarios and edge cases:

- `guidanceService.createRequest` — valid creation, missing topic, missing description, attachment_url present/absent
- `guidanceService.respondToRequest` — accept, reject, wrong owner, non-pending request
- `guidanceService.createSession` — valid creation, non-accepted request, wrong owner, end_date before start_date
- `guidanceService.updateSession` — valid partial update, completed session guard, cancelled session guard
- `guidanceService.submitFeedback` — valid feedback, non-completed session, duplicate feedback
- Notification calls — verify `createNotification` is called with correct args for each trigger

### Property-Based Tests

Using [fast-check](https://github.com/dubzzz/fast-check) (JavaScript PBT library). Each property test runs a minimum of 100 iterations.

Tag format: `// Feature: mentorship-sessions, Property N: <property_text>`

**Property 1 test** — Generate random `student_id` values in body, verify returned `student_id` always equals authenticated user's id.
`// Feature: mentorship-sessions, Property 1: Guidance Request Ownership Invariant`

**Property 2 test** — Generate random `student_id`/`alumni_id` overrides in session creation body, verify they are always overridden by the linked request's values.
`// Feature: mentorship-sessions, Property 2: Session Ownership Derivation Invariant`

**Property 3 test** — Generate all `(current_status, target_status)` pairs from the full status set, verify only valid transitions return 2xx and all others return 409.
`// Feature: mentorship-sessions, Property 3: Session Status Transition Validity`

**Property 4 test** — Generate integer ratings across a wide range (e.g., -100 to 100), verify 400 for values outside [1,5] and 201 for values inside [1,5].
`// Feature: mentorship-sessions, Property 4: Feedback Rating Bounds`

**Property 5 test** — Generate random endpoint paths and methods under `/api/guidance/*`, verify trainer role always receives 403.
`// Feature: mentorship-sessions, Property 5: Role-Based Access Denial for Trainers`

**Property 6 test** — Generate random counts K of valid materials, upload them, verify GET returns exactly N+K records.
`// Feature: mentorship-sessions, Property 6: Material Upload Count Invariant`

**Property 7 test** — Create sessions for multiple students, verify each student's GET only returns their own sessions.
`// Feature: mentorship-sessions, Property 7: Student Data Isolation`

**Property 8 test** — Generate strings of varying lengths for topic and description, verify 400 for below-minimum lengths and 201 for valid lengths.
`// Feature: mentorship-sessions, Property 8: Guidance Request Validation Bounds`

**Property 9 test** — Generate guidance requests owned by alumni A, attempt respond as randomly generated alumni B ≠ A, verify always 403.
`// Feature: mentorship-sessions, Property 9: Respond Ownership Invariant`

**Property 10 test** — Generate random strings for material type, verify 400 for any value not in the valid set.
`// Feature: mentorship-sessions, Property 10: Material Type Validation`

### Integration Tests

- Full request lifecycle: create guidance request → alumni responds → alumni creates session → session goes active → student views session → student submits feedback
- Notification delivery: verify notifications are created in the `notifications` table for each trigger event
- Admin read access: verify admin can read all records without filtering

### Frontend Tests

- Component rendering: status badge colors match spec (yellow/blue/green/red)
- Modal open/close behavior on "Request Guidance" button
- Session card appears in chat sidebar when active session exists
- Form validation: topic and description required fields
