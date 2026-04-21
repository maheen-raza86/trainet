'use client';

/**
 * CertificateTemplate
 * Premium certificate design matching the TRAINET reference image.
 * Used in the student certificates modal and as a print template.
 *
 * Props come directly from the existing /certificates/my API response —
 * no backend changes required.
 */

import { QRCodeSVG } from 'qrcode.react';

interface CertificateTemplateProps {
  studentName: string;
  courseName: string;
  courseDescription?: string;
  trainerName?: string;
  completionPercentage: number;
  averageScore: number | null;
  issueDate: string;
  certificateUuid: string;
  verificationUrl: string;
  /** compact = smaller font sizes for card thumbnail preview */
  compact?: boolean;
}

/** Convert numeric score to letter grade */
export function scoreToGrade(score: number | null): string {
  if (score === null || score === undefined) return '—';
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'C+';
  if (score >= 60) return 'C';
  return 'D';
}

/** Format date as "April 21, 2026" */
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Truncate course description to ~2 lines for the certificate body */
function buildCourseText(courseName: string, description: string | undefined, trainerName: string | undefined): string {
  const desc = description?.trim();
  const trainer = trainerName || 'TRAINET';
  if (!desc) {
    return `for successfully completing the ${courseName} course instructed by ${trainer} at TRAINET.`;
  }
  // Truncate description to ~120 chars
  const shortDesc = desc.length > 120 ? desc.slice(0, 117) + '…' : desc;
  return `for successfully completing the ${courseName} course on ${shortDesc} instructed by ${trainer} at TRAINET.`;
}

export default function CertificateTemplate({
  studentName,
  courseName,
  courseDescription,
  trainerName,
  completionPercentage,
  averageScore,
  issueDate,
  certificateUuid,
  verificationUrl,
  compact = false,
}: CertificateTemplateProps) {
  const grade = scoreToGrade(averageScore);
  const courseText = buildCourseText(courseName, courseDescription, trainerName);
  const shortId = certificateUuid.slice(0, 36);

  const s = compact
    ? {
        // thumbnail sizes
        title:    'text-[10px]',
        heading:  'text-[8px]',
        sub:      'text-[6px]',
        name:     'text-[13px]',
        body:     'text-[5.5px]',
        meta:     'text-[5px]',
        idText:   'text-[4.5px]',
        qrSize:   36,
        sealSize: 'w-10 h-10',
        sealText: 'text-[5px]',
        pad:      'p-2',
        gap:      'gap-1',
        border:   'border',
        ribbon:   'w-12 h-16',
      }
    : {
        // full modal sizes
        title:    'text-2xl',
        heading:  'text-lg',
        sub:      'text-xs',
        name:     'text-4xl',
        body:     'text-sm',
        meta:     'text-sm',
        idText:   'text-xs',
        qrSize:   88,
        sealSize: 'w-20 h-20',
        sealText: 'text-[10px]',
        pad:      'p-6',
        gap:      'gap-3',
        border:   'border-2',
        ribbon:   'w-20 h-28',
      };

  return (
    <div
      className="relative overflow-hidden bg-white select-none"
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        aspectRatio: '1.414 / 1', // A4 landscape ratio
        border: compact ? '1px solid #c9a84c' : '3px solid #c9a84c',
        borderRadius: compact ? 4 : 8,
      }}
    >
      {/* ── Blue ribbon — top-left ── */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <svg
          viewBox="0 0 200 200"
          className={compact ? 'w-24 h-24' : 'w-48 h-48'}
          fill="none"
        >
          {/* outer blue shape */}
          <path d="M0 0 L200 0 L0 200 Z" fill="#1a3a8f" opacity="0.95" />
          {/* gold accent stripe */}
          <path d="M0 0 L210 0 L0 210 Z" fill="none"
            stroke="#c9a84c" strokeWidth={compact ? 2 : 4} opacity="0.9" />
          {/* inner lighter blue */}
          <path d="M0 0 L140 0 L0 140 Z" fill="#2451b3" opacity="0.6" />
        </svg>
      </div>

      {/* ── Blue ribbon — bottom-right ── */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <svg
          viewBox="0 0 200 200"
          className={compact ? 'w-24 h-24' : 'w-48 h-48'}
          fill="none"
        >
          <path d="M200 200 L0 200 L200 0 Z" fill="#1a3a8f" opacity="0.95" />
          <path d="M200 200 L-10 200 L200 -10 Z" fill="none"
            stroke="#c9a84c" strokeWidth={compact ? 2 : 4} opacity="0.9" />
          <path d="M200 200 L60 200 L200 60 Z" fill="#2451b3" opacity="0.6" />
        </svg>
      </div>

      {/* ── Gold inner border ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: compact ? 6 : 14,
          border: compact ? '1px solid #c9a84c' : '1.5px solid #c9a84c',
          borderRadius: compact ? 2 : 4,
          opacity: 0.7,
          zIndex: 2,
        }}
      />

      {/* ── Achievement seal — top-right ── */}
      <div
        className={`absolute top-0 right-0 flex flex-col items-center justify-center ${s.sealSize}`}
        style={{
          zIndex: 10,
          marginTop: compact ? 4 : 10,
          marginRight: compact ? 4 : 10,
        }}
      >
        {/* Outer gold ring */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 35% 35%, #f5d060, #c9a84c 60%, #a07830)',
            boxShadow: compact ? '0 1px 4px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.35)',
          }}
        >
          {/* Inner navy circle */}
          <div
            className="absolute rounded-full flex flex-col items-center justify-center"
            style={{
              width: '72%',
              height: '72%',
              background: 'radial-gradient(circle at 40% 40%, #2451b3, #1a3a8f)',
            }}
          >
            <span
              className={`font-bold text-white text-center leading-tight ${s.sealText}`}
              style={{ fontFamily: 'sans-serif' }}
            >
              BEST<br />AWARD<br />★★★★★
            </span>
          </div>
          {/* Ribbon tails */}
          {!compact && (
            <>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full"
                style={{ width: 0, height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '14px solid #1a3a8f',
                  marginLeft: -6,
                }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full"
                style={{ width: 0, height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '14px solid #1a3a8f',
                  marginLeft: 6,
                }} />
            </>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        className={`relative flex flex-col items-center text-center ${s.pad}`}
        style={{ zIndex: 5, height: '100%' }}
      >
        {/* TRAINET title */}
        <div className={compact ? 'mt-1' : 'mt-2'}>
          <p
            className={`font-black tracking-widest text-[#1a3a8f] ${s.title}`}
            style={{ fontFamily: 'sans-serif', letterSpacing: '0.15em' }}
          >
            TRAINET
          </p>
          <p
            className={`font-bold tracking-widest text-[#1a3a8f] ${s.heading}`}
            style={{ fontFamily: 'sans-serif', letterSpacing: '0.2em' }}
          >
            CERTIFICATE
          </p>
          {/* Gold "OF COMPLETION" line */}
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <div className="flex-1 h-px bg-[#c9a84c] opacity-60" style={{ maxWidth: compact ? 20 : 50 }} />
            <p
              className={`text-[#c9a84c] font-semibold tracking-widest ${s.sub}`}
              style={{ fontFamily: 'sans-serif' }}
            >
              OF COMPLETION
            </p>
            <div className="flex-1 h-px bg-[#c9a84c] opacity-60" style={{ maxWidth: compact ? 20 : 50 }} />
          </div>
        </div>

        {/* Presented to */}
        <p
          className={`text-gray-500 tracking-widest uppercase mt-1 ${compact ? 'text-[5px]' : 'text-[10px]'}`}
          style={{ fontFamily: 'sans-serif' }}
        >
          THIS CERTIFICATE IS PROUDLY PRESENTED TO :
        </p>

        {/* Student name — cursive/script style */}
        <p
          className={`text-[#1a3a8f] font-bold leading-tight ${s.name}`}
          style={{
            fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
            marginTop: compact ? 2 : 6,
            marginBottom: compact ? 2 : 4,
          }}
        >
          {studentName}
        </p>

        {/* Divider line under name */}
        <div
          className="bg-[#1a3a8f] opacity-30"
          style={{
            height: compact ? 0.5 : 1,
            width: compact ? '50%' : '60%',
            marginBottom: compact ? 2 : 6,
          }}
        />

        {/* Course completion text */}
        <p
          className={`text-gray-700 leading-relaxed px-4 ${s.body}`}
          style={{ maxWidth: compact ? '90%' : '80%' }}
        >
          {courseText.split(new RegExp(`(${courseName}|${trainerName || 'TRAINET'}|TRAINET)`, 'g')).map((part, i) =>
            [courseName, trainerName, 'TRAINET'].includes(part)
              ? <strong key={i} className="text-[#1a3a8f]">{part}</strong>
              : part
          )}
        </p>

        {/* Metrics row */}
        <div
          className={`flex items-center justify-center text-gray-700 font-medium ${s.meta} ${compact ? 'gap-2 mt-1' : 'gap-4 mt-3'}`}
        >
          <span>
            Completion: <strong className="text-[#1a3a8f]">{completionPercentage}%</strong>
          </span>
          <span className="text-[#c9a84c]">|</span>
          <span>
            Grade: <strong className="text-[#1a3a8f]">{grade}</strong>
          </span>
          <span className="text-[#c9a84c]">|</span>
          <span>
            Issue Date: <strong className="text-[#1a3a8f]">{fmtDate(issueDate)}</strong>
          </span>
          {/* QR inline for compact */}
          {compact && (
            <>
              <span className="text-[#c9a84c]">|</span>
              <div className="bg-white rounded p-0.5 shadow">
                <QRCodeSVG value={verificationUrl} size={s.qrSize} level="H" fgColor="#1a3a8f" />
              </div>
            </>
          )}
        </div>

        {/* Bottom section — only in full mode */}
        {!compact && (
          <div
            className="w-full flex items-end justify-between mt-auto pt-3"
            style={{ borderTop: '1px solid rgba(201,168,76,0.3)' }}
          >
            {/* Certificate ID + trainer */}
            <div className="text-left">
              <p className={`text-gray-400 font-mono ${s.idText}`}>
                Certificate ID: {shortId}
              </p>
              {trainerName && (
                <p className={`text-gray-500 mt-0.5 ${s.idText}`}>
                  Trainer: <span className="font-semibold text-[#1a3a8f]">{trainerName}</span>
                </p>
              )}
              <p className={`text-gray-400 mt-0.5 ${s.idText}`}>
                Verified and issued by TRAINET Learning Platform
              </p>
            </div>

            {/* QR + scan label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="bg-white rounded-lg shadow-md"
                style={{ padding: 6, border: '1.5px solid #c9a84c' }}
              >
                <QRCodeSVG
                  value={verificationUrl}
                  size={s.qrSize}
                  level="H"
                  fgColor="#1a3a8f"
                />
              </div>
              <p className={`text-gray-500 ${s.idText}`}>Scan to Verify</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
