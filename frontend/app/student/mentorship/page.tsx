'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface Request {
  id: string;
  message: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  alumni_profiles: {
    id: string;
    headline: string;
    profiles: { id: string; first_name: string; last_name: string };
  };
}

export default function StudentMentorshipPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      const res: any = await apiClient.get('/alumni/mentorship/student');
      setRequests(res.data?.requests || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-700 border-blue-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <DashboardLayout title="My Mentorship Requests" subtitle="Track your mentorship requests and sessions">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => router.push('/student/alumni')} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition">
            Browse Alumni
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-20"></div>)}</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-white/30">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No mentorship requests yet</p>
            <button onClick={() => router.push('/student/alumni')} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition">
              Find an Alumni Mentor
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const alumni = req.alumni_profiles;
              return (
                <div key={req.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{alumni?.profiles?.first_name} {alumni?.profiles?.last_name}</p>
                      {alumni?.headline && <p className="text-sm text-gray-600">{alumni.headline}</p>}
                      <p className="text-sm text-gray-500 mt-2 italic">"{req.message}"</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                      {req.scheduled_at && (
                        <p className="text-xs text-blue-600 mt-1">Scheduled: {new Date(req.scheduled_at).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-3 py-1 text-xs rounded-full border capitalize ${statusBadge(req.status)}`}>{req.status}</span>
                      {req.status === 'accepted' && alumni?.profiles?.id && (
                        <button
                          onClick={() => router.push(`/alumni/messages/${alumni.profiles.id}`)}
                          className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700"
                        >
                          <ChatBubbleLeftRightIcon className="w-3 h-3" />
                          <span>Message</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
