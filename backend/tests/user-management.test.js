/**
 * User Management API Tests
 * Tests for authentication, profile update, email verification, and QR enrollment
 */

import request from 'supertest';
import app from '../src/app.js';
import { supabaseAdminClient } from '../src/config/supabaseClient.js';

describe('User Management API Tests', () => {
  let testUser = {
    email: '',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
  };
  let accessToken = '';
  let userId = '';
  let verificationToken = '';
  let courseId = '';
  let qrToken = '';

  // Generate unique email for this test run
  beforeAll(() => {
    testUser.email = global.testUtils.generateTestEmail();
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await supabaseAdminClient.from('profiles').delete().eq('id', userId);
      await supabaseAdminClient.auth.admin.deleteUser(userId);
    }
    if (qrToken) {
      await supabaseAdminClient
        .from('enrollment_qr_tokens')
        .delete()
        .eq('token', qrToken);
    }
  });

  // ============================================
  // FR-UM-1: User Registration (Signup)
  // ============================================
  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      expect(response.body.data.user).toHaveProperty('firstName', testUser.firstName);
      expect(response.body.data.user).toHaveProperty('lastName', testUser.lastName);
      expect(response.body.data.user).toHaveProperty('role', testUser.role);

      // Save user ID for cleanup
      userId = response.body.data.user.id;
    });

    it('should reject signup with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'incomplete@example.com',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Missing required fields');
    });

    it('should reject signup with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid email format');
    });

    it('should reject signup with short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: global.testUtils.generateTestEmail(),
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('at least 8 characters');
    });

    it('should reject signup with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: global.testUtils.generateTestEmail(),
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'invalid_role',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid role');
    });

    it('should accept all valid SRD roles', async () => {
      const validRoles = ['student', 'trainer', 'alumni', 'recruiter', 'admin'];
      
      for (const role of validRoles) {
        const email = global.testUtils.generateTestEmail();
        const response = await request(app)
          .post('/api/auth/signup')
          .send({
            email,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            role,
          })
          .expect(201);

        expect(response.body.data.user.role).toBe(role);

        // Cleanup
        const newUserId = response.body.data.user.id;
        await supabaseAdminClient.from('profiles').delete().eq('id', newUserId);
        await supabaseAdminClient.auth.admin.deleteUser(newUserId);
      }
    });
  });

  // ============================================
  // FR-UM-2: User Login
  // ============================================
  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Verify the test user's email before login tests
      await supabaseAdminClient
        .from('profiles')
        .update({
          email_verified: true,
          verification_token: null,
          verified_at: new Date().toISOString(),
        })
        .eq('id', userId);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);

      // Save access token for subsequent tests
      accessToken = response.body.data.accessToken;
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('required');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login if email is not verified', async () => {
      // Create a new unverified user
      const unverifiedEmail = global.testUtils.generateTestEmail();
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: unverifiedEmail,
          password: 'TestPassword123!',
          firstName: 'Unverified',
          lastName: 'User',
          role: 'student',
        })
        .expect(201);

      const unverifiedUserId = signupResponse.body.data.user.id;

      // Try to login without verifying email
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: unverifiedEmail,
          password: 'TestPassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(loginResponse.body).toHaveProperty('success', false);
      expect(loginResponse.body.message).toContain('verify your email');

      // Cleanup unverified user
      await supabaseAdminClient.from('profiles').delete().eq('id', unverifiedUserId);
      await supabaseAdminClient.auth.admin.deleteUser(unverifiedUserId);
    });
  });

  // ============================================
  // FR-UM-3: Get Current User
  // ============================================
  describe('GET /api/users/me', () => {
    it('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('firstName', testUser.firstName);
      expect(response.body.data).toHaveProperty('lastName', testUser.lastName);
      expect(response.body.data).toHaveProperty('role', testUser.role);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================
  // FR-UM-6: Profile Update
  // ============================================
  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'This is my updated bio',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.data).toHaveProperty('firstName', updateData.firstName);
      expect(response.body.data).toHaveProperty('lastName', updateData.lastName);
      expect(response.body.data).toHaveProperty('bio', updateData.bio);
      expect(response.body.data).toHaveProperty('avatar_url', updateData.avatar_url);
    });

    it('should update only provided fields', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bio: 'Only updating bio',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('bio', 'Only updating bio');
      expect(response.body.data).toHaveProperty('firstName', 'Updated'); // Previous value
    });

    it('should reject profile update without authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({
          firstName: 'Unauthorized',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject role modification through profile update', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'admin',
        })
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Role cannot be modified');
    });

    it('should reject bio exceeding 500 characters', async () => {
      const longBio = 'a'.repeat(501);
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bio: longBio,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('500 characters');
    });

    it('should reject invalid name lengths', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'A', // Too short
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('between 2 and 50 characters');
    });
  });

  // ============================================
  // FR-UM-4: Email Verification
  // ============================================
  describe('POST /api/auth/verify-email', () => {
    beforeAll(async () => {
      // Create a verification token for testing
      verificationToken = global.testUtils.generateRandomString(32);
      await supabaseAdminClient
        .from('profiles')
        .update({
          verification_token: verificationToken,
          email_verified: false,
        })
        .eq('id', userId);
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: verificationToken,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Email verified successfully');
      expect(response.body.data).toHaveProperty('email', testUser.email);

      // Verify in database
      const { data } = await supabaseAdminClient
        .from('profiles')
        .select('email_verified, verification_token, verified_at')
        .eq('id', userId)
        .single();

      expect(data.email_verified).toBe(true);
      expect(data.verification_token).toBeNull();
      expect(data.verified_at).not.toBeNull();
    });

    it('should reject verification with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('token is required');
    });

    it('should reject verification with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: 'invalid_token_12345',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should reject verification if already verified', async () => {
      // Try to verify again with the same token
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          token: verificationToken,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid or expired');
    });
  });

  // ============================================
  // FR-UM-5: QR-Based Enrollment
  // ============================================
  describe('GET /api/enroll/qr/:token', () => {
    beforeAll(async () => {
      // Create a test course
      const { data: course } = await supabaseAdminClient
        .from('courses')
        .insert([
          {
            title: 'Test Course for QR Enrollment',
            description: 'Test course description',
          },
        ])
        .select()
        .single();

      courseId = course.id;

      // Create a QR enrollment token
      qrToken = `QR-TEST-${global.testUtils.generateRandomString(16)}`;
      await supabaseAdminClient.from('enrollment_qr_tokens').insert([
        {
          course_id: courseId,
          token: qrToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        },
      ]);
    });

    afterAll(async () => {
      // Cleanup
      if (courseId) {
        await supabaseAdminClient.from('enrollments').delete().eq('course_id', courseId);
        await supabaseAdminClient.from('enrollment_qr_tokens').delete().eq('course_id', courseId);
        await supabaseAdminClient.from('courses').delete().eq('id', courseId);
      }
    });

    it('should enroll via QR code successfully', async () => {
      const response = await request(app)
        .get(`/api/enroll/qr/${qrToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('QR code');
      expect(response.body.data).toHaveProperty('enrollment');
      expect(response.body.data).toHaveProperty('course');
      expect(response.body.data.enrollment).toHaveProperty('student_id', userId);
      expect(response.body.data.enrollment).toHaveProperty('course_id', courseId);
      expect(response.body.data.course).toHaveProperty('id', courseId);
    });

    it('should reject QR enrollment without authentication', async () => {
      const response = await request(app)
        .get(`/api/enroll/qr/${qrToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject QR enrollment with invalid token', async () => {
      const response = await request(app)
        .get('/api/enroll/qr/INVALID-TOKEN-12345')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid QR');
    });

    it('should reject duplicate QR enrollment', async () => {
      const response = await request(app)
        .get(`/api/enroll/qr/${qrToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Already enrolled');
    });

    it('should reject expired QR token', async () => {
      // Create an expired token
      const expiredToken = `QR-EXPIRED-${global.testUtils.generateRandomString(16)}`;
      await supabaseAdminClient.from('enrollment_qr_tokens').insert([
        {
          course_id: courseId,
          token: expiredToken,
          expires_at: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        },
      ]);

      const response = await request(app)
        .get(`/api/enroll/qr/${expiredToken}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('expired');

      // Cleanup
      await supabaseAdminClient
        .from('enrollment_qr_tokens')
        .delete()
        .eq('token', expiredToken);
    });
  });
});
