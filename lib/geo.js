/**
 * 兼容性辅助函数：带超时的 fetch
 * (解决 Node 16及以下版本不支持 AbortSignal.timeout 的问题)
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 2000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
}

/**
 * 智能 IP 风险与类型分析系统
 */
function analyzeIpType(data) {
  let type = 'ISP'; 
  let risk = 0;

  if (data.mobile) { type = 'Mobile'; risk = 15; }
  else if (data.hosting) { type = 'Hosting'; risk = 50; }
  
  if (data.proxy) { type = 'Proxy/VPN'; risk = 90; }

  const ispName = (data.isp || data.org || '').toLowerCase();
  const keywords = [
    'cloud', 'data', 'hosting', 'vpn', 'proxy', 'server', 'solutions', 'datacenter', 'cdn',
    'digitalocean', 'linode', 'amazon', 'google', 'microsoft', 'azure', 'oracle', 
    'alibaba', 'tencent', 'choopa', 'iomart', 'hetzner', 'ovh', 'vultr', 'fastly', 'cloudflare'
  ];

  if (keywords.some(k => ispName.includes(k))) {
    if (type === 'ISP' || type === 'Mobile') {
      type = 'Data Center';
      risk = Math.max(risk, 60);
    }
  }

  if (ispName.includes('university') || ispName.includes('education') || ispName.includes('school')) {
    if (risk < 90) risk = 0;
  }

  return { type, risk: Math.min(100, Math.max(0, risk)) };
}

export async function getGeoInfo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { city: 'Localhost', country: 'UN', isp: 'Loopback', type: 'Local', risk: 0 };
  }

  const sources = [
    // 源 1: ip-api.com
    async () => {
      const res = await fetchWithTimeout(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,isp,org,mobile,proxy,hosting`, { timeout: 2000 });
      const data = await res.json();
      if (data.status !== 'success') throw new Error('Failed');
      return { city: data.city, country: data.countryCode, isp: data.isp, ...analyzeIpType(data) };
    },
    
    // 源 2: ipwho.is
    async () => {
      const res = await fetchWithTimeout(`https://ipwho.is/${ip}`, { timeout: 2000 });
      const data = await res.json();
      if (!data.success) throw new Error('Failed');
      return { 
        city: data.city, country: data.country_code, isp: data.connection.isp, 
        ...analyzeIpType({
          mobile: data.connection?.type === 'wireless',
          hosting: data.connection?.type === 'hosting',
          proxy: data.security?.vpn || data.security?.proxy || data.security?.tor,
          isp: data.connection?.isp, org: data.connection?.org
        }) 
      };
    },

    // 源 3: ipapi.co
    async () => {
      const res = await fetchWithTimeout(`https://ipapi.co/${ip}/json/`, { timeout: 2000 });
      const data = await res.json();
      if (data.error) throw new Error('Failed');
      return { city: data.city, country: data.country_code, isp: data.org, ...analyzeIpType({ isp: data.org }) };
    }
  ];

  for (const fetcher of sources) {
    try {
      const result = await fetcher();
      if (result.city) return result;
    } catch (e) { continue; }
  }
  return { city: 'Unknown', country: 'UN', isp: 'Unknown', type: 'Unknown', risk: 0 };
}
