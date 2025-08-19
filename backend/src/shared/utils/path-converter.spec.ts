import {
  convertRelativePathsToUrls,
  convertObjectPaths,
  convertArrayPaths,
} from './path-converter';

describe('PathConverter', () => {
  describe('convertRelativePathsToUrls', () => {
    it('应该将相对路径转换为完整URL', () => {
      const input = '这是一个测试文本 ../../files/image.png 还有更多内容';
      const expected =
        '这是一个测试文本 https://crm.logene.com/Files/Tinymce/20250813/image.png 还有更多内容';

      const result = convertRelativePathsToUrls(input);
      expect(result).toBe(expected);
    });

    it('应该处理多个相对路径', () => {
      const input = '图片1: ../../files/pic1.jpg 图片2: ../../files/pic2.png';
      const expected =
        '图片1: https://crm.logene.com/Files/Tinymce/20250813/pic1.jpg 图片2: https://crm.logene.com/Files/Tinymce/20250813/pic2.png';

      const result = convertRelativePathsToUrls(input);
      expect(result).toBe(expected);
    });

    it('应该处理HTML中的路径', () => {
      const input = '<img src="../../files/test.png" alt="测试图片">';
      const expected =
        '<img src="https://crm.logene.com/Files/Tinymce/20250813/test.png" alt="测试图片">';

      const result = convertRelativePathsToUrls(input);
      expect(result).toBe(expected);
    });

    it('应该处理空值和null', () => {
      expect(convertRelativePathsToUrls('')).toBe('');
      expect(convertRelativePathsToUrls(null)).toBe('');
      expect(convertRelativePathsToUrls(undefined)).toBe('');
    });

    it('应该处理没有相对路径的文本', () => {
      const input = '这是一个普通的文本，没有任何路径';
      const result = convertRelativePathsToUrls(input);
      expect(result).toBe(input);
    });

    it('应该使用自定义baseUrl', () => {
      const input = '测试 ../../files/doc.pdf';
      const customBaseUrl = 'https://example.com';
      const expected =
        '测试 https://example.com/Files/Tinymce/20250813/doc.pdf';

      const result = convertRelativePathsToUrls(input, customBaseUrl);
      expect(result).toBe(expected);
    });
  });

  describe('convertObjectPaths', () => {
    it('应该转换对象中指定字段的路径', () => {
      const obj = {
        id: '123',
        content: '内容 ../../files/image.png',
        description: '描述 ../../files/doc.pdf',
        other: '其他字段',
      };

      const result = convertObjectPaths(obj, ['content', 'description']);

      expect(result.content).toBe(
        '内容 https://crm.logene.com/Files/Tinymce/20250813/image.png',
      );
      expect(result.description).toBe(
        '描述 https://crm.logene.com/Files/Tinymce/20250813/doc.pdf',
      );
      expect(result.other).toBe('其他字段'); // 未指定的字段不应改变
      expect(result.id).toBe('123');
    });
  });

  describe('convertArrayPaths', () => {
    it('应该转换数组中所有对象的指定字段', () => {
      const items = [
        { id: 1, content: '内容1 ../../files/img1.png' },
        { id: 2, content: '内容2 ../../files/img2.jpg' },
      ];

      const result = convertArrayPaths(items, ['content']);

      expect(result[0].content).toBe(
        '内容1 https://crm.logene.com/Files/Tinymce/20250813/img1.png',
      );
      expect(result[1].content).toBe(
        '内容2 https://crm.logene.com/Files/Tinymce/20250813/img2.jpg',
      );
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('应该处理空数组', () => {
      const result = convertArrayPaths([], ['content']);
      expect(result).toEqual([]);
    });
  });
});
