'use client';
import Link from 'next/link';
import { BriefcaseIcon, SparklesIcon, MagnifyingGlassIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider, CurveDivider } from '@/components/public/PublicLayout';

const DEMO = [
  { name:'Ahmed K.',  skills:['Python','Machine Learning','Data Science'], score:94, certs:3 },
  { name:'Sara M.',   skills:['React','TypeScript','Node.js'],             score:91, certs:2 },
  { name:'Omar F.',   skills:['Cybersecurity','Networking','Linux'],       score:88, certs:4 },
  { name:'Fatima R.', skills:['UI/UX','Figma','Prototyping'],              score:86, certs:2 },
  { name:'Ali H.',    skills:['Java','Spring Boot','PostgreSQL'],          score:83, certs:3 },
  { name:'Zara N.',   skills:['Cloud','AWS','DevOps'],                     score:81, certs:2 },
];

export default function TalentPoolPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<BriefcaseIcon className="w-8 h-8"/>}
        title="AI Talent Pool"
        subtitle="Skill-based hiring powered by intelligent candidate matching"
        accent="from-indigo-500 to-purple-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>

      {/* How it works — light */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 reveal">
            <h2 className="text-2xl font-black text-slate-900 mb-2">How It Works</h2>
            <p className="text-slate-500 text-sm">Three steps to find your perfect candidate</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {[
              {icon:<MagnifyingGlassIcon className="w-6 h-6"/>,title:'Search by Skills',  desc:'Filter candidates by specific skills, performance scores, and certifications.',accent:'#6366f1'},
              {icon:<SparklesIcon className="w-6 h-6"/>,       title:'AI Matching Score', desc:'Each candidate gets a match score based on skill overlap, project work, and grades.',accent:'#8b5cf6'},
              {icon:<BriefcaseIcon className="w-6 h-6"/>,      title:'Recruiter Workflow',desc:'Bookmark candidates, message them directly, and track your shortlist.',accent:'#a855f7'},
            ].map((c,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
                style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{background:`${c.accent}18`,color:c.accent}}>{c.icon}</div>
                <h3 className="text-slate-900 font-bold mb-2">{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CurveDivider fromDark={false} toDark={true}/>

      {/* AI matching logic — dark */}
      <section className="py-20 px-6 relative" style={{background:'#07071a'}}>
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 30%,rgba(99,102,241,0.08) 0%,transparent 60%)'}}/>
        <div className="container mx-auto max-w-3xl relative z-10">
          <div className="text-center mb-10 reveal">
            <h2 className="text-2xl font-black text-white mb-2">AI Matching Logic</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 stagger-children">
            {[
              {label:'Skill Match',      pct:'50%',desc:'Overlap between required skills and candidate profile'},
              {label:'Project Relevance',pct:'30%',desc:'Work & Practice submissions and project quality'},
              {label:'Performance',      pct:'20%',desc:'Average grade across all graded assignments'},
            ].map((m,i)=>(
              <div key={i} className="reveal rounded-2xl p-5 border text-center"
                style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}>
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-1">{m.pct}</p>
                <p className="text-white font-semibold text-sm mb-1">{m.label}</p>
                <p className="text-white/45 text-xs">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromDark={true} toDark={false}/>

      {/* Candidate preview — light */}
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10 reveal">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Top Candidates Preview</h2>
            <p className="text-slate-500 text-sm">Sample profiles from the TRAINET talent pool</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {DEMO.map((c,i)=>(
              <div key={i} className="reveal bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
                style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{c.name[0]}</div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <StarIcon className="w-4 h-4 fill-amber-400"/>{c.score}%
                  </div>
                </div>
                <p className="font-bold text-slate-900 mb-1">{c.name}</p>
                <p className="text-slate-400 text-xs mb-3">{c.certs} certificate{c.certs!==1?'s':''}</p>
                <div className="flex flex-wrap gap-1">
                  {c.skills.map((s,j)=>(
                    <span key={j} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 reveal">
            <Link href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105 text-sm cursor-pointer"
              style={{boxShadow:'0 8px 24px rgba(99,102,241,0.35)'}}>
              Join as Recruiter — Access Full Talent Pool <ArrowRightIcon className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
