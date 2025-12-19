package com.example.sleepmeditation.utils;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class PermissionUtils {
    private static final int STORAGE_PERMISSION_CODE = 100;
    private static final int RECORD_AUDIO_PERMISSION_CODE = 101;
    
    // 检查存储权限是否已授予
    public static boolean hasStoragePermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10及以上，使用应用特定目录不需要存储权限
                return true;
            } else {
                // Android 6.0-9.0，需要检查存储权限
                return ContextCompat.checkSelfPermission(context,
                        Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
            }
        } else {
            // Android 5.1及以下，默认已授予权限
            return true;
        }
    }
    
    // 检查录音权限是否已授予
    public static boolean hasRecordAudioPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return ContextCompat.checkSelfPermission(context,
                    Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        } else {
            // Android 5.1及以下，默认已授予权限
            return true;
        }
    }
    
    // 请求存储权限
    public static void requestStoragePermission(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            if (!hasStoragePermission(activity)) {
                ActivityCompat.requestPermissions(activity,
                        new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                        STORAGE_PERMISSION_CODE);
            }
        }
    }
    
    // 请求录音权限
    public static void requestRecordAudioPermission(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!hasRecordAudioPermission(activity)) {
                ActivityCompat.requestPermissions(activity,
                        new String[]{Manifest.permission.RECORD_AUDIO},
                        RECORD_AUDIO_PERMISSION_CODE);
            }
        }
    }
    
    // 请求所有必要权限
    public static void requestAllPermissions(Activity activity) {
        requestStoragePermission(activity);
        requestRecordAudioPermission(activity);
    }
    
    // 处理权限请求结果
    public static boolean handlePermissionResult(int requestCode, int[] grantResults) {
        if (requestCode == STORAGE_PERMISSION_CODE || requestCode == RECORD_AUDIO_PERMISSION_CODE) {
            return grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        }
        return false;
    }
    
    // 获取权限类型标识
    public static String getPermissionNameByRequestCode(int requestCode) {
        if (requestCode == STORAGE_PERMISSION_CODE) {
            return "存储权限";
        } else if (requestCode == RECORD_AUDIO_PERMISSION_CODE) {
            return "录音权限";
        }
        return "未知权限";
    }
}