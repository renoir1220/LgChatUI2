#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTML到Markdown快速转换工具（优化版）
针对大文件优化，重点处理img标签和常见HTML清理

使用方法:
python3 fast_html_converter.py input.md [output.md]
"""

import re
import sys
import os
import time


class FastHtmlConverter:
    """高性能HTML到Markdown转换器"""
    
    def __init__(self):
        # 预编译关键正则表达式
        self.img_pattern = re.compile(r'<img\s+src="([^"]+)"[^>]*>', re.IGNORECASE)
        self.div_img_pattern = re.compile(r'<div[^>]*?image-uploaded[^>]*?>.*?<img\s+src="([^"]+)"[^>]*>.*?</div>', re.DOTALL | re.IGNORECASE)
        self.comment_pattern = re.compile(r'<!--.*?-->', re.DOTALL)
        self.multi_space = re.compile(r'[ \t]+')
        self.multi_newline = re.compile(r'\n\s*\n\s*\n+')
        
        # Base64图片清理模式
        self.base64_patterns = [
            # data:image格式
            re.compile(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', re.IGNORECASE),
            # 长base64字符串（100+字符）
            re.compile(r'\b[A-Za-z0-9+/]{100,}={0,2}\b'),
            # 包含在括号中的base64数据
            re.compile(r'\([^)]*data:image[^)]*\)', re.IGNORECASE),
            # img标签中的base64
            re.compile(r'<img[^>]*src="data:image[^"]*"[^>]*>', re.IGNORECASE),
        ]
        
        # HTML实体替换表
        self.entities = {
            '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"',
            '&nbsp;': ' ', '&ldquo;': '"', '&rdquo;': '"'
        }
        
        # 简单标签清理列表
        self.simple_tags = [
            '</span>', '<span>', '</div>', '<div>', '</p>', '<p>',
            '</summary>', '<summary>', '</param>', '<param>',
            '</strong>', '</b>', '</em>', '</i>', '</u>',
            '<br>', '<br/>', '<hr>', '<hr/>'
        ]
    
    def print_progress(self, current, total, step_name, width=50):
        """显示进度条"""
        percent = (current / total) * 100
        filled = int(width * current // total)
        bar = '█' * filled + '░' * (width - filled)
        print(f'\r{step_name}: [{bar}] {percent:.1f}% ({current}/{total})', end='', flush=True)
    
    def clean_base64_images(self, text):
        """清理base64图片数据（预处理步骤）"""
        print("🗑️  正在清理base64图片数据...")
        
        original_size = len(text)
        cleaned_count = 0
        
        for i, pattern in enumerate(self.base64_patterns):
            matches = pattern.findall(text)
            if matches:
                cleaned_count += len(matches)
                text = pattern.sub('', text)
                print(f"  • 清理模式 {i+1}: 移除 {len(matches)} 个匹配项")
        
        cleaned_size = len(text)
        size_reduction = original_size - cleaned_size
        
        if size_reduction > 0:
            print(f"  • 减少大小: {size_reduction/1024:.1f}KB ({size_reduction/original_size*100:.1f}%)")
        else:
            print(f"  • 未发现base64图片数据")
        
        return text
    
    def process_images(self, text):
        """快速处理图片标签"""
        print("📷 正在处理图片标签...")
        
        # 处理复杂div包装的图片
        text = self.div_img_pattern.sub(r'![截图](\1)', text)
        
        # 处理标准img标签
        text = self.img_pattern.sub(r'![截图](\1)', text)
        
        # 简单的图片前文本处理
        lines = text.split('\n')
        total_lines = len(lines)
        
        for i in range(total_lines):
            # 每处理1000行显示一次进度
            if i % 1000 == 0:
                self.print_progress(i, total_lines, "处理图片")
            
            line = lines[i]
            if '![截图]' in line and i > 0:
                prev_line = lines[i-1].strip()
                if prev_line and not prev_line.endswith(('。', '.', '！', '!', '？', '?', '：', ':')):
                    # 在图片前添加句号并包装
                    img_part = line.strip()
                    if prev_line:
                        lines[i-1] = prev_line + '。'
                        lines[i] = f'（相关截图如下：{img_part}）'
                    else:
                        lines[i] = f'（相关截图如下：{img_part}）'
                else:
                    lines[i] = f'（相关截图如下：{line.strip()}）'
        
        self.print_progress(total_lines, total_lines, "处理图片")
        print()  # 换行
        
        return '\n'.join(lines)
    
    def clean_html(self, text):
        """快速清理HTML"""
        print("🧹 正在清理HTML标签...")
        
        # 移除HTML注释
        print("  • 移除HTML注释...")
        text = self.comment_pattern.sub('', text)
        
        # 批量替换HTML实体
        print("  • 替换HTML实体...")
        total_entities = len(self.entities)
        for i, (entity, char) in enumerate(self.entities.items()):
            if i % 2 == 0:  # 每2个实体显示一次进度
                self.print_progress(i, total_entities, "HTML实体")
            if entity in text:
                text = text.replace(entity, char)
        self.print_progress(total_entities, total_entities, "HTML实体")
        print()
        
        # 移除简单标签
        print("  • 移除HTML标签...")
        total_tags = len(self.simple_tags)
        for i, tag in enumerate(self.simple_tags):
            if i % 5 == 0:  # 每5个标签显示一次进度
                self.print_progress(i, total_tags, "清理标签")
            if tag in text:
                text = text.replace(tag, '')
        self.print_progress(total_tags, total_tags, "清理标签")
        print()
        
        # 处理strong/b标签转为markdown
        print("  • 转换格式标签...")
        text = re.sub(r'<(strong|b)[^>]*>(.*?)</\1>', r'**\2**', text, flags=re.IGNORECASE | re.DOTALL)
        
        # 移除剩余的简单标签（不保留内容的）
        print("  • 清理剩余标签...")
        text = re.sub(r'<[^>]+>', '', text)
        
        return text
    
    def normalize_text(self, text):
        """规范化文本"""
        print("✨ 正在规范化文本...")
        
        # 规范化空格
        print("  • 规范化空格...")
        text = self.multi_space.sub(' ', text)
        
        # 规范化换行
        print("  • 规范化换行...")
        text = self.multi_newline.sub('\n\n', text)
        
        # 清理行首行尾空格
        print("  • 清理行首行尾空格...")
        lines = text.split('\n')
        total_lines = len(lines)
        processed_lines = []
        
        for i, line in enumerate(lines):
            if i % 2000 == 0:  # 每2000行显示一次进度
                self.print_progress(i, total_lines, "规范化")
            processed_lines.append(line.strip())
        
        self.print_progress(total_lines, total_lines, "规范化")
        print()
        
        return '\n'.join(processed_lines).strip()
    
    def convert(self, text):
        """执行快速转换"""
        print("\n🚀 开始转换处理...")
        print("=" * 60)
        
        # 0. 预处理：清理base64图片数据
        print("\n预处理:")
        text = self.clean_base64_images(text)
        
        # 1. 处理图片
        print("\n步骤 1/3:")
        text = self.process_images(text)
        
        # 2. 清理HTML
        print("\n步骤 2/3:")
        text = self.clean_html(text)
        
        # 3. 规范化文本
        print("\n步骤 3/3:")
        text = self.normalize_text(text)
        
        print("\n✅ 转换处理完成!")
        print("=" * 60)
        
        return text
    
    def convert_file(self, input_file, output_file=None):
        """转换文件"""
        start_time = time.time()
        
        if not os.path.exists(input_file):
            print(f"错误：文件不存在 {input_file}")
            return False
        
        # 确定输出文件
        if output_file is None:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_fixed.md"
        
        print(f"开始处理文件: {input_file}")
        
        try:
            # 读取文件
            print(f"📖 正在读取文件: {input_file}")
            with open(input_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            file_size = len(content) / 1024 / 1024  # MB
            line_count = content.count('\n') + 1
            print(f"📊 文件信息:")
            print(f"  • 文件大小: {file_size:.2f}MB")
            print(f"  • 行数: {line_count:,}行")
            
            # 转换
            converted = self.convert(content)
            
            # 写入文件
            print(f"\n💾 正在写入文件: {output_file}")
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(converted)
            
            end_time = time.time()
            duration = end_time - start_time
            
            print(f"\n🎉 任务完成!")
            print(f"📈 性能统计:")
            print(f"  • 输出文件: {output_file}")
            print(f"  • 处理时间: {duration:.2f}秒")
            print(f"  • 处理速度: {file_size/duration:.2f}MB/秒")
            print(f"  • 行处理速度: {line_count/duration:,.0f}行/秒")
            
            return True
            
        except Exception as e:
            print(f"转换失败: {e}")
            return False


def main():
    if len(sys.argv) < 2:
        print("用法: python3 fast_html_converter.py input.md [output.md]")
        print("示例: python3 fast_html_converter.py kb_source/需求处理记录.md")
        return 1
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    converter = FastHtmlConverter()
    success = converter.convert_file(input_file, output_file)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())