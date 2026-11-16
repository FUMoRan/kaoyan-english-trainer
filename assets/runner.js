/* 统一的 AI 任务执行：流式渲染、状态条、停止、错误展示 */
window.App = window.App || {};

(function (App) {
  'use strict';

  let running = null;

  function showStatus(text) {
    document.getElementById('status-text').textContent = text;
    document.getElementById('statusbar').hidden = false;
  }

  function hideStatus() {
    document.getElementById('statusbar').hidden = true;
  }

  function escapeAttr(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showError(target, err) {
    const isStop = err && err.message === '已停止生成。';
    if (isStop) return;
    const detail = err && err.detail ? '<p class="detail">' + escapeAttr(err.detail) + '</p>' : '';
    target.hidden = false;
    target.innerHTML = '<div class="error-card"><strong>' +
      escapeAttr(err && err.message ? err.message : '请求失败') +
      '</strong><span>可以在「设置 → 测试连接」里先确认 Key 和接口是否正常。</span>' + detail + '</div>';
  }

  function renderSections(target, markdown) {
    const parts = App.md.sections(markdown);
    const hasTitles = parts.some(function (p) { return p.title; });
    if (!hasTitles) {
      target.innerHTML = '<article class="card"><div class="md">' + App.md.render(markdown) + '</div></article>';
      return;
    }
    target.innerHTML = parts.map(function (p) {
      const head = p.title ? '<h3>' + escapeAttr(p.title) + '</h3>' : '';
      return '<article class="card">' + head + '<div class="md">' + App.md.render(p.body) + '</div></article>';
    }).join('');
  }

  /* 节流渲染，避免每个 token 都重排 */
  function throttlePainter(target) {
    let last = 0;
    let timer = null;
    let latest = '';
    function paint() {
      last = Date.now();
      target.innerHTML = '<article class="card"><div class="md">' + App.md.render(latest) + '</div></article>';
    }
    function paintThrottled(full) {
      latest = full;
      if (Date.now() - last > 90) {
        paint();
      } else if (!timer) {
        timer = setTimeout(function () { timer = null; paint(); }, 90);
      }
    }
    paintThrottled.cancel = function () {
      if (timer) { clearTimeout(timer); timer = null; }
    };
    return paintThrottled;
  }

  async function run(opts) {
    if (running) return null;
    const ctrl = new AbortController();
    running = ctrl;
    const trigger = opts.trigger;
    if (trigger) trigger.disabled = true;
    showStatus(opts.statusText || '正在生成…');

    try {
      const text = await App.api.chat({
        messages: opts.messages,
        signal: ctrl.signal,
        onDelta: function (delta, full) {
          if (opts.onDelta) opts.onDelta(full);
          else if (opts.buffer) { opts.buffer.text = full; if (opts.paint) opts.paint(full); }
        }
      });
      if (opts.paint && opts.paint.cancel) opts.paint.cancel();
      if (opts.onDone) await opts.onDone(text);
      else if (opts.target) renderSections(opts.target, text);
      return text;
    } catch (err) {
      if (opts.paint && opts.paint.cancel) opts.paint.cancel();
      if (err && err.message === '已停止生成。') {
        if (opts.buffer && opts.buffer.text && opts.target) renderSections(opts.target, opts.buffer.text);
      } else if (opts.onError) {
        opts.onError(err);
      } else if (opts.target) {
        showError(opts.target, err);
      }
      return null;
    } finally {
      running = null;
      hideStatus();
      if (trigger) trigger.disabled = false;
    }
  }

  function stop() {
    if (running) running.abort();
  }

  App.runner = {
    run: run,
    stop: stop,
    showStatus: showStatus,
    hideStatus: hideStatus,
    showError: showError,
    renderSections: renderSections,
    throttlePainter: throttlePainter,
    escapeAttr: escapeAttr
  };
})(window.App);
