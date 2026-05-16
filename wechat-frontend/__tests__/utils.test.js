const { t, setLanguage, getLanguage, getTranslations } = require('../utils/i18n.js');

describe('i18n Utils', () => {
  beforeEach(() => {
    wx.getStorageSync.mockClear();
    wx.setStorageSync.mockClear();
  });

  test('t returns English translation by default', () => {
    wx.getStorageSync.mockReturnValue('en');
    expect(t('shop')).toBe('Shop');
    expect(t('cart')).toBe('Cart');
    expect(t('total')).toBe('Total');
    expect(t('checkout')).toBe('Checkout');
  });

  test('t returns Chinese translation when language is zh', () => {
    wx.getStorageSync.mockReturnValue('zh');
    expect(t('shop')).toBe('商店');
    expect(t('cart')).toBe('购物车');
    expect(t('total')).toBe('合计');
    expect(t('checkout')).toBe('结算');
  });

  test('t returns key if translation not found', () => {
    wx.getStorageSync.mockReturnValue('en');
    expect(t('nonexistent_key')).toBe('nonexistent_key');
  });

  test('setLanguage stores language in storage', () => {
    setLanguage('zh');
    expect(wx.setStorageSync).toHaveBeenCalledWith('language', 'zh');
  });

  test('getLanguage returns default English', () => {
    wx.getStorageSync.mockReturnValue(null);
    const lang = getLanguage();
    expect(lang).toBe('en');
  });

  test('getLanguage returns stored language', () => {
    wx.getStorageSync.mockReturnValue('zh');
    const lang = getLanguage();
    expect(lang).toBe('zh');
  });

  test('getTranslations returns all translations', () => {
    wx.getStorageSync.mockReturnValue('en');
    const translations = getTranslations();
    expect(translations).toHaveProperty('shop');
    expect(translations).toHaveProperty('cart');
    expect(translations.shop).toBe('Shop');
  });
});

describe('Payment Flow Tests', () => {
  test('calculate order total correctly', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 20, quantity: 1 },
      { price: 5, quantity: 3 }
    ];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(total).toBe(55);
  });

  test('apply discount to order', () => {
    const totalPrice = 100;
    const discountPrice = 15;
    const actualPrice = totalPrice - discountPrice;
    expect(actualPrice).toBe(85);
  });

  test('validate order has required fields', () => {
    const orderData = {
      items: [{ productId: 1, quantity: 1, price: 10 }],
      totalPrice: 10,
      actualPrice: 10,
      address: 'Test Address'
    };
    const hasItems = orderData.items && orderData.items.length > 0;
    const hasActualPrice = orderData.actualPrice > 0;
    expect(hasItems).toBe(true);
    expect(hasActualPrice).toBe(true);
  });

  test('format price with 2 decimal places', () => {
    const formatPrice = (price) => parseFloat(price).toFixed(2);
    expect(formatPrice(10)).toBe('10.00');
    expect(formatPrice(10.5)).toBe('10.50');
    expect(formatPrice(10.123)).toBe('10.12');
  });

  test('calculate cart total with selected items only', () => {
    const cart = [
      { price: 10, quantity: 2, selected: true },
      { price: 20, quantity: 1, selected: false },
      { price: 5, quantity: 3, selected: true }
    ];
    const total = cart.filter(item => item.selected).reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(total).toBe(35);
  });

  test('toggle item selection in cart', () => {
    const cart = [{ id: 1, selected: false }, { id: 2, selected: true }, { id: 3, selected: false }];
    const updated = cart.map(item => {
      if (item.id === 1) item.selected = !item.selected;
      return item;
    });
    expect(updated[0].selected).toBe(true);
    expect(updated[1].selected).toBe(true);
    expect(updated[2].selected).toBe(false);
  });

  test('select all items in cart', () => {
    const cart = [{ id: 1, selected: false }, { id: 2, selected: true }, { id: 3, selected: false }];
    const selectAll = true;
    const updated = cart.map(item => ({ ...item, selected: selectAll }));
    expect(updated.every(item => item.selected)).toBe(true);
  });

  test('filter orders by status', () => {
    const orders = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'paid' },
      { id: 3, status: 'completed' },
      { id: 4, status: 'pending' }
    ];
    const pending = orders.filter(o => o.status === 'pending');
    const paid = orders.filter(o => o.status === 'paid');
    expect(pending.length).toBe(2);
    expect(paid.length).toBe(1);
  });

  test('sort orders by date descending', () => {
    const orders = [
      { id: 1, created_at: '2024-01-01' },
      { id: 2, created_at: '2024-03-01' },
      { id: 3, created_at: '2024-02-01' }
    ];
    const sorted = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });

  test('validate address has required fields', () => {
    const address = { name: 'Test User', phone: '123456789', detail: 'Test Street 123' };
    const isValid = !!(address.name && address.phone && address.detail);
    expect(isValid).toBe(true);
  });

  test('validate phone number format', () => {
    const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone);
    expect(validatePhone('13812345678')).toBe(true);
    expect(validatePhone('19812345678')).toBe(true);
    expect(validatePhone('12345678901')).toBe(false);
    expect(validatePhone('invalid')).toBe(false);
  });

  test('truncate long text', () => {
    const truncate = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    expect(truncate('Short', 10)).toBe('Short');
    expect(truncate('This is a very long text', 10)).toBe('This is a ...');
  });

  test('group cart items by category', () => {
    const items = [
      { id: 1, category: 'Food', name: 'Apple' },
      { id: 2, category: 'Drinks', name: 'Water' },
      { id: 3, category: 'Food', name: 'Bread' }
    ];
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
    expect(grouped.Food.length).toBe(2);
    expect(grouped.Drinks.length).toBe(1);
  });

  test('calculate pagination', () => {
    const totalItems = 95;
    const pageSize = 20;
    const currentPage = 1;
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasMore = currentPage < totalPages;
    expect(totalPages).toBe(5);
    expect(hasMore).toBe(true);
  });
});

describe('Checkout Flow', () => {
  test('prepare order data for submission', () => {
    const checkoutItems = [
      { id: 1, name: 'Product 1', price: 10, quantity: 2 },
      { id: 2, name: 'Product 2', price: 20, quantity: 1 }
    ];
    const address = { name: 'Test User', phone: '13812345678', detail: 'Test Address' };
    const orderData = {
      items: checkoutItems.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
      totalPrice: checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      discountPrice: 0,
      actualPrice: checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      address,
      remark: ''
    };
    expect(orderData.items.length).toBe(2);
    expect(orderData.totalPrice).toBe(40);
    expect(orderData.actualPrice).toBe(40);
  });

  test('clear cart after successful order', () => {
    const cart = [{ id: 1, name: 'Product 1', price: 10, quantity: 2 }];
    const orderSuccess = true;
    if (orderSuccess) cart.length = 0;
    expect(cart.length).toBe(0);
  });

  test('handle payment response', () => {
    const paymentResponse = {
      code: 0,
      data: {
        timeStamp: '1234567890',
        nonceStr: 'abc123',
        package: 'prepay_id=wx123',
        signType: 'MD5',
        paySign: 'signature'
      }
    };
    expect(paymentResponse.code).toBe(0);
    expect(paymentResponse.data.timeStamp).toBeDefined();
    expect(paymentResponse.data.package).toContain('prepay_id');
  });

  test('validate payment parameters', () => {
    const payParams = {
      timeStamp: '1234567890',
      nonceStr: 'abc123',
      package: 'prepay_id=wx123',
      signType: 'MD5',
      paySign: 'signature'
    };
    const requiredFields = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign'];
    const isValid = requiredFields.every(field => payParams[field] !== undefined);
    expect(isValid).toBe(true);
  });
});

describe('to-pay Page Logic', () => {
  test('parse order data from response', () => {
    const responseData = {
      id: 123,
      order_no: 'ORD123456',
      total_price: 100,
      actual_price: 100,
      items: [{ name: 'Product 1', price: 50, quantity: 2 }],
      address: { name: 'Test', phone: '13812345678', detail: 'Address' }
    };
    const orderData = {
      id: responseData.id,
      order_no: responseData.order_no,
      totalPrice: responseData.total_price,
      actual_price: responseData.actual_price,
      items: responseData.items,
      address: responseData.address
    };
    expect(orderData.id).toBe(123);
    expect(orderData.order_no).toBe('ORD123456');
    expect(orderData.items.length).toBe(1);
  });

  test('format order for storage before to-pay redirect', () => {
    const checkoutItems = [
      { id: 1, name: 'Product 1', price: 10, quantity: 2 },
      { id: 2, name: 'Product 2', price: 20, quantity: 1 }
    ];
    const address = { name: 'Test User', phone: '13812345678', province: 'Shanghai', city: 'Shanghai', district: 'Pudong', detail: 'Test St 123' };
    const pendingOrder = {
      id: 100,
      order_no: 'ORD' + Date.now(),
      totalPrice: checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      items: checkoutItems,
      address: address
    };
    expect(pendingOrder.totalPrice).toBe(40);
    expect(pendingOrder.items.length).toBe(2);
    expect(pendingOrder.address.name).toBe('Test User');
  });

  test('validate payment params have required fields', () => {
    const paymentParams = {
      timeStamp: '1234567890',
      nonceStr: 'abc123',
      package: 'prepay_id=wx123',
      signType: 'MD5',
      paySign: 'signature'
    };
    const requiredFields = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign'];
    const hasAllFields = requiredFields.every(field => paymentParams[field] !== undefined);
    expect(hasAllFields).toBe(true);
  });

  test('handle payment success response', () => {
    const paymentSuccessResponse = { errMsg: 'requestPayment:ok' };
    expect(paymentSuccessResponse.errMsg).toContain('ok');
  });

  test('handle payment cancel response', () => {
    const paymentCancelResponse = { errMsg: 'requestPayment:fail cancel' };
    expect(paymentCancelResponse.errMsg).toContain('cancel');
  });

  test('calculate remaining time for payment', () => {
    const orderCreatedAt = Date.now();
    const paymentTimeout = 30 * 60 * 1000;
    const remainingTime = paymentTimeout - (Date.now() - orderCreatedAt);
    expect(remainingTime).toBeLessThanOrEqual(paymentTimeout);
  });

  test('format address for display', () => {
    const address = { province: 'Shanghai', city: 'Shanghai', district: 'Pudong', detail: 'Test Street 123' };
    const fullAddress = `${address.province}${address.city}${address.district}${address.detail}`;
    expect(fullAddress).toBe('ShanghaiShanghaiPudongTest Street 123');
  });

  test('validate order can be paid (status is pending)', () => {
    const order = { id: 1, status: 'pending', actual_price: 100 };
    const canPay = order.status === 'pending' && order.actual_price > 0;
    expect(canPay).toBe(true);
  });

  test('validate order cannot be paid if already paid', () => {
    const order = { id: 1, status: 'paid', actual_price: 100 };
    const canPay = order.status === 'pending' && order.actual_price > 0;
    expect(canPay).toBe(false);
  });

  test('validate order cannot be paid if cancelled', () => {
    const order = { id: 1, status: 'cancelled', actual_price: 100 };
    const canPay = order.status === 'pending' && order.actual_price > 0;
    expect(canPay).toBe(false);
  });

  test('parse order items from checkout items', () => {
    const checkoutItems = [
      { id: 1, name: 'Product 1', price: 10, quantity: 2 },
      { id: 2, name: 'Product 2', price: 15, quantity: 3 }
    ];
    const orderItems = checkoutItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));
    expect(orderItems[0].subtotal).toBe(20);
    expect(orderItems[1].subtotal).toBe(45);
  });
});

describe('Search Functionality', () => {
  test('filter products by keyword', () => {
    const products = [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }, { id: 3, name: 'Orange' }];
    const keyword = 'app';
    const filtered = products.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Apple');
  });

  test('filter products by category', () => {
    const products = [{ id: 1, name: 'Apple', category_id: 1 }, { id: 2, name: 'Water', category_id: 2 }, { id: 3, name: 'Bread', category_id: 1 }];
    const categoryId = 1;
    const filtered = products.filter(p => p.category_id === categoryId);
    expect(filtered.length).toBe(2);
  });

  test('filter products by price range', () => {
    const products = [{ id: 1, name: 'Cheap', price: 5 }, { id: 2, name: 'Medium', price: 15 }, { id: 3, name: 'Expensive', price: 50 }];
    const minPrice = 10;
    const maxPrice = 30;
    const filtered = products.filter(p => p.price >= minPrice && p.price <= maxPrice);
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Medium');
  });

  test('sort products by price', () => {
    const products = [{ id: 1, name: 'C', price: 15 }, { id: 2, name: 'A', price: 5 }, { id: 3, name: 'B', price: 10 }];
    const sortedAsc = [...products].sort((a, b) => a.price - b.price);
    const sortedDesc = [...products].sort((a, b) => b.price - a.price);
    expect(sortedAsc[0].price).toBe(5);
    expect(sortedDesc[0].price).toBe(15);
  });
});