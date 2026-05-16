const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const {
  initializeDatabase,
  getDb,
  userOps,
  categoryOps,
  productOps,
  addressOps,
  cartOps,
  orderOps,
  favoriteOps,
  bannerOps,
  adminOps,
  adminCategoryOps,
  adminBannerOps,
  adminOrderOps,
  adminProductOps
} = require('./database');

const config = require('./config');

const app = express();
const PORT = config.port;
const JWT_SECRET = config.jwtSecret;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const resizeImage = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    const metadata = await sharp(req.file.path).metadata();
    const maxSize = 1920;
    
    if (metadata.width > maxSize || metadata.height > maxSize) {
      const tempPath = req.file.path + '.tmp';
      await sharp(req.file.path)
        .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
        .toFile(tempPath);
      
      await fs.rename(tempPath, req.file.path);
    }
    
    req.file.url = '/uploads/' + req.file.filename;
    next();
  } catch (err) {
    console.error('Resize error:', err.message);
    next(err);
  }
};

// Error handling middleware for file uploads
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, message: 'File too large' });
  }
  if (err.message && err.message.includes('image')) {
    return res.status(400).json({ code: 400, message: err.message });
  }
  console.error('Upload error:', err.message);
  res.status(500).json({ code: 500, message: 'Upload failed: ' + err.message });
});

function generateToken(user) {
  return jwt.sign({ id: user.id, openid: user.openid }, JWT_SECRET, { expiresIn: '30d' });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: 'Invalid token' });
  }
}

function success(data = null, message = 'success') {
  return { code: 0, message, data };
}

function error(code, message) {
  return { code, message };
}

async function startServer() {
  await initializeDatabase();
  
  const { adminRouter } = require('./admin');
  
  app.post('/api/auth/login', (req, res) => {
    const { code, userInfo } = req.body;
    
    console.log('=== LOGIN REQUEST ===');
    console.log('Code:', code ? 'exists' : 'MISSING');
    console.log('UserInfo:', userInfo);
    
    if (!code) {
      console.log('Login failed: code is required');
      return res.json(error(400, 'Code is required'));
    }
    
    try {
      const openid = 'wx_' + code.substring(0, 20) + '_' + Date.now();
      console.log('Generated openid:', openid);
      
      let user = userOps.findByOpenid(openid);
      console.log('Existing user:', user ? 'found' : 'not found');
      
      if (!user) {
        console.log('Creating new user...');
        user = userOps.create(openid, userInfo || {});
        console.log('Created user:', user);
      } else if (userInfo) {
        user = userOps.update(user.id, userInfo);
      }
      
      if (!user) {
        console.error('User is null after create/find');
        return res.json(error(500, 'Failed to create user'));
      }
      
      console.log('Generating token for user:', user.id);
      const token = generateToken(user);
      
      console.log('Login successful');
      res.json(success({
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          language: user.language
        }
      }));
    } catch (err) {
      console.error('Login error:', err.message);
      console.error('Stack:', err.stack);
      res.json(error(500, 'Login failed: ' + err.message));
    }
  });

  app.get('/api/auth/profile', authenticate, (req, res) => {
    const user = userOps.findById(req.user.id);
    if (!user) {
      return res.json(error(404, 'User not found'));
    }
    res.json(success({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      language: user.language
    }));
  });

  app.put('/api/auth/profile', authenticate, (req, res) => {
    const { nickname, avatar, phone, language } = req.body;
    const user = userOps.update(req.user.id, { nickname, avatar, phone, language });
    res.json(success({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      language: user.language
    }));
  });

  app.get('/api/categories', (req, res) => {
    const categories = categoryOps.findAll();
    res.json(success(categories));
  });

  app.get('/api/banners', (req, res) => {
    const banners = bannerOps.findActive();
    res.json(success(banners));
  });

  app.get('/api/products', (req, res) => {
    const { page = 1, limit = 20, category, keyword } = req.query;
    const result = productOps.findAll({ page: parseInt(page), limit: parseInt(limit), category, keyword });
    res.json(success(result));
  });

  app.get('/api/products/new-arrivals', (req, res) => {
    const { limit = 10 } = req.query;
    const result = productOps.findAll({ page: 1, limit: parseInt(limit) });
    res.json(success(result.products));
  });

  app.get('/api/products/hot-sales', (req, res) => {
    const { limit = 10 } = req.query;
    const products = productOps.findAll({ page: 1, limit: parseInt(limit) });
    res.json(success(products.products));
  });

  app.get('/api/products/:id', (req, res) => {
    const product = productOps.findById(parseInt(req.params.id));
    if (!product) {
      return res.json(error(404, 'Product not found'));
    }
    res.json(success(product));
  });

  app.get('/api/cart', authenticate, (req, res) => {
    const cartItems = cartOps.findByUser(req.user.id);
    res.json(success(cartItems));
  });

  app.post('/api/cart/add', authenticate, (req, res) => {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.json(error(400, 'Product ID is required'));
    }
    
    const product = productOps.findById(productId);
    if (!product) {
      return res.json(error(404, 'Product not found'));
    }
    
    if (product.stock < quantity) {
      return res.json(error(400, 'Insufficient stock'));
    }
    
    cartOps.add(req.user.id, productId, quantity);
    res.json(success(null, 'Added to cart'));
  });

  app.put('/api/cart/:id', authenticate, (req, res) => {
    const { quantity } = req.body;
    const cartId = parseInt(req.params.id);
    
    if (quantity === undefined || quantity < 0) {
      return res.json(error(400, 'Invalid quantity'));
    }
    
    cartOps.update(cartId, req.user.id, quantity);
    res.json(success(null, 'Cart updated'));
  });

  app.delete('/api/cart/:id', authenticate, (req, res) => {
    const cartId = parseInt(req.params.id);
    cartOps.remove(cartId, req.user.id);
    res.json(success(null, 'Item removed'));
  });

  app.delete('/api/cart', authenticate, (req, res) => {
    cartOps.clear(req.user.id);
    res.json(success(null, 'Cart cleared'));
  });

  app.get('/api/addresses', authenticate, (req, res) => {
    const addresses = addressOps.findByUser(req.user.id);
    res.json(success(addresses));
  });

  app.post('/api/addresses', authenticate, (req, res) => {
    const { name, phone, province, city, district, detail, is_default } = req.body;
    
    if (!name || !phone || !detail) {
      return res.json(error(400, 'Name, phone and detail are required'));
    }
    
    const address = addressOps.create(req.user.id, { name, phone, province, city, district, detail, is_default });
    res.json(success(address));
  });

  app.put('/api/addresses/:id', authenticate, (req, res) => {
    const addressId = parseInt(req.params.id);
    const { name, phone, province, city, district, detail, is_default } = req.body;
    
    const address = addressOps.findById(addressId);
    if (!address || address.user_id !== req.user.id) {
      return res.json(error(404, 'Address not found'));
    }
    
    const updated = addressOps.update(addressId, req.user.id, { name, phone, province, city, district, detail, is_default });
    res.json(success(updated));
  });

  app.delete('/api/addresses/:id', authenticate, (req, res) => {
    const addressId = parseInt(req.params.id);
    addressOps.delete(addressId, req.user.id);
    res.json(success(null, 'Address deleted'));
  });

  app.get('/api/favorites', authenticate, (req, res) => {
    const favorites = favoriteOps.findByUser(req.user.id);
    res.json(success(favorites));
  });

  app.post('/api/favorites/:productId', authenticate, (req, res) => {
    const productId = parseInt(req.params.productId);
    const product = productOps.findById(productId);
    
    if (!product) {
      return res.json(error(404, 'Product not found'));
    }
    
    favoriteOps.add(req.user.id, productId);
    res.json(success(null, 'Added to favorites'));
  });

  app.delete('/api/favorites/:productId', authenticate, (req, res) => {
    const productId = parseInt(req.params.productId);
    favoriteOps.remove(req.user.id, productId);
    res.json(success(null, 'Removed from favorites'));
  });

  app.get('/api/favorites/check/:productId', authenticate, (req, res) => {
    const productId = parseInt(req.params.productId);
    const favorite = favoriteOps.check(req.user.id, productId);
    res.json(success({ isFavorited: !!favorite }));
  });

  app.post('/api/orders', authenticate, (req, res) => {
    console.log('=== ORDER CREATION ===');
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);
    
    const { items, totalPrice, discountPrice = 0, actualPrice, addressId, address, remark, clearCart = true } = req.body;
    
    if (!items || items.length === 0) {
      console.log('Order failed: items required');
      return res.json(error(400, 'Items are required'));
    }
    
    if (!actualPrice) {
      console.log('Order failed: actual price required');
      return res.json(error(400, 'Actual price is required'));
    }
    
    for (const item of items) {
      const product = productOps.findById(item.productId);
      if (!product) {
        console.log('Order failed: product not found', item.productId);
        return res.json(error(404, `Product ${item.productId} not found`));
      }
      if (product.stock < item.quantity) {
        console.log('Order failed: insufficient stock', product.name);
        return res.json(error(400, `Insufficient stock for ${product.name}`));
      }
    }
    
    try {
      console.log('Creating order...');
      const order = orderOps.create(req.user.id, {
        items,
        totalPrice,
        discountPrice,
        actualPrice,
        addressId,
        address,
        remark,
        clearCart
      });
      
      console.log('Order created:', order);
      res.json(success(order));
    } catch (err) {
      console.error('Order creation error:', err.message, err.stack);
      res.status(500).json(error(500, 'Order failed: ' + err.message));
    }
  });

  app.get('/api/orders', authenticate, (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const result = orderOps.findByUser(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    
    const ordersWithItems = result.orders.map(order => {
      const items = orderOps.findById(order.id, req.user.id)?.items || [];
      return { ...order, items };
    });
    
    res.json(success({
      orders: ordersWithItems,
      total: result.total,
      page: result.page,
      limit: result.limit
    }));
  });

  app.get('/api/orders/:id', authenticate, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orderOps.findById(orderId, req.user.id);
    
    if (!order) {
      return res.json(error(404, 'Order not found'));
    }
    
    res.json(success(order));
  });

  app.put('/api/orders/:id/cancel', authenticate, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orderOps.findById(orderId, req.user.id);
    
    if (!order) {
      return res.json(error(404, 'Order not found'));
    }
    
    if (order.status !== 'pending') {
      return res.json(error(400, 'Only pending orders can be cancelled'));
    }
    
    orderOps.updateStatus(orderId, req.user.id, 'cancelled');
    res.json(success(null, 'Order cancelled'));
  });

  app.post('/api/orders/:id/pay', authenticate, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orderOps.findById(orderId, req.user.id);
    
    if (!order) {
      return res.json(error(404, 'Order not found'));
    }
    
    if (order.status !== 'pending') {
      return res.json(error(400, 'Order cannot be paid'));
    }
    
    const payResult = {
      orderId: order.id,
      orderNo: order.order_no,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: uuidv4().replace(/-/g, '').substring(0, 32),
      package: 'prepay_id=wx' + Date.now() + uuidv4().replace(/-/g, '').substring(0, 16),
      signType: 'MD5',
      paySign: 'mock_signature'
    };
    
    res.json(success(payResult));
  });

  app.put('/api/orders/:id/confirm', authenticate, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orderOps.findById(orderId, req.user.id);
    
    if (!order) {
      return res.json(error(404, 'Order not found'));
    }
    
    if (order.status !== 'shipped') {
      return res.json(error(400, 'Only shipped orders can be confirmed'));
    }
    
    orderOps.updateStatus(orderId, req.user.id, 'completed');
    res.json(success(null, 'Order confirmed'));
  });

  adminRouter(app, getDb(), authenticate, {
    categoryOps,
    productOps,
    addressOps,
    orderOps,
    favoriteOps,
    bannerOps,
    adminOps,
    adminCategoryOps,
    adminBannerOps,
    adminOrderOps,
    adminProductOps
  }, upload, resizeImage);

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ code: 400, message: 'File too large' });
    }
    res.status(500).json({ code: 500, message: 'Server error: ' + err.message });
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}

startServer().catch(console.error);