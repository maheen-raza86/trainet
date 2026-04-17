'use client';
import Link from 'next/link';
import { BriefcaseIcon, SparklesIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, BookmarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const FEATURES = [
  { icon:<MagnifyingGlassIcon className="w-6 h-6"/>,    title:'Talent Search',     desc:'Search candidates by skills, performance scores, and certifications.',  accent:'#f97316' },
  { icon:<SparklesIcon className="w-6 h-6"/>,           title:'AI Matching',        desc:'Candidates ranked by skill match, project relevance, and grades.',      accent:'#ef4444' },
  { icon:<BriefcaseIcon className="w-6 h-6"/>,          title:'Candidate Profiles', desc:'View full profiles: skills, courses, certificates, work submissions.',   accent:'#f59e0b' },
  { icon:<ChatBubbleLeftRightIcon className="w-6 h-6"/>,title:'Messaging',          desc:'Message candidates directly from the platform.',                         accent:'#fb923c' },
  { icon:<BookmarkIcon className="w-6 h-6"/>,           title:'Shortlist',          desc:'Bookmark top candidates and manage your hiring pipeline.',               accent:'#fbbf24' },
];

export default function RecruiterRolePage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<BriefcaseIcon className="w-8 h-8"/>}
        title="For Recruiters"
        subtitle="Find verified, skilled talent with AI-powered matching"
        accent="from-orange-500 to-red-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-5 stagger-children">
            {FEATURES.map((f,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-orange-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
                style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{background:`${f.accent}18`,color:f.accent}}>{f.icon}</div>
                <h3 className="text-slate-900 font-bold mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider fromDark={false} toDark={true}/>
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(249,115,22,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Access the Full Talent Pool</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Sign up to search, filter, and connect with verified TRAINET graduates.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold hover:from-orange-600 hover:to-red-600 transition-all hover:scale-105 text-sm"
              style={{boxShadow:'0 0 28px rgba(249,115,22,0.38)'}}>
              Join as Recruiter <ArrowRightIcon className="w-4 h-4"/>
            </Link>
            <Link href="/talent-pool"
              className="inline-flex items-center gap-2 px-8 py-4 border text-white rounded-full font-bold hover:bg-white/5 transition-all text-sm"
              style={{borderColor:'rgba(255,255,255,0.15)'}}>
              Preview Talent Pool
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
