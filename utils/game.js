/**
 * 2048游戏核心逻辑类
 */
class Game2048 {
  constructor(size = 4) {
    this.size = size;
    this.grid = [];
    this.score = 0;
    this.bestScore = 0;
    this.gameOver = false;
    this.won = false;
    this.hasWon = false; // 是否已经弹出过胜利弹窗
    this.history = []; // 历史记录，用于撤销功能
    this.init();
  }

  /**
   * 初始化游戏
   */
  init() {
    // 加载历史最高分
    try {
      const best = wx.getStorageSync('bestScore');
      if (best) {
        this.bestScore = parseInt(best) || 0;
      }
    } catch (e) {
      console.error('读取历史最高分失败', e);
    }

    // 初始化棋盘
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.hasWon = false;
    this.history = []; // 清空历史记录

    // 生成两个初始方块
    this.addRandomTile();
    this.addRandomTile();
    
    // 保存初始状态到历史记录
    this.saveState();
  }
  
  /**
   * 保存当前状态到历史记录（用于撤销）
   */
  saveState() {
    const state = {
      grid: JSON.parse(JSON.stringify(this.grid)),
      score: this.score,
      gameOver: this.gameOver,
      won: this.won,
      hasWon: this.hasWon
    };
    this.history.push(state);
    
    // 限制历史记录数量，最多保存10步
    if (this.history.length > 10) {
      this.history.shift();
    }
  }
  
  /**
   * 撤销上一步操作
   */
  undo() {
    if (this.history.length <= 1) {
      return false; // 没有可撤销的操作（至少需要有一个初始状态）
    }
    
    // 移除当前状态
    this.history.pop();
    
    // 恢复到上一步状态
    const prevState = this.history[this.history.length - 1];
    if (prevState) {
      this.grid = JSON.parse(JSON.stringify(prevState.grid));
      this.score = prevState.score;
      this.gameOver = prevState.gameOver;
      this.won = prevState.won;
      this.hasWon = prevState.hasWon;
      return true;
    }
    
    return false;
  }

  /**
   * 从保存的状态恢复游戏
   */
  loadGame(savedData) {
    if (savedData && savedData.grid && savedData.score !== undefined) {
      this.grid = savedData.grid;
      this.score = savedData.score || 0;
      this.gameOver = savedData.gameOver || false;
      this.won = savedData.won || false;
      this.hasWon = savedData.hasWon || false;
      this.history = savedData.history || [];

      // 加载历史最高分
      try {
        const best = wx.getStorageSync('bestScore');
        if (best) {
          this.bestScore = parseInt(best) || 0;
        }
      } catch (e) {
        console.error('读取历史最高分失败', e);
      }
    } else {
      this.init();
    }
  }

  /**
   * 获取当前游戏状态（用于保存）
   */
  getGameState() {
    return {
      grid: JSON.parse(JSON.stringify(this.grid)),
      score: this.score,
      gameOver: this.gameOver,
      won: this.won,
      hasWon: this.hasWon,
      history: JSON.parse(JSON.stringify(this.history))
    };
  }

  /**
   * 获取空位置列表
   */
  getEmptyCells() {
    const emptyCells = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.grid[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }
    return emptyCells;
  }

  /**
   * 在随机空位置添加方块
   * 90%概率为2，10%概率为4
   */
  addRandomTile() {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length === 0) {
      return false;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];
    
    // 90%概率为2，10%概率为4
    const value = Math.random() < 0.9 ? 2 : 4;
    this.grid[row][col] = value;

    return { row, col, value };
  }

  /**
   * 将一行向左移动并合并（内部方法）
   * 返回移动后的行和是否有变化
   */
  _moveRowLeft(row) {
    const newRow = row.filter(val => val !== 0);
    const merged = Array(this.size).fill(0);
    let mergedIndex = 0;
    let scoreIncrease = 0;
    let changed = false;

    for (let i = 0; i < newRow.length; i++) {
      if (i < newRow.length - 1 && newRow[i] === newRow[i + 1]) {
        // 合并
        const mergedValue = newRow[i] * 2;
        merged[mergedIndex] = mergedValue;
        scoreIncrease += mergedValue;
        i++; // 跳过下一个元素，因为已经合并
        changed = true;
      } else {
        merged[mergedIndex] = newRow[i];
      }
      mergedIndex++;
    }

    // 检查是否有变化（位置变化或合并）
    for (let i = 0; i < this.size; i++) {
      if (row[i] !== merged[i]) {
        changed = true;
      }
    }

    return { row: merged, scoreIncrease, changed };
  }

  /**
   * 将一行向右移动并合并（内部方法）
   */
  _moveRowRight(row) {
    // 反转后向左移动，再反转回来
    const reversed = [...row].reverse();
    const result = this._moveRowLeft(reversed);
    return {
      row: result.row.reverse(),
      scoreIncrease: result.scoreIncrease,
      changed: result.changed
    };
  }

  /**
   * 获取列
   */
  getColumn(colIndex) {
    return this.grid.map(row => row[colIndex]);
  }

  /**
   * 设置列
   */
  setColumn(colIndex, column) {
    for (let i = 0; i < this.size; i++) {
      this.grid[i][colIndex] = column[i];
    }
  }

  /**
   * 向上移动
   */
  moveUp() {
    let moved = false;
    let totalScore = 0;

    for (let j = 0; j < this.size; j++) {
      const column = this.getColumn(j);
      const result = this._moveRowLeft(column);
      this.setColumn(j, result.row);
      if (result.changed) {
        moved = true;
      }
      totalScore += result.scoreIncrease;
    }

    return { moved, scoreIncrease: totalScore };
  }

  /**
   * 向下移动
   */
  moveDown() {
    let moved = false;
    let totalScore = 0;

    for (let j = 0; j < this.size; j++) {
      const column = this.getColumn(j);
      const result = this._moveRowRight(column);
      this.setColumn(j, result.row);
      if (result.changed) {
        moved = true;
      }
      totalScore += result.scoreIncrease;
    }

    return { moved, scoreIncrease: totalScore };
  }

  /**
   * 向左移动
   */
  moveLeft() {
    let moved = false;
    let totalScore = 0;

    for (let i = 0; i < this.size; i++) {
      const result = this._moveRowLeft(this.grid[i]);
      this.grid[i] = result.row;
      if (result.changed) {
        moved = true;
      }
      totalScore += result.scoreIncrease;
    }

    return { moved, scoreIncrease: totalScore };
  }

  /**
   * 向右移动
   */
  moveRight() {
    let moved = false;
    let totalScore = 0;

    for (let i = 0; i < this.size; i++) {
      const result = this._moveRowRight(this.grid[i]);
      this.grid[i] = result.row;
      if (result.changed) {
        moved = true;
      }
      totalScore += result.scoreIncrease;
    }

    return { moved, scoreIncrease: totalScore };
  }

  /**
   * 验证移动方向是否符合指定的滑动方向
   */
  isValidMoveDirection(from, to, direction) {
    switch (direction) {
      case 'up':
        // 向上：只能从下往上移动（from.row > to.row）
        return from.row > to.row && from.col === to.col;
      case 'down':
        // 向下：只能从上往下移动（from.row < to.row）
        return from.row < to.row && from.col === to.col;
      case 'left':
        // 向左：只能从右往左移动（from.col > to.col）
        return from.col > to.col && from.row === to.row;
      case 'right':
        // 向右：只能从左往右移动（from.col < to.col）
        return from.col < to.col && from.row === to.row;
      default:
        return false;
    }
  }

  /**
   * 计算移动映射（用于动画）
   * 返回：{ moves: [{from: {row, col}, to: {row, col}, value}], merges: [{from: [{row, col}], to: {row, col}, value}] }
   * @param {Array} oldGrid - 移动前的棋盘
   * @param {Array} newGrid - 移动后的棋盘
   * @param {string} direction - 移动方向（'up', 'down', 'left', 'right'），用于验证移动方向正确性
   */
  calculateMoveMapping(oldGrid, newGrid, direction) {
    const moves = [];
    const merges = [];
    const usedOld = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
    const usedNew = Array(this.size).fill(null).map(() => Array(this.size).fill(false));

    // 先找合并
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (newGrid[i][j] !== 0 && !usedNew[i][j]) {
          // 检查是否是合并的结果（新值在旧位置不存在，或者新值是旧值的两倍）
          const newValue = newGrid[i][j];
          
          // 查找可能的合并来源（必须符合移动方向）
          const sources = [];
          for (let oi = 0; oi < this.size; oi++) {
            for (let oj = 0; oj < this.size; oj++) {
              if (oldGrid[oi][oj] !== 0 && !usedOld[oi][oj] && 
                  (oldGrid[oi][oj] === newValue || oldGrid[oi][oj] === newValue / 2)) {
                // 验证移动方向是否符合滑动方向
                if (this.isValidMoveDirection({row: oi, col: oj}, {row: i, col: j}, direction)) {
                  sources.push({row: oi, col: oj});
                }
              }
            }
          }
          
          // 如果是合并（有两个相同值的源且新值是两倍）
          if (sources.length >= 2 && newValue === oldGrid[sources[0].row][sources[0].col] * 2) {
            // 找到最接近新位置的两个源（按滑动方向的优先级排序）
            sources.sort((a, b) => {
              // 优先选择在滑动方向上更靠近新位置的源
              let priorityA = 0, priorityB = 0;
              switch (direction) {
                case 'up':
                  priorityA = a.row - i;
                  priorityB = b.row - i;
                  break;
                case 'down':
                  priorityA = i - a.row;
                  priorityB = i - b.row;
                  break;
                case 'left':
                  priorityA = a.col - j;
                  priorityB = b.col - j;
                  break;
                case 'right':
                  priorityA = j - a.col;
                  priorityB = j - b.col;
                  break;
              }
              if (priorityA !== priorityB) {
                return priorityB - priorityA; // 距离更近的优先
              }
              // 如果距离相同，按总距离排序
              const distA = Math.abs(a.row - i) + Math.abs(a.col - j);
              const distB = Math.abs(b.row - i) + Math.abs(b.col - j);
              return distA - distB;
            });
            
            const mergeSources = [sources[0], sources[1]];
            merges.push({
              from: mergeSources,
              to: {row: i, col: j},
              value: newValue
            });
            mergeSources.forEach(s => usedOld[s.row][s.col] = true);
            usedNew[i][j] = true;
          }
        }
      }
    }

    // 再找普通移动
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (newGrid[i][j] !== 0 && !usedNew[i][j]) {
          const newValue = newGrid[i][j];
          // 查找旧位置（未使用且值相同，且移动方向符合滑动方向）
          for (let oi = 0; oi < this.size; oi++) {
            for (let oj = 0; oj < this.size; oj++) {
              if (oldGrid[oi][oj] === newValue && !usedOld[oi][oj] && 
                  (oi !== i || oj !== j)) {
                // 验证移动方向是否符合滑动方向
                if (this.isValidMoveDirection({row: oi, col: oj}, {row: i, col: j}, direction)) {
                  moves.push({
                    from: {row: oi, col: oj},
                    to: {row: i, col: j},
                    value: newValue
                  });
                  usedOld[oi][oj] = true;
                  usedNew[i][j] = true;
                  break;
                }
              }
            }
          }
        }
      }
    }

    return { moves, merges };
  }

  /**
   * 执行移动操作（带移动追踪）
   */
  moveWithTracking(direction) {
    if (this.gameOver) {
      return { moved: false, scoreIncrease: 0 };
    }

    // 保存移动前的状态
    const oldGrid = JSON.parse(JSON.stringify(this.grid));

    // 执行移动
    const result = this.move(direction);

    if (result.moved) {
      // 计算移动映射，传入方向以确保移动方向正确
      const moveMapping = this.calculateMoveMapping(oldGrid, this.grid, direction);
      return {
        ...result,
        moveMapping
      };
    }

    return result;
  }

  /**
   * 执行移动操作
   */
  move(direction) {
    if (this.gameOver) {
      return { moved: false, scoreIncrease: 0 };
    }

    // 在移动前保存当前状态（用于撤销）
    this.saveState();

    let result;
    switch (direction) {
      case 'up':
        result = this.moveUp();
        break;
      case 'down':
        result = this.moveDown();
        break;
      case 'left':
        result = this.moveLeft();
        break;
      case 'right':
        result = this.moveRight();
        break;
      default:
        // 如果没有移动，移除刚才保存的状态
        this.history.pop();
        return { moved: false, scoreIncrease: 0 };
    }

    if (result.moved) {
      // 移动成功，继续处理
      
      // 更新分数
      this.score += result.scoreIncrease;

      // 更新历史最高分
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        try {
          wx.setStorageSync('bestScore', this.bestScore);
        } catch (e) {
          console.error('保存历史最高分失败', e);
        }
      }

      // 生成新方块
      const newTile = this.addRandomTile();

      // 检查是否胜利（合成2048）
      let justWon = false;
      if (!this.hasWon && this.hasWonTile()) {
        this.won = true;
        this.hasWon = true;
        justWon = true; // 标记为刚刚胜利
      }

      // 检查游戏是否结束
      if (!this.canMove()) {
        this.gameOver = true;
      }

      return {
        moved: true,
        scoreIncrease: result.scoreIncrease,
        newTile,
        gameOver: this.gameOver,
        won: justWon // 只在首次胜利时返回true
      };
    } else {
      // 移动失败，移除刚才保存的状态
      this.history.pop();
    }

    return { moved: false, scoreIncrease: 0 };
  }

  /**
   * 检查是否有2048方块
   */
  hasWonTile() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.grid[i][j] === 2048) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 检查是否还能移动
   */
  canMove() {
    // 检查是否有空位
    if (this.getEmptyCells().length > 0) {
      return true;
    }

    // 检查是否有相邻的相同数字
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const current = this.grid[i][j];
        // 检查右侧
        if (j < this.size - 1 && this.grid[i][j + 1] === current) {
          return true;
        }
        // 检查下方
        if (i < this.size - 1 && this.grid[i + 1][j] === current) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 继续游戏（胜利后）
   */
  continueGame() {
    this.won = false;
  }

  /**
   * 复活：移除3个数值最小的方块
   */
  revive() {
    if (this.gameOver && this.getEmptyCells().length < 16) {
      // 获取所有非零方块及其位置
      const tiles = [];
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (this.grid[i][j] !== 0) {
            tiles.push({ row: i, col: j, value: this.grid[i][j] });
          }
        }
      }

      // 按值排序，取最小的3个
      tiles.sort((a, b) => a.value - b.value);
      const toRemove = tiles.slice(0, Math.min(3, tiles.length));

      // 移除这些方块
      toRemove.forEach(tile => {
        this.grid[tile.row][tile.col] = 0;
      });

      this.gameOver = false;
      return true;
    }
    return false;
  }

  /**
   * 消除指定位置的方块
   */
  removeTile(row, col) {
    if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
      if (this.grid[row][col] !== 0) {
        this.grid[row][col] = 0;
        // 保存状态用于撤销
        this.saveState();
        return true;
      }
    }
    return false;
  }
}

module.exports = Game2048;

