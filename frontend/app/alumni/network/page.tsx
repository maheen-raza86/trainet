'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { MagnifyingGlassIcon, UserCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface AlumniProfile {
  id: string;
  headline: string;
  bio: string;
  skills: string;
  available_for_mentorship: boolean;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

export default function AlumniNetworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [filtered, setFiltered] = useState<AlumniProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAlumni(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(alumni.filter(a =>
      `${a.profiles?.first_name} ${a.profiles?.last_name}`.toLowerCase().includes(q) ||
      (a.headline || '').toLowerCase().includes(q) ||
      (a.skills || '').toLowerCase().includes(q)
    ));
  }, [search, alumni]);

  const fetchAlumni = async () => {
    try {
      const res: any = await apiClient.get('/alumni');
      const all: AlumniProfile[] = res.data?.alumni || [];
      // Exclude self
      const others = all.filter(a => a.profiles?.id !== user?.id);
      setAlumni(others);
      setFiltered(others);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Alumni Network" subtitle="Connect with fellow alumni">
      <div className="space-y-6">

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, headline, or skills..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 bg-white/60 backdrop-blur-sm"
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{search ? 'No alumni match your search' : 'No other alumni profiles yet'}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(a => (
              <div key={a.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 hover:bg-white/80 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{a.profiles?.first_name} {a.profiles?.last_name}</h3>
                    {a.headline && <p className="text-sm text-gray-600 mt-0.5">{a.headline}</p>}
                  </div>
                  {a.available_for_mentorship && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200 shrink-0">Available</span>
                  )}
                </div>
                {a.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{a.bio}</p>}
                {a.skills && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {a.skills.split(',').slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => router.push(`/alumni/messages/${a.profiles?.id}`)}
                  className="w-full flex items-center justify-center space-x-2 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
