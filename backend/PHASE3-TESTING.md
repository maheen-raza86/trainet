# Phase 3 Testing Guide

## Authentication Middleware & Protected Routes

### Overview

Phase 3 adds authentication middleware and protected routes to the TRAINET backend.

### Implemented Features

✅ **Authentication Middleware** (`authMiddleware.js`)
- Extracts JWT token from Authorization header
- Verifies token with Supabase
- Fetches user profile from database
- Attaches user object to `req.user`

✅ **Role Authorization Middleware** (`roleMiddleware.js`)
- Restricts access based on user roles
- Supports multiple allowed roles
- Returns 403 Forbidden if role not allowed

✅ **Protected Route** (`GET /api/users/me`)
- Returns authenticated user's profile
- Requires valid JWT token

### Testing Flow

#### Step 1: Start the Server

```bash
cd backend
npm run dev
```

Server should start on `http://localhost:5000`

#### Step 2: Sign Up a New User

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "testuser@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "student"
    }
  }
}
```

#### Step 3: Login to Get Access Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "user": { ... }
  }
}
```

**Important:** Copy the `accessToken` value for the next step.

#### Step 4: Access Protected Route

Replace `YOUR_ACCESS_TOKEN` with the token from Step 3:

```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "...",
    "email": "testuser@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }
}
```

#### Step 5: Test Without Token (Should Fail)

```bash
curl -X GET http://localhost:5000/api/users/me
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "No token provided. Authorization header must be: Bearer <token>",
  "error": "Unauthorized"
}
```

#### Step 6: Test With Invalid Token (Should Fail)

```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

### Testing Role Authorization

The `authorizeRoles` middleware is ready to use. Example usage:

```javascript
// Only trainers and admins can access
router.post('/courses', verifyToken, authorizeRoles('trainer', 'admin'), createCourse);

// Only admins can access
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), deleteUser);
```

To test role authorization, you would need to:
1. Create a route that uses `authorizeRoles()`
2. Login as a user with a specific role
3. Try to access the route with different role users

### Complete Test Script

Save this as `test-phase3.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "==================================="
echo "Phase 3: Protected Routes Test"
echo "==================================="
echo ""

# Step 1: Signup
echo "Step 1: Creating test user..."
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phase3test'$(date +%s)'@example.com",
    "password": "password123",
    "firstName": "Phase3",
    "lastName": "Test",
    "role": "student"
  }')
echo $SIGNUP_RESPONSE | json_pp
echo ""

# Step 2: Login
echo "Step 2: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phase3test'$(date +%s)'@example.com",
    "password": "password123"
  }')
echo $LOGIN_RESPONSE | json_pp

# Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo ""
echo "Access Token: $ACCESS_TOKEN"
echo ""

# Step 3: Access protected route WITH token
echo "Step 3: Accessing /api/users/me WITH token..."
curl -s -X GET $BASE_URL/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | json_pp
echo ""

# Step 4: Access protected route WITHOUT token
echo "Step 4: Accessing /api/users/me WITHOUT token (should fail)..."
curl -s -X GET $BASE_URL/users/me | json_pp
echo ""

# Step 5: Access protected route with INVALID token
echo "Step 5: Accessing /api/users/me with INVALID token (should fail)..."
curl -s -X GET $BASE_URL/users/me \
  -H "Authorization: Bearer invalid_token" | json_pp
echo ""

echo "==================================="
echo "Phase 3 Tests Complete!"
echo "==================================="
```

### Middleware Usage Examples

#### Protect a route with authentication only:
```javascript
router.get('/profile', verifyToken, getProfile);
```

#### Protect a route with authentication + role check:
```javascript
router.post('/courses', verifyToken, authorizeRoles('trainer', 'admin'), createCourse);
```

#### Multiple role checks:
```javascript
// Only admins
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), deleteUser);

// Students and trainers
router.get('/dashboard', verifyToken, authorizeRoles('student', 'trainer'), getDashboard);
```

### Request Flow

```
Client Request
    ↓
Express App
    ↓
Logging Middleware
    ↓
Rate Limiting
    ↓
Route Handler
    ↓
verifyToken Middleware
    ├─ Extract token from header
    ├─ Verify with Supabase
    ├─ Fetch user profile
    └─ Attach to req.user
    ↓
authorizeRoles Middleware (optional)
    ├─ Check req.user.role
    └─ Allow or deny access
    ↓
Controller
    ├─ Access req.user
    └─ Return response
```

### Error Scenarios

| Scenario | Status | Message |
|----------|--------|---------|
| No Authorization header | 401 | No token provided |
| Invalid token format | 401 | No token provided |
| Expired token | 401 | Invalid or expired token |
| Invalid token | 401 | Invalid or expired token |
| User profile not found | 401 | User profile not found |
| Wrong role | 403 | You do not have permission |

### What's Next?

**Phase 4 Suggestions:**
- Course CRUD operations
- Trainer-only course creation
- Course listing and filtering
- Course enrollment endpoints

---

**Phase 3 Status:** ✅ Complete and Ready for Testing
