'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Offering {
  id: string;
  status: string;
  duration_weeks: number;
  hours_per_week: number;
  created_at: string;
  courses: { id: string; title: string };
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'offerings'>('courses');
  const [deleteConfirm, setDeleteConfirm] = useState<Course | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cRes, oRes]: any[] = await Promise.all([
        apiClient.get('/admin/courses'),
        apiClient.get('/admin/course-offerings'),
      ]);
      setCourses(cRes.data?.courses || []);
      setOfferings(oRes.data?.offerings || []);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiClient.delete(`/admin/courses/${deleteConfirm.id}`);
      setActionMsg({ type: 'success', text: `Course "${deleteConfirm.title}" deleted` });
      setDeleteConfirm(null);
      fetchAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Delete failed' });
      setDeleteConfirm(null);
    }
  };

  return (
    <DashboardLayout title="Course Management" subtitle="Oversee all courses and offerings">
      <div className="space-y-6">

        {actionMsg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${
            actionMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {actionMsg.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
            <span className="text-sm">{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30 w-fit">
          {(['courses', 'offerings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${
                activeTab === tab ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {tab} ({tab === 'courses' ? courses.length : offerings.length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center text-gray-500 border border-white/30">Loading...</div>
        ) : activeTab === 'courses' ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  {['Title', 'Description', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map(c => (
                  <tr key={c.id} className="hover:bg-white/60 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.description}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteConfirm(c)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {courses.length === 0 && <div className="p-8 text-center text-gray-500">No courses found</div>}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  {['Course', 'Trainer', 'Duration', 'Status', 'Created'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offerings.map(o => (
                  <tr key={o.id} className="hover:bg-white/60 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{o.courses?.title}</td>
                    <td className="px-4 py-3 text-gray-600">{o.profiles?.first_name} {o.profiles?.last_name}</td>
                    <td className="px-4 py-3 text-gray-600">{o.duration_weeks}w · {o.hours_per_week}h/wk</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        o.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {offerings.length === 0 && <div className="p-8 text-center text-gray-500">No offerings found</div>}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Course?</h2>
            <p className="text-sm text-gray-600 mb-6">Delete <strong>{deleteConfirm.title}</strong>? This will also remove all related offerings and enrollments.</p>
            <div className="flex space-x-3">
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
