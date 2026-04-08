/**
 * Progress Service
 * SRDS: "System will allow learners to monitor their progress"
 * Computes per-offering progress for a student.
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Get progress summary for a student in a specific course offering.
 *
 * @param {string} studentId   - Student user ID
 * @param {string} offeringId  - Course offering ID
 * @returns {Promise<Object>}  Progress summary
 */
export const getStudentProgress = async (studentId, offeringId) => {
  // 1. Verify enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, progress, enrolled_at')
    .eq('student_id', studentId)
    .eq('offering_id', offeringId)
    .single();

  if (enrollError || !enrollment) {
    throw new ForbiddenError('You are not enrolled in this course offering');
  }

  // 2. Fetch all assignments for the offering
  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('id, title, due_date')
    .eq('course_offering_id', offeringId)
    .order('due_date', { ascending: true });

  if (assignError) {
    logger.error('Error fetching assignments for progress:', assignError);
    throw new BadRequestError('Failed to fetch progress data');
  }

  const totalAssignments = (assignments || []).length;

  // 3. Fetch student's submissions for this offering's assignments
  let submissions = [];
  if (totalAssignments > 0) {
    const assignmentIds = assignments.map((a) => a.id);
    const { data: subs, error: subError } = await supabase
      .from('submissions')
      .select('id, assignment_id, status, grade, ai_score, submitted_at, graded_at')
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds);

    if (subError) {
      logger.error('Error fetching submissions for progress:', subError);
      throw new BadRequestError('Failed to fetch progress data');
    }
    submissions = subs || [];
  }

  // 4. Compute metrics
  const completedSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.grade !== null);

  // Average score: prefer trainer grade, fall back to AI score
  const scores = gradedSubmissions
    .map((s) => s.grade ?? s.ai_score)
    .filter((v) => v !== null && v !== undefined);

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
      : null;

  // Completion percentage
  const completionPct =
    totalAssignments > 0
      ? Math.round((completedSubmissions / totalAssignments) * 100)
      : 0;

  // Determine status
  let status = 'in_progress';
  if (completionPct === 100 && gradedSubmissions.length === totalAssignments) {
    status = 'completed';
  } else if (completedSubmissions === 0) {
    status = 'not_started';
  }

  // Last activity
  const lastActivity =
    submissions.length > 0
      ? submissions.sort(
          (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
        )[0].submitted_at
      : enrollment.enrolled_at;

  // Per-assignment breakdown
  const assignmentBreakdown = (assignments || []).map((a) => {
    const sub = submissions.find((s) => s.assignment_id === a.id);
    return {
      id: a.id,
      title: a.title,
      due_date: a.due_date,
      submitted: !!sub,
      status: sub ? sub.status : 'pending',
      grade: sub?.grade ?? null,
      ai_score: sub?.ai_score ?? null,
    };
  });

  // 5. Update enrollment progress field to keep it in sync
  const newProgress = completionPct;
  if (enrollment.progress !== newProgress) {
    await supabase
      .from('enrollments')
      .update({ progress: newProgress })
      .eq('id', enrollment.id);
  }

  return {
    offeringId,
    enrolledAt: enrollment.enrolled_at,
    totalAssignments,
    completedSubmissions,
    gradedSubmissions: gradedSubmissions.length,
    completionPercentage: completionPct,
    averageScore,
    status,
    lastActivity,
    assignments: assignmentBreakdown,
  };
};
