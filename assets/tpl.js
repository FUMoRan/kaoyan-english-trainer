/* 模板填空：选篇 → 选真题题目 → 逐空填写 → AI 判定 → 记入复盘 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const esc = function (text) { return App.runner.escapeAttr(text); };

  const DRAFT_KEY = 'kaoyan-trainer-tpl-draft-v1';
  const ACTIVE_KEY = 'kaoyan-trainer-tpl-active-v1';
  const TOPIC_URL = 'assets/writing-topics.json';

  const state = {
    template: null,
    topics: null,
    topic: null,
    values: {},
    report: '',
    parsed: null,
    result: null,
    loadingTopic: false
  };

  /* ---------------- 本地草稿 ---------------- */

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* 隐私模式写不进去就只在内存里用 */
    }
  }

  function drafts() {
    return readJSON(DRAFT_KEY, {});
  }

  function saveDraft() {
    if (!state.template) return;
    const all = drafts();
    all[state.template.id] = state.values;
    writeJSON(DRAFT_KEY, all);
  }

  function loadDraft(id) {
    const all = drafts();
    return all[id] || {};
  }

  /* ---------------- 渲染：模板选择 ---------------- */

  function renderPick() {
    const active = state.template ? state.template.id : '';
    $('#tpl-pick').innerHTML = App.templates.list.map(function (t) {
      return '<button type="button" class="tpl-card' + (t.id === active ? ' is-active' : '') +
        '" data-tpl="' + t.id + '">' +
        '<span class="tpl-card-top"><b>' + t.no + '</b><span>' + esc(t.kind) + '</span></span>' +
        '<strong>' + esc(t.title) + '</strong>' +
        '<span class="tpl-card-meta">' + esc(t.feature) + '</span>' +
        '<span class="tpl-card-foot">' + t.blanks.length + ' 空 · ' + esc(t.example) + '</span>' +
        '</button>';
    }).join('');
  }

  /* ---------------- 渲染：正文与提示 ---------------- */

  function slotHtml(no, values) {
    const value = values[no] || '';
    return '<span class="tpl-slot"><b class="tpl-no">' + no + '</b>' +
      '<input class="tpl-input" type="text" spellcheck="false" autocomplete="off" ' +
      'data-tpl-blank="' + no + '" value="' + esc(value) + '" aria-label="空位 ' + no + '"></span>';
  }

  function paragraphHtml(text, values) {
    return App.templates.splitParagraph(text).map(function (token) {
      if (token.type === 'text') return esc(token.text);
      return slotHtml(token.no, values);
    }).join('');
  }

  function renderBody() {
    const t = state.template;
    const box = $('#tpl-body');
    box.innerHTML = t.paragraphs.map(function (p, i) {
      return '<p class="tpl-para" data-para="' + (i + 1) + '">' + paragraphHtml(p, state.values) + '</p>';
    }).join('');
    fitAll();
    updateProgress();
  }

  function renderTips() {
    const t = state.template;
    $('#tpl-tips').innerHTML =
      '<details class="details tpl-tip-box">' +
      '<summary>空位填写说明（' + t.blanks.length + ' 空，先看汉语提示再动笔）</summary>' +
      '<div class="tpl-tip-list">' + t.blanks.map(function (b) {
        return '<div class="tpl-tip-row" data-tip-no="' + b.no + '">' +
          '<b class="tpl-tip-no">' + b.no + '</b>' +
          '<div class="tpl-tip-main"><p>' + esc(b.hint) + '</p>' +
          (b.sample
            ? '<details class="tpl-sample"><summary>看示例</summary><p class="tpl-sample-text">' + esc(b.sample) + '</p></details>'
            : '') +
          '</div></div>';
      }).join('') + '</div></details>' +
      (t.extra ? '<p class="hint tpl-extra">' + esc(t.extra.replace(/^替换｜/, '替换：')) + '</p>' : '');
  }

  function renderHead() {
    const t = state.template;
    $('#tpl-head').innerHTML =
      '<div class="tpl-head-main"><p class="eyebrow">整篇模板 ' + t.no + ' / 07</p>' +
      '<h2>' + esc(t.kind) + ' · ' + esc(t.title) + '</h2>' +
      '<p class="tpl-use">' + esc(t.use) + '</p></div>' +
      '<button type="button" class="btn ghost small" id="btn-tpl-change">换一篇</button>';
    $('#btn-tpl-change').addEventListener('click', function () {
      state.template = null;
      writeJSON(ACTIVE_KEY, { id: '' });
      $('#tpl-work').hidden = true;
      $('#tpl-pick').hidden = false;
      renderPick();
      window.scrollTo(0, 0);
    });
  }

  /* ---------------- 题目（真题大作文） ---------------- */

  function loadTopics() {
    if (state.topics || state.loadingTopic) return Promise.resolve();
    state.loadingTopic = true;
    return fetch(TOPIC_URL).then(function (res) {
      if (!res.ok) throw new Error('题目库加载失败');
      return res.json();
    }).then(function (list) {
      state.topics = Array.isArray(list) ? list : [];
      renderTopicSelect();
    }).catch(function () {
      state.topics = [];
    }).then(function () {
      state.loadingTopic = false;
    });
  }

  function renderTopicSelect() {
    const sel = $('#tpl-topic-select');
    if (!sel || !state.topics) return;
    sel.innerHTML = '<option value="">不指定题目（用示例主题练手）</option>' +
      state.topics.map(function (item) {
        return '<option value="' + item.year + '">' + esc(item.label) + '</option>';
      }).join('');
    if (state.topic) sel.value = String(state.topic.year);
  }

  function renderTopicBox() {
    const box = $('#tpl-topic-box');
    const t = state.topic;
    if (!t) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML =
      '<div class="tpl-topic-head"><span class="tpl-topic-label">' + esc(t.label) + '</span>' +
      (t.sample ? '<button type="button" class="link-btn" id="btn-topic-sample">看参考范文</button>' : '') +
      '</div>' +
      (t.images.length
        ? '<div class="tpl-topic-imgs">' + t.images.map(function (src) {
          return '<img src="' + esc(src) + '" alt="' + esc(t.label) + ' 题目图片" loading="lazy">';
        }).join('') + '</div>'
        : '') +
      '<p class="tpl-topic-stem">' + esc(t.stem).replace(/\n/g, '<br>') + '</p>' +
      (t.sample ? '<div class="tpl-topic-sample" id="topic-sample" hidden>' +
        '<p class="tpl-topic-sample-text">' + esc(t.sample).replace(/\n/g, '<br>') + '</p></div>' : '');

    const btn = $('#btn-topic-sample');
    if (btn) {
      btn.addEventListener('click', function () {
        const sample = $('#topic-sample');
        sample.hidden = !sample.hidden;
        btn.textContent = sample.hidden ? '看参考范文' : '收起范文';
      });
    }
  }

  /* ---------------- 交互 ---------------- */

  function fitInput(input) {
    const len = String(input.value || '').length;
    const limit = Math.min(460, Math.max(140, window.innerWidth - 96));
    const width = Math.max(64, Math.min(limit, len * 8.2 + 30));
    input.style.width = width + 'px';
  }

  function fitAll() {
    document.querySelectorAll('#tpl-body .tpl-input').forEach(fitInput);
  }

  function updateProgress() {
    const t = state.template;
    if (!t) return;
    const filled = t.blanks.filter(function (b) {
      return String(state.values[b.no] || '').trim() !== '';
    }).length;
    $('#tpl-progress').textContent = '已填 ' + filled + ' / ' + t.blanks.length + ' 空';
    $('#tpl-progress').className = filled === t.blanks.length ? 'tpl-progress is-done' : 'tpl-progress';
  }

  function onInput(e) {
    const input = e.target.closest('.tpl-input');
    if (!input) return;
    const no = Number(input.dataset.tplBlank);
    const value = input.value;
    state.values[no] = value;
    saveDraft();
    document.querySelectorAll('#tpl-body .tpl-input[data-tpl-blank="' + no + '"]').forEach(function (peer) {
      if (peer !== input) peer.value = value;
      fitInput(peer);
    });
    fitInput(input);
    updateProgress();
  }

  function openTemplate(id) {
    const t = App.templates.get(id);
    if (!t) return;
    state.template = t;
    state.values = loadDraft(id) || {};
    state.report = '';
    state.parsed = null;
    state.result = null;
    writeJSON(ACTIVE_KEY, { id: id });
    $('#tpl-pick').hidden = true;
    $('#tpl-work').hidden = false;
    $('#tpl-result').hidden = true;
    $('#tpl-result').innerHTML = '';
    $('#btn-tpl-copy').hidden = true;
    renderHead();
    renderBody();
    renderTips();
    renderTopicSelect();
    renderTopicBox();
    loadTopics();
    window.scrollTo(0, 0);
  }

  /* ---------------- 判定 ---------------- */

  function answers() {
    return state.template.blanks.map(function (b) {
      return { no: b.no, label: b.label, value: String(state.values[b.no] || '').trim() };
    });
  }

  async function judge() {
    const t = state.template;
    if (!t) return;
    const list = answers();
    const filled = list.filter(function (a) { return a.value; }).length;
    const target = $('#tpl-result');

    if (filled < 3) {
      target.hidden = false;
      target.innerHTML = '<div class="error-card"><strong>先填几个空再判。</strong><span>至少填 3 个空，AI 才能看出你的问题。</span></div>';
      return;
    }

    if (!App.store.hasKey()) {
      target.hidden = false;
      target.innerHTML = '<div class="error-card"><strong>还没配置 API Key。</strong>' +
        '<span>点右上角「设置」，选一个服务商并填入 Key，就能让 AI 判空。</span></div>';
      return;
    }

    target.hidden = false;
    target.innerHTML = '';
    $('#btn-tpl-copy').hidden = true;

    const messages = App.config.templateMessages({
      template: t,
      topic: state.topic ? state.topic.label + '\n' + state.topic.stem : '',
      answers: list
    });

    const text = await App.runner.run({
      trigger: $('#btn-tpl-judge'),
      statusText: '正在逐空判断…',
      messages: messages,
      buffer: { text: '' },
      paint: App.runner.throttlePainter(target),
      onError: function (err) { App.runner.showError(target, err); }
    });

    if (!text) return;
    finish(text);
  }

  function finish(report) {
    const t = state.template;
    const parsed = App.review.parseReport(report, t.blanks.length);
    state.report = report;
    state.parsed = parsed;

    const body = App.review.stripSection(report, '错空记录');
    App.runner.renderSections($('#tpl-result'), body);
    $('#btn-tpl-copy').hidden = !App.review.sectionText(report, '誊写版');

    if (!parsed.reliable) {
      $('#tpl-result').insertAdjacentHTML('afterbegin',
        '<div class="error-card"><strong>这次的报告格式没对上，没法自动统计。</strong>' +
        '<span>上面的逐空判定仍然可以看；点「交给 AI 判断」再试一次，通常会恢复。本次不计入复盘。</span></div>');
      return;
    }

    const wrong = parsed.wrong;
    const summary =
      '<article class="card tpl-verdict' + (wrong.length ? '' : ' is-perfect') + '">' +
      '<div class="tpl-verdict-top"><h3>' + (wrong.length ? '通过 ' + parsed.passCount + ' / ' + t.blanks.length : '全部通过') + '</h3>' +
      '<span class="hint">' + (wrong.length
        ? '点下面的编号可以跳回原句修改'
        : '这篇可以直接誊写；想再稳一点，可以换一个题目重练。') + '</span></div>' +
      (wrong.length
        ? '<div class="chips tpl-wrong-chips">' + wrong.map(function (no) {
          const row = parsed.rows.filter(function (r) { return r.no === no; })[0];
          return '<button type="button" class="chip tpl-wrong-chip" data-goto-blank="' + no + '" title="' +
            esc(row && row.note ? row.note : '需修改') + '">' + no + '</button>';
        }).join('') + '</div>'
        : '') +
      '</article>';

    $('#tpl-result').insertAdjacentHTML('afterbegin', summary);

    const record = App.review.add({
      templateId: t.id,
      templateNo: t.no,
      templateTitle: t.kind + ' · ' + t.title,
      total: t.blanks.length,
      wrong: wrong,
      detail: parsed.rows.filter(function (r) { return !r.pass; }),
      topic: state.topic ? state.topic.label : ''
    });

    if (record) {
      $('#tpl-result').querySelector('.tpl-verdict').insertAdjacentHTML('beforeend',
        '<p class="hint">已记入「复盘」，错的空位会累计成你的高频失分点。</p>');
    }

    $('#btn-tpl-copy').hidden = !App.review.sectionText(report, '誊写版');
    $('#tpl-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function gotoBlank(no) {
    const input = document.querySelector('#tpl-body .tpl-input[data-tpl-blank="' + no + '"]');
    if (!input) return;
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.classList.add('is-flash');
    input.focus();
    setTimeout(function () { input.classList.remove('is-flash'); }, 1200);
  }

  /* 用当前填写内容拼出完整三段；没填的空用 [编号] 占位 */
  function buildMyEssay() {
    const t = state.template;
    if (!t) return '';
    return t.paragraphs.map(function (p) {
      return App.templates.splitParagraph(p).map(function (token) {
        if (token.type === 'text') return token.text;
        const value = String(state.values[token.no] || '').trim();
        return value || '[' + token.no + ']';
      }).join('');
    }).join('\n\n');
  }

  function copyText(text, btn) {
    if (!text) return;
    const done = function () {
      const old = btn.textContent;
      btn.textContent = '已复制';
      setTimeout(function () { btn.textContent = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function copyMine() {
    const t = state.template;
    if (!t) return;
    const btn = $('#btn-tpl-copy-mine');
    const filled = t.blanks.filter(function (b) {
      return String(state.values[b.no] || '').trim() !== '';
    }).length;
    if (!filled) {
      const old = btn.textContent;
      btn.textContent = '先填几个空';
      setTimeout(function () { btn.textContent = old; }, 1400);
      return;
    }
    copyText(buildMyEssay(), btn);
  }

  function copyEssay() {
    const text = App.review.sectionText(state.report, '誊写版')
      .replace(/\[改[:：]\s*\d+\]/g, '')
      .replace(/\*\*/g, '')
      .trim();
    if (!text) return;
    copyText(text, $('#btn-tpl-copy'));
  }

  function fallbackCopy(text, done) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
    area.remove();
  }

  function clearAnswers() {
    if (!state.template) return;
    if (!window.confirm('清空这一篇已填的内容？')) return;
    state.values = {};
    saveDraft();
    $('#tpl-result').hidden = true;
    $('#tpl-result').innerHTML = '';
    $('#btn-tpl-copy').hidden = true;
    renderBody();
  }

  /* ---------------- 启动 ---------------- */

  function init() {
    renderPick();
    loadTopics();

    $('#tpl-pick').addEventListener('click', function (e) {
      const card = e.target.closest('[data-tpl]');
      if (card) openTemplate(card.dataset.tpl);
    });

    $('#tpl-body').addEventListener('input', onInput);

    $('#tpl-topic-select').addEventListener('change', function () {
      const year = Number(this.value);
      state.topic = year && state.topics
        ? state.topics.filter(function (t) { return t.year === year; })[0] || null
        : null;
      renderTopicBox();
    });

    $('#btn-tpl-judge').addEventListener('click', judge);
    $('#btn-tpl-clear').addEventListener('click', clearAnswers);
    $('#btn-tpl-copy').addEventListener('click', copyEssay);
    $('#btn-tpl-copy-mine').addEventListener('click', copyMine);

    $('#tpl-result').addEventListener('click', function (e) {
      const chip = e.target.closest('[data-goto-blank]');
      if (chip) gotoBlank(Number(chip.dataset.gotoBlank));
    });

    const active = readJSON(ACTIVE_KEY, {});
    if (active && active.id) openTemplate(active.id);
  }

  App.tpl = { init: init, open: openTemplate, fullText: buildMyEssay };
})(window.App);
