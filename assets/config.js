/* 全局配置：服务商预设与提示词 */
window.App = window.App || {};

(function (App) {
  'use strict';

  /* ---------- 服务商预设 ----------
     跨域结论来自对 OPTIONS 预检的实际测试：
     Moonshot / 阿里百炼 / 硅基流动 / OpenRouter 返回了 access-control-allow-origin，可从 GitHub Pages 直连；
     智谱未返回跨域头，必须走自建代理。
     模型名会随厂商更新，设置里可以随时改。 */
  const PROVIDERS = {
    moonshot: {
      label: 'Kimi / Moonshot',
      baseURL: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k',
      note: '长句拆解与填空判定用普通文本模型即可，不需要视觉模型。',
      keyURL: 'https://platform.moonshot.cn/console/api-keys',
      cors: true
    },
    dashscope: {
      label: '通义千问 / 阿里百炼',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      note: '有免费额度；qwen-plus 性价比高，qwen-max 判定更细。',
      keyURL: 'https://bailian.console.aliyun.com/',
      cors: true
    },
    siliconflow: {
      label: '硅基流动 SiliconFlow',
      baseURL: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen2.5-72B-Instruct',
      note: '国内访问稳定、价格低，注册送额度；模型名区分大小写。',
      keyURL: 'https://cloud.siliconflow.cn/account/ak',
      cors: true
    },
    openrouter: {
      label: 'OpenRouter（需外网）',
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'google/gemini-2.5-flash',
      note: '模型多、有免费额度，但需要能访问外网。',
      keyURL: 'https://openrouter.ai/keys',
      cors: true
    },
    zhipu: {
      label: '智谱 GLM（需代理）',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-plus',
      note: '该接口没有开放浏览器跨域，需先部署仓库里 proxy/worker.js，再把它填到 Base URL。',
      keyURL: 'https://bigmodel.cn/usercenter/apikeys',
      cors: false
    },
    custom: {
      label: '自定义（OpenAI 兼容）',
      baseURL: '',
      model: '',
      note: '任何 OpenAI 兼容接口，Base URL 填到 /v1 为止，模型名照抄服务商文档。',
      keyURL: '',
      cors: null
    }
  };

  /* ---------- 提示词 ---------- */

  function sentenceMessages(sentence) {
    return [{
      role: 'system',
      content: [
        '你是考研英语长难句辅导老师，讲给基础一般、目标 70+ 的学生。只分析给定的这一句，不要扩展额外例句。',
        '严格按下面四个小标题输出，标题文字一字不改：',
        '## 一、绝对主干',
        '## 二、修饰成分',
        '## 三、地道翻译',
        '## 四、语法点睛',
        '「绝对主干」只保留去掉全部修饰后的最小主谓宾，用 / 标出层级。',
        '「修饰成分」用表格逐项列出：原文片段 | 类型（定语从句/状语/插入语等）| 修饰谁。',
        '「地道翻译」给一版通顺中文，不要逐词硬译；有歧义时另起一行说明。',
        '「语法点睛」只讲 1–2 个最值得记的点，60 字以内，不要罗列所有语法。',
        '全文控制在 350 字以内，不要寒暄，不要重复原句。'
      ].join('\n')
    }, { role: 'user', content: sentence }];
  }

  /* 把模板里的 ①②③ 换成 [1] [2]，避免模型回显圆圈编号 */
  function numberedText(template) {
    const circle = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
    return template.paragraphs.map(function (p) {
      return String(p).replace(/[①-⑳]/g, function (ch) {
        return '[' + (circle.indexOf(ch) + 1) + ']';
      });
    }).join('\n\n');
  }

  function blankGuide(template) {
    return template.blanks.map(function (b) {
      return b.no + '. ' + b.hint + (b.sample ? '（示例：' + b.sample + '）' : '');
    }).join('\n');
  }

  function answerSheet(answers) {
    return answers.map(function (a) {
      const value = String(a.value || '').trim();
      return a.no + '. ' + (value || '（未填）');
    }).join('\n');
  }

  function templateMessages(info) {
    const template = info.template;
    const total = template.blanks.length;
    const isSmall = String(template.kind || '').indexOf('小作文') === 0;

    const system = [
      '你是考研英语' + (isSmall ? '小作文' : '大作文') + '的填空判卷人。学生按给定的' +
        (isSmall ? '小作文模板（书信 / 通知 / 纪要）' : '三段模板') + '逐空填写，你只判空，不重写模板。',
      '',
      '【判定标准】宽容，但守住语法与槽位底线。',
      '每个空按三件事判：',
      '1. 槽位对位：填进去的内容是否符合该空在句中的语法角色（名词短语 / 完整分句 / 动词原形 / 介词短语 / 过去分词等）。词性或句式冲突直接判错。',
      '2. 语法正确：主谓一致、时态、单复数、冠词、介词与动词搭配、拼写。语法错就是错。',
      '3. 语境一致：与题目主题和上下文能否读通；同一个空在全篇多处出现时视为同一内容，学生只填一次不算漏填。',
      '判「通过」的情形（从宽）：',
      '- 意思正确、语法可接受就算通过，不要求和示例答案一致；同义、近义、换一种合理说法都算对。',
      '- 表达略不地道但没有语法错，判通过，最多附一句优化建议，不得因此判错。',
      '- 泛指语境下可数名词单复数两可、英式与美式拼写不同、数据写法不同（如 25.4% 与 25.40%），都算对。',
      '- 学生词数比示例多或少，只要句子读得通就算通过。',
      '判「需改」的情形：',
      '- 空着没填；写中文、拼音或汉语提示里的汉字。',
      '- 词性或句式与槽位冲突（如要求完整分句只给了名词短语；要求动词原形写成 to do 或 doing；要求名词短语写成句子）。',
      '- 明确的语法错误：主谓不一致、时态错、单复数与限定词冲突、搭配错、拼写错。',
      '- 与主题无关，导致句子读不通。',
      '',
      '【输出格式】严格四节，标题文字与顺序不许改，不要增加别的章节。',
      '## 一、逐空判定',
      '从 1 到 ' + total + ' 逐空列出，一行一空，格式严格为：',
      '`1 ✅ 通过 — 一句理由`',
      '`3 ❌ 需改 — 原因；改为：可替换的英文`',
      '编号必须用阿拉伯数字，不要用 ①②③，不要用表格，不要合并同类空。',
      '## 二、必须改的空',
      '只列 ❌ 的编号，按对整篇的影响从大到小排序，一行一处：`3：你填的 "…" → 建议 "…"`。一处都没有就写：全部通过。',
      '## 三、誊写版',
      '把学生答案填回模板，输出完整' + (isSmall ? '小作文（保留称呼、标题、时间地点与落款）' : '三段英文') +
        '：通过的空照用学生原词，❌ 的空用你给出的修改；每处修改后在句末标 [改:编号]。',
      '不要改动模板的其他措辞，不要增删句子，不要换成你自己的句式。',
      '## 四、错空记录',
      '只输出一行：`错空 3,7,12 | 共 ' + total + ' 空`。全部通过写 `错空 无 | 共 ' + total + ' 空`。',
      '',
      '【硬性要求】',
      '- 只判空，不改写模板句式；不评价字迹、不估算考试分数。',
      '- 不得虚构学生没填的内容；没填的空一律 ❌。',
      '- 引用学生答案时必须逐字复制，不要替学生改拼写后再引用。',
      '- 全文 700 字以内，不寒暄，不重复模板原文。'
    ].join('\n');

    const user = [
      '【模板】' + template.no + '　' + template.kind + ' · ' + template.title,
      '【适用条件】' + template.use,
      info.topic ? '【本次练习题目】\n' + info.topic : '【本次练习题目】学生未指定，按通用主题判断即可。',
      '',
      '【模板全文】（方括号里的数字是空位编号）',
      numberedText(template),
      '',
      '【空位说明】（第 1 段是汉语提示，括号里是英文示例，仅用于理解槽位，学生不必照抄）',
      blankGuide(template),
      '',
      '【学生填写】',
      answerSheet(info.answers)
    ].join('\n');

    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  App.config = {
    PROVIDERS: PROVIDERS,
    sentenceMessages: sentenceMessages,
    templateMessages: templateMessages
  };
})(window.App);
