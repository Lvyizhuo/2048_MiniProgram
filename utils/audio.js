/**
 * 音效管理工具类
 */
class AudioManager {
  constructor() {
    this.moveAudio = null;
    this.mergeAudio = null;
    this.soundEnabled = true; // 默认开启音效
    
    // 从本地存储读取音效开关状态
    try {
      const saved = wx.getStorageSync('soundEnabled');
      if (saved !== '') {
        this.soundEnabled = saved !== false;
      }
    } catch (e) {
      console.error('读取音效设置失败', e);
    }
    
    this.initAudio();
  }

  /**
   * 初始化音频
   */
  initAudio() {
    // 移动音效
    this.moveAudio = wx.createInnerAudioContext();
    this.moveAudio.src = '/src/wav/move.wav';
    this.moveAudio.volume = 0.5;

    // 合并音效
    this.mergeAudio = wx.createInnerAudioContext();
    this.mergeAudio.src = '/src/wav/merge.wav';
    this.mergeAudio.volume = 0.6;
  }

  /**
   * 播放移动音效
   */
  playMove() {
    if (!this.soundEnabled || !this.moveAudio) {
      return;
    }
    
    try {
      // 安全地重置和播放音频
      try {
        this.moveAudio.stop();
      } catch (e) {
        // 忽略stop错误
      }
      try {
        this.moveAudio.seek(0);
      } catch (e) {
        // 忽略seek错误，可能是音频未准备好
      }
      // 播放音频
      this.moveAudio.play().catch(e => {
        // 静默处理音频播放错误，不影响游戏逻辑
        console.warn('播放移动音效失败', e);
      });
    } catch (e) {
      // 捕获所有可能的异常，确保不影响游戏逻辑
      console.warn('音效播放异常', e);
    }
  }

  /**
   * 播放合并音效
   */
  playMerge() {
    if (!this.soundEnabled || !this.mergeAudio) {
      return;
    }
    
    try {
      // 安全地重置和播放音频
      try {
        this.mergeAudio.stop();
      } catch (e) {
        // 忽略stop错误
      }
      try {
        this.mergeAudio.seek(0);
      } catch (e) {
        // 忽略seek错误，可能是音频未准备好
      }
      // 播放音频
      this.mergeAudio.play().catch(e => {
        // 静默处理音频播放错误，不影响游戏逻辑
        console.warn('播放合并音效失败', e);
      });
    } catch (e) {
      // 捕获所有可能的异常，确保不影响游戏逻辑
      console.warn('音效播放异常', e);
    }
  }

  /**
   * 切换音效开关
   */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    try {
      wx.setStorageSync('soundEnabled', this.soundEnabled);
    } catch (e) {
      console.error('保存音效设置失败', e);
    }
    return this.soundEnabled;
  }

  /**
   * 设置音效开关
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    try {
      wx.setStorageSync('soundEnabled', this.soundEnabled);
    } catch (e) {
      console.error('保存音效设置失败', e);
    }
  }

  /**
   * 销毁音频实例
   */
  destroy() {
    if (this.moveAudio) {
      this.moveAudio.destroy();
    }
    if (this.mergeAudio) {
      this.mergeAudio.destroy();
    }
  }
}

module.exports = AudioManager;

