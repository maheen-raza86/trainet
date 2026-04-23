'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'trainer' | 'alumni' | 'recruiter';
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

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError('');
      setIsLoading(true);

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...signupData } = data;

      await signup(signupData);

      // Redirect to verification message page
      router.push('/verify-email?message=check');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#07071a' }}>
      {/* Split card */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: '1px solid rgba(139,92,246,0.20)' }}>

        {/* LEFT — branding */}
        <LeftPanel
          heading="Create Your Account"
          sub="Start your learning journey with TRAINET and Explore more."
        />

        {/* RIGHT — form */}
        <div className="bg-white p-8 md:p-10 flex flex-col justify-center">
          {/* Mobile logo (shown only on small screens) */}
          <div className="flex justify-center mb-6 md:hidden">
            <BrandLogo size="md" textClassName="text-gray-900" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Sign Up</h2>
          <p className="text-gray-500 text-sm mb-6">Fill in your details to create a free account.</p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: { value: 2, message: 'First name must be at least 2 characters' },
                  })}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                    errors.firstName ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="First Name"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: { value: 2, message: 'Last name must be at least 2 characters' },
                  })}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                    errors.lastName ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="Last Name"
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
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

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                I am a
              </label>
              <select
                id="role"
                {...register('role', { required: 'Please select your role' })}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.role ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="trainer">Trainer</option>
                <option value="alumni">Alumni</option>
                <option value="recruiter">Recruiter</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>}
            </div>

            {/* Password */}
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
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number',
                  },
                })}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.password ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
              <p className="mt-1 text-xs text-gray-400">
                Min 8 chars with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                {...register('terms' as any, { required: 'You must accept the terms and conditions' })}
                className="h-4 w-4 mt-0.5 text-purple-500 focus:ring-purple-400 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-purple-600 hover:text-purple-500 transition-colors">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-500 transition-colors">Privacy Policy</Link>
              </label>
            </div>
            {(errors as any).terms && <p className="text-sm text-red-500">{(errors as any).terms.message}</p>}

            {/* Submit */}
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
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-500 transition-colors">
              Login
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
