require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

module.exports = {
  port: process.env.PORT || 3000,

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: '30d',

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD
  },

  upload: {
    maxSize: 50 * 1024 * 1024,
    allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  },

  image: {
    maxWidth: 1920,
    maxHeight: 1920
  }
};

if (!process.env.JWT_SECRET) {
  console.warn('\n⚠️  WARNING: JWT_SECRET not set. Set ADMIN_PASSWORD env var for production!\n');
}

if (!process.env.ADMIN_PASSWORD) {
  console.warn('\n⚠️  WARNING: ADMIN_PASSWORD not set. Admin password will be randomly generated on first startup.\n');
}