/**
 * Attendance Service
 * Manage per-session attendance for course offerings
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Mark or update attendance for a student on a session date (trainer only)
 */
export const markAttendance = async (trainerId, offeringId, studentId, sessionDate, status) => {
  try {
    if (!['present', 'absent'].includes(status)) {
      throw new BadRequestError('status must be "present" or "absent"');
    }

    // Verify trainer owns this offering
    const { data: offering } = await supabase
      .from('course_offerings')
      .select('trainer_id')
      .eq('id', offeringId)
      .single();

    if (!offering || offering.trainer_id !== trainerId) {
      throw new ForbiddenError('Not authorized to mark attendance for this offering');
    }

    // Upsert attendance record
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert([{
        offering_id: offeringId,
        student_id: studentId,
        session_date: sessionDate,
        status,
        marked_by: trainerId,
      }], { onConflict: 'offering_id,student_id,session_date' })
      .select('*')
      .single();

    if (error) {
      logger.error('Error marking attendance:', error);
      throw new BadRequestError('Failed to mark attendance');
    }

    return data;
  } catch (err) {
    if (err instanceof BadRequestError || err instanceof ForbiddenError) throw err;
    logger.error('Unexpected error marking attendance:', err);
    throw new BadRequestError('Failed to mark attendance');
  }
};

/**
 * Get all attendance records for an offering (trainer view)
 * Returns: { sessions: string[], students: [{ student_id, name, records: { date: status } }] }
 */
export const getOfferingAttendance = async (offeringId, trainerId) => {
  try {
    // Verify trainer owns this offering
    const { data: offering } = await supabase
      .from('course_offerings')
      .select('trainer_id, weekly_days, start_date, end_date')
      .eq('id', offeringId)
      .single();

    if (!offering || offering.trainer_id !== trainerId) {
      throw new ForbiddenError('Not authorized to view attendance for this offering');
    }

    // Get all enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        profiles!enrollments_student_id_fkey(id, first_name, last_name, email)
      `)
      .eq('offering_id', offeringId)
      .neq('status', 'dropped');

    // Get all attendance records for this offering
    const { data: records } = await supabase
      .from('attendance_records')
      .select('student_id, session_date, status')
      .eq('offering_id', offeringId)
      .order('session_date', { ascending: true });

    // Collect unique session dates
    const sessionDates = [...new Set((records || []).map(r => r.session_date))].sort();

    // Build per-student attendance map
    const students = (enrollments || []).map(e => {
      const studentRecords = {};
      (records || [])
        .filter(r => r.student_id === e.student_id)
        .forEach(r => { studentRecords[r.session_date] = r.status; });

      const presentCount = Object.values(studentRecords).filter(s => s === 'present').length;
      const totalSessions = sessionDates.length;
      const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      return {
        student_id: e.student_id,
        student: e.profiles,
        records: studentRecords,
        present_count: presentCount,
        total_sessions: totalSessions,
        attendance_pct: attendancePct,
      };
    });

    return { sessions: sessionDates, students };
  } catch (err) {
    if (err instanceof ForbiddenError || err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching offering attendance:', err);
    throw new BadRequestError('Failed to fetch attendance');
  }
};

/**
 * Get attendance for a specific student in an offering
 */
export const getStudentAttendance = async (studentId, offeringId) => {
  try {
    const { data: records, error } = await supabase
      .from('attendance_records')
      .select('session_date, status')
      .eq('offering_id', offeringId)
      .eq('student_id', studentId)
      .order('session_date', { ascending: true });

    if (error) throw new BadRequestError('Failed to fetch attendance');

    const presentCount = (records || []).filter(r => r.status === 'present').length;
    const totalSessions = (records || []).length;
    const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      records: records || [],
      present_count: presentCount,
      total_sessions: totalSessions,
      attendance_pct: attendancePct,
    };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching student attendance:', err);
    throw new BadRequestError('Failed to fetch attendance');
  }
};

/**
 * Add a new session date — inserts an 'absent' record for every enrolled student.
 * This seeds the date so it appears in the attendance grid immediately.
 */
export const addSessionDate = async (trainerId, offeringId, sessionDate) => {
  try {
    // Verify trainer owns this offering
    const { data: offering } = await supabase
      .from('course_offerings')
      .select('trainer_id')
      .eq('id', offeringId)
      .single();

    if (!offering || offering.trainer_id !== trainerId) {
      throw new ForbiddenError('Not authorized to add session dates for this offering');
    }

    // Get all enrolled (non-dropped) students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('offering_id', offeringId)
      .neq('status', 'dropped');

    if (!enrollments || enrollments.length === 0) {
      // No students yet — still create a placeholder by returning empty
      return { session_date: sessionDate, students_seeded: 0 };
    }

    // Upsert absent record for each student (won't overwrite existing records)
    const rows = enrollments.map(e => ({
      offering_id: offeringId,
      student_id: e.student_id,
      session_date: sessionDate,
      status: 'absent',
      marked_by: trainerId,
    }));

    const { error } = await supabase
      .from('attendance_records')
      .upsert(rows, { onConflict: 'offering_id,student_id,session_date', ignoreDuplicates: true });

    if (error) {
      logger.error('Error seeding session date:', error);
      throw new BadRequestError('Failed to add session date');
    }

    logger.info(`Session date ${sessionDate} added for offering ${offeringId} (${rows.length} students seeded)`);
    return { session_date: sessionDate, students_seeded: rows.length };
  } catch (err) {
    if (err instanceof BadRequestError || err instanceof ForbiddenError) throw err;
    logger.error('Unexpected error adding session date:', err);
    throw new BadRequestError('Failed to add session date');
  }
};
