'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  TrophyIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon
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
    outline: string;
    courses: {
      id: string;
      title: string;
      description: string;
    };
    profiles: {
      first_name: string;
      last_name: string;
    };
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

  // Role validation
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role !== 'student') {
        router.push(`/${user.role.toLowerCase()}/dashboard`);
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchDashboardData();
    }
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'student') {
    return null;
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [enrollmentsResponse, submissionsResponse] = await Promise.all([
        apiClient.get('/enrollments/my'),
        apiClient.get('/submissions/my')
      ]);

      const enrollmentsData = enrollmentsResponse.enrollments || [];
      const submissionsData = submissionsResponse.submissions || [];
      
      setEnrollments(enrollmentsData);
      setSubmissions(submissionsData);

      // Fetch assignments for all enrolled course offerings
      const allAssignments: Assignment[] = [];
      for (const enrollment of enrollmentsData) {
        try {
          const assignmentsResponse: any = await apiClient.get(`/assignments/course-offering/${enrollment.offering_id}`);
          const courseAssignments = assignmentsResponse.assignments || [];
          allAssignments.push(...courseAssignments);
        } catch (err) {
          console.error(`Error fetching assignments for offering ${enrollment.offering_id}:`, err);
        }
      }
      setAssignments(allAssignments);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const enrolledCoursesCount = enrollments.length;
  const submittedAssignmentIds = new Set(submissions.map(s => s.assignment_id));
  const pendingAssignmentsCount = assignments.filter(a => !submittedAssignmentIds.has(a.id)).length;
  const completedSubmissionsCount = submissions.filter(s => s.grade !== null).length;
  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  const stats = [
    { 
      label: 'Enrolled Courses', 
      value: enrolledCoursesCount.toString(), 
      icon: AcademicCapIcon, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10'
    },
    { 
      label: 'Pending Assignments', 
      value: pendingAssignmentsCount.toString(), 
      icon: ClockIcon, 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10'
    },
    { 
      label: 'Completed Submissions', 
      value: completedSubmissionsCount.toString(), 
      icon: CheckCircleIcon, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10'
    },
    { 
      label: 'Overall Progress', 
      value: `${averageProgress}%`, 
      icon: ChartBarIcon, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10'
    },
  ];

  // Recent courses
  const recentCourses = enrollments
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 3)
    .map(e => ({
      id: e.offering_id,
      title: e.course_offerings.courses.title,
      trainer: `${e.course_offerings.profiles.first_name} ${e.course_offerings.profiles.last_name}`,
      progress: e.progress || 0,
    }));

  // Upcoming assignments
  const upcomingAssignments = assignments
    .filter(a => !submittedAssignmentIds.has(a.id))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)
    .map(a => {
      const enrollment = enrollments.find(e => e.offering_id === a.course_offering_id);
      return {
        id: a.id,
        title: a.title,
        course: enrollment?.course_offerings.courses.title || 'Unknown Course',
        deadline: new Date(a.due_date).toLocaleDateString(),
        status: 'pending',
      };
    });

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Loading your learning progress...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Error loading dashboard">
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`Welcome back, ${user?.firstName}!`} 
      subtitle="Continue your learning journey and track your progress"
    >
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/80 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl card-hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-r ${stat.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Courses */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">My Courses</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentCourses.length > 0 ? (
                <div className="space-y-4">
                  {recentCourses.map((course) => (
                    <div key={course.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600">by {course.trainer}</p>
                        </div>
                        <button className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg opacity-0 group-hover:opacity-100">
                          <PlayIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          ></div>
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
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg">
                    Browse Courses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Upcoming Assignments</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <div key={assignment.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-600">{assignment.course}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Due: {assignment.deadline}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs rounded-full border border-yellow-200">
                            Pending
                          </span>
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

        {/* AI Feedback Panel */}
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
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Learning Progress</h4>
              <p className="text-sm text-gray-600">You're performing {averageProgress > 70 ? 'excellently' : averageProgress > 50 ? 'well' : 'adequately'} across your courses!</p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Recommended Focus</h4>
              <p className="text-sm text-gray-600">Complete pending assignments to maintain momentum.</p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Next Steps</h4>
              <p className="text-sm text-gray-600">Consider exploring advanced courses in your field.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
