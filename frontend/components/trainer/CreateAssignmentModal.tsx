'use client';

import { useState, useEffect, useRef } from 'react';
import apiClient from '@/lib/api/client';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CourseOffering {
  id: string;
  courses: { title: string };
  duration_weeks: number;
}

export default function CreateAssignmentModal({ isOpen, onClose, onSuccess }: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseOfferingId, setCourseOfferingId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [courses, setCourses] = useState<CourseOffering[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      setTitle(''); setDescription(''); setCourseOfferingId(''); setDueDate(''); setFile(null); setError('');
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res: any = await apiClient.get('/course-offerings/trainer');
      setCourses(res.data?.offerings || []);
    } catch { /* ignore */ } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !courseOfferingId || !dueDate) {
      setError('All fields are required');
      return;
    }
    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('courseOfferingId', courseOfferingId);
      formData.append('dueDate', new Date(dueDate).toISOString());
      if (file) formData.append('file', file);

      await apiClient.post('/assignments', formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Assignment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
              placeholder="e.g. Build a REST API" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
              placeholder="Describe the assignment requirements..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Offering *</label>
            <select value={courseOfferingId} onChange={e => setCourseOfferingId(e.target.value)} required
              disabled={loadingCourses}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400">
              <option value="">{loadingCourses ? 'Loading courses...' : 'Select a course offering'}</option>
              {courses.map(o => (
                <option key={o.id} value={o.id}>{o.courses?.title} ({o.duration_weeks}w)</option>
              ))}
            </select>
            {!loadingCourses && courses.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">No course offerings found. Create one first.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" />
          </div>

          {/* File attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition"
            >
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <PaperClipIcon className="w-4 h-4 text-purple-500" />
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <PaperClipIcon className="w-5 h-5 mx-auto mb-1" />
                  Click to attach PDF, DOCX, or ZIP
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.zip,.txt,.md"
              onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting || loadingCourses}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Assignment'}
            </button>
            <button type="button" onClick={onClose} disabled={submitting}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition disabled:opacity-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
