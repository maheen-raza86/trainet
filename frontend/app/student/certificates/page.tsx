'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  TrophyIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Certificate {
  id: string;
  certificate_uuid: string;
  issue_date: string;
  status: 'valid' | 'revoked';
  completion_percentage: number;
  average_score: number | null;
  qr_code_data: string | null;
  courses: { id: string; title: string; description: string };
  course_offerings: {
    id: string;
    duration_weeks: number;
    profiles: { first_name: string; last_name: string } | null;
  };
}

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCert, setViewCert] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/certificates/my');
      setCertificates(res.data?.certificates || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const verificationUrl = (uuid: string) => `${FRONTEND_URL}/verify-certificate/${uuid}`;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-600 mt-1">Your earned certificates with QR verification</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30 flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30 flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <CheckBadgeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid</p>
              <p className="text-2xl font-bold text-gray-900">{certificates.filter(c => c.status === 'valid').length}</p>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30 flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.length > 0
                  ? Math.round(
                      certificates
                        .filter(c => c.average_score !== null)
                        .reduce((s, c) => s + (c.average_score || 0), 0) /
                        Math.max(1, certificates.filter(c => c.average_score !== null).length)
                    )
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden hover:shadow-lg transition">
                {/* Certificate Banner */}
                <div className="h-36 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-between px-6">
                  <div className="text-white">
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-1">Certificate of Completion</p>
                    <p className="text-lg font-bold leading-tight">{cert.courses.title}</p>
                    {cert.status === 'revoked' && (
                      <span className="mt-1 inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">Revoked</span>
                    )}
                  </div>
                  {/* QR Code */}
                  <div className="bg-white rounded-xl p-2 shadow-lg">
                    <QRCodeSVG
                      value={verificationUrl(cert.certificate_uuid)}
                      size={72}
                      level="H"
                      fgColor="#1e1b4b"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                      Issued: {formatDate(cert.issue_date)}
                    </p>
                    {cert.course_offerings?.profiles && (
                      <p>👨‍🏫 {cert.course_offerings.profiles.first_name} {cert.course_offerings.profiles.last_name}</p>
                    )}
                    <p>📊 Completion: {cert.completion_percentage}%
                      {cert.average_score !== null && ` · Score: ${cert.average_score}/100`}
                    </p>
                    <p className="text-xs text-gray-400 font-mono break-all">ID: {cert.certificate_uuid}</p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setViewCert(cert)}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition"
                    >
                      View Certificate
                    </button>
                    <Link
                      href={`/verify-certificate/${cert.certificate_uuid}`}
                      target="_blank"
                      className="flex items-center justify-center px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/30">
            <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-gray-600 mb-6">Complete course assignments to earn certificates</p>
            <Link href="/student/courses" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition">
              Go to My Courses
            </Link>
          </div>
        )}
      </div>

      {/* Certificate View Modal */}
      {viewCert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Certificate Document */}
            <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 text-white text-center relative">
              {/* Decorative border */}
              <div className="absolute inset-3 border-2 border-white/20 rounded-2xl pointer-events-none" />

              <div className="relative">
                <p className="text-xs font-semibold tracking-[0.3em] text-white/60 uppercase mb-2">TRAINET</p>
                <h2 className="text-2xl font-bold mb-1">Certificate of Completion</h2>
                <p className="text-white/70 text-sm mb-6">This certifies that</p>

                <p className="text-3xl font-bold text-yellow-300 mb-1">
                  {/* Student name shown from cert data — fetched via API */}
                  Course Graduate
                </p>

                <p className="text-white/70 text-sm mb-2">has successfully completed</p>
                <p className="text-xl font-semibold text-white mb-1">{viewCert.courses.title}</p>
                {viewCert.course_offerings?.profiles && (
                  <p className="text-white/60 text-sm mb-4">
                    Instructed by {viewCert.course_offerings.profiles.first_name} {viewCert.course_offerings.profiles.last_name}
                  </p>
                )}

                <div className="flex justify-center items-center space-x-8 mb-6">
                  <div>
                    <p className="text-xs text-white/50">Completion</p>
                    <p className="text-lg font-bold">{viewCert.completion_percentage}%</p>
                  </div>
                  {viewCert.average_score !== null && (
                    <div>
                      <p className="text-xs text-white/50">Score</p>
                      <p className="text-lg font-bold">{viewCert.average_score}/100</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-white/50">Issue Date</p>
                    <p className="text-sm font-medium">{formatDate(viewCert.issue_date)}</p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white rounded-2xl p-3 shadow-xl">
                    <QRCodeSVG
                      value={verificationUrl(viewCert.certificate_uuid)}
                      size={100}
                      level="H"
                      fgColor="#1e1b4b"
                    />
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-2">Scan to verify authenticity</p>
                <p className="text-xs text-white/30 font-mono mt-1">{viewCert.certificate_uuid}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 flex space-x-3">
              <Link
                href={`/verify-certificate/${viewCert.certificate_uuid}`}
                target="_blank"
                className="flex-1 py-2 text-center border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Verify Online
              </Link>
              <button
                onClick={() => setViewCert(null)}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
