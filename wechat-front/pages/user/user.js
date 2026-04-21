const { setLanguage, getLanguage, getTranslations } = require('../../utils/i18n.js');

Page({
  data: {
    t: {},
    language: 'en',
    userInfo: null,
    isLoggedIn: false
  },

  onLoad() {
    this.setData({ language: getLanguage(), t: getTranslations() });
    this.checkLogin();
  },

  onShow() {
    this.setData({ language: getLanguage(), t: getTranslations() });
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.setData({ userInfo, isLoggedIn: true });
    }
  },

  onLogin() {
    wx.getUserProfile({
      desc: 'For user profile',
      success: (res) => {
        wx.setStorageSync('userInfo', res.userInfo);
        this.setData({ userInfo: res.userInfo, isLoggedIn: true });
        this.loginWithBackend(res.userInfo);
      }
    });
  },

  loginWithBackend(userInfo) {
    wx.login({
      success: (res) => {
        if (res.code) {
          const app = getApp();
          wx.request({
            url: `${app.globalData.apiBase}/auth/login`,
            method: 'POST',
            data: { code: res.code, userInfo },
            success: (response) => {
              if (response.data.code === 0) {
                wx.setStorageSync('token', response.data.data.token);
              }
            }
          });
        }
      }
    });
  },

  onViewOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },

  onViewFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  onViewAddress() {
    wx.navigateTo({ url: '/pages/address-list/address-list' });
  },

  onContactService() {
    wx.showModal({
      title: this.data.t.contactService,
      content: 'Contact: 400-xxx-xxxx',
      showCancel: false
    });
  },

  onSwitchLanguage(e) {
    const lang = e.currentTarget.dataset.lang;
    setLanguage(lang);
    this.setData({ language: lang, t: getTranslations() });
  }
});