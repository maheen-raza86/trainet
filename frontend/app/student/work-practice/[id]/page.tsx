'use client';

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
} from '@heroicons/react/24/outline';

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
  status: string;
  grade: number | null;
  feedback: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  plagiarism_score: number | null;
  plagiarism_status: string | null;
  submission_content: string | null;
  file_url: string | null;
  file_name: string | null;
  submitted_at: string;
}

export default function StudentTaskDetail() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<WPTask | null>(null);
  const [submission, setSubmission] = useState<WPSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Submission form state
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !file) {
      setMsg({ type: 'error', text: 'Please provide a text response or upload a file' });
      return;
    }
    try {
      setSubmitting(true);
      setMsg(null);
      const formData = new FormData();
      if (content) formData.append('submissionContent', content);
      if (file) formData.append('file', file);
      await apiClient.post(`/tasks/${taskId}/submit`, formData);
      setMsg({ type: 'success', text: 'Solution submitted successfully!' });
      setShowForm(false);
      setContent('');
      setFile(null);
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const isPast = (d: string | null) => d ? new Date(d) < new Date() : false;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <DashboardLayout title="Task Detail" subtitle="Loading...">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1,2].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-32" />)}
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
  const canSubmit = !submission && !deadlinePast && task.status === 'published';

  return (
    <DashboardLayout title={task.title} subtitle={`${task.task_type} · ${task.profiles?.first_name} ${task.profiles?.last_name}`}>
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
              task.task_type === 'coding' ? 'bg-blue-100 text-blue-700' :
              task.task_type === 'project' ? 'bg-purple-100 text-purple-700' :
              task.task_type === 'quiz' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>{task.task_type}</span>
            {task.deadline && (
              <div className="flex items-center space-x-2">
                <span className={`flex items-center space-x-1 text-sm ${deadlinePast ? 'text-red-500' : 'text-gray-600'}`}>
                  <ClockIcon className="w-4 h-4" />
                  <span>{deadlinePast ? 'Closed - Deadline has passed' : `Due ${formatDate(task.deadline)}`}</span>
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

        {/* Submission Status */}
        {submission ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">Your Submission</h3>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                submission.status === 'graded' ? 'bg-green-100 text-green-700' :
                submission.status === 'flagged' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{submission.status}</span>
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

            {/* Grade & Feedback */}
            {submission.grade !== null && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-xs text-gray-500 mb-1">Grade</p>
                <p className="text-3xl font-bold text-green-600">{submission.grade}<span className="text-lg text-gray-400">/100</span></p>
                {submission.feedback && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Trainer Feedback</p>
                    <p className="text-sm text-gray-700">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Evaluation */}
            {submission.ai_score !== null && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-1">
                  <SparklesIcon className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-700">AI Evaluation</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{submission.ai_score}<span className="text-sm text-gray-400">/100</span></p>
                {submission.ai_feedback && <p className="text-sm text-gray-600 mt-1">{submission.ai_feedback}</p>}
              </div>
            )}

            {/* Plagiarism */}
            {submission.plagiarism_score !== null && (
              <div className={`p-3 rounded-xl border ${
                submission.plagiarism_status === 'clean' ? 'bg-green-50 border-green-200' :
                submission.plagiarism_status === 'suspicious' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className="text-sm font-medium text-gray-700">
                  🔍 Plagiarism: {submission.plagiarism_score}% similarity —
                  <span className={`ml-1 font-semibold ${
                    submission.plagiarism_status === 'clean' ? 'text-green-600' :
                    submission.plagiarism_status === 'suspicious' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{submission.plagiarism_status}</span>
                </p>
              </div>
            )}

            {submission.status === 'submitted' && submission.grade === null && (
              <p className="text-sm text-gray-500 italic">Your submission is awaiting review by the trainer.</p>
            )}
          </div>
        ) : (
          /* Submit form */
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            {!canSubmit ? (
              <div className="text-center py-4">
                {deadlinePast ? (
                  <p className="text-red-500 text-sm font-medium">Closed - Deadline has passed</p>
                ) : (
                  <p className="text-gray-500 text-sm">This task is no longer accepting submissions.</p>
                )}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Response <span className="text-gray-400 font-normal">(optional if uploading a file)</span>
                  </label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                    placeholder="Describe your solution, paste code, or write your answer..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload File <span className="text-gray-400 font-normal">(optional if providing text)</span>
                  </label>
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700" />
                  <p className="text-xs text-gray-400 mt-1">Accepted: PDF, ZIP, JS, PY, JAVA, TXT, DOC, DOCX (max 10 MB)</p>
                </div>

                <div className="flex space-x-3">
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Solution'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
