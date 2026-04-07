'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError('');
      setIsLoading(true);
      
      await apiClient.post('/auth/forgot-password', data);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <span className="text-white text-3xl font-bold">T</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">TRAINET</h1>
          </div>

          {/* Success Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
            <p className="text-white/80 mb-6">
              If an account with that email exists, we've sent you a password reset link. 
              Please check your email and follow the instructions to reset your password.
            </p>
            <p className="text-sm text-white/60 mb-6">
              The reset link will expire in 15 minutes for security reasons.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-white text-3xl font-bold">T</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TRAINET</h1>
          <p className="text-white/80">Reset your password</p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
          <p className="text-white/80 mb-6 text-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.email ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-500/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-lg hover:transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending Reset Link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}