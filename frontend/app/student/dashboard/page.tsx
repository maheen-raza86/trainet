'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
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
  course_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  grade: number | null;
}

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch enrolled courses
      const enrollmentsResponse: any = await apiClient.get('/courses/my-courses');
      const enrollmentsData = enrollmentsResponse.data?.enrollments || [];
      setEnrollments(enrollmentsData);

      // Fetch submissions
      const submissionsResponse: any = await apiClient.get('/submissions/my');
      const submissionsData = submissionsResponse.data?.submissions || [];
      setSubmissions(submissionsData);

      // Fetch assignments for all enrolled courses
      const allAssignments: Assignment[] = [];
      for (const enrollment of enrollmentsData) {
        try {
          const assignmentsResponse: any = await apiClient.get(`/assignments/course/${enrollment.course_id}`);
          const courseAssignments = assignmentsResponse.data?.assignments || [];
          allAssignments.push(...courseAssignments);
        } catch (err) {
          console.error(`Error fetching assignments for course ${enrollment.course_id}:`, err);
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
    { label: 'Enrolled Courses', value: enrolledCoursesCount.toString(), icon: '📚', color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Assignments', value: pendingAssignmentsCount.toString(), icon: '📝', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Completed Submissions', value: completedSubmissionsCount.toString(), icon: '✅', color: 'bg-green-50 text-green-600' },
    { label: 'Overall Progress', value: `${averageProgress}%`, icon: '📊', color: 'bg-purple-50 text-purple-600' },
  ];

  // Recent courses (top 3 by progress)
  const recentCourses = enrollments
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 3)
    .map(e => ({
      id: e.course_id,
      title: e.courses.title,
      trainer: 'Trainer', // Trainer info not in API response
      progress: e.progress || 0,
    }));

  // Upcoming assignments (next 3 by due date, not yet submitted)
  const upcomingAssignments = assignments
    .filter(a => !submittedAssignmentIds.has(a.id))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)
    .map(a => {
      const course = enrollments.find(e => e.course_id === a.course_id);
      return {
        id: a.id,
        title: a.title,
        course: course?.courses.title || 'Unknown Course',
        deadline: new Date(a.due_date).toLocaleDateString(),
        status: 'pending',
      };
    });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Recent Courses</h2>
          </div>
          <div className="p-6">
            {recentCourses.length > 0 ? (
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600">Trainer: {course.trainer}</p>
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{course.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <button className="ml-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                      Continue
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No courses enrolled yet</p>
                <button className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                  Browse Courses
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Assignments</h2>
          </div>
          <div className="p-6">
            {upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition">
                    <div>
                      <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.course}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {assignment.deadline}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No pending assignments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
