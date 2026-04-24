'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import {
  TrophyIcon, AcademicCapIcon, DocumentTextIcon,
  BookmarkIcon, StarIcon, ExclamationTriangleIcon,
  EnvelopeIcon, BriefcaseIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  skills: string;
  interests: string;
  bio: string;
  avg_grade: number;
  enrollments: any[];
  certificates: any[];
  submissions: any[];
  wp_submissions: any[];
  match_score_skills?: number;
  match_score_projects?: number;
  match_score_perf?: number;
}

export default function CandidateProfilePage() {
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

  const sendEmail = () => {
    if (!profile) return;
    const name = `${profile.first_name} ${profile.last_name}`;
    const subject = encodeURIComponent('TRAINET Opportunity');
    const body = encodeURIComponent(
      `Hello ${name}, I found your profile on TRAINET and would like to connect regarding an opportunity.`
    );
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };

  // Match score breakdown
  const skillScore = profile ? Math.round((profile.match_score_skills ?? 0)) : 0;
  const projectScore = profile ? Math.round((profile.match_score_projects ?? 0)) : 0;
  const perfScore = profile ? Math.round((profile.match_score_perf ?? 0)) : 0;

  if (loading) {
    return (
      <DashboardLayout title="Candidate Profile" subtitle="Loading...">
        <div className="space-y-4 max-w-3xl">
          {[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-6 border border-white/30 animate-pulse h-32" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout title="Candidate Profile" subtitle="Error">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-xl">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Candidate not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-purple-600 underline text-sm">Go back</button>
        </div>
      </DashboardLayout>
    );
  }

  const avgGrade = profile.avg_grade || 0;
  const completedCourses = profile.enrollments.filter((e: any) => e.course_offerings?.status === 'closed' || e.progress >= 100);
  const activeCourses = profile.enrollments.filter((e: any) => e.course_offerings?.status !== 'closed' && e.progress < 100);

  return (
    <DashboardLayout title={`${profile.first_name} ${profile.last_name}`} subtitle="Candidate Profile">
      <div className="max-w-3xl space-y-6">

        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-white text-xl font-bold">
                  {profile.first_name[0]}{profile.last_name[0]}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{profile.first_name} {profile.last_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
                    <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {avgGrade}% avg grade
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-500">{profile.certificates.length} certificate{profile.certificates.length !== 1 ? 's' : ''}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-500">{profile.enrollments.length} course{profile.enrollments.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleBookmark}
                className={`p-2.5 rounded-xl border transition ${bookmarked ? 'bg-purple-100 border-purple-200 text-purple-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
                {bookmarked ? <BookmarkSolid className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
              </button>
              <button onClick={sendEmail}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm">
                <EnvelopeIcon className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        {(profile.bio || profile.skills || profile.interests) && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-purple-500" />About
            </h3>
            {profile.bio && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bio</p>
                <p className="text-sm text-gray-700">{profile.bio}</p>
              </div>
            )}
            {profile.skills && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.split(',').map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{s.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.interests && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.split(',').map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{s.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Contact</p>
          <p className="text-sm text-gray-700">{profile.email}</p>
        </div>

        {/* Education / Courses */}
        {profile.enrollments.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-blue-500" />Education / Courses
            </h3>
            {activeCourses.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current</p>
                <div className="space-y-2">
                  {activeCourses.map((e: any) => (
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
            {completedCourses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Completed</p>
                <div className="space-y-2">
                  {completedCourses.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between bg-white/40 rounded-xl p-3 border border-white/30">
                      <p className="font-medium text-gray-800 text-sm">{e.course_offerings?.courses?.title}</p>
                      <span className="text-xs text-green-600 font-medium">Completed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certificates */}
        {profile.certificates.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />Certificates
            </h3>
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

        {/* Work & Practice */}
        {profile.wp_submissions.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BriefcaseIcon className="w-5 h-5 text-green-500" />Work & Practice
            </h3>
            <div className="space-y-2">
              {profile.wp_submissions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-white/40 rounded-xl p-3 border border-white/30">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.work_practice_tasks?.title}</p>
                    {s.work_practice_tasks?.task_type && (
                      <span className="text-xs text-gray-500 capitalize">{s.work_practice_tasks.task_type}</span>
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

        {/* Assignment Submissions */}
        {profile.submissions.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-indigo-500" />Assignment Grades
            </h3>
            <div className="space-y-2">
              {profile.submissions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-white/40 rounded-xl p-3 border border-white/30">
                  <p className="font-medium text-gray-800 text-sm">{s.assignments?.title || 'Assignment'}</p>
                  <span className="text-sm font-semibold text-gray-700">{s.grade ?? s.ai_score ?? '—'}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-yellow-500" />Performance Summary
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-purple-700">{avgGrade}%</p>
              <p className="text-xs text-purple-500 mt-0.5">Final Avg Grade</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{profile.certificates.length}</p>
              <p className="text-xs text-blue-500 mt-0.5">Certificates</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-700">{profile.wp_submissions.length}</p>
              <p className="text-xs text-green-500 mt-0.5">Projects</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Match Score Breakdown</p>
            {[
              { label: 'Skills Match', pct: 50, color: 'from-purple-500 to-pink-500' },
              { label: 'Project Relevance', pct: 30, color: 'from-blue-500 to-cyan-500' },
              { label: 'Performance', pct: 20, color: 'from-green-500 to-emerald-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-36 shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className={`bg-gradient-to-r ${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom action buttons */}
        <div className="flex gap-3 pb-4">
          <button onClick={handleBookmark}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition text-sm font-medium ${bookmarked ? 'bg-purple-100 border-purple-200 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {bookmarked ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
            {bookmarked ? 'Bookmarked' : 'Bookmark Candidate'}
          </button>
          <button onClick={sendEmail}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition text-sm font-medium">
            <EnvelopeIcon className="w-4 h-4" />
            Send Email
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
