'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AcademicCapIcon, ArrowLeftIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CoursesPublicPage() {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/public/stats`)
      .then(r => r.json())
      .then(j => { setOfferings(j.data?.featured_offerings || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const colors = ['from-purple-500 to-pink-500','from-blue-500 to-cyan-500','from-green-500 to-emerald-500','from-orange-500 to-red-500','from-indigo-500 to-purple-500','from-yellow-500 to-orange-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm"><ArrowLeftIcon className="w-4 h-4" /> Back</Link>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-2">Available Courses</h1>
          <p className="text-white/60 mb-10">Open course offerings — enroll via QR code</p>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />)}</div>
          ) : offerings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offerings.map((o, i) => (
                <div key={o.id} className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/30 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  <div className={`h-28 bg-gradient-to-r ${colors[i % colors.length]} flex items-center justify-center`}>
                    <AcademicCapIcon className="w-10 h-10 text-white/80" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{o.courses?.title}</h3>
                    <p className="text-white/50 text-sm line-clamp-2 mb-3">{o.courses?.description}</p>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{o.duration_weeks}w</span>
                      {o.profiles && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{o.profiles.first_name} {o.profiles.last_name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-white/40">No open courses at the moment</div>
          )}
          <div className="mt-12 text-center">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all hover:scale-105">Sign Up to Enroll</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
