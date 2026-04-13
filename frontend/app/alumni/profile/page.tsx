'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ProfileForm {
  headline: string;
  bio: string;
  experience: string;
  skills: string;
  achievements: string;
  linkedinUrl: string;
  portfolioUrl: string;
  availableForMentorship: boolean;
}

export default function AlumniProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({
    headline: '', bio: '', experience: '', skills: '',
    achievements: '', linkedinUrl: '', portfolioUrl: '', availableForMentorship: true,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'alumni') fetchProfile();
  }, [user]);

  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') return null;

  const fetchProfile = async () => {
    try {
      const res: any = await apiClient.get('/alumni/profile/me');
      const p = res.data;
      if (p) {
        setForm({
          headline: p.headline || '',
          bio: p.bio || '',
          experience: p.experience || '',
          skills: p.skills || '',
          achievements: p.achievements || '',
          linkedinUrl: p.linkedin_url || '',
          portfolioUrl: p.portfolio_url || '',
          availableForMentorship: p.available_for_mentorship ?? true,
        });
      }
    } catch { /* no profile yet */ } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      await apiClient.post('/alumni/profile', form);
      setMsg({ type: 'success', text: 'Profile saved successfully' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof ProfileForm, multiline = false, placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={3}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
        />
      ) : (
        <input
          type="text"
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title="Alumni Profile" subtitle="Loading...">
        <div className="bg-white/60 rounded-2xl p-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Alumni Profile" subtitle="Build your professional presence for students to discover">
      <div className="max-w-2xl space-y-6">

        {msg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
            <span className="text-sm">{msg.text}</span>
          </div>
        )}

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Professional Info</h2>
          {field('Headline', 'headline', false, 'e.g. Software Engineer at Google')}
          {field('Bio', 'bio', true, 'Tell students about yourself...')}
          {field('Experience', 'experience', true, 'Describe your work experience...')}
          {field('Skills', 'skills', false, 'e.g. Python, Machine Learning, Leadership')}
          {field('Achievements', 'achievements', true, 'Awards, certifications, notable projects...')}
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Links</h2>
          {field('LinkedIn URL', 'linkedinUrl', false, 'https://linkedin.com/in/...')}
          {field('Portfolio URL', 'portfolioUrl', false, 'https://yourportfolio.com')}
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Mentorship Availability</h2>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.availableForMentorship}
              onChange={e => setForm(f => ({ ...f, availableForMentorship: e.target.checked }))}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm text-gray-700">I am available for mentorship requests from students</span>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </DashboardLayout>
  );
}
