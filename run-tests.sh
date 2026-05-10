#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   WeChat Mini Program Test Suite      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
MODE="all"
COMPONENT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend|-b)
            MODE="backend"
            shift
            ;;
        --frontend|-f)
            MODE="frontend"
            shift
            ;;
        --watch|-w)
            MODE="watch"
            shift
            ;;
        --coverage|-c)
            MODE="coverage"
            shift
            ;;
        --help|-h)
            echo "Usage: ./run-tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  --backend, -b     Run backend tests only"
            echo "  --frontend, -f    Run frontend tests only"
            echo "  --watch, -w       Run tests in watch mode"
            echo "  --coverage, -c    Run tests with coverage"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh           Run all tests"
            echo "  ./run-tests.sh -b       Run backend tests"
            echo "  ./run-tests.sh -c       Run with coverage"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

cd /home/jeffrey/workspace/mp/wechat-backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Run tests based on mode
case $MODE in
    all)
        echo -e "${YELLOW}Running all tests...${NC}"
        npm test
        ;;
    backend)
        echo -e "${YELLOW}Running backend tests...${NC}"
        npm test -- --testPathPattern="__tests__"
        ;;
    frontend)
        echo -e "${YELLOW}Running frontend tests...${NC}"
        echo "Frontend tests are included in main test suite"
        npm test -- --testPathPattern="utils"
        ;;
    watch)
        echo -e "${YELLOW}Running tests in watch mode...${NC}"
        npm test -- --watch
        ;;
    coverage)
        echo -e "${YELLOW}Running tests with coverage...${NC}"
        npm test -- --coverage
        ;;
esac

# Output result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo ""
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi