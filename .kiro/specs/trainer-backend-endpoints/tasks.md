# Implementation Plan: Trainer Backend Endpoints

## Overview

This implementation plan creates three missing trainer backend endpoints for the TRAINET Learning Management System: course creation, submission grading, and assignment editing. The implementation follows the existing Express.js three-layer architecture (routes, controllers, services) with JWT authentication and Supabase database integration.

## Tasks

- [x] 1. Implement Create Course Endpoint
  - [x] 1.1 Add POST /api/courses route with authentication and authorization middleware
    - Add route definition in backend/src/routes/courseRoutes.js
    - Apply verifyToken and authorizeRoles('trainer') middleware
    - _Requirements: 1.1, 1.10, 1.11, 5.1, 5.4, 5.5_
  
  - [x] 1.2 Implement course creation controller
    - Create createCourse function in backend/src/controllers/courseController.js
    - Validate title length (3-100 characters)
    - Validate description length (10-500 characters)
    - Extract trainer ID from req.user.id
    - Call service layer with validated data
    - Return 201 status with course data
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 5.2, 5.8_
  
  - [x] 1.3 Implement course creation service
    - Create createCourse function in backend/src/services/courseService.js
    - Insert course record into Supabase courses table
    - Log course creation event
    - Return created course data
    - Handle database errors appropriately
    - _Requirements: 1.7, 4.1, 4.3, 4.4, 5.3, 5.6_
  
  - [ ]* 1.4 Write property test for course creation input validation
    - **Property 3: Course Creation Input Validation**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - Test with randomized invalid title and description lengths
    - Verify 400 status code returned for all invalid inputs
  
  - [ ]* 1.5 Write property test for course creation authorization
    - **Property 4: Course Creation Authorization**
    - **Validates: Requirements 1.10**
    - Test with randomized non-trainer roles
    - Verify 403 status code returned
  
  - [ ]* 1.6 Write property test for course creation success
    - **Property 5: Course Creation Success**
    - **Validates: Requirements 1.2, 1.7**
    - Test with randomized valid course data
    - Verify 201 status code and correct response format
  
  - [ ]* 1.7 Write unit tests for course creation
    - Test successful course creation with valid data
    - Test rejection without authentication (401)
    - Test rejection with student role (403)
    - Test rejection with invalid title lengths
    - Test rejection with invalid description lengths
    - Test rejection with missing fields
    - _Requirements: 1.1-1.11_

- [x] 2. Implement Grade Submission Endpoint
  - [x] 2.1 Add PUT /api/submissions/:id/grade route with authentication and authorization middleware
    - Add route definition in backend/src/routes/submissionRoutes.js
    - Apply verifyToken and authorizeRoles('trainer') middleware
    - _Requirements: 2.1, 2.13, 5.1, 5.4, 5.5_
  
  - [x] 2.2 Implement submission grading controller
    - Create gradeSubmission function in backend/src/controllers/submissionController.js
    - Extract submission ID from URL parameter
    - Validate grade range (0-100)
    - Validate feedback length (minimum 10 characters)
    - Extract trainer ID from req.user.id
    - Call service layer with validated data
    - Return 200 status with updated submission data
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.11, 2.12, 5.2, 5.8_
  
  - [x] 2.3 Implement submission grading service
    - Create gradeSubmission function in backend/src/services/submissionService.js
    - Verify submission exists (404 if not found)
    - Retrieve associated assignment
    - Verify trainer owns the assignment (403 if not)
    - Update submission with grade, feedback, graded_at timestamp, and status='graded'
    - Log grading event
    - Return updated submission data
    - Handle database errors appropriately
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10, 4.1, 4.3, 4.4, 4.5, 5.3, 5.6_
  
  - [ ]* 2.4 Write property test for submission grading input validation
    - **Property 6: Submission Grading Input Validation**
    - **Validates: Requirements 2.3, 2.4, 2.5**
    - Test with randomized invalid grades and feedback
    - Verify 400 status code returned for all invalid inputs
  
  - [ ]* 2.5 Write property test for submission grading resource validation
    - **Property 7: Submission Grading Resource Validation**
    - **Validates: Requirements 2.6, 2.7**
    - Test with randomized non-existent submission IDs
    - Verify 404 status code returned
  
  - [ ]* 2.6 Write property test for submission grading authorization
    - **Property 8: Submission Grading Authorization**
    - **Validates: Requirements 2.9**
    - Test with trainer attempting to grade submission for assignment they don't own
    - Verify 403 status code returned
  
  - [ ]* 2.7 Write property test for submission grading success
    - **Property 9: Submission Grading Success**
    - **Validates: Requirements 2.2, 2.10**
    - Test with randomized valid grading data
    - Verify 200 status code and correct response format
  
  - [ ]* 2.8 Write unit tests for submission grading
    - Test successful grading with valid data
    - Test rejection without authentication (401)
    - Test rejection with student role (403)
    - Test rejection with invalid grade values
    - Test rejection with short feedback
    - Test rejection for non-existent submission (404)
    - Test rejection when trainer doesn't own assignment (403)
    - Test rejection with missing fields
    - _Requirements: 2.1-2.13_

- [x] 3. Checkpoint - Verify course creation and submission grading endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Edit Assignment Endpoint
  - [x] 4.1 Add PUT /api/assignments/:id route with authentication and authorization middleware
    - Add route definition in backend/src/routes/assignmentRoutes.js
    - Apply verifyToken and authorizeRoles('trainer') middleware
    - _Requirements: 3.1, 3.13, 3.14, 5.1, 5.4, 5.5_
  
  - [x] 4.2 Implement assignment edit controller
    - Create updateAssignment function in backend/src/controllers/assignmentController.js
    - Extract assignment ID from URL parameter
    - Validate at least one field is provided
    - Validate title length if provided (minimum 3 characters)
    - Validate description length if provided (minimum 10 characters)
    - Validate dueDate format if provided (ISO 8601)
    - Extract trainer ID from req.user.id
    - Call service layer with validated data
    - Return 200 status with updated assignment data
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.11, 3.12, 5.2, 5.8_
  
  - [x] 4.3 Implement assignment edit service
    - Create updateAssignment function in backend/src/services/assignmentService.js
    - Verify assignment exists (404 if not found)
    - Verify trainer owns the assignment (403 if not)
    - Update assignment with provided fields
    - Add updated_at timestamp
    - Log update event
    - Return updated assignment data
    - Handle database errors appropriately
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 3.10, 4.1, 4.3, 4.4, 4.5, 5.3, 5.6_
  
  - [ ]* 4.4 Write property test for assignment edit input validation
    - **Property 10: Assignment Edit Input Validation**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
    - Test with randomized invalid inputs (no fields, short title/description, invalid date)
    - Verify 400 status code returned for all invalid inputs
  
  - [ ]* 4.5 Write property test for assignment edit resource validation
    - **Property 11: Assignment Edit Resource Validation**
    - **Validates: Requirements 3.6, 3.7**
    - Test with randomized non-existent assignment IDs
    - Verify 404 status code returned
  
  - [ ]* 4.6 Write property test for assignment edit authorization
    - **Property 12: Assignment Edit Authorization**
    - **Validates: Requirements 3.9, 3.13**
    - Test with non-trainer roles and trainers who don't own the assignment
    - Verify 403 status code returned
  
  - [ ]* 4.7 Write property test for assignment edit success
    - **Property 13: Assignment Edit Success**
    - **Validates: Requirements 3.10**
    - Test with randomized valid partial updates
    - Verify 200 status code and correct response format
  
  - [ ]* 4.8 Write unit tests for assignment editing
    - Test successful edit with valid data
    - Test rejection without authentication (401)
    - Test rejection with student role (403)
    - Test rejection with no fields provided
    - Test rejection with invalid title length
    - Test rejection with invalid description length
    - Test rejection with invalid date format
    - Test rejection for non-existent assignment (404)
    - Test rejection when trainer doesn't own assignment (403)
    - Test partial updates (only title, only description, only dueDate)
    - Test multiple fields updated simultaneously
    - _Requirements: 3.1-3.14_

- [ ] 5. Implement Cross-Endpoint Property Tests
  - [ ]* 5.1 Write property test for API response format consistency
    - **Property 1: API Response Format Consistency**
    - **Validates: Requirements 1.8, 1.9, 2.11, 2.12, 3.11, 3.12, 5.8**
    - Test all successful responses follow format { success: true, message: string, data: object }
    - Verify data contains expected fields for each endpoint
  
  - [ ]* 5.2 Write property test for error response format consistency
    - **Property 2: Error Response Format Consistency**
    - **Validates: Requirements 4.3, 4.7**
    - Test all error responses follow format { success: false, message: string, error: string }
    - Verify no sensitive database details exposed

- [x] 6. Integration and Route Registration
  - [x] 6.1 Register new routes in main routes index
    - Update backend/src/routes/index.js to include new route handlers
    - Ensure proper route ordering and middleware application
    - _Requirements: 5.9_
  
  - [x] 6.2 Verify error handling middleware integration
    - Ensure all endpoints use existing error middleware
    - Verify error classes (BadRequestError, NotFoundError, etc.) are properly imported
    - Test error responses follow standard format
    - _Requirements: 4.6, 4.7, 5.7_
  
  - [x] 6.3 Verify logging integration
    - Ensure all operations log success events
    - Ensure all errors log failure events
    - Verify authorization failures are logged
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses JavaScript following existing codebase patterns
- All endpoints follow the existing three-layer architecture (routes, controllers, services)
- Authentication uses existing verifyToken middleware
- Authorization uses existing authorizeRoles middleware
- Database operations use existing Supabase client patterns
