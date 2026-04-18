'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Request {
  id: string;
  message: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

interface InboxItem {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender: { id: string; first_name: string; last_name: string };
  receiver: { id: string; first_name: string; last_name: string };
}

interface AlumniProfile {
  id: string;
  headline: string;
  bio: string;
  available_for_mentorship: boolean;
}

export default function AlumniDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'alumni') fetchData();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') return null;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, requestsRes, inboxRes]: any[] = await Promise.all([
        apiClient.get('/alumni/profile/me').catch(() => ({ data: null })),
        apiClient.get('/alumni/mentorship/alumni').catch(() => ({ data: { requests: [] } })),
        apiClient.get('/alumni/messages/inbox').catch(() => ({ data: { inbox: [] } })),
      ]);
      setProfile(profileRes.data || null);
      setRequests(requestsRes.data?.requests || []);
      setInbox(inboxRes.data?.inbox || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string) => {
    try {
      await apiClient.put(`/alumni/mentorship/${requestId}/status`, { status });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeSessions = requests.filter(r => r.status === 'accepted');
  const completedSessions = requests.filter(r => r.status === 'completed');

  const stats = [
    { label: 'Pending Requests', value: pendingRequests.length,   icon: ClockIcon,            bg: 'from-yellow-500/10 to-orange-500/10', href: '/alumni/requests' },
    { label: 'Active Sessions',  value: activeSessions.length,    icon: UsersIcon,            bg: 'from-blue-500/10 to-cyan-500/10',    href: '/alumni/sessions' },
    { label: 'Completed',        value: completedSessions.length, icon: CheckCircleIcon,      bg: 'from-green-500/10 to-emerald-500/10',href: '/alumni/sessions' },
    { label: 'Messages',         value: inbox.length,             icon: ChatBubbleLeftRightIcon, bg: 'from-purple-500/10 to-pink-500/10', href: '/alumni/messages/inbox' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-700 border-blue-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  if (loading) {
    return (
      <DashboardLayout title="Alumni Dashboard" subtitle="Loading...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Alumni Dashboard" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Try Again</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Welcome back, ${user?.firstName}!`} subtitle="Manage your mentorship and connect with students">
      <div className="space-y-8">

        {/* Profile setup prompt */}
        {!profile && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/30 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Complete your alumni profile</p>
              <p className="text-sm text-gray-600">Students can find and request mentorship from you</p>
            </div>
            <button onClick={() => router.push('/alumni/profile')} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition">
              <PencilSquareIcon className="w-4 h-4" />
              <span>Set Up Profile</span>
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer`}
                onClick={() => router.push(stat.href)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-r ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-gray-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Mentorship Requests */}
          <div id="requests" className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Mentorship Requests</h2>
              <span className="text-xs text-gray-500">{requests.length} total</span>
            </div>
            <div className="p-6">
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.slice(0, 5).map(req => (
                    <div key={req.id} className="bg-white/40 rounded-xl p-4 border border-white/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800">{req.profiles?.first_name} {req.profiles?.last_name}</p>
                          <p className="text-sm text-gray-600 truncate">{req.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${statusBadge(req.status)}`}>{req.status}</span>
                          {req.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleStatusUpdate(req.id, 'accepted')} className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition">Accept</button>
                              <button onClick={() => handleStatusUpdate(req.id, 'rejected')} className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition">Reject</button>
                            </div>
                          )}
                          {req.status === 'accepted' && (
                            <button onClick={() => handleStatusUpdate(req.id, 'completed')} className="px-2 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition">Mark Done</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No mentorship requests yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Inbox */}
          <div id="inbox" className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Messages</h2>
              <span className="text-xs text-gray-500">{inbox.length} conversations</span>
            </div>
            <div className="p-6">
              {inbox.length > 0 ? (
                <div className="space-y-3">
                  {inbox.slice(0, 5).map(msg => {
                    const partner = msg.sender_id === user?.id ? msg.receiver : msg.sender;
                    return (
                      <div key={msg.id} onClick={() => router.push(`/alumni/messages/${partner.id}`)}
                        className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 group-hover:text-purple-700 transition">{partner.first_name} {partner.last_name}</p>
                            <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                          </div>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition shrink-0 ml-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Impact panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Your Alumni Impact</h3>
              <p className="text-sm text-gray-600">Making a difference in the TRAINET community</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Mentorship</h4>
              <p className="text-sm text-gray-600">{completedSessions.length > 0 ? `${completedSessions.length} session(s) completed` : 'Accept requests to start mentoring'}</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Availability</h4>
              <p className="text-sm text-gray-600">{profile?.available_for_mentorship ? 'You are open for mentorship requests' : 'You are currently unavailable'}</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Profile</h4>
              <p className="text-sm text-gray-600">{profile?.headline || 'Add a headline to attract students'}</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
