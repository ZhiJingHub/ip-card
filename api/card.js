import { generateSVG } from '../lib/drawer.js';
import { incrementD1Remote } from '../lib/db.js';
import { getGeoInfo } from '../lib/geo.js'; // 引入新文件

export default async function handler(req, res) {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const ua = req.headers['user-agent'] || 'Unknown';
  const hasDbConfig = !!process.env.CF_API_TOKEN;

  const [geo, viewCount] = await Promise.all([
     getGeoInfo(clientIp),
     hasDbConfig ? incrementD1Remote() : null
  ]);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(generateSVG(clientIp, geo, ua, viewCount));
}
