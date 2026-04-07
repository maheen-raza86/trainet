'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmissionModal from '@/components/student/SubmissionModal';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_offering_id: string;
  created_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  plagiarism_score: number | null;
  plagiarism_status: string | null;
  submitted_at: string;
}

interface Enrollment {
  offering_id: string;
  course_offerings: {
    id: string;
    courses: {
      title: string;
    };
  };
}

interface AssignmentWithStatus extends Assignment {
  offeringName: string;
  status: 'pending' | 'submitted' | 'graded';
  score: number | null;
  submission: Submission | null;
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewFeedback, setViewFeedback] = useState<Submission | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch enrolled courses
      const enrollmentsData: any = await apiClient.get('/enrollments/my');
      const enrollments: Enrollment[] = enrollmentsData.data?.enrollments || [];

      if (enrollments.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Fetch submissions
      const submissionsData: any = await apiClient.get('/submissions/my');
      const submissions: Submission[] = submissionsData.data?.submissions || [];

      // Fetch assignments for each enrolled course offering
      const allAssignments: AssignmentWithStatus[] = [];
      
      for (const enrollment of enrollments) {
        try {
          const assignmentsData: any = await apiClient.get(`/assignments/course-offering/${enrollment.offering_id}`);
          const offeringAssignments: Assignment[] = assignmentsData.data?.assignments || [];

          // Map assignments with status
          offeringAssignments.forEach((assignment) => {
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
              offeringName: enrollment.course_offerings.courses.title,
              status,
              score,
              submission: submission || null,
            });
          });
        } catch (err) {
          console.error(`Error fetching assignments for offering ${enrollment.offering_id}:`, err);
        }
      }

      // Sort by due date (earliest first)
      allAssignments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      // Hide assignments past deadline that haven't been submitted
      const now = new Date();
      const visibleAssignments = allAssignments.filter(a => {
        if (a.status !== 'pending') return true; // always show submitted/graded
        return new Date(a.due_date) >= now; // only show pending if not past deadline
      });

      setAssignments(visibleAssignments);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = (assignment: Assignment) => {
    console.log('Submit button clicked for assignment:', assignment.id);
    setSelectedAssignment(assignment);
    setIsSubmissionModalOpen(true);
  };

  const handleSubmissionSuccess = () => {
    console.log('Submission successful, refreshing assignments');
    fetchAssignments(); // Refresh the assignments list
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
                    <p className="text-sm text-gray-600 mb-2">{assignment.offeringName}</p>
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
                      <button 
                        onClick={() => handleSubmitClick(assignment)}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                      >
                        Submit Assignment
                      </button>
                    )}
                    {assignment.status === 'submitted' && (
                      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed">
                        Awaiting Grade
                      </button>
                    )}
                    {(assignment.status === 'graded' || assignment.status === 'submitted') && (
                      <button
                        onClick={() => setViewFeedback(assignment.submission)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      >
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

      {/* Submission Modal */}
      {selectedAssignment && (
        <SubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => setIsSubmissionModalOpen(false)}
          onSuccess={handleSubmissionSuccess}
          assignment={selectedAssignment}
        />
      )}

      {/* Feedback Modal */}
      {viewFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Feedback</h2>

            {viewFeedback.grade !== null ? (
              <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-gray-600">Grade</p>
                <p className="text-3xl font-bold text-green-600">{viewFeedback.grade}<span className="text-lg text-gray-400">/100</span></p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-sm text-yellow-700">Your submission is awaiting grading.</p>
              </div>
            )}

            {viewFeedback.feedback && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Trainer Feedback</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{viewFeedback.feedback}</p>
              </div>
            )}

            {viewFeedback.ai_score !== null && (
              <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-1">✨ AI Evaluation Score: {viewFeedback.ai_score}/100</p>
                {viewFeedback.ai_feedback && <p className="text-sm text-gray-600">{viewFeedback.ai_feedback}</p>}
              </div>
            )}

            {viewFeedback.plagiarism_score !== null && (
              <div className={`mb-4 p-3 rounded-xl border ${
                viewFeedback.plagiarism_status === 'clean' ? 'bg-green-50 border-green-200' :
                viewFeedback.plagiarism_status === 'suspicious' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
              }`}>
                <p className="text-sm font-medium text-gray-700">
                  🔍 Plagiarism: {viewFeedback.plagiarism_score}% similarity — 
                  <span className={`ml-1 ${
                    viewFeedback.plagiarism_status === 'clean' ? 'text-green-600' :
                    viewFeedback.plagiarism_status === 'suspicious' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{viewFeedback.plagiarism_status}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => setViewFeedback(null)}
              className="w-full mt-2 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
