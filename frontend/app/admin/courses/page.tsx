'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, LockClosedIcon, PencilIcon } from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_system_course: boolean;
}

interface Offering {
  id: string;
  status: string;
  duration_weeks: number;
  hours_per_week: number;
  outline: string;
  start_date: string | null;
  end_date: string | null;
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
  const [deleteOfferingConfirm, setDeleteOfferingConfirm] = useState<Offering | null>(null);
  const [editOffering, setEditOffering] = useState<Offering | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [editDuration, setEditDuration] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editOutline, setEditOutline] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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

  const handleDeleteCourse = async () => {
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

  const handleDeleteOffering = async () => {
    if (!deleteOfferingConfirm) return;
    try {
      const res: any = await apiClient.delete(`/admin/course-offerings/${deleteOfferingConfirm.id}`);
      const action = res.data?.action || 'deleted';
      setActionMsg({ 
        type: 'success', 
        text: action === 'closed' 
          ? `Offering closed (has enrolled students)` 
          : `Offering deleted successfully`
      });
      setDeleteOfferingConfirm(null);
      fetchAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Delete failed' });
      setDeleteOfferingConfirm(null);
    }
  };

  const handleEditClick = (offering: Offering) => {
    setEditOffering(offering);
    setEditDuration(offering.duration_weeks.toString());
    setEditHours(offering.hours_per_week.toString());
    setEditStatus(offering.status);
    setEditOutline(offering.outline || '');
  };

  const handleSaveEdit = async () => {
    if (!editOffering) return;
    try {
      setEditSaving(true);
      await apiClient.put(`/admin/course-offerings/${editOffering.id}`, {
        durationWeeks: parseInt(editDuration),
        hoursPerWeek: parseInt(editHours),
        status: editStatus,
        outline: editOutline,
      });
      setActionMsg({ type: 'success', text: 'Offering updated successfully' });
      setEditOffering(null);
      fetchAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setEditSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') return 'bg-green-100 text-green-700';
    if (status === 'closed') return 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-600';
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
                  {['Title', 'Description', 'Protected', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map(c => (
                  <tr key={c.id} className="hover:bg-white/60 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.description}</td>
                    <td className="px-4 py-3">
                      {c.is_system_course ? (
                        <span className="flex items-center space-x-1 text-xs text-orange-600">
                          <LockClosedIcon className="w-3 h-3" />
                          <span>Protected</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {c.is_system_course ? (
                        <span title="Protected — cannot be deleted" className="p-1.5 text-gray-300 cursor-not-allowed inline-block">
                          <LockClosedIcon className="w-4 h-4" />
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(c)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
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
                  {['Course', 'Trainer', 'Duration', 'Status', 'Created', 'Actions'].map(h => (
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
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditClick(o)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit offering"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteOfferingConfirm(o)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete offering"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {offerings.length === 0 && <div className="p-8 text-center text-gray-500">No offerings found</div>}
          </div>
        )}
      </div>

      {/* Delete Course Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Course?</h2>
            <p className="text-sm text-gray-600 mb-6">Delete <strong>{deleteConfirm.title}</strong>? This will also remove all related offerings and enrollments.</p>
            <div className="flex space-x-3">
              <button onClick={handleDeleteCourse} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Offering Confirm */}
      {deleteOfferingConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete Offering?</h2>
            <p className="text-sm text-gray-600 mb-2">
              Delete offering for <strong>{deleteOfferingConfirm.courses?.title}</strong>?
            </p>
            <p className="text-xs text-gray-500 mb-6">
              If students are enrolled, the offering will be closed instead of deleted.
            </p>
            <div className="flex space-x-3">
              <button onClick={handleDeleteOffering} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition">Delete</button>
              <button onClick={() => setDeleteOfferingConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offering Modal */}
      {editOffering && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Course Offering</h2>
            <p className="text-sm text-gray-600 mb-6">{editOffering.courses?.title}</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    min="1"
                    max="52"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Week</label>
                  <input
                    type="number"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outline</label>
                <textarea
                  value={editOutline}
                  onChange={(e) => setEditOutline(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder="Course outline..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditOffering(null)}
                disabled={editSaving}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
