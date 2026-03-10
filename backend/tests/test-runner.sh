#!/bin/bash

# TRAINET Backend Test Runner
# Automated test execution script

echo "=============================================="
echo "TRAINET Backend API Tests"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
  echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Please create a .env file with required environment variables"
  exit 1
fi

# Run tests
echo -e "${BLUE}Running tests...${NC}"
echo ""

npm test

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}=============================================="
  echo "All tests passed! ✓"
  echo "==============================================${NC}"
else
  echo ""
  echo -e "${RED}=============================================="
  echo "Some tests failed! ✗"
  echo "==============================================${NC}"
  exit 1
fi
