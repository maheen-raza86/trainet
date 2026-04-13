'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  UsersIcon, BookmarkIcon, ChatBubbleLeftRightIcon, SparklesIcon,
  ExclamationTriangleIcon, ArrowRightIcon, StarIcon,
} from '@heroicons/react/24/outline';

interface Candidate { id: string; first_name: string; last_name: string; skills: string; match_score: number; avg_grade: number; certificate_count: number; }
interface InboxItem { id: string; message: string; created_at: string; sender_id: string; receiver_id: string; sender: { id: string; first_name: string; last_name: string }; receiver: { id: string; first_name: string; last_name: string }; }

export default function RecruiterDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
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
      const [searchRes, bookmarksRes, inboxRes]: any[] = await Promise.all([
        apiClient.get('/recruiter/search').catch(() => ({ data: { candidates: [] } })),
        apiClient.get('/recruiter/bookmarks').catch(() => ({ data: { bookmarks: [] } })),
        apiClient.get('/recruiter/messages/inbox').catch(() => ({ data: { inbox: [] } })),
      ]);
      setTopCandidates((searchRes.data?.candidates || []).slice(0, 5));
      setBookmarks(bookmarksRes.data?.bookmarks || []);
      setInbox(inboxRes.data?.inbox || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Candidates', value: topCandidates.length, icon: UsersIcon, bg: 'from-blue-500/10 to-cyan-500/10', href: '/recruiter/talent' },
    { label: 'Shortlisted', value: bookmarks.length, icon: BookmarkIcon, bg: 'from-purple-500/10 to-pink-500/10', href: '/recruiter/bookmarks' },
    { label: 'Messages', value: inbox.length, icon: ChatBubbleLeftRightIcon, bg: 'from-green-500/10 to-emerald-500/10', href: '/recruiter/messages/inbox' },
    { label: 'Top Matches', value: topCandidates.filter(c => c.match_score >= 70).length, icon: SparklesIcon, bg: 'from-yellow-500/10 to-orange-500/10', href: '/recruiter/talent' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Recruiter Dashboard" subtitle="Loading...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-24" />)}
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Matches */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Top Matches</h2>
              <button onClick={() => router.push('/recruiter/talent')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
            </div>
            <div className="p-6">
              {topCandidates.length > 0 ? (
                <div className="space-y-3">
                  {topCandidates.map(c => (
                    <div key={c.id} onClick={() => router.push(`/recruiter/candidate/${c.id}`)}
                      className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 group-hover:text-purple-700 transition">{c.first_name} {c.last_name}</p>
                            <span className="flex items-center gap-0.5 text-xs text-yellow-600 font-medium">
                              <StarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />{c.match_score}%
                            </span>
                          </div>
                          {c.skills && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.skills.split(',').slice(0, 3).map((s, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No candidates yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Messages</h2>
              <button onClick={() => router.push('/recruiter/messages/inbox')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
            </div>
            <div className="p-6">
              {inbox.length > 0 ? (
                <div className="space-y-3">
                  {inbox.slice(0, 5).map(msg => {
                    const partner = msg.sender_id === user?.id ? msg.receiver : msg.sender;
                    return (
                      <div key={msg.id} onClick={() => router.push(`/recruiter/messages/${partner.id}`)}
                        className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 group-hover:text-purple-700 transition">{partner.first_name} {partner.last_name}</p>
                            <p className="text-sm text-gray-500 truncate">{msg.message}</p>
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

        {/* AI Matching Panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">AI Talent Matching</h3>
              <p className="text-sm text-gray-600">Candidates scored by skill match, project relevance, and performance</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Skill Match (50%)</h4>
              <p className="text-sm text-gray-600">Candidates matched against your required skills</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Project Relevance (30%)</h4>
              <p className="text-sm text-gray-600">Based on work & practice submissions</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Performance (20%)</h4>
              <p className="text-sm text-gray-600">Average grade across all graded submissions</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
