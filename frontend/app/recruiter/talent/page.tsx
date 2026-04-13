'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  MagnifyingGlassIcon, UserCircleIcon, BookmarkIcon,
  ChatBubbleLeftRightIcon, StarIcon, TrophyIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  skills: string;
  bio: string;
  match_score: number;
  avg_grade: number;
  certificate_count: number;
  wp_submission_count: number;
}

export default function TalentPoolPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState('');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { fetchCandidates(); fetchBookmarks(); }, []);

  const fetchCandidates = async (skills = '', score = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (skills) params.set('skills', skills);
      if (score) params.set('min_score', score);
      const res: any = await apiClient.get(`/recruiter/search?${params}`);
      setCandidates(res.data?.candidates || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res: any = await apiClient.get('/recruiter/bookmarks');
      const ids = new Set<string>((res.data?.bookmarks || []).map((b: any) => b.profiles?.id));
      setBookmarked(ids);
    } catch { /* ignore */ }
  };

  const handleSearch = () => fetchCandidates(search, minScore);

  const handleBookmark = async (candidateId: string) => {
    try {
      const res: any = await apiClient.post('/recruiter/bookmark', { candidateId });
      const isNowBookmarked = res.data?.bookmarked;
      setBookmarked(prev => {
        const next = new Set(prev);
        isNowBookmarked ? next.add(candidateId) : next.delete(candidateId);
        return next;
      });
      setActionMsg(isNowBookmarked ? 'Candidate bookmarked' : 'Bookmark removed');
      setTimeout(() => setActionMsg(''), 2000);
    } catch { /* ignore */ }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <DashboardLayout title="Talent Pool" subtitle="Search and discover top candidates">
      <div className="space-y-6">

        {actionMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{actionMsg}</div>
        )}

        {/* Search bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by skills (e.g. Python, React)"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white/60"
            />
          </div>
          <input
            type="number"
            value={minScore}
            onChange={e => setMinScore(e.target.value)}
            placeholder="Min grade (0-100)"
            className="w-40 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white/60"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium"
          >
            Search
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-48" />)}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No candidates found. Try different search terms.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map(c => (
              <div key={c.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 hover:bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{c.first_name} {c.last_name}</h3>
                    {c.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.bio}</p>}
                  </div>
                  <div className={`flex items-center gap-0.5 font-bold text-sm ${scoreColor(c.match_score)}`}>
                    <StarIcon className="w-4 h-4 fill-current" />
                    {c.match_score}%
                  </div>
                </div>

                {c.skills && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.skills.split(',').slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>Avg grade: <strong className="text-gray-700">{c.avg_grade || 0}%</strong></span>
                  <span className="flex items-center gap-0.5">
                    <TrophyIcon className="w-3 h-3" />{c.certificate_count} cert{c.certificate_count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/recruiter/candidate/${c.id}`)}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-xl hover:from-purple-600 hover:to-blue-600 transition"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleBookmark(c.id)}
                    className={`p-2 rounded-xl border transition ${bookmarked.has(c.id) ? 'bg-purple-100 border-purple-200 text-purple-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    title={bookmarked.has(c.id) ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {bookmarked.has(c.id) ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => router.push(`/recruiter/messages/${c.id}`)}
                    className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition"
                    title="Message"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
