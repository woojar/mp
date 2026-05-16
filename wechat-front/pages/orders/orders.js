const { getLanguage, getTranslations } = require('../../utils/i18n.js');
const app = getApp();

Page({
  data: {
    t: {},
    language: 'en',
    orders: [],
    currentTab: 0,
    loading: false
  },

  onShow() {
    this.setData({ t: getTranslations(), language: getLanguage() });
    this.loadOrders();
  },

  onTabChange(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
    this.loadOrders();
  },

  loadOrders() {
    this.setData({ loading: true });
    
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ orders: [], loading: false });
      return;
    }

    const statusMap = ['', 'pending', 'paid', 'completed'];
    const status = statusMap[this.data.currentTab] || '';

    wx.request({
      url: `${app.globalData.apiBase}/orders`,
      data: { 
        page: 1, 
        limit: 50,
        status: status || undefined
      },
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('Orders response:', res);
        if (res.data.code === 0) {
          const orders = res.data.data.orders || [];
          console.log('Orders count:', orders.length);
          this.setData({ orders });
        } else {
          console.error('Orders error:', res.data);
          wx.showToast({ title: res.data.message || 'Failed to load orders', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('Load orders failed:', err);
        wx.showToast({ title: 'Network error: ' + (err.errMsg || 'unknown'), icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  onPay(e) {
    const orderId = e.currentTarget.dataset.id;
    const token = wx.getStorageSync('token');
    
    wx.showModal({
      title: 'Confirm Payment',
      content: 'Pay for this order?',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.apiBase}/orders/${orderId}/pay`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: (res) => {
              console.log('Payment response:', res);
              if (res.data.code === 0) {
                const payParams = res.data.data;
                
                // Call WeChat Pay
                wx.requestPayment({
                  timeStamp: payParams.timeStamp,
                  nonceStr: payParams.nonceStr,
                  package: payParams.package,
                  signType: payParams.signType,
                  paySign: payParams.paySign,
                  success: (payRes) => {
                    console.log('Payment success:', payRes);
                    wx.showToast({ title: 'Payment successful', icon: 'success' });
                    this.loadOrders();
                  },
                  fail: (payErr) => {
                    console.error('Payment failed:', payErr);
                    wx.showToast({ title: 'Payment cancelled', icon: 'none' });
                  }
                });
              } else {
                wx.showToast({ title: res.data.message || 'Payment failed', icon: 'none' });
              }
            },
            fail: (err) => {
              console.error('Payment request failed:', err);
              wx.showToast({ title: 'Network error', icon: 'none' });
            }
          });
        }
      }
    });
  },

  onConfirm(e) {
    const orderId = e.currentTarget.dataset.id;
    const token = wx.getStorageSync('token');
    
    wx.showModal({
      title: 'Confirm Receipt',
      content: 'Confirm you received the order?',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.apiBase}/orders/${orderId}/confirm`,
            method: 'PUT',
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: (res) => {
              if (res.data.code === 0) {
                wx.showToast({ title: 'Order confirmed', icon: 'success' });
                this.loadOrders();
              } else {
                wx.showToast({ title: res.data.message || 'Failed to confirm', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: 'Network error', icon: 'none' });
            }
          });
        }
      }
    });
  }
});
  }
});