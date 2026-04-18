/**
 * Guidance Service
 * Handle guidance request and mentorship session business logic
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { createNotification } from './notificationService.js';

// ─── Guidance Requests ────────────────────────────────────────────────────────

/**
 * Create a guidance request (students only)
 */
export const createRequest = async (userId, role, body) => {
  try {
    if (role !== 'student') throw new ForbiddenError('Only students can create guidance requests');

    const { topic, description, alumni_id } = body;

    if (!topic || topic.trim().length < 3) throw new BadRequestError('Topic must be at least 3 characters');
    if (!description || description.trim().length < 10) throw new BadRequestError('Description must be at least 10 characters');
    if (!alumni_id) throw new BadRequestError('alumni_id is required');

    const { data, error } = await supabase
      .from('guidance_requests')
      .insert([{
        student_id: userId,
        alumni_id,
        topic: topic.trim(),
        description: description.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      }])
      .select(`
        *,
        profiles!guidance_requests_student_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      logger.error('Error creating guidance request:', error);
      throw new BadRequestError('Failed to create guidance request');
    }

    // Notify alumni (non-blocking)
    try {
      createNotification(alumni_id, {
        title: 'New Guidance Request',
        message: `A student has requested your guidance on: ${topic.trim()}`,
        type: 'mentorship',
      });
    } catch { /* non-blocking */ }

    logger.info(`Guidance request created by student ${userId} to alumni ${alumni_id}`);
    return data;
  } catch (err) {
    if (err instanceof BadRequestError || err instanceof ForbiddenError) throw err;
    logger.error('Unexpected error creating guidance request:', err);
    throw new BadRequestError('Failed to create guidance request');
  }
};

/**
 * Get guidance requests for a student (or all if admin)
 */
export const getStudentRequests = async (userId, role) => {
  try {
    let query = supabase
      .from('guidance_requests')
      .select(`
        *,
        profiles!guidance_requests_alumni_id_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('student_id', userId).neq('status', 'cancelled');
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching student guidance requests:', error);
      throw new BadRequestError('Failed to fetch guidance requests');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching student guidance requests:', err);
    throw new BadRequestError('Failed to fetch guidance requests');
  }
};

/**
 * Get guidance requests for an alumni (or all if admin)
 */
export const getAlumniRequests = async (userId, role) => {
  try {
    let query = supabase
      .from('guidance_requests')
      .select(`
        *,
        profiles!guidance_requests_student_id_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('alumni_id', userId).neq('status', 'cancelled');
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching alumni guidance requests:', error);
      throw new BadRequestError('Failed to fetch guidance requests');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching alumni guidance requests:', err);
    throw new BadRequestError('Failed to fetch guidance requests');
  }
};

/**
 * Cancel a guidance request (student only, pending requests only)
 */
export const cancelRequest = async (requestId, studentId) => {
  try {
    const { data: request, error: reqError } = await supabase
      .from('guidance_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError || !request) throw new NotFoundError('Guidance request not found');
    if (request.student_id !== studentId) throw new ForbiddenError('Not authorized to cancel this request');
    if (request.status !== 'pending') throw new ConflictError('Only pending requests can be cancelled');

    const { data, error } = await supabase
      .from('guidance_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error cancelling guidance request:', error);
      throw new BadRequestError('Failed to cancel guidance request');
    }

    logger.info(`Guidance request ${requestId} cancelled by student ${studentId}`);
    return data;
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError ||
      err instanceof ConflictError
    ) throw err;
    logger.error('Unexpected error cancelling guidance request:', err);
    throw new BadRequestError('Failed to cancel guidance request');
  }
};


export const respondToRequest = async (requestId, alumniUserId, status) => {
  try {
    const allowed = ['accepted', 'rejected'];
    if (!allowed.includes(status)) throw new BadRequestError('Status must be "accepted" or "rejected"');

    const { data: request, error: reqError } = await supabase
      .from('guidance_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError || !request) throw new NotFoundError('Guidance request not found');
    if (request.alumni_id !== alumniUserId) throw new ForbiddenError('Not authorized to respond to this request');
    if (request.status !== 'pending') throw new ConflictError('Request is no longer pending');

    const { data, error } = await supabase
      .from('guidance_requests')
      .update({ status })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error responding to guidance request:', error);
      throw new BadRequestError('Failed to update guidance request');
    }

    // Notify student (non-blocking)
    try {
      createNotification(request.student_id, {
        title: status === 'accepted' ? 'Guidance Request Accepted' : 'Guidance Request Rejected',
        message: status === 'accepted'
          ? 'Your guidance request has been accepted!'
          : 'Your guidance request was not accepted at this time.',
        type: 'mentorship',
      });
    } catch { /* non-blocking */ }

    logger.info(`Guidance request ${requestId} ${status} by alumni ${alumniUserId}`);
    return data;
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError ||
      err instanceof ConflictError
    ) throw err;
    logger.error('Unexpected error responding to guidance request:', err);
    throw new BadRequestError('Failed to update guidance request');
  }
};

// ─── Mentorship Sessions ──────────────────────────────────────────────────────

/**
 * Create a mentorship session (alumni only)
 */
export const createSession = async (alumniUserId, body) => {
  try {
    const { guidance_request_id, title, topic, start_date, end_date, meeting_link } = body;

    if (!guidance_request_id) throw new BadRequestError('guidance_request_id is required');
    if (!title) throw new BadRequestError('title is required');
    if (!topic) throw new BadRequestError('topic is required');
    if (!start_date) throw new BadRequestError('start_date is required');
    if (!end_date) throw new BadRequestError('end_date is required');
    if (!meeting_link) throw new BadRequestError('meeting_link is required');

    const { data: guidanceRequest, error: grError } = await supabase
      .from('guidance_requests')
      .select('*')
      .eq('id', guidance_request_id)
      .single();

    if (grError || !guidanceRequest) throw new NotFoundError('Guidance request not found');
    if (guidanceRequest.alumni_id !== alumniUserId) throw new ForbiddenError('Not authorized to create a session for this request');
    if (guidanceRequest.status !== 'accepted') throw new ConflictError('Guidance request must be accepted before creating a session');

    if (new Date(end_date) <= new Date(start_date)) {
      throw new BadRequestError('end_date must be after start_date');
    }

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert([{
        guidance_request_id,
        title,
        topic,
        start_date,
        end_date,
        meeting_link,
        student_id: guidanceRequest.student_id,
        alumni_id: guidanceRequest.alumni_id,
        allow_group_session: false,
        max_students: 1,
        status: 'pending',
        created_at: new Date().toISOString(),
      }])
      .select('*')
      .single();

    if (error) {
      logger.error('Error creating mentorship session:', error);
      throw new BadRequestError('Failed to create mentorship session');
    }

    // Notify student (non-blocking)
    try {
      createNotification(guidanceRequest.student_id, {
        title: 'Mentorship Session Created',
        message: `A mentorship session has been created for your guidance request on: ${topic}`,
        type: 'mentorship',
      });
    } catch { /* non-blocking */ }

    logger.info(`Mentorship session created by alumni ${alumniUserId} for request ${guidance_request_id}`);
    return data;
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError ||
      err instanceof ConflictError
    ) throw err;
    logger.error('Unexpected error creating mentorship session:', err);
    throw new BadRequestError('Failed to create mentorship session');
  }
};

/**
 * Get mentorship sessions for a student (or all if admin)
 */
export const getStudentSessions = async (userId, role) => {
  try {
    let query = supabase
      .from('mentorship_sessions')
      .select(`
        *,
        profiles!mentorship_sessions_alumni_id_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('student_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching student sessions:', error);
      throw new BadRequestError('Failed to fetch sessions');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching student sessions:', err);
    throw new BadRequestError('Failed to fetch sessions');
  }
};

/**
 * Get mentorship sessions for an alumni (or all if admin)
 */
export const getAlumniSessions = async (userId, role) => {
  try {
    let query = supabase
      .from('mentorship_sessions')
      .select(`
        *,
        profiles!mentorship_sessions_student_id_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      query = query.eq('alumni_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching alumni sessions:', error);
      throw new BadRequestError('Failed to fetch sessions');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching alumni sessions:', err);
    throw new BadRequestError('Failed to fetch sessions');
  }
};

/**
 * Get a single session by ID with access control
 */
export const getSessionById = async (sessionId, userId, role) => {
  try {
    const { data: session, error } = await supabase
      .from('mentorship_sessions')
      .select(`
        *,
        profiles!mentorship_sessions_student_id_fkey(id, first_name, last_name, email),
        alumni:profiles!mentorship_sessions_alumni_id_fkey(id, first_name, last_name, email)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) throw new NotFoundError('Session not found');

    if (role === 'admin') return session;
    if (role === 'student' && session.student_id !== userId) throw new ForbiddenError('Not authorized to view this session');
    if (role === 'alumni' && session.alumni_id !== userId) throw new ForbiddenError('Not authorized to view this session');

    return session;
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
    logger.error('Unexpected error fetching session by id:', err);
    throw new BadRequestError('Failed to fetch session');
  }
};

/**
 * Update a mentorship session (alumni only)
 */
export const updateSession = async (sessionId, alumniUserId, body) => {
  try {
    const { data: session, error: sessError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessError || !session) throw new NotFoundError('Session not found');
    if (session.alumni_id !== alumniUserId) throw new ForbiddenError('Not authorized to update this session');
    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new ConflictError('Cannot update a completed or cancelled session');
    }

    if (body.status !== undefined) {
      const VALID_TRANSITIONS = {
        pending: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };
      const allowed = VALID_TRANSITIONS[session.status] || [];
      if (!allowed.includes(body.status)) {
        throw new ConflictError('Invalid status transition');
      }
    }

    const ALLOWED_FIELDS = ['title', 'description', 'meeting_link', 'schedule_text', 'session_notes', 'duration_text', 'status'];
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error updating mentorship session:', error);
      throw new BadRequestError('Failed to update session');
    }

    // Notify student on status change (non-blocking)
    if (body.status) {
      try {
        let title, message;
        if (body.status === 'active') {
          title = 'Your Session is Now Active';
          message = 'Your mentorship session is now active.';
        } else if (body.status === 'completed') {
          title = 'Session Completed';
          message = 'Your mentorship session has been marked as completed.';
        } else if (body.status === 'cancelled') {
          title = 'Session Cancelled';
          message = 'Your mentorship session has been cancelled.';
        }
        if (title) {
          createNotification(session.student_id, { title, message, type: 'mentorship' });
        }
      } catch { /* non-blocking */ }
    }

    logger.info(`Mentorship session ${sessionId} updated by alumni ${alumniUserId}`);
    return data;
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError ||
      err instanceof ConflictError
    ) throw err;
    logger.error('Unexpected error updating mentorship session:', err);
    throw new BadRequestError('Failed to update session');
  }
};

// ─── Materials ────────────────────────────────────────────────────────────────

/**
 * Upload a material to a session (alumni only)
 */
export const uploadMaterial = async (sessionId, alumniUserId, body) => {
  try {
    const { title, file_url, type } = body;

    if (!title) throw new BadRequestError('title is required');
    if (!file_url) throw new BadRequestError('file_url is required');
    if (!type) throw new BadRequestError('type is required');

    const VALID_TYPES = ['pdf', 'slides', 'image', 'document', 'link'];
    if (!VALID_TYPES.includes(type)) {
      throw new BadRequestError(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    const { data: session, error: sessError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessError || !session) throw new NotFoundError('Session not found');
    if (session.alumni_id !== alumniUserId) throw new ForbiddenError('Not authorized to upload materials for this session');

    const { data, error } = await supabase
      .from('mentorship_materials')
      .insert([{
        mentorship_session_id: sessionId,
        title,
        file_url,
        type,
        uploaded_by: alumniUserId,
        created_at: new Date().toISOString(),
      }])
      .select('*')
      .single();

    if (error) {
      logger.error('Error uploading material:', error);
      throw new BadRequestError('Failed to upload material');
    }

    // Notify student (non-blocking)
    try {
      createNotification(session.student_id, {
        title: 'New Material Added',
        message: `New material "${title}" has been added to your mentorship session.`,
        type: 'mentorship',
      });
    } catch { /* non-blocking */ }

    logger.info(`Material uploaded to session ${sessionId} by alumni ${alumniUserId}`);
    return data;
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError
    ) throw err;
    logger.error('Unexpected error uploading material:', err);
    throw new BadRequestError('Failed to upload material');
  }
};

/**
 * Get materials for a session with access control
 */
export const getMaterials = async (sessionId, userId, role) => {
  try {
    const { data: session, error: sessError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessError || !session) throw new NotFoundError('Session not found');

    if (role === 'student' && session.student_id !== userId) throw new ForbiddenError('Not authorized to view materials for this session');
    if (role === 'alumni' && session.alumni_id !== userId) throw new ForbiddenError('Not authorized to view materials for this session');

    const { data, error } = await supabase
      .from('mentorship_materials')
      .select('*')
      .eq('mentorship_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching materials:', error);
      throw new BadRequestError('Failed to fetch materials');
    }

    return data || [];
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError
    ) throw err;
    logger.error('Unexpected error fetching materials:', err);
    throw new BadRequestError('Failed to fetch materials');
  }
};

// ─── Feedback ─────────────────────────────────────────────────────────────────

/**
 * Submit feedback for a completed session (students only)
 */
export const submitFeedback = async (sessionId, studentId, body) => {
  try {
    const { rating, comment } = body;

    if (rating === undefined || rating === null) throw new BadRequestError('rating is required');

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    const { data: session, error: sessError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessError || !session) throw new NotFoundError('Session not found');
    if (session.student_id !== studentId) throw new ForbiddenError('Not authorized to submit feedback for this session');
    if (session.status !== 'completed') throw new ConflictError('Feedback can only be submitted for completed sessions');

    // Check for existing feedback
    const { data: existing } = await supabase
      .from('mentorship_feedback')
      .select('id')
      .eq('mentorship_session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (existing) throw new ConflictError('Feedback already submitted');

    const { data, error } = await supabase
      .from('mentorship_feedback')
      .insert([{
        mentorship_session_id: sessionId,
        student_id: studentId,
        rating: ratingNum,
        comment: comment || null,
        created_at: new Date().toISOString(),
      }])
      .select('*')
      .single();

    if (error) {
      logger.error('Error submitting feedback:', error);
      throw new BadRequestError('Failed to submit feedback');
    }

    // Notify alumni (non-blocking)
    try {
      createNotification(session.alumni_id, {
        title: 'Student Submitted Feedback',
        message: `A student has submitted feedback for your mentorship session.`,
        type: 'mentorship',
      });
    } catch { /* non-blocking */ }

    logger.info(`Feedback submitted for session ${sessionId} by student ${studentId}`);
    return data;
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError ||
      err instanceof ConflictError
    ) throw err;
    logger.error('Unexpected error submitting feedback:', err);
    throw new BadRequestError('Failed to submit feedback');
  }
};

/**
 * Get feedback for a session with access control
 */
export const getFeedback = async (sessionId, userId, role) => {
  try {
    const { data: session, error: sessError } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessError || !session) throw new NotFoundError('Session not found');

    if (role === 'alumni' && session.alumni_id !== userId) throw new ForbiddenError('Not authorized to view feedback for this session');

    const { data, error } = await supabase
      .from('mentorship_feedback')
      .select('*')
      .eq('mentorship_session_id', sessionId);

    if (error) {
      logger.error('Error fetching feedback:', error);
      throw new BadRequestError('Failed to fetch feedback');
    }

    return data || [];
  } catch (err) {
    if (
      err instanceof BadRequestError ||
      err instanceof NotFoundError ||
      err instanceof ForbiddenError
    ) throw err;
    logger.error('Unexpected error fetching feedback:', err);
    throw new BadRequestError('Failed to fetch feedback');
  }
};
