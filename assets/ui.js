/* 界面逻辑：Tab 切换、设置、三段式批改流程、流式渲染 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  let running = null;
  let renderReview = function () {};
  const essayState = { image: null, report: '', messages: null, meta: null };

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

  function chipsHtml(items) {
    const names = Object.keys(items || {});
    if (!names.length) return '';
    return names.map(function (name) {
      return '<span class="chip">' + escapeAttr(name) + ' <b>' + items[name] + '</b></span>';
    }).join('');
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

  /* 从「高级英文」小节里取出那一句英文，交给本地 diff */
  function englishLine(body) {
    const lines = String(body || '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].replace(/^[\s>*\-–—\d.、]+/, '').replace(/[*_`"]/g, '').trim();
      if (line.length < 12) continue;
      const cn = line.search(/[\u4e00-\u9fa5]/);
      if (cn > 8) line = line.slice(0, cn);
      line = line.replace(/[\s（(【\[—–\-:：]+$/, '');
      if (/[A-Za-z]{3}/.test(line) && line.split(/\s+/).length >= 4) return line;
    }
    return '';
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
        override: opts.override,
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
    if (name === 'review') renderReview();
  }

  /* ---------------- 设置 ---------------- */

  function fillProviders(sel) {
    sel.innerHTML = Object.keys(App.config.PROVIDERS).map(function (key) {
      return '<option value="' + key + '">' + escapeAttr(App.config.PROVIDERS[key].label) + '</option>';
    }).join('');
  }

  function providerNote(key) {
    const preset = App.config.PROVIDERS[key];
    if (!preset) return '';
    return preset.note + (preset.keyURL ? ' 申请地址：' + preset.keyURL : '');
  }

  function openSettings() {
    const s = App.store.getSettings();
    fillProviders($('#set-provider'));
    fillProviders($('#set-alt-provider'));
    $('#set-provider').value = s.provider;
    $('#set-baseurl').value = s.baseURL;
    $('#set-model').value = s.model;
    $('#set-key').value = s.apiKey;
    $('#set-stream').checked = !!s.stream;
    $('#set-provider-note').textContent = providerNote(s.provider);

    $('#set-alt-on').checked = !!s.altEnabled;
    $('#set-alt-provider').value = s.altProvider;
    $('#set-alt-baseurl').value = s.altBaseURL;
    $('#set-alt-model').value = s.altModel;
    $('#set-alt-key').value = s.altKey;
    $('#set-alt-note').textContent = providerNote(s.altProvider);

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
      stream: $('#set-stream').checked,
      altEnabled: $('#set-alt-on').checked,
      altProvider: $('#set-alt-provider').value,
      altBaseURL: $('#set-alt-baseurl').value.trim(),
      altModel: $('#set-alt-model').value.trim(),
      altKey: $('#set-alt-key').value.trim()
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
      const spine = $('#sentence-spine').value.trim();
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
        buffer: { text: '' },
        paint: paint,
        onDone: function (result) {
          renderSections(target, result);
          if (spine) {
            const ref = englishLine(App.journal.sectionText(result, '主干'));
            const head = App.journal.sectionText(result, '主干').trim().split(/\r?\n/).filter(Boolean)[0] || '';
            target.insertAdjacentHTML('afterbegin',
              '<article class="card"><h3>你的主干 vs 参考答案</h3>' +
              '<div class="spine-grid">' +
              '<div><span class="label">你划的</span><p class="spine-mine">' + escapeAttr(spine) + '</p></div>' +
              '<div><span class="label">参考</span><div class="spine-ref">' +
              App.md.render(ref || head || '（模型没按格式给出主干，直接看下面第一节）') +
              '</div></div>' +
              '</div>' +
              '<p class="hint">对照三件事：主语找对了吗、谓语找对了吗、哪些修饰成分你漏掉了。</p></article>');
          }
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function techniqueExamplesHtml(type) {
    const item = App.techniques.get(type);
    if (!item) {
      return '<p class="hint">AI 推荐会从强调句、倒装、从句、非谓语、名词化、比较与衔接里挑一个最贴语境的；选定某个手法后这里会显示例句。</p>';
    }
    const list = item.examples.map(function (pair) {
      return '<li><p class="ex-en">' + escapeAttr(pair[0]) + '</p><p class="ex-cn">' + escapeAttr(pair[1]) + '</p></li>';
    }).join('');
    return '<p class="example-tip"><b>' + escapeAttr(item.label) + '</b>　' + escapeAttr(item.tip) + '</p>' +
      '<ul class="example-list">' + list + '</ul>';
  }

  function initRewrite() {
    const sel = $('#rewrite-type');
    const settings = App.store.getSettings();

    sel.innerHTML = '<option value="auto">AI 推荐（按语境自动选）</option>' +
      App.techniques.GROUPS.map(function (group) {
        return '<optgroup label="' + escapeAttr(group.label) + '">' +
          group.items.map(function (item) {
            return '<option value="' + escapeAttr(item.prompt) + '">' + escapeAttr(item.label) + '</option>';
          }).join('') + '</optgroup>';
      }).join('');

    const exists = Array.prototype.some.call(sel.options, function (o) { return o.value === settings.rewriteType; });
    sel.value = exists ? settings.rewriteType : 'auto';

    function renderExamples() {
      const box = $('#rewrite-examples');
      box.hidden = false;
      box.innerHTML = techniqueExamplesHtml(sel.value);
    }

    sel.addEventListener('change', function () {
      App.store.saveSettings({ rewriteType: sel.value });
      renderExamples();
    });
    renderExamples();

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
        messages: App.config.rewriteMessages(text, sel.value),
        buffer: { text: '' },
        paint: paint,
        onDone: function (result) {
          renderSections(target, result);
          const after = englishLine(App.journal.sectionText(result, '高级英文'));
          const englishWords = (text.match(/[A-Za-z']+/g) || []).length;
          if (after && englishWords >= 3) {
            target.insertAdjacentHTML('afterbegin',
              '<article class="card"><h3>改写前后对照</h3><p class="diff-line">' +
              App.md.diffHtml(text, after) +
              '</p><p class="hint">绿色是新增或替换，红色是被去掉的；只对结构变化，不必逐词一一对应。</p></article>');
          }
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initEssay() {
    const typeSel = $('#essay-type');
    const paraSel = $('#essay-para');
    const focusSel = $('#essay-focus');
    const topicSel = $('#topic-pick');
    const settings = App.store.getSettings();

    typeSel.value = settings.essayType || 'e1_big';
    focusSel.value = settings.essayFocus || 'full';
    rebuildParagraphs(settings.essayPara);
    rebuildTopics();
    renderBands();

    typeSel.addEventListener('change', function () {
      App.store.saveSettings({ essayType: typeSel.value });
      rebuildParagraphs('all');
      rebuildTopics();
      renderBands();
    });
    paraSel.addEventListener('change', function () {
      App.store.saveSettings({ essayPara: paraSel.value });
    });
    focusSel.addEventListener('change', function () {
      App.store.saveSettings({ essayFocus: focusSel.value });
    });
    topicSel.addEventListener('change', function () {
      const topic = App.topics.get(topicSel.value);
      if (topic) $('#essay-topic').value = topic.text;
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
      $('#essay-actions').hidden = true;
      $('#file-camera').value = '';
      $('#file-gallery').value = '';
    });

    $('#btn-ocr').addEventListener('click', doOcr);
    $('#btn-reocr').addEventListener('click', doOcr);
    $('#btn-grade').addEventListener('click', doGrade);
    $('#ocr-text').addEventListener('input', function () {
      updateOcrHint();
      renderUnknowns();
    });

    initCrop();
    initUnknowns();
    initExport();

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
        stopCrop();
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
      $('#ocr-unknowns').hidden = true;
      $('#ocr-unknowns').innerHTML = '';
    }

    function meta() {
      const type = App.config.ESSAY_TYPES[typeSel.value];
      const para = type.paragraphs.filter(function (p) { return p[0] === paraSel.value; })[0] || ['all', '全文'];
      return {
        typeKey: typeSel.value,
        para: paraSel.value,
        topic: $('#essay-topic').value.trim(),
        typeLabel: type.label,
        paraLabel: para[1]
      };
    }

    /* ---------- 框选裁剪 ---------- */

    const crop = { on: false, start: null };

    function stopCrop() {
      crop.on = false;
      crop.start = null;
      $('#crop-box').hidden = true;
      $('#crop-wrap').classList.remove('is-cropping');
      const btn = $('#btn-crop');
      btn.textContent = '框选裁剪';
      btn.classList.remove('is-on');
    }

    function initCrop() {
      const img = $('#preview-img');
      const wrap = $('#crop-wrap');
      const box = $('#crop-box');

      $('#btn-crop').addEventListener('click', function () {
        if (!essayState.image) return;
        crop.on = !crop.on;
        this.textContent = crop.on ? '退出裁剪' : '框选裁剪';
        this.classList.toggle('is-on', crop.on);
        wrap.classList.toggle('is-cropping', crop.on);
        box.hidden = true;
        crop.start = null;
      });

      img.addEventListener('pointerdown', function (e) {
        if (!crop.on || !essayState.image) return;
        e.preventDefault();
        const rect = wrap.getBoundingClientRect();
        crop.start = { x: clampX(e.clientX - rect.left, rect.width), y: clampY(e.clientY - rect.top, rect.height), rect: rect };
        box.hidden = false;
        box.dataset.rect = '';
        box.style.left = crop.start.x + 'px';
        box.style.top = crop.start.y + 'px';
        box.style.width = '0px';
        box.style.height = '0px';
      });

      document.addEventListener('pointermove', function (e) {
        if (!crop.on || !crop.start) return;
        const rect = crop.start.rect;
        const x = clampX(e.clientX - rect.left, rect.width);
        const y = clampY(e.clientY - rect.top, rect.height);
        const left = Math.min(x, crop.start.x);
        const top = Math.min(y, crop.start.y);
        box.style.left = left + 'px';
        box.style.top = top + 'px';
        box.style.width = Math.abs(x - crop.start.x) + 'px';
        box.style.height = Math.abs(y - crop.start.y) + 'px';
        box.dataset.rect = JSON.stringify({
          x: left / rect.width,
          y: top / rect.height,
          w: Math.abs(x - crop.start.x) / rect.width,
          h: Math.abs(y - crop.start.y) / rect.height
        });
      });

      document.addEventListener('pointerup', async function () {
        if (!crop.on || !crop.start) return;
        crop.start = null;
        let rect = null;
        try { rect = JSON.parse(box.dataset.rect || 'null'); } catch (err) { rect = null; }
        if (!rect || rect.w < 0.04 || rect.h < 0.04) {
          box.hidden = true;
          return;
        }
        const info = $('#preview-info');
        info.textContent = '正在裁剪…';
        try {
          const cut = await App.image.crop(essayState.image.dataURL, rect);
          essayState.image = cut;
          $('#preview-img').src = cut.dataURL;
          info.textContent = cut.width + '×' + cut.height + ' · ' + cut.kb + 'KB（已裁剪）';
          stopCrop();
          resetStage();
        } catch (err) {
          info.textContent = '裁剪失败：' + err.message;
        }
      });
    }

    function clampX(v, max) { return Math.max(0, Math.min(max, v)); }
    function clampY(v, max) { return Math.max(0, Math.min(max, v)); }

    /* ---------- OCR 与 [?] 补词 ---------- */

    function initUnknowns() {
      const box = $('#ocr-unknowns');
      box.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-fill]');
        if (!btn) return;
        fillUnknown(Number(btn.dataset.fill));
      });
      box.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        const input = e.target.closest('input[data-i]');
        if (!input) return;
        e.preventDefault();
        fillUnknown(Number(input.dataset.i));
      });
    }

    function fillUnknown(index) {
      const box = $('#ocr-unknowns');
      const input = box.querySelector('input[data-i="' + index + '"]');
      if (!input) return;
      const word = input.value.trim();
      if (!word) { input.focus(); return; }
      const ta = $('#ocr-text');
      let seen = -1;
      ta.value = ta.value.replace(/\[\?\]/g, function (token) {
        seen += 1;
        return seen === index ? word : token;
      });
      updateOcrHint();
      renderUnknowns();
    }

    function renderUnknowns() {
      const box = $('#ocr-unknowns');
      const value = $('#ocr-text').value;
      const count = (value.match(/\[\?\]/g) || []).length;
      if (!count) {
        box.hidden = true;
        box.innerHTML = '';
        box.dataset.count = '0';
        return;
      }
      if (box.dataset.count === String(count) && box.innerHTML) return;
      const kept = {};
      Array.prototype.forEach.call(box.querySelectorAll('input[data-i]'), function (input) {
        kept[input.dataset.i] = input.value;
      });
      box.dataset.count = String(count);
      box.hidden = false;
      let rows = '';
      for (let i = 0; i < count; i++) {
        rows += '<div class="unknown-row"><span class="unknown-no">' + (i + 1) + '</span>' +
          '<input type="text" data-i="' + i + '" spellcheck="false" value="' + escapeAttr(kept[i] || '') + '" ' +
          'placeholder="第 ' + (i + 1) + ' 处你写的是什么">' +
          '<button type="button" class="btn ghost small" data-fill="' + i + '">补上</button></div>';
      }
      box.innerHTML = '<p class="hint">有 ' + count + ' 处没认出来，凭记忆填一下，会按顺序替换掉 [?]。</p>' + rows;
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
      $('#essay-actions').hidden = true;
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
      renderUnknowns();
      $('#ocr-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateOcrHint() {
      const value = $('#ocr-text').value;
      const unknown = (value.match(/\[\?\]/g) || []).length;
      const words = (value.trim().match(/[A-Za-z']+/g) || []).length;
      const bits = [];
      if (words) bits.push('约 ' + words + ' 词');
      if (unknown) bits.push('还有 ' + unknown + ' 处 [?]');
      $('#ocr-hint').textContent = bits.join(' · ');
      $('#ocr-hint').className = unknown ? 'hint warn' : 'hint';
    }

    /* ---------- 批改（含第二模型交叉打分） ---------- */

    async function doGrade() {
      const text = $('#ocr-text').value.trim();
      if (text.length < 20) {
        $('#essay-result').hidden = false;
        $('#essay-result').innerHTML = '<div class="error-card"><strong>文本太短。</strong><span>把要批改的段落补全，至少 20 个字符。</span></div>';
        return;
      }
      const target = $('#essay-result');
      target.hidden = false;
      target.innerHTML = '';
      $('#essay-actions').hidden = true;

      const info = meta();
      const messages = App.config.gradingMessages(info, text, { focus: focusSel.value });
      const buffer = { text: '' };
      const paint = throttlePainter(target);

      const primary = await run({
        trigger: $('#btn-grade'),
        statusText: '正在按大纲档位批改…',
        messages: messages,
        buffer: buffer,
        paint: paint,
        onError: function (err) { showError(target, err); }
      });

      if (!primary) {
        if (buffer.text) finishGrade(target, text, buffer.text, null, info, messages);
        return;
      }

      const alt = await runAlt(messages);
      finishGrade(target, text, primary, alt, info, messages);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function runAlt(messages) {
      const s = App.store.getSettings();
      if (!s.altEnabled || !String(s.altKey || '').trim() || !String(s.altModel || '').trim()) return null;
      const ctrl = new AbortController();
      running = ctrl;
      $('#btn-grade').disabled = true;
      showStatus('正在用第二个模型交叉打分…');
      try {
        return await App.api.chat({
          messages: messages,
          signal: ctrl.signal,
          override: {
            provider: s.altProvider,
            baseURL: s.altBaseURL,
            model: s.altModel,
            apiKey: s.altKey,
            stream: false
          }
        });
      } catch (err) {
        return { error: err };
      } finally {
        running = null;
        $('#btn-grade').disabled = false;
        hideStatus();
      }
    }

    function finishGrade(target, text, report, alt, info, messages) {
      const items = App.journal.parseItems(App.journal.sectionText(report, '错误归类'));
      const grade = App.journal.parseGrade(report, info.typeKey);

      essayState.report = report;
      essayState.messages = messages;
      essayState.meta = Object.assign({ at: Date.now(), topic: info.topic, focus: focusSel.value }, info);

      renderSections(target, App.journal.stripSection(report, '错误归类'));

      /* 错误归类卡片 + 写入复盘 */
      const recorded = items && Object.keys(items).length
        ? App.journal.add({
          typeKey: info.typeKey,
          label: info.typeLabel,
          band: grade.bandLabel,
          score: isNaN(grade.score) ? '' : grade.score + '/' + grade.max,
          items: items,
          excerpt: text.slice(0, 60)
        })
        : null;

      target.insertAdjacentHTML('beforeend',
        '<article class="card"><h3>错误归类</h3>' +
        (items && Object.keys(items).length
          ? '<div class="chips">' + chipsHtml(items) + '</div>' +
            '<p class="hint">' + (recorded ? '已记入「复盘」，同类错误会累计成你的弱点画像。' : '格式没读出来，这次没记进复盘。') + '</p>'
          : '<p class="hint">这次没有可归类的错误（或模型没按格式输出），可以切到「目标分数」模式再批一次。</p>') +
        '</article>');

      /* 第二模型 */
      if (alt && alt.error) {
        const msg = alt.error && alt.error.message ? alt.error.message : '调用失败';
        target.insertAdjacentHTML('beforeend',
          '<article class="card"><h3>交叉评分</h3><p class="hint">第二个模型没跑通：' +
          escapeAttr(msg) + '。主报告不受影响。</p></article>');
      } else if (alt) {
        const second = App.journal.parseGrade(alt, info.typeKey);
        const gap = (grade.bandIndex >= 0 && second.bandIndex >= 0)
          ? Math.abs(grade.bandIndex - second.bandIndex)
          : -1;
        if (gap >= 2) {
          target.insertAdjacentHTML('beforeend',
            '<article class="card dispute"><h3>评分有争议</h3>' +
            '<p>主模型判 <b>' + escapeAttr(grade.bandLabel || '未给档位') + '</b>' +
            (isNaN(grade.score) ? '' : '（' + grade.score + ' 分）') +
            '，第二模型判 <b>' + escapeAttr(second.bandLabel || '未给档位') + '</b>' +
            (isNaN(second.score) ? '' : '（' + second.score + ' 分）') +
            '，相差 ' + gap + ' 档。按低的那一档准备更稳，也可以把段落补全重新批一次。</p>' +
            '<div class="md">' + App.md.render(App.journal.sectionText(alt, '档位') || alt) + '</div>' +
            '</article>');
        } else if (gap >= 0) {
          target.insertAdjacentHTML('beforeend',
            '<article class="card"><h3>交叉评分</h3><p class="hint">第二模型给出的也是' +
            escapeAttr(second.bandLabel) + (isNaN(second.score) ? '' : '（' + second.score + ' 分）') +
            '，与主模型一致，这个分数可以信。</p></article>');
        }
      }

      /* 追问 */
      target.insertAdjacentHTML('beforeend',
        '<article class="card"><h3>继续追问</h3>' +
        '<div class="row"><input id="follow-input" type="text" spellcheck="false" ' +
        'placeholder="例如：这句为什么判成搭配错误？我这样写能进第二档吗？">' +
        '<button id="btn-follow" class="btn">追问</button></div>' +
        '<div id="follow-result" class="result" hidden></div></article>');

      const followBtn = $('#btn-follow');
      followBtn.addEventListener('click', function () {
        const question = $('#follow-input').value.trim();
        if (question.length < 2) { $('#follow-input').focus(); return; }
        const box = $('#follow-result');
        box.hidden = false;
        box.innerHTML = '';
        run({
          trigger: followBtn,
          statusText: '正在回答追问…',
          messages: App.config.followUpMessages(messages, report, question),
          target: box,
          buffer: { text: '' },
          paint: throttlePainter(box)
        });
      });
      $('#follow-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); followBtn.click(); }
      });

      $('#essay-actions').hidden = false;
    }

    /* ---------- 导出 ---------- */

    function initExport() {
      $('#btn-export-md').addEventListener('click', function () {
        if (!essayState.report) return;
        const m = essayState.meta || {};
        const date = new Date(m.at || Date.now());
        const pad = function (n) { return (n < 10 ? '0' : '') + n; };
        const stamp = date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes());
        const lines = [
          '# 考研英语作文批改报告',
          '',
          '- 题型：' + (m.typeLabel || ''),
          '- 批改范围：' + (m.paraLabel || ''),
          '- 模式：' + (m.focus === 'target' ? '目标分数（只列必改）' : '完整批改'),
          '- 时间：' + date.toLocaleString('zh-CN', { hour12: false }),
          m.topic ? '- 题目：' + m.topic : null,
          '',
          '---',
          '',
          essayState.report
        ].filter(function (line) { return line !== null; }).join('\n');
        const blob = new Blob([lines], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '作文批改-' + stamp + '.md';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      });

      $('#btn-print').addEventListener('click', function () {
        window.print();
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

    function rebuildTopics() {
      const list = App.topics.forType(typeSel.value);
      topicSel.innerHTML = '<option value="">不从真题库选</option>' + list.map(function (t) {
        return '<option value="' + t.key + '">' + escapeAttr(t.label) + '</option>';
      }).join('');
      topicSel.value = '';
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

  /* ---------------- 复盘 ---------------- */

  function initReview() {
    const summary = App.journal.summary;
    const list = App.journal.list;

    renderReview = function () {
      const s = summary();
      $('#review-summary').textContent = s.count
        ? '累计批改 ' + s.count + ' 次，共归类 ' + s.errors + ' 处错误。数目最大的是你最该先补的短板。'
        : '还没有记录。批改一篇作文后，错误会自动归类到这里。';
      $('#review-chips').innerHTML = s.ranked.map(function (item) {
        const span = '<span class="chip">' + escapeAttr(item.name) + ' <b>' + item.count + '</b></span>';
        return span;
      }).join('');
      const rows = list();
      $('#review-list').innerHTML = rows.length
        ? rows.map(function (r) {
          const date = new Date(r.at);
          const pad = function (n) { return (n < 10 ? '0' : '') + n; };
          const when = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
            ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
          return '<article class="card journal-item">' +
            '<div class="journal-head"><b>' + escapeAttr(r.label || '作文') + '</b>' +
            '<span class="journal-score">' + escapeAttr([r.band, r.score].filter(Boolean).join(' · ')) + '</span></div>' +
            '<div class="chips">' + chipsHtml(r.items) + '</div>' +
            '<p class="hint">' + escapeAttr(when) + (r.excerpt ? '　' + escapeAttr(r.excerpt) + '…' : '') + '</p>' +
            '</article>';
        }).join('')
        : '<p class="hint">空空的，先去批一篇。</p>';
    };

    $('#btn-clear-journal').addEventListener('click', function () {
      if (!window.confirm('清空全部复盘记录？这个操作不能撤销。')) return;
      App.journal.clear();
      renderReview();
    });
  }

  /* ---------------- 语法库 ---------------- */

  function initGrammar() {
    const catBox = $('#grammar-cats');
    const input = $('#grammar-q');
    const listBox = $('#grammar-list');
    const countBox = $('#grammar-count');
    let cat = '全部';

    catBox.innerHTML = ['全部'].concat(App.grammar.CATS).map(function (name) {
      return '<button type="button" class="chip filter-chip' +
        (name === '全部' ? ' is-active' : '') + '" data-cat="' + escapeAttr(name) + '">' +
        escapeAttr(name) + '</button>';
    }).join('');

    function itemHtml(item, index) {
      const examples = item.examples.map(function (pair) {
        return '<li><p class="ex-en">' + escapeAttr(pair[0]) + '</p>' +
          '<p class="ex-cn">' + escapeAttr(pair[1]) + '</p></li>';
      }).join('');
      return '<details class="grammar-item"' + (index === 0 ? ' open' : '') + '>' +
        '<summary><span class="grammar-title">' + escapeAttr(item.title) + '</span>' +
        '<span class="grammar-cat">' + escapeAttr(item.cat) + '</span></summary>' +
        '<div class="grammar-body">' +
        '<p class="grammar-formula">' + escapeAttr(item.formula) + '</p>' +
        '<p class="grammar-note">' + escapeAttr(item.note) + '</p>' +
        '<ul class="example-list">' + examples + '</ul>' +
        '<p class="grammar-pitfall"><b>易错</b>' + escapeAttr(item.pitfall) + '</p>' +
        '</div></details>';
    }

    function render() {
      const items = App.grammar.search(input.value, cat);
      const filtered = String(input.value).trim() !== '' || cat !== '全部';
      countBox.textContent = filtered
        ? '匹配到 ' + items.length + ' 个语法点'
        : '共 ' + items.length + ' 个语法点，点开任意一条看结构、例句和易错提醒';
      listBox.innerHTML = items.length
        ? items.map(itemHtml).join('')
        : '<p class="hint">没找到，换个关键词试试，比如「虚拟」「倒装」「冠词」或「result in」。</p>';
    }

    catBox.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      cat = btn.dataset.cat;
      Array.prototype.forEach.call(catBox.children, function (chip) {
        chip.classList.toggle('is-active', chip === btn);
      });
      render();
    });

    input.addEventListener('input', render);
    render();
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
      const preset = App.config.PROVIDERS[this.value];
      $('#set-provider-note').textContent = providerNote(this.value);
      if (preset) {
        $('#set-baseurl').value = preset.baseURL;
        $('#set-model').value = preset.model;
      }
    });

    $('#set-alt-provider').addEventListener('change', function () {
      const preset = App.config.PROVIDERS[this.value];
      $('#set-alt-note').textContent = providerNote(this.value);
      if (preset) {
        $('#set-alt-baseurl').value = preset.baseURL;
        $('#set-alt-model').value = preset.model;
      }
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
    initReview();
    initGrammar();
    refreshKeyHint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* PWA：注册 Service Worker，装到桌面后断网也能打开（接口调用仍需联网） */
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})(window.App);
