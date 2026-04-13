'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

interface StudentStat {
  studentId: string;
  name: string;
  email: string;
  progress: number;
  completionPct: number;
  avgScore: number | null;
  submissionsCount: number;
  status: 'active' | 'struggling' | 'completed';
  lastActivity: string | null;
  enrolledAt: string;
}

interface OfferingDetail {
  offering: {
    id: string;
    duration_weeks: number;
    hours_per_week: number;
    start_date: string | null;
    end_date: string | null;
    status: string;
    courses: { id: string; title: string; description: string };
    profiles: { id: string; first_name: string; last_name: string; email: string };
  };
  stats: {
    totalEnrolled: number;
    avgProgress: number;
    avgScore: number | null;
    totalAssignments: number;
    totalSubmissions: number;
    plagiarismFlags: number;
    completedStudents: number;
    strugglingStudents: number;
  };
  students: StudentStat[];
  assignments: { id: string; title: string; due_date: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  struggling: 'bg-red-100 text-red-700',
  active: 'bg-blue-100 text-blue-700',
};

function timeAgo(ts: string | null): string {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActiveCourseDetailPage() {
  const params = useParams();
  const offeringId = params.id as string;

  const [detail, setDetail] = useState<OfferingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'struggling' | 'completed'>('all');

  useEffect(() => { fetchDetail(); }, [offeringId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get(`/admin/active-offerings/${offeringId}`);
      setDetail(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load course detail');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Course Monitor" subtitle="Loading...">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-24" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !detail) {
    return (
      <DashboardLayout title="Course Monitor" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error || 'Not found'}</p>
          <Link href="/admin/active-courses" className="text-purple-600 underline">← Back</Link>
        </div>
      </DashboardLayout>
    );
  }

  const { offering, stats, students, assignments } = detail;
  const filteredStudents = students.filter(s => statusFilter === 'all' || s.status === statusFilter);

  const kpis = [
    { label: 'Enrolled', value: stats.totalEnrolled, icon: UsersIcon, color: 'from-blue-500 to-cyan-500' },
    { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: ChartBarIcon, color: 'from-purple-500 to-pink-500' },
    { label: 'Avg Score', value: stats.avgScore !== null ? `${stats.avgScore}/100` : '—', icon: SparklesIcon, color: 'from-green-500 to-emerald-500' },
    { label: 'Plagiarism Flags', value: stats.plagiarismFlags, icon: ShieldExclamationIcon, color: stats.plagiarismFlags > 0 ? 'from-red-500 to-pink-500' : 'from-gray-400 to-gray-500' },
  ];

  return (
    <DashboardLayout
      title={offering.courses?.title || 'Course Monitor'}
      subtitle={`Trainer: ${offering.profiles?.first_name} ${offering.profiles?.last_name} · ${offering.duration_weeks}w · ${offering.hours_per_week}h/wk`}
    >
      <div className="space-y-6">
        <Link href="/admin/active-courses" className="text-sm text-purple-600 hover:text-purple-700">
          ← Back to Active Courses
        </Link>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
                <div className={`w-10 h-10 bg-gradient-to-r ${kpi.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              </div>
            );
          })}
        </div>

        {/* Progress bar + assignment stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Overall Progress</h3>
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${stats.avgProgress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700">{stats.avgProgress}%</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-lg font-bold text-green-600">{stats.completedStudents}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-lg font-bold text-blue-600">{stats.totalEnrolled - stats.completedStudents - stats.strugglingStudents}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-lg font-bold text-red-600">{stats.strugglingStudents}</p>
                <p className="text-xs text-gray-500">Struggling</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Assignment Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Assignments', value: stats.totalAssignments },
                { label: 'Total Submissions', value: stats.totalSubmissions },
                { label: 'Pending', value: stats.totalAssignments * stats.totalEnrolled - stats.totalSubmissions },
                { label: 'Plagiarism Flags', value: stats.plagiarismFlags, warn: stats.plagiarismFlags > 0 },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.warn ? 'text-red-600' : 'text-gray-800'}`}>
                    {Math.max(0, item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          <div className="p-5 border-b border-white/20 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Students ({students.length})</h3>
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
              {(['all', 'active', 'struggling', 'completed'] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition capitalize ${
                    statusFilter === f ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No students in this category</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    {['Student', 'Progress', 'Score', 'Submissions', 'Status', 'Last Active'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map(s => (
                    <tr key={s.studentId} className={`hover:bg-white/60 transition ${s.status === 'struggling' ? 'bg-red-50/30' : s.status === 'completed' ? 'bg-green-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                s.completionPct >= 80 ? 'bg-green-500' :
                                s.completionPct >= 40 ? 'bg-blue-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${s.completionPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{s.completionPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.avgScore !== null ? (
                          <span className={s.avgScore >= 70 ? 'text-green-600 font-medium' : s.avgScore >= 50 ? 'text-orange-500' : 'text-red-600 font-medium'}>
                            {s.avgScore}/100
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.submissionsCount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-600'}`}>
                          {s.status === 'struggling' ? '⚠ ' : s.status === 'completed' ? '✓ ' : ''}{s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(s.lastActivity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
