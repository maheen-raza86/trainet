# Deadline Enforcement Fix - Bugfix Design

## Overview

This bugfix addresses a critical security and business logic flaw where students can submit assignments and work/practice tasks after deadlines have passed. The fix involves:

1. Adding strict server-side deadline validation in `submissionService.js` (assignments)
2. Strengthening deadline validation in `workPracticeService.js` (work & practice tasks)
3. Updating frontend UI to show deadline status (Open/Closed) and disable submissions when closed
4. Computing deadline status dynamically based on current time vs deadline timestamp

The fix ensures that all deadline enforcement happens on the server side (preventing bypass), while the frontend provides clear visual feedback to users about deadline status.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a submission is accepted after the deadline has passed
- **Property (P)**: The desired behavior - submissions must be rejected when current_time > deadline
- **Preservation**: Existing submission behavior for valid (before deadline) submissions must remain unchanged
- **submitAssignment**: The function in `backend/src/services/submissionService.js` that handles assignment submissions (currently missing deadline validation)
- **submitTask**: The function in `backend/src/services/workPracticeService.js` that handles work/practice submissions (has weak deadline validation)
- **due_date**: The deadline timestamp field in the `assignments` table
- **deadline**: The deadline timestamp field in the `work_practice_tasks` table
- **isClosed**: A computed boolean indicating whether current_time > deadline

## Bug Details

### Fault Condition

The bug manifests when a student attempts to submit an assignment or work/practice task after the deadline has passed. The `submitAssignment` function in submissionService.js completely lacks deadline validation, while `submitTask` in workPracticeService.js has a weak comparison (`new Date() > new Date(task.deadline)`) that may allow edge case submissions at the exact deadline moment.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { assignmentId OR taskId, studentId, currentTime, deadline }
  OUTPUT: boolean
  
  RETURN input.deadline IS NOT NULL
         AND input.currentTime > input.deadline
         AND submissionIsAccepted(input)
END FUNCTION
```

### Examples

- **Assignment Submission**: Student submits assignment at 11:31 AM when due_date is 11:30 AM → System accepts submission (BUG)
- **Work Practice Submission**: Student submits task at 23:59:59 when deadline is 23:59:00 → System accepts submission (BUG)
- **Edge Case**: Student submits at exact deadline moment (e.g., 11:30:00.000 when deadline is 11:30:00.000) → Behavior is inconsistent between modules
- **Valid Submission**: Student submits at 11:29 AM when deadline is 11:30 AM → System accepts submission (CORRECT)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Submissions before the deadline must continue to be accepted and processed normally
- Submissions for assignments/tasks with no deadline (null deadline) must continue to be accepted at any time
- Enrollment validation must continue to work exactly as before
- Duplicate submission prevention must continue to work exactly as before
- Trainer grading, viewing submissions, and managing tasks/assignments must remain completely unchanged
- AI evaluation and plagiarism checking must continue to work as before

**Scope:**
All inputs that do NOT involve submissions after a deadline should be completely unaffected by this fix. This includes:
- Submissions before the deadline
- Submissions for tasks/assignments with no deadline set
- All trainer operations (creating, editing, grading)
- All student operations except submission (viewing, browsing)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Missing Deadline Validation in submitAssignment**: The `submitAssignment` function in submissionService.js performs enrollment validation and duplicate checking but completely skips deadline validation. The assignment's `due_date` field is fetched but never compared against the current time.

2. **Weak Deadline Comparison in submitTask**: The `submitTask` function in workPracticeService.js has deadline validation (`if (task.deadline && new Date() > new Date(task.deadline))`), but the comparison operator `>` may allow edge cases at the exact deadline moment. Should use `>=` for strict enforcement.

3. **No Frontend Deadline Status Display**: The frontend UI does not show whether a deadline is "Open" or "Closed", making it unclear to students whether they can still submit. The submit button remains enabled even after deadlines pass (though the backend should reject it).

4. **Client-Side Filtering Hides Past Assignments**: The assignments page filters out pending assignments past their deadline (`new Date(a.due_date) >= now`), which hides them from view but doesn't prevent direct API calls to submit them.

## Correctness Properties

Property 1: Fault Condition - Deadline Enforcement

_For any_ submission request where the current server time is greater than the assignment/task deadline, the fixed submitAssignment and submitTask functions SHALL reject the submission with error "Deadline has passed. Submission not allowed." and prevent any file upload or database insertion from occurring.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Valid Submission Behavior

_For any_ submission request where the current server time is less than or equal to the deadline (or deadline is null), the fixed functions SHALL produce exactly the same behavior as the original functions, preserving all existing validation logic (enrollment checking, duplicate prevention, file upload, AI evaluation, plagiarism checking).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `backend/src/services/submissionService.js`

**Function**: `submitAssignment`

**Specific Changes**:
1. **Add Deadline Validation**: After fetching the assignment and before enrollment validation, add a check:
   ```javascript
   // Deadline validation
   if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
     throw new BadRequestError('Deadline has passed. Submission not allowed.');
   }
   ```
   - Insert this check immediately after verifying the assignment exists
   - Use strict `>` comparison (submissions at exact deadline moment are rejected)
   - Only check if `due_date` is not null (null means no deadline)

**File 2**: `backend/src/services/workPracticeService.js`

**Function**: `submitTask`

**Specific Changes**:
1. **Strengthen Deadline Validation**: Change the existing deadline check from:
   ```javascript
   if (task.deadline && new Date() > new Date(task.deadline)) {
     throw new BadRequestError('Submission deadline has passed');
   }
   ```
   To:
   ```javascript
   if (task.deadline && new Date() > new Date(task.deadline)) {
     throw new BadRequestError('Deadline has passed. Submission not allowed.');
   }
   ```
   - Keep the same comparison logic (already correct)
   - Standardize error message to match assignments module

**File 3**: `frontend/app/student/assignments/page.tsx`

**Specific Changes**:
1. **Add Deadline Status Display**: For each assignment card, compute `isClosed` and display status:
   ```typescript
   const isClosed = assignment.due_date && new Date() > new Date(assignment.due_date);
   ```
   - Show "Open" badge (green) when `!isClosed`
   - Show "Closed" badge (red) when `isClosed`
   - Display next to the due date

2. **Disable Submit Button When Closed**: Modify the submit button logic:
   ```typescript
   {assignment.status === 'pending' && (
     isClosed ? (
       <div className="text-sm text-red-600">Deadline has passed</div>
     ) : (
       <button onClick={() => handleSubmitClick(assignment)}>Submit Assignment</button>
     )
   )}
   ```

3. **Remove Client-Side Filtering**: Remove or modify the line that hides past-deadline assignments:
   ```typescript
   // Remove: return new Date(a.due_date) >= now;
   // Keep all assignments visible regardless of deadline
   ```

**File 4**: `frontend/app/student/work-practice/page.tsx`

**Specific Changes**:
1. **Add Deadline Status Display**: In the task card, show "Open" or "Closed" status:
   ```typescript
   const isClosed = task.deadline && new Date() > new Date(task.deadline);
   ```
   - Replace "Closed" text with "Closed" badge (red background)
   - Add "Open" badge (green background) when not closed

**File 5**: `frontend/app/student/work-practice/[id]/page.tsx`

**Specific Changes**:
1. **Show Deadline Status**: Add "Open" or "Closed" badge next to the deadline display
2. **Update Deadline Message**: Change "Deadline passed" to "Closed - Deadline has passed"
3. **Ensure Submit Button Disabled**: The existing `canSubmit` logic already checks `!deadlinePast`, so no changes needed to button logic

**File 6**: `frontend/components/student/SubmissionModal.tsx`

**Specific Changes**:
1. **Add Deadline Prop**: Accept `deadline` prop from parent component
2. **Show Deadline Status**: Display "Open" or "Closed" status in the modal header
3. **Disable Submit if Closed**: Add validation to prevent submission if deadline has passed (defensive check)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate submissions after deadlines and assert that they are rejected. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Assignment Past Deadline Test**: Submit assignment at 11:31 AM when due_date is 11:30 AM (will fail on unfixed code - submission accepted)
2. **Work Practice Past Deadline Test**: Submit task at 23:59:59 when deadline is 23:59:00 (will fail on unfixed code - submission accepted)
3. **Edge Case Exact Deadline Test**: Submit at exact deadline moment (11:30:00.000 when deadline is 11:30:00.000) (may fail on unfixed code - inconsistent behavior)
4. **Null Deadline Test**: Submit assignment/task with no deadline set (should pass on unfixed code - no deadline means always open)

**Expected Counterexamples**:
- Submissions after deadlines are accepted when they should be rejected
- Possible causes: missing validation in submitAssignment, weak comparison in submitTask

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := submitAssignment_fixed(input) OR submitTask_fixed(input)
  ASSERT result.error = "Deadline has passed. Submission not allowed."
  ASSERT result.submissionCreated = false
END FOR
```

**Test Cases**:
1. **Assignment Deadline Enforcement**: Submit assignment 1 second after deadline → Expect rejection
2. **Work Practice Deadline Enforcement**: Submit task 1 minute after deadline → Expect rejection
3. **Assignment Deadline Enforcement (1 hour late)**: Submit assignment 1 hour after deadline → Expect rejection
4. **Work Practice Deadline Enforcement (1 day late)**: Submit task 1 day after deadline → Expect rejection

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT submitAssignment_original(input) = submitAssignment_fixed(input)
  ASSERT submitTask_original(input) = submitTask_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for valid submissions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Valid Assignment Submission**: Submit assignment 1 minute before deadline → Expect acceptance and normal processing
2. **Valid Work Practice Submission**: Submit task 1 hour before deadline → Expect acceptance and normal processing
3. **No Deadline Assignment**: Submit assignment with null due_date → Expect acceptance at any time
4. **No Deadline Task**: Submit task with null deadline → Expect acceptance at any time
5. **Enrollment Validation**: Submit assignment without enrollment → Expect enrollment error (unchanged)
6. **Duplicate Submission**: Submit assignment twice → Expect conflict error (unchanged)
7. **AI Evaluation**: Submit valid assignment → Expect AI evaluation to run (unchanged)
8. **Plagiarism Check**: Submit valid assignment → Expect plagiarism check to run (unchanged)

### Unit Tests

- Test deadline validation in submitAssignment for various time offsets (before, at, after deadline)
- Test deadline validation in submitTask for various time offsets
- Test null deadline handling (should allow submissions at any time)
- Test error message format matches specification
- Test that file upload is prevented when deadline validation fails
- Test that database insertion is prevented when deadline validation fails

### Property-Based Tests

- Generate random submission times and deadlines, verify correct acceptance/rejection
- Generate random assignments with and without deadlines, verify preservation of existing behavior
- Generate random task configurations, verify deadline enforcement across all task types
- Test that all non-deadline validations (enrollment, duplicates) continue to work correctly

### Integration Tests

- Test full submission flow: student submits assignment before deadline → accepted
- Test full submission flow: student submits assignment after deadline → rejected with correct error
- Test full submission flow: student submits task before deadline → accepted
- Test full submission flow: student submits task after deadline → rejected with correct error
- Test frontend UI: deadline status displays correctly (Open/Closed)
- Test frontend UI: submit button disabled when deadline passed
- Test frontend UI: error message displayed when backend rejects late submission
