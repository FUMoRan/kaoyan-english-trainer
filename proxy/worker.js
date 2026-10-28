/**
 * 可选：Cloudflare Worker 代理（仅在服务商不允许浏览器直连时需要，例如智谱 GLM）。
 *
 * 部署：
 * 1. Cloudflare 控制台 → Workers → 创建 Worker，粘贴本文件。
 * 2. 在 Worker 的 Settings → Variables 里添加：
 *    UPSTREAM = https://open.bigmodel.cn/api/paas/v4
 *    API_KEY  = 你的密钥（只存这里，前端不需要填 Key）
 *    ALLOWED_ORIGIN = https://你的用户名.github.io
 * 3. 把 Worker 地址（https://xxx.workers.dev）填到网页「设置 → Base URL」。
 *
 * 智谱之外的厂商（Kimi / 通义 / 硅基流动 / OpenRouter）已允许网页直连，不需要这个。
 */
export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const upstream = (env.UPSTREAM || '').replace(/\/+$/, '');
    if (!upstream) {
      return new Response('UPSTREAM 未配置', { status: 500, headers: cors });
    }

    const incoming = new URL(request.url);
    const target = upstream + incoming.pathname;

    const headers = new Headers(request.headers);
    headers.set('host', new URL(upstream).host);
    if (env.API_KEY) headers.set('authorization', 'Bearer ' + env.API_KEY);
    headers.delete('origin');
    headers.delete('referer');

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
    });

    const out = new Headers(response.headers);
    Object.keys(cors).forEach(function (k) { out.set(k, cors[k]); });
    return new Response(response.body, { status: response.status, headers: out });
  }
};
