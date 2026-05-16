const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key';

function createApp() {
  const app = express();
  app.use(bodyParser.json());

  // Mock data
  const users = [];
  const products = [
    { id: 1, name: 'Product 1', price: 10, stock: 100, status: 1, image: '/uploads/test.jpg' },
    { id: 2, name: 'Product 2', price: 20, stock: 50, status: 1, image: '/uploads/test2.jpg' }
  ];
  const orders = [];
  let userIdCounter = 1;
  let orderIdCounter = 1;

  // Auth middleware
  function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: 'Unauthorized' });
    }
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ code: 401, message: 'Invalid token' });
    }
  }

  // Login endpoint
  app.post('/api/auth/login', (req, res) => {
    const { code, userInfo } = req.body;
    
    if (!code) {
      return res.json({ code: 400, message: 'Code is required' });
    }
    
    const openid = 'wx_' + code.substring(0, 20) + '_' + Date.now();
    
    let user = users.find(u => u.openid === openid);
    if (!user) {
      user = {
        id: userIdCounter++,
        openid,
        nickname: userInfo?.nickname || '',
        avatar: userInfo?.avatarUrl || userInfo?.avatar || '',
        phone: userInfo?.phone || '',
        language: 'en'
      };
      users.push(user);
    }
    
    const token = jwt.sign({ id: user.id, openid: user.openid }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          language: user.language
        }
      }
    });
  });

  // Get products
  app.get('/api/products', (req, res) => {
    res.json({
      code: 0,
      message: 'success',
      data: {
        products,
        total: products.length,
        page: 1,
        limit: 20
      }
    });
  });

  // Create order
  app.post('/api/orders', authenticate, (req, res) => {
    const { items, totalPrice, discountPrice = 0, actualPrice, address, remark } = req.body;
    
    if (!items || items.length === 0) {
      return res.json({ code: 400, message: 'Items are required' });
    }
    
    if (!actualPrice) {
      return res.json({ code: 400, message: 'Actual price is required' });
    }
    
    // Validate products
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.json({ code: 404, message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.json({ code: 400, message: `Insufficient stock for ${product.name}` });
      }
    }
    
    // Create order
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    const addressStr = typeof address === 'string' ? address : JSON.stringify(address || '');
    
    const order = {
      id: orderIdCounter++,
      order_no: orderNo,
      user_id: req.user.id,
      total_price: totalPrice,
      actual_price: actualPrice,
      status: 'pending',
      address: addressStr,
      items
    };
    
    orders.push(order);
    
    res.json({ code: 0, message: 'success', data: order });
  });

  // Get orders
  app.get('/api/orders', authenticate, (req, res) => {
    const userOrders = orders.filter(o => o.user_id === req.user.id);
    res.json({
      code: 0,
      message: 'success',
      data: {
        orders: userOrders,
        total: userOrders.length,
        page: 1,
        limit: 10
      }
    });
  });

  // Pay order
  app.post('/api/orders/:id/pay', authenticate, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId && o.user_id === req.user.id);
    
    if (!order) {
      return res.json({ code: 404, message: 'Order not found' });
    }
    
    if (order.status !== 'pending') {
      return res.json({ code: 400, message: 'Order cannot be paid' });
    }
    
    const payResult = {
      orderId: order.id,
      orderNo: order.order_no,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: 'mock_nonce_' + Math.random().toString(36).substr(2, 9),
      package: 'prepay_id=wx' + Date.now(),
      signType: 'MD5',
      paySign: 'mock_signature'
    };
    
    res.json({ code: 0, message: 'success', data: payResult });
  });

  // Confirm order receipt
  app.put('/api/orders/:id/confirm', authenticate, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId && o.user_id === req.user.id);
    
    if (!order) {
      return res.json({ code: 404, message: 'Order not found' });
    }
    
    if (order.status !== 'paid') {
      return res.json({ code: 400, message: 'Only paid orders can be confirmed' });
    }
    
    order.status = 'completed';
    res.json({ code: 0, message: 'success', data: null });
  });

  return app;
}

function getToken(app, userInfo = {}) {
  return request(app)
    .post('/api/auth/login')
    .send({ code: 'test_code_123', userInfo })
    .then(res => {
      if (res.body.code === 0) {
        return res.body.data.token;
      }
      throw new Error('Login failed: ' + res.body.message);
    });
}

describe('User Auth API', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  test('POST /api/auth/login - success with new user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ 
        code: 'test_code_123',
        userInfo: { 
          nickname: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      });

    expect(res.body.code).toBe(0);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.nickname).toBe('Test User');
  });

  test('POST /api/auth/login - missing code', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ userInfo: { nickname: 'Test' } });

    expect(res.body.code).toBe(400);
    expect(res.body.message).toContain('required');
  });
});

describe('Orders API', () => {
  let app, token;

  beforeEach(async () => {
    app = createApp();
    token = await getToken(app, { nickname: 'Order Tester' });
  });

  test('POST /api/orders - create order successfully', async () => {
    const orderData = {
      items: [
        { productId: 1, quantity: 2, price: 10 }
      ],
      totalPrice: 20,
      discountPrice: 0,
      actualPrice: 20,
      address: {
        name: 'Test User',
        phone: '123456789',
        detail: 'Test Street 123'
      },
      remark: 'Please deliver fast'
    };

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderData);

    expect(res.body.code).toBe(0);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('pending');
  });

  test('POST /api/orders - address object is stringified', async () => {
    const orderData = {
      items: [{ productId: 1, quantity: 1, price: 10 }],
      totalPrice: 10,
      actualPrice: 10,
      address: { name: 'Test', phone: '123', detail: 'Address' }
    };

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderData);

    expect(res.body.code).toBe(0);
  });

  test('POST /api/orders - missing items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ totalPrice: 20, actualPrice: 20 });

    expect(res.body.code).toBe(400);
    expect(res.body.message).toContain('Items');
  });

  test('POST /api/orders - missing actualPrice', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: 1, quantity: 1, price: 10 }], totalPrice: 10 });

    expect(res.body.code).toBe(400);
    expect(res.body.message).toContain('Actual price');
  });

  test('POST /api/orders - product not found', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 999, quantity: 1, price: 10 }],
        totalPrice: 10,
        actualPrice: 10
      });

    expect(res.body.code).toBe(404);
  });

  test('GET /api/orders - list user orders', async () => {
    // Create an order first
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 1, price: 10 }],
        totalPrice: 10,
        actualPrice: 10,
        address: 'Test Address'
      });

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.code).toBe(0);
    expect(res.body.data.orders.length).toBe(1);
  });

  test('GET /api/orders - unauthorized', async () => {
    const res = await request(app)
      .get('/api/orders');

    expect(res.body.code).toBe(401);
  });
});

describe('Payment API', () => {
  let app, token;

  beforeEach(async () => {
    app = createApp();
    token = await getToken(app);
  });

  test('POST /api/orders/:id/pay - success for pending order', async () => {
    // Create order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 1, price: 10 }],
        totalPrice: 10,
        actualPrice: 10,
        address: 'Test'
      });

    const orderId = orderRes.body.data.id;

    // Pay for order
    const payRes = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(payRes.body.code).toBe(0);
    expect(payRes.body.data.timeStamp).toBeDefined();
    expect(payRes.body.data.package).toContain('prepay_id');
  });

  test('POST /api/orders/:id/pay - order not found', async () => {
    const res = await request(app)
      .post('/api/orders/999/pay')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.code).toBe(404);
  });
});

describe('Products API', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  test('GET /api/products - list all products', async () => {
    const res = await request(app)
      .get('/api/products');

    expect(res.body.code).toBe(0);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  test('GET /api/products - product has required fields', async () => {
    const res = await request(app)
      .get('/api/products');

    const product = res.body.data.products[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('image');
  });
});
