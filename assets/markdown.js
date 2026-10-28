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

  /* 词级 diff：给「句型魔改」做改写前后对照，纯本地计算，不联网 */
  function splitWords(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean);
  }

  function diffWords(before, after) {
    const a = splitWords(before);
    const b = splitWords(after);
    if (!a.length || !b.length || a.length * b.length > 90000) {
      return [{ type: 'del', text: a.join(' ') }, { type: 'add', text: b.join(' ') }].filter(function (op) {
        return op.text;
      });
    }
    const dp = [];
    for (let i = 0; i <= a.length; i++) dp.push(new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        dp[i][j] = a[i].toLowerCase() === b[j].toLowerCase()
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const ops = [];
    let i = 0;
    let j = 0;
    function push(type, word) {
      const last = ops[ops.length - 1];
      if (last && last.type === type) last.words.push(word);
      else ops.push({ type: type, words: [word] });
    }
    while (i < a.length && j < b.length) {
      if (a[i].toLowerCase() === b[j].toLowerCase()) {
        push('same', b[j]); i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        push('del', a[i]); i++;
      } else {
        push('add', b[j]); j++;
      }
    }
    while (i < a.length) { push('del', a[i]); i++; }
    while (j < b.length) { push('add', b[j]); j++; }
    return ops.map(function (op) { return { type: op.type, text: op.words.join(' ') }; });
  }

  function diffHtml(before, after) {
    return diffWords(before, after).map(function (op) {
      const text = escapeHtml(op.text);
      if (op.type === 'add') return '<ins class="diff-add">' + text + '</ins>';
      if (op.type === 'del') return '<del class="diff-del">' + text + '</del>';
      return '<span class="diff-same">' + text + '</span>';
    }).join(' ');
  }

  App.md = { render: render, sections: sections, diffWords: diffWords, diffHtml: diffHtml };
})(window.App);
