'use client';
import Link from 'next/link';
import { BriefcaseIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

export default function RecruiterPublicPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<BriefcaseIcon className="w-8 h-8"/>}
        title="Recruiter Access"
        subtitle="Access the full talent pool, AI matching, and candidate profiles"
        accent="from-indigo-500 to-purple-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-slate-600 text-base leading-relaxed mb-10 reveal">
            Sign up as a recruiter to access the full TRAINET talent pool — search by skills, view AI match scores, browse verified certificates, and message candidates directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center reveal">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105 text-sm cursor-pointer"
              style={{boxShadow:'0 8px 24px rgba(99,102,241,0.35)'}}>
              Sign Up as Recruiter <ArrowRightIcon className="w-4 h-4"/>
            </Link>
            <Link href="/talent-pool"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-full font-bold hover:border-purple-400 hover:text-purple-700 transition-all text-sm cursor-pointer">
              Preview Talent Pool
            </Link>
          </div>
        </div>
      </section>
      <WaveDivider fromDark={false} toDark={true}/>
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(99,102,241,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10">
          <div className="grid md:grid-cols-3 gap-5 stagger-children">
            {[
              {label:'Skill Match',      pct:'50%', desc:'Overlap between required skills and candidate profile'},
              {label:'Project Relevance',pct:'30%', desc:'Work & Practice submissions and project quality'},
              {label:'Performance',      pct:'20%', desc:'Average grade across all graded assignments'},
            ].map((m,i)=>(
              <div key={i} className="reveal rounded-2xl p-5 border text-center"
                style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1">{m.pct}</p>
                <p className="text-white font-semibold text-sm mb-1">{m.label}</p>
                <p className="text-white/45 text-xs">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
