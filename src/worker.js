import { generateSVG } from '../lib/drawer.js';
import { getGeoInfo } from '../lib/geo.js';

export default {
  async fetch(request, env, ctx) {
    // 1. 获取真实 IP (自动兼容所有平台)
    const clientIp = request.headers.get('cf-connecting-ip') // Cloudflare
                  || request.headers.get('x-client-ip')      // EdgeOne / Aliyun
                  || request.headers.get('x-forwarded-for')  // Standard Proxy
                  || '127.0.0.1';
    
    const ua = request.headers.get('user-agent') || 'Unknown';
    const url = new URL(request.url);
    const showViews = url.searchParams.get('views') === 'true';
    
    // 2. 智能地理位置 (Cloudflare 优先，其他平台兜底)
    let geo = null;
    if (request.cf && request.cf.city) {
        // Cloudflare 环境：直接用原生数据，零延迟
        geo = {
            city: request.cf.city,
            country: request.cf.country,
            isp: request.cf.asOrganization || 'Cloudflare'
        };
    } else {
        // EdgeOne 环境：调用通用 API 查询
        geo = await getGeoInfo(clientIp);
    }

    // 3. 智能数据库 (本地绑定优先，远程 API 兜底)
    let viewCount = null;
    if (showViews) {
        if (env.DB) { 
            // Cloudflare D1 本地绑定
            try {
                const result = await env.DB.prepare("UPDATE visitors SET count = count + 1 WHERE id = 1 RETURNING count").first();
                viewCount = result ? result.count : 'ERR';
            } catch (e) { viewCount = 'ERR'; }
        } 
        else if (env.CF_API_TOKEN) { 
             // 远程 API (EdgeOne / Netlify 等)
             viewCount = await incrementD1RemoteWorker(env);
        } 
        else {
            viewCount = 'N/A';
        }
    }

    const svg = generateSVG(clientIp, geo, ua, viewCount);
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Access-Control-Allow-Origin': '*' } });
  }
};

// 辅助函数：Worker 环境下的远程数据库调用
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