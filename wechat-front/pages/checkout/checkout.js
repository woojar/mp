const { getLanguage, getTranslations } = require('../../utils/i18n.js');
const app = getApp();

Page({
  data: {
    t: {},
    language: 'en',
    items: [],
    address: null,
    totalPrice: 0,
    submitting: false
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
        this.setData({ 
          address: {
            name: res.userName,
            phone: res.telNumber,
            province: res.provinceName,
            city: res.cityName,
            district: res.countyName,
            detail: res.detailInfo
          }
        });
      }
    });
  },

  async onSubmitOrder() {
    if (this.data.submitting) return;
    
    if (!this.data.address) {
      wx.showToast({ title: this.data.t.selectAddress, icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const token = wx.getStorageSync('token');
    console.log('=== ORDER DEBUG ===');
    console.log('Token:', token ? 'exists' : 'NOT FOUND');
    console.log('API Base:', app.globalData.apiBase);
    console.log('Address:', this.data.address);
    console.log('Items:', this.data.items);
    
    if (!token) {
      wx.showToast({ title: 'Please login first', icon: 'none' });
      this.setData({ submitting: false });
      return;
    }

    const orderData = {
      items: this.data.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: parseFloat(this.data.totalPrice),
      discountPrice: 0,
      actualPrice: parseFloat(this.data.totalPrice),
      address: this.data.address,
      remark: ''
    };
    
    console.log('Order Data:', JSON.stringify(orderData));

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.apiBase}/orders`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: orderData,
          success: (res) => {
            console.log('Response success:', res);
            resolve(res);
          },
          fail: (err) => {
            console.error('Response fail:', err);
            reject(err);
          }
        });
      });

      console.log('Response data:', res.data);

      if (res.data.code === 0) {
        wx.removeStorageSync('cart');
        wx.removeStorageSync('checkoutItems');
        
        wx.showToast({ 
          title: this.data.t.orderPlaced || 'Order placed', 
          icon: 'success',
          duration: 1500
        });
        
        // Navigate back to user page after delay
        setTimeout(() => {
          wx.switchTab({ 
            url: '/pages/user/user',
            fail: (err) => {
              console.log('switchTab failed, trying navigateBack:', err);
              wx.navigateBack({ delta: 1, fail: () => wx.redirectTo({ url: '/pages/user/user' }) });
            }
          });
        }, 1600);
      } else {
        wx.showToast({ title: res.data.message || 'Order failed', icon: 'none' });
      }
    } catch (err) {
      console.error('Order error:', err);
      wx.showToast({ title: 'Network error: ' + (err.errMsg || 'unknown'), icon: 'none' });
    }

    this.setData({ submitting: false });
  }
});