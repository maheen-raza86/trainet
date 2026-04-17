'use client';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import PublicLayout, { PageHero, WaveDivider, AngleDivider } from '@/components/public/PublicLayout';

const SECTIONS = [
  { title:'Acceptance', body:'By using TRAINET, you agree to these terms. If you do not agree, do not use the platform.' },
  { title:'User Accounts', body:'You are responsible for maintaining the security of your account. Do not share credentials. Each account is for one individual only.' },
  { title:'Academic Integrity', body:'Plagiarism is strictly prohibited. Submissions flagged for high similarity will receive a grade of 0. Repeated violations may result in account suspension.' },
  { title:'Certificates', body:'Certificates are issued based on genuine completion of course requirements. Fraudulent certificates will be revoked.' },
  { title:'Intellectual Property', body:'Course materials are owned by their respective trainers. Student submissions remain the property of the student.' },
  { title:'Termination', body:'TRAINET reserves the right to suspend accounts that violate these terms without prior notice.' },
];

export default function TermsPage() {
  return (
    <PublicLayout>
      <PageHero
        icon={<DocumentTextIcon className="w-8 h-8"/>}
        title="Terms of Service"
        subtitle="Last updated: April 2026"
        accent="from-purple-500 to-blue-500"
      />
      <AngleDivider fromDark={true} toDark={false}/>
      <section className="py-20 px-6" style={{background:'#f6f3ef'}}>
        <div className="container mx-auto max-w-3xl space-y-4 stagger-children">
          {SECTIONS.map((s,i)=>(
            <div key={i} className="reveal bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all">
              <h3 className="text-slate-900 font-bold mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <WaveDivider fromDark={false} toDark={true}/>
      <section className="py-16 px-6" style={{background:'#07071a'}}>
        <div className="container mx-auto text-center reveal">
          <p className="text-white/40 text-sm">Questions? Contact us at <a href="mailto:trainet8688@gmail.com" className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">trainet8688@gmail.com</a></p>
        </div>
      </section>
    </PublicLayout>
  );
}
