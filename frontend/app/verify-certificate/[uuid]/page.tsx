'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckBadgeIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import BrandLogo from '@/components/BrandLogo';

interface VerificationResult {
  status: 'VALID' | 'INVALID' | 'REVOKED';
  message: string;
  details?: {
    certificateUuid: string;
    studentName: string;
    courseName: string;
    courseDescription: string;
    trainerName: string | null;
    issueDate: string;
    completionPercentage: number;
    averageScore: number | null;
  };
  revokedAt?: string;
  revokeReason?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

function VerificationContent() {
  const params = useParams();
  const uuid = params.uuid as string;

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) return;
    verify();
  }, [uuid]);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/certificates/verify/${uuid}`);
      const json = await res.json();
      setResult(json.data);
    } catch {
      setResult({ status: 'INVALID', message: 'Failed to connect to verification server.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white/80">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* TRAINET Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo size="lg" stacked />
          </Link>
          <p className="text-white/60 text-sm mt-2">Certificate Verification System</p>
        </div>

        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden shadow-2xl">

          {/* Status Banner */}
          <div className={`p-6 text-center ${
            result?.status === 'VALID'
              ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30'
              : result?.status === 'REVOKED'
              ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30'
              : 'bg-gradient-to-r from-gray-500/30 to-slate-500/30'
          }`}>
            <div className="flex justify-center mb-3">
              {result?.status === 'VALID' ? (
                <CheckBadgeIcon className="w-16 h-16 text-green-400" />
              ) : result?.status === 'REVOKED' ? (
                <ExclamationTriangleIcon className="w-16 h-16 text-red-400" />
              ) : (
                <XCircleIcon className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              result?.status === 'VALID' ? 'text-green-300' :
              result?.status === 'REVOKED' ? 'text-red-300' : 'text-gray-300'
            }`}>
              {result?.status}
            </h1>
            <p className="text-white/80">{result?.message}</p>
          </div>

          {/* Certificate Details (VALID only) */}
          {result?.status === 'VALID' && result.details && (
            <div className="p-6 space-y-6">
              {/* Course + Student */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <AcademicCapIcon className="w-5 h-5 text-purple-300" />
                    <p className="text-xs text-white/60 uppercase tracking-wider">Course</p>
                  </div>
                  <p className="text-white font-semibold">{result.details.courseName}</p>
                  {result.details.courseDescription && (
                    <p className="text-white/60 text-xs mt-1 line-clamp-2">{result.details.courseDescription}</p>
                  )}
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="w-5 h-5 text-blue-300" />
                    <p className="text-xs text-white/60 uppercase tracking-wider">Student</p>
                  </div>
                  <p className="text-white font-semibold">{result.details.studentName}</p>
                  {result.details.trainerName && (
                    <p className="text-white/60 text-xs mt-1">Instructor: {result.details.trainerName}</p>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <p className="text-2xl font-bold text-white">{result.details.completionPercentage}%</p>
                  <p className="text-xs text-white/60 mt-1">Completion</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <p className="text-2xl font-bold text-white">
                    {result.details.averageScore !== null ? `${result.details.averageScore}` : '—'}
                  </p>
                  <p className="text-xs text-white/60 mt-1">Avg Score</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <ClockIcon className="w-5 h-5 text-white/60 mx-auto mb-1" />
                  <p className="text-xs text-white font-medium">{formatDate(result.details.issueDate)}</p>
                  <p className="text-xs text-white/60 mt-0.5">Issue Date</p>
                </div>
              </div>

              {/* QR Code + UUID */}
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-xl">
                  <QRCodeSVG
                    value={`${FRONTEND_URL}/verify-certificate/${result.details.certificateUuid}`}
                    size={120}
                    level="H"
                    fgColor="#1e1b4b"
                  />
                </div>
                <p className="text-xs text-white/40 font-mono text-center break-all px-4">
                  {result.details.certificateUuid}
                </p>
              </div>

              {/* Verified badge */}
              <div className="flex items-center justify-center space-x-2 bg-green-500/20 rounded-xl p-3 border border-green-500/30">
                <CheckBadgeIcon className="w-5 h-5 text-green-400" />
                <p className="text-green-300 text-sm font-medium">
                  Verified by TRAINET — This certificate is authentic
                </p>
              </div>
            </div>
          )}

          {/* REVOKED details */}
          {result?.status === 'REVOKED' && (
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                <p className="text-sm font-medium text-red-300 mb-1">Certificate Revoked</p>
                <p className="text-white/70 text-sm">
                  This certificate was revoked and is no longer valid for verification purposes.
                </p>
                {result.revokedAt && (
                  <p className="text-white/50 text-xs mt-2">
                    Revoked on: {new Date(result.revokedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              {result.revokeReason && (
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Reason for Revocation</p>
                  <p className="text-white/80 text-sm">{result.revokeReason}</p>
                </div>
              )}
            </div>
          )}

          {/* INVALID details */}
          {result?.status === 'INVALID' && (
            <div className="p-6 text-center">
              <p className="text-white/70 text-sm">
                The certificate ID you scanned does not exist in our system.
                This may indicate a forged or incorrect certificate.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 pb-6">
            <Link
              href="/"
              className="block w-full text-center py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm hover:bg-white/20 transition"
            >
              ← Back to TRAINET
            </Link>
          </div>
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
