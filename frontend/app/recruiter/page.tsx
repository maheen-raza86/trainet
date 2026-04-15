'use client';
import Link from 'next/link';
import { BriefcaseIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function RecruiterPublicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><BriefcaseIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-4xl font-black text-white mb-4">Recruiter Access</h1>
        <p className="text-white/60 mb-8">Access the full talent pool, AI matching, and candidate profiles by signing up as a recruiter.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105">Sign Up as Recruiter</Link>
          <Link href="/talent-pool" className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-bold hover:bg-white/10 transition-all">Preview Talent Pool</Link>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mt-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back to Home</Link>
      </div>
    </div>
  );
}
