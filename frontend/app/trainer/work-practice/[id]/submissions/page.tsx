'use client';

/**
 * Trainer: Work & Practice Submissions
 * Mirrors the assignment SubmissionCard pattern exactly.
 * Uses the same AI status flow: Pending AI Check → AI Checked → Finalized
 */

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WPSubmission {
  id: string;
  student_id: string;
  task_id: string;
  submission_content: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  final_score: number | null;
  trainer_feedback: string | null;
  missing_concepts: string | null;
  plagiarism_percentage: number | null;
  plagiarism_status: string | null;
  ai_status: string | null;
  trainer_override: boolean;
  reviewed_by_trainer: boolean;
  reviewed_at: string | null;
  submitted_at: string;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

// ─── SubmissionCard — identical pattern to assignment SubmissionCard ──────────

function WPSubmissionCard({
  sub: initialSub,
  taskTitle,
  onRefresh,
}: {
  sub: WPSubmission;
  taskTitle: string;
  onRefresh: () => void;
}) {
  const [localSub, setLocalSub] = useState<WPSubmission>(initialSub);
  const [overrideScore, setOverrideScore] = useState<string>(
    String(initialSub.final_score ?? initialSub.ai_score ?? '')
  );
  const [trainerFeedback, setTrainerFeedback] = useState<string>(
    initialSub.trainer_feedback || initialSub.feedback || ''
  );
  const [saving, setSaving] = useState(false);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync when parent refreshes
  useEffect(() => {
    setLocalSub(initialSub);
    setOverrideScore(String(initialSub.final_score ?? initialSub.ai_score ?? ''));
    setTrainerFeedback(initialSub.trainer_feedback || initialSub.feedback || '');
  }, [initialSub.id, initialSub.ai_status, initialSub.final_score]);

  const sub = localSub;

  const missingConcepts: string[] = (() => {
    try { return JSON.parse(sub.missing_concepts || '[]'); } catch { return []; }
  })();

  const plagPct    = sub.plagiarism_percentage ?? null;
  const plagStatus = sub.plagiarism_status || 'pending';
  const aiStatus   = sub.ai_status || 'Pending AI Check';
  const finalScore = sub.final_score ?? null;
  const aiScore    = sub.ai_score ?? null;

  const plagBadgeColor = plagStatus === 'flagged' || plagStatus === 'High Plagiarism'
    ? 'bg-red-100 text-red-700 border-red-200'
    : plagStatus === 'suspicious' || plagStatus === 'Warning'
    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
    : 'bg-green-100 text-green-700 border-green-200';

  const aiStatusColor = aiStatus === 'Finalized'
    ? 'bg-green-100 text-green-700'
    : aiStatus === 'Flagged for Plagiarism'
    ? 'bg-red-100 text-red-700'
    : aiStatus === 'AI Checked'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-yellow-100 text-yellow-700';

  const scoreBadgeColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-500';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const handleFinalize = async () => {
    setSaving(true); setMsg(null);
    try {
      const res: any = await apiClient.put(`/tasks/submissions/${sub.id}/finalize`, {
        finalScore:      overrideScore !== '' ? Number(overrideScore) : undefined,
        trainerFeedback: trainerFeedback || undefined,
      });
      if (res?.data) {
        setLocalSub(res.data);
        setOverrideScore(String(res.data.final_score ?? res.data.ai_score ?? ''));
        setTrainerFeedback(res.data.trainer_feedback || '');
      }
      setMsg({ type: 'success', text: 'Final evaluation saved successfully!' });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleRecheck = async () => {
    setRecheckLoading(true); setMsg(null);
    try {
      const res: any = await apiClient.post(`/tasks/submissions/${sub.id}/evaluate`, {});
      if (res?.data) setLocalSub(res.data);
      setMsg({ type: 'success', text: 'AI re-check complete!' });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Re-check failed' });
    } finally {
      setRecheckLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top section */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900">{sub.profiles?.first_name} {sub.profiles?.last_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub.profiles?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted: {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${aiStatusColor}`}>{aiStatus}</span>
            {aiScore !== null && (
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium border ${scoreBadgeColor(aiScore)}`}>
                AI: {aiScore}/100
              </span>
            )}
            {finalScore !== null && (
              <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${scoreBadgeColor(finalScore)}`}>
                Final: {finalScore}/100
              </span>
            )}
            {plagPct !== null && (
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium border ${plagBadgeColor}`}>
                Plagiarism: {plagPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle — two columns */}
      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Left: submission content */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submission</p>

          {sub.submission_content && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
              {sub.submission_content}
            </div>
          )}

          {sub.file_url && (
            <div className="flex items-center gap-2">
              <a
                href={sub.file_url.startsWith('/') ? `http://localhost:5000${sub.file_url}` : sub.file_url}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition"
              >
                {sub.file_name?.toLowerCase().endsWith('.zip') ? '📦' : '📎'}
                {sub.file_name?.toLowerCase().endsWith('.zip')
                  ? `View Submitted ZIP — ${sub.file_name}`
                  : sub.file_name || 'View Submitted File'}
              </a>
            </div>
          )}

          {!sub.submission_content && !sub.file_url && (
            <p className="text-sm text-gray-400 italic">No content submitted</p>
          )}

          {/* Plagiarism */}
          {plagPct !== null && (
            <div className={`rounded-xl p-3 border text-sm ${plagBadgeColor}`}>
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldExclamationIcon className="w-4 h-4" />
                Plagiarism: {plagPct}% — {plagStatus}
              </p>
              {plagPct > 70 && (
                <p className="text-xs mt-1 opacity-80">⚠ This submission may contain copied content.</p>
              )}
            </div>
          )}
        </div>

        {/* Right: AI evaluation */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5" />AI Evaluation
          </p>

          {sub.ai_feedback ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">AI Feedback</p>
              <p className="text-sm text-gray-700 leading-relaxed">{sub.ai_feedback}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">AI feedback not yet available.</p>
          )}

          {missingConcepts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Missing Concepts</p>
              <div className="flex flex-wrap gap-1.5">
                {missingConcepts.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200">{c}</span>
                ))}
              </div>
            </div>
          )}

          {aiScore !== null && finalScore !== null && aiScore !== finalScore && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs text-gray-600 space-y-0.5">
              <p>AI Suggested Score: <strong>{aiScore}</strong></p>
              <p>Trainer Final Score: <strong className="text-purple-700">{finalScore}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom — trainer override */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trainer Evaluation</p>

        {msg && (
          <div className={`px-3 py-2 rounded-lg text-xs font-medium ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Override Score (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={overrideScore}
              onChange={e => setOverrideScore(e.target.value)}
              placeholder={aiScore !== null ? `AI suggested: ${aiScore}` : 'Enter score'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trainer Feedback</label>
            <textarea
              value={trainerFeedback}
              onChange={e => setTrainerFeedback(e.target.value)}
              rows={2}
              placeholder="Write feedback for the student..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleFinalize}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
          >
            <CheckBadgeIcon className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Final Evaluation'}
          </button>
          <button
            onClick={handleRecheck}
            disabled={recheckLoading}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-50 transition disabled:opacity-50"
          >
            <SparklesIcon className="w-4 h-4" />
            {recheckLoading ? 'Checking...' : 'Re-check with AI'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainerWPSubmissions() {
  const params = useParams();
  const taskId = params.id as string;

  const [submissions, setSubmissions] = useState<WPSubmission[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded' | 'flagged'>('all');

  useEffect(() => { fetchAll(); }, [taskId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [taskRes, subsRes]: any[] = await Promise.all([
        apiClient.get(`/tasks/${taskId}`),
        apiClient.get(`/tasks/${taskId}/submissions`),
      ]);
      setTaskTitle(taskRes.data?.title || 'Task');
      setSubmissions(subsRes.data?.submissions || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load submissions' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter(s =>
    filter === 'all' || s.status === filter || s.ai_status?.toLowerCase().includes(filter)
  );

  return (
    <DashboardLayout title="Task Submissions" subtitle={taskTitle}>
      <div className="space-y-6">

        <Link href="/trainer/work-practice" className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700">
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Tasks</span>
        </Link>

        {msg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${
            msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {msg.type === 'success' ? <CheckBadgeIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
            <span className="text-sm flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30 w-fit">
          {(['all', 'submitted', 'graded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                filter === f ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {f} ({f === 'all' ? submissions.length : submissions.filter(s => s.status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-48" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-12 text-center">
            <p className="text-gray-500">No submissions yet for this task.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(sub => (
              <WPSubmissionCard
                key={sub.id}
                sub={sub}
                taskTitle={taskTitle}
                onRefresh={fetchAll}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
