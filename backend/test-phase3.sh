#!/bin/bash

# TRAINET Backend Phase 3 Test Script
# Tests authentication middleware and protected routes

BASE_URL="http://localhost:5000/api"

echo "==================================="
echo "Phase 3: Protected Routes Test"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Generate unique email
TIMESTAMP=$(date +%s)
TEST_EMAIL="phase3test${TIMESTAMP}@example.com"

# Step 1: Signup
echo -e "${YELLOW}Step 1: Creating test user...${NC}"
echo "POST $BASE_URL/auth/signup"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\",
    \"firstName\": \"Phase3\",
    \"lastName\": \"Test\",
    \"role\": \"student\"
  }")
echo $SIGNUP_RESPONSE | json_pp
echo ""

# Step 2: Login
echo -e "${YELLOW}Step 2: Logging in...${NC}"
echo "POST $BASE_URL/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\"
  }")
echo $LOGIN_RESPONSE | json_pp

# Extract access token (works on Linux/Mac with jq or grep)
if command -v jq &> /dev/null; then
  ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
else
  ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

echo ""
echo -e "${GREEN}Access Token extracted:${NC}"
echo "${ACCESS_TOKEN:0:50}..."
echo ""

# Step 3: Access protected route WITH token
echo -e "${YELLOW}Step 3: Accessing /api/users/me WITH valid token...${NC}"
echo "GET $BASE_URL/users/me"
echo "Authorization: Bearer <token>"
curl -s -X GET $BASE_URL/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | json_pp
echo ""

# Step 4: Access protected route WITHOUT token
echo -e "${YELLOW}Step 4: Accessing /api/users/me WITHOUT token (should fail with 401)...${NC}"
echo "GET $BASE_URL/users/me"
curl -s -X GET $BASE_URL/users/me | json_pp
echo ""

# Step 5: Access protected route with INVALID token
echo -e "${YELLOW}Step 5: Accessing /api/users/me with INVALID token (should fail with 401)...${NC}"
echo "GET $BASE_URL/users/me"
echo "Authorization: Bearer invalid_token"
curl -s -X GET $BASE_URL/users/me \
  -H "Authorization: Bearer invalid_token" | json_pp
echo ""

echo -e "${GREEN}==================================="
echo "Phase 3 Tests Complete!"
echo "===================================${NC}"
echo ""
echo "Summary:"
echo "- User signup: Created $TEST_EMAIL"
echo "- User login: Received access token"
echo "- Protected route with token: Should return user profile"
echo "- Protected route without token: Should return 401"
echo "- Protected route with invalid token: Should return 401"
