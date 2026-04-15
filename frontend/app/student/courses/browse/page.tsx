'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import EnrollQRModal from '@/components/student/EnrollQRModal';
import apiClient from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AcademicCapIcon, ClockIcon, UserIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface Offering {
  id: string;
  duration_weeks: number;
  hours_per_week: number;
  outline: string;
  status: string;
  registration_deadline: string | null;
  courses: { id: string; title: string; description: string };
  profiles: { id: string; first_name: string; last_name: string };
}

export default function BrowseCourses() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ offeringId: string; courseTitle: string } | null>(null);

  useEffect(() => { fetchData(); }, []);

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

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date() > new Date(deadline);
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
            <p className="text-gray-600 mt-1">Scan the QR code or use the enrollment link to join a course</p>
          </div>
          <Link href="/student/courses" className="text-sm text-purple-600 hover:text-purple-700">
            ← My Courses
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
        )}

        {/* Info banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <QrCodeIcon className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <p className="text-sm text-purple-700">
            Enrollment is QR-based. Click "Enroll Now" on any course to view the QR code and enrollment link.
          </p>
        </div>

        {offerings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((offering) => {
              const isEnrolled = enrolledIds.has(offering.id);
              const deadlinePassed = isDeadlinePassed(offering.registration_deadline);
              return (
                <div key={offering.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden hover:shadow-lg transition">
                  <div className="h-28 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <AcademicCapIcon className="w-12 h-12 text-white/80" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 mb-1">{offering.courses.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{offering.courses.description}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                      <span className="flex items-center"><ClockIcon className="w-3 h-3 mr-1" />{offering.duration_weeks}w</span>
                      <span>{offering.hours_per_week}h/week</span>
                      <span className="flex items-center"><UserIcon className="w-3 h-3 mr-1" />{offering.profiles.first_name} {offering.profiles.last_name}</span>
                    </div>
                    {offering.registration_deadline && (
                      <p className={`text-xs mb-3 ${deadlinePassed ? 'text-red-500' : 'text-gray-400'}`}>
                        {deadlinePassed ? '⛔ Registration closed' : `📅 Deadline: ${new Date(offering.registration_deadline).toLocaleDateString()}`}
                      </p>
                    )}
                    {isEnrolled ? (
                      <Link
                        href={`/student/courses/${offering.id}`}
                        className="block w-full text-center py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition"
                      >
                        ✓ Go to Course
                      </Link>
                    ) : deadlinePassed ? (
                      <button disabled className="w-full py-2 bg-gray-100 text-gray-400 rounded-xl text-sm cursor-not-allowed">
                        Registration Closed
                      </button>
                    ) : (
                      <button
                        onClick={() => setQrModal({ offeringId: offering.id, courseTitle: offering.courses.title })}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition"
                      >
                        <QrCodeIcon className="w-4 h-4" />
                        Enroll Now
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

      {qrModal && (
        <EnrollQRModal
          isOpen={true}
          onClose={() => { setQrModal(null); fetchData(); }}
          offeringId={qrModal.offeringId}
          courseTitle={qrModal.courseTitle}
        />
      )}
    </DashboardLayout>
  );
}
