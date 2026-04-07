# TRAINET Course Offerings Migration Guide

## 📋 Overview

This guide walks you through migrating the TRAINET system from the old course structure to the new SRDS-compliant course offerings architecture.

## 🎯 What Changed?

### Before (Incorrect)
- Trainers created unlimited courses directly
- Students enrolled in courses
- Assignments belonged to courses

### After (SRDS-Compliant)
- Fixed course catalog (predefined courses)
- Trainers create course offerings from catalog
- Students enroll in course offerings
- Assignments belong to course offerings
- Trainers limited to 5 active offerings

## 🚀 Migration Steps

### Step 1: Backup Database

Before making any changes, backup your Supabase database:

```bash
# Using Supabase CLI
supabase db dump > backup_$(date +%Y%m%d).sql
```

### Step 2: Run Database Migration

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Open the migration file: `backend/database/migrations/003_course_offerings_refactor.sql`
4. Copy the entire SQL content
5. Paste into Supabase SQL Editor
6. Click "Run" to execute the migration

**What this does:**
- Creates `course_offerings` table
- Adds `offering_id` to `enrollments` table
- Adds `course_offering_id` to `assignments` table
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance

### Step 3: Verify Migration

Check that the new table was created:

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'course_offerings';

-- Should return: course_offerings
```

Check the table structure:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'course_offerings';
```

### Step 4: Restart Backend Server

```bash
cd backend

# Stop current server (Ctrl+C if running)

# Start server
npm start
```

### Step 5: Verify New Endpoints

Test that the new endpoints are working:

```bash
# Test course catalog
curl http://localhost:5000/api/courses/catalog

# Should return list of courses
```

### Step 6: Run Test Suite

```bash
cd backend
node test-course-offerings.js
```

Expected output:
```
✓ Get Course Catalog – PASS
✓ Create Course Offering – PASS
✓ Get Trainer Offerings – PASS
✓ Get Available Offerings – PASS
✓ Enroll in Offering – PASS
✓ Update Offering – PASS
✓ Trainer 5 Offering Limit – PASS

🎉 All tests passed!
```

## 📊 Data Migration (Optional)

If you have existing data that needs to be migrated:

### Migrate Existing Enrollments

```sql
-- This is optional and only needed if you want to migrate old enrollments
-- to the new structure. New enrollments will automatically use offering_id.

-- Example: Create offerings for existing courses and update enrollments
-- (Customize based on your data)

-- 1. Create course offerings for existing courses
INSERT INTO course_offerings (course_id, trainer_id, duration_weeks, hours_per_week, outline, status)
SELECT 
  c.id as course_id,
  -- You'll need to assign a trainer_id (replace with actual trainer ID)
  '<trainer_id>' as trainer_id,
  8 as duration_weeks,
  4 as hours_per_week,
  COALESCE(c.description, 'Course offering') as outline,
  'open' as status
FROM courses c
WHERE NOT EXISTS (
  SELECT 1 FROM course_offerings co WHERE co.course_id = c.id
);

-- 2. Update enrollments to reference offerings
-- (This is complex and depends on your business logic)
-- You may want to keep old enrollments as-is and only use offerings for new enrollments
```

## 🧪 Testing Checklist

After migration, test the following workflows:

### Trainer Workflow
- [ ] Login as trainer
- [ ] View course catalog (GET /api/courses/catalog)
- [ ] Create course offering (POST /api/course-offerings)
- [ ] View my offerings (GET /api/course-offerings/trainer)
- [ ] Update offering (PUT /api/course-offerings/:id)
- [ ] Verify 5 offering limit

### Student Workflow
- [ ] Login as student
- [ ] View available offerings (GET /api/course-offerings/available)
- [ ] Enroll in offering (POST /api/course-offerings/enroll)
- [ ] View enrolled courses
- [ ] Submit assignment

### Assignment Workflow
- [ ] Trainer creates assignment for offering
- [ ] Student submits assignment
- [ ] Trainer views submissions
- [ ] Trainer grades submission

## 🔄 Rollback Plan

If you need to rollback the migration:

### Step 1: Restore Database Backup

```bash
# Using Supabase CLI
supabase db reset
psql -h <your-db-host> -U postgres -d postgres < backup_YYYYMMDD.sql
```

### Step 2: Revert Code Changes

```bash
git checkout <previous-commit>
npm start
```

## ⚠️ Important Notes

### Backward Compatibility

The migration maintains backward compatibility:
- Old enrollments with `course_id` still work
- Old assignments with `course_id` still work
- New enrollments use `offering_id`
- New assignments use `course_offering_id`

### Course Catalog Management

After migration:
- Existing courses become the catalog
- Only admins should add new courses to catalog
- Trainers create offerings from catalog, not new courses

### Frontend Updates

You may need to update frontend components:

**Student Dashboard:**
```typescript
// Old
const { data } = await apiClient.get('/courses');

// New
const { data } = await apiClient.get('/course-offerings/available');
```

**Trainer Dashboard:**
```typescript
// Old
const { data } = await apiClient.post('/courses', courseData);

// New
const { data } = await apiClient.post('/course-offerings', offeringData);
```

## 📞 Support

If you encounter issues during migration:

1. Check the error logs: `backend/logs/`
2. Verify database migration completed successfully
3. Ensure all environment variables are set correctly
4. Review the implementation summary: `COURSE-OFFERINGS-REFACTOR-SUMMARY.md`

## ✅ Migration Complete

Once all tests pass and workflows are verified, the migration is complete. The system is now SRDS-compliant with proper separation between course catalog and course offerings.
