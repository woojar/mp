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
        console.log('=== LOGIN DEBUG ===');
        console.log('User profile:', res.userInfo);
        
        wx.setStorageSync('userInfo', res.userInfo);
        this.setData({ userInfo: res.userInfo, isLoggedIn: true });
        
        this.loginWithBackend(res.userInfo);
      },
      fail: (err) => {
        console.error('Get user profile failed:', err);
        wx.showToast({ title: 'Login cancelled', icon: 'none' });
      }
    });
  },

  loginWithBackend(userInfo) {
    wx.login({
      success: (res) => {
        console.log('wx.login success, code:', res.code);
        
        if (res.code) {
          const app = getApp();
          console.log('Calling login API:', `${app.globalData.apiBase}/auth/login`);
          
          wx.request({
            url: `${app.globalData.apiBase}/auth/login`,
            method: 'POST',
            data: { code: res.code, userInfo },
            success: (response) => {
              console.log('Login response:', response);
              console.log('Login response data:', response.data);
              
              if (response.data.code === 0) {
                const token = response.data.data.token;
                console.log('Token received:', token ? 'YES' : 'NO');
                wx.setStorageSync('token', token);
                wx.showToast({ title: 'Login successful', icon: 'success' });
                
                // Update page state
                this.setData({ isLoggedIn: true });
              } else {
                console.error('Login failed:', response.data);
                wx.showToast({ title: response.data.message || 'Login failed', icon: 'none' });
              }
            },
            fail: (err) => {
              console.error('Login request failed:', err);
              wx.showToast({ title: 'Network error: ' + (err.errMsg || 'unknown'), icon: 'none' });
            }
          });
        } else {
          console.error('wx.login failed:', res.errMsg);
          wx.showToast({ title: 'Login failed: ' + res.errMsg, icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('wx.login error:', err);
        wx.showToast({ title: 'wx.login failed', icon: 'none' });
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