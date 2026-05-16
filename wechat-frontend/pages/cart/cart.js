const { getLanguage, getTranslations } = require('../../utils/i18n.js');

Page({
  data: {
    t: {},
    language: 'en',
    cart: [],
    selectAll: false,
    totalPrice: 0
  },

  onShow() {
    this.setData({ t: getTranslations(), language: getLanguage() });
    this.loadCart();
  },

  loadCart() {
    const cart = wx.getStorageSync('cart') || [];
    const total = cart.filter(item => item.selected).reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.setData({ cart, totalPrice: total.toFixed(2) });
  },

  onItemToggle(e) {
    const id = e.currentTarget.dataset.id;
    const cart = this.data.cart.map(item => {
      if (item.id === id) item.selected = !item.selected;
      return item;
    });
    this.setData({ cart });
    this.calculateTotal();
  },

  onSelectAll() {
    const selectAll = !this.data.selectAll;
    const cart = this.data.cart.map(item => ({ ...item, selected: selectAll }));
    this.setData({ cart, selectAll });
    this.calculateTotal();
  },

  onQuantityChange(e) {
    const { id, action } = e.currentTarget.dataset;
    const cart = this.data.cart.map(item => {
      if (item.id === id) {
        if (action === 'plus') item.quantity++;
        else if (action === 'minus' && item.quantity > 1) item.quantity--;
      }
      return item;
    });
    this.setData({ cart });
    wx.setStorageSync('cart', cart);
    this.calculateTotal();
  },

  calculateTotal() {
    const total = this.data.cart.filter(item => item.selected).reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.setData({ totalPrice: total.toFixed(2) });
  },

  onCheckout() {
    const selectedItems = this.data.cart.filter(item => item.selected);
    if (selectedItems.length === 0) {
      wx.showToast({ title: this.data.t.selectItems, icon: 'none' });
      return;
    }
    wx.setStorageSync('checkoutItems', selectedItems);
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  }
});