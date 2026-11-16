/* Markdown 渲染与固定小标题切分 */
window.App = window.App || {};

(function (App) {
  'use strict';

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function render(md) {
    const text = String(md || '').trim();
    if (!text) return '';
    if (!window.marked) return '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
    const html = window.marked.parse(text, { breaks: true, gfm: true });
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(html, {
        FORBID_TAGS: ['style', 'form', 'input', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick']
      });
    }
    return html;
  }

  /* 按 "## 标题" 切分，便于把每个部分渲染成独立卡片 */
  function sections(md) {
    const lines = String(md || '').split(/\r?\n/);
    const items = [];
    let current = { title: '', body: '' };
    lines.forEach(function (line) {
      const m = line.match(/^\s*#{2,3}\s+(.+?)\s*$/);
      if (m) {
        if (current.body.trim()) items.push(current);
        current = { title: m[1].replace(/\*\*/g, ''), body: '' };
        return;
      }
      current.body += line + '\n';
    });
    if (current.body.trim()) items.push(current);
    return items;
  }

  App.md = { render: render, sections: sections };
})(window.App);
