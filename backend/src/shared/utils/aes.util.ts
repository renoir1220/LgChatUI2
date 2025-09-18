import * as crypto from 'crypto';

/**
 * AES加密工具类
 * 基于CRM登录验证接口文档规范实现
 */
export class AESHelper {
  // 密钥 - 来自CRM接口文档
  private static readonly KEY = 'l1o2g3e4nE1234@!';

  // 偏移量（IV） - 来自CRM接口文档
  private static readonly IV = '4s3c2a1p$llogene';

  /**
   * AES加密 - 严格按照CRM文档中的C#实现
   * @param text 明文字符串
   * @param key 密钥（可选，默认使用配置密钥）
   * @returns Base64编码的密文
   */
  static encrypt(text: string, key?: string): string {
    try {
      const encryptKey = key || AESHelper.KEY;

      // 密钥处理：完全按照C#代码逻辑
      const keyBytes = Buffer.alloc(16);
      const pwdBytes = Buffer.from(encryptKey, 'utf8');
      const len = Math.min(pwdBytes.length, keyBytes.length);
      // 复制密钥字节到固定长度的缓冲区
      for (let i = 0; i < len; i++) {
        keyBytes[i] = pwdBytes[i];
      }

      // IV处理：直接使用UTF8字节
      const ivBytes = Buffer.from(AESHelper.IV, 'utf8');

      // 创建AES-128-CBC加密器 (对应C#的RijndaelManaged CBC模式)
      const cipher = crypto.createCipheriv('aes-128-cbc', keyBytes, ivBytes);

      // 加密数据并转换为Base64
      const plainTextBytes = Buffer.from(text, 'utf8');
      let encrypted = cipher.update(plainTextBytes);
      const final = cipher.final();

      // 合并加密结果
      const encryptedBytes = Buffer.concat([encrypted, final]);

      return encryptedBytes.toString('base64');
    } catch (error) {
      throw new Error(`AES加密失败: ${error.message}`);
    }
  }

  /**
   * AES解密
   * @param text 加密字符串（Base64格式）
   * @param key 密钥（可选，默认使用配置密钥）
   * @returns 明文字符串
   */
  static decrypt(text: string, key?: string): string {
    try {
      const decryptKey = key || AESHelper.KEY;

      // 密钥处理：确保16字节长度
      const keyBytes = Buffer.alloc(16);
      const pwdBytes = Buffer.from(decryptKey, 'utf8');
      const len = Math.min(pwdBytes.length, keyBytes.length);
      pwdBytes.copy(keyBytes, 0, 0, len);

      // IV处理：确保16字节长度
      const ivBytes = Buffer.from(AESHelper.IV, 'utf8');

      // 创建AES-128-CBC解密器
      const decipher = crypto.createDecipheriv('aes-128-cbc', keyBytes, ivBytes);

      // 解密数据
      let decrypted = decipher.update(text, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`AES解密失败: ${error.message}`);
    }
  }

  /**
   * 生成Unix时间戳（秒级）
   * @returns Unix时间戳
   */
  static generateTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 生成CRM登录Token
   * @param account 用户账号
   * @param password 用户密码
   * @returns 加密后的Token字符串
   */
  static generateCrmToken(account: string, password: string): string {
    const timestamp = AESHelper.generateTimestamp();
    const plainText = `${account}|${password}|${timestamp}`;
    return AESHelper.encrypt(plainText);
  }

  /**
   * 解析CRM Token
   * @param token 加密的Token字符串
   * @returns 解析后的Token信息
   */
  static parseCrmToken(token: string): { account: string; password: string; timestamp: number } {
    try {
      const plainText = AESHelper.decrypt(token);
      const parts = plainText.split('|');

      if (parts.length !== 3) {
        throw new Error('Token格式不正确');
      }

      return {
        account: parts[0],
        password: parts[1],
        timestamp: parseInt(parts[2], 10),
      };
    } catch (error) {
      throw new Error(`Token解析失败: ${error.message}`);
    }
  }

  /**
   * 验证Token是否过期
   * @param timestamp Token中的时间戳
   * @param validityMinutes 有效期（分钟，默认10分钟）
   * @returns 是否过期
   */
  static isTokenExpired(timestamp: number, validityMinutes: number = 10): boolean {
    const currentTimestamp = AESHelper.generateTimestamp();
    const validitySeconds = validityMinutes * 60;
    return (currentTimestamp - timestamp) > validitySeconds;
  }

  /**
   * MD5加密（工具方法）
   * @param str 加密字符
   * @param code 加密位数 16/32
   * @returns MD5加密后的字符串
   */
  static md5Hash(str: string, code: 16 | 32 = 32): string {
    const hash = crypto.createHash('md5');
    hash.update(str, 'utf8');
    const result = hash.digest('hex');

    if (code === 16) {
      return result.slice(8, 24); // 取中间16位
    }

    return result; // 返回32位
  }
}