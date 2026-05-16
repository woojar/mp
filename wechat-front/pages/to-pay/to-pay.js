const { getLanguage, getTranslations } = require('../../utils/i18n.js');
const app = getApp();

Page({
  data: {
    t: {},
    language: 'en',
    orderId: null,
    orderNo: '',
    totalPrice: 0,
    items: [],
    address: null,
    status: 'pending',
    loading: false
  },

  onLoad(options) {
    this.setData({ 
      t: getTranslations(), 
      language: getLanguage() 
    });

    if (options.orderId) {
      this.setData({ orderId: parseInt(options.orderId) });
      this.loadOrder(options.orderId);
    } else {
      // Get order from storage if passed directly
      const orderData = wx.getStorageSync('pendingOrder');
      if (orderData) {
        this.setData({
          orderId: orderData.id,
          orderNo: orderData.order_no || 'ORD' + orderData.id,
          totalPrice: orderData.totalPrice || orderData.actual_price,
          items: orderData.items || [],
          address: orderData.address
        });
        wx.removeStorageSync('pendingOrder');
      }
    }
  },

  onShow() {
    this.setData({ t: getTranslations(), language: getLanguage() });
  },

  loadOrder(orderId) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: 'Please login', icon: 'none' });
      return;
    }

    wx.request({
      url: `${app.globalData.apiBase}/orders/${orderId}`,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.code === 0) {
          const order = res.data.data;
          this.setData({
            orderId: order.id,
            orderNo: order.order_no,
            totalPrice: order.actual_price,
            items: order.items || [],
            address: order.address,
            status: order.status
          });
        }
      },
      fail: (err) => {
        console.error('Load order failed:', err);
        wx.showToast({ title: 'Failed to load order', icon: 'none' });
      }
    });
  },

  onPayNow() {
    if (this.data.status !== 'pending') {
      wx.showToast({ title: 'Order already paid or cancelled', icon: 'none' });
      return;
    }

    this.processPayment();
  },

  processPayment() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: 'Please login', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: `${app.globalData.apiBase}/orders/${this.data.orderId}/pay`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('Payment response:', res);
        if (res.data.code === 0) {
          const payParams = res.data.data;
          
          wx.requestPayment({
            timeStamp: payParams.timeStamp,
            nonceStr: payParams.nonceStr,
            package: payParams.package,
            signType: payParams.signType,
            paySign: payParams.paySign,
            success: (payRes) => {
              console.log('Payment success:', payRes);
              wx.showToast({ title: 'Payment successful!', icon: 'success' });
              
              this.setData({ status: 'paid' });
              
              setTimeout(() => {
                wx.switchTab({ url: '/pages/orders/orders' });
              }, 1500);
            },
            fail: (payErr) => {
              console.log('Payment cancelled or failed:', payErr);
              if (payErr.errMsg && payErr.errMsg.includes('cancel')) {
                wx.showToast({ title: 'Payment cancelled', icon: 'none' });
              } else {
                wx.showToast({ title: 'Payment failed', icon: 'none' });
              }
            }
          });
        } else {
          wx.showToast({ title: res.data.message || 'Payment failed', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('Payment request failed:', err);
        wx.showToast({ title: 'Network error', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  onCancel() {
    wx.showModal({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order?',
      success: (res) => {
        if (res.confirm) {
          this.cancelOrder();
        }
      }
    });
  },

  cancelOrder() {
    const token = wx.getStorageSync('token');
    if (!token) return;

    this.setData({ loading: true });

    wx.request({
      url: `${app.globalData.apiBase}/orders/${this.data.orderId}/cancel`,
      method: 'PUT',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: 'Order cancelled', icon: 'success' });
          setTimeout(() => {
            wx.switchTab({ url: '/pages/user/user' });
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message || 'Failed to cancel', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: 'Network error', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
});