const Game2048 = require('../../utils/game.js');
const AudioManager = require('../../utils/audio.js');

Page({
  data: {
    grid: [],
    score: 0,
    bestScore: 0,
    scorePop: false,
    scorePlus: null,
    gameOver: false,
    navSpacerPx: 0,
    undoCredits: 1,
    eliminateCredits: 1,
    showGameOverModal: false,
    gameOverModalClosing: false,
    showWinModal: false,
    winModalClosing: false,
    showMenuModal: false,
    menuModalClosing: false,
    showTutorialModal: false,
    tutorialModalClosing: false,
    tutorialStep: 0,
    soundEnabled: true,
    tileAnimations: {}, // 存储方块动画状态
    tileTransforms: {}, // 存储方块变换样式
    disableTileTransition: false, // 用于实现“原版2048”滑动：先瞬移到旧位置，再平滑滑到新位置
    tilesToDisappear: {}, // 标记需要消失的方块（被合并的源方块）
    hiddenNewTiles: {}, // 标记需要隐藏的新方块（避免闪烁）
    eliminateMode: false, // 消除模式开关
    eliminateTipVisible: false, // 顶部提示（短暂展示）
    vibrationEnabled: true // 震动反馈开关
  },

  game: null,
  audioManager: null,
  touchStartX: 0,
  touchStartY: 0,
  isAnimating: false,
  scorePopTimer: null,
  scorePlusTimer: null,
  eliminateTipTimer: null,
  toolRewardedAd: null,
  toolAdLoading: false,

  onLoad() {
    this.initNavMetrics();
    // 初始化音效管理器
    this.audioManager = new AudioManager();
    
    // 初始化游戏
    this.game = new Game2048();
    
    // 尝试加载保存的游戏状态
    this.loadSavedGame();
    
    // 更新界面
    this.updateUI();

    // 加载震动开关
    try {
      const vibrationEnabled = wx.getStorageSync('vibrationEnabled');
      if (vibrationEnabled !== '') {
        this.setData({
          vibrationEnabled: vibrationEnabled !== false
        });
      }
    } catch (e) {
      console.error('读取震动设置失败', e);
    }
    
    // 检查是否需要显示新手教程
    this.checkFirstTime();

    // 初始化道具次数，并尽量预加载激励视频广告（未配置时仅预留逻辑）
    this.loadToolCredits();
    this.preloadToolRewardedAd();
  },

  initNavMetrics() {
    let statusBarHeight = 0;
    let menuButtonRect = null;
    try {
      const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : null;
      statusBarHeight = (sys && sys.statusBarHeight) ? sys.statusBarHeight : 0;
    } catch (e) {
      // ignore
    }

    try {
      menuButtonRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    } catch (e) {
      // ignore
    }

    // 自定义导航栏页面：让内容从胶囊按钮下方开始渲染，避免 iPhone 15 Pro Max 动态岛/刘海重叠
    const navSpacerPx = menuButtonRect && menuButtonRect.bottom
      ? Math.ceil(menuButtonRect.bottom + 8)
      : Math.ceil(statusBarHeight + 52);

    this.setData({
      navSpacerPx: Math.max(0, navSpacerPx)
    });
  },

  getToolCreditsFromStorage() {
    try {
      const credits = wx.getStorageSync('toolCredits');
      if (credits && typeof credits === 'object') {
        return {
          undo: Math.max(0, parseInt(credits.undo, 10) || 0),
          eliminate: Math.max(0, parseInt(credits.eliminate, 10) || 0)
        };
      }
    } catch (e) {
      // ignore
    }
    return { undo: 1, eliminate: 1 };
  },

  saveToolCreditsToStorage(credits) {
    try {
      wx.setStorageSync('toolCredits', credits);
    } catch (e) {
      console.error('保存道具次数失败', e);
    }
  },

  loadToolCredits() {
    const credits = this.getToolCreditsFromStorage();
    this.setData({
      undoCredits: credits.undo,
      eliminateCredits: credits.eliminate
    });
  },

  updateToolCredits(nextCredits) {
    const credits = {
      undo: Math.max(0, parseInt(nextCredits.undo, 10) || 0),
      eliminate: Math.max(0, parseInt(nextCredits.eliminate, 10) || 0)
    };
    this.saveToolCreditsToStorage(credits);
    this.setData({
      undoCredits: credits.undo,
      eliminateCredits: credits.eliminate
    });
  },

  consumeToolCredit(tool) {
    const credits = {
      undo: this.data.undoCredits,
      eliminate: this.data.eliminateCredits
    };
    if (tool === 'undo') {
      if (credits.undo <= 0) return false;
      credits.undo -= 1;
    } else if (tool === 'eliminate') {
      if (credits.eliminate <= 0) return false;
      credits.eliminate -= 1;
    } else {
      return false;
    }
    this.updateToolCredits(credits);
    return true;
  },

  addToolCredit(tool, delta = 1) {
    const credits = {
      undo: this.data.undoCredits,
      eliminate: this.data.eliminateCredits
    };
    if (tool === 'undo') {
      credits.undo = Math.max(0, credits.undo + delta);
    } else if (tool === 'eliminate') {
      credits.eliminate = Math.max(0, credits.eliminate + delta);
    }
    this.updateToolCredits(credits);
  },

  getToolAdUnitId() {
    try {
      // 兼容已有的 rewardedAdUnitId；也支持单独的 toolRewardedAdUnitId
      return wx.getStorageSync('toolRewardedAdUnitId') || wx.getStorageSync('rewardedAdUnitId') || '';
    } catch (e) {
      return '';
    }
  },

  preloadToolRewardedAd() {
    if (!wx.createRewardedVideoAd) {
      return;
    }
    const adUnitId = this.getToolAdUnitId();
    if (!adUnitId || adUnitId === 'adunit-example') {
      return;
    }

    if (this.toolRewardedAd) {
      // 尽量预加载一次
      if (!this.toolAdLoading) {
        this.toolAdLoading = true;
        this.toolRewardedAd.load().finally(() => {
          this.toolAdLoading = false;
        });
      }
      return;
    }

    try {
      this.toolRewardedAd = wx.createRewardedVideoAd({ adUnitId });
      this.toolRewardedAd.onError((err) => {
        console.error('道具广告加载失败', err);
      });
      this.toolRewardedAd.onLoad(() => {
        // loaded
      });
      this.toolAdLoading = true;
      this.toolRewardedAd.load().finally(() => {
        this.toolAdLoading = false;
      });
    } catch (e) {
      console.error('创建道具广告实例失败', e);
      this.toolRewardedAd = null;
      this.toolAdLoading = false;
    }
  },

  watchAdToAddToolCredit(tool) {
    if (!wx.createRewardedVideoAd) {
      wx.showToast({
        title: '当前版本不支持激励视频广告',
        icon: 'none'
      });
      return;
    }

    const adUnitId = this.getToolAdUnitId();
    if (!adUnitId || adUnitId === 'adunit-example') {
      wx.showToast({
        title: '广告位已预留，暂未配置',
        icon: 'none'
      });
      return;
    }

    // 复用预加载实例；若不存在则临时创建
    const videoAd = this.toolRewardedAd || wx.createRewardedVideoAd({ adUnitId });
    const title = tool === 'undo' ? '撤销' : '消除';

    const onClose = (res) => {
      if (res && res.isEnded) {
        this.addToolCredit(tool, 1);
        wx.showToast({
          title: `${title} +1`,
          icon: 'success',
          duration: 1200
        });
      } else {
        wx.showToast({
          title: '需要看完广告才可增加次数',
          icon: 'none'
        });
      }
      videoAd.offClose(onClose);
    };

    videoAd.onClose(onClose);

    videoAd.show().catch(() => {
      videoAd.load().then(() => videoAd.show()).catch((err) => {
        console.error('道具广告显示失败', err);
        wx.showToast({
          title: '广告加载失败，请稍后重试',
          icon: 'none'
        });
        videoAd.offClose(onClose);
      });
    });
  },

  ensureToolCreditOrAd(tool, onAllowed) {
    const hasCredit = tool === 'undo' ? this.data.undoCredits > 0 : this.data.eliminateCredits > 0;
    if (hasCredit) {
      const consumed = this.consumeToolCredit(tool);
      if (consumed && typeof onAllowed === 'function') {
        onAllowed();
      }
      return;
    }

    const title = tool === 'undo' ? '撤销' : '消除';
    wx.showModal({
      title: `${title}次数不足`,
      content: `观看广告可获得 1 次「${title}」使用次数。`,
      confirmText: '看广告',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.watchAdToAddToolCredit(tool);
        }
      }
    });
  },

  isAnyModalVisible() {
    return !!(
      this.data.showMenuModal ||
      this.data.showTutorialModal ||
      this.data.showWinModal ||
      this.data.showGameOverModal ||
      this.data.menuModalClosing ||
      this.data.tutorialModalClosing ||
      this.data.winModalClosing ||
      this.data.gameOverModalClosing
    );
  },

  closeModalWithAnimation(showKey, closingKey, durationMs = 170, afterClose) {
    if (!this.data[showKey] || this.data[closingKey]) {
      return;
    }
    this.setData({ [closingKey]: true });
    setTimeout(() => {
      this.setData({ [showKey]: false, [closingKey]: false }, () => {
        if (typeof afterClose === 'function') {
          afterClose();
        }
      });
    }, durationMs);
  },

  onReady() {
    // 首次渲染后测量棋盘步长，用于更精准的滑动动画（适配不同屏幕）
    this.measureCellStep();
  },
  
  onUnload() {
    // 页面卸载时销毁音效实例
    if (this.audioManager) {
      this.audioManager.destroy();
    }
    if (this.scorePopTimer) {
      clearTimeout(this.scorePopTimer);
      this.scorePopTimer = null;
    }
    if (this.scorePlusTimer) {
      clearTimeout(this.scorePlusTimer);
      this.scorePlusTimer = null;
    }
    if (this.eliminateTipTimer) {
      clearTimeout(this.eliminateTipTimer);
      this.eliminateTipTimer = null;
    }
    if (this.toolRewardedAd) {
      // 释放引用，避免重复监听造成泄漏
      this.toolRewardedAd = null;
    }
    // 页面卸载时保存游戏状态
    this.saveGame();
  },

  onShow() {
    // 页面显示时，更新UI和音效状态
    if (this.game) {
      this.updateUI();
      // 更新音效状态
      if (this.audioManager) {
        this.setData({
          soundEnabled: this.audioManager.soundEnabled
        });
      }
    }
  },

  onHide() {
    // 页面隐藏时保存游戏状态
    this.saveGame();
  },

  /**
   * 加载保存的游戏状态
   */
  loadSavedGame() {
    try {
      const savedData = wx.getStorageSync('gameState');
      if (savedData && savedData.grid) {
        // 有保存的游戏状态，直接加载
        this.game.loadGame(savedData);
      }
      // 没有保存的游戏状态时，保持init()创建的初始状态
    } catch (e) {
      console.error('加载游戏状态失败', e);
    }
  },

  /**
   * 保存游戏状态
   */
  saveGame() {
    if (this.game && !this.game.gameOver) {
      try {
        const gameState = this.game.getGameState();
        wx.setStorageSync('gameState', gameState);
      } catch (e) {
        console.error('保存游戏状态失败', e);
      }
    }
  },

  /**
   * 更新UI
   */
  updateUI() {
    this.setData({
      grid: this.game.grid,
      score: this.game.score,
      bestScore: this.game.bestScore,
      gameOver: this.game.gameOver,
      soundEnabled: this.audioManager ? this.audioManager.soundEnabled : true
    }, () => {
      // grid变化后可能影响布局，延迟刷新测量结果
      this.measureCellStep();
    });
  },

  /**
   * 测量每次位移的像素步长（一个格子宽度 + 间距）
   */
  measureCellStep() {
    if (!wx.createSelectorQuery) {
      return;
    }
    const query = wx.createSelectorQuery().in(this);
    query.selectAll('.grid-cell').boundingClientRect((rects) => {
      if (!rects || rects.length < 8) {
        return;
      }

      // 找到第一行的4个格子（按top聚类）
      const minTop = rects.reduce((min, r) => Math.min(min, r.top), rects[0].top);
      const firstRow = rects.filter(r => Math.abs(r.top - minTop) < 2).sort((a, b) => a.left - b.left);
      if (firstRow.length < 2) {
        return;
      }
      const step = firstRow[1].left - firstRow[0].left;
      if (step > 0) {
        this.cellStepPx = step;
      }
    }).exec();
  },
  
  /**
   * 检查是否是第一次游戏
   */
  checkFirstTime() {
    try {
      const hasShownTutorial = wx.getStorageSync('hasShownTutorial');
      if (!hasShownTutorial) {
        // 延迟显示，确保界面已渲染
        setTimeout(() => {
          this.showTutorial();
        }, 500);
      }
    } catch (e) {
      console.error('检查新手教程状态失败', e);
    }
  },
  
  /**
   * 显示新手教程
   */
  showTutorial() {
    this.setData({
      showTutorialModal: true,
      tutorialModalClosing: false,
      tutorialStep: 0
    });
  },
  
  /**
   * 关闭新手教程
   */
  closeTutorial() {
    // 标记已显示过教程
    try {
      wx.setStorageSync('hasShownTutorial', true);
    } catch (e) {
      console.error('保存教程状态失败', e);
    }

    this.closeModalWithAnimation('showTutorialModal', 'tutorialModalClosing', 170, () => {
      this.setData({ tutorialStep: 0 });
    });
  },
  
  /**
   * 切换教程步骤
   */
  nextTutorialStep() {
    const currentStep = this.data.tutorialStep;
    if (currentStep < 2) {
      this.setData({
        tutorialStep: currentStep + 1
      });
    } else {
      this.closeTutorial();
    }
  },
  
  /**
   * 上一步教程
   */
  prevTutorialStep() {
    const currentStep = this.data.tutorialStep;
    if (currentStep > 0) {
      this.setData({
        tutorialStep: currentStep - 1
      });
    }
  },

  /**
   * 阻止触摸移动（防止页面滚动）
   */
  preventMove() {
    // 阻止事件传播，防止页面滚动
    return false;
  },

  /**
   * 触摸开始
   */
  touchStart(e) {
    if (!e.touches || e.touches.length !== 1) {
      return;
    }
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  },

  /**
   * 触摸结束
   */
  touchEnd(e) {
    if (this.isAnimating || this.isAnyModalVisible()) {
      return;
    }
    if (this.data.gameOver) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    
    // 最小滑动距离
    const minSwipeDistance = 30;
    
    // 如果处于消除模式且检测到滑动，退出消除模式
    if (this.data.eliminateMode) {
      if (Math.abs(deltaX) >= minSwipeDistance || Math.abs(deltaY) >= minSwipeDistance) {
        this.setData({
          eliminateMode: false,
          eliminateTipVisible: false
        });
        if (this.eliminateTipTimer) {
          clearTimeout(this.eliminateTipTimer);
          this.eliminateTipTimer = null;
        }
      }
      // 消除模式下不处理滑动移动
      return;
    }
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return;
    }

    let direction = '';
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // 垂直滑动
      direction = deltaY > 0 ? 'down' : 'up';
    }

    this.handleMove(direction);
  },

  /**
   * 触摸取消（例如系统手势/来电等）
   */
  touchCancel() {
    this.touchStartX = 0;
    this.touchStartY = 0;
  },

  /**
   * 处理移动
   */
  handleMove(direction) {
    if (this.isAnimating || this.isAnyModalVisible()) {
      return;
    }
    // 保存移动前的grid状态用于动画
    const oldGridData = JSON.parse(JSON.stringify(this.data.grid));
    
    const result = this.game.moveWithTracking(direction);
    
    if (result.moved) {
      this.isAnimating = true;
      // 播放移动音效
      try {
        if (this.audioManager) {
          this.audioManager.playMove();
        }
      } catch (e) {
        console.warn('播放移动音效异常', e);
      }
      
      // 严格按顺序执行动画：滑动 → 合并 → 新方块生成
      this.executeAnimationsInSequence(result, oldGridData).finally(() => {
        this.isAnimating = false;
      });

      // 动画总时长：滑动(150ms) + 合并(160ms) + 新方块(220ms) + 缓冲(50ms)
      const TOTAL_ANIM_MS = 72 + 160 + 220 + 50;

      // 处理胜利（在动画完成后）
      if (result.won) {
        setTimeout(() => {
          this.setData({ showWinModal: true, winModalClosing: false });
        }, TOTAL_ANIM_MS);
      }

      // 处理游戏结束（在动画完成后）
      if (result.gameOver) {
        setTimeout(() => {
          this.setData({ showGameOverModal: true, gameOverModalClosing: false });
        }, TOTAL_ANIM_MS);
      }

      // 保存游戏状态（在动画完成后）
      setTimeout(() => {
        this.saveGame();
      }, TOTAL_ANIM_MS);
    }
  },

  /**
   * 按顺序执行动画：滑动 → 合并 → 新方块生成
   * 优化后的动画时序：
   * 1. 滑动动画：180ms（流畅的移动）
   * 2. 合并动画：200ms（在滑动接近结束时开始，略有重叠）
   * 3. 新方块生成：250ms（合并动画完成后开始）
   */
  executeAnimationsInSequence(result, oldGridData) {
    const moveMapping = result.moveMapping;
    if (!moveMapping) {
      return Promise.resolve();
    }

    // 第一步：应用滑动动画（180ms）
    // 传入新方块信息，在滑动动画时暂时隐藏它
    return this.applySlideAnimations(moveMapping, oldGridData, result.newTile, result.scoreIncrease).then(() => {
      // 滑动动画完成后，执行合并动画（如果有合并）
      // 传入新方块信息，用于排除新方块位置的合并动画
      if (moveMapping.merges && moveMapping.merges.length > 0) {
        return this.applyMergeAnimations(moveMapping, result.newTile);
      }
      // 如果没有合并，直接执行新方块动画
      return Promise.resolve();
    }).then(() => {
      // 合并动画完成后（或没有合并时），执行新方块生成动画
      return this.applyNewTileAnimation(result.newTile);
    });
  },

  /**
   * 应用滑动动画（180ms，流畅的移动效果）
   * 优化：使用更好的缓动函数，减少延迟
   * 返回Promise，在动画完成后resolve
   */
  applySlideAnimations(moveMapping, oldGridData, newTile, scoreIncrease) {
    return new Promise((resolve) => {
      const SLIDE_MS = 72;
      // 先更新UI到新状态
      const newGrid = this.game.grid;
      const newScore = this.game.score;
      const newBestScore = this.game.bestScore;
      const newGameOver = this.game.gameOver;
      const scoreDelta = parseInt(scoreIncrease, 10) || 0;
      
      // 如果有新方块，暂时隐藏它
      const hiddenTiles = {};
      if (newTile) {
        const newTileKey = `${newTile.row}-${newTile.col}`;
        hiddenTiles[newTileKey] = true;
      }
      
      // 标记被合并的方块，用于淡出动画
      const disappearingTiles = {};
      if (moveMapping.merges && moveMapping.merges.length > 0) {
        moveMapping.merges.forEach(merge => {
          merge.from.forEach(source => {
            const sourceKey = `${source.row}-${source.col}`;
            // 只标记第二个源方块（第一个源方块会移动到目标位置）
            if (merge.from.indexOf(source) > 0) {
              disappearingTiles[sourceKey] = true;
            }
          });
        });
      }

      // 计算滑动偏移：先把“新位置的方块”瞬移回旧位置（不带transition），再清空transform触发平滑滑动
      const transforms = {};
      const cellStep = this.cellStepPx || 170;
      const unit = this.cellStepPx ? 'px' : 'rpx';

      if (moveMapping.moves) {
        moveMapping.moves.forEach(move => {
          const key = `${move.to.row}-${move.to.col}`;
          const deltaX = (move.from.col - move.to.col) * cellStep;
          const deltaY = (move.from.row - move.to.row) * cellStep;
          transforms[key] = `translate(${deltaX}${unit}, ${deltaY}${unit})`;
        });
      }

      if (moveMapping.merges && moveMapping.merges.length > 0) {
        moveMapping.merges.forEach(merge => {
          if (merge.from.length > 0) {
            const source = merge.from[0];
            const key = `${merge.to.row}-${merge.to.col}`;
            const deltaX = (source.col - merge.to.col) * cellStep;
            const deltaY = (source.row - merge.to.row) * cellStep;
            transforms[key] = `translate(${deltaX}${unit}, ${deltaY}${unit})`;
          }
        });
      }

      this.setData({
        grid: newGrid,
        score: newScore,
        bestScore: newBestScore,
        gameOver: newGameOver,
        hiddenNewTiles: hiddenTiles, // 标记需要隐藏的新方块
        tilesToDisappear: disappearingTiles, // 标记被合并的方块
        scorePop: scoreDelta > 0,
        scorePlus: scoreDelta > 0 ? { value: scoreDelta, id: Date.now() } : null,
        disableTileTransition: true,
        tileTransforms: transforms
      }, () => {
        if (scoreDelta > 0) {
          if (this.scorePopTimer) {
            clearTimeout(this.scorePopTimer);
          }
          this.scorePopTimer = setTimeout(() => {
            this.setData({ scorePop: false });
          }, 240);

          const plusId = this.data.scorePlus ? this.data.scorePlus.id : null;
          if (this.scorePlusTimer) {
            clearTimeout(this.scorePlusTimer);
          }
          this.scorePlusTimer = setTimeout(() => {
            if (plusId && this.data.scorePlus && this.data.scorePlus.id === plusId) {
              this.setData({ scorePlus: null });
            }
          }, 720);
        }

      // 关键：第1帧先“无transition”完成位置回溯；第2帧打开transition；第3帧清空transform触发滑动
      setTimeout(() => {
        this.setData({ disableTileTransition: false }, () => {
          setTimeout(() => {
            this.setData({ tileTransforms: {} });
            setTimeout(resolve, SLIDE_MS);
          }, 16);
        });
      }, 16);
      });
    });
  },

  /**
   * 应用合并效果
   * 不执行任何视觉动画，仅保留音效和震动反馈
   * 返回Promise，立即resolve
   */
  applyMergeAnimations(moveMapping, newTile) {
    return new Promise((resolve) => {
      if (!moveMapping.merges || moveMapping.merges.length === 0) {
        // 没有合并，直接resolve
        resolve();
        return;
      }
      
      // 播放合并音效并震动反馈
      try {
        if (this.audioManager) {
          this.audioManager.playMerge();
        }
        if (this.data.vibrationEnabled && wx.vibrateShort) {
          wx.vibrateShort({
            type: 'light'
          });
        }
      } catch (e) {
        console.warn('播放合并音效异常', e);
      }
      
      // 合并目标方块的轻量缩放动画
      const animations = { ...this.data.tileAnimations };
      moveMapping.merges.forEach(merge => {
        const key = `${merge.to.row}-${merge.to.col}`;
        // 排除新生成方块位置，避免动画冲突
        if (newTile && newTile.row === merge.to.row && newTile.col === merge.to.col) {
          return;
        }
        animations[key] = 'tile-merged';
      });

      this.setData({
        tileAnimations: animations
      }, () => {
        setTimeout(() => {
          // 清理合并动画类名（重置供下次使用）
          moveMapping.merges.forEach(merge => {
            const key = `${merge.to.row}-${merge.to.col}`;
            if (animations[key] === 'tile-merged') {
              animations[key] = '';
            }
          });
          this.setData({
            tileAnimations: animations,
            tilesToDisappear: {} // 消失动画(140ms)已完成，清除标记
          });
          resolve();
        }, 160); // 160ms：覆盖合并(200ms)和消失(140ms)动画
      });
    });
  },

  /**
   * 应用新方块生成动画（250ms，缩放效果）
   * 从scale(0)平滑放大到scale(1)
   * 特点：简洁自然的缩放出现
   */
  applyNewTileAnimation(newTile) {
    if (!newTile) {
      return Promise.resolve();
    }
    
    const key = `${newTile.row}-${newTile.col}`;
    
    // 先显示新方块（清除隐藏标记），然后立即应用动画
    const hiddenTiles = { ...this.data.hiddenNewTiles };
    delete hiddenTiles[key];
    
    const animations = {
      ...this.data.tileAnimations,
      [key]: 'tile-new'
    };
    
    return new Promise((resolve) => {
      this.setData({
        hiddenNewTiles: hiddenTiles,
        tileAnimations: animations
      }, () => {
        // 32ms确保DOM已渲染，动画类名稳定挂载后再等待完成
        setTimeout(() => {
          // 移除动画类名，让下次动画能重新触发
          setTimeout(() => {
            animations[key] = '';
            this.setData({
              tileAnimations: animations
            });
            resolve();
          }, 220); // 220ms新方块生成动画
        }, 32); // 2帧，确保animation已稳定挂载
      });
    });
  },

  /**
   * 新游戏
   */
  newGame() {
    // 游戏未结束且已有进度时，避免误触直接清空
    if (!this.data.gameOver && this.data.score > 0) {
      wx.showModal({
        title: '新游戏',
        content: '确定要重新开始吗？当前进度将丢失。',
        confirmText: '重新开始',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.newGameForce();
          }
        }
      });
      return;
    }
    this.newGameForce();
  },

  newGameForce() {
    this.game.init();
    const hasModal =
      this.data.showGameOverModal ||
      this.data.showWinModal ||
      this.data.showMenuModal ||
      this.data.showTutorialModal;

    if (hasModal) {
      this.setData({
        gameOverModalClosing: !!this.data.showGameOverModal,
        winModalClosing: !!this.data.showWinModal,
        menuModalClosing: !!this.data.showMenuModal,
        tutorialModalClosing: !!this.data.showTutorialModal
      });

      setTimeout(() => {
        this.setData({
          showGameOverModal: false,
          showWinModal: false,
          showMenuModal: false,
          showTutorialModal: false,
          gameOverModalClosing: false,
          winModalClosing: false,
          menuModalClosing: false,
          tutorialModalClosing: false,
          tutorialStep: 0,
          tileAnimations: {},
          tileTransforms: {},
          hiddenNewTiles: {},
          tilesToDisappear: {}
        });
        this.updateUI();
        this.saveGame();
      }, 180);
      return;
    }

    this.setData({
      showGameOverModal: false,
      showWinModal: false,
      showMenuModal: false,
      showTutorialModal: false,
      tutorialStep: 0,
      tileAnimations: {},
      tileTransforms: {},
      hiddenNewTiles: {},
      tilesToDisappear: {}
    });
    this.updateUI();
    this.saveGame();
  },
  
  /**
   * 撤销操作
   */
  undo() {
    if (this.data.eliminateMode) {
      // 如果处于消除模式，先退出消除模式
      this.setData({
        eliminateMode: false,
        eliminateTipVisible: false
      });
      if (this.eliminateTipTimer) {
        clearTimeout(this.eliminateTipTimer);
        this.eliminateTipTimer = null;
      }
      return;
    }

    if (this.isAnimating) {
      return;
    }

    this.ensureToolCreditOrAd('undo', () => {
      if (this.game && this.game.undo()) {
        this.updateUI();
        this.saveGame();
        wx.showToast({
          title: '已撤销',
          icon: 'success',
          duration: 1000
        });
      } else {
        wx.showToast({
          title: '无法撤销',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  /**
   * 显示撤销功能提示
   */
  showUndoTip() {
    wx.showModal({
      title: '撤销功能',
      content: '点击撤销按钮可以回退上一步操作。如果处于消除模式，点击撤销按钮会先退出消除模式。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 切换消除模式
   */
  toggleEliminateMode() {
    if (this.isAnimating) {
      return;
    }

    const newMode = !this.data.eliminateMode;
    if (newMode) {
      // 一次只能消除一个方块：进入消除模式不消耗次数；成功消除后再扣除 1 次并自动退出
      if (this.data.eliminateCredits <= 0) {
        wx.showModal({
          title: '消除次数不足',
          content: '观看广告可获得 1 次「消除」使用次数。',
          confirmText: '看广告',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.watchAdToAddToolCredit('eliminate');
            }
          }
        });
        return;
      }

      this.setData({
        eliminateMode: true,
        eliminateTipVisible: true
      });

      if (this.eliminateTipTimer) {
        clearTimeout(this.eliminateTipTimer);
        this.eliminateTipTimer = null;
      }
      this.eliminateTipTimer = setTimeout(() => {
        this.setData({ eliminateTipVisible: false });
        this.eliminateTipTimer = null;
      }, 2200);
      return;
    }

    this.setData({
      eliminateMode: false,
      eliminateTipVisible: false
    });
    
    if (this.eliminateTipTimer) {
      clearTimeout(this.eliminateTipTimer);
      this.eliminateTipTimer = null;
    }
  },

  /**
   * 显示消除功能提示
   */
  showEliminateTip() {
    wx.showModal({
      title: '消除功能',
      content: '点击消除按钮进入消除模式，然后点击棋盘上的方块可以删除它。再次点击消除按钮退出消除模式。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 消除方块
   */
  eliminateTile(e) {
    if (!this.data.eliminateMode) {
      return;
    }
    
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;

    const hasTile = !!(
      this.data.grid &&
      this.data.grid[row] &&
      this.data.grid[row][col]
    );
    if (!hasTile) {
      wx.showToast({
        title: '请选择一个方块',
        icon: 'none',
        duration: 900
      });
      return;
    }

    if (this.data.eliminateCredits <= 0) {
      wx.showModal({
        title: '消除次数不足',
        content: '观看广告可获得 1 次「消除」使用次数。',
        confirmText: '看广告',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.watchAdToAddToolCredit('eliminate');
          }
        }
      });
      return;
    }

    if (this.game && this.game.removeTile(row, col)) {
      // 成功消除：扣除次数，并自动退出消除模式（一次只能消除一个方块）
      this.consumeToolCredit('eliminate');
      this.setData({
        eliminateMode: false,
        eliminateTipVisible: false
      });
      if (this.eliminateTipTimer) {
        clearTimeout(this.eliminateTipTimer);
        this.eliminateTipTimer = null;
      }

      this.updateUI();
      this.saveGame();

      // 播放音效
      try {
        if (this.audioManager) {
          this.audioManager.playMove();
        }
      } catch (e) {
        console.warn('播放消除音效异常', e);
      }

      wx.showToast({
        title: '已消除',
        icon: 'success',
        duration: 800
      });
      return;
    }

    wx.showToast({
      title: '无法消除',
      icon: 'none',
      duration: 1000
    });
  },
  
  /**
   * 显示/隐藏菜单
   */
  toggleMenu() {
    if (this.data.showMenuModal) {
      this.closeMenu();
      return;
    }
    this.setData({
      showMenuModal: true,
      menuModalClosing: false
    });
  },
  
  /**
   * 关闭菜单
   */
  closeMenu() {
    this.closeModalWithAnimation('showMenuModal', 'menuModalClosing');
  },
  
  /**
   * 继续游戏（从菜单）
   */
  continueGameFromMenu() {
    this.closeMenu();
  },
  
  /**
   * 切换音效
   */
  toggleSound() {
    if (this.audioManager) {
      const enabled = this.audioManager.toggleSound();
      this.setData({
        soundEnabled: enabled
      });
      wx.showToast({
        title: enabled ? '音效已开启' : '音效已关闭',
        icon: 'none',
        duration: 1500
      });
    }
  },

  /**
   * 切换震动反馈
   */
  toggleVibration() {
    const enabled = !this.data.vibrationEnabled;
    this.setData({
      vibrationEnabled: enabled
    });
    try {
      wx.setStorageSync('vibrationEnabled', enabled);
    } catch (e) {
      console.error('保存震动设置失败', e);
    }
    wx.showToast({
      title: enabled ? '震动已开启' : '震动已关闭',
      icon: 'none',
      duration: 1500
    });
  },
  
  /**
   * 显示新手指引（从菜单）
   */
  showTutorialFromMenu() {
    if (this.data.showMenuModal) {
      this.closeModalWithAnimation('showMenuModal', 'menuModalClosing', 170, () => {
        this.showTutorial();
      });
      return;
    }
    this.showTutorial();
  },
  
  /**
   * 返回主界面
   */
  goToMain() {
    // 先保存游戏
    this.saveGame();
    // 返回主界面（兼容直接从入口进入本页的情况）
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.reLaunch({
          url: '/pages/main/main'
        });
      }
    });
  },

  /**
   * 继续游戏（胜利后）
   */
  continueGame() {
    this.game.continueGame();
    this.closeModalWithAnimation('showWinModal', 'winModalClosing');
  },

  /**
   * 关闭游戏结束弹窗
   */
  closeGameOverModal() {
    this.closeModalWithAnimation('showGameOverModal', 'gameOverModalClosing');
  },

  /**
   * 看视频复活
   */
  watchAdToRevive() {
    if (!wx.createRewardedVideoAd) {
      wx.showToast({
        title: '当前版本不支持激励视频广告',
        icon: 'none'
      });
      return;
    }

    // 通过本地配置/存储注入广告单元ID；未配置时不尝试拉取，避免按钮点击直接报错
    const adUnitId = wx.getStorageSync('rewardedAdUnitId') || '';
    if (!adUnitId || adUnitId === 'adunit-example') {
      wx.showToast({
        title: '广告未配置，暂不可复活',
        icon: 'none'
      });
      return;
    }

    // 创建激励视频广告实例
    const videoAd = wx.createRewardedVideoAd({ adUnitId });

    // 监听广告加载成功
    videoAd.onLoad(() => {
      console.log('广告加载成功');
    });

    // 监听广告加载失败
    videoAd.onError((err) => {
      console.error('广告加载失败', err);
      wx.showToast({
        title: '广告加载失败，请稍后重试',
        icon: 'none'
      });
    });

    // 显示广告
    videoAd.show().catch(() => {
      // 如果显示失败，尝试加载广告
      videoAd.load().then(() => {
        videoAd.show();
      }).catch((err) => {
        console.error('广告显示失败', err);
        wx.showToast({
          title: '广告加载失败，请稍后重试',
          icon: 'none'
        });
      });
    });

    // 监听广告关闭
    videoAd.onClose((res) => {
      if (res && res.isEnded) {
        // 用户观看完广告
        const revived = this.game.revive();
        if (revived) {
          this.setData({
            showGameOverModal: false
          });
          this.updateUI();
          this.saveGame();
          wx.showToast({
            title: '复活成功！',
            icon: 'success'
          });
        }
      } else {
        // 用户中途退出
        wx.showToast({
          title: '需要看完广告才能复活',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    return {
      title: `我在2048游戏中得到了${this.data.score}分，你敢来挑战吗？`,
      imageUrl: '/images/share.png', // 需要添加分享图片
      path: '/pages/index/index'
    };
  }
});
