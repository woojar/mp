const { getLanguage, getTranslations } = require('../../utils/i18n.js');
const app = getApp();

Page({
  data: { t: {}, order: null },
  onLoad(options) {
    this.setData({ t: getTranslations() });
    if (options.id) {
      this.loadOrder(options.id);
    }
  },

  loadOrder(id) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: 'Please login', icon: 'none' });
      return;
    }

    wx.request({
      url: `${app.globalData.apiBase}/orders/${id}`,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ order: res.data.data });
        } else {
          wx.showToast({ title: 'Order not found', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: 'Network error', icon: 'none' });
      }
    });
  }
});