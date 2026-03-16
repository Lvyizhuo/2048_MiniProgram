Page({
  data: {
    bestScore: 0,
    hasSavedGame: false,
    savedScore: 0,
    versionText: ''
  },

  onLoad() {
    // 加载历史最高分
    this.loadBestScore();
    // 加载是否存在未结束的对局
    this.loadSavedGameInfo();
    // 底部版本信息
    this.loadVersionInfo();
  },

  onShow() {
    // 返回主页时刷新一次，确保分数/存档状态最新
    this.loadBestScore();
    this.loadSavedGameInfo();
  },

  /**
   * 加载版本信息（发布版显示版本号，开发/体验版显示环境）
   */
  loadVersionInfo() {
    let version = '';
    let envVersion = '';
    try {
      const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null;
      version = (info && info.miniProgram && info.miniProgram.version) ? info.miniProgram.version : '';
      envVersion = (info && info.miniProgram && info.miniProgram.envVersion) ? info.miniProgram.envVersion : '';
    } catch (e) {
      // ignore
    }

    const envLabel = envVersion && envVersion !== 'release' ? envVersion : '';
    const versionLabel = version ? `v${version}` : 'v0.0.0';
    const text = envLabel ? `${versionLabel} (${envLabel})` : versionLabel;

    this.setData({
      versionText: text
    });
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
   * 加载存档信息（用于“继续游戏/新游戏”入口）
   */
  loadSavedGameInfo() {
    try {
      const saved = wx.getStorageSync('gameState');
      const hasSavedGame = !!(saved && saved.grid && Array.isArray(saved.grid));
      this.setData({
        hasSavedGame,
        savedScore: hasSavedGame ? (parseInt(saved.score, 10) || 0) : 0
      });
    } catch (e) {
      console.error('读取存档信息失败', e);
      this.setData({
        hasSavedGame: false,
        savedScore: 0
      });
    }
  },

  /**
   * 继续/开始游戏
   */
  continueGame() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  /**
   * 新游戏（清空存档）
   */
  startFreshGame() {
    if (this.data.hasSavedGame) {
      wx.showModal({
        title: '新游戏',
        content: '确定要开始新游戏吗？当前存档将被清空。',
        confirmText: '开始',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            try {
              wx.removeStorageSync('gameState');
            } catch (e) {
              console.error('清空存档失败', e);
            }
            this.setData({
              hasSavedGame: false,
              savedScore: 0
            });
            this.continueGame();
          }
        }
      });
      return;
    }
    this.continueGame();
  },

  /**
   * 兼容旧入口：开始游戏
   */
  startNewGame() {
    this.continueGame();
  },

  /**
   * 查看排行榜
   */
  showRankings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
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
