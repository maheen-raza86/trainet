'use client';
import Link from 'next/link';
import { TrophyIcon, ArrowLeftIcon, QrCodeIcon } from '@heroicons/react/24/outline';

export default function CertificatesPublicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><TrophyIcon className="w-8 h-8 text-white" /></div>
        <h1 className="text-4xl font-black text-white mb-4">TRAINET Certificates</h1>
        <p className="text-white/60 mb-8">QR-verified certificates issued upon course completion. Employers can verify authenticity instantly.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105">Earn a Certificate</Link>
          <Link href="/features/certificates" className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-bold hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
            <QrCodeIcon className="w-5 h-5" />How It Works
          </Link>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mt-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back to Home</Link>
      </div>
    </div>
  );
}
