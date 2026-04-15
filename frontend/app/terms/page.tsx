'use client';
import Link from 'next/link';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6"><DocumentTextIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-4xl font-black text-white mb-4">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-8">Last updated: April 2026</p>
        <div className="space-y-6 text-white/70">
          {[
            { title: 'Acceptance', body: 'By using TRAINET, you agree to these terms. If you do not agree, do not use the platform.' },
            { title: 'User Accounts', body: 'You are responsible for maintaining the security of your account. Do not share credentials. Each account is for one individual only.' },
            { title: 'Academic Integrity', body: 'Plagiarism is strictly prohibited. Submissions flagged for high similarity will receive a grade of 0. Repeated violations may result in account suspension.' },
            { title: 'Certificates', body: 'Certificates are issued based on genuine completion of course requirements. Fraudulent certificates will be revoked.' },
            { title: 'Intellectual Property', body: 'Course materials are owned by their respective trainers. Student submissions remain the property of the student.' },
            { title: 'Termination', body: 'TRAINET reserves the right to suspend accounts that violate these terms without prior notice.' },
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
