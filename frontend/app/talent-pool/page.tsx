'use client';
import Link from 'next/link';
import { BriefcaseIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, AngleDivider } from '@/components/public/PublicLayout';

export default function TalentPoolPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<BriefcaseIcon className="w-8 h-8"/>}
        title="Talent Pool"
        subtitle="Skill-based hiring powered by intelligent candidate matching"
        accent="from-indigo-500 to-purple-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>

      {/* CTA — light */}
      <section className="py-24 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-xl text-center reveal">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Access the Full Talent Pool</h2>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed">
            Browse verified student profiles, filter by skills and certifications, and connect with top candidates trained on TRAINET.
          </p>
          <Link
            href="/signup"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105 text-sm"
            style={{boxShadow:'0 8px 24px rgba(99,102,241,0.35)'}}
          >
            Join as Recruiter — Access Talent Pool <ArrowRightIcon className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
