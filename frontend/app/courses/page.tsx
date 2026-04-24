'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import PublicLayout, {
  PageHero,
  AngleDivider,
  WaveDivider,
} from '@/components/public/PublicLayout';

const API = process.env.NEXT_PUBLIC_API_URL;

/* Gradient palette — cycles through for each card */
const CARD_ACCENTS = [
  { color: 'from-purple-500 to-blue-500',   accent: '#8b5cf6', border: 'rgba(139,92,246,0.35)' },
  { color: 'from-blue-500 to-cyan-500',     accent: '#3b82f6', border: 'rgba(59,130,246,0.35)'  },
  { color: 'from-indigo-500 to-purple-500', accent: '#6366f1', border: 'rgba(99,102,241,0.35)'  },
  { color: 'from-violet-500 to-pink-500',   accent: '#7c3aed', border: 'rgba(124,58,237,0.35)'  },
  { color: 'from-cyan-500 to-blue-600',     accent: '#0ea5e9', border: 'rgba(14,165,233,0.35)'  },
  { color: 'from-rose-500 to-purple-600',   accent: '#f43f5e', border: 'rgba(244,63,94,0.35)'   },
];

/* Extract a short skill tag from a course title */
function extractTags(title: string): string[] {
  if (!title) return [];
  const lower = title.toLowerCase();
  const map: [string, string][] = [
    ['cybersecurity', 'Cybersecurity'], ['security', 'Security'],
    ['devops', 'DevOps'], ['docker', 'Docker'], ['kubernetes', 'Kubernetes'],
    ['networking', 'Networking'], ['ccna', 'CCNA'], ['cisco', 'Cisco'],
    ['cloud', 'Cloud'], ['aws', 'AWS'], ['azure', 'Azure'],
    ['system admin', 'SysAdmin'], ['administration', 'SysAdmin'], ['linux', 'Linux'],
    ['python', 'Python'], ['javascript', 'JavaScript'], ['react', 'React'],
    ['node', 'Node.js'], ['java', 'Java'], ['machine learning', 'ML'],
    ['data science', 'Data Science'], ['ai', 'AI'], ['web', 'Web Dev'],
    ['database', 'Database'], ['sql', 'SQL'], ['mobile', 'Mobile'],
    ['ui', 'UI/UX'], ['ux', 'UI/UX'], ['figma', 'Figma'],
    ['blockchain', 'Blockchain'], ['testing', 'QA'], ['agile', 'Agile'],
  ];
  const found: string[] = [];
  for (const [kw, label] of map) {
    if (lower.includes(kw) && !found.includes(label)) found.push(label);
    if (found.length === 3) break;
  }
  return found;
}

interface Offering {
  id: string;
  duration_weeks: number | null;
  hours_per_week: number | null;
  status: string;
  courses: { id: string; title: string; description: string } | null;
  profiles: { first_name: string; last_name: string } | null;
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="h-1.5 w-full" style={{ background: 'rgba(139,92,246,0.25)' }} />
      <div className="p-6 space-y-3">
        <div className="w-12 h-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-5 w-3/4 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-3 w-full rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-3 w-5/6 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="flex gap-2 pt-1">
          {[1, 2].map(i => (
            <div key={i} className="h-5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Course card ── */
function CourseCard({ offering, index }: { offering: Offering; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const palette = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const tags = extractTags(offering.courses?.title || '');

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 + index * 90);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl overflow-hidden cursor-default"
      style={{
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? palette.border : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered ? `0 20px 50px ${palette.accent}22, 0 4px 16px rgba(0,0,0,0.3)` : '0 2px 12px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
        opacity: visible ? 1 : 0,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top gradient accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${palette.color}`} />

      <div className="p-6">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${palette.color}`}
          style={{
            boxShadow: hovered ? `0 8px 24px ${palette.accent}55` : `0 4px 12px ${palette.accent}33`,
            transform: hovered ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)',
            transition: 'all 0.35s ease',
          }}
        >
          <AcademicCapIcon className="w-6 h-6 text-white" />
        </div>

        {/* Title */}
        <h3
          className="font-bold text-base mb-2 leading-snug transition-colors duration-200"
          style={{ color: hovered ? '#e2d9f3' : 'rgba(255,255,255,0.90)' }}
        >
          {offering.courses?.title || 'Untitled Course'}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-4 line-clamp-2"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          {offering.courses?.description || 'No description available.'}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {offering.duration_weeks && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
              <ClockIcon className="w-3.5 h-3.5" />
              {offering.duration_weeks}w
              {offering.hours_per_week ? ` · ${offering.hours_per_week}h/wk` : ''}
            </span>
          )}
          {offering.profiles && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
              <UserIcon className="w-3.5 h-3.5" />
              {offering.profiles.first_name} {offering.profiles.last_name}
            </span>
          )}
        </div>

        {/* Skill tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag, j) => (
              <span
                key={j}
                className="px-2.5 py-0.5 text-xs rounded-full font-medium"
                style={{
                  background: `${palette.accent}18`,
                  color: hovered ? palette.accent : 'rgba(255,255,255,0.55)',
                  border: `1px solid ${palette.accent}28`,
                  transition: 'color 0.2s',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div
          className="flex items-center gap-1.5 text-xs font-semibold transition-all duration-200"
          style={{ color: hovered ? palette.accent : 'rgba(255,255,255,0.35)' }}
        >
          <BookOpenIcon className="w-3.5 h-3.5" />
          Enroll via QR Code
          <ArrowRightIcon
            className="w-3 h-3 transition-transform duration-200"
            style={{ transform: hovered ? 'translateX(3px)' : 'translateX(0)' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function CoursesPublicPage() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/public/stats`)
      .then(r => r.json())
      .then(j => setOfferings(j.data?.featured_offerings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <PageHero
        icon={<AcademicCapIcon className="w-8 h-8" />}
        title="Available Courses"
        subtitle="Join live industry-focused training programs currently open for enrollment."
        accent="from-purple-500 to-blue-500"
      />

      <AngleDivider fromDark={true} toDark={false} />

      {/* How enrollment works — light section */}
      <section className="py-16 px-6" style={{ background: '#f6f3ef' }}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10 reveal">
            <h2 className="text-xl font-black text-slate-900 mb-2">How Enrollment Works</h2>
            <p className="text-slate-500 text-sm">Three simple steps to get started</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 stagger-children">
            {[
              { icon: '📋', title: 'Sign Up',        desc: 'Create your free TRAINET account in under a minute.',          accent: '#6366f1' },
              { icon: '📷', title: 'Scan QR Code',   desc: 'Your trainer shares a QR code — scan it to enroll instantly.', accent: '#8b5cf6' },
              { icon: '🎓', title: 'Start Learning',  desc: 'Access course materials, assignments, and live sessions.',     accent: '#a855f7' },
            ].map((s, i) => (
              <div key={i}
                className="reveal bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-xl transition-all cursor-default"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl"
                  style={{ background: `${s.accent}18`, color: s.accent }}>
                  {s.icon}
                </div>
                <h3 className="text-slate-900 font-bold mb-1 text-sm">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromDark={false} toDark={true} />

      {/* Course grid — dark section */}
      <section className="py-20 px-6 relative" style={{ background: '#07071a' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(99,102,241,0.07) 0%, transparent 60%)' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.03) 1px,transparent 1px)',
            backgroundSize: '64px 64px',
          }} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12 reveal">
            <h2 className="text-2xl font-black text-white mb-2">Open Courses</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {loading ? 'Loading...' : offerings.length > 0
                ? `${offerings.length} course${offerings.length !== 1 ? 's' : ''} currently open for enrollment`
                : 'Check back soon for new offerings'}
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : offerings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offerings.map((o, i) => (
                <CourseCard key={o.id} offering={o} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 reveal">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <AcademicCapIcon className="w-8 h-8" style={{ color: 'rgba(139,92,246,0.7)' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>No open courses right now</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>New offerings are added regularly — check back soon.</p>
            </div>
          )}
        </div>
      </section>

      <WaveDivider fromDark={true} toDark={false} />

      {/* CTA — light section */}
      <section className="py-20 px-6" style={{ background: '#f6f3ef' }}>
        <div className="container mx-auto max-w-2xl text-center reveal">
          <h2 className="text-2xl font-black text-slate-900 mb-3">Ready to Start Learning?</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Create your free account and get access to AI-graded assignments, QR certificates, and alumni mentorship.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-105 text-sm"
              style={{ boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
            >
              Get Started <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/talent-pool"
              className="inline-flex items-center gap-2 px-8 py-4 border border-slate-300 text-slate-700 rounded-full font-bold hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm"
            >
              Explore Talent Pool
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
