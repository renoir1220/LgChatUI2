/**
 * 消息引用信息缓存工具
 * 将消息的引用信息保存到Cookie中，用于历史记录恢复
 */

import type { Citation } from "@types";

interface MessageCitations {
  [messageKey: string]: Citation[]; // messageKey -> citations数组（如 a:1 或 旧的 index）
}

const COOKIE_PREFIX = 'chat_cit_'; // 旧：每个会话一个cookie：chat_cit_<conversationId>
const CACHE_EXPIRE_DAYS = 7; // Cookie过期时间：7天
const COOKIE_SOFT_LIMIT = 3800; // 近似上限，留出安全余量

// 轻量“结构化压缩”：将对象数组压缩为定长/裁剪的元组，减少JSON键名开销
type PackedCitation = [
  string, // source
  string, // content
  string?, // document_name
  number?, // score
  string?, // dataset_id
  string?, // document_id
  string?, // segment_id
  number?, // position
];

interface PackedConvCacheV1 {
  v: 1;
  m: Record<string, PackedCitation[]>; // messageKey -> packed citations
}

function packCitations(items: Citation[]): PackedCitation[] {
  return items.map((it) => {
    const tuple: PackedCitation = [
      it.source ?? '',
      it.content ?? '',
      it.document_name,
      typeof it.score === 'number' ? it.score : undefined,
      it.dataset_id,
      it.document_id,
      it.segment_id,
      typeof it.position === 'number' ? it.position : undefined,
    ];
    // 裁剪末尾的 undefined，减少体积
    while (tuple.length && tuple[tuple.length - 1] === undefined) tuple.pop();
    return tuple;
  });
}

function unpackCitations(packed: PackedCitation[]): Citation[] {
  return packed.map((t) => ({
    source: t[0],
    content: t[1],
    ...(t[2] !== undefined && { document_name: t[2] }),
    ...(t[3] !== undefined && { score: t[3] }),
    ...(t[4] !== undefined && { dataset_id: t[4] }),
    ...(t[5] !== undefined && { document_id: t[5] }),
    ...(t[6] !== undefined && { segment_id: t[6] }),
    ...(t[7] !== undefined && { position: t[7] }),
  }));
}

function getCookieKey(conversationId: string) {
  return `${COOKIE_PREFIX}${conversationId}`;
}

function readConvCookie(conversationId: string): MessageCitations {
  try {
    const key = getCookieKey(conversationId);
    const cookies = document.cookie.split(';');
    const value = cookies.find((row) => row.trim().startsWith(`${key}=`))?.split('=')[1];
    if (!value) return {};
    const decoded = decodeURIComponent(value);
    const json = JSON.parse(decoded) as PackedConvCacheV1;
    if (!json || json.v !== 1 || !json.m) return {};
    const result: MessageCitations = {};
    Object.keys(json.m).forEach((k) => {
      result[k] = unpackCitations(json.m[k]);
    });
    return result;
  } catch {
    // 读取会话Cookie缓存失败
    return {};
  }
}

export function writeConvCookie(conversationId: string, data: MessageCitations) {
  const key = getCookieKey(conversationId);
  const expires = new Date();
  expires.setTime(expires.getTime() + CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

  // 打包
  const packed: PackedConvCacheV1 = { v: 1, m: {} };
  Object.keys(data).forEach((k) => {
    if (Array.isArray(data[k]) && data[k].length > 0) {
      packed.m[k] = packCitations(data[k]);
    }
  });

  // 尝试序列化，若超限则按“较早消息优先淘汰”策略裁剪
  const tryWrite = (m: Record<string, PackedCitation[]>) => {
    const str = JSON.stringify({ v: 1, m });
    const cookieStr = `${key}=${encodeURIComponent(str)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    if (cookieStr.length <= COOKIE_SOFT_LIMIT) {
      document.cookie = cookieStr;
      return true;
    }
    return false;
  };

  if (tryWrite(packed.m)) return;

  // 超限：按助手序号（a:<n>）从小到大淘汰，优先保留最近的
  const entries = Object.entries(packed.m);
  entries.sort((a, b) => {
    const an = a[0].startsWith('a:') ? Number(a[0].slice(2)) || 0 : 0;
    const bn = b[0].startsWith('a:') ? Number(b[0].slice(2)) || 0 : 0;
    return an - bn;
  });
  const map: Record<string, PackedCitation[]> = Object.fromEntries(entries);
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    delete map[keys[i]]; // 从最旧开始删除
    if (tryWrite(map)) {
      // 会话引用数据过大，已裁剪旧消息引用
      return;
    }
  }
  // 如果依然写不下（极端情况），清空该会话cookie
  document.cookie = `${key}=; expires=${new Date(0).toUTCString()}; path=/; SameSite=Lax`;
}

// 旧版：全局大Cookie -> 做迁移读取（仅解读，不再写回）
const LEGACY_CACHE_KEY = 'chat_message_citations';
function readLegacyConv(conversationId: string): MessageCitations {
  try {
    const cookies = document.cookie.split(';');
    const cacheValue = cookies
      .find((row) => row.trim().startsWith(`${LEGACY_CACHE_KEY}=`))
      ?.split('=')[1];
    if (!cacheValue) return {};
    const decoded = decodeURIComponent(cacheValue);
    const obj = JSON.parse(decoded) as Record<string, MessageCitations>;
    return obj?.[conversationId] || {};
  } catch {
    // 缓存读取失败，返回空对象
    return {};
  }
}

// 新：使用 localStorage 存储，避免随请求携带导致 400（Request Header Or Cookie Too Large）
const LS_PREFIX = 'cit:'; // cit:<conversationId>

function readConvLS(conversationId: string): MessageCitations {
  try {
    const key = `${LS_PREFIX}${conversationId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const json = JSON.parse(raw) as PackedConvCacheV1;
    if (!json || json.v !== 1 || !json.m) return {};
    const result: MessageCitations = {};
    Object.keys(json.m).forEach((k) => (result[k] = unpackCitations(json.m[k])));
    return result;
  } catch {
    // 缓存读取失败，返回空对象
    return {};
  }
}

function writeConvLS(conversationId: string, data: MessageCitations) {
  const packed: PackedConvCacheV1 = { v: 1, m: {} };
  Object.keys(data).forEach((k) => {
    if (Array.isArray(data[k]) && data[k].length > 0) packed.m[k] = packCitations(data[k]);
  });
  try {
    localStorage.setItem(`${LS_PREFIX}${conversationId}`, JSON.stringify(packed));
  } catch {
    // LS 爆满则做简单降级：按键名排序删旧键
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX)).sort();
      for (let i = 0; i < Math.min(3, keys.length); i++) localStorage.removeItem(keys[i]);
      localStorage.setItem(`${LS_PREFIX}${conversationId}`, JSON.stringify(packed));
    } catch {
      // 清理缓存失败，忽略错误
    }
  }
}

/**
 * 保存消息引用信息到Cookie
 * @param conversationId 对话ID
 * @param messageIndex 消息索引
 * @param citations 引用信息数组
 */
export function saveCitationsToCache(conversationId: string, messageIndex: number, citations: Citation[]) {
  try {
    if (!conversationId || citations.length === 0) return;

    const conv = readConvLS(conversationId);
    conv[messageIndex.toString()] = citations;
    writeConvLS(conversationId, conv);
    // 保存引用信息到缓存(legacy键)
  } catch {
    // 保存引用信息到缓存失败
  }
}

/**
 * 基于“助手消息序号”保存引用信息（更稳定的键）
 * 例如第1条助手消息 -> 键为 a:1
 */
export function saveAssistantCitationsToCache(
  conversationId: string,
  assistantOrdinal: number,
  citations: Citation[],
) {
  try {
    if (!conversationId || citations.length === 0) return;

    const conv = readConvLS(conversationId);
    const key = `a:${assistantOrdinal}`;
    conv[key] = citations;
    writeConvLS(conversationId, conv);
    // 保存引用信息到缓存(助手序号)
  } catch {
    // 保存引用信息到缓存(助手序号)失败
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

    // 优先读 localStorage
    const ls = readConvLS(conversationId);
    if (Object.keys(ls).length > 0) {
      // 从localStorage获取引用信息
      return ls;
    }

    const convCache = readConvCookie(conversationId);
    if (Object.keys(convCache).length > 0) {
      // 从会话Cookie获取引用信息
      return convCache;
    }

    const legacy = readLegacyConv(conversationId);
    if (Object.keys(legacy).length > 0) {
      // 从旧版缓存获取引用信息
      return legacy;
    }
    return {};
  } catch {
    // 从缓存获取引用信息失败
    return {};
  }
}

/**
 * 清理过期的缓存数据
 */
export function cleanupExpiredCache() {
  try {
    // 迁移旧cookie到 localStorage，随后清理cookie，避免图片/文件请求因 Cookie 过大触发 400
    const cookies = document.cookie.split(';');
    const convIds: string[] = [];
    cookies.forEach((row) => {
      const t = row.trim();
      if (t.startsWith(COOKIE_PREFIX)) {
        const [k, v] = t.split('=');
        const convId = k.replace(COOKIE_PREFIX, '');
        try {
          const decoded = decodeURIComponent(v || '');
          const json = JSON.parse(decoded) as PackedConvCacheV1;
          if (json && json.v === 1 && json.m) {
            const mc: MessageCitations = {};
            Object.keys(json.m).forEach((mk) => (mc[mk] = unpackCitations(json.m[mk])));
            writeConvLS(convId, mc);
            convIds.push(convId);
          }
        } catch {
      // 清理缓存失败，忽略错误
    }
      }
    });
    // 清理已迁移的cookie，以及旧的全局大cookie
    convIds.forEach((id) => {
      document.cookie = `${COOKIE_PREFIX}${id}=; expires=${new Date(0).toUTCString()}; path=/; SameSite=Lax`;
    });
    document.cookie = `${LEGACY_CACHE_KEY}=; expires=${new Date(0).toUTCString()}; path=/; SameSite=Lax`;
  } catch {
    // 清理缓存失败
  }
}

/**
 * 清除指定对话的缓存
 * @param conversationId 对话ID
 */
export function clearConversationCache(conversationId: string) {
  try {
    localStorage.removeItem(`${LS_PREFIX}${conversationId}`);
    const key = getCookieKey(conversationId);
    document.cookie = `${key}=; expires=${new Date(0).toUTCString()}; path=/; SameSite=Lax`;
    // 清除对话缓存
  } catch {
    // 清除对话缓存失败
  }
}

/**
 * 批量保存消息引用信息（用于新消息流式处理完成时）
 * @param conversationId 对话ID
 * @param messages 消息数组
 */
export function batchSaveCitations(conversationId: string, messages: { role: string; citations?: Citation[] }[]) {
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
      // 批量保存引用信息
    }
  } catch {
    // 批量保存引用信息失败
  }
}
