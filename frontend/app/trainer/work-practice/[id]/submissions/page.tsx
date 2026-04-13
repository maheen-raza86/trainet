'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Submission {
  id: string;
  student_id: string;
  submission_content: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  plagiarism_score: number | null;
  plagiarism_status: string | null;
  submitted_at: string;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

export default function TrainerWPSubmissions() {
  const params = useParams();
  const taskId = params.id as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<string | null>(null);
  const [gradeTarget, setGradeTarget] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('all');

  useEffect(() => { fetchSubmissions(); }, [taskId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get(`/tasks/${taskId}/submissions`);
      setSubmissions(res.data?.submissions || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load submissions' });
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget) return;
    try {
      setSaving(true);
      await apiClient.put(`/tasks/submissions/${gradeTarget.id}/grade`, {
        grade: parseInt(gradeValue),
        feedback: feedbackValue,
      });
      setMsg({ type: 'success', text: 'Submission graded successfully' });
      setGradeTarget(null);
      setGradeValue('');
      setFeedbackValue('');
      fetchSubmissions();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Grading failed' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = submissions.filter(s =>
    filter === 'all' || s.status === filter
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout title="Task Submissions" subtitle="Review and grade student submissions">
      <div className="space-y-6">

        <Link href="/trainer/work-practice" className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700">
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

        {/* Filter tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          {(['all', 'submitted', 'graded'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                filter === f ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f} ({f === 'all' ? submissions.length : submissions.filter(s => s.status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-5 border border-white/30 animate-pulse h-20" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-12 text-center">
            <p className="text-gray-500">No {filter === 'all' ? '' : filter} submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(sub => (
              <div key={sub.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-gray-800">{sub.profiles?.first_name} {sub.profiles?.last_name}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        sub.status === 'graded' ? 'bg-green-100 text-green-700' :
                        sub.status === 'flagged' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{sub.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{sub.profiles?.email} · Submitted {formatDate(sub.submitted_at)}</p>

                    {sub.submission_content && (
                      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 mb-2 max-h-24 overflow-y-auto">
                        {sub.submission_content}
                      </div>
                    )}

                    {sub.file_url && (
                      <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-xs text-purple-600 hover:underline mb-2">
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        <span>📎 {sub.file_name || 'View File'}</span>
                      </a>
                    )}

                    {sub.grade !== null && (
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600 font-medium">Grade: {sub.grade}/100</span>
                        {sub.feedback && <span className="text-gray-600 text-xs">{sub.feedback}</span>}
                      </div>
                    )}

                    {/* AI results */}
                    {(sub.ai_score !== null || sub.plagiarism_score !== null) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sub.ai_score !== null && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">
                            <SparklesIcon className="w-3 h-3" />
                            <span>AI: {sub.ai_score}/100</span>
                          </span>
                        )}
                        {sub.plagiarism_score !== null && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            sub.plagiarism_status === 'clean' ? 'bg-green-50 text-green-600' :
                            sub.plagiarism_status === 'suspicious' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            🔍 {sub.plagiarism_score}% ({sub.plagiarism_status})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {sub.status !== 'graded' ? (
                      <button onClick={() => { setGradeTarget(sub); setGradeValue(''); setFeedbackValue(''); }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition">
                        Grade
                      </button>
                    ) : (
                      <button onClick={() => { setGradeTarget(sub); setGradeValue(String(sub.grade)); setFeedbackValue(sub.feedback || ''); }}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                        Edit Grade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grade Modal */}
      {gradeTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Grade Submission</h2>
            <p className="text-sm text-gray-500 mb-4">{gradeTarget.profiles?.first_name} {gradeTarget.profiles?.last_name}</p>
            <form onSubmit={handleGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade (0–100) *</label>
                <input type="number" min="0" max="100" value={gradeValue}
                  onChange={e => setGradeValue(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea value={feedbackValue} onChange={e => setFeedbackValue(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder="Provide feedback to the student..." />
              </div>
              <div className="flex space-x-3">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Submit Grade'}
                </button>
                <button type="button" onClick={() => setGradeTarget(null)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
