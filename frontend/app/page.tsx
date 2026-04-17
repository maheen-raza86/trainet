'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  SparklesIcon, ArrowRightIcon, EnvelopeIcon,
  Bars3Icon, XMarkIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';

const CertStack = dynamic(() => import('@/components/CertStack'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/* ── Data ── */
const TRACKS = [
  { slug: 'cybersecurity',       icon: '🛡️', title: 'Cybersecurity',       summary: 'Ethical hacking, penetration testing, malware analysis, and security defense.', difficulty: 'Intermediate', duration: '8-12 Weeks', tools: ['Kali Linux','Wireshark','Burp Suite','Metasploit'],       color: 'from-red-500 to-rose-600',     accent: '#ef4444' },
  { slug: 'devops',              icon: '⚙️', title: 'DevOps Engineering',   summary: 'CI/CD pipelines, Docker, Kubernetes, cloud deployment, and automation.',        difficulty: 'Intermediate', duration: '8-10 Weeks', tools: ['Docker','Kubernetes','Jenkins','AWS'],                  color: 'from-blue-500 to-cyan-600',    accent: '#3b82f6' },
  { slug: 'networking',          icon: '🌐', title: 'Networking (CCNA)',    summary: 'Networking fundamentals, routing, switching, and enterprise connectivity.',      difficulty: 'Beginner',      duration: '6-8 Weeks',  tools: ['Cisco Packet Tracer','Routers','Switches','VLANs'],    color: 'from-green-500 to-emerald-600',accent: '#10b981' },
  { slug: 'cloud-computing',     icon: '☁️', title: 'Cloud Computing',      summary: 'Cloud infrastructure, virtualization, deployment, and scaling strategies.',     difficulty: 'Beginner',      duration: '6-8 Weeks',  tools: ['AWS','Azure','Google Cloud','Terraform'],              color: 'from-sky-500 to-blue-600',     accent: '#0ea5e9' },
  { slug: 'system-administration',icon:'🖥️', title: 'System Administration',summary: 'Windows Server, Linux administration, Active Directory, and enterprise management.',difficulty:'Beginner',  duration: '6-8 Weeks',  tools: ['Windows Server','Linux','Active Directory','PowerShell'],color:'from-violet-500 to-purple-600',accent:'#8b5cf6' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI Auto-Grading',    desc: 'Instant grading with plagiarism detection powered by AI',          href: '/features/ai-grading',       color: 'from-purple-500 to-pink-500',   accent: '#a855f7' },
  { icon: '🔨', title: 'Work & Practice',    desc: 'Real-world industry challenges and hands-on labs',                  href: '/features/work-practice',    color: 'from-blue-500 to-cyan-500',     accent: '#3b82f6' },
  { icon: '🏆', title: 'QR Certificates',    desc: 'Tamper-proof blockchain-verified digital certificates',             href: '/features/certificates',     color: 'from-green-500 to-emerald-500', accent: '#10b981' },
  { icon: '🤝', title: 'Alumni Mentorship',  desc: 'Connect with industry professionals who guide your path',           href: '/features/alumni-mentorship',color: 'from-orange-500 to-amber-500',  accent: '#f97316' },
  { icon: '💼', title: 'Talent Pool',        desc: 'AI-powered skill-based matching with top recruiters',               href: '/talent-pool',               color: 'from-indigo-500 to-purple-500', accent: '#6366f1' },
  { icon: '🎥', title: 'Live Sessions',      desc: 'Structured live classes with expert trainers',                      href: '/features/live-learning',    color: 'from-rose-500 to-pink-500',     accent: '#f43f5e' },
];

const ROLES = [
  { role: 'Student',   icon: '🎓', desc: 'QR enrollment, AI recommendations, assignments & certificates', color: 'from-blue-500 to-cyan-500',    accent: '#3b82f6', href: '/roles/student',   details: ['QR-only enrollment','AI course recommendations','Auto-graded assignments','Verified certificates'] },
  { role: 'Trainer',   icon: '👨‍🏫', desc: 'Create courses, auto-grade, manage students, issue certificates', color: 'from-purple-500 to-pink-500',  accent: '#a855f7', href: '/roles/trainer',   details: ['Build course modules','AI plagiarism detection','Student analytics','Issue QR certificates'] },
  { role: 'Alumni',    icon: '🤝', desc: 'Mentor students, network with peers, guide careers',              color: 'from-green-500 to-emerald-500',accent: '#10b981', href: '/roles/alumni',    details: ['Mentorship sessions','Alumni messaging','Career guidance','Network events'] },
  { role: 'Recruiter', icon: '💼', desc: 'Search talent pool, AI matching, candidate profiles',             color: 'from-orange-500 to-red-500',   accent: '#f97316', href: '/roles/recruiter', details: ['Talent pool access','AI skill matching','Candidate search','Direct outreach'] },
];

/* ── Hooks ── */
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let s: number;
    const step = (ts: number) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Tilt card ── */
function TiltCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y*7}deg) rotateY(${x*7}deg) translateY(-6px)`;
    el.style.setProperty('--mx', `${((e.clientX-r.left)/r.width)*100}%`);
    el.style.setProperty('--my', `${((e.clientY-r.top)/r.height)*100}%`);
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={`glow-card transition-all duration-300 ${className}`}
      style={{ transformStyle:'preserve-3d', ...style }}>
      {children}
    </div>
  );
}

/* ── Dividers ── */
const WaveDivider = ({ fromDark, toDark }: { fromDark: boolean; toDark: boolean }) => (
  <div className="relative h-16 overflow-hidden pointer-events-none"
    style={{ background: fromDark ? '#07071a' : '#f6f3ef' }}>
    <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
      <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z"
        fill={toDark ? '#07071a' : '#f6f3ef'} />
    </svg>
  </div>
);
const AngleDivider = ({ fromDark, toDark }: { fromDark: boolean; toDark: boolean }) => (
  <div className="relative h-14 overflow-hidden pointer-events-none"
    style={{ background: fromDark ? '#07071a' : '#f6f3ef' }}>
    <svg viewBox="0 0 1440 56" className="absolute bottom-0 w-full" preserveAspectRatio="none">
      <path d="M0,0 L1440,56 L1440,56 L0,56 Z" fill={toDark ? '#07071a' : '#f6f3ef'} />
    </svg>
  </div>
);
const CurveDivider = ({ fromDark, toDark }: { fromDark: boolean; toDark: boolean }) => (
  <div className="relative h-16 overflow-hidden pointer-events-none"
    style={{ background: fromDark ? '#07071a' : '#f6f3ef' }}>
    <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
      <path d="M0,64 C480,0 960,64 1440,16 L1440,64 L0,64 Z"
        fill={toDark ? '#07071a' : '#f6f3ef'} />
    </svg>
  </div>
);

/* ══════════════════════════════════════════
   NAV DROPDOWN
══════════════════════════════════════════ */
function NavDropdown({ label, items }: {
  label: string;
  items: { label: string; href: string; icon: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // small delay so mouse can travel from button into panel without closing
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">
        {label}
        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* invisible bridge so mouse can move from button to panel */}
      {open && <div className="absolute top-full left-0 w-full h-2" onMouseEnter={show} />}

      <div
        onMouseEnter={show}
        onMouseLeave={hide}
        className="absolute top-[calc(100%+8px)] left-0 w-56 rounded-2xl border border-white/10 overflow-hidden z-50"
        style={{
          background: 'rgba(10,10,30,0.97)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
          transformOrigin: 'top left',
        }}>
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-white/65 hover:text-white hover:bg-white/6 text-sm transition-colors">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TRACK CAROUSEL
══════════════════════════════════════════ */
function TrackCarousel() {
  const N = TRACKS.length;
  const [active, setActive]     = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const containerRef  = useRef<HTMLDivElement>(null);
  const autoRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const hoveredRef    = useRef(false);
  const CARD_W = 320;
  const GAP    = 24;
  const STEP   = CARD_W + GAP;

  /* ── autoplay helpers ── */
  const clearAuto   = () => { if (autoRef.current)   clearInterval(autoRef.current);  autoRef.current   = null; };
  const clearResume = () => { if (resumeRef.current)  clearTimeout(resumeRef.current); resumeRef.current = null; };

  const startAuto = useCallback(() => {
    clearAuto();
    autoRef.current = setInterval(() => {
      if (!hoveredRef.current) {
        setActive(prev => (prev + 1) % N);
      }
    }, 3500);
  }, [N]);

  // boot autoplay
  useEffect(() => {
    startAuto();
    return () => { clearAuto(); clearResume(); };
  }, [startAuto]);

  /* ── manual navigation — pauses then resumes after 5 s ── */
  const goTo = useCallback((idx: number) => {
    setActive(((idx % N) + N) % N);   // wraps both directions
    clearAuto();
    clearResume();
    resumeRef.current = setTimeout(startAuto, 5000);
  }, [N, startAuto]);

  /* ── hover pause / resume ── */
  const onMouseEnter = () => { hoveredRef.current = true; };
  const onMouseLeave = () => { hoveredRef.current = false; };

  /* ── tilt per card ── */
  const tiltRefs = useRef<(HTMLDivElement | HTMLAnchorElement | null)[]>([]);

  const buildTransform = useCallback((i: number, tx = 0, ty = 0) => {
    const dist  = Math.abs(i - active);
    const scale = i === active ? 1.08 : Math.max(0.88, 1 - dist * 0.06);
    return `perspective(900px) scale(${scale}) rotateX(${-ty*6}deg) rotateY(${tx*6}deg)`;
  }, [active]);

  const onCardMouseMove = (e: React.MouseEvent, i: number) => {
    const el = tiltRefs.current[i] as HTMLElement | null; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = buildTransform(i, (e.clientX-r.left)/r.width-0.5, (e.clientY-r.top)/r.height-0.5);
  };
  const onCardMouseLeave = (i: number) => {
    const el = tiltRefs.current[i] as HTMLElement | null; if (!el) return;
    el.style.transform = buildTransform(i);
  };

  /* ── drag / swipe ── */
  const didDragRef    = useRef(false);
  const dragStartRef  = useRef(0);
  const pointerDownRef = useRef(false); // true only while a pointer button is held

  const onPointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = true;
    dragStartRef.current   = e.clientX;
    didDragRef.current     = false;
    setDragStart(e.clientX);
    setDragDelta(0);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return; // ignore hover-only mouse moves
    const delta = e.clientX - dragStartRef.current;
    if (Math.abs(delta) > 6) {
      didDragRef.current = true;
      setDragging(true);
      setDragDelta(delta);
    }
  };
  const onPointerUp = () => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    if (didDragRef.current && Math.abs(dragDelta) > 60) {
      goTo(active + (dragDelta < 0 ? 1 : -1));
    }
    setDragging(false);
    setDragDelta(0);
    setTimeout(() => { didDragRef.current = false; }, 80);
  };

  const baseOffset = dragDelta * 0.35;

  return (
    <div
      className="relative select-none"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>

      {/* arrow left */}
      <button
        onClick={() => goTo(active - 1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background:'rgba(255,255,255,0.90)', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}
        aria-label="Previous">
        <ArrowRightIcon className="w-4 h-4 text-slate-700 rotate-180" />
      </button>

      {/* arrow right */}
      <button
        onClick={() => goTo(active + 1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background:'rgba(255,255,255,0.90)', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}
        aria-label="Next">
        <ArrowRightIcon className="w-4 h-4 text-slate-700" />
      </button>

      {/* track — pointer handlers on the strip, NOT capturing */}
      <div ref={containerRef} className="overflow-hidden py-12">
        <div
          className="flex items-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            gap: GAP,
            width: TRACKS.length * STEP,
            transform: `translateX(calc(50vw - ${active * STEP + CARD_W / 2}px + ${baseOffset}px))`,
            transition: dragging ? 'none' : 'transform 0.70s cubic-bezier(0.25,0.46,0.45,0.94)',
            willChange: 'transform',
            cursor: dragging ? 'grabbing' : 'grab',
          }}>
          {TRACKS.map((c, i) => {
            const dist     = Math.abs(i - active);
            const isActive = i === active;
            const opacity  = isActive ? 1 : Math.max(0.55, 1 - dist * 0.22);

            return (
              <div
                key={c.slug}
                style={{ width: CARD_W, flexShrink: 0, position: 'relative' }}>

                {/* Actual navigating Link — only active card navigates */}
                <Link
                  href={`/courses/${c.slug}`}
                  ref={el => { tiltRefs.current[i] = el as HTMLAnchorElement | null; }}
                  onMouseMove={e => onCardMouseMove(e, i)}
                  onMouseLeave={() => onCardMouseLeave(i)}
                  onClick={e => {
                    if (didDragRef.current) { e.preventDefault(); return; }
                    // non-active: prevent nav, just focus
                    if (!isActive) { e.preventDefault(); goTo(i); }
                  }}
                  style={{
                    display: 'block',
                    opacity,
                    transform: buildTransform(i, 0, 0),
                    transition: dragging ? 'none' : 'transform 0.70s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.70s ease, box-shadow 0.70s ease',
                    cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    borderRadius: 20,
                    textDecoration: 'none',
                    boxShadow: isActive
                      ? `0 24px 60px ${c.accent}44, 0 8px 24px rgba(0,0,0,0.10)`
                      : '0 4px 16px rgba(0,0,0,0.07)',
                  }}>

                  {/* card inner */}
                  <div
                    className="rounded-[20px] overflow-hidden"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.80)',
                      border: isActive ? `1.5px solid ${c.accent}55` : '1.5px solid rgba(0,0,0,0.06)',
                      backdropFilter: 'blur(12px)',
                    }}>

                    {/* top accent bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${c.color} w-full`} />

                    <div className="p-7">
                      {/* icon */}
                      <div className="mb-5">
                        <div
                          className={`w-16 h-16 bg-gradient-to-br ${c.color} rounded-2xl flex items-center justify-center text-3xl`}
                          style={{
                            boxShadow: `0 10px 28px ${c.accent}55`,
                            transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
                            transition: 'transform 0.70s ease',
                          }}>
                          {c.icon}
                        </div>
                      </div>

                      {/* title */}
                      <h3
                        className="text-xl font-black mb-2"
                        style={{
                          transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                          transition: 'transform 0.52s ease',
                          color: isActive ? '#1e1b4b' : '#1e293b',
                        }}>
                        {c.title}
                      </h3>
                      <p className="text-slate-500 text-sm mb-5 leading-relaxed">{c.summary}</p>

                      {/* tool tags */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {c.tools.map((t, j) => (
                          <span key={j}
                            className="px-2.5 py-0.5 text-xs rounded-lg font-medium"
                            style={{
                              background: isActive ? `${c.accent}12` : 'rgba(0,0,0,0.04)',
                              color: isActive ? c.accent : '#64748b',
                              border: isActive ? `1px solid ${c.accent}28` : '1px solid transparent',
                            }}>
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: c.accent }}>
                        View Details
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* pagination dots */}
      <div className="flex items-center justify-center gap-2.5 pb-4">
        {TRACKS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width:  i === active ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: i === active
                ? `linear-gradient(90deg, ${TRACKS[active].accent}, #8b5cf6)`
                : 'rgba(0,0,0,0.15)',
              transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function HomePage() {
  const [scrollY, setScrollY]   = useState(0);
  const [visible, setVisible]   = useState(false);
  const [stats, setStats]       = useState({ total_users:0, total_students:0, total_courses:0, total_certificates:0 });
  const [alumni, setAlumni]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const contactRef  = useRef<HTMLDivElement>(null);
  const heroRef     = useRef<HTMLDivElement>(null);
  const statsInView = useInView();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const c1 = useCountUp(stats.total_students,    2000, statsInView.inView);
  const c2 = useCountUp(stats.total_users,        2000, statsInView.inView);
  const c3 = useCountUp(stats.total_courses,      2000, statsInView.inView);
  const c4 = useCountUp(stats.total_certificates, 2000, statsInView.inView);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    setVisible(true);
    fetch(API + '/public/stats')
      .then(r => r.json())
      .then(j => { if (j.success) { setStats(j.data.stats||{}); setAlumni(j.data.alumni||[]); } })
      .catch(()=>{}).finally(()=>setLoading(false));
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => { window.removeEventListener('scroll', onScroll); obs.disconnect(); };
  }, []);

  const onHeroMouse = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    setMouse({ x: (e.clientX-r.left)/r.width-0.5, y: (e.clientY-r.top)/r.height-0.5 });
  }, []);

  const scrollToContact = () => { contactRef.current?.scrollIntoView({ behavior:'smooth' }); setMobileOpen(false); };

  const statItems = [
    { label:'Active Learners', val: loading?'—': statsInView.inView&&c1>0?String(c1):String(stats.total_students||0) },
    { label:'Total Users',     val: loading?'—': statsInView.inView&&c2>0?String(c2):String(stats.total_users||0) },
    { label:'Courses',         val: loading?'—': statsInView.inView&&c3>0?String(c3):String(stats.total_courses||0) },
    { label:'Certificates',    val: loading?'—': statsInView.inView&&c4>0?String(c4):String(stats.total_certificates||0) },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background:'#07071a' }}>

      {/* ══ NAVBAR ══ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrollY>60?'nav-glass shadow-2xl':'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-white tracking-tight">
            TRAIN<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ET</span>
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {/* Courses dropdown */}
            <NavDropdown label="Courses" items={TRACKS.map(t=>({ label: t.title, href: `/courses/${t.slug}`, icon: t.icon }))} />

            {/* Features dropdown */}
            <NavDropdown label="Features" items={FEATURES.map(f=>({ label: f.title, href: f.href, icon: f.icon }))} />

            <Link href="/alumni"     className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">Alumni</Link>
            <Link href="/talent-pool"className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">Talent Pool</Link>
            <button onClick={scrollToContact} className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">Contact</button>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors">Login</Link>
            <Link href="/signup" className="btn-shimmer px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105"
              style={{ boxShadow:'0 0 20px rgba(139,92,246,0.4)' }}>
              Get Started
            </Link>
          </div>

          <button onClick={()=>setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-white/70 hover:text-white">
            {mobileOpen ? <XMarkIcon className="w-6 h-6"/> : <Bars3Icon className="w-6 h-6"/>}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 px-6 py-4 space-y-1"
            style={{ background:'rgba(7,7,26,0.98)', backdropFilter:'blur(20px)' }}>
            {[['Courses','/courses'],['Alumni','/alumni'],['Talent Pool','/talent-pool'],['About','/about'],['Help','/help']].map(([l,h])=>(
              <Link key={l} href={h} onClick={()=>setMobileOpen(false)}
                className="block px-3 py-2.5 text-white/70 hover:text-white text-sm rounded-xl hover:bg-white/5 transition-colors">{l}</Link>
            ))}
            <button onClick={scrollToContact} className="block w-full text-left px-3 py-2.5 text-white/70 hover:text-white text-sm rounded-xl hover:bg-white/5">Contact</button>
            <div className="pt-3 border-t border-white/10 flex gap-3">
              <Link href="/login"  onClick={()=>setMobileOpen(false)} className="flex-1 py-2.5 text-center text-white/70 border border-white/20 rounded-xl text-sm">Login</Link>
              <Link href="/signup" onClick={()=>setMobileOpen(false)} className="flex-1 py-2.5 text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-bold">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO — dark navy ══ */}
      <section ref={heroRef} onMouseMove={onHeroMouse}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background:'radial-gradient(ellipse at 20% 50%, rgba(88,28,220,0.14) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.10) 0%, transparent 55%), #07071a' }}>

        {/* grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:'linear-gradient(rgba(139,92,246,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.035) 1px,transparent 1px)',
          backgroundSize:'64px 64px',
        }}/>

        {/* ambient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none animate-blob"
          style={{ background:'radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 70%)', filter:'blur(50px)' }}/>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)', filter:'blur(50px)', animation:'blob-morph 11s ease-in-out infinite reverse' }}/>

        {/* particles */}
        {[...Array(10)].map((_,i)=>(
          <div key={i} className="particle" style={{
            width:`${2+i%3}px`, height:`${2+i%3}px`,
            left:`${(i*17+7)%100}%`, top:`${(i*23+11)%100}%`,
            background: i%2===0?'rgba(139,92,246,0.55)':'rgba(59,130,246,0.55)',
            animationDuration:`${7+i*0.8}s`, animationDelay:`${i*0.6}s`,
          }}/>
        ))}

        <div className="container mx-auto px-6 pt-28 pb-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* Left text */}
            <div className={`transition-all duration-1000 ${visible?'opacity-100 translate-x-0':'opacity-0 -translate-x-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs mb-7 font-medium"
                style={{ background:'rgba(139,92,246,0.10)', borderColor:'rgba(139,92,246,0.28)', color:'rgba(196,181,253,1)' }}>
                <SparklesIcon className="w-3.5 h-3.5"/>
                AI-Powered Learning Ecosystem
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5 leading-[1.15]">
                Train for{' '}
                <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">Industry.</span>
                <br/>
                Learn with{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI.</span>
                <br/>
                <span className="text-white/85">Grow with </span>
                <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">TRAINET.</span>
              </h1>

              <p className="text-white/50 text-sm md:text-base mb-3 leading-relaxed max-w-md">
                AI-powered learning, QR-secured enrollment, verified certificates, alumni mentorship, and recruiter-ready talent — all in one ecosystem.
              </p>

              {/* feature pills */}
              <div className="flex flex-wrap gap-2 mb-9">
                {['AI Auto-Grading','QR Enrollment','Verified Certs','Alumni Mentorship','Talent Matching'].map(f=>(
                  <span key={f} className="px-3 py-1 text-xs rounded-full font-medium"
                    style={{ background:'rgba(139,92,246,0.10)', border:'1px solid rgba(139,92,246,0.22)', color:'rgba(196,181,253,0.85)' }}>
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup"
                  className="btn-shimmer group px-7 py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 flex items-center justify-center gap-2 text-sm"
                  style={{ boxShadow:'0 0 28px rgba(139,92,246,0.38)' }}>
                  Start Learning Free
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                </Link>
                <a href="#career-tracks"
                  className="px-7 py-3.5 border text-white rounded-full font-bold hover:bg-white/5 transition-all text-center text-sm"
                  style={{ borderColor:'rgba(255,255,255,0.14)' }}>
                  Explore Courses
                </a>
              </div>

              {/* mini stats */}
              <div className="grid grid-cols-4 gap-3 mt-10">
                {statItems.map((s,i)=>(
                  <div key={i} className="text-center">
                    <p className="text-lg font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{s.val}</p>
                    <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Certificate Stack */}
            <div className={`relative flex items-center justify-center transition-all duration-1000 delay-300 ${visible?'opacity-100 translate-x-0':'opacity-0 translate-x-10'}`}>
              <div className="relative w-80 h-80 md:w-[460px] md:h-[460px] lg:w-[520px] lg:h-[520px]">
                <CertStack mouseX={mouse.x} mouseY={mouse.y} className="w-full h-full"/>
              </div>
            </div>
          </div>
        </div>

        {/* bottom wave into light */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 72" className="w-full" preserveAspectRatio="none" style={{ display:'block' }}>
            <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="#f6f3ef"/>
          </svg>
        </div>
      </section>

      {/* ══ CAREER TRACKS — light ══ */}
      <section id="career-tracks" className="py-24 overflow-hidden" style={{ background:'#f6f3ef' }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 bg-purple-100 text-purple-700">
              FEATURED CAREER TRACKS
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Industry-Ready Training Programs</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
              Industry-focused programs designed to build practical skills and prepare you for real jobs.
            </p>
          </div>
        </div>
        <TrackCarousel />
      </section>

      {/* light → dark */}
      <AngleDivider fromDark={false} toDark={true}/>

      {/* ══ FEATURES — dark ══ */}
      <section className="py-24 px-6 relative" style={{ background:'#07071a' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse at 80% 50%,rgba(59,130,246,0.07) 0%,transparent 60%)' }}/>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-14 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.28)', color:'#93c5fd' }}>
              PLATFORM FEATURES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">What Makes TRAINET Different</h2>
            <p className="text-white/40 max-w-xl mx-auto text-sm">Every feature is built to accelerate your learning and career growth.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {FEATURES.map((f,i)=>(
              <Link key={i} href={f.href}>
                <TiltCard className="h-full rounded-2xl border p-6 cursor-pointer"
                  style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.07)' }}>
                  <div className="relative z-10">
                    <div className={`w-13 h-13 w-12 h-12 bg-gradient-to-r ${f.color} rounded-2xl flex items-center justify-center text-2xl mb-5`}
                      style={{ boxShadow:`0 8px 22px ${f.accent}55`, animation:`icon-pulse 3s ease-in-out infinite`, animationDelay:`${i*0.35}s` }}>
                      {f.icon}
                    </div>
                    <h3 className="font-black text-white mb-2">{f.title}</h3>
                    <p className="text-white/45 text-sm leading-relaxed mb-4">{f.desc}</p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                      Learn more <ArrowRightIcon className="w-3.5 h-3.5"/>
                    </div>
                  </div>
                </TiltCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* dark → light */}
      <CurveDivider fromDark={true} toDark={false}/>

      {/* ══ ALUMNI — light ══ */}
      <section id="alumni" className="py-24 px-6" style={{ background:'#f6f3ef' }}>
        <div className="container mx-auto">
          <div className="text-center mb-14 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 bg-green-100 text-green-700">
              ALUMNI NETWORK
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Our Alumni Network</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Connect with professionals who were once where you are. Click a profile to request mentorship.
            </p>
          </div>

          {alumni.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {alumni.map((a:any)=>(
                <Link key={a.id} href={`/alumni/${a.id}`}>
                  <TiltCard className="h-full rounded-2xl border p-6 cursor-pointer bg-white border-slate-200 hover:border-purple-200 hover:shadow-xl">
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0"
                          style={{ boxShadow:'0 0 18px rgba(139,92,246,0.35)' }}>
                          {a.profiles?.first_name?.[0]}{a.profiles?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{a.profiles?.first_name} {a.profiles?.last_name}</p>
                          {a.headline && <p className="text-slate-500 text-xs mt-0.5">{a.headline}</p>}
                        </div>
                      </div>
                      {a.skills && (
                        <div className="flex flex-wrap gap-1.5">
                          {a.skills.split(',').slice(0,4).map((s:string,i:number)=>(
                            <span key={i} className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-purple-100 text-purple-700">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TiltCard>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎓</div>
              <p className="text-slate-400 text-sm">Alumni profiles coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* light → dark */}
      <WaveDivider fromDark={false} toDark={true}/>

      {/* ══ ROLES — dark ══ */}
      <section className="py-24 px-6 relative" style={{ background:'#07071a' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse at 30% 50%,rgba(139,92,246,0.07) 0%,transparent 60%)' }}/>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-14 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.28)', color:'#c4b5fd' }}>
              BUILT FOR EVERYONE
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Your Role in TRAINET</h2>
            <p className="text-white/40 text-sm">Click your role to explore what TRAINET offers you</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {ROLES.map((r,i)=>(
              <Link key={i} href={r.href}>
                <TiltCard className="h-full rounded-2xl border p-6 cursor-pointer text-center"
                  style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.07)' }}>
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-r ${r.color} rounded-2xl flex items-center justify-center text-3xl mb-5 mx-auto`}
                      style={{ boxShadow:`0 8px 28px ${r.accent}55` }}>
                      {r.icon}
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{r.role}</h3>
                    <p className="text-white/40 text-xs mb-4 leading-relaxed">{r.desc}</p>
                    <ul className="space-y-1.5 text-left">
                      {r.details.map((d,j)=>(
                        <li key={j} className="flex items-center gap-2 text-xs text-white/50">
                          <span className="w-1 h-1 rounded-full bg-purple-400 shrink-0"/>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* dark → light */}
      <AngleDivider fromDark={true} toDark={false}/>

      {/* ══ STATS — light ══ */}
      <section id="stats" className="py-24 px-6" style={{ background:'#f6f3ef' }}>
        <div ref={statsInView.ref} className="container mx-auto text-center">
          <div className="reveal mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Platform at a Glance</h2>
            <p className="text-slate-500 text-sm">Real numbers from the TRAINET ecosystem</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {statItems.map((s,i)=>(
              <div key={i} className="reveal" style={{ animationDelay:`${i*0.12}s` }}>
                <p className="text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">{s.val}</p>
                <p className="text-slate-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* light → dark */}
      <CurveDivider fromDark={false} toDark={true}/>

      {/* ══ CONTACT — dark ══ */}
      <section ref={contactRef} id="contact" className="py-24 px-6 relative" style={{ background:'#07071a' }}>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-14 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.28)', color:'#c4b5fd' }}>
              GET IN TOUCH
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Contact Us</h2>
            <p className="text-white/40 text-sm">We would love to hear from you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-xl mx-auto">
            <a href="mailto:trainet8688@gmail.com"
              className="group flex items-center gap-4 rounded-2xl p-6 border transition-all hover:-translate-y-1"
              style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.07)' }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(139,92,246,0.4)')}
              onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shrink-0"
                style={{ boxShadow:'0 0 18px rgba(139,92,246,0.4)' }}>
                <EnvelopeIcon className="w-6 h-6 text-white"/>
              </div>
              <div>
                <p className="text-white/35 text-xs mb-0.5">Email</p>
                <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">trainet8688@gmail.com</p>
              </div>
            </a>

            <a href="https://wa.me/923055334284" target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl p-6 border transition-all hover:-translate-y-1"
              style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.07)' }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(16,185,129,0.4)')}
              onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0"
                style={{ boxShadow:'0 0 18px rgba(16,185,129,0.4)' }}>
                <span className="text-white text-xl">💬</span>
              </div>
              <div>
                <p className="text-white/35 text-xs mb-0.5">WhatsApp</p>
                <p className="text-white font-semibold text-sm group-hover:text-green-300 transition-colors">03055334284</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER — dark ══ */}
      <section className="py-24 px-6 relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,#1a0836 0%,#0a1628 50%,#0d0a2e 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full"
            style={{ background:'radial-gradient(ellipse,rgba(139,92,246,0.14) 0%,transparent 70%)', filter:'blur(40px)' }}/>
        </div>
        <div className="container mx-auto text-center relative z-10 reveal">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5">Ready to Transform Your Career?</h2>
          <p className="text-white/45 mb-10 max-w-xl mx-auto text-sm leading-relaxed">
            Join learners already building their future with TRAINET's AI-powered ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="btn-shimmer px-10 py-4 bg-white text-purple-700 rounded-full font-black hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl text-sm">
              Join as Student
            </Link>
            <a href="#career-tracks"
              className="px-10 py-4 border-2 text-white rounded-full font-bold hover:bg-white/10 transition-all text-sm"
              style={{ borderColor:'rgba(255,255,255,0.18)' }}>
              Explore Courses
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER — dark ══ */}
      <footer className="py-16 px-6 border-t" style={{ background:'#050510', borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <p className="text-white font-black text-xl mb-4">
                TRAIN<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ET</span>
              </p>
              <p className="text-white/30 text-sm mb-5 leading-relaxed">Next-generation AI-powered learning platform for industry-ready professionals.</p>
              <Link href="/about" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">About us →</Link>
            </div>
            <div>
              <h3 className="text-white font-bold mb-5 text-sm">Platform</h3>
              <ul className="space-y-3">
                {[['Courses','/courses'],['Certificates','/certificates'],['Talent Pool','/talent-pool'],['Alumni','/alumni']].map(([l,h])=>(
                  <li key={l}><Link href={h} className="text-white/30 hover:text-white transition-colors text-sm">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-5 text-sm">Community</h3>
              <ul className="space-y-3">
                {[['Alumni Network','/alumni'],['Mentorship','/mentorship'],['Recruiters','/recruiter']].map(([l,h])=>(
                  <li key={l}><Link href={h} className="text-white/30 hover:text-white transition-colors text-sm">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-5 text-sm">Support</h3>
              <ul className="space-y-3">
                {[['Help Center','/help'],['Privacy Policy','/privacy'],['Terms','/terms']].map(([l,h])=>(
                  <li key={l}><Link href={h} className="text-white/30 hover:text-white transition-colors text-sm">{l}</Link></li>
                ))}
                <li><button onClick={scrollToContact} className="text-white/30 hover:text-white transition-colors text-sm">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            <p className="text-white/15 text-xs">© 2026 TRAINET. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
