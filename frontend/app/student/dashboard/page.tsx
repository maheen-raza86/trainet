'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface Enrollment {
  id: string;
  offering_id: string;
  progress: number;
  enrolled_at: string;
  course_offerings: {
    id: string;
    duration_weeks: number;
    hours_per_week: number;
    courses: { id: string; title: string; description: string };
    profiles: { first_name: string; last_name: string };
  };
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  course_offering_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  grade: number | null;
}

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'student') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'student') fetchDashboardData();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'student') return null;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [enrollRes, subRes]: any[] = await Promise.all([
        apiClient.get('/enrollments/my'),
        apiClient.get('/submissions/my'),
      ]);

      const enrollmentsData: Enrollment[] = enrollRes.data?.enrollments || [];
      const submissionsData: Submission[] = subRes.data?.submissions || [];

      setEnrollments(enrollmentsData);
      setSubmissions(submissionsData);

      // Fetch assignments for all enrolled offerings
      const allAssignments: Assignment[] = [];
      for (const enrollment of enrollmentsData) {
        if (!enrollment.offering_id) continue;
        try {
          const aRes: any = await apiClient.get(`/assignments/course-offering/${enrollment.offering_id}`);
          allAssignments.push(...(aRes.data?.assignments || []));
        } catch { /* skip */ }
      }
      setAssignments(allAssignments);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const submittedIds = new Set(submissions.map(s => s.assignment_id));
  const pendingCount = assignments.filter(a => !submittedIds.has(a.id)).length;
  const completedCount = submissions.filter(s => s.grade !== null).length;
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  const stats = [
    { label: 'Enrolled Courses', value: enrollments.length, icon: AcademicCapIcon, color: 'from-blue-500 to-cyan-500', bg: 'from-blue-500/10 to-cyan-500/10', href: '/student/courses' },
    { label: 'Pending Assignments', value: pendingCount, icon: ClockIcon, color: 'from-yellow-500 to-orange-500', bg: 'from-yellow-500/10 to-orange-500/10', href: '/student/assignments' },
    { label: 'Completed Submissions', value: completedCount, icon: CheckCircleIcon, color: 'from-green-500 to-emerald-500', bg: 'from-green-500/10 to-emerald-500/10', href: '/student/assignments' },
    { label: 'Overall Progress', value: `${avgProgress}%`, icon: ChartBarIcon, color: 'from-purple-500 to-pink-500', bg: 'from-purple-500/10 to-pink-500/10', href: '/student/courses' },
  ];

  const recentCourses = enrollments
    .filter(e => e.course_offerings)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 3)
    .map(e => ({
      id: e.offering_id,
      title: e.course_offerings.courses?.title || 'Unknown',
      trainer: `${e.course_offerings.profiles?.first_name || ''} ${e.course_offerings.profiles?.last_name || ''}`.trim(),
      progress: e.progress || 0,
    }));

  const upcomingAssignments = assignments
    .filter(a => !submittedIds.has(a.id) && a.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)
    .map(a => {
      const enrollment = enrollments.find(e => e.offering_id === a.course_offering_id);
      return {
        id: a.id,
        title: a.title,
        course: enrollment?.course_offerings?.courses?.title || 'Unknown Course',
        deadline: new Date(a.due_date).toLocaleDateString(),
      };
    });

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Loading your learning progress...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
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
      <DashboardLayout title="Student Dashboard" subtitle="Error loading dashboard">
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">Try Again</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Welcome back, ${user?.firstName}!`} subtitle="Continue your learning journey and track your progress">
      <div className="space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          {/* My Courses */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">My Courses</h2>
              <button onClick={() => router.push('/student/courses')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
            </div>
            <div className="p-6">
              {recentCourses.length > 0 ? (
                <div className="space-y-4">
                  {recentCourses.map(course => (
                    <div key={course.id} className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition-all duration-300 cursor-pointer" onClick={() => router.push('/student/courses')}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">{course.title}</h3>
                          {course.trainer && <p className="text-sm text-gray-600">by {course.trainer}</p>}
                        </div>
                        <PlayIcon className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{course.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No courses enrolled yet</p>
                  <button onClick={() => router.push('/student/courses')} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition">Browse Courses</button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Upcoming Assignments</h2>
              <button onClick={() => router.push('/student/assignments')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
            </div>
            <div className="p-6">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map(a => (
                    <div key={a.id} onClick={() => router.push('/student/assignments')} className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">{a.title}</h3>
                          <p className="text-sm text-gray-600">{a.course}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />Due: {a.deadline}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full border border-yellow-200">Pending</span>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending assignments</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alumni Network Card */}
        <div
          onClick={() => router.push('/student/alumni')}
          className="group bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6 hover:from-indigo-500/20 hover:to-purple-500/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UsersIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Connect with Alumni</h3>
              <p className="text-sm text-gray-600">Get mentorship and career guidance from industry professionals</p>
            </div>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors shrink-0 ml-4" />
        </div>

        {/* AI Panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">AI Learning Assistant</h3>
              <p className="text-sm text-gray-600">Personalized insights and recommendations</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Learning Progress</h4>
              <p className="text-sm text-gray-600">You're at {avgProgress}% average progress across your courses.</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Recommended Focus</h4>
              <p className="text-sm text-gray-600">{pendingCount > 0 ? `${pendingCount} assignment(s) pending — stay on track!` : 'All caught up! Great work.'}</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Next Steps</h4>
              <p className="text-sm text-gray-600">{enrollments.length === 0 ? 'Enroll in a course to get started.' : 'Connect with alumni for career advice and mentorship opportunities.'}</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
