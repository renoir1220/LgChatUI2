/**
 * 用户相关的工具函数
 */

/**
 * 根据用户名生成系统内部使用的用户ID
 * 与 UsersRepository 生成 userId 的方式保持一致
 */
export function generateUserId(username: string): string {
  return `user_${username}`;
}

// extractUserIdFromRequest 方法已删除
// 现在统一在 JWT 策略中处理用户ID格式
// 业务代码直接使用 req.user.id

/**
 * 将用户名稳定映射为一个非负的32位整数ID
 * 用于需要数值型用户ID的场景（如信息流表的 user_id INT）
 */
// 注意：数值型用户ID映射已取消。统一使用 user_${username} 形式。
