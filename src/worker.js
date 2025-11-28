import { generateSVG } from '../lib/drawer.js';
import { getGeoInfo } from '../lib/geo.js';

export default {
  async fetch(request, env, ctx) {
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-client-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'Unknown';
    const url = new URL(request.url);
    const showViews = url.searchParams.get('views') === 'true';
    
    let geo = null;
    
    // Cloudflare 原生支持
    if (request.cf && request.cf.city) {
        geo = {
            city: request.cf.city,
            country: request.cf.country,
            isp: request.cf.asOrganization || 'Cloudflare'
        };
    } 
    
    // EdgeOne 或其他环境降级支持
    if (!geo) {
        geo = await getGeoInfo(clientIp);
    }

    // 数据库逻辑
    let viewCount = null;
    if (showViews) {
        if (env.DB) { // Cloudflare 本地 D1
            try {
                const result = await env.DB.prepare("UPDATE visitors SET count = count + 1 WHERE id = 1 RETURNING count").first();
                viewCount = result ? result.count : 'ERR';
            } catch (e) { viewCount = 'ERR'; }
        } else if (env.CF_API_TOKEN) { // 远程 D1 (EdgeOne/Netlify)
             viewCount = await incrementD1RemoteWorker(env);
        } else {
            viewCount = 'N/A';
        }
    }

    const svg = generateSVG(clientIp, geo, ua, viewCount);
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Access-Control-Allow-Origin': '*' } });
  }
};

async function incrementD1RemoteWorker(env) {
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/d1/database/${env.CF_D1_DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: "UPDATE visitors SET count = count + 1 WHERE id = 1 RETURNING count", params: [] })
    });
    const d = await res.json();
    if (d.success) return d.result[0].results[0].count;
  } catch(e) {}
  return 'ERR';
}
