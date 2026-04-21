'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import {
  CheckCircleIcon, XCircleIcon, AcademicCapIcon,
  ClockIcon, UserIcon, CalendarIcon,
} from '@heroicons/react/24/outline';

type PageState = 'loading_preview' | 'preview' | 'enrolling' | 'success' | 'error';

interface CoursePreview {
  offeringId: string;
  courseTitle: string;
  courseDescription: string;
  trainerName: string;
  durationWeeks: number;
  hoursPerWeek: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

function EnrollContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading_preview');
  const [preview, setPreview] = useState<CoursePreview | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setErrorMsg('This enrollment link is missing a token. Please scan the QR code again.');
      setPageState('error');
      return;
    }
    loadPreview(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadPreview = async (tok: string) => {
    setPageState('loading_preview');
    setErrorMsg('');
    try {
      // Use apiClient so the correct base URL is always used
      const res: any = await apiClient.get(`/enroll/preview?token=${encodeURIComponent(tok)}`);
      if (!res.success) {
        setErrorMsg(res.message || 'Invalid or expired QR code');
        setPageState('error');
        return;
      }
      setPreview(res.data);
      setPageState('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load course information. Please try again.');
      setPageState('error');
    }
  };

  const handleEnroll = async () => {
    if (!token) return;
    try {
      setPageState('enrolling');
      await apiClient.post('/enroll/qr', { token });
      setPageState('success');
    } catch (err: any) {
      const msg = err?.message || 'Enrollment failed. Please try again.';
      const isAuthError = msg.toLowerCase().includes('no token') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('not authenticated') ||
        msg.toLowerCase().includes('invalid or expired token');
      setErrorMsg(isAuthError
        ? 'Please log in before enrolling in this course.'
        : msg);
      setPageState('error');
    }
  };

  // Auto-redirect to course after success
  useEffect(() => {
    if (pageState === 'success' && preview?.offeringId) {
      const timer = setTimeout(() => router.push(`/student/courses/${preview.offeringId}`), 3000);
      return () => clearTimeout(timer);
    }
  }, [pageState, preview, router]);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">TRAINET</Link>
          <p className="text-white/60 text-sm mt-1">Course Enrollment</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">

          {/* Loading */}
          {pageState === 'loading_preview' && (
            <div className="p-10 text-center">
              <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-5" />
              <p className="text-white/70 text-sm">Loading course information...</p>
            </div>
          )}

          {/* Preview */}
          {(pageState === 'preview' || pageState === 'enrolling') && preview && (
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                  <AcademicCapIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide">Course Enrollment</p>
                  <h2 className="text-lg font-bold text-white leading-tight">{preview.courseTitle}</h2>
                </div>
              </div>

              {preview.courseDescription && (
                <p className="text-white/65 text-sm leading-relaxed">{preview.courseDescription}</p>
              )}

              <div className="space-y-2 bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2.5 text-sm text-white/75">
                  <UserIcon className="w-4 h-4 text-white/40 shrink-0" />
                  <span>Trainer: <span className="text-white font-medium">{preview.trainerName || 'TRAINET Trainer'}</span></span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-white/75">
                  <ClockIcon className="w-4 h-4 text-white/40 shrink-0" />
                  <span>{preview.durationWeeks} weeks · {preview.hoursPerWeek}h/week</span>
                </div>
                {preview.startDate && (
                  <div className="flex items-center gap-2.5 text-sm text-white/75">
                    <CalendarIcon className="w-4 h-4 text-white/40 shrink-0" />
                    <span>
                      {fmtDate(preview.startDate)}
                      {preview.endDate ? ` → ${fmtDate(preview.endDate)}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <button
                id="vibgxu"
                onClick={handleEnroll}
                disabled={pageState === 'enrolling'}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {pageState === 'enrolling' ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Enrolling...</>
                ) : (
                  <><CheckCircleIcon className="w-5 h-5" />Enroll in Course</>
                )}
              </button>
            </div>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <CheckCircleIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Successfully Enrolled!</h2>
              <p className="text-white/80 mb-1">You have been enrolled in</p>
              <p className="text-lg font-semibold text-yellow-300 mb-5">{preview?.courseTitle}</p>
              {preview?.offeringId && (
                <div className="space-y-3">
                  <Link href={`/student/courses/${preview.offeringId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition">
                    <AcademicCapIcon className="w-5 h-5" /><span>Go to My Courses</span>
                  </Link>
                  <p className="text-white/40 text-xs">Redirecting in 3 seconds...</p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <XCircleIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Enrollment Failed</h2>
              <p className="text-white/70 text-sm mb-6">{errorMsg}</p>
              <div className="space-y-3">
                {token && (
                  <button
                    onClick={() => loadPreview(token)}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition">
                    Try Again
                  </button>
                )}
                <Link href="/student/courses"
                  className="block w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm hover:bg-white/20 transition">
                  Go to My Courses
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">TRAINET · Secure QR Enrollment</p>
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
