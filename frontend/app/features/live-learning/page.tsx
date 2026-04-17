'use client';
import Link from 'next/link';
import { AcademicCapIcon, DocumentTextIcon, ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

export default function LiveLearningPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<AcademicCapIcon className="w-8 h-8"/>}
        title="Live Sessions & Learning"
        subtitle="Structured courses with live sessions, assignments, and real-time progress tracking"
        accent="from-rose-500 to-pink-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-10 stagger-children">
            {[
              {icon:<AcademicCapIcon className="w-6 h-6"/>, title:'Course Structure',  desc:'Organized offerings with materials, assignments, and live session links.',accent:'#f43f5e'},
              {icon:<DocumentTextIcon className="w-6 h-6"/>,title:'Assignments',        desc:'Deadline-enforced assignments with AI auto-grading and trainer review.',accent:'#ec4899'},
              {icon:<ChartBarIcon className="w-6 h-6"/>,    title:'Progress Tracking',  desc:'Real-time progress calculated from submissions and grades.',accent:'#db2777'},
            ].map((c,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-rose-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(244,63,94,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10 space-y-5">
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">Learning Flow</h2>
            <div className="space-y-2 text-white/65 text-sm leading-relaxed">
              <p>1. Enroll via QR code → access course materials and assignments.</p>
              <p>2. Attend live sessions via Google Meet / Zoom links provided by trainer.</p>
              <p>3. Submit assignments before deadlines — AI grades instantly.</p>
              <p>4. Progress updates automatically based on submissions and grades.</p>
              <p>5. Earn certificate when completion threshold is reached.</p>
            </div>
          </div>
          <div className="text-center pt-4 reveal">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:from-rose-600 hover:to-pink-600 transition-all hover:scale-105 text-sm"
              style={{boxShadow:'0 0 28px rgba(244,63,94,0.38)'}}>
              Start Learning <ArrowRightIcon className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
