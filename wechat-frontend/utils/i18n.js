const messages = {
  en: {
    shop: 'Shop',
    cart: 'Cart',
    me: 'Me',
    search: 'Search products...',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    total: 'Total',
    checkout: 'Checkout',
    selectAddress: 'Select Address',
    addAddress: '+ Add Address',
    paymentMethod: 'Payment Method',
    wechatPay: 'WeChat Pay',
    submitOrder: 'Submit Order',
    myOrders: 'My Orders',
    addressBook: 'Address Book',
    contactService: 'Contact Service',
    login: 'Login',
    logout: 'Logout',
    all: 'All',
    pending: 'Pending',
    paid: 'Paid',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noOrders: 'No orders yet',
    emptyCart: 'Your cart is empty',
    selectItems: 'Please select items first',
    paymentSuccess: 'Payment successful',
    paymentFailed: 'Payment failed',
    sold: 'Sold',
    done: 'Done',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    hotSales: 'Hot Sales',
    newArrivals: 'New Arrivals',
    favorites: 'Favorites',
    emptyFavorites: 'No favorites yet',
    removeFavorite: 'Remove',
    loading: 'Loading...',
    noMore: 'No more',
    orderPlaced: 'Order placed successfully',
    addedToCart: 'Added to cart',
    addressSaved: 'Address saved',
    addressDeleted: 'Address deleted',
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites',
    settings: 'Settings',
    language: 'Language',
    english: 'English',
    chinese: 'Chinese'
  },
  zh: {
    shop: '商店',
    cart: '购物车',
    me: '我的',
    search: '搜索商品...',
    addToCart: '加入购物车',
    buyNow: '立即购买',
    total: '合计',
    checkout: '结算',
    selectAddress: '选择地址',
    addAddress: '+ 添加地址',
    paymentMethod: '支付方式',
    wechatPay: '微信支付',
    submitOrder: '提交订单',
    myOrders: '我的订单',
    addressBook: '地址管理',
    contactService: '联系客服',
    login: '登录',
    logout: '退出登录',
    all: '全部',
    pending: '待付款',
    paid: '已付款',
    shipped: '配送中',
    completed: '已完成',
    cancelled: '已取消',
    noOrders: '暂无订单',
    emptyCart: '购物车为空',
    selectItems: '请先选择商品',
    paymentSuccess: '支付成功',
    paymentFailed: '支付失败',
    sold: '已售',
    done: '完成',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    hotSales: '热销商品',
    newArrivals: '新品上架',
    favorites: '收藏',
    emptyFavorites: '暂无收藏',
    removeFavorite: '取消收藏',
    loading: '加载中...',
    noMore: '没有更多了',
    orderPlaced: '订单提交成功',
    addedToCart: '已加入购物车',
    addressSaved: '地址保存成功',
    addressDeleted: '地址已删除',
    favoriteAdded: '已添加到收藏',
    favoriteRemoved: '已取消收藏',
    settings: '设置',
    language: '语言',
    english: '英文',
    chinese: '中文'
  }
};

function getTranslations() {
  const lang = wx.getStorageSync('language') || 'en';
  return messages[lang] || messages.en;
}

function t(key) {
  const lang = wx.getStorageSync('language') || 'en';
  return messages[lang][key] || key;
}

function setLanguage(lang) {
  wx.setStorageSync('language', lang);
}

function getLanguage() {
  return wx.getStorageSync('language') || 'en';
}

module.exports = { t, setLanguage, getLanguage, getTranslations };