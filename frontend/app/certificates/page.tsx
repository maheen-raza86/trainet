'use client';
import Link from 'next/link';
import { TrophyIcon, QrCodeIcon, ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const STEPS = [
  { icon:<TrophyIcon className="w-6 h-6"/>,    title:'Complete a Course',    desc:'Finish at least 60% of assignments with passing grades.',                    accent:'#10b981' },
  { icon:<QrCodeIcon className="w-6 h-6"/>,    title:'Auto-Issued',          desc:'Certificates are generated automatically upon eligibility — no waiting.',   accent:'#3b82f6' },
  { icon:<ShieldCheckIcon className="w-6 h-6"/>,title:'QR Verified',         desc:'Each certificate has a unique QR code. Employers can verify instantly.',    accent:'#8b5cf6' },
];

export default function CertificatesPublicPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<TrophyIcon className="w-8 h-8"/>}
        title="TRAINET Certificates"
        subtitle="QR-verified certificates issued upon course completion. Employers can verify authenticity instantly."
        accent="from-green-500 to-emerald-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {STEPS.map((s,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-green-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(16,185,129,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Earn Your Certificate</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Enroll in a course, complete the assignments, and earn a verified certificate.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 text-sm"
              style={{boxShadow:'0 0 28px rgba(16,185,129,0.38)'}}>
              Earn a Certificate <ArrowRightIcon className="w-4 h-4"/>
            </Link>
            <Link href="/features/certificates"
              className="inline-flex items-center gap-2 px-8 py-4 border text-white rounded-full font-bold hover:bg-white/5 transition-all text-sm"
              style={{borderColor:'rgba(255,255,255,0.15)'}}>
              <QrCodeIcon className="w-4 h-4"/> How It Works
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
