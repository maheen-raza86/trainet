'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AlumniProfile {
  id: string;
  headline: string;
  bio: string;
  skills: string;
  available_for_mentorship: boolean;
  linkedin_url: string | null;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

export default function StudentAlumniPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [filtered, setFiltered] = useState<AlumniProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState<AlumniProfile | null>(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAlumni();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      alumni.filter(a =>
        `${a.profiles?.first_name} ${a.profiles?.last_name}`.toLowerCase().includes(q) ||
        (a.headline || '').toLowerCase().includes(q) ||
        (a.skills || '').toLowerCase().includes(q)
      )
    );
  }, [search, alumni]);

  const fetchAlumni = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`);
      const json = await res.json();
      if (json.success) {
        setAlumni(json.data?.alumni || []);
        setFiltered(json.data?.alumni || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!requestModal || !requestMsg.trim()) return;
    try {
      setSending(true);
      await apiClient.post('/alumni/mentorship/request', {
        alumniProfileId: requestModal.id,
        message: requestMsg.trim(),
      });
      setActionMsg({ type: 'success', text: `Mentorship request sent to ${requestModal.profiles?.first_name}!` });
      setRequestModal(null);
      setRequestMsg('');
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to send request' });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title="Alumni Network" subtitle="Connect with alumni for mentorship and career guidance">
      <div className="space-y-6">

        {actionMsg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${actionMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {actionMsg.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
            <span className="text-sm">{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, headline, or skills..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white/60 backdrop-blur-sm"
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{search ? 'No alumni match your search' : 'No alumni profiles yet'}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(a => (
              <div key={a.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 hover:bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{a.profiles?.first_name} {a.profiles?.last_name}</h3>
                    {a.headline && <p className="text-sm text-gray-600 mt-0.5">{a.headline}</p>}
                  </div>
                  {a.available_for_mentorship && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200 shrink-0">Available</span>
                  )}
                </div>

                {a.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{a.bio}</p>}

                {a.skills && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {a.skills.split(',').slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {a.available_for_mentorship && (
                    <button
                      onClick={() => { setRequestModal(a); setRequestMsg(''); }}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-blue-600 transition"
                    >
                      Request Mentorship
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/alumni/messages/${a.profiles?.id}`)}
                    className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                    title="Send message"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Request Mentorship</h2>
            <p className="text-sm text-gray-600 mb-4">
              Sending to <strong>{requestModal.profiles?.first_name} {requestModal.profiles?.last_name}</strong>
              {requestModal.headline && ` · ${requestModal.headline}`}
            </p>
            <textarea
              value={requestMsg}
              onChange={e => setRequestMsg(e.target.value)}
              rows={4}
              placeholder="Introduce yourself and explain what you'd like guidance on..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSendRequest}
                disabled={sending || !requestMsg.trim()}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Request'}
              </button>
              <button onClick={() => setRequestModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
