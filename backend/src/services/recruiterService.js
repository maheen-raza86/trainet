/**
 * Recruiter Service
 * SRDS Talent Pool Module
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

// ── AI Matching Score ─────────────────────────────────────────────────────────
// score = skill match (50%) + project relevance (30%) + performance/grades (20%)

const computeScore = (candidate, filters) => {
  let score = 0;

  // Skill match (50%)
  if (filters.skills && filters.skills.length > 0) {
    const candidateSkills = (candidate.skills || '').toLowerCase();
    const matchedSkills = filters.skills.filter(s => candidateSkills.includes(s.toLowerCase()));
    score += (matchedSkills.length / filters.skills.length) * 50;
  } else {
    score += 50; // no skill filter → full points
  }

  // Project relevance (30%) — based on work practice submissions
  const wpCount = candidate.wp_submission_count || 0;
  const wpScore = Math.min(wpCount / 3, 1) * 30; // max at 3+ submissions
  score += wpScore;

  // Performance/grades (20%) — average grade from submissions
  const avgGrade = candidate.avg_grade || 0;
  score += (avgGrade / 100) * 20;

  return Math.round(score);
};

// ── Search Candidates ─────────────────────────────────────────────────────────

export const searchCandidates = async (filters = {}) => {
  try {
    const { skills, minScore, projectType } = filters;

    // Fetch all student profiles visible in talent pool
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, skills, bio, interests, created_at')
      .eq('role', 'student')
      .eq('visibility_in_talent_pool', true);

    if (profileError) {
      logger.error('Error fetching profiles:', profileError);
      throw new BadRequestError('Failed to fetch candidates');
    }

    const skillsArray = skills
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    // Enrich each candidate with stats
    const enriched = await Promise.all((profiles || []).map(async (p) => {
      // Avg grade from submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('grade, ai_score')
        .eq('student_id', p.id)
        .not('grade', 'is', null);

      const grades = (subs || []).map(s => s.grade ?? s.ai_score).filter(v => v !== null);
      const avgGrade = grades.length > 0
        ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
        : 0;

      // Work practice submission count
      const { count: wpCount } = await supabase
        .from('work_practice_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', p.id);

      // Certificate count
      const { count: certCount } = await supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', p.id);

      const candidate = {
        ...p,
        avg_grade: avgGrade,
        wp_submission_count: wpCount || 0,
        certificate_count: certCount || 0,
      };

      return {
        ...candidate,
        match_score: computeScore(candidate, { skills: skillsArray }),
      };
    }));

    // Filter by skills if provided
    let results = enriched;
    if (skillsArray.length > 0) {
      results = enriched.filter(c => {
        const cs = (c.skills || '').toLowerCase();
        return skillsArray.some(s => cs.includes(s.toLowerCase()));
      });
    }

    // Filter by min score
    if (minScore) {
      results = results.filter(c => c.avg_grade >= parseInt(minScore));
    }

    // Sort by match score DESC
    results.sort((a, b) => b.match_score - a.match_score);

    return results;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error searching candidates:', err);
    throw new BadRequestError('Failed to search candidates');
  }
};

// ── Candidate Profile ─────────────────────────────────────────────────────────

export const getCandidateProfile = async (userId) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, skills, bio, interests, role')
      .eq('id', userId)
      .eq('role', 'student')
      .single();

    if (error || !profile) throw new NotFoundError('Candidate not found');

    // Enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id, progress, enrolled_at,
        course_offerings (
          id, duration_weeks, hours_per_week, status,
          courses (id, title, description)
        )
      `)
      .eq('student_id', userId)
      .not('offering_id', 'is', null);

    // Certificates
    const { data: certificates } = await supabase
      .from('certificates')
      .select(`
        id, certificate_uuid, issue_date, completion_percentage, average_score, status,
        courses (id, title)
      `)
      .eq('student_id', userId)
      .eq('status', 'valid');

    // Submissions (graded)
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, grade, ai_score, submitted_at, assignments(title)')
      .eq('student_id', userId)
      .not('grade', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(10);

    // Work practice submissions
    const { data: wpSubmissions } = await supabase
      .from('work_practice_submissions')
      .select('id, grade, submitted_at, work_practice_tasks(title, project_type)')
      .eq('student_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    const grades = (submissions || []).map(s => s.grade ?? s.ai_score).filter(v => v !== null);
    const avgGrade = grades.length > 0
      ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
      : 0;

    return {
      ...profile,
      avg_grade: avgGrade,
      enrollments: enrollments || [],
      certificates: certificates || [],
      submissions: submissions || [],
      wp_submissions: wpSubmissions || [],
    };
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching candidate profile:', err);
    throw new BadRequestError('Failed to fetch candidate profile');
  }
};

// ── Bookmarks ─────────────────────────────────────────────────────────────────

export const bookmarkCandidate = async (recruiterId, candidateId) => {
  try {
    const { data: existing } = await supabase
      .from('recruiter_bookmarks')
      .select('id')
      .eq('recruiter_id', recruiterId)
      .eq('candidate_id', candidateId)
      .single();

    if (existing) {
      // Toggle off
      await supabase.from('recruiter_bookmarks').delete().eq('id', existing.id);
      return { bookmarked: false };
    }

    const { error } = await supabase
      .from('recruiter_bookmarks')
      .insert([{ recruiter_id: recruiterId, candidate_id: candidateId, created_at: new Date().toISOString() }]);

    if (error) {
      logger.error('Error bookmarking candidate:', error);
      throw new BadRequestError('Failed to bookmark candidate');
    }

    return { bookmarked: true };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error bookmarking:', err);
    throw new BadRequestError('Failed to bookmark candidate');
  }
};

export const getBookmarks = async (recruiterId) => {
  try {
    const { data, error } = await supabase
      .from('recruiter_bookmarks')
      .select(`
        id, created_at,
        profiles!recruiter_bookmarks_candidate_id_fkey(id, first_name, last_name, email, skills, bio)
      `)
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching bookmarks:', error);
      throw new BadRequestError('Failed to fetch bookmarks');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching bookmarks:', err);
    throw new BadRequestError('Failed to fetch bookmarks');
  }
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const sendMessage = async (senderId, receiverId, message) => {
  try {
    if (!message || !message.trim()) throw new BadRequestError('Message cannot be empty');

    const { data, error } = await supabase
      .from('recruiter_messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim(),
        created_at: new Date().toISOString(),
      }])
      .select(`
        *,
        sender:profiles!recruiter_messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!recruiter_messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .single();

    if (error) {
      logger.error('Error sending recruiter message:', error);
      throw new BadRequestError('Failed to send message');
    }

    return data;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error sending message:', err);
    throw new BadRequestError('Failed to send message');
  }
};

export const getConversation = async (userId, otherUserId) => {
  try {
    const { data, error } = await supabase
      .from('recruiter_messages')
      .select(`
        *,
        sender:profiles!recruiter_messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!recruiter_messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching conversation:', error);
      throw new BadRequestError('Failed to fetch conversation');
    }

    return data || [];
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching conversation:', err);
    throw new BadRequestError('Failed to fetch conversation');
  }
};

export const getInbox = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('recruiter_messages')
      .select(`
        *,
        sender:profiles!recruiter_messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!recruiter_messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching inbox:', error);
      throw new BadRequestError('Failed to fetch inbox');
    }

    // Deduplicate by conversation partner
    const seen = new Set();
    const inbox = [];
    for (const msg of (data || [])) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        inbox.push(msg);
      }
    }

    return inbox;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    logger.error('Unexpected error fetching inbox:', err);
    throw new BadRequestError('Failed to fetch inbox');
  }
};
