'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  UsersIcon, BookmarkIcon, ExclamationTriangleIcon,
  StarIcon, EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  skills: string;
  match_score: number;
  avg_grade: number;
  certificate_count: number;
}

export default function RecruiterDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'recruiter') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'recruiter') fetchData();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'recruiter') return null;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [searchRes, bookmarksRes]: any[] = await Promise.all([
        apiClient.get('/recruiter/search').catch(() => ({ data: { candidates: [] } })),
        apiClient.get('/recruiter/bookmarks').catch(() => ({ data: { bookmarks: [] } })),
      ]);
      const candidates: Candidate[] = searchRes.data?.candidates || [];
      setCandidateCount(candidates.length);
      setTopCandidates(candidates.slice(0, 3));
      setBookmarkCount((bookmarksRes.data?.bookmarks || []).length);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = (candidate: Candidate) => {
    const name = `${candidate.first_name} ${candidate.last_name}`;
    const subject = encodeURIComponent('TRAINET Opportunity');
    const body = encodeURIComponent(
      `Hello ${name}, I found your profile on TRAINET and would like to connect regarding an opportunity.`
    );
    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
  };

  const stats = [
    { label: 'Candidates Available', value: candidateCount, icon: UsersIcon, bg: 'from-blue-500/10 to-cyan-500/10', href: '/recruiter/talent' },
    { label: 'Bookmarked Candidates', value: bookmarkCount, icon: BookmarkIcon, bg: 'from-purple-500/10 to-pink-500/10', href: '/recruiter/bookmarks' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Recruiter Dashboard" subtitle="Loading...">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-24" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Recruiter Dashboard" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Try Again</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Welcome back, ${user?.firstName}!`} subtitle="Find the perfect talent for your organization">
      <div className="space-y-8">

        {/* Stats — 2 cards only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} onClick={() => router.push(stat.href)}
                className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
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

        {/* Recommended Candidates */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          <div className="p-6 border-b border-white/20 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Recommended Candidates</h2>
            <button onClick={() => router.push('/recruiter/talent')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View All
            </button>
          </div>
          <div className="p-6">
            {topCandidates.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No candidates available yet.</p>
                <p className="text-gray-400 text-xs mt-1">Students must enable "Allow recruiters to view my profile" in their settings.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCandidates.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">{c.first_name} {c.last_name}</p>
                        <span className="flex items-center gap-0.5 text-xs font-medium text-yellow-600">
                          <StarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {c.match_score}%
                        </span>
                      </div>
                      {c.skills && (
                        <div className="flex flex-wrap gap-1">
                          {c.skills.split(',').slice(0, 3).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => router.push(`/recruiter/candidate/${c.id}`)}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-lg hover:from-purple-600 hover:to-blue-600 transition">
                        View Profile
                      </button>
                      <button
                        onClick={() => sendEmail(c)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition">
                        <EnvelopeIcon className="w-3.5 h-3.5" />
                        Send Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
