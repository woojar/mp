const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
let db;

async function initializeDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      image TEXT,
      images TEXT,
      category_id INTEGER,
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      province TEXT,
      city TEXT,
      district TEXT,
      detail TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      total_price REAL NOT NULL,
      discount_price REAL DEFAULT 0,
      actual_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_method TEXT DEFAULT 'wechat',
      pay_time DATETIME,
      address_id INTEGER,
      address TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT NOT NULL,
      link_type TEXT,
      link_value TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  seedData();
  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function seedData() {
  const cats = db.exec('SELECT COUNT(*) as count FROM categories');
  if (cats[0] && cats[0].values[0][0] === 0) {
    db.run("INSERT INTO categories (name_en, name_zh, icon, sort_order) VALUES ('Food', '食品', 'food', 1)");
    db.run("INSERT INTO categories (name_en, name_zh, icon, sort_order) VALUES ('Drinks', '饮料', 'drinks', 2)");
    db.run("INSERT INTO categories (name_en, name_zh, icon, sort_order) VALUES ('Daily Use', '日用品', 'daily', 3)");
    db.run("INSERT INTO categories (name_en, name_zh, icon, sort_order) VALUES ('Snacks', '零食', 'snacks', 4)");
  }

  const prods = db.exec('SELECT COUNT(*) as count FROM products');
  if (prods[0] && prods[0].values[0][0] === 0) {
    const defaultImages = JSON.stringify(['https://via.placeholder.com/400', 'https://via.placeholder.com/400']);
    db.run("INSERT INTO products (name, price, original_price, image, images, category_id, stock, sales, description) VALUES ('Instant Noodles', 5.5, 8.0, 'https://via.placeholder.com/200', ?, 1, 100, 1000, 'Delicious instant noodles')", [defaultImages]);
    db.run("INSERT INTO products (name, price, original_price, image, images, category_id, stock, sales, description) VALUES ('Mineral Water', 2.0, 2.5, 'https://via.placeholder.com/200', ?, 2, 500, 5000, 'Fresh mineral water')", [defaultImages]);
    db.run("INSERT INTO products (name, price, original_price, image, images, category_id, stock, sales, description) VALUES ('Tissue Box', 10.0, 15.0, 'https://via.placeholder.com/200', ?, 3, 80, 800, 'Soft 3-ply tissue')", [defaultImages]);
    db.run("INSERT INTO products (name, price, original_price, image, images, category_id, stock, sales, description) VALUES ('Toothbrush', 5.0, 8.0, 'https://via.placeholder.com/200', ?, 3, 50, 300, 'Quality toothbrush')", [defaultImages]);
    db.run("INSERT INTO products (name, price, original_price, image, images, category_id, stock, sales, description) VALUES ('Cookies', 8.0, 12.0, 'https://via.placeholder.com/200', ?, 4, 120, 2000, 'Crunchy cookies')", [defaultImages]);
    db.run("INSERT INTO products (name, price, original_price, image, images, category_id, stock, sales, description) VALUES ('Chips', 6.0, 10.0, 'https://via.placeholder.com/200', ?, 4, 150, 3500, 'Crispy potato chips')", [defaultImages]);
  }

  const banners = db.exec('SELECT COUNT(*) as count FROM banners');
  if (banners[0] && banners[0].values[0][0] === 0) {
    db.run("INSERT INTO banners (title, image, link_type, link_value, sort_order, status) VALUES ('Summer Sale', 'https://via.placeholder.com/750x300', 'category', '1', 1, 1)");
    db.run("INSERT INTO banners (title, image, link_type, link_value, sort_order, status) VALUES ('New Arrivals', 'https://via.placeholder.com/750x300', 'category', '2', 2, 1)");
  }

  const admins = db.exec('SELECT COUNT(*) as count FROM admins');
  if (admins[0] && admins[0].values[0][0] === 0) {
    db.run("INSERT INTO admins (username, password, name) VALUES ('admin', 'admin123', 'Administrator')");
  }
}

function exec(sql, params = []) {
  const stmt = db.prepare(sql);
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

function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
    const result = db.exec('SELECT last_insert_rowid()');
    if (result && result.length > 0 && result[0].values.length > 0) {
      return { lastInsertRowid: result[0].values[0][0] };
    }
    console.error('run() error: could not get last insert rowid');
    return null;
  } catch (err) {
    console.error('run() error:', err.message, 'SQL:', sql);
    throw err;
  }
}

const userOps = {
  findByOpenid(openid) {
    return execOne('SELECT * FROM users WHERE openid = ?', [openid]);
  },
  findById(id) {
    return execOne('SELECT id, openid, nickname, avatar, phone, language, created_at FROM users WHERE id = ?', [id]);
  },
  create(openid, userInfo = {}) {
    try {
      console.log('Creating user with openid:', openid);
      const result = run('INSERT INTO users (openid, nickname, avatar, phone) VALUES (?, ?, ?, ?)', [openid, userInfo.nickname || '', userInfo.avatar || '', userInfo.phone || '']);
      if (!result || !result.lastInsertRowid) {
        console.error('Failed to insert user: no rowid returned');
        return null;
      }
      const user = this.findById(result.lastInsertRowid);
      console.log('Created user:', user);
      return user;
    } catch (err) {
      console.error('Error creating user:', err.message);
      return null;
    }
  },
  update(id, data) {
    const fields = [];
    const values = [];
    if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.language !== undefined) { fields.push('language = ?'); values.push(data.language); }
    if (fields.length > 0) {
      values.push(id);
      run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findById(id);
  }
};

const categoryOps = {
  findAll() {
    return exec('SELECT * FROM categories ORDER BY sort_order');
  },
  findById(id) {
    return execOne('SELECT * FROM categories WHERE id = ?', [id]);
  }
};

const productOps = {
  findAll({ page = 1, limit = 20, category, keyword, status = 1 } = {}) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT p.*, c.name_en as category_name_en, c.name_zh as category_name_zh FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const params = [];
    
    if (status !== undefined) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    
    if (category && category !== '0') {
      sql += ' AND p.category_id = ?';
      params.push(parseInt(category));
    }
    
    if (keyword) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const products = exec(sql, params);
    
    const countSql = 'SELECT COUNT(*) as total FROM products WHERE status = ?';
    const { total } = execOne(countSql, [status]);
    
    return { products, total: total || 0, page, limit };
  },
  findById(id) {
    return execOne('SELECT p.*, c.name_en as category_name_en, c.name_zh as category_name_zh FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);
  },
  updateStock(id, quantity) {
    run('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?', [quantity, quantity, id]);
  }
};

const addressOps = {
  findByUser(userId) {
    return exec('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
  },
  findById(id) {
    return execOne('SELECT * FROM addresses WHERE id = ?', [id]);
  },
  create(userId, data) {
    if (data.is_default) {
      run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }
    const result = run('INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [userId, data.name, data.phone, data.province || '', data.city || '', data.district || '', data.detail, data.is_default ? 1 : 0]);
    return this.findById(result.lastInsertRowid);
  },
  update(id, userId, data) {
    if (data.is_default) {
      run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.province !== undefined) { fields.push('province = ?'); values.push(data.province); }
    if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
    if (data.district !== undefined) { fields.push('district = ?'); values.push(data.district); }
    if (data.detail !== undefined) { fields.push('detail = ?'); values.push(data.detail); }
    if (data.is_default !== undefined) { fields.push('is_default = ?'); values.push(data.is_default ? 1 : 0); }
    if (fields.length > 0) {
      values.push(id, userId);
      run(`UPDATE addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    }
    return this.findById(id);
  },
  delete(id, userId) {
    run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

const cartOps = {
  findByUser(userId) {
    return exec(`
      SELECT ci.*, p.name, p.price, p.image, p.stock 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ?
    `, [userId]);
  },
  add(userId, productId, quantity = 1) {
    const existing = execOne('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
    if (existing) {
      run('UPDATE cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, existing.id]);
      return existing.id;
    }
    const result = run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, productId, quantity]);
    return result.lastInsertRowid;
  },
  update(id, userId, quantity) {
    if (quantity <= 0) {
      return run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
    }
    return run('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [quantity, id, userId]);
  },
  remove(id, userId) {
    return run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
  },
  clear(userId) {
    return run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  }
};

const orderOps = {
  create(userId, orderData) {
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const result = run(`
      INSERT INTO orders (user_id, order_no, total_price, discount_price, actual_price, status, address_id, address, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      orderNo,
      orderData.totalPrice,
      orderData.discountPrice || 0,
      orderData.actualPrice,
      'pending',
      orderData.addressId || null,
      orderData.address || '',
      orderData.remark || ''
    ]);
    
    const orderId = result.lastInsertRowid;
    
    for (const item of orderData.items) {
      run(`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.productId, item.name, item.image, item.price, item.quantity, item.price * item.quantity]);
      productOps.updateStock(item.productId, item.quantity);
    }
    
    if (orderData.clearCart) {
      cartOps.clear(userId);
    }
    
    return this.findById(orderId, userId);
  },
  
  findByUser(userId, { page = 1, limit = 10, status } = {}) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [userId];
    
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const orders = exec(sql, params);
    
    const countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const { total } = execOne(countSql, [userId]);
    
    return { orders, total: total || 0, page, limit };
  },
  
  findById(orderId, userId) {
    const order = execOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (order) {
      order.items = exec('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    }
    return order;
  },
  
  updateStatus(id, userId, status) {
    const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    if (status === 'paid') {
      fields.push('pay_time = CURRENT_TIMESTAMP');
    }
    params.push(id, userId);
    run(`UPDATE orders SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, params);
  }
};

const favoriteOps = {
  findByUser(userId) {
    return exec(`
      SELECT f.*, p.name, p.price, p.image, p.stock, p.sales
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
    `, [userId]);
  },
  add(userId, productId) {
    try {
      const result = run('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [userId, productId]);
      return result.lastInsertRowid;
    } catch (e) {
      return null;
    }
  },
  remove(userId, productId) {
    return run('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [userId, productId]);
  },
  check(userId, productId) {
    return execOne('SELECT * FROM favorites WHERE user_id = ? AND product_id = ?', [userId, productId]);
  }
};

const bannerOps = {
  findActive() {
    return exec('SELECT * FROM banners WHERE status = 1 ORDER BY sort_order');
  }
};

const adminOps = {
  findByUsername(username, password) {
    return execOne('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
  }
};

const adminCategoryOps = {
  create(name_en, name_zh, icon = '') {
    const result = run('INSERT INTO categories (name_en, name_zh, icon) VALUES (?, ?, ?)', [name_en, name_zh, icon]);
    return { id: result.lastInsertRowid };
  },
  update(id, data) {
    const fields = [];
    const values = [];
    if (data.name_en) { fields.push('name_en = ?'); values.push(data.name_en); }
    if (data.name_zh) { fields.push('name_zh = ?'); values.push(data.name_zh); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (fields.length > 0) {
      values.push(id);
      run(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return true;
  },
  delete(id) {
    run('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }
};

const adminBannerOps = {
  create(data) {
    const result = run(
      'INSERT INTO banners (title, image, link_type, link_value, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)',
      [data.title || '', data.image, data.link_type || '', data.link_value || '', data.sort_order || 0, data.status || 1]
    );
    return { id: result.lastInsertRowid };
  },
  update(id, data) {
    const fields = [];
    const values = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
    if (data.link_type !== undefined) { fields.push('link_type = ?'); values.push(data.link_type); }
    if (data.link_value !== undefined) { fields.push('link_value = ?'); values.push(data.link_value); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (fields.length > 0) {
      values.push(id);
      run(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return true;
  },
  delete(id) {
    run('DELETE FROM banners WHERE id = ?', [id]);
    return true;
  }
};

const adminOrderOps = {
  findAll({ page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const orders = exec(sql, params);
    const total = execOne('SELECT COUNT(*) as count FROM orders' + (status && status !== 'all' ? ' WHERE status = ?' : ''), 
      status && status !== 'all' ? [status] : [])?.count || 0;
    return { orders, total, page, limit };
  },
  findById(id) {
    const order = execOne('SELECT * FROM orders WHERE id = ?', [id]);
    if (order) {
      order.items = exec('SELECT * FROM order_items WHERE order_id = ?', [id]);
    }
    return order;
  },
  updateStatus(id, status) {
    const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    if (status === 'paid') {
      fields.push('pay_time = CURRENT_TIMESTAMP');
    }
    params.push(id);
    run(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, params);
    return true;
  }
};

const adminProductOps = {
  create(data) {
    const result = run(
      'INSERT INTO products (name, price, original_price, image, images, category_id, stock, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.price, data.original_price || null, data.image || '', JSON.stringify(data.images || []), data.category_id || null, data.stock || 0, data.description || '', data.status !== undefined ? data.status : 1]
    );
    return { id: result.lastInsertRowid };
  },
  update(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.original_price !== undefined) { fields.push('original_price = ?'); values.push(data.original_price); }
    if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
    if (data.images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(data.images)); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (fields.length > 0) {
      values.push(id);
      run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return true;
  },
  delete(id) {
    run('DELETE FROM products WHERE id = ?', [id]);
    return true;
  }
};

module.exports = {
  initializeDatabase,
  getDb: () => db,
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
};