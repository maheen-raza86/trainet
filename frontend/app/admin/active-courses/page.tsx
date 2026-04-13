'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface ActiveOffering {
  id: string;
  status: string;
  duration_weeks: number;
  hours_per_week: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  enrollmentCount: number;
  courses: { id: string; title: string; description: string };
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

export default function AdminActiveCoursesPage() {
  const [offerings, setOfferings] = useState<ActiveOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchOfferings(); }, []);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/admin/active-offerings');
      setOfferings(res.data?.offerings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load active courses');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const daysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <DashboardLayout title="Active Courses" subtitle="Currently running course offerings">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse h-24" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Active Courses" subtitle="Currently running course offerings">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchOfferings} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Active Courses" subtitle={`${offerings.length} course offering${offerings.length !== 1 ? 's' : ''} currently running`}>
      <div className="space-y-4">
        {offerings.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/30">
            <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active course offerings at the moment</p>
          </div>
        ) : (
          offerings.map((o) => {
            const days = daysRemaining(o.end_date);
            const isExpiringSoon = days !== null && days <= 7 && days > 0;

            return (
              <Link
                key={o.id}
                href={`/admin/active-courses/${o.id}`}
                className="group block bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5 hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition">
                        {o.courses?.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>
                      {isExpiringSoon && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                          Ends in {days}d
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>{o.profiles?.first_name} {o.profiles?.last_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{o.duration_weeks}w · {o.hours_per_week}h/wk</span>
                      </span>
                      <span>{formatDate(o.start_date)} → {formatDate(o.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 ml-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{o.enrollmentCount}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
