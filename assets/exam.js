/* 历年真题：选卷、整卷模拟、单篇精练、判分、断点续做、错题本 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  const KEY = 'kaoyan-trainer-exam-v1';
  const INDEX_URL = 'assets/papers/index.json';
  const PAPER_URL = 'assets/papers/e1-';
  const VIEWS = ['home', 'detail', 'run', 'result', 'wrong'];

  const state = {
    index: null,
    paper: null,
    view: 'home',
    session: null,
    wrong: [],
    attempts: [],
    filter: 'all',
    timer: null,
    lastTick: 0,
    lastPersist: 0,
    focusNumber: null,
    saveTimer: null
  };

  const paperCache = {};

  /* ---------------- 基础工具 ---------------- */

  function escapeHtml(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function textHtml(text) {
    return escapeHtml(text).replace(/\r?\n/g, '<br>');
  }

  function fmtClock(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }

  function fmtDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    return m + ' 分 ' + (total % 60) + ' 秒';
  }

  function fmtDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function clamp(value, min, max) {
    const n = Number(value);
    if (!isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  /* ---------------- 本地存储 ---------------- */

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (raw && typeof raw === 'object') {
        state.session = raw.session || null;
        state.wrong = Array.isArray(raw.wrong) ? raw.wrong : [];
        state.attempts = Array.isArray(raw.attempts) ? raw.attempts : [];
      }
    } catch (e) {
      state.session = null;
      state.wrong = [];
      state.attempts = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        session: state.session,
        wrong: state.wrong,
        attempts: state.attempts
      }));
    } catch (e) {
      /* 隐私模式写入失败时仍保留内存状态 */
    }
  }

  function saveSoon() {
    if (state.saveTimer) return;
    state.saveTimer = setTimeout(function () {
      state.saveTimer = null;
      save();
    }, 400);
  }

  /* ---------------- 题库加载 ---------------- */

  function loadIndex() {
    return fetch(INDEX_URL).then(function (res) {
      if (!res.ok) throw new Error('题库索引加载失败');
      return res.json();
    }).then(function (data) {
      state.index = data;
      renderHome();
    }).catch(function () {
      $('#exam-home-loading').hidden = true;
      $('#exam-home-body').hidden = true;
      $('#exam-home').insertAdjacentHTML('beforeend',
        '<div class="error-card"><strong>题库没有加载成功。</strong>' +
        '<span>请检查网络后刷新页面；已经打开过的试卷会缓存在本机。</span></div>');
    });
  }

  function getPaper(year) {
    if (paperCache[year]) return Promise.resolve(paperCache[year]);
    return fetch(PAPER_URL + year + '.json').then(function (res) {
      if (!res.ok) throw new Error('试卷加载失败');
      return res.json();
    }).then(function (paper) {
      paperCache[year] = paper;
      state.paper = paper;
      state.paperYear = year;
      return paper;
    });
  }

  /* ---------------- 视图切换 ---------------- */

  function showView(view) {
    state.view = view;
    VIEWS.forEach(function (name) {
      const node = $('#exam-' + name);
      if (node) node.hidden = name !== view;
    });
    if (view !== 'run') stopTimer();
  }

  function scrollTop() {
    window.scrollTo(0, 0);
  }

  /* ---------------- 首页 ---------------- */

  function wrongCount() {
    return state.wrong.length;
  }

  function yearAttempts(year) {
    return state.attempts.filter(function (a) { return a.year === year; });
  }

  function bestFullScore(year) {
    const full = state.attempts.filter(function (a) { return a.year === year && a.mode === 'full'; });
    if (!full.length) return null;
    return Math.max.apply(null, full.map(function (a) { return a.scored || 0; }));
  }

  function renderResume() {
    const box = $('#exam-resume');
    if (!state.session || !state.session.year) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    const s = state.session;
    const label = (s.mode === 'full' ? '整卷模拟' : '单篇精练') + ' · ' + (s.label || '');
    const answered = answeredFromSession(s);
    let sub = '';
    if (s.submitted) {
      sub = '已交卷 · ' + fmtDate(s.submittedAt) + ' · 可回看成绩与解析';
    } else if (s.mode === 'full') {
      sub = '剩余 ' + fmtClock((s.deadline || 0) - Date.now()) + ' · 已答 ' + answered + ' 题';
    } else {
      sub = '已练 ' + fmtDuration(s.elapsedMs || 0) + ' · 已答 ' + answered + ' 题';
    }
    box.hidden = false;
    box.innerHTML =
      '<div class="resume-inner">' +
      '<div class="resume-text">' +
      '<span class="resume-eyebrow">' + (s.submitted ? '上次成绩' : '继续上次') + '</span>' +
      '<strong>' + s.year + ' 年 · ' + escapeHtml(label) + '</strong>' +
      '<span class="resume-meta">' + escapeHtml(sub) + '</span>' +
      '</div>' +
      '<div class="resume-actions">' +
      '<button type="button" class="btn primary small" data-resume>' + (s.submitted ? '查看成绩' : '继续') + '</button>' +
      '<button type="button" class="btn ghost small" data-abandon>清除</button>' +
      '</div>' +
      '</div>';
  }

  function answeredFromSession(s) {
    const answers = Object.keys(s.answers || {}).length;
    const texts = Object.keys(s.texts || {}).filter(function (key) {
      return String(s.texts[key] || '').trim();
    }).length;
    return answers + texts;
  }

  function renderHome() {
    renderResume();
    const count = $('#wrong-count');
    if (count) count.textContent = wrongCount();
    if (!state.index) return;
    $('#exam-home-loading').hidden = true;
    $('#exam-home-body').hidden = false;

    const papers = state.index.papers.slice().sort(function (a, b) { return b.year - a.year; });
    const maxYear = papers[0] ? papers[0].year : 2025;
    const filtered = papers.filter(function (p) {
      if (state.filter === 'recent') return p.year >= maxYear - 4;
      if (state.filter === 'undone') return yearAttempts(p.year).length === 0;
      return true;
    });

    $$('.exam-filters .filter-chip').forEach(function (chip) {
      chip.classList.toggle('is-active', chip.dataset.filter === state.filter);
    });

    const groups = [
      { title: '2020 — 2025', list: filtered.filter(function (p) { return p.year >= 2020; }) },
      { title: '2010 — 2019', list: filtered.filter(function (p) { return p.year >= 2010 && p.year <= 2019; }) },
      { title: '2000 — 2009', list: filtered.filter(function (p) { return p.year <= 2009; }) }
    ].filter(function (g) { return g.list.length; });

    if (!filtered.length) {
      $('#exam-year-grid').innerHTML = '<p class="hint">这个筛选下暂时没有试卷。</p>';
      return;
    }

    $('#exam-year-grid').innerHTML = groups.map(function (g) {
      return '<div class="year-group">' +
        '<div class="year-group-head"><h3>' + g.title + '</h3><span>' + g.list.length + ' 套</span></div>' +
        '<div class="year-grid">' + g.list.map(yearCardHtml).join('') + '</div>' +
        '</div>';
    }).join('');
  }

  function yearCardHtml(p) {
    const attempts = yearAttempts(p.year);
    const best = bestFullScore(p.year);
    const done = attempts.length > 0;
    const partNames = p.parts.map(function (part) { return part.title.replace(/（.*?）/g, '').replace(/ Part A| ·.*$/g, '').trim(); });
    const unique = partNames.filter(function (name, i) { return partNames.indexOf(name) === i; });
    let foot = '未做';
    if (best != null) foot = '整卷最高 ' + round1(best) + ' 分';
    else if (done) foot = '已练过';
    return '<button type="button" class="year-card' + (done ? ' is-done' : '') + '" data-year="' + p.year + '">' +
      '<span class="year-card-top"><b class="year-num">' + p.year + '</b>' +
      '<span class="year-badge">' + (p.year >= 2010 ? '英一' : '共用卷') + '</span></span>' +
      '<span class="year-meta">' + p.totalQuestions + ' 题 · ' + p.totalScore + ' 分</span>' +
      '<span class="year-parts">' + escapeHtml(unique.join(' · ')) + '</span>' +
      '<span class="year-foot"><span class="year-state">' + escapeHtml(foot) + '</span><span class="year-arrow">→</span></span>' +
      '</button>';
  }

  /* ---------------- 试卷详情 ---------------- */

  function openYear(year) {
    getPaper(year).then(function (paper) {
      renderDetail(paper);
      showView('detail');
      scrollTop();
    }).catch(function () {
      $('#exam-detail').innerHTML = '<div class="error-card"><strong>试卷加载失败。</strong><span>请刷新或检查网络。</span></div>';
      showView('detail');
    });
  }

  function renderDetail(paper) {
    const s = state.session;
    const canResumeFull = s && !s.submitted && s.mode === 'full' && s.year === paper.year;
    const note = paper.note ? '<p class="hint warn">' + escapeHtml(paper.note) + '</p>' : '';
    const best = bestFullScore(paper.year);
    const bestLine = best != null ? '<span class="detail-best">整卷最高 ' + round1(best) + ' 分</span>' : '';

    const partHtml = paper.parts.map(function (part) {
      const multi = part.groups.length > 1;
      const rowAction = multi
        ? '<button type="button" class="btn ghost small" data-start-part="' + part.id + '">整个题型</button>'
        : '';
      const groups = part.groups.map(function (group) {
        return '<div class="group-row">' +
          '<div class="group-row-main"><b>' + escapeHtml(group.title) + '</b>' +
          '<span>' + group.questions.length + ' 题 · ' + round1(group.score) + ' 分</span></div>' +
          '<button type="button" class="btn small" data-start-group="' + group.id + '">精练</button>' +
          '</div>';
      }).join('');
      return '<div class="part-block">' +
        '<div class="part-block-head">' +
        '<div><h3>' + escapeHtml(part.title) + '</h3>' +
        '<span>' + part.questionCount + ' 题 · ' + round1(part.score) + ' 分</span></div>' +
        (multi ? rowAction : '<button type="button" class="btn small" data-start-group="' + part.groups[0].id + '">精练</button>') +
        '</div>' + groups + '</div>';
    }).join('');

    $('#exam-detail').innerHTML =
      '<div class="detail-head">' +
      '<button type="button" class="btn ghost small detail-back" data-back-home>← 全部年份</button>' +
      '<div class="detail-title"><div><p class="eyebrow">' + escapeHtml(paper.exam) + '</p>' +
      '<h2>' + paper.year + ' 年真题</h2></div>' + bestLine + '</div>' +
      '<p class="hint">' + paper.totalQuestions + ' 题 · 满分 ' + paper.totalScore + ' 分 · 建议 ' + paper.duration + ' 分钟' +
      (paper.year <= 2004 ? ' · 原卷另有听力 20 分' : '') + '</p>' + note +
      '</div>' +

      '<div class="start-card">' +
      '<div class="start-card-text"><h3>整卷模拟</h3>' +
      '<p>180 分钟倒计时，答题卡随时跳题，交卷后客观题自动判分；翻译、写作对照参考译文/范文自评。</p></div>' +
      '<button type="button" class="btn primary" data-start-full>' + (canResumeFull ? '继续上次整卷' : '开始整卷模拟') + '</button>' +
      '</div>' +

      '<div class="part-list-head"><h3>按题型 / 单篇精练</h3><span class="hint">做完一篇就能立刻对答案</span></div>' +
      '<div class="part-list">' + partHtml + '</div>' +
      '<p class="hint">精练不限制时间，进度也会保存在本机。生词和长难句可以复制到「长难句拆解」里继续学。</p>';
  }

  /* ---------------- 会话 ---------------- */

  function sessionKey(s) {
    if (!s) return '';
    return [s.mode, s.year, s.partId || '', (s.groupIds || []).join(',')].join('|');
  }

  function startSession(mode, year, partId, groupIds, focusNumber) {
    const paper = paperCache[year];
    if (!paper) return;
    const s = state.session;
    const targetKey = sessionKey({ mode: mode, year: year, partId: partId, groupIds: groupIds });
    if (s && !s.submitted) {
      if (sessionKey(s) === targetKey) {
        if (!window.confirm('这份练习已经有进度，重新开始会清空已答内容，继续吗？')) return;
      } else if (!window.confirm('还有一份没做完的试卷（' + s.year + ' 年）。开始新的练习会覆盖那份进度，继续吗？')) {
        return;
      }
    }
    const now = Date.now();
    let label = paper.year + ' 年 · 整卷模拟';
    if (mode === 'part') {
      const part = paper.parts.filter(function (p) { return p.id === partId; })[0];
      const groups = part ? part.groups.filter(function (g) { return groupIds.indexOf(g.id) !== -1; }) : [];
      label = paper.year + ' 年 · ' + (groups.length === 1 ? groups[0].title : (part ? part.title : '精练'));
    }
    state.session = {
      mode: mode,
      year: year,
      partId: partId || null,
      groupIds: groupIds || [],
      label: label,
      startedAt: now,
      deadline: mode === 'full' ? now + paper.duration * 60 * 1000 : null,
      elapsedMs: 0,
      answers: {},
      texts: {},
      selfScores: {},
      checkedGroups: [],
      submitted: false,
      submittedAt: 0,
      autoSubmitted: false,
      attemptId: null
    };
    state.focusNumber = focusNumber || null;
    save();
    renderRun();
    showView('run');
    scrollTop();
    startTimer();
  }

  function resumeSession() {
    if (!state.session) return;
    const s = state.session;
    getPaper(s.year).then(function () {
      if (s.submitted) {
        renderResult();
        showView('result');
      } else {
        renderRun();
        showView('run');
        scrollTop();
        startTimer();
      }
    }).catch(function () {
      window.alert('试卷加载失败，请检查网络后重试。');
    });
  }

  function abandonSession() {
    if (!window.confirm('清除这份练习进度？已交卷的成绩和错题本不受影响。')) return;
    state.session = null;
    state.focusNumber = null;
    save();
    renderHome();
  }

  function sessionParts(paper, s) {
    if (!paper || !s) return [];
    let parts = paper.parts;
    if (s.mode === 'part') {
      parts = parts.filter(function (p) { return p.id === s.partId; });
    }
    return parts.map(function (part) {
      let groups = part.groups;
      if (s.mode === 'part') {
        groups = groups.filter(function (g) { return s.groupIds.indexOf(g.id) !== -1; });
      }
      return { part: part, groups: groups };
    }).filter(function (item) { return item.groups.length; });
  }

  function collectQuestions(paper, s, onlyGroupIds) {
    const out = [];
    sessionParts(paper, s).forEach(function (item) {
      item.groups.forEach(function (group) {
        if (onlyGroupIds && onlyGroupIds.indexOf(group.id) === -1) return;
        group.questions.forEach(function (q) {
          out.push({ q: q, group: group, part: item.part });
        });
      });
    });
    return out;
  }

  function answeredCount(paper, s) {
    const all = collectQuestions(paper, s);
    let n = 0;
    all.forEach(function (item) {
      if (item.q.subjective) {
        if (String(s.texts[item.q.number] || '').trim()) n++;
      } else if (s.answers[item.q.number]) {
        n++;
      }
    });
    return n;
  }

  function allGroupIds(paper, s) {
    const ids = [];
    sessionParts(paper, s).forEach(function (item) {
      item.groups.forEach(function (group) { ids.push(group.id); });
    });
    return ids;
  }

  function isChecked(s, group) {
    return s.submitted || s.checkedGroups.indexOf(group.id) !== -1;
  }

  function currentPaper() {
    if (state.session && paperCache[state.session.year]) return paperCache[state.session.year];
    return state.paper;
  }

  /* ---------------- 答题页 ---------------- */

  function renderRun() {
    const s = state.session;
    if (!s) return;
    const paper = currentPaper();
    if (!paper) return;
    const parts = sessionParts(paper, s);
    const all = collectQuestions(paper, s);
    const answered = answeredCount(paper, s);
    const isFull = s.mode === 'full';

    const chips = [];
    parts.forEach(function (item) {
      item.groups.forEach(function (group) {
        chips.push(sectionInfo(item.part, group, s));
      });
    });
    const nav = '<div class="exam-nav" role="tablist" aria-label="题组导航">' +
      chips.map(function (sec) {
        return '<button type="button" class="exam-nav-chip" role="tab" data-nav-group="' + escapeHtml(sec.id) + '">' +
          '<span class="exam-nav-label">' + escapeHtml(sec.label) + '</span>' +
          '<span class="exam-nav-count" data-count-group="' + escapeHtml(sec.id) + '">' + sec.answered + '/' + sec.total + '</span>' +
          '</button>';
      }).join('') + '</div>';

    const bar =
      '<div class="exam-sticky" id="exam-sticky">' +
      '<div class="exam-bar" id="exam-bar">' +
      '<div class="exam-bar-left">' +
      '<button type="button" class="icon-btn" id="btn-exit-exam" aria-label="退出并保存">←</button>' +
      '<div class="exam-bar-title"><b>' + escapeHtml(s.label) + '</b>' +
      '<span id="exam-bar-sub">已答 ' + answered + ' / ' + all.length + ' 题</span></div>' +
      '</div>' +
      '<div class="exam-bar-right">' +
      '<span class="exam-timer" id="exam-timer">' + timerText(s) + '</span>' +
      '<button type="button" class="btn ghost small" id="btn-answer-card">答题卡</button>' +
      (isFull
        ? '<button type="button" class="btn primary small" id="btn-submit-exam">交卷</button>'
        : '<button type="button" class="btn ghost small" id="btn-exit-exam-2">退出</button>') +
      '</div></div>' + nav + '</div>';

    const intro = isFull
      ? '<p class="exam-run-hint">本卷共 ' + paper.totalQuestions + ' 题，满分 ' + paper.totalScore + ' 分。答案会自动保存；中途离开可以回来继续。</p>'
      : '<p class="exam-run-hint">' + escapeHtml(s.label) + ' · 做完一篇点「对答案」，客观题立刻判分并给解析。</p>';

    const body = parts.map(function (item, index) {
      return renderPart(paper, item.part, item.groups, s, parts[index + 1]);
    }).join('');

    $('#exam-run').innerHTML = bar + '<div class="exam-run-body">' + intro + body + '</div>';
    updateBar();
    updateNavCounts(paper, s);

    const target = isFull && s.scrollGroup ? $('#group-' + s.scrollGroup) : null;
    if (target) {
      setTimeout(function () {
        target.scrollIntoView({ block: 'start' });
        updateNavActive();
      }, 60);
    }
  }

  function sectionInfo(part, group, s) {
    let label = part.short || part.title;
    if (group.kind === 'reading') {
      label = group.title;
    } else if (part.groups.length > 1 && group.kind === 'writing') {
      label = group.title.indexOf('Part A') === 0 ? '小作文' : '大作文';
    }
    const answered = group.questions.filter(function (q) {
      return q.subjective ? !!String(s.texts[q.number] || '').trim() : !!s.answers[q.number];
    }).length;
    return {
      id: group.id,
      label: label,
      answered: answered,
      total: group.questions.length
    };
  }

  function timerText(s) {
    if (s.mode === 'full') return fmtClock((s.deadline || Date.now()) - Date.now());
    return fmtClock(s.elapsedMs || 0);
  }

  function renderPart(paper, part, groups, s, next) {
    const lastNext = next
      ? (next.groups.length > 1 ? next.part.title : next.groups[0].title)
      : '';
    const groupHtml = groups.map(function (group, index) {
      const following = groups[index + 1];
      let target = '';
      let label = '交卷并查看成绩';
      if (following) {
        target = following.id;
        label = '下一篇 · ' + following.title;
      } else if (next) {
        target = next.groups[0].id;
        label = '下一篇 · ' + lastNext;
      }
      return renderGroup(paper, part, group, s) + partFoot(target, label, s);
    }).join('');
    const count = groups.reduce(function (n, g) { return n + g.questions.length; }, 0);
    const score = groups.reduce(function (n, g) { return n + g.score; }, 0);
    const instr = part.instructions
      ? '<details class="paper-instructions"><summary>本部分说明</summary><p>' + textHtml(part.instructions) + '</p></details>'
      : '';
    return '<section class="paper-part">' +
      '<div class="part-band"><span class="part-band-name">' + escapeHtml(part.title) + '</span>' +
      '<span class="part-band-meta">' + count + ' 题 · ' + round1(score) + ' 分</span></div>' +
      instr + groupHtml + '</section>';
  }

  function partFoot(target, label, s) {
    if (s.mode !== 'full') return '';
    return '<div class="part-foot"><button type="button" class="btn ghost small" data-part-next="' +
      escapeHtml(target) + '">' + escapeHtml(label) + ' →</button></div>';
  }

  function renderGroup(paper, part, group, s) {
    const checked = isChecked(s, group);
    const subjective = group.questions.every(function (q) { return q.subjective; });
    const showHead = part.groups.length > 1 || group.kind === 'writing';
    const head = showHead
      ? '<div class="group-head"><h3>' + escapeHtml(group.title) + '</h3>' +
        '<span>' + group.questions.length + ' 题 · ' + round1(group.score) + ' 分</span></div>'
      : '';

    let passage = '';
    if (group.kind === 'ordering') {
      passage = orderingArticle(group, s, checked);
    } else if (group.passage && group.passage.length) {
      passage = '<div class="passage">' + group.passage.map(function (p) {
        return '<p>' + passageText(p, group, s, checked) + '</p>';
      }).join('') + '</div>';
    }

    let optionList = '';
    if ((group.kind === 'gap_fill' || group.kind === 'heading_matching' || group.kind === 'matching' || group.kind === 'ordering') && group.options) {
      optionList = '<div class="newtype-options">' +
        '<div class="newtype-options-head">备选选项</div>' +
        Object.keys(group.options).sort().map(function (key) {
          return '<div class="newtype-option"><span class="opt-key">' + key + '</span>' +
            '<span class="newtype-option-text">' + textHtml(group.options[key]) + '</span></div>';
        }).join('') + '</div>';
    }

    const questions = group.questions.map(function (q) {
      return renderQuestion(q, group, s, checked);
    }).join('');

    let actions = '';
    if (s.mode === 'part') {
      if (!checked) {
        actions = '<div class="group-actions">' +
          '<button type="button" class="btn primary" data-check-group="' + group.id + '">' +
          (subjective ? '对照参考译文/范文' : '对答案') + '</button>' +
          '<span class="tip">' + (subjective ? '翻译和写作不调用 AI，只给参考' : '只判客观题，答完这一篇再点') + '</span>' +
          '</div>';
      } else {
        const stat = groupStats(group, s);
        const hasMeaningfulScore = !subjective;
        actions = '<div class="group-actions is-done">' +
          (hasMeaningfulScore
            ? '<span class="group-score">本篇得分 <b>' + round1(stat.earned) + '</b> / ' + round1(stat.max) + '</span>'
            : '<span class="group-score">已显示参考译文/范文</span>') +
          '<button type="button" class="btn ghost small" data-restart-group="' + group.id + '">重做本篇</button>' +
          '</div>';
      }
    }

    const split = (group.kind === 'reading' || group.kind === 'translation_sentences') &&
      !!passage && !optionList;
    const inner = split
      ? '<div class="group-split">' +
        '<div class="split-col split-passage">' + passage + '</div>' +
        '<div class="split-col split-questions"><div class="questions">' + questions + '</div>' + actions + '</div>' +
        '</div>'
      : passage + optionList + '<div class="questions">' + questions + '</div>' + actions;

    return '<article class="paper-block" id="group-' + escapeHtml(group.id) + '" data-section="' +
      escapeHtml(group.id) + '">' + head + inner + '</article>';
  }

  function passageText(text, group, s, checked) {
    const answerMap = {};
    group.questions.forEach(function (q) { answerMap[q.number] = q.answer; });
    return escapeHtml(text).replace(/\r?\n/g, '<br>').replace(/\{\{(\d+)\}\}/g, function (m, n) {
      const num = Number(n);
      const chosen = s.answers[num] || '';
      const q = group.questions.filter(function (item) { return item.number === num; })[0];
      const stateClass = checked && q ? (chosen === q.answer ? ' is-correct' : ' is-wrong') : '';
      return '<button type="button" class="passage-blank' + stateClass + '" data-jump="q-' + s.year + '-' + num + '">' +
        '<span class="blank-no">' + num + '</span>' +
        '<span class="blank-val">' + escapeHtml(chosen || '选') + '</span></button>';
    });
  }

  function orderingArticle(group, s, checked) {
    const opts = group.options || {};
    const answerMap = {};
    group.questions.forEach(function (q) { answerMap[q.number] = q.answer; });
    const seq = (group.order || []).map(function (item, index) {
      if (item.given) {
        return '<div class="order-given"><span class="order-key">' + item.given + '</span>' +
          '<div class="order-given-text">' + textHtml(opts[item.given] || '') + '</div></div>';
      }
      const num = item.number;
      const chosen = s.answers[num] || '';
      const q = group.questions.filter(function (item2) { return item2.number === num; })[0];
      const stateClass = checked && q ? (chosen === q.answer ? ' is-correct' : ' is-wrong') : '';
      return '<button type="button" class="order-slot' + stateClass + '" data-jump="q-' + s.year + '-' + num + '">' +
        '<span class="blank-no">' + num + '</span>' +
        '<span class="blank-val">' + escapeHtml(chosen ? '段落 ' + chosen : '选择段落') + '</span></button>';
    }).join('');
    return '<div class="order-article">' + seq + '</div>';
  }

  function renderQuestion(q, group, s, checked) {
    if (q.subjective) return renderSubjective(q, group, s, checked);

    const header = '<div class="q-head"><span class="q-no">' + q.number + '</span>' +
      '<span class="q-score">' + round1(q.score) + ' 分</span></div>';
    const stem = q.stem
      ? '<div class="q-stem">' + textHtml(q.stem) + '</div>'
      : (group.kind === 'matching' && !q.stem
        ? '<p class="hint">本题题干在题库中缺失，可先对照解析中的人名再作答。</p>'
        : '');

    let options = '';
    if (q.options) {
      options = '<div class="option-list">' + Object.keys(q.options).sort().map(function (key) {
        return optionHtml(q, key, q.options[key], s, checked);
      }).join('') + '</div>';
    } else if (group.options) {
      options = '<div class="letter-grid">' + Object.keys(group.options).sort().map(function (key) {
        const chosen = s.answers[q.number] === key;
        const stateClass = checked ? (chosen ? (key === q.answer ? ' is-correct' : ' is-wrong') : '') : '';
        const correctClass = checked && key === q.answer ? ' is-correct' : '';
        return '<button type="button" class="letter-opt' + (chosen ? ' is-selected' : '') + stateClass + correctClass +
          '" data-q="' + q.number + '" data-opt="' + key + '">' + key + '</button>';
      }).join('') + '</div>';
    }

    return '<div class="q-card" id="q-' + s.year + '-' + q.number + '" data-q="' + q.number + '">' +
      header + stem + options + feedbackHtml(q, s, checked) + '</div>';
  }

  function optionHtml(q, key, text, s, checked) {
    const chosen = s.answers[q.number] === key;
    let stateClass = chosen ? ' is-selected' : '';
    if (checked) {
      if (key === q.answer) stateClass += ' is-correct';
      else if (chosen) stateClass += ' is-wrong';
    }
    return '<button type="button" class="option' + stateClass + '" data-q="' + q.number + '" data-opt="' + key + '">' +
      '<span class="opt-key">' + key + '</span>' +
      '<span class="opt-text">' + textHtml(text) + '</span></button>';
  }

  function feedbackHtml(q, s, checked) {
    if (!checked) return '';
    const chosen = s.answers[q.number] || '';
    const ok = chosen === q.answer;
    const explain = q.explanation
      ? '<details class="explain"><summary>查看解析</summary><div class="md">' + App.md.render(q.explanation) + '</div></details>'
      : '';
    return '<div class="q-feedback ' + (ok ? 'ok' : 'bad') + '">' +
      '<div class="feedback-line"><span>正确答案 <b>' + escapeHtml(q.answer) + '</b></span>' +
      '<span>你的答案 <b>' + escapeHtml(chosen || '未答') + '</b></span>' +
      '<span class="feedback-verdict">' + (ok ? '答对' : '答错') + '</span></div>' + explain + '</div>';
  }

  function renderSubjective(q, group, s, checked) {
    const value = s.texts[q.number] || '';
    const isWriting = group.kind === 'writing';
    const count = isWriting ? wordCount(value) : 0;
    const images = group.images && group.images.length && isWriting
      ? '<div class="writing-images">' + group.images.map(function (img) {
        return '<img src="assets/papers/' + escapeHtml(img) + '" alt="作文题目配图" loading="lazy">';
      }).join('') + '</div>'
      : '';
    const reference = checked
      ? '<div class="reference-box">' +
        '<div class="reference-head"><b>' + (isWriting ? '参考范文' : '参考译文') + '</b>' +
        '<span>' + q.score + ' 分</span></div>' +
        '<div class="reference-text">' + textHtml(q.answer) + '</div>' +
        (q.explanation ? '<details class="explain"><summary>查看解析</summary><div class="md">' + App.md.render(q.explanation) + '</div></details>' : '') +
        '</div>'
      : '';
    return '<div class="q-card subjective-card" id="q-' + s.year + '-' + q.number + '" data-q="' + q.number + '">' +
      '<div class="q-head"><span class="q-no">' + q.number + '</span>' +
      '<span class="q-score">' + q.score + ' 分</span></div>' +
      (q.stem ? '<div class="q-stem writing-prompt">' + textHtml(q.stem) + '</div>' : '') +
      images +
      '<label class="field answer-field"><span class="label">' + (isWriting ? '你的作文' : '你的译文') + '</span>' +
      '<textarea class="exam-textarea" data-text="' + q.number + '" rows="' + (isWriting ? 10 : 4) + '" ' +
      'placeholder="' + (isWriting ? '在这里写作文，自动保存…' : '在这里写译文，自动保存…') + '">' + escapeHtml(value) + '</textarea>' +
      '</label>' +
      (isWriting ? '<div class="text-meta"><span data-count-for="' + q.number + '">' + count + ' words</span><span class="tip">英语一写作建议 160–200 词</span></div>' : '') +
      reference + '</div>';
  }

  function wordCount(text) {
    const clean = String(text || '').trim();
    return clean ? clean.split(/\s+/).length : 0;
  }

  /* ---------------- 交互 ---------------- */

  function chooseOption(number, opt) {
    const s = state.session;
    if (!s || s.submitted) return;
    if (s.checkedGroups.length && groupForQuestion(s, number) && isChecked(s, groupForQuestion(s, number))) return;
    s.answers[number] = opt;
    saveSoon();
    $$('[data-q="' + number + '"][data-opt]').forEach(function (btn) {
      btn.classList.toggle('is-selected', btn.dataset.opt === opt);
    });
    refreshBlanks();
    updateBar();
  }

  function groupForQuestion(s, number) {
    const paper = currentPaper();
    if (!paper) return null;
    const items = collectQuestions(paper, s);
    for (let i = 0; i < items.length; i++) {
      if (items[i].q.number === number) return items[i].group;
    }
    return null;
  }

  function refreshBlanks() {
    const s = state.session;
    if (!s) return;
    $$('.passage-blank, .order-slot').forEach(function (node) {
      const jump = node.dataset.jump || '';
      const number = Number(jump.split('-').pop());
      if (!number) return;
      const val = node.querySelector('.blank-val');
      if (!val) return;
      const chosen = s.answers[number] || '';
      val.textContent = chosen || (node.classList.contains('order-slot') ? '选择段落' : '选');
      node.classList.toggle('is-filled', !!chosen);
    });
  }

  function updateBar() {
    const s = state.session;
    const paper = currentPaper();
    if (!s || !paper) return;
    const sub = $('#exam-bar-sub');
    if (sub) sub.textContent = '已答 ' + answeredCount(paper, s) + ' / ' + collectQuestions(paper, s).length + ' 题';
    const timer = $('#exam-timer');
    if (timer) timer.textContent = timerText(s);
    updateNavCounts(paper, s);
  }

  function updateNavCounts(paper, s) {
    sessionParts(paper, s).forEach(function (item) {
      item.groups.forEach(function (group) {
        const el = $('[data-count-group="' + group.id + '"]');
        if (!el) return;
        const info = sectionInfo(item.part, group, s);
        el.textContent = info.answered + '/' + info.total;
        el.classList.toggle('is-done', info.answered === info.total);
      });
    });
  }

  function updateNavActive() {
    const s = state.session;
    const run = $('#exam-run');
    if (!s || !run || run.hidden) return;
    const chips = $$('.exam-nav-chip');
    if (!chips.length) return;
    const sticky = $('#exam-sticky');
    const threshold = (sticky ? sticky.getBoundingClientRect().bottom : 100) + 8;
    let current = chips[0].dataset.navGroup;
    $$('[data-section]').forEach(function (section) {
      if (section.getBoundingClientRect().top <= threshold) current = section.dataset.section;
    });
    chips.forEach(function (chip) {
      const active = chip.dataset.navGroup === current;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    s.scrollGroup = current;
  }

  function scrollToSection(id) {
    const node = $('#group-' + id);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateNavActive();
  }

  function checkGroup(groupId) {
    const s = state.session;
    const paper = currentPaper();
    if (!s || !paper || s.submitted) return;
    const items = sessionParts(paper, s).reduce(function (acc, item) {
      item.groups.forEach(function (g) { if (g.id === groupId) acc.push({ part: item.part, group: g }); });
      return acc;
    }, []);
    if (!items.length) return;
    const group = items[0].group;
    if (group.questions.every(function (q) { return q.subjective; })) {
      if (s.checkedGroups.indexOf(group.id) === -1) s.checkedGroups.push(group.id);
      save();
      rerenderRun();
      return;
    }
    const unanswered = group.questions.filter(function (q) { return !s.answers[q.number]; }).length;
    if (unanswered && !window.confirm('这一篇还有 ' + unanswered + ' 题没答，仍然对答案吗？')) return;
    if (s.checkedGroups.indexOf(group.id) === -1) s.checkedGroups.push(group.id);
    group.questions.forEach(function (q) {
      const chosen = s.answers[q.number] || '';
      if (chosen === q.answer) removeWrong(s.year, q.number);
      else recordWrong(s.year, q.number, chosen, q, group, items[0].part);
    });
    recordPartAttempt(paper, s, group);
    save();
    rerenderRun();
  }

  function rerenderRun() {
    const y = window.scrollY;
    renderRun();
    window.scrollTo(0, y);
    if ($('#exam-sheet') && !$('#exam-sheet').hidden) renderSheet();
  }

  function restartGroup(groupId) {
    const s = state.session;
    if (!s) return;
    s.checkedGroups = s.checkedGroups.filter(function (id) { return id !== groupId; });
    const paper = currentPaper();
    const items = collectQuestions(paper, s);
    items.forEach(function (item) {
      if (item.group.id !== groupId) return;
      if (item.q.subjective) delete s.texts[item.q.number];
      else delete s.answers[item.q.number];
    });
    save();
    rerenderRun();
  }

  function scrollToQuestion(number) {
    const node = $('#q-' + state.session.year + '-' + number);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.classList.remove('is-flash');
    void node.offsetWidth;
    node.classList.add('is-flash');
  }

  /* ---------------- 答题卡 ---------------- */

  function renderSheet() {
    const s = state.session;
    const paper = currentPaper();
    if (!s || !paper) return;
    const items = collectQuestions(paper, s);
    $('#sheet-summary').textContent = '已答 ' + answeredCount(paper, s) + ' / ' + items.length + ' 题 · 点题号直接跳题';
    const parts = sessionParts(paper, s);
    $('#sheet-grid').innerHTML = parts.map(function (item) {
      return '<div class="sheet-part"><div class="sheet-part-head">' + escapeHtml(item.part.title) + '</div>' +
        item.groups.map(function (group) {
          const groupHead = (item.groups.length > 1 || group.title !== item.part.title)
            ? '<div class="sheet-group-head">' + escapeHtml(group.title) + '</div>'
            : '';
          return '<div class="sheet-group">' + groupHead + '<div class="sheet-nums">' +
            group.questions.map(function (q) {
              const answered = q.subjective ? !!String(s.texts[q.number] || '').trim() : !!s.answers[q.number];
              const checked = isChecked(s, group);
              const wrong = checked && !q.subjective && s.answers[q.number] !== q.answer;
              return '<button type="button" class="sheet-num' + (answered ? ' is-answered' : '') +
                (wrong ? ' is-wrong' : '') + (checked && !q.subjective && s.answers[q.number] === q.answer ? ' is-correct' : '') +
                '" data-sheet-jump="' + q.number + '">' + q.number + '</button>';
            }).join('') + '</div></div>';
        }).join('') + '</div>';
    }).join('');
  }

  function openSheet() {
    renderSheet();
    const isFull = state.session && state.session.mode === 'full';
    $('#btn-sheet-submit').hidden = !isFull;
    $('#exam-sheet').hidden = false;
  }

  function closeSheet() {
    $('#exam-sheet').hidden = true;
  }

  function jumpFromSheet(number) {
    closeSheet();
    setTimeout(function () { scrollToQuestion(number); }, 30);
  }

  /* ---------------- 计时 ---------------- */

  function startTimer() {
    stopTimer();
    const s = state.session;
    if (!s || s.submitted) return;
    state.lastTick = Date.now();
    state.lastPersist = Date.now();
    state.timer = setInterval(function () {
      const session = state.session;
      if (!session || session.submitted) {
        stopTimer();
        return;
      }
      const now = Date.now();
      if (session.mode === 'full') {
        const remain = Math.max(0, (session.deadline || 0) - now);
        const el = $('#exam-timer');
        if (el) el.textContent = fmtClock(remain);
        if (remain <= 0) {
          stopTimer();
          submitSession(true);
          return;
        }
      } else {
        session.elapsedMs += now - state.lastTick;
        state.lastTick = now;
        const el = $('#exam-timer');
        if (el) el.textContent = fmtClock(session.elapsedMs);
      }
      if (now - state.lastPersist > 12000) {
        state.lastPersist = now;
        save();
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function pauseSessionClock() {
    const s = state.session;
    if (!s || s.submitted || s.mode !== 'part') return;
    if (!state.timer) return;
    const now = Date.now();
    if (state.lastTick) {
      s.elapsedMs += now - state.lastTick;
      state.lastTick = now;
    }
    save();
  }

  /* ---------------- 判分 ---------------- */

  function groupStats(group, s) {
    let earned = 0;
    let max = 0;
    let correct = 0;
    let total = 0;
    group.questions.forEach(function (q) {
      if (q.subjective) return;
      max += q.score;
      total++;
      if ((s.answers[q.number] || '') === q.answer) {
        earned += q.score;
        correct++;
      }
    });
    return { earned: earned, max: max, correct: correct, total: total };
  }

  function computeStats(paper, s, groupIds) {
    let objectiveEarned = 0;
    let objectiveMax = 0;
    let subjectiveMax = 0;
    let selfScore = 0;
    let correct = 0;
    let objectiveTotal = 0;
    const wrongs = [];
    collectQuestions(paper, s, groupIds).forEach(function (item) {
      const q = item.q;
      if (q.subjective) {
        subjectiveMax += q.score;
        selfScore += Number(s.selfScores[q.number] || 0);
        return;
      }
      objectiveMax += q.score;
      objectiveTotal++;
      const chosen = s.answers[q.number] || '';
      if (chosen === q.answer) {
        objectiveEarned += q.score;
        correct++;
      } else {
        wrongs.push(item);
      }
    });
    return {
      objectiveEarned: objectiveEarned,
      objectiveMax: objectiveMax,
      subjectiveMax: subjectiveMax,
      selfScore: selfScore,
      scored: objectiveEarned + selfScore,
      max: objectiveMax + subjectiveMax,
      correct: correct,
      objectiveTotal: objectiveTotal,
      wrongs: wrongs
    };
  }

  function recordPartAttempt(paper, s, group) {
    const st = groupStats(group, s);
    const attempt = {
      id: 'a' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      year: paper.year,
      mode: 'part',
      partId: s.partId,
      groupIds: [group.id],
      label: s.label,
      objective: st.earned,
      objectiveMax: st.max,
      subjectiveMax: 0,
      selfScore: 0,
      scored: st.earned,
      max: st.max,
      correct: st.correct,
      objectiveTotal: st.total,
      ts: Date.now()
    };
    state.attempts.push(attempt);
    trimAttempts();
  }

  function saveFullAttempt(paper, s) {
    const st = computeStats(paper, s);
    let attempt = null;
    if (s.attemptId) {
      attempt = state.attempts.filter(function (a) { return a.id === s.attemptId; })[0] || null;
    }
    if (!attempt) {
      attempt = {
        id: 'a' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        year: paper.year,
        mode: 'full',
        partId: null,
        groupIds: [],
        label: s.label,
        ts: Date.now()
      };
      state.attempts.push(attempt);
      s.attemptId = attempt.id;
    }
    attempt.objective = st.objectiveEarned;
    attempt.objectiveMax = st.objectiveMax;
    attempt.subjectiveMax = st.subjectiveMax;
    attempt.selfScore = st.selfScore;
    attempt.scored = st.scored;
    attempt.max = st.max;
    attempt.correct = st.correct;
    attempt.objectiveTotal = st.objectiveTotal;
    attempt.ts = Date.now();
    trimAttempts();
  }

    function trimAttempts() {
    if (state.attempts.length > 200) {
      state.attempts = state.attempts.slice(-200);
    }
  }

  function submitSession(auto) {
    const s = state.session;
    const paper = currentPaper();
    if (!s || !paper || s.submitted) return;
    const total = collectQuestions(paper, s).length;
    const answered = answeredCount(paper, s);
    if (!auto && answered < total) {
      if (!window.confirm('还有 ' + (total - answered) + ' 题未作答，确定交卷吗？')) return;
    }
    s.submitted = true;
    s.submittedAt = Date.now();
    s.autoSubmitted = !!auto;
    s.checkedGroups = allGroupIds(paper, s);
    collectQuestions(paper, s).forEach(function (item) {
      if (item.q.subjective) return;
      const chosen = s.answers[item.q.number] || '';
      if (chosen === item.q.answer) removeWrong(s.year, item.q.number);
      else recordWrong(s.year, item.q.number, chosen, item.q, item.group, item.part);
    });
    saveFullAttempt(paper, s);
    save();
    stopTimer();
    closeSheet();
    renderResult();
    showView('result');
    scrollTop();
  }

  /* ---------------- 错题本 ---------------- */

  function wrongKey(year, number) {
    return String(year) + ':' + String(number);
  }

  function recordWrong(year, number, chosen, q, group, part) {
    const key = wrongKey(year, number);
    const item = {
      key: key,
      year: year,
      number: number,
      chosen: chosen,
      answer: q.answer,
      partId: part.id,
      groupId: group.id,
      partTitle: part.title,
      groupTitle: group.title,
      stem: q.stem || (group.kind === 'cloze' ? '完形填空第 ' + number + ' 题' : group.title + ' 第 ' + number + ' 题'),
      ts: Date.now()
    };
    let found = false;
    state.wrong.forEach(function (old, i) {
      if (old.key === key) {
        state.wrong[i] = item;
        found = true;
      }
    });
    if (!found) state.wrong.push(item);
  }

  function removeWrong(year, number) {
    const key = wrongKey(year, number);
    state.wrong = state.wrong.filter(function (item) { return item.key !== key; });
  }

  function openWrong() {
    renderWrong();
    showView('wrong');
    scrollTop();
  }

  function renderWrong() {
    $('#wrong-count') && ($('#wrong-count').textContent = wrongCount());
    if (!state.wrong.length) {
      $('#exam-wrong').innerHTML =
        '<div class="detail-head"><button type="button" class="btn ghost small detail-back" data-back-home>← 返回真题首页</button>' +
        '<h2>错题本</h2></div>' +
        '<div class="empty-state"><span class="empty-mark">✓</span><p>还没有错题。做完整卷或单篇对答案后，答错的客观题会自动收进来。</p></div>';
      return;
    }
    const sorted = state.wrong.slice().sort(function (a, b) { return b.ts - a.ts; });
    $('#exam-wrong').innerHTML =
      '<div class="detail-head"><button type="button" class="btn ghost small detail-back" data-back-home>← 返回真题首页</button>' +
      '<div class="wrong-head-row"><h2>错题本</h2><span class="wrong-total">' + sorted.length + ' 题</span></div>' +
      '<p class="hint">做对同一道题后会自动移出。重做会打开原篇，并把这道题滚动到屏幕中间。</p></div>' +
      '<div class="wrong-list">' + sorted.map(function (item) {
        return '<article class="wrong-item">' +
          '<div class="wrong-item-head"><span class="part-chip">' + item.year + ' · ' + escapeHtml(item.partTitle) + '</span>' +
          '<span class="wrong-group">' + escapeHtml(item.groupTitle) + '</span>' +
          '<span class="wrong-time">' + fmtDate(item.ts) + '</span></div>' +
          '<p class="wrong-stem">第 ' + item.number + ' 题　' + escapeHtml(item.stem) + '</p>' +
          '<p class="wrong-ans">你的答案 <b class="bad">' + escapeHtml(item.chosen || '未答') + '</b>' +
          ' · 正确答案 <b class="ok">' + escapeHtml(item.answer) + '</b></p>' +
          '<div class="wrong-actions">' +
          '<button type="button" class="btn small" data-wrong-redo="' + item.key + '">重做这道题</button>' +
          '<button type="button" class="btn ghost small" data-wrong-del="' + item.key + '">移出错题本</button>' +
          '</div></article>';
      }).join('') + '</div>' +
      '<div class="row wrong-foot"><button type="button" class="btn ghost small" data-wrong-clear>清空错题本</button></div>';
  }

  function redoWrong(key) {
    const item = state.wrong.filter(function (w) { return w.key === key; })[0];
    if (!item) return;
    getPaper(item.year).then(function (paper) {
      startSession('part', item.year, item.partId, [item.groupId], item.number);
      setTimeout(function () { scrollToQuestion(item.number); }, 120);
    }).catch(function () {
      window.alert('试卷加载失败，请检查网络后重试。');
    });
  }

  /* ---------------- 成绩页 ---------------- */

  function renderResult() {
    const s = state.session;
    const paper = currentPaper();
    if (!s || !paper) return;
    const st = computeStats(paper, s);
    const pct = st.max ? Math.round(st.scored / st.max * 100) : 0;
    const partRows = sessionParts(paper, s).map(function (item) {
      const pst = computeStats(paper, s, item.groups.map(function (g) { return g.id; }));
      const pctPart = pst.max ? Math.round(pst.scored / pst.max * 100) : 0;
      return '<div class="result-part-row">' +
        '<div class="result-part-main"><b>' + escapeHtml(item.part.title) + '</b>' +
        '<span>' + round1(pst.scored) + ' / ' + round1(pst.max) + ' 分</span></div>' +
        '<div class="result-bar"><span style="width:' + Math.max(0, Math.min(100, pctPart)) + '%"></span></div>' +
        '</div>';
    }).join('');

    const subjective = collectQuestions(paper, s).filter(function (item) { return item.q.subjective; });
    const subjectiveHtml = subjective.length
      ? '<section class="result-section"><div class="result-section-head"><h3>主观题自评</h3>' +
        '<span class="hint">对照参考译文/范文给自己打分，分数会计入总分</span></div>' +
        subjective.map(function (item) {
          const q = item.q;
          const mine = String(s.texts[q.number] || '').trim();
          return '<div class="self-card">' +
            '<div class="self-head"><span class="part-chip">' + escapeHtml(item.part.title) + '</span>' +
            '<b>第 ' + q.number + ' 题</b><span class="self-max">满分 ' + q.score + '</span></div>' +
            (mine
              ? '<details class="my-answer"><summary>我的作答（' + (item.group.kind === 'writing' ? wordCount(mine) + ' words' : '已写 ' + mine.length + ' 字') + '）</summary>' +
                '<div class="my-answer-text">' + textHtml(mine) + '</div></details>'
              : '<p class="hint">本题未作答。</p>') +
            '<div class="reference-box">' +
            '<div class="reference-head"><b>' + (item.group.kind === 'writing' ? '参考范文' : '参考译文') + '</b><span>' + q.score + ' 分</span></div>' +
            '<div class="reference-text">' + textHtml(q.answer) + '</div>' +
            (q.explanation ? '<details class="explain"><summary>查看解析</summary><div class="md">' + App.md.render(q.explanation) + '</div></details>' : '') +
            '</div>' +
            '<label class="self-score"><span>我的自评</span>' +
            '<input type="number" min="0" max="' + q.score + '" step="0.5" value="' + (s.selfScores[q.number] || 0) + '" data-self="' + q.number + '">' +
            '<span>/ ' + q.score + ' 分</span></label>' +
            '</div>';
        }).join('') + '</section>'
      : '';

    const wrongs = st.wrongs;
    const wrongHtml = wrongs.length
      ? '<section class="result-section"><div class="result-section-head"><h3>错题复盘</h3>' +
        '<span class="hint">' + wrongs.length + ' 道客观题答错，已自动收进错题本</span></div>' +
        wrongs.map(function (item) {
          const q = item.q;
          const chosen = s.answers[q.number] || '';
          return '<div class="wrong-review">' +
            '<div class="wrong-item-head"><span class="part-chip">' + escapeHtml(item.part.title) + '</span>' +
            '<span class="wrong-group">' + escapeHtml(item.group.title) + '</span>' +
            '<span class="wrong-time">第 ' + q.number + ' 题</span></div>' +
            (q.stem ? '<p class="wrong-stem">' + textHtml(q.stem) + '</p>' : '') +
            '<p class="wrong-ans">你的答案 <b class="bad">' + escapeHtml(chosen || '未答') + '</b>' +
            ' · 正确答案 <b class="ok">' + escapeHtml(q.answer) + '</b></p>' +
            (q.explanation ? '<details class="explain"><summary>查看解析</summary><div class="md">' + App.md.render(q.explanation) + '</div></details>' : '') +
            '</div>';
        }).join('') + '</section>'
      : '<section class="result-section"><div class="result-section-head"><h3>错题复盘</h3>' +
        '<span class="hint">客观题全对</span></div><p class="result-empty">这张卷的客观题没有错题。</p></section>';

    $('#exam-result').innerHTML =
      '<div class="detail-head"><button type="button" class="btn ghost small detail-back" data-result-home>← 返回真题首页</button>' +
      '<p class="eyebrow">' + escapeHtml(s.label) + '</p><h2>本次成绩</h2>' +
      '<p class="hint">' + fmtDate(s.submittedAt) + ' 交卷' + (s.autoSubmitted ? ' · 倒计时结束自动交卷' : '') + '</p></div>' +
      (s.autoSubmitted ? '<div class="notice">时间到，系统已自动交卷。没写完的部分可以下次重做。</div>' : '') +
      '<div class="score-hero">' +
      '<div class="score-main"><span class="score-num" id="result-total-score">' + round1(st.scored) + '</span>' +
      '<span class="score-max">/ ' + round1(st.max) + ' 分</span></div>' +
      '<div class="score-sub"><span>客观题 ' + round1(st.objectiveEarned) + ' / ' + round1(st.objectiveMax) + '</span>' +
      '<span>答对 ' + st.correct + ' / ' + st.objectiveTotal + ' 题</span>' +
      '<span>主观题自评 ' + round1(st.selfScore) + ' / ' + round1(st.subjectiveMax) + '</span></div>' +
      '<div class="score-ring" aria-hidden="true"><span>' + pct + '%</span></div>' +
      '</div>' +
      '<section class="result-section"><div class="result-section-head"><h3>分部分得分</h3></div>' + partRows + '</section>' +
      subjectiveHtml + wrongHtml +
      '<div class="row result-actions">' +
      '<button type="button" class="btn primary" data-result-again>再做一遍</button>' +
      '<button type="button" class="btn" data-result-wrong>去错题本</button>' +
      '<button type="button" class="btn ghost" data-result-home>返回首页</button>' +
      '</div>';
  }

  function updateResultScore() {
    const s = state.session;
    const paper = currentPaper();
    if (!s || !paper || s.submitted !== true) return;
    const st = computeStats(paper, s);
    const total = $('#result-total-score');
    if (total) total.textContent = round1(st.scored);
    const sub = $('.score-sub');
    if (sub) {
      sub.innerHTML = '<span>客观题 ' + round1(st.objectiveEarned) + ' / ' + round1(st.objectiveMax) + '</span>' +
        '<span>答对 ' + st.correct + ' / ' + st.objectiveTotal + ' 题</span>' +
        '<span>主观题自评 ' + round1(st.selfScore) + ' / ' + round1(st.subjectiveMax) + '</span>';
    }
    const ring = $('.score-ring span');
    if (ring) ring.textContent = (st.max ? Math.round(st.scored / st.max * 100) : 0) + '%';
    saveFullAttempt(paper, s);
    save();
  }

  /* ---------------- 开放接口 ---------------- */

  function enter() {
    if (!state.index) {
      $('#exam-home').hidden = false;
      loadIndex();
      if (state.session && paperCache[state.session.year]) {
        renderResume();
      }
      return;
    }
    if (state.view === 'home' || !state.paper) {
      renderHome();
      showView('home');
      return;
    }
    VIEWS.forEach(function (name) {
      const node = $('#exam-' + name);
      if (node) node.hidden = name !== state.view;
    });
    if (state.view === 'run' && state.session && !state.session.submitted) startTimer();
    if (state.view === 'result') renderResult();
    if (state.view === 'wrong') renderWrong();
  }

  function leave() {
    pauseSessionClock();
    stopTimer();
  }

  function init() {
    load();

    let navFrame = 0;
    window.addEventListener('scroll', function () {
      if (navFrame) return;
      navFrame = window.requestAnimationFrame(function () {
        navFrame = 0;
        updateNavActive();
      });
    }, { passive: true });

    $('#btn-open-wrong') && $('#btn-open-wrong').addEventListener('click', openWrong);
    $('#exam-year-grid') && $('#exam-year-grid').addEventListener('click', function (e) {
      const card = e.target.closest('.year-card');
      if (card) openYear(Number(card.dataset.year));
    });
    $$('.exam-filters .filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.filter = chip.dataset.filter;
        renderHome();
      });
    });
    $('#exam-resume') && $('#exam-resume').addEventListener('click', function (e) {
      if (e.target.closest('[data-resume]')) resumeSession();
      else if (e.target.closest('[data-abandon]')) abandonSession();
    });

    $('#exam-detail') && $('#exam-detail').addEventListener('click', function (e) {
      const back = e.target.closest('[data-back-home]');
      if (back) { renderHome(); showView('home'); scrollTop(); return; }
      if (e.target.closest('[data-start-full]')) {
        getPaper(Number(state.paper.year)).then(function () {
          const s = state.session;
          if (s && !s.submitted && s.mode === 'full' && s.year === state.paper.year) {
            resumeSession();
          } else {
            startSession('full', state.paper.year, null, []);
          }
        });
        return;
      }
      const groupBtn = e.target.closest('[data-start-group]');
      if (groupBtn) {
        const groupId = groupBtn.dataset.startGroup;
        const found = findGroup(state.paper, groupId);
        if (!found) return;
        const same = state.session && !state.session.submitted &&
          sessionKey(state.session) === sessionKey({
            mode: 'part', year: state.paper.year, partId: found.part.id, groupIds: [groupId]
          });
        if (same) resumeSession();
        else startSession('part', state.paper.year, found.part.id, [groupId]);
        return;
      }
      const partBtn = e.target.closest('[data-start-part]');
      if (partBtn) {
        const part = state.paper.parts.filter(function (p) { return p.id === partBtn.dataset.startPart; })[0];
        if (!part) return;
        const ids = part.groups.map(function (g) { return g.id; });
        const same = state.session && !state.session.submitted &&
          sessionKey(state.session) === sessionKey({ mode: 'part', year: state.paper.year, partId: part.id, groupIds: ids });
        if (same) resumeSession();
        else startSession('part', state.paper.year, part.id, ids);
      }
    });

    $('#exam-run') && $('#exam-run').addEventListener('click', function (e) {
      const opt = e.target.closest('[data-opt][data-q]');
      if (opt) {
        chooseOption(Number(opt.dataset.q), opt.dataset.opt);
        return;
      }
      const jump = e.target.closest('[data-jump]');
      if (jump) {
        const parts = jump.dataset.jump.split('-');
        scrollToQuestion(Number(parts[parts.length - 1]));
        return;
      }
      if (e.target.closest('#btn-exit-exam') || e.target.closest('#btn-exit-exam-2')) {
        exitRun();
        return;
      }
      if (e.target.closest('#btn-answer-card')) {
        openSheet();
        return;
      }
      const nav = e.target.closest('[data-nav-group]');
      if (nav) {
        scrollToSection(nav.dataset.navGroup);
        return;
      }
      const partNext = e.target.closest('[data-part-next]');
      if (partNext) {
        if (partNext.dataset.partNext) scrollToSection(partNext.dataset.partNext);
        else submitSession(false);
        return;
      }
      if (e.target.closest('#btn-submit-exam')) {
        submitSession(false);
        return;
      }
      const check = e.target.closest('[data-check-group]');
      if (check) {
        checkGroup(check.dataset.checkGroup);
        return;
      }
      const restart = e.target.closest('[data-restart-group]');
      if (restart) restartGroup(restart.dataset.restartGroup);
    });

    $('#exam-run') && $('#exam-run').addEventListener('input', function (e) {
      const area = e.target.closest('[data-text]');
      if (!area || !state.session) return;
      state.session.texts[Number(area.dataset.text)] = area.value;
      saveSoon();
      const count = $('[data-count-for="' + area.dataset.text + '"]');
      if (count) count.textContent = wordCount(area.value) + ' words';
      updateBar();
    });

    $('#exam-result') && $('#exam-result').addEventListener('click', function (e) {
      if (e.target.closest('[data-result-home]')) {
        renderHome(); showView('home'); scrollTop(); return;
      }
      if (e.target.closest('[data-result-wrong]')) { openWrong(); return; }
      if (e.target.closest('[data-result-again]')) {
        getPaper(state.session.year).then(function () {
          startSession('full', state.session.year, null, []);
        });
      }
    });

    $('#exam-result') && $('#exam-result').addEventListener('input', function (e) {
      const input = e.target.closest('[data-self]');
      if (!input || !state.session) return;
      const number = Number(input.dataset.self);
      const max = Number(input.max);
      const value = round1(clamp(input.value, 0, max));
      if (String(value) !== input.value) input.value = value;
      state.session.selfScores[number] = value;
      updateResultScore();
    });

    $('#exam-wrong') && $('#exam-wrong').addEventListener('click', function (e) {
      if (e.target.closest('[data-back-home]')) { renderHome(); showView('home'); scrollTop(); return; }
      const redo = e.target.closest('[data-wrong-redo]');
      if (redo) { redoWrong(redo.dataset.wrongRedo); return; }
      const del = e.target.closest('[data-wrong-del]');
      if (del) {
        state.wrong = state.wrong.filter(function (item) { return item.key !== del.dataset.wrongDel; });
        save();
        renderWrong();
        return;
      }
      if (e.target.closest('[data-wrong-clear]')) {
        if (!window.confirm('清空全部 ' + state.wrong.length + ' 道错题？此操作不可撤销。')) return;
        state.wrong = [];
        save();
        renderWrong();
      }
    });

    $('#btn-close-sheet') && $('#btn-close-sheet').addEventListener('click', closeSheet);
    $('#exam-sheet') && $('#exam-sheet').addEventListener('click', function (e) {
      if (e.target === this) closeSheet();
    });
    $('#sheet-grid') && $('#sheet-grid').addEventListener('click', function (e) {
      const num = e.target.closest('[data-sheet-jump]');
      if (num) jumpFromSheet(Number(num.dataset.sheetJump));
    });
    $('#btn-sheet-submit') && $('#btn-sheet-submit').addEventListener('click', function () {
      if (state.session && state.session.mode === 'full') submitSession(false);
    });
    $('#btn-sheet-exit') && $('#btn-sheet-exit').addEventListener('click', function () {
      closeSheet();
      exitRun();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('#exam-sheet') && !$('#exam-sheet').hidden) closeSheet();
    });
  }

  function findGroup(paper, groupId) {
    if (!paper) return null;
    for (let i = 0; i < paper.parts.length; i++) {
      const part = paper.parts[i];
      for (let j = 0; j < part.groups.length; j++) {
        if (part.groups[j].id === groupId) return { part: part, group: part.groups[j] };
      }
    }
    return null;
  }

  function exitRun() {
    const s = state.session;
    if (!s) { renderHome(); showView('home'); return; }
    if (!window.confirm('退出会保留这次进度，下次可以继续。要退出吗？')) return;
    updateNavActive();
    pauseSessionClock();
    stopTimer();
    save();
    renderHome();
    showView('home');
    scrollTop();
  }

  App.exam = {
    init: init,
    enter: enter,
    leave: leave
  };
})(window.App);
