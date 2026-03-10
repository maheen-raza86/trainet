#!/bin/bash

# TRAINET Backend - Assignments & Submissions Test Script

BASE_URL="http://localhost:5000/api"

echo "=============================================="
echo "TRAINET: Assignments & Submissions API Test"
echo "=============================================="
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

echo -e "${BLUE}=== SETUP: Creating Test Users ===${NC}"
echo ""

# Create student
echo -e "${YELLOW}1. Creating student user...${NC}"
STUDENT_SIGNUP=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"password123\",
    \"firstName\": \"Test\",
    \"lastName\": \"Student\",
    \"role\": \"student\"
  }")
echo $STUDENT_SIGNUP | json_pp
echo ""

# Create trainer
echo -e "${YELLOW}2. Creating trainer user...${NC}"
TRAINER_SIGNUP=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TRAINER_EMAIL\",
    \"password\": \"password123\",
    \"firstName\": \"Test\",
    \"lastName\": \"Trainer\",
    \"role\": \"trainer\"
  }")
echo $TRAINER_SIGNUP | json_pp
echo ""

# Login as student
echo -e "${YELLOW}3. Logging in as student...${NC}"
STUDENT_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$STUDENT_EMAIL\", \"password\": \"password123\"}")

if command -v jq &> /dev/null; then
  STUDENT_TOKEN=$(echo $STUDENT_LOGIN | jq -r '.data.accessToken')
else
  STUDENT_TOKEN=$(echo $STUDENT_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

echo "Student Token: ${STUDENT_TOKEN:0:40}..."
echo ""

# Login as trainer
echo -e "${YELLOW}4. Logging in as trainer...${NC}"
TRAINER_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TRAINER_EMAIL\", \"password\": \"password123\"}")

if command -v jq &> /dev/null; then
  TRAINER_TOKEN=$(echo $TRAINER_LOGIN | jq -r '.data.accessToken')
else
  TRAINER_TOKEN=$(echo $TRAINER_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

echo "Trainer Token: ${TRAINER_TOKEN:0:40}..."
echo ""

echo -e "${BLUE}=== TEST 1: Create Assignment (Trainer) ===${NC}"
echo "POST $BASE_URL/assignments"
echo ""
echo "Note: Replace <COURSE_UUID> with an actual course ID from your database"
echo ""
echo "Command:"
echo "curl -X POST $BASE_URL/assignments \\"
echo "  -H \"Authorization: Bearer $TRAINER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"title\":\"Linux Hardening\",\"description\":\"Secure Ubuntu\",\"courseId\":\"<COURSE_UUID>\",\"dueDate\":\"2026-05-01\"}'"
echo ""

echo -e "${BLUE}=== TEST 2: Get Assignments for Course ===${NC}"
echo "GET $BASE_URL/assignments/course/<COURSE_UUID>"
echo ""
echo "Command:"
echo "curl $BASE_URL/assignments/course/<COURSE_UUID>"
echo ""

echo -e "${BLUE}=== TEST 3: Student Enroll in Course ===${NC}"
echo "POST $BASE_URL/courses/enroll"
echo ""
echo "Command:"
echo "curl -X POST $BASE_URL/courses/enroll \\"
echo "  -H \"Authorization: Bearer $STUDENT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"courseId\":\"<COURSE_UUID>\"}'"
echo ""

echo -e "${BLUE}=== TEST 4: Submit Assignment (Student) ===${NC}"
echo "POST $BASE_URL/submissions"
echo ""
echo "Command:"
echo "curl -X POST $BASE_URL/submissions \\"
echo "  -H \"Authorization: Bearer $STUDENT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"assignmentId\":\"<ASSIGNMENT_UUID>\",\"attachmentUrl\":\"https://github.com/student/repo\"}'"
echo ""

echo -e "${BLUE}=== TEST 5: Get My Submissions (Student) ===${NC}"
echo "GET $BASE_URL/submissions/my"
echo ""
curl -s $BASE_URL/submissions/my \
  -H "Authorization: Bearer $STUDENT_TOKEN" | json_pp
echo ""

echo -e "${BLUE}=== TEST 6: Get Submissions for Assignment (Trainer) ===${NC}"
echo "GET $BASE_URL/submissions/assignment/<ASSIGNMENT_UUID>"
echo ""
echo "Command:"
echo "curl $BASE_URL/submissions/assignment/<ASSIGNMENT_UUID> \\"
echo "  -H \"Authorization: Bearer $TRAINER_TOKEN\""
echo ""

echo -e "${BLUE}=== TEST 7: Role Authorization Tests ===${NC}"
echo ""
echo -e "${YELLOW}7a. Student trying to create assignment (should fail)...${NC}"
echo "curl -X POST $BASE_URL/assignments \\"
echo "  -H \"Authorization: Bearer $STUDENT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"title\":\"Test\",\"description\":\"Test\",\"courseId\":\"<COURSE_UUID>\"}'"
echo ""

echo -e "${YELLOW}7b. Trainer trying to submit assignment (should fail)...${NC}"
echo "curl -X POST $BASE_URL/submissions \\"
echo "  -H \"Authorization: Bearer $TRAINER_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"assignmentId\":\"<ASSIGNMENT_UUID>\",\"attachmentUrl\":\"https://test.com\"}'"
echo ""

echo -e "${GREEN}=============================================="
echo "Test Setup Complete!"
echo "==============================================${NC}"
echo ""
echo "Created Users:"
echo "  Student: $STUDENT_EMAIL"
echo "  Trainer: $TRAINER_EMAIL"
echo ""
echo "Tokens (valid for testing):"
echo "  Student: $STUDENT_TOKEN"
echo "  Trainer: $TRAINER_TOKEN"
echo ""
echo "Next Steps:"
echo "1. Ensure you have courses in your database"
echo "2. Replace <COURSE_UUID> with actual course ID"
echo "3. Run the commands above with actual IDs"
echo "4. Test the complete workflow"
echo ""
echo "Quick Reference:"
echo "  - List courses: curl $BASE_URL/courses"
echo "  - Get course: curl $BASE_URL/courses/<COURSE_UUID>"
