/**
 * Progress Service
 * Centralized progress calculation for all roles
 * Formula: (submitted/total * 70) + (avg_grade/100 * 30)
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Calculate course progress for a student in a specific offering
 * @param {string} studentId
 * @param {string} offeringId
 * @returns {{ progress, total_assignments, submitted_assignments, average_grade }}
 */
export const calculateCourseProgress = async (studentId, offeringId) => {
  try {
    // Fetch all assignments for this offering
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('course_offering_id', offeringId);

    const total = (assignments || []).length;

    if (total === 0) {
      return { progress: 0, total_assignments: 0, submitted_assignments: 0, average_grade: null };
    }

    const assignmentIds = assignments.map(a => a.id);

    // Fetch student submissions for these assignments
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, assignment_id, grade, ai_score')
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds);

    const submitted = (submissions || []).length;

    // Average grade (trainer grade preferred, fallback to AI score)
    const scores = (submissions || [])
      .map(s => s.grade ?? s.ai_score)
      .filter(v => v !== null && v !== undefined);

    const avgGrade = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // Formula: (submitted/total * 70) + (avg_grade/100 * 30)
    const submissionScore = (submitted / total) * 70;
    const gradeScore = avgGrade !== null ? (avgGrade / 100) * 30 : 0;
    const progress = Math.round(submissionScore + gradeScore);

    return {
      progress,
      total_assignments: total,
      submitted_assignments: submitted,
      average_grade: avgGrade,
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

    // Filter to students only — defensive check against data integrity issues
    const studentEnrollments = (enrollments || []).filter(
      e => e.profiles?.role === 'student'
    );

    const results = await Promise.all(studentEnrollments.map(async (e) => {
      const calc = await calculateCourseProgress(e.student_id, offeringId);
      return {
        enrollment_id: e.id,
        student_id: e.student_id,
        student: e.profiles,
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
