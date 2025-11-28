import { generateSVG } from '../lib/drawer.js';

export default {
  async fetch(request, env, ctx) {
    const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'Unknown';
    
    // 1. 获取地理位置
    let geo = { city: 'Unknown', country: 'UN', isp: 'Cloudflare' };
    if (request.cf) {
        geo.city = request.cf.city || 'Unknown';
        geo.country = request.cf.country || 'UN';
        geo.isp = request.cf.asOrganization || 'Cloudflare';
    }

    // 2. 智能检测数据库绑定 (env.DB)
    let viewCount = null;
    if (env.DB) {
        try {
            // 只要绑定了 DB，就尝试更新并获取数据
            const result = await env.DB.prepare("UPDATE visitors SET count = count + 1 WHERE id = 1 RETURNING count").first();
            viewCount = result ? result.count : 'ERR';
        } catch (e) {
            viewCount = 'ERR'; // 绑定了但查询失败
        }
    }
    // 如果没有 env.DB，viewCount 保持为 null，drawer.js 会自动隐藏它

    const svg = generateSVG(clientIp, geo, ua, viewCount);

    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Access-Control-Allow-Origin': '*' }
    });
  }
};