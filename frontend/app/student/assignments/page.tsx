'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  created_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  grade: number | null;
  submitted_at: string;
}

interface Enrollment {
  course_id: string;
  courses: {
    id: string;
    title: string;
  };
}

interface AssignmentWithStatus extends Assignment {
  courseName: string;
  status: 'pending' | 'submitted' | 'graded';
  score: number | null;
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch enrolled courses
      const enrollmentsData: any = await apiClient.get('/courses/my-courses');
      const enrollments: Enrollment[] = enrollmentsData.data?.enrollments || [];

      if (enrollments.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Fetch submissions
      const submissionsData: any = await apiClient.get('/submissions/my');
      const submissions: Submission[] = submissionsData.data?.submissions || [];

      // Fetch assignments for each enrolled course
      const allAssignments: AssignmentWithStatus[] = [];
      
      for (const enrollment of enrollments) {
        try {
          const assignmentsData: any = await apiClient.get(`/assignments/course/${enrollment.course_id}`);
          const courseAssignments: Assignment[] = assignmentsData.data?.assignments || [];

          // Map assignments with status
          courseAssignments.forEach((assignment) => {
            const submission = submissions.find(s => s.assignment_id === assignment.id);
            
            let status: 'pending' | 'submitted' | 'graded' = 'pending';
            let score: number | null = null;

            if (submission) {
              if (submission.grade !== null) {
                status = 'graded';
                score = submission.grade;
              } else {
                status = 'submitted';
              }
            }

            allAssignments.push({
              ...assignment,
              courseName: enrollment.courses.title,
              status,
              score,
            });
          });
        } catch (err) {
          console.error(`Error fetching assignments for course ${enrollment.course_id}:`, err);
        }
      }

      // Sort by due date (earliest first)
      allAssignments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      setAssignments(allAssignments);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (activeFilter === 'all') return true;
    return assignment.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'graded':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'submitted':
        return 'Submitted';
      case 'graded':
        return 'Graded';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading assignments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAssignments}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
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
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Track and submit your assignments</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 font-medium ${
              activeFilter === 'all'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 font-medium ${
              activeFilter === 'pending'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({assignments.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveFilter('submitted')}
            className={`px-4 py-2 font-medium ${
              activeFilter === 'submitted'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Submitted ({assignments.filter(a => a.status === 'submitted').length})
          </button>
          <button
            onClick={() => setActiveFilter('graded')}
            className={`px-4 py-2 font-medium ${
              activeFilter === 'graded'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Graded ({assignments.filter(a => a.status === 'graded').length})
          </button>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length > 0 ? (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                        {getStatusText(assignment.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{assignment.courseName}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 Due: {formatDate(assignment.due_date)}</span>
                      {assignment.score !== null && (
                        <span className="text-green-600 font-medium">✓ Score: {assignment.score}/100</span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    {assignment.status === 'pending' && (
                      <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                        Submit Assignment
                      </button>
                    )}
                    {assignment.status === 'submitted' && (
                      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed">
                        Awaiting Grade
                      </button>
                    )}
                    {assignment.status === 'graded' && (
                      <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
                        View Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeFilter === 'all' ? 'No Assignments Yet' : `No ${activeFilter} Assignments`}
            </h3>
            <p className="text-gray-600">
              {activeFilter === 'all'
                ? 'Enroll in courses to see assignments'
                : `You don't have any ${activeFilter} assignments`}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
