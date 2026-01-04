package com.sleepmeditation.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

public class SettingsManager {
    private static final String PREFERENCES_NAME = "SleepMeditationSettings";
    private static final String KEY_AUDIO_VOLUME = "audio_volume";
    private static final String KEY_VIBRATION_ENABLED = "vibration_enabled";
    private static final String KEY_DEFAULT_AUDIO_PATH = "default_audio_path";
    private static final String KEY_LOOP_PLAYBACK = "loop_playback";
    private static final String KEY_PLAYBACK_SPEED = "playback_speed";
    private static final String KEY_CUSTOM_AUDIO_ENABLED = "custom_audio_enabled";
    
    private final SharedPreferences preferences;
    private final Context context;
    private final FileLogger logger;
    
    public SettingsManager(Context context) {
        this.context = context;
        this.preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        this.logger = new FileLogger(context);
    }
    
    // 保存音频音量设置
    public void saveAudioVolume(float volume) {
        // 确保音量在0.0-1.0范围内
        float clampedVolume = Math.max(0.0f, Math.min(1.0f, volume));
        preferences.edit().putFloat(KEY_AUDIO_VOLUME, clampedVolume).apply();
        logger.log("保存音量设置: " + clampedVolume);
    }
    
    // 获取音频音量设置
    public float getAudioVolume() {
        return preferences.getFloat(KEY_AUDIO_VOLUME, 0.7f); // 默认70%音量
    }
    
    // 保存振动设置
    public void setVibrationEnabled(boolean enabled) {
        preferences.edit().putBoolean(KEY_VIBRATION_ENABLED, enabled).apply();
        logger.log("保存振动设置: " + enabled);
    }
    
    // 获取振动设置
    public boolean isVibrationEnabled() {
        return preferences.getBoolean(KEY_VIBRATION_ENABLED, true);
    }
    
    // 执行振动
    public void vibrate(int durationMs) {
        if (isVibrationEnabled()) {
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(durationMs);
                }
                logger.log("执行振动: " + durationMs + "ms");
            }
        }
    }
    
    // 保存默认音频路径
    public void saveDefaultAudioPath(String audioPath) {
        preferences.edit().putString(KEY_DEFAULT_AUDIO_PATH, audioPath).apply();
        logger.log("保存默认音频路径: " + audioPath);
    }
    
    // 获取默认音频路径
    public String getDefaultAudioPath() {
        return preferences.getString(KEY_DEFAULT_AUDIO_PATH, "");
    }
    
    // 保存循环播放设置
    public void setLoopPlayback(boolean loop) {
        preferences.edit().putBoolean(KEY_LOOP_PLAYBACK, loop).apply();
        logger.log("保存循环播放设置: " + loop);
    }
    
    // 获取循环播放设置
    public boolean isLoopPlaybackEnabled() {
        return preferences.getBoolean(KEY_LOOP_PLAYBACK, false);
    }
    
    // 保存播放速度设置
    public void savePlaybackSpeed(float speed) {
        // 确保速度在0.5-2.0范围内
        float clampedSpeed = Math.max(0.5f, Math.min(2.0f, speed));
        preferences.edit().putFloat(KEY_PLAYBACK_SPEED, clampedSpeed).apply();
        logger.log("保存播放速度设置: " + clampedSpeed);
    }
    
    // 获取播放速度设置
    public float getPlaybackSpeed() {
        return preferences.getFloat(KEY_PLAYBACK_SPEED, 1.0f); // 默认正常速度
    }
    
    // 保存是否使用自定义音频设置
    public void setCustomAudioEnabled(boolean enabled) {
        preferences.edit().putBoolean(KEY_CUSTOM_AUDIO_ENABLED, enabled).apply();
        logger.log("保存自定义音频设置: " + enabled);
    }
    
    // 获取是否使用自定义音频设置
    public boolean isCustomAudioEnabled() {
        return preferences.getBoolean(KEY_CUSTOM_AUDIO_ENABLED, false);
    }
    
    // 重置所有设置
    public void resetAllSettings() {
        preferences.edit().clear().apply();
        logger.log("重置所有设置到默认值");
    }
    
    // 检查是否存在设置
    public boolean hasSettings() {
        return preferences.getAll().size() > 0;
    }
    
    // 初始化默认设置（如果不存在）
    public void initializeDefaultSettings() {
        if (!hasSettings()) {
            saveAudioVolume(0.7f);
            setVibrationEnabled(true);
            setLoopPlayback(false);
            savePlaybackSpeed(1.0f);
            setCustomAudioEnabled(false);
            logger.log("初始化默认设置");
        }
    }
}