'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  XMarkIcon,
  CameraIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

/* ── Alumni professional profile form ── */
interface AlumniForm {
  headline: string;
  bio: string;
  experience: string;
  skills: string;
  achievements: string;
  linkedinUrl: string;
  portfolioUrl: string;
  availableForMentorship: boolean;
}

/* ── Account profile data (same shape as ProfilePage) ── */
interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  bio: string;
  skills: string;
  interests: string;
  visibility_in_talent_pool: boolean;
  profile_picture_url: string | null;
  avatar_url: string | null;
  emailVerified: boolean;
}

export default function AlumniProfilePage() {
  const { user, setUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  /* ── redirect guard ── */
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'alumni') {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, isAuthenticated, isLoading, router]);
  if (!isLoading && isAuthenticated && user && user.role !== 'alumni') return null;

  /* ── shared feedback ── */
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* ════════════════════════════════════════
     SECTION 1 — Account (same as ProfilePage)
  ════════════════════════════════════════ */
  const [account, setAccount] = useState<AccountData | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [acctBio, setAcctBio]     = useState('');
  const [acctSkills, setAcctSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* password */
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving]   = useState(false);

  const fetchAccount = async () => {
    try {
      setAccountLoading(true);
      const res: any = await apiClient.get('/users/profile');
      const d: AccountData = res.data;
      setAccount(d);
      setFirstName(d.firstName || '');
      setLastName(d.lastName || '');
      setAcctBio(d.bio || '');
      setAcctSkills(d.skills || '');
      setInterests(d.interests || '');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load account' });
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: 'Image must be under 5 MB' }); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg(null);
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('bio', acctBio);
      formData.append('skills', acctSkills);
      formData.append('interests', interests);
      if (avatarFile) formData.append('avatar', avatarFile);
      const res: any = await apiClient.patch('/users/profile', formData);
      const updated = res.data;
      setAccount(prev => prev ? { ...prev, ...updated } : updated);
      if (user) {
        setUser({
          ...user,
          firstName: updated.firstName || user.firstName,
          lastName: updated.lastName || user.lastName,
          profile_picture_url: updated.profile_picture_url ?? user.profile_picture_url ?? null,
          avatar_url: updated.avatar_url ?? user.avatar_url ?? null,
        });
      }
      setMsg({ type: 'success', text: 'Account updated successfully' });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update account' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (account) {
      setFirstName(account.firstName || '');
      setLastName(account.lastName || '');
      setAcctBio(account.bio || '');
      setAcctSkills(account.skills || '');
      setInterests(account.interests || '');
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
    setMsg(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (newPw.length < 8)    { setMsg({ type: 'error', text: 'Password must be at least 8 characters' }); return; }
    try {
      setPwSaving(true);
      setMsg(null);
      await apiClient.put('/users/password', { currentPassword: currentPw, newPassword: newPw });
      setMsg({ type: 'success', text: 'Password changed successfully' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwSection(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setPwSaving(false);
    }
  };

  /* ════════════════════════════════════════
     SECTION 2 — Alumni professional profile
  ════════════════════════════════════════ */
  const [alumniForm, setAlumniForm] = useState<AlumniForm>({
    headline: '', bio: '', experience: '', skills: '',
    achievements: '', linkedinUrl: '', portfolioUrl: '', availableForMentorship: true,
  });
  const [alumniLoading, setAlumniLoading] = useState(true);
  const [alumniSaving, setAlumniSaving] = useState(false);

  const fetchAlumniProfile = async () => {
    try {
      const res: any = await apiClient.get('/alumni/profile/me');
      const p = res.data;
      if (p) {
        setAlumniForm({
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
      setAlumniLoading(false);
    }
  };

  const handleAlumniSave = async () => {
    try {
      setAlumniSaving(true);
      setMsg(null);
      await apiClient.post('/alumni/profile', alumniForm);
      setMsg({ type: 'success', text: 'Professional profile saved successfully' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save professional profile' });
    } finally {
      setAlumniSaving(false);
    }
  };

  /* ── load both on mount ── */
  useEffect(() => {
    if (user && user.role === 'alumni') {
      fetchAccount();
      fetchAlumniProfile();
    }
  }, [user]);

  /* ── helpers ── */
  const avatarSrc = avatarPreview || account?.profile_picture_url || account?.avatar_url || null;

  const alumniField = (
    label: string,
    key: keyof AlumniForm,
    multiline = false,
    placeholder = '',
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={alumniForm[key] as string}
          onChange={e => setAlumniForm(f => ({ ...f, [key]: e.target.value }))}
          rows={3}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none"
        />
      ) : (
        <input
          type="text"
          value={alumniForm[key] as string}
          onChange={e => setAlumniForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400"
        />
      )}
    </div>
  );

  /* ── loading skeleton ── */
  if (accountLoading || alumniLoading) {
    return (
      <DashboardLayout title="Profile" subtitle="Loading...">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse h-32" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile Settings" subtitle="Manage your account and professional presence">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Feedback banner ── */}
        {msg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${
            msg.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {msg.type === 'success'
              ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
              : <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)}><XMarkIcon className="w-4 h-4" /></button>
          </div>
        )}

        {/* ══════════════════════════════════════
            SECTION 1 — Account (trainer-style)
        ══════════════════════════════════════ */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          {/* Gradient header banner */}
          <div className="h-24 bg-gradient-to-r from-purple-600 to-blue-600" />

          <div className="px-6 pb-6">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {(account?.firstName || user?.firstName || '?').charAt(0)}
                      {(account?.lastName  || user?.lastName  || '').charAt(0)}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:from-purple-600 hover:to-blue-600 transition"
                  >
                    <CameraIcon className="w-4 h-4 text-white" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {!isEditing ? (
              /* ── View mode ── */
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{account?.firstName} {account?.lastName}</h2>
                  <p className="text-sm text-gray-500 capitalize">{account?.role}</p>
                  <p className="text-sm text-gray-500">{account?.email}</p>
                  {account?.emailVerified && (
                    <span className="inline-flex items-center space-x-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      <CheckCircleIcon className="w-3 h-3" />
                      <span>Email verified</span>
                    </span>
                  )}
                </div>
                {account?.bio && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bio</p>
                    <p className="text-sm text-gray-700">{account.bio}</p>
                  </div>
                )}
                {account?.skills && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {account.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Edit mode ── */
              <form onSubmit={handleAccountSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
                  </div>
                </div>

                {avatarFile && (
                  <p className="text-xs text-purple-600">📷 New photo selected: {avatarFile.name}</p>
                )}

                <div className="flex space-x-3">
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={handleCancelEdit} disabled={saving}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Change Password ── */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          <button
            onClick={() => setPwSection(!pwSection)}
            className="w-full flex items-center justify-between p-5 hover:bg-white/40 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <KeyIcon className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-800">Change Password</span>
            </div>
            <span className="text-gray-400 text-sm">{pwSection ? '▲' : '▼'}</span>
          </button>

          {pwSection && (
            <form onSubmit={handlePasswordChange} className="px-5 pb-5 space-y-4 border-t border-white/20 pt-4">
              {(['Current Password', 'New Password', 'Confirm New Password'] as const).map((label, i) => {
                const vals    = [currentPw, newPw, confirmPw];
                const setters = [setCurrentPw, setNewPw, setConfirmPw];
                return (
                  <div key={i}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="password" value={vals[i]} onChange={e => setters[i](e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
                      placeholder="••••••••" />
                  </div>
                );
              })}
              <button type="submit" disabled={pwSaving}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* ══════════════════════════════════════
            SECTION 2 — Alumni professional info
        ══════════════════════════════════════ */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Professional Info</h2>
          {alumniField('Headline', 'headline', false, 'e.g. Software Engineer at Google')}
          {alumniField('Bio', 'bio', true, 'Tell students about yourself...')}
          {alumniField('Experience', 'experience', true, 'Describe your work experience...')}
          {alumniField('Skills', 'skills', false, 'e.g. Python, Machine Learning, Leadership')}
          {alumniField('Achievements', 'achievements', true, 'Awards, certifications, notable projects...')}
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Links</h2>
          {alumniField('LinkedIn URL', 'linkedinUrl', false, 'https://linkedin.com/in/...')}
          {alumniField('Portfolio URL', 'portfolioUrl', false, 'https://yourportfolio.com')}
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Mentorship Availability</h2>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alumniForm.availableForMentorship}
              onChange={e => setAlumniForm(f => ({ ...f, availableForMentorship: e.target.checked }))}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm text-gray-700">I am available for mentorship requests from students</span>
          </label>
        </div>

        <button
          onClick={handleAlumniSave}
          disabled={alumniSaving}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 font-medium"
        >
          {alumniSaving ? 'Saving...' : 'Save Professional Profile'}
        </button>

      </div>
    </DashboardLayout>
  );
}
