# TRAINET Project Structure

## Complete Directory Structure

```
trainet/
├── frontend/                          # React + Vite Frontend
│   ├── public/                        # Static assets
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── robots.txt
│   │
│   ├── src/
│   │   ├── assets/                    # Images, fonts, etc.
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── styles/
│   │   │       └── global.css
│   │   │
│   │   ├── components/                # Reusable UI components
│   │   │   ├── common/                # Generic components
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.jsx
│   │   │   │   │   ├── Button.test.jsx
│   │   │   │   │   └── Button.module.css
│   │   │   │   ├── Card/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Spinner/
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── layout/                # Layout components
│   │   │   │   ├── Header/
│   │   │   │   ├── Footer/
│   │   │   │   ├── Sidebar/
│   │   │   │   ├── Navigation/
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── course/                # Course-specific components
│   │   │   │   ├── CourseCard/
│   │   │   │   ├── CourseList/
│   │   │   │   ├── LessonItem/
│   │   │   │   ├── EnrollButton/
│   │   │   │   └── index.js
│   │   │   │
│   │   │   └── auth/                  # Authentication components
│   │   │       ├── LoginForm/
│   │   │       ├── RegisterForm/
│   │   │       ├── ProtectedRoute/
│   │   │       └── index.js
│   │   │
│   │   ├── pages/                     # Page components
│   │   │   ├── Home/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   └── HomePage.test.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   └── DashboardPage.test.jsx
│   │   │   ├── Courses/
│   │   │   │   ├── CoursesPage.jsx
│   │   │   │   ├── CourseDetailPage.jsx
│   │   │   │   └── CreateCoursePage.jsx
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── Profile/
│   │   │   │   └── ProfilePage.jsx
│   │   │   └── NotFound/
│   │   │       └── NotFoundPage.jsx
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useCourses.js
│   │   │   ├── useEnrollment.js
│   │   │   ├── useLocalStorage.js
│   │   │   ├── useDebounce.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/                  # API service layer
│   │   │   ├── api.js                 # Base API configuration
│   │   │   ├── authService.js
│   │   │   ├── courseService.js
│   │   │   ├── userService.js
│   │   │   ├── enrollmentService.js
│   │   │   └── index.js
│   │   │
│   │   ├── context/                   # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── constants/                 # Constants and configurations
│   │   │   ├── userConstants.js
│   │   │   ├── courseConstants.js
│   │   │   ├── enrollmentConstants.js
│   │   │   ├── apiConstants.js
│   │   │   └── index.js
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── validation.js
│   │   │   ├── formatting.js
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── config/                    # Configuration files
│   │   │   ├── supabase.js
│   │   │   ├── routes.js
│   │   │   └── env.js
│   │   │
│   │   ├── App.jsx                    # Root component
│   │   └── main.jsx                   # Application entry point
│   │
│   ├── .env.example                   # Environment variables template
│   ├── .env.local                     # Local environment variables (gitignored)
│   ├── .eslintrc.json                 # ESLint configuration
│   ├── .prettierrc                    # Prettier configuration
│   ├── index.html                     # HTML entry point
│   ├── package.json                   # Frontend dependencies
│   ├── jsconfig.json                  # JavaScript configuration
│   ├── vite.config.js                 # Vite configuration
│   └── README.md                      # Frontend documentation
│
├── backend/                           # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/               # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── courseController.js
│   │   │   ├── enrollmentController.js
│   │   │   ├── lessonController.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/                  # Business logic layer
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── courseService.js
│   │   │   ├── enrollmentService.js
│   │   │   ├── lessonService.js
│   │   │   ├── emailService.js
│   │   │   └── index.js
│   │   │
│   │   ├── models/                    # Data models and schemas
│   │   │   ├── User.js
│   │   │   ├── Course.js
│   │   │   ├── Enrollment.js
│   │   │   ├── Lesson.js
│   │   │   └── index.js
│   │   │
│   │   ├── routes/                    # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── courseRoutes.js
│   │   │   ├── enrollmentRoutes.js
│   │   │   ├── lessonRoutes.js
│   │   │   └── index.js
│   │   │
│   │   ├── middleware/                # Express middleware
│   │   │   ├── authMiddleware.js      # Authentication
│   │   │   ├── errorMiddleware.js     # Error handling
│   │   │   ├── validationMiddleware.js # Request validation
│   │   │   ├── rateLimitMiddleware.js # Rate limiting
│   │   │   ├── loggingMiddleware.js   # Request logging
│   │   │   └── index.js
│   │   │
│   │   ├── config/                    # Configuration
│   │   │   ├── database.js            # Supabase configuration
│   │   │   ├── env.js                 # Environment variables
│   │   │   ├── cors.js                # CORS configuration
│   │   │   └── index.js
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── validation.js
│   │   │   ├── logger.js
│   │   │   ├── errors.js
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── schemas/                   # Validation schemas (Joi/Zod)
│   │   │   ├── userSchema.js
│   │   │   ├── courseSchema.js
│   │   │   ├── enrollmentSchema.js
│   │   │   └── index.js
│   │   │
│   │   ├── app.js                     # Express app configuration
│   │   └── server.js                  # Server entry point
│   │
│   ├── tests/                         # Test files
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── utils/
│   │   ├── integration/
│   │   │   ├── auth.test.js
│   │   │   ├── courses.test.js
│   │   │   └── enrollments.test.js
│   │   └── setup.js                   # Test configuration
│   │
│   ├── .env.example                   # Environment variables template
│   ├── .env                           # Environment variables (gitignored)
│   ├── .eslintrc.json                 # ESLint configuration
│   ├── .prettierrc                    # Prettier configuration
│   ├── jest.config.js                 # Jest configuration
│   ├── nodemon.json                   # Nodemon configuration
│   ├── package.json                   # Backend dependencies
│   └── README.md                      # Backend documentation
│
├── docs/                              # Documentation
│   ├── api/                           # API documentation
│   │   ├── authentication.md
│   │   ├── courses.md
│   │   ├── users.md
│   │   └── enrollments.md
│   ├── architecture/                  # Architecture docs
│   │   ├── system-design.md
│   │   ├── database-schema.md
│   │   └── deployment.md
│   ├── development/                   # Development guides
│   │   ├── setup.md
│   │   ├── coding-standards.md
│   │   └── testing.md
│   └── user-guide/                    # User documentation
│       ├── getting-started.md
│       └── features.md
│
├── .gitignore                         # Git ignore rules
├── .prettierrc                        # Root Prettier config
├── package.json                       # Root package.json (monorepo)
└── README.md                          # Project overview
```

## Key Directory Explanations

### Frontend Structure

**components/**: Organized by type and domain
- `common/`: Generic, reusable UI components
- `layout/`: Page layout components
- `course/`: Domain-specific course components
- `auth/`: Authentication-related components

**pages/**: One directory per major route/page

**hooks/**: Custom React hooks for shared logic

**services/**: API communication layer, abstracts backend calls

**context/**: React Context for global state management

**constants/**: Constants and configuration objects (replaces TypeScript types)

**utils/**: Pure utility functions

### Backend Structure

**controllers/**: Handle HTTP requests, thin layer

**services/**: Business logic, thick layer

**models/**: Data models and schemas (using JSDoc for documentation)

**routes/**: API endpoint definitions

**middleware/**: Request processing pipeline

**config/**: Application configuration

**schemas/**: Request/response validation schemas (using Joi or Zod)

**utils/**: Helper functions and utilities

### Best Practices Implemented

1. **Separation of Concerns**: Clear boundaries between layers
2. **Modularity**: Each module has single responsibility
3. **Testability**: Structure supports easy unit and integration testing
4. **Scalability**: Easy to add new features without restructuring
5. **Code Quality**: JSDoc comments for documentation and IDE support
6. **Documentation**: Comprehensive docs for all aspects
7. **Environment Management**: Separate configs for different environments
8. **Linting**: ESLint configuration for code quality and consistency

### JavaScript-Specific Considerations

1. **JSDoc Comments**: Use JSDoc for type hints and documentation
2. **PropTypes**: Use PropTypes for React component prop validation
3. **jsconfig.json**: Configure path aliases and module resolution
4. **Validation Libraries**: Use Joi or Zod for runtime validation
5. **Constants Files**: Replace TypeScript types with constant objects and enums
