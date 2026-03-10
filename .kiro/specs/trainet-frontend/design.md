# TRAINET Frontend - Design Document

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TRAINET Frontend                         │
│                    (Next.js App Router)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Public     │  │     Auth     │  │   Protected  │     │
│  │    Pages     │  │    Pages     │  │    Pages     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Role-Based Dashboards                    │  │
│  │  Student │ Trainer │ Alumni │ Recruiter │ Admin      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Shared Components Library                   │  │
│  │  Buttons │ Cards │ Forms │ Modals │ Tables           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              State Management                         │  │
│  │  Auth Context │ User Context │ Theme Context         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Client Layer                         │  │
│  │  Axios │ Interceptors │ Error Handling               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend REST API                           │
│              (Already Implemented)                           │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Technologies
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** TailwindCSS 3
- **HTTP Client:** Axios
- **Authentication:** Supabase Client + JWT
- **Form Handling:** React Hook Form
- **Validation:** Zod
- **Charts:** Recharts
- **Icons:** React Icons
- **Date Handling:** date-fns

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** TypeScript (optional)

## Project Structure

```
trainet-frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/
│   │   ├── signup/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── student/
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   ├── assignments/
│   │   │   ├── certificates/
│   │   │   └── profile/
│   │   ├── trainer/
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   ├── assignments/
│   │   │   ├── submissions/
│   │   │   └── profile/
│   │   ├── alumni/
│   │   │   ├── dashboard/
│   │   │   ├── mentorship/
│   │   │   └── profile/
│   │   ├── recruiter/
│   │   │   ├── dashboard/
│   │   │   ├── talent-pool/
│   │   │   ├── candidates/
│   │   │   └── messages/
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── users/
│   │       ├── courses/
│   │       ├── analytics/
│   │       └── logs/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── DashboardLayout.tsx
│   ├── forms/                    # Form components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── CourseForm.tsx
│   │   └── ...
│   ├── cards/                    # Card components
│   │   ├── CourseCard.tsx
│   │   ├── AssignmentCard.tsx
│   │   ├── CertificateCard.tsx
│   │   └── ...
│   └── widgets/                  # Dashboard widgets
│       ├── StatsCard.tsx
│       ├── ActivityFeed.tsx
│       ├── ProgressChart.tsx
│       └── ...
├── lib/                          # Utility libraries
│   ├── api/                      # API client
│   │   ├── client.ts             # Axios instance
│   │   ├── auth.ts               # Auth endpoints
│   │   ├── courses.ts            # Course endpoints
│   │   ├── assignments.ts        # Assignment endpoints
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCourses.ts
│   │   ├── useAssignments.ts
│   │   └── ...
│   ├── utils/                    # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   └── constants/                # Constants
│       ├── routes.ts
│       ├── roles.ts
│       └── config.ts
├── contexts/                     # React contexts
│   ├── AuthContext.tsx
│   ├── UserContext.tsx
│   └── ThemeContext.tsx
├── types/                        # TypeScript types
│   ├── user.ts
│   ├── course.ts
│   ├── assignment.ts
│   └── ...
├── public/                       # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Component Architecture

### Component Hierarchy

```
App
├── RootLayout
│   ├── Providers (Auth, Theme, etc.)
│   └── Children
│       ├── PublicPages
│       │   ├── LandingPage
│       │   └── AuthPages
│       └── ProtectedPages
│           └── DashboardLayout
│               ├── Navbar
│               ├── Sidebar (Role-based)
│               └── MainContent
│                   └── RoleSpecificPages
```

### Component Design Patterns

#### 1. Atomic Design
- **Atoms:** Button, Input, Label, Icon
- **Molecules:** FormField, SearchBar, Card
- **Organisms:** Navbar, Sidebar, CourseList
- **Templates:** DashboardLayout, AuthLayout
- **Pages:** StudentDashboard, CourseDetails

#### 2. Container/Presentational Pattern
- **Container:** Handles logic, state, API calls
- **Presentational:** Receives props, renders UI

#### 3. Compound Components
- Used for complex components like Modal, Dropdown, Tabs

## State Management

### Context API Structure

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<void>;
}
```

#### UserContext
```typescript
interface UserContextType {
  profile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### ThemeContext
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

### Local State Management
- Component-level state with useState
- Form state with React Hook Form
- Server state with custom hooks (useQuery pattern)

## Routing Strategy

### Route Structure

```
/                           → Landing Page (Public)
/login                      → Login Page (Public)
/signup                     → Signup Page (Public)
/verify-email               → Email Verification (Public)
/forgot-password            → Forgot Password (Public)
/reset-password             → Reset Password (Public)

/student/dashboard          → Student Dashboard (Protected)
/student/courses            → Course List (Protected)
/student/courses/[id]       → Course Details (Protected)
/student/assignments        → Assignments (Protected)
/student/assignments/[id]   → Assignment Details (Protected)
/student/certificates       → Certificates (Protected)
/student/profile            → Profile (Protected)

/trainer/dashboard          → Trainer Dashboard (Protected)
/trainer/courses            → Manage Courses (Protected)
/trainer/courses/new        → Create Course (Protected)
/trainer/courses/[id]/edit  → Edit Course (Protected)
/trainer/assignments        → Manage Assignments (Protected)
/trainer/submissions        → Review Submissions (Protected)
/trainer/profile            → Profile (Protected)

/alumni/dashboard           → Alumni Dashboard (Protected)
/alumni/mentorship          → Mentorship (Protected)
/alumni/profile             → Profile (Protected)

/recruiter/dashboard        → Recruiter Dashboard (Protected)
/recruiter/talent-pool      → Talent Pool (Protected)
/recruiter/candidates/[id]  → Candidate Profile (Protected)
/recruiter/messages         → Messages (Protected)

/admin/dashboard            → Admin Dashboard (Protected)
/admin/users                → User Management (Protected)
/admin/courses              → Course Monitoring (Protected)
/admin/analytics            → Analytics (Protected)
/admin/logs                 → System Logs (Protected)
```

### Route Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (token) {
      // Redirect authenticated users to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (pathname.startsWith('/student') || 
      pathname.startsWith('/trainer') ||
      pathname.startsWith('/alumni') ||
      pathname.startsWith('/recruiter') ||
      pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}
```

## API Integration

### API Client Setup

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Service Layer

```typescript
// lib/api/auth.ts
import apiClient from './client';

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  signup: (data: SignupData) =>
    apiClient.post('/auth/signup', data),
  
  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),
  
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
};

// lib/api/courses.ts
export const coursesAPI = {
  getAll: () => apiClient.get('/courses'),
  getById: (id: string) => apiClient.get(`/courses/${id}`),
  create: (data: CourseData) => apiClient.post('/courses', data),
  update: (id: string, data: CourseData) => apiClient.put(`/courses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/courses/${id}`),
};

// Similar for assignments, submissions, etc.
```

### Custom Hooks for Data Fetching

```typescript
// lib/hooks/useCourses.ts
import { useState, useEffect } from 'react';
import { coursesAPI } from '@/lib/api/courses';

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const data = await coursesAPI.getAll();
        setCourses(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return { courses, loading, error };
}
```

## UI Component Library

### Base Components

#### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### Card Component
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```

#### Input Component
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number';
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}
```

#### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### Layout Components

#### DashboardLayout
```typescript
interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
}

// Features:
// - Role-based sidebar navigation
// - Top navbar with user menu
// - Responsive design
// - Breadcrumbs
```

#### Navbar
```typescript
interface NavbarProps {
  user: User;
  onLogout: () => void;
}

// Features:
// - Logo
// - Search bar
// - Notifications
// - User dropdown
```

#### Sidebar
```typescript
interface SidebarProps {
  role: UserRole;
  currentPath: string;
}

// Features:
// - Role-based navigation items
// - Active state highlighting
// - Collapsible on mobile
// - Icons for each item
```

## Form Handling

### Form Validation with Zod

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'trainer', 'alumni', 'recruiter']),
});
```

### Form Component with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await authAPI.login(data.email, data.password);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('email')}
        label="Email"
        error={errors.email?.message}
      />
      <Input
        {...register('password')}
        type="password"
        label="Password"
        error={errors.password?.message}
      />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

## Styling Strategy

### TailwindCSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#A8DADC', // Pastel Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          500: '#457B9D', // Teal
        },
        accent: {
          500: '#F1FAEE', // Coral
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

### Component Styling Approach

1. **Utility-First:** Use Tailwind utilities for most styling
2. **Component Classes:** Create reusable component classes
3. **CSS Modules:** For complex component-specific styles
4. **Global Styles:** Minimal global CSS for base styles

## Error Handling

### Error Boundary Component

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
function handleAPIError(error: any) {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || 'An error occurred';
    toast.error(message);
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.');
  } else {
    // Something else happened
    toast.error('An unexpected error occurred');
  }
}
```

## Loading States

### Loading Component

```typescript
function LoadingSpinner({ size = 'md' }) {
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-t-2 border-primary-500 ${sizeClasses[size]}`} />
    </div>
  );
}

function LoadingSkeleton({ type = 'card' }) {
  // Render skeleton based on type
}
```

### Loading States in Components

```typescript
function CourseList() {
  const { courses, loading, error } = useCourses();

  if (loading) return <LoadingSkeleton type="card-grid" />;
  if (error) return <ErrorMessage error={error} />;
  if (!courses.length) return <EmptyState message="No courses found" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

## Performance Optimization

### Code Splitting
- Route-based code splitting (automatic with Next.js)
- Component-level lazy loading for heavy components
- Dynamic imports for modals and dialogs

### Image Optimization
- Use Next.js Image component
- Lazy load images below the fold
- Optimize image sizes and formats

### Caching Strategy
- Cache API responses with SWR or React Query
- Implement optimistic updates
- Use localStorage for non-sensitive data

### Bundle Optimization
- Tree shaking
- Remove unused dependencies
- Analyze bundle size with webpack-bundle-analyzer

## Security Considerations

### Authentication Security
- Store tokens in httpOnly cookies (if possible)
- Implement token refresh mechanism
- Clear tokens on logout
- Validate tokens on protected routes

### Input Validation
- Client-side validation with Zod
- Sanitize user input
- Prevent XSS attacks

### API Security
- Use HTTPS in production
- Implement CSRF protection
- Rate limiting on client side
- Secure headers

## Testing Strategy

### Unit Testing
- Test utility functions
- Test custom hooks
- Test component logic

### Integration Testing
- Test API integration
- Test form submissions
- Test navigation flows

### E2E Testing
- Test critical user journeys
- Test authentication flow
- Test role-based access

## Deployment

### Build Process
```bash
npm run build
```

### Environment Variables
```
NEXT_PUBLIC_API_URL=https://api.trainet.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Deployment Platform
- **Recommended:** Vercel (optimized for Next.js)
- **Alternative:** Netlify, AWS Amplify

### CI/CD Pipeline
1. Run linting
2. Run tests
3. Build application
4. Deploy to staging
5. Run E2E tests
6. Deploy to production

## Monitoring and Analytics

### Error Monitoring
- Sentry for error tracking
- Log errors to console in development
- Send errors to monitoring service in production

### Performance Monitoring
- Web Vitals tracking
- Page load time monitoring
- API response time tracking

### User Analytics
- Google Analytics or similar
- Track user journeys
- Monitor feature usage

---

**Version:** 1.0.0
**Date:** March 8, 2026
**Status:** Design Approved
