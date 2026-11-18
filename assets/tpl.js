/* 模板填空入口：整篇模板选篇 + AI 归来自选模板模式切换
   填空、题目、判定、复盘、复制统一交给 assets/fill.js */

window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const esc = function (text) { return App.runner.escapeAttr(text); };

  const DRAFT_KEY = 'kaoyan-trainer-tpl-draft-v1';
  const ACTIVE_KEY = 'kaoyan-trainer-tpl-active-v1';
  const MODE_KEY = 'kaoyan-trainer-tpl-mode-v1';

  const state = {
    template: null,
    mode: 'whole'
  };

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

  /* ---------------- 整篇模板选篇 ---------------- */

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

  function headHtml(t) {
    return '<div class="tpl-head-main"><p class="eyebrow">整篇模板 ' + t.no + ' / 07</p>' +
      '<h2>' + esc(t.kind) + ' · ' + esc(t.title) + '</h2>' +
      '<p class="tpl-use">' + esc(t.use) + '</p></div>';
  }

  function openTemplate(id) {
    const t = App.templates.get(id);
    if (!t) return;
    state.template = t;
    writeJSON(ACTIVE_KEY, { id: id });
    $('#mode-whole').hidden = true;
    $('#fill-work').hidden = false;
    App.fill.open(t, {
      draftKey: DRAFT_KEY,
      bucket: id,
      headHtml: headHtml(t),
      backLabel: '换一篇',
      onBack: showPicker
    });
    window.scrollTo(0, 0);
  }

  function showPicker() {
    state.template = null;
    writeJSON(ACTIVE_KEY, { id: '' });
    $('#fill-work').hidden = true;
    $('#mode-whole').hidden = false;
    renderPick();
    window.scrollTo(0, 0);
  }

  /* ---------------- 模式切换 ---------------- */

  function setChips() {
    document.querySelectorAll('#tpl-modes [data-tpl-mode]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.tplMode === state.mode);
    });
  }

  function switchMode(mode) {
    state.mode = mode === 'combo' ? 'combo' : 'whole';
    writeJSON(MODE_KEY, { mode: state.mode });
    setChips();
    $('#fill-work').hidden = true;
    $('#mode-whole').hidden = state.mode !== 'whole';
    $('#mode-combo').hidden = state.mode !== 'combo';
    if (state.mode === 'whole') {
      App.tpl.showPicker();
    } else if (App.combo) {
      App.combo.show();
    }
    window.scrollTo(0, 0);
  }

  function init() {
    App.fill.init();
    renderPick();

    $('#tpl-pick').addEventListener('click', function (e) {
      const card = e.target.closest('[data-tpl]');
      if (card) openTemplate(card.dataset.tpl);
    });

    document.querySelectorAll('#tpl-modes [data-tpl-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () { switchMode(btn.dataset.tplMode); });
    });

    const saved = readJSON(MODE_KEY, { mode: 'whole' });
    const mode = saved.mode === 'combo' ? 'combo' : 'whole';
    const active = readJSON(ACTIVE_KEY, { id: '' }).id;

    if (mode !== 'whole') {
      switchMode(mode);
      return;
    }
    state.mode = 'whole';
    setChips();
    if (active && App.templates.get(active)) openTemplate(active);
  }

  App.tpl = {
    init: init,
    showPicker: showPicker
  };
})(window.App);
