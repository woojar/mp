global.wx = {
  getStorageSync: jest.fn((key) => {
    const storage = { language: 'en' };
    return storage[key] || null;
  }),
  setStorageSync: jest.fn((key, value) => {
    global.wx._storage = global.wx._storage || {};
    global.wx._storage[key] = value;
  })
};

const { t, setLanguage, getLanguage, getTranslations } = require('../../wechat-frontend/utils/i18n');

describe('i18n Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.wx._storage = {};
    wx.getStorageSync.mockImplementation((key) => global.wx._storage[key] || null);
  });

  test('t returns English translation by default', () => {
    const result = t('shop');
    expect(result).toBe('Shop');
  });

  test('t returns Chinese translation when language is zh', () => {
    wx.getStorageSync.mockReturnValue('zh');
    const result = t('shop');
    expect(result).toBe('商店');
  });

  test('t returns key if translation not found', () => {
    const result = t('unknown_key');
    expect(result).toBe('unknown_key');
  });

  test('setLanguage stores language in storage', () => {
    setLanguage('zh');
    expect(wx.setStorageSync).toHaveBeenCalledWith('language', 'zh');
  });

  test('getLanguage returns default English', () => {
    const result = getLanguage();
    expect(result).toBe('en');
  });

  test('getLanguage returns stored language', () => {
    wx.getStorageSync.mockReturnValue('zh');
    const result = getLanguage();
    expect(result).toBe('zh');
  });

  test('getTranslations returns all translations', () => {
    const translations = getTranslations();
    expect(translations.shop).toBe('Shop');
    expect(translations.cart).toBe('Cart');
    expect(translations.addToCart).toBe('Add to Cart');
  });
});

describe('Format Functions', () => {
  test('format price', () => {
    const formatPrice = (price) => '¥' + parseFloat(price).toFixed(2);
    expect(formatPrice(19.9)).toBe('¥19.90');
    expect(formatPrice(100)).toBe('¥100.00');
  });

  test('format date', () => {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    };
    expect(formatDate('2024-01-15')).toBe('1/15/2024');
  });

  test('truncate text', () => {
    const truncate = (text, length) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    };
    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Hi', 10)).toBe('Hi');
  });
});

describe('Validation Functions', () => {
  test('validate phone number', () => {
    const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone);
    expect(validatePhone('13812345678')).toBe(true);
    expect(validatePhone('19812345678')).toBe(true);
    expect(validatePhone('123')).toBe(false);
  });

  test('validate email', () => {
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  test('validate required field', () => {
    const required = (value) => value && value.toString().trim().length > 0;
    expect(required('test')).toBe(true);
    expect(required('')).toBeFalsy();
    expect(required(null)).toBeFalsy();
  });
});

describe('Calculation Functions', () => {
  test('calculate cart total', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(total).toBe(35);
  });

  test('apply coupon discount', () => {
    const applyCoupon = (total, discount) => {
      const discountAmount = typeof discount === 'number' ? discount : total * (discount / 100);
      return Math.max(0, total - discountAmount);
    };
    expect(applyCoupon(100, 20)).toBe(80);
    expect(applyCoupon(100, 10)).toBe(90);
  });

  test('calculate shipping fee', () => {
    const calculateShipping = (total, freeThreshold = 99) => {
      return total >= freeThreshold ? 0 : 10;
    };
    expect(calculateShipping(100)).toBe(0);
    expect(calculateShipping(50)).toBe(10);
  });
});

describe('Data Transformation', () => {
  test('group items by category', () => {
    const items = [
      { category: 'food', name: 'Apple' },
      { category: 'drinks', name: 'Water' },
      { category: 'food', name: 'Bread' }
    ];
    const grouped = items.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {});
    expect(grouped.food.length).toBe(2);
    expect(grouped.drinks.length).toBe(1);
  });

  test('filter active products', () => {
    const products = [
      { id: 1, status: 1 },
      { id: 2, status: 0 },
      { id: 3, status: 1 }
    ];
    const active = products.filter(p => p.status === 1);
    expect(active.length).toBe(2);
  });

  test('sort by price', () => {
    const products = [
      { price: 30 },
      { price: 10 },
      { price: 20 }
    ];
    const sorted = [...products].sort((a, b) => a.price - b.price);
    expect(sorted[0].price).toBe(10);
    expect(sorted[2].price).toBe(30);
  });
});