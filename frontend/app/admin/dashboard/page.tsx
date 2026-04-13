'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import {
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TrophyIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface ChartBucket { label: string; count: number; }

interface DashboardStats {
  users: { total: number; byRole: Record<string, number>; newLast30Days: number };
  courses: { total: number; totalOfferings: number; activeOfferings: number; totalEnrollments: number };
  learning: { totalAssignments: number; totalSubmissions: number; gradedSubmissions: number; averageScore: number | null; completionRate: number };
  certificates: { total: number; valid: number; revoked: number; verificationCount: number };
  charts: { userGrowth: ChartBucket[]; courseActivity: ChartBucket[] };
}

const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  trainer: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
  alumni: 'bg-green-100 text-green-700',
  recruiter: 'bg-orange-100 text-orange-700',
};

// ── Pure-CSS bar chart — no external library ──────────────────────────────
function BarChart({ data, title, color, yLabel }: {
  data: ChartBucket[];
  title: string;
  color: string;
  yLabel: string;
}) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
      {/* Title + axis label */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-gray-800">{title}</h2>
        <span className="text-xs text-gray-400">{yLabel}</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">Last 8 weeks</p>

      {/* Chart area */}
      <div className="flex items-end space-x-1.5 h-36">
        {data.map((bucket, i) => {
          const pct = max > 0 ? (bucket.count / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group">
              {/* Tooltip */}
              <div className="relative">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  {bucket.count}
                </span>
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${color}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels — show every other label to avoid crowding */}
      <div className="flex space-x-1.5 mt-2">
        {data.map((bucket, i) => (
          <div key={i} className="flex-1 text-center">
            {i % 2 === 0 && (
              <span className="text-xs text-gray-400 leading-none">{bucket.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* X-axis title */}
      <p className="text-xs text-gray-400 text-center mt-1">Week starting</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'admin') {
      router.push(`/${user.role}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/admin/dashboard');
      setStats(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoading && isAuthenticated && user && user.role !== 'admin') return null;

  const kpis = stats ? [
    { label: 'Total Users', href: '/admin/users', value: stats.users.total, icon: UsersIcon, color: 'from-blue-500 to-cyan-500', sub: `+${stats.users.newLast30Days} this month` },
    { label: 'Course Offerings', href: '/admin/courses', value: stats.courses.totalOfferings, icon: AcademicCapIcon, color: 'from-purple-500 to-pink-500', sub: `${stats.courses.activeOfferings} active` },
    { label: 'Active Courses', href: '/admin/active-courses', value: stats.courses.activeOfferings, icon: DocumentTextIcon, color: 'from-green-500 to-emerald-500', sub: `${stats.courses.totalEnrollments} enrolled` },
    { label: 'Certificates', href: '/admin/certificates', value: stats.certificates.total, icon: TrophyIcon, color: 'from-yellow-500 to-orange-500', sub: `${stats.certificates.verificationCount} verifications` },
  ] : [];

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Loading platform analytics...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse h-28" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Welcome, ${user?.firstName}!`} subtitle="TRAINET platform overview">
      <div className="space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <Link key={i} href={kpi.href} className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${kpi.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800">{kpi.value.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">{kpi.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
              </Link>
            );
          })}
        </div>

        {/* Charts row */}
        {stats?.charts && (
          <div className="grid lg:grid-cols-2 gap-6">
            {stats.charts.userGrowth && stats.charts.userGrowth.length > 0 ? (
              <BarChart
                data={stats.charts.userGrowth}
                title="User Growth"
                yLabel="New users"
                color="bg-gradient-to-t from-purple-500 to-blue-400"
              />
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 flex items-center justify-center h-48">
                <p className="text-gray-400 text-sm">No data available yet</p>
              </div>
            )}
            {stats.charts.courseActivity && stats.charts.courseActivity.length > 0 ? (
              <BarChart
                data={stats.charts.courseActivity}
                title="Course Activity"
                yLabel="New enrollments"
                color="bg-gradient-to-t from-green-500 to-emerald-400"
              />
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 flex items-center justify-center h-48">
                <p className="text-gray-400 text-sm">No data available yet</p>
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Users by Role */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Users by Role</h2>
                <Link href="/admin/users" className="text-xs text-purple-600 hover:text-purple-700 flex items-center">
                  Manage <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.users.byRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'}`}>{role}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.round((count / stats.users.total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Activity */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Learning Activity</h2>
                <SparklesIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Assignments', value: stats.learning.totalAssignments },
                  { label: 'Submissions', value: stats.learning.totalSubmissions },
                  { label: 'Graded', value: stats.learning.gradedSubmissions },
                  { label: 'Avg Score', value: stats.learning.averageScore !== null ? `${stats.learning.averageScore}/100` : '—' },
                  { label: 'Completion Rate', value: `${stats.learning.completionRate}%` },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificates */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Certificates</h2>
                <Link href="/admin/certificates" className="text-xs text-purple-600 hover:text-purple-700 flex items-center">
                  Manage <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Total Issued', value: stats.certificates.total, color: 'text-gray-800' },
                  { label: 'Valid', value: stats.certificates.valid, color: 'text-green-600' },
                  { label: 'Revoked', value: stats.certificates.revoked, color: 'text-red-600' },
                  { label: 'QR Verifications', value: stats.certificates.verificationCount, color: 'text-blue-600' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Users', href: '/admin/users', icon: '👥' },
            { label: 'Courses', href: '/admin/courses', icon: '📚' },
            { label: 'Active', href: '/admin/active-courses', icon: '🟢' },
            { label: 'Certificates', href: '/admin/certificates', icon: '🎓' },
            { label: 'Logs', href: '/admin/logs', icon: '📋' },
            { label: 'Analytics', href: '/admin/analytics', icon: '📊' },
          ].map((link) => (
            <Link key={link.href} href={link.href}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30 text-center hover:bg-white/80 hover:-translate-y-1 hover:shadow-lg transition">
              <div className="text-2xl mb-2">{link.icon}</div>
              <p className="text-sm font-medium text-gray-700">{link.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
