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
import attendanceRoutes from './attendanceRoutes.js';
import recruiterRoutes from './recruiterRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import aiRoutes from './aiRoutes.js';
import supabase from '../config/supabaseClient.js';
import { normalizeAvatarUrl } from '../utils/storageService.js';

/**
 * Normalize avatar URLs on a profiles sub-object returned by Supabase joins.
 * Handles both { profile_picture_url, avatar_url } shapes.
 * Returns the profiles object with URLs rewritten — does not mutate input.
 */
const normalizeProfileAvatars = (profiles) => {
  if (!profiles) return profiles;
  return {
    ...profiles,
    profile_picture_url: normalizeAvatarUrl(profiles.profile_picture_url),
    avatar_url: normalizeAvatarUrl(profiles.avatar_url),
  };
};

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
 * Public alumni list endpoint (no auth required)
 * GET /api/public/alumni
 */
router.get('/public/alumni', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select(`
        id, headline, skills, available_for_mentorship,
        profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, profile_picture_url, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(200).json({ success: true, data: { alumni: [] } });
    const normalized = (data || []).map(a => ({
      ...a,
      profiles: normalizeProfileAvatars(a.profiles),
    }));
    return res.status(200).json({ success: true, data: { alumni: normalized } });
  } catch {
    return res.status(200).json({ success: true, data: { alumni: [] } });
  }
});

/**
 * Public alumni profile endpoint (no auth required)
 * GET /api/public/alumni/:id
 */
router.get('/public/alumni/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select(`
        id, headline, bio, experience, skills, achievements,
        linkedin_url, portfolio_url, available_for_mentorship,
        profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, profile_picture_url, avatar_url)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Alumni not found' });
    const normalized = {
      ...data,
      profiles: normalizeProfileAvatars(data.profiles),
    };
    return res.status(200).json({ success: true, data: normalized });
  } catch {
    return res.status(404).json({ success: false, message: 'Alumni not found' });
  }
});

/**
 * Public top candidates endpoint for talent pool preview (no auth required)
 * GET /api/public/top-candidates
 * Returns top 6 real students ranked by score (certs + grades + completed courses)
 */
router.get('/public/top-candidates', async (req, res) => {
  try {
    // 1. Fetch all students
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'student');

    if (studentsError || !students || students.length === 0) {
      return res.status(200).json({ success: true, data: { candidates: [] } });
    }

    // 2. Fetch certificates (with course title for skill tags)
    const { data: allCerts } = await supabase
      .from('certificates')
      .select('student_id, average_score, courses(title)')
      .eq('status', 'valid');

    // 3. Fetch completed enrollments (with course title for skill tags)
    const { data: allEnrollments } = await supabase
      .from('enrollments')
      .select('student_id, progress, course_offerings(courses(title))')
      .gte('progress', 80);

    // 4. Fetch graded submissions for avg grade
    const { data: allSubmissions } = await supabase
      .from('submissions')
      .select('student_id, grade, ai_score')
      .not('grade', 'is', null);

    // Helper: extract keyword tags from a course title
    const extractTags = (title) => {
      if (!title) return [];
      const lower = title.toLowerCase();
      const tagMap = [
        ['react',           'React'],
        ['angular',         'Angular'],
        ['vue',             'Vue.js'],
        ['node',            'Node.js'],
        ['javascript',      'JavaScript'],
        ['typescript',      'TypeScript'],
        ['python',          'Python'],
        ['java',            'Java'],
        ['spring',          'Spring Boot'],
        ['django',          'Django'],
        ['flask',           'Flask'],
        ['machine learning','Machine Learning'],
        ['deep learning',   'Deep Learning'],
        ['data science',    'Data Science'],
        ['data analysis',   'Data Analysis'],
        ['ai',              'AI'],
        ['nlp',             'NLP'],
        ['cybersecurity',   'Cybersecurity'],
        ['security',        'Security'],
        ['networking',      'Networking'],
        ['linux',           'Linux'],
        ['cloud',           'Cloud'],
        ['aws',             'AWS'],
        ['azure',           'Azure'],
        ['devops',          'DevOps'],
        ['docker',          'Docker'],
        ['kubernetes',      'Kubernetes'],
        ['database',        'Database'],
        ['sql',             'SQL'],
        ['postgresql',      'PostgreSQL'],
        ['mongodb',         'MongoDB'],
        ['ui',              'UI/UX'],
        ['ux',              'UI/UX'],
        ['figma',           'Figma'],
        ['mobile',          'Mobile Dev'],
        ['flutter',         'Flutter'],
        ['kotlin',          'Kotlin'],
        ['swift',           'Swift'],
        ['system admin',    'SysAdmin'],
        ['administration',  'SysAdmin'],
        ['blockchain',      'Blockchain'],
        ['web',             'Web Dev'],
        ['frontend',        'Frontend'],
        ['backend',         'Backend'],
        ['fullstack',       'Full Stack'],
        ['full stack',      'Full Stack'],
        ['testing',         'Testing'],
        ['qa',              'QA'],
        ['agile',           'Agile'],
        ['scrum',           'Scrum'],
      ];
      const found = [];
      for (const [keyword, label] of tagMap) {
        if (lower.includes(keyword) && !found.includes(label)) {
          found.push(label);
        }
      }
      // Fallback: use first 2 words of title as tag if nothing matched
      if (found.length === 0) {
        const words = title.split(/\s+/).slice(0, 2).join(' ');
        if (words) found.push(words);
      }
      return found.slice(0, 3);
    };

    // 5. Build per-student maps
    const certsByStudent = {};
    for (const c of (allCerts || [])) {
      if (!certsByStudent[c.student_id]) certsByStudent[c.student_id] = [];
      certsByStudent[c.student_id].push(c);
    }

    const enrollmentsByStudent = {};
    for (const e of (allEnrollments || [])) {
      if (!enrollmentsByStudent[e.student_id]) enrollmentsByStudent[e.student_id] = [];
      enrollmentsByStudent[e.student_id].push(e);
    }

    const gradesByStudent = {};
    for (const s of (allSubmissions || [])) {
      if (!gradesByStudent[s.student_id]) gradesByStudent[s.student_id] = [];
      const val = s.grade ?? s.ai_score;
      if (val !== null && val !== undefined) gradesByStudent[s.student_id].push(Number(val));
    }

    // 6. Score and enrich each student
    const candidates = [];
    for (const student of students) {
      const certs = certsByStudent[student.id] || [];
      const enrollments = enrollmentsByStudent[student.id] || [];
      const grades = gradesByStudent[student.id] || [];

      // Only include students with at least 1 cert OR 1 completed course
      if (certs.length === 0 && enrollments.length === 0) continue;

      const certCount = certs.length;
      const completedCourses = enrollments.length;
      const avgGrade = grades.length > 0
        ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
        : (certs.length > 0 ? Math.round(certs.reduce((a, c) => a + (c.average_score || 0), 0) / certs.length) : 0);

      // Score: cert weight 40%, grade weight 40%, completed courses 20%
      const certScore  = Math.min(certCount / 3, 1) * 40;
      const gradeScore = (avgGrade / 100) * 40;
      const courseScore = Math.min(completedCourses / 3, 1) * 20;
      const totalScore = Math.round(certScore + gradeScore + courseScore);

      // Collect skill tags from course titles
      const tagSet = new Set();
      for (const c of certs) {
        for (const tag of extractTags(c.courses?.title)) tagSet.add(tag);
      }
      for (const e of enrollments) {
        const title = e.course_offerings?.courses?.title;
        for (const tag of extractTags(title)) tagSet.add(tag);
      }
      const skills = [...tagSet].slice(0, 4);

      candidates.push({
        name: `${student.first_name} ${student.last_name[0]}.`,
        first_name: student.first_name,
        certs: certCount,
        score: totalScore,
        skills,
      });
    }

    // 7. Sort by score DESC, take top 6
    candidates.sort((a, b) => b.score - a.score);
    const top6 = candidates.slice(0, 6);

    return res.status(200).json({ success: true, data: { candidates: top6 } });
  } catch (err) {
    return res.status(200).json({ success: true, data: { candidates: [] } });
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
      supabase.from('alumni_profiles').select(`id, headline, skills, available_for_mentorship, profiles!alumni_profiles_user_id_fkey(id, first_name, last_name, profile_picture_url, avatar_url)`).limit(6),
    ]);

    const profiles = profilesRes.data || [];
    const normalizedAlumni = (alumniRes.data || []).map(a => ({
      ...a,
      profiles: normalizeProfileAvatars(a.profiles),
    }));
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
        alumni: normalizedAlumni,
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
 * Attendance routes
 * /api/attendance/*
 */
router.use('/attendance', attendanceRoutes);

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
