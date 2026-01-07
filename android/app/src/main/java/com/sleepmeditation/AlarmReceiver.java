package com.sleepmeditation;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * 闹钟广播接收器
 * 接收AlarmManager触发的闹钟事件
 */
public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "收到闹钟触发事件");

        if (intent.getAction() != null && intent.getAction().equals("com.sleepmeditation.ALARM_TRIGGER")) {
            boolean enableVibration = intent.getBooleanExtra("enableVibration", true);

            Log.d(TAG, "闹钟时间到，启动闹钟播放服务");

            // 启动闹钟播放服务
            Intent serviceIntent = new Intent(context, AlarmService.class);
            serviceIntent.putExtra("enableVibration", enableVibration);

            // 使用前台服务确保在后台也能播放
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
