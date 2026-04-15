'use client';
import Link from 'next/link';
import { SparklesIcon, ArrowLeftIcon, CpuChipIcon, UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back to Home</Link>
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6"><SparklesIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-5xl font-black text-white mb-4">About TRAINET</h1>
        <p className="text-white/60 text-xl mb-12">A next-generation AI-powered learning and career development ecosystem</p>
        <div className="space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2"><CpuChipIcon className="w-6 h-6 text-purple-400" />Our Vision</h2>
            <p className="text-white/70 leading-relaxed">TRAINET is built to bridge the gap between education and employment. By combining AI-powered evaluation, QR-verified credentials, alumni mentorship, and intelligent talent matching, we create a complete ecosystem where learners grow, trainers teach effectively, alumni give back, and recruiters find verified talent.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-blue-400" />AI at the Core</h2>
            <p className="text-white/70 leading-relaxed">Every aspect of TRAINET is enhanced by AI: assignments are auto-graded using rule-based logic, plagiarism is detected via cosine similarity, course recommendations are generated from real performance data, and talent matching uses a weighted scoring algorithm based on skills, projects, and grades.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2"><ShieldCheckIcon className="w-6 h-6 text-green-400" />Trust & Security</h2>
            <p className="text-white/70 leading-relaxed">All certificates are QR-verified and tamper-proof. Enrollment is secured via QR tokens with expiry and role validation. Student data is protected with role-based access control and Row Level Security at the database level.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2"><UsersIcon className="w-6 h-6 text-orange-400" />The Ecosystem</h2>
            <p className="text-white/70 leading-relaxed">TRAINET serves five roles: Students learn and earn certificates. Trainers create and manage courses. Alumni mentor and network. Recruiters discover talent. Admins oversee the platform. Each role has a dedicated dashboard with role-specific features and analytics.</p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105">Join TRAINET</Link>
        </div>
      </div>
    </div>
  );
}
