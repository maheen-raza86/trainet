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
import qrEnrollmentRoutes from './qrEnrollmentRoutes.js';
import materialRoutes from './materialRoutes.js';
import progressRoutes from './progressRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import adminRoutes from './adminRoutes.js';
import workPracticeRoutes from './workPracticeRoutes.js';
import alumniRoutes from './alumniRoutes.js';
import guidanceRoutes from './guidanceRoutes.js';
import recruiterRoutes from './recruiterRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import aiRoutes from './aiRoutes.js';
import supabase from '../config/supabaseClient.js';

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
 * Global search endpoint
 * GET /api/search?q=
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: { courses: [], alumni: [] } });
    }
    const term = `%${q.trim()}%`;
    const [coursesRes, alumniRes] = await Promise.all([
      supabase.from('courses').select('id, title, description').ilike('title', term).limit(5),
      supabase.from('alumni_profiles').select(`id, headline, skills, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name)`).or(`headline.ilike.${term},skills.ilike.${term}`).limit(5),
    ]);
    res.status(200).json({
      success: true,
      data: {
        courses: coursesRes.data || [],
        alumni: alumniRes.data || [],
      },
    });
  } catch {
    res.status(200).json({ success: true, data: { courses: [], alumni: [] } });
  }
});

/**
 * Public stats endpoint for landing page (no auth required)
 * GET /api/public/stats
 */
router.get('/public/stats', async (req, res) => {
  try {
    const [profilesRes, coursesRes, certsRes, offeringsRes, alumniRes] = await Promise.all([
      supabase.from('profiles').select('id, role', { count: 'exact', head: false }),
      supabase.from('courses').select('id', { count: 'exact', head: false }),
      supabase.from('certificates').select('id', { count: 'exact', head: false }).eq('status', 'valid'),
      supabase.from('course_offerings').select(`id, status, courses(id, title, description), profiles!course_offerings_trainer_id_fkey(first_name, last_name)`).eq('status', 'open').order('created_at', { ascending: false }).limit(6),
      supabase.from('alumni_profiles').select(`id, headline, skills, available_for_mentorship, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name)`).limit(6),
    ]);

    const profiles = profilesRes.data || [];
    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_users: profiles.length,
          total_students: profiles.filter(p => p.role === 'student').length,
          total_courses: (coursesRes.data || []).length,
          total_certificates: (certsRes.data || []).length,
        },
        featured_offerings: offeringsRes.data || [],
        alumni: alumniRes.data || [],
      },
    });
  } catch (err) {
    res.status(200).json({ success: true, data: { stats: {}, featured_offerings: [], alumni: [] } });
  }
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
 * Admin routes
 * /api/admin/* — admin role only
 * IMPORTANT: Must be registered BEFORE /course-offerings to avoid route conflicts
 */
router.use('/admin', adminRoutes);

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
 * QR Enrollment Management routes (trainer)
 * /api/qr-enrollment/*
 */
router.use('/qr-enrollment', qrEnrollmentRoutes);

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

/**
 * Progress routes
 * /api/progress/*
 */
router.use('/progress', progressRoutes);

/**
 * Certificate routes
 * /api/certificates/*
 */
router.use('/certificates', certificateRoutes);

/**
 * Work & Practice routes
 * /api/tasks/*
 */
router.use('/tasks', workPracticeRoutes);

/**
 * Alumni & Consultancy Network routes
 * /api/alumni/*
 */
router.use('/alumni', alumniRoutes);

/**
 * Guidance & Mentorship Session routes
 * /api/guidance/*
 */
router.use('/guidance', guidanceRoutes);

/**
 * Recruiter / Talent Pool routes
 * /api/recruiter/*
 */
router.use('/recruiter', recruiterRoutes);

/**
 * Notification routes
 * /api/notifications/*
 */
router.use('/notifications', notificationRoutes);

/**
 * AI Personalization & Recommendation routes
 * /api/ai/*
 */
router.use('/ai', aiRoutes);

export default router;
