const { getLanguage, getTranslations } = require('../../utils/i18n.js');
Page({
  data: { t: {}, name: '', phone: '', detail: '' },
  onLoad() { this.setData({ t: getTranslations() }); },
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onDetailInput(e) { this.setData({ detail: e.detail.value }); },
  onSave() {
    if (!this.data.name || !this.data.phone || !this.data.detail) {
      wx.showToast({ title: 'Please fill required fields', icon: 'none' });
      return;
    }
    wx.showToast({ title: 'Saved', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 1500);
  }
});