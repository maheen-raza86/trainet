# Database Migrations

This directory contains SQL migration scripts for the TRAINET database.

## How to Apply Migrations

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of the migration file
5. Paste into the editor
6. Click **Run** or press `Ctrl+Enter`

### Option 2: Command Line (psql)

```bash
# Get your database connection string from Supabase
# Settings → Database → Connection string

psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" \
  -f database/migrations/001_update_role_constraint.sql
```

### Option 3: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

---

## Available Migrations

### 001_update_role_constraint.sql

**Purpose:** Standardize role system to use `trainer` instead of `instructor`

**Changes:**
- Drops old role constraint
- Adds new constraint: `CHECK (role IN ('student', 'trainer', 'admin'))`
- Updates existing `instructor` roles to `trainer`

**When to apply:** Before deploying backend changes that use `trainer` role

**Rollback:** Not recommended (would require updating all `trainer` back to `instructor`)

---

## Migration Checklist

Before applying a migration:

- [ ] Backup your database
- [ ] Review the migration SQL
- [ ] Test in development environment first
- [ ] Check for dependent data
- [ ] Verify application compatibility

After applying a migration:

- [ ] Verify the changes with SELECT queries
- [ ] Test affected API endpoints
- [ ] Check application logs for errors
- [ ] Update application code if needed

---

## Verification Queries

### Check Current Roles

```sql
-- See all roles in use
SELECT role, COUNT(*) as count 
FROM profiles 
GROUP BY role 
ORDER BY role;
```

### Check Constraint

```sql
-- View the constraint definition
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
  AND conname = 'profiles_role_check';
```

### Find Invalid Roles

```sql
-- Find any profiles with invalid roles (should return 0 rows)
SELECT id, email, role 
FROM profiles 
WHERE role NOT IN ('student', 'trainer', 'admin');
```

---

## Troubleshooting

### Error: "constraint already exists"

**Solution:** The constraint name might be different. Drop it first:
```sql
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
```

### Error: "new row violates check constraint"

**Solution:** You have existing data with invalid roles. Update them first:
```sql
UPDATE profiles SET role = 'trainer' WHERE role = 'instructor';
```

### Error: "permission denied"

**Solution:** Make sure you're using a database user with sufficient privileges (postgres user or service_role).

---

## Best Practices

1. **Always backup before migrations**
2. **Test in development first**
3. **Run during low-traffic periods**
4. **Monitor application after deployment**
5. **Keep migration scripts in version control**
6. **Document all schema changes**

---

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review the migration SQL for syntax errors
3. Verify your database connection
4. Check application logs for related errors
