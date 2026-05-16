# WeChat Mini Program E-Commerce Project

## Project Overview

A full-stack WeChat Mini Program e-commerce application with:
- **Frontend**: WeChat Mini Program (wechat-front/)
- **Backend**: Node.js + Express + SQLite (wechat-backend/)

## Development Workflow

### 1. Make Changes
- Edit frontend or backend code
- Add new features or fix bugs

### 2. Run Tests (REQUIRED BEFORE DEPLOY)

**Backend Tests:**
```bash
cd wechat-backend
npm test
```

**Frontend Tests:**
```bash
cd wechat-front
npm test
```

**All tests must pass before proceeding!**

### 3. Commit Changes
```bash
git add -A
git commit -m "type: Description of changes"
```

**Commit types:**
- `fix:` - Bug fixes
- `feat:` - New features
- `test:` - Adding tests
- `docs:` - Documentation
- `chore:` - Maintenance

### 4. Push to GitHub
```bash
git push origin main
```

### 5. Deploy to VPS
```bash
ssh user@your-domain.com 'cd /var/www/mp/wechat-backend && git pull origin main && npm install --production && pm2 restart server'
```

### 6. Verify Deployment
```bash
# Check server status
ssh user@your-domain.com 'pm2 status'

# View logs
ssh user@your-domain.com 'pm2 logs server --lines 30'

# Run tests on VPS
ssh user@your-domain.com 'cd /var/www/mp/wechat-backend && npm test'
```

## Quick Deploy Command

```bash
git add -A && git commit -m "type: Message" && git push origin main && ssh user@your-domain.com 'cd /var/www/mp/wechat-backend && git pull origin main && npm install --production && pm2 restart server'
```

## Testing Guidelines (ALWAYS RUN BEFORE DEPLOY!)

### Backend Tests (wechat-backend/)
```bash
cd wechat-backend && npm test
```
- 59 tests covering orders, payment, auth, admin API, database

### Frontend Tests (wechat-front/)
```bash
cd wechat-front && npm test
```
- 40 tests covering i18n, payment flow, checkout, to-pay page, search

### Test Coverage
- **i18n Utils** - Language switching, translations
- **Payment Flow** - Cart calculations, order totals, validation
- **Checkout Flow** - Order submission, payment handling
- **to-pay Page** - Order data parsing, payment params, payment status
- **Search Functionality** - Filter, sort, pagination

**IMPORTANT: All tests must pass before deploying!**

## Important Rules

1. **ALWAYS run tests before deploying** - Both backend and frontend
2. **ALL tests must pass** - Do not deploy if tests fail
3. **Commit with meaningful messages** - Use conventional commits
4. **Test on VPS after deploy** - Run `npm test` on VPS to verify
5. **Check logs** - Use `pm2 logs` to verify no errors

## VPS Information

> **Note:** Update with your actual server details

- **SSH**: `user@your-domain.com`
- **Backend Path**: `/var/www/mp/wechat-backend`
- **Backend URL**: `https://your-domain.com:3030`
- **Admin Panel**: `https://your-domain.com:3030/admin`
- **Process Manager**: PM2 (`pm2 restart server`)

## Common Issues

### Tests Fail
- Fix the failing tests
- Re-run `npm test` until all pass
- Do NOT deploy until tests pass

### Deployment Fails
- Check VPS logs: `ssh user@your-domain.com 'pm2 logs server'`
- Verify git pull succeeded
- Check npm install completed
- Restart: `pm2 restart server`

### 413 Upload Error
- Fix: Add `client_max_body_size 100M;` to nginx.conf
- Reload: `nginx -t && systemctl reload nginx`

### Connection Refused
- Check server is running: `pm2 status`
- Check firewall: `ufw status`
- Check port: `netstat -tlnp | grep 3030`

## Project Structure

```
mp/
├── wechat-backend/          # Backend API
│   ├── __tests__/          # Backend tests (59 tests)
│   ├── server.js           # Main server
│   ├── database.js         # Database operations
│   ├── admin.js            # Admin panel
│   └── package.json
├── wechat-front/           # WeChat Mini Program
│   ├── __tests__/         # Frontend tests (34 tests)
│   ├── pages/             # Mini program pages
│   ├── utils/             # Utilities (i18n)
│   └── package.json
├── DEPLOYMENT.md          # Deployment guide
├── config.js              # Frontend config
└── README.md              # Project documentation
```

## Configuration

### Frontend Config (wechat-front/config.js)
```javascript
module.exports = {
  development: {
    apiBase: 'http://localhost:3030/api',
    appId: 'YOUR_DEV_APPID',
    env: 'dev'
  },
  production: {
    apiBase: 'https://your-domain.com:3030/api',
    appId: 'YOUR_PROD_APPID',
    env: 'prod'
  }
};
```

### Backend Config (wechat-backend/config.js)
```javascript
module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '30d',
  upload: {
    maxSize: 50 * 1024 * 1024,
    allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  },
  image: {
    maxWidth: 1920,
    maxHeight: 1920
  }
};
```

## Test Coverage

**Total: 93+ automated tests**
- Backend: 59 tests
- Frontend: 34+ tests

**Test before EVERY deployment!**