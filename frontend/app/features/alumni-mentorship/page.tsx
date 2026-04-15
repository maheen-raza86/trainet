'use client';
import Link from 'next/link';
import { UsersIcon, ArrowLeftIcon, ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/outline';

export default function AlumniMentorshipPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-red-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6"><UsersIcon className="w-8 h-8 text-white" /></div>
          <h1 className="text-5xl font-black text-white mb-4">Alumni Mentorship Network</h1>
          <p className="text-white/60 text-xl mb-12">Connect with industry professionals who've walked the same path</p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <UsersIcon className="w-6 h-6" />, title: 'Alumni Profiles', desc: 'Browse verified alumni with skills, experience, and availability status.' },
              { icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, title: 'Mentorship Sessions', desc: 'Request sessions, get accepted, and chat directly with your mentor.' },
              { icon: <StarIcon className="w-6 h-6" />, title: 'Career Guidance', desc: 'Get real-world advice on career transitions, interviews, and skill building.' },
            ].map((c, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 mb-3">{c.icon}</div>
                <h3 className="text-white font-bold mb-2">{c.title}</h3>
                <p className="text-white/60 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">How Mentorship Works</h2>
            <div className="space-y-3 text-white/70">
              <p>1. Browse alumni profiles filtered by skills and availability.</p>
              <p>2. Send a mentorship request with your goals and questions.</p>
              <p>3. Alumni accepts or rejects — you get notified instantly.</p>
              <p>4. Chat directly, schedule sessions, and track progress.</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold hover:from-orange-600 hover:to-red-600 transition-all hover:scale-105">Find a Mentor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
