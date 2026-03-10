'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
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
  student_id: string;
  status: string;
  grade: number | null;
  submitted_at: string;
}

export default function TrainerDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
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

      // Fetch all courses (trainer can see all courses they created)
      const coursesResponse: any = await apiClient.get('/courses');
      const coursesData = coursesResponse.data?.courses || [];
      setCourses(coursesData);

      // Fetch assignments for all courses
      const allAssignments: Assignment[] = [];
      const allSubmissions: Submission[] = [];
      
      for (const course of coursesData) {
        try {
          // Fetch assignments for this course
          const assignmentsResponse: any = await apiClient.get(`/assignments/course/${course.id}`);
          const courseAssignments = assignmentsResponse.data?.assignments || [];
          allAssignments.push(...courseAssignments);

          // Fetch submissions for each assignment
          for (const assignment of courseAssignments) {
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
          console.error(`Error fetching assignments for course ${course.id}:`, err);
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

  // Calculate stats
  const coursesCreatedCount = courses.length;
  const assignmentsCreatedCount = assignments.length;
  const pendingSubmissionsCount = submissions.filter(s => s.grade === null).length;
  const totalStudentsCount = new Set(submissions.map(s => s.student_id)).size;

  const stats = [
    { label: 'Courses Created', value: coursesCreatedCount.toString(), icon: '📚', color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Students', value: totalStudentsCount.toString(), icon: '👥', color: 'bg-green-50 text-green-600' },
    { label: 'Assignments Created', value: assignmentsCreatedCount.toString(), icon: '📝', color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending Submissions', value: pendingSubmissionsCount.toString(), icon: '⏳', color: 'bg-yellow-50 text-yellow-600' },
  ];

  // Recent courses (top 3 by creation date)
  const recentCourses = courses
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Recent submissions (top 5 by submission date)
  const recentSubmissions = submissions
    .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime())
    .slice(0, 5);

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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
        </div>

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Courses</h2>
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm">
                Create Course
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentCourses.length > 0 ? (
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(course.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="ml-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No courses created yet</p>
                <button className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                  Create Your First Course
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Recent Submissions</h2>
          </div>
          <div className="p-6">
            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => {
                  const assignment = assignments.find(a => a.id === submission.assignment_id);
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition">
                      <div>
                        <h3 className="font-medium text-gray-900">{assignment?.title || 'Unknown Assignment'}</h3>
                        <p className="text-sm text-gray-600">Student ID: {submission.student_id}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(submission.submitted_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        submission.grade !== null
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {submission.grade !== null ? 'Graded' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No submissions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
