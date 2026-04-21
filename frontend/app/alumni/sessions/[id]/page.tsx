'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getSessionStatus, SESSION_STATUS_BADGE, SESSION_STATUS_LABEL } from '@/lib/sessionStatus';

interface Session {
  id: string;
  title: string;
  topic: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_text: string | null;
  schedule_text: string | null;
  meeting_link: string | null;
  session_notes: string | null;
  profiles: { id: string; first_name: string; last_name: string };
}

interface Material {
  id: string;
  title: string;
  file_url: string;
  type: string;
}

const MATERIAL_TYPE_BADGE: Record<string, string> = {
  pdf: 'bg-red-100 text-red-700',
  slides: 'bg-orange-100 text-orange-700',
  image: 'bg-purple-100 text-purple-700',
  document: 'bg-blue-100 text-blue-700',
  link: 'bg-green-100 text-green-700',
};

const MATERIAL_TYPES = ['pdf', 'slides', 'image', 'document', 'link'] as const;

export default function AlumniSessionDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Meeting link
  const [meetingLink, setMeetingLink] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Material upload
  const [matTitle, setMatTitle] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [matType, setMatType] = useState<typeof MATERIAL_TYPES[number]>('link');
  const [uploadingMat, setUploadingMat] = useState(false);
  const [matError, setMatError] = useState<string | null>(null);

  // Status transition
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'alumni' && id) {
      fetchSession();
      fetchMaterials();
    }
  }, [user, id]);

  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') return null;

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiClient.get(`/guidance/sessions/${id}`);
      const s = res.data?.session || res.data;
      setSession(s);
      setMeetingLink(s?.meeting_link || '');
      setNotes(s?.session_notes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res: any = await apiClient.get(`/guidance/sessions/${id}/materials`);
      setMaterials(res.data?.materials || []);
    } catch {
      // non-critical
    }
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      await apiClient.put(`/guidance/sessions/${id}`, { status });
      await fetchSession();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveMeetingLink = async () => {
    setSavingLink(true);
    try {
      await apiClient.put(`/guidance/sessions/${id}`, { meeting_link: meetingLink });
      await fetchSession();
    } catch (err: any) {
      alert(err.message || 'Failed to save meeting link');
    } finally {
      setSavingLink(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await apiClient.put(`/guidance/sessions/${id}`, { session_notes: notes });
      await fetchSession();
    } catch (err: any) {
      alert(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const uploadMaterial = async () => {
    if (!matTitle.trim()) return;
    if (uploadMode === 'file' && !matFile) return;
    if (uploadMode === 'link' && !matUrl.trim()) return;

    setUploadingMat(true);
    setMatError(null);
    try {
      if (uploadMode === 'file' && matFile) {
        // Real file upload via multipart/form-data
        const formData = new FormData();
        formData.append('file', matFile);
        formData.append('title', matTitle.trim());
        // Auto-detect type from extension
        const ext = matFile.name.split('.').pop()?.toLowerCase() || '';
        let detectedType = 'document';
        if (ext === 'pdf') detectedType = 'pdf';
        else if (['ppt', 'pptx'].includes(ext)) detectedType = 'slides';
        else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) detectedType = 'image';
        else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) detectedType = 'link';
        formData.append('type', detectedType);

        await apiClient.post(`/guidance/sessions/${id}/materials`, formData);
      } else {
        // External link — plain JSON
        await apiClient.post(`/guidance/sessions/${id}/materials`, {
          title: matTitle.trim(),
          file_url: matUrl.trim(),
          type: 'link',
        });
      }

      setMatTitle('');
      setMatUrl('');
      setMatFile(null);
      await fetchMaterials();
    } catch (err: any) {
      setMatError(err.message || 'Failed to upload material');
    } finally {
      setUploadingMat(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Session" subtitle="Loading...">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-32" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !session) {
    return (
      <DashboardLayout title="Session" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
          <button onClick={() => router.push('/alumni/sessions')} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
            Back to Sessions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Always compute status from real time — never trust stale DB value
  const computedStatus = getSessionStatus(session.start_date, session.end_date);
  const isEnded = computedStatus === 'ended';

  return (
    <DashboardLayout title={session.title} subtitle={session.topic}>
      <div className="space-y-6">

        {/* Back button */}
        <button
          onClick={() => router.push('/alumni/sessions')}
          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Sessions</span>
        </button>

        {/* Section 1: Session Info */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Session Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Title</p>
              <p className="text-sm font-medium text-gray-800">{session.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Topic</p>
              <p className="text-sm text-gray-700">{session.topic}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full border capitalize ${SESSION_STATUS_BADGE[computedStatus]}`}>
                {SESSION_STATUS_LABEL[computedStatus]}
              </span>
            </div>
            {session.profiles && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Student</p>
                <p className="text-sm text-gray-700">{session.profiles.first_name} {session.profiles.last_name}</p>
              </div>
            )}
            {session.start_date && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Start Date</p>
                <p className="text-sm text-gray-700">{new Date(session.start_date).toLocaleDateString()}</p>
              </div>
            )}
            {session.end_date && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                <p className="text-sm text-gray-700">{new Date(session.end_date).toLocaleDateString()}</p>
              </div>
            )}
            {session.duration_text && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Duration</p>
                <p className="text-sm text-gray-700">{session.duration_text}</p>
              </div>
            )}
            {session.schedule_text && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Schedule</p>
                <p className="text-sm text-gray-700">{session.schedule_text}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Status Transitions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Status</h2>
          {isEnded ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm">Session ended</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {session.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus('active')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    Mark Active
                  </button>
                  <button
                    onClick={() => updateStatus('cancelled')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
              {session.status === 'active' && (
                <>
                  <button
                    onClick={() => updateStatus('completed')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-green-500 text-white text-sm rounded-xl hover:bg-green-600 transition disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => updateStatus('cancelled')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Meeting Link */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Meeting Link</h2>
          {session.meeting_link && (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-blue-600 hover:underline mb-3"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="truncate">{session.meeting_link}</span>
            </a>
          )}
          <div className="flex gap-3">
            <input
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button
              onClick={saveMeetingLink}
              disabled={savingLink}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
            >
              {savingLink ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Section 4: Materials */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Materials</h2>

          {/* Existing materials list */}
          {materials.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No materials uploaded yet</p>
          ) : (
            <div className="grid gap-3 mb-5">
              {materials.map(mat => (
                <div key={mat.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium capitalize ${MATERIAL_TYPE_BADGE[mat.type] || 'bg-gray-100 text-gray-600'}`}>
                      {mat.type}
                    </span>
                    <span className="text-sm text-gray-700 truncate font-medium">{mat.title}</span>
                  </div>
                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
                  >
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                    Open
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Upload form */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Material</p>
            {matError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{matError}</p>
            )}

            {/* Title */}
            <input
              value={matTitle}
              onChange={e => setMatTitle(e.target.value)}
              placeholder="Material title *"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />

            {/* Upload mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 text-xs rounded-xl border transition ${uploadMode === 'file' ? 'bg-purple-50 border-purple-300 text-purple-700 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                📁 Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`flex-1 py-2 text-xs rounded-xl border transition ${uploadMode === 'link' ? 'bg-purple-50 border-purple-300 text-purple-700 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                🔗 External Link
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <label className="block w-full cursor-pointer">
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition ${matFile ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'}`}>
                    {matFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-purple-700 font-medium truncate max-w-xs">{matFile.name}</span>
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); setMatFile(null); }}
                          className="text-gray-400 hover:text-red-500 transition ml-1"
                        >✕</button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">Click to choose a file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PPT, PPTX, ZIP, PNG, JPG, MP4…</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.txt,.md"
                    onChange={e => setMatFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            ) : (
              <input
                value={matUrl}
                onChange={e => setMatUrl(e.target.value)}
                placeholder="https://... (Google Drive, YouTube, etc.)"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            )}

            <button
              onClick={uploadMaterial}
              disabled={uploadingMat || !matTitle.trim() || (uploadMode === 'file' ? !matFile : !matUrl.trim())}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 font-medium"
            >
              {uploadingMat ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        </div>

        {/* Section 5: Notes */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Session Notes</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            placeholder="Add session notes..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Section 6: Chat Link */}
        {session.profiles && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Chat</h2>
            <button
              onClick={() => router.push(`/alumni/messages/${session.profiles.id}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-blue-600 transition"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>Message {session.profiles.first_name}</span>
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
