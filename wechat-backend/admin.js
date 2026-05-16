const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wechat-store-secret-key-2024';

function adminRouter(app, database, authenticate, {
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
}, upload, resizeImage) {
  function exec(sql, params = []) {
    const stmt = database.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  function execOne(sql, params = []) {
    const results = exec(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ code: 401, message: 'Invalid token' });
    }
  };

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, message: 'Username and password required' });
    }
    const admin = adminOps.findByUsername(username, password);
    if (!admin) {
      return res.json({ code: 401, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin.id, username: admin.username, name: admin.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ code: 0, data: { token, name: admin.name, username: admin.username } });
  });

  app.post('/api/admin/logout', adminAuth, (req, res) => {
    res.json({ code: 0, message: 'Logged out' });
  });

  app.post('/api/admin/upload', adminAuth, upload.single('image'), resizeImage, (req, res) => {
    if (!req.file) {
      return res.json({ code: 400, message: 'No file uploaded' });
    }
    const imageUrl = '/uploads/' + req.file.filename;
    res.json({ code: 0, data: { url: imageUrl, filename: req.file.filename } });
  });

  app.get('/api/admin/categories', adminAuth, (req, res) => {
    const categories = categoryOps.findAll();
    res.json({ code: 0, data: categories });
  });

  app.post('/api/admin/categories', adminAuth, (req, res) => {
    const { name_en, name_zh, icon } = req.body;
    if (!name_en || !name_zh) {
      return res.json({ code: 400, message: 'name_en and name_zh are required' });
    }
    const result = adminCategoryOps.create(name_en, name_zh, icon || '');
    res.json({ code: 0, data: { id: result.id } });
  });

  app.put('/api/admin/categories/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { name_en, name_zh, icon } = req.body;
    adminCategoryOps.update(id, { name_en, name_zh, icon });
    res.json({ code: 0, message: 'Category updated' });
  });

  app.delete('/api/admin/categories/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    adminCategoryOps.delete(id);
    res.json({ code: 0, message: 'Category deleted' });
  });

  app.get('/api/admin/products', adminAuth, (req, res) => {
    const { page = 1, limit = 20, category, keyword, status } = req.query;
    const result = productOps.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      keyword,
      status: status === undefined ? undefined : parseInt(status)
    });
    res.json({ code: 0, data: result });
  });

  app.get('/api/admin/products/:id', adminAuth, (req, res) => {
    const product = productOps.findById(parseInt(req.params.id));
    if (!product) {
      return res.json({ code: 404, message: 'Product not found' });
    }
    res.json({ code: 0, data: product });
  });

  app.post('/api/admin/products', adminAuth, (req, res) => {
    const { name, price, original_price, image, images, category_id, stock, description } = req.body;
    if (!name || !price) {
      return res.json({ code: 400, message: 'name and price are required' });
    }
    const result = adminProductOps.create({ name, price, original_price, image, images, category_id, stock, description });
    res.json({ code: 0, data: { id: result.id } });
  });

  app.put('/api/admin/products/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price, original_price, image, images, category_id, stock, description, status } = req.body;
    adminProductOps.update(id, { name, price, original_price, image, images, category_id, stock, description, status });
    res.json({ code: 0, message: 'Product updated' });
  });

  app.delete('/api/admin/products/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    adminProductOps.delete(id);
    res.json({ code: 0, message: 'Product deleted' });
  });

  app.get('/api/admin/orders', adminAuth, (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const result = adminOrderOps.findAll({ page: parseInt(page), limit: parseInt(limit), status });
    res.json({ code: 0, data: result });
  });

  app.get('/api/admin/orders/:id', adminAuth, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = adminOrderOps.findById(orderId);
    if (!order) {
      return res.json({ code: 404, message: 'Order not found' });
    }
    res.json({ code: 0, data: order });
  });

  app.put('/api/admin/orders/:id/status', adminAuth, (req, res) => {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    if (!status) {
      return res.json({ code: 400, message: 'status is required' });
    }
    adminOrderOps.updateStatus(id, status);
    res.json({ code: 0, message: 'Order status updated' });
  });

  app.get('/api/admin/banners', adminAuth, (req, res) => {
    const banners = bannerOps.findActive();
    res.json({ code: 0, data: banners });
  });

  app.post('/api/admin/banners', adminAuth, (req, res) => {
    const { title, image, link_type, link_value, sort_order, status } = req.body;
    if (!image) {
      return res.json({ code: 400, message: 'image is required' });
    }
    const result = adminBannerOps.create({ title, image, link_type, link_value, sort_order, status });
    res.json({ code: 0, data: { id: result.id } });
  });

  app.put('/api/admin/banners/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { title, image, link_type, link_value, sort_order, status } = req.body;
    adminBannerOps.update(id, { title, image, link_type, link_value, sort_order, status });
    res.json({ code: 0, message: 'Banner updated' });
  });

  app.delete('/api/admin/banners/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    adminBannerOps.delete(id);
    res.json({ code: 0, message: 'Banner deleted' });
  });

  app.get('/api/admin/stats', adminAuth, (req, res) => {
    const totalProducts = execOne('SELECT COUNT(*) as count FROM products')?.count || 0;
    const totalOrders = execOne('SELECT COUNT(*) as count FROM orders')?.count || 0;
    const totalRevenue = execOne('SELECT SUM(actual_price) as total FROM orders WHERE status IN ("paid", "shipped", "completed")')?.total || 0;
    const pendingOrders = execOne('SELECT COUNT(*) as count FROM orders WHERE status = "pending"')?.count || 0;
    res.json({ code: 0, data: { totalProducts, totalOrders, totalRevenue, pendingOrders } });
  });

  app.get('/api/admin/stats/daily', adminAuth, (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const orders = exec(`
      SELECT DATE(created_at) as date, SUM(actual_price) as revenue, COUNT(*) as count 
      FROM orders 
      WHERE status IN ("paid", "shipped", "completed") AND created_at >= date('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);
    res.json({ code: 0, data: orders });
  });

  app.get('/admin', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel - Daily Goods Store</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
            secondary: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Login Page -->
  <div id="login-page" class="flex items-center justify-center min-h-screen">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-store text-2xl text-red-500"></i>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">Admin Login</h1>
        <p class="text-gray-500 text-sm mt-1">Daily Goods Store</p>
      </div>
      <form id="login-form">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-medium mb-2">Username</label>
          <input id="username" type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition" placeholder="Enter username">
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
          <input id="password" type="password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition" placeholder="Enter password">
        </div>
        <button id="login-btn" type="button" class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition duration-200" onclick="console.log('Button clicked'); login()">
          Sign In
        </button>
      </form>
    </div>
  </div>

  <!-- Admin Page -->
  <div id="admin-page" class="hidden flex h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-lg flex flex-col">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <i class="fas fa-store text-white"></i>
          </div>
          <div>
            <h2 class="font-bold text-gray-800">Admin Panel</h2>
            <p class="text-xs text-gray-500">Daily Goods</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li>
            <a href="#" data-page="dashboard" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-500 transition">
              <i class="fas fa-chart-line w-5"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a href="#" data-page="products" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-500 transition">
              <i class="fas fa-box w-5"></i>
              <span>Products</span>
            </a>
          </li>
          <li>
            <a href="#" data-page="categories" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-500 transition">
              <i class="fas fa-tags w-5"></i>
              <span>Categories</span>
            </a>
          </li>
          <li>
            <a href="#" data-page="orders" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-500 transition">
              <i class="fas fa-shopping-cart w-5"></i>
              <span>Orders</span>
            </a>
          </li>
          <li>
            <a href="#" data-page="banners" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-500 transition">
              <i class="fas fa-images w-5"></i>
              <span>Banners</span>
            </a>
          </li>
        </ul>
      </nav>
      <div class="p-4 border-t border-gray-100">
        <button onclick="logout()" class="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-500 rounded-lg transition">
          <i class="fas fa-sign-out-alt w-5"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800" id="page-title">Dashboard</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">Welcome, Admin</span>
          <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-red-500"></i>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-8" id="main-content">
        <!-- Dashboard -->
        <div id="page-dashboard" class="page">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-red-100 text-sm">Products</p>
                  <p class="text-3xl font-bold mt-1" id="stat-products">0</p>
                </div>
                <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <i class="fas fa-box text-2xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-orange-100 text-sm">Orders</p>
                  <p class="text-3xl font-bold mt-1" id="stat-orders">0</p>
                </div>
                <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <i class="fas fa-shopping-bag text-2xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-100 text-sm">Revenue</p>
                  <p class="text-3xl font-bold mt-1" id="stat-revenue">¥0</p>
                </div>
                <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <i class="fas fa-yen-sign text-2xl"></i>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-100 text-sm">Pending</p>
                  <p class="text-3xl font-bold mt-1" id="stat-pending">0</p>
                </div>
                <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <i class="fas fa-clock text-2xl"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
            <div class="h-64">
              <canvas id="orders-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Products -->
        <div id="page-products" class="page hidden">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center">
              <div class="flex-1 min-w-64">
                <input id="product-search" type="text" placeholder="Search products..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" onkeyup="searchProducts()">
              </div>
              <select id="product-category-filter" onchange="searchProducts()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                <option value="">All Categories</option>
              </select>
              <select id="product-status-filter" onchange="searchProducts()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                <option value="1">Active</option>
                <option value="0">Inactive</option>
                <option value="">All</option>
              </select>
              <button onclick="showProductModal()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2">
                <i class="fas fa-plus"></i> Add Product
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Image</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Category</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Price</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Stock</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Sales</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody id="products-list" class="divide-y divide-gray-100"></tbody>
              </table>
            </div>
            <div class="px-6 py-4 border-t border-gray-100">
              <div id="products-pagination" class="flex justify-center gap-2"></div>
            </div>
          </div>
        </div>

        <!-- Categories -->
        <div id="page-categories" class="page hidden">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-800">Categories</h3>
              <button onclick="showCategoryModal()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2">
                <i class="fas fa-plus"></i> Add Category
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">ID</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Name (EN)</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Name (ZH)</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Icon</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody id="categories-list" class="divide-y divide-gray-100"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Orders -->
        <div id="page-orders" class="page hidden">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center">
              <select id="order-status-filter" onchange="searchOrders()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">ID</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Order No</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">User</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Total</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Date</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody id="orders-list" class="divide-y divide-gray-100"></tbody>
              </table>
            </div>
            <div class="px-6 py-4 border-t border-gray-100">
              <div id="orders-pagination" class="flex justify-center gap-2"></div>
            </div>
          </div>
        </div>

        <!-- Banners -->
        <div id="page-banners" class="page hidden">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-800">Banners</h3>
              <button onclick="showBannerModal()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2">
                <i class="fas fa-plus"></i> Add Banner
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Image</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Title</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Link</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody id="banners-list" class="divide-y divide-gray-100"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Modals -->
  <div id="product-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
        <h3 class="text-xl font-semibold text-gray-800" id="product-modal-title">Add Product</h3>
        <button onclick="closeModal('product-modal')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <form class="p-6 space-y-4" onsubmit="event.preventDefault(); saveProduct();">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input id="product-name" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input id="product-price" type="number" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
            <input id="product-original-price" type="number" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input id="product-stock" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="product-status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
          <input id="product-image-upload" type="file" accept="image/*" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
          <p id="upload-status" class="text-sm text-gray-500 mt-1"></p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input id="product-image" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" placeholder="Or enter image URL">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select id="product-category" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"></select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="product-description" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"></textarea>
        </div>
        <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition">Save Product</button>
      </form>
    </div>
  </div>

  <div id="category-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-xl font-semibold text-gray-800">Add Category</h3>
        <button onclick="closeModal('category-modal')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <form class="p-6 space-y-4" onsubmit="event.preventDefault(); saveCategory();">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
          <input id="category-name-en" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name (Chinese)</label>
          <input id="category-name-zh" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Icon (optional)</label>
          <input id="category-icon" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" placeholder="e.g. fas fa-tag">
        </div>
        <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition">Save Category</button>
      </form>
    </div>
  </div>

  <div id="banner-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-xl font-semibold text-gray-800">Add Banner</h3>
        <button onclick="closeModal('banner-modal')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <form class="p-6 space-y-4" onsubmit="event.preventDefault(); saveBanner();">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input id="banner-title" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input id="banner-image" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Link Type</label>
          <select id="banner-link-type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
            <option value="">None</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Link Value (ID)</label>
          <input id="banner-link-value" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
        </div>
        <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition">Save Banner</button>
      </form>
    </div>
  </div>

  <div id="order-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
        <h3 class="text-xl font-semibold text-gray-800">Order Detail</h3>
        <button onclick="closeModal('order-modal')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <div id="order-detail" class="p-6"></div>
    </div>
  </div>
  <script>
    let chart = null;
    let adminToken = '';
    let categories = [];
    let currentPage = { products: 1, orders: 1 };

    function api(url, options = {}) {
      const token = localStorage.getItem('adminToken');
      const headers = options.headers || {};
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
      return fetch(url, Object.assign({}, options, { headers }));
    }

    function login() {
      console.log('Login called');
      var username = document.getElementById('username').value;
      var password = document.getElementById('password').value;
      
      console.log('Username:', username, 'Password:', password ? '***' : '');
      
      if (!username || !password) {
        alert('Please enter username and password');
        return;
      }
      
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/login', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            console.log('Response:', data);
            if (data.code === 0) {
              adminToken = data.data.token;
              localStorage.setItem('adminToken', adminToken);
              showAdmin();
            } else {
              alert(data.message || 'Login failed');
            }
          } else {
            alert('Request failed: ' + xhr.status);
          }
        }
      };
      xhr.send(JSON.stringify({ username: username, password: password }));
    }

    async function logout() {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
        });
      } catch (e) {
        console.error('Logout failed', e);
      }
      adminToken = '';
      localStorage.removeItem('adminToken');
      location.reload();
    }

    function showAdmin() {
      document.getElementById('login-page').classList.add('hidden');
      document.getElementById('admin-page').classList.remove('hidden');
      document.getElementById('admin-page').classList.add('flex');
      document.querySelector('.nav-item[data-page="dashboard"]').classList.add('active', 'bg-red-50', 'text-red-500');
      loadCategoriesForSelect();
      loadPage('dashboard');
    }

    async function checkAuth() {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const res = await fetch('/api/admin/stats', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (res.status === 200) {
            adminToken = token;
            showAdmin();
          } else {
            localStorage.removeItem('adminToken');
          }
        } catch (e) {
          console.error('Auth check failed', e);
        }
      }
    }
    checkAuth();

    const pageTitles = { dashboard: 'Dashboard', products: 'Products', categories: 'Categories', orders: 'Orders', banners: 'Banners' };

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active', 'bg-red-50', 'text-red-500'));
        item.classList.add('active', 'bg-red-50', 'text-red-500');
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById('page-' + item.dataset.page).classList.remove('hidden');
        document.getElementById('page-title').textContent = pageTitles[item.dataset.page] || 'Dashboard';
        loadPage(item.dataset.page);
      });
    });

    async function loadPage(page) {
      if (page === 'dashboard') loadDashboard();
      else if (page === 'products') loadProducts();
      else if (page === 'categories') loadCategories();
      else if (page === 'orders') loadOrders();
      else if (page === 'banners') loadBanners();
    }

    async function loadDashboard() {
      const res = await api('/api/admin/stats');
      const data = await res.json();
      if (data.code === 0) {
        document.getElementById('stat-products').textContent = data.data.totalProducts;
        document.getElementById('stat-orders').textContent = data.data.totalOrders;
        document.getElementById('stat-revenue').textContent = '¥' + (data.data.totalRevenue || 0).toFixed(0);
        document.getElementById('stat-pending').textContent = data.data.pendingOrders;
      }
      const chartRes = await api('/api/admin/orders?limit=100&status=all');
      const chartData = await chartRes.json();
      if (chartData.code === 0) {
        const orders = chartData.data.orders || [];
        const dailyRevenue = {};
        orders.forEach(o => {
          const date = o.created_at?.split(' ')[0] || 'Unknown';
          dailyRevenue[date] = (dailyRevenue[date] || 0) + (o.actual_price || 0);
        });
        const labels = Object.keys(dailyRevenue).slice(-7);
        const values = labels.map(d => dailyRevenue[d]);
        if (chart) chart.destroy();
        const ctx = document.getElementById('orders-chart').getContext('2d');
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Revenue',
              data: values,
              borderColor: '#e63946',
              backgroundColor: 'rgba(230, 57, 70, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
      }
    }

    async function loadCategoriesForSelect() {
      const res = await api('/api/admin/categories');
      const data = await res.json();
      categories = data.data || [];
      const options = categories.map(c => '<option value="' + c.id + '">' + c.name_en + '</option>').join('');
      document.getElementById('product-category-filter').innerHTML = '<option value="">All Categories</option>' + options;
      document.getElementById('product-category').innerHTML = options;
    }

    async function searchProducts() {
      const keyword = document.getElementById('product-search').value;
      const category = document.getElementById('product-category-filter').value;
      const status = document.getElementById('product-status-filter').value;
      const page = currentPage.products;
      let url = '/api/admin/products?page=' + page + '&limit=10';
      if (keyword) url += '&keyword=' + encodeURIComponent(keyword);
      if (category) url += '&category=' + category;
      if (status !== '') url += '&status=' + status;
      const res = await api(url);
      const data = await res.json();
      if (data.code === 0) {
        renderProducts(data.data.products);
        renderPagination('products', data.data.page, data.data.total, data.data.limit);
      }
    }

    function renderProducts(products) {
      if (!products || products.length === 0) {
        document.getElementById('products-list').innerHTML = '<tr><td colspan="8" class="px-6 py-12 text-center text-gray-500">No products found</td></tr>';
        return;
      }
      document.getElementById('products-list').innerHTML = products.map(p => '<tr class="hover:bg-gray-50 transition">' +
        '<td class="px-6 py-4"><img src="' + (p.image || 'https://via.placeholder.com/80') + '" class="w-12 h-12 rounded-lg object-cover"></td>' +
        '<td class="px-6 py-4 font-medium text-gray-800">' + p.name + '</td>' +
        '<td class="px-6 py-4 text-gray-600">' + (p.category_name_en || '-') + '</td>' +
        '<td class="px-6 py-4 font-semibold text-gray-800">¥' + p.price + '</td>' +
        '<td class="px-6 py-4"><span class="' + (p.stock > 10 ? 'text-green-600' : 'text-orange-600') + ' font-medium">' + p.stock + '</span></td>' +
        '<td class="px-6 py-4 text-gray-600">' + p.sales + '</td>' +
        '<td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-medium ' + (p.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600') + '">' + (p.status ? 'Active' : 'Inactive') + '</span></td>' +
        '<td class="px-6 py-4"><div class="flex gap-3"><button onclick="editProduct(' + p.id + ')" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button><button onclick="deleteProduct(' + p.id + ')" class="text-gray-400 hover:text-red-500"><i class="fas fa-trash"></i></button></div></td></tr>').join('');
    }

    async function loadProducts() {
      currentPage.products = 1;
      searchProducts();
    }

    async function loadOrders() {
      searchOrders();
    }

    async function searchOrders() {
      const status = document.getElementById('order-status-filter').value;
      const page = currentPage.orders;
      let url = '/api/admin/orders?page=' + page + '&limit=10';
      if (status) url += '&status=' + status;
      const res = await api(url);
      const data = await res.json();
      if (data.code === 0) {
        renderOrders(data.data.orders);
        renderPagination('orders', data.data.page, data.data.total, data.data.limit);
      }
    }

    function renderOrders(orders) {
      if (!orders || orders.length === 0) {
        document.getElementById('orders-list').innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500">No orders found</td></tr>';
        return;
      }
      const statusColors = { pending: 'bg-orange-100 text-orange-700', paid: 'bg-blue-100 text-blue-700', shipped: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
      document.getElementById('orders-list').innerHTML = orders.map(o => '<tr class="hover:bg-gray-50 transition">' +
        '<td class="px-6 py-4 text-gray-600">#' + o.id + '</td>' +
        '<td class="px-6 py-4 font-medium text-gray-800">' + o.order_no + '</td>' +
        '<td class="px-6 py-4 text-gray-600">User #' + o.user_id + '</td>' +
        '<td class="px-6 py-4 font-semibold text-gray-800">¥' + o.actual_price + '</td>' +
        '<td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-medium ' + (statusColors[o.status] || 'bg-gray-100 text-gray-600') + '">' + o.status + '</span></td>' +
        '<td class="px-6 py-4 text-gray-500 text-sm">' + (o.created_at || '').split(' ')[0] + '</td>' +
        '<td class="px-6 py-4"><button onclick="viewOrder(' + o.id + ')" class="text-blue-500 hover:text-blue-700"><i class="fas fa-eye"></i></button></td></tr>').join('');
    }

async function viewOrder(id) {
      const res = await api('/api/admin/orders/' + id);
      const data = await res.json();
      if (data.code === 0) {
        const o = data.data;
        const statusOptions = ['pending', 'paid', 'shipped', 'completed', 'cancelled'].map(s => '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '">' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>').join('');
        document.getElementById('order-detail').innerHTML = 
          '<div class="mb-4 p-4 bg-gray-50 rounded-lg">' +
            '<div class="flex justify-between items-center mb-3"><span class="text-gray-500">Order No</span><span class="font-medium text-gray-800">' + o.order_no + '</span></div>' +
            '<div class="flex justify-between items-center mb-3"><span class="text-gray-500">Status</span><select id="order-status-select" onchange="updateOrderStatus(' + o.id + ')" class="px-3 py-1 border border-gray-300 rounded-lg text-sm">' + statusOptions + '</select></div>' +
            '<div class="flex justify-between items-center mb-3"><span class="text-gray-500">Total</span><span class="font-bold text-lg text-gray-800">¥' + o.actual_price + '</span></div>' +
            '<div class="flex justify-between items-center"><span class="text-gray-500">Address</span><span class="text-gray-700 text-right">' + (o.address || '-') + '</span></div>' +
          '</div>' +
          '<div><h4 class="font-medium text-gray-800 mb-3">Order Items</h4>' +
          (o.items || []).map(i => '<div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-2">' +
            '<img src="' + (i.product_image || 'https://via.placeholder.com/80') + '" class="w-14 h-14 rounded-lg object-cover">' +
            '<div class="flex-1"><div class="font-medium text-gray-800">' + i.product_name + '</div><div class="text-sm text-gray-500">¥' + i.price + ' x ' + i.quantity + '</div></div>' +
            '<div class="font-semibold text-gray-800">¥' + i.subtotal + '</div></div>').join('') + '</div>';
        const modal = document.getElementById('order-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    async function updateOrderStatus(id) {
      const status = document.getElementById('order-status-select').value;
      await api('/api/admin/orders/' + id + '/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      searchOrders();
    }

    async function loadCategories() {
      const res = await api('/api/admin/categories');
      const data = await res.json();
      if (data.code === 0) {
        document.getElementById('categories-list').innerHTML = data.data.map(c => '<tr class="hover:bg-gray-50 transition"><td class="px-6 py-4 text-gray-600">#' + c.id + '</td><td class="px-6 py-4 font-medium text-gray-800">' + c.name_en + '</td><td class="px-6 py-4 text-gray-600">' + c.name_zh + '</td><td class="px-6 py-4 text-gray-500"><i class="' + (c.icon || 'fas fa-tag') + '"></i></td><td class="px-6 py-4"><button onclick="deleteCategory(' + c.id + ')" class="text-gray-400 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>').join('');
      }
    }

    async function loadBanners() {
      const res = await api('/api/admin/banners');
      const data = await res.json();
      if (data.code === 0) {
        document.getElementById('banners-list').innerHTML = data.data.map(b => '<tr class="hover:bg-gray-50 transition">' +
          '<td class="px-6 py-4"><img src="' + b.image + '" class="w-16 h-10 rounded-lg object-cover"></td>' +
          '<td class="px-6 py-4 font-medium text-gray-800">' + (b.title || '-') + '</td>' +
          '<td class="px-6 py-4 text-gray-600 text-sm">' + (b.link_type ? b.link_type + ': ' + b.link_value : '-') + '</td>' +
          '<td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-medium ' + (b.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600') + '">' + (b.status ? 'Active' : 'Inactive') + '</span></td>' +
          '<td class="px-6 py-4"><button onclick="deleteBanner(' + b.id + ')" class="text-gray-400 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>').join('');
      }
    }

    function renderPagination(type, page, total, limit) {
      const totalPages = Math.ceil(total / limit);
      if (totalPages <= 1) {
        document.getElementById(type + '-pagination').innerHTML = '';
        return;
      }
      let html = '';
      const prev = page - 1;
      html += '<button ' + (prev < 1 ? 'disabled' : '') + ' onclick="changePage(\\'' + type + '\\',' + prev + ')" class="px-3 py-1 rounded border ' + (prev < 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-600') + '">Prev</button>';
      for (let i = 1; i <= totalPages; i++) {
        if (i === page || i === 1 || i === totalPages || (i > page - 2 && i < page + 2)) {
          html += '<button onclick="changePage(\\'' + type + '\\',' + i + ')" class="px-3 py-1 rounded border ' + (i === page ? 'bg-red-500 text-white border-red-500' : 'bg-white hover:bg-gray-50 text-gray-600') + '">' + i + '</button>';
        } else if (i === page - 3 || i === page + 3) {
          html += '<span class="text-gray-400">...</span>';
        }
      }
      const next = page + 1;
      html += '<button ' + (next > totalPages ? 'disabled' : '') + ' onclick="changePage(\\'' + type + '\\',' + next + ')" class="px-3 py-1 rounded border ' + (next > totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-600') + '">Next</button>';
      document.getElementById(type + '-pagination').innerHTML = html;
    }

    function changePage(type, page) {
      currentPage[type] = page;
      if (type === 'products') searchProducts();
      else if (type === 'orders') searchOrders();
    }

let editingProductId = null;

    function showProductModal(id = null) {
      editingProductId = id;
      const modal = document.getElementById('product-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.getElementById('product-modal-title').textContent = id ? 'Edit Product' : 'Add Product';
      if (!id) {
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-original-price').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-status').value = '1';
        document.getElementById('product-image').value = '';
        document.getElementById('product-description').value = '';
      }
    }

    async function editProduct(id) {
      const res = await api('/api/admin/products/' + id);
      const data = await res.json();
      if (data.code === 0) {
        const p = data.data;
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        document.getElementById('product-name').value = p.name;
        document.getElementById('product-price').value = p.price;
        document.getElementById('product-original-price').value = p.original_price || '';
        document.getElementById('product-stock').value = p.stock;
        document.getElementById('product-status').value = p.status;
        document.getElementById('product-image').value = p.image || '';
        document.getElementById('product-description').value = p.description || '';
        editingProductId = id;
        const modal = document.getElementById('product-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function showCategoryModal() {
      document.getElementById('category-name-en').value = '';
      document.getElementById('category-name-zh').value = '';
      document.getElementById('category-icon').value = '';
      const modal = document.getElementById('category-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function showBannerModal() {
      document.getElementById('banner-title').value = '';
      document.getElementById('banner-image').value = '';
      document.getElementById('banner-link-type').value = '';
      document.getElementById('banner-link-value').value = '';
      const modal = document.getElementById('banner-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    async function uploadImage(file) {
      const formData = new FormData();
      formData.append('image', file);
      
      document.getElementById('upload-status').textContent = 'Uploading...';
      
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') },
          body: formData
        });
        
        const text = await res.text();
        console.log('Upload response status:', res.status, 'body:', text);
        
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.error('Invalid JSON response:', text.substring(0, 200));
          document.getElementById('upload-status').textContent = 'Upload failed: Server error (check console)';
          return null;
        }
        
        if (result.code === 0) {
          document.getElementById('upload-status').textContent = 'Done!';
          document.getElementById('product-image').value = result.data.url;
          return result.data.url;
        } else {
          document.getElementById('upload-status').textContent = 'Upload failed: ' + result.message;
          return null;
        }
      } catch (err) {
        console.error('Upload error:', err);
        document.getElementById('upload-status').textContent = 'Upload failed: ' + err.message;
        return null;
      }
    }

    async function saveProduct() {
      const uploadInput = document.getElementById('product-image-upload');
      if (uploadInput.files.length > 0) {
        const imageUrl = await uploadImage(uploadInput.files[0]);
        if (!imageUrl) return;
      }
      
      try {
        const data = {
          name: document.getElementById('product-name').value,
          price: parseFloat(document.getElementById('product-price').value),
          original_price: parseFloat(document.getElementById('product-original-price').value) || null,
          stock: parseInt(document.getElementById('product-stock').value) || 0,
          status: parseInt(document.getElementById('product-status').value),
          image: document.getElementById('product-image').value,
          category_id: parseInt(document.getElementById('product-category').value) || null,
          description: document.getElementById('product-description').value
        };
        const method = editingProductId ? 'PUT' : 'POST';
        const url = editingProductId ? '/api/admin/products/' + editingProductId : '/api/admin/products';
        const res = await api(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.code === 0) {
          closeModal('product-modal');
          searchProducts();
        } else {
          alert(result.message || 'Save failed');
        }
      } catch (err) {
        alert('Save failed: ' + err.message);
      }
    }

    async function deleteProduct(id) {
      if (!confirm('Delete this product?')) return;
      await api('/api/admin/products/' + id, { method: 'DELETE' });
      searchProducts();
    }

    function showCategoryModal() {
      document.getElementById('category-name-en').value = '';
      document.getElementById('category-name-zh').value = '';
      document.getElementById('category-icon').value = '';
      const modal = document.getElementById('category-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    async function saveCategory() {
      await api('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_en: document.getElementById('category-name-en').value,
          name_zh: document.getElementById('category-name-zh').value,
          icon: document.getElementById('category-icon').value
        })
      });
      closeModal('category-modal');
      loadCategories();
    }

    async function deleteCategory(id) {
      if (!confirm('Delete this category?')) return;
      await api('/api/admin/categories/' + id, { method: 'DELETE' });
      loadCategories();
    }

    function showBannerModal() {
      document.getElementById('banner-title').value = '';
      document.getElementById('banner-image').value = '';
      document.getElementById('banner-link-type').value = '';
      document.getElementById('banner-link-value').value = '';
      const modal = document.getElementById('banner-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    async function saveBanner() {
      await api('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.getElementById('banner-title').value,
          image: document.getElementById('banner-image').value,
          link_type: document.getElementById('banner-link-type').value,
          link_value: document.getElementById('banner-link-value').value
        })
      });
      closeModal('banner-modal');
      loadBanners();
    }

    async function deleteBanner(id) {
      if (!confirm('Delete this banner?')) return;
      await api('/api/admin/banners/' + id, { method: 'DELETE' });
      loadBanners();
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  </script>
</body>
</html>
    `);
  });
}

module.exports = { adminRouter };