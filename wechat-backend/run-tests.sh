#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}  WeChat Mini Program Test Runner${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
echo ""

npm test

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  All tests passed!${NC}"
    echo -e "${GREEN}======================================${NC}"
else
    echo ""
    echo -e "${RED}======================================${NC}"
    echo -e "${RED}  Some tests failed!${NC}"
    echo -e "${RED}======================================${NC}"
    exit 1
fi