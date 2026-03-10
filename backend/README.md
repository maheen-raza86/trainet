# TRAINET Backend API

Graduate-level training platform backend built with Node.js and Express.

## Features

- ✅ Express.js server with ES6 modules
- ✅ Environment configuration with dotenv
- ✅ CORS configuration
- ✅ Security headers with Helmet
- ✅ HTTP request logging with Morgan
- ✅ Winston logger for application logs
- ✅ Rate limiting
- ✅ Centralized error handling
- ✅ Health check endpoint
- ✅ Graceful shutdown

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix code
- `npm run format` - Format code with Prettier

## API Endpoints

### Health Check
```
GET /api/health
```

Returns server health status.

**Response:**
```json
{
  "success": true,
  "message": "TRAINET API is running",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development",
    "version": "1.0.0"
  }
}
```

### API Info
```
GET /api
```

Returns API information and available endpoints.

### Authentication

#### Sign Up
```
POST /api/auth/signup
```

Register a new user.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

#### Login
```
POST /api/auth/login
```

Authenticate a user.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    }
  }
}
```

### User Management

#### Get Current User (Protected)
```
GET /api/users/me
```

Get the authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "No token provided. Authorization header must be: Bearer <token>",
  "error": "Unauthorized"
}
```

### Course Management

#### Get All Courses (Public)
```
GET /api/courses
```

Get list of all available courses.

**Response:**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "courses": [...],
    "count": 5
  }
}
```

#### Get Course by ID (Public)
```
GET /api/courses/:id
```

Get detailed information about a specific course.

#### Enroll in Course (Protected)
```
POST /api/courses/enroll
```

Enroll the authenticated user in a course.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "courseId": "course-uuid"
}
```

#### Get My Enrolled Courses (Protected)
```
GET /api/courses/my-courses
```

Get all courses the authenticated user is enrolled in.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Assignment Management

#### Create Assignment (Trainer Only)
```
POST /api/courses/:courseId/assignments
```

Create a new assignment for a course.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Assignment 1",
  "description": "Complete exercises",
  "dueDate": "2024-12-31T23:59:59Z",
  "maxScore": 100
}
```

#### Submit Assignment (Student Only)
```
POST /api/courses/assignments/:assignmentId/submit
```

Submit an assignment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "My submission",
  "attachmentUrl": "https://example.com/file.pdf"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.js       # Environment variables
│   │   ├── cors.js      # CORS configuration
│   │   ├── supabaseClient.js  # Supabase client
│   │   └── index.js     # Config exports
│   ├── controllers/     # Request handlers
│   │   ├── authController.js
│   │   └── userController.js
│   ├── services/        # Business logic
│   │   └── authService.js
│   ├── middleware/      # Express middleware
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── roleMiddleware.js    # Role authorization
│   │   ├── errorMiddleware.js
│   │   ├── loggingMiddleware.js
│   │   ├── rateLimitMiddleware.js
│   │   └── index.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── index.js
│   ├── utils/           # Utility functions
│   │   ├── logger.js    # Winston logger
│   │   └── errors.js    # Custom error classes
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── logs/                # Log files (auto-generated)
├── .env.example         # Environment variables template
├── .eslintrc.json       # ESLint configuration
├── .prettierrc          # Prettier configuration
├── nodemon.json         # Nodemon configuration
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## Environment Variables

See `.env.example` for all available environment variables.

Required variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `JWT_SECRET` - Secret for JWT signing

Optional variables:
- `SUPABASE_ANON_KEY` - Supabase anonymous key (for client-side operations)

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000` (or your configured PORT).

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Code Quality

Lint code:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## License

MIT
