'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmissionModal from '@/components/student/SubmissionModal';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  LinkIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: 'file' | 'video' | 'link' | 'document';
  file_url: string | null;
  external_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_offering_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  plagiarism_score: number | null;
  plagiarism_status: string | null;
}

interface OfferingDetail {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  outline: string;
  status: string;
  live_session_link: string | null;
  live_session_notes: string | null;
  courses: { id: string; title: string; description: string };
  profiles: { id: string; first_name: string; last_name: string; email: string };
  materials: Material[];
}

export default function StudentCourseDetail() {
  const params = useParams();
  const offeringId = params.id as string;

  const [offering, setOffering] = useState<OfferingDetail | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'live'>('materials');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<Submission | null>(null);

  useEffect(() => {
    fetchAll();
  }, [offeringId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [detailRes, assignmentsRes, submissionsRes] = await Promise.all([
        apiClient.get(`/materials/offering-detail/${offeringId}`),
        apiClient.get(`/assignments/course-offering/${offeringId}`),
        apiClient.get('/submissions/my'),
      ]);

      setOffering((detailRes as any).data);
      setAssignments((assignmentsRes as any).data?.assignments || []);
      setSubmissions((submissionsRes as any).data?.submissions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (assignmentId: string) =>
    submissions.find((s) => s.assignment_id === assignmentId);

  const isPastDeadline = (dueDate: string) => new Date(dueDate) < new Date();

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="w-5 h-5" />;
      case 'link': return <LinkIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getMaterialUrl = (m: Material) => m.external_url || (m.file_url ? `http://localhost:5000${m.file_url}` : null);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !offering) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error || 'Course not found'}</p>
          <Link href="/student/courses" className="mt-4 inline-block text-purple-600 underline">Back to Courses</Link>
        </div>
      </DashboardLayout>
    );
  }

  const now = new Date();
  const visibleAssignments = assignments.filter(a => !isPastDeadline(a.due_date) || getSubmission(a.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <Link href="/student/courses" className="text-white/70 hover:text-white text-sm mb-3 inline-block">
            ← Back to My Courses
          </Link>
          <h1 className="text-2xl font-bold mb-1">{offering.courses.title}</h1>
          <p className="text-white/80 text-sm mb-3">{offering.courses.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <span>👨‍🏫 {offering.profiles.first_name} {offering.profiles.last_name}</span>
            <span>⏱ {offering.duration_weeks} weeks · {offering.hours_per_week}h/week</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30">
          {(['materials', 'assignments', 'live'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'materials' ? '📚 Materials' : tab === 'assignments' ? '📝 Assignments' : '🎥 Live Sessions'}
            </button>
          ))}
        </div>

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            {offering.materials.length > 0 ? (
              offering.materials.map((m) => {
                const url = getMaterialUrl(m);
                return (
                  <div key={m.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 flex items-center justify-between group hover:bg-white/80 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center text-purple-600">
                        {getMaterialIcon(m.material_type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{m.title}</p>
                        {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                        {m.file_name && <p className="text-xs text-gray-400">{m.file_name}</p>}
                      </div>
                    </div>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        <span>Open</span>
                      </a>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-12 text-center border border-white/30">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No materials uploaded yet</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {visibleAssignments.length > 0 ? visibleAssignments.map((assignment) => {
              const submission = getSubmission(assignment.id);
              const past = isPastDeadline(assignment.due_date);

              return (
                <div key={assignment.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                        {submission?.grade !== null && submission?.grade !== undefined ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Graded</span>
                        ) : submission ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Submitted</span>
                        ) : past ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Closed</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      {submission?.grade !== null && submission?.grade !== undefined && (
                        <p className="text-sm text-green-600 font-medium mt-1">Score: {submission.grade}/100</p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {!submission && !past && (
                        <button
                          onClick={() => { setSelectedAssignment(assignment); setIsSubmitModalOpen(true); }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition"
                        >
                          Submit
                        </button>
                      )}
                      {submission && (
                        <button
                          onClick={() => setViewFeedback(submission)}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
                        >
                          View Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-12 text-center border border-white/30">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active assignments</p>
              </div>
            )}
          </div>
        )}

        {/* Live Sessions Tab */}
        {activeTab === 'live' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            {offering.live_session_link ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                    <VideoCameraIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Live Session</h3>
                    <p className="text-sm text-gray-500">Click to join the live session</p>
                  </div>
                </div>
                {offering.live_session_notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{offering.live_session_notes}</p>
                )}
                <a
                  href={offering.live_session_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-medium"
                >
                  <VideoCameraIcon className="w-5 h-5" />
                  <span>Join Live Session</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No live session scheduled yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {selectedAssignment && (
        <SubmissionModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={fetchAll}
          assignment={selectedAssignment}
        />
      )}

      {/* Feedback Modal */}
      {viewFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Submission Feedback</h2>

            {viewFeedback.grade !== null && (
              <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-gray-600">Grade</p>
                <p className="text-3xl font-bold text-green-600">{viewFeedback.grade}<span className="text-lg text-gray-400">/100</span></p>
              </div>
            )}

            {viewFeedback.feedback && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Trainer Feedback</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{viewFeedback.feedback}</p>
              </div>
            )}

            {viewFeedback.ai_score !== null && (
              <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-medium text-purple-700">AI Evaluation</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{viewFeedback.ai_score}<span className="text-sm text-gray-400">/100</span></p>
                {viewFeedback.ai_feedback && <p className="text-sm text-gray-600 mt-1">{viewFeedback.ai_feedback}</p>}
              </div>
            )}

            {viewFeedback.plagiarism_score !== null && (
              <div className={`mb-4 p-3 rounded-xl border ${
                viewFeedback.plagiarism_status === 'clean' ? 'bg-green-50 border-green-200' :
                viewFeedback.plagiarism_status === 'suspicious' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className="text-sm font-medium text-gray-700">Plagiarism Check</p>
                <p className="text-sm text-gray-600">
                  Similarity: {viewFeedback.plagiarism_score}% — 
                  <span className={`font-medium ml-1 ${
                    viewFeedback.plagiarism_status === 'clean' ? 'text-green-600' :
                    viewFeedback.plagiarism_status === 'suspicious' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {viewFeedback.plagiarism_status}
                  </span>
                </p>
              </div>
            )}

            {!viewFeedback.grade && !viewFeedback.ai_score && (
              <p className="text-gray-500 text-sm">Your submission is awaiting review.</p>
            )}

            <button
              onClick={() => setViewFeedback(null)}
              className="w-full mt-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
