/* 模板背诵：三类内容拆句 → 渐进挖空 → 本地逐词判分 → 熟悉度队列
   内容源：整篇模板、AI 归来句库、我的模板；可变部分不计分。 */

window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const esc = function (text) { return App.runner.escapeAttr(text); };

  const KEY = 'kaoyan-trainer-recite-v1';
  const FAM = [
    { label: '生疏', cls: 'is-weak' },
    { label: '一般', cls: 'is-mid' },
    { label: '熟练', cls: 'is-good' }
  ];
  const LEVELS = [
    null,
    { label: '看全文', ratio: 0 },
    { label: '挖关键词', ratio: 0.3 },
    { label: '挖半句', ratio: 0.6 },
    { label: '整句默写', ratio: 1 }
  ];

  const state = {
    view: 'home',
    tab: 'whole',
    collections: null,
    collection: null,
    queue: [],
    index: 0,
    level: 1,
    answer: '',
    result: null,
    revealed: false,
    hint: false,
    aiBusy: false,
    done: false
  };

  let bound = false;
  let store = readStore();

  /* ---------------- 存储 ---------------- */

  function readStore() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (!value || typeof value !== 'object') return { items: {}, last: null };
      if (!value.items || typeof value.items !== 'object') value.items = {};
      return value;
    } catch (e) {
      return { items: {}, last: null };
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {
      /* 隐私模式写不进去就只在内存里用 */
    }
  }

  function newProgress() {
    return { level: 1, fam: 0, streak: 0, tries: 0, pass: 0, lastAt: 0, lastPass: null };
  }

  function progressOf(key) {
    return store.items[key] || newProgress();
  }

  function ensureProgress(key) {
    if (!store.items[key]) store.items[key] = newProgress();
    return store.items[key];
  }

  function passItem(item, level, viaAi) {
    const p = ensureProgress(item.key);
    if (!viaAi) p.tries += 1;
    p.pass += 1;
    p.streak += 1;
    p.fam = level >= 4 ? 2 : 1;
    p.level = Math.min(4, Math.max(level + 1, p.level));
    p.lastAt = Date.now();
    p.lastPass = true;
    if (viaAi) p.ai = 1;
    saveStore();
    return p;
  }

  function failItem(item, level) {
    const p = ensureProgress(item.key);
    p.tries += 1;
    p.streak = 0;
    p.fam = 0;
    p.level = Math.max(1, level - 1);
    p.lastAt = Date.now();
    p.lastPass = false;
    saveStore();
    return p;
  }

  /* ---------------- 拆句与挖空 ---------------- */

  /* 只在句号/问号/叹号后接空格 + 大写（或结尾）时断句，避免 8.8% / e.g. 被拆开 */
  function splitSentences(text) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    const out = [];
    let start = 0;
    for (let i = 0; i < s.length; i += 1) {
      const ch = s.charAt(i);
      if (ch === '.' || ch === '!' || ch === '?') {
        const rest = s.slice(i + 1);
        if (/^\s*$/.test(rest) || /^\s+["'“‘(]?[A-Z0-9]/.test(rest)) {
          out.push(s.slice(start, i + 1).trim());
          start = i + 1;
        }
      }
    }
    const tail = s.slice(start).trim();
    if (tail) out.push(tail);
    return out.filter(Boolean);
  }

  function tokenizeFixed(text) {
    const parts = String(text).match(/[A-Za-z0-9]+(?:[’'\-][A-Za-z0-9]+)*|[^\sA-Za-z0-9]+/g) || [];
    return parts.map(function (part) {
      return { text: part, word: /[A-Za-z0-9]/.test(part) };
    });
  }

  function chunksFromCircles(text, blanks) {
    const map = {};
    (blanks || []).forEach(function (blank) {
      if (blank.label) map[blank.label] = blank;
    });
    const chunks = [];
    let buf = '';
    Array.from(String(text || '')).forEach(function (ch) {
      if (map[ch]) {
        if (buf) { chunks.push({ text: buf }); buf = ''; }
        const blank = map[ch];
        chunks.push({
          text: blank.sample || ('[' + (blank.name || blank.label) + ']'),
          variable: true,
          hint: blank.hint || '',
          name: blank.name || blank.label
        });
      } else {
        buf += ch;
      }
    });
    if (buf) chunks.push({ text: buf });
    return chunks;
  }

  function chunksFromBraces(text) {
    const chunks = [];
    String(text || '').split(/(\{[^}]+\})/).forEach(function (part) {
      if (!part) return;
      const hit = part.match(/^\{([^}]+)\}$/);
      if (hit) {
        const ph = App.aiTemplates.placeholder(hit[1]);
        chunks.push({
          text: (ph && ph.sample) || hit[1],
          variable: true,
          hint: (ph && ph.hint) || '',
          name: hit[1]
        });
      } else {
        chunks.push({ text: part });
      }
    });
    return chunks;
  }

  const MARK_A = '\u0001';
  const MARK_B = '\u0002';

  function itemsFromChunks(chunks, meta, out) {
    let raw = '';
    const vars = [];
    chunks.forEach(function (chunk) {
      if (chunk.variable) {
        raw += MARK_A + vars.length + MARK_B;
        vars.push(chunk);
      } else {
        raw += chunk.text;
      }
    });

    splitSentences(raw).forEach(function (sentence, index) {
      const tokens = [];
      let buf = '';
      function flush() {
        if (!buf) return;
        tokenizeFixed(buf).forEach(function (token) { tokens.push(token); });
        buf = '';
      }
      for (let i = 0; i < sentence.length; i += 1) {
        if (sentence.charAt(i) === MARK_A) {
          const end = sentence.indexOf(MARK_B, i);
          const idx = Number(sentence.slice(i + 1, end));
          flush();
          const variable = vars[idx];
          if (variable) {
            tokens.push({ text: variable.text, variable: true, hint: variable.hint, name: variable.name });
          }
          i = end;
        } else {
          buf += sentence.charAt(i);
        }
      }
      flush();
      if (!tokens.length) return;

      out.push({
        key: meta.key + ':' + index,
        source: meta.source,
        label: meta.label,
        sub: meta.sub + (index ? ' · 第 ' + (index + 1) + ' 句' : ''),
        tokens: tokens,
        fullText: joinTokens(tokens),
        variables: tokens.filter(function (t) { return t.variable; })
      });
    });
  }

  function joinTokens(tokens) {
    let out = '';
    tokens.forEach(function (token) {
      if (!out) { out = token.text; return; }
      if (/^[,.;:!?%)\]’”]/.test(token.text) || /[(\[“‘]$/.test(out)) out += token.text;
      else out += ' ' + token.text;
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  /* ---------------- 内容集合 ---------------- */

  function buildCollections() {
    const cols = { whole: [], ai: [], mine: [] };

    App.templates.list.forEach(function (t) {
      const items = [];
      t.paragraphs.forEach(function (para, pi) {
        itemsFromChunks(
          chunksFromCircles(para, t.blanks),
          {
            source: 'whole',
            key: 'w:' + t.id + ':' + pi,
            label: t.no + ' · ' + t.title,
            sub: t.kind + ' · 第 ' + (pi + 1) + ' 段'
          },
          items
        );
      });
      if (items.length) {
        cols.whole.push({
          id: 'whole:' + t.id,
          label: t.no + ' · ' + t.title,
          meta: t.kind,
          items: items
        });
      }
    });

    App.aiTemplates.types.forEach(function (type) {
      type.scenes.forEach(function (sceneId) {
        const scene = App.aiTemplates.scene(sceneId);
        if (!scene) return;
        const items = [];
        scene.slots.forEach(function (slot) {
          slot.options.forEach(function (option) {
            itemsFromChunks(
              chunksFromBraces(option.en),
              {
                source: 'ai',
                key: 'a:' + sceneId + ':' + slot.id + ':' + option.id,
                label: scene.label,
                sub: '第 ' + slot.para + ' 段 · ' + slot.name + ' · ' + option.name
              },
              items
            );
          });
        });
        if (items.length) {
          cols.ai.push({
            id: 'ai:' + sceneId,
            label: scene.label,
            meta: type.label,
            items: items
          });
        }
      });
    });

    const common = [];
    const second = App.aiTemplates.second;
    second.transition.options.forEach(function (option) {
      itemsFromChunks(
        chunksFromBraces(option.en),
        {
          source: 'ai',
          key: 'a:second:transition:' + option.id,
          label: '第二段 · 过渡句',
          sub: '过渡 · ' + option.name
        },
        common
      );
    });
    second.reasons.plans.forEach(function (plan) {
      plan.options.forEach(function (option) {
        itemsFromChunks(
          chunksFromBraces(option.en),
          {
            source: 'ai',
            key: 'a:reason:' + plan.id + ':' + option.id,
            label: '第二段 · 原因论证',
            sub: plan.name + ' · ' + option.name
          },
          common
        );
      });
    });
    App.aiTemplates.third.slots.forEach(function (slot) {
      slot.options.forEach(function (option) {
        itemsFromChunks(
          chunksFromBraces(option.en),
          {
            source: 'ai',
            key: 'a:third:' + slot.id + ':' + option.id,
            label: '第三段 · 总结措施',
            sub: slot.name + ' · ' + option.name
          },
          common
        );
      });
    });
    if (common.length) {
      cols.ai.push({
        id: 'ai:common',
        label: '通用 · 第二 / 三段',
        meta: '过渡、原因、总结',
        items: common
      });
    }

    if (App.combo && App.combo.saved) {
      App.combo.saved().forEach(function (saved) {
        const built = App.combo.build(saved.setup);
        if (!built) return;
        const items = [];
        built.template.paragraphs.forEach(function (para, pi) {
          itemsFromChunks(
            chunksFromCircles(para, built.template.blanks),
            {
              source: 'mine',
              key: 'm:' + saved.id + ':' + pi,
              label: saved.name,
              sub: '我的模板 · 第 ' + (pi + 1) + ' 段'
            },
            items
          );
        });
        if (items.length) {
          cols.mine.push({
            id: 'mine:' + saved.id,
            label: saved.name,
            meta: '我的模板',
            items: items
          });
        }
      });
    }

    return cols;
  }

  function allCollections() {
    const cols = state.collections || (state.collections = buildCollections());
    return cols.whole.concat(cols.ai, cols.mine);
  }

  function allItems() {
    return allCollections().reduce(function (list, col) { return list.concat(col.items); }, []);
  }

  function findCollection(id) {
    return allCollections().filter(function (col) { return col.id === id; })[0] || null;
  }

  function todayCollection() {
    const due = allItems().filter(isDue).sort(byFamiliarity);
    const items = (due.length ? due : allItems().sort(byFamiliarity)).slice(0, 10);
    return { id: 'today', label: '今日建议', meta: '错句与生疏优先', items: items };
  }

  function lastCollection() {
    if (!store.last) return null;
    if (store.last.id === 'today') return todayCollection();
    return findCollection(store.last.id);
  }

  /* ---------------- 统计与队列 ---------------- */

  function statsOf(items) {
    const stats = { total: items.length, weak: 0, mid: 0, good: 0, fresh: 0, wrong: 0 };
    items.forEach(function (item) {
      const p = store.items[item.key];
      if (!p) { stats.fresh += 1; stats.weak += 1; return; }
      if (p.fam === 2) stats.good += 1;
      else if (p.fam === 1) stats.mid += 1;
      else stats.weak += 1;
      if (p.lastPass === false) stats.wrong += 1;
    });
    return stats;
  }

  function isDue(item) {
    const p = store.items[item.key];
    return !p || p.fam === 0 || p.lastPass === false;
  }

  function byFamiliarity(a, b) {
    const pa = progressOf(a.key);
    const pb = progressOf(b.key);
    if (pa.fam !== pb.fam) return pa.fam - pb.fam;
    return (pa.lastAt || 0) - (pb.lastAt || 0);
  }

  /* ---------------- 挖空 ---------------- */

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function hiddenSet(item, level) {
    const set = {};
    if (level <= 1) return set;
    const words = [];
    item.tokens.forEach(function (token, index) {
      if (token.word && !token.variable) words.push(index);
    });
    if (!words.length) return set;

    if (level >= 4) {
      words.forEach(function (index) { set[index] = true; });
      return set;
    }

    const pool = words.length > 1 ? words.slice(1) : words.slice();
    const count = Math.max(1, Math.round(words.length * LEVELS[level].ratio));
    pool
      .map(function (index) { return { index: index, rank: hash(item.key + ':' + index) }; })
      .sort(function (a, b) { return a.rank - b.rank; })
      .slice(0, count)
      .forEach(function (row) { set[row.index] = true; });
    return set;
  }

  function normalizeWord(word) {
    return String(word)
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
  }

  function lcsDiff(expected, got) {
    const n = expected.length;
    const m = got.length;
    const dp = [];
    for (let i = 0; i <= n; i += 1) dp.push(new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        dp[i][j] = expected[i] === got[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const matchA = {};
    const matchB = {};
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (expected[i] === got[j]) {
        matchA[i] = true;
        matchB[j] = true;
        i += 1;
        j += 1;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        i += 1;
      } else {
        j += 1;
      }
    }
    const missing = [];
    const extra = [];
    for (let a = 0; a < n; a += 1) if (!matchA[a]) missing.push(a);
    for (let b = 0; b < m; b += 1) if (!matchB[b]) extra.push(b);
    return { matchA: matchA, missing: missing, extra: extra };
  }

  /* ---------------- 首页 ---------------- */

  function pill(fam) {
    const meta = FAM[fam] || FAM[0];
    return '<span class="recite-pill ' + meta.cls + '">' + meta.label + '</span>';
  }

  function renderHome() {
    const cols = state.collections || (state.collections = buildCollections());
    const all = allItems();
    const due = all.filter(isDue).sort(byFamiliarity);
    const today = (due.length ? due : all.slice().sort(byFamiliarity)).slice(0, 10);
    const wrong = due.filter(function (item) {
      const p = store.items[item.key];
      return p && p.lastPass === false;
    }).length;
    const last = lastCollection();

    const hero =
      '<div class="recite-hero">' +
        '<div class="recite-hero-main">' +
          '<p class="eyebrow">模板背诵</p>' +
          '<h2>背骨架，不背整篇</h2>' +
          '<p class="hint">淡色部分是题目可变内容，自动用示例补全、不计分；只挖固定句式。答对升级，答错降一级。</p>' +
        '</div>' +
        '<div class="recite-today">' +
          '<span class="recite-today-num">' + today.length + '</span>' +
          '<div class="recite-today-main"><b>今日建议</b>' +
            '<span>错句 ' + wrong + ' · 生疏 ' + statsOf(due).weak + '</span></div>' +
          '<button type="button" class="btn primary" data-recite-today>' +
            (due.length ? '开始复习' : '复习最近') + '</button>' +
        '</div>' +
        (last
          ? '<button type="button" class="recite-resume" data-recite-continue>继续上次：' + esc(last.label) + '</button>'
          : '') +
      '</div>';

    const tabs = ['whole', 'ai', 'mine'].map(function (id) {
      const label = id === 'whole' ? '整篇模板' : (id === 'ai' ? 'AI 归来句库' : '我的模板');
      return '<button type="button" class="mode-chip' + (state.tab === id ? ' is-active' : '') +
        '" data-recite-tab="' + id + '">' + label + '</button>';
    }).join('');

    let list = cols[state.tab].map(function (col) {
      const stats = statsOf(col.items);
      const goodPct = stats.total ? Math.round(stats.good / stats.total * 100) : 0;
      const midPct = stats.total ? Math.round(stats.mid / stats.total * 100) : 0;
      const weakPct = Math.max(0, 100 - goodPct - midPct);
      return '<button type="button" class="recite-row" data-recite-scope="' + esc(col.id) + '">' +
        '<span class="recite-row-main"><b>' + esc(col.label) + '</b>' +
          '<span>' + esc(col.meta) + ' · ' + stats.total + ' 句</span></span>' +
        '<span class="recite-bar" aria-hidden="true">' +
          '<i class="is-good" style="width:' + goodPct + '%"></i>' +
          '<i class="is-mid" style="width:' + midPct + '%"></i>' +
          '<i class="is-weak" style="width:' + weakPct + '%"></i>' +
        '</span>' +
        '<span class="recite-row-side">' +
          '<span class="recite-pill ' + (stats.weak ? 'is-weak' : 'is-good') + '">' +
            (stats.weak ? '待背 ' + stats.weak : '已掌握') + '</span>' +
          '<span class="recite-row-good">熟练 ' + stats.good + '</span>' +
        '</span>' +
        '</button>';
    }).join('');

    if (!list) {
      list = state.tab === 'mine'
        ? '<div class="recite-empty"><b>还没有保存的组合模板</b>' +
          '<span>先去「AI 归来 · 自选模板」定稿并保存，这里就会出现可背的内容。</span>' +
          '<button type="button" class="btn ghost small" data-recite-goto-combo>去定模板</button></div>'
        : '<div class="recite-empty"><b>暂时没有可背的句子</b><span>换一个分类看看。</span></div>';
    }

    $('#recite-home').innerHTML = hero +
      '<div class="tpl-modes recite-tabs" role="tablist" aria-label="背诵分类">' + tabs + '</div>' +
      '<div class="recite-list">' + list + '</div>';
    $('#recite-home').hidden = false;
    $('#recite-session').hidden = true;
  }

  /* ---------------- 背诵会话 ---------------- */

  function currentItem() {
    return state.queue[state.index] || null;
  }

  function startCollection(col, onlyDue, resumeKey) {
    if (!col || !col.items.length) return;
    let items = col.items.slice().sort(byFamiliarity);
    if (onlyDue) {
      const filtered = items.filter(isDue);
      if (filtered.length) items = filtered;
    }
    if (onlyDue) items = items.slice(0, 10);

    let index = 0;
    if (resumeKey) {
      const hit = items.map(function (item) { return item.key; }).indexOf(resumeKey);
      if (hit >= 0) index = hit;
    }

    state.collection = col;
    state.queue = items;
    state.index = index;
    state.view = 'session';
    state.done = false;
    beginItem();
  }

  function beginItem() {
    const item = currentItem();
    if (!item) { state.done = true; renderSession(); return; }
    const p = progressOf(item.key);
    state.level = p.level || 1;
    state.answer = '';
    state.result = null;
    state.revealed = false;
    state.hint = false;
    state.aiBusy = false;
    store.last = { id: state.collection.id, key: item.key };
    saveStore();
    renderSession();
  }

  function variablesLine(item) {
    const seen = {};
    const parts = [];
    item.variables.forEach(function (v) {
      if (seen[v.name]) return;
      seen[v.name] = true;
      parts.push('<span class="recite-var"><b>' + esc(v.name) + '</b>' + esc(v.text) + '</span>');
    });
    return parts.length
      ? '<p class="recite-vars-note">淡色 = 可变部分，不计分</p><div class="recite-vars">' + parts.join('') + '</div>'
      : '';
  }

  function tokenHtml(token, index, hidden, statusMap) {
    if (token.variable) {
      return '<span class="recite-var-token" title="' + esc(token.hint || '') + '">' + esc(token.text) + '</span>';
    }
    if (!hidden[index]) return esc(token.text);

    if (statusMap) {
      const status = statusMap[index] || 'miss';
      return '<span class="recite-gap ' + status + '">' + esc(token.text) + '</span>';
    }
    if (state.revealed) return '<span class="recite-gap is-ok">' + esc(token.text) + '</span>';
    if (state.hint) {
      return '<span class="recite-gap is-hint">' + esc(token.text.charAt(0)) +
        '<i>' + new Array(Math.max(2, token.text.length)).join('_') + '</i></span>';
    }
    return '<span class="recite-gap">____</span>';
  }

  function sentenceHtml(item, hidden, result) {
    let out = '';
    let prev = '';
    item.tokens.forEach(function (token, index) {
      const piece = tokenHtml(token, index, hidden, result);
      if (!out) out = piece;
      else if (/^[,.;:!?%)\]’”]/.test(token.text) || /[(\[“‘]$/.test(prev)) out += piece;
      else out += ' ' + piece;
      prev = token.text;
    });
    return out;
  }

  function levelChips() {
    return '<div class="recite-levels">' + LEVELS.slice(1).map(function (level, i) {
      const no = i + 1;
      return '<button type="button" class="recite-level' + (state.level === no ? ' is-active' : '') +
        '" data-recite-level="' + no + '"><b>' + no + '</b>' + level.label + '</button>';
    }).join('') + '</div>';
  }

  function resultHtml(item) {
    const r = state.result;
    const hiddenCount = Object.keys(r.hidden).length;
    let head;
    if (r.pass) {
      head = '<p class="recite-verdict is-pass"><b>通过</b> ' +
        (r.level >= 4 ? '这句已经能整句默写，标为熟练。' : '升到第 ' + Math.min(4, r.level + 1) + ' 级。') +
        (r.ai ? ' AI 复核也通过了。' : '') + '</p>';
    } else {
      head = '<p class="recite-verdict is-fail"><b>再练一次</b> ' +
        '本句挖空 ' + hiddenCount + ' 个词，' +
        (r.missing.length ? '漏了 ' + r.missing.length + ' 个' : '没有漏词') +
        (r.extra.length ? '，多写 ' + r.extra.length + ' 个' : '') +
        '。已降到第 ' + progressOf(item.key).level + ' 级。</p>';
    }

    let extra = '';
    if (!r.pass && r.extra.length) {
      extra = '<p class="recite-extra">多写：' + r.extra.map(function (word) { return esc(word.text); }).join('、') + '</p>';
    }
    let ai = '';
    if (!r.pass && r.level === 4) {
      if (App.store.hasKey()) {
        ai = '<button type="button" class="btn ghost" id="btn-recite-ai"' + (state.aiBusy ? ' disabled' : '') + '>' +
          (state.aiBusy ? 'AI 复核中…' : 'AI 复核同义表达') + '</button>';
      } else {
        ai = '<span class="hint">配好 API Key 后，可用 AI 复核同义表达。</span>';
      }
    }
    if (r.aiNote) ai += '<p class="recite-ai-note">' + esc(r.aiNote) + '</p>';

    const actions = r.pass
      ? '<button type="button" class="btn primary" id="btn-recite-next">' +
        (state.index + 1 >= state.queue.length ? '完成本轮' : '下一句') + '</button>'
      : '<button type="button" class="btn primary" id="btn-recite-retry">再试一次</button>' +
        '<button type="button" class="btn ghost" id="btn-recite-show">看答案</button>' + ai;

    return '<div class="recite-result">' + head + extra + '<div class="recite-result-actions">' + actions + '</div></div>';
  }

  function renderSession() {
    $('#recite-home').hidden = true;
    $('#recite-session').hidden = false;

    if (state.done || !currentItem()) {
      const stats = statsOf(state.queue);
      $('#recite-session').innerHTML =
        '<div class="recite-complete">' +
          '<p class="eyebrow">本轮结束</p><h2>背完 ' + state.queue.length + ' 句</h2>' +
          '<p class="hint">熟练 ' + stats.good + ' 句 · 一般 ' + stats.mid + ' 句 · 生疏 ' + stats.weak + ' 句。' +
          '错句会排在下次的最前面。</p>' +
          '<div class="recite-result-actions">' +
            '<button type="button" class="btn primary" data-recite-again>再来一遍</button>' +
            '<button type="button" class="btn ghost" data-recite-home>返回背诵首页</button>' +
          '</div>' +
        '</div>';
      window.scrollTo(0, 0);
      return;
    }

    const item = currentItem();
    const p = progressOf(item.key);
    const hidden = hiddenSet(item, state.level);
    let status = null;
    if (state.result) {
      status = {};
      state.result.expected.forEach(function (row, k) {
        status[row.tokenIndex] = state.result.matchA[k] ? 'is-ok' : 'is-miss';
      });
    }
    const percent = state.queue.length ? Math.round((state.index + 1) / state.queue.length * 100) : 0;

    const answerBox = state.revealed
      ? '<div class="recite-result-actions"><button type="button" class="btn primary" id="btn-recite-next">' +
        (state.index + 1 >= state.queue.length ? '完成本轮' : '下一句') + '</button></div>'
      : (state.level <= 1
        ? '<div class="recite-start-row"><button type="button" class="btn primary" data-recite-level="2">开始挖空</button>' +
          '<span class="hint">先读一遍，再进入关键词挖空。</span></div>'
        : '<label class="field recite-answer-field"><span class="label">' +
            (state.level >= 4 ? '默写整句（淡色可变部分不用写）' : '按顺序填被挖掉的词，用空格分隔') + '</span>' +
            '<textarea id="recite-input" class="recite-input" rows="' + (state.level >= 4 ? 3 : 2) + '" spellcheck="false" ' +
            'placeholder="' + (state.level >= 4 ? 'Type the sentence…' : 'missing words…') + '">' + esc(state.answer) + '</textarea>' +
          '</label>' +
          '<div class="recite-actions-row">' +
            '<button type="button" class="btn primary" id="btn-recite-check">检查</button>' +
            '<button type="button" class="btn ghost" id="btn-recite-reveal">看答案</button>' +
            '<button type="button" class="btn ghost" id="btn-recite-hint">' + (state.hint ? '收起首字母' : '首字母提示') + '</button>' +
            (('speechSynthesis' in window)
              ? '<button type="button" class="btn ghost" id="btn-recite-tts">朗读</button>'
              : '') +
          '</div>');

    $('#recite-session').innerHTML =
      '<div class="recite-head">' +
        '<button type="button" class="btn ghost small" data-recite-home>返回</button>' +
        '<div class="recite-head-main"><p class="eyebrow">' + esc(item.label) + '</p>' +
          '<h2>' + esc(item.sub) + '</h2></div>' +
        pill(p.fam) +
      '</div>' +
      '<div class="recite-progress"><span>第 ' + (state.index + 1) + ' / ' + state.queue.length + ' 句</span>' +
        '<i style="width:' + percent + '%"></i></div>' +
      '<div class="combo-block recite-card">' +
        levelChips() +
        variablesLine(item) +
        '<p class="recite-sentence">' + sentenceHtml(item, hidden, status) + '</p>' +
        (state.revealed ? '<p class="recite-revealed">已显示答案，这一句不计成绩，照着读一遍再下一句。</p>' : '') +
        answerBox +
        (state.result ? resultHtml(item) : '') +
      '</div>';

    const input = $('#recite-input');
    if (input && state.answer) input.value = state.answer;
    window.scrollTo(0, 0);
  }

  /* ---------------- 操作 ---------------- */

  function check() {
    const item = currentItem();
    if (!item || state.level <= 1 || state.revealed) return;
    if (!String(state.answer || '').trim()) {
      const box = $('#recite-result') || $('#recite-session');
      if (box) box.insertAdjacentHTML('beforeend', '<p class="hint recite-warn">先写点内容再检查。</p>');
      return;
    }

    const hidden = hiddenSet(item, state.level);
    const expected = [];
    item.tokens.forEach(function (token, index) {
      if (hidden[index] && token.word && !token.variable) {
        expected.push({ tokenIndex: index, text: normalizeWord(token.text) });
      }
    });
    const words = String(state.answer).trim().split(/\s+/).filter(Boolean);
    const got = words.map(function (word) {
      return { text: normalizeWord(word) };
    }).filter(function (row) { return row.text; });

    const diff = lcsDiff(expected.map(function (row) { return row.text; }), got.map(function (row) { return row.text; }));
    const pass = diff.missing.length === 0 && diff.extra.length === 0;

    state.result = {
      pass: pass,
      level: state.level,
      hidden: hidden,
      expected: expected,
      got: got,
      matchA: diff.matchA,
      missing: diff.missing,
      extra: diff.extra.map(function (index) { return got[index]; }),
      ai: false,
      aiNote: ''
    };

    if (pass) passItem(item, state.level, false);
    else failItem(item, state.level);

    renderSession();
  }

  function retry() {
    const item = currentItem();
    if (!item) return;
    state.level = progressOf(item.key).level;
    state.answer = '';
    state.result = null;
    state.revealed = false;
    state.hint = false;
    renderSession();
    const input = $('#recite-input');
    if (input) input.focus();
  }

  function reveal() {
    state.revealed = true;
    state.result = null;
    renderSession();
  }

  function next() {
    if (state.index + 1 >= state.queue.length) {
      state.done = true;
      renderSession();
      return;
    }
    state.index += 1;
    beginItem();
  }

  function speak() {
    const item = currentItem();
    if (!item || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(item.fullText);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      /* 不支持朗读时静默 */
    }
  }

  function parseAiJson(text) {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const data = JSON.parse(match[0]);
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  async function aiReview() {
    const item = currentItem();
    if (!item || state.aiBusy || !state.result || state.result.pass) return;
    if (!App.store.hasKey()) return;

    state.aiBusy = true;
    renderSession();

    const variables = item.variables.map(function (v) { return v.name + ' = ' + v.text; }).join('；');
    const messages = [
      {
        role: 'system',
        content: '你是考研英语大作文模板背诵的判卷老师。学生按提示默写模板句。' +
          '目标句里的可变部分（主题词、数据、人物等）是示例内容，学生不需要写，也不算错；' +
          '固定句式必须结构完整、关键短语一致。允许同义替换和轻微语序变化。' +
          '只输出一个 JSON 对象：{"pass":true或false,"issues":"不超过60字的中文问题说明","corrected":"完整正确的英文句子"}'
      },
      {
        role: 'user',
        content: '目标句：' + item.fullText + '\n可变部分：' + (variables || '无') +
          '\n学生默写的固定部分：' + String(state.answer || '')
      }
    ];

    try {
      const text = await App.api.chat({ messages: messages, override: { stream: false } });
      const data = parseAiJson(text);
      if (!data) throw new Error('AI 返回格式无法解析');
      if (data.pass) {
        const p = ensureProgress(item.key);
        p.lastPass = true;
        p.fam = 2;
        p.level = 4;
        p.pass += 1;
        p.streak += 1;
        p.lastAt = Date.now();
        p.ai = 1;
        saveStore();
        state.result.pass = true;
        state.result.ai = true;
        state.result.aiNote = data.issues ? String(data.issues).slice(0, 80) : '';
      } else {
        state.result.aiNote = (data.issues ? String(data.issues).slice(0, 100) : 'AI 认为固定句式还不够准确。');
      }
    } catch (err) {
      state.result.aiNote = 'AI 复核失败：' + (err && err.message ? err.message : '请求出错');
    }

    state.aiBusy = false;
    renderSession();
  }

  /* ---------------- 事件 ---------------- */

  function onClick(event) {
    const tab = event.target.closest('[data-recite-tab]');
    if (tab) {
      state.tab = tab.dataset.reciteTab;
      renderHome();
      return;
    }

    const row = event.target.closest('[data-recite-scope]');
    if (row) {
      startCollection(findCollection(row.dataset.reciteScope), false);
      return;
    }

    if (event.target.closest('[data-recite-today]')) {
      startCollection(todayCollection(), false);
      return;
    }

    if (event.target.closest('[data-recite-continue]')) {
      const col = lastCollection();
      if (col) startCollection(col, false, store.last.key);
      return;
    }

    if (event.target.closest('[data-recite-goto-combo]')) {
      const chip = document.querySelector('#tpl-modes [data-tpl-mode="combo"]');
      if (chip) chip.click();
      return;
    }

    const level = event.target.closest('[data-recite-level]');
    if (level) {
      state.level = Number(level.dataset.reciteLevel) || 1;
      state.answer = '';
      state.result = null;
      state.revealed = false;
      state.hint = false;
      renderSession();
      return;
    }

    if (event.target.closest('[data-recite-home]')) {
      state.view = 'home';
      renderHome();
      window.scrollTo(0, 0);
      return;
    }

    if (event.target.closest('[data-recite-again]')) {
      state.index = 0;
      state.done = false;
      beginItem();
      return;
    }

    if (event.target.closest('#btn-recite-check')) { check(); return; }
    if (event.target.closest('#btn-recite-retry')) { retry(); return; }
    if (event.target.closest('#btn-recite-show') || event.target.closest('#btn-recite-reveal')) { reveal(); return; }
    if (event.target.closest('#btn-recite-next')) { next(); return; }
    if (event.target.closest('#btn-recite-hint')) {
      state.hint = !state.hint;
      renderSession();
      return;
    }
    if (event.target.closest('#btn-recite-tts')) { speak(); return; }
    if (event.target.closest('#btn-recite-ai')) { aiReview(); }
  }

  function onInput(event) {
    if (event.target.id === 'recite-input') state.answer = event.target.value;
  }

  function onKeydown(event) {
    if (event.target.id === 'recite-input' && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      check();
    }
  }

  function bind() {
    if (bound) return;
    const root = $('#mode-recite');
    if (!root) return;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', onKeydown);
    bound = true;
  }

  function show() {
    bind();
    store = readStore();
    state.collections = buildCollections();
    state.view = 'home';
    state.done = false;
    $('#mode-recite').hidden = false;
    $('#fill-work').hidden = true;
    renderHome();
    window.scrollTo(0, 0);
  }

  App.recite = { show: show, init: bind };
})(window.App);
