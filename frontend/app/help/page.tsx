'use client';
import Link from 'next/link';
import { QuestionMarkCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const FAQS = [
  { q:'How do I enroll in a course?', a:'Scan the QR code provided by your trainer or use the enrollment link. You must be logged in as a student.' },
  { q:'How does AI grading work?', a:'The system detects your assignment type (coding/quiz/text) and applies rule-based checks. You receive a score and detailed feedback instantly.' },
  { q:'How do I get a certificate?', a:'Complete at least 60% of course assignments. Certificates are auto-issued and contain a QR code for verification.' },
  { q:'How do I request mentorship?', a:'Browse the Alumni Network, click a profile, and send a mentorship request with your goals.' },
  { q:'How does the Talent Pool work?', a:'Recruiters search candidates by skills. Your profile is scored based on grades, projects, and certifications.' },
  { q:'What if my submission is flagged for plagiarism?', a:'Submissions with >70% similarity to others are flagged and graded 0. Review your work and resubmit original content.' },
];

export default function HelpPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<QuestionMarkCircleIcon className="w-8 h-8"/>}
        title="Help Center"
        subtitle="Frequently asked questions about TRAINET"
        accent="from-purple-500 to-blue-500"
      />

      <AngleDivider fromDark={true} toDark={false}/>

      {/* FAQs — light */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-4 stagger-children">
            {FAQS.map((f,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all"
                style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <h3 className="text-slate-900 font-bold mb-2">{f.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromDark={false} toDark={true}/>

      {/* Still need help — dark */}
      <section className="py-20 px-6" style={{background:'#07071a'}}>
        <div className="container mx-auto max-w-md text-center reveal">
          <h2 className="text-2xl font-black text-white mb-3">Still need help?</h2>
          <p className="text-white/45 text-sm mb-6">Reach out directly and we'll get back to you.</p>
          <a href="mailto:trainet8688@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 text-sm cursor-pointer"
            style={{boxShadow:'0 0 20px rgba(139,92,246,0.35)'}}>
            trainet8688@gmail.com <ArrowRightIcon className="w-4 h-4"/>
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
