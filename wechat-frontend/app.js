const config = require('./config');
const envConfig = config[wx.getAccountInfoSync ? 'production' : 'development'];

App({
  globalData: {
    userInfo: null,
    apiBase: envConfig.apiBase,
    appId: envConfig.appId,
    env: envConfig.env
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