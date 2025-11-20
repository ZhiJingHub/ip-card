import { generateSVG } from '../../lib/drawer.js';
import { incrementD1Remote } from '../../lib/db.js';

export const handler = async (event, context) => {
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '127.0.0.1';
  const ua = event.headers['user-agent'] || 'Unknown';

  // 智能检测：如果有 CF_API_TOKEN 环境变量，说明配置了数据库，自动开启计数
  const hasDbConfig = !!process.env.CF_API_TOKEN;

  let geo = { city: 'Unknown', country: 'UN', isp: 'Netlify' };

  // 并行请求：查IP + (如果配了数据库就查数据库)
  const [geoRes, viewCount] = await Promise.all([
    clientIp !== '127.0.0.1' ? fetch(`http://ip-api.com/json/${clientIp}?fields=status,countryCode,city,isp`).then(r=>r.json()).catch(()=>({})) : {},
    hasDbConfig ? incrementD1Remote() : null // 没配数据库直接返回 null
  ]);

  if(geoRes && geoRes.status === 'success') geo = { city: geoRes.city, country: geoRes.countryCode, isp: geoRes.isp };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    body: generateSVG(clientIp, geo, ua, viewCount)
  };
};