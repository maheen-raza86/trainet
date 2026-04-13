'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '@/lib/api/client';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface QRToken {
  id: string;
  token: string;
  enrollUrl: string;
  expires_at: string;
  is_single_use: boolean;
  used_at: string | null;
  created_at: string;
}

interface QREnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  offeringId: string;
  courseTitle: string;
}

export default function QREnrollmentModal({
  isOpen,
  onClose,
  offeringId,
  courseTitle,
}: QREnrollmentModalProps) {
  const [tokens, setTokens] = useState<QRToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchTokens();
    }
  }, [isOpen, offeringId]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      setError('');
      const res: any = await apiClient.get(`/qr-enrollment/offering/${offeringId}`);
      setTokens(res.data?.tokens || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      await apiClient.post('/qr-enrollment/generate', {
        offeringId,
        expiryDays: 30,
        isSingleUse: false,
      });
      await fetchTokens();
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this QR code? It will no longer work for enrollment.')) {
      return;
    }

    try {
      await apiClient.delete(`/qr-enrollment/${tokenId}`);
      await fetchTokens();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke QR code');
    }
  };

  const handleCopy = async (url: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(tokenId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">QR Code Enrollment</h2>
              <p className="text-sm text-gray-600 mt-1">{courseTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="mb-6">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {generating ? 'Generating...' : 'Generate New QR Code'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              QR codes expire after 30 days and can be used multiple times
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading QR codes...</p>
            </div>
          )}

          {/* QR Codes List */}
          {!loading && tokens.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-lg mb-3 flex justify-center">
                    <QRCodeSVG
                      value={token.enrollUrl}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  {/* Token Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(token.expires_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-700">
                        {formatDate(token.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleCopy(token.enrollUrl, token.id)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      {copiedId === token.id ? (
                        <>
                          <CheckIcon className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-4 h-4" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRevoke(token.id)}
                      className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition"
                      title="Revoke QR Code"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && tokens.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No QR Codes Yet
              </h3>
              <p className="text-sm text-gray-600">
                Generate a QR code to allow students to enroll by scanning
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <span className="text-blue-500">ℹ️</span>
            <div>
              <p className="font-medium text-gray-900 mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Students scan the QR code with their phone camera</li>
                <li>They'll be redirected to the enrollment page</li>
                <li>After logging in, they'll be automatically enrolled</li>
                <li>Each QR code can be used multiple times until it expires</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
