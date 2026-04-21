'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  CalendarDaysIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { getSessionStatus, SESSION_STATUS_BADGE, SESSION_STATUS_LABEL } from '@/lib/sessionStatus';

interface Session {
  id: string;
  title: string;
  topic: string;
  status: string;
  start_date: string;
  end_date: string;
  profiles: { id: string; first_name: string; last_name: string };
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export default function AlumniSessionsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'alumni') fetchSessions();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') return null;

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiClient.get('/guidance/sessions/alumni');
      setSessions(res.data?.sessions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Sessions" subtitle="Loading...">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-28" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Sessions" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchSessions} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Sessions" subtitle="All your mentorship sessions">
      <div className="space-y-6">

        {/* Header actions */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/alumni/requests')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-blue-600 transition"
          >
            <UsersIcon className="w-4 h-4" />
            <span>View Requests</span>
          </button>
        </div>

        {/* Session list */}
        {sessions.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30">
            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No sessions yet</p>
            <p className="text-gray-400 text-sm mt-1">Accept guidance requests to create sessions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => router.push(`/alumni/sessions/${session.id}`)}
                className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 cursor-pointer hover:bg-white/80 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800 truncate">{session.title}</p>
                      {/* Always compute status from time — never trust stale DB value */}
                      {(() => {
                        const cs = getSessionStatus(session.start_date, session.end_date);
                        return (
                          <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full border ${SESSION_STATUS_BADGE[cs]}`}>
                            {SESSION_STATUS_LABEL[cs]}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-gray-600">{session.topic}</p>
                    {session.profiles && (
                      <p className="text-sm text-gray-500 mt-1">
                        Student: {session.profiles.first_name} {session.profiles.last_name}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2">
                      {session.start_date && (
                        <span className="text-xs text-gray-400">
                          Start: {new Date(session.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {session.end_date && (
                        <span className="text-xs text-gray-400">
                          End: {new Date(session.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
