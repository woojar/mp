#!/bin/bash

# Deploy wechat-backend to VPS
# Update these values for your environment

VPS_HOST="your-domain.com"
VPS_USER="your-username"
VPS_PATH="/var/www/mp/wechat-backend"

echo "=== Deploying Backend ==="
echo "Uploading files to VPS..."
scp -r ./wechat-backend/* ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo "Installing dependencies on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd ${VPS_PATH}
npm install --production
pm2 restart server || pm2 start server.js --name server
pm2 save

# Setup nginx if config exists
if [ -f /etc/nginx/sites-available/mp-backend ]; then
    nginx -t && systemctl reload nginx
fi
ENDSSH

echo ""
echo "=== Backend Deployment Complete ==="
echo "Test: curl https://${VPS_HOST}/api/products"
echo ""
echo "=== Frontend ==="
echo "Upload wechat-frontend to WeChat DevTools manually"
echo "API Base: https://${VPS_HOST}/api"