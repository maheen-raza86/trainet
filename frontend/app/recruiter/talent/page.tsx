'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  MagnifyingGlassIcon, UserCircleIcon, BookmarkIcon,
  StarIcon, TrophyIcon, EnvelopeIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  skills: string;
  match_score: number;
  avg_grade: number;
  certificate_count: number;
  wp_submission_count: number;
}

export default function TalentPoolPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { fetchCandidates(); fetchBookmarks(); }, []);

  const fetchCandidates = async (skills = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (skills) params.set('skills', skills);
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

  const handleSearch = () => fetchCandidates(skillSearch);

  const handleBookmark = async (candidateId: string) => {
    try {
      const res: any = await apiClient.post('/recruiter/bookmark', { candidateId });
      const isNow = res.data?.bookmarked;
      setBookmarked(prev => {
        const next = new Set(prev);
        isNow ? next.add(candidateId) : next.delete(candidateId);
        return next;
      });
      setActionMsg(isNow ? 'Candidate bookmarked' : 'Bookmark removed');
      setTimeout(() => setActionMsg(''), 2000);
    } catch { /* ignore */ }
  };

  const sendEmail = (c: Candidate) => {
    const name = `${c.first_name} ${c.last_name}`;
    const subject = encodeURIComponent('TRAINET Opportunity');
    const body = encodeURIComponent(
      `Hello ${name}, I found your profile on TRAINET and would like to connect regarding an opportunity.`
    );
    window.location.href = `mailto:${c.email}?subject=${subject}&body=${body}`;
  };

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-gray-500';

  return (
    <DashboardLayout title="Talent Pool" subtitle="Search and discover top candidates">
      <div className="space-y-6">

        {actionMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{actionMsg}</div>
        )}

        {/* Search / Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={skillSearch}
              onChange={e => setSkillSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by skills (e.g. Python, React)"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white/60"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium"
          >
            Search
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-44" />)}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No candidates found. Try different search terms.</p>
            <p className="text-gray-400 text-sm mt-1">Students must enable talent pool visibility in their profile settings.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map(c => (
              <div key={c.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Name + match */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-800">{c.first_name} {c.last_name}</h3>
                  <span className={`flex items-center gap-0.5 font-bold text-sm shrink-0 ml-2 ${scoreColor(c.match_score)}`}>
                    <StarIcon className="w-4 h-4 fill-current" />
                    {c.match_score}%
                  </span>
                </div>

                {/* Skills */}
                {c.skills && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.skills.split(',').slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>Avg grade: <strong className="text-gray-700">{c.avg_grade || 0}%</strong></span>
                  <span className="flex items-center gap-0.5">
                    <TrophyIcon className="w-3 h-3" />{c.certificate_count} cert{c.certificate_count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <AcademicCapIcon className="w-3 h-3" />{c.wp_submission_count} project{c.wp_submission_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => router.push(`/recruiter/candidate/${c.id}`)}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-xl hover:from-purple-600 hover:to-blue-600 transition">
                    View Profile
                  </button>
                  <button
                    onClick={() => handleBookmark(c.id)}
                    className={`p-2 rounded-xl border transition ${bookmarked.has(c.id) ? 'bg-purple-100 border-purple-200 text-purple-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    title={bookmarked.has(c.id) ? 'Remove bookmark' : 'Bookmark'}>
                    {bookmarked.has(c.id) ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => sendEmail(c)}
                    className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition"
                    title="Send Email">
                    <EnvelopeIcon className="w-4 h-4" />
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
