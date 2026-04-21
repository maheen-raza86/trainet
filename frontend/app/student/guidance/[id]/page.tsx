'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  LinkIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { getSessionStatus, SESSION_STATUS_BADGE, SESSION_STATUS_LABEL } from '@/lib/sessionStatus';

interface Material {
  id: string;
  title: string;
  type: string;
  file_url: string;
}

interface Session {
  id: string;
  title: string;
  topic: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_text?: string;
  schedule_text?: string;
  meeting_link?: string;
  session_notes?: string;
  alumni_id?: string;
  alumni?: { id: string; profiles?: { first_name: string; last_name: string } };
  alumni_profiles?: { id: string; profiles?: { first_name: string; last_name: string } };
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700',
    slides: 'bg-orange-100 text-orange-700',
    image: 'bg-purple-100 text-purple-700',
    document: 'bg-blue-100 text-blue-700',
    link: 'bg-green-100 text-green-700',
  };
  return map[type] || 'bg-gray-100 text-gray-600';
};

export default function StudentSessionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchSession();
      fetchMaterials();
    }
  }, [user, id]);

  const fetchSession = async () => {
    try {
      const res: any = await apiClient.get(`/guidance/sessions/${id}`);
      const s = res.data?.session || res.data;
      setSession(s);
      // Check if feedback already exists
      try {
        const fb: any = await apiClient.get(`/guidance/sessions/${id}/feedback`);
        if (fb.data?.feedback || (Array.isArray(fb.data) && fb.data.length > 0)) {
          setHasFeedback(true);
        }
      } catch { /* no feedback yet */ }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res: any = await apiClient.get(`/guidance/sessions/${id}/materials`);
      setMaterials(res.data?.materials || res.data || []);
    } catch { /* ignore */ }
  };

  const submitFeedback = async () => {
    if (rating === 0) return;
    setSubmittingFeedback(true);
    try {
      await apiClient.post(`/guidance/sessions/${id}/feedback`, { rating, comment: comment || undefined });
      setFeedbackSubmitted(true);
    } catch { /* ignore */ } finally {
      setSubmittingFeedback(false);
    }
  };

  const alumniProfile =
    session?.alumni?.profiles || session?.alumni_profiles?.profiles;
  const alumniName = alumniProfile
    ? `${alumniProfile.first_name} ${alumniProfile.last_name}`
    : 'Unknown Alumni';
  const alumniId = session?.alumni?.id || session?.alumni_profiles?.id || session?.alumni_id;

  // Always compute status from time — never trust the stale DB value
  const computedStatus = getSessionStatus(session?.start_date, session?.end_date);
  const isEnded   = computedStatus === 'ended';
  const isActive  = computedStatus === 'active';
  const canJoin   = isActive && !!session?.meeting_link;

  if (loading) {
    return (
      <DashboardLayout title="Session Details" subtitle="">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-24" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout title="Session Details" subtitle="">
        <div className="text-center py-16 bg-white/60 rounded-2xl border border-white/30">
          <p className="text-gray-500">Session not found.</p>
          <button onClick={() => router.push('/student/guidance')} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm hover:bg-purple-600 transition">
            Back to Guidance
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={session.title} subtitle={session.topic}>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/student/guidance')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Guidance
        </button>

        {/* Section 1: Session Info */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{session.title}</h2>
              <p className="text-gray-600 mt-0.5">{session.topic}</p>
            </div>
            <span className={`px-3 py-1 text-xs rounded-full border capitalize shrink-0 ${SESSION_STATUS_BADGE[computedStatus]}`}>
              {SESSION_STATUS_LABEL[computedStatus]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Alumni:</span>
              <span>{alumniName}</span>
            </div>
            {session.start_date && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span>Start: {new Date(session.start_date).toLocaleString()}</span>
              </div>
            )}
            {session.end_date && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span>End: {new Date(session.end_date).toLocaleString()}</span>
              </div>
            )}
            {session.duration_text && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{session.duration_text}</span>
              </div>
            )}
            {session.schedule_text && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{session.schedule_text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Meeting */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Meeting</h3>
          {session.meeting_link ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 break-all">
              <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{session.meeting_link}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No meeting link provided.</p>
          )}
          {canJoin ? (
            <a
              href={session.meeting_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm hover:from-green-600 hover:to-emerald-600 transition font-medium"
            >
              Join Session
            </a>
          ) : isEnded ? (
            <div className="space-y-1">
              <button disabled className="px-5 py-2 bg-gray-200 text-gray-400 rounded-xl text-sm cursor-not-allowed font-medium">
                Session Ended
              </button>
              <p className="text-xs text-gray-400">This guidance session has already ended.</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {computedStatus === 'upcoming' ? 'Session has not started yet.' : 'No meeting link provided.'}
            </p>
          )}
        </div>

        {/* Section 3: Materials */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Materials</h3>
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No materials uploaded yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {materials.map(mat => (
                <div key={mat.id} className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${typeBadge(mat.type)}`}>
                      {mat.type === 'pdf' ? '📄' : mat.type === 'slides' ? '📊' : mat.type === 'image' ? '🖼️' : mat.type === 'link' ? '🔗' : '📁'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{mat.title}</p>
                      <span className={`text-xs capitalize ${typeBadge(mat.type)}`}>{mat.type}</span>
                    </div>
                  </div>
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-lg hover:from-purple-600 hover:to-blue-600 transition font-medium"
                  >
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Notes */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Session Notes</h3>
          {session.session_notes ? (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {session.session_notes}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">No notes available for this session.</p>
          )}
        </div>

        {/* Section 5: Chat Link */}
        {alumniId && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Continue the Conversation</h3>
            <button
              onClick={() => router.push(`/alumni/messages/${alumniId}`)}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Chat with {alumniName}
            </button>
          </div>
        )}

        {/* Feedback Form */}
        {session.status === 'completed' && !hasFeedback && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Leave Feedback</h3>
            {feedbackSubmitted ? (
              <p className="text-green-600 font-medium">Thank you for your feedback!</p>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        {star <= rating ? (
                          <StarSolid className="w-7 h-7 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-7 h-7 text-gray-300 hover:text-yellow-300 transition" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Comment (optional)</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white/70 resize-none"
                  />
                </div>
                <button
                  onClick={submitFeedback}
                  disabled={rating === 0 || submittingFeedback}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
