/* 我的例句本：本地收藏的例句 + 自定义分类，只存本机 localStorage */
window.App = window.App || {};

(function (App) {
  'use strict';

  const KEY = 'kaoyan-trainer-examples-v1';
  const DEFAULT_CAT = '未分类';
  const MAX_CATS = 30;
  const MAX_ITEMS = 500;

  function newId() {
    return String(Date.now()) + '-' + String(Math.floor(Math.random() * 100000));
  }

  function normalize(raw) {
    const out = { cats: [], items: [] };
    if (!raw || typeof raw !== 'object') {
      out.cats.push(DEFAULT_CAT);
      return out;
    }

    (Array.isArray(raw.cats) ? raw.cats : []).forEach(function (name) {
      const n = String(name).trim();
      if (n && out.cats.indexOf(n) === -1 && out.cats.length < MAX_CATS) out.cats.push(n);
    });
    if (out.cats.indexOf(DEFAULT_CAT) === -1) out.cats.unshift(DEFAULT_CAT);

    (Array.isArray(raw.items) ? raw.items : []).forEach(function (item) {
      if (!item || typeof item.en !== 'string' || !item.en.trim()) return;
      const cat = out.cats.indexOf(item.cat) !== -1 ? item.cat : DEFAULT_CAT;
      out.items.push({
        id: String(item.id || newId()),
        en: item.en.trim(),
        cn: String(item.cn || '').trim(),
        note: String(item.note || '').trim(),
        cat: cat,
        at: Number(item.at) || 0
      });
    });

    out.items.sort(function (a, b) { return b.at - a.at; });
    return out;
  }

  function read() {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY) || 'null'));
    } catch (e) {
      return normalize(null);
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* 存储满了或浏览器禁用时静默失败，页面仍可继续使用 */
    }
  }

  function cats() {
    return read().cats;
  }

  function counts() {
    const data = read();
    const out = {};
    data.cats.forEach(function (name) { out[name] = 0; });
    data.items.forEach(function (item) { out[item.cat] = (out[item.cat] || 0) + 1; });
    return out;
  }

  function list(cat, keyword) {
    const data = read();
    const q = String(keyword || '').trim().toLowerCase();
    let items = data.items.slice();
    if (cat && cat !== '全部') items = items.filter(function (i) { return i.cat === cat; });
    if (q) {
      items = items.filter(function (i) {
        return (i.en + ' ' + i.cn + ' ' + i.note + ' ' + i.cat).toLowerCase().indexOf(q) !== -1;
      });
    }
    return items;
  }

  function has(en) {
    const target = String(en || '').trim().toLowerCase();
    if (!target) return false;
    return read().items.some(function (i) { return i.en.toLowerCase() === target; });
  }

  function add(entry) {
    const en = String(entry && entry.en || '').trim();
    if (!en) return { error: '先写一句英文。' };

    const data = read();
    const existing = data.items.filter(function (i) {
      return i.en.toLowerCase() === en.toLowerCase();
    })[0];
    if (existing) return { existing: existing };

    const cat = data.cats.indexOf(entry.cat) !== -1 ? entry.cat : DEFAULT_CAT;
    const item = {
      id: newId(),
      en: en,
      cn: String(entry.cn || '').trim(),
      note: String(entry.note || '').trim(),
      cat: cat,
      at: Date.now()
    };
    data.items.unshift(item);
    if (data.items.length > MAX_ITEMS) data.items.length = MAX_ITEMS;
    write(data);
    return { item: item };
  }

  function update(id, patch) {
    const data = read();
    const item = data.items.filter(function (i) { return i.id === id; })[0];
    if (!item) return { error: '找不到这条例句。' };

    if (patch && patch.en !== undefined) {
      const en = String(patch.en).trim();
      if (!en) return { error: '英文句子不能为空。' };
      item.en = en;
    }
    if (patch && patch.cn !== undefined) item.cn = String(patch.cn).trim();
    if (patch && patch.note !== undefined) item.note = String(patch.note).trim();
    if (patch && patch.cat && data.cats.indexOf(patch.cat) !== -1) item.cat = patch.cat;
    write(data);
    return { item: item };
  }

  function move(id, cat) {
    return update(id, { cat: cat });
  }

  function remove(id) {
    const data = read();
    const before = data.items.length;
    data.items = data.items.filter(function (i) { return i.id !== id; });
    if (data.items.length === before) return { error: '找不到这条例句。' };
    write(data);
    return { ok: true };
  }

  function addCat(name) {
    const n = String(name || '').trim().replace(/\s+/g, ' ');
    if (!n) return { error: '分类名不能为空。' };
    if (n.length > 12) return { error: '分类名最多 12 个字。' };

    const data = read();
    if (data.cats.indexOf(n) !== -1) return { error: '已经有这个分类了。' };
    if (data.cats.length >= MAX_CATS) return { error: '分类最多 ' + MAX_CATS + ' 个。' };
    data.cats.push(n);
    write(data);
    return { name: n };
  }

  function removeCat(name) {
    if (name === DEFAULT_CAT) return { error: '「未分类」不能删除。' };
    const data = read();
    const index = data.cats.indexOf(name);
    if (index === -1) return { error: '找不到这个分类。' };
    data.cats.splice(index, 1);
    data.items.forEach(function (item) {
      if (item.cat === name) item.cat = DEFAULT_CAT;
    });
    write(data);
    return { ok: true };
  }

  function exportData() {
    const data = read();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      cats: data.cats,
      items: data.items
    };
  }

  /* 导入采用合并：分类补齐，例句按英文去重，不覆盖本机已有内容 */
  function importData(text) {
    let raw = null;
    try {
      raw = JSON.parse(text);
    } catch (e) {
      return { error: '文件不是有效的 JSON。' };
    }
    if (!raw || !Array.isArray(raw.items)) return { error: '文件里没有例句数据。' };

    const data = read();
    (Array.isArray(raw.cats) ? raw.cats : []).forEach(function (name) {
      const n = String(name).trim();
      if (n && n.length <= 12 && data.cats.indexOf(n) === -1 && data.cats.length < MAX_CATS) {
        data.cats.push(n);
      }
    });

    const seen = {};
    data.items.forEach(function (item) { seen[item.en.toLowerCase()] = true; });

    let added = 0;
    let skipped = 0;
    raw.items.forEach(function (item) {
      if (!item || typeof item.en !== 'string' || !item.en.trim()) return;
      const en = item.en.trim();
      if (seen[en.toLowerCase()] || data.items.length >= MAX_ITEMS) {
        skipped += 1;
        return;
      }
      const cat = data.cats.indexOf(item.cat) !== -1 ? item.cat : DEFAULT_CAT;
      data.items.push({
        id: newId(),
        en: en,
        cn: String(item.cn || '').trim(),
        note: String(item.note || '').trim(),
        cat: cat,
        at: Number(item.at) || Date.now()
      });
      seen[en.toLowerCase()] = true;
      added += 1;
    });

    data.items.sort(function (a, b) { return b.at - a.at; });
    write(data);
    return { added: added, skipped: skipped };
  }

  App.examples = {
    DEFAULT_CAT: DEFAULT_CAT,
    cats: cats,
    counts: counts,
    list: list,
    has: has,
    add: add,
    update: update,
    move: move,
    remove: remove,
    addCat: addCat,
    removeCat: removeCat,
    exportData: exportData,
    importData: importData
  };
})(window.App);
