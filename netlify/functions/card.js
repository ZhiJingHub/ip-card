import { generateSVG } from '../../lib/drawer.js';
import { incrementD1Remote } from '../../lib/db.js';
import { getGeoInfo } from '../../lib/geo.js'; // 导入新模块

export const handler = async (event, context) => {
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '127.0.0.1';
  const ua = event.headers['user-agent'] || 'Unknown';
  
  // 智能检测：如果有 CF_API_TOKEN 环境变量，说明配置了数据库
  const hasDbConfig = !!process.env.CF_API_TOKEN;

  // 并行执行：智能 Geo 获取 + 数据库更新
  const [geo, viewCount] = await Promise.all([
    getGeoInfo(clientIp), 
    hasDbConfig ? incrementD1Remote() : null
  ]);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    body: generateSVG(clientIp, geo, ua, viewCount)
  };
};
