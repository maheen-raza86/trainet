'use client';
import Link from 'next/link';
import { ArrowLeftIcon, UsersIcon, ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/outline';

export default function MentorshipPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-red-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6"><UsersIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-4xl font-black text-white mb-4">Mentorship Program</h1>
        <p className="text-white/60 text-xl mb-12">Connect students with experienced alumni for career guidance</p>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: <UsersIcon className="w-6 h-6" />, title: 'Find a Mentor', desc: 'Browse alumni by skills and availability. Send a request with your goals.' },
            { icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, title: 'Direct Messaging', desc: 'Once accepted, chat directly with your mentor on the platform.' },
            { icon: <StarIcon className="w-6 h-6" />, title: 'Career Growth', desc: 'Get guidance on interviews, career transitions, and skill development.' },
          ].map((c, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 mb-3">{c.icon}</div>
              <h3 className="text-white font-bold mb-2">{c.title}</h3>
              <p className="text-white/60 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold hover:from-orange-600 hover:to-red-600 transition-all hover:scale-105">Get Started</Link>
        </div>
      </div>
    </div>
  );
}
