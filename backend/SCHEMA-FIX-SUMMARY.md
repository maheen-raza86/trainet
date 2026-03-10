# Database Schema Fix - Submissions API

## Problem
The backend code was using `submission_url` as the column name, but the actual Supabase database uses `attachment_url` and `status` columns.

## Solution
Updated all backend code and documentation to match the actual database schema without modifying the database.

---

## Files Modified

### 1. Backend Code Files

#### `src/controllers/submissionController.js`
- Changed request body field from `submissionUrl` to `attachmentUrl`
- Updated validation message to reference "attachment URL"
- Updated JSDoc comments

**Changes:**
```javascript
// Before
const { assignmentId, submissionUrl } = req.body;
if (!assignmentId || !submissionUrl) {
  message: 'Assignment ID and submission URL are required'
}

// After
const { assignmentId, attachmentUrl } = req.body;
if (!assignmentId || !attachmentUrl) {
  message: 'Assignment ID and attachment URL are required'
}
```

#### `src/services/submissionService.js`
- Changed parameter name from `submissionUrl` to `attachmentUrl`
- Updated database insert to use `attachment_url` column
- Added `status: 'submitted'` to the insert statement
- Updated JSDoc comments

**Changes:**
```javascript
// Before
const { assignmentId, studentId, submissionUrl } = submissionData;
.insert([{
  assignment_id: assignmentId,
  student_id: studentId,
  submission_url: submissionUrl,
}])

// After
const { assignmentId, studentId, attachmentUrl } = submissionData;
.insert([{
  assignment_id: assignmentId,
  student_id: studentId,
  attachment_url: attachmentUrl,
  status: 'submitted',
}])
```

---

### 2. Documentation Files

#### `API-DOCUMENTATION.md`
Updated all references to match new schema:
- Request body examples: `submissionUrl` → `attachmentUrl`
- Response examples: `submission_url` → `attachment_url`
- Added `status` field to response examples
- Updated database schema documentation
- Updated curl examples

#### `ASSIGNMENTS-IMPLEMENTATION.md`
- Updated validation requirements
- Updated curl examples
- Updated quick reference section

#### `QUICK-START.md`
- Updated database schema definition
- Updated curl examples
- Added `status` column to table definition

---

### 3. Test Scripts

#### `test-assignments.sh`
- Updated test examples to use `attachmentUrl`
- Updated both student submission test and role authorization test

---

## API Changes

### Request Format (Changed)

**Before:**
```json
POST /api/submissions
{
  "assignmentId": "uuid",
  "submissionUrl": "https://github.com/student/repo"
}
```

**After:**
```json
POST /api/submissions
{
  "assignmentId": "uuid",
  "attachmentUrl": "https://github.com/student/repo"
}
```

### Response Format (Changed)

**Before:**
```json
{
  "id": "uuid",
  "assignment_id": "uuid",
  "student_id": "uuid",
  "submission_url": "https://github.com/student/repo",
  "submitted_at": "2024-01-01T00:00:00Z",
  "grade": null,
  "feedback": null
}
```

**After:**
```json
{
  "id": "uuid",
  "assignment_id": "uuid",
  "student_id": "uuid",
  "attachment_url": "https://github.com/student/repo",
  "status": "submitted",
  "submitted_at": "2024-01-01T00:00:00Z",
  "grade": null,
  "feedback": null
}
```

---

## Database Schema (Actual)

### submissions table
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES profiles(id),
  attachment_url TEXT NOT NULL,
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grade INTEGER,
  feedback TEXT,
  UNIQUE(assignment_id, student_id)
);
```

### assignments table
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  trainer_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Testing

### Manual Test
```bash
# 1. Start server
npm run dev

# 2. Login as student
STUDENT_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 3. Submit assignment with new field name
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "<ASSIGNMENT_UUID>",
    "attachmentUrl": "https://github.com/student/linux-hardening"
  }'

# 4. Verify response includes attachment_url and status fields
```

### Automated Test
```bash
chmod +x test-assignments.sh
./test-assignments.sh
```

---

## Breaking Changes

⚠️ **API Breaking Change**: Clients must update their request body field name from `submissionUrl` to `attachmentUrl`.

### Migration Guide for API Clients

**Old Code:**
```javascript
fetch('/api/submissions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    assignmentId: assignmentId,
    submissionUrl: url  // OLD FIELD NAME
  })
})
```

**New Code:**
```javascript
fetch('/api/submissions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    assignmentId: assignmentId,
    attachmentUrl: url  // NEW FIELD NAME
  })
})
```

---

## What Was NOT Modified

✅ Database schema (as requested)
✅ Authentication system
✅ Course APIs
✅ Assignment creation API
✅ Middleware
✅ Error handling utilities

---

## Status

✅ Backend code updated
✅ API documentation updated
✅ Test scripts updated
✅ No syntax errors
✅ Ready for testing

**Version:** 1.1.0
**Date:** Schema alignment fix
**Impact:** Breaking change for submission API clients
