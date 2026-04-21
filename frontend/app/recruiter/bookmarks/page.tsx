'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { BookmarkIcon, EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface Bookmark {
  id: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    skills: string;
    bio: string;
  };
}

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    try {
      const res: any = await apiClient.get('/recruiter/bookmarks');
      setBookmarks(res.data?.bookmarks || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (candidateId: string) => {
    try {
      await apiClient.post('/recruiter/bookmark', { candidateId });
      setBookmarks(prev => prev.filter(b => b.profiles?.id !== candidateId));
    } catch { /* ignore */ }
  };

  const sendEmail = (p: Bookmark['profiles']) => {
    const name = `${p.first_name} ${p.last_name}`;
    const subject = encodeURIComponent('TRAINET Opportunity');
    const body = encodeURIComponent(
      `Hello ${name}, I found your profile on TRAINET and would like to connect regarding an opportunity.`
    );
    window.location.href = `mailto:${p.email}?subject=${subject}&body=${body}`;
  };

  return (
    <DashboardLayout title="Shortlisted Candidates" subtitle="Your bookmarked talent">
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-20" />)}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-white/30">
            <BookmarkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No bookmarked candidates yet</p>
            <button onClick={() => router.push('/recruiter/talent')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition">
              Browse Talent Pool
            </button>
          </div>
        ) : (
          bookmarks.map(b => {
            const p = b.profiles;
            return (
              <div key={b.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{p.first_name} {p.last_name}</p>
                    {p.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.skills.split(',').slice(0, 4).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/recruiter/candidate/${p.id}`)}
                      className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                      title="View profile">
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => sendEmail(p)}
                      className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                      title="Send Email">
                      <EnvelopeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeBookmark(p.id)}
                      className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition"
                      title="Remove bookmark">
                      <BookmarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
