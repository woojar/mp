// Mock WeChat wx.* APIs for Jest tests
global.wx = {
  getStorageSync: jest.fn((key) => {
    const storage = {
      language: 'en',
      token: null,
      userInfo: null,
      cart: [],
      orders: [],
      checkoutItems: [],
      favorites: []
    };
    return storage[key] || null;
  }),
  setStorageSync: jest.fn((key, value) => {
    // Mock storage
  }),
  removeStorageSync: jest.fn((key) => {
    // Mock storage removal
  }),
  request: jest.fn((options) => {
    // Mock request - will be overridden in tests
    if (options.success) {
      options.success({ data: { code: 0, data: {} } });
    }
  }),
  showToast: jest.fn((options) => {
    // Mock toast
  }),
  showModal: jest.fn((options) => {
    // Mock modal
    if (options.success) {
      options.success({ confirm: true });
    }
  }),
  navigateTo: jest.fn((options) => {
    // Mock navigation
  }),
  navigateBack: jest.fn((options) => {
    // Mock back navigation
  }),
  switchTab: jest.fn((options) => {
    // Mock tab switch
  }),
  redirectTo: jest.fn((options) => {
    // Mock redirect
  }),
  login: jest.fn((options) => {
    // Mock login
    if (options.success) {
      options.success({ code: 'mock_login_code' });
    }
  }),
  getUserProfile: jest.fn((options) => {
    // Mock user profile
    if (options.success) {
      options.success({
        userInfo: {
          nickName: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          gender: 1,
          language: 'en',
          city: 'Shanghai',
          province: 'Shanghai',
          country: 'China'
        }
      });
    }
  }),
  chooseAddress: jest.fn((options) => {
    // Mock address selection
    if (options.success) {
      options.success({
        userName: 'Test User',
        telNumber: '123456789',
        provinceName: 'Shanghai',
        cityName: 'Shanghai',
        countyName: 'Pudong',
        detailInfo: 'Test Street 123'
      });
    }
  }),
  showLoading: jest.fn(() => {}),
  hideLoading: jest.fn(() => {}),
  getSystemInfo: jest.fn((options) => {
    if (options.success) {
      options.success({
        model: 'iPhone 12',
        system: 'iOS 14.0',
        screenWidth: 375,
        screenHeight: 812
      });
    }
  })
};

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
