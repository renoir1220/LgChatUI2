// UUID 工具
// 统一的 UUID 校验，避免多处重复正则
export const isValidUUID = (s?: string): boolean => {
  if (!s || typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(s);
};

