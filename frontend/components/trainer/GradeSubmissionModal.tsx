'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '@/lib/api/client';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  submissionId: string;
  assignmentTitle: string;
  studentName: string;
  attachmentUrl?: string;
}

interface GradeFormData {
  grade: number;
  feedback: string;
}

export default function GradeSubmissionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  submissionId,
  assignmentTitle,
  studentName,
  attachmentUrl 
}: GradeSubmissionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GradeFormData>();

  const onSubmit = async (data: GradeFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await apiClient.put(`/submissions/${submissionId}/grade`, {
        grade: data.grade,
        feedback: data.feedback,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error grading submission:', err);
      setError(err.message || 'Failed to grade submission');
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
            <h2 className="text-2xl font-bold text-gray-900">Grade Submission</h2>
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

        {/* Submission Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Assignment:</span>
              <p className="font-medium text-gray-900">{assignmentTitle}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Student:</span>
              <p className="font-medium text-gray-900">{studentName}</p>
            </div>
            {attachmentUrl && (
              <div>
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  📎 View Submission Attachment
                </a>
              </div>
            )}
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

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade (0-100) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('grade', {
                required: 'Grade is required',
                min: {
                  value: 0,
                  message: 'Grade must be at least 0',
                },
                max: {
                  value: 100,
                  message: 'Grade must not exceed 100',
                },
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.grade ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter grade (0-100)"
            />
            {errors.grade && (
              <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
            )}
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('feedback', {
                required: 'Feedback is required',
                minLength: {
                  value: 10,
                  message: 'Feedback must be at least 10 characters',
                },
              })}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.feedback ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide detailed feedback for the student..."
            />
            {errors.feedback && (
              <p className="mt-1 text-sm text-red-600">{errors.feedback.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Grade'}
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
