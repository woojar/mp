const { getLanguage, getTranslations } = require('../../utils/i18n.js');

Page({
  data: {
    t: {},
    language: 'en',
    product: null,
    quantity: 1
  },

  onLoad(options) {
    this.setData({ t: getTranslations(), language: getLanguage() });
    if (options.id) {
      this.loadProduct(options.id);
    }
  },

  onShow() {
    this.setData({ t: getTranslations(), language: getLanguage() });
  },

  loadProduct(id) {
    const app = getApp();
    wx.request({
      url: `${app.globalData.apiBase}/products/${id}`,
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ product: res.data.data });
        }
      },
      fail: () => {
        this.setData({
          product: { id, name: 'Product ' + id, price: 9.9, description: 'Sample product', sales: 100, stock: 50, image: 'https://via.placeholder.com/200' }
        });
      }
    });
  },

  onQuantityMinus() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 });
    }
  },

  onQuantityPlus() {
    this.setData({ quantity: this.data.quantity + 1 });
  },

  onAddToCart() {
    const cart = wx.getStorageSync('cart') || [];
    const existing = cart.find(item => item.id === this.data.product.id);
    if (existing) {
      existing.quantity += this.data.quantity;
    } else {
      cart.push({
        id: this.data.product.id,
        name: this.data.product.name,
        price: this.data.product.price,
        image: this.data.product.image,
        quantity: this.data.quantity
      });
    }
    wx.setStorageSync('cart', cart);
    wx.showToast({ title: this.data.t.addedToCart, icon: 'none' });
  },

  onBuyNow() {
    const checkoutItems = [{
      id: this.data.product.id,
      name: this.data.product.name,
      price: this.data.product.price,
      image: this.data.product.image,
      quantity: this.data.quantity
    }];
    wx.setStorageSync('checkoutItems', checkoutItems);
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  }
});