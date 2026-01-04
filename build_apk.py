#!/usr/bin/env python3
import subprocess
import sys

def main():
    print("正在打包 APK...")
    
    try:
        # 直接使用 subprocess 执行，避免 shell 解析问题
        result = subprocess.run(
            [
                '/Users/wintert/Documents/trae_projects/android/gradlew', 
                'app:assembleDebug'
            ],
            cwd='/Users/wintert/Documents/trae_projects/android',
            capture_output=True,
            text=True
        )
        
        print("STDOUT:")
        print(result.stdout)
        print("\nSTDERR:")
        print(result.stderr)
        print(f"\n退出代码: {result.returncode}")
        
        if result.returncode == 0:
            print("\n✅ APK 打包成功！")
            # 查找生成的 APK 文件
            find_apk()
        else:
            print("\n❌ APK 打包失败")
            
    except FileNotFoundError as e:
        print(f"错误: 找不到文件 {e.filename}")
        print("确保 Android 项目目录存在并且有 Gradle 包装器")
        return 1
    except Exception as e:
        print(f"错误: {e}")
        return 1
        
    return result.returncode

def find_apk():
    """查找并打印生成的 APK 文件路径"""
    import glob
    apk_patterns = [
        '/Users/wintert/Documents/trae_projects/android/app/build/outputs/apk/debug/app-debug.apk',
        '/Users/wintert/Documents/trae_projects/android/app/build/outputs/apk/*/app-*.apk',
        '/Users/wintert/Documents/trae_projects/android/app/build/outputs/apk/**/*.apk'
    ]
    
    for pattern in apk_patterns:
        apks = glob.glob(pattern)
        if apks:
            print("\n找到的 APK 文件:")
            for apk in apks:
                print(f"📱 {apk}")
            return

    print("\n未找到 APK 文件")

if __name__ == "__main__":
    sys.exit(main())
