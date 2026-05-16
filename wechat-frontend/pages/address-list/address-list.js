const { getLanguage, getTranslations } = require('../../utils/i18n.js');
Page({
  data: { t: {}, addresses: [] },
  onLoad() { this.setData({ t: getTranslations() }); },
  onAddAddress() { wx.navigateTo({ url: '/pages/address-edit/address-edit' }); }
});