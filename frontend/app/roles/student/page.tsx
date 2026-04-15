'use client';
import Link from 'next/link';
import { AcademicCapIcon, ArrowLeftIcon, QrCodeIcon, SparklesIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function StudentRolePage() {
  const features = [
    { icon: <QrCodeIcon className="w-6 h-6" />, title: 'Enroll via QR', desc: 'Scan a QR code to instantly enroll in any open course offering.' },
    { icon: <AcademicCapIcon className="w-6 h-6" />, title: 'Submit Assignments', desc: 'Upload solutions before deadlines — AI grades instantly.' },
    { icon: <SparklesIcon className="w-6 h-6" />, title: 'AI Recommendations', desc: 'Get personalized course suggestions based on your skill gaps.' },
    { icon: <TrophyIcon className="w-6 h-6" />, title: 'Earn Certificates', desc: 'Complete courses to earn QR-verified certificates.' },
    { icon: <ChartBarIcon className="w-6 h-6" />, title: 'Track Progress', desc: 'Real-time progress calculated from your submissions and grades.' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6"><AcademicCapIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-5xl font-black text-white mb-4">For Students</h1>
        <p className="text-white/60 text-xl mb-12">Everything you need to learn, grow, and get hired</p>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-3">{f.icon}</div>
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-105">Join as Student</Link>
        </div>
      </div>
    </div>
  );
}
