'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AcademicCapIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface Offering {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  outline: string;
  status: string;
  courses: { id: string; title: string; description: string };
  profiles: { id: string; first_name: string; last_name: string };
}

export default function BrowseCourses() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offeringsRes, enrollmentsRes] = await Promise.all([
        apiClient.get('/course-offerings/available'),
        apiClient.get('/enrollments/my'),
      ]);
      setOfferings((offeringsRes as any).data?.offerings || []);
      const enrolled = new Set<string>(
        ((enrollmentsRes as any).data?.enrollments || []).map((e: any) => e.offering_id)
      );
      setEnrolledIds(enrolled);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (offeringId: string) => {
    try {
      setEnrolling(offeringId);
      setError(null);
      await apiClient.post('/course-offerings/enroll', { offeringId });
      setEnrolledIds(prev => new Set([...prev, offeringId]));
      setSuccess('Successfully enrolled!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Courses</h1>
            <p className="text-gray-600 mt-1">Enroll in available course offerings</p>
          </div>
          <Link href="/student/courses" className="text-sm text-purple-600 hover:text-purple-700">
            ← My Courses
          </Link>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">{success}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
        )}

        {offerings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((offering) => {
              const isEnrolled = enrolledIds.has(offering.id);
              return (
                <div key={offering.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden hover:shadow-lg transition">
                  <div className="h-28 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <AcademicCapIcon className="w-12 h-12 text-white/80" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 mb-1">{offering.courses.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{offering.courses.description}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                      <span className="flex items-center"><ClockIcon className="w-3 h-3 mr-1" />{offering.duration_weeks}w</span>
                      <span>{offering.hours_per_week}h/week</span>
                      <span className="flex items-center"><UserIcon className="w-3 h-3 mr-1" />{offering.profiles.first_name} {offering.profiles.last_name}</span>
                    </div>
                    {isEnrolled ? (
                      <Link
                        href={`/student/courses/${offering.id}`}
                        className="block w-full text-center py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition"
                      >
                        ✓ Go to Course
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(offering.id)}
                        disabled={enrolling === offering.id}
                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50"
                      >
                        {enrolling === offering.id ? 'Enrolling...' : 'Enroll Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/30">
            <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No courses available right now</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
