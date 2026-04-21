const { getLanguage, getTranslations } = require('../../utils/i18n.js');

Page({
  data: {
    t: {},
    language: 'en',
    orders: [],
    currentTab: 0
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
    const allOrders = wx.getStorageSync('orders') || [];
    let orders = allOrders;
    if (this.data.currentTab === 1) orders = allOrders.filter(o => o.status === 'pending');
    else if (this.data.currentTab === 2) orders = allOrders.filter(o => o.status === 'paid');
    else if (this.data.currentTab === 3) orders = allOrders.filter(o => o.status === 'completed');
    this.setData({ orders });
  }
});