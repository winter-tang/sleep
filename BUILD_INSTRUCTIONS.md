# 项目打包说明

## Android APK 打包步骤

### 1. 前端构建
```bash
cd /Users/wintert/Documents/trae_projects
npm run build
```

### 2. 复制前端资源到Android项目
```bash
cp -r dist/* android/app/src/main/assets/public/
```

### 3. 构建APK
```bash
cd /Users/wintert/Documents/trae_projects/android
gradle assembleDebug
```

### 4. APK文件位置
构建完成后，APK文件位于：
```
/Users/wintert/Documents/trae_projects/android/app/build/outputs/apk/debug/app-debug.apk
```

## 项目配置说明

### Gradle版本配置
- Gradle版本：8.4
- Android Gradle Plugin版本：8.3.2
- 配置文件：`android/gradle/wrapper/gradle-wrapper.properties`

### 红米K80兼容性配置
- compileSdk：35（Android 15）
- targetSdk：35（Android 15）
- minSdk：26（Android 8.0+）
- Java版本：17

### 音频文件配置
- 音频文件位置：`android/app/src/main/assets/public/sounds/`
- 支持格式：MP3
- 闹钟音频：3.mp3

## 注意事项

1. **音频文件更新**：如果修改了音频文件，需要确保将新文件复制到Android项目的assets目录中
2. **版本更新**：如果更新了前端版本号，需要同步更新Android项目中的版本号
3. **Gradle问题**：如果遇到Gradle版本兼容性问题，可以调整Android Gradle Plugin版本
4. **JavaScript接口**：Android使用`window.AlarmAudioBridge`接口，不是Capacitor插件系统

## 常见问题解决

### 问题1：Gradle版本不兼容
如果出现"Minimum supported Gradle version"错误，需要：
1. 更新`gradle-wrapper.properties`中的distributionUrl
2. 或降低Android Gradle Plugin版本

### 问题2：音频无法播放
1. 检查音频文件是否存在于正确位置
2. 确认JavaScript接口调用是否正确（使用window.AlarmAudioBridge）
3. 检查Android权限是否正确配置

### 问题3：白屏或加载问题
1. 检查WebView配置是否正确
2. 确认前端资源是否完整复制到assets目录
3. 检查index.html中的脚本路径是否正确

## 版本历史

- V1.1.0：修复音频播放问题，更新红米K80兼容性配置