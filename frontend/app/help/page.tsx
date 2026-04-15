'use client';
import Link from 'next/link';
import { ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const faqs = [
  { q: 'How do I enroll in a course?', a: 'Scan the QR code provided by your trainer or use the enrollment link. You must be logged in as a student.' },
  { q: 'How does AI grading work?', a: 'The system detects your assignment type (coding/quiz/text) and applies rule-based checks. You receive a score and detailed feedback instantly.' },
  { q: 'How do I get a certificate?', a: 'Complete at least 60% of course assignments. Certificates are auto-issued and contain a QR code for verification.' },
  { q: 'How do I request mentorship?', a: 'Browse the Alumni Network, click a profile, and send a mentorship request with your goals.' },
  { q: 'How does the Talent Pool work?', a: 'Recruiters search candidates by skills. Your profile is scored based on grades, projects, and certifications.' },
  { q: 'What if my submission is flagged for plagiarism?', a: 'Submissions with >70% similarity to others are flagged and graded 0. Review your work and resubmit original content.' },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6"><QuestionMarkCircleIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-4xl font-black text-white mb-4">Help Center</h1>
        <p className="text-white/60 mb-12">Frequently asked questions about TRAINET</p>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-bold mb-2">{f.q}</h3>
              <p className="text-white/60 text-sm">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
          <p className="text-white/60 mb-3">Still need help?</p>
          <a href="mailto:trainet8688@gmail.com" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">trainet8688@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
