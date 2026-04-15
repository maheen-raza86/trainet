'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AlumniDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlumni();
  }, [id]);

  const fetchAlumni = async () => {
    try {
      const res = await fetch(`${API}/public/stats`);
      const json = await res.json();
      const all = json.data?.alumni || [];
      setAlumni(all);
      const found = all.find((a: any) => a.id === id);
      setProfile(found || null);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Alumni profile not found</p>
          <Link href="/alumni" className="text-purple-400 hover:text-purple-300">← Back to Alumni</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link href="/alumni" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back to Alumni</Link>

        {/* Profile header */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0">
              {profile.profiles?.first_name?.[0]}{profile.profiles?.last_name?.[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white">{profile.profiles?.first_name} {profile.profiles?.last_name}</h1>
              {profile.headline && <p className="text-white/60 mt-1">{profile.headline}</p>}
              {profile.available_for_mentorship && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  <CheckCircleIcon className="w-3 h-3" />Available for mentorship
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">About</h2>
            <p className="text-white/70 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {profile.skills && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.split(',').map((s: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30">{s.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Experience</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-line">{profile.experience}</p>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Achievements</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-line">{profile.achievements}</p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20 text-center">
          <p className="text-white/70 mb-4">Want to connect with {profile.profiles?.first_name}?</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Sign up to Request Mentorship
          </Link>
        </div>
      </div>
    </div>
  );
}
