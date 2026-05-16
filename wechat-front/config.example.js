// Environment-specific configuration
// Copy this file to config.local.js and update values

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