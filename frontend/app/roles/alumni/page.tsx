'use client';
import Link from 'next/link';
import { UsersIcon, ArrowLeftIcon, ChatBubbleLeftRightIcon, StarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function AlumniRolePage() {
  const features = [
    { icon: <UsersIcon className="w-6 h-6" />, title: 'Mentorship', desc: 'Accept mentorship requests from students and guide their careers.' },
    { icon: <StarIcon className="w-6 h-6" />, title: 'Networking', desc: 'Connect with fellow alumni and expand your professional network.' },
    { icon: <BriefcaseIcon className="w-6 h-6" />, title: 'Career Guidance', desc: 'Share your experience and help students navigate their career paths.' },
    { icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, title: 'Messaging', desc: 'Direct messaging with students and other alumni.' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6"><UsersIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-5xl font-black text-white mb-4">For Alumni</h1>
        <p className="text-white/60 text-xl mb-12">Give back, connect, and grow your professional impact</p>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-green-500/50 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-3">{f.icon}</div>
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105">Join as Alumni</Link>
        </div>
      </div>
    </div>
  );
}
