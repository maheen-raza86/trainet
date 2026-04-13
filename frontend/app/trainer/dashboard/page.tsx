'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateCourseModal from '@/components/trainer/CreateCourseModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface CourseOffering {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  status: string;
  created_at: string;
  courses: { id: string; title: string; description: string };
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
  student_id: string;
  status: string;
  grade: number | null;
  submitted_at: string;
}

export default function TrainerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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

      const allAssignments: Assignment[] = [];
      const allSubmissions: Submission[] = [];
      const studentIds = new Set<string>();

      for (const offering of offeringsData) {
        // Fetch assignments
        try {
          const aRes: any = await apiClient.get(`/assignments/course-offering/${offering.id}`);
          const offeringAssignments: Assignment[] = aRes.data?.assignments || [];
          allAssignments.push(...offeringAssignments);

          // Fetch submissions per assignment
          for (const assignment of offeringAssignments) {
            try {
              const sRes: any = await apiClient.get(`/submissions/assignment/${assignment.id}`);
              const subs: Submission[] = sRes.data?.submissions || [];
              allSubmissions.push(...subs);
              subs.forEach(s => studentIds.add(s.student_id));
            } catch { /* skip */ }
          }
        } catch { /* skip */ }

        // Fetch enrollments to count unique students
        try {
          const eRes: any = await apiClient.get(`/enrollments/offering/${offering.id}`);
          const enrollments = eRes.data?.enrollments || [];
          enrollments.forEach((e: any) => studentIds.add(e.student_id));
        } catch { /* skip */ }
      }

      setAssignments(allAssignments);
      setSubmissions(allSubmissions);
      setTotalStudents(studentIds.size);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const pendingSubmissionsCount = submissions.filter(s => s.grade === null).length;

  const stats = [
    { label: 'Course Offerings', value: offerings.length, icon: AcademicCapIcon, color: 'from-blue-500 to-cyan-500', bg: 'from-blue-500/10 to-cyan-500/10', href: '/trainer/courses' },
    { label: 'Total Students', value: totalStudents, icon: UsersIcon, color: 'from-green-500 to-emerald-500', bg: 'from-green-500/10 to-emerald-500/10', href: '/trainer/courses' },
    { label: 'Assignments Created', value: assignments.length, icon: DocumentTextIcon, color: 'from-purple-500 to-pink-500', bg: 'from-purple-500/10 to-pink-500/10', href: '/trainer/assignments' },
    { label: 'Pending Submissions', value: pendingSubmissionsCount, icon: ClockIcon, color: 'from-yellow-500 to-orange-500', bg: 'from-yellow-500/10 to-orange-500/10', href: '/trainer/submissions' },
  ];

  const recentOfferings = [...offerings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout title="Trainer Dashboard" subtitle="Loading your teaching overview...">
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
                      onClick={() => router.push('/trainer/courses')}
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

          {/* Recent Submissions */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Recent Submissions</h2>
              <button onClick={() => router.push('/trainer/submissions')} className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
            </div>
            <div className="p-6">
              {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.map(sub => {
                    const assignment = assignments.find(a => a.id === sub.assignment_id);
                    return (
                      <div
                        key={sub.id}
                        onClick={() => router.push('/trainer/submissions')}
                        className="group bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">{assignment?.title || 'Assignment'}</h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 text-xs rounded-full border ${sub.grade !== null ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                              {sub.grade !== null ? 'Graded' : 'Pending'}
                            </span>
                            <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Teaching Assistant */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">AI Teaching Assistant</h3>
              <p className="text-sm text-gray-600">Insights and recommendations for your courses</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Student Engagement</h4>
              <p className="text-sm text-gray-600">{totalStudents > 0 ? `${totalStudents} student(s) enrolled across your offerings` : 'No students enrolled yet'}</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Grading Status</h4>
              <p className="text-sm text-gray-600">{pendingSubmissionsCount > 0 ? `${pendingSubmissionsCount} submission(s) awaiting review` : 'All submissions are graded!'}</p>
            </div>
            <div className="bg-white/40 rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Course Activity</h4>
              <p className="text-sm text-gray-600">{offerings.length > 0 ? `${offerings.filter(o => o.status === 'open').length} active offering(s) open for enrollment` : 'Create your first course offering'}</p>
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
