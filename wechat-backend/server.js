const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const {
  db,
  initializeDatabase,
  userOps,
  categoryOps,
  productOps,
  addressOps,
  cartOps,
  orderOps,
  favoriteOps,
  bannerOps
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wechat-store-secret-key-2024';

app.use(cors());
app.use(bodyParser.json());

initializeDatabase();

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

app.post('/api/auth/login', (req, res) => {
  const { code, userInfo } = req.body;
  
  if (!code) {
    return res.json(error(400, 'Code is required'));
  }
  
  const openid = 'wx_' + code.substring(0, 20) + '_' + Date.now();
  
  let user = userOps.findByOpenid(openid);
  if (!user) {
    user = userOps.create(openid, userInfo || {});
  } else if (userInfo) {
    user = userOps.update(user.id, userInfo);
  }
  
  const token = generateToken(user);
  
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
  const products = db.prepare('SELECT * FROM products WHERE status = 1 ORDER BY sales DESC LIMIT ?').all(parseInt(limit));
  res.json(success(products));
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
  const { items, totalPrice, discountPrice = 0, actualPrice, addressId, address, remark, clearCart = true } = req.body;
  
  if (!items || items.length === 0) {
    return res.json(error(400, 'Items are required'));
  }
  
  if (!actualPrice) {
    return res.json(error(400, 'Actual price is required'));
  }
  
  for (const item of items) {
    const product = productOps.findById(item.productId);
    if (!product) {
      return res.json(error(404, `Product ${item.productId} not found`));
    }
    if (product.stock < item.quantity) {
      return res.json(error(400, `Insufficient stock for ${product.name}`));
    }
  }
  
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
  
  res.json(success(order));
});

app.get('/api/orders', authenticate, (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const result = orderOps.findByUser(req.user.id, {
    page: parseInt(page),
    limit: parseInt(limit),
    status
  });
  
  const ordersWithItems = result.orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
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
  
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  for (const item of orderItems) {
    db.prepare('UPDATE products SET stock = stock + ?, sales = sales - ? WHERE id = ?').run(item.quantity, item.quantity, item.product_id);
  }
  
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});