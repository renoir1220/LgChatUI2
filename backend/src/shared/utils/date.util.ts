/**
 * 日期和时间工具函数
 * 处理本地时间格式化，避免UTC时间混淆
 */

/**
 * 将日期对象格式化为本地时间的ISO字符串
 * 不同于 toISOString() 返回UTC时间，这个函数返回本地时间的ISO格式
 * @param date Date对象
 * @returns 本地时间的ISO格式字符串，例如: "2024-01-15T10:30:45.123"
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 获取当前本地时间的ISO格式字符串
 * @returns 当前本地时间的ISO格式字符串
 */
export function getCurrentLocalDateTime(): string {
  return formatLocalDateTime(new Date());
}