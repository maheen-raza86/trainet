'use client';
import Link from 'next/link';
import { BeakerIcon, ArrowLeftIcon, SparklesIcon, TrophyIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function TrainerRolePage() {
  const features = [
    { icon: <BeakerIcon className="w-6 h-6" />, title: 'Create Courses', desc: 'Build course offerings from the catalog with custom duration and outline.' },
    { icon: <DocumentTextIcon className="w-6 h-6" />, title: 'Assign Tasks', desc: 'Create assignments and work & practice tasks with deadlines.' },
    { icon: <SparklesIcon className="w-6 h-6" />, title: 'Auto Grading', desc: 'AI grades submissions instantly — review and override as needed.' },
    { icon: <ChartBarIcon className="w-6 h-6" />, title: 'View Analytics', desc: 'Track student progress, submission rates, and average grades.' },
    { icon: <TrophyIcon className="w-6 h-6" />, title: 'Issue Certificates', desc: 'Generate QR-verified certificates for eligible students.' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6"><BeakerIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-5xl font-black text-white mb-4">For Trainers</h1>
        <p className="text-white/60 text-xl mb-12">Powerful tools to teach, evaluate, and inspire</p>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-3">{f.icon}</div>
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105">Join as Trainer</Link>
        </div>
      </div>
    </div>
  );
}
