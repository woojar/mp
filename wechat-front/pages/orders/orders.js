const { getLanguage, getTranslations } = require('../../utils/i18n.js');
const app = getApp();

Page({
  data: {
    t: {},
    language: 'en',
    orders: [],
    currentTab: 0,
    loading: false
  },

  onShow() {
    this.setData({ t: getTranslations(), language: getLanguage() });
    this.loadOrders();
  },

  onTabChange(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
    this.loadOrders();
  },

  loadOrders() {
    this.setData({ loading: true });
    
    const token = wx.getStorageSync('token');
    console.log('=== ORDERS DEBUG ===');
    console.log('Token:', token ? 'exists (' + token.substring(0, 20) + '...)' : 'NOT FOUND');
    console.log('API Base:', app.globalData.apiBase);
    
    if (!token) {
      console.log('No token, showing empty orders');
      this.setData({ orders: [], loading: false });
      return;
    }

    const statusMap = ['', 'pending', 'paid', 'completed'];
    const status = statusMap[this.data.currentTab] || '';

    wx.request({
      url: `${app.globalData.apiBase}/orders`,
      data: { 
        page: 1, 
        limit: 50,
        status: status || undefined
      },
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('Orders response:', res);
        if (res.data.code === 0) {
          const orders = res.data.data.orders || [];
          console.log('Orders count:', orders.length);
          this.setData({ orders });
        } else {
          console.error('Orders error:', res.data);
          wx.showToast({ title: res.data.message || 'Failed to load orders', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('Load orders failed:', err);
        wx.showToast({ title: 'Network error: ' + (err.errMsg || 'unknown'), icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
});