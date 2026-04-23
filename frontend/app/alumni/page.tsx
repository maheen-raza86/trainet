'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UsersIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AlumniPublicPage() {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/public/stats`)
      .then(r => r.json())
      .then(j => { if (j.success) setAlumni(j.data?.alumni || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <PageHero
        icon={<UsersIcon className="w-8 h-8"/>}
        title="Alumni Network"
        subtitle="Connect with TRAINET graduates for mentorship and career guidance"
        accent="from-purple-500 to-blue-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>

      {/* Grid — light */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-5xl">
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="bg-slate-200 rounded-2xl h-40 animate-pulse"/>)}
            </div>
          ) : alumni.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {alumni.map(a => (
                <Link key={a.id} href={`/alumni/${a.id}`}
                  className="reveal group bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
                      style={{boxShadow:'0 0 14px rgba(139,92,246,0.30)'}}>
                      {a.profiles?.profile_picture_url || a.profiles?.avatar_url ? (
                        <img src={a.profiles.profile_picture_url || a.profiles.avatar_url} alt="" className="w-full h-full object-cover"/>
                      ) : (
                        <>{a.profiles?.first_name?.[0]}{a.profiles?.last_name?.[0]}</>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        {a.profiles?.first_name} {a.profiles?.last_name}
                      </p>
                      {a.headline && <p className="text-slate-500 text-xs">{a.headline}</p>}
                    </div>
                  </div>
                  {a.skills && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {a.skills.split(',').slice(0,3).map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  {a.available_for_mentorship && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Available for mentorship</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <UsersIcon className="w-14 h-14 text-slate-300 mx-auto mb-4"/>
              <p className="text-slate-400">No alumni profiles yet</p>
            </div>
          )}
        </div>
      </section>

      <WaveDivider fromDark={false} toDark={true}/>

      {/* CTA — dark */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Are You a TRAINET Graduate?</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Join the alumni network and start mentoring the next generation.</p>
          <Link href="/signup"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 text-sm"
            style={{boxShadow:'0 0 28px rgba(139,92,246,0.38)'}}>
            Join as Alumni <ArrowRightIcon className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
