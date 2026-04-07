'use client';

import { useState } from 'react';
import apiClient from '@/lib/api/client';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignment: {
    id: string;
    title: string;
    description: string;
  };
}

export default function SubmissionModal({ isOpen, onClose, onSuccess, assignment }: SubmissionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - added .doc and .docx
      const allowedExtensions = ['.pdf', '.zip', '.js', '.py', '.java', '.cpp', '.c', '.txt', '.md', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        setError(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      console.log('Submitting assignment:', assignment.id, 'with file:', selectedFile.name);
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('assignmentId', assignment.id);
      formData.append('file', selectedFile);

      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Submit assignment - let axios handle Content-Type automatically
      const response: any = await apiClient.post('/submissions', formData);

      console.log('Submission response:', response);

      if (response.success) {
        onSuccess();
        onClose();
        // Reset form
        setSelectedFile(null);
        setError('');
      } else {
        setError(response.message || 'Failed to submit assignment');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedFile(null);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Submit Assignment</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Assignment Info */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{assignment.title}</h3>
            <p className="text-sm text-gray-600">{assignment.description}</p>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition">
              <input
                type="file"
                accept=".pdf,.zip,.js,.py,.java,.cpp,.c,.txt,.md,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isSubmitting}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, ZIP, JS, PY, JAVA, CPP, C, TXT, MD, DOC, DOCX (max 10MB)
                </span>
              </label>
            </div>
            
            {selectedFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-xs text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    disabled={isSubmitting}
                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}