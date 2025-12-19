package com.example.sleepmeditation.utils;

import android.content.Context;
import android.content.res.AssetManager;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import com.example.sleepmeditation.BuildConfig;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public class ResourceManager {
    private static final String TAG = "ResourceManager";
    private static final String ASSETS_MUSIC_FOLDER = "music";
    private final Context context;
    private final FileLogger logger;
    
    public ResourceManager(Context context) {
        this.context = context;
        this.logger = new FileLogger(context);
    }
    
    // 检查是否包含音乐文件
    public boolean isMusicIncluded() {
        boolean included = BuildConfig.INCLUDE_MUSIC_FILES;
        logger.log("构建配置 - 包含音乐文件: " + included);
        return included;
    }
    
    // 获取所有内置音乐文件列表
    public List<String> getBuiltInMusicFiles() {
        List<String> musicFiles = new ArrayList<>();
        
        if (!isMusicIncluded()) {
            logger.log("构建版本不包含音乐文件");
            return musicFiles;
        }
        
        try {
            AssetManager assetManager = context.getAssets();
            String[] files = assetManager.list(ASSETS_MUSIC_FOLDER);
            
            if (files != null) {
                for (String file : files) {
                    if (isAudioFile(file)) {
                        musicFiles.add(file);
                    }
                }
            }
            
            logger.log("发现内置音乐文件数量: " + musicFiles.size());
        } catch (IOException e) {
            logger.logError(TAG, "获取内置音乐文件列表失败", e);
        }
        
        return musicFiles;
    }
    
    // 复制内置音乐文件到外部存储
    public boolean copyBuiltInMusicToStorage(String fileName) {
        if (!isMusicIncluded()) {
            logger.logError(TAG, "构建版本不包含音乐文件", null);
            return false;
        }
        
        try {
            AssetManager assetManager = context.getAssets();
            String sourcePath = ASSETS_MUSIC_FOLDER + File.separator + fileName;
            
            // 检查文件是否存在于assets中
            boolean fileExists = false;
            String[] files = assetManager.list(ASSETS_MUSIC_FOLDER);
            if (files != null) {
                for (String file : files) {
                    if (file.equals(fileName)) {
                        fileExists = true;
                        break;
                    }
                }
            }
            
            if (!fileExists) {
                logger.logError(TAG, "音乐文件不存在: " + fileName, null);
                return false;
            }
            
            // 准备目标文件路径
            AudioManager audioMgr = new AudioManager(context);
            File audioDir = audioMgr.getAudioDirectory();
            File targetFile = new File(audioDir, fileName);
            
            // 如果文件已存在，删除它
            if (targetFile.exists()) {
                targetFile.delete();
                logger.log("删除已存在的文件: " + targetFile.getAbsolutePath());
            }
            
            // 确保目录存在
            if (!audioDir.exists() && !audioDir.mkdirs()) {
                logger.logError(TAG, "无法创建目标目录", null);
                return false;
            }
            
            // 复制文件
            try (InputStream in = assetManager.open(sourcePath);
                 OutputStream out = new FileOutputStream(targetFile)) {
                byte[] buffer = new byte[1024];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
            }
            
            logger.log("成功复制音乐文件到: " + targetFile.getAbsolutePath());
            return true;
        } catch (IOException e) {
            logger.logError(TAG, "复制音乐文件失败: " + fileName, e);
            return false;
        }
    }
    
    // 检查文件是否为音频文件
    private boolean isAudioFile(String fileName) {
        String lowerFileName = fileName.toLowerCase();
        return lowerFileName.endsWith(".mp3") || 
               lowerFileName.endsWith(".wav") || 
               lowerFileName.endsWith(".m4a") || 
               lowerFileName.endsWith(".3gp") || 
               lowerFileName.endsWith(".aac");
    }
    
    // 检查应用是否包含内置音乐资产目录
    public boolean hasBuiltInMusicAssets() {
        try {
            AssetManager assetManager = context.getAssets();
            String[] files = assetManager.list(ASSETS_MUSIC_FOLDER);
            return files != null && files.length > 0;
        } catch (IOException e) {
            // 如果目录不存在，list()方法会抛出IOException
            logger.log("应用不包含内置音乐资产目录");
            return false;
        }
    }
    
    // 初始化资源（根据构建配置）
    public void initializeResources() {
        logger.log("开始初始化资源 - 包含音乐: " + isMusicIncluded());
        
        if (isMusicIncluded()) {
            // 这里可以执行一些包含音乐时的初始化操作
            // 例如预先复制某些音乐文件到外部存储
            logger.log("初始化包含音乐版本的资源");
        } else {
            // 不包含音乐时的初始化操作
            logger.log("初始化不包含音乐版本的资源");
        }
    }
    
    // 获取资源使用信息
    public String getResourceInfo() {
        StringBuilder info = new StringBuilder();
        info.append("资源信息:\n");
        info.append("- 包含音乐文件: ").append(isMusicIncluded()).append("\n");
        
        if (isMusicIncluded()) {
            List<String> musicFiles = getBuiltInMusicFiles();
            info.append("- 内置音乐文件数量: ").append(musicFiles.size()).append("\n");
            if (!musicFiles.isEmpty()) {
                info.append("- 内置音乐文件列表: ").append(String.join(", ", musicFiles)).append("\n");
            }
        }
        
        return info.toString();
    }
}