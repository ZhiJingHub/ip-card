export function generateSVG(clientIp, geo, ua, viewCount = null) {
  // 1. 浏览器解析
  const getVer = (s) => { if(!s)return''; const p=s.split('.'); return p.length>1?`${p[0]}.${p[1]}`:p[0]; };
  let browserInfo = 'Unknown';
  if (ua.includes('Edg/')) browserInfo = `Edge ${getVer(ua.match(/Edg\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browserInfo = `Chrome ${getVer(ua.match(/Chrome\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('Firefox/')) browserInfo = `Firefox ${getVer(ua.match(/Firefox\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('Safari/') && ua.includes('Version/')) browserInfo = `Safari ${getVer(ua.match(/Version\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('iPhone')) browserInfo = 'iPhone';
  else if (ua.includes('Android')) browserInfo = 'Android';
  else browserInfo = ua.length > 20 ? ua.substring(0, 20) + '...' : ua;

  // 2. 浏览量
  const viewsText = viewCount !== null ? `<text x="305" y="20" text-anchor="end" class="views">👀 ${viewCount}</text>` : '';

  // 3. 风险值可视化逻辑
  const risk = geo.risk || 0;
  let riskColor = '#34c759'; // 🟢 绿色 (安全)
  if (risk > 80) riskColor = '#ff3b30'; // 🔴 红色 (危险)
  else if (risk > 40) riskColor = '#ffcc00'; // 🟡 黄色 (中等)

  // 进度条宽度计算
  const barWidth = 60;
  const progress = (risk / 100) * barWidth; 

  // 卡片高度增加到 155px 以容纳第 5 行
  return `
  <svg width="320" height="155" viewBox="0 0 320 155" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      .bg { fill: rgba(255, 255, 255, 0.9); stroke: rgba(255, 255, 255, 0.5); }
      .text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; fill: #333; font-size: 13px; }
      .label { font-weight: 600; fill: #007AFF; letter-spacing: 0.5px; }
      .title { font-weight: 700; font-size: 14px; fill: #111; }
      .views { font-size: 10px; fill: #999; font-family: monospace; font-weight: 500; }
      @media (prefers-color-scheme: dark) {
        .bg { fill: rgba(30, 30, 30, 0.9) !important; stroke: rgba(255, 255, 255, 0.15) !important; }
        .text { fill: #E5E5EA !important; }
        .title { fill: #ffffff !important; }
        .label { fill: #0A84FF !important; }
        .views { fill: #aaaaaa !important; }
      }
    </style>
    
    <rect x="1" y="1" width="318" height="153" rx="14" class="bg" stroke-width="1"/>
    <rect x="1" y="1" width="6" height="153" rx="1" fill="#007AFF" opacity="0.8"/>
    ${viewsText}

    <g transform="translate(25, 28)">
        <text x="0" y="0" class="title">Network Identity</text>
        <text x="0" y="24" class="text"><tspan class="label">IP :</tspan> ${clientIp}</text>
        <text x="0" y="46" class="text"><tspan class="label">LOC:</tspan> ${geo.city}, ${geo.country}</text>
        <text x="0" y="68" class="text"><tspan class="label">ISP:</tspan> ${geo.isp}</text>
        <text x="0" y="90" class="text"><tspan class="label">DEV:</tspan> ${browserInfo}</text>
        
        <text x="0" y="112" class="text">
           <tspan class="label">TYPE:</tspan> ${geo.type}
        </text>

        <g transform="translate(170, 107)">
            <text x="0" y="5" class="label" font-size="11px">RISK:</text>
            <rect x="38" y="-2" width="${barWidth}" height="${barHeight}" rx="3" fill="rgba(150,150,150,0.2)"/>
            <rect x="38" y="-2" width="${progress}" height="6" rx="3" fill="${riskColor}"/>
            <text x="${38 + barWidth + 6}" y="5" class="text" font-size="11px" font-weight="bold" fill="${riskColor}">${risk}%</text>
        </g>
    </g>
  </svg>`;
}
