# WeChat Mini Program Store - Backend

A complete e-commerce backend for WeChat mini program with admin dashboard.

## Quick Start

1. Install dependencies:
```bash
cd wechat-backend
npm install
```

2. Start server:
```bash
npm start
```

Server runs at `http://localhost:3000`

## Project Structure

```
wechat-backend/
├── server.js           # Main Express server
├── database.js         # SQLite database operations
├── admin.js            # Admin API routes & dashboard
├── package.json        # Dependencies
├── store.db            # SQLite database (auto-created)
└── __tests__/          # Test files
    ├── auth.test.js
    ├── admin-api.test.js
    ├── database.test.js
    ├── utils.test.js
    └── README.md
```

## Features

### User API
- Product listing, search, filtering
- Shopping cart management
- Order creation and tracking
- Favorites management
- Address book
- User authentication

### Admin Dashboard
Access at: `http://localhost:3000/admin`

**Login**: username `admin`, password `admin123`

| Feature | Description |
|---------|-------------|
| Dashboard | Stats (products, orders, revenue) |
| Products | CRUD with search, filter, pagination |
| Categories | Add/edit/delete categories |
| Orders | View details, update status |
| Banners | Manage home page banners |

### Admin API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET/POST | `/api/admin/products` | List/create products |
| PUT/DELETE | `/api/admin/products/:id` | Update/delete product |
| GET/POST | `/api/admin/categories` | List/create categories |
| GET/POST | `/api/admin/orders` | List orders |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET/POST | `/api/admin/banners` | List/create banners |

## Testing

Run all tests:
```bash
npm test
```

Run with options:
```bash
./run-tests.sh --coverage   # With coverage report
./run-tests.sh --watch      # Watch mode
```

See `__tests__/README.md` for detailed testing documentation.

**Test Coverage**: 46 tests across 4 test suites
- Authentication tests
- Admin API tests
- Business logic tests
- Utility function tests

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get products (supports ?category=1&keyword=xxx&page=1&limit=20) |
| GET | `/api/products/new-arrivals` | New arrivals |
| GET | `/api/products/hot-sales` | Hot sales |
| GET | `/api/products/:id` | Get product detail |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart/add` | Add to cart |
| PUT | `/api/cart/:id` | Update quantity |
| DELETE | `/api/cart/:id` | Remove item |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | Get user orders |
| GET | `/api/orders/:id` | Get order detail |
| PUT | `/api/orders/:id/cancel` | Cancel order |
| POST | `/api/orders/:id/pay` | Simulate payment |
| PUT | `/api/orders/:id/confirm` | Confirm receipt |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get categories |
| GET | `/api/banners` | Get active banners |
| GET/POST/PUT/DELETE | `/api/addresses` | Address management |
| GET/POST/DELETE | `/api/favorites` | Favorites management |
| GET/PUT | `/api/auth/profile` | User profile |

## Database

SQLite database (`store.db`) is auto-created on first run with seed data:
- 4 categories (Food, Drinks, Daily Use, Snacks)
- 6 sample products
- 2 sample banners
- Admin user: `admin` / `admin123`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| JWT_SECRET | (random) | JWT signing secret |

## For Production

1. Change `apiBase` in mini program to production server URL
2. Use HTTPS in production
3. Add proper database (PostgreSQL/MySQL recommended)
4. Add WeChat Pay integration
5. Add WeChat login verification
6. Configure proper JWT secret

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (sql.js)
- **Auth**: JWT
- **Testing**: Jest + Supertest