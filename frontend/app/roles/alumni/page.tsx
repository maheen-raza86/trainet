'use client';
import Link from 'next/link';
import { UsersIcon, StarIcon, BriefcaseIcon, ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const FEATURES = [
  { icon:<UsersIcon className="w-6 h-6"/>,              title:'Mentorship',      desc:'Accept mentorship requests from students and guide their careers.',                accent:'#10b981' },
  { icon:<StarIcon className="w-6 h-6"/>,               title:'Networking',      desc:'Connect with fellow alumni and expand your professional network.',                 accent:'#34d399' },
  { icon:<BriefcaseIcon className="w-6 h-6"/>,          title:'Career Guidance', desc:'Share your experience and help students navigate their career paths.',             accent:'#059669' },
  { icon:<ChatBubbleLeftRightIcon className="w-6 h-6"/>,title:'Messaging',       desc:'Direct messaging with students and other alumni.',                                 accent:'#6ee7b7' },
];

export default function AlumniRolePage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<UsersIcon className="w-8 h-8"/>}
        title="For Alumni"
        subtitle="Give back, connect, and grow your professional impact"
        accent="from-green-500 to-emerald-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-5 stagger-children">
            {FEATURES.map((f,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-green-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(16,185,129,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Join the Alumni Network</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Mentor the next generation and grow your professional presence.</p>
          <Link href="/signup"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 text-sm"
            style={{boxShadow:'0 0 28px rgba(16,185,129,0.38)'}}>
            Join as Alumni <ArrowRightIcon className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
