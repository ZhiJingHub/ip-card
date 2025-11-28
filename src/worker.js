import { generateSVG } from '../lib/drawer.js';
import { getGeoInfo } from '../lib/geo.js'; // 备用

export default {
  async fetch(request, env, ctx) {
    // 兼容 EdgeOne/CF/标准代理的 IP 获取
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-client-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'Unknown';
    const url = new URL(request.url);
    const showViews = url.searchParams.get('views') === 'true';
    
    let geo = null;
    
    // 优先使用 Cloudflare 原生数据 (速度+准确度 Max)
    if (request.cf && request.cf.city) {
        geo = {
            city: request.cf.city,
            country: request.cf.country,
            isp: request.cf.asOrganization || 'Cloudflare',
            type: 'Unknown',
            risk: 0
        };
        
        // 核心：CF 威胁评分 + 关键词修正
        const threatScore = request.cf.threatScore || 0;
        const ispName = geo.isp.toLowerCase();
        
        // 类型判断
        if (ispName.includes('cloud') || ispName.includes('data') || ispName.includes('hosting')) {
            geo.type = 'Data Center';
        } else if (request.cf.isResidential) {
            geo.type = 'Residential';
        } else {
            geo.type = 'ISP';
        }

        // 风险计算
        let risk = threatScore;
        if (geo.type === 'Data Center') risk = Math.max(risk, 50); // 机房起步 50分
        if (ispName.includes('vpn') || ispName.includes('proxy') || ispName.includes('tor')) {
            geo.type = 'Proxy/VPN';
            risk = Math.max(risk, 90); // 代理起步 90分
        }
        geo.risk = Math.min(100, risk);
    } 
    
    // 降级方案：调用通用 API (用于 EdgeOne / 本地测试)
    if (!geo) {
        geo = await getGeoInfo(clientIp);
    }

    // 数据库逻辑
    let viewCount = null;
    if (showViews) {
        if (env.DB) { // 本地 D1
            try {
                const result = await env.DB.prepare("UPDATE visitors SET count = count + 1 WHERE id = 1 RETURNING count").first();
                viewCount = result ? result.count : 'ERR';
            } catch (e) { viewCount = 'ERR'; }
        } else if (env.CF_API_TOKEN) { // 远程 D1
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
  /* 远程数据库调用逻辑，保持简洁略去，与之前相同 */
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
