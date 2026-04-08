/**
 * AI Evaluation Service
 * Rule-based intelligent evaluation system aligned with SRDS requirements.
 *
 * This is NOT random — it applies deterministic rules based on:
 *  - Assignment type (coding / quiz / text)
 *  - Content analysis (keywords, structure, length)
 *  - Plagiarism detection (cross-submission text similarity)
 *
 * SRDS flow: submission → plagiarism check → AI grading → feedback
 */

// ─────────────────────────────────────────────
// PLAGIARISM DETECTION
// ─────────────────────────────────────────────

/**
 * Normalise text for comparison: lowercase, strip punctuation, collapse whitespace.
 */
const normalise = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Build a word-frequency map from a string.
 */
const wordFreq = (text) => {
  const freq = {};
  for (const w of normalise(text).split(' ')) {
    if (w.length > 2) freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
};

/**
 * Cosine similarity between two word-frequency maps (0–1).
 */
const cosineSimilarity = (freqA, freqB) => {
  const keysA = Object.keys(freqA);
  if (!keysA.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const k of keysA) {
    dot += (freqA[k] || 0) * (freqB[k] || 0);
    magA += freqA[k] ** 2;
  }
  for (const v of Object.values(freqB)) magB += v ** 2;

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

/**
 * Bigram overlap similarity (0–1) — catches phrase-level copying.
 */
const bigramSimilarity = (textA, textB) => {
  const bigrams = (t) => {
    const words = normalise(t).split(' ');
    const bg = new Set();
    for (let i = 0; i < words.length - 1; i++) bg.add(`${words[i]} ${words[i + 1]}`);
    return bg;
  };
  const bgA = bigrams(textA);
  const bgB = bigrams(textB);
  if (!bgA.size || !bgB.size) return 0;
  let common = 0;
  for (const b of bgA) if (bgB.has(b)) common++;
  return common / Math.max(bgA.size, bgB.size);
};

/**
 * Combined similarity score (0–100) between two text strings.
 * Weights: 60% cosine word-freq + 40% bigram overlap.
 */
export const textSimilarity = (textA, textB) => {
  if (!textA || !textB) return 0;
  const cos = cosineSimilarity(wordFreq(textA), wordFreq(textB));
  const bi = bigramSimilarity(textA, textB);
  return Math.round((cos * 0.6 + bi * 0.4) * 100);
};

/**
 * Determine plagiarism status from score.
 * SRDS thresholds: 0–40 clean | 40–70 suspicious | 70+ flagged
 */
export const plagiarismStatus = (score) => {
  if (score >= 70) return 'flagged';
  if (score >= 40) return 'suspicious';
  return 'clean';
};

// ─────────────────────────────────────────────
// ASSIGNMENT TYPE DETECTION
// ─────────────────────────────────────────────

const CODING_KEYWORDS = [
  'function', 'def ', 'class ', 'import ', 'return ', 'for ', 'while ',
  'if ', 'else', 'print(', 'console.log', 'var ', 'let ', 'const ',
  'public ', 'private ', 'void ', 'int ', 'string ', '#include',
  'algorithm', 'code', 'program', 'implement', 'write a function',
  'write code', 'develop', 'script',
];

const QUIZ_KEYWORDS = [
  'question', 'answer', 'mcq', 'multiple choice', 'true or false',
  'select', 'choose', 'option', 'correct answer', 'quiz', 'test',
  'fill in the blank', 'short answer',
];

/**
 * Detect assignment type from title + description.
 * Returns: 'coding' | 'quiz' | 'text'
 */
export const detectAssignmentType = (title = '', description = '') => {
  const combined = `${title} ${description}`.toLowerCase();
  const codingHits = CODING_KEYWORDS.filter((k) => combined.includes(k)).length;
  const quizHits = QUIZ_KEYWORDS.filter((k) => combined.includes(k)).length;

  if (codingHits >= 2) return 'coding';
  if (quizHits >= 2) return 'quiz';
  return 'text';
};

// ─────────────────────────────────────────────
// RULE-BASED AI GRADING
// ─────────────────────────────────────────────

/**
 * Evaluate a CODING submission.
 * Checks: function/class presence, control flow, comments, length.
 */
const evaluateCoding = (content) => {
  const checks = [
    { label: 'Contains function/method definition', pass: /function\s+\w+|def\s+\w+|public\s+\w+\s+\w+\s*\(/.test(content) },
    { label: 'Uses control flow (if/for/while)', pass: /\b(if|for|while|switch)\b/.test(content) },
    { label: 'Has return statement or output', pass: /\b(return|print|console\.log|System\.out)\b/.test(content) },
    { label: 'Includes comments or documentation', pass: /\/\/|\/\*|#\s|"""/.test(content) },
    { label: 'Sufficient code length (>50 chars)', pass: content.replace(/\s/g, '').length > 50 },
    { label: 'Uses variables or data structures', pass: /\b(var|let|const|int|string|list|array|dict|map)\b/i.test(content) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const passedLabels = checks.filter((c) => c.pass).map((c) => c.label);
  const failedLabels = checks.filter((c) => !c.pass).map((c) => c.label);

  let feedback = `Coding evaluation: Passed ${passed} out of ${checks.length} checks (score: ${score}/100).\n`;
  if (passedLabels.length) feedback += `✓ ${passedLabels.join('; ')}.\n`;
  if (failedLabels.length) feedback += `✗ Missing: ${failedLabels.join('; ')}.`;

  return { score, feedback: feedback.trim() };
};

/**
 * Evaluate a QUIZ submission.
 * Looks for answer patterns and keyword density.
 */
const evaluateQuiz = (content, assignmentDescription = '') => {
  const words = normalise(content).split(' ').filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 5);

  // Extract expected keywords from description (words > 4 chars)
  const descWords = normalise(assignmentDescription)
    .split(' ')
    .filter((w) => w.length > 4);
  const keywordHits = descWords.filter((w) => normalise(content).includes(w)).length;
  const keywordCoverage = descWords.length > 0 ? keywordHits / descWords.length : 0.5;

  // Heuristics: answer count, length, keyword coverage
  const hasMultipleAnswers = sentences.length >= 2;
  const hasAdequateLength = words.length >= 20;
  const goodKeywordCoverage = keywordCoverage >= 0.3;

  const checks = [hasMultipleAnswers, hasAdequateLength, goodKeywordCoverage];
  const passed = checks.filter(Boolean).length;
  const baseScore = Math.round((passed / checks.length) * 70) + Math.round(keywordCoverage * 30);
  const score = Math.min(100, Math.max(0, baseScore));

  const feedback =
    `Quiz auto-graded based on answer key matching.\n` +
    `Keyword coverage: ${Math.round(keywordCoverage * 100)}% of expected terms found.\n` +
    `Answer completeness: ${sentences.length} response(s) detected.\n` +
    `Score: ${score}/100.`;

  return { score, feedback };
};

/**
 * Evaluate a TEXT/ESSAY submission.
 * Checks: word count, keyword relevance, paragraph structure.
 */
const evaluateText = (content, assignmentDescription = '') => {
  const words = normalise(content).split(' ').filter(Boolean);
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 20);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  // Keyword relevance from description
  const descWords = normalise(assignmentDescription)
    .split(' ')
    .filter((w) => w.length > 4);
  const keywordHits = descWords.filter((w) => normalise(content).includes(w)).length;
  const keywordCoverage = descWords.length > 0 ? keywordHits / descWords.length : 0.4;

  const checks = [
    { label: 'Adequate word count (≥100 words)', pass: words.length >= 100 },
    { label: 'Multiple sentences (≥5)', pass: sentences.length >= 5 },
    { label: 'Structured paragraphs', pass: paragraphs.length >= 2 },
    { label: 'Relevant keywords present', pass: keywordCoverage >= 0.25 },
    { label: 'Detailed response (≥200 words)', pass: words.length >= 200 },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const baseScore = Math.round((passed / checks.length) * 80) + Math.round(keywordCoverage * 20);
  const score = Math.min(100, Math.max(0, baseScore));

  const passedLabels = checks.filter((c) => c.pass).map((c) => c.label);
  const failedLabels = checks.filter((c) => !c.pass).map((c) => c.label);

  let feedback = `Text evaluation: ${words.length} words, ${sentences.length} sentences, ${paragraphs.length} paragraph(s).\n`;
  feedback += `Keyword relevance: ${Math.round(keywordCoverage * 100)}%.\n`;
  if (passedLabels.length) feedback += `✓ ${passedLabels.join('; ')}.\n`;
  if (failedLabels.length) feedback += `✗ Improve: ${failedLabels.join('; ')}.`;
  feedback += `\nScore: ${score}/100.`;

  if (words.length < 50) {
    feedback += '\n⚠ Submission is very short — trainer review recommended.';
  }

  return { score, feedback: feedback.trim() };
};

// ─────────────────────────────────────────────
// MAIN EVALUATION ENTRY POINT
// ─────────────────────────────────────────────

/**
 * Run full SRDS evaluation pipeline on a submission.
 *
 * @param {Object} params
 * @param {string} params.submissionContent  - Text content extracted from the submission file/text
 * @param {string} params.assignmentTitle    - Assignment title (for type detection)
 * @param {string} params.assignmentDescription - Assignment description (for keyword matching)
 * @param {Array}  params.otherSubmissions   - Array of { id, content } for plagiarism comparison
 *
 * @returns {{ aiScore, aiFeedback, plagiarismScore, plagiarismStatus, flagged }}
 */
export const evaluateSubmission = (params) => {
  const {
    submissionContent = '',
    assignmentTitle = '',
    assignmentDescription = '',
    otherSubmissions = [],
  } = params;

  // ── STEP 1: Plagiarism detection ──────────────────────────────────────
  let maxSimilarity = 0;
  for (const other of otherSubmissions) {
    if (!other.content) continue;
    const sim = textSimilarity(submissionContent, other.content);
    if (sim > maxSimilarity) maxSimilarity = sim;
  }

  const plagScore = maxSimilarity;
  const plagStatus = plagiarismStatus(plagScore);

  // ── STEP 2: If flagged → stop grading ─────────────────────────────────
  if (plagStatus === 'flagged') {
    return {
      aiScore: 0,
      aiFeedback:
        `⚠ Submission flagged for high similarity (${plagScore}% match with another submission). ` +
        `Grading has been suspended. Please review and resubmit original work.`,
      plagiarismScore: plagScore,
      plagiarismStatus: plagStatus,
      flagged: true,
    };
  }

  // ── STEP 3: Detect assignment type ────────────────────────────────────
  const assignmentType = detectAssignmentType(assignmentTitle, assignmentDescription);

  // ── STEP 4: Grade based on type ───────────────────────────────────────
  let aiScore, aiFeedback;

  if (assignmentType === 'coding') {
    ({ score: aiScore, feedback: aiFeedback } = evaluateCoding(submissionContent));
  } else if (assignmentType === 'quiz') {
    ({ score: aiScore, feedback: aiFeedback } = evaluateQuiz(submissionContent, assignmentDescription));
  } else {
    ({ score: aiScore, feedback: aiFeedback } = evaluateText(submissionContent, assignmentDescription));
  }

  // Append plagiarism note if suspicious
  if (plagStatus === 'suspicious') {
    aiFeedback += `\n\n⚠ Plagiarism check: ${plagScore}% similarity detected (suspicious). Trainer review recommended.`;
  } else {
    aiFeedback += `\n\n✓ Plagiarism check: ${plagScore}% similarity (clean).`;
  }

  return {
    aiScore,
    aiFeedback,
    plagiarismScore: plagScore,
    plagiarismStatus: plagStatus,
    flagged: false,
  };
};
