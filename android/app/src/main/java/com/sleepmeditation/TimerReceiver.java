package com.sleepmeditation;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import android.webkit.WebView;

/**
 * 定时器广播接收器
 * 接收定时结束事件，确保在后台也能准确触发
 */
public class TimerReceiver extends BroadcastReceiver {
    private static final String TAG = "TimerReceiver";
    private static WebView webView = null;

    /**
     * 设置 WebView 引用，用于回调 JavaScript
     */
    public static void setWebView(WebView webView) {
        TimerReceiver.webView = webView;
        Log.d(TAG, "WebView 引用已设置");
    }

    /**
     * 清除 WebView 引用
     */
    public static void clearWebView() {
        TimerReceiver.webView = null;
        Log.d(TAG, "WebView 引用已清除");
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "收到定时器触发事件");

        if (intent.getAction() != null && intent.getAction().equals("com.sleepmeditation.TIMER_TRIGGER")) {
            final boolean enableAlarm = intent.getBooleanExtra("enableAlarm", false);
            final boolean enableVibration = intent.getBooleanExtra("enableVibration", true);
            final int timerDuration = intent.getIntExtra("timerDuration", 0);

            Log.d(TAG, "定时时间到，启用闹钟: " + enableAlarm + ", 启用震动: " + enableVibration + ", 时长: " + timerDuration);

            // 通知 JavaScript 停止播放
            if (webView != null) {
                final String jsCode = "javascript:(function(){" +
                    "if(window.onTimerComplete){" +
                        "window.onTimerComplete(" + enableAlarm + "," + timerDuration + ");" +
                    "}else{" +
                        "console.warn('window.onTimerComplete 方法不存在');" +
                    "}" +
                "})()";

                Log.d(TAG, "调用 JavaScript: " + jsCode);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    webView.evaluateJavascript(jsCode, new android.webkit.ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            Log.d(TAG, "JavaScript 回调结果: " + value);
                        }
                    });
                } else {
                    webView.loadUrl(jsCode);
                }
            } else {
                Log.w(TAG, "WebView 为空，无法通知 JavaScript");
            }

            // 如果启用了闹钟，启动闹钟服务
            if (enableAlarm) {
                Log.d(TAG, "启动闹钟服务");
                Intent serviceIntent = new Intent(context, AlarmService.class);
                serviceIntent.putExtra("enableVibration", enableVibration);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            }
        }
    }
}
