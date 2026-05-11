App({
  globalData: {
    userInfo: null,
    apiBase: 'https://mp1.woojar.com:3030/api'
  },
  onLaunch() {
    this.checkLoginStatus();
  },
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
  }
});