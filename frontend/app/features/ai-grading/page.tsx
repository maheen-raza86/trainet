'use client';
import Link from 'next/link';
import { CpuChipIcon, ShieldCheckIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon, BoltIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

export default function AIGradingPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<CpuChipIcon className="w-8 h-8"/>}
        title="AI Auto-Grading"
        subtitle="Intelligent evaluation powered by Groq AI — instant scores, structured feedback, and integrity checks"
        accent="from-purple-500 to-pink-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>

      {/* Top 3 benefit cards — light */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {[
              {icon:<SparklesIcon className="w-6 h-6"/>,   title:'Instant Feedback',  desc:'Students receive a structured score and detailed feedback immediately after submission.',accent:'#a855f7'},
              {icon:<ShieldCheckIcon className="w-6 h-6"/>,title:'Fair & Consistent',  desc:'Every submission is evaluated by the same AI model with the same criteria — no bias.',accent:'#8b5cf6'},
              {icon:<BoltIcon className="w-6 h-6"/>,       title:'Trainer Automation', desc:'Trainers focus on teaching while AI handles grading, feedback, and integrity checks.',accent:'#6366f1'},
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

      {/* Detail sections — dark */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(168,85,247,0.07) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10 space-y-5">

          {/* Section 1 — How AI Grading Works */}
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">How AI Grading Works</h2>
            <div className="space-y-3 text-white/65 text-sm leading-relaxed">
              <p><span className="text-white font-semibold">Submission Evaluation</span> — When a student submits an assignment, the AI model receives the full submission text along with the assignment context and evaluates it end-to-end.</p>
              <p><span className="text-white font-semibold">Multi-Type Support</span> — The system supports coding assignments, quiz answers, and open-ended text responses. Each type is evaluated with appropriate criteria.</p>
              <p><span className="text-white font-semibold">Structured Output</span> — The AI returns a numeric score (0–100), a pass/fail status, and a detailed feedback message explaining the result.</p>
              <p><span className="text-white font-semibold">Trainer Override</span> — Trainers can review AI scores and override them with a final grade and custom feedback at any time.</p>
            </div>
          </div>

          {/* Section 2 — Smart Evaluation */}
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">Smart Evaluation</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                {label:'Context-Aware Grading',   desc:'The AI understands the assignment topic and evaluates answers in context, not just by keyword matching.'},
                {label:'Correctness + Logic',      desc:'Responses are assessed for factual accuracy, logical structure, and completeness of the answer.'},
                {label:'Text Relevance + Clarity', desc:'Writing quality, relevance to the question, and clarity of explanation are all factored into the score.'},
                {label:'Instant Feedback',         desc:'Every submission receives specific, actionable feedback — not just a number — so students know exactly how to improve.'},
              ].map((p,i)=>(
                <div key={i} className="flex items-start gap-3 rounded-xl p-4 border"
                  style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
                  <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">{p.label}</p>
                    <p className="text-white/55 text-xs leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 — Integrity Checks */}
          <div className="reveal rounded-2xl p-6 border" style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
            <h2 className="text-xl font-black text-white mb-4">Integrity Checks</h2>
            <div className="space-y-3 text-white/65 text-sm leading-relaxed">
              <p><span className="text-white font-semibold">AI-Assisted Similarity Detection</span> — Before grading, each submission is compared against all other submissions in the same assignment using semantic similarity analysis.</p>
              <p><span className="text-white font-semibold">Semantic Understanding</span> — The system goes beyond simple text matching. It detects paraphrased or restructured copies that share the same underlying meaning.</p>
              <p><span className="text-white font-semibold">Automatic Flagging</span> — Submissions that exceed the similarity threshold are automatically flagged for trainer review. Highly similar submissions receive a suspended status until reviewed.</p>
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
