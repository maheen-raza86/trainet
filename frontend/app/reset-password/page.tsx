'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [tokenChecked, setTokenChecked] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>();
  const password = watch('password');

  // Supabase puts the token in the URL hash: #access_token=...&type=recovery
  useEffect(() => {
    const hash = window.location.hash.substring(1); // strip leading #
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const type = params.get('type');

    if (!token || type !== 'recovery') {
      setError('Invalid or missing reset link. Please request a new password reset.');
    } else {
      setAccessToken(token);
    }
    setTokenChecked(true);
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError('');
      setIsLoading(true);

      await apiClient.post('/auth/reset-password', {
        accessToken,
        password: data.password,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <span className="text-white text-3xl font-bold">T</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">TRAINET</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Password Reset Successful</h2>
            <p className="text-white/80 mb-6">
              Your password has been updated. You can now login with your new password.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenChecked && !accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <span className="text-white text-3xl font-bold">T</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">TRAINET</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
            <p className="text-white/80 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg font-medium"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/login"
                className="block px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading token check
  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Verifying reset link...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-white text-3xl font-bold">T</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TRAINET</h1>
          <p className="text-white/80">Create your new password</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-white/80 mb-6 text-sm">
            Enter your new password below.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Must contain uppercase, lowercase, and a number',
                  },
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${errors.password ? 'border-red-400' : 'border-white/20'}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${errors.confirmPassword ? 'border-red-400' : 'border-white/20'}`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-300">{errors.confirmPassword.message}</p>}
            </div>

            {/* Live requirements */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-xs text-white/60 space-y-1">
              <p className={password && password.length >= 8 ? 'text-green-400' : ''}>• At least 8 characters</p>
              <p className={password && /[A-Z]/.test(password) ? 'text-green-400' : ''}>• One uppercase letter</p>
              <p className={password && /[a-z]/.test(password) ? 'text-green-400' : ''}>• One lowercase letter</p>
              <p className={password && /\d/.test(password) ? 'text-green-400' : ''}>• One number</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 ${isLoading ? 'bg-gray-500/50 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-lg hover:transform hover:-translate-y-0.5'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting Password...
                </span>
              ) : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
