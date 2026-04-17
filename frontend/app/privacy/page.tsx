'use client';
import { ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const SECTIONS = [
  { title:'Data We Collect', body:'We collect your name, email, role, and learning activity (enrollments, submissions, grades) to provide the TRAINET service.' },
  { title:'How We Use Your Data', body:'Your data is used to personalize recommendations, generate certificates, enable mentorship matching, and provide analytics to trainers and admins.' },
  { title:'Data Security', body:'All data is stored in Supabase with Row Level Security. Passwords are managed by Supabase Auth. We never store plain-text passwords.' },
  { title:'Third Parties', body:'We do not sell your data. QR certificate verification is public by design — only certificate validity is exposed, not personal details.' },
  { title:'Your Rights', body:'You may request deletion of your account and data by contacting trainet8688@gmail.com.' },
];

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<ShieldCheckIcon className="w-8 h-8"/>}
        title="Privacy Policy"
        subtitle="Last updated: April 2026"
        accent="from-purple-500 to-blue-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-3xl space-y-4 stagger-children">
          {SECTIONS.map((s,i)=>(
            <div key={i} className="reveal bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all">
              <h3 className="text-slate-900 font-bold mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <WaveDivider fromDark={false} toDark={true}/>
      <section className="py-16 px-6" style={{background:'#07071a'}}>
        <div className="container mx-auto text-center reveal">
          <p className="text-white/40 text-sm mb-4">Questions about your data?</p>
          <a href="mailto:trainet8688@gmail.com" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors text-sm cursor-pointer">trainet8688@gmail.com</a>
        </div>
      </section>
    </PublicLayout>
  );
}
