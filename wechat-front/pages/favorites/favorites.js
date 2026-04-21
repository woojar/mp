const { getLanguage, getTranslations } = require('../../utils/i18n.js');
Page({
  data: { t: {}, favorites: [] },
  onLoad() { this.setData({ t: getTranslations() }); }
});