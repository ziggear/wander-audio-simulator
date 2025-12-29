# 3D 音频模拟器 - HRTF

一个基于 React 和 Web Audio API 的立体声音频模拟器，使用 HRTF（头部相关传递函数）技术实现真实的 3D 空间音频效果。

## 功能特性

- 🎵 **3D 空间音频**：使用 Web Audio API 的 PannerNode 和 HRTF 算法实现真实的立体声效果
- 🗺️ **可视化画布**：800x600 的画布，听者位于中心，可以直观地看到音源位置
- 🎯 **交互式音源管理**：
  - 点击画布创建音源
  - 拖动音源改变位置
  - 实时更新音频空间位置
- 📁 **音频文件上传**：支持上传音频文件（WAV、MP3 等）
- 🎚️ **音源控制**：
  - 音量调节
  - 循环播放开关
  - 音源命名
- 🔊 **距离衰减**：距离听者越远，音量自动减小
- 🎧 **立体声效果**：音源位置变化时，自动产生左右耳不同的声音效果

## 技术栈

- **React 18** - UI 框架
- **Web Audio API** - 音频处理
  - `AudioContext` - 音频上下文
  - `PannerNode` - 3D 空间音频处理
  - `HRTF` - 头部相关传递函数算法
- **Canvas API** - 画布绘制
- **Vite** - 构建工具

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

## 使用说明

1. **创建音源**：在画布上点击任意位置创建新的音源
2. **上传音频**：
   - 在左侧面板选择音源
   - 点击"选择音频文件"按钮
   - 上传你的音频文件（如 `bird.wav`、`dogbark.wav`）
3. **调整音源**：
   - 拖动音源改变位置
   - 在左侧面板编辑音源名称、音量、循环设置
4. **播放**：点击底部的"播放"按钮开始播放所有已加载音频的音源
5. **体验效果**：
   - 拖动音源时，声音会实时跟随位置变化
   - 音源在左侧时，声音主要从左侧传来
   - 音源在右侧时，声音主要从右侧传来
   - 距离中心越远，音量越小

## 音频空间坐标系统

- **画布中心 (400, 300)** 是听者位置
- **X 轴**：右为正（画布右侧）
- **Y 轴**：上为正（画布上方，但画布坐标系向下）
- **Z 轴**：前为正（距离中心越远，Z 值越小）

## 项目结构

```
Wander/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx          # 画布组件
│   │   ├── SourcePanel.jsx     # 音源管理面板
│   │   └── PlaybackControls.jsx # 播放控制
│   ├── utils/
│   │   └── AudioEngine.js      # Web Audio API 核心逻辑
│   ├── App.jsx                 # 主应用组件
│   ├── main.jsx                # 入口文件
│   └── index.css               # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 浏览器兼容性

- Chrome/Edge 最新版本 ✅
- Firefox 最新版本 ✅
- Safari 最新版本 ✅

**注意**：HRTF 功能需要现代浏览器支持。某些浏览器可能需要用户交互（如点击）后才能初始化 AudioContext。

## 示例场景

1. **鸟在左前方，狗在右后方**：
   - 在画布左上角创建音源，上传 `bird.wav`
   - 在画布右下角创建音源，上传 `dogbark.wav`
   - 播放后即可体验立体声效果

2. **移动音源**：
   - 创建音源并上传音频
   - 播放后拖动音源
   - 声音会实时跟随位置变化

## 技术细节

### HRTF 算法

HRTF（Head-Related Transfer Function）是一种用于模拟 3D 空间音频的技术。它通过模拟声音到达左右耳的时间差和强度差，创造出真实的立体声效果。

### PannerNode 配置

- `panningModel: 'HRTF'` - 使用 HRTF 算法
- `distanceModel: 'inverse'` - 使用反比距离衰减模型
- `refDistance: 1` - 参考距离
- `maxDistance: 50` - 最大有效距离
- `rolloffFactor: 1` - 衰减因子

## 许可证

MIT

