# Bugfix Requirements Document

## Introduction

The TRAINET project has a critical bug in the deadline enforcement mechanism. Currently, the system allows students to submit assignments and work/practice tasks even after the deadline has passed. This violates the fundamental requirement that submissions must be strictly prevented once a deadline expires.

The bug affects two modules:
- **Work & Practice Module**: Has partial deadline validation but needs strengthening
- **Assignments Module**: Missing deadline validation entirely in the submission flow

This bugfix will implement strict server-side deadline validation to ensure submissions are rejected when the current server time exceeds the deadline timestamp.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a student submits an assignment through `submitAssignment()` in submissionService.js THEN the system accepts the submission without checking if the current time exceeds the assignment's due_date

1.2 WHEN a student submits a work/practice task through `submitTask()` in workPracticeService.js with a deadline that has passed THEN the system checks the deadline but uses a weak comparison that may allow edge case submissions at the exact deadline moment

1.3 WHEN the current server time is after the deadline (e.g., 11:31 AM when deadline is 11:30 AM) THEN the assignment submission proceeds without any deadline validation error

1.4 WHEN a student attempts to submit at the exact deadline time THEN the behavior is inconsistent between the two modules

### Expected Behavior (Correct)

2.1 WHEN a student submits an assignment through `submitAssignment()` and the current server time is greater than the assignment's due_date THEN the system SHALL reject the submission with error "Deadline has passed. Submission not allowed."

2.2 WHEN a student submits a work/practice task through `submitTask()` and the current server time is greater than the task's deadline THEN the system SHALL reject the submission with error "Deadline has passed. Submission not allowed."

2.3 WHEN the current server time equals or exceeds the deadline timestamp (including edge cases at the exact deadline moment) THEN the system SHALL reject the submission consistently across both modules

2.4 WHEN deadline validation fails THEN the system SHALL prevent file upload and database insertion from occurring

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a student submits an assignment before the deadline THEN the system SHALL CONTINUE TO accept the submission and process it normally

3.2 WHEN a student submits a work/practice task before the deadline THEN the system SHALL CONTINUE TO accept the submission and process it normally

3.3 WHEN an assignment or task has no deadline set (null deadline) THEN the system SHALL CONTINUE TO accept submissions at any time

3.4 WHEN a student is not enrolled in the course offering THEN the system SHALL CONTINUE TO reject the submission with the existing enrollment validation error

3.5 WHEN a student has already submitted an assignment or task THEN the system SHALL CONTINUE TO reject duplicate submissions with the existing conflict error

3.6 WHEN a trainer grades submissions, views submissions, or manages tasks/assignments THEN the system SHALL CONTINUE TO function without any changes to existing behavior
