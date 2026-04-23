'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import BrandLogo from '@/components/BrandLogo';

function VerificationContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* TRAINET Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo size="lg" stacked />
          </Link>
          <p className="text-white/60 text-sm mt-2">Certificate Verification System</p>
        </div>

        {/* CTA */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-10 shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 8px 28px rgba(16,185,129,0.40)' }}>
            <CheckBadgeIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Earn Your Certificate</h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            Complete a TRAINET course to earn a QR-verified certificate that employers can instantly verify.
          </p>
          <Link href="/signup"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 text-sm"
            style={{ boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
            Join as Student to Earn Certificate
          </Link>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          TRAINET Certificate Verification · Powered by TRAINET Learning Platform
        </p>
      </div>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white" />
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}
