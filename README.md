# WeChat Mini Program E-Commerce Store

A complete e-commerce solution with WeChat mini program frontend and Node.js backend.

## Project Structure

```
mp/
├── config.js                      # Environment-specific config
├── run-tests.sh                   # Test runner script
├── DEPLOYMENT.md                  # Deployment guide
│
├── wechat-backend/                # REST API Server
│   ├── config.js                 # Backend config
│   ├── server.js                 # Express server
│   ├── admin.js                  # Admin dashboard & API
│   ├── database.js               # SQLite operations
│   └── __tests__/                # Backend tests (46 tests)
│
└── wechat-front/                 # WeChat Mini Program
    ├── config.js                 # Frontend config
    ├── app.js                   # App entry
    ├── app.json                 # App config
    ├── pages/                   # 12 pages
    └── utils/                   # Utilities (i18n)
```

---

## Development Setup

### Prerequisites

#### 1. WeChat Mini Program DevTools
- Download from: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- Supported OS: Windows (64/32 bit) or macOS
- Requires WeChat account registered as **developer**

#### 2. Node.js
- Version 18+ recommended
- Install from: https://nodejs.org/

#### 3. Git
- For version control and cloning the project

### Getting Started

#### 1. Clone the Project
```bash
git clone <repository-url>
cd mp
```

#### 2. Setup Backend
```bash
cd wechat-backend
npm install
npm start
```
Backend runs at: `http://localhost:3000`

#### 3. Setup Frontend in WeChat DevTools
1. Open **WeChat DevTools**
2. Click **"+ New Project"**
3. Select the `wechat-front` folder
4. Enter your **AppID** (from mp.weixin.qq.com)
5. Select **"Default"** as project template
6. Click **"Create"**

#### 4. Configure Dev Environment
Edit `wechat-front/config.js`:
```javascript
module.exports = {
  development: {
    apiBase: 'http://localhost:3030/api',  // Your local backend
    appId: 'YOUR_DEV_APPID',
    env: 'dev'
  },
  ...
};
```

#### 5. Enable Local Debugging
1. In DevTools, go to **Settings → Extensions**
2. Enable **"Local Debugging"** (for localhost access)
3. Or use **HTTPS** with ngrok:
```bash
ngrok http 3000
# Update config.js with ngrok URL
```

---

## Production Deployment

### Backend Deployment (VPS)

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.

**Quick Deploy:**
```bash
# From project root
./deploy.sh
```

### Frontend Deployment

1. Go to **mp.weixin.qq.com**
2. Navigate to **管理 → 版本管理**
3. Click **"Upload"** in DevTools
4. Submit for review (if first time or major changes)

---

## Features

### Backend
- RESTful API for products, orders, cart, favorites
- Admin dashboard (products, categories, orders, banners)
- JWT authentication
- SQLite database with seed data
- Image upload with automatic resizing

### Frontend
| Page | Description |
|------|-------------|
| Home | Categories & product list with banners |
| Product | Detail page with images & description |
| Cart | Shopping cart with quantity management |
| Checkout | Address selection & order review |
| To-Pay | Order payment flow |
| Orders | Order history & status tracking |
| Order Detail | Single order view with actions |
| User | Profile with settings |
| Favorites | Saved products |
| Address | Address book management |
| Search | Product search functionality |

---

## Testing

```bash
# Run all tests
./run-tests.sh

# Backend only
cd wechat-backend && npm test

# Frontend only
cd wechat-front && npm test
```

---

## Configuration

### Local Development Setup

Copy example files for local development:

```bash
# Backend environment
cp wechat-backend/.env.example wechat-backend/.env.local

# Frontend config
cp wechat-front/config.example.js wechat-front/config.local.js
```

### Backend Environment Variables

### Frontend Config (`wechat-front/config.js`)

| Variable | Description | Required |
|----------|-------------|----------|
| `apiBase` | Backend API URL | Yes |
| `appId` | Mini Program AppID | Yes |

### Backend Config (`wechat-backend/config.js`)

| Variable | Description | Default |
|----------|-------------|---------|
| `port` | Server port | 3000 |
| `jwtSecret` | JWT signing secret | (dev only) |
| `upload.maxSize` | Max upload size | 50MB |
| `image.maxWidth` | Max image width | 1920px |

### Environment Variables

> **⚠️ Security Warning:** Set these in production to prevent unauthorized access

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | **Yes** |
| `ADMIN_USERNAME` | Admin panel username | No (default: admin) |
| `ADMIN_PASSWORD` | Admin panel password | **Yes** |

### Admin Panel

**First startup generates credentials:**
```bash
# If ADMIN_PASSWORD is not set, a random password is generated
# Check server logs for the generated password

# Set credentials explicitly:
export ADMIN_USERNAME=myadmin
export ADMIN_PASSWORD=your-secure-password
export JWT_SECRET=your-jwt-secret-min-32-chars

npm start
```

---

## Common Tasks

### Add New Product
1. Login to admin panel: `http://localhost:3000/admin`
2. Use credentials set via `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Navigate to **Products** → **Add New**

### Reset Database
```bash
cd wechat-backend
rm store.db
npm start  # Reinitializes with seed data, generates new admin credentials
```

### Check Server Logs
```bash
pm2 logs server
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | WeChat Mini Program (WXML, WXSS, JS) |
| Backend | Node.js, Express.js |
| Database | SQLite (sql.js) |
| Auth | JWT |
| Testing | Jest, Supertest |

---

## Support

- Backend README: [wechat-backend/README.md](wechat-backend/README.md)
- Test docs: [wechat-backend/__tests__/README.md](wechat-backend/__tests__/README.md)
- WeChat Docs: https://developers.weixin.qq.com/miniprogram/dev/

---

## License

MIT