// lib/geo.js

/**
 * 多源 IP 地理信息获取 (Failover 机制)
 * 依次尝试多个免费 API，直到获取成功
 */
export async function getGeoInfo(ip) {
  // 本地回环地址直接返回
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { city: 'Localhost', country: 'UN', isp: 'Loopback' };
  }

  // 定义多个数据源及其解析规则
  const sources = [
    // --- 源 1: ip-api.com (速度快，无 HTTPS) ---
    async () => {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,isp`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.status !== 'success') throw new Error('Status not success');
      return { city: data.city, country: data.countryCode, isp: data.isp };
    },

    // --- 源 2: ipwho.is (支持 HTTPS，备用) ---
    async () => {
      const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (!data.success) throw new Error('Success false');
      return { city: data.city, country: data.country_code, isp: data.connection.isp };
    },

    // --- 源 3: ipapi.co (数据准，但限流严) ---
    async () => {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.error) throw new Error('API Error');
      return { city: data.city, country: data.country_code, isp: data.org };
    }
  ];

  // 轮询尝试
  for (const fetcher of sources) {
    try {
      const result = await fetcher();
      if (result.city && result.country) return result;
    } catch (e) {
      // 当前源失败，静默尝试下一个
      continue;
    }
  }

  // 全部失败的兜底
  return { city: 'Unknown', country: 'UN', isp: 'Unknown' };
}