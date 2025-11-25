import { generateSVG } from '../lib/drawer.js';
import { incrementD1Remote } from '../lib/db.js';
import { getGeoInfo } from '../lib/geo.js'; // 导入新模块

export default async function handler(req, res) {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const ua = req.headers['user-agent'] || 'Unknown';
  const hasDbConfig = !!process.env.CF_API_TOKEN;

  // 并行执行
  const [geo, viewCount] = await Promise.all([
     getGeoInfo(clientIp),
     hasDbConfig ? incrementD1Remote() : null
  ]);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(generateSVG(clientIp, geo, ua, viewCount));
}
