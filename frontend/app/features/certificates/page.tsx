'use client';
import Link from 'next/link';
import { QrCodeIcon, ShieldCheckIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

export default function CertificatesPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<QrCodeIcon className="w-8 h-8"/>}
        title="QR Certificate Verification"
        subtitle="Tamper-proof certificates with instant QR-based verification for employers"
        accent="from-green-500 to-emerald-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-10 stagger-children">
            {[
              {icon:<ShieldCheckIcon className="w-6 h-6"/>,title:'Secure Certificates',desc:'Each certificate has a unique UUID and QR code that cannot be forged.',accent:'#10b981'},
              {icon:<QrCodeIcon className="w-6 h-6"/>,     title:'QR Validation Flow', desc:'Scan QR → verify UUID → get full certificate details instantly.',accent:'#059669'},
              {icon:<CheckCircleIcon className="w-6 h-6"/>,title:'Fraud Prevention',   desc:'Revoked certificates are flagged immediately. Status: Valid / Revoked / Invalid.',accent:'#34d399'},
            ].map((c,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-green-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(16,185,129,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10 text-center">
          <div className="reveal pt-4">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 text-sm"
              style={{boxShadow:'0 0 28px rgba(16,185,129,0.38)'}}>
              Join as Student to Earn Certificate <ArrowRightIcon className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
