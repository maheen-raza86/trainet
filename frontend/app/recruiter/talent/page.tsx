'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  MagnifyingGlassIcon, UserCircleIcon, BookmarkIcon,
  StarIcon, TrophyIcon, EnvelopeIcon, AcademicCapIcon,
  FunnelIcon, XMarkIcon,
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

interface Filters {
  skills: string;
  certDateRange: string;
  category: string;
  minScore: string;
  minCertCount: string;
  completedCourse: string;
}

const EMPTY_FILTERS: Filters = {
  skills: '',
  certDateRange: '',
  category: '',
  minScore: '',
  minCertCount: '',
  completedCourse: '',
};

const CERT_DATE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_2_months', label: 'Last 2 months' },
  { value: 'this_year', label: 'This year' },
];

const CATEGORY_SUGGESTIONS = [
  'DevOps', 'Cybersecurity', 'Cloud Computing', 'Machine Learning',
  'Web Development', 'Data Science', 'Networking', 'Python', 'React',
];

export default function TalentPoolPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { fetchCandidates(EMPTY_FILTERS); fetchBookmarks(); }, []);

  const buildParams = (f: Filters) => {
    const params = new URLSearchParams();
    if (f.skills)          params.set('skills', f.skills);
    if (f.certDateRange)   params.set('cert_date_range', f.certDateRange);
    if (f.category)        params.set('category', f.category);
    if (f.minScore)        params.set('min_score', f.minScore);
    if (f.minCertCount)    params.set('min_cert_count', f.minCertCount);
    if (f.completedCourse) params.set('completed_course', f.completedCourse);
    return params.toString();
  };

  const fetchCandidates = async (f: Filters) => {
    try {
      setLoading(true);
      const qs = buildParams(f);
      const res: any = await apiClient.get(`/recruiter/search${qs ? '?' + qs : ''}`);
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

  const handleSearch = () => fetchCandidates(filters);

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    fetchCandidates(EMPTY_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

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

        {/* ── Search & Filter Panel ── */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 space-y-4">

          {/* Primary search row */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.skills}
                onChange={e => setFilters(f => ({ ...f, skills: e.target.value }))}
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
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition ${
                showAdvanced || hasActiveFilters
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-3 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Advanced filters panel */}
          {showAdvanced && (
            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Certification Date Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Certified
                </label>
                <select
                  value={filters.certDateRange}
                  onChange={e => setFilters(f => ({ ...f, certDateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  {CERT_DATE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Category / Specialization */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Specialization
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={filters.category}
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. DevOps, Cybersecurity"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white"
                />
                <datalist id="category-suggestions">
                  {CATEGORY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              {/* Min Average Score */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Min Avg Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))}
                  placeholder="e.g. 70"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white"
                />
              </div>

              {/* Min Certificates */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Min Certificates
                </label>
                <select
                  value={filters.minCertCount}
                  onChange={e => setFilters(f => ({ ...f, minCertCount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  <option value="">Any</option>
                  <option value="1">At least 1</option>
                  <option value="2">At least 2</option>
                  <option value="3">At least 3</option>
                </select>
              </div>

              {/* Completed Course */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Course Completion
                </label>
                <select
                  value={filters.completedCourse}
                  onChange={e => setFilters(f => ({ ...f, completedCourse: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  <option value="">Any</option>
                  <option value="1">Has completed a course</option>
                </select>
              </div>

              {/* Apply button */}
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && candidates.length > 0 && (
          <p className="text-sm text-gray-500">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
            {hasActiveFilters && ' (filtered)'}
          </p>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-44" />)}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No candidates found. Try adjusting your filters.</p>
            <p className="text-gray-400 text-sm mt-1">Students must enable talent pool visibility in their profile settings.</p>
            {hasActiveFilters && (
              <button onClick={handleReset} className="mt-4 text-purple-600 underline text-sm">
                Clear all filters
              </button>
            )}
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
