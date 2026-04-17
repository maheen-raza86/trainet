'use client';
import Link from 'next/link';
import { UsersIcon, ChatBubbleLeftRightIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

export default function AlumniMentorshipPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<UsersIcon className="w-8 h-8"/>}
        title="Alumni Mentorship Network"
        subtitle="Connect with industry professionals who've walked the same path"
        accent="from-orange-500 to-amber-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-10 stagger-children">
            {[
              {icon:<UsersIcon className="w-6 h-6"/>,              title:'Alumni Profiles',    desc:'Browse verified alumni with skills, experience, and availability status.',accent:'#f97316'},
              {icon:<ChatBubbleLeftRightIcon className="w-6 h-6"/>,title:'Mentorship Sessions',desc:'Request sessions, get accepted, and chat directly with your mentor.',accent:'#fb923c'},
              {icon:<StarIcon className="w-6 h-6"/>,               title:'Career Guidance',    desc:'Get real-world advice on career transitions, interviews, and skill building.',accent:'#f59e0b'},
            ].map((c,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-orange-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(249,115,22,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10 space-y-5">
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">How Mentorship Works</h2>
            <div className="space-y-2 text-white/65 text-sm leading-relaxed">
              <p>1. Browse alumni profiles filtered by skills and availability.</p>
              <p>2. Send a mentorship request with your goals and questions.</p>
              <p>3. Alumni accepts or rejects — you get notified instantly.</p>
              <p>4. Chat directly, schedule sessions, and track progress.</p>
            </div>
          </div>
          <div className="text-center pt-4 reveal">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup"
                className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-bold hover:from-orange-600 hover:to-amber-600 transition-all hover:scale-105 text-sm"
                style={{boxShadow:'0 0 28px rgba(249,115,22,0.38)'}}>
                Find a Mentor <ArrowRightIcon className="w-4 h-4"/>
              </Link>
              <Link href="/alumni"
                className="inline-flex items-center gap-2 px-8 py-4 border text-white rounded-full font-bold hover:bg-white/5 transition-all text-sm"
                style={{borderColor:'rgba(255,255,255,0.15)'}}>
                Browse Alumni
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
