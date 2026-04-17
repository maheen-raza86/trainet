'use client';
import Link from 'next/link';
import { AcademicCapIcon, QrCodeIcon, SparklesIcon, TrophyIcon, ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const FEATURES = [
  { icon:<QrCodeIcon className="w-6 h-6"/>,    title:'Enroll via QR',        desc:'Scan a QR code to instantly enroll in any open course offering.',                  accent:'#3b82f6' },
  { icon:<AcademicCapIcon className="w-6 h-6"/>,title:'Submit Assignments',   desc:'Upload solutions before deadlines — AI grades instantly.',                          accent:'#8b5cf6' },
  { icon:<SparklesIcon className="w-6 h-6"/>,   title:'AI Recommendations',   desc:'Get personalized course suggestions based on your skill gaps.',                     accent:'#06b6d4' },
  { icon:<TrophyIcon className="w-6 h-6"/>,     title:'Earn Certificates',    desc:'Complete courses to earn QR-verified certificates.',                                accent:'#10b981' },
  { icon:<ChartBarIcon className="w-6 h-6"/>,   title:'Track Progress',       desc:'Real-time progress calculated from your submissions and grades.',                   accent:'#f97316' },
];

export default function StudentRolePage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<AcademicCapIcon className="w-8 h-8"/>}
        title="For Students"
        subtitle="Everything you need to learn, grow, and get hired"
        accent="from-blue-500 to-cyan-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-5 stagger-children">
            {FEATURES.map((f,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(59,130,246,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Start Your Learning Journey</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Join thousands of students already building their future with TRAINET.</p>
          <Link href="/signup"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105 text-sm"
            style={{boxShadow:'0 0 28px rgba(59,130,246,0.38)'}}>
            Join as Student <ArrowRightIcon className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
