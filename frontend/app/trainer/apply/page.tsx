'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function TrainerApplyPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.role !== 'trainer') {
      router.push(`/${user?.role || 'login'}/dashboard`);
      return;
    }
    fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    try {
      const res: any = await apiClient.get('/trainer-application/status');
      const { trainerStatus, application: app } = res.data;
      setStatus(trainerStatus);
      setApplication(app);
      if (app) {
        setExperience(app.experience || '');
        setSkills(app.skills || '');
        setBio(app.bio || '');
      }
    } catch {
      // No application yet — show form
      setStatus(user?.trainerStatus ?? 'pending');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!experience.trim() || !skills.trim() || !bio.trim()) {
      setMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (bio.trim().length < 20) {
      setMsg({ type: 'error', text: 'Bio must be at least 20 characters.' });
      return;
    }
    try {
      setSubmitting(true);
      setMsg(null);
      const formData = new FormData();
      formData.append('experience', experience.trim());
      formData.append('skills', skills.trim());
      formData.append('bio', bio.trim());
      if (cvFile) formData.append('cv', cvFile);

      await apiClient.post('/trainer-application', formData);

      // Update local user state so dashboard banner reflects new status
      if (user) setUser({ ...user, trainerStatus: 'pending' });

      setStatus('pending');
      setMsg({ type: 'success', text: 'Application submitted! An admin will review it shortly.' });
      fetchStatus();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit application.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Trainer Verification" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Trainer Verification" subtitle="Submit your application to get approved as a trainer">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Status banner */}
        {status === 'approved' && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Your account is approved!</p>
              <p className="text-sm text-green-600">You have full access to all trainer features.</p>
            </div>
            <button onClick={() => router.push('/trainer/dashboard')}
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition">
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'pending' && application && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <ClockIcon className="w-6 h-6 text-yellow-600 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">Application under review</p>
              <p className="text-sm text-yellow-600">
                Submitted {new Date(application.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                An admin will review it shortly.
              </p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <XCircleIcon className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Application not approved</p>
              {application?.admin_notes && (
                <p className="text-sm text-red-600 mt-0.5">Admin note: {application.admin_notes}</p>
              )}
              <p className="text-sm text-red-500 mt-1">You can update and re-submit your application below.</p>
            </div>
          </div>
        )}

        {/* Feedback message */}
        {msg && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {msg.type === 'success'
              ? <CheckCircleIcon className="w-5 h-5 shrink-0" />
              : <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />}
            <span className="text-sm">{msg.text}</span>
          </div>
        )}

        {/* Application form — show when no pending application, or when rejected */}
        {(status !== 'approved') && (status !== 'pending' || !application) && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">
                  {status === 'rejected' ? 'Re-submit Application' : 'Trainer Application'}
                </h2>
                <p className="text-xs text-gray-500">Fill in your details to apply for trainer access</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teaching Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  rows={3}
                  required
                  placeholder="Describe your teaching or professional experience (years, subjects, institutions)..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills / Expertise <span className="text-red-500">*</span>
                </label>
                <input
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  required
                  placeholder="e.g. Python, Machine Learning, Data Science, Linux..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated list of your key skills</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  required
                  minLength={20}
                  placeholder="Tell us about yourself, your background, and why you want to teach on TRAINET..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{bio.length} chars (min 20)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CV / Resume <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => setCvFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {cvFile && <p className="text-xs text-purple-600 mt-1">📎 {cvFile.name}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : status === 'rejected' ? 'Re-submit Application' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

        {/* Pending — show submitted details read-only */}
        {status === 'pending' && application && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
            <h2 className="font-bold text-gray-800 mb-2">Your Submitted Application</h2>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Experience</p>
              <p className="text-sm text-gray-700">{application.experience}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {application.skills.split(',').map((s: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bio</p>
              <p className="text-sm text-gray-700">{application.bio}</p>
            </div>
            {application.cv_url && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CV</p>
                <a href={application.cv_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline">View uploaded CV</a>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
