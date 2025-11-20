export function generateSVG(clientIp, geo, ua, viewCount = null) {
  // 1. 浏览器解析逻辑 (保持不变)
  const getVer = (s) => { if(!s)return''; const p=s.split('.'); return p.length>1?`${p[0]}.${p[1]}`:p[0]; };
  let browserInfo = 'Unknown Device';
  if (ua.includes('Edg/')) browserInfo = `Edge ${getVer(ua.match(/Edg\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browserInfo = `Chrome ${getVer(ua.match(/Chrome\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('Firefox/')) browserInfo = `Firefox ${getVer(ua.match(/Firefox\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('Safari/') && ua.includes('Version/')) browserInfo = `Safari ${getVer(ua.match(/Version\/([\d.]+)/)?.[1])}`;
  else if (ua.includes('iPhone')) browserInfo = 'iPhone Webview';
  else if (ua.includes('Android')) browserInfo = 'Android Webview';
  else browserInfo = ua.length > 20 ? ua.substring(0, 20) + '...' : ua;

  // 浏览量显示逻辑 (保持不变)
  const viewsText = viewCount !== null 
    ? `<text x="305" y="20" text-anchor="end" class="views">👀 ${viewCount}</text>` 
    : '';

  // 2. 返回 SVG (修复了 CSS 部分)
  return `
  <svg width="320" height="135" viewBox="0 0 320 135" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      /* 默认亮色模式 */
      .bg { fill: rgba(255, 255, 255, 0.9); stroke: rgba(255, 255, 255, 0.5); }
      .text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; fill: #333; font-size: 13px; }
      .label { font-weight: 600; fill: #007AFF; letter-spacing: 0.5px; }
      .title { font-weight: 700; font-size: 14px; fill: #111; }
      .views { font-size: 10px; fill: #999; font-family: monospace; font-weight: 500; }
      
      /* 深色模式适配 (已加强优先级) */
      @media (prefers-color-scheme: dark) {
        .bg { fill: rgba(30, 30, 30, 0.9) !important; stroke: rgba(255, 255, 255, 0.15) !important; }
        .text { fill: #E5E5EA !important; }
        .title { fill: #ffffff !important; }
        .label { fill: #0A84FF !important; }
        .views { fill: #aaaaaa !important; } /* 调亮了计数器的颜色 */
      }
    </style>
    <rect x="1" y="1" width="318" height="133" rx="14" class="bg" stroke-width="1"/>
    <rect x="1" y="1" width="6" height="133" rx="1" fill="#007AFF" opacity="0.8"/>
    
    ${viewsText}

    <g transform="translate(25, 28)">
        <text x="0" y="0" class="title">Network Identity</text>
        <text x="0" y="24" class="text"><tspan class="label">IP :</tspan> ${clientIp}</text>
        <text x="0" y="46" class="text"><tspan class="label">LOC:</tspan> ${geo.city}, ${geo.country}</text>
        <text x="0" y="68" class="text"><tspan class="label">ISP:</tspan> ${geo.isp}</text>
        <text x="0" y="90" class="text"><tspan class="label">DEV:</tspan> ${browserInfo}</text>
    </g>
  </svg>`;
}
