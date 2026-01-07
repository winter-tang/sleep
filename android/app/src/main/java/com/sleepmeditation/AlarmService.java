package com.sleepmeditation;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * 闹钟服务
 * 前台服务，用于播放闹钟并显示通知
 */
public class AlarmService extends Service {
    private static final String TAG = "AlarmService";
    private static final String CHANNEL_ID = "AlarmChannel";
    private static final int NOTIFICATION_ID = 1;

    private AlarmAudioPlayer alarmAudioPlayer;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AlarmService创建");

        // 创建通知渠道（Android 8.0及以上）
        createNotificationChannel();

        // 初始化闹钟播放器
        alarmAudioPlayer = new AlarmAudioPlayer(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "AlarmService启动");

        // 获取震动设置
        boolean enableVibration = true;
        if (intent != null) {
            enableVibration = intent.getBooleanExtra("enableVibration", true);
        }

        // 创建通知
        Notification notification = createNotification();

        // 启动前台服务
        startForeground(NOTIFICATION_ID, notification);

        // 播放闹钟
        playAlarm(enableVibration);

        return START_NOT_STICKY;
    }

    /**
     * 创建通知渠道
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "闹钟提醒",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("睡眠冥想助手闹钟提醒");
            channel.enableVibration(true);
            channel.setSound(null, null); // 禁用通知声音，使用我们自己的闹钟声音

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * 创建通知
     */
    private Notification createNotification() {
        // 创建点击通知时的Intent
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 创建停止闹钟的Intent
        Intent stopIntent = new Intent(this, AlarmService.class);
        stopIntent.setAction("STOP_ALARM");

        PendingIntent stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 构建通知
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("睡眠冥想结束")
            .setContentText("点击查看应用或关闭闹钟")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm) // 使用系统闹钟图标
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_delete, "关闭闹钟", stopPendingIntent);

        return builder.build();
    }

    /**
     * 播放闹钟
     */
    private void playAlarm(boolean enableVibration) {
        try {
            Log.d(TAG, "开始播放闹钟");

            // 使用3.mp3作为闹钟音频
            boolean success = alarmAudioPlayer.playAlarm("sounds/3.mp3", enableVibration);

            if (!success) {
                Log.w(TAG, "播放自定义闹钟失败，尝试播放默认闹钟");
            }

            Log.d(TAG, "闹钟播放" + (success ? "成功" : "失败"));
        } catch (Exception e) {
            Log.e(TAG, "播放闹钟时发生异常", e);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "AlarmService销毁");

        // 停止闹钟
        if (alarmAudioPlayer != null) {
            alarmAudioPlayer.stopAlarm();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
