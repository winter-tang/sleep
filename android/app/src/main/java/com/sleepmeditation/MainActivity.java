package com.sleepmeditation;

import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * 主活动类
 * 负责加载Web应用并提供原生功能接口
 */
public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final int NOTIFICATION_PERMISSION_REQUEST_CODE = 1002;
    
    // 通知渠道ID和名称
    private static final String CHANNEL_ID = "sleep_meditation_notifications";
    private static final String CHANNEL_NAME = "睡眠冥想助手通知";
    private static final String CHANNEL_DESCRIPTION = "睡眠冥想助手的通知";
    
    private WebView webView;
    private AlarmAudioPlayer alarmAudioPlayer;
    private RegularAudioPlayer regularAudioPlayer;
    private boolean permissionsGranted = false;
    private NotificationManager notificationManager;
    private AlarmScheduler alarmScheduler;
    
    // 需要请求的权限
    private static final String[] REQUIRED_PERMISSIONS = {
            android.Manifest.permission.VIBRATE,
            android.Manifest.permission.WAKE_LOCK,
            android.Manifest.permission.MODIFY_AUDIO_SETTINGS,
            android.Manifest.permission.ACCESS_NETWORK_STATE,
            android.Manifest.permission.INTERNET
    };
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // 初始化日志
        Log.d(TAG, "应用启动 - MainActivity onCreate");
        
        // 初始化闹钟播放器
        alarmAudioPlayer = new AlarmAudioPlayer(this);
        Log.d(TAG, "闹钟播放器已初始化");

        // 初始化普通音频播放器
        regularAudioPlayer = new RegularAudioPlayer(this);
        // 设置音频播放完成监听器
        regularAudioPlayer.setOnAudioCompletionListener(new RegularAudioPlayer.OnAudioCompletionListener() {
            @Override
            public void onAudioCompletion(String audioFileName) {
                Log.d(TAG, "音频播放完成，通知JavaScript: " + audioFileName);
                // 通过WebView调用JavaScript函数，通知音频播放完成
                final String jsCode = "javascript:window.regularAudioPlayerCallback('" + audioFileName + "')";
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (webView != null) {
                            webView.evaluateJavascript(jsCode, null);
                        }
                    }
                });
            }
        });
        Log.d(TAG, "普通音频播放器已初始化");
        
        // 初始化通知管理器
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // 创建通知渠道
        createNotificationChannel();
        // 请求通知权限
        requestNotificationPermission();

        // 初始化闹钟调度器
        alarmScheduler = new AlarmScheduler(this);
        Log.d(TAG, "闹钟调度器已初始化");
        
        // 获取WebView并配置
        webView = findViewById(R.id.webview);
        if (webView != null) {
            setupWebView();
        }
        
        // 请求权限
        requestPermissions();
    }
    
    /**
     * 配置WebView
     */
    private void setupWebView() {
        // 启用JavaScript
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        
        // 启用调试（仅在调试版本中）
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        
        // 添加JavaScript接口
        webView.addJavascriptInterface(new AlarmAudioInterface(), "AlarmAudioBridge");
        webView.addJavascriptInterface(new RegularAudioInterface(), "RegularAudioBridge");
        webView.addJavascriptInterface(new NotificationInterface(), "NotificationBridge");
        webView.addJavascriptInterface(new AlarmSchedulerInterface(), "AlarmSchedulerBridge");
        Log.d(TAG, "JavaScript接口已添加到WebView");
        
        // 设置WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // 在WebView中加载所有链接
                return false;
            }
            
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                // 处理资源加载
                if (url.startsWith("file:///android_asset/")) {
                    String path = url.substring("file:///android_asset/".length());
                    
                    try {
                        InputStream inputStream = getAssets().open(path);
                        String mimeType = getMimeType(path);
                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        
                        return new WebResourceResponse(mimeType, "UTF-8", inputStream);
                    } catch (IOException e) {
                        Log.e(TAG, "无法加载资源: " + path, e);
                    }
                }
                
                // 处理相对路径的资源请求
                else if (url.startsWith("file:///")) {
                    String path = url.substring("file:///".length());
                    
                    // 如果是相对路径的音频文件，尝试多种可能的路径
                    if (path.startsWith("sounds/") || path.startsWith("./sounds/")) {
                        // 标准化路径
                        if (path.startsWith("./sounds/")) {
                            path = path.substring(2); // 移除 "./"
                        }
                        
                        // 尝试直接加载
                        try {
                            Log.d(TAG, "尝试加载音频资源: " + path);
                            InputStream inputStream = getAssets().open(path);
                            String mimeType = getMimeType(path);
                            Map<String, String> headers = new HashMap<>();
                            headers.put("Access-Control-Allow-Origin", "*");
                            
                            Log.d(TAG, "成功加载音频资源: " + path + ", MIME类型: " + mimeType);
                            return new WebResourceResponse(mimeType, "UTF-8", inputStream);
                        } catch (IOException e) {
                            Log.e(TAG, "无法加载音频资源: " + path, e);
                            
                            // 尝试其他可能的路径
                            String[] alternativePaths = {
                                "public/" + path,
                                "public/sounds/" + path.substring("sounds/".length()),
                                "sounds/" + path.substring("sounds/".length())
                            };
                            
                            for (String altPath : alternativePaths) {
                                try {
                                    Log.d(TAG, "尝试备用路径: " + altPath);
                                    InputStream inputStream = getAssets().open(altPath);
                                    String mimeType = getMimeType(altPath);
                                    Map<String, String> headers = new HashMap<>();
                                    headers.put("Access-Control-Allow-Origin", "*");
                                    
                                    Log.d(TAG, "成功通过备用路径加载音频资源: " + altPath);
                                    return new WebResourceResponse(mimeType, "UTF-8", inputStream);
                                } catch (IOException e2) {
                                    Log.e(TAG, "备用路径也失败: " + altPath, e2);
                                }
                            }
                        }
                    }
                    
                    // 如果是/assets/开头的路径，转换为public/assets/
                    else if (path.startsWith("assets/")) {
                        path = "public/" + path;
                        
                        try {
                            InputStream inputStream = getAssets().open(path);
                            String mimeType = getMimeType(path);
                            Map<String, String> headers = new HashMap<>();
                            headers.put("Access-Control-Allow-Origin", "*");
                            
                            return new WebResourceResponse(mimeType, "UTF-8", inputStream);
                        } catch (IOException e) {
                            Log.e(TAG, "无法加载资源: " + path, e);
                        }
                    }
                }
                
                return null; // 让WebView处理默认加载
            }
            
            @Nullable
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return shouldInterceptRequest(view, request.getUrl().toString());
            }
        });
        
        // 设置WebChromeClient
        webView.setWebChromeClient(new WebChromeClient());
        
        // 从assets加载index.html
        webView.loadUrl("file:///android_asset/public/index.html");
        Log.d(TAG, "已加载public/index.html");
    }
    
    /**
     * 创建通知渠道
     */
    private void createNotificationChannel() {
        // Android 8.0及以上版本需要创建通知渠道
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance);
            channel.setDescription(CHANNEL_DESCRIPTION);
            channel.enableVibration(true);
            channel.enableLights(true);

            // 配置通知渠道
            notificationManager.createNotificationChannel(channel);
            Log.d(TAG, "通知渠道已创建: " + CHANNEL_ID + ", 重要性: " + importance);
        } else {
            Log.d(TAG, "Android版本低于8.0，无需创建通知渠道");
        }
    }
    
    /**
     * 请求通知权限
     */
    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) 
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{android.Manifest.permission.POST_NOTIFICATIONS},
                        NOTIFICATION_PERMISSION_REQUEST_CODE
                );
                Log.d(TAG, "请求通知权限");
            } else {
                Log.d(TAG, "通知权限已授予");
            }
        }
    }
    
    /**
     * 发送通知
     */
    private void sendNotificationInternal(String title, String body) {
        try {
            // 检查 notificationManager 是否已初始化
            if (notificationManager == null) {
                Log.e(TAG, "notificationManager 未初始化");
                return;
            }

            // 检查通知权限
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
                    Log.w(TAG, "没有通知权限，无法发送通知");
                    return;
                }
            }

            Log.d(TAG, "开始发送通知: " + title + " - " + body);

            // 创建通知意图
            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // 构建通知
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true)
                    .setVibrate(new long[]{0, 500, 200, 500}) // 震动模式
                    .setOngoing(false);

            // 发送通知
            notificationManager.notify(1, builder.build());
            Log.d(TAG, "通知已发送到系统: ID=1, 标题=" + title + ", 内容=" + body);

            // 验证通知渠道状态
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = notificationManager.getNotificationChannel(CHANNEL_ID);
                if (channel != null) {
                    Log.d(TAG, "通知渠道状态: ID=" + channel.getId() +
                            ", 重要性=" + channel.getImportance() +
                            ", 启用灯光=" + channel.shouldShowLights() +
                            ", 启用震动=" + channel.shouldVibrate());
                }
            }

        } catch (Exception e) {
            Log.e(TAG, "发送通知时发生异常: " + e.getMessage(), e);
            e.printStackTrace();
        }
    }
    
    /**
     * 获取MIME类型
     */
    private String getMimeType(String path) {
        if (path.endsWith(".html")) {
            return "text/html";
        } else if (path.endsWith(".css")) {
            return "text/css";
        } else if (path.endsWith(".js")) {
            return "application/javascript";
        } else if (path.endsWith(".png")) {
            return "image/png";
        } else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (path.endsWith(".gif")) {
            return "image/gif";
        } else if (path.endsWith(".svg")) {
            return "image/svg+xml";
        } else if (path.endsWith(".mp3")) {
            return "audio/mpeg";
        } else if (path.endsWith(".wav")) {
            return "audio/wav";
        } else if (path.endsWith(".m4a")) {
            return "audio/mp4";
        } else {
            return "application/octet-stream";
        }
    }
    
    /**
     * 请求权限
     */
    private void requestPermissions() {
        // 检查哪些权限尚未授予
        java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();
        
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }
        
        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                    this,
                    permissionsToRequest.toArray(new String[0]),
                    PERMISSION_REQUEST_CODE
            );
            Log.d(TAG, "请求权限: " + permissionsToRequest);
        } else {
            permissionsGranted = true;
            Log.d(TAG, "所有权限已授予");
        }
    }
    
    /**
     * 权限请求结果处理
     */
    @Override
    public void onRequestPermissionsResult(int requestCode,
            @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSION_REQUEST_CODE) {
            permissionsGranted = true;

            // 检查权限授予结果
            for (int i = 0; i < permissions.length; i++) {
                String permission = permissions[i];
                int result = grantResults[i];

                if (result != PackageManager.PERMISSION_GRANTED) {
                    permissionsGranted = false;
                    Log.w(TAG, "权限被拒绝: " + permission);

                    // 显示提示信息
                    Toast.makeText(this,
                            "需要" + permission + "权限才能正常使用闹钟功能",
                            Toast.LENGTH_SHORT).show();
                } else {
                    Log.d(TAG, "权限已授予: " + permission);
                }
            }

            if (permissionsGranted) {
                Log.d(TAG, "所有权限请求已通过");
            }
        } else if (requestCode == NOTIFICATION_PERMISSION_REQUEST_CODE) {
            // 处理通知权限请求结果
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "通知权限已授予");
                Toast.makeText(this, "通知权限已授予", Toast.LENGTH_SHORT).show();
            } else {
                Log.w(TAG, "通知权限被拒绝");
                Toast.makeText(this, "通知权限被拒绝，无法发送通知", Toast.LENGTH_SHORT).show();
            }
        }
    }
    
    /**
     * JavaScript接口类，用于处理闹钟播放请求
     */
    private class AlarmAudioInterface {
        
        @android.webkit.JavascriptInterface
        public boolean playAlarm(String audioPath, boolean enableVibration) {
            Log.d(TAG, "JavaScript调用playAlarm，音频路径: " + audioPath + ", 启用震动: " + enableVibration);
            
            if (!permissionsGranted) {
                Log.w(TAG, "权限未授予，无法播放闹钟");
                return false;
            }
            
            try {
                // 播放闹钟
                boolean success = alarmAudioPlayer.playAlarm(audioPath, enableVibration);
                Log.d(TAG, "闹钟播放结果: " + success);
                return success;
            } catch (Exception e) {
                Log.e(TAG, "播放闹钟时发生异常", e);
                return false;
            }
        }
        
        @android.webkit.JavascriptInterface
        public boolean stopAlarm() {
            Log.d(TAG, "JavaScript调用stopAlarm");
            
            try {
                alarmAudioPlayer.stopAlarm();
                Log.d(TAG, "闹钟已停止");
                return true;
            } catch (Exception e) {
                Log.e(TAG, "停止闹钟时发生异常", e);
                return false;
            }
        }
        
        @android.webkit.JavascriptInterface
        public boolean isPlaying() {
            try {
                return alarmAudioPlayer.isPlaying();
            } catch (Exception e) {
                Log.e(TAG, "检查播放状态时发生异常", e);
                return false;
            }
        }
        
        @android.webkit.JavascriptInterface
        public String getAppVersion() {
            return BuildConfig.VERSION_NAME;
        }
        
        @android.webkit.JavascriptInterface
        public boolean hasPermissions() {
            return permissionsGranted;
        }
    }

    /**
     * JavaScript接口类，用于处理普通音频播放请求
     */
    private class RegularAudioInterface {
        
        @android.webkit.JavascriptInterface
        public boolean playRegularAudio(String audioFileName, float volume, boolean loop) {
            Log.d(TAG, "JavaScript调用playRegularAudio，音频文件: " + audioFileName + ", 音量: " + volume + ", 循环: " + loop);
            
            if (!permissionsGranted) {
                Log.w(TAG, "权限未授予，无法播放音频");
                return false;
            }
            
            try {
                // 确保RegularAudioPlayer已初始化
                if (regularAudioPlayer == null) {
                    regularAudioPlayer = new RegularAudioPlayer(MainActivity.this);
                    Log.d(TAG, "RegularAudioPlayer已重新初始化");
                }
                
                // 播放音频
                boolean success = regularAudioPlayer.playAudio(audioFileName, volume, loop);
                Log.d(TAG, "音频播放结果: " + success);
                return success;
            } catch (Exception e) {
                Log.e(TAG, "播放音频时发生异常", e);
                return false;
            }
        }
        
        @android.webkit.JavascriptInterface
        public boolean stopRegularAudio() {
            Log.d(TAG, "JavaScript调用stopRegularAudio");
            
            try {
                if (regularAudioPlayer != null) {
                    regularAudioPlayer.stopAudio();
                }
                Log.d(TAG, "音频已停止");
                return true;
            } catch (Exception e) {
                Log.e(TAG, "停止音频时发生异常", e);
                return false;
            }
        }
        
        @android.webkit.JavascriptInterface
        public boolean pauseRegularAudio() {
            Log.d(TAG, "JavaScript调用pauseRegularAudio");
            
            try {
                if (regularAudioPlayer != null) {
                    regularAudioPlayer.pauseAudio();
                }
                Log.d(TAG, "音频已暂停");
                return true;
            } catch (Exception e) {
                Log.e(TAG, "暂停音频时发生异常", e);
                return false;
            }
        }
        
        @android.webkit.JavascriptInterface
        public boolean resumeRegularAudio() {
            Log.d(TAG, "JavaScript调用resumeRegularAudio");
            
            try {
                if (regularAudioPlayer != null) {
                    regularAudioPlayer.resumeAudio();
                }
                Log.d(TAG, "音频已恢复");
                return true;
            } catch (Exception e) {
                Log.e(TAG, "恢复音频时发生异常", e);
                return false;
            }
        }
        
        @android.webkit.JavascriptInterface
        public boolean isRegularAudioPlaying() {
            Log.d(TAG, "JavaScript调用isRegularAudioPlaying");
            
            try {
                if (regularAudioPlayer != null) {
                    return regularAudioPlayer.isPlaying();
                }
                return false;
            } catch (Exception e) {
                Log.e(TAG, "检查普通音频播放状态时发生异常", e);
                return false;
            }
        }
    }

    /**
     * JavaScript接口类，用于处理通知功能
     */
    private class NotificationInterface {

        @android.webkit.JavascriptInterface
        public boolean sendNotification(final String title, final String body) {
            Log.d(TAG, "JavaScript调用NotificationBridge.sendNotification，标题: " + title + ", 内容: " + body);

            try {
                // 在主线程中发送通知
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            sendNotificationInternal(title, body);
                        } catch (Exception e) {
                            Log.e(TAG, "在主线程发送通知时发生异常: " + e.getMessage(), e);
                        }
                    }
                });
                return true;
            } catch (Exception e) {
                Log.e(TAG, "发送通知时发生异常: " + e.getMessage(), e);
                return false;
            }
        }
    }

    /**
     * JavaScript接口类，用于处理闹钟调度功能
     */
    private class AlarmSchedulerInterface {

        @android.webkit.JavascriptInterface
        public boolean scheduleAlarm(int delayInSeconds, boolean enableVibration) {
            Log.d(TAG, "JavaScript调用AlarmSchedulerBridge.scheduleAlarm，延迟: " + delayInSeconds + "秒, 启用震动: " + enableVibration);

            try {
                if (alarmScheduler != null) {
                    return alarmScheduler.scheduleAlarm(delayInSeconds, enableVibration);
                } else {
                    Log.e(TAG, "alarmScheduler 未初始化");
                    return false;
                }
            } catch (Exception e) {
                Log.e(TAG, "设置闹钟时发生异常: " + e.getMessage(), e);
                return false;
            }
        }

        @android.webkit.JavascriptInterface
        public boolean cancelAlarm() {
            Log.d(TAG, "JavaScript调用AlarmSchedulerBridge.cancelAlarm");

            try {
                if (alarmScheduler != null) {
                    return alarmScheduler.cancelAlarm();
                } else {
                    Log.e(TAG, "alarmScheduler 未初始化");
                    return false;
                }
            } catch (Exception e) {
                Log.e(TAG, "取消闹钟时发生异常: " + e.getMessage(), e);
                return false;
            }
        }
    }


    /**
     * 处理返回键
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();

        // 停止闹钟
        if (alarmAudioPlayer != null) {
            alarmAudioPlayer.stopAlarm();
        }

        // 停止普通音频
        if (regularAudioPlayer != null) {
            regularAudioPlayer.stopAudio();
        }

        // 清理WebView
        if (webView != null) {
            webView.clearHistory();
            webView.clearCache(true);
            webView.loadUrl("about:blank");
            webView.onPause();
            webView.removeAllViews();
            webView.destroyDrawingCache();
            webView.destroy();
        }

        Log.d(TAG, "MainActivity已销毁");
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        
        // 暂停WebView
        if (webView != null) {
            webView.onPause();
        }
        
        Log.d(TAG, "MainActivity已暂停");
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        
        // 恢复WebView
        if (webView != null) {
            webView.onResume();
        }
        
        Log.d(TAG, "MainActivity已恢复");
    }
}
