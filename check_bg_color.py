from PIL import Image
import os

def check_background_color(image_path):
    # 打开图像
    img = Image.open(image_path)
    img = img.convert('RGB')
    
    # 获取图像尺寸
    width, height = img.size
    
    # 定义采样区域（只采样边缘和角落的像素）
    sample_points = [
        (0, 0), (0, height - 1), (width - 1, 0), (width - 1, height - 1),
        (0, height // 2), (width - 1, height // 2), (width // 2, 0), (width // 2, height - 1)
    ]
    
    # 获取采样点的颜色
    colors = []
    for x, y in sample_points:
        color = img.getpixel((x, y))
        colors.append(color)
    
    # 打印颜色信息
    print("图像尺寸:", width, "x", height)
    print("采样点颜色:")
    for i, color in enumerate(colors):
        print(f"  点{i+1}: {color}")
    
    # 判断背景是否为透明
    if img.mode in ('RGBA', 'LA'):
        print("\n图像包含透明通道")
        # 检查角落透明像素
        corner_alpha = img.getpixel((0, 0))[3]
        print(f"左上角透明度: {corner_alpha}")
    else:
        print("\n图像不包含透明通道")
    
    # 计算主色调（简单的平均颜色）
    total_pixels = width * height
    r_total = g_total = b_total = 0
    for x in range(width):
        for y in range(height):
            r, g, b = img.getpixel((x, y))
            r_total += r
            g_total += g
            b_total += b
    
    avg_color = (r_total // total_pixels, g_total // total_pixels, b_total // total_pixels)
    print(f"\n平均颜色: {avg_color}")
    
    return avg_color

if __name__ == "__main__":
    image_path = "/Users/wintert/Documents/trae_projects/public/sleep.png"
    print("检查图像背景颜色...")
    check_background_color(image_path)
