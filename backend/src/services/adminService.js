/**
 * Admin Service
 * SRDS FR-AD-1 through FR-AD-4
 *
 * Provides:
 *  - Dashboard analytics aggregation
 *  - User management (list, update role, deactivate, delete)
 *  - Course & content oversight
 *  - Certificate management (list, revoke)
 *  - System logs
 *  - Settings CRUD
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

// ─────────────────────────────────────────────
// SYSTEM LOGGING (FR-AD-3)
// ─────────────────────────────────────────────

/**
 * Write a system log entry.
 * Non-blocking — errors are swallowed so logging never breaks the main flow.
 */
export const writeLog = async (eventType, description, userId = null, metadata = {}, ipAddress = null) => {
  try {
    await supabase.from('system_logs').insert([{
      event_type: eventType,
      user_id: userId || null,
      description,
      metadata,
      ip_address: ipAddress,
    }]);
  } catch (err) {
    logger.error('Failed to write system log:', err.message);
  }
};

// ─────────────────────────────────────────────
// DASHBOARD ANALYTICS (FR-AD-1)
// ─────────────────────────────────────────────

export const getDashboardStats = async () => {
  // Run all counts in parallel for performance
  const [
    profilesRes,
    coursesRes,
    offeringsRes,
    enrollmentsRes,
    assignmentsRes,
    submissionsRes,
    certificatesRes,
    certLogsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, role, created_at'),
    supabase.from('courses').select('id'),
    supabase.from('course_offerings').select('id, status'),
    supabase.from('enrollments').select('id, created_at'),
    supabase.from('assignments').select('id'),
    supabase.from('submissions').select('id, grade, ai_score, status, submitted_at'),
    supabase.from('certificates').select('id, status, issue_date'),
    supabase.from('certificate_logs').select('id, event_type'),
  ]);

  const profiles = profilesRes.data || [];
  const courses = coursesRes.data || [];
  const offerings = offeringsRes.data || [];
  const enrollments = enrollmentsRes.data || [];
  const assignments = assignmentsRes.data || [];
  const submissions = submissionsRes.data || [];
  const certificates = certificatesRes.data || [];
  const certLogs = certLogsRes.data || [];

  // User metrics
  const usersByRole = profiles.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const newUsersLast30Days = profiles.filter(p => p.created_at >= thirtyDaysAgo).length;

  // Learning activity
  const gradedSubmissions = submissions.filter(s => s.grade !== null || s.ai_score !== null);
  const scores = gradedSubmissions
    .map(s => s.grade ?? s.ai_score)
    .filter(v => v !== null);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const completionRate = assignments.length > 0
    ? Math.round((submissions.length / (assignments.length * Math.max(1, usersByRole.student || 1))) * 100)
    : 0;

  // Certificate metrics
  const validCerts = certificates.filter(c => c.status === 'valid').length;
  const revokedCerts = certificates.filter(c => c.status === 'revoked').length;
  const verificationCount = certLogs.filter(l => l.event_type === 'verified').length;

  // ── Chart data: last 8 weeks ──────────────────────────────────────────
  const buildWeeklyBuckets = (items, dateField) => {
    const buckets = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = items.filter(item => {
        const d = new Date(item[dateField]);
        return d >= weekStart && d < weekEnd;
      }).length;
      buckets.push({ label, count });
    }
    return buckets;
  };

  const userGrowthChart = buildWeeklyBuckets(profiles, 'created_at');
  const courseActivityChart = buildWeeklyBuckets(enrollments, 'created_at');

  return {
    users: {
      total: profiles.length,
      byRole: usersByRole,
      newLast30Days: newUsersLast30Days,
    },
    courses: {
      total: courses.length,
      totalOfferings: offerings.length,
      activeOfferings: offerings.filter(o => o.status === 'open').length,
      totalEnrollments: enrollments.length,
    },
    learning: {
      totalAssignments: assignments.length,
      totalSubmissions: submissions.length,
      gradedSubmissions: gradedSubmissions.length,
      averageScore,
      completionRate: Math.min(100, completionRate),
    },
    certificates: {
      total: certificates.length,
      valid: validCerts,
      revoked: revokedCerts,
      verificationCount,
    },
    charts: {
      userGrowth: userGrowthChart,
      courseActivity: courseActivityChart,
    },
  };
};

// ─────────────────────────────────────────────
// USER MANAGEMENT (FR-AD-2)
// ─────────────────────────────────────────────

export const getAllUsers = async ({ role, search, page = 1, limit = 20 } = {}) => {
  let query = supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, created_at, email_verified, bio, avatar_url, last_login_at, last_activity_at')
    .order('created_at', { ascending: false });

  if (role) query = query.eq('role', role);
  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    logger.error('Error fetching users:', error);
    throw new BadRequestError('Failed to fetch users');
  }

  return { users: data || [], count };
};

export const updateUser = async (userId, updateData, adminId) => {
  const { role, email_verified } = updateData;

  const validRoles = ['student', 'trainer', 'alumni', 'recruiter', 'admin'];
  if (role && !validRoles.includes(role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  const fields = {};
  if (role !== undefined) fields.role = role;
  if (email_verified !== undefined) fields.email_verified = email_verified;

  if (!Object.keys(fields).length) throw new BadRequestError('No valid fields to update');

  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    logger.error('Error updating user:', error);
    throw new BadRequestError('Failed to update user');
  }

  await writeLog('user_updated', `Admin updated user ${data.email}: ${JSON.stringify(fields)}`, adminId, { targetUserId: userId, changes: fields });

  return data;
};

export const deleteUser = async (userId, adminId) => {
  // Fetch user first
  const { data: user, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (fetchError || !user) throw new NotFoundError('User not found');

  // SRDS exception: prevent deletion if user has active course relations
  if (user.role === 'trainer') {
    const { data: activeOfferings } = await supabase
      .from('course_offerings')
      .select('id')
      .eq('trainer_id', userId)
      .eq('status', 'open');

    if (activeOfferings && activeOfferings.length > 0) {
      throw new ForbiddenError(
        `Cannot delete trainer with ${activeOfferings.length} active course offering(s). Close offerings first.`
      );
    }
  }

  if (user.role === 'student') {
    const { data: activeEnrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId);

    if (activeEnrollments && activeEnrollments.length > 0) {
      throw new ForbiddenError(
        `Cannot delete student with ${activeEnrollments.length} active enrollment(s).`
      );
    }
  }

  // Delete from Supabase Auth (this cascades to profiles via trigger or FK)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) {
    logger.error('Error deleting user from auth:', deleteError);
    throw new BadRequestError('Failed to delete user');
  }

  await writeLog('user_deleted', `Admin deleted user ${user.email} (role: ${user.role})`, adminId, { deletedUserId: userId, deletedEmail: user.email });

  return true;
};

// ─────────────────────────────────────────────
// COURSE & CONTENT MANAGEMENT
// ─────────────────────────────────────────────

export const getAllCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new BadRequestError('Failed to fetch courses');
  return data || [];
};

export const getAllOfferings = async () => {
  const { data, error } = await supabase
    .from('course_offerings')
    .select(`
      id, status, duration_weeks, hours_per_week, created_at,
      courses (id, title),
      profiles!course_offerings_trainer_id_fkey (id, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new BadRequestError('Failed to fetch offerings');
  return data || [];
};

export const deleteCourse = async (courseId, adminId) => {
  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single();

  if (!course) throw new NotFoundError('Course not found');

  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw new BadRequestError('Failed to delete course');

  await writeLog('course_deleted', `Admin deleted course: ${course.title}`, adminId, { courseId, courseTitle: course.title });
  return true;
};

// ─────────────────────────────────────────────
// CERTIFICATE MANAGEMENT
// ─────────────────────────────────────────────

export const getAllCertificates = async () => {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      id, certificate_uuid, status, issue_date, completion_percentage, average_score,
      revoke_reason, revoked_at,
      courses (id, title),
      profiles!certificates_student_id_fkey (id, first_name, last_name, email)
    `)
    .order('issue_date', { ascending: false });

  if (error) throw new BadRequestError('Failed to fetch certificates');
  return data || [];
};

export const revokeCertificate = async (certId, adminId, reason = '') => {
  const { data: cert } = await supabase
    .from('certificates')
    .select('id, certificate_uuid, status')
    .eq('id', certId)
    .single();

  if (!cert) throw new NotFoundError('Certificate not found');
  if (cert.status === 'revoked') throw new BadRequestError('Certificate is already revoked');

  const { data: updated, error } = await supabase
    .from('certificates')
    .update({
      status: 'revoked',
      revoke_reason: reason || null,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', certId)
    .select()
    .single();

  if (error) throw new BadRequestError('Failed to revoke certificate');

  // Log in certificate_logs
  await supabase.from('certificate_logs').insert([{
    certificate_id: certId,
    event_type: 'revoked',
    metadata: { adminId, reason },
  }]);

  await writeLog('certificate_revoked', `Admin revoked certificate ${cert.certificate_uuid}`, adminId, { certId, reason });

  return updated;
};

// ─────────────────────────────────────────────
// SYSTEM LOGS (FR-AD-3)
// ─────────────────────────────────────────────

export const getSystemLogs = async ({ eventType, page = 1, limit = 50 } = {}) => {
  let query = supabase
    .from('system_logs')
    .select(`
      id, event_type, description, metadata, ip_address, timestamp,
      profiles:user_id (id, first_name, last_name, email, role)
    `)
    .order('timestamp', { ascending: false });

  if (eventType) query = query.eq('event_type', eventType);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error } = await query;
  if (error) throw new BadRequestError('Failed to fetch system logs');
  return data || [];
};

// ─────────────────────────────────────────────
// SETTINGS (FR-AD-4)
// ─────────────────────────────────────────────

export const getSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) throw new BadRequestError('Failed to fetch settings');
  return data || [];
};

export const updateSetting = async (key, value, adminId) => {
  const { data, error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single();

  if (error || !data) throw new BadRequestError(`Setting '${key}' not found or update failed`);

  await writeLog('setting_updated', `Admin updated setting '${key}' to '${value}'`, adminId, { key, value });

  return data;
};

// ─────────────────────────────────────────────
// ACTIVITY TRACKING
// ─────────────────────────────────────────────

/**
 * Update last_login_at and last_activity_at for a user.
 * Called from authService on successful login.
 */
export const updateLastLogin = async (userId) => {
  const now = new Date().toISOString();
  await supabase
    .from('profiles')
    .update({ last_login_at: now, last_activity_at: now })
    .eq('id', userId);
};

/**
 * Update last_activity_at for a user.
 * Called from key action endpoints (submit, enroll, etc.).
 */
export const updateLastActivity = async (userId) => {
  await supabase
    .from('profiles')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', userId);
};
