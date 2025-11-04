Page({
  data: {
    bestScore: 0
  },

  onLoad() {
    // 加载历史最高分
    this.loadBestScore();
  },

  /**
   * 加载历史最高分
   */
  loadBestScore() {
    try {
      const best = wx.getStorageSync('bestScore');
      if (best) {
        this.setData({
          bestScore: parseInt(best) || 0
        });
      }
    } catch (e) {
      console.error('读取历史最高分失败', e);
    }
  },

  /**
   * 开始新游戏
   */
  startNewGame() {
    // 直接跳转到游戏页面，游戏页面会处理继续游戏或新游戏的逻辑
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },


  /**
   * 发起挑战
   */
  startChallenge() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 查看隐私政策
   */
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '本小程序尊重并保护所有用户的个人隐私。我们不会收集、存储或分享您的个人信息。游戏数据仅存储在您的设备本地。',
      showCancel: false
    });
  },

  /**
   * 查看用户协议
   */
  showAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用2048游戏小程序。使用本小程序即表示您同意遵守相关法律法规。请合理使用本应用。',
      showCancel: false
    });
  }
});

