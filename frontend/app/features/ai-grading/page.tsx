'use client';
import Link from 'next/link';
import { CpuChipIcon, ShieldCheckIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

export default function AIGradingPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<CpuChipIcon className="w-8 h-8"/>}
        title="AI Auto-Grading & Plagiarism Detection"
        subtitle="Intelligent, deterministic evaluation powered by rule-based AI and similarity analysis"
        accent="from-purple-500 to-pink-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>

      {/* Feature cards — light */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-10 stagger-children">
            {[
              {icon:<SparklesIcon className="w-6 h-6"/>,   title:'Instant Feedback', desc:'Students receive detailed feedback immediately after submission — no waiting.',accent:'#a855f7'},
              {icon:<ShieldCheckIcon className="w-6 h-6"/>,title:'Fairness',          desc:'Consistent, bias-free evaluation using the same deterministic rules for every submission.',accent:'#8b5cf6'},
              {icon:<CheckCircleIcon className="w-6 h-6"/>,title:'Automation',        desc:'Trainers focus on teaching while AI handles routine grading and plagiarism checks.',accent:'#6366f1'},
            ].map((c,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-purple-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
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

      {/* Detail — dark */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(168,85,247,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10 space-y-5">
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">How Grading Works</h2>
            <div className="space-y-3 text-white/65 text-sm leading-relaxed">
              <p><span className="text-white font-semibold">1. Type Detection</span> — The system detects whether the assignment is coding, quiz, or text-based using keyword analysis.</p>
              <p><span className="text-white font-semibold">2. Rule-Based Scoring</span> — Each type has specific checks: coding checks for functions, control flow, comments; text checks word count, structure, keyword relevance.</p>
              <p><span className="text-white font-semibold">3. Score Calculation</span> — A deterministic score (0–100) is computed based on passed checks and keyword coverage.</p>
              <p><span className="text-white font-semibold">4. Feedback Generation</span> — Specific, actionable feedback is generated explaining what passed and what needs improvement.</p>
            </div>
          </div>
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">Plagiarism Detection</h2>
            <div className="space-y-3 text-white/65 text-sm leading-relaxed">
              <p>Uses a <span className="text-white font-semibold">hybrid similarity algorithm</span>: 60% cosine word-frequency similarity + 40% bigram overlap.</p>
              <p>Thresholds: <span className="text-green-400">0–40% = Clean</span> · <span className="text-yellow-400">40–70% = Suspicious</span> · <span className="text-red-400">70%+ = Flagged (grade = 0)</span></p>
              <p>Plagiarism check runs <span className="text-white font-semibold">before grading</span> — flagged submissions are suspended immediately.</p>
            </div>
          </div>
          <div className="text-center pt-4 reveal">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 text-sm"
              style={{boxShadow:'0 0 28px rgba(168,85,247,0.38)'}}>
              Try It — Sign Up Free <ArrowRightIcon className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
