package com.example.sleepmeditation.utils;

import android.content.Context;
import android.media.MediaRecorder;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class AudioManager {
    private static final String TAG = "AudioManager";
    private static final String AUDIO_FOLDER_NAME = "SleepMeditation/Audio";
    private static final String CUSTOM_AUDIO_FOLDER_NAME = "SleepMeditation/Audio/Custom";
    private final Context context;
    private final FileLogger logger;
    private final SettingsManager settingsManager;
    private MediaRecorder mediaRecorder;
    private MediaPlayer mediaPlayer;
    private String currentRecordingPath;
    
    public AudioManager(Context context) {
        this.context = context;
        this.logger = new FileLogger(context);
        this.settingsManager = new SettingsManager(context);
        this.settingsManager.initializeDefaultSettings();
    }
    
    // 获取音频文件存储目录
    public File getAudioDirectory() {
        File directory;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10及以上，使用应用特定目录
            directory = new File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), AUDIO_FOLDER_NAME);
        } else {
            // Android 9及以下，使用公共目录
            directory = new File(Environment.getExternalStorageDirectory(), AUDIO_FOLDER_NAME);
        }
        
        // 确保目录存在
        if (!directory.exists()) {
            if (directory.mkdirs()) {
                logger.log("创建音频目录成功: " + directory.getAbsolutePath());
            } else {
                logger.logError(TAG, "创建音频目录失败: " + directory.getAbsolutePath(), null);
            }
        }
        
        return directory;
    }
    
    // 获取自定义音频文件存储目录
    public File getCustomAudioDirectory() {
        File directory;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10及以上，使用应用特定目录
            directory = new File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), CUSTOM_AUDIO_FOLDER_NAME);
        } else {
            // Android 9及以下，使用公共目录
            directory = new File(Environment.getExternalStorageDirectory(), CUSTOM_AUDIO_FOLDER_NAME);
        }
        
        // 确保目录存在
        if (!directory.exists()) {
            if (directory.mkdirs()) {
                logger.log("创建自定义音频目录成功: " + directory.getAbsolutePath());
            } else {
                logger.logError(TAG, "创建自定义音频目录失败: " + directory.getAbsolutePath(), null);
            }
        }
        
        return directory;
    }
    
    // 创建一个新的音频文件名
    private String createAudioFileName() {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        return "audio_" + timeStamp + ".3gp";
    }
    
    // 开始录音
    public boolean startRecording() {
        if (!PermissionUtils.hasStoragePermission(context)) {
            logger.logError(TAG, "录音失败：没有存储权限", null);
            return false;
        }
        
        try {
            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
            
            currentRecordingPath = getCustomAudioDirectory() + File.separator + createAudioFileName();
            mediaRecorder.setOutputFile(currentRecordingPath);
            
            mediaRecorder.prepare();
            mediaRecorder.start();
            logger.log("开始录音: " + currentRecordingPath);
            return true;
        } catch (IOException e) {
            logger.logError(TAG, "准备录音失败", e);
            releaseRecorder();
            return false;
        } catch (IllegalStateException e) {
            logger.logError(TAG, "录音状态错误", e);
            releaseRecorder();
            return false;
        }
    }
    
    // 停止录音
    public String stopRecording() {
        if (mediaRecorder != null) {
            try {
                mediaRecorder.stop();
                logger.log("停止录音: " + currentRecordingPath);
                String recordedFilePath = currentRecordingPath;
                releaseRecorder();
                return recordedFilePath;
            } catch (IllegalStateException e) {
                logger.logError(TAG, "停止录音失败", e);
                releaseRecorder();
                return null;
            }
        }
        return null;
    }
    
    // 释放录音器资源
    private void releaseRecorder() {
        if (mediaRecorder != null) {
            mediaRecorder.release();
            mediaRecorder = null;
            currentRecordingPath = null;
        }
    }
    
    // 播放音频文件
    public boolean playAudio(String audioFilePath) {
        try {
            stopAudio(); // 先停止当前播放
            
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(audioFilePath);
            
            // 应用用户设置
            applyUserSettings();
            
            mediaPlayer.prepare();
            mediaPlayer.start();
            logger.log("开始播放音频: " + audioFilePath);
            
            // 设置播放完成监听器
            mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    logger.log("音频播放完成: " + audioFilePath);
                    if (!settingsManager.isLoopPlaybackEnabled()) {
                        releasePlayer();
                    } else {
                        // 循环播放
                        try {
                            mediaPlayer.seekTo(0);
                            mediaPlayer.start();
                            logger.log("循环播放音频: " + audioFilePath);
                        } catch (Exception e) {
                            logger.logError(TAG, "循环播放失败", e);
                            releasePlayer();
                        }
                    }
                }
            });
            
            return true;
        } catch (IOException e) {
            logger.logError(TAG, "播放音频失败: " + audioFilePath, e);
            releasePlayer();
            return false;
        }
    }
    
    // 应用用户设置到MediaPlayer
    private void applyUserSettings() {
        if (mediaPlayer != null) {
            // 设置音量
            float volume = settingsManager.getAudioVolume();
            mediaPlayer.setVolume(volume, volume);
            
            // 设置循环播放
            // 注意：这里不使用MediaPlayer的setLooping方法，而是通过监听器实现更灵活的控制
            
            // 设置播放速度（需要Android API 23+）
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                float playbackSpeed = settingsManager.getPlaybackSpeed();
                mediaPlayer.setPlaybackParams(mediaPlayer.getPlaybackParams().setSpeed(playbackSpeed));
            }
            
            logger.log("应用音频设置 - 音量: " + volume + ", 循环: " + settingsManager.isLoopPlaybackEnabled() + ", 速度: " + settingsManager.getPlaybackSpeed());
        }
    }
    
    // 更新当前播放的设置
    public void updateCurrentPlaybackSettings() {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            float volume = settingsManager.getAudioVolume();
            mediaPlayer.setVolume(volume, volume);
            
            // 更新播放速度
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                float playbackSpeed = settingsManager.getPlaybackSpeed();
                mediaPlayer.setPlaybackParams(mediaPlayer.getPlaybackParams().setSpeed(playbackSpeed));
            }
            
            logger.log("更新当前播放设置 - 音量: " + volume + ", 速度: " + settingsManager.getPlaybackSpeed());
        }
    }
    
    // 直接使用默认设置播放音频
    public boolean playDefaultAudio() {
        String defaultAudioPath = settingsManager.getDefaultAudioPath();
        if (!defaultAudioPath.isEmpty() && new File(defaultAudioPath).exists()) {
            return playAudio(defaultAudioPath);
        } else if (settingsManager.isCustomAudioEnabled()) {
            // 如果开启了自定义音频但没有设置默认路径，尝试播放第一个自定义音频
            List<AudioFileInfo> customAudioFiles = getCustomAudioFiles();
            if (!customAudioFiles.isEmpty()) {
                return playAudio(customAudioFiles.get(0).getFilePath());
            }
        }
        logger.logError(TAG, "没有可用的默认音频", null);
        return false;
    }
    
    // 获取当前播放状态
    public boolean isPlaying() {
        return mediaPlayer != null && mediaPlayer.isPlaying();
    }
    
    // 设置播放位置
    public void seekTo(int positionMs) {
        if (mediaPlayer != null) {
            mediaPlayer.seekTo(positionMs);
            logger.log("设置播放位置: " + positionMs + "ms");
        }
    }
    
    // 获取当前播放位置
    public int getCurrentPosition() {
        if (mediaPlayer != null) {
            return mediaPlayer.getCurrentPosition();
        }
        return 0;
    }
    
    // 获取音频总时长
    public int getDuration() {
        if (mediaPlayer != null) {
            return mediaPlayer.getDuration();
        }
        return 0;
    }
    
    // 暂停音频播放
    public void pauseAudio() {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
            logger.log("暂停音频播放");
        }
    }
    
    // 恢复音频播放
    public void resumeAudio() {
        if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
            mediaPlayer.start();
            logger.log("恢复音频播放");
        }
    }
    
    // 停止音频播放
    public void stopAudio() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
            } catch (IllegalStateException e) {
                logger.logError(TAG, "停止音频播放时出现异常", e);
            } finally {
                releasePlayer();
            }
        }
    }
    
    // 释放播放器资源
    private void releasePlayer() {
        if (mediaPlayer != null) {
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }
    
    // 获取所有自定义音频文件列表
    public List<AudioFileInfo> getCustomAudioFiles() {
        List<AudioFileInfo> audioFiles = new ArrayList<>();
        File directory = getCustomAudioDirectory();
        
        if (directory.exists() && directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isFile() && (file.getName().endsWith(".3gp") || file.getName().endsWith(".mp3") || 
                            file.getName().endsWith(".wav") || file.getName().endsWith(".m4a"))) {
                        audioFiles.add(new AudioFileInfo(file.getName(), file.getAbsolutePath(), file.length(), file.lastModified()));
                    }
                }
            }
        }
        
        logger.log("获取自定义音频文件数量: " + audioFiles.size());
        return audioFiles;
    }
    
    // 音频文件信息类
    public static class AudioFileInfo {
        private final String fileName;
        private final String filePath;
        private final long fileSize;
        private final long lastModified;
        
        public AudioFileInfo(String fileName, String filePath, long fileSize, long lastModified) {
            this.fileName = fileName;
            this.filePath = filePath;
            this.fileSize = fileSize;
            this.lastModified = lastModified;
        }
        
        public String getFileName() {
            return fileName;
        }
        
        public String getFilePath() {
            return filePath;
        }
        
        public long getFileSize() {
            return fileSize;
        }
        
        public long getLastModified() {
            return lastModified;
        }
        
        // 获取文件大小的可读字符串
        public String getReadableFileSize() {
            if (fileSize < 1024) {
                return fileSize + " B";
            } else if (fileSize < 1024 * 1024) {
                return String.format("%.2f KB", fileSize / 1024.0);
            } else {
                return String.format("%.2f MB", fileSize / (1024.0 * 1024.0));
            }
        }
        
        // 获取最后修改时间的可读字符串
        public String getReadableLastModified() {
            return new SimpleDateFormat("yyyy-MM-dd HH:mm").format(new Date(lastModified));
        }
    }
}