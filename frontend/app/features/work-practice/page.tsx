'use client';
import Link from 'next/link';
import { BeakerIcon, ArrowLeftIcon, SparklesIcon, UsersIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function WorkPracticePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6"><BeakerIcon className="w-8 h-8 text-white" /></div>
          <h1 className="text-5xl font-black text-white mb-4">Work & Practice</h1>
          <p className="text-white/60 text-xl mb-12">Real-world industry challenges that build practical, job-ready skills</p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <BriefcaseIcon className="w-6 h-6" />, title: 'Real-World Tasks', desc: 'Tasks mirror actual industry challenges — not textbook exercises.' },
              { icon: <UsersIcon className="w-6 h-6" />, title: 'Peer Collaboration', desc: 'Work alongside peers on shared challenges and compare approaches.' },
              { icon: <SparklesIcon className="w-6 h-6" />, title: 'AI Evaluation', desc: 'Submissions are auto-evaluated with detailed AI feedback and scores.' },
            ].map((c, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-3">{c.icon}</div>
                <h3 className="text-white font-bold mb-2">{c.title}</h3>
                <p className="text-white/60 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
            <div className="space-y-3 text-white/70">
              <p>1. Trainers create practice tasks linked to course offerings with real-world context.</p>
              <p>2. Students submit solutions (code, documents, or text) before the deadline.</p>
              <p>3. AI evaluates submissions for quality, completeness, and plagiarism.</p>
              <p>4. Trainers can override AI grades and provide additional feedback.</p>
              <p>5. Performance feeds into the student's skill profile for AI recommendations.</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105">Get Started</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
