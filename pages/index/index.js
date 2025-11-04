const Game2048 = require('../../utils/game.js');
const AudioManager = require('../../utils/audio.js');

Page({
  data: {
    grid: [],
    score: 0,
    bestScore: 0,
    gameOver: false,
    showGameOverModal: false,
    showWinModal: false,
    showMenuModal: false,
    showTutorialModal: false,
    tutorialStep: 0,
    soundEnabled: true,
    touchStartX: 0,
    touchStartY: 0,
    tileAnimations: {}, // 存储方块动画状态
    tileTransforms: {}, // 存储方块变换样式
    tilesToDisappear: {}, // 标记需要消失的方块（被合并的源方块）
    hiddenNewTiles: {}, // 标记需要隐藏的新方块（避免闪烁）
    eliminateMode: false // 消除模式开关
  },

  game: null,
  audioManager: null,

  onLoad() {
    // 初始化音效管理器
    this.audioManager = new AudioManager();
    
    // 初始化游戏
    this.game = new Game2048();
    
    // 尝试加载保存的游戏状态
    this.loadSavedGame();
    
    // 更新界面
    this.updateUI();
    
    // 检查是否需要显示新手教程
    this.checkFirstTime();
  },
  
  onUnload() {
    // 页面卸载时销毁音效实例
    if (this.audioManager) {
      this.audioManager.destroy();
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
    });
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
      tutorialStep: 0
    });
  },
  
  /**
   * 关闭新手教程
   */
  closeTutorial() {
    this.setData({
      showTutorialModal: false,
      tutorialStep: 0
    });
    // 标记已显示过教程
    try {
      wx.setStorageSync('hasShownTutorial', true);
    } catch (e) {
      console.error('保存教程状态失败', e);
    }
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
    this.data.touchStartX = e.touches[0].clientX;
    this.data.touchStartY = e.touches[0].clientY;
  },

  /**
   * 触摸结束
   */
  touchEnd(e) {
    if (this.data.gameOver) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - this.data.touchStartX;
    const deltaY = touchEndY - this.data.touchStartY;
    
    // 最小滑动距离
    const minSwipeDistance = 30;
    
    // 如果处于消除模式且检测到滑动，退出消除模式
    if (this.data.eliminateMode) {
      if (Math.abs(deltaX) >= minSwipeDistance || Math.abs(deltaY) >= minSwipeDistance) {
        this.setData({
          eliminateMode: false
        });
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
   * 处理移动
   */
  handleMove(direction) {
    // 保存移动前的grid状态用于动画
    const oldGridData = JSON.parse(JSON.stringify(this.data.grid));
    
    const result = this.game.moveWithTracking(direction);
    
    if (result.moved) {
      // 播放移动音效
      try {
        if (this.audioManager) {
          this.audioManager.playMove();
        }
      } catch (e) {
        console.warn('播放移动音效异常', e);
      }
      
      // 严格按顺序执行动画：滑动 → 合并 → 新方块生成
      this.executeAnimationsInSequence(result, oldGridData);
      
      // 处理胜利（在动画完成后）
      if (result.won) {
        setTimeout(() => {
          this.setData({
            showWinModal: true
          });
        }, 180 + 200 + 250 + 50); // 滑动(180ms) + 合并(200ms) + 新方块(250ms) + 延迟
      }

      // 处理游戏结束（在动画完成后）
      if (result.gameOver) {
        setTimeout(() => {
          this.setData({
            showGameOverModal: true
          });
        }, 180 + 200 + 250 + 50);
      }

      // 保存游戏状态（在动画完成后）
      setTimeout(() => {
        this.saveGame();
      }, 180 + 200 + 250 + 50);
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
      return;
    }

    // 第一步：应用滑动动画（180ms）
    // 传入新方块信息，在滑动动画时暂时隐藏它
    this.applySlideAnimations(moveMapping, oldGridData, result.newTile).then(() => {
      // 滑动动画完成后，执行合并动画（如果有合并）
      // 传入新方块信息，用于排除新方块位置的合并动画
      if (moveMapping.merges && moveMapping.merges.length > 0) {
        return this.applyMergeAnimations(moveMapping, result.newTile);
      }
      // 如果没有合并，直接执行新方块动画
      return Promise.resolve();
    }).then(() => {
      // 合并动画完成后（或没有合并时），执行新方块生成动画
      this.applyNewTileAnimation(result.newTile);
    });
  },

  /**
   * 应用滑动动画（180ms，流畅的移动效果）
   * 优化：使用更好的缓动函数，减少延迟
   * 返回Promise，在动画完成后resolve
   */
  applySlideAnimations(moveMapping, oldGridData, newTile) {
    return new Promise((resolve) => {
      // 先更新UI到新状态
      const newGrid = this.game.grid;
      const newScore = this.game.score;
      const newBestScore = this.game.bestScore;
      const newGameOver = this.game.gameOver;
      
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
      
      this.setData({
        grid: newGrid,
        score: newScore,
        bestScore: newBestScore,
        gameOver: newGameOver,
        hiddenNewTiles: hiddenTiles, // 标记需要隐藏的新方块
        tilesToDisappear: disappearingTiles // 标记被合并的方块
      }, () => {
        // 等待DOM更新后，设置transform偏移
        setTimeout(() => {
          const transforms = {};
          // 每个格子的大小：680rpx / 4 = 170rpx（包括间距）
          const cellSize = 170;
          
          // 处理普通移动：在新位置设置transform，从旧位置移动过来
          if (moveMapping.moves) {
            moveMapping.moves.forEach(move => {
              const key = `${move.to.row}-${move.to.col}`;
              const deltaX = (move.from.col - move.to.col) * cellSize;
              const deltaY = (move.from.row - move.to.row) * cellSize;
              transforms[key] = `translate(${deltaX}rpx, ${deltaY}rpx)`;
            });
          }
          
          // 处理合并：合并目标方块也需要滑动（从第一个源位置）
          if (moveMapping.merges && moveMapping.merges.length > 0) {
            moveMapping.merges.forEach(merge => {
              if (merge.from.length > 0) {
                const source = merge.from[0];
                const key = `${merge.to.row}-${merge.to.col}`;
                const deltaX = (source.col - merge.to.col) * cellSize;
                const deltaY = (source.row - merge.to.row) * cellSize;
                transforms[key] = `translate(${deltaX}rpx, ${deltaY}rpx)`;
              }
            });
          }
          
          // 设置transform偏移
          this.setData({
            tileTransforms: transforms
          }, () => {
            // 立即清除transform，触发CSS transition平滑移动
            // 使用requestAnimationFrame确保在下一帧执行
            setTimeout(() => {
              this.setData({
                tileTransforms: {}
              });
              // 等待动画完成（180ms）
              setTimeout(() => {
                resolve();
              }, 180); // 180ms滑动动画
            }, 16); // 约一帧的时间
          });
        }, 16); // 约一帧的时间
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
        wx.vibrateShort({
          type: 'light'
        });
      } catch (e) {
        console.warn('播放合并音效异常', e);
      }
      
      // 清除被合并方块标记
      this.setData({
        tilesToDisappear: {}
      });
      
      // 立即resolve，不等待动画
      resolve();
    });
  },

  /**
   * 应用新方块生成动画（250ms，缩放效果）
   * 从scale(0)平滑放大到scale(1)
   * 特点：简洁自然的缩放出现
   */
  applyNewTileAnimation(newTile) {
    if (!newTile) {
      return;
    }
    
    const key = `${newTile.row}-${newTile.col}`;
    
    // 先显示新方块（清除隐藏标记），然后立即应用动画
    const hiddenTiles = { ...this.data.hiddenNewTiles };
    delete hiddenTiles[key];
    
    const animations = {
      ...this.data.tileAnimations,
      [key]: 'tile-new'
    };
    
    this.setData({
      hiddenNewTiles: hiddenTiles,
      tileAnimations: animations
    }, () => {
      // 在下一帧确保DOM已更新后再开始动画
      setTimeout(() => {
        // 移除动画类名（250ms后）
        setTimeout(() => {
          animations[key] = '';
          this.setData({
            tileAnimations: animations
          });
        }, 250); // 250ms新方块生成动画
      }, 16); // 约一帧的时间
    });
  },

  /**
   * 新游戏
   */
  newGame() {
    this.game.init();
    this.setData({
      showGameOverModal: false,
      showWinModal: false,
      showMenuModal: false,
      tileAnimations: {},
      tileTransforms: {},
      hiddenNewTiles: {}
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
        eliminateMode: false
      });
      return;
    }
    
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
    const newMode = !this.data.eliminateMode;
    this.setData({
      eliminateMode: newMode
    });
    
    if (newMode) {
      wx.showToast({
        title: '消除模式已开启',
        icon: 'none',
        duration: 1500
      });
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
    
    if (this.game && this.game.removeTile(row, col)) {
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
    } else {
      wx.showToast({
        title: '无法消除',
        icon: 'none',
        duration: 1000
      });
    }
  },
  
  /**
   * 显示/隐藏菜单
   */
  toggleMenu() {
    this.setData({
      showMenuModal: !this.data.showMenuModal
    });
  },
  
  /**
   * 关闭菜单
   */
  closeMenu() {
    this.setData({
      showMenuModal: false
    });
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
   * 显示新手指引（从菜单）
   */
  showTutorialFromMenu() {
    this.setData({
      showMenuModal: false
    });
    this.showTutorial();
  },
  
  /**
   * 返回主界面
   */
  goToMain() {
    // 先保存游戏
    this.saveGame();
    // 返回主界面
    wx.navigateBack();
  },

  /**
   * 继续游戏（胜利后）
   */
  continueGame() {
    this.game.continueGame();
    this.setData({
      showWinModal: false
    });
  },

  /**
   * 关闭游戏结束弹窗
   */
  closeGameOverModal() {
    this.setData({
      showGameOverModal: false
    });
  },

  /**
   * 看视频复活
   */
  watchAdToRevive() {
    // 创建激励视频广告实例
    const videoAd = wx.createRewardedVideoAd({
      adUnitId: 'adunit-example' // 需要替换为实际的广告单元ID
    });

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

