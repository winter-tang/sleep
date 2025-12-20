package com.example.sleepmeditation;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import java.io.IOException;

/**
 * 闹钟音频播放器
 * 负责播放闹钟声音和震动
 */
public class AlarmAudioPlayer {
    private static final String TAG = "AlarmAudioPlayer";
    
    private Context context;
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private boolean isPlaying = false;
    
    public AlarmAudioPlayer(Context context) {
        this.context = context;
        this.vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        Log.d(TAG, "AlarmAudioPlayer已初始化");
    }
    
    /**
     * 播放闹钟
     * @param audioPath 音频文件路径
     * @param enableVibration 是否启用震动
     * @return 播放是否成功
     */
    public boolean playAlarm(String audioPath, boolean enableVibration) {
        try {
            // 停止当前播放
            stopAlarm();
            
            // 创建MediaPlayer
            mediaPlayer = new MediaPlayer();
            
            // 设置音频属性为闹钟类型
            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setLegacyStreamType(AudioManager.STREAM_ALARM)
                    .build();
            
            mediaPlayer.setAudioAttributes(attributes);
            
            // 设置音频源
            if (audioPath != null && !audioPath.isEmpty()) {
                try {
                    mediaPlayer.setDataSource(audioPath);
                    Log.d(TAG, "使用指定音频文件: " + audioPath);
                } catch (IOException e) {
                    Log.w(TAG, "无法加载指定音频文件，使用默认闹钟声音", e);
                    playDefaultAlarm();
                    return true;
                }
            } else {
                playDefaultAlarm();
                return true;
            }
            
            // 准备并开始播放
            mediaPlayer.prepare();
            mediaPlayer.start();
            
            // 设置循环播放
            mediaPlayer.setLooping(true);
            
            // 启用震动
            if (enableVibration && vibrator != null && vibrator.hasVibrator()) {
                startVibration();
            }
            
            isPlaying = true;
            Log.d(TAG, "闹钟开始播放");
            
            return true;
        } catch (Exception e) {
            Log.e(TAG, "播放闹钟时发生异常", e);
            return false;
        }
    }
    
    /**
     * 播放默认闹钟声音
     */
    private void playDefaultAlarm() {
        try {
            // 停止当前播放
            if (mediaPlayer != null) {
                mediaPlayer.release();
            }
            
            // 创建新的MediaPlayer
            mediaPlayer = MediaPlayer.create(context, android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI);
            
            if (mediaPlayer != null) {
                // 设置音频属性为闹钟类型
                AudioAttributes attributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setLegacyStreamType(AudioManager.STREAM_ALARM)
                        .build();
                
                mediaPlayer.setAudioAttributes(attributes);
                
                // 设置循环播放
                mediaPlayer.setLooping(true);
                
                // 开始播放
                mediaPlayer.start();
                
                Log.d(TAG, "使用默认闹钟声音");
            }
        } catch (Exception e) {
            Log.e(TAG, "播放默认闹钟声音时发生异常", e);
        }
    }
    
    /**
     * 开始震动
     */
    private void startVibration() {
        try {
            // 创建震动模式
            long[] pattern = {0, 500, 500, 500, 500}; // 震动500ms，停止500ms，重复
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                // Android 8.0及以上版本
                VibrationEffect effect = VibrationEffect.createWaveform(pattern, 0);
                vibrator.vibrate(effect);
            } else {
                // 旧版本Android
                vibrator.vibrate(pattern, 0);
            }
            
            Log.d(TAG, "震动已启用");
        } catch (Exception e) {
            Log.e(TAG, "启用震动时发生异常", e);
        }
    }
    
    /**
     * 停止闹钟
     */
    public void stopAlarm() {
        try {
            // 停止音频播放
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
            }
            
            // 停止震动
            if (vibrator != null) {
                vibrator.cancel();
            }
            
            isPlaying = false;
            Log.d(TAG, "闹钟已停止");
        } catch (Exception e) {
            Log.e(TAG, "停止闹钟时发生异常", e);
        }
    }
    
    /**
     * 检查是否正在播放
     * @return 是否正在播放
     */
    public boolean isPlaying() {
        try {
            return mediaPlayer != null && mediaPlayer.isPlaying();
        } catch (Exception e) {
            Log.e(TAG, "检查播放状态时发生异常", e);
            return false;
        }
    }
}