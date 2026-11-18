/* AI 归来 · 自选模板：审题 → 按段定句 → 预览 → 填空
   填空/判定/复盘复用 assets/fill.js；句子来自 assets/ai-templates-data.js */

window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const esc = function (text) { return App.runner.escapeAttr(text); };
  const A = function () { return App.aiTemplates; };

  const SETUP_KEY = 'kaoyan-trainer-combo-setup-v1';
  const SAVED_KEY = 'kaoyan-trainer-combo-saved-v1';
  const DRAFT_KEY = 'kaoyan-trainer-combo-draft-v1';

  const state = {
    step: 1,
    typeId: 'chart',
    sceneId: '',
    picks: {},
    reasonPlans: [],
    connectiveId: 'k1',
    visionEnabled: true,
    topicYear: 0,
    aiNote: ''
  };

  let bound = false;
  let focusKey = '';

  /* ---------------- 存储 ---------------- */

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

  function save() {
    writeJSON(SETUP_KEY, {
      step: state.step,
      typeId: state.typeId,
      sceneId: state.sceneId,
      picks: state.picks,
      reasonPlans: state.reasonPlans,
      connectiveId: state.connectiveId,
      visionEnabled: state.visionEnabled,
      topicYear: state.topicYear
    });
  }

  function restore() {
    const saved = readJSON(SETUP_KEY, null);
    if (!saved) return;
    if (saved.typeId) state.typeId = saved.typeId;
    if (saved.sceneId && A().scene(saved.sceneId)) state.sceneId = saved.sceneId;
    if (saved.picks && typeof saved.picks === 'object') state.picks = saved.picks;
    if (Array.isArray(saved.reasonPlans)) state.reasonPlans = saved.reasonPlans.slice(0, 3);
    if (saved.connectiveId) state.connectiveId = saved.connectiveId;
    state.visionEnabled = saved.visionEnabled !== false;
    state.topicYear = Number(saved.topicYear) || 0;
    state.step = Math.min(3, Math.max(1, Number(saved.step) || 1));
  }

  /* ---------------- 选择状态 ---------------- */

  function scene() {
    return A().scene(state.sceneId);
  }

  function allSlots() {
    const s = scene();
    if (!s) return [];
    return s.slots
      .concat([A().second.transition])
      .concat(A().third.slots);
  }

  function optionOf(options, id) {
    return options.filter(function (o) { return o.id === id; })[0] || options[0];
  }

  function currentOption(key, options) {
    return optionOf(options, state.picks[key]);
  }

  function ensureDefaults() {
    const s = scene();
    if (!s) return;
    allSlots().forEach(function (slot) {
      if (!slot.options.some(function (o) { return o.id === state.picks[slot.id]; })) {
        state.picks[slot.id] = slot.options[0].id;
      }
    });
    A().second.reasons.plans.forEach(function (plan) {
      if (!plan.options.some(function (o) { return o.id === state.picks[plan.id]; })) {
        state.picks[plan.id] = plan.options[0].id;
      }
    });
    state.reasonPlans = state.reasonPlans.filter(function (id) {
      return A().second.reasons.plans.some(function (p) { return p.id === id; });
    });
    if (!A().second.connectives.groups.some(function (g) { return g.id === state.connectiveId; })) {
      state.connectiveId = A().second.connectives.groups[0].id;
    }
  }

  /* ---------------- 组装成填空模板 ---------------- */

  function lowerFirst(text) {
    return text.replace(/^[A-Z](?![A-Z])/, function (ch) { return ch.toLowerCase(); });
  }

  function tidy(text) {
    return text.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
  }

  function assemble() {
    const s = scene();
    if (!s) return null;

    const p1 = s.slots.map(function (slot) {
      return currentOption(slot.id, slot.options).en;
    }).join(' ');

    const group = A().second.connectives.groups.filter(function (g) {
      return g.id === state.connectiveId;
    })[0] || A().second.connectives.groups[0];

    const reasons = state.reasonPlans.map(function (planId, i) {
      const plan = A().second.reasons.plans.filter(function (p) { return p.id === planId; })[0];
      const en = currentOption(plan.id, plan.options).en;
      return group.parts[i] + ' ' + lowerFirst(en);
    });

    const p2 = [currentOption(A().second.transition.id, A().second.transition.options).en]
      .concat(reasons)
      .join(' ');

    const thirdSlots = A().third.slots.filter(function (slot) {
      return !(slot.optional && !state.visionEnabled);
    });
    const p3 = thirdSlots.map(function (slot) {
      return currentOption(slot.id, slot.options).en;
    }).join(' ');

    const raw = [tidy(p1), tidy(p2), tidy(p3)];
    const names = [];
    const paragraphs = raw.map(function (text) {
      return text.replace(/\{([^}]+)\}/g, function (_, name) {
        let index = names.indexOf(name);
        if (index < 0) { names.push(name); index = names.length - 1; }
        return App.templates.circles[index] || '[' + (index + 1) + ']';
      });
    });

    const blanks = names.map(function (name, i) {
      const ph = A().placeholder(name);
      return {
        no: i + 1,
        label: App.templates.circles[i] || '[' + (i + 1) + ']',
        name: name,
        hint: ph ? ph.hint : '按句意填入合适的英文。',
        sample: ph ? ph.sample : ''
      };
    });

    const type = A().typeOf(s.id);
    return {
      raw: raw,
      names: names,
      blanks: blanks,
      template: {
        id: 'combo-' + s.id,
        no: 'AI',
        kind: 'AI归来 · ' + (type ? type.label : ''),
        title: s.label,
        use: s.hint,
        paragraphs: paragraphs,
        blanks: blanks,
        extra: ''
      }
    };
  }

  /* ---------------- 渲染：外框 ---------------- */

  function renderStepper() {
    const steps = ['审题', '定句', '预览', '填空'];
    $('#combo-stepper').innerHTML = '<ol class="stepper">' + steps.map(function (name, i) {
      const n = i + 1;
      const cls = n === state.step ? 'is-active' : (n < state.step ? 'is-done' : '');
      const can = n <= 3 && (n === 1 || state.sceneId);
      return '<li class="' + cls + '">' +
        (can
          ? '<button type="button" data-to-step="' + n + '"><b>' + n + '</b>' + name + '</button>'
          : '<span><b>' + n + '</b>' + name + '</span>') +
        '</li>';
    }).join('') + '</ol>';
  }

  function sentenceHtml(en) {
    return esc(en).replace(/\{([^}]+)\}/g, function (_, name) {
      return '<i class="ph">' + esc(name) + '</i>';
    });
  }

  function render() {
    if (!scene() && state.sceneId) state.sceneId = '';
    renderStepper();
    $('#combo-step-1').hidden = state.step !== 1;
    $('#combo-step-2').hidden = state.step !== 2;
    $('#combo-step-3').hidden = state.step !== 3;
    if (state.step === 1) renderStep1();
    if (state.step === 2) renderStep2();
    if (state.step === 3) renderStep3();
    if (focusKey) {
      const row = document.querySelector('[data-slot-card="' + focusKey + '"], [data-row="' + focusKey + '"]');
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('is-flash');
        setTimeout(function () { row.classList.remove('is-flash'); }, 1200);
      }
      focusKey = '';
    }
  }

  /* ---------------- 第一步：审题 ---------------- */

  function currentTopic() {
    const list = App.fill.topics() || [];
    return list.filter(function (t) { return t.year === state.topicYear; })[0] || null;
  }

  function topicSelectHtml() {
    const list = App.fill.topics() || [];
    if (!list.length) return '<select id="combo-topic-select"><option value="">题目库加载中…</option></select>';
    return '<select id="combo-topic-select"><option value="">不指定题目（凭印象选一个主题）</option>' +
      list.map(function (t) {
        return '<option value="' + t.year + '"' + (t.year === state.topicYear ? ' selected' : '') + '>' +
          esc(t.label) + '</option>';
      }).join('') + '</select>';
  }

  function renderTopicBox() {
    const box = $('#combo-topic-box');
    if (!box) return;
    const t = currentTopic();
    if (!t) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML =
      '<div class="tpl-topic-head"><span class="tpl-topic-label">' + esc(t.label) + '</span>' +
      (t.sample ? '<button type="button" class="link-btn" data-combo-sample="1">看参考范文</button>' : '') +
      '</div>' +
      (t.images && t.images.length
        ? '<div class="tpl-topic-imgs">' + t.images.map(function (src) {
          return '<img src="' + esc(src) + '" alt="' + esc(t.label) + ' 题目图片" loading="lazy">';
        }).join('') + '</div>'
        : '') +
      '<p class="tpl-topic-stem">' + esc(t.stem).replace(/\n/g, '<br>') + '</p>' +
      (t.sample ? '<div class="tpl-topic-sample" id="combo-topic-sample" hidden>' +
        '<p class="tpl-topic-sample-text">' + esc(t.sample).replace(/\n/g, '<br>') + '</p></div>' : '');
  }

  function savedHtml() {
    const list = readJSON(SAVED_KEY, []);
    if (!list.length) return '<p class="hint">还没有保存的组合。定好句子后，在预览页可以存成「我的模板」。</p>';
    return list.map(function (item) {
      const s = A().scene(item.setup && item.setup.sceneId);
      const when = item.at ? new Date(item.at).toLocaleDateString('zh-CN') : '';
      return '<div class="saved-row">' +
        '<div class="saved-main"><b>' + esc(item.name) + '</b>' +
        '<span>' + esc(s ? s.label : '已失效的场景') + (when ? ' · ' + when : '') + '</span></div>' +
        '<button type="button" class="btn ghost small" data-load-combo="' + esc(item.id) + '">载入</button>' +
        '<button type="button" class="link-btn danger" data-del-combo="' + esc(item.id) + '">删除</button>' +
        '</div>';
    }).join('');
  }

  function renderStep1() {
    const type = A().types.filter(function (t) { return t.id === state.typeId; })[0] || A().types[0];
    const el = $('#combo-step-1');
    el.innerHTML =
      '<section class="combo-block">' +
      '<h3>① 先看题目</h3>' +
      '<p class="hint">从真题里选一篇，题干和图片会带到填空页。没有对应真题时，也可以不指定。</p>' +
      '<label class="field"><span class="label">练习题目</span>' + topicSelectHtml() + '</label>' +
      '<div id="combo-topic-box" class="tpl-topic-box" hidden></div>' +
      '<div class="combo-ai-row"><button type="button" class="btn ghost small" id="btn-combo-ai">让 AI 看题目</button>' +
      '<span class="hint" id="combo-ai-note">' + esc(state.aiNote) + '</span></div>' +
      '</section>' +

      '<section class="combo-block">' +
      '<h3>② 选文章类型</h3>' +
      '<div class="chips combo-types">' + A().types.map(function (t) {
        return '<button type="button" class="chip' + (t.id === state.typeId ? ' is-active' : '') +
          '" data-type="' + t.id + '">' + esc(t.label) + '</button>';
      }).join('') + '</div>' +
      '<p class="hint">' + esc(type.desc) + '</p>' +
      '<div class="scene-grid">' + type.scenes.map(function (id) {
        const s = A().scene(id);
        const count = s.slots.length + 4 + 3;
        return '<button type="button" class="scene-card' + (id === state.sceneId ? ' is-active' : '') +
          '" data-scene="' + id + '">' +
          '<strong>' + esc(s.label) + '</strong>' +
          '<span class="scene-feature">' + esc(s.feature) + '</span>' +
          '<span class="scene-example">' + esc(s.example) + '</span>' +
          '<span class="scene-meta">约 ' + count + ' 句 · 按段选句</span>' +
          '</button>';
      }).join('') + '</div>' +
      '<div id="combo-scene-hint" class="combo-scene-hint">' +
      (state.sceneId ? esc(scene().hint) : '<span class="hint">选一个最贴近题目的场景，下一步按段落定句。</span>') +
      '</div>' +
      '</section>' +

      '<section class="combo-block">' +
      '<h3>③ 我保存过的模板</h3>' +
      '<div id="combo-saved" class="saved-list">' + savedHtml() + '</div>' +
      '</section>' +

      '<div class="combo-foot">' +
      '<span class="hint">' + (state.sceneId ? '已选：' + esc(scene().label) : '先选一个场景') + '</span>' +
      '<button type="button" class="btn primary" data-to-step="2"' + (state.sceneId ? '' : ' disabled') + '>下一步：按段定句</button>' +
      '</div>';

    renderTopicBox();
  }

  /* ---------------- 第二步：定句 ---------------- */

  function slotCard(slot) {
    const opt = currentOption(slot.id, slot.options);
    const multi = slot.options.length > 1;
    return '<article class="slot-card" data-slot-card="' + slot.id + '">' +
      '<div class="slot-head"><div class="slot-title"><span class="slot-para">第 ' + slot.para + ' 段</span>' +
      '<h4>' + esc(slot.name) + '</h4></div>' +
      (multi ? '<button type="button" class="link-btn" data-swap="' + slot.id + '">换一句 · ' + esc(opt.name) + '</button>' : '') +
      '</div>' +
      '<p class="slot-en">' + sentenceHtml(opt.en) + '</p>' +
      '<p class="slot-zh">' + esc(opt.zh || '') + '</p>' +
      (opt.note ? '<p class="slot-note">' + esc(opt.note) + '</p>' : '') +
      '<p class="slot-hint">' + esc(slot.hint) + '</p>' +
      (multi ? '<div class="slot-options" data-options="' + slot.id + '" hidden>' +
        slot.options.map(function (o) {
          return '<button type="button" class="slot-option' + (o.id === opt.id ? ' is-active' : '') + '" ' +
            'data-pick="' + slot.id + '" data-option="' + o.id + '">' +
            '<b>' + esc(o.name) + '</b>' +
            '<span>' + sentenceHtml(o.en) + '</span>' +
            '<em>' + esc(o.zh || '') + '</em>' +
            (o.note ? '<small>' + esc(o.note) + '</small>' : '') +
            '</button>';
        }).join('') + '</div>' : '') +
      '</article>';
  }

  function planHtml(plan) {
    const order = state.reasonPlans.indexOf(plan.id);
    const picked = order >= 0;
    const opt = currentOption(plan.id, plan.options);
    return '<article class="plan-card' + (picked ? ' is-picked' : '') + '" data-plan="' + plan.id + '">' +
      '<div class="plan-head">' +
      '<b class="plan-no">' + (picked ? order + 1 : '+') + '</b>' +
      '<div class="plan-title"><strong>' + esc(plan.name) + '</strong>' +
      '<span>' + esc(plan.tag) + '</span></div>' +
      '</div>' +
      '<p class="plan-hint">' + esc(plan.hint) + '</p>' +
      (picked ? '<div class="plan-body">' +
        '<p class="slot-en">' + sentenceHtml(opt.en) + '</p>' +
        '<p class="slot-zh">' + esc(opt.zh || '') + '</p>' +
        (plan.options.length > 1 ? '<div class="plan-options">' +
          plan.options.map(function (o) {
            return '<button type="button" class="chip' + (o.id === opt.id ? ' is-active' : '') + '" ' +
              'data-plan-opt="' + plan.id + '" data-option="' + o.id + '">' + esc(o.name) + '</button>';
          }).join('') + '</div>' : '') +
        '</div>' : '') +
      '</article>';
  }

  function renderStep2() {
    ensureDefaults();
    const s = scene();
    const el = $('#combo-step-2');
    const video = A().second;
    const thirdSlots = A().third.slots;
    const chosen = state.reasonPlans.length;
    el.innerHTML =
      '<section class="combo-block">' +
      '<h3>第一段 · ' + esc(s.label) + '</h3>' +
      '<p class="hint">' + esc(s.hint) + '</p>' +
      s.slots.map(slotCard).join('') +
      '</section>' +

      '<section class="combo-block">' +
      '<h3>第二段 · 过渡与原因</h3>' +
      slotCard(video.transition) +
      '<div class="plan-head-row"><h4>七选三 · 原因分析</h4>' +
      '<span class="hint">已选 ' + chosen + ' / 3' + (chosen < 3 ? '，再选 ' + (3 - chosen) + ' 个' : '，按选中顺序作为原因 1/2/3') + '</span></div>' +
      '<div class="plan-grid">' + video.reasons.plans.map(planHtml).join('') + '</div>' +
      '<label class="field connective-field"><span class="label">连接词</span>' +
      '<select id="combo-connective">' + video.connectives.groups.map(function (g) {
        return '<option value="' + g.id + '"' + (g.id === state.connectiveId ? ' selected' : '') + '>' + esc(g.name) + '</option>';
      }).join('') + '</select></label>' +
      '</section>' +

      '<section class="combo-block">' +
      '<h3>第三段 · 总结与收尾</h3>' +
      thirdSlots.map(function (slot) {
        if (slot.optional) {
          return '<label class="toggle-row"><input type="checkbox" id="combo-vision"' + (state.visionEnabled ? ' checked' : '') + '> 写最后一句：畅想未来 / 趋势预测</label>' +
            '<div class="vision-box"' + (state.visionEnabled ? '' : ' hidden') + '>' + slotCard(slot) + '</div>';
        }
        return slotCard(slot);
      }).join('') +
      '</section>' +

      '<div class="combo-foot">' +
      '<button type="button" class="btn ghost" data-to-step="1">上一步</button>' +
      '<span class="hint">' + (chosen === 3 ? '三段句子已定好' : '原因还差 ' + (3 - chosen) + ' 个') + '</span>' +
      '<button type="button" class="btn primary" data-to-step="3"' + (chosen === 3 ? '' : ' disabled') + '>下一步：预览定稿</button>' +
      '</div>';
  }

  /* ---------------- 第三步：预览 ---------------- */

  function previewRows() {
    const s = scene();
    const rows = [];
    s.slots.forEach(function (slot) {
      rows.push({ para: 1, key: slot.id, label: slot.name, options: slot.options });
    });
    rows.push({ para: 2, key: A().second.transition.id, label: '过渡句', options: A().second.transition.options });
    state.reasonPlans.forEach(function (planId, i) {
      const plan = A().second.reasons.plans.filter(function (p) { return p.id === planId; })[0];
      rows.push({ para: 2, key: plan.id, label: '原因 ' + (i + 1) + ' · ' + plan.name.replace(/^方案. · /, ''), options: plan.options });
    });
    A().third.slots.forEach(function (slot) {
      if (slot.optional && !state.visionEnabled) return;
      rows.push({ para: 3, key: slot.id, label: slot.name, options: slot.options });
    });
    return rows;
  }

  function renderStep3() {
    const built = assemble();
    if (!built) { state.step = 1; render(); return; }
    const rows = previewRows();
    const reuse = built.names.length;

    $('#combo-step-3').innerHTML =
      '<section class="combo-block">' +
      '<h3>预览定稿</h3>' +
      '<p class="hint">方括号里是待填的占位词。不满意任何一句，可以直接在这里换。</p>' +
      '<div class="preview-paras">' + built.raw.map(function (text, i) {
        return '<article class="preview-para"><span class="preview-tag">第 ' + (i + 1) + ' 段</span>' +
          '<p>' + sentenceHtml(text) + '</p></article>';
      }).join('') + '</div>' +
      '<p class="blank-stat">本篇将生成 <b>' + built.blanks.length + '</b> 个空；同名占位全文只填一次。</p>' +
      '</section>' +

      '<section class="combo-block">' +
      '<h3>逐句检查</h3>' +
      rows.map(function (row) {
        const opt = currentOption(row.key, row.options);
        return '<article class="preview-row" data-row="' + row.key + '">' +
          '<div class="preview-row-head"><div><span class="slot-para">第 ' + row.para + ' 段</span>' +
          '<b>' + esc(row.label) + '</b></div>' +
          (row.options.length > 1 ? '<button type="button" class="link-btn" data-prev-swap="' + row.key + '">换一句</button>' : '') +
          '</div>' +
          '<p class="slot-en">' + sentenceHtml(opt.en) + '</p>' +
          (row.options.length > 1 ? '<div class="slot-options" data-prev-options="' + row.key + '" hidden>' +
            row.options.map(function (o) {
              return '<button type="button" class="slot-option' + (o.id === opt.id ? ' is-active' : '') + '" ' +
                'data-prev-pick="' + row.key + '" data-option="' + o.id + '">' +
                '<b>' + esc(o.name) + '</b><span>' + sentenceHtml(o.en) + '</span>' +
                '<em>' + esc(o.zh || '') + '</em></button>';
            }).join('') + '</div>' : '') +
          '</article>';
      }).join('') +
      '</section>' +

      '<section class="combo-block combo-save">' +
      '<h3>保存为我的模板</h3>' +
      '<div class="combo-save-row">' +
      '<input type="text" id="combo-save-name" maxlength="24" placeholder="例如：图表动态 · 我的稳分版">' +
      '<button type="button" class="btn ghost" data-save-combo="1">保存组合</button>' +
      '</div>' +
      '<p class="hint" id="combo-save-note">保存的是句子组合，不保存你填的空。</p>' +
      '</section>' +

      '<div class="combo-foot">' +
      '<button type="button" class="btn ghost" data-to-step="2">上一步：改句子</button>' +
      '<button type="button" class="btn primary" data-start-fill="1">开始填空（' + built.blanks.length + ' 空）</button>' +
      '</div>';

    state.previewTemplate = built.template;
  }

  /* ---------------- 第四步：填空 ---------------- */

  function fillHead() {
    const s = scene();
    return '<div class="tpl-head-main"><p class="eyebrow">AI 归来 · 自组模板</p>' +
      '<h2>' + esc(s.label) + '</h2>' +
      '<p class="tpl-use">' + esc(s.hint) + '</p></div>';
  }

  function startFill() {
    const built = assemble();
    if (!built) return;
    $('#mode-combo').hidden = true;
    $('#combo-step-1').hidden = true;
    $('#combo-step-2').hidden = true;
    $('#combo-step-3').hidden = true;
    $('#fill-work').hidden = false;
    App.fill.open(built.template, {
      draftKey: DRAFT_KEY,
      bucket: state.sceneId,
      headHtml: fillHead(),
      backLabel: '改句子',
      onBack: function () {
        state.step = 3;
        save();
        $('#fill-work').hidden = true;
        $('#mode-combo').hidden = false;
        render();
        window.scrollTo(0, 0);
      }
    });
    const topic = currentTopic();
    if (topic) App.fill.setTopic(topic);
    window.scrollTo(0, 0);
  }

  /* ---------------- 事件 ---------------- */

  function goStep(n) {
    if (n === 2 && !state.sceneId) return;
    if (n === 3 && state.reasonPlans.length !== 3) return;
    state.step = Math.min(3, Math.max(1, n));
    save();
    render();
    window.scrollTo(0, 0);
  }

  function onClick(e) {
    const target = e.target;

    const typeBtn = target.closest('[data-type]');
    if (typeBtn) {
      state.typeId = typeBtn.dataset.type;
      const type = A().types.filter(function (t) { return t.id === state.typeId; })[0];
      if (type.scenes.indexOf(state.sceneId) < 0) state.sceneId = '';
      state.aiNote = '';
      save();
      render();
      return;
    }

    const sceneBtn = target.closest('[data-scene]');
    if (sceneBtn) {
      state.sceneId = sceneBtn.dataset.scene;
      ensureDefaults();
      save();
      render();
      return;
    }

    const toStep = target.closest('[data-to-step]');
    if (toStep) { goStep(Number(toStep.dataset.toStep)); return; }

    const swap = target.closest('[data-swap]');
    if (swap) {
      const box = document.querySelector('[data-options="' + swap.dataset.swap + '"]');
      if (box) box.hidden = !box.hidden;
      return;
    }

    const pick = target.closest('[data-pick]');
    if (pick) {
      state.picks[pick.dataset.pick] = pick.dataset.option;
      focusKey = pick.dataset.pick;
      save();
      renderStep2();
      if (focusKey) {
        const card = document.querySelector('[data-slot-card="' + focusKey + '"]');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        focusKey = '';
      }
      return;
    }

    const planOpt = target.closest('[data-plan-opt]');
    if (planOpt) {
      state.picks[planOpt.dataset.planOpt] = planOpt.dataset.option;
      save();
      renderStep2();
      return;
    }

    const plan = target.closest('[data-plan]');
    if (plan) {
      const id = plan.dataset.plan;
      const index = state.reasonPlans.indexOf(id);
      if (index >= 0) {
        state.reasonPlans.splice(index, 1);
      } else if (state.reasonPlans.length < 3) {
        state.reasonPlans.push(id);
      } else {
        state.aiNote = '';
      }
      save();
      renderStep2();
      return;
    }

    const prevSwap = target.closest('[data-prev-swap]');
    if (prevSwap) {
      const box = document.querySelector('[data-prev-options="' + prevSwap.dataset.prevSwap + '"]');
      if (box) box.hidden = !box.hidden;
      return;
    }

    const prevPick = target.closest('[data-prev-pick]');
    if (prevPick) {
      state.picks[prevPick.dataset.prevPick] = prevPick.dataset.option;
      focusKey = prevPick.dataset.prevPick;
      save();
      renderStep3();
      const row = document.querySelector('[data-row="' + focusKey + '"]');
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focusKey = '';
      return;
    }

    const aiBtn = target.closest('#btn-combo-ai');
    if (aiBtn) { askAI(); return; }

    const sampleBtn = target.closest('[data-combo-sample]');
    if (sampleBtn) {
      const box = $('#combo-topic-sample');
      if (box) {
        box.hidden = !box.hidden;
        sampleBtn.textContent = box.hidden ? '看参考范文' : '收起范文';
      }
      return;
    }

    const saveBtn = target.closest('[data-save-combo]');
    if (saveBtn) { saveCombo(); return; }

    const startBtn = target.closest('[data-start-fill]');
    if (startBtn) { startFill(); return; }

    const loadBtn = target.closest('[data-load-combo]');
    if (loadBtn) { loadCombo(loadBtn.dataset.loadCombo); return; }

    const delBtn = target.closest('[data-del-combo]');
    if (delBtn) { deleteCombo(delBtn.dataset.delCombo); return; }
  }

  function onChange(e) {
    if (e.target.id === 'combo-connective') {
      state.connectiveId = e.target.value;
      save();
      return;
    }
    if (e.target.id === 'combo-vision') {
      state.visionEnabled = e.target.checked;
      save();
      renderStep2();
      return;
    }
    if (e.target.id === 'combo-topic-select') {
      state.topicYear = Number(e.target.value) || 0;
      state.aiNote = '';
      save();
      renderTopicBox();
      const note = $('#combo-ai-note');
      if (note) note.textContent = '';
    }
  }

  /* ---------------- AI 辅助审题 ---------------- */

  function parseLooseJson(text) {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch (e) { return null; }
  }

  async function askAI() {
    const note = $('#combo-ai-note');
    const topic = currentTopic();
    if (!note) return;
    if (!topic) {
      state.aiNote = '先在题目库里选一个真题，AI 才能看题。';
      note.textContent = state.aiNote;
      return;
    }
    if (!App.store.hasKey()) {
      state.aiNote = '还没配置 API Key，点右上角「设置」填一个。';
      note.textContent = state.aiNote;
      return;
    }

    note.textContent = '正在看题…';
    const sceneGuide = A().types.map(function (t) {
      return t.label + '：' + t.scenes.map(function (id) {
        return id + '（' + A().scene(id).label + '）';
      }).join('、');
    }).join('\n');

    try {
      const text = await App.api.chat({
        messages: [
          {
            role: 'system',
            content: '你是考研英语大作文审题助手。根据题目判断文章类型与场景，只输出一行 JSON，不要代码块：' +
              '{"type":"chart|picture|text","scene":"场景 id","reason":"20 字以内理由"}。\n可选场景：\n' + sceneGuide
          },
          { role: 'user', content: topic.label + '\n' + topic.stem }
        ]
      });
      const obj = parseLooseJson(text);
      if (!obj || !A().scene(obj.scene)) throw new Error('AI 没返回可用场景，手动选一下。');
      const type = A().typeOf(obj.scene);
      if (type) state.typeId = type.id;
      state.sceneId = obj.scene;
      ensureDefaults();
      save();
      state.aiNote = 'AI 判断：' + A().scene(obj.scene).label + (obj.reason ? '（' + obj.reason + '）' : '') + '。可以手动改。';
      render();
      return;
    } catch (err) {
      state.aiNote = err && err.message ? err.message : 'AI 没返回结果，手动选一下。';
      note.textContent = state.aiNote;
    }
  }

  /* ---------------- 我的模板 ---------------- */

  function saveCombo() {
    const input = $('#combo-save-name');
    const note = $('#combo-save-note');
    const name = String(input && input.value || '').trim() || '未命名组合';
    const list = readJSON(SAVED_KEY, []);
    list.unshift({
      id: 'c' + Date.now(),
      name: name,
      at: Date.now(),
      setup: {
        typeId: state.typeId,
        sceneId: state.sceneId,
        picks: state.picks,
        reasonPlans: state.reasonPlans.slice(),
        connectiveId: state.connectiveId,
        visionEnabled: state.visionEnabled
      }
    });
    writeJSON(SAVED_KEY, list.slice(0, 30));
    if (note) note.textContent = '已保存「' + name + '」，下次在「审题」页底部可以载入。';
  }

  /* 按已保存的 setup 重新组装，供背诵模块复用 */
  function buildFromSetup(setup) {
    const data = setup || {};
    if (!data.sceneId || !A().scene(data.sceneId)) return null;
    const backup = {
      typeId: state.typeId,
      sceneId: state.sceneId,
      picks: state.picks,
      reasonPlans: state.reasonPlans,
      connectiveId: state.connectiveId,
      visionEnabled: state.visionEnabled
    };
    state.sceneId = data.sceneId;
    state.picks = Object.assign({}, data.picks || {});
    state.reasonPlans = (data.reasonPlans || []).slice(0, 3);
    state.connectiveId = data.connectiveId || state.connectiveId;
    state.visionEnabled = data.visionEnabled !== false;
    ensureDefaults();
    const result = assemble();
    state.typeId = backup.typeId;
    state.sceneId = backup.sceneId;
    state.picks = backup.picks;
    state.reasonPlans = backup.reasonPlans;
    state.connectiveId = backup.connectiveId;
    state.visionEnabled = backup.visionEnabled;
    return result;
  }

  function savedList() {
    const list = readJSON(SAVED_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function loadCombo(id) {
    const list = readJSON(SAVED_KEY, []);
    const item = list.filter(function (x) { return x.id === id; })[0];
    if (!item || !item.setup || !A().scene(item.setup.sceneId)) return;
    state.typeId = item.setup.typeId || state.typeId;
    state.sceneId = item.setup.sceneId;
    state.picks = Object.assign({}, item.setup.picks);
    state.reasonPlans = (item.setup.reasonPlans || []).slice(0, 3);
    state.connectiveId = item.setup.connectiveId || state.connectiveId;
    state.visionEnabled = item.setup.visionEnabled !== false;
    ensureDefaults();
    state.step = 2;
    save();
    render();
    window.scrollTo(0, 0);
  }

  function deleteCombo(id) {
    const list = readJSON(SAVED_KEY, []);
    const item = list.filter(function (x) { return x.id === id; })[0];
    if (!item) return;
    if (!window.confirm('删除「' + item.name + '」？')) return;
    writeJSON(SAVED_KEY, list.filter(function (x) { return x.id !== id; }));
    renderStep1();
  }

  /* ---------------- 对外接口 ---------------- */

  function bind() {
    if (bound) return;
    const root = $('#mode-combo');
    if (!root) return;
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    bound = true;
  }

  function show() {
    bind();
    if (!state.sceneId) restore();
    if (state.step >= 4) state.step = 3;
    $('#mode-combo').hidden = false;
    $('#combo-setup').hidden = false;
    $('#fill-work').hidden = true;
    if (!App.fill.topics()) {
      App.fill.loadTopics().then(function () { if (state.step === 1) renderStep1(); });
    }
    render();
  }

  App.combo = {
    show: show,
    init: function () { bind(); restore(); },
    build: buildFromSetup,
    saved: savedList
  };
})(window.App);
