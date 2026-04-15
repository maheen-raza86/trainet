'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AlumniPublicPage() {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
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
      const res = await fetch(`${API}/public/stats`);
      const json = await res.json();
      setAlumni(json.data?.alumni || []);
      setFiltered(json.data?.alumni || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back to Home</Link>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-2">Alumni Network</h1>
          <p className="text-white/60 mb-8">Connect with TRAINET graduates for mentorship and career guidance</p>

          <div className="relative mb-8">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, headline, or skills..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50" />
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="bg-white/5 rounded-2xl h-40 animate-pulse" />)}</div>
          ) : filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(a => (
                <Link key={a.id} href={`/alumni/${a.id}`}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                      {a.profiles?.first_name?.[0]}{a.profiles?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-purple-300 transition-colors">{a.profiles?.first_name} {a.profiles?.last_name}</p>
                      {a.headline && <p className="text-white/50 text-xs">{a.headline}</p>}
                    </div>
                  </div>
                  {a.skills && (
                    <div className="flex flex-wrap gap-1">
                      {a.skills.split(',').slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  {a.available_for_mentorship && (
                    <span className="inline-block mt-3 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">Available for mentorship</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <UsersIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">{search ? 'No alumni match your search' : 'No alumni profiles yet'}</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105">
              Join as Alumni
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
