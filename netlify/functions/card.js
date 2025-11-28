// netlify/functions/card.js
import { generateSVG } from '../../lib/drawer.js';
import { incrementD1Remote } from '../../lib/db.js';
import { getGeoInfo } from '../../lib/geo.js'; // 必须引入

export const handler = async (event, context) => {
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '127.0.0.1';
  const ua = event.headers['user-agent'] || 'Unknown';
  const hasDbConfig = !!process.env.CF_API_TOKEN;

  const [geo, viewCount] = await Promise.all([
    getGeoInfo(clientIp), // 这里会进行智能风险分析
    hasDbConfig ? incrementD1Remote() : null
  ]);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    body: generateSVG(clientIp, geo, ua, viewCount)
  };
};
