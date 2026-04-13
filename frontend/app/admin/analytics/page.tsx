'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  UsersIcon,
  AcademicCapIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface ChartBucket { label: string; count: number; }

interface AnalyticsData {
  overview: {
    usersByRole: Record<string, number>;
    activeUsers7d: number;
    totalUsers: number;
    totalEnrollments: number;
    courseEngagementRate: number;
  };
  learning: {
    avgScore: number | null;
    completionRate: number;
    dropOffRate: number;
    totalSubmissions: number;
    gradedSubmissions: number;
  };
  coursePerformance: {
    top: { id: string; title: string; enrollCount: number; avgScore: number | null; completionPct: number }[];
    low: { id: string; title: string; enrollCount: number; avgScore: number | null; completionPct: number }[];
  };
  trainerPerformance: { id: string; name: string; courses: number; totalStudents: number; avgScore: number | null }[];
  integrity: {
    total: number;
    flagged: number;
    suspicious: number;
    clean: number;
    pending: number;
    flaggedPct: number;
  };
  charts: {
    userGrowth: ChartBucket[];
    enrollmentTrends: ChartBucket[];
    submissionTrends: ChartBucket[];
  };
}

const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-500',
  trainer: 'bg-purple-500',
  admin: 'bg-red-500',
  alumni: 'bg-green-500',
  recruiter: 'bg-orange-500',
};

function MiniBarChart({ data, color }: { data: ChartBucket[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end space-x-1 h-16">
      {data.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
            {b.count}
          </span>
          <div
            className={`w-full rounded-t-sm ${color}`}
            style={{ height: `${Math.max((b.count / max) * 100, 3)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Fallback({ message = 'No data available yet' }: { message?: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-8 text-center">
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/admin/analytics');
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics" subtitle="Platform intelligence">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-24" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Analytics" subtitle="Platform intelligence">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchAnalytics} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  const { overview, learning, coursePerformance, trainerPerformance, integrity, charts } = data;

  return (
    <DashboardLayout title="Analytics" subtitle="Multi-dimensional platform intelligence">
      <div className="space-y-10">

        {/* ── Section 1: Platform Overview ── */}
        <Section title="Platform Overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: overview.totalUsers, icon: UsersIcon, color: 'from-blue-500 to-cyan-500' },
              { label: 'Active (7d)', value: overview.activeUsers7d, icon: CheckCircleIcon, color: 'from-green-500 to-emerald-500' },
              { label: 'Total Enrollments', value: overview.totalEnrollments, icon: AcademicCapIcon, color: 'from-purple-500 to-pink-500' },
              { label: 'Avg Enrollments/Course', value: overview.courseEngagementRate, icon: SparklesIcon, color: 'from-yellow-500 to-orange-500' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
                  <div className={`w-10 h-10 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Users by role */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Users by Role</h3>
            <div className="space-y-2">
              {Object.entries(overview.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center space-x-3">
                  <span className="w-20 text-xs text-gray-600 capitalize">{role}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${ROLE_COLORS[role] || 'bg-gray-400'}`}
                      style={{ width: `${Math.round((count / overview.totalUsers) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Section 2: Learning Analytics ── */}
        <Section title="Learning Analytics">
          {learning.totalSubmissions === 0 ? (
            <Fallback message="No learning activity yet — submissions will appear here once students start submitting assignments." />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <p className="text-xs text-gray-500 mb-1">Avg Score (AI + Manual)</p>
              <p className="text-3xl font-bold text-gray-800">{learning.avgScore !== null ? `${learning.avgScore}/100` : 'No grades yet'}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <p className="text-xs text-gray-500 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-green-600">{learning.completionRate > 0 ? `${learning.completionRate}%` : 'No completions yet'}</p>
              {learning.completionRate > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${learning.completionRate}%` }} />
                </div>
              )}
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
              <p className="text-xs text-gray-500 mb-1">Drop-off Rate</p>
              <p className="text-3xl font-bold text-red-500">{learning.dropOffRate}%</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${learning.dropOffRate}%` }} />
              </div>
            </div>
          </div>
          )}
        </Section>

        {/* ── Section 3: Course Performance ── */}
        <Section title="Course Performance">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
              <div className="p-4 border-b border-white/20 flex items-center space-x-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-700">Top Performing Courses</h3>
              </div>
              {coursePerformance.top.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {coursePerformance.top.map((c, i) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 bg-green-100 text-green-700 text-xs rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{c.title}</p>
                          <p className="text-xs text-gray-500">{c.enrollCount} students</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{c.completionPct}%</p>
                        <p className="text-xs text-gray-400">{c.avgScore !== null ? `${c.avgScore}/100` : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
              <div className="p-4 border-b border-white/20 flex items-center space-x-2">
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-700">Needs Attention</h3>
              </div>
              {coursePerformance.low.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {coursePerformance.low.map((c, i) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 bg-red-100 text-red-700 text-xs rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{c.title}</p>
                          <p className="text-xs text-gray-500">{c.enrollCount} students</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-500">{c.completionPct}%</p>
                        <p className="text-xs text-gray-400">{c.avgScore !== null ? `${c.avgScore}/100` : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── Section 4: Trainer Performance ── */}
        <Section title="Trainer Performance">
          {trainerPerformance.length === 0 ? (
            <Fallback message="No trainer activity yet — data will appear once trainers create course offerings." />
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    {['Trainer', 'Courses', 'Students', 'Avg Score'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trainerPerformance.map((t: any) => (
                    <tr key={t.id} className="hover:bg-white/60 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                      <td className="px-4 py-3 text-gray-600">{t.courses}</td>
                      <td className="px-4 py-3 text-gray-600">{t.totalStudents}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${t.avgScore !== null && t.avgScore >= 70 ? 'text-green-600' : t.avgScore !== null ? 'text-orange-500' : 'text-gray-400'}`}>
                          {t.avgScore !== null ? `${t.avgScore}/100` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── Section 5: Plagiarism & Integrity ── */}
        <Section title="Plagiarism & Integrity">
          {integrity.total === 0 ? (
            <Fallback message="No submissions available yet — plagiarism data will appear once students submit assignments." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Checked', value: integrity.total, color: 'text-gray-800' },
                { label: 'Clean', value: integrity.clean, color: 'text-green-600' },
                { label: 'Suspicious', value: integrity.suspicious, color: 'text-yellow-600' },
                { label: 'Flagged', value: integrity.flagged, color: 'text-red-600' },
                { label: 'Flagged %', value: `${integrity.flaggedPct}%`, color: integrity.flaggedPct > 10 ? 'text-red-600' : 'text-gray-700' },
              ].map((item, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-4 text-center">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Section 6: Time-Based Trends ── */}
        <Section title="Time-Based Trends">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'User Growth', data: charts.userGrowth, color: 'bg-purple-400' },
              { title: 'Enrollment Trends', data: charts.enrollmentTrends, color: 'bg-blue-400' },
              { title: 'Submission Trends', data: charts.submissionTrends, color: 'bg-green-400' },
            ].map((chart) => (
              <div key={chart.title} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{chart.title}</h3>
                {chart.data && chart.data.some(b => b.count > 0) ? (
                  <>
                    <MiniBarChart data={chart.data} color={chart.color} />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">{chart.data[0]?.label}</span>
                      <span className="text-xs text-gray-400">{chart.data[chart.data.length - 1]?.label}</span>
                    </div>
                  </>
                ) : (
                  <div className="h-16 flex items-center justify-center">
                    <p className="text-xs text-gray-400">No data yet</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 text-center mt-1">Last 8 weeks</p>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </DashboardLayout>
  );
}
