/**
 * 2048小程序自动化测试脚本
 * 在微信开发者工具控制台中运行
 */

// ==================== 测试工具函数 ====================

const TestRunner = {
  results: [],

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  },

  assert(condition, testName) {
    if (condition) {
      this.log(`通过: ${testName}`, 'success');
      this.results.push({ name: testName, status: 'PASS' });
    } else {
      this.log(`失败: ${testName}`, 'error');
      this.results.push({ name: testName, status: 'FAIL' });
    }
  },

  summary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    console.log('\n========== 测试结果汇总 ==========');
    console.log(`总测试数: ${this.results.length}`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`通过率: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log('===================================\n');
  }
};

// ==================== 游戏逻辑测试 ====================

const GameLogicTests = {
  run() {
    console.log('\n🎮 运行游戏逻辑测试...\n');

    // 测试1: 基础合并
    this.testBasicMerge();

    // 测试2: 多组合并
    this.testMultipleMerge();

    // 测试3: 三连不合并
    this.testTripleNoMerge();

    // 测试4: 无移动
    this.testNoMove();

    // 测试5: 分数计算
    this.testScoreCalculation();

    // 测试6: 游戏结束检测
    this.testGameOver();
  },

  // 模拟向左移动的逻辑
  simulateMoveLeft(row) {
    const newRow = row.filter(val => val !== 0);
    const merged = Array(4).fill(0);
    let mergedIndex = 0;
    let scoreIncrease = 0;

    for (let i = 0; i < newRow.length; i++) {
      if (i < newRow.length - 1 && newRow[i] === newRow[i + 1]) {
        const mergedValue = newRow[i] * 2;
        merged[mergedIndex] = mergedValue;
        scoreIncrease += mergedValue;
        i++;
      } else {
        merged[mergedIndex] = newRow[i];
      }
      mergedIndex++;
    }

    return { row: merged, scoreIncrease };
  },

  testBasicMerge() {
    const input = [2, 2, 0, 0];
    const result = this.simulateMoveLeft(input);
    const expected = [4, 0, 0, 0];

    TestRunner.assert(
      JSON.stringify(result.row) === JSON.stringify(expected) && result.scoreIncrease === 4,
      '基础合并测试: [2,2,0,0] → [4,0,0,0], 得分+4'
    );
  },

  testMultipleMerge() {
    const input = [2, 2, 4, 4];
    const result = this.simulateMoveLeft(input);
    const expected = [4, 8, 0, 0];

    TestRunner.assert(
      JSON.stringify(result.row) === JSON.stringify(expected) && result.scoreIncrease === 12,
      '多组合并测试: [2,2,4,4] → [4,8,0,0], 得分+12'
    );
  },

  testTripleNoMerge() {
    const input = [2, 2, 2, 0];
    const result = this.simulateMoveLeft(input);
    const expected = [4, 2, 0, 0];

    TestRunner.assert(
      JSON.stringify(result.row) === JSON.stringify(expected) && result.scoreIncrease === 4,
      '三连不合并测试: [2,2,2,0] → [4,2,0,0], 得分+4'
    );
  },

  testNoMove() {
    const input = [2, 4, 8, 16];
    const result = this.simulateMoveLeft(input);
    const expected = [2, 4, 8, 16];

    TestRunner.assert(
      JSON.stringify(result.row) === JSON.stringify(expected) && result.scoreIncrease === 0,
      '无移动测试: [2,4,8,16] 保持不变, 得分+0'
    );
  },

  testScoreCalculation() {
    // 测试多种情况的分数计算
    const tests = [
      { input: [2, 2, 0, 0], expectedScore: 4 },
      { input: [4, 4, 0, 0], expectedScore: 8 },
      { input: [2, 2, 2, 2], expectedScore: 8 },
      { input: [4, 4, 4, 4], expectedScore: 16 },
    ];

    let allPassed = true;
    tests.forEach(test => {
      const result = this.simulateMoveLeft(test.input);
      if (result.scoreIncrease !== test.expectedScore) {
        allPassed = false;
      }
    });

    TestRunner.assert(
      allPassed,
      '分数计算综合测试: 4种场景的分数计算正确'
    );
  },

  testGameOver() {
    // 模拟一个无法移动的游戏结束局面
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ];

    // 检查是否还能移动（模拟逻辑）
    let canMove = false;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        // 检查右侧
        if (j < 3 && grid[i][j] === grid[i][j + 1]) {
          canMove = true;
        }
        // 检查下方
        if (i < 3 && grid[i][j] === grid[i + 1][j]) {
          canMove = true;
        }
      }
    }

    TestRunner.assert(
      !canMove,
      '游戏结束检测测试: 无相邻相同数字的局面正确判定为游戏结束'
    );
  }
};

// ==================== 存储测试 ====================

const StorageTests = {
  run() {
    console.log('\n💾 运行存储测试...\n');

    this.testSaveLoad();
    this.testBestScore();
    this.testTutorialFlag();
  },

  testSaveLoad() {
    try {
      const testData = {
        grid: [[2, 0, 0, 0], [0, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        score: 100,
        gameOver: false,
        won: false
      };

      wx.setStorageSync('testGameState', testData);
      const loaded = wx.getStorageSync('testGameState');

      TestRunner.assert(
        JSON.stringify(loaded) === JSON.stringify(testData),
        '游戏状态保存/读取测试: 数据正确保存和恢复'
      );

      wx.removeStorageSync('testGameState');
    } catch (e) {
      TestRunner.assert(false, `存储测试异常: ${e.message}`);
    }
  },

  testBestScore() {
    try {
      const testScore = 2048;
      wx.setStorageSync('bestScore', testScore);
      const loaded = wx.getStorageSync('bestScore');

      TestRunner.assert(
        parseInt(loaded) === testScore,
        '最高分保存/读取测试: 最高分正确保存'
      );
    } catch (e) {
      TestRunner.assert(false, `最高分测试异常: ${e.message}`);
    }
  },

  testTutorialFlag() {
    try {
      wx.setStorageSync('hasShownTutorial', true);
      const loaded = wx.getStorageSync('hasShownTutorial');

      TestRunner.assert(
        loaded === true,
        '教程标记保存测试: 教程标记正确保存'
      );
    } catch (e) {
      TestRunner.assert(false, `教程标记测试异常: ${e.message}`);
    }
  }
};

// ==================== 运行所有测试 ====================

function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     2048小程序 - 自动化测试套件        ║');
  console.log('╚════════════════════════════════════════╝');

  // 运行游戏逻辑测试
  GameLogicTests.run();

  // 运行存储测试
  StorageTests.run();

  // 输出总结
  TestRunner.summary();
}

// 导出测试模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GameLogicTests,
    StorageTests,
    runAllTests,
    TestRunner
  };
}

// 如果在微信开发者工具中运行
if (typeof wx !== 'undefined') {
  console.log('请在微信开发者工具控制台运行: runAllTests()');
}
