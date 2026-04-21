/**
 * Certificate Service
 * SRDS FR-CV-1 through FR-CV-5
 *
 * Implements:
 *  - Certificate generation after course completion
 *  - Unique QR code per certificate (encodes verification URL)
 *  - Public verification endpoint logic
 *  - Event logging (generated / verified / revoked)
 */

import QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import supabase from '../config/supabaseClient.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { createNotification } from './notificationService.js';

// Completion threshold: 100% of required assignments submitted
const COMPLETION_THRESHOLD = 100;
// Attendance threshold: 85%
const ATTENDANCE_THRESHOLD = 85;

// Frontend base URL for verification links
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Log a certificate event (FR-CV-5).
 */
const logEvent = async (certificateId, eventType, metadata = {}) => {
  const { error } = await supabase.from('certificate_logs').insert([{
    certificate_id: certificateId,
    event_type: eventType,
    metadata,
  }]);
  if (error) logger.error(`Failed to log certificate event (${eventType}):`, error);
};

/**
 * Generate a QR code data URL encoding the public verification URL.
 * The URL is: {FRONTEND_URL}/verify-certificate/{certificate_uuid}
 */
const generateQRCode = async (certificateUuid) => {
  const verificationUrl = `${FRONTEND_URL}/verify-certificate/${certificateUuid}`;
  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    });
    return dataUrl;
  } catch (err) {
    logger.error('QR code generation failed:', err);
    return null;
  }
};

// ─────────────────────────────────────────────
// ELIGIBILITY CHECK
// ─────────────────────────────────────────────

/**
 * Check whether a student is eligible for a certificate in a given offering.
 * Eligibility: enrolled + submitted ≥ COMPLETION_THRESHOLD% of assignments.
 *
 * @returns {{ eligible, completionPct, averageScore }}
 */
export const checkEligibility = async (studentId, offeringId) => {
  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('offering_id', offeringId)
    .single();

  if (!enrollment) return { eligible: false, completionPct: 0, attendancePct: 0, averageScore: null };

  // ── Required assignments: hours_per_week × duration_weeks ──────────────
  const { data: offering } = await supabase
    .from('course_offerings')
    .select('hours_per_week, duration_weeks')
    .eq('id', offeringId)
    .single();

  const required = (offering?.hours_per_week ?? 0) * (offering?.duration_weeks ?? 0);

  console.log(`[CertEligibility] studentId=${studentId} offeringId=${offeringId}`);
  console.log(`[CertEligibility] required=${required}`);

  if (required === 0) {
    return { eligible: true, completionPct: 100, attendancePct: 100, averageScore: null };
  }

  // ── Fetch assignment IDs ───────────────────────────────────────────────
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('course_offering_id', offeringId);

  const assignmentIds = (assignments || []).map(a => a.id);

  // ── Fetch submissions ─────────────────────────────────────────────────
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, final_score, ai_score')
    .eq('student_id', studentId)
    .in('assignment_id', assignmentIds.length > 0 ? assignmentIds : ['00000000-0000-0000-0000-000000000000']);

  const submitted = (submissions || []).length;
  const completionPct = Math.min(100, Math.round((submitted / required) * 100));

  // ── Attendance ────────────────────────────────────────────────────────
  const { data: attRecords } = await supabase
    .from('attendance_records')
    .select('status')
    .eq('student_id', studentId)
    .eq('offering_id', offeringId);

  const totalSessions  = (attRecords || []).length;
  const presentCount   = (attRecords || []).filter(r => r.status === 'present').length;
  const attendancePct  = totalSessions > 0
    ? Math.round((presentCount / totalSessions) * 100)
    : 100; // no sessions recorded → treat as 100%

  // ── Average score ─────────────────────────────────────────────────────
  const scores = (submissions || [])
    .map(s => s.final_score ?? s.ai_score)
    .filter(v => v !== null && v !== undefined);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const eligible = completionPct >= COMPLETION_THRESHOLD && attendancePct >= ATTENDANCE_THRESHOLD;

  console.log(`[CertEligibility] submitted=${submitted} completionPct=${completionPct}% attendancePct=${attendancePct}% eligible=${eligible}`);

  return { eligible, completionPct, attendancePct, averageScore };
};

// ─────────────────────────────────────────────
// CERTIFICATE GENERATION (FR-CV-1, FR-CV-2)
// ─────────────────────────────────────────────

/**
 * Issue a certificate for a student in a course offering.
 * Idempotent: returns existing certificate if already issued.
 *
 * @param {string} studentId
 * @param {string} offeringId
 * @param {boolean} force - skip eligibility check (admin use)
 */
export const issueCertificate = async (studentId, offeringId, force = false) => {
  // Check if certificate generation is enabled
  try {
    const { data: certSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'certificates_enabled')
      .single();
    if (certSetting && certSetting.value === 'false') {
      throw new ForbiddenError('Certificate generation is currently disabled by the administrator.');
    }
  } catch (settingErr) {
    if (settingErr instanceof ForbiddenError) throw settingErr;
    // Settings not available — allow certificate issuance
  }

  // Check for existing certificate (prevent duplicates)
  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', studentId)
    .eq('offering_id', offeringId)
    .single();

  if (existing) return existing; // idempotent

  // Fetch offering + course info
  const { data: offering, error: offeringError } = await supabase
    .from('course_offerings')
    .select('id, course_id, courses(id, title)')
    .eq('id', offeringId)
    .single();

  if (offeringError || !offering) throw new NotFoundError('Course offering not found');

  // Eligibility check
  if (!force) {
    const { eligible, completionPct } = await checkEligibility(studentId, offeringId);
    if (!eligible) {
      throw new ForbiddenError(
        `Not eligible for certificate. Completion: ${completionPct}% (minimum ${COMPLETION_THRESHOLD}% required) and attendance ≥ ${ATTENDANCE_THRESHOLD}% required.`
      );
    }
  }

  const { completionPct, averageScore } = await checkEligibility(studentId, offeringId);

  // Generate unique certificate UUID
  const certificateUuid = randomUUID();

  // Generate QR code
  const qrCodeData = await generateQRCode(certificateUuid);

  // Insert certificate
  const { data: cert, error: insertError } = await supabase
    .from('certificates')
    .insert([{
      student_id: studentId,
      offering_id: offeringId,
      course_id: offering.course_id,
      certificate_uuid: certificateUuid,
      status: 'valid',
      completion_percentage: completionPct,
      average_score: averageScore,
      qr_code_data: qrCodeData,
    }])
    .select()
    .single();

  if (insertError) {
    logger.error('Error inserting certificate:', insertError);
    throw new BadRequestError('Failed to issue certificate');
  }

  // Log generation event (FR-CV-5)
  await logEvent(cert.id, 'generated', {
    studentId,
    offeringId,
    courseTitle: offering.courses?.title,
    completionPct,
    averageScore,
  });

  logger.info(`Certificate issued: ${certificateUuid} for student ${studentId}`);

  // Notify student (non-blocking)
  try {
    createNotification(studentId, {
      title: 'Certificate Issued!',
      message: `Congratulations! Your certificate for "${offering.courses?.title}" has been issued.`,
      type: 'certificate',
    });
  } catch { /* non-blocking */ }

  return cert;
};

// ─────────────────────────────────────────────
// GET STUDENT CERTIFICATES
// ─────────────────────────────────────────────

/**
 * Get all certificates for a student with full details.
 */
export const getStudentCertificates = async (studentId) => {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      courses (id, title, description),
      course_offerings (
        id, duration_weeks, hours_per_week,
        profiles!course_offerings_trainer_id_fkey (first_name, last_name)
      )
    `)
    .eq('student_id', studentId)
    .order('issue_date', { ascending: false });

  if (error) {
    logger.error('Error fetching student certificates:', error);
    throw new BadRequestError('Failed to fetch certificates');
  }

  return data || [];
};

// ─────────────────────────────────────────────
// PUBLIC VERIFICATION (FR-CV-3, FR-CV-4)
// ─────────────────────────────────────────────

/**
 * Verify a certificate by its public UUID.
 * SRDS algorithm:
 *   1. Decode certificate_uuid
 *   2. Fetch from DB
 *   3. NOT FOUND → INVALID
 *   4. status == revoked → REVOKED
 *   5. ELSE → VALID with details
 *
 * Logs a "verified" event on every successful lookup.
 */
export const verifyCertificate = async (certificateUuid) => {
  // Step 1 & 2: Fetch certificate
  const { data: cert, error } = await supabase
    .from('certificates')
    .select(`
      *,
      courses (id, title, description),
      course_offerings (
        id, duration_weeks,
        profiles!course_offerings_trainer_id_fkey (first_name, last_name)
      ),
      profiles!certificates_student_id_fkey (first_name, last_name, email)
    `)
    .eq('certificate_uuid', certificateUuid)
    .single();

  // Step 3: NOT FOUND
  if (error || !cert) {
    return {
      status: 'INVALID',
      message: 'Certificate not found. This certificate may be fake or the ID is incorrect.',
    };
  }

  // Step 4: REVOKED
  if (cert.status === 'revoked') {
    return {
      status: 'REVOKED',
      message: 'This certificate has been revoked and is no longer valid.',
      revokedAt: cert.revoked_at || cert.updated_at || null,
      revokeReason: cert.revoke_reason || null,
    };
  }

  // Step 5: VALID — log verification event
  await logEvent(cert.id, 'verified', { certificateUuid, ip: 'api' });

  return {
    status: 'VALID',
    message: 'Certificate verified successfully.',
    details: {
      certificateUuid: cert.certificate_uuid,
      studentName: `${cert.profiles.first_name} ${cert.profiles.last_name}`,
      courseName: cert.courses.title,
      courseDescription: cert.courses.description,
      trainerName: cert.course_offerings?.profiles
        ? `${cert.course_offerings.profiles.first_name} ${cert.course_offerings.profiles.last_name}`
        : null,
      issueDate: cert.issue_date,
      completionPercentage: cert.completion_percentage,
      averageScore: cert.average_score,
    },
  };
};

// ─────────────────────────────────────────────
// AUTO-ISSUE ON COMPLETION
// ─────────────────────────────────────────────

/**
 * Called after a submission is graded or progress is updated.
 * Silently issues a certificate if the student just became eligible.
 * Non-blocking — errors are logged but not thrown.
 */
export const autoIssueCertificateIfEligible = async (studentId, offeringId) => {
  try {
    // Skip if already has a certificate
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', studentId)
      .eq('offering_id', offeringId)
      .single();

    if (existing) return;

    const { eligible } = await checkEligibility(studentId, offeringId);
    if (eligible) {
      await issueCertificate(studentId, offeringId);
      logger.info(`Auto-issued certificate for student ${studentId} in offering ${offeringId}`);
    }
  } catch (err) {
    logger.error('Auto-issue certificate failed (non-blocking):', err.message);
  }
};
