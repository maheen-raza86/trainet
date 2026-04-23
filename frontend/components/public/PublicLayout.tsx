'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import BrandLogo from '@/components/BrandLogo';

/* ── Shared nav data ── */
const TRACKS = [
  { slug:'cybersecurity',        icon:'🛡️', title:'Cybersecurity' },
  { slug:'devops',               icon:'⚙️', title:'DevOps Engineering' },
  { slug:'networking',           icon:'🌐', title:'Networking (CCNA)' },
  { slug:'cloud-computing',      icon:'☁️', title:'Cloud Computing' },
  { slug:'system-administration',icon:'🖥️', title:'System Administration' },
];
const FEATURES = [
  { icon:'🤖', title:'AI Auto-Grading',   href:'/features/ai-grading' },
  { icon:'🔨', title:'Work & Practice',   href:'/features/work-practice' },
  { icon:'🏆', title:'QR Certificates',   href:'/features/certificates' },
  { icon:'🤝', title:'Alumni Mentorship', href:'/features/alumni-mentorship' },
  { icon:'💼', title:'Talent Pool',       href:'/talent-pool' },
  { icon:'🎥', title:'Live Sessions',     href:'/features/live-learning' },
];

/* ── Dropdown ── */
function NavDropdown({ label, items }: { label:string; items:{label:string;href:string;icon:string}[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const show = () => { if(timer.current) clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(()=>setOpen(false),120); };
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);
  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button onClick={()=>setOpen(o=>!o)}
        className="flex items-center gap-1 px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">
        {label}<ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${open?'rotate-180':''}`}/>
      </button>
      {open&&<div className="absolute top-full left-0 w-full h-2" onMouseEnter={show}/>}
      <div onMouseEnter={show} onMouseLeave={hide}
        className="absolute top-[calc(100%+8px)] left-0 w-56 rounded-2xl border border-white/10 overflow-hidden z-50"
        style={{ background:'rgba(10,10,30,0.97)', backdropFilter:'blur(20px)', boxShadow:'0 16px 40px rgba(0,0,0,0.4)',
          opacity:open?1:0, transform:open?'translateY(0) scale(1)':'translateY(-8px) scale(0.97)',
          pointerEvents:open?'all':'none', transition:'opacity 0.18s ease,transform 0.18s ease', transformOrigin:'top left' }}>
        {items.map(item=>(
          <Link key={item.href} href={item.href} onClick={()=>setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-white/65 hover:text-white hover:bg-white/6 text-sm transition-colors">
            <span className="text-base">{item.icon}</span>{item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Wave dividers ── */
export const WaveDivider = ({fromDark,toDark}:{fromDark:boolean;toDark:boolean}) => (
  <div className="relative h-16 overflow-hidden pointer-events-none"
    style={{background:fromDark?'#07071a':'#f6f3ef'}}>
    <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
      <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z" fill={toDark?'#07071a':'#f6f3ef'}/>
    </svg>
  </div>
);
export const AngleDivider = ({fromDark,toDark}:{fromDark:boolean;toDark:boolean}) => (
  <div className="relative h-14 overflow-hidden pointer-events-none"
    style={{background:fromDark?'#07071a':'#f6f3ef'}}>
    <svg viewBox="0 0 1440 56" className="absolute bottom-0 w-full" preserveAspectRatio="none">
      <path d="M0,0 L1440,56 L1440,56 L0,56 Z" fill={toDark?'#07071a':'#f6f3ef'}/>
    </svg>
  </div>
);
export const CurveDivider = ({fromDark,toDark}:{fromDark:boolean;toDark:boolean}) => (
  <div className="relative h-16 overflow-hidden pointer-events-none"
    style={{background:fromDark?'#07071a':'#f6f3ef'}}>
    <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
      <path d="M0,64 C480,0 960,64 1440,16 L1440,64 L0,64 Z" fill={toDark?'#07071a':'#f6f3ef'}/>
    </svg>
  </div>
);

/* ── Page hero ── */
export function PageHero({ icon, title, subtitle, accent='from-purple-500 to-blue-500' }:
  { icon:React.ReactNode; title:string; subtitle:string; accent?:string }) {
  const [vis,setVis]=useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setVis(true),60); return ()=>clearTimeout(t); },[]);
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden" style={{background:'#07071a'}}>
      <div className="absolute inset-0 pointer-events-none"
        style={{backgroundImage:'linear-gradient(rgba(139,92,246,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.035) 1px,transparent 1px)',backgroundSize:'64px 64px'}}/>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{background:'radial-gradient(ellipse,rgba(139,92,246,0.10) 0%,transparent 70%)',filter:'blur(50px)'}}/>
      <div className={`container mx-auto max-w-3xl text-center transition-all duration-700 ${vis?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
        <div className={`w-16 h-16 bg-gradient-to-r ${accent} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white`}
          style={{boxShadow:'0 8px 28px rgba(139,92,246,0.40)'}}>
          {icon}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">{title}</h1>
        <p className="text-white/55 text-base md:text-lg max-w-xl mx-auto leading-relaxed">{subtitle}</p>
      </div>
    </section>
  );
}

/* ── Main layout ── */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);
  const scrollToContact = () => { contactRef.current?.scrollIntoView({behavior:'smooth'}); setMobileOpen(false); };

  useEffect(()=>{
    const fn=()=>setScrollY(window.scrollY);
    window.addEventListener('scroll',fn,{passive:true});
    return ()=>window.removeEventListener('scroll',fn);
  },[]);

  /* reveal on scroll */
  useEffect(()=>{
    const els=document.querySelectorAll('.reveal');
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.1});
    els.forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  },[]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{background:'#07071a'}}>
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrollY>60?'nav-glass shadow-2xl':'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLogo size="md" />
          </Link>
          <div className="hidden lg:flex items-center space-x-1">
            <NavDropdown label="Courses" items={TRACKS.map(t=>({label:t.title,href:`/courses/${t.slug}`,icon:t.icon}))}/>
            <NavDropdown label="Features" items={FEATURES.map(f=>({label:f.title,href:f.href,icon:f.icon}))}/>
            <Link href="/courses"      className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">Active Courses</Link>
            <Link href="/about"        className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">About Us</Link>
            <button onClick={scrollToContact} className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5">Contact</button>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login"  className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors">Login</Link>
            <Link href="/signup" className="btn-shimmer px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105"
              style={{boxShadow:'0 0 20px rgba(139,92,246,0.4)'}}>Get Started</Link>
          </div>
          <button onClick={()=>setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-white/70 hover:text-white">
            {mobileOpen?<XMarkIcon className="w-6 h-6"/>:<Bars3Icon className="w-6 h-6"/>}
          </button>
        </div>
        {mobileOpen&&(
          <div className="lg:hidden border-t border-white/10 px-6 py-4 space-y-1"
            style={{background:'rgba(7,7,26,0.98)',backdropFilter:'blur(20px)'}}>
            {[['Courses','/courses'],['Active Courses','/courses'],['About Us','/about'],['Help','/help']].map(([l,h])=>(
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

      {/* ── Page content ── */}
      {children}

      {/* ── Footer ── */}
      <WaveDivider fromDark={false} toDark={true}/>
      <section ref={contactRef} id="contact" className="py-16 px-6 relative" style={{background:'#07071a'}}>
        <div className="container mx-auto max-w-xl text-center mb-10 reveal">
          <h2 className="text-2xl font-black text-white mb-2">Contact Us</h2>
          <p className="text-white/40 text-sm">We would love to hear from you</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-xl mx-auto mb-12">
          <a href="mailto:trainet8688@gmail.com"
            className="group flex items-center gap-4 rounded-2xl p-5 border transition-all hover:-translate-y-1 cursor-pointer"
            style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}
            onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(139,92,246,0.4)')}
            onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
            <div className="w-11 h-11 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shrink-0"
              style={{boxShadow:'0 0 16px rgba(139,92,246,0.4)'}}>
              <EnvelopeIcon className="w-5 h-5 text-white"/>
            </div>
            <div>
              <p className="text-white/35 text-xs mb-0.5">Email</p>
              <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">trainet8688@gmail.com</p>
            </div>
          </a>
          <a href="https://wa.me/923055334284" target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl p-5 border transition-all hover:-translate-y-1 cursor-pointer"
            style={{background:'rgba(255,255,255,0.03)',borderColor:'rgba(255,255,255,0.07)'}}
            onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(16,185,129,0.4)')}
            onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
            <div className="w-11 h-11 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shrink-0"
              style={{boxShadow:'0 0 16px rgba(16,185,129,0.4)'}}>
              <span className="text-white text-lg">💬</span>
            </div>
            <div>
              <p className="text-white/35 text-xs mb-0.5">WhatsApp</p>
              <p className="text-white font-semibold text-sm group-hover:text-green-300 transition-colors">03055334284</p>
            </div>
          </a>
        </div>
      </section>
      <footer className="py-12 px-6 border-t" style={{background:'#050510',borderColor:'rgba(255,255,255,0.06)'}}>
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <Link href="/" className="inline-flex items-center mb-3">
                <BrandLogo size="sm" />
              </Link>
              <p className="text-white/30 text-sm mb-4 leading-relaxed">Next-generation AI-powered learning platform.</p>
              <Link href="/about" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">About us →</Link>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">Platform</h3>
              <ul className="space-y-2">{[['Courses','/courses'],['Certificates','/certificates'],['Talent Pool','/talent-pool']].map(([l,h])=>(
                <li key={l}><Link href={h} className="text-white/30 hover:text-white transition-colors text-sm">{l}</Link></li>
              ))}</ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">Community</h3>
              <ul className="space-y-2">{[['Mentorship','/mentorship'],['Recruiters','/recruiter']].map(([l,h])=>(
                <li key={l}><Link href={h} className="text-white/30 hover:text-white transition-colors text-sm">{l}</Link></li>
              ))}</ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 text-sm">Support</h3>
              <ul className="space-y-2">{[['Help Center','/help'],['Privacy Policy','/privacy'],['Terms','/terms']].map(([l,h])=>(
                <li key={l}><Link href={h} className="text-white/30 hover:text-white transition-colors text-sm">{l}</Link></li>
              ))}</ul>
            </div>
          </div>
          <div className="border-t pt-6 text-center" style={{borderColor:'rgba(255,255,255,0.06)'}}>
            <p className="text-white/15 text-xs">© 2026 TRAINET. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
