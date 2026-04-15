'use client';
import Link from 'next/link';
import { CpuChipIcon, ShieldCheckIcon, SparklesIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AIGradingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Home
        </Link>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
            <CpuChipIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4">AI Auto-Grading & Plagiarism Detection</h1>
          <p className="text-white/60 text-xl mb-12">Intelligent, deterministic evaluation powered by rule-based AI and similarity analysis</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <SparklesIcon className="w-6 h-6" />, title: 'Instant Feedback', desc: 'Students receive detailed feedback immediately after submission — no waiting for manual grading.' },
              { icon: <ShieldCheckIcon className="w-6 h-6" />, title: 'Fairness', desc: 'Consistent, bias-free evaluation using the same deterministic rules for every submission.' },
              { icon: <CheckCircleIcon className="w-6 h-6" />, title: 'Automation', desc: 'Trainers focus on teaching while AI handles routine grading and plagiarism checks.' },
            ].map((c, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-3">{c.icon}</div>
                <h3 className="text-white font-bold mb-2">{c.title}</h3>
                <p className="text-white/60 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">How Grading Works</h2>
              <div className="space-y-3 text-white/70">
                <p>1. <strong className="text-white">Type Detection</strong> — The system detects whether the assignment is coding, quiz, or text-based using keyword analysis.</p>
                <p>2. <strong className="text-white">Rule-Based Scoring</strong> — Each type has specific checks: coding checks for functions, control flow, comments; text checks word count, structure, keyword relevance.</p>
                <p>3. <strong className="text-white">Score Calculation</strong> — A deterministic score (0–100) is computed based on passed checks and keyword coverage.</p>
                <p>4. <strong className="text-white">Feedback Generation</strong> — Specific, actionable feedback is generated explaining what passed and what needs improvement.</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Plagiarism Detection</h2>
              <div className="space-y-3 text-white/70">
                <p>Uses a <strong className="text-white">hybrid similarity algorithm</strong>: 60% cosine word-frequency similarity + 40% bigram overlap.</p>
                <p>Thresholds: <span className="text-green-400">0–40% = Clean</span> · <span className="text-yellow-400">40–70% = Suspicious</span> · <span className="text-red-400">70%+ = Flagged (grade = 0)</span></p>
                <p>Plagiarism check runs <strong className="text-white">before grading</strong> — flagged submissions are suspended immediately.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105">
              Try It — Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
