'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'trainer' | 'alumni' | 'recruiter';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <span className="text-white text-3xl font-bold">T</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TRAINET</h1>
          <p className="text-white/80">Create your account and start learning today.</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.firstName ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-300">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.lastName ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-300">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email */}
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

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white/90 mb-2">
                I am a
              </label>
              <select
                id="role"
                {...register('role', {
                  required: 'Please select your role',
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.role ? 'border-red-400' : 'border-white/20'
                }`}
              >
                <option value="" className="bg-gray-800 text-white">Select your role</option>
                <option value="student" className="bg-gray-800 text-white">Student</option>
                <option value="trainer" className="bg-gray-800 text-white">Trainer</option>
                <option value="alumni" className="bg-gray-800 text-white">Alumni</option>
                <option value="recruiter" className="bg-gray-800 text-white">Recruiter</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-300">{errors.role.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number',
                  },
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.password ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-white/60">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition ${
                  errors.confirmPassword ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-300">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                {...register('terms' as any, {
                  required: 'You must accept the terms and conditions',
                })}
                className="h-4 w-4 mt-1 text-purple-500 focus:ring-purple-400 border-white/20 rounded bg-white/10"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-white/80">
                I agree to the{' '}
                <Link href="/terms" className="text-purple-300 hover:text-purple-200 transition-colors">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-purple-300 hover:text-purple-200 transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-300">{(errors.terms as any).message}</p>
            )}

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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6">
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-medium text-white hover:bg-white/20 transition-all duration-200"
            >
              Login to your account
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
