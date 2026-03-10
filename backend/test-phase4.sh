#!/bin/bash

# TRAINET Backend Phase 4 Test Script
# Tests Learning Hub Module: Courses, Enrollments, Assignments, Submissions

BASE_URL="http://localhost:5000/api"

echo "=========================================="
echo "Phase 4: Learning Hub Module Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Generate unique emails
TIMESTAMP=$(date +%s)
STUDENT_EMAIL="student${TIMESTAMP}@example.com"
TRAINER_EMAIL="trainer${TIMESTAMP}@example.com"

echo -e "${BLUE}=== Setup: Creating Test Users ===${NC}"
echo ""

# Create student user
echo -e "${YELLOW}Creating student user...${NC}"
curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"password123\",
    \"firstName\": \"Test\",
    \"lastName\": \"Student\",
    \"role\": \"student\"
  }" | json_pp
echo ""

# Create trainer user
echo -e "${YELLOW}Creating trainer user...${NC}"
curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TRAINER_EMAIL\",
    \"password\": \"password123\",
    \"firstName\": \"Test\",
    \"lastName\": \"Trainer\",
    \"role\": \"trainer\"
  }" | json_pp
echo ""

# Login as student
echo -e "${YELLOW}Logging in as student...${NC}"
STUDENT_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"password123\"
  }")

if command -v jq &> /dev/null; then
  STUDENT_TOKEN=$(echo $STUDENT_LOGIN | jq -r '.data.accessToken')
else
  STUDENT_TOKEN=$(echo $STUDENT_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

echo "Student token: ${STUDENT_TOKEN:0:30}..."
echo ""

# Login as trainer
echo -e "${YELLOW}Logging in as trainer...${NC}"
TRAINER_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TRAINER_EMAIL\",
    \"password\": \"password123\"
  }")

if command -v jq &> /dev/null; then
  TRAINER_TOKEN=$(echo $TRAINER_LOGIN | jq -r '.data.accessToken')
else
  TRAINER_TOKEN=$(echo $TRAINER_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

echo "Trainer token: ${TRAINER_TOKEN:0:30}..."
echo ""

echo -e "${BLUE}=== Test 1: Get All Courses (Public) ===${NC}"
curl -s $BASE_URL/courses | json_pp
echo ""

echo -e "${BLUE}=== Test 2: Get Course by ID (Public) ===${NC}"
echo "Note: Replace <course-id> with actual course ID from your database"
echo "curl $BASE_URL/courses/<course-id>"
echo ""

echo -e "${BLUE}=== Test 3: Enroll in Course (Student) ===${NC}"
echo "Note: Replace <course-id> with actual course ID"
echo "curl -X POST $BASE_URL/courses/enroll \\"
echo "  -H \"Authorization: Bearer \$STUDENT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"courseId\":\"<course-id>\"}'"
echo ""

echo -e "${BLUE}=== Test 4: Get My Enrolled Courses (Student) ===${NC}"
curl -s $BASE_URL/courses/my-courses \
  -H "Authorization: Bearer $STUDENT_TOKEN" | json_pp
echo ""

echo -e "${BLUE}=== Test 5: Create Assignment (Trainer Only) ===${NC}"
echo "Note: Replace <course-id> with actual course ID"
echo "curl -X POST $BASE_URL/courses/<course-id>/assignments \\"
echo "  -H \"Authorization: Bearer \$TRAINER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"title\":\"Test Assignment\",\"description\":\"Complete this\",\"maxScore\":100}'"
echo ""

echo -e "${BLUE}=== Test 6: Submit Assignment (Student Only) ===${NC}"
echo "Note: Replace <assignment-id> with actual assignment ID"
echo "curl -X POST $BASE_URL/courses/assignments/<assignment-id>/submit \\"
echo "  -H \"Authorization: Bearer \$STUDENT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"content\":\"My submission\"}'"
echo ""

echo -e "${BLUE}=== Test 7: Role Authorization Test ===${NC}"
echo -e "${YELLOW}Student trying to create assignment (should fail with 403)...${NC}"
echo "curl -X POST $BASE_URL/courses/<course-id>/assignments \\"
echo "  -H \"Authorization: Bearer \$STUDENT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"title\":\"Test\",\"description\":\"Test\"}'"
echo ""

echo -e "${YELLOW}Trainer trying to submit assignment (should fail with 403)...${NC}"
echo "curl -X POST $BASE_URL/courses/assignments/<assignment-id>/submit \\"
echo "  -H \"Authorization: Bearer \$TRAINER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"content\":\"Test\"}'"
echo ""

echo -e "${GREEN}=========================================="
echo "Phase 4 Tests Complete!"
echo "==========================================${NC}"
echo ""
echo "Summary:"
echo "- Created student user: $STUDENT_EMAIL"
echo "- Created trainer user: $TRAINER_EMAIL"
echo "- Student token obtained"
echo "- Trainer token obtained"
echo ""
echo "Next steps:"
echo "1. Ensure database tables exist (courses, enrollments, assignments, submissions)"
echo "2. Create some test courses in Supabase"
echo "3. Run the enrollment and assignment tests with actual IDs"
echo ""
echo "Tokens for manual testing:"
echo "Student: $STUDENT_TOKEN"
echo "Trainer: $TRAINER_TOKEN"
