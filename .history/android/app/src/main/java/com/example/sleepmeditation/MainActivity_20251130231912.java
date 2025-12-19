package com.example.sleepmeditation;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.Toast;

import com.example.sleepmeditation.utils.FileLogger;
import com.example.sleepmeditation.utils.PermissionUtils;
import com.example.sleepmeditation.utils.AudioManager;
import com.example.sleepmeditation.utils.ResourceManager;

public class MainActivity extends AppCompatActivity {
    private FileLogger logger;
    private AudioManager audioManager;
    private ResourceManager resourceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // 初始化日志记录器
        logger = new FileLogger(this);
        logger.log("应用启动 - MainActivity onCreate");
        
        // 初始化音频管理器
        audioManager = new AudioManager(this);
        logger.log("音频目录: " + audioManager.getAudioDirectory().getAbsolutePath());
        logger.log("自定义音频目录: " + audioManager.getCustomAudioDirectory().getAbsolutePath());
        
        // 初始化资源管理器
        resourceManager = new ResourceManager(this);
        resourceManager.initializeResources();
        logger.log(resourceManager.getResourceInfo());
        
        // 请求所有必要权限
        PermissionUtils.requestAllPermissions(this);
        
        // 示例：记录应用版本信息
        try {
            String versionName = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            int versionCode = getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            logger.log("应用版本: " + versionName + " (" + versionCode + ")");
        } catch (Exception e) {
            logger.logError("MainActivity", "获取版本信息失败", e);
        }
        
        logger.log("日志目录: " + logger.getLogsDirectoryPath());
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        String permissionName = PermissionUtils.getPermissionNameByRequestCode(requestCode);
        if (PermissionUtils.handlePermissionResult(requestCode, grantResults)) {
            logger.log(permissionName + "已授予");
            Toast.makeText(this, permissionName + "已授予", Toast.LENGTH_SHORT).show();
        } else {
            logger.log(permissionName + "被拒绝");
            Toast.makeText(this, permissionName + "被拒绝，部分功能可能无法正常使用", Toast.LENGTH_SHORT).show();
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        logger.log("Activity 恢复 - onResume");
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        logger.log("Activity 暂停 - onPause");
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        logger.log("Activity 销毁 - onDestroy");
    }
}