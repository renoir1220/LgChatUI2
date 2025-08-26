export const FEED_NAV_CONFIG = {
  // 认为到达底部的剩余像素阈值
  bottomOffsetPx: 24,
  // 第一次下滑的最小滚动量（像素）才“预备”
  armThresholdDeltaY: 40,
  // 二次确认的时间窗（毫秒），在该时间内再次下滑才真正翻页
  confirmWindowMs: 800,
  // 成功翻页后的冷却时间（毫秒），避免连续触发
  navigationCooldownMs: 1000,
  // 自动回到顶部的滚动行为
  autoScrollBehavior: 'smooth' as ScrollBehavior,
};

