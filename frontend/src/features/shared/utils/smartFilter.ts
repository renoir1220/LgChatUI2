import type { DictionaryItem } from '../components/DictionarySelector';

/**
 * 匹配类型枚举（按优先级排序）
 */
enum MatchType {
  /** 客户名称完全匹配 */
  NAME_EXACT = 1,
  /** 客户名称前缀匹配 */
  NAME_PREFIX = 2,
  /** 拼音码完全匹配 */
  PINYIN_EXACT = 3,
  /** 拼音码前缀匹配 */
  PINYIN_PREFIX = 4,
  /** 客户名称包含匹配 */
  NAME_CONTAINS = 5,
  /** 拼音码包含匹配 */
  PINYIN_CONTAINS = 6,
  /** 无匹配 */
  NO_MATCH = 999
}

/**
 * 匹配结果
 */
interface MatchResult {
  item: DictionaryItem;
  matchType: MatchType;
  matchScore: number; // 匹配分数，用于细化排序
}

/**
 * 计算字符串匹配类型和分数
 * @param text 要匹配的文本
 * @param searchTerm 搜索词
 * @param isName 是否为客户名称（影响权重）
 */
function calculateMatch(text: string, searchTerm: string, isName: boolean = true): {
  matchType: MatchType;
  score: number;
} {
  const normalizedText = text.toLowerCase().trim();
  const normalizedTerm = searchTerm.toLowerCase().trim();

  if (!normalizedTerm) {
    return { matchType: MatchType.NO_MATCH, score: 0 };
  }

  // 完全匹配
  if (normalizedText === normalizedTerm) {
    return {
      matchType: isName ? MatchType.NAME_EXACT : MatchType.PINYIN_EXACT,
      score: 1000 / normalizedText.length, // 短的优先
    };
  }

  // 前缀匹配
  if (normalizedText.startsWith(normalizedTerm)) {
    return {
      matchType: isName ? MatchType.NAME_PREFIX : MatchType.PINYIN_PREFIX,
      score: 500 / normalizedText.length + (normalizedTerm.length / normalizedText.length) * 100,
    };
  }

  // 包含匹配
  if (normalizedText.includes(normalizedTerm)) {
    const position = normalizedText.indexOf(normalizedTerm);
    return {
      matchType: isName ? MatchType.NAME_CONTAINS : MatchType.PINYIN_CONTAINS,
      score: 100 / normalizedText.length + (normalizedTerm.length / normalizedText.length) * 50 - position,
    };
  }

  return { matchType: MatchType.NO_MATCH, score: 0 };
}

/**
 * 高级匹配：支持拼音首字母匹配
 * 例如："bj" 匹配 "beijing" 或包含 "bj" 的拼音
 * @param pyCode 拼音码
 * @param searchTerm 搜索词
 */
function calculateAdvancedPinyinMatch(pyCode: string, searchTerm: string): {
  matchType: MatchType;
  score: number;
} {
  const normalizedPyCode = pyCode.toLowerCase().trim();
  const normalizedTerm = searchTerm.toLowerCase().trim();

  if (!normalizedTerm) {
    return { matchType: MatchType.NO_MATCH, score: 0 };
  }

  // 先进行基本匹配
  const basicMatch = calculateMatch(normalizedPyCode, normalizedTerm, false);
  if (basicMatch.matchType !== MatchType.NO_MATCH) {
    return basicMatch;
  }

  // 拼音首字母匹配（如果拼音码包含空格或分隔符）
  const pinyinWords = normalizedPyCode.split(/[\s\-_]+/).filter(word => word.length > 0);
  
  if (pinyinWords.length > 1) {
    // 尝试首字母匹配
    const firstLetters = pinyinWords.map(word => word.charAt(0)).join('');
    if (firstLetters.includes(normalizedTerm)) {
      return {
        matchType: MatchType.PINYIN_CONTAINS,
        score: 80 / normalizedPyCode.length + (normalizedTerm.length / firstLetters.length) * 30,
      };
    }
  }

  return { matchType: MatchType.NO_MATCH, score: 0 };
}

/**
 * 智能过滤和排序客户字典
 * @param dictionaries 客户字典列表
 * @param searchTerm 搜索词
 * @param maxResults 最大返回结果数量
 */
export function smartFilterCustomers(
  dictionaries: DictionaryItem[],
  searchTerm: string,
  maxResults: number = 20
): DictionaryItem[] {
  if (!searchTerm.trim()) {
    // 无搜索词时，返回前N条数据，按客户名称排序
    return dictionaries
      .slice()
      .sort((a, b) => a.customerName.localeCompare(b.customerName))
      .slice(0, maxResults);
  }

  const normalizedTerm = searchTerm.toLowerCase().trim();
  const matchResults: MatchResult[] = [];

  // 计算每个客户的匹配结果
  for (const item of dictionaries) {
    // 客户名称匹配
    const nameMatch = calculateMatch(item.customerName, normalizedTerm, true);
    
    // 拼音码匹配（包括高级匹配）
    const pinyinMatch = calculateAdvancedPinyinMatch(item.pyCode, normalizedTerm);
    
    // 选择最佳匹配
    let bestMatch;
    if (nameMatch.matchType < pinyinMatch.matchType) {
      bestMatch = nameMatch;
    } else if (nameMatch.matchType > pinyinMatch.matchType) {
      bestMatch = pinyinMatch;
    } else {
      // 匹配类型相同，选择分数更高的
      bestMatch = nameMatch.score >= pinyinMatch.score ? nameMatch : pinyinMatch;
    }

    // 只保留有效匹配
    if (bestMatch.matchType !== MatchType.NO_MATCH) {
      matchResults.push({
        item,
        matchType: bestMatch.matchType,
        matchScore: bestMatch.score,
      });
    }
  }

  // 按匹配质量排序
  matchResults.sort((a, b) => {
    // 首先按匹配类型排序（数值越小优先级越高）
    if (a.matchType !== b.matchType) {
      return a.matchType - b.matchType;
    }
    
    // 相同匹配类型按分数排序（分数越高越好）
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }
    
    // 分数相同按客户名称排序
    return a.item.customerName.localeCompare(b.item.customerName);
  });

  // 返回排序后的结果，限制数量
  return matchResults.slice(0, maxResults).map(result => result.item);
}

/**
 * 获取匹配类型的描述（用于调试）
 */
export function getMatchTypeDescription(matchType: MatchType): string {
  switch (matchType) {
    case MatchType.NAME_EXACT:
      return '客户名称完全匹配';
    case MatchType.NAME_PREFIX:
      return '客户名称前缀匹配';
    case MatchType.PINYIN_EXACT:
      return '拼音码完全匹配';
    case MatchType.PINYIN_PREFIX:
      return '拼音码前缀匹配';
    case MatchType.NAME_CONTAINS:
      return '客户名称包含匹配';
    case MatchType.PINYIN_CONTAINS:
      return '拼音码包含匹配';
    default:
      return '无匹配';
  }
}