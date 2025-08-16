#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理base64图片数据的临时脚本
用于移除文档中的base64编码图片数据
"""

import re
import sys
import os


def clean_base64_images(text):
    """清理base64图片数据"""
    
    # 匹配各种base64图片格式
    patterns = [
        # data:image格式
        re.compile(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', re.IGNORECASE),
        
        # 单独的base64数据（通常很长的字符串）
        re.compile(r'\b[A-Za-z0-9+/]{100,}={0,2}\b'),
        
        # 包含在括号中的base64数据
        re.compile(r'\([^)]*data:image[^)]*\)', re.IGNORECASE),
        
        # img标签中的base64
        re.compile(r'<img[^>]*src="data:image[^"]*"[^>]*>', re.IGNORECASE),
    ]
    
    for pattern in patterns:
        text = pattern.sub('[图片数据已清理]', text)
    
    return text


def clean_file(input_file, output_file=None):
    """清理文件中的base64图片"""
    
    if not os.path.exists(input_file):
        print(f"错误：文件不存在 {input_file}")
        return False
    
    if output_file is None:
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}_cleaned.md"
    
    try:
        print(f"正在清理文件: {input_file}")
        
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 统计清理前的大小
        original_size = len(content) / 1024 / 1024
        
        # 清理base64图片
        cleaned_content = clean_base64_images(content)
        
        # 统计清理后的大小
        cleaned_size = len(cleaned_content) / 1024 / 1024
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
        
        print(f"清理完成: {output_file}")
        print(f"原始大小: {original_size:.2f}MB")
        print(f"清理后大小: {cleaned_size:.2f}MB")
        print(f"减少: {original_size - cleaned_size:.2f}MB ({(1 - cleaned_size/original_size)*100:.1f}%)")
        
        return True
        
    except Exception as e:
        print(f"清理失败: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("用法: python3 clean_base64_images.py input.md [output.md]")
        return 1
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = clean_file(input_file, output_file)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())