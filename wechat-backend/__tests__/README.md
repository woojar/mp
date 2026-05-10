# Testing Framework

This document describes the testing infrastructure for the WeChat Mini Program e-commerce store.

## Overview

- **Test Runner**: Jest
- **Test Files**: 4 test suites
- **Total Tests**: 46 passing tests
- **Coverage**: Backend API, authentication, business logic, utilities

## Test Structure

```
wechat-backend/
├── __tests__/
│   ├── auth.test.js         # Authentication tests (5 tests)
│   ├── admin-api.test.js    # Admin API tests (9 tests)
│   ├── database.test.js     # Business logic tests (14 tests)
│   └── utils.test.js        # Frontend utility tests (18 tests)
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Test setup hooks
├── package.json              # Test scripts
└── run-tests.sh             # Automation script
```

## Test Suites

### 1. Auth Tests (`auth.test.js`)
- Login with valid credentials
- Login with wrong password
- Login with missing credentials
- Login with empty username
- Health check endpoint

### 2. Admin API Tests (`admin-api.test.js`)
- GET products list
- Filter products by category
- Filter products by keyword
- Unauthorized access protection
- Create new product
- Create product with missing name
- GET categories list
- Create category
- Create category with missing name_zh

### 3. Database/Business Logic Tests (`database.test.js`)
- Calculate order total from items
- Apply discount correctly
- Stock validation (cannot be negative)
- Pagination calculation
- Total pages calculation
- Price formatting
- Filter products by status
- Generate order number
- Validate email format
- Calculate revenue from orders
- Convert categories to HTML options
- Format order status
- Truncate description

### 4. Utility Tests (`utils.test.js`)
- i18n translations (English/Chinese)
- Language switching
- Price formatting
- Date formatting
- Text truncation
- Phone number validation
- Email validation
- Required field validation
- Cart total calculation
- Coupon discount application
- Shipping fee calculation
- Group items by category
- Filter active products
- Sort by price

## Running Tests

### Option 1: Using npm
```bash
cd wechat-backend
npm test
```

### Option 2: Using automation script
```bash
# From project root
./run-tests.sh

# From backend directory
cd wechat-backend
./run-tests.sh
```

### Option 3: With options
```bash
./run-tests.sh --help          # Show help
./run-tests.sh --backend       # Backend tests only
./run-tests.sh --coverage      # With coverage report
./run-tests.sh --watch         # Watch mode
```

### Option 4: Direct Jest
```bash
cd wechat-backend
npx jest                       # Run all tests
npx jest --watch               # Watch mode
npx jest --coverage            # With coverage
npx jest --testNamePattern=""  # Run specific test
```

## Test Configuration

### `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['*.js', '!node_modules/'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./jest.setup.js']
};
```

### `package.json` scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "jest"
  }
}
```

## Adding New Tests

### Backend API Test
```javascript
describe('New Feature', () => {
  let app, token;

  beforeEach(async () => {
    // Setup
    app = express();
    token = await getToken(app);
  });

  test('should do something', async () => {
    const res = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
  });
});
```

### Utility Function Test
```javascript
describe('New Utility', () => {
  test('should format correctly', () => {
    const format = (value) => '¥' + value;
    expect(format(100)).toBe('¥100');
  });
});
```

## Test Best Practices

1. **Use descriptive test names**: `test('should return 401 for unauthorized request')`
2. **Group related tests**: Use `describe()` blocks
3. **Setup/TearDown**: Use `beforeEach()` and `afterEach()`
4. **Mock external dependencies**: Don't rely on real database/network
5. **Test edge cases**: Empty values, invalid inputs, boundary conditions
6. **Keep tests isolated**: Each test should be independent

## Coverage Report

Run with coverage to see detailed report:
```bash
npm test -- --coverage
```

Coverage includes:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

## CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# .gitlab-ci.yml example
test:
  script:
    - cd wechat-backend
    - npm install
    - npm test
  artifacts:
    when: always
    reports:
      junit: junit.xml
```

## Troubleshooting

### Tests not found
- Check that test files match `testMatch` pattern in `jest.config.js`
- Ensure test files end with `.test.js`

### Module not found
- Check path imports in test files
- Verify `moduleNameMapper` in config

### Timeout errors
- Increase `testTimeout` in config
- Check for hanging async operations

## Dependencies

- `jest` - Test framework
- `supertest` - HTTP assertions
- `express` - Web server (for API testing)

## Contact

For questions or issues, please refer to the project documentation.