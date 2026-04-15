'use client';
import Link from 'next/link';
import { BriefcaseIcon, ArrowLeftIcon, SparklesIcon, StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const DEMO_CANDIDATES = [
  { name: 'Ahmed K.', skills: ['Python', 'Machine Learning', 'Data Science'], score: 94, certs: 3 },
  { name: 'Sara M.', skills: ['React', 'TypeScript', 'Node.js'], score: 91, certs: 2 },
  { name: 'Omar F.', skills: ['Cybersecurity', 'Networking', 'Linux'], score: 88, certs: 4 },
  { name: 'Fatima R.', skills: ['UI/UX', 'Figma', 'Prototyping'], score: 86, certs: 2 },
  { name: 'Ali H.', skills: ['Java', 'Spring Boot', 'PostgreSQL'], score: 83, certs: 3 },
  { name: 'Zara N.', skills: ['Cloud', 'AWS', 'DevOps'], score: 81, certs: 2 },
];

export default function TalentPoolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back to Home</Link>

        <div className="max-w-5xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6"><BriefcaseIcon className="w-8 h-8 text-white" /></div>
          <h1 className="text-5xl font-black text-white mb-4">AI Talent Pool</h1>
          <p className="text-white/60 text-xl mb-12">Skill-based hiring powered by intelligent candidate matching</p>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <MagnifyingGlassIcon className="w-6 h-6" />, title: 'Search by Skills', desc: 'Filter candidates by specific skills, performance scores, and certifications.' },
              { icon: <SparklesIcon className="w-6 h-6" />, title: 'AI Matching Score', desc: 'Each candidate gets a match score based on skill overlap, project work, and grades.' },
              { icon: <BriefcaseIcon className="w-6 h-6" />, title: 'Recruiter Workflow', desc: 'Bookmark candidates, message them directly, and track your shortlist.' },
            ].map((c, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-3">{c.icon}</div>
                <h3 className="text-white font-bold mb-2">{c.title}</h3>
                <p className="text-white/60 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Matching logic */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">AI Matching Logic</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Skill Match', pct: '50%', desc: 'Overlap between required skills and candidate profile' },
                { label: 'Project Relevance', pct: '30%', desc: 'Work & Practice submissions and project quality' },
                { label: 'Performance', pct: '20%', desc: 'Average grade across all graded assignments' },
              ].map((m, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                  <p className="text-3xl font-black text-purple-400 mb-1">{m.pct}</p>
                  <p className="text-white font-semibold text-sm mb-1">{m.label}</p>
                  <p className="text-white/50 text-xs">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Demo candidates */}
          <h2 className="text-2xl font-bold text-white mb-6">Top Candidates Preview</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {DEMO_CANDIDATES.map((c, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{c.name[0]}</div>
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                    <StarIcon className="w-4 h-4 fill-yellow-400" />{c.score}%
                  </div>
                </div>
                <p className="font-bold text-white mb-1">{c.name}</p>
                <p className="text-white/40 text-xs mb-3">{c.certs} certificate{c.certs !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-1">
                  {c.skills.map((s, j) => (
                    <span key={j} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105 shadow-xl">
              Join as Recruiter — Access Full Talent Pool
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
