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
  registrationDeadline?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
}

interface CatalogCourse {
  id: string;
  title: string;
  description: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogCourses, setCatalogCourses] = useState<CatalogCourse[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CourseFormData>();

  const hoursPerWeek = watch('hoursPerWeek');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    if (isOpen) { fetchCatalogCourses(); setSelectedDays([]); }
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

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const onSubmit = async (data: CourseFormData) => {
    // Validate dates
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      setError('End date must be after start date');
      return;
    }
    if (data.registrationDeadline && data.startDate && new Date(data.registrationDeadline) >= new Date(data.startDate)) {
      setError('Registration deadline must be before start date');
      return;
    }
    if (data.startDate && selectedDays.length === 0) {
      setError('Please select at least one weekly schedule day');
      return;
    }

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
        registrationDeadline: data.registrationDeadline || null,
        weeklyDays: selectedDays.length > 0 ? selectedDays : null,
        sessionStartTime: data.sessionStartTime || null,
        sessionEndTime: data.sessionEndTime || null,
      });

      reset();
      setSelectedDays([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create course offering');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { reset(); setError(null); setSelectedDays([]); onClose(); };

  if (!isOpen) return null;

  const recommendedAssignments = hoursPerWeek ? Number(hoursPerWeek) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Course Offering</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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
              {...register('courseId', { required: 'Please select a course from catalog' })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 ${errors.courseId ? 'border-red-500' : 'border-gray-300'}`}
              disabled={loadingCatalog}
            >
              <option value="">Select a course</option>
              {catalogCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {errors.courseId && <p className="mt-1 text-sm text-red-600">{errors.courseId.message}</p>}
          </div>

          {/* Duration + Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (weeks) <span className="text-red-500">*</span></label>
              <input type="number" min="1" max="52"
                {...register('durationWeeks', { required: 'Required', min: { value:1, message:'Min 1' }, max: { value:52, message:'Max 52' } })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 ${errors.durationWeeks ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g. 8" />
              {errors.durationWeeks && <p className="mt-1 text-sm text-red-600">{errors.durationWeeks.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Week <span className="text-red-500">*</span></label>
              <input type="number" min="1" max="10"
                {...register('hoursPerWeek', { required: 'Required', min: { value:1, message:'Min 1' }, max: { value:10, message:'Max 10' } })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 ${errors.hoursPerWeek ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g. 3" />
              {errors.hoursPerWeek && <p className="mt-1 text-sm text-red-600">{errors.hoursPerWeek.message}</p>}
              {recommendedAssignments && (
                <p className="mt-1 text-xs text-purple-600">💡 Recommended: ~{recommendedAssignments} assignment(s) per week</p>
              )}
            </div>
          </div>

          {/* Course Outline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course Outline <span className="text-red-500">*</span></label>
            <textarea
              {...register('outline', { required: 'Required', minLength: { value:20, message:'At least 20 characters' } })}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 ${errors.outline ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Describe what will be covered in this course offering..." />
            {errors.outline && <p className="mt-1 text-sm text-red-600">{errors.outline.message}</p>}
          </div>

          {/* Start / End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input type="date" {...register('startDate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input type="date" {...register('endDate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>

          {/* Registration Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Deadline (optional)</label>
            <input type="datetime-local" {...register('registrationDeadline')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" />
            <p className="text-xs text-gray-500 mt-1">Students cannot enroll after this date</p>
          </div>

          {/* Weekly Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekly Schedule {startDate && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                    selectedDays.includes(day)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                  }`}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <p className="text-xs text-purple-600 mt-1">Selected: {selectedDays.join(', ')}</p>
            )}
          </div>

          {/* Session Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Start Time</label>
              <input type="time" {...register('sessionStartTime')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session End Time</label>
              <input type="time" {...register('sessionEndTime')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button type="submit" disabled={isSubmitting || loadingCatalog}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create Course Offering'}
            </button>
            <button type="button" onClick={handleClose} disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
