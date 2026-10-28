/* 错题本：解析批改结果里的「错误归类」，累计成本地弱点画像 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const KEY = 'kaoyan-trainer-journal-v1';
  const MAX = 100;

  /* ---------- Markdown 小节的取用与剔除 ---------- */

  function sectionText(markdown, keyword) {
    const parts = App.md.sections(markdown);
    const hit = parts.filter(function (p) { return p.title && p.title.indexOf(keyword) >= 0; })[0];
    return hit ? hit.body : '';
  }

  function stripSection(markdown, keyword) {
    const lines = String(markdown || '').split(/\r?\n/);
    const out = [];
    let skipping = false;
    lines.forEach(function (line) {
      const m = line.match(/^\s*#{2,3}\s+(.+?)\s*$/);
      if (m) skipping = m[1].indexOf(keyword) >= 0;
      if (!skipping) out.push(line);
    });
    return out.join('\n').trim();
  }

  /* ---------- 解析「冠词 2 | 时态 1 | 搭配 3」 ---------- */

  function parseItems(text) {
    const items = {};
    let raw = String(text || '');
    if (!raw.trim()) return items;
    /* 表格行 | 冠词 | 2 | 先转成「冠词 2」 */
    raw = raw.replace(/^\s*\|\s*([^|\n]+?)\s*\|\s*(\d{1,3})\s*\|?\s*$/gm, '$1 $2\n');
    raw.split(/[|｜,，、;；\n·]+/).forEach(function (chunk) {
      const m = String(chunk).match(/([A-Za-z\u4e00-\u9fa5][A-Za-z\u4e00-\u9fa5 \/]*?)\s*[:：]?\s*(\d{1,3})\s*(?:处|个|次|条)?\s*$/);
      if (!m) return;
      const name = m[1].replace(/[-\s]+/g, '');
      const n = parseInt(m[2], 10);
      if (name && n > 0 && name.length <= 8) items[name] = (items[name] || 0) + n;
    });
    return items;
  }

  /* ---------- 档位与分数 ---------- */

  const ORDINALS = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5 };

  function parseGrade(markdown, typeKey) {
    const type = App.config.ESSAY_TYPES[typeKey] || App.config.ESSAY_TYPES.e1_big;
    const body = sectionText(markdown, '档位');
    const text = body || String(markdown || '');
    const out = { bandIndex: -1, bandLabel: '', score: NaN, max: type.max };

    const ord = text.match(/第\s*([一二三四五六])\s*档/);
    if (ord) out.bandIndex = ORDINALS[ord[1]];
    out.bandLabel = ord ? '第' + ord[1] + '档' : '';

    const slash = text.match(/(\d{1,2}(?:\.\d)?)\s*\/\s*(\d{1,2})/);
    if (slash) {
      out.score = parseFloat(slash[1]);
      out.max = parseInt(slash[2], 10);
    } else {
      const only = text.match(/(?:给|得|估|约)\s*(\d{1,2}(?:\.\d)?)\s*分/);
      if (only) out.score = parseFloat(only[1]);
    }
    if (out.bandIndex < 0 && !isNaN(out.score) && type.bands) {
      /* 没写档位时按分数反推 */
      type.bands.some(function (b, i) {
        const m = String(b[0]).match(/(\d+)\s*[–\-~]\s*(\d+)/);
        if (m && out.score >= parseInt(m[1], 10) && out.score <= parseInt(m[2], 10)) {
          out.bandIndex = i;
          return true;
        }
        return false;
      });
    }
    return out;
  }

  /* ---------- 本地存储 ---------- */

  function load() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    } catch (e) {
      /* 隐私模式下写不进去就只在内存里用 */
    }
  }

  function add(entry) {
    if (!entry || !entry.items || !Object.keys(entry.items).length) return null;
    const record = {
      at: Date.now(),
      typeKey: entry.typeKey || '',
      label: entry.label || '',
      band: entry.band || '',
      score: entry.score || '',
      reason: entry.reason || '',
      items: entry.items,
      excerpt: String(entry.excerpt || '').slice(0, 80)
    };
    const list = load();
    list.unshift(record);
    save(list);
    return record;
  }

  function summary() {
    const totals = {};
    let count = 0;
    let errors = 0;
    load().forEach(function (r) {
      count += 1;
      Object.keys(r.items || {}).forEach(function (name) {
        const n = Number(r.items[name]) || 0;
        totals[name] = (totals[name] || 0) + n;
        errors += n;
      });
    });
    const ranked = Object.keys(totals).map(function (name) {
      return { name: name, count: totals[name] };
    }).sort(function (a, b) { return b.count - a.count; });
    return { count: count, errors: errors, ranked: ranked };
  }

  function clear() {
    save([]);
  }

  App.journal = {
    parseItems: parseItems,
    parseGrade: parseGrade,
    sectionText: sectionText,
    stripSection: stripSection,
    add: add,
    list: load,
    summary: summary,
    clear: clear
  };
})(window.App);
