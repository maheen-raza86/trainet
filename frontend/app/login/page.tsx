'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

interface LoginFormData {
  email: string;
  password: string;
}

/* ── Shared left-panel branding ── */
function LeftPanel({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#1a0836 0%,#0a1628 60%,#07071a 100%)' }}>
      {/* grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.06) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      {/* glow blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 70%)', filter: 'blur(40px)' }} />

      {/* Logo */}
      <div className="relative z-10">
        <BrandLogo size="md" />
      </div>

      {/* Heading */}
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">{heading}</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs">{sub}</p>
      </div>

      {/* Bottom feature pills */}
      <div className="relative z-10 flex flex-wrap gap-2">
        {['AI Auto-Grading', 'QR Certificates', 'Alumni Mentorship', 'Talent Pool'].map(f => (
          <span key={f} className="px-3 py-1 text-xs rounded-full font-medium"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgba(196,181,253,0.85)' }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );
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

  // Already logged in screen
  if (isAuthenticated && !shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: 'linear-gradient(135deg,#1a0836 0%,#0a1628 60%,#07071a 100%)' }}>
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6"><BrandLogo size="md" /></div>
          <h2 className="text-2xl font-bold text-white mb-4">Already Logged In</h2>
          <p className="text-white/80 mb-6">You are already logged in as {user?.firstName} {user?.lastName}.</p>
          <div className="space-y-3">
            <button onClick={() => router.push(`/${user?.role?.toLowerCase()}/dashboard`)}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-medium">
              Go to Dashboard
            </button>
            <button onClick={() => { logout(); window.location.reload(); }}
              className="w-full py-3 px-4 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-medium">
              Login as Different User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#07071a' }}>
      {/* Split card */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: '1px solid rgba(139,92,246,0.20)' }}>

        {/* LEFT — branding */}
        <LeftPanel
          heading="Welcome Back"
          sub="Continue your learning journey. Your courses, certificates, and progress are waiting."
        />

        {/* RIGHT — form */}
        <div className="bg-white p-8 md:p-10 flex flex-col justify-center">
          {/* Mobile logo (shown only on small screens) */}
          <div className="flex justify-center mb-6 md:hidden">
            <BrandLogo size="md" textClassName="text-gray-900" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Login</h2>
          <p className="text-gray-500 text-sm mb-6">Enter your credentials to access your dashboard.</p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.password ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember" type="checkbox"
                  className="h-4 w-4 text-purple-500 focus:ring-purple-400 border-gray-300 rounded" />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">Remember me</label>
              </div>
              <Link href="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5'
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

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-purple-600 hover:text-purple-500 transition-colors">
              Sign up
            </Link>
          </p>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
