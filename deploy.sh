#!/bin/bash

# Deploy wechat-backend to VPS

VPS_HOST="mp1.woojar.com"
VPS_USER="root"
VPS_PATH="/var/www/wechat-backend"

echo "=== Deploying Backend ==="
echo "Uploading files to VPS..."
scp -r /home/jeffrey/workspace/mp/wechat-backend/* ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo "Installing dependencies on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /var/www/wechat-backend
npm install --production
pm2 restart wechat-backend || pm2 start server.js --name wechat-backend
pm2 save

# Setup nginx if config exists
if [ -f /etc/nginx/sites-available/wechat ]; then
    nginx -t && systemctl reload nginx
fi
ENDSSH

echo ""
echo "=== Backend Deployment Complete ==="
echo "Test: curl https://${VPS_HOST}/api/products"
echo ""
echo "=== Frontend ==="
echo "Upload wechat-front to WeChat DevTools manually"
echo "API Base: https://${VPS_HOST}/api"
