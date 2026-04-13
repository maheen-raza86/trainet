'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import { useEffect, useRef, useState } from 'react';
import {
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  CameraIcon,
  KeyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  bio: string;
  skills: string;
  profile_picture_url: string | null;
  avatar_url: string | null;
  emailVerified: boolean;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/users/profile');
      const data: ProfileData = res.data;
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setBio(data.bio || '');
      setSkills(data.skills || '');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Image must be under 5 MB' });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg(null);

      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      if (!isAdmin) {
        formData.append('bio', bio);
        formData.append('skills', skills);
      }
      if (avatarFile) formData.append('avatar', avatarFile);

      const res: any = await apiClient.patch('/users/profile', formData);
      const updated = res.data;

      setProfile(prev => prev ? { ...prev, ...updated } : updated);

      // Sync name + profile picture into AuthContext so header updates immediately
      if (user) {
        setUser({
          ...user,
          firstName: updated.firstName || user.firstName,
          lastName: updated.lastName || user.lastName,
          profile_picture_url: updated.profile_picture_url ?? user.profile_picture_url ?? null,
          avatar_url: updated.avatar_url ?? user.avatar_url ?? null,
        });
      }

      setMsg({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setBio(profile.bio || '');
      setSkills(profile.skills || '');
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
    setMsg(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (newPw.length < 8) { setMsg({ type: 'error', text: 'Password must be at least 8 characters' }); return; }
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

  // Resolve avatar URL — DB now stores full absolute URL, use directly
  const avatarSrc = avatarPreview
    || profile?.profile_picture_url
    || profile?.avatar_url
    || null;

  if (loading) {
    return (
      <DashboardLayout title="Profile" subtitle="Loading...">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 animate-pulse h-32" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile Settings" subtitle="Manage your account information">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Feedback */}
        {msg && (
          <div className={`p-4 rounded-xl border flex items-center space-x-2 ${
            msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {msg.type === 'success' ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" /> : <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)}><XMarkIcon className="w-4 h-4" /></button>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
          {/* Header banner */}
          <div className="h-24 bg-gradient-to-r from-purple-600 to-blue-600" />

          {/* Avatar + name */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {(profile?.firstName || user?.firstName || '?').charAt(0)}
                      {(profile?.lastName || user?.lastName || '').charAt(0)}
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

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm hover:from-purple-600 hover:to-blue-600 transition"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : null}
            </div>

            {!isEditing ? (
              /* View mode */
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{profile?.firstName} {profile?.lastName}</h2>
                  <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  {profile?.emailVerified && (
                    <span className="inline-flex items-center space-x-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      <CheckCircleIcon className="w-3 h-3" />
                      <span>Email verified</span>
                    </span>
                  )}
                </div>
                {profile?.bio && !isAdmin && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bio</p>
                    <p className="text-sm text-gray-700">{profile.bio}</p>
                  </div>
                )}
                {profile?.skills && !isAdmin && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode */
              <form onSubmit={handleSave} className="space-y-4">
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

                {!isAdmin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio <span className="text-gray-400 font-normal">(max 500 chars)</span></label>
                      <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={500}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 resize-none"
                        placeholder="Tell us about yourself..." />
                      <p className="text-xs text-gray-400 text-right mt-0.5">{bio.length}/500</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills <span className="text-gray-400 font-normal">(comma separated)</span></label>
                      <input value={skills} onChange={e => setSkills(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400"
                        placeholder="JavaScript, React, Python..." />
                    </div>
                  </>
                )}

                {avatarFile && (
                  <p className="text-xs text-purple-600">📷 New photo selected: {avatarFile.name}</p>
                )}

                <div className="flex space-x-3 pt-2">
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

        {/* Change Password */}
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
              {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => {
                const vals = [currentPw, newPw, confirmPw];
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
      </div>
    </DashboardLayout>
  );
}
