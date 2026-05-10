# WeChat Mini Program E-Commerce Store

A complete e-commerce solution with WeChat mini program frontend and Node.js backend.

## Project Structure

```
mp/
├── run-tests.sh              # Test runner script
│
├── wechat-backend/           # REST API Server
│   ├── README.md             # Backend documentation
│   ├── server.js             # Express server
│   ├── admin.js              # Admin dashboard & API
│   ├── database.js           # SQLite operations
│   └── __tests__/            # Test files (46 tests)
│
└── wechat-front/             # WeChat Mini Program
    ├── app.js                # App entry
    ├── app.json              # App config
    ├── pages/                # 11 pages
    └── utils/                # Utilities (i18n)
```

## Quick Start

### Backend

```bash
cd wechat-backend
npm install
npm start
```

Server runs at: `http://localhost:3000`

**Admin Panel**: `http://localhost:3000/admin`  
Login: `admin` / `admin123`

### Frontend

Import project into WeChat DevTools and run.

## Features

### Backend
- RESTful API for products, orders, cart, favorites
- Admin dashboard (products, categories, orders, banners management)
- JWT authentication
- SQLite database with seed data

### Frontend
- Home page with categories & product list
- Product detail with images & description
- Shopping cart with quantity management
- Checkout & order creation
- User profile with order history
- Address management
- Favorites
- Product search
- Multi-language support (EN/ZH)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/products` | Products list with pagination |
| `/api/categories` | Categories list |
| `/api/cart` | Cart management |
| `/api/orders` | Order CRUD |
| `/api/addresses` | Address book |
| `/api/favorites` | Favorites |
| `/api/admin/*` | Admin APIs |
| `/admin` | Admin dashboard (HTML) |

## Testing

```bash
# Run all tests (46 tests)
./run-tests.sh

# With coverage
./run-tests.sh --coverage

# From backend directory
cd wechat-backend && npm test
```

## Documentation

- [Backend README](wechat-backend/README.md) - Detailed backend docs
- [Testing README](wechat-backend/__tests__/README.md) - Test documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | WeChat Mini Program (WXML, WXSS, JS) |
| Backend | Node.js, Express.js |
| Database | SQLite (sql.js) |
| Auth | JWT |
| Testing | Jest, Supertest |

## Default Data

- **Admin**: `admin` / `admin123`
- **Categories**: Food, Drinks, Daily Use, Snacks
- **Products**: 6 sample products
- **Banners**: 2 sample banners

## License

MIT