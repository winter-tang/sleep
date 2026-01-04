package com.sleepmeditation.utils;

import android.content.Context;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FileLogger {
    private static final String TAG = "FileLogger";
    private static final String LOG_DIR = "SleepMeditation/Logs";
    private static final String LOG_FILE_PREFIX = "app_log_";
    private static final String LOG_FILE_EXTENSION = ".txt";
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.getDefault());
    private static final SimpleDateFormat DATE_ONLY_FORMAT = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
    
    private Context context;
    private String logFileName;
    
    public FileLogger(Context context) {
        this.context = context;
        this.logFileName = LOG_FILE_PREFIX + DATE_ONLY_FORMAT.format(new Date()) + LOG_FILE_EXTENSION;
    }
    
    public void log(String message) {
        String timestamp = DATE_FORMAT.format(new Date());
        String logMessage = "[" + timestamp + "] " + message + "\n";
        
        // 同时输出到Logcat便于调试
        Log.d(TAG, message);
        
        // 写入文件
        writeToFile(logMessage);
    }
    
    public void logError(String tag, String message, Throwable throwable) {
        String timestamp = DATE_FORMAT.format(new Date());
        String logMessage = "[" + timestamp + "] ERROR - " + tag + ": " + message + "\n";
        
        if (throwable != null) {
            logMessage += "Exception: " + throwable.getMessage() + "\n";
            for (StackTraceElement element : throwable.getStackTrace()) {
                logMessage += "\tat " + element.toString() + "\n";
            }
        }
        
        // 同时输出到Logcat
        Log.e(TAG, message, throwable);
        
        // 写入文件
        writeToFile(logMessage);
    }
    
    private void writeToFile(String message) {
        try {
            File logFile = getLogFile();
            if (logFile != null) {
                FileWriter writer = new FileWriter(logFile, true);
                writer.append(message);
                writer.flush();
                writer.close();
            }
        } catch (IOException e) {
            Log.e(TAG, "Failed to write to log file", e);
        }
    }
    
    private File getLogFile() {
        File logDir = null;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10及以上，使用应用特定目录
            logDir = new File(context.getExternalFilesDir(null), LOG_DIR);
        } else {
            // Android 10以下，使用公共目录
            logDir = new File(Environment.getExternalStorageDirectory(), LOG_DIR);
        }
        
        // 创建目录
        if (!logDir.exists()) {
            if (!logDir.mkdirs()) {
                Log.e(TAG, "Failed to create log directory");
                return null;
            }
        }
        
        return new File(logDir, logFileName);
    }
    
    // 获取日志目录路径，供其他功能使用
    public String getLogsDirectoryPath() {
        File logDir = null;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            logDir = new File(context.getExternalFilesDir(null), LOG_DIR);
        } else {
            logDir = new File(Environment.getExternalStorageDirectory(), LOG_DIR);
        }
        
        return logDir.getAbsolutePath();
    }
}