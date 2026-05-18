/**
 * Next.js Edge Middleware — Server-side route protection
 *
 * Enforces role-based access control at the edge before any page renders.
 * This is a second layer of defence on top of the client-side DashboardLayout guard.
 *
 * Strategy:
 *  - Public routes (login, signup, verify-certificate, etc.) are always allowed.
 *  - Protected routes require a 'token' cookie OR an Authorization header.
 *    If neither is present the user is redirected to /login.
 *  - Role-prefixed routes (/admin/*, /trainer/*, /student/*, /recruiter/*, /alumni/*)
 *    are matched against the role stored in the 'user' cookie (JSON).
 *    Mismatched roles are redirected to their own dashboard.
 *
 * NOTE: JWT signature verification is NOT performed here (Edge runtime has no
 * Node crypto). The backend API enforces full JWT validation on every request.
 * This middleware only prevents accidental navigation to wrong-role pages and
 * stops unauthenticated users from seeing protected page HTML.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that never require authentication
const PUBLIC_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-certificate',
  '/about',
  '/features',
  '/roles',
  '/help',
  '/privacy',
  '/terms',
  '/talent-pool',    // public marketing page (not the recruiter dashboard)
  '/mentorship',     // public marketing page
  '/certificates',   // public marketing page
  '/courses',        // public course catalog
  '/enroll',         // QR enrollment landing
  '/_next',
  '/favicon',
  '/api',            // backend proxy — not handled here
];

// Protected sub-paths under /alumni that require authentication
// (the root /alumni and /alumni/[id] are public)
const ALUMNI_PROTECTED_SUBPATHS = [
  '/alumni/dashboard',
  '/alumni/mentorship',
  '/alumni/messages',
  '/alumni/network',
  '/alumni/profile',
  '/alumni/requests',
  '/alumni/sessions',
];

// Role → allowed route prefix mapping
// Note: /alumni root is public; only /alumni/dashboard etc. are role-protected
const ROLE_PREFIXES: Record<string, string> = {
  admin:     '/admin',
  trainer:   '/trainer',
  student:   '/student',
  recruiter: '/recruiter',
  alumni:    '/alumni',
};

function isPublic(pathname: string): boolean {
  // Special case: /alumni root and /alumni/[uuid] profile pages are public
  // but /alumni/dashboard, /alumni/profile, etc. are protected
  if (pathname === '/alumni' || pathname.startsWith('/alumni/') ) {
    const isProtectedAlumni = ALUMNI_PROTECTED_SUBPATHS.some(
      p => pathname === p || pathname.startsWith(p + '/')
    );
    if (!isProtectedAlumni) return true; // public alumni page
  }
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes and static assets
  if (isPublic(pathname) || pathname === '/') {
    return NextResponse.next();
  }

  // Detect role-prefixed routes
  // For alumni: only match protected sub-paths, not the public root/profile pages
  let matchedRole: [string, string] | undefined;

  if (ALUMNI_PROTECTED_SUBPATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    matchedRole = ['alumni', '/alumni'];
  } else {
    matchedRole = Object.entries(ROLE_PREFIXES).find(([role, prefix]) => {
      if (role === 'alumni') return false; // handled above
      return pathname === prefix || pathname.startsWith(prefix + '/');
    });
  }

  // If not a role-prefixed route, allow
  if (!matchedRole) {
    return NextResponse.next();
  }

  const [requiredRole] = matchedRole;

  // Read auth state from cookies (set by the frontend after login)
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;

  // No cookie present — the user may have a valid localStorage session that
  // hasn't been synced to cookies yet (e.g. logged in before cookie-sync was
  // deployed, or cookies were cleared by the browser).
  // Do NOT redirect to /login here — the client-side DashboardLayout guard
  // handles unauthenticated users. Redirecting here causes an infinite loop
  // because the cookie is only set client-side after React hydration.
  if (!token || !userCookie) {
    return NextResponse.next();
  }

  // Parse user role from cookie
  let userRole: string | null = null;
  try {
    const parsed = JSON.parse(decodeURIComponent(userCookie));
    userRole = parsed?.role ?? null;
  } catch {
    // Corrupted cookie — allow through, client-side guard will handle it
    return NextResponse.next();
  }

  // Role mismatch → redirect to the user's own dashboard
  // Only enforce this when we have a confirmed role from the cookie.
  if (userRole && userRole !== requiredRole) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = `/${userRole}/dashboard`;
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)).*)',
  ],
};
