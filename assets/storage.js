/* 本机配置存取（仅 localStorage，不上传） */
window.App = window.App || {};

(function (App) {
  'use strict';

  const KEY = 'kaoyan-trainer-settings-v1';

  function defaults() {
    const p = App.config.PROVIDERS.moonshot;
    return {
      provider: 'moonshot',
      baseURL: p.baseURL,
      model: p.model,
      apiKey: '',
      stream: true,
      essayType: 'e1_big',
      essayPara: 'all'
    };
  }

  function getSettings() {
    const base = defaults();
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Object.assign(base, raw && typeof raw === 'object' ? raw : {});
    } catch (e) {
      return base;
    }
  }

  function saveSettings(patch) {
    const next = Object.assign(getSettings(), patch);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      /* 隐私模式写入失败时仍然返回内存值 */
    }
    return next;
  }

  function hasKey() {
    return !!String(getSettings().apiKey || '').trim();
  }

  App.store = { getSettings: getSettings, saveSettings: saveSettings, hasKey: hasKey };
})(window.App);
