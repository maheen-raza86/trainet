'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api/client';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string; sender_id: string; receiver_id: string; message: string; created_at: string;
  sender: { id: string; first_name: string; last_name: string };
  receiver: { id: string; first_name: string; last_name: string };
}
interface GuidanceRequest {
  id: string; status: string; topic: string; student_id: string; alumni_id: string;
}
interface GuidanceSession {
  id: string; title: string; status: string; start_date: string; student_id: string; alumni_id: string;
}

// What to show in the guidance area
type GuidanceState =
  | { kind: 'none' }                          // no request → show button
  | { kind: 'pending'; topic: string }        // request pending
  | { kind: 'accepted_no_session' }           // accepted, no session yet
  | { kind: 'session'; session: GuidanceSession }; // session exists

export default function ConversationPage() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Guidance state
  const [guidanceState, setGuidanceState] = useState<GuidanceState>({ kind: 'none' });
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [schedule, setSchedule] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (user && userId) { fetchMessages(); fetchGuidanceState(); }
  }, [user, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── existing message logic — untouched ── */
  const fetchMessages = async () => {
    try {
      const res: any = await apiClient.get(`/alumni/messages/${userId}`);
      const msgs: Message[] = res.data?.messages || [];
      setMessages(msgs);
      if (msgs.length > 0) {
        const partner = msgs[0].sender_id === user?.id ? msgs[0].receiver : msgs[0].sender;
        setPartnerName(`${partner.first_name} ${partner.last_name}`);
      }
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      await apiClient.post('/alumni/messages', { receiverId: userId, message: text.trim() });
      setText(''); fetchMessages();
    } catch (err: any) { alert(err.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  /* ── guidance state detection ── */
  const fetchGuidanceState = async () => {
    try {
      const isAlumni = user?.role === 'alumni';
      const [reqRes, sessRes]: any[] = await Promise.all([
        apiClient.get(isAlumni ? '/guidance/alumni' : '/guidance/student').catch(() => ({ data: { requests: [] } })),
        apiClient.get(isAlumni ? '/guidance/sessions/alumni' : '/guidance/sessions/student').catch(() => ({ data: { sessions: [] } })),
      ]);

      const allRequests: GuidanceRequest[] = reqRes.data?.requests || reqRes.data || [];
      const allSessions: GuidanceSession[] = sessRes.data?.sessions || sessRes.data || [];

      // Find request between these two users
      const req = allRequests.find(r =>
        (r.student_id === userId || r.alumni_id === userId) ||
        (r.student_id === user?.id || r.alumni_id === user?.id)
      );

      // Find session between these two users
      const sess = allSessions.find(s =>
        (s.student_id === userId || s.alumni_id === userId)
      );

      if (sess) {
        setGuidanceState({ kind: 'session', session: sess });
      } else if (req?.status === 'accepted') {
        setGuidanceState({ kind: 'accepted_no_session' });
      } else if (req?.status === 'pending') {
        setGuidanceState({ kind: 'pending', topic: req.topic });
      } else {
        setGuidanceState({ kind: 'none' });
      }
    } catch { setGuidanceState({ kind: 'none' }); }
  };

  /* ── submit guidance request ── */
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !description.trim()) return;
    setSubmitting(true); setModalError('');
    try {
      await apiClient.post('/guidance/request', {
        alumni_id: userId,
        topic: topic.trim(), description: description.trim(),
        ...(duration.trim() && { preferred_duration: duration.trim() }),
        ...(schedule.trim() && { preferred_schedule: schedule.trim() }),
      });
      setShowModal(false); setTopic(''); setDescription(''); setDuration(''); setSchedule('');
      setSuccessToast(true); setTimeout(() => setSuccessToast(false), 3000);
      fetchGuidanceState();
    } catch (err: any) {
      setModalError(err.message || 'Failed to send request');
    } finally { setSubmitting(false); }
  };

  /* ── guidance area UI ── */
  const renderGuidanceArea = () => {
    if (guidanceState.kind === 'none') {
      // Only students can request guidance
      if (user?.role !== 'student') return null;
      return (
        <div className="flex justify-end mb-3">
          <button onClick={() => { setShowModal(true); setModalError(''); }}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl hover:from-purple-600 hover:to-blue-600 transition shadow-sm">
            Request Guidance
          </button>
        </div>
      );
    }
    if (guidanceState.kind === 'pending') {
      return (
        <div className="flex justify-end mb-3">
          <span className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl">
            ⏳ Request Pending — "{guidanceState.topic}"
          </span>
        </div>
      );
    }
    if (guidanceState.kind === 'accepted_no_session') {
      return (
        <div className="flex justify-end mb-3">
          <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 rounded-xl">
            ✓ Accepted — Waiting for alumni to create session
          </span>
        </div>
      );
    }
    if (guidanceState.kind === 'session') {
      const s = guidanceState.session;
      const href = user?.role === 'alumni' ? `/alumni/sessions/${s.id}` : `/student/guidance/${s.id}`;
      const statusColor: Record<string,string> = { pending:'bg-yellow-100 text-yellow-700', active:'bg-green-100 text-green-700', completed:'bg-gray-100 text-gray-600', cancelled:'bg-red-100 text-red-700' };
      return (
        <div className="mb-3 p-3 rounded-xl border border-purple-200 bg-purple-50/60 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-xs truncate">{s.title}</p>
            <p className="text-gray-500 text-xs mt-0.5">{new Date(s.start_date).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[s.status]||'bg-gray-100 text-gray-600'}`}>{s.status}</span>
            <a href={href} className="text-purple-600 hover:text-purple-800 text-xs font-medium underline">View Session</a>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout title={partnerName || 'Conversation'} subtitle="Direct message">
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          Guidance request sent!
        </div>
      )}

      {renderGuidanceArea()}

      <div className="flex flex-col h-[60vh] bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
        {/* Messages — untouched */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Start the conversation!</p>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-white/80 text-gray-800 border border-white/30'}`}>
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input — untouched */}
        <div className="p-4 border-t border-white/20 flex items-center space-x-3">
          <input type="text" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400" />
          <button onClick={handleSend} disabled={sending || !text.trim()}
            className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Request Guidance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Request Guidance</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic <span className="text-red-500">*</span></label>
                <input required value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Jenkins pipelines, Resume review"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="Describe what you need help with..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Duration <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 1 week"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Schedule <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. Weekday evenings"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none" />
              </div>
              {modalError && <p className="text-red-500 text-sm">{modalError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
