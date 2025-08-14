/**
 * 消息引用信息缓存工具
 * 将消息的引用信息保存到Cookie中，用于历史记录恢复
 */

interface MessageCitations {
  [messageIndex: string]: any[]; // messageIndex -> citations数组
}

interface ConversationCache {
  [conversationId: string]: MessageCitations;
}

const CACHE_KEY = 'chat_message_citations';
const CACHE_EXPIRE_DAYS = 7; // Cookie过期时间：7天

/**
 * 保存消息引用信息到Cookie
 * @param conversationId 对话ID
 * @param messageIndex 消息索引
 * @param citations 引用信息数组
 */
export function saveCitationsToCache(conversationId: string, messageIndex: number, citations: any[]) {
  try {
    if (!conversationId || citations.length === 0) return;

    const cache = getCacheFromCookie();
    
    if (!cache[conversationId]) {
      cache[conversationId] = {};
    }
    
    cache[conversationId][messageIndex.toString()] = citations;
    
    // 保存到Cookie
    const expires = new Date();
    expires.setTime(expires.getTime() + (CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000));
    
    document.cookie = `${CACHE_KEY}=${encodeURIComponent(JSON.stringify(cache))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    console.log(`保存引用信息到缓存: 对话${conversationId}, 消息${messageIndex}, 引用数量${citations.length}`);
  } catch (error) {
    console.warn('保存引用信息到缓存失败:', error);
  }
}

/**
 * 基于“助手消息序号”保存引用信息（更稳定的键）
 * 例如第1条助手消息 -> 键为 a:1
 */
export function saveAssistantCitationsToCache(
  conversationId: string,
  assistantOrdinal: number,
  citations: any[],
) {
  try {
    if (!conversationId || citations.length === 0) return;

    const cache = getCacheFromCookie();

    if (!cache[conversationId]) {
      cache[conversationId] = {};
    }

    const key = `a:${assistantOrdinal}`;
    cache[conversationId][key] = citations;

    // 保存到Cookie
    const expires = new Date();
    expires.setTime(expires.getTime() + CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

    document.cookie = `${CACHE_KEY}=${encodeURIComponent(
      JSON.stringify(cache),
    )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    console.log(
      `保存引用信息到缓存(助手序号): 对话${conversationId}, 助手序号${assistantOrdinal}, 引用数量${citations.length}`,
    );
  } catch (error) {
    console.warn('保存引用信息到缓存(助手序号)失败:', error);
  }
}

/**
 * 从Cookie获取对话的所有引用信息
 * @param conversationId 对话ID
 * @returns 消息引用信息映射
 */
export function getCitationsFromCache(conversationId: string): MessageCitations {
  try {
    if (!conversationId) return {};

    const cache = getCacheFromCookie();
    const conversationCache = cache[conversationId] || {};
    
    console.log(`从缓存获取引用信息: 对话${conversationId}, 找到${Object.keys(conversationCache).length}条消息引用`);
    return conversationCache;
  } catch (error) {
    console.warn('从缓存获取引用信息失败:', error);
    return {};
  }
}

/**
 * 清理过期的缓存数据
 */
export function cleanupExpiredCache() {
  try {
    const cache = getCacheFromCookie();
    
    // 简单的清理策略：如果缓存过大，清理最老的数据
    const conversationIds = Object.keys(cache);
    if (conversationIds.length > 50) { // 最多保留50个对话的缓存
      const toRemove = conversationIds.slice(0, conversationIds.length - 50);
      toRemove.forEach(id => delete cache[id]);
      
      const expires = new Date();
      expires.setTime(expires.getTime() + (CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000));
      document.cookie = `${CACHE_KEY}=${encodeURIComponent(JSON.stringify(cache))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      
      console.log(`清理缓存: 移除${toRemove.length}个旧对话缓存`);
    }
  } catch (error) {
    console.warn('清理缓存失败:', error);
  }
}

/**
 * 清除指定对话的缓存
 * @param conversationId 对话ID
 */
export function clearConversationCache(conversationId: string) {
  try {
    const cache = getCacheFromCookie();
    delete cache[conversationId];
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000));
    document.cookie = `${CACHE_KEY}=${encodeURIComponent(JSON.stringify(cache))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    console.log(`清除对话缓存: ${conversationId}`);
  } catch (error) {
    console.warn('清除对话缓存失败:', error);
  }
}

/**
 * 从Cookie中读取缓存数据
 * @returns 缓存对象
 */
function getCacheFromCookie(): ConversationCache {
  try {
    const cookies = document.cookie.split(';');
    const cacheValue = cookies
      .find(row => row.trim().startsWith(`${CACHE_KEY}=`))
      ?.split('=')[1];
    
    if (!cacheValue) return {};
    
    const decoded = decodeURIComponent(cacheValue);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('读取Cookie缓存失败:', error);
    return {};
  }
}

/**
 * 批量保存消息引用信息（用于新消息流式处理完成时）
 * @param conversationId 对话ID
 * @param messages 消息数组
 */
export function batchSaveCitations(conversationId: string, messages: any[]) {
  try {
    if (!conversationId || !messages.length) return;

    let savedCount = 0;
    messages.forEach((msg, index) => {
      if (msg.role === 'assistant' && msg.citations && msg.citations.length > 0) {
        saveCitationsToCache(conversationId, index, msg.citations);
        savedCount++;
      }
    });

    if (savedCount > 0) {
      console.log(`批量保存引用信息: 对话${conversationId}, 保存${savedCount}条消息引用`);
    }
  } catch (error) {
    console.warn('批量保存引用信息失败:', error);
  }
}
