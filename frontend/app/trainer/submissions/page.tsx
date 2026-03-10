'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';

interface Assignment {
  id: string;
  title: string;
  course_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  attachment_url: string;
  status: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  profiles: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface SubmissionWithDetails extends Submission {
  assignmentTitle: string;
  studentName: string;
}

export default function TrainerSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all courses
      const coursesResponse: any = await apiClient.get('/courses');
      const courses = coursesResponse.data?.courses || [];

      // Fetch assignments and submissions for all courses
      const allSubmissions: SubmissionWithDetails[] = [];
      
      for (const course of courses) {
        try {
          const assignmentsResponse: any = await apiClient.get(`/assignments/course/${course.id}`);
          const assignments: Assignment[] = assignmentsResponse.data?.assignments || [];

          for (const assignment of assignments) {
            try {
              const submissionsResponse: any = await apiClient.get(`/submissions/assignment/${assignment.id}`);
              const assignmentSubmissions: Submission[] = submissionsResponse.data?.submissions || [];

              assignmentSubmissions.forEach((submission) => {
                allSubmissions.push({
                  ...submission,
                  assignmentTitle: assignment.title,
                  studentName: `${submission.profiles.first_name} ${submission.profiles.last_name}`,
                });
              });
            } catch (err) {
              console.error(`Error fetching submissions for assignment ${assignment.id}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error fetching assignments for course ${course.id}:`, err);
        }
      }

      // Sort by submission date (most recent first)
      allSubmissions.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      setSubmissions(allSubmissions);

    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    if (filter === 'pending') return submission.grade === null;
    if (filter === 'graded') return submission.grade !== null;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading submissions...</p>
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
            onClick={fetchSubmissions}
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
          <h1 className="text-2xl font-bold text-gray-900">Student Submissions</h1>
          <p className="text-gray-600 mt-1">Review and grade student submissions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium ${
              filter === 'all'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-medium ${
              filter === 'pending'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({submissions.filter(s => s.grade === null).length})
          </button>
          <button
            onClick={() => setFilter('graded')}
            className={`px-4 py-2 font-medium ${
              filter === 'graded'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Graded ({submissions.filter(s => s.grade !== null).length})
          </button>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{submission.assignmentTitle}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        submission.grade !== null
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {submission.grade !== null ? 'Graded' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Student: <span className="font-medium">{submission.studentName}</span>
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      📧 {submission.profiles.email}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 Submitted: {formatDate(submission.submitted_at)}</span>
                      {submission.grade !== null && (
                        <span className="text-green-600 font-medium">
                          ✓ Grade: {submission.grade}/100
                        </span>
                      )}
                    </div>
                    {submission.attachment_url && (
                      <div className="mt-3">
                        <a
                          href={submission.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700 underline"
                        >
                          📎 View Attachment
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    {submission.grade === null ? (
                      <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                        Grade Submission
                      </button>
                    ) : (
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                        View Details
                      </button>
                    )}
                  </div>
                </div>

                {/* Feedback Section (if graded) */}
                {submission.feedback && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                    <p className="text-sm text-gray-600">{submission.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'No Submissions Yet' : `No ${filter} Submissions`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'Student submissions will appear here'
                : `You don't have any ${filter} submissions`}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
