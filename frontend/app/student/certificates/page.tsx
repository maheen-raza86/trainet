'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';

interface Certificate {
  id: number;
  courseName: string;
  issueDate: string;
  certificateId: string;
  trainer: string;
}

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Connect to certificates API when available
    // For now, using placeholder data
    // Expected endpoint: GET /api/certificates/my
    
    // Simulate API call
    setTimeout(() => {
      setCertificates([
        {
          id: 1,
          courseName: 'Web Development Fundamentals',
          issueDate: '2026-02-15',
          certificateId: 'CERT-WDF-2026-001',
          trainer: 'John Doe',
        },
        {
          id: 2,
          courseName: 'React & Next.js Development',
          issueDate: '2026-03-01',
          certificateId: 'CERT-RND-2026-002',
          trainer: 'David Brown',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading certificates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600 mt-1">Your earned certificates and achievements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                🎓
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                📚
              </div>
              <div>
                <p className="text-sm text-gray-600">Courses Completed</p>
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div>
                <p className="text-sm text-gray-600">Latest Achievement</p>
                <p className="text-sm font-medium text-gray-900">March 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                {/* Certificate Header */}
                <div className="h-40 bg-gradient-to-br from-primary-400 via-secondary-500 to-accent-500 flex items-center justify-center relative">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-2">🎓</div>
                    <p className="text-sm font-medium">Certificate of Completion</p>
                  </div>
                  {/* QR Code Placeholder */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📱</span>
                  </div>
                </div>

                {/* Certificate Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{certificate.courseName}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>📅 Issue Date: {formatDate(certificate.issueDate)}</p>
                    <p>🆔 Certificate ID: {certificate.certificateId}</p>
                    <p>👨‍🏫 Trainer: {certificate.trainer}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
                      Download
                    </button>
                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-gray-600 mb-6">Complete courses to earn certificates</p>
            <button className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
