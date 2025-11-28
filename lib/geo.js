/**
 * 智能 IP 风险与类型分析系统
 */
function analyzeIpType(data) {
  let type = 'ISP';
  let risk = 0; // 0-100

  // 1. 基础字段检测 (API 返回的标记)
  if (data.mobile) { type = 'Mobile'; risk = 15; }
  else if (data.hosting) { type = 'Hosting'; risk = 50; }
  
  if (data.proxy) { type = 'Proxy/VPN'; risk = 90; }

  // 2. ISP 名称启发式分析 (Heuristic Analysis)
  // 很多免费 API 漏标 hosting，我们需要通过名字来补漏
  const ispName = (data.isp || data.org || '').toLowerCase();
  const keywords = [
    'cloud', 'data', 'hosting', 'vpn', 'proxy', 'server', 'solutions', 'datacenter',
    'digitalocean', 'linode', 'amazon', 'google', 'microsoft', 'azure', 'oracle', 
    'alibaba', 'tencent', 'choopa', 'iomart', 'hetzner', 'ovh', 'vultr'
  ];

  // 如果 ISP 名字里包含机房关键词，强制修正类型和风险
  if (keywords.some(k => ispName.includes(k))) {
    // 如果之前没被识别为 Proxy，现在至少标记为 Hosting
    if (type === 'ISP' || type === 'Mobile') {
      type = 'Data Center';
      risk = Math.max(risk, 60); // 机房 IP 风险基础分 60
    }
  }

  // 3. 修正风险等级显示
  // 比如教育网 IP (University) 风险极低
  if (ispName.includes('university') || ispName.includes('education')) {
    risk = Math.max(0, risk - 20);
  }

  return { type, risk: Math.min(100, Math.max(0, risk)) }; // 确保在 0-100 之间
}

export async function getGeoInfo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { city: 'Localhost', country: 'UN', isp: 'Loopback', type: 'Local', risk: 0 };
  }

  const sources = [
    // --- 源 1: ip-api.com ---
    async () => {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,isp,org,mobile,proxy,hosting`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.status !== 'success') throw new Error('Status not success');
      
      const analysis = analyzeIpType(data); // 调用智能分析
      return { city: data.city, country: data.countryCode, isp: data.isp, ...analysis };
    },
    
    // --- 源 2: ipwho.is ---
    async () => {
      const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (!data.success) throw new Error('Success false');

      // 预处理数据结构以适配分析函数
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
    
    // --- 源 3: ipapi.co ---
    async () => {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.error) throw new Error('API Error');
      
      // ipapi.co 免费版字段较少，主要靠名字分析
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
