#!/bin/bash

# Test script for authentication RLS fix
# This script tests the signup and login functionality

BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================="
echo "Testing Authentication RLS Fix"
echo "==============================================${NC}"
echo ""

# Generate random email to avoid conflicts
RANDOM_NUM=$RANDOM
TEST_EMAIL="test${RANDOM_NUM}@example.com"
TEST_PASSWORD="password123"

echo -e "${BLUE}=== TEST 1: Health Check ===${NC}"
echo "GET $BASE_URL/health"
echo ""
curl -s $BASE_URL/health | json_pp
echo ""
echo ""

echo -e "${BLUE}=== TEST 2: Signup (Student) ===${NC}"
echo "POST $BASE_URL/auth/signup"
echo "Email: $TEST_EMAIL"
echo ""

SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"role\": \"student\"
  }")

echo "$SIGNUP_RESPONSE" | json_pp
echo ""

# Check if signup was successful
if echo "$SIGNUP_RESPONSE" | grep -q '"success" : true'; then
  echo -e "${GREEN}✓ Signup successful${NC}"
else
  echo -e "${RED}✗ Signup failed${NC}"
  echo "Exiting..."
  exit 1
fi
echo ""

echo -e "${BLUE}=== TEST 3: Login ===${NC}"
echo "POST $BASE_URL/auth/login"
echo "Email: $TEST_EMAIL"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | json_pp
echo ""

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken" : "[^"]*' | grep -o '[^"]*$')

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}✗ Login failed - no access token${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."
fi
echo ""

echo -e "${BLUE}=== TEST 4: Get Current User ===${NC}"
echo "GET $BASE_URL/users/me"
echo ""

USER_RESPONSE=$(curl -s $BASE_URL/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$USER_RESPONSE" | json_pp
echo ""

if echo "$USER_RESPONSE" | grep -q '"success" : true'; then
  echo -e "${GREEN}✓ User profile retrieved successfully${NC}"
else
  echo -e "${RED}✗ Failed to retrieve user profile${NC}"
fi
echo ""

echo -e "${BLUE}=== TEST 5: Signup (Trainer) ===${NC}"
TRAINER_EMAIL="trainer${RANDOM_NUM}@example.com"
echo "POST $BASE_URL/auth/signup"
echo "Email: $TRAINER_EMAIL"
echo ""

TRAINER_SIGNUP=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TRAINER_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"Trainer\",
    \"lastName\": \"User\",
    \"role\": \"trainer\"
  }")

echo "$TRAINER_SIGNUP" | json_pp
echo ""

if echo "$TRAINER_SIGNUP" | grep -q '"success" : true'; then
  echo -e "${GREEN}✓ Trainer signup successful${NC}"
else
  echo -e "${RED}✗ Trainer signup failed${NC}"
fi
echo ""

echo -e "${GREEN}=============================================="
echo "Authentication Tests Complete!"
echo "==============================================${NC}"
echo ""
echo "Summary:"
echo "  Student Email: $TEST_EMAIL"
echo "  Trainer Email: $TRAINER_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""
echo -e "${YELLOW}Note: Check the backend logs for detailed information${NC}"
