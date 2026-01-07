# 睡眠冥想助手

一个基于React和Capacitor构建的睡眠冥想应用，提供冥想音乐、白噪音和定时功能。

## 环境要求

- Node.js 16+ 或更高版本
- npm 或 yarn 包管理器
- Android Studio (用于Android构建)
- Android SDK (API级别30+)

## 安装步骤

1. **克隆项目**
   ```bash
   git clone <项目仓库地址>
   cd SleepMelody
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式运行**
   ```bash
   npm run dev
   ```

## Android打包配置

### 1. 项目配置

#### Capacitor配置 (`capacitor.config.json`)
```json
{
  "appId": "com.example.sleepmeditation",
  "appName": "睡眠冥想助手",
  "webDir": "dist",
  "android": {
    "androidSdkRoot": "/Users/wintert/software/android_sdk/"
  }
}
```

### 2. 构建步骤

1. **构建Web应用**
   ```bash
   npm run build
   ```

2. **复制Web资源到Android项目**
   ```bash
   npx cap copy android
   ```

3. **更新Android项目**
   ```bash
   npx cap update android
   ```

4. **打开Android Studio**
   ```bash
   npx cap open android
   ```

5. **在Android Studio中构建**
   - 选择 `Build` > `Generate Signed Bundle / APK...`
   - 按照向导创建签名密钥和构建APK

### 3. 一键构建命令

```bash
# 构建Web应用并复制到Android项目
npm run build && npx cap copy android

# 构建Android APK
cd android && ./gradlew assembleDebug
```

构建后的APK文件位置：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 项目结构

```
├── android/              # Android原生项目目录
├── dist/                 # 构建输出目录
├── public/               # 静态资源目录
│   └── sounds/           # 音频文件
├── src/                  # 源代码目录
│   ├── components/       # React组件
│   │   ├── AudioPlayer.jsx      # 音频播放器组件
│   │   ├── PlayControls.jsx     # 播放控制组件
│   │   ├── Timer.jsx            # 定时器组件
│   │   └── VolumeControl.jsx    # 音量控制组件
│   └── utils/            # 工具函数
├── capacitor.config.json # Capacitor配置
├── package.json          # 项目依赖配置
└── vite.config.js        # Vite构建配置
```

## 主要依赖包

| 包名 | 版本 | 用途 |
|------|------|------|
| @capacitor/android | ^7.4.4 | Android平台支持 |
| @capacitor/core | ^7.4.4 | Capacitor核心库 |
| @capacitor/filesystem | ^7.1.5 | 文件系统访问 |
| react | ^19.2.0 | React框架 |
| react-dom | ^19.2.0 | React DOM渲染 |
| vite | ^7.2.4 | 构建工具 |
| @vitejs/plugin-react | ^5.1.1 | Vite React插件 |

## 使用说明

1. **启动应用**：点击播放按钮开始播放冥想音乐
2. **调整音量**：使用音量滑块控制音乐音量
3. **设置定时器**：在定时器面板设置冥想时长
4. **选择音乐**：在音乐选择面板切换不同的冥想音乐
5. **锁屏播放**：锁屏后音乐继续播放，计时器也会正常倒计时（使用基于时间戳的计时方式，即使屏幕锁定也能准确计时）

## 注意事项

- Android平台上需要用户交互后才能播放音频
- 音频文件位于 `public/sounds/` 目录下
- 构建前确保已正确配置Android SDK路径

## 许可证

ISC
