const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key';

function createApp() {
  const app = express();
  app.use(bodyParser.json());

  const products = [
    { id: 1, name: 'Product 1', price: 10, stock: 100, status: 1, category_id: 1 },
    { id: 2, name: 'Product 2', price: 20, stock: 50, status: 1, category_id: 2 }
  ];
  const categories = [
    { id: 1, name_en: 'Food', name_zh: '食品' },
    { id: 2, name_en: 'Drinks', name_zh: '饮料' }
  ];

  function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: 'Unauthorized' });
    }
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      req.admin = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ code: 401, message: 'Invalid token' });
    }
  }

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign({ id: 1, username: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ code: 0, data: { token, name: 'Admin', username: 'admin' } });
    }
    res.json({ code: 401, message: 'Invalid credentials' });
  });

  app.get('/api/admin/products', adminAuth, (req, res) => {
    const { page = 1, limit = 20, category, keyword, status } = req.query;
    let filtered = [...products];
    if (category) filtered = filtered.filter(p => p.category_id === parseInt(category));
    if (keyword) filtered = filtered.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
    if (status !== undefined) filtered = filtered.filter(p => p.status === parseInt(status));
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = filtered.slice(start, start + parseInt(limit));
    res.json({ code: 0, data: { products: paginated, total: filtered.length, page: parseInt(page), limit: parseInt(limit) } });
  });

  app.post('/api/admin/products', adminAuth, (req, res) => {
    const { name, price } = req.body;
    if (!name || !price) return res.json({ code: 400, message: 'name and price are required' });
    const newProduct = { id: products.length + 1, name, price, stock: 0, status: 1 };
    products.push(newProduct);
    res.json({ code: 0, data: { id: newProduct.id } });
  });

  app.get('/api/admin/categories', adminAuth, (req, res) => {
    res.json({ code: 0, data: categories });
  });

  app.post('/api/admin/categories', adminAuth, (req, res) => {
    const { name_en, name_zh } = req.body;
    if (!name_en || !name_zh) return res.json({ code: 400, message: 'name_en and name_zh are required' });
    const newCategory = { id: categories.length + 1, name_en, name_zh };
    categories.push(newCategory);
    res.json({ code: 0, data: { id: newCategory.id } });
  });

  return { app, products, categories };
}

function getToken(app) {
  const res = request(app).post('/api/admin/login').send({ username: 'admin', password: 'admin123' });
  return res.then(r => r.body.data.token);
}

describe('Admin Products API', () => {
  let app, token;

  beforeEach(async () => {
    const setup = createApp();
    app = setup.app;
    token = await getToken(app);
  });

  test('GET /api/admin/products - list all', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data.products).toBeDefined();
    expect(res.body.data.total).toBeGreaterThan(0);
  });

  test('GET /api/admin/products - filter by category', async () => {
    const res = await request(app)
      .get('/api/admin/products?category=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
    res.body.data.products.forEach(p => expect(p.category_id).toBe(1));
  });

  test('GET /api/admin/products - filter by keyword', async () => {
    const res = await request(app)
      .get('/api/admin/products?keyword=Product 1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  test('GET /api/admin/products - unauthorized', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .expect(401);

    expect(res.body.code).toBe(401);
  });

  test('POST /api/admin/products - create product', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Product', price: 30 })
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data.id).toBeDefined();
  });

  test('POST /api/admin/products - missing name', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 30 })
      .expect(200);

    expect(res.body.code).toBe(400);
  });
});

describe('Admin Categories API', () => {
  let app, token;

  beforeEach(async () => {
    const setup = createApp();
    app = setup.app;
    token = await getToken(app);
  });

  test('GET /api/admin/categories - list all', async () => {
    const res = await request(app)
      .get('/api/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/admin/categories - create category', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name_en: 'Test Category', name_zh: '测试分类' })
      .expect(200);

    expect(res.body.code).toBe(0);
  });

  test('POST /api/admin/categories - missing name_zh', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name_en: 'Test Category' })
      .expect(200);

    expect(res.body.code).toBe(400);
  });
});