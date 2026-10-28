/* 界面逻辑：Tab 切换、设置、三段式批改流程、流式渲染 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  let running = null;
  const essayState = { image: null };

  /* ---------------- 通用状态 ---------------- */

  function showStatus(text) {
    $('#status-text').textContent = text;
    $('#statusbar').hidden = false;
  }

  function hideStatus() {
    $('#statusbar').hidden = true;
  }

  function showError(target, err) {
    const isStop = err && err.message === '已停止生成。';
    if (isStop) return;
    const detail = err && err.detail ? '<p class="detail">' + escapeAttr(err.detail) + '</p>' : '';
    target.hidden = false;
    target.innerHTML = '<div class="error-card"><strong>' + escapeAttr(err && err.message ? err.message : '请求失败') +
      '</strong><span>可以在「设置 → 测试连接」里先确认 Key 和接口是否正常。</span>' + detail + '</div>';
  }

  function escapeAttr(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- 结果渲染 ---------------- */

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

  /* ---------------- 统一的任务执行 ---------------- */

  async function run(opts) {
    if (running) return;
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
          else if (opts.buffer) { opts.buffer.text = full; opts.paint && opts.paint(full); }
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

  /* ---------------- Tab ---------------- */

  function switchTab(name) {
    $$('.tab').forEach(function (t) {
      const active = t.dataset.tab === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('.panel').forEach(function (p) {
      p.hidden = p.id !== 'panel-' + name;
    });
  }

  /* ---------------- 设置 ---------------- */

  function providerOptions() {
    const sel = $('#set-provider');
    sel.innerHTML = Object.keys(App.config.PROVIDERS).map(function (key) {
      return '<option value="' + key + '">' + escapeAttr(App.config.PROVIDERS[key].label) + '</option>';
    }).join('');
  }

  function applyProviderPreset(key, overwrite) {
    const preset = App.config.PROVIDERS[key];
    if (!preset) return;
    $('#set-provider-note').textContent = preset.note + (preset.keyURL ? ' 申请地址：' + preset.keyURL : '');
    if (overwrite) {
      $('#set-baseurl').value = preset.baseURL;
      $('#set-model').value = preset.model;
    }
  }

  function openSettings() {
    const s = App.store.getSettings();
    providerOptions();
    $('#set-provider').value = s.provider;
    $('#set-baseurl').value = s.baseURL;
    $('#set-model').value = s.model;
    $('#set-key').value = s.apiKey;
    $('#set-stream').checked = !!s.stream;
    applyProviderPreset(s.provider, false);
    $('#test-result').hidden = true;
    $('#settings').hidden = false;
  }

  function closeSettings() {
    $('#settings').hidden = true;
  }

  function currentFormSettings() {
    return {
      provider: $('#set-provider').value,
      baseURL: $('#set-baseurl').value.trim(),
      model: $('#set-model').value.trim(),
      apiKey: $('#set-key').value.trim(),
      stream: $('#set-stream').checked
    };
  }

  function refreshKeyHint() {
    const has = App.store.hasKey();
    $('#key-dot').hidden = has;
    $('#essay-nokey').hidden = has;
  }

  /* ---------------- 三个训练模块 ---------------- */

  function initSentence() {
    $('#btn-sentence').addEventListener('click', function () {
      const text = $('#sentence-input').value.trim();
      const target = $('#sentence-result');
      if (text.length < 12) {
        target.hidden = false;
        target.innerHTML = '<div class="error-card"><strong>句子太短了。</strong><span>至少粘一句完整的长句（≥12 个字符）。</span></div>';
        return;
      }
      target.hidden = false;
      target.innerHTML = '';
      const paint = throttlePainter(target);
      run({
        trigger: this,
        statusText: '正在拆句子…',
        messages: App.config.sentenceMessages(text),
        target: target,
        buffer: { text: '' },
        paint: paint
      });
    });
  }

  function initRewrite() {
    $('#btn-rewrite').addEventListener('click', function () {
      const text = $('#rewrite-input').value.trim();
      const target = $('#rewrite-result');
      if (text.length < 2) {
        target.hidden = false;
        target.innerHTML = '<div class="error-card"><strong>先写一句想表达的意思。</strong><span>中文也可以。</span></div>';
        return;
      }
      target.hidden = false;
      target.innerHTML = '';
      const paint = throttlePainter(target);
      run({
        trigger: this,
        statusText: '正在改写…',
        messages: App.config.rewriteMessages(text, $('#rewrite-type').value),
        target: target,
        buffer: { text: '' },
        paint: paint
      });
    });
  }

  function initEssay() {
    const typeSel = $('#essay-type');
    const paraSel = $('#essay-para');
    const settings = App.store.getSettings();

    typeSel.value = settings.essayType || 'e1_big';
    rebuildParagraphs(settings.essayPara);
    renderBands();

    typeSel.addEventListener('change', function () {
      App.store.saveSettings({ essayType: typeSel.value });
      rebuildParagraphs('all');
      renderBands();
    });
    paraSel.addEventListener('change', function () {
      App.store.saveSettings({ essayPara: paraSel.value });
    });

    $('#btn-camera').addEventListener('click', function () { $('#file-camera').click(); });
    $('#btn-gallery').addEventListener('click', function () { $('#file-gallery').click(); });
    $('#file-camera').addEventListener('change', onFile);
    $('#file-gallery').addEventListener('change', onFile);

    $('#btn-reset-image').addEventListener('click', function () {
      essayState.image = null;
      $('#preview').hidden = true;
      $('#upload-actions').hidden = false;
      resetStage();
      $('#essay-result').hidden = true;
      $('#file-camera').value = '';
      $('#file-gallery').value = '';
    });

    $('#btn-ocr').addEventListener('click', doOcr);
    $('#btn-reocr').addEventListener('click', doOcr);
    $('#btn-grade').addEventListener('click', doGrade);

    async function onFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const info = $('#preview-info');
      try {
        info.textContent = '正在压缩图片…';
        $('#preview').hidden = false;
        $('#upload-actions').hidden = true;
        const prepared = await App.image.prepare(file);
        essayState.image = prepared;
        $('#preview-img').src = prepared.dataURL;
        info.textContent = prepared.width + '×' + prepared.height + ' · ' + prepared.kb + 'KB';
        resetStage();
      } catch (err) {
        essayState.image = null;
        $('#preview').hidden = true;
        $('#upload-actions').hidden = false;
        $('#essay-result').hidden = false;
        $('#essay-result').innerHTML = '<div class="error-card"><strong>图片处理失败</strong><span>' +
          escapeAttr(err.message) + '</span></div>';
      }
    }

    function resetStage() {
      $('#ocr-stage').hidden = true;
      $('#ocr-hint').textContent = '';
    }

    function meta() {
      return {
        typeKey: typeSel.value,
        para: paraSel.value,
        topic: $('#essay-topic').value.trim()
      };
    }

    async function doOcr() {
      if (running) return;
      if (!essayState.image) {
        $('#essay-result').hidden = false;
        $('#essay-result').innerHTML = '<div class="error-card"><strong>先拍照或选一张照片。</strong><span>只需拍要批改的那一段，字迹越大越准。</span></div>';
        return;
      }
      const btn = $('#btn-ocr');
      const ta = $('#ocr-text');
      $('#essay-result').hidden = true;
      ta.value = '';
      resetStage();
      const text = await run({
        trigger: btn,
        statusText: '正在识别手写…',
        messages: App.config.ocrMessages(essayState.image.dataURL),
        onDelta: function (full) { ta.value = full; },
        onError: function (err) { showError($('#essay-result'), err); }
      });
      if (!text) return;
      const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      if (/^NO_TEXT$/i.test(clean) || clean.length < 8) {
        $('#essay-result').hidden = false;
        $('#essay-result').innerHTML = '<div class="error-card"><strong>没识别到可用的英文。</strong><span>换一张光线均匀、作文占满画面的照片再试。</span></div>';
        return;
      }
      ta.value = clean;
      $('#ocr-stage').hidden = false;
      updateOcrHint();
      $('#ocr-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateOcrHint() {
      const value = $('#ocr-text').value;
      const unknown = (value.match(/\[\?\]/g) || []).length;
      const words = (value.trim().match(/[A-Za-z']+/g) || []).length;
      const bits = [];
      if (words) bits.push('约 ' + words + ' 词');
      if (unknown) bits.push('有 ' + unknown + ' 处标了 [?]，请先改成你原本写的词再批改');
      $('#ocr-hint').textContent = bits.join(' · ');
      $('#ocr-hint').className = unknown ? 'hint warn' : 'hint';
    }

    $('#ocr-text').addEventListener('input', updateOcrHint);

    function doGrade() {
      const text = $('#ocr-text').value.trim();
      if (text.length < 20) {
        $('#essay-result').hidden = false;
        $('#essay-result').innerHTML = '<div class="error-card"><strong>文本太短。</strong><span>把要批改的段落补全，至少 20 个字符。</span></div>';
        return;
      }
      const target = $('#essay-result');
      target.hidden = false;
      target.innerHTML = '';
      const paint = throttlePainter(target);
      run({
        trigger: $('#btn-grade'),
        statusText: '正在按大纲档位批改…',
        messages: App.config.gradingMessages(meta(), text),
        target: target,
        buffer: { text: '' },
        paint: paint,
        onDone: function (result) {
          renderSections(target, result);
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    function rebuildParagraphs(selected) {
      const type = App.config.ESSAY_TYPES[typeSel.value];
      paraSel.innerHTML = type.paragraphs.map(function (p) {
        return '<option value="' + p[0] + '">' + p[1] + '</option>';
      }).join('');
      const exists = type.paragraphs.some(function (p) { return p[0] === selected; });
      paraSel.value = exists ? selected : 'all';
      App.store.saveSettings({ essayPara: paraSel.value });
    }

    function renderBands() {
      const type = App.config.ESSAY_TYPES[typeSel.value];
      $('#band-list').innerHTML = type.bands.map(function (b) {
        return '<li><b>' + escapeAttr(b[0]) + '</b>　' + escapeAttr(b[1]) + '</li>';
      }).join('');
      $('#score-guide').querySelector('summary').textContent =
        '评分档位说明（' + type.max + ' 分／' + type.words + '）';
    }
  }

  /* ---------------- 启动 ---------------- */

  function init() {
    $$('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
    });

    $('#btn-settings').addEventListener('click', openSettings);
    $('#btn-close-settings').addEventListener('click', closeSettings);
    $('#settings').addEventListener('click', function (e) {
      if (e.target === this) closeSettings();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#settings').hidden) closeSettings();
    });

    $('#set-provider').addEventListener('change', function () {
      applyProviderPreset(this.value, true);
    });

    $('#btn-save').addEventListener('click', function () {
      App.store.saveSettings(currentFormSettings());
      refreshKeyHint();
      closeSettings();
    });

    $('#btn-test').addEventListener('click', async function () {
      const out = $('#test-result');
      out.hidden = false;
      out.className = 'status';
      out.textContent = '正在测试…';
      App.store.saveSettings(currentFormSettings());
      refreshKeyHint();
      try {
        const message = await App.api.testConnection();
        out.className = 'status ok';
        out.textContent = message;
      } catch (err) {
        out.className = 'status bad';
        out.textContent = err.message + (err.detail ? '（' + err.detail.slice(0, 120) + '）' : '');
      }
    });

    $('#btn-stop').addEventListener('click', function () {
      if (running) running.abort();
    });

    initSentence();
    initRewrite();
    initEssay();
    refreshKeyHint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.App);
