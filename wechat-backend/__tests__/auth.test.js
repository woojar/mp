const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const JWT_SECRET = 'test-secret-key';

function createMockDb() {
  const data = {
    categories: [],
    products: [],
    admins: [{ id: 1, username: 'admin', password: 'admin123', name: 'Test Admin' }]
  };
  return {
    prepare: (sql) => ({
      get: (...params) => {
        if (sql.includes('admins')) {
          return data.admins.find(a => a.username === params[0] && a.password === params[1]) || null;
        }
        return null;
      },
      all: () => [],
      run: () => ({ lastInsertRowid: 1 })
    }),
    exec: (sql) => [{ values: [[0]] }]
  };
}

function createApp(mockDb) {
  const app = express();
  app.use(bodyParser.json());

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: 'Username and password required' });
    }
    const admin = mockDb.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);
    if (!admin) {
      return res.json({ code: 401, message: 'Invalid credentials' });
    }
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ code: 0, data: { token, name: admin.name, username: admin.username } });
  });

  return app;
}

describe('Auth API', () => {
  let mockDb;
  let app;

  beforeEach(() => {
    mockDb = createMockDb();
    app = createApp(mockDb);
  });

  test('POST /api/admin/login - success', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.username).toBe('admin');
  });

  test('POST /api/admin/login - wrong password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(200);

    expect(res.body.code).toBe(401);
  });

  test('POST /api/admin/login - missing credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({})
      .expect(200);

    expect(res.body.code).toBe(400);
    expect(res.body.message).toContain('required');
  });

  test('POST /api/admin/login - empty username', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: '', password: 'admin123' })
      .expect(200);

    expect(res.body.code).toBe(400);
  });
});

describe('Health Check', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.get('/health', (req, res) => res.json({ status: 'ok' }));
  });

  test('GET /health', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
  });
});