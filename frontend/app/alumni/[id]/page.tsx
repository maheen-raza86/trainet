'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import PublicLayout, { WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AlumniDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/public/alumni/${id}`)
      .then(r => r.json())
      .then(j => { if (j.success) setProfile(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07071a' }}>
      <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white/60 mb-4">Alumni profile not found</p>
          <Link href="/alumni" className="text-purple-400 hover:text-purple-300 transition-colors">← Back to Alumni</Link>
        </div>
      </div>
    </PublicLayout>
  );

  const avatarSrc = profile.profiles?.profile_picture_url || profile.profiles?.avatar_url || null;
  const firstName = profile.profiles?.first_name || '';
  const lastName  = profile.profiles?.last_name  || '';
  const hasLinks  = profile.linkedin_url || profile.portfolio_url;

  return (
    <PublicLayout>
      {/* ── Hero — dark ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden" style={{ background: '#07071a' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.035) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="container mx-auto max-w-3xl relative z-10">
          <Link href="/alumni" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm cursor-pointer">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Alumni
          </Link>
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 overflow-hidden"
              style={{ boxShadow: '0 0 28px rgba(139,92,246,0.45)' }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
              ) : (
                <>{firstName[0]}{lastName[0]}</>
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">{firstName} {lastName}</h1>
              {profile.headline && <p className="text-white/55 mt-1">{profile.headline}</p>}
              {profile.available_for_mentorship && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-500/15 text-green-400 text-xs rounded-full border border-green-500/25">
                  <CheckCircleIcon className="w-3 h-3" /> Available for mentorship
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <AngleDivider fromDark={true} toDark={false} />

      {/* ── Profile content — light ── */}
      <section className="py-16 px-6" style={{ background: '#f6f3ef' }}>
        <div className="container mx-auto max-w-3xl space-y-5">

          {/* Bio */}
          {profile.bio && (
            <div className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all">
              <h2 className="text-lg font-black text-slate-900 mb-3">About</h2>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && (
            <div className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all">
              <h2 className="text-lg font-black text-slate-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(',').map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">{s.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {profile.experience && (
            <div className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all">
              <h2 className="text-lg font-black text-slate-900 mb-3">Experience</h2>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{profile.experience}</p>
            </div>
          )}

          {/* Achievements */}
          {profile.achievements && (
            <div className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all">
              <h2 className="text-lg font-black text-slate-900 mb-3">Achievements</h2>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{profile.achievements}</p>
            </div>
          )}

          {/* Links */}
          {hasLinks && (
            <div className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all">
              <h2 className="text-lg font-black text-slate-900 mb-3">Links</h2>
              <div className="space-y-3">
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">LinkedIn — {profile.linkedin_url}</span>
                  </a>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                  >
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">Portfolio — {profile.portfolio_url}</span>
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      <WaveDivider fromDark={false} toDark={true} />

      {/* ── CTA — dark ── */}
      <section className="py-16 px-6 relative" style={{ background: '#07071a' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,0.08) 0%,transparent 70%)' }} />
        <div className="container mx-auto max-w-md text-center relative z-10 reveal">
          <p className="text-white/55 mb-5">Want to connect with {firstName}?</p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 text-sm cursor-pointer"
            style={{ boxShadow: '0 0 20px rgba(139,92,246,0.35)' }}>
            <ChatBubbleLeftRightIcon className="w-5 h-5" /> Sign up to Request Mentorship
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
