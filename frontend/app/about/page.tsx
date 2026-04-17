'use client';
import Link from 'next/link';
import { SparklesIcon, CpuChipIcon, UsersIcon, ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const SECTIONS = [
  { icon: <CpuChipIcon className="w-6 h-6 text-purple-400"/>, title:'Our Vision', accent:'text-purple-400',
    body:'TRAINET bridges the gap between education and employment. By combining AI-powered evaluation, QR-verified credentials, alumni mentorship, and intelligent talent matching, we create a complete ecosystem where learners grow, trainers teach effectively, alumni give back, and recruiters find verified talent.' },
  { icon: <SparklesIcon className="w-6 h-6 text-blue-400"/>, title:'AI at the Core', accent:'text-blue-400',
    body:'Every aspect of TRAINET is enhanced by AI: assignments are auto-graded using rule-based logic, plagiarism is detected via cosine similarity, course recommendations are generated from real performance data, and talent matching uses a weighted scoring algorithm based on skills, projects, and grades.' },
  { icon: <ShieldCheckIcon className="w-6 h-6 text-green-400"/>, title:'Trust & Security', accent:'text-green-400',
    body:'All certificates are QR-verified and tamper-proof. Enrollment is secured via QR tokens with expiry and role validation. Student data is protected with role-based access control and Row Level Security at the database level.' },
  { icon: <UsersIcon className="w-6 h-6 text-orange-400"/>, title:'The Ecosystem', accent:'text-orange-400',
    body:'TRAINET serves five roles: Students learn and earn certificates. Trainers create and manage courses. Alumni mentor and network. Recruiters discover talent. Admins oversee the platform. Each role has a dedicated dashboard with role-specific features and analytics.' },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<SparklesIcon className="w-8 h-8"/>}
        title="About TRAINET"
        subtitle="A next-generation AI-powered learning and career development ecosystem"
        accent="from-purple-500 to-blue-500"
      />

      <AngleDivider fromDark={true} toDark={false}/>

      {/* Vision sections — light */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-5 stagger-children">
            {SECTIONS.map((s,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all"
                style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">{s.icon}{s.title}</h2>
                <p className="text-slate-600 leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromDark={false} toDark={true}/>

      {/* CTA — dark */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 50%,rgba(139,92,246,0.08) 0%,transparent 70%)'}}/>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl font-black text-white mb-4">Ready to Join TRAINET?</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Start learning, teaching, or hiring with the most complete AI-powered training ecosystem.</p>
          <Link href="/signup"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 text-sm"
            style={{boxShadow:'0 0 28px rgba(139,92,246,0.38)'}}>
            Join TRAINET <ArrowRightIcon className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
