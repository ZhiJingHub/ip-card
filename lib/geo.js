/**
 * 多源 IP 地理信息获取 (Failover 机制)
 * 适用于: Netlify, Vercel, Tencent EdgeOne
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 2000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

export async function getGeoInfo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { city: 'Localhost', country: 'UN', isp: 'Loopback' };
  }

  const sources = [
    // 源 1: ip-api.com (速度快)
    async () => {
      const res = await fetchWithTimeout(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,isp`, { timeout: 2000 });
      const data = await res.json();
      if (data.status !== 'success') throw new Error('Failed');
      return { city: data.city, country: data.countryCode, isp: data.isp };
    },
    // 源 2: ipwho.is (支持 HTTPS)
    async () => {
      const res = await fetchWithTimeout(`https://ipwho.is/${ip}`, { timeout: 2000 });
      const data = await res.json();
      if (!data.success) throw new Error('Failed');
      return { city: data.city, country: data.country_code, isp: data.connection.isp };
    },
    // 源 3: ipapi.co (兜底)
    async () => {
      const res = await fetchWithTimeout(`https://ipapi.co/${ip}/json/`, { timeout: 2000 });
      const data = await res.json();
      if (data.error) throw new Error('Failed');
      return { city: data.city, country: data.country_code, isp: data.org };
    }
  ];

  for (const fetcher of sources) {
    try {
      const result = await fetcher();
      if (result.city) return result;
    } catch (e) { continue; }
  }
  return { city: 'Unknown', country: 'UN', isp: 'Unknown' };
}
