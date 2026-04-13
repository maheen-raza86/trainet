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
} from '@heroicons/react/24/outline';

interface Request {
  id: string;
  message: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
};

export default function AlumniMentorshipPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'alumni') fetchRequests();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') return null;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiClient.get('/alumni/mentorship/alumni');
      setRequests(res.data?.requests || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.put(`/alumni/mentorship/${id}/status`, { status });
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const active = requests.filter(r => r.status === 'accepted');
  const completed = requests.filter(r => r.status === 'completed' || r.status === 'rejected');

  const tabs = [
    { key: 'pending', label: 'Pending', count: pending.length, icon: ClockIcon },
    { key: 'active', label: 'Active Sessions', count: active.length, icon: UsersIcon },
    { key: 'completed', label: 'Completed', count: completed.length, icon: CheckCircleIcon },
  ] as const;

  const displayed = activeTab === 'pending' ? pending : activeTab === 'active' ? active : completed;

  if (loading) {
    return (
      <DashboardLayout title="Mentorship" subtitle="Loading...">
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-24" />)}</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Mentorship" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchRequests} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Try Again</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mentorship" subtitle="Manage your mentorship sessions and requests">
      <div className="space-y-6">

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Request list */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No {activeTab} requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(req => (
              <div key={req.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">
                        {req.profiles?.first_name} {req.profiles?.last_name}
                      </p>
                      <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${STATUS_BADGE[req.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{req.message}"</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                    {req.scheduled_at && (
                      <p className="text-xs text-blue-600 mt-1">Scheduled: {new Date(req.scheduled_at).toLocaleString()}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(req.id, 'accepted')} className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition">Accept</button>
                        <button onClick={() => updateStatus(req.id, 'rejected')} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition">Reject</button>
                      </>
                    )}
                    {req.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => router.push(`/alumni/messages/${req.profiles?.id}`)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
                        >
                          <ChatBubbleLeftRightIcon className="w-3 h-3" />
                          <span>Open Chat</span>
                        </button>
                        <button onClick={() => updateStatus(req.id, 'completed')} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition">Mark Done</button>
                      </>
                    )}
                    {req.status === 'completed' && (
                      <button
                        onClick={() => router.push(`/alumni/messages/${req.profiles?.id}`)}
                        className="flex items-center space-x-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition"
                      >
                        <ChatBubbleLeftRightIcon className="w-3 h-3" />
                        <span>View Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
