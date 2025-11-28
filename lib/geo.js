/**
 * 多源 IP 地理信息获取 (包含 IP 类型与风险检测)
 */
export async function getGeoInfo(ip) {
  // 本地回环
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { city: 'Localhost', country: 'UN', isp: 'Loopback', type: 'Local', risk: 0 };
  }

  const sources = [
    // --- 源 1: ip-api.com (增加 mobile,proxy,hosting 字段) ---
    async () => {
      // fields=status,countryCode,city,isp,mobile,proxy,hosting
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,isp,mobile,proxy,hosting`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.status !== 'success') throw new Error('Status not success');
      
      // 分析类型与风险
      let type = 'Residential';
      let risk = 0;

      if (data.mobile) {
        type = 'Mobile Data';
        risk = 15; // 移动网络风险较低
      } else if (data.hosting) {
        type = 'Data Center';
        risk = 50; // 机房 IP 常用于代理，中等风险
      }

      if (data.proxy) {
        type = 'Proxy/VPN';
        risk = 90; // 明确检测到代理，高风险
      }

      return { city: data.city, country: data.countryCode, isp: data.isp, type, risk };
    },

    // --- 源 2: ipwho.is (支持详细的 Security 检测) ---
    async () => {
      const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (!data.success) throw new Error('Success false');

      let type = 'Residential';
      let risk = 0;
      
      // ipwho.is 返回的 connection.type 通常是 isp, hosting, business 等
      const connType = data.connection?.type || '';
      if (connType === 'hosting') {
        type = 'Data Center';
        risk = 50;
      } else if (connType === 'wireless') {
        type = 'Mobile Data';
        risk = 15;
      }

      // 安全检测
      if (data.security) {
        if (data.security.vpn || data.security.proxy || data.security.tor) {
          type = 'Proxy/VPN';
          risk = 95;
        }
      }

      return { city: data.city, country: data.country_code, isp: data.connection.isp, type, risk };
    },

    // --- 源 3: ipapi.co (兜底，信息较少) ---
    async () => {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.error) throw new Error('API Error');
      return { city: data.city, country: data.country_code, isp: data.org, type: 'ISP/Unknown', risk: 10 };
    }
  ];

  // 轮询尝试
  for (const fetcher of sources) {
    try {
      const result = await fetcher();
      if (result.city) return result;
    } catch (e) { continue; }
  }

  return { city: 'Unknown', country: 'UN', isp: 'Unknown', type: 'Unknown', risk: 0 };
}
