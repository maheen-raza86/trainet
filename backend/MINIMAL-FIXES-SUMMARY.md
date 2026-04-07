# TRAINET Backend - Minimal Fixes Summary

## ✅ Fixes Applied

### 1. Removed POST /api/courses Endpoint
**File:** `backend/src/routes/courseRoutes.js`
- ❌ Removed: `POST /api/courses` (was incorrectly creating course offerings)
- ❌ Removed: Import of `courseOfferingController`
- ✅ Kept: `GET /api/courses` (catalog endpoint)
- ✅ Kept: `GET /api/courses/:id` (get course by ID)

**Reason:** Courses are catalog entries and should not be created via this endpoint. Course offerings are created via `/api/course-offerings`.

---

### 2. Removed Duplicate Catalog Endpoint
**File:** `backend/src/routes/courseOfferingRoutes.js`
- ❌ Removed: `GET /api/courses/catalog`
- ✅ Use instead: `GET /api/courses` (single catalog endpoint)

**Reason:** Eliminated duplication. The catalog is accessed via `/api/courses`.

---

### 3. Updated Assignment Creation to Use course_offering_id
**Files Modified:**
- `backend/src/controllers/assignmentController.js`
- `backend/src/services/assignmentService.js`

**Changes:**
- Changed parameter from `courseId` to `courseOfferingId`
- Updated validation messages
- Assignments now reference `course_offering_id` in database
- Added trainer ownership verification (trainer must own the offering)

**Database Field:**
- Old: `course_id`
- New: `course_offering_id`

---

### 4. Updated Assignment Retrieval (Backward Compatible)
**File:** `backend/src/services/assignmentService.js`
**Function:** `getAssignmentsByCourse()`

**Changes:**
- First tries to fetch by `course_offering_id` (new structure)
- Falls back to `course_id` (old structure) for backward compatibility
- Supports both old and new assignments

---

## 📊 Database Relationships Confirmed

### ✅ Students → Enrollments → Course Offerings
```
students (profiles)
  └─ enrollments.student_id
       └─ enrollments.offering_id → course_offerings.id
```

### ✅ Trainers → Course Offerings
```
trainers (profiles)
  └─ course_offerings.trainer_id
```

### ✅ Assignments → Course Offerings
```
course_offerings
  └─ assignments.course_offering_id
       └─ assignments.trainer_id (must match offering.trainer_id)
```

### ✅ Submissions → Assignments
```
assignments
  └─ submissions.assignment_id
       └─ submissions.student_id
```

---

## 🔄 Routes Affected

### Removed Routes
- ❌ `POST /api/courses` - No longer creates anything
- ❌ `GET /api/courses/catalog` - Duplicate removed

### Active Routes
- ✅ `GET /api/courses` - Get course catalog
- ✅ `GET /api/courses/:id` - Get course by ID
- ✅ `POST /api/course-offerings` - Create course offering
- ✅ `GET /api/course-offerings/available` - Get available offerings
- ✅ `POST /api/assignments` - Create assignment (now uses courseOfferingId)
- ✅ `GET /api/assignments/course/:courseId` - Get assignments (supports both IDs)

---

## 📝 Files Modified

1. **backend/src/routes/courseRoutes.js**
   - Removed POST route
   - Removed catalog route
   - Removed courseOfferingController import

2. **backend/src/routes/courseOfferingRoutes.js**
   - Removed duplicate catalog route

3. **backend/src/controllers/assignmentController.js**
   - Changed `courseId` to `courseOfferingId`
   - Updated validation messages

4. **backend/src/services/assignmentService.js**
   - Updated `createAssignment()` to use `course_offering_id`
   - Added trainer ownership verification
   - Updated `getAssignmentsByCourse()` for backward compatibility

5. **backend/src/services/courseOfferingService.js**
   - Added comment clarifying catalog function

---

## ⚠️ Breaking Changes

### For Frontend/API Clients

**Assignment Creation:**
```javascript
// OLD (no longer works)
POST /api/assignments
{
  "courseId": "uuid",
  "title": "...",
  "description": "..."
}

// NEW (required)
POST /api/assignments
{
  "courseOfferingId": "uuid",
  "title": "...",
  "description": "..."
}
```

**Course Catalog:**
```javascript
// OLD (removed)
GET /api/courses/catalog

// NEW (use this)
GET /api/courses
```

**Course Creation:**
```javascript
// OLD (removed)
POST /api/courses

// NEW (use this)
POST /api/course-offerings
```

---

## ✅ Backward Compatibility

### What Still Works
- ✅ Old assignments with `course_id` can still be retrieved
- ✅ `GET /api/assignments/course/:id` works with both course_id and course_offering_id
- ✅ Old enrollments with `course_id` still function
- ✅ All existing endpoints remain functional

### What Changed
- ❌ Cannot create new assignments with `courseId` (must use `courseOfferingId`)
- ❌ Cannot create courses via `POST /api/courses`
- ❌ Cannot access catalog via `/api/courses/catalog`

---

## 🧪 Testing Required

1. **Test Assignment Creation:**
   ```bash
   POST /api/assignments
   {
     "courseOfferingId": "<offering_id>",
     "title": "Test Assignment",
     "description": "Test description",
     "dueDate": "2026-05-01"
   }
   ```

2. **Test Catalog Access:**
   ```bash
   GET /api/courses
   # Should return all catalog courses
   ```

3. **Test Assignment Retrieval:**
   ```bash
   GET /api/assignments/course/<offering_id>
   # Should return assignments for that offering
   ```

---

## 🎯 Summary

**Minimal fixes applied to correct the course offering architecture:**
- Removed incorrect POST /api/courses endpoint
- Removed duplicate catalog endpoint
- Updated assignments to use course_offering_id
- Maintained backward compatibility where possible
- Verified all database relationships

**No redesign, no new features, only corrections as requested.**
