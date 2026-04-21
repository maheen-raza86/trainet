/**
 * Progress Service
 * Formula: required = hours_per_week × duration_weeks
 *          progress = Math.round((submitted / required) * 100)
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Calculate course progress for a student in a specific offering.
 * total_assignments = hours_per_week × duration_weeks (SRDS formula)
 * submitted_assignments = actual submissions in DB
 * progress = Math.round((submitted / total) * 100)
 */
export const calculateCourseProgress = async (studentId, offeringId) => {
  try {
    // Fetch offering to get hours_per_week and duration_weeks
    const { data: offering } = await supabase
      .from('course_offerings')
      .select('hours_per_week, duration_weeks')
      .eq('id', offeringId)
      .single();

    // Required assignments = hours/week × weeks (SRDS)
    const hoursPerWeek   = offering?.hours_per_week   ?? 0;
    const durationWeeks  = offering?.duration_weeks   ?? 0;
    const required       = hoursPerWeek * durationWeeks;

    console.log(`[Progress] offeringId=${offeringId} studentId=${studentId}`);
    console.log(`[Progress] hours_per_week=${hoursPerWeek} duration_weeks=${durationWeeks} required=${required}`);

    if (required === 0) {
      return { progress: 0, total_assignments: 0, submitted_assignments: 0, average_grade: null };
    }

    // Fetch all assignment IDs for this offering
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('course_offering_id', offeringId);

    const assignmentIds = (assignments || []).map(a => a.id);

    // Fetch student submissions for those assignments
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('id, assignment_id, final_score, ai_score')
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['00000000-0000-0000-0000-000000000000']);

    if (subError) {
      logger.error('[Progress] submissions query error:', subError.message);
    }

    const submitted = (submissions || []).length;

    // Average score: final_score preferred, fallback to ai_score
    const scores = (submissions || [])
      .map(s => s.final_score ?? s.ai_score)
      .filter(v => v !== null && v !== undefined);

    const avgGrade = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

    // Simple completion percentage
    const progress = Math.min(100, Math.round((submitted / required) * 100));

    console.log(`[Progress] submitted=${submitted} required=${required} progress=${progress}% avgGrade=${avgGrade}`);

    return {
      progress,
      total_assignments:     required,
      submitted_assignments: submitted,
      average_grade:         avgGrade,
    };
  } catch (err) {
    logger.error('Error calculating course progress:', err);
    return { progress: 0, total_assignments: 0, submitted_assignments: 0, average_grade: null };
  }
};

/**
 * Get progress for all students in an offering (trainer/admin use)
 * @param {string} offeringId
 * @returns {Array} students with progress data
 */
export const getOfferingProgress = async (offeringId) => {
  try {
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id, student_id, progress,
        profiles!enrollments_student_id_fkey(id, first_name, last_name, email, role)
      `)
      .eq('offering_id', offeringId);

    if (error) throw new BadRequestError('Failed to fetch enrollments');

    const studentEnrollments = (enrollments || []).filter(
      e => e.profiles?.role === 'student'
    );

    const results = await Promise.all(studentEnrollments.map(async (e) => {
      const calc = await calculateCourseProgress(e.student_id, offeringId);

      // Also check if certificate already issued
      const { data: cert } = await supabase
        .from('certificates')
        .select('id, certificate_uuid, status')
        .eq('student_id', e.student_id)
        .eq('offering_id', offeringId)
        .single();

      return {
        enrollment_id: e.id,
        student_id:    e.student_id,
        student:       e.profiles,
        certificate:   cert || null,
        ...calc,
      };
    }));

    return results;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Error fetching offering progress:', err);
    throw new BadRequestError('Failed to fetch progress');
  }
};

/**
 * Sync calculated progress back to enrollments table
 * @param {string} studentId
 * @param {string} offeringId
 */
export const syncProgressToEnrollment = async (studentId, offeringId) => {
  try {
    const { progress } = await calculateCourseProgress(studentId, offeringId);
    await supabase
      .from('enrollments')
      .update({ progress })
      .eq('student_id', studentId)
      .eq('offering_id', offeringId);
  } catch (err) {
    logger.error('Error syncing progress:', err);
  }
};

/**
 * Alias for backward compatibility with progressController
 */
export const getStudentProgress = calculateCourseProgress;

/**
 * Calculate weekly progress for a student in a specific offering
 * "Current week" = ISO week containing today
 */
export const calculateWeeklyProgress = async (studentId, offeringId) => {
  try {
    // Get all assignments for this offering
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, due_date')
      .eq('course_offering_id', offeringId);

    if (!assignments || assignments.length === 0) {
      return { weekly_total: 0, weekly_submitted: 0, weekly_progress: 0 };
    }

    // Determine current ISO week boundaries (Monday–Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Filter assignments due this week
    const weeklyAssignments = assignments.filter(a => {
      if (!a.due_date) return false;
      const d = new Date(a.due_date);
      return d >= monday && d <= sunday;
    });

    const weeklyTotal = weeklyAssignments.length;
    if (weeklyTotal === 0) {
      return { weekly_total: 0, weekly_submitted: 0, weekly_progress: 0 };
    }

    const weeklyIds = weeklyAssignments.map(a => a.id);
    const { data: subs } = await supabase
      .from('submissions')
      .select('id')
      .eq('student_id', studentId)
      .in('assignment_id', weeklyIds);

    const weeklySubmitted = (subs || []).length;
    const weeklyProgress = Math.round((weeklySubmitted / weeklyTotal) * 100);

    return { weekly_total: weeklyTotal, weekly_submitted: weeklySubmitted, weekly_progress: weeklyProgress };
  } catch (err) {
    logger.error('Error calculating weekly progress:', err);
    return { weekly_total: 0, weekly_submitted: 0, weekly_progress: 0 };
  }
};

/**
 * Get next upcoming session date based on weekly_days and session_start_time
 */
export const getNextSessionDate = (weeklyDays, sessionStartTime) => {
  if (!weeklyDays || weeklyDays.length === 0) return null;

  const DAY_MAP = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
  const now = new Date();
  const todayNum = now.getDay();

  // Find the next occurrence
  let minDiff = Infinity;
  let nextDate = null;

  for (const day of weeklyDays) {
    const targetNum = DAY_MAP[day];
    if (targetNum === undefined) continue;
    let diff = (targetNum - todayNum + 7) % 7;
    if (diff === 0) diff = 7; // same day = next week
    if (diff < minDiff) {
      minDiff = diff;
      const d = new Date(now);
      d.setDate(now.getDate() + diff);
      if (sessionStartTime) {
        const [h, m] = sessionStartTime.split(':').map(Number);
        d.setHours(h || 0, m || 0, 0, 0);
      } else {
        d.setHours(0, 0, 0, 0);
      }
      nextDate = d;
    }
  }

  return nextDate;
};
