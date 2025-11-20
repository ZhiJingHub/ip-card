# 🌐 Universal IP Info Card

<div align="center">

![License](https://img.shields.io/github/license/ZhiJingHub/ip-card?style=flat-square)
![Language](https://img.shields.io/badge/language-Node.js-green?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Netlify%20%7C%20Vercel%20%7C%20Cloudflare-blue?style=flat-square)

**一个自适应全平台（Netlify / Vercel / Cloudflare）的动态网络信息签名卡片。**
<br>
支持 IPv4/IPv6 双栈检测、浏览器版本识别、地理位置显示，以及可选的浏览量统计功能。

[查看演示 (Demo)](https://github.com/ZhiJingHub/ip-card) · [报告问题](https://github.com/ZhiJingHub/ip-card/issues)

</div>

---

## ✨ 特性 (Features)

* 🎨 **精美 UI**：采用 Glassmorphism（毛玻璃）风格设计的 SVG 卡片，支持深色模式自动切换。
* 🚀 **全平台适配**：一套代码同时兼容 Netlify Functions, Vercel Serverless, Cloudflare Workers。
* 🕵️ **深度检测**：
    * **IP 识别**：支持 IPv4 和 IPv6 自动适配排版。
    * **设备识别**：精准解析浏览器名称及版本（Chrome, Edge, Safari, Firefox 等）。
    * **位置识别**：显示城市、国家及 ISP 运营商信息。
* 🔢 **智能计数器**：(可选) 支持接入 Cloudflare D1 数据库，自动开启个人主页访问量统计。
* 🛡️ **隐私安全**：无数据库模式下不记录任何用户日志，仅做实时渲染。

## 🚀 快速部署 (Quick Deploy)

无需复杂的配置，点击下方按钮即可将本项目部署到你喜欢的平台。

| 平台 (Platform) | 部署按钮 (Click to Deploy) | 推荐理由 |
| :--- | :--- | :--- |
| **Netlify** | [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ZhiJingHub/ip-card) | 🌟 **首选**。零配置，全自动识别。 |
| **Vercel** | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ZhiJingHub/ip-card) | 🌍 全球 CDN 节点，极其稳定。 |
| **Cloudflare** | [![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ZhiJingHub/ip-card) | ⚡️ **速度最快** (Edge Network)。 |

> **部署完成后**：访问你的域名，即可看到自带的**代码生成器面板**，一键生成 Markdown/HTML 代码。

---

## ⚙️ 进阶配置：开启浏览量统计 (可选)

默认情况下，卡片右上角不会显示浏览量。如果你希望开启 `👀` 计数功能，请按照以下步骤配置。

### 1. 准备数据库

在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 创建一个 D1 数据库（例如命名为 `ip-card-db`），并在 Console 中执行以下 SQL 初始化表：

```sql
CREATE TABLE IF NOT EXISTS visitors (id INTEGER PRIMARY KEY, count INTEGER DEFAULT 0);

INSERT OR IGNORE INTO visitors (id, count) VALUES (1, 0);
```
### 2.配置环境变量

本项目采用智能检测机制：检测到环境变量即自动开启计数功能。请根据你的平台选择配置方式：

## 🔵 方案 A：Netlify / Vercel 用户

请在部署平台的后台（Settings -> Environment Variables）添加以下 3 个变量。

| 变量名 (Variable) | 必填 (Required) | 示例 (Example) | 说明 / 获取方式 (Description) |
| :--- | :--- | :--- | :--- |
| `CF_ACCOUNT_ID` | ✅ 是 | `8f8d85...` | Cloudflare 控制台首页右下角或 URL 中获取 |
| `CF_D1_DB_ID` | ✅ 是 | `48b6...` | D1 数据库详情页显示的 **Database ID** (UUID) |
| `CF_API_TOKEN` | ✅ 是 | `X9s7f1...` | `My Profile` -> `API Tokens` (需创建有 **D1 Edit** 权限的 Token) |

## 🟠 方案 B：Cloudflare Workers 用户

Cloudflare 原生支持 D1 绑定，不需要设置上述环境变量。

你只需要修改项目根目录下的 wrangler.toml 文件，将 database_id 替换为你真实的 ID：

```
[[d1_databases]]
binding = "DB"
database_name = "ip-card-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # <--- 在这里填入你的数据库 ID
```

修改后，运行 wrangler deploy 重新部署即可。

## 📖 API 使用

服务部署后，直接访问以下路径即可获取图片：

```
GET /ip-card
```

参数说明：
| 参数 (Parameter) | 必填 (Required) | 说明 (Description) |
| :--- | :--- | :--- |
| `t` | ❌ 否 (Optional) | **时间戳**。建议在 URL 后添加 `?t={时间戳}` 以防止 GitHub/浏览器缓存旧图片。 |
| `views` | 🔧 仅调试 (Debug) | **强制显示计数**。正常情况下由环境变量自动控制。手动添加 `?views=true` 可强制开启 UI 显示（若无数据库连接则显示 `N/A`）。 |

Markdown 示例：

```
![IP Card](https://your-domain.com/ip-card)
```

## 🛠️ 本地开发

如果你想在本地修改代码：

1. **克隆仓库**

```bash
git clone [https://github.com/ZhiJingHub/ip-card.git](https://github.com/ZhiJingHub/ip-card.git)
cd ip-card
```
2. **安装依赖 (仅 Netlify/Vercel 需要依赖，Cloudflare 原生支持)**

```
npm install
```
3. **本地运行**

| 平台 (Platform) | 启动命令 (Run Command) |
| :--- | :--- |
| **Netlify** | `netlify dev` |
| **Vercel** | `vercel dev` |
| **Cloudflare** | `npx wrangler dev` |
   
## 📄 开源协议

本项目遵循 MIT License 协议。欢迎 Fork 和 Star！⭐
