'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  TrophyIcon, AcademicCapIcon, DocumentTextIcon,
  ChatBubbleLeftRightIcon, BookmarkIcon, StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface Profile {
  id: string; first_name: string; last_name: string; email: string;
  skills: string; bio: string; avg_grade: number;
  enrollments: any[]; certificates: any[]; submissions: any[]; wp_submissions: any[];
}

export default function CandidateProfilePage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const [profileRes, bookmarksRes]: any[] = await Promise.all([
        apiClient.get(`/recruiter/candidate/${id}`),
        apiClient.get('/recruiter/bookmarks').catch(() => ({ data: { bookmarks: [] } })),
      ]);
      setProfile(profileRes.data);
      const ids = new Set((bookmarksRes.data?.bookmarks || []).map((b: any) => b.profiles?.id));
      setBookmarked(ids.has(id));
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      const res: any = await apiClient.post('/recruiter/bookmark', { candidateId: id });
      setBookmarked(res.data?.bookmarked);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <DashboardLayout title="Candidate Profile" subtitle="Loading...">
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-32" />)}</div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout title="Candidate Profile" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Candidate not found'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${profile.first_name} ${profile.last_name}`} subtitle="Candidate Profile">
      <div className="max-w-3xl space-y-6">

        {/* Header card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profile.first_name} {profile.last_name}</h2>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              {profile.bio && <p className="text-gray-600 text-sm mt-2">{profile.bio}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleBookmark}
                className={`p-2.5 rounded-xl border transition ${bookmarked ? 'bg-purple-100 border-purple-200 text-purple-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
                {bookmarked ? <BookmarkSolid className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
              </button>
              <button onClick={() => router.push(`/recruiter/messages/${profile.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1 text-yellow-600 font-medium">
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Avg grade: {profile.avg_grade}%
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <TrophyIcon className="w-4 h-4" />{profile.certificates.length} certificate{profile.certificates.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <AcademicCapIcon className="w-4 h-4" />{profile.enrollments.length} course{profile.enrollments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {profile.skills && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile.skills.split(',').map((s, i) => (
                <span key={i} className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
              ))}
            </div>
          )}
        </div>

        {/* Certificates */}
        {profile.certificates.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrophyIcon className="w-5 h-5 text-yellow-500" />Certificates</h3>
            <div className="space-y-2">
              {profile.certificates.map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between bg-white/40 rounded-xl p-3 border border-white/30">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{cert.courses?.title}</p>
                    <p className="text-xs text-gray-500">{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    {cert.completion_percentage}% completion
                    {cert.average_score && <span className="ml-2">· {cert.average_score}% avg</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrolled Courses */}
        {profile.enrollments.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><AcademicCapIcon className="w-5 h-5 text-blue-500" />Enrolled Courses</h3>
            <div className="space-y-2">
              {profile.enrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between bg-white/40 rounded-xl p-3 border border-white/30">
                  <p className="font-medium text-gray-800 text-sm">{e.course_offerings?.courses?.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full" style={{ width: `${e.progress || 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{e.progress || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work & Practice */}
        {profile.wp_submissions.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><DocumentTextIcon className="w-5 h-5 text-green-500" />Work & Practice</h3>
            <div className="space-y-2">
              {profile.wp_submissions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-white/40 rounded-xl p-3 border border-white/30">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.work_practice_tasks?.title}</p>
                    {s.work_practice_tasks?.project_type && (
                      <span className="text-xs text-gray-500">{s.work_practice_tasks.project_type}</span>
                    )}
                  </div>
                  {s.grade !== null && s.grade !== undefined && (
                    <span className="text-sm font-semibold text-gray-700">{s.grade}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
