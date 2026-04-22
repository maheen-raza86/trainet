'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import BrandLogo from '@/components/BrandLogo';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <BrandLogo size="lg" stacked textClassName="text-gray-900" />
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>

          {message === 'check' ? (
            <>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to your email address. Please check your inbox and
                click the link to verify your account.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Didn't receive the email?</strong>
                  <br />
                  Check your spam folder or wait a few minutes and try again.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Your email has been verified successfully! You can now login to your account.
              </p>
            </>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/support" className="text-primary-500 hover:text-primary-600">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
