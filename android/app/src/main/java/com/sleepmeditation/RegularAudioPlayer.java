package com.sleepmeditation;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.util.Log;

import java.io.IOException;

/**
 * 普通音频播放器
 * 负责播放应用内的音频文件（如1.mp3, 2.mp3等）
 */
public class RegularAudioPlayer {
    private static final String TAG = "RegularAudioPlayer";
    
    private Context context;
    private MediaPlayer mediaPlayer;
    private AudioManager audioManager;
    private boolean isPlaying = false;
    private OnAudioCompletionListener completionListener;
    
    /**
     * 音频播放完成回调接口
     */
    public interface OnAudioCompletionListener {
        void onAudioCompletion(String audioFileName);
    }
    
    /**
     * 设置音频播放完成回调
     */
    public void setOnAudioCompletionListener(OnAudioCompletionListener listener) {
        this.completionListener = listener;
    }

    public RegularAudioPlayer(Context context) {
        this.context = context;
        this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        Log.d(TAG, "RegularAudioPlayer已初始化");
    }
    
    /**
     * 播放音频文件
     * @param audioFileName 音频文件名（如"1.mp3", "2.mp3"）
     * @param volume 音量（0.0到1.0）
     * @param loop 是否循环播放
     * @return 播放是否成功
     */
    public boolean playAudio(final String audioFileName, float volume, boolean loop) {
        try {
            Log.d(TAG, "开始播放音频: " + audioFileName + ", 音量: " + volume + ", 循环: " + loop);

            // 停止当前播放
            stopAudio();

            // 请求音频焦点 - 这对红米/小米设备很重要
            int result = requestAudioFocus();
            if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                Log.w(TAG, "音频焦点请求失败，但继续尝试播放");
            } else {
                Log.d(TAG, "音频焦点请求成功");
            }

            // 创建MediaPlayer
            mediaPlayer = new MediaPlayer();

            // 设置音频属性为媒体类型
            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setLegacyStreamType(AudioManager.STREAM_MUSIC)
                    .build();

            mediaPlayer.setAudioAttributes(attributes);

            // 尝试多个可能的路径
            String[] possiblePaths = {
                "public/sounds/" + audioFileName,
                "sounds/" + audioFileName,
                audioFileName
            };

            boolean loaded = false;
            boolean usedCreate = false;  // 标记是否使用了MediaPlayer.create()

            for (String assetPath : possiblePaths) {
                try {
                    Log.d(TAG, "尝试从assets加载: " + assetPath);
                    android.content.res.AssetFileDescriptor afd = context.getAssets().openFd(assetPath);
                    mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                    afd.close();
                    Log.d(TAG, "成功从assets加载音频文件: " + assetPath);
                    loaded = true;
                    break;
                } catch (IOException e) {
                    Log.d(TAG, "路径不存在: " + assetPath);
                }
            }

            if (!loaded) {
                Log.w(TAG, "无法从assets加载音频文件，尝试从res/raw加载");

                // 尝试从res/raw加载
                int resId = getRawResourceId(audioFileName);
                if (resId != 0) {
                    // 释放之前的mediaPlayer
                    if (mediaPlayer != null) {
                        mediaPlayer.release();
                    }

                    mediaPlayer = MediaPlayer.create(context, resId);
                    if (mediaPlayer != null) {
                        mediaPlayer.setAudioAttributes(attributes);
                        Log.d(TAG, "从res/raw加载音频文件: " + audioFileName);
                        loaded = true;
                        usedCreate = true;  // 标记使用了create方法
                    } else {
                        Log.e(TAG, "无法创建MediaPlayer");
                        abandonAudioFocus();
                        return false;
                    }
                } else {
                    Log.e(TAG, "无法找到音频文件资源: " + audioFileName);
                    abandonAudioFocus();
                    return false;
                }
            }

            // 设置音量
            mediaPlayer.setVolume(volume, volume);
            Log.d(TAG, "设置音量: " + volume);

            // 设置循环播放
            mediaPlayer.setLooping(loop);
            Log.d(TAG, "设置循环播放: " + loop);

            // 设置完成监听器
            mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    Log.d(TAG, "音频播放完成: " + audioFileName);
                    if (!loop) {
                        abandonAudioFocus();
                    }
                    
                    // 调用回调方法
                    if (completionListener != null) {
                        completionListener.onAudioCompletion(audioFileName);
                    }
                }
            });

            // 设置错误监听器
            mediaPlayer.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                @Override
                public boolean onError(MediaPlayer mp, int what, int extra) {
                    Log.e(TAG, "MediaPlayer错误: what=" + what + ", extra=" + extra);
                    abandonAudioFocus();
                    return false;
                }
            });

            // 准备并开始播放
            try {
                if (!loaded || mediaPlayer == null) {
                    Log.e(TAG, "MediaPlayer未正确加载");
                    abandonAudioFocus();
                    return false;
                }

                // 如果使用MediaPlayer.create()创建的，已经prepared了
                // 否则需要手动prepare
                if (!usedCreate) {
                    mediaPlayer.prepare();
                    Log.d(TAG, "MediaPlayer准备完成");
                }

                mediaPlayer.start();
                Log.d(TAG, "MediaPlayer开始播放");

                isPlaying = true;
                Log.d(TAG, "音频开始播放成功: " + audioFileName + ", 当前播放状态: " + mediaPlayer.isPlaying());

                return true;
            } catch (Exception e) {
                Log.e(TAG, "准备或开始播放时发生异常", e);
                abandonAudioFocus();
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "播放音频时发生异常: " + audioFileName, e);
            abandonAudioFocus();
            return false;
        }
    }

    /**
     * 请求音频焦点
     */
    private int requestAudioFocus() {
        if (audioManager == null) {
            Log.w(TAG, "AudioManager为空，无法请求音频焦点");
            return AudioManager.AUDIOFOCUS_REQUEST_FAILED;
        }

        return audioManager.requestAudioFocus(
            null,
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN
        );
    }

    /**
     * 放弃音频焦点
     */
    private void abandonAudioFocus() {
        if (audioManager != null) {
            audioManager.abandonAudioFocus(null);
            Log.d(TAG, "已放弃音频焦点");
        }
    }
    
    /**
     * 停止音频播放
     */
    public void stopAudio() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
            }

            // 放弃音频焦点
            abandonAudioFocus();

            isPlaying = false;
            Log.d(TAG, "音频已停止");
        } catch (Exception e) {
            Log.e(TAG, "停止音频时发生异常", e);
        }
    }
    
    /**
     * 暂停音频播放
     */
    public void pauseAudio() {
        try {
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
                Log.d(TAG, "音频已暂停");
            }
        } catch (Exception e) {
            Log.e(TAG, "暂停音频时发生异常", e);
        }
    }
    
    /**
     * 恢复音频播放
     */
    public void resumeAudio() {
        try {
            if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
                mediaPlayer.start();
                Log.d(TAG, "音频已恢复");
            }
        } catch (Exception e) {
            Log.e(TAG, "恢复音频时发生异常", e);
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
    
    /**
     * 获取原始资源ID
     * @param fileName 文件名
     * @return 资源ID，如果找不到返回0
     */
    private int getRawResourceId(String fileName) {
        try {
            // 移除文件扩展名
            String resourceName = fileName.contains(".") ? 
                fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            
            // 获取资源ID
            return context.getResources().getIdentifier(
                resourceName, "raw", context.getPackageName());
        } catch (Exception e) {
            Log.e(TAG, "获取资源ID时发生异常: " + fileName, e);
            return 0;
        }
    }
}