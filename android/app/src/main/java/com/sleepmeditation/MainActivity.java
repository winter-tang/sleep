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
    
    private WebView webView;
    private AlarmAudioPlayer alarmAudioPlayer;
    private RegularAudioPlayer regularAudioPlayer;
    private boolean permissionsGranted = false;
    
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
