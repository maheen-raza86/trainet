/**
 * AI Evaluation Service — Gemini API + Cosine Similarity
 *
 * Calls Python runner scripts via spawnSync (stdin/stdout JSON).
 * No shell escaping issues on Windows.
 *
 * Runners:
 *   ai_assignment_checking/run_grading.py   — Gemini grading
 *   ai_assignment_checking/run_plagiarism.py — cosine similarity
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Absolute path to the ai_assignment_checking folder
const AI_DIR = path.resolve(__dirname, '../../../ai_assignment_checking');

const GRADING_SCRIPT    = path.join(AI_DIR, 'run_grading.py');
const PLAGIARISM_SCRIPT = path.join(AI_DIR, 'run_plagiarism.py');

console.log('[aiEvaluationService] AI_DIR =', AI_DIR);
console.log('[aiEvaluationService] GRADING_SCRIPT =', GRADING_SCRIPT);
console.log('[aiEvaluationService] GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);

// ─────────────────────────────────────────────
// PYTHON EXECUTABLE DETECTION
// ─────────────────────────────────────────────

/**
 * Resolve the correct Python executable name for the current platform.
 * Render (Linux) uses 'python3'; Windows local dev uses 'python'.
 * We probe once at startup and cache the result.
 */
const resolvePythonExecutable = () => {
  for (const candidate of ['python3', 'python']) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8', timeout: 5000 });
    if (!probe.error && probe.status === 0) {
      console.log(`[aiEvaluationService] Python executable: "${candidate}" (${(probe.stdout || probe.stderr || '').trim()})`);
      return candidate;
    }
  }
  // Neither found — log clearly so Render logs show the real problem
  console.error('[aiEvaluationService] FATAL: No Python executable found (tried python3, python). Install Python on the server.');
  return 'python3'; // return a default; spawnSync will fail with ENOENT and log it
};

const PYTHON_EXEC = resolvePythonExecutable();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Run a Python script, pass JSON via stdin, return parsed JSON from stdout.
 * Uses spawnSync so no shell quoting issues on Windows.
 */
const runPython = (scriptPath, payload, timeoutMs = 30000) => {
  const input = JSON.stringify(payload);

  console.log(`[aiEvaluationService] Running: ${PYTHON_EXEC} "${scriptPath}"`);
  console.log(`[aiEvaluationService] Input payload keys: ${Object.keys(payload).join(', ')}`);

  const result = spawnSync(PYTHON_EXEC, [scriptPath], {
    input,
    encoding: 'utf8',
    timeout: timeoutMs,
    cwd: AI_DIR,
  });

  console.log(`[aiEvaluationService] spawnSync status: ${result.status}`);

  if (result.error) {
    console.error('[aiEvaluationService] spawnSync error:', result.error.message);
    throw new Error(`Python spawn error: ${result.error.message}`);
  }

  if (result.stderr && result.stderr.trim()) {
    // Log stderr but don't throw — Python warnings go to stderr
    console.warn('[aiEvaluationService] Python stderr:', result.stderr.trim());
  }

  const stdout = (result.stdout || '').trim();
  console.log('[aiEvaluationService] Python stdout:', stdout.slice(0, 300));

  if (!stdout) {
    throw new Error(`Python script produced no output. Exit code: ${result.status}`);
  }

  return JSON.parse(stdout);
};

// ─────────────────────────────────────────────
// GEMINI GRADING
// ─────────────────────────────────────────────

export const gradeWithGroq = (question, answer) => {
  console.log('[aiEvaluationService] gradeWithGroq called');
  console.log('[aiEvaluationService] question (first 100):', String(question).slice(0, 100));
  console.log('[aiEvaluationService] answer (first 100):', String(answer).slice(0, 100));

  try {
    const result = runPython(GRADING_SCRIPT, { question, answer }, 35000);

    if (result.error) {
      logger.error('[aiEvaluationService] Groq returned error:', result.error);
      return { score: null, feedback: result.error, missing_concepts: [] };
    }

    console.log('[aiEvaluationService] Groq result:', JSON.stringify(result));
    return {
      score:            result.score            ?? null,
      feedback:         result.feedback         ?? '',
      missing_concepts: result.missing_concepts ?? [],
    };
  } catch (err) {
    logger.error('[aiEvaluationService] gradeWithGroq failed:', err.message);
    return {
      score:            null,
      feedback:         `AI grading failed: ${err.message}`,
      missing_concepts: [],
    };
  }
};

// ─────────────────────────────────────────────
// PLAGIARISM CHECK
// ─────────────────────────────────────────────

export const checkPlagiarism = (answer1, answer2) => {
  console.log('[aiEvaluationService] checkPlagiarism called');
  try {
    const result = runPython(PLAGIARISM_SCRIPT, { answer1, answer2 }, 15000);
    console.log('[aiEvaluationService] Plagiarism result:', JSON.stringify(result));
    return {
      similarity_percent: result.similarity_percent ?? 0,
      status:             result.status             ?? 'Safe',
    };
  } catch (err) {
    logger.error('[aiEvaluationService] checkPlagiarism failed:', err.message);
    return { similarity_percent: 0, status: 'Safe' };
  }
};

// ─────────────────────────────────────────────
// PLAGIARISM STATUS LABEL
// ─────────────────────────────────────────────

export const plagiarismStatusLabel = (pct) => {
  if (pct > 70)  return 'flagged';    // DB constraint: 'flagged'
  if (pct >= 31) return 'suspicious'; // DB constraint: 'suspicious'
  return 'clean';                     // DB constraint: 'clean'
};

// Human-readable labels for the UI (not stored in DB)
export const plagiarismStatusDisplay = (dbStatus) => {
  if (dbStatus === 'flagged')    return 'High Plagiarism';
  if (dbStatus === 'suspicious') return 'Warning';
  if (dbStatus === 'clean')      return 'Safe';
  return dbStatus || 'pending';
};

// ─────────────────────────────────────────────
// FULL EVALUATION PIPELINE
// ─────────────────────────────────────────────

export const evaluateSubmission = (params) => {
  const {
    submissionContent     = '',
    assignmentTitle       = '',
    assignmentDescription = '',
    otherSubmissions      = [],
  } = params;

  console.log('[aiEvaluationService] evaluateSubmission START');
  console.log('[aiEvaluationService] submissionContent length:', submissionContent.length);
  console.log('[aiEvaluationService] otherSubmissions count:', otherSubmissions.length);

  // ── 1. Plagiarism check ───────────────────────────────────────────────
  let maxSimilarity = 0;
  for (const other of otherSubmissions) {
    if (!other.content || !other.content.trim()) continue;
    const { similarity_percent } = checkPlagiarism(submissionContent, other.content);
    if (similarity_percent > maxSimilarity) maxSimilarity = similarity_percent;
  }

  const plagPct    = Math.round(maxSimilarity * 100) / 100;
  const plagStatus = plagiarismStatusLabel(plagPct);
  const flagged    = plagPct > 70;

  console.log(`[aiEvaluationService] Plagiarism: ${plagPct}% → ${plagStatus}`);

  // ── 2. High plagiarism → skip grading ────────────────────────────────
  if (flagged) {
    console.log('[aiEvaluationService] Flagged for plagiarism — skipping Gemini');
    return {
      aiScore:              0,
      aiFeedback:           `⚠ Submission flagged for high similarity (${plagPct}%). Grading suspended.`,
      missingConcepts:      [],
      plagiarismPercentage: plagPct,
      plagiarismStatus:     plagStatus,
      aiStatus:             'Flagged for Plagiarism',
      flagged:              true,
    };
  }

  // ── 3. Gemini grading ─────────────────────────────────────────────────
  const question = assignmentDescription.trim() || assignmentTitle.trim() || 'Assignment';
  console.log('[aiEvaluationService] Calling Groq with question:', question.slice(0, 80));

  const { score, feedback, missing_concepts } = gradeWithGroq(question, submissionContent);

  console.log(`[aiEvaluationService] Groq score: ${score}`);

  // ── 4. AI status ──────────────────────────────────────────────────────
  let aiStatus = 'AI Checked';
  if (score === null) aiStatus = 'AI Check Failed';
  else if (plagStatus === 'Warning') aiStatus = 'Pending Trainer Review';

  console.log('[aiEvaluationService] evaluateSubmission DONE — aiStatus:', aiStatus);

  return {
    aiScore:              score,
    aiFeedback:           feedback,
    missingConcepts:      missing_concepts,
    plagiarismPercentage: plagPct,
    plagiarismStatus:     plagStatus,
    aiStatus,
    flagged:              false,
  };
};

// ─────────────────────────────────────────────
// BACKWARD-COMPAT EXPORTS
// ─────────────────────────────────────────────

export const plagiarismStatus = plagiarismStatusLabel;
export const textSimilarity   = (a, b) => checkPlagiarism(a, b).similarity_percent;
// backward compat alias
export const gradeWithGemini  = gradeWithGroq;
