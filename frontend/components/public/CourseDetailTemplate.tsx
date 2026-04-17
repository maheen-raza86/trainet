'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon, ChevronDownIcon, ArrowLeftIcon,
  SparklesIcon, QrCodeIcon, UsersIcon, AcademicCapIcon, BriefcaseIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import PublicLayout, { WaveDivider, AngleDivider, CurveDivider } from '@/components/public/PublicLayout';

interface Module    { week: string; title: string; topics: string[] }
interface CareerRole{ title: string; demand: string; color: string }
interface FAQ       { q: string; a: string }

interface CourseDetailProps {
  title: string; subtitle: string; gradient: string;
  duration: string; difficulty: string; icon: string;
  overview: string; whyMatters: string;
  outcomes: string[]; modules: Module[];
  tools: string[]; careers: CareerRole[]; faqs: FAQ[];
}

const TRAINET_FEATURES = [
  { icon:<SparklesIcon className="w-5 h-5"/>, label:'AI-Powered Assignments', desc:'Auto-graded with instant feedback' },
  { icon:<QrCodeIcon className="w-5 h-5"/>,   label:'QR-Verified Certificate', desc:'Tamper-proof, employer-verifiable' },
  { icon:<AcademicCapIcon className="w-5 h-5"/>,label:'Work & Practice Tasks', desc:'Real-world industry challenges' },
  { icon:<UsersIcon className="w-5 h-5"/>,    label:'Alumni Mentorship',       desc:'Guidance from industry professionals' },
  { icon:<BriefcaseIcon className="w-5 h-5"/>,label:'Recruiter Talent Pool',   desc:'Get discovered by top employers' },
];

export default function CourseDetailTemplate({
  title, subtitle, gradient, duration, difficulty, icon,
  overview, whyMatters, outcomes, modules, tools, careers, faqs,
}: CourseDetailProps) {
  const [openModule, setOpenModule] = useState<number|null>(0);
  const [openFaq,    setOpenFaq]    = useState<number|null>(null);
  const [vis, setVis] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),60); return ()=>clearTimeout(t); },[]);

  return (
    <PublicLayout>

      {/* ── HERO — dark with course gradient accent ── */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden" style={{background:'#07071a'}}>
        {/* grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:'linear-gradient(rgba(139,92,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.03) 1px,transparent 1px)',
          backgroundSize:'64px 64px',
        }}/>
        {/* gradient blob from course color */}
        <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${gradient} opacity-10`}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
          style={{background:'radial-gradient(ellipse,rgba(139,92,246,0.12) 0%,transparent 70%)',filter:'blur(50px)'}}/>

        <div className={`container mx-auto max-w-4xl relative z-10 transition-all duration-700 ${vis?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
          <Link href="/courses"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm cursor-pointer">
            <ArrowLeftIcon className="w-4 h-4"/> All Courses
          </Link>

          <div className="flex items-start gap-5 mb-6">
            <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-4xl shrink-0`}
              style={{boxShadow:'0 8px 32px rgba(139,92,246,0.40)'}}>
              {icon}
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{background:'rgba(139,92,246,0.15)',border:'1px solid rgba(139,92,246,0.28)',color:'#c4b5fd'}}>
                  ⏱ {duration}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficulty==='Beginner'?'bg-green-500/15 text-green-400 border border-green-500/25':'bg-orange-500/15 text-orange-400 border border-orange-500/25'}`}>
                  {difficulty}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{title}</h1>
            </div>
          </div>

          <p className="text-white/55 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">{subtitle}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 text-sm cursor-pointer"
              style={{boxShadow:'0 0 28px rgba(139,92,246,0.38)'}}>
              Start Learning Now <ArrowRightIcon className="w-4 h-4"/>
            </Link>
            <a href="mailto:trainet8688@gmail.com"
              className="inline-flex items-center gap-2 px-7 py-3.5 border text-white rounded-full font-bold hover:bg-white/5 transition-all text-sm cursor-pointer"
              style={{borderColor:'rgba(255,255,255,0.15)'}}>
              Talk to an Advisor
            </a>
          </div>
        </div>
      </section>

      <AngleDivider fromDark={true} toDark={false}/>

      {/* ── OVERVIEW — light ── */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-purple-100 text-purple-700">COURSE OVERVIEW</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">What is this course?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            <div className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all"
              style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
              <h3 className="font-black text-purple-700 mb-3 text-sm uppercase tracking-wide">Overview</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{overview}</p>
            </div>
            <div className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all"
              style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
              <h3 className="font-black text-blue-700 mb-3 text-sm uppercase tracking-wide">Why It Matters</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{whyMatters}</p>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromDark={false} toDark={true}/>

      {/* ── WHAT YOU'LL LEARN — dark ── */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(139,92,246,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
              style={{background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.28)',color:'#c4b5fd'}}>
              LEARNING OUTCOMES
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white">What You Will Learn</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3 stagger-children">
            {outcomes.map((o,i)=>(
              <div key={i} className="reveal flex items-start gap-3 rounded-xl p-4 border transition-all hover:border-purple-500/30"
                style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
                <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0 mt-0.5"/>
                <span className="text-white/75 text-sm leading-relaxed">{o}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CurveDivider fromDark={true} toDark={false}/>

      {/* ── COURSE OUTLINE — light ── */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-blue-100 text-blue-700">CURRICULUM</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Course Outline</h2>
          </div>
          <div className="space-y-3">
            {modules.map((m,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-purple-200 hover:shadow-md transition-all"
                style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <button
                  onClick={()=>setOpenModule(openModule===i?null:i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="w-9 h-9 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0">{i+1}</span>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">{m.week}</span>
                      <p className="font-black text-slate-900 text-sm">{m.title}</p>
                    </div>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${openModule===i?'rotate-180':''}`}/>
                </button>
                {openModule===i&&(
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <ul className="mt-4 space-y-2">
                      {m.topics.map((t,j)=>(
                        <li key={j} className="flex items-center gap-2 text-slate-600 text-sm">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0"/>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AngleDivider fromDark={false} toDark={true}/>

      {/* ── TOOLS + CAREERS — dark ── */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 30% 50%,rgba(59,130,246,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-4xl relative z-10 space-y-16">

          {/* Tools */}
          <div>
            <div className="text-center mb-10 reveal">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
                style={{background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.28)',color:'#93c5fd'}}>
                TOOLS & TECHNOLOGIES
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">What You'll Work With</h2>
            </div>
            <div className="flex flex-wrap gap-3 justify-center stagger-children">
              {tools.map((t,i)=>(
                <span key={i} className="reveal px-4 py-2 rounded-xl text-sm font-semibold cursor-default transition-all hover:scale-105"
                  style={{background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.28)',color:'#c4b5fd',
                    boxShadow:'0 0 12px rgba(139,92,246,0.10)'}}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Careers */}
          <div>
            <div className="text-center mb-10 reveal">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
                style={{background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.28)',color:'#6ee7b7'}}>
                CAREER OPPORTUNITIES
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">Where This Takes You</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {careers.map((c,i)=>(
                <div key={i} className={`reveal bg-gradient-to-br ${c.color} rounded-2xl p-5 border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all cursor-default`}>
                  <BriefcaseIcon className="w-6 h-6 text-white/70 mb-2"/>
                  <h3 className="font-black text-white text-sm">{c.title}</h3>
                  <p className="text-white/55 text-xs mt-1">{c.demand}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromDark={true} toDark={false}/>

      {/* ── WHY TRAINET — light ── */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3 bg-purple-100 text-purple-700">THE TRAINET ADVANTAGE</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Why Learn With TRAINET?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {TRAINET_FEATURES.map((t,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-200 hover:-translate-y-1 hover:shadow-lg transition-all cursor-default"
                style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white mb-3"
                  style={{boxShadow:'0 4px 14px rgba(139,92,246,0.30)'}}>
                  {t.icon}
                </div>
                <p className="font-black text-slate-900 text-sm mb-1">{t.label}</p>
                <p className="text-slate-500 text-xs">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CurveDivider fromDark={false} toDark={true}/>

      {/* ── FAQ — dark ── */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 70% 50%,rgba(139,92,246,0.06) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10">
          <div className="text-center mb-12 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
              style={{background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.28)',color:'#c4b5fd'}}>
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f,i)=>(
              <div key={i} className="reveal rounded-2xl border overflow-hidden transition-all"
                style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
                <button
                  onClick={()=>setOpenFaq(openFaq===i?null:i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors cursor-pointer">
                  <span className="font-bold text-white text-sm pr-4">{f.q}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${openFaq===i?'rotate-180':''}`}/>
                </button>
                {openFaq===i&&(
                  <div className="px-5 pb-5 border-t" style={{borderColor:'rgba(255,255,255,0.07)'}}>
                    <p className="text-white/60 text-sm mt-4 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AngleDivider fromDark={true} toDark={false}/>

      {/* ── FINAL CTA — light ── */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-2xl text-center reveal">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Ready to Start?</h2>
          <p className="text-slate-500 mb-10 text-sm leading-relaxed">
            Join thousands of students building industry-ready skills with TRAINET's AI-powered ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 text-sm cursor-pointer"
              style={{boxShadow:'0 8px 24px rgba(139,92,246,0.30)'}}>
              Start Learning Now <ArrowRightIcon className="w-4 h-4"/>
            </Link>
            <a href="mailto:trainet8688@gmail.com"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-full font-bold hover:border-purple-400 hover:text-purple-700 transition-all text-sm cursor-pointer">
              Talk to an Advisor
            </a>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
