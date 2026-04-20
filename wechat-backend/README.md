# WeChat Mini Program Store - Backend

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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get products (supports ?category=1&keyword=xxx) |
| GET | `/api/products/:id` | Get product detail |
| POST | `/api/auth/login` | User login |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | Get user orders |

## For Production

1. Change `apiBase` in `app.js` to your production server URL
2. Use HTTPS in production
3. Add database (MongoDB/MySQL) for data persistence
4. Add WeChat Pay integration