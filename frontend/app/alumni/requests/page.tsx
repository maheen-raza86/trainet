'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface GuidanceRequest {
  id: string;
  topic: string;
  description: string;
  preferred_duration: string | null;
  preferred_schedule: string | null;
  status: string;
  created_at: string;
  profiles: { id: string; first_name: string; last_name: string; email: string };
}

interface SessionForm {
  title: string;
  topic: string;
  description: string;
  start_date: string;
  end_date: string;
  meeting_link: string;
  schedule_text: string;
  duration_text: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
};

const EMPTY_FORM: SessionForm = {
  title: '',
  topic: '',
  description: '',
  start_date: '',
  end_date: '',
  meeting_link: '',
  schedule_text: '',
  duration_text: '',
};

export default function AlumniRequestsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<GuidanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [modalRequest, setModalRequest] = useState<GuidanceRequest | null>(null);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'alumni') fetchRequests();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') return null;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiClient.get('/guidance/alumni');
      setRequests(res.data?.requests || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const respond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await apiClient.put(`/guidance/${id}/respond`, { status });
      if (status === 'accepted') {
        // immediately open the Create Session modal for this request
        const req = requests.find(r => r.id === id);
        if (req) {
          await fetchRequests(); // refresh so status is updated
          openModal({ ...req, status: 'accepted' });
        } else {
          fetchRequests();
        }
      } else {
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    }
  };

  const openModal = (req: GuidanceRequest) => {
    setModalRequest(req);
    setForm({ ...EMPTY_FORM, topic: req.topic, title: `${req.topic} — Guidance Session` });
    setFormError(null);
  };

  const closeModal = () => {
    setModalRequest(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRequest) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res: any = await apiClient.post('/guidance/sessions', {
        guidance_request_id: modalRequest.id,
        title: form.title,
        topic: form.topic,
        description: form.description || undefined,
        start_date: form.start_date,
        end_date: form.end_date,
        meeting_link: form.meeting_link,
        schedule_text: form.schedule_text || undefined,
        duration_text: form.duration_text || undefined,
      });
      closeModal();
      // redirect to the newly created session
      const sessionId = res.data?.id || res.data?.session?.id;
      if (sessionId) {
        router.push(`/alumni/sessions/${sessionId}`);
      } else {
        fetchRequests();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const rejected = requests.filter(r => r.status === 'rejected');

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: pending.length, icon: ClockIcon },
    { key: 'accepted' as const, label: 'Accepted', count: accepted.length, icon: CheckCircleIcon },
    { key: 'rejected' as const, label: 'Rejected', count: rejected.length, icon: XCircleIcon },
  ];

  const displayed = activeTab === 'pending' ? pending : activeTab === 'accepted' ? accepted : rejected;

  if (loading) {
    return (
      <DashboardLayout title="Guidance Requests" subtitle="Loading...">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-28" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Guidance Requests" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchRequests} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Guidance Requests" subtitle="Manage incoming guidance requests from students">
      <div className="space-y-6">

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/30 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Request list */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No {activeTab} requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(req => (
              <div key={req.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">
                        {req.profiles?.first_name} {req.profiles?.last_name}
                      </p>
                      <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${STATUS_BADGE[req.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{req.topic}</p>
                    {req.description && (
                      <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {req.preferred_duration && (
                        <span className="text-xs text-gray-500">Duration: {req.preferred_duration}</span>
                      )}
                      {req.preferred_schedule && (
                        <span className="text-xs text-gray-500">Schedule: {req.preferred_schedule}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => respond(req.id, 'accepted')}
                          className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respond(req.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'accepted' && (
                      <button
                        onClick={() => openModal(req)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
                      >
                        <PlusIcon className="w-3 h-3" />
                        <span>Create Session</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {modalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Create Session</h2>
                <p className="text-sm text-gray-500">
                  For {modalRequest.profiles?.first_name} {modalRequest.profiles?.last_name}
                </p>
              </div>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitSession} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Session title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                <input
                  name="topic"
                  value={form.topic}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="Session topic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link *</label>
                <input
                  name="meeting_link"
                  value={form.meeting_link}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Text</label>
                <input
                  name="schedule_text"
                  value={form.schedule_text}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="e.g. Every Monday 3pm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration Text</label>
                <input
                  name="duration_text"
                  value={form.duration_text}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="e.g. 1 hour"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
