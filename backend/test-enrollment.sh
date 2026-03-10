#!/bin/bash

# Test script for Enrollment API
# This script tests enrollment functionality

BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================="
echo "Testing Enrollment API"
echo "==============================================${NC}"
echo ""

# Generate random email to avoid conflicts
RANDOM_NUM=$RANDOM
STUDENT_EMAIL="student${RANDOM_NUM}@example.com"
TRAINER_EMAIL="trainer${RANDOM_NUM}@example.com"
PASSWORD="password123"

echo -e "${BLUE}=== TEST 1: Create Student Account ===${NC}"
echo "POST $BASE_URL/auth/signup"
echo "Email: $STUDENT_EMAIL"
echo ""

STUDENT_SIGNUP=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"Student\",
    \"role\": \"student\"
  }")

echo "$STUDENT_SIGNUP" | json_pp
echo ""

if echo "$STUDENT_SIGNUP" | grep -q '"success" : true'; then
  echo -e "${GREEN}✓ Student account created${NC}"
else
  echo -e "${RED}✗ Failed to create student account${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}=== TEST 2: Login as Student ===${NC}"
echo "POST $BASE_URL/auth/login"
echo ""

STUDENT_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | grep -o '"accessToken" : "[^"]*' | grep -o '[^"]*$')

if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${RED}✗ Failed to login as student${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Student login successful${NC}"
  echo "Token: ${STUDENT_TOKEN:0:50}..."
fi
echo ""

echo -e "${BLUE}=== TEST 3: Get Available Courses ===${NC}"
echo "GET $BASE_URL/courses"
echo ""

COURSES=$(curl -s $BASE_URL/courses)
echo "$COURSES" | json_pp
echo ""

# Extract first course ID
COURSE_ID=$(echo "$COURSES" | grep -o '"id" : "[^"]*' | head -1 | grep -o '[^"]*$')

if [ -z "$COURSE_ID" ]; then
  echo -e "${YELLOW}⚠ No courses found. Please create a course first.${NC}"
  echo "You can create a course manually in Supabase or via the API."
  exit 0
else
  echo -e "${GREEN}✓ Found course: $COURSE_ID${NC}"
fi
echo ""

echo -e "${BLUE}=== TEST 4: Enroll in Course ===${NC}"
echo "POST $BASE_URL/enrollments"
echo "Course ID: $COURSE_ID"
echo ""

ENROLLMENT=$(curl -s -X POST $BASE_URL/enrollments \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"courseId\": \"$COURSE_ID\"
  }")

echo "$ENROLLMENT" | json_pp
echo ""

if echo "$ENROLLMENT" | grep -q '"success" : true'; then
  echo -e "${GREEN}✓ Enrollment successful${NC}"
else
  echo -e "${RED}✗ Enrollment failed${NC}"
fi
echo ""

echo -e "${BLUE}=== TEST 5: Get My Enrollments ===${NC}"
echo "GET $BASE_URL/enrollments/my"
echo ""

MY_ENROLLMENTS=$(curl -s $BASE_URL/enrollments/my \
  -H "Authorization: Bearer $STUDENT_TOKEN")

echo "$MY_ENROLLMENTS" | json_pp
echo ""

if echo "$MY_ENROLLMENTS" | grep -q '"success" : true'; then
  echo -e "${GREEN}✓ Retrieved enrollments successfully${NC}"
else
  echo -e "${RED}✗ Failed to retrieve enrollments${NC}"
fi
echo ""

echo -e "${BLUE}=== TEST 6: Duplicate Enrollment (Should Fail) ===${NC}"
echo "POST $BASE_URL/enrollments"
echo "Course ID: $COURSE_ID (same course)"
echo ""

DUPLICATE=$(curl -s -X POST $BASE_URL/enrollments \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"courseId\": \"$COURSE_ID\"
  }")

echo "$DUPLICATE" | json_pp
echo ""

if echo "$DUPLICATE" | grep -q '"Already enrolled"'; then
  echo -e "${GREEN}✓ Duplicate enrollment correctly prevented${NC}"
else
  echo -e "${RED}✗ Duplicate enrollment check failed${NC}"
fi
echo ""

echo -e "${BLUE}=== TEST 7: Create Trainer Account ===${NC}"
echo "POST $BASE_URL/auth/signup"
echo "Email: $TRAINER_EMAIL"
echo ""

TRAINER_SIGNUP=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TRAINER_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"Trainer\",
    \"role\": \"trainer\"
  }")

echo "$TRAINER_SIGNUP" | json_pp
echo ""

if echo "$TRAINER_SIGNUP" | grep -q '"success" : true'; then
  echo -e "${GREEN}✓ Trainer account created${NC}"
else
  echo -e "${RED}✗ Failed to create trainer account${NC}"
fi
echo ""

echo -e "${BLUE}=== TEST 8: Login as Trainer ===${NC}"
echo "POST $BASE_URL/auth/login"
echo ""

TRAINER_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TRAINER_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TRAINER_TOKEN=$(echo "$TRAINER_LOGIN" | grep -o '"accessToken" : "[^"]*' | grep -o '[^"]*$')

if [ -z "$TRAINER_TOKEN" ]; then
  echo -e "${RED}✗ Failed to login as trainer${NC}"
else
  echo -e "${GREEN}✓ Trainer login successful${NC}"
  echo "Token: ${TRAINER_TOKEN:0:50}..."
fi
echo ""

echo -e "${BLUE}=== TEST 9: Trainer Enrollment (Should Fail) ===${NC}"
echo "POST $BASE_URL/enrollments"
echo "Trainer trying to enroll (should be forbidden)"
echo ""

TRAINER_ENROLL=$(curl -s -X POST $BASE_URL/enrollments \
  -H "Authorization: Bearer $TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"courseId\": \"$COURSE_ID\"
  }")

echo "$TRAINER_ENROLL" | json_pp
echo ""

if echo "$TRAINER_ENROLL" | grep -q '"Only students can enroll"'; then
  echo -e "${GREEN}✓ Trainer enrollment correctly prevented${NC}"
else
  echo -e "${RED}✗ Trainer enrollment check failed${NC}"
fi
echo ""

echo -e "${BLUE}=== TEST 10: Missing Course ID (Should Fail) ===${NC}"
echo "POST $BASE_URL/enrollments"
echo "Request without courseId"
echo ""

MISSING_ID=$(curl -s -X POST $BASE_URL/enrollments \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$MISSING_ID" | json_pp
echo ""

if echo "$MISSING_ID" | grep -q '"Course ID is required"'; then
  echo -e "${GREEN}✓ Validation correctly enforced${NC}"
else
  echo -e "${RED}✗ Validation check failed${NC}"
fi
echo ""

echo -e "${GREEN}=============================================="
echo "Enrollment API Tests Complete!"
echo "==============================================${NC}"
echo ""
echo "Summary:"
echo "  Student Email: $STUDENT_EMAIL"
echo "  Trainer Email: $TRAINER_EMAIL"
echo "  Password: $PASSWORD"
echo "  Course ID: $COURSE_ID"
echo ""
echo -e "${YELLOW}Note: Check the backend logs for detailed information${NC}"
