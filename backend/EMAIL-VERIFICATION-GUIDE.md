# Email Verification Quick Reference

## Overview
Email verification is now enforced for all user logins. Users must verify their email address before they can access the system.

## User Flow

### 1. Sign Up
```bash
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**What Happens:**
- ✅ User account created
- ✅ Verification token generated (64-char hex)
- ✅ Token stored in database
- ✅ Verification email sent
- ✅ User receives email with verification link

### 2. Verify Email
User clicks link in email or makes API call:
```bash
POST /api/auth/verify-email
{
  "token": "f7797d83516a9a6fff3e15fc9a15fe2127e301cd9652235fa7d109ba65c7170a"
}
```

**What Happens:**
- ✅ Token validated
- ✅ Email marked as verified
- ✅ Token cleared from database
- ✅ Verification timestamp recorded

### 3. Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Before Verification:**
```json
{
  "success": false,
  "message": "Please verify your email before logging in"
}
```
Status: `401 Unauthorized`

**After Verification:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_token",
    "user": { ... }
  }
}
```
Status: `200 OK`

## Email Configuration

### Test Environment
No configuration needed. Emails are logged to console:
```
[info]: [TEST MODE] Verification email would be sent to: user@example.com
[info]: [TEST MODE] Verification URL: http://localhost:5173/verify-email?token={token}
```

### Development Environment
No configuration needed. Uses Ethereal.email automatically:
```
[info]: Verification email sent to user@example.com
[info]: Preview URL: https://ethereal.email/message/{id}
```

### Production Environment
Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="TRAINET <noreply@trainet.com>"
FRONTEND_URL=https://trainet.com
```

## Database Schema

### Profiles Table Columns
```sql
verification_token TEXT          -- 64-char hex token
email_verified BOOLEAN           -- Default: false
verified_at TIMESTAMPTZ          -- Set when verified
```

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- ✅ 29 tests passing
- ✅ Email verification flow tested
- ✅ Unverified login rejection tested

### Manual Testing

**1. Create user and get verification token:**
```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User","role":"student"}'

# Check server logs for verification URL
# Look for: [TEST MODE] Verification URL: ...
```

**2. Try login before verification (should fail):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Expected: 401 with "Please verify your email before logging in"
```

**3. Verify email:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_LOGS"}'

# Expected: 200 with "Email verified successfully"
```

**4. Login after verification (should succeed):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Expected: 200 with access token
```

## Troubleshooting

### Issue: Emails Not Sending in Development
**Solution:** Check logs for Ethereal.email preview URL. No configuration needed.

### Issue: Login Fails with "Please verify your email"
**Solution:** User must verify email first. Check database for `email_verified` status.

### Issue: Verification Token Invalid
**Solution:** 
- Token may have been used already
- Check database: `verification_token` should be NULL after verification
- Generate new token by re-registering (or implement resend endpoint)

### Issue: Production Emails Not Sending
**Solution:** 
- Verify SMTP credentials in `.env`
- Check SMTP server allows connections
- Review email service logs for errors

## Security Notes

- Tokens are cryptographically secure (256 bits of entropy)
- Tokens are single-use (cleared after verification)
- Email verification is enforced at login
- No bypass mechanism exists
- Existing auth logic unchanged

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | ❌ | Register user (sends verification email) |
| POST | /api/auth/verify-email | ❌ | Verify email with token |
| POST | /api/auth/login | ❌ | Login (requires verified email) |
| GET | /api/users/me | ✅ | Get current user profile |
| PUT | /api/users/profile | ✅ | Update user profile |

## Implementation Files

### Modified Files
1. `backend/src/services/authService.js`
   - Generate verification token in `signUp()`
   - Check email verification in `signIn()`

2. `backend/tests/user-management.test.js`
   - Added test for unverified login rejection
   - Added beforeAll hook to verify test user

3. `backend/API-DOCUMENTATION.md`
   - Updated with email verification flow

### New Files
1. `backend/src/utils/emailService.js`
   - Email sending utility
   - Nodemailer integration
   - Environment-specific behavior

2. `backend/EMAIL-VERIFICATION-COMPLETE.md`
   - Complete implementation documentation

3. `backend/EMAIL-VERIFICATION-GUIDE.md`
   - This quick reference guide

## Status

✅ **FR-UM-4 Complete**
- ✅ Verification token generation
- ✅ Email sending integration
- ✅ Email verification endpoint
- ✅ Login enforcement
- ✅ All tests passing (29/29)
- ✅ No breaking changes

**Version:** 1.7.0
**Date:** March 8, 2026
