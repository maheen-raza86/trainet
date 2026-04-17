'use client';
import Link from 'next/link';
import { BeakerIcon, SparklesIcon, TrophyIcon, ChartBarIcon, DocumentTextIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const FEATURES = [
  { icon:<BeakerIcon className="w-6 h-6"/>,       title:'Create Courses',   desc:'Build course offerings from the catalog with custom duration and outline.',  accent:'#a855f7' },
  { icon:<DocumentTextIcon className="w-6 h-6"/>, title:'Assign Tasks',     desc:'Create assignments and work & practice tasks with deadlines.',                accent:'#8b5cf6' },
  { icon:<SparklesIcon className="w-6 h-6"/>,     title:'Auto Grading',     desc:'AI grades submissions instantly — review and override as needed.',            accent:'#ec4899' },
  { icon:<ChartBarIcon className="w-6 h-6"/>,     title:'View Analytics',   desc:'Track student progress, submission rates, and average grades.',               accent:'#3b82f6' },
  { icon:<TrophyIcon className="w-6 h-6"/>,       title:'Issue Certificates',desc:'Generate QR-verified certificates for eligible students.',                   accent:'#10b981' },
];

export default function TrainerRolePage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<BeakerIcon className="w-8 h-8"/>}
        title="For Trainers"
        subtitle="Powerful tools to teach, evaluate, and inspire"
        accent="from-purple-500 to-pink-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-5 stagger-children">
            {FEATURES.map((f,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(168,85,247,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Start Teaching on TRAINET</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Create courses, manage students, and issue verified certificates.</p>
          <Link href="/signup"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 text-sm"
            style={{boxShadow:'0 0 28px rgba(168,85,247,0.38)'}}>
            Join as Trainer <ArrowRightIcon className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
