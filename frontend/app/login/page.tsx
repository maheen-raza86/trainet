'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated, logout } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // After successful login: go to dashboard
  useEffect(() => {
    if (shouldRedirect && user && user.role) {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [shouldRedirect, user, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      setIsLoading(true);
      await login(data);
      setShouldRedirect(true);
    } catch (err: any) {
      console.error('[Login] Login failed:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show "already logged in" screen only when authenticated and no pending redirect is being processed
  if (isAuthenticated && !shouldRedirect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-bold">T</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Already Logged In</h2>
            <p className="text-white/80 mb-6">You are already logged in as {user?.firstName} {user?.lastName}.</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/${user?.role?.toLowerCase()}/dashboard`)}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg font-medium"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => { logout(); window.location.reload(); }}
                className="w-full py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Login as Different User
              </button>
            </div>
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
          <p className="text-white/80">Welcome back! Please login to your account.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.password ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember" type="checkbox"
                  className="h-4 w-4 text-purple-500 focus:ring-purple-400 border-white/20 rounded bg-white/10" />
                <label htmlFor="remember" className="ml-2 block text-sm text-white/80">Remember me</label>
              </div>
              <Link href="/forgot-password" className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors">
                Forgot password?
              </Link>
            </div>

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
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">Don't have an account?</span>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/signup"
              className="w-full flex justify-center py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-medium text-white hover:bg-white/20 transition-all duration-200">
              Create an account
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
