/* 大模型调用：OpenAI 兼容协议 + SSE 流式解析 + 中文错误映射 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const TIMEOUT_MS = 180000;

  function ApiError(message, detail) {
    this.name = 'ApiError';
    this.message = message;
    this.detail = detail || '';
    this.stack = new Error(message).stack;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function normalizeBase(url) {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  function authHeaders() {
    const s = App.store.getSettings();
    const h = { 'Content-Type': 'application/json' };
    if (s.apiKey) h.Authorization = 'Bearer ' + s.apiKey;
    if (s.provider === 'openrouter') {
      h['HTTP-Referer'] = location.origin || 'https://github.com';
      h['X-Title'] = 'kaoyan-english-trainer';
    }
    return h;
  }

  function mapHttpError(status, body) {
    const snippet = String(body || '').slice(0, 400);
    let msg;
    if (status === 401) msg = 'API Key 无效或已过期，请到「设置」里重新粘贴。';
    else if (status === 403) msg = '这个 Key 没有调用该模型的权限，或账户额度已用完。';
    else if (status === 402) msg = '账户余额不足，请先充值。';
    else if (status === 404) msg = '接口地址或模型名不对（404）。检查 Base URL 是否填到 /v1 为止、模型名是否拼写一致。';
    else if (status === 413) msg = '图片或请求体积过大，换一张压缩后的照片再试。';
    else if (status === 429) msg = '请求太频繁或超出限额，等半分钟再试。';
    else if (status >= 500) msg = '服务商那边出错了（' + status + '），稍后重试。';
    else msg = '请求失败（HTTP ' + status + '）。';
    return new ApiError(msg, snippet);
  }

  async function readStream(res, onDelta, signal) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let full = '';
    while (true) {
      if (signal && signal.aborted) {
        reader.cancel().catch(function () {});
        throw new ApiError('已停止生成。');
      }
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line || line.charAt(0) === ':') continue;
        if (line.indexOf('data:') !== 0) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const choice = (json.choices || [])[0] || {};
          const part = (choice.delta && choice.delta.content) || '';
          if (part) {
            full += part;
            onDelta(part, full);
          }
        } catch (e) {
          /* 单个分片解析失败不影响整体 */
        }
      }
    }
    return full;
  }

  function pickContent(payload) {
    const choice = (payload.choices || [])[0] || {};
    const content = (choice.message && choice.message.content) || '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(function (p) { return p && p.text ? p.text : ''; }).join('');
    }
    return '';
  }

  async function chat(options) {
    const settings = App.store.getSettings();
    if (!String(settings.apiKey || '').trim()) {
      throw new ApiError('还没填 API Key，点右上角「设置」选服务商并填入 Key。');
    }
    if (!normalizeBase(settings.baseURL) || !String(settings.model || '').trim()) {
      throw new ApiError('Base URL 或模型名为空，请到「设置」里补齐。');
    }

    const external = options.signal;
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener('abort', function () { controller.abort(); });
    }

    const url = normalizeBase(settings.baseURL) + '/chat/completions';
    const body = {
      model: settings.model,
      messages: options.messages,
      temperature: 0.3,
      stream: !!settings.stream
    };

    try {
      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } catch (err) {
        if (err && err.name === 'AbortError') {
          if (external && external.aborted) throw new ApiError('已停止生成。');
          throw new ApiError('请求超时了（3 分钟），换成更短的段落或稍后再试。');
        }
        throw new ApiError(
          '浏览器连不上这个接口，最常见的原因是跨域被拦或网络不通。',
          '可以先点「设置 → 测试连接」。如果报 CORS，说明该服务商不允许网页直连，需要自建代理（仓库 proxy/worker.js）。原始错误：' + (err && err.message ? err.message : err)
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(function () { return ''; });
        throw mapHttpError(res.status, text);
      }

      if (!settings.stream || !res.body) {
        const json = await res.json();
        const text = pickContent(json);
        if (!text) throw new ApiError('接口返回了空内容，换个模型试试。');
        if (options.onDelta) options.onDelta(text, text);
        return text;
      }

      let full;
      try {
        full = await readStream(res, options.onDelta || function () {}, controller.signal);
      } catch (err) {
        if (err && err.name === 'AbortError') {
          if (external && external.aborted) throw new ApiError('已停止生成。');
          throw new ApiError('读取响应超时，稍后再试一次。');
        }
        throw err;
      }
      if (!full.trim()) throw new ApiError('接口没有返回内容，可能是模型不支持视觉或触发了内容过滤。');
      return full;
    } finally {
      clearTimeout(timer);
    }
  }

  async function testConnection() {
    const settings = App.store.getSettings();
    if (!String(settings.apiKey || '').trim()) {
      throw new ApiError('先填入 API Key 才能测试。');
    }
    const url = normalizeBase(settings.baseURL) + '/models';
    let res;
    try {
      res = await fetch(url, { headers: authHeaders() });
    } catch (err) {
      throw new ApiError(
        '连不上接口，大概率是跨域或网络问题。',
        '如果是智谱或自建代理，确认代理已允许跨域。原始错误：' + (err && err.message ? err.message : err)
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new ApiError('Key 无效或没有权限（HTTP ' + res.status + '）。');
    }
    if (res.status === 404) {
      return '接口可达，但该服务不支持 /models 探测，直接开始生成即可。';
    }
    if (!res.ok) {
      throw mapHttpError(res.status, await res.text().catch(function () { return ''; }));
    }
    let count = '';
    try {
      const json = await res.json();
      const models = (json.data || json.models || []);
      if (models.length) count = '，可见 ' + models.length + ' 个模型';
    } catch (e) { /* 忽略 */ }
    return '连接正常' + count + '。';
  }

  App.api = { chat: chat, testConnection: testConnection, ApiError: ApiError };
})(window.App);
