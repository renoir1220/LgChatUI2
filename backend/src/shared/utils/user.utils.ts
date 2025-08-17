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

/**
 * 从认证请求中提取用户ID
 */
export function extractUserIdFromRequest(req: {
  user: { username: string };
}): string {
  return generateUserId(req.user.username);
}
