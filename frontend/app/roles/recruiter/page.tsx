'use client';
import Link from 'next/link';
import { BriefcaseIcon, ArrowLeftIcon, SparklesIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, BookmarkIcon } from '@heroicons/react/24/outline';

export default function RecruiterRolePage() {
  const features = [
    { icon: <MagnifyingGlassIcon className="w-6 h-6" />, title: 'Talent Search', desc: 'Search candidates by skills, performance scores, and certifications.' },
    { icon: <SparklesIcon className="w-6 h-6" />, title: 'AI Matching', desc: 'Candidates ranked by skill match, project relevance, and grades.' },
    { icon: <BriefcaseIcon className="w-6 h-6" />, title: 'Candidate Profiles', desc: 'View full profiles: skills, courses, certificates, work submissions.' },
    { icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, title: 'Messaging', desc: 'Message candidates directly from the platform.' },
    { icon: <BookmarkIcon className="w-6 h-6" />, title: 'Shortlist', desc: 'Bookmark top candidates and manage your hiring pipeline.' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-red-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6"><BriefcaseIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-5xl font-black text-white mb-4">For Recruiters</h1>
        <p className="text-white/60 text-xl mb-12">Find verified, skilled talent with AI-powered matching</p>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 mb-3">{f.icon}</div>
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold hover:from-orange-600 hover:to-red-600 transition-all hover:scale-105">Join as Recruiter</Link>
        </div>
      </div>
    </div>
  );
}
