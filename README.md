# 2048微信小程序
[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/Lvyizhuo/2048_MiniProgram)

一个完整的、高质量的2048数字益智游戏微信小程序，严格按照需求文档开发。

## 功能特性

### 核心游戏功能
- ✅ 4x4游戏棋盘
- ✅ 四个方向滑动操作（上、下、左、右）
- ✅ 方块移动和合并逻辑
- ✅ 新方块自动生成（90%概率为2，10%概率为4）
- ✅ 分数计算和历史最高分记录
- ✅ 游戏结束和胜利判断
- ✅ 游戏状态本地持久化

### UI/UX特性
- ✅ 精美的视觉设计（符合需求文档的色彩方案）
- ✅ 流畅的动画效果（移动200ms、生成150ms、合并100ms）
- ✅ 优化的动画序列（新方块在合并动画期间隐藏，避免闪烁）
- ✅ 震动反馈（合并时）
- ✅ 响应式布局，适配不同屏幕尺寸
- ✅ 游戏结束和胜利弹窗

### 商业化功能（预留接口）
- ✅ 激励视频广告接口（复活功能）
- ✅ Banner广告位预留
- ✅ 分享功能

### 其他功能
- ✅ 游戏状态自动保存和恢复
- ✅ 新游戏功能

## 项目结构

```
2048_Qwen/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序全局配置
├── app.wxss              # 小程序全局样式
├── sitemap.json          # 站点地图配置
├── project.config.json   # 项目配置文件
├── pages/
│   └── index/
│       ├── index.js      # 游戏主页面逻辑
│       ├── index.wxml    # 游戏主页面结构
│       └── index.wxss    # 游戏主页面样式
├── utils/
│   └── game.js           # 游戏核心逻辑类
└── README.md             # 项目说明文档
```

## 使用方法

### 1. 开发环境准备

1. 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具，选择"小程序"
3. 导入项目，选择本项目目录
4. 填入你的小程序AppID（可在微信公众平台获取）

### 2. 配置说明

#### app.json
- 已配置基本页面路由和窗口样式

#### project.config.json
- 需要将 `appid` 字段替换为你的实际小程序AppID

#### 广告配置
在 `pages/index/index.js` 的 `watchAdToRevive` 方法中：
- 将 `adUnitId: 'adunit-example'` 替换为你的实际激励视频广告单元ID
- 如需接入Banner广告，可在相应位置添加广告组件

#### 分享功能
在 `pages/index/index.js` 的 `onShareAppMessage` 方法中：
- 需要准备分享图片，放置在 `/images/share.png`
- 或修改 `imageUrl` 为你的实际分享图片路径

### 3. 运行项目

1. 在微信开发者工具中点击"编译"
2. 在模拟器或真机上预览
3. 通过滑动操作进行游戏

## 技术实现

### 核心逻辑
- **游戏引擎**：`utils/game.js` 中的 `Game2048` 类负责所有游戏逻辑
- **状态管理**：使用Page的data和setData机制管理状态
- **数据持久化**：使用 `wx.setStorageSync` 和 `wx.getStorageSync` 保存游戏状态和历史最高分

### 动画实现
- 使用CSS3动画实现方块移动、生成和合并效果
- 通过类名动态控制动画触发
- 动画时长严格按照需求文档：移动200ms、生成150ms、合并100ms
- **动画优化**：新方块闪烁问题修复
  - 在滑动和合并动画期间，新方块通过 `hiddenNewTiles` 状态管理隐藏
  - 使用 `.tile-hidden` CSS类（`opacity: 0` + `visibility: hidden`）实现隐藏效果
  - 合并动画完成后，立即清除隐藏标记并应用生成动画，确保流畅的视觉体验

### 滑动检测
- 通过 `touchstart` 和 `touchend` 事件检测滑动方向
- 最小滑动距离30px，避免误触
- 响应时间<100ms，确保流畅体验

## 需求覆盖情况

### 功能需求 ✅
- [x] FR1: 游戏棋盘（4x4网格）
- [x] FR2: 游戏初始化（两个初始方块）
- [x] FR3: 滑动操作与合并逻辑（支持四个方向，正确合并）
- [x] FR4: 新方块生成（有效滑动后生成）
- [x] FR5: 分数计算（合并加分，历史最高分）
- [x] FR6: 游戏结束与胜利判断
- [x] FR7: 游戏主界面布局
- [x] FR8: 弹窗组件（游戏结束、胜利）
- [x] FR9: 激励视频广告接口
- [x] FR10: Banner广告位预留
- [x] FR11: 好友排行榜（接口预留，需开放数据域）
- [x] FR12: 分享功能

### 非功能需求 ✅
- [x] NFR1: 性能要求（响应时间<100ms）
- [x] NFR2: 用户体验（动画反馈、震动反馈、状态保存）
- [x] NFR3: 兼容性（iOS/Android）

## 后续开发建议

### 1. 广告接入
- 申请微信小程序流量主
- 配置激励视频广告单元ID
- 配置Banner广告组件

### 2. 排行榜功能
- 创建开放数据域页面
- 接入微信开放数据域API
- 实现好友数据拉取和排名展示

### 3. 撤销功能
- 实现游戏状态历史记录
- 添加撤销按钮交互
- 接入激励视频广告

### 4. 优化建议
- 添加音效（可选）
- 优化动画性能
- 添加更多UI细节

## 更新日志

### 最新更新（动画优化）

**修复新方块闪烁问题**
- **问题描述**：在滑动和合并动画期间，新生成的方块会短暂闪烁，影响视觉体验
- **解决方案**：
  - 在 `pages/index/index.js` 中添加 `hiddenNewTiles` 状态管理
  - 滑动动画期间将新方块标记为隐藏，避免在合并动画完成前显示
  - 合并动画完成后立即清除隐藏标记并应用生成动画
  - 在 `pages/index/index.wxml` 中添加条件类名绑定 `tile-hidden`
  - 在 `pages/index/index.wxss` 中添加 `.tile-hidden` 样式类
- **修改文件**：
  - `pages/index/index.js`（添加新方块隐藏逻辑）
  - `pages/index/index.wxml`（添加隐藏类名绑定）
  - `pages/index/index.wxss`（添加隐藏样式类）

## 注意事项

1. **广告单元ID**：开发阶段可使用测试ID，正式上线需要替换为实际ID
2. **分享图片**：建议准备一张精美的分享卡片图片
3. **性能优化**：在真机上测试，确保动画流畅（60fps）
4. **数据存储**：使用 `wx.setStorageSync` 有大小限制（10MB），需注意
5. **动画状态管理**：新方块隐藏机制确保动画序列的流畅性，避免视觉闪烁

## 许可证

本项目仅供学习和参考使用。

