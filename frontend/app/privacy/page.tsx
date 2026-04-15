'use client';
import Link from 'next/link';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6"><ShieldCheckIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-4xl font-black text-white mb-4">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-8">Last updated: April 2026</p>
        <div className="space-y-6 text-white/70">
          {[
            { title: 'Data We Collect', body: 'We collect your name, email, role, and learning activity (enrollments, submissions, grades) to provide the TRAINET service.' },
            { title: 'How We Use Your Data', body: 'Your data is used to personalize recommendations, generate certificates, enable mentorship matching, and provide analytics to trainers and admins.' },
            { title: 'Data Security', body: 'All data is stored in Supabase with Row Level Security. Passwords are managed by Supabase Auth. We never store plain-text passwords.' },
            { title: 'Third Parties', body: 'We do not sell your data. QR certificate verification is public by design — only certificate validity is exposed, not personal details.' },
            { title: 'Your Rights', body: 'You may request deletion of your account and data by contacting trainet8688@gmail.com.' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-bold mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
