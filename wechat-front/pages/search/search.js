const { getLanguage, getTranslations } = require('../../utils/i18n.js');
Page({
  data: { t: {}, keyword: '', products: [], hasSearched: false },
  onLoad() { this.setData({ t: getTranslations() }); },
  onKeywordInput(e) { this.setData({ keyword: e.detail.value }); },
  onSearch() {
    if (!this.data.keyword) return;
    const app = getApp();
    this.setData({ hasSearched: true });
    wx.request({
      url: `${app.globalData.apiBase}/products`,
      data: { keyword: this.data.keyword },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ products: res.data.data.products || [] });
        }
      }
    });
  },
  onCancel() { wx.navigateBack(); },
  onProductTap(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/product/product?id=${productId}` });
  }
});