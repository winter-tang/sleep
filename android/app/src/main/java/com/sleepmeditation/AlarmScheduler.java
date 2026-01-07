package com.sleepmeditation;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * 闹钟调度器
 * 使用AlarmManager在指定时间触发闹钟
 */
public class AlarmScheduler {
    private static final String TAG = "AlarmScheduler";
    private static final int ALARM_REQUEST_CODE = 1001;

    private Context context;
    private AlarmManager alarmManager;

    public AlarmScheduler(Context context) {
        this.context = context;
        this.alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Log.d(TAG, "AlarmScheduler已初始化");
    }

    /**
     * 设置闹钟
     * @param delayInSeconds 延迟秒数
     * @param enableVibration 是否启用震动
     * @return 是否设置成功
     */
    public boolean scheduleAlarm(int delayInSeconds, boolean enableVibration) {
        try {
            // 取消之前的闹钟
            cancelAlarm();

            // 计算触发时间
            long triggerAtMillis = System.currentTimeMillis() + (delayInSeconds * 1000L);

            Log.d(TAG, "设置闹钟，延迟: " + delayInSeconds + "秒, 触发时间: " + triggerAtMillis);

            // 创建Intent
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("enableVibration", enableVibration);
            intent.setAction("com.sleepmeditation.ALARM_TRIGGER");

            // 创建PendingIntent
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                ALARM_REQUEST_CODE,
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
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                // Android 4.4及以上
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                );
            } else {
                // 旧版本Android
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                );
            }

            Log.d(TAG, "闹钟设置成功，将在 " + delayInSeconds + " 秒后触发");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "设置闹钟失败", e);
            return false;
        }
    }

    /**
     * 取消闹钟
     * @return 是否取消成功
     */
    public boolean cancelAlarm() {
        try {
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction("com.sleepmeditation.ALARM_TRIGGER");

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                ALARM_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (alarmManager != null) {
                alarmManager.cancel(pendingIntent);
                Log.d(TAG, "闹钟已取消");
            }

            return true;
        } catch (Exception e) {
            Log.e(TAG, "取消闹钟失败", e);
            return false;
        }
    }

    /**
     * 检查闹钟是否已设置
     * @return 是否已设置
     */
    public boolean isAlarmSet() {
        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.setAction("com.sleepmeditation.ALARM_TRIGGER");

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            ALARM_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );

        return pendingIntent != null;
    }
}
