'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateCourseModal from '@/components/trainer/CreateCourseModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  AcademicCapIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface CourseOffering {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  status: string;
  created_at: string;
  courses: { id: string; title: string; description: string };
}

export default function TrainerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'trainer') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'trainer') fetchDashboardData();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'trainer') return null;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const offeringsRes: any = await apiClient.get('/course-offerings/trainer');
      const offeringsData: CourseOffering[] = offeringsRes.data?.offerings || [];
      setOfferings(offeringsData);

      const studentIds = new Set<string>();

      for (const offering of offeringsData) {
        try {
          const eRes: any = await apiClient.get(`/enrollments/offering/${offering.id}`);
          const enrollments = eRes.data?.enrollments || [];
          enrollments.forEach((e: any) => studentIds.add(e.student_id));
        } catch { /* skip */ }
      }

      setTotalStudents(studentIds.size);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = [
    { label: 'Course Offerings', value: offerings.length, icon: AcademicCapIcon, color: 'from-blue-500 to-cyan-500', bg: 'from-blue-500/10 to-cyan-500/10', href: '/trainer/courses' },
    { label: 'Total Students', value: totalStudents, icon: UsersIcon, color: 'from-green-500 to-emerald-500', bg: 'from-green-500/10 to-emerald-500/10', href: '/trainer/students' },
  ];

  const recentOfferings = [...offerings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <DashboardLayout title="Trainer Dashboard" subtitle="Loading your teaching overview...">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Trainer Dashboard" subtitle="Error loading dashboard">
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Try Again</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Welcome back, ${user?.firstName}!`} subtitle="Manage your courses and track student progress">
      <div className="space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                onClick={() => router.push(stat.href)}
                className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-r ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-gray-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Course Offerings */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Recent Course Offerings</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition hover:shadow-lg"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Offering</span>
              </button>
            </div>
            <div className="p-6">
              {recentOfferings.length > 0 ? (
                <div className="space-y-4">
                  {recentOfferings.map(offering => (
                    <div
                      key={offering.id}
                      onClick={() => router.push(`/trainer/courses/${offering.id}`)}
                      className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">{offering.courses?.title}</h3>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span>{offering.duration_weeks}w · {offering.hours_per_week}h/wk</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${offering.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {offering.status}
                            </span>
                          </div>
                        </div>
                        <EyeIcon className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No course offerings yet</p>
                  <button onClick={() => setIsCreateModalOpen(true)} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition">Create First Offering</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => router.push('/trainer/courses')}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/40 rounded-xl border border-white/30 hover:bg-white/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Manage My Courses</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>
              <button
                onClick={() => router.push('/trainer/students')}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/40 rounded-xl border border-white/30 hover:bg-white/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <UsersIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">View My Students</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/40 rounded-xl border border-white/30 hover:bg-white/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <PlusIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Create New Course Offering</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

      </div>

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </DashboardLayout>
  );
}
