'use client';
import Link from 'next/link';
import { BeakerIcon, SparklesIcon, UsersIcon, BriefcaseIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

export default function WorkPracticePage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<BeakerIcon className="w-8 h-8"/>}
        title="Work & Practice"
        subtitle="Real-world industry challenges that build practical, job-ready skills"
        accent="from-blue-500 to-cyan-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-10 stagger-children">
            {[
              {icon:<BriefcaseIcon className="w-6 h-6"/>,title:'Real-World Tasks',  desc:'Tasks mirror actual industry challenges — not textbook exercises.',accent:'#3b82f6'},
              {icon:<UsersIcon className="w-6 h-6"/>,    title:'Peer Collaboration',desc:'Work alongside peers on shared challenges and compare approaches.',accent:'#0ea5e9'},
              {icon:<SparklesIcon className="w-6 h-6"/>, title:'AI Evaluation',     desc:'Submissions are auto-evaluated with detailed AI feedback and scores.',accent:'#06b6d4'},
            ].map((c,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
                style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{background:`${c.accent}18`,color:c.accent}}>{c.icon}</div>
                <h3 className="text-slate-900 font-bold mb-2">{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider fromDark={false} toDark={true}/>
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(59,130,246,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10 space-y-5">
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">How It Works</h2>
            <div className="space-y-2 text-white/65 text-sm leading-relaxed">
              <p>1. Trainers create practice tasks linked to course offerings with real-world context.</p>
              <p>2. Students submit solutions (code, documents, or text) before the deadline.</p>
              <p>3. AI evaluates submissions for quality, completeness, and plagiarism.</p>
              <p>4. Trainers can override AI grades and provide additional feedback.</p>
              <p>5. Performance feeds into the student's skill profile for AI recommendations.</p>
            </div>
          </div>
          <div className="text-center pt-4 reveal">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105 text-sm"
              style={{boxShadow:'0 0 28px rgba(59,130,246,0.38)'}}>
              Get Started <ArrowRightIcon className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
