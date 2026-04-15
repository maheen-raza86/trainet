'use client';
import Link from 'next/link';
import { AcademicCapIcon, ArrowLeftIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function LiveLearningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-orange-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6"><AcademicCapIcon className="w-8 h-8 text-white" /></div>
          <h1 className="text-5xl font-black text-white mb-4">Live Sessions & Learning</h1>
          <p className="text-white/60 text-xl mb-12">Structured courses with live sessions, assignments, and real-time progress tracking</p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <AcademicCapIcon className="w-6 h-6" />, title: 'Course Structure', desc: 'Organized offerings with materials, assignments, and live session links.' },
              { icon: <DocumentTextIcon className="w-6 h-6" />, title: 'Assignments', desc: 'Deadline-enforced assignments with AI auto-grading and trainer review.' },
              { icon: <ChartBarIcon className="w-6 h-6" />, title: 'Progress Tracking', desc: 'Real-time progress calculated from submissions and grades.' },
            ].map((c, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-400 mb-3">{c.icon}</div>
                <h3 className="text-white font-bold mb-2">{c.title}</h3>
                <p className="text-white/60 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Learning Flow</h2>
            <div className="space-y-3 text-white/70">
              <p>1. Enroll via QR code → access course materials and assignments.</p>
              <p>2. Attend live sessions via Google Meet / Zoom links provided by trainer.</p>
              <p>3. Submit assignments before deadlines — AI grades instantly.</p>
              <p>4. Progress updates automatically based on submissions and grades.</p>
              <p>5. Earn certificate when completion threshold is reached.</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold hover:from-yellow-600 hover:to-orange-600 transition-all hover:scale-105">Start Learning</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
