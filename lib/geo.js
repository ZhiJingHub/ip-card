/**
 * 智能 IP 风险与类型分析系统
 * 通过 ISP 名称关键词修正 API 的误报
 */
function analyzeIpType(data) {
  let type = 'ISP'; // 默认为家庭宽带
  let risk = 0;     // 0-100

  // 1. API 基础字段检测
  if (data.mobile) { type = 'Mobile'; risk = 15; }
  else if (data.hosting) { type = 'Hosting'; risk = 50; }
  
  if (data.proxy) { type = 'Proxy/VPN'; risk = 90; }

  // 2. ISP 名称关键词启发式分析 (Heuristic Analysis)
  // 这是提升准确度的关键：很多机房 IP 没被标记，但名字出卖了它
  const ispName = (data.isp || data.org || '').toLowerCase();
  const keywords = [
    'cloud', 'data', 'hosting', 'vpn', 'proxy', 'server', 'solutions', 'datacenter', 'cdn',
    'digitalocean', 'linode', 'amazon', 'google', 'microsoft', 'azure', 'oracle', 
    'alibaba', 'tencent', 'choopa', 'iomart', 'hetzner', 'ovh', 'vultr', 'fastly', 'cloudflare'
  ];

  if (keywords.some(k => ispName.includes(k))) {
    // 只要名字像机房，就至少标记为 Hosting，风险值拉高
    if (type === 'ISP' || type === 'Mobile') {
      type = 'Data Center';
      risk = Math.max(risk, 60);
    }
  }

  // 3. 教育网白名单 (降低误判)
  if (ispName.includes('university') || ispName.includes('education') || ispName.includes('school')) {
    if (risk < 90) risk = 0; // 只要不是明确的代理，学校 IP 视为低风险
  }

  return { type, risk: Math.min(100, Math.max(0, risk)) };
}

export async function getGeoInfo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { city: 'Localhost', country: 'UN', isp: 'Loopback', type: 'Local', risk: 0 };
  }

  const sources = [
    // 源 1: ip-api.com (字段最全)
    async () => {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,isp,org,mobile,proxy,hosting`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.status !== 'success') throw new Error('Failed');
      
      const analysis = analyzeIpType(data); 
      return { city: data.city, country: data.countryCode, isp: data.isp, ...analysis };
    },
    
    // 源 2: ipwho.is (备用，支持安全检测)
    async () => {
      const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (!data.success) throw new Error('Failed');

      const analysisInput = {
        mobile: data.connection?.type === 'wireless',
        hosting: data.connection?.type === 'hosting',
        proxy: data.security?.vpn || data.security?.proxy || data.security?.tor,
        isp: data.connection?.isp,
        org: data.connection?.org
      };
      
      const analysis = analyzeIpType(analysisInput);
      return { city: data.city, country: data.country_code, isp: data.connection.isp, ...analysis };
    },

    // 源 3: ipapi.co (兜底)
    async () => {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.error) throw new Error('Failed');
      
      const analysis = analyzeIpType({ isp: data.org });
      return { city: data.city, country: data.country_code, isp: data.org, ...analysis };
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
