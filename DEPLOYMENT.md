# Deployment Guide

This guide covers deploying the WeChat Mini Program backend to a VPS.

---

## Prerequisites

### Server Requirements
- Ubuntu/Debian Linux (tested on 20.04+)
- SSH access with sudo privileges
- Domain name pointing to server IP
- Nginx installed and configured
- PM2 for process management

### Local Requirements
- Git installed
- SSH key added to server (passwordless SSH)

---

## Configuration

### 1. Update Config Files

**Frontend Config** (`wechat-frontend/config.js`):
```javascript
production: {
  apiBase: 'https://your-domain.com:3030/api',
  appId: 'YOUR_PROD_APPID',
  env: 'prod'
}
```

**Backend Config** (`wechat-backend/config.js`):
```javascript
// For production, use environment variable:
const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  ...
};
```

### 2. Set Production Secrets
```bash
# On VPS, create environment file
sudo nano /etc/environment

# Add these lines:
JWT_SECRET=your-secure-jwt-secret-min-32-chars
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password

# Reload
source /etc/environment
```

---

## Deployment Steps

### Step 1: Initial Server Setup

SSH to your server and install dependencies:

```bash
ssh user@your-server.com

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Create directory
sudo mkdir -p /var/www/mp
sudo chown $USER:$USER /var/www/mp
```

### Step 2: Configure Nginx

Create `/etc/nginx/sites-available/mp-backend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mp-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Setup HTTPS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 4: Deploy Backend

From your local machine:

```bash
# Clone/pull repository
cd /path/to/mp
git pull origin main

# Sync to server
rsync -avz --exclude='node_modules' --exclude='.git' \
  wechat-backend/ user@your-server.com:/var/www/mp/wechat-backend/

# Or use git on server
ssh user@your-server.com
cd /var/www/mp/wechat-backend
git pull origin main
```

### Step 5: Install Dependencies & Start

```bash
ssh user@your-server.com << 'ENDSSH'
cd /var/www/mp/wechat-backend
npm install --production
pm2 stop server 2>/dev/null || true
pm2 start server.js --name server
pm2 save
pm2 startup  # Enable on boot
ENDSSH
```

---

## Standard Deployment Workflow

### Option 1: Manual Deploy

```bash
# 1. Commit changes locally
git add -A
git commit -m "Your commit message"
git push origin main

# 2. SSH and pull
ssh user@your-server.com << 'ENDSSH'
cd /var/www/mp/wechat-backend
git pull origin main
npm install --production
pm2 restart server
ENDSSH
```

### Option 2: Using deploy.sh

```bash
# Edit deploy.sh with your server details, then run:
./deploy.sh
```

---

## Verify Deployment

### Check Server Status
```bash
# On server
pm2 status
pm2 logs server --lines 50
```

### Test API
```bash
curl https://your-domain.com/api/categories
curl https://your-domain.com/api/products
```

### Check in WeChat DevTools
1. Open project in DevTools
2. Update `config.js` with production URL
3. Test in **Debug** mode

---

## VPS Information

> **Note:** Update these values with your actual server details

| Item | Value |
|------|-------|
| Server | `your-domain.com` |
| Backend Path | `/var/www/mp/wechat-backend` |
| Backend URL | `https://your-domain.com:3030` |
| Admin Panel | `https://your-domain.com:3030/admin` |
| SSH User | `user@your-domain.com` |

---

## Common Tasks

### Restart Server
```bash
ssh user@your-server.com 'pm2 restart server'
```

### View Logs
```bash
ssh user@your-server.com 'pm2 logs server --lines 100'
```

### Update Without Downtime
```bash
# 1. Pull changes
ssh user@your-server.com 'cd /var/www/mp/wechat-backend && git pull'

# 2. Install deps (if package.json changed)
ssh user@your-server.com 'cd /var/www/mp/wechat-backend && npm install --production'

# 3. Graceful restart
ssh user@your-server.com 'pm2 reload server'
```

### Rollback
```bash
ssh user@your-server.com 'pm2 reset server'
ssh user@your-server.com 'cd /var/www/mp/wechat-backend && git log --oneline -5'
ssh user@your-server.com 'cd /var/www/mp/wechat-backend && git revert HEAD'
```

### Database Operations
```bash
# View tables
ssh user@your-server.com 'cd /var/www/mp/wechat-backend && sqlite3 store.db ".tables"'

# View recent orders
ssh user@your-server.com 'cd /var/www/mp/wechat-backend && sqlite3 store.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"'

# Reset database
ssh user@your-server.com 'cd /var/www/mp/wechat-backend && rm store.db && pm2 restart server'
```

---

## Troubleshooting

### Login Fails
1. Check backend: `pm2 logs server | grep -i login`
2. Verify JWT secret matches
3. Check API is accessible: `curl https://your-domain.com/api/products`

### Upload Fails (413 Error)
```bash
ssh user@your-server.com 'sudo nano /etc/nginx/nginx.conf'
# Add inside http block:
client_max_body_size 100M;
# Then:
sudo nginx -t && sudo systemctl reload nginx
```

### Images Not Loading
1. Check uploads folder: `ls -la /var/www/mp/wechat-backend/uploads/`
2. Verify Nginx static file serving
3. Ensure HTTPS is configured (WeChat requires HTTPS)

### WeChat Pay Not Working
1. Verify merchant account at pay.weixin.qq.com
2. Check AppID binding in mp.weixin.qq.com
3. Configure payment credentials in backend
4. Test with sandbox: https://pay.weixin.qq.com/sandbox

### Server Won't Start
```bash
pm2 logs server
# Check for port conflicts
netstat -tlnp | grep 3000
# Check Node version
node --version  # Should be 18+
```

---

## Security Checklist

- [ ] Set `JWT_SECRET` environment variable (min 32 chars)
- [ ] Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables
- [ ] Enable HTTPS with valid certificate
- [ ] Disable directory listing in Nginx
- [ ] Set proper file permissions: `chmod -R 755 /var/www/mp`
- [ ] Regular backups of `store.db`
- [ ] Monitor server with PM2 monit
- [ ] Passwords are hashed with bcrypt (10 rounds)

---

## Backup & Recovery

### Backup Database
```bash
ssh user@your-server.com 'cp /var/www/mp/wechat-backend/store.db /var/www/mp/wechat-backend/store.db.$(date +%Y%m%d)'
```

### Backup Uploads
```bash
ssh user@your-server.com 'tar -czf uploads-backup.tar.gz -C /var/www/mp/wechat-backend uploads'
```

### Restore
```bash
ssh user@your-server.com 'cp /var/www/mp/wechat-backend/store.db.20240101 /var/www/mp/wechat-backend/store.db'
ssh user@your-server.com 'pm2 restart server'
```