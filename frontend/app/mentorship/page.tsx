'use client';
import Link from 'next/link';
import { UsersIcon, ChatBubbleLeftRightIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const STEPS = [
  { icon:<UsersIcon className="w-6 h-6"/>,              title:'Find a Mentor',   desc:'Browse alumni by skills and availability. Send a request with your goals.',          accent:'#8b5cf6' },
  { icon:<ChatBubbleLeftRightIcon className="w-6 h-6"/>,title:'Direct Messaging',desc:'Once accepted, chat directly with your mentor on the platform.',                      accent:'#3b82f6' },
  { icon:<StarIcon className="w-6 h-6"/>,               title:'Career Growth',   desc:'Get guidance on interviews, career transitions, and skill development.',              accent:'#10b981' },
];

export default function MentorshipPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<UsersIcon className="w-8 h-8"/>}
        title="Mentorship Program"
        subtitle="Connect students with experienced alumni for career guidance"
        accent="from-purple-500 to-blue-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {STEPS.map((s,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
                style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{background:`${s.accent}18`,color:s.accent}}>{s.icon}</div>
                <h3 className="text-slate-900 font-bold mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider fromDark={false} toDark={true}/>
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Find Your Mentor Today</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Sign up and browse the alumni network to request mentorship.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 text-sm"
              style={{boxShadow:'0 0 28px rgba(139,92,246,0.38)'}}>
              Get Started <ArrowRightIcon className="w-4 h-4"/>
            </Link>
            <Link href="/alumni"
              className="inline-flex items-center gap-2 px-8 py-4 border text-white rounded-full font-bold hover:bg-white/5 transition-all text-sm"
              style={{borderColor:'rgba(255,255,255,0.15)'}}>
              Browse Alumni
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
