#!/bin/bash

# TRAINET Backend API Test Script
# This script tests the authentication endpoints

BASE_URL="http://localhost:5000/api"

echo "=================================="
echo "TRAINET Backend API Test"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
echo "GET $BASE_URL/health"
curl -s $BASE_URL/health | json_pp
echo ""
echo ""

# Test 2: Sign Up
echo -e "${YELLOW}Test 2: Sign Up${NC}"
echo "POST $BASE_URL/auth/signup"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }')
echo $SIGNUP_RESPONSE | json_pp
echo ""
echo ""

# Test 3: Login with test credentials
echo -e "${YELLOW}Test 3: Login${NC}"
echo "POST $BASE_URL/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }')
echo $LOGIN_RESPONSE | json_pp
echo ""
echo ""

# Test 4: Invalid Login
echo -e "${YELLOW}Test 4: Invalid Login (should fail)${NC}"
echo "POST $BASE_URL/auth/login"
curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }' | json_pp
echo ""
echo ""

echo -e "${GREEN}=================================="
echo "Tests completed!"
echo "==================================${NC}"
