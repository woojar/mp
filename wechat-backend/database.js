const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'store.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (address_id) REFERENCES addresses(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT NOT NULL,
      link_type TEXT,
      link_value TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedData();
}

function seedData() {
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name_en, name_zh, icon, sort_order) VALUES (?, ?, ?, ?)');
    insertCategory.run('Food', '食品', 'food', 1);
    insertCategory.run('Drinks', '饮料', 'drinks', 2);
    insertCategory.run('Daily Use', '日用品', 'daily', 3);
    insertCategory.run('Snacks', '零食', 'snacks', 4);
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const insertProduct = db.prepare('INSERT INTO products (name, price, original_price, image, images, category_id, stock, sales, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    const defaultImages = JSON.stringify(['https://via.placeholder.com/400', 'https://via.placeholder.com/400']);
    
    insertProduct.run('Instant Noodles', 5.5, 8.0, 'https://via.placeholder.com/200', defaultImages, 1, 100, 1000, 'Delicious instant noodles with rich flavor');
    insertProduct.run('Mineral Water', 2.0, 2.5, 'https://via.placeholder.com/200', defaultImages, 2, 500, 5000, 'Fresh mineral water from mountain springs');
    insertProduct.run('Tissue Box', 10.0, 15.0, 'https://via.placeholder.com/200', defaultImages, 3, 80, 800, 'Soft 3-ply tissue box');
    insertProduct.run('Toothbrush', 5.0, 8.0, 'https://via.placeholder.com/200', defaultImages, 3, 50, 300, 'Quality toothbrush with soft bristles');
    insertProduct.run('Cookies', 8.0, 12.0, 'https://via.placeholder.com/200', defaultImages, 4, 120, 2000, 'Crunchy cookies with chocolate chips');
    insertProduct.run('Chips', 6.0, 10.0, 'https://via.placeholder.com/200', defaultImages, 4, 150, 3500, 'Crispy potato chips');
    insertProduct.run('Orange Juice', 4.5, 6.0, 'https://via.placeholder.com/200', defaultImages, 2, 80, 1200, 'Freshly squeezed orange juice');
    insertProduct.run('Shampoo', 25.0, 35.0, 'https://via.placeholder.com/200', defaultImages, 3, 40, 600, 'Gentle shampoo for all hair types');
    insertProduct.run('Soap', 3.0, 5.0, 'https://via.placeholder.com/200', defaultImages, 3, 100, 800, 'Natural soap with moisturizing formula');
    insertProduct.run('Candy', 2.0, 3.0, 'https://via.placeholder.com/200', defaultImages, 4, 200, 3000, 'Sweet candy for everyone');
  }

  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get();
  if (bannerCount.count === 0) {
    const insertBanner = db.prepare('INSERT INTO banners (title, image, link_type, link_value, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)');
    insertBanner.run('Summer Sale', 'https://via.placeholder.com/750x300', 'category', '1', 1, 1);
    insertBanner.run('New Arrivals', 'https://via.placeholder.com/750x300', 'category', '2', 2, 1);
    insertBanner.run('Hot Products', 'https://via.placeholder.com/750x300', 'category', '3', 3, 1);
  }
}

const userOps = {
  findByOpenid(openid) {
    return db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  },
  findById(id) {
    return db.prepare('SELECT id, openid, nickname, avatar, phone, language, created_at FROM users WHERE id = ?').get(id);
  },
  create(openid, userInfo = {}) {
    const stmt = db.prepare('INSERT INTO users (openid, nickname, avatar, phone) VALUES (?, ?, ?, ?)');
    const result = stmt.run(openid, userInfo.nickname || '', userInfo.avatar || '', userInfo.phone || '');
    return this.findById(result.lastInsertRowid);
  },
  update(id, data) {
    const fields = [];
    const values = [];
    if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.language !== undefined) { fields.push('language = ?'); values.push(data.language); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }
};

const categoryOps = {
  findAll() {
    return db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  },
  findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }
};

const productOps = {
  findAll({ page = 1, limit = 20, category, keyword, status = 1 } = {}) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT p.*, c.name_en as category_name_en, c.name_zh as category_name_zh FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = ?';
    const params = [status];
    
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
    
    const products = db.prepare(sql).all(...params);
    
    const countSql = 'SELECT COUNT(*) as total FROM products WHERE status = ?' + 
      (category && category !== '0' ? ' AND category_id = ?' : '') +
      (keyword ? ' AND (name LIKE ? OR description LIKE ?)' : '');
    
    const countParams = [status];
    if (category && category !== '0') countParams.push(parseInt(category));
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`);
    
    const { total } = db.prepare(countSql).get(...countParams);
    
    return { products, total, page, limit };
  },
  findById(id) {
    return db.prepare('SELECT p.*, c.name_en as category_name_en, c.name_zh as category_name_zh FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(id);
  },
  updateStock(id, quantity) {
    return db.prepare('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?').run(quantity, quantity, id);
  }
};

const addressOps = {
  findByUser(userId) {
    return db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(userId);
  },
  findById(id) {
    return db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  },
  create(userId, data) {
    if (data.is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    }
    const stmt = db.prepare('INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(userId, data.name, data.phone, data.province || '', data.city || '', data.district || '', data.detail, data.is_default ? 1 : 0);
    return this.findById(result.lastInsertRowid);
  },
  update(id, userId, data) {
    if (data.is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
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
    values.push(id, userId);
    db.prepare(`UPDATE addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return this.findById(id);
  },
  delete(id, userId) {
    return db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, userId);
  }
};

const cartOps = {
  findByUser(userId) {
    return db.prepare(`
      SELECT ci.*, p.name, p.price, p.image, p.stock 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ?
    `).all(userId);
  },
  add(userId, productId, quantity = 1) {
    const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId);
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, existing.id);
      return existing.id;
    }
    const result = db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, productId, quantity);
    return result.lastInsertRowid;
  },
  update(id, userId, quantity) {
    if (quantity <= 0) {
      return db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, userId);
    }
    return db.prepare('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(quantity, id, userId);
  },
  remove(id, userId) {
    return db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, userId);
  },
  clear(userId) {
    return db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  }
};

const orderOps = {
  create(userId, orderData) {
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const insertOrder = db.prepare(`
      INSERT INTO orders (user_id, order_no, total_price, discount_price, actual_price, status, address_id, address, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertOrder.run(
      userId,
      orderNo,
      orderData.totalPrice,
      orderData.discountPrice || 0,
      orderData.actualPrice,
      'pending',
      orderData.addressId || null,
      orderData.address || '',
      orderData.remark || ''
    );
    
    const orderId = result.lastInsertRowid;
    
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of orderData.items) {
      insertItem.run(orderId, item.productId, item.name, item.image, item.price, item.quantity, item.price * item.quantity);
      productOps.updateStock(item.productId, item.quantity);
    }
    
    if (orderData.clearCart) {
      cartOps.clear(userId);
    }
    
    return this.findById(orderId);
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
    
    const orders = db.prepare(sql).all(...params);
    
    const countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?' + 
      (status && status !== 'all' ? ' AND status = ?' : '');
    const countParams = [userId];
    if (status && status !== 'all') countParams.push(status);
    const { total } = db.prepare(countSql).get(...countParams);
    
    return { orders, total, page, limit };
  },
  
  findById(orderId, userId) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (order) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    }
    return order;
  },
  
  updateStatus(id, userId, status) {
    const updateData = { status };
    if (status === 'paid') {
      updateData.pay_time = new Date().toISOString();
    }
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    });
    values.push(id, userId);
    return db.prepare(`UPDATE orders SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).run(...values);
  }
};

const favoriteOps = {
  findByUser(userId) {
    return db.prepare(`
      SELECT f.*, p.name, p.price, p.image, p.stock, p.sales
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ?
    `).all(userId);
  },
  add(userId, productId) {
    try {
      const result = db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(userId, productId);
      return result.lastInsertRowid;
    } catch (e) {
      return null;
    }
  },
  remove(userId, productId) {
    return db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(userId, productId);
  },
  check(userId, productId) {
    return db.prepare('SELECT * FROM favorites WHERE user_id = ? AND product_id = ?').get(userId, productId);
  }
};

const bannerOps = {
  findActive() {
    return db.prepare('SELECT * FROM banners WHERE status = 1 ORDER BY sort_order').all();
  }
};

module.exports = {
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
};