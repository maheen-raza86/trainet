/**
 * Routes Index
 * Main router configuration
 */

import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import courseRoutes from './courseRoutes.js';
import courseOfferingRoutes from './courseOfferingRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import submissionRoutes from './submissionRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import enrollQRRoutes from './enrollQRRoutes.js';
import materialRoutes from './materialRoutes.js';

const router = express.Router();

/**
 * Health check route
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TRAINET API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  });
});

/**
 * API info route
 * GET /api
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to TRAINET API',
    data: {
      version: '1.0.0',
      description: 'Graduate-level training platform API',
      endpoints: {
        health: '/api/health',
        auth: {
          signup: 'POST /api/auth/signup',
          login: 'POST /api/auth/login',
        },
        users: {
          me: 'GET /api/users/me (protected)',
        },
        courses: {
          list: 'GET /api/courses',
          detail: 'GET /api/courses/:id',
          enroll: 'POST /api/courses/enroll (protected)',
          myCourses: 'GET /api/courses/my-courses (protected)',
        },
        enrollments: {
          enroll: 'POST /api/enrollments (student only)',
          my: 'GET /api/enrollments/my (protected)',
        },
        enroll: {
          qr: 'GET /api/enroll/qr/:token (protected)',
        },
        assignments: {
          create: 'POST /api/assignments (trainer only)',
          byCourse: 'GET /api/assignments/course/:courseId',
        },
        submissions: {
          submit: 'POST /api/submissions (student only)',
          byAssignment: 'GET /api/submissions/assignment/:assignmentId (trainer only)',
          my: 'GET /api/submissions/my (protected)',
        },
      },
    },
  });
});

/**
 * Authentication routes
 * /api/auth/*
 */
router.use('/auth', authRoutes);

/**
 * User routes
 * /api/users/*
 */
router.use('/users', userRoutes);

/**
 * Course routes
 * /api/courses/*
 */
router.use('/courses', courseRoutes);

/**
 * Course Offering routes
 * /api/course-offerings/*
 */
router.use('/course-offerings', courseOfferingRoutes);

/**
 * Enrollment routes
 * /api/enrollments/*
 */
router.use('/enrollments', enrollmentRoutes);

/**
 * QR Enrollment routes
 * /api/enroll/*
 */
router.use('/enroll', enrollQRRoutes);

/**
 * Assignment routes
 * /api/assignments/*
 */
router.use('/assignments', assignmentRoutes);

/**
 * Submission routes
 * /api/submissions/*
 */
router.use('/submissions', submissionRoutes);

/**
 * Course Material routes
 * /api/materials/*
 */
router.use('/materials', materialRoutes);

export default router;
