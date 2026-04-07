'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateCourseModal from '@/components/trainer/CreateCourseModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useState } from 'react';
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  ChartBarIcon,
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
  outline: string;
  status: string;
  created_at: string;
  courses: {
    id: string;
    title: string;
    description: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Role validation - redirect if not a trainer
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role !== 'trainer') {
        console.log('Trainer dashboard: User is not a trainer, redirecting to correct dashboard');
        router.push(`/${user.role.toLowerCase()}/dashboard`);
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'trainer') {
      fetchDashboardData();
    }
  }, [user]);

  // Don't render if user is not a trainer
  if (!isLoading && isAuthenticated && user && user.role !== 'trainer') {
    return null; // Will redirect via useEffect
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trainer's course offerings
      const offeringsResponse: any = await apiClient.get('/course-offerings/trainer');
      const offeringsData = offeringsResponse.data?.offerings || [];
      setOfferings(offeringsData);

      // Fetch assignments for all course offerings
      const allAssignments: Assignment[] = [];
      const allSubmissions: Submission[] = [];
      
      for (const offering of offeringsData) {
        try {
          // Fetch assignments for this course offering
          const assignmentsResponse: any = await apiClient.get(`/assignments/course-offering/${offering.id}`);
          const offeringAssignments = assignmentsResponse.data?.assignments || [];
          allAssignments.push(...offeringAssignments);

          // Fetch submissions for each assignment
          for (const assignment of offeringAssignments) {
            try {
              const submissionsResponse: any = await apiClient.get(`/submissions/assignment/${assignment.id}`);
              const assignmentSubmissions = submissionsResponse.data?.submissions || [];
              allSubmissions.push(...assignmentSubmissions);
            } catch (err) {
              // Trainer might not have access to some assignments
              console.error(`Error fetching submissions for assignment ${assignment.id}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error fetching assignments for offering ${offering.id}:`, err);
        }
      }
      
      setAssignments(allAssignments);
      setSubmissions(allSubmissions);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchDashboardData();
  };

  // Calculate stats
  const offeringsCreatedCount = offerings.length;
  const assignmentsCreatedCount = assignments.length;
  const pendingSubmissionsCount = submissions.filter(s => s.grade === null).length;
  const totalStudentsCount = new Set(submissions.map(s => s.student_id)).size;

  const stats = [
    { 
      label: 'Course Offerings', 
      value: offeringsCreatedCount.toString(), 
      icon: AcademicCapIcon, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10'
    },
    { 
      label: 'Total Students', 
      value: totalStudentsCount.toString(), 
      icon: UsersIcon, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10'
    },
    { 
      label: 'Assignments Created', 
      value: assignmentsCreatedCount.toString(), 
      icon: DocumentTextIcon, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10'
    },
    { 
      label: 'Pending Submissions', 
      value: pendingSubmissionsCount.toString(), 
      icon: ClockIcon, 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/10 to-orange-500/10'
    },
  ];

  // Recent course offerings (top 3 by creation date)
  const recentOfferings = offerings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Recent submissions (top 5 by submission date)
  const recentSubmissions = submissions
    .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout title="Trainer Dashboard" subtitle="Loading your teaching overview...">
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
      <DashboardLayout title="Trainer Dashboard" subtitle="Error loading dashboard">
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
      subtitle="Manage your courses and track student progress"
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
          {/* Recent Course Offerings */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Recent Course Offerings</h2>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create Offering</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentOfferings.length > 0 ? (
                <div className="space-y-4">
                  {recentOfferings.map((offering) => (
                    <div key={offering.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                            {offering.courses.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{offering.courses.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {offering.duration_weeks} weeks
                            </span>
                            <span>{offering.hours_per_week}h/week</span>
                            <span className={`px-2 py-1 rounded-full ${
                              offering.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {offering.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Created: {new Date(offering.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg opacity-0 group-hover:opacity-100">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No course offerings created yet</p>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg"
                  >
                    Create Your First Offering
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Recent Submissions</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.map((submission) => {
                    const assignment = assignments.find(a => a.id === submission.assignment_id);
                    return (
                      <div key={submission.id} className="group bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:from-white/60 hover:to-white/80 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                              {assignment?.title || 'Unknown Assignment'}
                            </h3>
                            <p className="text-sm text-gray-600">Student ID: {submission.student_id}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              Submitted: {new Date(submission.submitted_at || '').toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 text-xs rounded-full border ${
                              submission.grade !== null
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                                : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200'
                            }`}>
                              {submission.grade !== null ? 'Graded' : 'Pending'}
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

        {/* AI Teaching Assistant Panel */}
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
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Student Engagement</h4>
              <p className="text-sm text-gray-600">
                {totalStudentsCount > 0 
                  ? `${totalStudentsCount} active students across your courses`
                  : 'Create course offerings to start engaging students'
                }
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Grading Status</h4>
              <p className="text-sm text-gray-600">
                {pendingSubmissionsCount > 0 
                  ? `${pendingSubmissionsCount} submissions awaiting your review`
                  : 'All submissions are up to date!'
                }
              </p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <h4 className="font-medium text-gray-800 mb-2">Course Performance</h4>
              <p className="text-sm text-gray-600">
                {offeringsCreatedCount > 0 
                  ? 'Your courses are performing well with active participation'
                  : 'Start by creating your first course offering'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </DashboardLayout>
  );
}
