'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '@/lib/api/client';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CourseFormData {
  courseId: string;
  durationWeeks: number;
  hoursPerWeek: number;
  outline: string;
  startDate?: string;
  endDate?: string;
}

interface CatalogCourse {
  id: string;
  title: string;
  description: string;
}

export default function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogCourses, setCatalogCourses] = useState<CatalogCourse[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseFormData>();

  useEffect(() => {
    if (isOpen) {
      fetchCatalogCourses();
    }
  }, [isOpen]);

  const fetchCatalogCourses = async () => {
    try {
      setLoadingCatalog(true);
      const response: any = await apiClient.get('/courses');
      setCatalogCourses(response.data?.courses || []);
    } catch (err) {
      console.error('Error fetching catalog courses:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await apiClient.post('/course-offerings', {
        courseId: data.courseId,
        durationWeeks: Number(data.durationWeeks),
        hoursPerWeek: Number(data.hoursPerWeek),
        outline: data.outline,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      });
      
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating course offering:', err);
      setError(err.message || 'Failed to create course offering');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Course Offering</h2>
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

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course from Catalog <span className="text-red-500">*</span>
            </label>
            <select
              {...register('courseId', {
                required: 'Please select a course from catalog',
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.courseId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loadingCatalog}
            >
              <option value="">Select a course</option>
              {catalogCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="mt-1 text-sm text-red-600">{errors.courseId.message}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (weeks) <span className="text-red-500">*</span>
            </label>
            <select
              {...register('durationWeeks', {
                required: 'Duration is required',
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.durationWeeks ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select duration</option>
              <option value="4">4 weeks</option>
              <option value="6">6 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
            </select>
            {errors.durationWeeks && (
              <p className="mt-1 text-sm text-red-600">{errors.durationWeeks.message}</p>
            )}
          </div>

          {/* Hours per Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours per Week <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              {...register('hoursPerWeek', {
                required: 'Hours per week is required',
                min: {
                  value: 1,
                  message: 'Minimum 1 hour per week',
                },
                max: {
                  value: 10,
                  message: 'Maximum 10 hours per week',
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.hoursPerWeek ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 4"
            />
            {errors.hoursPerWeek && (
              <p className="mt-1 text-sm text-red-600">{errors.hoursPerWeek.message}</p>
            )}
          </div>

          {/* Course Outline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Outline <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('outline', {
                required: 'Course outline is required',
                minLength: {
                  value: 20,
                  message: 'Outline must be at least 20 characters',
                },
              })}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.outline ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe what will be covered in this course offering..."
            />
            {errors.outline && (
              <p className="mt-1 text-sm text-red-600">{errors.outline.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date (optional)
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (optional)
            </label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || loadingCatalog}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Course Offering'}
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
