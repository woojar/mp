const { getLanguage, getTranslations } = require('../../utils/i18n.js');
Page({
  data: { t: {}, order: null },
  onLoad(options) {
    this.setData({ t: getTranslations() });
    if (options.id) {
      const orders = wx.getStorageSync('orders') || [];
      const order = orders.find(o => o.id === parseInt(options.id));
      this.setData({ order });
    }
  }
});