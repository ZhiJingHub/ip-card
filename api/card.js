import { generateSVG } from '../lib/drawer.js';
import { incrementD1Remote } from '../lib/db.js';

export default async function handler(req, res) {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const ua = req.headers['user-agent'] || 'Unknown';

  // 智能检测：检查环境变量
  const hasDbConfig = !!process.env.CF_API_TOKEN;

  let geo = { city: 'Unknown', country: 'UN', isp: 'Vercel' };

  const [geoRes, viewCount] = await Promise.all([
     clientIp && clientIp !== '127.0.0.1' ? fetch(`http://ip-api.com/json/${clientIp}?fields=status,countryCode,city,isp`).then(r=>r.json()).catch(()=>({})) : {},
     hasDbConfig ? incrementD1Remote() : null
  ]);

  if(geoRes && geoRes.status === 'success') geo = { city: geoRes.city, country: geoRes.countryCode, isp: geoRes.isp };

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(generateSVG(clientIp, geo, ua, viewCount));
}