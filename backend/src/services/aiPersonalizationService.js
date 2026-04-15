/**
 * AI Personalization Service — FR-AI-1, FR-AI-2
 *
 * Builds skill profiles, detects gaps, and generates dynamic recommendations
 * using ONLY real data from the database. No hardcoded or random logic.
 *
 * Algorithm:
 *  1. Fetch student enrollments + grades + completion
 *  2. Map course titles → skill tokens (NLP-lite: title words as skills)
 *  3. Score each skill 0–100 based on grade + completion
 *  4. Identify weak skills (score < 60)
 *  5. Match weak skills against unenrolled courses
 *  6. Rank recommendations by relevance score
 *  7. Build ordered learning path (by skill level ascending)
 */

import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a','an','the','and','or','of','in','to','for','with','on','at','by','from',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need',
  'introduction','advanced','intermediate','beginner','course','module',
  'fundamentals','basics','overview','part','level','using','how','what',
]);

/**
 * Extract meaningful skill tokens from a course title.
 * e.g. "Introduction to Python Programming" → ["python", "programming"]
 */
const extractSkills = (title = '') =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

/**
 * Compute skill score for a single enrollment.
 * Formula: (grade_component * 0.7) + (completion_component * 0.3)
 */
const computeSkillScore = (avgGrade, progress) => {
  const gradeScore = avgGrade !== null ? (avgGrade / 100) * 70 : 35; // default 50% if no grade
  const completionScore = (Math.min(progress, 100) / 100) * 30;
  return Math.round(gradeScore + completionScore);
};

// ─────────────────────────────────────────────
// CORE: BUILD SKILL PROFILE
// ─────────────────────────────────────────────

/**
 * Build a skill profile for a student.
 * Returns: Map<skill, { score, sources }>
 */
const buildSkillProfile = async (studentId) => {
  // 1. Fetch enrollments with course info
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select(`
      id, offering_id, progress,
      course_offerings(
        id,
        courses(id, title, description)
      )
    `)
    .eq('student_id', studentId)
    .not('offering_id', 'is', null);

  if (enrollErr) {
    logger.error('AI: Error fetching enrollments:', enrollErr);
    return new Map();
  }

  // 2. Fetch all graded submissions for this student
  const { data: submissions } = await supabase
    .from('submissions')
    .select('assignment_id, grade, ai_score')
    .eq('student_id', studentId)
    .not('grade', 'is', null);

  // 3. Fetch assignments to map offering → grades
  const offeringIds = (enrollments || []).map(e => e.offering_id).filter(Boolean);
  let assignmentMap = {}; // offeringId → [grades]

  if (offeringIds.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, course_offering_id')
      .in('course_offering_id', offeringIds);

    const submissionMap = {};
    for (const s of (submissions || [])) {
      submissionMap[s.assignment_id] = s.grade ?? s.ai_score;
    }

    for (const a of (assignments || [])) {
      if (!assignmentMap[a.course_offering_id]) assignmentMap[a.course_offering_id] = [];
      if (submissionMap[a.id] !== undefined) {
        assignmentMap[a.course_offering_id].push(submissionMap[a.id]);
      }
    }
  }

  // 4. Build skill map
  const skillMap = new Map(); // skill → { totalScore, count, sources }

  for (const enrollment of (enrollments || [])) {
    const course = enrollment.course_offerings?.courses;
    if (!course) continue;

    const grades = assignmentMap[enrollment.offering_id] || [];
    const avgGrade = grades.length > 0
      ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
      : null;

    const score = computeSkillScore(avgGrade, enrollment.progress || 0);
    const skills = extractSkills(course.title);

    for (const skill of skills) {
      if (!skillMap.has(skill)) {
        skillMap.set(skill, { totalScore: 0, count: 0, sources: [] });
      }
      const entry = skillMap.get(skill);
      entry.totalScore += score;
      entry.count += 1;
      entry.sources.push({ courseTitle: course.title, score, avgGrade, progress: enrollment.progress || 0 });
    }
  }

  // 5. Average scores per skill
  const profile = new Map();
  for (const [skill, data] of skillMap) {
    profile.set(skill, {
      score: Math.round(data.totalScore / data.count),
      sources: data.sources,
    });
  }

  // 6. Merge with profile skills (if student has skills in their profile)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('skills')
    .eq('id', studentId)
    .single();

  if (profileData?.skills) {
    const profileSkills = profileData.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    for (const skill of profileSkills) {
      if (!profile.has(skill)) {
        // Profile skill with no course data → neutral score 50
        profile.set(skill, { score: 50, sources: [{ courseTitle: 'Profile skill', score: 50, avgGrade: null, progress: 0 }] });
      }
    }
  }

  return profile;
};

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * GET /api/ai/profile
 * Returns the student's skill profile with scores.
 */
export const getSkillProfile = async (studentId) => {
  const profile = await buildSkillProfile(studentId);

  const skills = Array.from(profile.entries())
    .map(([skill, data]) => ({
      skill,
      score: data.score,
      level: data.score >= 80 ? 'strong' : data.score >= 60 ? 'moderate' : 'weak',
      sources: data.sources,
    }))
    .sort((a, b) => b.score - a.score);

  const weakSkills = skills.filter(s => s.score < 60).map(s => s.skill);
  const strongSkills = skills.filter(s => s.score >= 80).map(s => s.skill);

  return {
    skills,
    weakSkills,
    strongSkills,
    totalSkills: skills.length,
    averageScore: skills.length > 0
      ? Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length)
      : 0,
  };
};

/**
 * GET /api/ai/recommendations
 * Returns ranked course recommendations based on skill gaps.
 */
export const getRecommendations = async (studentId) => {
  const profile = await buildSkillProfile(studentId);

  // Fetch all open offerings not yet enrolled
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('offering_id')
    .eq('student_id', studentId)
    .not('offering_id', 'is', null);

  const enrolledOfferingIds = new Set((enrollments || []).map(e => e.offering_id));

  const { data: offerings } = await supabase
    .from('course_offerings')
    .select(`id, courses(id, title, description)`)
    .eq('status', 'open');

  const unenrolled = (offerings || []).filter(o => !enrolledOfferingIds.has(o.id));

  // Score each unenrolled course by skill gap relevance
  const recommendations = [];

  for (const offering of unenrolled) {
    const course = offering.courses;
    if (!course) continue;

    const courseSkills = extractSkills(course.title);
    if (courseSkills.length === 0) continue;

    let relevanceScore = 0;
    const reasons = [];

    for (const skill of courseSkills) {
      const profileEntry = profile.get(skill);
      if (profileEntry) {
        // Student has this skill but it's weak → high relevance
        const gap = 100 - profileEntry.score;
        relevanceScore += gap;
        if (profileEntry.score < 60) {
          reasons.push(`Your ${skill} skill is at ${profileEntry.score}% — this course will strengthen it`);
        }
      } else {
        // Student has no exposure to this skill → medium relevance
        relevanceScore += 50;
        reasons.push(`You have no prior exposure to ${skill}`);
      }
    }

    relevanceScore = Math.round(relevanceScore / courseSkills.length);

    if (relevanceScore > 20) {
      recommendations.push({
        offeringId: offering.id,
        courseId: course.id,
        title: course.title,
        description: course.description,
        relevanceScore,
        reasons: reasons.slice(0, 2), // top 2 reasons
        skills: courseSkills,
      });
    }
  }

  // Sort by relevance descending
  recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Smart suggestions based on weak skills
  const weakSkills = Array.from(profile.entries())
    .filter(([, d]) => d.score < 60)
    .map(([skill, d]) => ({ skill, score: d.score }))
    .sort((a, b) => a.score - b.score);

  const suggestions = weakSkills.slice(0, 3).map(({ skill, score }) => ({
    type: 'skill_gap',
    message: `Your ${skill} skill is at ${score}% — focus on improving it to unlock advanced courses`,
    priority: score < 40 ? 'high' : 'medium',
  }));

  if (recommendations.length === 0 && profile.size === 0) {
    suggestions.push({
      type: 'onboarding',
      message: 'Enroll in your first course to start building your skill profile',
      priority: 'high',
    });
  }

  return {
    recommendations: recommendations.slice(0, 6),
    suggestions,
    totalRecommendations: recommendations.length,
  };
};

/**
 * GET /api/ai/learning-path
 * Returns an ordered learning path from beginner to advanced.
 */
export const getLearningPath = async (studentId) => {
  const profile = await buildSkillProfile(studentId);

  // Fetch all open offerings
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('offering_id')
    .eq('student_id', studentId)
    .not('offering_id', 'is', null);

  const enrolledIds = new Set((enrollments || []).map(e => e.offering_id));

  const { data: offerings } = await supabase
    .from('course_offerings')
    .select(`id, duration_weeks, courses(id, title, description)`)
    .eq('status', 'open');

  // Classify each course as beginner/intermediate/advanced based on skill overlap
  const classify = (courseTitle) => {
    const lower = courseTitle.toLowerCase();
    if (/beginner|introduction|intro|basic|fundamental|101|getting started/.test(lower)) return 'beginner';
    if (/advanced|expert|mastery|professional|senior/.test(lower)) return 'advanced';
    return 'intermediate';
  };

  const pathCourses = [];

  for (const offering of (offerings || [])) {
    const course = offering.courses;
    if (!course) continue;

    const courseSkills = extractSkills(course.title);
    const level = classify(course.title);
    const isEnrolled = enrolledIds.has(offering.id);

    // Compute skill gap for this course
    let avgGap = 0;
    let gapCount = 0;
    for (const skill of courseSkills) {
      const entry = profile.get(skill);
      avgGap += entry ? (100 - entry.score) : 60;
      gapCount++;
    }
    const gap = gapCount > 0 ? Math.round(avgGap / gapCount) : 60;

    pathCourses.push({
      offeringId: offering.id,
      courseId: course.id,
      title: course.title,
      description: course.description,
      level,
      gap,
      isEnrolled,
      skills: courseSkills,
    });
  }

  // Sort: enrolled first, then by level order, then by gap descending
  const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
  pathCourses.sort((a, b) => {
    if (a.isEnrolled !== b.isEnrolled) return a.isEnrolled ? -1 : 1;
    if (levelOrder[a.level] !== levelOrder[b.level]) return levelOrder[a.level] - levelOrder[b.level];
    return b.gap - a.gap;
  });

  // Group into steps
  const enrolled = pathCourses.filter(c => c.isEnrolled);
  const beginner = pathCourses.filter(c => !c.isEnrolled && c.level === 'beginner').slice(0, 2);
  const intermediate = pathCourses.filter(c => !c.isEnrolled && c.level === 'intermediate').slice(0, 2);
  const advanced = pathCourses.filter(c => !c.isEnrolled && c.level === 'advanced').slice(0, 2);

  const steps = [
    ...(enrolled.length > 0 ? [{ step: 1, label: 'Currently Enrolled', status: 'active', courses: enrolled.slice(0, 3) }] : []),
    ...(beginner.length > 0 ? [{ step: enrolled.length > 0 ? 2 : 1, label: 'Foundation', status: 'next', courses: beginner }] : []),
    ...(intermediate.length > 0 ? [{ step: (enrolled.length > 0 ? 2 : 1) + (beginner.length > 0 ? 1 : 0), label: 'Intermediate', status: 'upcoming', courses: intermediate }] : []),
    ...(advanced.length > 0 ? [{ step: (enrolled.length > 0 ? 2 : 1) + (beginner.length > 0 ? 1 : 0) + (intermediate.length > 0 ? 1 : 0), label: 'Advanced', status: 'future', courses: advanced }] : []),
  ];

  return {
    steps,
    totalCourses: pathCourses.length,
    enrolledCount: enrolled.length,
  };
};
