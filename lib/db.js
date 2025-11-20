// lib/db.js
export async function incrementD1Remote() {
  // 从环境变量读取配置
  const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
  const DB_ID = process.env.CF_D1_DB_ID;
  const TOKEN = process.env.CF_API_TOKEN;

  if (!ACCOUNT_ID || !DB_ID || !TOKEN) return 'N/A'; // 未配置则显示 N/A

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;
  const sql = "UPDATE visitors SET count = count + 1 WHERE id = 1 RETURNING count";

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sql, params: [] })
    });
    const result = await response.json();
    // 提取结果
    if (result.success && result.result && result.result[0].results.length > 0) {
      return result.result[0].results[0].count;
    }
  } catch (e) { console.error("D1 REST Error:", e); }
  return 'ERR';
}