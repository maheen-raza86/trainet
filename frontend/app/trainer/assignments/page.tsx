'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateAssignmentModal from '@/components/trainer/CreateAssignmentModal';
import EditAssignmentModal from '@/components/trainer/EditAssignmentModal';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CourseOffering {
  id: string;
  courses: {
    title: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_offering_id: string;
  created_at: string;
}

interface AssignmentWithCourse extends Assignment {
  offeringName: string;
  submissionsCount: number;
}

export default function TrainerAssignments() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithCourse | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trainer's course offerings
      const offeringsResponse: any = await apiClient.get('/course-offerings/trainer');
      const offerings: CourseOffering[] = offeringsResponse.data?.offerings || [];

      // Fetch assignments for all course offerings
      const allAssignments: AssignmentWithCourse[] = [];
      
      for (const offering of offerings) {
        try {
          const assignmentsResponse: any = await apiClient.get(`/assignments/course-offering/${offering.id}`);
          const offeringAssignments: Assignment[] = assignmentsResponse.data?.assignments || [];

          // Fetch submission count for each assignment
          for (const assignment of offeringAssignments) {
            let submissionsCount = 0;
            try {
              const submissionsResponse: any = await apiClient.get(`/submissions/assignment/${assignment.id}`);
              submissionsCount = submissionsResponse.data?.submissions?.length || 0;
            } catch (err) {
              console.error(`Error fetching submissions for assignment ${assignment.id}:`, err);
            }

            allAssignments.push({
              ...assignment,
              offeringName: offering.courses.title,
              submissionsCount,
            });
          }
        } catch (err) {
          console.error(`Error fetching assignments for offering ${offering.id}:`, err);
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

  const handleCreateSuccess = () => {
    fetchAssignments();
  };

  const handleEditSuccess = () => {
    fetchAssignments();
    setSelectedAssignment(null);
  };

  const handleEditClick = (assignment: AssignmentWithCourse) => {
    setSelectedAssignment(assignment);
    setIsEditModalOpen(true);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600 mt-1">Manage assignments and track submissions</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            Create Assignment
          </button>
        </div>

        {/* Assignments List */}
        {assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {assignment.submissionsCount} Submissions
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{assignment.offeringName}</p>
                    <p className="text-sm text-gray-500 mb-3">{assignment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 Due: {formatDate(assignment.due_date)}</span>
                      <span>📝 Created: {formatDate(assignment.created_at)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex space-x-2">
                    <button 
                      onClick={() => router.push(`/trainer/submissions?assignmentId=${assignment.id}`)}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                    >
                      View Submissions
                    </button>
                    <button 
                      onClick={() => handleEditClick(assignment)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Assignments Yet</h3>
            <p className="text-gray-600 mb-6">Create your first assignment to get started</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              Create Your First Assignment
            </button>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAssignment(null);
        }}
        onSuccess={handleEditSuccess}
        assignment={selectedAssignment}
      />
    </DashboardLayout>
  );
}
