# Deployment Workflow for WeChat Mini Program

## Standard Deployment Process

### 1. Commit Changes Locally
```bash
cd /home/jeffrey/workspace/mp
git add -A
git commit -m "fix: Description of changes"
```

### 2. Push to GitHub
```bash
git push origin main
```

### 3. SSH to VPS and Sync
```bash
ssh jeffrey@mp1.woojar.com << 'ENDSSH'
cd /var/www/mp/wechat-backend
git pull origin main
npm install --production
pm2 restart server
pm2 logs server --lines 30
ENDSSH
```

### 4. Verify Deployment
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs server`
- Test in WeChat DevTools

## Quick Deploy Command

```bash
# One-liner deploy
cd /home/jeffrey/workspace/mp && git add -A && git commit -m "fix: Update" && git push origin main && ssh jeffrey@mp1.woojar.com 'cd /var/www/mp/wechat-backend && git pull origin main && npm install --production && pm2 restart server'
```

## VPS Information

- **Backend Path**: `/var/www/mp/wechat-backend`
- **Frontend Path**: `/home/jeffrey/workspace/mp/wechat-front` (upload via WeChat DevTools)
- **Backend URL**: `https://mp1.woojar.com:3030`
- **Admin Panel**: `https://mp1.woojar.com:3030/admin`
- **SSH User**: `jeffrey@mp1.woojar.com`

## Common Tasks

### Check Server Status
```bash
ssh jeffrey@mp1.woojar.com 'pm2 status'
```

### View Logs
```bash
ssh jeffrey@mp1.woojar.com 'pm2 logs server --lines 50'
```

### Restart Server
```bash
ssh jeffrey@mp1.woojar.com 'pm2 restart server'
```

### Fix Nginx Upload Limit (413 Error)
```bash
ssh jeffrey@mp1.woojar.com 'echo "client_max_body_size 100M;" | sudo tee -a /etc/nginx/nginx.conf && sudo nginx -t && sudo systemctl reload nginx'
```

### Check Database
```bash
ssh jeffrey@mp1.woojar.com 'cd /var/www/mp/wechat-backend && sqlite3 store.db ".tables"'
ssh jeffrey@mp1.woojar.com 'cd /var/www/mp/wechat-backend && sqlite3 store.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"'
```

## Troubleshooting

### Login Fails
1. Check backend logs: `pm2 logs server`
2. Verify database has users table
3. Check API endpoint: `curl https://mp1.woojar.com:3030/api/auth/login`

### Upload Fails (413)
1. Fix nginx: Add `client_max_body_size 100M;` to `/etc/nginx/nginx.conf`
2. Reload nginx: `nginx -t && systemctl reload nginx`

### Orders Not Showing
1. Check order creation logs in `pm2 logs server`
2. Verify frontend is calling correct API endpoint
3. Check token is being sent in Authorization header

### Images Not Loading
1. Verify uploads folder exists: `ls -la /var/www/mp/wechat-backend/uploads/`
2. Check nginx static file config
3. Ensure HTTPS is used (WeChat requires HTTPS)
