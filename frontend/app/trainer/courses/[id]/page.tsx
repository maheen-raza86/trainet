'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentTextIcon,
  LinkIcon,
  VideoCameraIcon,
  TrashIcon,
  PlusIcon,
  PencilIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  file_url: string | null;
  external_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface OfferingDetail {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  outline: string;
  status: string;
  live_session_link: string | null;
  live_session_notes: string | null;
  courses: { id: string; title: string; description: string };
  profiles: { id: string; first_name: string; last_name: string };
  materials: Material[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
}

export default function TrainerCourseManage() {
  const params = useParams();
  const offeringId = params.id as string;

  const [offering, setOffering] = useState<OfferingDetail | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'live'>('materials');

  // Material form
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matType, setMatType] = useState<'file' | 'link' | 'video' | 'document'>('file');
  const [matUrl, setMatUrl] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matSaving, setMatSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live session form
  const [liveLink, setLiveLink] = useState('');
  const [liveNotes, setLiveNotes] = useState('');
  const [liveSaving, setLiveSaving] = useState(false);

  // Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [offeringId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [detailRes, assignmentsRes] = await Promise.all([
        apiClient.get(`/materials/offering-detail/${offeringId}`),
        apiClient.get(`/assignments/course-offering/${offeringId}`),
      ]);
      const detail = (detailRes as any).data as OfferingDetail;
      setOffering(detail);
      setLiveLink(detail.live_session_link || '');
      setLiveNotes(detail.live_session_notes || '');
      setAssignments((assignmentsRes as any).data?.assignments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    try {
      setMatSaving(true);
      const formData = new FormData();
      formData.append('offeringId', offeringId);
      formData.append('title', matTitle);
      formData.append('description', matDesc);
      formData.append('materialType', matType);
      if (matType === 'link' || matType === 'video') {
        formData.append('externalUrl', matUrl);
      }
      if (matFile) formData.append('file', matFile);

      await apiClient.post('/materials', formData);
      setMatTitle(''); setMatDesc(''); setMatUrl(''); setMatFile(null); setShowMaterialForm(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to add material');
    } finally {
      setMatSaving(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await apiClient.delete(`/materials/${id}`);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleSaveLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLiveSaving(true);
      await apiClient.put(`/materials/live-session/${offeringId}`, {
        liveSessionLink: liveLink,
        liveSessionNotes: liveNotes,
      });
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setLiveSaving(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !assignDesc.trim()) return;
    try {
      setAssignSaving(true);
      await apiClient.post('/assignments', {
        title: assignTitle,
        description: assignDesc,
        courseOfferingId: offeringId,
        dueDate: assignDue || undefined,
      });
      setAssignTitle(''); setAssignDesc(''); setAssignDue(''); setShowAssignForm(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment? All submissions will also be deleted.')) return;
    try {
      await apiClient.delete(`/assignments/${id}`);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="w-5 h-5" />;
      case 'link': return <LinkIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !offering) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error || 'Course not found'}</p>
          <Link href="/trainer/courses" className="mt-4 inline-block text-purple-600 underline">Back</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <Link href="/trainer/courses" className="text-white/70 hover:text-white text-sm mb-3 inline-block">
            ← Back to My Courses
          </Link>
          <h1 className="text-2xl font-bold mb-1">{offering.courses.title}</h1>
          <p className="text-white/80 text-sm">{offering.duration_weeks} weeks · {offering.hours_per_week}h/week</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30">
          {(['materials', 'assignments', 'live'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'materials' ? '📚 Materials' : tab === 'assignments' ? '📝 Assignments' : '🎥 Live Session'}
            </button>
          ))}
        </div>

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowMaterialForm(!showMaterialForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Material</span>
              </button>
            </div>

            {showMaterialForm && (
              <form onSubmit={handleAddMaterial} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 space-y-4">
                <h3 className="font-semibold text-gray-800">Add New Material</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input value={matTitle} onChange={e => setMatTitle(e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="e.g. Week 1 Slides" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input value={matDesc} onChange={e => setMatDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="Optional description" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={matType} onChange={e => setMatType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400">
                      <option value="file">File Upload</option>
                      <option value="link">External Link</option>
                      <option value="video">Video Link</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  {(matType === 'link' || matType === 'video') ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                      <input value={matUrl} onChange={e => setMatUrl(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" placeholder="https://..." />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                      <input ref={fileInputRef} type="file" onChange={e => setMatFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700" />
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button type="submit" disabled={matSaving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                    {matSaving ? 'Saving...' : 'Add Material'}
                  </button>
                  <button type="button" onClick={() => setShowMaterialForm(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {offering.materials.length > 0 ? (
              offering.materials.map((m) => (
                <div key={m.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      {getMaterialIcon(m.material_type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                      {m.file_name && <p className="text-xs text-gray-400">{m.file_name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(m.external_url || m.file_url) && (
                      <a href={m.external_url || `http://localhost:5000${m.file_url}`} target="_blank" rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-purple-600 transition">
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => handleDeleteMaterial(m.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-10 text-center border border-white/30">
                <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No materials yet. Add your first material above.</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create Assignment</span>
              </button>
            </div>

            {showAssignForm && (
              <form onSubmit={handleCreateAssignment} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 space-y-4">
                <h3 className="font-semibold text-gray-800">New Assignment</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" placeholder="Assignment title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions *</label>
                  <textarea value={assignDesc} onChange={e => setAssignDesc(e.target.value)} required rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none" placeholder="Describe the assignment requirements..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="datetime-local" value={assignDue} onChange={e => setAssignDue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" />
                </div>
                <div className="flex space-x-3">
                  <button type="submit" disabled={assignSaving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                    {assignSaving ? 'Creating...' : 'Create Assignment'}
                  </button>
                  <button type="button" onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {assignments.length > 0 ? (
              assignments.map((a) => (
                <div key={a.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(a.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link href={`/trainer/submissions?assignmentId=${a.id}`}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition">
                        Submissions
                      </Link>
                      <button onClick={() => handleDeleteAssignment(a.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-10 text-center border border-white/30">
                <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No assignments yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Live Session Tab */}
        {activeTab === 'live' && (
          <form onSubmit={handleSaveLiveSession} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30 space-y-4">
            <h3 className="font-semibold text-gray-800">Live Session Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Link (Google Meet, Zoom, etc.)</label>
              <input value={liveLink} onChange={e => setLiveLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400" placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes</label>
              <textarea value={liveNotes} onChange={e => setLiveNotes(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                placeholder="e.g. Every Tuesday 7PM, password: 1234" />
            </div>
            <button type="submit" disabled={liveSaving}
              className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
              {liveSaving ? 'Saving...' : 'Save Live Session'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
