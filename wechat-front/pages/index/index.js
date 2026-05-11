const app = getApp();
const { getLanguage, getTranslations } = require('../../utils/i18n.js');

Page({
  data: {
    t: {},
    language: 'en',
    categories: [],
    currentCategory: 0,
    products: [],
    loading: false
  },

  onLoad() {
    this.setData({ t: getTranslations(), language: getLanguage() });
    this.loadProducts();
  },

  onShow() {
    this.setData({ t: getTranslations(), language: getLanguage() });
  },

  loadProducts() {
    const app = getApp();
    this.setData({ loading: true });
    wx.request({
      url: `${app.globalData.apiBase}/products`,
      data: { category: this.data.currentCategory > 0 ? this.data.currentCategory : undefined },
      success: (res) => {
        console.log('API Response:', res.data);
        if (res.data.code === 0) {
          const products = (res.data.data.products || []).map(p => {
            const imageUrl = p.image && p.image.startsWith('http') ? p.image : `${app.globalData.apiBase.replace('/api', '')}${p.image}`;
            console.log('Product:', p.name, 'Image URL:', imageUrl);
            return { ...p, image: imageUrl };
          });
          this.setData({ products });
        }
      },
      fail: (err) => {
        console.error('API Request Failed:', err);
        this.setData({
          products: [
            { id: 1, name: 'Instant Noodles', price: 5.5, image: '/default.png', sales: 1000 },
            { id: 2, name: 'Mineral Water', price: 2.0, image: '/default.png', sales: 5000 },
            { id: 3, name: 'Tissue Box', price: 10.0, image: '/default.png', sales: 800 },
            { id: 4, name: 'Toothbrush', price: 5.0, image: '/default.png', sales: 300 }
          ]
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  onCategoryTap(e) {
    const categoryId = parseInt(e.currentTarget.dataset.id);
    this.setData({ currentCategory: categoryId });
    this.loadProducts();
  },

  onProductTap(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/product/product?id=${productId}` });
  },

  onSearchPage() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onImageLoad(e) {
    console.log('Image loaded successfully:', e.target.dataset.src);
  },

  onImageError(e) {
    console.error('Image failed to load:', e.detail.errMsg, 'SRC:', e.target.dataset.src);
  }
});