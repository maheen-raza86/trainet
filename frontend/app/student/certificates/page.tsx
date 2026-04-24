'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import CertificateTemplate, { scoreToGrade } from '@/components/CertificateTemplate';
import apiClient from '@/lib/api/client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  TrophyIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
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

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCert, setViewCert] = useState<Certificate | null>(null);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [certRes, profileRes]: any[] = await Promise.all([
        apiClient.get('/certificates/my'),
        apiClient.get('/users/profile').catch(() => null),
      ]);
      setCertificates(certRes.data?.certificates || []);
      if (profileRes?.data) {
        setStudentName(`${profileRes.data.firstName || ''} ${profileRes.data.lastName || ''}`.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const verificationUrl = (uuid: string) =>
    `${FRONTEND_URL}/verify-certificate/${uuid}`;

  const trainerName = (cert: Certificate) => {
    const p = cert.course_offerings?.profiles;
    return p ? `${p.first_name} ${p.last_name}` : undefined;
  };

  // ── Print: browser print dialog only ──────────────────────────────────
  const handlePrint = () => window.print();

  // ── Download PDF: html2canvas → jsPDF, landscape A4 ──────────────────
  const handleDownloadPdf = async () => {
    if (!certRef.current || !viewCert) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF }   = await import('jspdf');

      const canvas = await html2canvas(certRef.current, {
        scale: 3,           // high resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      // A4 landscape in mm: 297 × 210
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Scale image to fill the page while preserving aspect ratio
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pageW / imgW, pageH / imgH);
      const drawW = imgW * ratio;
      const drawH = imgH * ratio;
      const offsetX = (pageW - drawW) / 2;
      const offsetY = (pageH - drawH) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);

      const safeName = viewCert.courses.title.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`TRAINET_${safeName}_Certificate.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('PDF download failed. Please use Print instead.');
    } finally {
      setDownloading(false);
    }
  };

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

        {/* ── Header — subtitle removed ── */}
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
        )}

        {/* ── Stats — only 2 cards (Valid removed) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Best Grade</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.length > 0
                  ? scoreToGrade(
                      Math.max(
                        ...certificates
                          .filter(c => c.average_score !== null)
                          .map(c => c.average_score as number)
                      ) || null
                    )
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Certificates Grid ── */}
        {certificates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                onClick={() => setViewCert(cert)}
                title="Click to view full certificate"
              >
                {/* ── Thumbnail: clipped top portion of certificate ── */}
                <div
                  className="relative overflow-hidden"
                  style={{ height: 110 }}
                >
                  {/* Scale the full template down and clip to show top section */}
                  <div
                    style={{
                      transform: 'scale(0.38)',
                      transformOrigin: 'top center',
                      width: '263%',       // 100 / 0.38 ≈ 263
                      marginLeft: '-81.5%', // center it: (263-100)/2
                      pointerEvents: 'none',
                    }}
                  >
                    <CertificateTemplate
                      studentName={studentName || 'Student'}
                      courseName={cert.courses.title}
                      courseDescription={cert.courses.description}
                      trainerName={trainerName(cert)}
                      completionPercentage={cert.completion_percentage}
                      averageScore={cert.average_score}
                      issueDate={cert.issue_date}
                      certificateUuid={cert.certificate_uuid}
                      verificationUrl={verificationUrl(cert.certificate_uuid)}
                      compact={false}
                    />
                  </div>
                  {/* Fade-out gradient at bottom of thumbnail */}
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: 36,
                      background: 'linear-gradient(to bottom, transparent, white)',
                    }}
                  />
                </div>

                {/* ── Card footer ── */}
                <div className="px-3 py-2.5 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                    {cert.courses.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-gray-500">
                      Grade:{' '}
                      <span className="font-semibold text-[#1a3a8f]">
                        {scoreToGrade(cert.average_score)}
                      </span>
                    </p>
                    <Link
                      href={`/verify-certificate/${cert.certificate_uuid}`}
                      target="_blank"
                      onClick={e => e.stopPropagation()}
                      className="text-gray-400 hover:text-[#1a3a8f] transition"
                      title="Verify online"
                    >
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
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
            <Link
              href="/student/courses"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition"
            >
              Go to My Courses
            </Link>
          </div>
        )}
      </div>

      {/* ── Full Certificate Modal ── */}
      {viewCert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-auto">

            {/* Modal toolbar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">Certificate of Completion</p>
              <div className="flex gap-2">

                {/* Print button — browser dialog only */}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-xs hover:bg-white/20 transition"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  Print
                </button>

                {/* Download PDF button — html2canvas + jsPDF */}
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a84c] text-white rounded-lg text-xs hover:bg-[#b8943e] transition disabled:opacity-60"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  {downloading ? 'Generating…' : 'Download PDF'}
                </button>

                {/* Verify Online */}
                <Link
                  href={`/verify-certificate/${viewCert.certificate_uuid}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-xs hover:bg-white/20 transition"
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  Verify Online
                </Link>

                {/* Close */}
                <button
                  onClick={() => setViewCert(null)}
                  className="flex items-center justify-center w-8 h-8 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Certificate — captured by html2canvas for PDF */}
            <div id="certificate-print-area" ref={certRef}>
              <CertificateTemplate
                studentName={studentName || 'Student'}
                courseName={viewCert.courses.title}
                courseDescription={viewCert.courses.description}
                trainerName={trainerName(viewCert)}
                completionPercentage={viewCert.completion_percentage}
                averageScore={viewCert.average_score}
                issueDate={viewCert.issue_date}
                certificateUuid={viewCert.certificate_uuid}
                verificationUrl={verificationUrl(viewCert.certificate_uuid)}
                compact={false}
              />
            </div>

            {/* Revoked warning */}
            {viewCert.status === 'revoked' && (
              <div className="mt-3 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-center">
                <p className="text-red-300 text-sm font-medium">
                  ⚠ This certificate has been revoked and is no longer valid.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print styles — only the certificate area, landscape A4 */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-print-area,
          #certificate-print-area * { visibility: visible !important; }
          #certificate-print-area {
            position: fixed !important;
            top: 0; left: 0;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999;
          }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </DashboardLayout>
  );
}
