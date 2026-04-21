App({
  globalData: {
    userInfo: null,
    apiBase: 'http://mp1.woojar.com:3000/api'
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