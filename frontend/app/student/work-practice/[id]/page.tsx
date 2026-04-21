'use client';

/**
 * Student: Work & Practice Task Detail
 * Shows task info, submission form, and 3-state feedback modal
 * (Pending AI Check / AI Checked / Finalized) — mirrors assignment feedback modal.
 */

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  DocumentTextIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WPTask {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  resource_url: string | null;
  task_type: string;
  deadline: string | null;
  status: string;
  profiles: { first_name: string; last_name: string } | null;
  course_offerings: { id: string; courses: { title: string } } | null;
}

interface WPSubmission {
  id: string;
  task_id: string;
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
  submission_content: string | null;
  file_url: string | null;
  file_name: string | null;
  submitted_at: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentTaskDetail() {
  const params = useParams();
  const taskId = params.id as string;

  const [task,       setTask]       = useState<WPTask | null>(null);
  const [submission, setSubmission] = useState<WPSubmission | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg,        setMsg]        = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [viewFeedback, setViewFeedback] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [content, setContent] = useState('');
  const [file,    setFile]    = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');

  useEffect(() => { fetchData(); }, [taskId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, subsRes]: any[] = await Promise.all([
        apiClient.get(`/tasks/${taskId}`),
        apiClient.get('/tasks/my-submissions'),
      ]);
      setTask(taskRes.data);
      const mySub = (subsRes.data?.submissions || []).find((s: any) => s.task_id === taskId);
      setSubmission(mySub || null);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load task' });
    } finally {
      setLoading(false);
    }
  };

  /** Fetch the latest submission from backend before opening feedback modal */
  const openFeedback = async () => {
    if (!submission) return;
    setFeedbackLoading(true);
    setViewFeedback(true);
    try {
      const res: any = await apiClient.get(`/tasks/my-submissions/${submission.id}`);
      if (res?.data) setSubmission(res.data);
    } catch { /* keep cached data */ }
    finally { setFeedbackLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError('');

    const isProjectOrCoding = task?.task_type === 'project' || task?.task_type === 'coding';

    // Validate: project/coding with a file must be ZIP
    if (file && isProjectOrCoding) {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setFileError('For Project and Coding tasks, please upload a ZIP file containing your code.');
        return;
      }
    }

    if (!content && !file) {
      setMsg({ type: 'error', text: 'Please provide a text response or upload a file' });
      return;
    }
    try {
      setSubmitting(true);
      setMsg(null);
      const formData = new FormData();
      if (content) formData.append('submissionContent', content);
      if (file)    formData.append('file', file);
      await apiClient.post(`/tasks/${taskId}/submit`, formData);
      setMsg({ type: 'success', text: 'Solution submitted! AI evaluation is running...' });
      setShowForm(false);
      setContent('');
      setFile(null);
      setFileError('');
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const isPast    = (d: string | null) => d ? new Date(d) < new Date() : false;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <DashboardLayout title="Task Detail" subtitle="Loading...">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-32" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout title="Task Not Found" subtitle="">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Task not found or you don't have access.</p>
          <Link href="/student/work-practice" className="text-purple-600 underline">Back to Tasks</Link>
        </div>
      </DashboardLayout>
    );
  }

  const deadlinePast = isPast(task.deadline);
  const canSubmit    = !submission && !deadlinePast && task.status === 'published';
  const aiStatus     = submission?.ai_status || 'Pending AI Check';

  return (
    <DashboardLayout
      title={task.title}
      subtitle={`${task.task_type} · ${task.profiles?.first_name} ${task.profiles?.last_name}`}
    >
      <div className="max-w-3xl mx-auto space-y-6">

        <Link href="/student/work-practice" className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700">
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Tasks</span>
        </Link>

        {msg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${
            msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {msg.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
            <span className="text-sm flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Task Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${
              task.task_type === 'coding'  ? 'bg-blue-100 text-blue-700' :
              task.task_type === 'project' ? 'bg-purple-100 text-purple-700' :
              task.task_type === 'quiz'    ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>{task.task_type}</span>
            {task.deadline && (
              <div className="flex items-center space-x-2">
                <span className={`flex items-center space-x-1 text-sm ${deadlinePast ? 'text-red-500' : 'text-gray-600'}`}>
                  <ClockIcon className="w-4 h-4" />
                  <span>{deadlinePast ? 'Deadline passed' : `Due ${formatDate(task.deadline)}`}</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${deadlinePast ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {deadlinePast ? 'Closed' : 'Open'}
                </span>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{task.title}</h2>
            <p className="text-gray-700">{task.description}</p>
          </div>

          {task.instructions && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
            </div>
          )}

          {task.resource_url && (
            <a href={task.resource_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-purple-600 hover:underline">
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              <span>View Resource / Reference Material</span>
            </a>
          )}

          {task.course_offerings && (
            <p className="text-xs text-gray-400">📚 {task.course_offerings.courses?.title}</p>
          )}
        </div>

        {/* Submission area */}
        {submission ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-800">Your Submission</h3>
                {/* AI status badge */}
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  aiStatus === 'Finalized'              ? 'bg-green-100 text-green-700' :
                  aiStatus === 'AI Checked'             ? 'bg-blue-100 text-blue-700' :
                  aiStatus === 'Flagged for Plagiarism' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{aiStatus}</span>
              </div>
              <button
                onClick={openFeedback}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition"
              >
                View Feedback
              </button>
            </div>

            <p className="text-xs text-gray-500">Submitted {formatDate(submission.submitted_at)}</p>

            {submission.submission_content && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                {submission.submission_content}
              </div>
            )}

            {submission.file_url && (
              <a href={submission.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-purple-600 hover:underline">
                <DocumentTextIcon className="w-4 h-4" />
                <span>{submission.file_name || 'View Submitted File'}</span>
              </a>
            )}

            {/* Quick score preview */}
            {(submission.final_score !== null || submission.ai_score !== null) && (
              <div className="flex gap-3">
                {submission.final_score !== null && (
                  <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                    Final: {submission.final_score}/100
                  </div>
                )}
                {submission.ai_score !== null && (
                  <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-1">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    AI: {submission.ai_score}/100
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Submit form */
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            {!canSubmit ? (
              <div className="text-center py-4">
                {deadlinePast
                  ? <p className="text-red-500 text-sm font-medium">Closed — Deadline has passed</p>
                  : <p className="text-gray-500 text-sm">This task is no longer accepting submissions.</p>
                }
              </div>
            ) : !showForm ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Ready to submit your solution?</p>
                <button onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition">
                  Submit Solution
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-semibold text-gray-800">Submit Your Solution</h3>

                {/* ZIP upload — project/coding only */}
                {(task?.task_type === 'project' || task?.task_type === 'coding') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload ZIP File
                      <span className="ml-1 text-gray-400 font-normal">(required for project/coding)</span>
                    </label>
                    <input
                      type="file"
                      accept=".zip,application/zip,application/x-zip-compressed"
                      onChange={e => {
                        const f = e.target.files?.[0] || null;
                        setFile(f);
                        setFileError(f && !f.name.toLowerCase().endsWith('.zip')
                          ? 'Please upload a .zip file'
                          : '');
                      }}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700"
                    />
                    {file && (
                      <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        📦 Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                    {fileError && (
                      <p className="text-xs text-red-600 mt-1">{fileError}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Upload a ZIP containing your code files. The AI will analyse your project structure, README, Dockerfile, and source files.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {task?.task_type === 'quiz'
                      ? 'Your Answer'
                      : 'Written Explanation'}
                    <span className="ml-1 text-gray-400 font-normal">
                      {task?.task_type === 'quiz' ? '(required)' : '(optional — describe your approach)'}
                    </span>
                  </label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={task?.task_type === 'quiz' ? 6 : 4}
                    required={task?.task_type === 'quiz'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                    placeholder={
                      task?.task_type === 'quiz'
                        ? 'Write your answer here...'
                        : 'Describe your solution, explain your approach, or add any notes...'
                    }
                  />
                </div>

                {/* Non-project/coding file upload */}
                {task?.task_type !== 'project' && task?.task_type !== 'coding' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload File <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="file"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700"
                    />
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT (max 10 MB)</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Solution'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setFileError(''); }}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── 3-State Feedback Modal — mirrors assignment feedback modal ── */}
      {viewFeedback && submission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Task Feedback</h2>
              <button onClick={() => setViewFeedback(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Loading banner */}
            {feedbackLoading && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-blue-600">Fetching latest results...</p>
              </div>
            )}

            <div className="p-6 space-y-4">
              {/* ── STATE: Pending AI Check ── */}
              {(!submission.ai_status || submission.ai_status === 'Pending AI Check' || submission.ai_status === 'AI Check Failed') && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-7 h-7 text-yellow-600" />
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    {submission.ai_status || 'Pending AI Check'}
                  </span>
                  <p className="text-gray-500 text-sm mt-3">Your submission is being reviewed. Check back soon.</p>
                </div>
              )}

              {/* ── STATE: AI Checked ── */}
              {submission.ai_status === 'AI Checked' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">AI Checked</span>
                    <span className="text-xs text-gray-400">Awaiting trainer review</span>
                  </div>

                  {submission.ai_score !== null && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <SparklesIcon className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-medium text-purple-700">AI Score</p>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">{submission.ai_score}<span className="text-lg text-gray-400">/100</span></p>
                      {submission.ai_feedback && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{submission.ai_feedback}</p>}
                    </div>
                  )}

                  {(() => { try { const mc = JSON.parse(submission.missing_concepts || '[]'); if (!mc.length) return null; return (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Missing Concepts</p>
                      <div className="flex flex-wrap gap-1.5">{mc.map((c: string, i: number) => <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{c}</span>)}</div>
                    </div>
                  ); } catch { return null; } })()}

                  {submission.plagiarism_percentage !== null && (
                    <div className={`p-3 rounded-xl border text-sm ${
                      submission.plagiarism_status === 'flagged' ? 'bg-red-50 border-red-200 text-red-700' :
                      submission.plagiarism_status === 'suspicious' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                      'bg-green-50 border-green-200 text-green-700'
                    }`}>
                      <p className="font-medium">Plagiarism: {submission.plagiarism_percentage}%</p>
                    </div>
                  )}
                </>
              )}

              {/* ── STATE: Finalized ── */}
              {submission.ai_status === 'Finalized' && (
                <>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">✓ Finalized</span>
                    {submission.final_score !== null && (
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold border ${
                        submission.final_score >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
                        submission.final_score >= 60 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>Final: {submission.final_score}/100</span>
                    )}
                    {submission.ai_score !== null && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium border border-purple-200">
                        AI: {submission.ai_score}/100
                      </span>
                    )}
                    {submission.plagiarism_percentage !== null && (
                      <span className={`px-3 py-1 text-xs rounded-full font-medium border ${
                        submission.plagiarism_percentage > 70 ? 'bg-red-100 text-red-700 border-red-200' :
                        submission.plagiarism_percentage >= 31 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}>Plagiarism: {submission.plagiarism_percentage}%</span>
                    )}
                  </div>

                  {submission.final_score !== null && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">Final Score</p>
                      <p className="text-3xl font-bold text-green-600">{submission.final_score}<span className="text-lg text-gray-400">/100</span></p>
                      <p className="text-xs text-gray-500 mt-1">✓ Reviewed by trainer</p>
                    </div>
                  )}

                  {(submission.trainer_feedback || submission.feedback) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Trainer Feedback</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                        {submission.trainer_feedback || submission.feedback}
                      </p>
                    </div>
                  )}

                  {submission.ai_score !== null && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <SparklesIcon className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-medium text-purple-700">AI Evaluation</p>
                        <span className="text-xs text-purple-500">{submission.ai_score}/100</span>
                      </div>
                      {submission.ai_feedback && <p className="text-sm text-gray-600 leading-relaxed">{submission.ai_feedback}</p>}
                    </div>
                  )}

                  {(() => { try { const mc = JSON.parse(submission.missing_concepts || '[]'); if (!mc.length) return null; return (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Missing Concepts</p>
                      <div className="flex flex-wrap gap-1.5">{mc.map((c: string, i: number) => <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{c}</span>)}</div>
                    </div>
                  ); } catch { return null; } })()}
                </>
              )}

              <button
                onClick={() => setViewFeedback(false)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
