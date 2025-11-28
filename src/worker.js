import { generateSVG } from '../lib/drawer.js';

export default {
  async fetch(request, env, ctx) {
    const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'Unknown';
    const url = new URL(request.url);
    const showViews = url.searchParams.get('views') === 'true';
    
    // 1. 获取地理与风险信息 (Cloudflare 原生)
    let geo = { city: 'Unknown', country: 'UN', isp: 'Cloudflare', type: 'Unknown', risk: 0 };
    
    if (request.cf) {
        geo.city = request.cf.city || 'Unknown';
        geo.country = request.cf.country || 'UN';
        geo.isp = request.cf.asOrganization || 'Cloudflare'; // 获取 ASN 组织名

        // --- 风险与类型计算核心 ---
        const threatScore = request.cf.threatScore || 0; // CF 自带威胁评分
        const ispName = geo.isp.toLowerCase();
        
        // 类型判断
        if (ispName.includes('cloud') || ispName.includes('data') || ispName.includes('hosting')) {
            geo.type = 'Data Center';
        } else if (request.cf.isResidential) { // CF 可能提供此标记
            geo.type = 'Residential';
        } else {
            geo.type = 'ISP';
        }

        // 风险值综合计算 (CF评分 + 关键词权重)
        let risk = threatScore;
        
        // 关键词加权
        if (geo.type === 'Data Center') risk = Math.max(risk, 50);
        if (ispName.includes('vpn') || ispName.includes('proxy') || ispName.includes('tor')) {
            geo.type = 'Proxy/VPN';
            risk = Math.max(risk, 90);
        }

        geo.risk = Math.min(100, risk);
    }

    // 2. 数据库操作
    let viewCount = null;
    if (env.DB) {
        try {
            const result = await env.DB.prepare("UPDATE visitors SET count = count + 1 WHERE id = 1 RETURNING count").first();
            viewCount = result ? result.count : 'ERR';
        } catch (e) { viewCount = 'ERR'; }
    }

    const svg = generateSVG(clientIp, geo, ua, viewCount);

    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
