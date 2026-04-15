'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '@/lib/api/client';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface EnrollQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  offeringId: string;
  courseTitle: string;
}

export default function EnrollQRModal({ isOpen, onClose, offeringId, courseTitle }: EnrollQRModalProps) {
  const [enrollUrl, setEnrollUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && offeringId) fetchToken();
  }, [isOpen, offeringId]);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError('');
      const res: any = await apiClient.get(`/qr-enrollment/enroll-token/${offeringId}`);
      setEnrollUrl(res.data?.enrollUrl || null);
      setExpiresAt(res.data?.expires_at || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load enrollment QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!enrollUrl) return;
    try {
      await navigator.clipboard.writeText(enrollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Enroll in Course</h2>
            <p className="text-sm text-gray-500 mt-0.5">{courseTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading enrollment QR...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button onClick={fetchToken} className="text-xs text-red-600 underline">Try again</button>
            </div>
          )}

          {enrollUrl && !loading && (
            <div className="space-y-5">
              {/* Instruction */}
              <p className="text-center text-sm text-gray-600">
                Scan the QR code with your phone <span className="text-gray-400">or</span> use the link below to enroll
              </p>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm">
                  <QRCodeSVG
                    value={enrollUrl}
                    size={180}
                    level="H"
                    fgColor="#1e1b4b"
                    includeMargin={true}
                  />
                </div>
              </div>

              {expiresAt && (
                <p className="text-center text-xs text-gray-400">
                  Expires {new Date(expiresAt).toLocaleDateString()}
                </p>
              )}

              {/* Copy link */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                {copied ? (
                  <><CheckIcon className="w-4 h-4 text-green-600" /><span className="text-green-600">Link copied!</span></>
                ) : (
                  <><ClipboardDocumentIcon className="w-4 h-4" /><span>Copy Enrollment Link</span></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
