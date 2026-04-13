'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type EnrollState = 'loading' | 'success' | 'error' | 'unauthenticated' | 'no_token';

function EnrollContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [state, setState] = useState<EnrollState>('loading');
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (isLoading) return; // wait for auth to resolve

    if (!token) {
      setState('no_token');
      return;
    }

    if (!isAuthenticated) {
      // Save the enroll URL so we can redirect back after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirect_after_login', `/enroll?token=${token}`);
      }
      setState('unauthenticated');
      return;
    }

    enroll();
  }, [isLoading, isAuthenticated, token]);

  const enroll = async () => {
    try {
      setState('loading');
      const res: any = await apiClient.post('/enroll/qr', { token });
      setCourseTitle(res.data?.courseTitle || 'the course');
      setOfferingId(res.data?.offeringId || null);
      setState('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Enrollment failed. The QR code may be invalid or expired.');
      setState('error');
    }
  };

  // Auto-redirect to course after 4 seconds on success
  useEffect(() => {
    if (state === 'success' && offeringId) {
      const timer = setTimeout(() => {
        router.push(`/student/courses/${offeringId}`);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state, offeringId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">TRAINET</Link>
          <p className="text-white/60 text-sm mt-1">QR Course Enrollment</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">

          {/* Loading */}
          {state === 'loading' && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Enrolling you in...</h2>
              <p className="text-white/60 text-sm">Please wait while we process your QR enrollment</p>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <CheckCircleIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Enrolled!</h2>
              <p className="text-white/80 mb-1">You have been successfully enrolled in</p>
              <p className="text-lg font-semibold text-yellow-300 mb-5">{courseTitle}</p>

              {offeringId ? (
                <div className="space-y-3">
                  <Link
                    href={`/student/courses/${offeringId}`}
                    className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition"
                  >
                    <AcademicCapIcon className="w-5 h-5" />
                    <span>Go to Course</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  <p className="text-white/40 text-xs">Redirecting automatically in 4 seconds...</p>
                </div>
              ) : (
                <Link
                  href="/student/courses"
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition"
                >
                  <span>View My Courses</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <XCircleIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Enrollment Failed</h2>
              <p className="text-white/70 text-sm mb-6">{errorMsg}</p>
              <div className="space-y-3">
                <button
                  onClick={enroll}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition"
                >
                  Try Again
                </button>
                <Link
                  href="/student/courses"
                  className="block w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm hover:bg-white/20 transition"
                >
                  Go to My Courses
                </Link>
              </div>
            </div>
          )}

          {/* Not authenticated */}
          {state === 'unauthenticated' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <AcademicCapIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
              <p className="text-white/70 text-sm mb-6">
                You need to be logged in to enroll via QR code.
                After logging in, you'll be redirected back here automatically.
              </p>
              <Link
                href={`/login`}
                className="block w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition"
              >
                Login to Enroll
              </Link>
            </div>
          )}

          {/* No token */}
          {state === 'no_token' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <XCircleIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
              <p className="text-white/70 text-sm mb-6">
                This enrollment link is missing a token. Please scan the QR code again.
              </p>
              <Link
                href="/"
                className="block w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm hover:bg-white/20 transition"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          TRAINET · QR-Based Enrollment System
        </p>
      </div>
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <EnrollContent />
    </Suspense>
  );
}
