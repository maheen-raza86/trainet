'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AcademicCapIcon, BeakerIcon, CpuChipIcon, QrCodeIcon,
  UsersIcon, BriefcaseIcon, SparklesIcon, ChartBarIcon,
  RocketLaunchIcon, StarIcon, ArrowRightIcon, EnvelopeIcon,
  PhoneIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ total_users: 0, total_students: 0, total_courses: 0, total_certificates: 0 });
  const [offerings, setOfferings] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    setIsVisible(true);
    fetchPublicData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPublicData = async () => {
    try {
      const res = await fetch(`${API}/public/stats`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats || {});
        setOfferings(json.data.featured_offerings || []);
        setAlumni(json.data.alumni || []);
      }
    } catch { /* ignore */ } finally { setDataLoading(false); }
  };

  const scrollToContact = () => contactRef.current?.scrollIntoView({ behavior: 'smooth' });

  const features = [
    { icon: <CpuChipIcon className="w-8 h-8" />, title: 'AI Auto-Grading & Plagiarism', desc: 'Instant feedback with rule-based AI and similarity detection', href: '/features/ai-grading', color: 'from-purple-500 to-pink-500' },
    { icon: <BeakerIcon className="w-8 h-8" />, title: 'Work & Practice', desc: 'Real-world industry challenges with AI evaluation', href: '/features/work-practice', color: 'from-blue-500 to-cyan-500' },
    { icon: <QrCodeIcon className="w-8 h-8" />, title: 'QR Certificate Verification', desc: 'Tamper-proof certificates with instant QR validation', href: '/features/certificates', color: 'from-green-500 to-emerald-500' },
    { icon: <UsersIcon className="w-8 h-8" />, title: 'Alumni Mentorship', desc: 'Connect with industry professionals for career guidance', href: '/features/alumni-mentorship', color: 'from-orange-500 to-red-500' },
    { icon: <BriefcaseIcon className="w-8 h-8" />, title: 'Talent Pool (AI Matching)', desc: 'Skill-based hiring with intelligent candidate matching', href: '/talent-pool', color: 'from-indigo-500 to-purple-500' },
    { icon: <AcademicCapIcon className="w-8 h-8" />, title: 'Live Sessions & Learning', desc: 'Structured courses with assignments and progress tracking', href: '/features/live-learning', color: 'from-yellow-500 to-orange-500' },
  ];

  const roles = [
    { role: 'Student', icon: <AcademicCapIcon className="w-8 h-8" />, desc: 'Enroll via QR, submit assignments, get AI recommendations', color: 'from-blue-500 to-cyan-500', href: '/roles/student' },
    { role: 'Trainer', icon: <BeakerIcon className="w-8 h-8" />, desc: 'Create courses, assign tasks, auto-grade, issue certificates', color: 'from-purple-500 to-pink-500', href: '/roles/trainer' },
    { role: 'Alumni', icon: <UsersIcon className="w-8 h-8" />, desc: 'Mentor students, network, provide career guidance', color: 'from-green-500 to-emerald-500', href: '/roles/alumni' },
    { role: 'Recruiter', icon: <BriefcaseIcon className="w-8 h-8" />, desc: 'Search talent, AI matching, view candidate profiles', color: 'from-orange-500 to-red-500', href: '/roles/recruiter' },
  ];

  const statItems = [
    { label: 'Active Learners', value: dataLoading ? '...' : (stats.total_students || 0).toLocaleString() },
    { label: 'Total Users', value: dataLoading ? '...' : (stats.total_users || 0).toLocaleString() },
    { label: 'Courses Available', value: dataLoading ? '...' : (stats.total_courses || 0).toLocaleString() },
    { label: 'Certificates Issued', value: dataLoading ? '...' : (stats.total_certificates || 0).toLocaleString() },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-white tracking-tight">
            TRAIN<span className="text-purple-400">ET</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#courses" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Courses</a>
            <a href="#alumni" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Alumni</a>
            <Link href="/talent-pool" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Talent Pool</Link>
            <a href="#stats" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Stats</a>
            <button onClick={scrollToContact} className="text-white/70 hover:text-white transition-colors text-sm font-medium">Contact</button>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/login" className="px-4 py-2 text-white/80 hover:text-white text-sm transition-colors">Login</Link>
            <Link href="/signup" className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 hover:scale-105">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="container mx-auto">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/80 text-sm mb-8">
              <SparklesIcon className="w-4 h-4 text-purple-400" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Next-Gen
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                AI Learning
              </span>
              Ecosystem
            </h1>
            <p className="text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
              Auto-graded assignments, QR-verified certificates, alumni mentorship, and AI-matched career opportunities — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-xl hover:shadow-purple-500/40 hover:scale-105 flex items-center justify-center gap-2">
                Start Learning Free <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#courses" className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-center">
                Explore Courses
              </a>
            </div>
          </div>

          {/* Floating stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {statItems.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 text-center hover:bg-white/15 transition-all hover:scale-105">
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-white/60 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — clickable cards */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">What Makes TRAINET Different</h2>
            <p className="text-white/60 text-lg">Click any feature to learn more</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Link key={i} href={f.href}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className={`w-14 h-14 bg-gradient-to-r ${f.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-purple-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRightIcon className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED COURSES */}
      <section id="courses" className="py-24 px-6 bg-white/3">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Featured Course Offerings</h2>
            <p className="text-white/60">Currently open for enrollment via QR</p>
          </div>
          {dataLoading ? (
            <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />)}</div>
          ) : offerings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offerings.map((o, i) => {
                const colors = ['from-purple-500 to-pink-500','from-blue-500 to-cyan-500','from-green-500 to-emerald-500','from-orange-500 to-red-500','from-indigo-500 to-purple-500','from-yellow-500 to-orange-500'];
                return (
                  <div key={o.id} className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/30 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                    <div className={`h-28 bg-gradient-to-r ${colors[i % colors.length]} flex items-center justify-center`}>
                      <AcademicCapIcon className="w-10 h-10 text-white/80" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{o.courses?.title}</h3>
                      <p className="text-white/50 text-sm line-clamp-2 mb-3">{o.courses?.description}</p>
                      {o.profiles && <p className="text-white/40 text-xs">by {o.profiles.first_name} {o.profiles.last_name}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">No open offerings at the moment</div>
          )}
          <div className="text-center mt-10">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 shadow-lg">
              Enroll Now
            </Link>
          </div>
        </div>
      </section>

      {/* ALUMNI — clickable cards */}
      <section id="alumni" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Our Alumni Network</h2>
            <p className="text-white/60">Click a profile to connect and request mentorship</p>
          </div>
          {alumni.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alumni.map(a => (
                <Link key={a.id} href={`/alumni/${a.id}`}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {a.profiles?.first_name?.[0]}{a.profiles?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-purple-300 transition-colors">{a.profiles?.first_name} {a.profiles?.last_name}</p>
                      {a.headline && <p className="text-white/50 text-xs">{a.headline}</p>}
                    </div>
                  </div>
                  {a.skills && (
                    <div className="flex flex-wrap gap-1">
                      {a.skills.split(',').slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-purple-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    View profile & request mentorship <ArrowRightIcon className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">Alumni profiles coming soon</div>
          )}
        </div>
      </section>

      {/* ROLES — no admin */}
      <section className="py-24 px-6 bg-white/3">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Built for Everyone</h2>
            <p className="text-white/60">Click your role to explore what TRAINET offers you</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r, i) => (
              <Link key={i} href={r.href}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/30 hover:bg-white/10 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 text-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${r.color} rounded-2xl flex items-center justify-center text-white mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg`}>
                  {r.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{r.role}</h3>
                <p className="text-white/60 text-sm">{r.desc}</p>
                <div className="flex items-center justify-center gap-1 mt-4 text-purple-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRightIcon className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-24 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-16">Platform at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {statItems.map((s, i) => (
              <div key={i} className="group">
                <p className="text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">{s.value}</p>
                <p className="text-white/60 text-sm mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section ref={contactRef} id="contact" className="py-24 px-6 bg-white/3">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Contact Us</h2>
            <p className="text-white/60">We'd love to hear from you</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a href="mailto:trainet8688@gmail.com"
              className="group flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <EnvelopeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Email</p>
                <p className="text-white font-semibold group-hover:text-purple-300 transition-colors">trainet8688@gmail.com</p>
              </div>
            </a>
            <a href="https://wa.me/923055334284" target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-500/50 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <PhoneIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Phone / WhatsApp</p>
                <p className="text-white font-semibold group-hover:text-green-300 transition-colors">03055334284</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-6">Ready to Transform Your Career?</h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Join {(stats.total_users || 0).toLocaleString() || 'thousands of'} learners already building their future
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold text-lg hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105 shadow-xl">
              Join as Student
            </Link>
            <a href="#courses" className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all">
              Explore Courses
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 bg-black/30 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-white font-bold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/student/courses/browse" className="text-white/50 hover:text-white transition-colors text-sm">Courses</Link></li>
                <li><Link href="/student/certificates" className="text-white/50 hover:text-white transition-colors text-sm">Certificates</Link></li>
                <li><Link href="/talent-pool" className="text-white/50 hover:text-white transition-colors text-sm">Talent Pool</Link></li>
                <li><Link href="/alumni" className="text-white/50 hover:text-white transition-colors text-sm">Alumni</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link href="/alumni" className="text-white/50 hover:text-white transition-colors text-sm">Alumni Network</Link></li>
                <li><Link href="/mentorship" className="text-white/50 hover:text-white transition-colors text-sm">Mentorship</Link></li>
                <li><Link href="/talent-pool" className="text-white/50 hover:text-white transition-colors text-sm">Recruiters</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-white/50 hover:text-white transition-colors text-sm">Help Center</Link></li>
                <li><button onClick={scrollToContact} className="text-white/50 hover:text-white transition-colors text-sm">Contact</button></li>
                <li><Link href="/privacy" className="text-white/50 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/50 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">TRAINET</h3>
              <p className="text-white/50 text-sm mb-4">Next-generation AI-powered learning and career development platform.</p>
              <Link href="/about" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">About us →</Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/30 text-sm">© 2026 TRAINET. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
