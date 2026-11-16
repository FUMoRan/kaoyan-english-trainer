/* 界面：模块切换、设置、长难句拆解、复盘 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  const TABS = ['sentence', 'tpl', 'review'];

  /* ---------------- 模块切换 ---------------- */

  function switchTab(name) {
    TABS.forEach(function (key) {
      const btn = $('#tab-' + key);
      const panel = $('#panel-' + key);
      const on = key === name;
      if (btn) {
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      }
      if (panel) panel.hidden = !on;
    });
    if (name === 'review') renderReview();
    if (name === 'sentence') {
      const input = $('#sentence-input');
      if (input && !input.value) {
        try { input.focus({ preventScroll: true }); } catch (e) { /* 忽略 */ }
      }
    }
    window.scrollTo(0, 0);
  }

  /* ---------------- 设置 ---------------- */

  function providerNote(provider) {
    const p = App.config.PROVIDERS[provider];
    return p ? p.note : '';
  }

  function fillProvider(provider) {
    const p = App.config.PROVIDERS[provider];
    if (!p) return;
    $('#set-baseurl').value = p.baseURL || '';
    $('#set-model').value = p.model || '';
    $('#set-provider-note').textContent = providerNote(provider);
  }

  function openSettings() {
    const s = App.store.getSettings();
    const sel = $('#set-provider');
    sel.innerHTML = Object.keys(App.config.PROVIDERS).map(function (key) {
      return '<option value="' + key + '">' + App.config.PROVIDERS[key].label + '</option>';
    }).join('');
    sel.value = s.provider;
    $('#set-baseurl').value = s.baseURL;
    $('#set-model').value = s.model;
    $('#set-key').value = s.apiKey;
    $('#set-stream').checked = s.stream !== false;
    $('#set-provider-note').textContent = providerNote(s.provider);
    $('#test-result').hidden = true;
    $('#settings').hidden = false;
  }

  function closeSettings() {
    $('#settings').hidden = true;
  }

  function saveSettings() {
    const provider = $('#set-provider').value;
    App.store.saveSettings({
      provider: provider,
      baseURL: $('#set-baseurl').value.trim(),
      model: $('#set-model').value.trim(),
      apiKey: $('#set-key').value.trim(),
      stream: $('#set-stream').checked
    });
    refreshKeyDot();
    closeSettings();
  }

  function refreshKeyDot() {
    $('#key-dot').hidden = App.store.hasKey();
  }

  async function testConnection() {
    App.store.saveSettings({
      provider: $('#set-provider').value,
      baseURL: $('#set-baseurl').value.trim(),
      model: $('#set-model').value.trim(),
      apiKey: $('#set-key').value.trim()
    });
    const box = $('#test-result');
    box.hidden = false;
    box.className = 'status';
    box.textContent = '正在测试…';
    try {
      const msg = await App.api.testConnection();
      box.className = 'status ok';
      box.textContent = msg;
    } catch (err) {
      box.className = 'status bad';
      box.textContent = err.message + (err.detail ? '（' + err.detail.slice(0, 120) + '）' : '');
    }
  }

  /* ---------------- 长难句拆解 ---------------- */

  function spineCard(yours, ai) {
    if (!yours && !ai) return '';
    return '<article class="card spine-card"><h3>主干对照</h3>' +
      '<div class="spine-grid">' +
      '<div class="spine-col"><span class="spine-label">你的版本</span><p class="spine-text">' +
      (yours ? App.runner.escapeAttr(yours) : '<span class="hint">没填，下次先自己划</span>') + '</p></div>' +
      '<div class="spine-col"><span class="spine-label">参考主干</span><p class="spine-text">' +
      (ai ? App.runner.escapeAttr(ai) : '<span class="hint">未识别到这节</span>') + '</p></div>' +
      '</div></article>';
  }

  async function runSentence() {
    const input = $('#sentence-input');
    const spine = $('#sentence-spine');
    const target = $('#sentence-result');
    const text = input.value.trim();

    if (!text) {
      target.hidden = false;
      target.innerHTML = '<div class="error-card"><strong>先把句子粘进来。</strong><span>一句就够，太长的段落拆开练。</span></div>';
      input.focus();
      return;
    }
    if (!App.store.hasKey()) {
      target.hidden = false;
      target.innerHTML = '<div class="error-card"><strong>还没配置 API Key。</strong>' +
        '<span>点右上角「设置」，选一个服务商并填入 Key。</span></div>';
      openSettings();
      return;
    }

    target.hidden = false;
    target.innerHTML = '';

    const result = await App.runner.run({
      trigger: $('#btn-sentence'),
      statusText: '正在拆句子…',
      messages: App.config.sentenceMessages(text),
      buffer: { text: '' },
      paint: App.runner.throttlePainter(target),
      onError: function (err) { App.runner.showError(target, err); }
    });

    if (!result) return;
    const aiSpine = App.review.sectionText(result, '绝对主干')
      .replace(/^[\s\S]*?[:：]\s*/, '')
      .replace(/\*\*/g, '')
      .trim()
      .split(/\r?\n/)[0] || '';
    App.runner.renderSections(target, result);
    const card = spineCard(spine.value.trim(), aiSpine);
    if (card) target.insertAdjacentHTML('afterbegin', card);
  }

  /* ---------------- 复盘 ---------------- */

  function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function renderReview() {
    const summary = App.review.summary();
    const list = App.review.list();

    $('#review-summary').textContent = summary.attempts
      ? '共判定 ' + summary.attempts + ' 次，累计 ' + summary.wrongTotal + ' 个空需要改。'
      : '还没有记录。去「模板填空」填一篇并交给 AI 判断，错的空位会自动记到这里。';

    $('#review-blanks').innerHTML = summary.ranked.slice(0, 12).map(function (item) {
      return '<span class="chip review-chip">第 ' + item.no + ' 空 · 错 ' + item.count + ' 次</span>';
    }).join('');

    $('#review-templates').innerHTML = summary.templates.length
      ? '<div class="review-table">' + summary.templates.map(function (t) {
        const rate = t.total ? Math.round((t.wrong / t.total) * 100) : 0;
        return '<div class="review-row"><span class="review-row-name">' + App.runner.escapeAttr(t.label) + '</span>' +
          '<span class="review-row-meta">' + t.times + ' 次 · 错 ' + t.wrong + ' / ' + t.total + ' 空（' + rate + '%）</span></div>';
      }).join('') + '</div>'
      : '';

    $('#review-list').innerHTML = list.length
      ? list.map(function (r, i) {
        const chips = (r.wrong && r.wrong.length)
          ? r.wrong.map(function (no) { return '<span class="chip is-bad">' + no + '</span>'; }).join('')
          : '<span class="chip is-ok">全过</span>';
        const detail = (r.detail || []).map(function (d) {
          return '<li><b>' + d.no + '</b> ' + App.runner.escapeAttr(d.note || '') +
            (d.fix ? '<span class="review-fix"> → ' + App.runner.escapeAttr(d.fix) + '</span>' : '') + '</li>';
        }).join('');
        return '<details class="review-item">' +
          '<summary><span class="review-item-title">' + App.runner.escapeAttr(r.templateNo + ' ' + r.templateTitle) + '</span>' +
          '<span class="review-item-meta">' + fmtTime(r.at) + (r.topic ? ' · ' + App.runner.escapeAttr(r.topic) : '') + '</span>' +
          '<span class="review-item-chips">' + chips + '</span></summary>' +
          (detail ? '<ul class="review-detail">' + detail + '</ul>' : '<p class="hint">这次没有需要改的空。</p>') +
          '</details>';
      }).join('')
      : '<p class="hint">暂无历史记录。</p>';
  }

  function clearReview() {
    if (!window.confirm('清空全部填空复盘记录？')) return;
    App.review.clear();
    renderReview();
  }

  /* ---------------- 启动 ---------------- */

  function init() {
    $$('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
    });

    $('#btn-settings').addEventListener('click', openSettings);
    $('#btn-close-settings').addEventListener('click', closeSettings);
    $('#settings').addEventListener('click', function (e) {
      if (e.target === $('#settings')) closeSettings();
    });
    $('#set-provider').addEventListener('change', function () { fillProvider(this.value); });
    $('#btn-save').addEventListener('click', saveSettings);
    $('#btn-test').addEventListener('click', testConnection);

    $('#btn-sentence').addEventListener('click', runSentence);
    $('#btn-stop').addEventListener('click', App.runner.stop);
    $('#btn-clear-review').addEventListener('click', clearReview);

    $('#sentence-input').addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runSentence();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#settings').hidden) closeSettings();
    });

    refreshKeyDot();
    App.tpl.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.App);
