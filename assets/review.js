/* 模板填空复盘：解析判定报告，累计错空记录（仅存本机） */
window.App = window.App || {};

(function (App) {
  'use strict';

  const KEY = 'kaoyan-trainer-tpl-review-v1';
  const MAX = 60;

  /* ---------- Markdown 小节工具 ---------- */

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

  /* ---------- 解析判定 ---------- */

  const PASS_MARK = /[✅✔✓]/;
  const FAIL_MARK = /[❌✖✗×]/;

  function parseRows(markdown) {
    const body = sectionText(markdown, '逐空判定');
    const rows = [];
    String(body || '').split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^\s*[-*]?\s*(\d{1,2})\s*[.、:：]?\s*(.*)$/);
      if (!m) return;
      const rest = m[2];
      let pass = null;
      if (PASS_MARK.test(rest)) pass = true;
      else if (FAIL_MARK.test(rest)) pass = false;
      else {
        if (/^通过|^正确|^对\b/.test(rest)) pass = true;
        else if (/^需改|^错误|^错\b/.test(rest)) pass = false;
      }
      if (pass === null) return;
      const note = rest
        .replace(/^[✅✔✓❌✖✗×]\s*(通过|需改|正确|错误|对|错)?\s*[—\-–:：]?\s*/, '')
        .trim();
      const cut = note.split(/改为[:：]/);
      rows.push({
        no: Number(m[1]),
        pass: pass,
        note: (cut[0] || '').trim().slice(0, 160),
        fix: (cut[1] || '').trim().slice(0, 200)
      });
    });
    return rows;
  }

  /* 以「错空记录」一行为准，取错空编号 */
  function parseWrongList(markdown, total) {
    const body = sectionText(markdown, '错空记录');
    const text = String(body || '').trim();
    if (!text) return null;
    if (/无/.test(text.split('|')[0])) return [];
    const head = text.split('|')[0];
    const nums = (head.match(/\d{1,2}/g) || []).map(Number).filter(function (n) {
      return n >= 1 && n <= (total || 99);
    });
    return Array.from(new Set(nums)).sort(function (a, b) { return a - b; });
  }

  function parseReport(markdown, total) {
    const rows = parseRows(markdown);
    const listed = parseWrongList(markdown, total);
    const wrong = listed === null
      ? rows.filter(function (r) { return !r.pass; }).map(function (r) { return r.no; })
      : listed;
    return {
      rows: rows,
      wrong: wrong,
      passCount: total - wrong.length,
      /* 既没有「错空记录」也没有逐空判定，说明模型没按格式输出，不能当成全对 */
      reliable: listed !== null || rows.length > 0
    };
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
    if (!entry) return null;
    const record = {
      at: Date.now(),
      templateId: entry.templateId || '',
      templateNo: entry.templateNo || '',
      templateTitle: entry.templateTitle || '',
      total: entry.total || 0,
      wrong: (entry.wrong || []).slice(0, 40),
      detail: (entry.detail || []).slice(0, 40),
      topic: String(entry.topic || '').slice(0, 60)
    };
    const list = load();
    list.unshift(record);
    save(list);
    return record;
  }

  function summary() {
    const list = load();
    const counts = {};
    const perTemplate = {};
    let attempts = 0;
    let wrongTotal = 0;

    list.forEach(function (r) {
      attempts += 1;
      wrongTotal += (r.wrong || []).length;
      const key = r.templateNo + ' ' + r.templateTitle;
      const bucket = perTemplate[key] || (perTemplate[key] = { label: key, times: 0, wrong: 0, total: 0 });
      bucket.times += 1;
      bucket.wrong += (r.wrong || []).length;
      bucket.total += r.total || 0;
      (r.wrong || []).forEach(function (n) { counts[n] = (counts[n] || 0) + 1; });
    });

    const ranked = Object.keys(counts).map(function (no) {
      return { no: Number(no), count: counts[no] };
    }).sort(function (a, b) { return b.count - a.count || a.no - b.no; });

    const templates = Object.keys(perTemplate).map(function (k) { return perTemplate[k]; })
      .sort(function (a, b) { return b.wrong - a.wrong; });

    return { attempts: attempts, wrongTotal: wrongTotal, ranked: ranked, templates: templates };
  }

  function clear() {
    save([]);
  }

  App.review = {
    sectionText: sectionText,
    stripSection: stripSection,
    parseReport: parseReport,
    add: add,
    list: load,
    summary: summary,
    clear: clear
  };
})(window.App);
