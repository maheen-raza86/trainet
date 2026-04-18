'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  MagnifyingGlassIcon, UserCircleIcon, ChatBubbleLeftRightIcon,
  CheckCircleIcon, ExclamationTriangleIcon, AcademicCapIcon,
  CalendarIcon, ArrowRightIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

/* ── Types ── */
interface AlumniProfile {
  id: string; headline: string; bio: string; skills: string;
  available_for_mentorship: boolean;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}
interface GuidanceRequest {
  id: string; topic: string; description: string; status: string; created_at: string;
  alumni_id: string;
  profiles?: { id: string; first_name: string; last_name: string };
}
interface MentorshipSession {
  id: string; title: string; topic: string; status: string; start_date: string; meeting_link?: string;
  alumni_id: string;
  profiles?: { id: string; first_name: string; last_name: string };
}

/* ── Helpers ── */
const STATUS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted:  'bg-blue-100  text-blue-700  border-blue-200',
  active:    'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-gray-100  text-gray-600  border-gray-200',
  cancelled: 'bg-red-100   text-red-700   border-red-200',
  rejected:  'bg-red-100   text-red-700   border-red-200',
};
const badge = (s: string) => STATUS[s] || 'bg-gray-100 text-gray-600 border-gray-200';

type Tab = 'browse' | 'requests' | 'sessions';

export default function StudentGuidancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('browse');

  /* Browse Alumni */
  const [alumni, setAlumni]     = useState<AlumniProfile[]>([]);
  const [filtered, setFiltered] = useState<AlumniProfile[]>([]);
  const [search, setSearch]     = useState('');
  const [alumniLoading, setAlumniLoading] = useState(true);
  const [requestModal, setRequestModal]   = useState<AlumniProfile | null>(null);
  const [requestMsg, setRequestMsg]       = useState('');
  const [requestTopic, setRequestTopic]   = useState('');
  const [requestDuration, setRequestDuration] = useState('');
  const [requestSchedule, setRequestSchedule] = useState('');
  const [sending, setSending]   = useState(false);
  const [toast, setToast]       = useState<{ type: 'success'|'error'; text: string }|null>(null);

  /* My Requests */
  const [requests, setRequests]         = useState<GuidanceRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<string|null>(null);
  const [cancelling, setCancelling]     = useState(false);

  /* My Sessions */
  const [sessions, setSessions]         = useState<MentorshipSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  /* ── Fetch ── */
  useEffect(() => { if (user) { fetchAlumni(); fetchRequests(); fetchSessions(); } }, [user]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(alumni.filter(a =>
      `${a.profiles?.first_name} ${a.profiles?.last_name}`.toLowerCase().includes(q) ||
      (a.headline||'').toLowerCase().includes(q) || (a.skills||'').toLowerCase().includes(q)
    ));
  }, [search, alumni]);

  const fetchAlumni = async () => {
    try { const r: any = await apiClient.get('/alumni'); setAlumni(r.data?.alumni||[]); setFiltered(r.data?.alumni||[]); }
    catch {} finally { setAlumniLoading(false); }
  };
  const fetchRequests = async () => {
    try { const r: any = await apiClient.get('/guidance/student'); setRequests(r.data?.requests||r.data||[]); }
    catch {} finally { setRequestsLoading(false); }
  };
  const fetchSessions = async () => {
    try { const r: any = await apiClient.get('/guidance/sessions/student'); setSessions(r.data?.sessions||r.data||[]); }
    catch {} finally { setSessionsLoading(false); }
  };

  /* ── Actions ── */
  const showToast = (type: 'success'|'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSendRequest = async () => {
    if (!requestModal || !requestTopic.trim() || !requestMsg.trim()) return;
    setSending(true);
    try {
      await apiClient.post('/guidance/request', {
        alumni_id: requestModal.profiles?.id,
        topic: requestTopic.trim(),
        description: requestMsg.trim(),
        ...(requestDuration.trim() && { preferred_duration: requestDuration.trim() }),
        ...(requestSchedule.trim() && { preferred_schedule: requestSchedule.trim() }),
      });
      showToast('success', `Guidance request sent to ${requestModal.profiles?.first_name}!`);
      setRequestModal(null); setRequestMsg(''); setRequestTopic(''); setRequestDuration(''); setRequestSchedule('');
      fetchRequests();
      setTab('requests');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send request');
    } finally { setSending(false); }
  };

  const handleCancel = async (id: string) => {
    setCancelling(true);
    try {
      await apiClient.patch(`/guidance/${id}/cancel`);
      // Re-fetch from server so the cancelled status persists across refreshes
      await fetchRequests();
      setCancelTarget(null);
      showToast('success', 'Request cancelled.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to cancel request');
    } finally { setCancelling(false); }
  };

  /* ── Tabs ── */
  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'browse',   label: 'Browse Alumni' },
    { key: 'requests', label: 'My Requests',  count: requests.length },
    { key: 'sessions', label: 'My Sessions',  count: sessions.length },
  ];

  /* ── Render ── */
  return (
    <DashboardLayout title="Alumni Guidance" subtitle="Browse alumni, track requests, and manage your sessions">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type==='success'?'bg-green-500':'bg-red-500'}`}>
          {toast.text}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30 w-fit mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab===t.key ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab===t.key?'bg-white/20':'bg-gray-100'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── BROWSE ALUMNI ── */}
      {tab === 'browse' && (
        <div className="space-y-5">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, headline, or skills..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white/60 backdrop-blur-sm" />
          </div>

          {alumniLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-40" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{search ? 'No alumni match your search' : 'No alumni profiles yet'}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(a => (
                <div key={a.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{a.profiles?.first_name} {a.profiles?.last_name}</h3>
                      {a.headline && <p className="text-sm text-gray-500 mt-0.5">{a.headline}</p>}
                    </div>
                    {a.available_for_mentorship && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200 shrink-0">Available</span>
                    )}
                  </div>
                  {a.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{a.bio}</p>}
                  {a.skills && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {a.skills.split(',').slice(0,4).map((s,i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {a.available_for_mentorship && (
                      <button onClick={() => { setRequestModal(a); setRequestMsg(''); setRequestTopic(''); setRequestDuration(''); setRequestSchedule(''); }}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-blue-600 transition">
                        Request Help
                      </button>
                    )}
                    <button onClick={() => router.push(`/alumni/messages/${a.profiles?.id}`)}
                      className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition" title="Message">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY REQUESTS ── */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-20" />)}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-white/60 rounded-2xl border border-white/30">
              <AcademicCapIcon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No guidance requests yet</p>
              <button onClick={() => setTab('browse')} className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition">
                Browse Alumni
              </button>
            </div>
          ) : (
            <>
              {/* Group by status */}
              {(['pending','accepted','rejected'] as const).map(group => {
                const grouped = requests.filter(r => r.status === group);
                if (!grouped.length) return null;
                return (
                  <div key={group}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1 capitalize">{group}</h3>
                    <div className="space-y-3">
                      {grouped.map(req => {
                        const alumniName = req.profiles
                          ? `${req.profiles.first_name} ${req.profiles.last_name}`
                          : 'Unknown Alumni';
                        // find session for this request
                        const relatedSession = sessions.find(s => s.alumni_id === req.alumni_id);
                        return (
                          <div key={req.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-800">{req.topic}</p>
                                  <span className={`px-2 py-0.5 text-xs rounded-full border capitalize shrink-0 ${badge(req.status)}`}>{req.status}</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                                <p className="text-sm text-gray-500 mt-1">{alumniName}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                {req.status === 'pending' && (
                                  <button onClick={() => setCancelTarget(req.id)}
                                    className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg hover:bg-red-50 transition">
                                    Cancel
                                  </button>
                                )}
                                {req.status === 'accepted' && (
                                  <>
                                    <button onClick={() => router.push(`/alumni/messages/${req.alumni_id}`)}
                                      className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
                                      <ChatBubbleLeftRightIcon className="w-3 h-3" /> Message
                                    </button>
                                    {relatedSession && (
                                      <button onClick={() => router.push(`/student/guidance/${relatedSession.id}`)}
                                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-lg hover:from-purple-600 hover:to-blue-600 transition">
                                        View Session
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── MY SESSIONS ── */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          {sessionsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-20" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 bg-white/60 rounded-2xl border border-white/30">
              <CalendarIcon className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sessions yet. Sessions appear once an alumni accepts your request and creates one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => {
                const alumniName = s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : 'Unknown Alumni';
                return (
                  <div key={s.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 transition cursor-pointer"
                    onClick={() => router.push(`/student/guidance/${s.id}`)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">{s.title}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full border capitalize shrink-0 ${badge(s.status)}`}>{s.status}</span>
                        </div>
                        <p className="text-sm text-gray-600">{s.topic}</p>
                        <p className="text-sm text-gray-500 mt-1">{alumniName}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(s.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 items-end">
                        {s.status === 'active' && s.meeting_link && (
                          <a href={s.meeting_link} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition">
                            Join Meeting
                          </a>
                        )}
                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Request Help Modal ── */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Request Guidance</h2>
                <p className="text-sm text-gray-500">From {requestModal.profiles?.first_name} {requestModal.profiles?.last_name}</p>
              </div>
              <button onClick={() => setRequestModal(null)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic <span className="text-red-500">*</span></label>
                <input value={requestTopic} onChange={e => setRequestTopic(e.target.value)}
                  placeholder="e.g. Jenkins pipelines, Resume review"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)} rows={3}
                  placeholder="Describe what you need help with..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Duration <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={requestDuration} onChange={e => setRequestDuration(e.target.value)}
                  placeholder="e.g. 1 week, 3 sessions"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Schedule <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={requestSchedule} onChange={e => setRequestSchedule(e.target.value)}
                  placeholder="e.g. Weekday evenings"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setRequestModal(null)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSendRequest} disabled={sending || !requestTopic.trim() || !requestMsg.trim()}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                  {sending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Cancel Request?</h2>
            <p className="text-sm text-gray-600 mb-5">This will remove your pending guidance request. You can send a new one anytime.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Keep It</button>
              <button onClick={() => handleCancel(cancelTarget)} disabled={cancelling}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
