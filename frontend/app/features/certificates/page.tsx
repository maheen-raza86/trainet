'use client';
import Link from 'next/link';
import { QrCodeIcon, ArrowLeftIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6"><QrCodeIcon className="w-8 h-8 text-white" /></div>
          <h1 className="text-5xl font-black text-white mb-4">QR Certificate Verification</h1>
          <p className="text-white/60 text-xl mb-12">Tamper-proof certificates with instant QR-based verification for employers</p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <ShieldCheckIcon className="w-6 h-6" />, title: 'Secure Certificates', desc: 'Each certificate has a unique UUID and QR code that cannot be forged.' },
              { icon: <QrCodeIcon className="w-6 h-6" />, title: 'QR Validation Flow', desc: 'Scan QR → verify UUID → get full certificate details instantly.' },
              { icon: <CheckCircleIcon className="w-6 h-6" />, title: 'Fraud Prevention', desc: 'Revoked certificates are flagged immediately. Status: Valid / Revoked / Invalid.' },
            ].map((c, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-3">{c.icon}</div>
                <h3 className="text-white font-bold mb-2">{c.title}</h3>
                <p className="text-white/60 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Verification Flow</h2>
            <div className="space-y-3 text-white/70">
              <p>1. Student completes ≥60% of course assignments → certificate auto-issued.</p>
              <p>2. Certificate contains a unique UUID and QR code linking to the verification page.</p>
              <p>3. Employer scans QR → system checks UUID → returns: VALID, REVOKED, or INVALID.</p>
              <p>4. Every verification is logged for audit purposes.</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/verify-certificate/demo" className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105">Try Verification</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
