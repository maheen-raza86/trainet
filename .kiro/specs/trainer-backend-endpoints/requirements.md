# Requirements Document

## Introduction

This document specifies the requirements for implementing missing trainer backend endpoints in the TRAINET Learning Management System. The frontend trainer dashboard is already implemented with modals for creating courses, grading submissions, and editing assignments. However, the backend lacks the corresponding API endpoints to support these features. This specification defines the three critical endpoints needed to complete the trainer functionality: course creation, submission grading, and assignment editing.

## Glossary

- **API_Server**: The Node.js/Express backend application that handles HTTP requests
- **Trainer**: A user with the "trainer" role who creates courses and assignments
- **Student**: A user with the "student" role who enrolls in courses and submits assignments
- **Course**: A learning unit containing assignments and enrolled students
- **Assignment**: A task created by a trainer for students to complete
- **Submission**: A student's completed work for an assignment
- **JWT_Token**: JSON Web Token used for authentication
- **Supabase**: The PostgreSQL database service used for data persistence
- **Authorization_Middleware**: Middleware that verifies user roles and permissions

## Requirements

### Requirement 1: Create Course Endpoint

**User Story:** As a trainer, I want to create new courses through the API, so that I can organize learning content for students.

#### Acceptance Criteria

1. WHEN a POST request is sent to /api/courses with valid authentication, THE API_Server SHALL accept the request
2. WHEN the request includes title and description fields, THE API_Server SHALL validate both fields are present
3. IF the title is less than 3 characters, THEN THE API_Server SHALL return a 400 status code with validation error message
4. IF the title exceeds 100 characters, THEN THE API_Server SHALL return a 400 status code with validation error message
5. IF the description is less than 10 characters, THEN THE API_Server SHALL return a 400 status code with validation error message
6. IF the description exceeds 500 characters, THEN THE API_Server SHALL return a 400 status code with validation error message
7. WHEN the authenticated user has the trainer role, THE API_Server SHALL create a course record in Supabase
8. WHEN the course is created successfully, THE API_Server SHALL return a 201 status code with the course data including id, title, description, and created_at
9. WHEN the course is created successfully, THE API_Server SHALL return a response in the format: { success: true, message: string, data: object }
10. IF the authenticated user does not have the trainer role, THEN THE API_Server SHALL return a 403 status code with forbidden error message
11. IF no authentication token is provided, THEN THE API_Server SHALL return a 401 status code with authentication error message

### Requirement 2: Grade Submission Endpoint

**User Story:** As a trainer, I want to grade student submissions through the API, so that I can provide feedback and scores to students.

#### Acceptance Criteria

1. WHEN a PUT request is sent to /api/submissions/:id/grade with valid authentication, THE API_Server SHALL accept the request
2. WHEN the request includes grade and feedback fields, THE API_Server SHALL validate both fields are present
3. IF the grade is less than 0, THEN THE API_Server SHALL return a 400 status code with validation error message
4. IF the grade exceeds 100, THEN THE API_Server SHALL return a 400 status code with validation error message
5. IF the feedback is less than 10 characters, THEN THE API_Server SHALL return a 400 status code with validation error message
6. WHEN the submission ID is provided, THE API_Server SHALL verify the submission exists in Supabase
7. IF the submission does not exist, THEN THE API_Server SHALL return a 404 status code with not found error message
8. WHEN the submission exists, THE API_Server SHALL retrieve the associated assignment to verify trainer ownership
9. IF the authenticated trainer does not own the assignment, THEN THE API_Server SHALL return a 403 status code with unauthorized error message
10. WHEN the authenticated trainer owns the assignment, THE API_Server SHALL update the submission record with grade and feedback
11. WHEN the submission is updated successfully, THE API_Server SHALL return a 200 status code with the updated submission data
12. WHEN the submission is updated successfully, THE API_Server SHALL return a response in the format: { success: true, message: string, data: object }
13. IF no authentication token is provided, THEN THE API_Server SHALL return a 401 status code with authentication error message

### Requirement 3: Edit Assignment Endpoint

**User Story:** As a trainer, I want to edit existing assignments through the API, so that I can update assignment details and due dates.

#### Acceptance Criteria

1. WHEN a PUT request is sent to /api/assignments/:id with valid authentication, THE API_Server SHALL accept the request
2. WHEN the request includes title, description, or dueDate fields, THE API_Server SHALL validate at least one field is provided
3. IF the title is provided and less than 3 characters, THEN THE API_Server SHALL return a 400 status code with validation error message
4. IF the description is provided and less than 10 characters, THEN THE API_Server SHALL return a 400 status code with validation error message
5. IF the dueDate is provided and not a valid ISO 8601 date string, THEN THE API_Server SHALL return a 400 status code with validation error message
6. WHEN the assignment ID is provided, THE API_Server SHALL verify the assignment exists in Supabase
7. IF the assignment does not exist, THEN THE API_Server SHALL return a 404 status code with not found error message
8. WHEN the assignment exists, THE API_Server SHALL verify the authenticated trainer owns the assignment
9. IF the authenticated trainer does not own the assignment, THEN THE API_Server SHALL return a 403 status code with unauthorized error message
10. WHEN the authenticated trainer owns the assignment, THE API_Server SHALL update the assignment record with the provided fields
11. WHEN the assignment is updated successfully, THE API_Server SHALL return a 200 status code with the updated assignment data
12. WHEN the assignment is updated successfully, THE API_Server SHALL return a response in the format: { success: true, message: string, data: object }
13. IF the authenticated user does not have the trainer role, THEN THE API_Server SHALL return a 403 status code with forbidden error message
14. IF no authentication token is provided, THEN THE API_Server SHALL return a 401 status code with authentication error message

### Requirement 4: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error handling and logging for trainer endpoints, so that I can troubleshoot issues and monitor system health.

#### Acceptance Criteria

1. WHEN any endpoint encounters an error, THE API_Server SHALL log the error details using the logger utility
2. WHEN a validation error occurs, THE API_Server SHALL log the validation failure with the field name and constraint violated
3. WHEN a database error occurs, THE API_Server SHALL log the error without exposing sensitive database details to the client
4. WHEN an endpoint successfully completes an operation, THE API_Server SHALL log the operation type, user ID, and resource ID
5. WHEN an authorization failure occurs, THE API_Server SHALL log the attempted action and user ID
6. THE API_Server SHALL use the existing error middleware to handle all errors consistently
7. THE API_Server SHALL return error responses in the format: { success: false, message: string, error: string }

### Requirement 5: Integration with Existing Architecture

**User Story:** As a developer, I want the new endpoints to follow existing code patterns, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE API_Server SHALL implement routes in the backend/src/routes/ directory following existing naming conventions
2. THE API_Server SHALL implement controllers in the backend/src/controllers/ directory following existing patterns
3. THE API_Server SHALL implement services in the backend/src/services/ directory following existing patterns
4. THE API_Server SHALL use the verifyToken middleware for authentication on all protected endpoints
5. THE API_Server SHALL use the authorizeRoles middleware for role-based authorization where applicable
6. THE API_Server SHALL use Supabase client for all database operations following existing patterns
7. THE API_Server SHALL use existing error classes (BadRequestError, NotFoundError, UnauthorizedError) for error handling
8. THE API_Server SHALL follow the existing response format: { success: boolean, message: string, data: object }
9. THE API_Server SHALL register new routes in the main routes index file
10. THE API_Server SHALL use snake_case for database column names and camelCase for JavaScript variables following existing conventions
