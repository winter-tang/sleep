#!/bin/bash

# 源文件
SOURCE_IMAGE="/Users/wintert/Documents/trae_projects/public/sleep.png"

# 目标目录和尺寸
TARGETS=(
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png:108x108"
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png:162x162"
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png:216x216"
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png:324x324"
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png:432x432"
)

# 检查源文件是否存在
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "源文件 $SOURCE_IMAGE 不存在！"
    exit 1
fi

# 循环处理每个目标文件
for target in "${TARGETS[@]}"; do
    # 分离目标文件路径和尺寸
    IFS=: read -r target_file target_size <<< "$target"
    
    # 检查目标目录是否存在
    target_dir=$(dirname "$target_file")
    if [ ! -d "$target_dir" ]; then
        echo "目标目录 $target_dir 不存在！"
        continue
    fi
    
    # 备份原文件
    if [ -f "$target_file" ]; then
        cp "$target_file" "${target_file}.bak"
        echo "已备份原文件到 ${target_file}.bak"
    fi
    
    # 使用 sips 缩放图像
    echo "正在缩放图像到 $target_size 并保存到 $target_file"
    sips -z ${target_size%x*} ${target_size#*x} "$SOURCE_IMAGE" --out "$target_file"
    
    if [ $? -eq 0 ]; then
        echo "成功生成 $target_file"
    else
        echo "生成 $target_file 失败！"
    fi
    
    echo "-------------------"
done

echo "图标缩放完成！"
