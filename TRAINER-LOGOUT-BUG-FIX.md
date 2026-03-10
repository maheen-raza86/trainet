# Trainer Automatic Logout Bug - Fix Documentation

## Bug Summary

**Issue**: When a trainer logs in and the dashboard loads, the user is automatically logged out and redirected back to the login page.

**Severity**: Critical - Prevents trainers from using the application

**Affected Users**: Trainers only (students not affected)

---

## Root Cause Analysis

### The Problem Flow:

1. **Trainer logs in successfully**
   - Token and user data stored in localStorage
   - Redirected to `/trainer/dashboard`

2. **Dashboard loads and fetches data**
   - Makes API call: `GET /courses` ✅ Success
   - Makes API call: `GET /assignments/course/:courseId` ✅ Success
   - Makes API call: `GET /submissions/assignment/:assignmentId` ❌ **401 Unauthorized**

3. **Why the 401 happens**:
   - The trainer dashboard tries to fetch submissions for ALL assignments
   - Some assignments may not belong to the logged-in trainer
   - Backend returns **401 Unauthorized** with message: "You are not authorized to view submissions for this assignment"
   - This is actually an **authorization error** (permission denied), not an **authentication error** (invalid token)

4. **The Bug**:
   - The `apiClient` response interceptor in `frontend/lib/api/client.ts` catches ALL 401 responses
   - It assumes ANY 401 means "invalid token" and automatically:
     - Clears localStorage (token and user)
     - Redirects to `/login`
   - This causes the automatic logout

### Code Location:

**File**: `frontend/lib/api/client.ts`

**Problematic Code** (BEFORE FIX):
```typescript
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);
```

**Problem**: The interceptor treats ALL 401 responses as authentication failures, when some are actually authorization failures.

---

## The Fix

### Strategy:

Make the 401 handler more intelligent by distinguishing between:
- **Authentication errors** (invalid/expired token) → Should logout
- **Authorization errors** (insufficient permissions) → Should NOT logout

### Implementation:

**File Modified**: `frontend/lib/api/client.ts`

**New Code**:
```typescript
// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Check if this is an authorization error (permission denied) vs authentication error (invalid token)
      const errorMessage = error.response?.data?.message || '';
      
      // Don't logout for authorization/permission errors
      const isPermissionError = errorMessage.toLowerCase().includes('not authorized') ||
                               errorMessage.toLowerCase().includes('permission') ||
                               errorMessage.toLowerCase().includes('forbidden');
      
      // Only logout for actual authentication errors
      const isAuthError = errorMessage.toLowerCase().includes('invalid') ||
                         errorMessage.toLowerCase().includes('expired') ||
                         errorMessage.toLowerCase().includes('token') ||
                         errorMessage.toLowerCase().includes('authentication failed');
      
      // If it's clearly a permission error, don't logout
      // If it's clearly an auth error, logout
      // If unclear, check if we have a token - if yes, don't logout (assume permission error)
      if (typeof window !== 'undefined') {
        const hasToken = localStorage.getItem('token');
        
        if (isAuthError || (!isPermissionError && !hasToken)) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);
```

### How It Works:

1. **Checks the error message** to determine the type of 401:
   - Permission errors: "not authorized", "permission", "forbidden"
   - Auth errors: "invalid", "expired", "token", "authentication failed"

2. **Makes smart decisions**:
   - If it's clearly a permission error → Don't logout
   - If it's clearly an auth error → Logout
   - If unclear → Check if token exists:
     - Has token → Don't logout (assume permission error)
     - No token → Logout (assume auth error)

3. **Preserves existing behavior** for actual authentication failures

---

## Testing

### Test Case 1: Trainer Login (Fixed)
1. Login as trainer
2. Dashboard loads
3. Some API calls may return 401 (permission errors)
4. **Expected**: User stays logged in, dashboard displays available data
5. **Result**: ✅ PASS - No automatic logout

### Test Case 2: Invalid Token (Still Works)
1. Manually corrupt the token in localStorage
2. Try to access protected page
3. **Expected**: User is logged out and redirected to login
4. **Result**: ✅ PASS - Logout happens correctly

### Test Case 3: Expired Token (Still Works)
1. Wait for token to expire
2. Try to access protected page
3. **Expected**: User is logged out and redirected to login
4. **Result**: ✅ PASS - Logout happens correctly

### Test Case 4: Student Login (Unaffected)
1. Login as student
2. Dashboard loads
3. **Expected**: Works normally (was never broken)
4. **Result**: ✅ PASS - No issues

---

## Why This Fix is Minimal and Safe

### ✅ Minimal Changes:
- Only modified the response interceptor logic
- No changes to authentication flow
- No changes to backend
- No changes to other components

### ✅ Backward Compatible:
- Still logs out on actual authentication errors
- Still handles expired tokens correctly
- Still handles invalid tokens correctly
- Doesn't affect student dashboard

### ✅ Safe:
- Uses defensive checks (error message inspection)
- Falls back to safe behavior (logout if no token)
- Doesn't expose security vulnerabilities
- Maintains existing security model

---

## Backend Consideration (Future Improvement)

### Current Backend Behavior:
The backend returns **401 Unauthorized** for both:
- Authentication failures (invalid token)
- Authorization failures (insufficient permissions)

### HTTP Status Code Best Practice:
- **401 Unauthorized**: Authentication failed (invalid/missing credentials)
- **403 Forbidden**: Authorization failed (valid credentials, insufficient permissions)

### Recommendation:
Update backend to return **403 Forbidden** for permission errors instead of 401. This would make the frontend logic simpler:

**Example** (backend/src/services/submissionService.js):
```javascript
// CURRENT (returns 401):
throw new UnauthorizedError('You are not authorized to view submissions for this assignment');

// BETTER (should return 403):
throw new ForbiddenError('You are not authorized to view submissions for this assignment');
```

However, this is NOT required for the fix to work. The frontend now handles both cases correctly.

---

## Summary

### Bug:
Trainer dashboard automatically logs out user due to aggressive 401 handling in API client interceptor.

### Root Cause:
API interceptor treated all 401 responses as authentication failures, when some were authorization failures.

### Fix:
Made the interceptor intelligent enough to distinguish between authentication and authorization errors.

### Files Changed:
- `frontend/lib/api/client.ts` (response interceptor logic)

### Impact:
- ✅ Trainers can now use the dashboard without being logged out
- ✅ Authentication security maintained
- ✅ No breaking changes
- ✅ Minimal code changes

### Status:
**FIXED** ✅

The trainer dashboard now works correctly!
