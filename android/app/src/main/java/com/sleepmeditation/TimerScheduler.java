package com.sleepmeditation;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * 定时器调度器
 * 使用AlarmManager在指定时间触发定时结束事件
 * 解决应用后台/锁屏时JavaScript计时器失效的问题
 */
public class TimerScheduler {
    private static final String TAG = "TimerScheduler";
    private static final int TIMER_REQUEST_CODE = 2001;

    private Context context;
    private AlarmManager alarmManager;

    public TimerScheduler(Context context) {
        this.context = context;
        this.alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Log.d(TAG, "TimerScheduler已初始化");
    }

    /**
     * 设置定时器
     * @param delayInSeconds 延迟秒数
     * @param enableAlarm 是否启用闹钟
     * @param enableVibration 是否启用震动
     * @param timerDuration 定时时长（分钟）
     * @return 是否设置成功
     */
    public boolean scheduleTimer(int delayInSeconds, boolean enableAlarm, boolean enableVibration, int timerDuration) {
        try {
            // 取消之前的定时器
            cancelTimer();

            // 计算触发时间
            long triggerAtMillis = System.currentTimeMillis() + (delayInSeconds * 1000L);

            Log.d(TAG, "设置定时器，延迟: " + delayInSeconds + "秒, 启用闹钟: " + enableAlarm + ", 启用震动: " + enableVibration + ", 时长: " + timerDuration + "分钟");
            Log.d(TAG, "触发时间: " + new java.util.Date(triggerAtMillis));

            // 创建Intent
            Intent intent = new Intent(context, TimerReceiver.class);
            intent.putExtra("enableAlarm", enableAlarm);
            intent.putExtra("enableVibration", enableVibration);
            intent.putExtra("timerDuration", timerDuration);
            intent.setAction("com.sleepmeditation.TIMER_TRIGGER");

            // 创建PendingIntent
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                TIMER_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // 设置精确闹钟
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Android 6.0及以上，使用setExactAndAllowWhileIdle确保在低电量模式下也能触发
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                );
                Log.d(TAG, "使用 setExactAndAllowWhileIdle");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                // Android 4.4及以上
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                );
                Log.d(TAG, "使用 setExact");
            } else {
                // 旧版本Android
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                );
                Log.d(TAG, "使用 set");
            }

            Log.d(TAG, "定时器设置成功，将在 " + delayInSeconds + " 秒后触发");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "设置定时器失败", e);
            return false;
        }
    }

    /**
     * 取消定时器
     * @return 是否取消成功
     */
    public boolean cancelTimer() {
        try {
            Intent intent = new Intent(context, TimerReceiver.class);
            intent.setAction("com.sleepmeditation.TIMER_TRIGGER");

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                TIMER_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (alarmManager != null) {
                alarmManager.cancel(pendingIntent);
                Log.d(TAG, "定时器已取消");
            }

            return true;
        } catch (Exception e) {
            Log.e(TAG, "取消定时器失败", e);
            return false;
        }
    }

    /**
     * 检查定时器是否已设置
     * @return 是否已设置
     */
    public boolean isTimerSet() {
        Intent intent = new Intent(context, TimerReceiver.class);
        intent.setAction("com.sleepmeditation.TIMER_TRIGGER");

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            TIMER_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );

        return pendingIntent != null;
    }
}
