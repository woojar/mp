const path = require('path');

function adminRouter(app, db, authenticate, {
  categoryOps,
  productOps,
  addressOps,
  orderOps,
  favoriteOps,
  bannerOps
}) {
  const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin_secret_token') {
      return res.status(401).json({ code: 401, message: 'Unauthorized' });
    }
    next();
  };

  app.get('/api/admin/categories', adminAuth, (req, res) => {
    const categories = categoryOps.findAll();
    res.json({ code: 0, data: categories });
  });

  app.post('/api/admin/categories', adminAuth, (req, res) => {
    const { name_en, name_zh, icon } = req.body;
    if (!name_en || !name_zh) {
      return res.json({ code: 400, message: 'name_en and name_zh are required' });
    }
    const stmt = db.prepare('INSERT INTO categories (name_en, name_zh, icon) VALUES (?, ?, ?)');
    const result = stmt.run(name_en, name_zh, icon || '');
    res.json({ code: 0, data: { id: result.lastInsertRowid } });
  });

  app.put('/api/admin/categories/:id', adminAuth, (req, res) => {
    const { name_en, name_zh, icon } = req.body;
    const id = parseInt(req.params.id);
    const fields = [];
    const values = [];
    if (name_en) { fields.push('name_en = ?'); values.push(name_en); }
    if (name_zh) { fields.push('name_zh = ?'); values.push(name_zh); }
    if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
    if (fields.length === 0) {
      return res.json({ code: 400, message: 'No fields to update' });
    }
    values.push(id);
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    res.json({ code: 0, message: 'Category updated' });
  });

  app.delete('/api/admin/categories/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ code: 0, message: 'Category deleted' });
  });

  app.get('/api/admin/products', adminAuth, (req, res) => {
    const { page = 1, limit = 20, category, keyword } = req.query;
    const result = productOps.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      keyword,
      status: undefined
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
    const stmt = db.prepare(`
      INSERT INTO products (name, price, original_price, image, images, category_id, stock, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      price,
      original_price || null,
      image || '',
      images ? JSON.stringify(images) : '[]',
      category_id || null,
      stock || 0,
      description || ''
    );
    res.json({ code: 0, data: { id: result.lastInsertRowid } });
  });

  app.put('/api/admin/products/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price, original_price, image, images, category_id, stock, description, status } = req.body;
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (original_price !== undefined) { fields.push('original_price = ?'); values.push(original_price); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(images)); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
    if (stock !== undefined) { fields.push('stock = ?'); values.push(stock); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (fields.length === 0) {
      return res.json({ code: 400, message: 'No fields to update' });
    }
    values.push(id);
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    res.json({ code: 0, message: 'Product updated' });
  });

  app.delete('/api/admin/products/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ code: 0, message: 'Product deleted' });
  });

  app.get('/api/admin/orders', adminAuth, (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const orders = db.prepare(sql).all(...params);
    res.json({ code: 0, data: { orders, page: parseInt(page), limit: parseInt(limit) } });
  });

  app.get('/api/admin/orders/:id', adminAuth, (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.json({ code: 404, message: 'Order not found' });
    }
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    res.json({ code: 0, data: order });
  });

  app.put('/api/admin/orders/:id/status', adminAuth, (req, res) => {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    if (!status) {
      return res.json({ code: 400, message: 'status is required' });
    }
    const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    if (status === 'paid') {
      fields.push('pay_time = CURRENT_TIMESTAMP');
    }
    db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(status, id);
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
    const stmt = db.prepare('INSERT INTO banners (title, image, link_type, link_value, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(title || '', image, link_type || '', link_value || '', sort_order || 0, status || 1);
    res.json({ code: 0, data: { id: result.lastInsertRowid } });
  });

  app.put('/api/admin/banners/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { title, image, link_type, link_value, sort_order, status } = req.body;
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (link_type !== undefined) { fields.push('link_type = ?'); values.push(link_type); }
    if (link_value !== undefined) { fields.push('link_value = ?'); values.push(link_value); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (fields.length === 0) {
      return res.json({ code: 400, message: 'No fields to update' });
    }
    values.push(id);
    db.prepare(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    res.json({ code: 0, message: 'Banner updated' });
  });

  app.delete('/api/admin/banners/:id', adminAuth, (req, res) => {
    const id = parseInt(req.params.id);
    db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    res.json({ code: 0, message: 'Banner deleted' });
  });

  app.get('/api/admin/stats', adminAuth, (req, res) => {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare('SELECT SUM(actual_price) as total FROM orders WHERE status IN ("paid", "shipped", "completed")').get().total || 0;
    const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = "pending"').get().count;
    res.json({ code: 0, data: { totalProducts, totalOrders, totalRevenue, pendingOrders } });
  });

  app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Panel - Daily Goods Store</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .header { background: #e63946; color: #fff; padding: 20rpx 40rpx; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 36rpx; }
    .logout { color: #fff; text-decoration: none; }
    .nav { display: flex; background: #fff; border-bottom: 1rpx solid #eee; }
    .nav-item { padding: 30rpx 40rpx; cursor: pointer; border-bottom: 4rpx solid transparent; }
    .nav-item.active { border-color: #e63946; color: #e63946; }
    .content { padding: 40rpx; }
    .card { background: #fff; border-radius: 12rpx; padding: 30rpx; margin-bottom: 30rpx; }
    .stats { display: flex; gap: 30rpx; }
    .stat { flex: 1; text-align: center; }
    .stat-value { font-size: 48rpx; font-weight: bold; color: #e63946; }
    .stat-label { color: #666; margin-top: 10rpx; }
    .btn { background: #e63946; color: #fff; padding: 20rpx 40rpx; border: none; border-radius: 8rpx; cursor: pointer; font-size: 28rpx; }
    .btn-secondary { background: #fff; color: #e63946; border: 1rpx solid #e63946; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 20rpx; text-align: left; border-bottom: 1rpx solid #eee; }
    th { color: #666; font-weight: 500; }
    .form { display: flex; flex-direction: column; gap: 20rpx; }
    .form-item { display: flex; align-items: center; }
    .form-item label { width: 160rpx; color: #666; }
    .form-item input, .form-item textarea, .form-item select { flex: 1; padding: 20rpx; border: 1rpx solid #ddd; border-radius: 8rpx; }
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
    .modal.show { display: flex; }
    .modal-content { background: #fff; border-radius: 12rpx; padding: 40rpx; width: 80%; max-height: 80vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; margin-bottom: 30rpx; }
    .close { font-size: 40rpx; cursor: pointer; }
    .actions { display: flex; gap: 20rpx; }
    .action-btn { padding: 10rpx 20rpx; cursor: pointer; }
    .action-btn.edit { color: #e63946; }
    .action-btn.delete { color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Admin Panel</h1>
    <a href="/api/admin/logout" class="logout">Logout</a>
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
      <div class="card">
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="stat-products">0</div>
            <div class="stat-label">Products</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="stat-orders">0</div>
            <div class="stat-label">Orders</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="stat-revenue">0</div>
            <div class="stat-label">Revenue</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="stat-pending">0</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
      </div>
    </div>
    <div id="page-products" class="page" style="display:none">
      <div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:30rpx">
          <h2>Products</h2>
          <button class="btn" onclick="showProductModal()">+ Add Product</button>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Sales</th><th>Actions</th></tr></thead>
          <tbody id="products-list"></tbody>
        </table>
      </div>
    </div>
    <div id="page-categories" class="page" style="display:none">
      <div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:30rpx">
          <h2>Categories</h2>
          <button class="btn" onclick="showCategoryModal()">+ Add Category</button>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Name (EN)</th><th>Name (ZH)</th><th>Actions</th></tr></thead>
          <tbody id="categories-list"></tbody>
        </table>
      </div>
    </div>
    <div id="page-orders" class="page" style="display:none">
      <div class="card">
        <h2>Orders</h2>
        <table>
          <thead><tr><th>ID</th><th>Order No</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody id="orders-list"></tbody>
        </table>
      </div>
    </div>
    <div id="page-banners" class="page" style="display:none">
      <div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:30rpx">
          <h2>Banners</h2>
          <button class="btn" onclick="showBannerModal()">+ Add Banner</button>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Title</th><th>Image</th><th>Actions</th></tr></thead>
          <tbody id="banners-list"></tbody>
        </table>
      </div>
    </div>
  </div>
  <div id="product-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="product-modal-title">Add Product</h2>
        <span class="close" onclick="closeModal('product-modal')">&times;</span>
      </div>
      <div class="form">
        <div class="form-item"><label>Name</label><input id="product-name" placeholder="Product name"></div>
        <div class="form-item"><label>Price</label><input id="product-price" type="number" step="0.01" placeholder="Price"></div>
        <div class="form-item"><label>Original Price</label><input id="product-original-price" type="number" step="0.01" placeholder="Original price"></div>
        <div class="form-item"><label>Image URL</label><input id="product-image" placeholder="Image URL"></div>
        <div class="form-item"><label>Category</label><select id="product-category"></select></div>
        <div class="form-item"><label>Stock</label><input id="product-stock" type="number" placeholder="Stock quantity"></div>
        <div class="form-item"><label>Description</label><textarea id="product-description" placeholder="Description"></textarea></div>
        <button class="btn" onclick="saveProduct()">Save</button>
      </div>
    </div>
  </div>
  <div id="category-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add Category</h2>
        <span class="close" onclick="closeModal('category-modal')">&times;</span>
      </div>
      <div class="form">
        <div class="form-item"><label>Name (EN)</label><input id="category-name-en" placeholder="Name in English"></div>
        <div class="form-item"><label>Name (ZH)</label><input id="category-name-zh" placeholder="Name in Chinese"></div>
        <div class="form-item"><label>Icon</label><input id="category-icon" placeholder="Icon class"></div>
        <button class="btn" onclick="saveCategory()">Save</button>
      </div>
    </div>
  </div>
  <div id="banner-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add Banner</h2>
        <span class="close" onclick="closeModal('banner-modal')">&times;</span>
      </div>
      <div class="form">
        <div class="form-item"><label>Title</label><input id="banner-title" placeholder="Banner title"></div>
        <div class="form-item"><label>Image URL</label><input id="banner-image" placeholder="Image URL"></div>
        <div class="form-item"><label>Link Type</label><select id="banner-link-type"><option value="">None</option><option value="category">Category</option><option value="product">Product</option></select></div>
        <div class="form-item"><label>Link Value</label><input id="banner-link-value" placeholder="Category ID or Product ID"></div>
        <button class="btn" onclick="saveBanner()">Save</button>
      </div>
    </div>
  </div>
  <script>
    const API = '';
    let editingProductId = null;
    let editingBannerId = null;

    function getToken() {
      return 'Bearer admin_secret_token';
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
      const res = await fetch('/api/admin/stats', { headers: { Authorization: getToken() } });
      const data = await res.json();
      if (data.code === 0) {
        document.getElementById('stat-products').textContent = data.data.totalProducts;
        document.getElementById('stat-orders').textContent = data.data.totalOrders;
        document.getElementById('stat-revenue').textContent = '¥' + data.data.totalRevenue.toFixed(2);
        document.getElementById('stat-pending').textContent = data.data.pendingOrders;
      }
    }

    async function loadProducts() {
      const res = await fetch('/api/admin/products?limit=100', { headers: { Authorization: getToken() } });
      const data = await res.json();
      if (data.code === 0) {
        const tbody = document.getElementById('products-list');
        tbody.innerHTML = data.data.products.map(p => '<tr><td>' + p.id + '</td><td>' + p.name + '</td><td>¥' + p.price + '</td><td>' + p.stock + '</td><td>' + p.sales + '</td><td><span class="action-btn edit" onclick="editProduct(' + p.id + ')">Edit</span> <span class="action-btn delete" onclick="deleteProduct(' + p.id + ')">Delete</span></td></tr>').join('');
      }
    }

    async function loadCategories() {
      const res = await fetch('/api/admin/categories', { headers: { Authorization: getToken() } });
      const data = await res.json();
      if (data.code === 0) {
        const tbody = document.getElementById('categories-list');
        tbody.innerHTML = data.data.map(c => '<tr><td>' + c.id + '</td><td>' + c.name_en + '</td><td>' + c.name_zh + '</td><td><span class="action-btn delete" onclick="deleteCategory(' + c.id + ')">Delete</span></td></tr>').join('');
      }
    }

    async function loadOrders() {
      const res = await fetch('/api/admin/orders?limit=50', { headers: { Authorization: getToken() } });
      const data = await res.json();
      if (data.code === 0) {
        const tbody = document.getElementById('orders-list');
        tbody.innerHTML = data.data.orders.map(o => '<tr><td>' + o.id + '</td><td>' + o.order_no + '</td><td>¥' + o.actual_price + '</td><td>' + o.status + '</td><td>' + o.created_at + '</td><td><span class="action-btn edit" onclick="viewOrder(' + o.id + ')">View</span></td></tr>').join('');
      }
    }

    async function loadBanners() {
      const res = await fetch('/api/admin/banners', { headers: { Authorization: getToken() } });
      const data = await res.json();
      if (data.code === 0) {
        const tbody = document.getElementById('banners-list');
        tbody.innerHTML = data.data.map(b => '<tr><td>' + b.id + '</td><td>' + (b.title || '-') + '</td><td><img src="' + b.image + '" style="width:100rpx;height:50rpx"></td><td><span class="action-btn delete" onclick="deleteBanner(' + b.id + ')">Delete</span></td></tr>').join('');
      }
    }

    function showProductModal(id = null) {
      editingProductId = id;
      document.getElementById('product-modal-title').textContent = id ? 'Edit Product' : 'Add Product';
      if (id) {
        fetch('/api/admin/products/' + id, { headers: { Authorization: getToken() } }).then(r => r.json()).then(data => {
          if (data.code === 0) {
            document.getElementById('product-name').value = data.data.name;
            document.getElementById('product-price').value = data.data.price;
            document.getElementById('product-original-price').value = data.data.original_price || '';
            document.getElementById('product-image').value = data.data.image || '';
            document.getElementById('product-stock').value = data.data.stock;
            document.getElementById('product-description').value = data.data.description || '';
          }
        });
      } else {
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-original-price').value = '';
        document.getElementById('product-image').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-description').value = '';
      }
      document.getElementById('product-modal').classList.add('show');
    }

    async function saveProduct() {
      const data = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        original_price: parseFloat(document.getElementById('product-original-price').value) || null,
        image: document.getElementById('product-image').value,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value
      };
      const method = editingProductId ? 'PUT' : 'POST';
      const url = editingProductId ? '/api/admin/products/' + editingProductId : '/api/admin/products';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: getToken() },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.code === 0) {
        closeModal('product-modal');
        loadProducts();
      } else {
        alert(result.message);
      }
    }

    async function deleteProduct(id) {
      if (!confirm('Delete this product?')) return;
      await fetch('/api/admin/products/' + id, { method: 'DELETE', headers: { Authorization: getToken() } });
      loadProducts();
    }

    function showCategoryModal() {
      document.getElementById('category-modal').classList.add('show');
    }

    async function saveCategory() {
      const data = {
        name_en: document.getElementById('category-name-en').value,
        name_zh: document.getElementById('category-name-zh').value,
        icon: document.getElementById('category-icon').value
      };
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: getToken() },
        body: JSON.stringify(data)
      });
      closeModal('category-modal');
      loadCategories();
    }

    async function deleteCategory(id) {
      if (!confirm('Delete this category?')) return;
      await fetch('/api/admin/categories/' + id, { method: 'DELETE', headers: { Authorization: getToken() } });
      loadCategories();
    }

    function showBannerModal(id = null) {
      editingBannerId = id;
      document.getElementById('banner-modal').classList.add('show');
    }

    async function saveBanner() {
      const data = {
        title: document.getElementById('banner-title').value,
        image: document.getElementById('banner-image').value,
        link_type: document.getElementById('banner-link-type').value,
        link_value: document.getElementById('banner-link-value').value
      };
      await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: getToken() },
        body: JSON.stringify(data)
      });
      closeModal('banner-modal');
      loadBanners();
    }

    async function deleteBanner(id) {
      if (!confirm('Delete this banner?')) return;
      await fetch('/api/admin/banners/' + id, { method: 'DELETE', headers: { Authorization: getToken() } });
      loadBanners();
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('show');
    }

    loadDashboard();
  </script>
</body>
</html>
    `);
  });
}

module.exports = { adminRouter };