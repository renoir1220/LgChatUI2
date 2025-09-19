
// /frontend/src/utils/client-info.ts

export interface ClientInfo {
  clientType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  clientPlatform: string;
  clientBrowser: string;
  userAgent: string;
}

/**
 * Parses the navigator.userAgent string to extract client information.
 * This is a lightweight implementation without external dependencies.
 * @returns {ClientInfo} An object containing client information.
 */
export function getClientInfo(): ClientInfo {
  const ua = navigator.userAgent;

  let clientBrowser = 'unknown';
  let clientPlatform = 'unknown';
  let clientType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';

  // 浏览器检测
  if (ua.includes('Firefox')) {
    clientBrowser = 'Firefox';
  } else if (ua.includes('SamsungBrowser')) {
    clientBrowser = 'Samsung Browser';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    clientBrowser = 'Opera';
  } else if (ua.includes('Edge') || ua.includes('Edg')) {
    clientBrowser = 'Edge';
  } else if (ua.includes('Chrome')) {
    clientBrowser = 'Chrome';
  } else if (ua.includes('Safari')) {
    clientBrowser = 'Safari';
  }

  // 平台检测
  if (ua.includes('Windows NT')) {
    clientPlatform = 'Windows';
  } else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
    clientPlatform = 'macOS';
  } else if (ua.includes('Android')) {
    clientPlatform = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    clientPlatform = 'iOS';
  } else if (ua.includes('Linux')) {
    clientPlatform = 'Linux';
  }

  // 设备类型检测
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/.test(ua.toLowerCase())) {
    clientType = 'tablet';
  } else if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop|kindle|silk-accelerated/.test(ua.toLowerCase())) {
    clientType = 'mobile';
  } else {
    clientType = 'desktop';
  }

  return {
    clientType,
    clientPlatform,
    clientBrowser,
    userAgent: ua,
  };
}
