'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '@/lib/api/client';

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignment: {
    id: string;
    title: string;
    description: string;
    due_date: string;
    course_offering_id: string;
  } | null;
}

interface AssignmentFormData {
  title: string;
  description: string;
  dueDate: string;
}

interface CourseOffering {
  id: string;
  courses: {
    title: string;
  };
  duration_weeks: number;
  hours_per_week: number;
}

export default function EditAssignmentModal({ isOpen, onClose, onSuccess, assignment }: EditAssignmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseOffering[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AssignmentFormData>();

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      if (assignment) {
        // Populate form with existing assignment data
        setValue('title', assignment.title);
        setValue('description', assignment.description);

        // Format the due date for datetime-local input
        const dueDate = new Date(assignment.due_date);
        const formattedDate = dueDate.toISOString().slice(0, 16);
        setValue('dueDate', formattedDate);
      }
    }
  }, [isOpen, assignment, setValue]);

  const fetchCourses = async () => {
    try {
      const response: any = await apiClient.get('/course-offerings/trainer');
      // apiClient interceptor returns response.data, so shape is { success, data: { offerings } }
      setCourses(response.data?.offerings || []);
    } catch (err) {
      console.error('Error fetching course offerings:', err);
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
    if (!assignment) return;

    const payload = {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate).toISOString(),
    };

    console.log('[EditAssignment] PUT /assignments/' + assignment.id, payload);

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await apiClient.put(`/assignments/${assignment.id}`, payload);
      console.log('[EditAssignment] Response:', response);

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[EditAssignment] Update failed:', err?.message, err);
      setError(err?.message || 'Failed to update assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!isOpen || !assignment) return null;

  const courseTitle = courses.find(c => c.id === assignment.course_offering_id)?.courses?.title;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Edit Assignment</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Assignment Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', {
                required: 'Assignment title is required',
                minLength: {
                  value: 3,
                  message: 'Title must be at least 3 characters',
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Build a REST API"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters',
                },
              })}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the assignment requirements..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Course Offering - Read Only display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Offering <span className="text-gray-500">(Cannot be changed)</span>
            </label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
              {courseTitle || 'Loading...'}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('dueDate', {
                required: 'Due date is required',
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.dueDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Assignment'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
