'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckBadgeIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import BrandLogo from '@/components/BrandLogo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CertificateDetails {
  certificateUuid: string;
  studentName: string;
  courseName: string;
  courseDescription?: string;
  trainerName?: string | null;
  issueDate?: string;
  completionPercentage?: number;
  averageScore?: number | null;
}

interface VerifyResult {
  status: 'VALID' | 'INVALID' | 'REVOKED';
  message: string;
  details?: CertificateDetails;
  revokedAt?: string | null;
  revokeReason?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VerifyCertificatePage() {
  const params = useParams();
  const uuid = params?.uuid as string | undefined;

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) {
      setError('No certificate ID provided in the URL.');
      setLoading(false);
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      setError('API URL is not configured.');
      setLoading(false);
      return;
    }

    // Public endpoint — no auth token needed
    fetch(`${apiBase}/certificates/verify/${uuid}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Verification failed');
        }
        setResult(json.data as VerifyResult);
      })
      .catch((err) => {
        setError(err.message || 'Could not reach the verification server.');
      })
      .finally(() => setLoading(false));
  }, [uuid]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white/60 text-sm">Verifying certificate…</p>
        </div>
      </div>
    );
  }

  // ── Shared page shell ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex justify-center">
            <BrandLogo size="lg" />
          </Link>
          <p className="text-white/60 text-sm mt-2">Certificate Verification System</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl">
          {error ? (
            <ErrorState message={error} />
          ) : result?.status === 'VALID' ? (
            <ValidState details={result.details!} message={result.message} />
          ) : result?.status === 'REVOKED' ? (
            <RevokedState
              message={result.message}
              revokedAt={result.revokedAt}
              reason={result.revokeReason}
            />
          ) : (
            <InvalidState message={result?.message || 'Certificate not found.'} />
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          TRAINET Certificate Verification · Powered by TRAINET Learning Platform
        </p>
      </div>
    </div>
  );
}

// ─── State sub-components ─────────────────────────────────────────────────────

function ValidState({ details, message }: { details: CertificateDetails; message: string }) {
  return (
    <div className="text-center">
      {/* Badge */}
      <div
        className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ boxShadow: '0 8px 28px rgba(16,185,129,0.40)' }}
      >
        <CheckBadgeIcon className="w-8 h-8 text-white" />
      </div>

      <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full mb-3 tracking-widest uppercase">
        ✓ Valid Certificate
      </span>
      <p className="text-white/60 text-sm mb-6">{message}</p>

      {/* Details grid */}
      <div className="text-left space-y-3">
        <DetailRow label="Student" value={details.studentName} />
        <DetailRow label="Course" value={details.courseName} />
        {details.trainerName && (
          <DetailRow label="Trainer" value={details.trainerName} />
        )}
        {details.issueDate && (
          <DetailRow label="Issued On" value={formatDate(details.issueDate)} />
        )}
        {details.completionPercentage !== undefined && (
          <DetailRow label="Completion" value={`${details.completionPercentage}%`} />
        )}
        {details.averageScore !== null && details.averageScore !== undefined && (
          <DetailRow label="Average Score" value={`${details.averageScore} / 100`} />
        )}
        <DetailRow
          label="Certificate ID"
          value={details.certificateUuid}
          mono
        />
      </div>
    </div>
  );
}

function InvalidState({ message }: { message: string }) {
  return (
    <div className="text-center">
      <div
        className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ boxShadow: '0 8px 28px rgba(239,68,68,0.40)' }}
      >
        <XCircleIcon className="w-8 h-8 text-white" />
      </div>
      <span className="inline-block px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full mb-3 tracking-widest uppercase">
        ✗ Invalid Certificate
      </span>
      <p className="text-white/70 text-sm leading-relaxed">{message}</p>
    </div>
  );
}

function RevokedState({
  message,
  revokedAt,
  reason,
}: {
  message: string;
  revokedAt?: string | null;
  reason?: string | null;
}) {
  return (
    <div className="text-center">
      <div
        className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ boxShadow: '0 8px 28px rgba(249,115,22,0.40)' }}
      >
        <ExclamationTriangleIcon className="w-8 h-8 text-white" />
      </div>
      <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-300 text-xs font-bold rounded-full mb-3 tracking-widest uppercase">
        ⚠ Revoked
      </span>
      <p className="text-white/70 text-sm leading-relaxed mb-4">{message}</p>
      {revokedAt && (
        <p className="text-white/40 text-xs">Revoked on: {formatDate(revokedAt)}</p>
      )}
      {reason && (
        <p className="text-white/40 text-xs mt-1">Reason: {reason}</p>
      )}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <XCircleIcon className="w-8 h-8 text-white/50" />
      </div>
      <span className="inline-block px-3 py-1 bg-white/10 text-white/50 text-xs font-bold rounded-full mb-3 tracking-widest uppercase">
        Error
      </span>
      <p className="text-white/60 text-sm leading-relaxed">{message}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/10 last:border-0">
      <span className="text-white/50 text-xs font-medium shrink-0">{label}</span>
      <span
        className={`text-white text-xs text-right break-all ${mono ? 'font-mono' : 'font-medium'}`}
      >
        {value}
      </span>
    </div>
  );
}
