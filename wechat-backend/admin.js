const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key-2024';

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
}) {
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
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel - Daily Goods Store</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; min-height: 100vh; }
    .login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .login-box { background: #fff; padding: 60rpx; border-radius: 16rpx; width: 90%; max-width: 400rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1); }
    .login-title { font-size: 40rpx; font-weight: bold; text-align: center; margin-bottom: 40rpx; color: #e63946; }
    .input { width: 100%; padding: 24rpx; border: 1rpx solid #ddd; border-radius: 8rpx; font-size: 28rpx; margin-bottom: 24rpx; }
    .btn { background: #e63946; color: #fff; padding: 24rpx; border: none; border-radius: 8rpx; cursor: pointer; font-size: 28rpx; width: 100%; }
    .btn:hover { background: #d32f3d; }
    .admin-page { display: none; }
    .header { background: #e63946; color: #fff; padding: 30rpx 40rpx; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
    .header h1 { font-size: 32rpx; }
    .logout-btn { color: #fff; cursor: pointer; }
    .nav { display: flex; background: #fff; overflow-x: auto; border-bottom: 1rpx solid #eee; }
    .nav-item { padding: 24rpx 32rpx; cursor: pointer; border-bottom: 4rpx solid transparent; white-space: nowrap; }
    .nav-item.active { border-color: #e63946; color: #e63946; }
    .content { padding: 30rpx; }
    .card { background: #fff; border-radius: 12rpx; padding: 30rpx; margin-bottom: 30rpx; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; }
    .stat-box { text-align: center; padding: 30rpx; background: linear-gradient(135deg, #e63946 0%, #ff6b6b 100%); border-radius: 12rpx; color: #fff; }
    .stat-box.orange { background: linear-gradient(135deg, #ffa500 0%, #ffb74d 100%); }
    .stat-box.blue { background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%); }
    .stat-box.purple { background: linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%); }
    .stat-value { font-size: 48rpx; font-weight: bold; }
    .stat-label { font-size: 24rpx; opacity: 0.9; margin-top: 8rpx; }
    .chart-container { height: 300rpx; }
    .toolbar { display: flex; gap: 20rpx; margin-bottom: 20rpx; flex-wrap: wrap; }
    .toolbar .input { flex: 1; min-width: 200rpx; margin-bottom: 0; }
    .toolbar select { padding: 24rpx; border: 1rpx solid #ddd; border-radius: 8rpx; font-size: 28rpx; }
    .btn-sm { padding: 16rpx 24rpx; font-size: 24rpx; }
    .btn-secondary { background: #fff; border: 1rpx solid #e63946; color: #e63946; }
    .btn-secondary:hover { background: #ffebee; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 20rpx; text-align: left; border-bottom: 1rpx solid #eee; font-size: 26rpx; }
    th { color: #666; font-weight: 500; background: #fafafa; }
    .product-img { width: 80rpx; height: 80rpx; object-fit: cover; border-radius: 8rpx; }
    .status-badge { display: inline-block; padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; color: #fff; }
    .actions { display: flex; gap: 16rpx; }
    .action-link { cursor: pointer; color: #e63946; font-size: 24rpx; }
    .action-link.delete { color: #999; }
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 200; }
    .modal.show { display: flex; }
    .modal-content { background: #fff; border-radius: 12rpx; padding: 40rpx; width: 90%; max-width: 600rpx; max-height: 85vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; margin-bottom: 30rpx; }
    .modal-title { font-size: 32rpx; font-weight: bold; }
    .close { font-size: 48rpx; cursor: pointer; color: #999; }
    .form { display: flex; flex-direction: column; gap: 20rpx; }
    .form-item { display: flex; align-items: flex-start; gap: 20rpx; }
    .form-item label { width: 140rpx; color: #666; padding-top: 24rpx; font-size: 26rpx; }
    .form-item input, .form-item textarea, .form-item select { flex: 1; padding: 20rpx; border: 1rpx solid #ddd; border-radius: 8rpx; font-size: 28rpx; }
    .form-item textarea { min-height: 150rpx; }
    .form-row { display: flex; gap: 20rpx; }
    .form-row .form-item { flex: 1; }
    .pagination { display: flex; justify-content: center; gap: 16rpx; margin-top: 30rpx; }
    .pagination button { padding: 16rpx 24rpx; background: #fff; border: 1rpx solid #ddd; border-radius: 8rpx; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; }
    .pagination button.active { background: #e63946; color: #fff; border-color: #e63946; }
    .order-items { margin-top: 20rpx; }
    .order-item { display: flex; align-items: center; gap: 20rpx; padding: 20rpx; background: #fafafa; border-radius: 8rpx; margin-bottom: 16rpx; }
    .order-item img { width: 100rpx; height: 100rpx; object-fit: cover; border-radius: 8rpx; }
    .order-item-info { flex: 1; }
    .empty { text-align: center; padding: 60rpx; color: #999; }
    @media (min-width: 768px) {
      .stats { grid-template-columns: repeat(4, 1fr); }
      .content { max-width: 1200rpx; margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div id="login-page" class="login-page">
    <div class="login-box">
      <div class="login-title">Admin Login</div>
      <input id="username" class="input" placeholder="Username">
      <input id="password" class="input" type="password" placeholder="Password">
      <button class="btn" onclick="login()">Login</button>
    </div>
  </div>
  <div id="admin-page" class="admin-page">
    <div class="header">
      <h1>Admin Panel</h1>
      <span class="logout-btn" onclick="logout()">Logout</span>
    </div>
    <div class="nav">
      <div class="nav-item active" data-page="dashboard">Dashboard</div>
      <div class="nav-item" data-page="products">Products</div>
      <div class="nav-item" data-page="categories">Categories</div>
      <div class="nav-item" data-page="orders">Orders</div>
      <div class="nav-item" data-page="banners">Banners</div>
    </div>
    <div class="content">
      <div id="page-dashboard" class="page">
        <div class="stats">
          <div class="stat-box">
            <div class="stat-value" id="stat-products">0</div>
            <div class="stat-label">Products</div>
          </div>
          <div class="stat-box orange">
            <div class="stat-value" id="stat-orders">0</div>
            <div class="stat-label">Orders</div>
          </div>
          <div class="stat-box blue">
            <div class="stat-value" id="stat-revenue">¥0</div>
            <div class="stat-label">Revenue</div>
          </div>
          <div class="stat-box purple">
            <div class="stat-value" id="stat-pending">0</div>
            <div class="stat-label">Pending Orders</div>
          </div>
        </div>
        <div class="card">
          <div class="chart-container">
            <canvas id="orders-chart"></canvas>
          </div>
        </div>
      </div>
      <div id="page-products" class="page" style="display:none">
        <div class="card">
          <div class="toolbar">
            <input id="product-search" class="input" placeholder="Search products..." onkeyup="searchProducts()">
            <select id="product-category-filter" onchange="searchProducts()">
              <option value="">All Categories</option>
            </select>
            <select id="product-status-filter" onchange="searchProducts()">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
              <option value="">All</option>
            </select>
            <button class="btn btn-sm" onclick="showProductModal()">+ Add</button>
          </div>
          <table>
            <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Sales</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="products-list"></tbody>
          </table>
          <div class="pagination" id="products-pagination"></div>
        </div>
      </div>
      <div id="page-categories" class="page" style="display:none">
        <div class="card">
          <div class="toolbar">
            <button class="btn btn-sm" onclick="showCategoryModal()">+ Add Category</button>
          </div>
          <table>
            <thead><tr><th>ID</th><th>Name (EN)</th><th>Name (ZH)</th><th>Icon</th><th>Actions</th></tr></thead>
            <tbody id="categories-list"></tbody>
          </table>
        </div>
      </div>
      <div id="page-orders" class="page" style="display:none">
        <div class="card">
          <div class="toolbar">
            <select id="order-status-filter" onchange="searchOrders()">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <table>
            <thead><tr><th>ID</th><th>Order No</th><th>User</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody id="orders-list"></tbody>
          </table>
          <div class="pagination" id="orders-pagination"></div>
        </div>
      </div>
      <div id="page-banners" class="page" style="display:none">
        <div class="card">
          <div class="toolbar">
            <button class="btn btn-sm" onclick="showBannerModal()">+ Add Banner</button>
          </div>
          <table>
            <thead><tr><th>Image</th><th>Title</th><th>Link</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="banners-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <div id="product-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title" id="product-modal-title">Add Product</div>
        <span class="close" onclick="closeModal('product-modal')">&times;</span>
      </div>
      <div class="form">
        <div class="form-item"><label>Name</label><input id="product-name" placeholder="Product name"></div>
        <div class="form-row">
          <div class="form-item"><label>Price</label><input id="product-price" type="number" step="0.01" placeholder="Price"></div>
          <div class="form-item"><label>Original</label><input id="product-original-price" type="number" step="0.01" placeholder="Original price"></div>
        </div>
        <div class="form-row">
          <div class="form-item"><label>Stock</label><input id="product-stock" type="number" placeholder="Stock"></div>
          <div class="form-item"><label>Status</label><select id="product-status"><option value="1">Active</option><option value="0">Inactive</option></select></div>
        </div>
        <div class="form-item"><label>Image</label><input id="product-image" placeholder="Image URL"></div>
        <div class="form-item"><label>Category</label><select id="product-category"></select></div>
        <div class="form-item"><label>Description</label><textarea id="product-description" placeholder="Description"></textarea></div>
        <button class="btn" onclick="saveProduct()">Save</button>
      </div>
    </div>
  </div>
  <div id="category-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">Add Category</div>
        <span class="close" onclick="closeModal('category-modal')">&times;</span>
      </div>
      <div class="form">
        <div class="form-item"><label>Name (EN)</label><input id="category-name-en" placeholder="English name"></div>
        <div class="form-item"><label>Name (ZH)</label><input id="category-name-zh" placeholder="Chinese name"></div>
        <div class="form-item"><label>Icon</label><input id="category-icon" placeholder="Icon class"></div>
        <button class="btn" onclick="saveCategory()">Save</button>
      </div>
    </div>
  </div>
  <div id="banner-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">Add Banner</div>
        <span class="close" onclick="closeModal('banner-modal')">&times;</span>
      </div>
      <div class="form">
        <div class="form-item"><label>Title</label><input id="banner-title" placeholder="Banner title"></div>
        <div class="form-item"><label>Image</label><input id="banner-image" placeholder="Image URL"></div>
        <div class="form-item"><label>Link Type</label><select id="banner-link-type"><option value="">None</option><option value="category">Category</option><option value="product">Product</option></select></div>
        <div class="form-item"><label>Link</label><input id="banner-link-value" placeholder="ID"></div>
        <button class="btn" onclick="saveBanner()">Save</button>
      </div>
    </div>
  </div>
  <div id="order-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">Order Detail</div>
        <span class="close" onclick="closeModal('order-modal')">&times;</span>
      </div>
      <div id="order-detail"></div>
    </div>
  </div>
  <script>
    let chart = null;
    let adminToken = '';
    let categories = [];

    async function login() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.code === 0) {
        adminToken = data.data.token;
        localStorage.setItem('adminToken', adminToken);
        showAdmin();
      } else {
        alert(data.message);
      }
    }

    async function logout() {
      adminToken = '';
      localStorage.removeItem('adminToken');
      location.reload();
    }

    function showAdmin() {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('admin-page').style.display = 'block';
      loadCategoriesForSelect();
      loadPage('dashboard');
    }

    if (localStorage.getItem('adminToken')) {
      adminToken = localStorage.getItem('adminToken');
      showAdmin();
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        document.getElementById('page-' + item.dataset.page).style.display = 'block';
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
        document.getElementById('products-list').innerHTML = '<tr><td colspan="8" class="empty">No products</td></tr>';
        return;
      }
      document.getElementById('products-list').innerHTML = products.map(p => '<tr>' +
        '<td><img src="' + (p.image || 'https://via.placeholder.com/80') + '" class="product-img"></td>' +
        '<td>' + p.name + '</td>' +
        '<td>' + (p.category_name_en || '-') + '</td>' +
        '<td>¥' + p.price + '</td>' +
        '<td>' + p.stock + '</td>' +
        '<td>' + p.sales + '</td>' +
        '<td><span class="status-badge" style="background:' + (p.status ? '#4caf50' : '#999') + '">' + (p.status ? 'Active' : 'Inactive') + '</span></td>' +
        '<td><div class="actions"><span class="action-link" onclick="editProduct(' + p.id + ')">Edit</span> <span class="action-link delete" onclick="deleteProduct(' + p.id + ')">Delete</span></div></td></tr>').join('');
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
        document.getElementById('orders-list').innerHTML = '<tr><td colspan="7" class="empty">No orders</td></tr>';
        return;
      }
      document.getElementById('orders-list').innerHTML = orders.map(o => '<tr>' +
        '<td>' + o.id + '</td>' +
        '<td>' + o.order_no + '</td>' +
        '<td>User #' + o.user_id + '</td>' +
        '<td>¥' + o.actual_price + '</td>' +
        '<td><span class="status-badge" style="background:' + getStatusColor(o.status) + '">' + o.status + '</span></td>' +
        '<td>' + (o.created_at || '').split(' ')[0] + '</td>' +
        '<td><div class="actions"><span class="action-link" onclick="viewOrder(' + o.id + ')">View</span></div></td></tr>').join('');
    }

    async function viewOrder(id) {
      const res = await api('/api/admin/orders/' + id);
      const data = await res.json();
      if (data.code === 0) {
        const o = data.data;
        const statusOptions = ['pending', 'paid', 'shipped', 'completed', 'cancelled'].map(s => '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s + '</option>').join('');
        document.getElementById('order-detail').innerHTML = '<div style="margin-bottom:20rpx"><strong>Order:</strong> ' + o.order_no + '</div>' +
          '<div style="margin-bottom:20rpx"><strong>Status:</strong> <select id="order-status-select" onchange="updateOrderStatus(' + o.id + ')">' + statusOptions + '</select></div>' +
          '<div style="margin-bottom:20rpx"><strong>Total:</strong> ¥' + o.actual_price + '</div>' +
          '<div style="margin-bottom:20rpx"><strong>Address:</strong> ' + (o.address || '-') + '</div>' +
          '<div class="order-items"><strong>Items:</strong>' + (o.items || []).map(i => '<div class="order-item">' +
            '<img src="' + (i.product_image || 'https://via.placeholder.com/100') + '">' +
            '<div class="order-item-info"><div>' + i.product_name + '</div><div>¥' + i.price + ' x ' + i.quantity + '</div></div>' +
            '<div>¥' + i.subtotal + '</div></div>').join('') + '</div>';
        document.getElementById('order-modal').classList.add('show');
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
        document.getElementById('categories-list').innerHTML = data.data.map(c => '<tr><td>' + c.id + '</td><td>' + c.name_en + '</td><td>' + c.name_zh + '</td><td>' + (c.icon || '-') + '</td><td><div class="actions"><span class="action-link delete" onclick="deleteCategory(' + c.id + ')">Delete</span></div></td></tr>').join('');
      }
    }

    async function loadBanners() {
      const res = await api('/api/admin/banners');
      const data = await res.json();
      if (data.code === 0) {
        document.getElementById('banners-list').innerHTML = data.data.map(b => '<tr>' +
          '<td><img src="' + b.image + '" class="product-img"></td>' +
          '<td>' + (b.title || '-') + '</td>' +
          '<td>' + (b.link_type ? b.link_type + ': ' + b.link_value : '-') + '</td>' +
          '<td><span class="status-badge" style="background:' + (b.status ? '#4caf50' : '#999') + '">' + (b.status ? 'Active' : 'Inactive') + '</span></td>' +
          '<td><div class="actions"><span class="action-link delete" onclick="deleteBanner(' + b.id + ')">Delete</span></div></td></tr>').join('');
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
      html += '<button ' + (prev < 1 ? 'disabled' : '') + ' onclick="changePage(\\'' + type + '\\',' + prev + ')">Prev</button>';
      for (let i = 1; i <= totalPages; i++) {
        if (i === page || i === 1 || i === totalPages || (i > page - 2 && i < page + 2)) {
          html += '<button class="' + (i === page ? 'active' : '') + '" onclick="changePage(\\'' + type + '\\',' + i + ')">' + i + '</button>';
        } else if (i === page - 3 || i === page + 3) {
          html += '<span>...</span>';
        }
      }
      const next = page + 1;
      html += '<button ' + (next > totalPages ? 'disabled' : '') + ' onclick="changePage(\\'' + type + '\\',' + next + ')">Next</button>';
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
      document.getElementById('product-modal').classList.add('show');
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
        document.getElementById('product-modal').classList.add('show');
      }
    }

    async function saveProduct() {
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
        alert(result.message);
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
      document.getElementById('category-modal').classList.add('show');
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
      document.getElementById('banner-modal').classList.add('show');
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
      document.getElementById(id).classList.remove('show');
    }
  </script>
</body>
</html>
    `);
  });
}

module.exports = { adminRouter };