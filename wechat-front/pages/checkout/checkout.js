const { getLanguage, getTranslations } = require('../../utils/i18n.js');

Page({
  data: {
    t: {},
    language: 'en',
    items: [],
    address: null,
    totalPrice: 0
  },

  onLoad() {
    this.setData({ t: getTranslations(), language: getLanguage() });
    const items = wx.getStorageSync('checkoutItems') || [];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.setData({ items, totalPrice: total.toFixed(2) });
  },

  onShow() {
    this.setData({ t: getTranslations(), language: getLanguage() });
  },

  onChooseAddress() {
    wx.chooseAddress({
      success: (res) => {
        this.setData({ address: res });
      }
    });
  },

  onSubmitOrder() {
    if (!this.data.address) {
      wx.showToast({ title: this.data.t.selectAddress, icon: 'none' });
      return;
    }
    
    const order = {
      id: Date.now(),
      items: this.data.items,
      totalPrice: this.data.totalPrice,
      address: this.data.address,
      status: 'pending',
      createTime: new Date().toISOString()
    };
    
    const orders = wx.getStorageSync('orders') || [];
    orders.unshift(order);
    wx.setStorageSync('orders', orders);
    
    wx.removeStorageSync('cart');
    wx.removeStorageSync('checkoutItems');
    
    wx.showToast({ title: this.data.t.orderPlaced, icon: 'none' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/user/user' });
    }, 1500);
  }
});