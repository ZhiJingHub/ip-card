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