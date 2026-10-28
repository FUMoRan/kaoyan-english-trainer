/* 全局配置：服务商预设、题型与评分档位、系统提示词 */
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
      model: 'moonshot-v1-8k-vision-preview',
      note: '必须是带 -vision-preview 的视觉模型，普通 moonshot-v1-8k 看不懂图片。',
      keyURL: 'https://platform.moonshot.cn/console/api-keys',
      cors: true
    },
    dashscope: {
      label: '通义千问 / 阿里百炼',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-vl-max',
      note: '有免费额度；qwen-vl-plus 更便宜，qwen-vl-max 手写识别更准。',
      keyURL: 'https://bailian.console.aliyun.com/',
      cors: true
    },
    siliconflow: {
      label: '硅基流动 SiliconFlow',
      baseURL: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen2.5-VL-72B-Instruct',
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
      model: 'glm-4v-plus',
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

  /* ---------- 题型与评分档位（按考试中心大纲档位整理） ---------- */
  const ESSAY_TYPES = {
    e1_big: {
      label: '英语一 · 大作文（图画/图表，20 分）',
      max: 20,
      words: '160–200 词',
      kind: 'big',
      bands: [
        ['第一档 17–20 分', '内容切题，完整完成任务；语言丰富准确，句式有变化，仅有个别不影响理解的小错；结构清晰，衔接自然。'],
        ['第二档 13–16 分', '内容较切题，任务完成较好；语言基本准确，有一定句式变化，存在少量错误但不影响理解。'],
        ['第三档 9–12 分', '内容基本切题，任务部分完成；词汇与句式单一，语法、搭配错误较多，部分影响理解。'],
        ['第四档 5–8 分', '内容偏离题意或明显不充分；词汇贫乏，错误较多且影响理解；多为简单句罗列，缺乏衔接。'],
        ['第五档 1–4 分', '内容空洞、跑题或严重不足；语言错误密集，难以理解。']
      ],
      paragraphs: [
        ['p1', '第一段（描述图画/图表）'],
        ['p2', '第二段（原因/分析）'],
        ['p3', '第三段（评论/建议）'],
        ['all', '全文']
      ]
    },
    e1_small: {
      label: '英语一 · 小作文（应用文，10 分）',
      max: 10,
      words: '约 100 词',
      kind: 'small',
      bands: [
        ['第一档 9–10 分', '格式规范，信息完整，语域得体；语言准确，仅有个别小错，衔接自然。'],
        ['第二档 7–8 分', '格式基本正确，信息较完整，语域基本得体；语言基本准确，存在少量错误。'],
        ['第三档 5–6 分', '格式有缺漏，信息不完整；语言错误较多，部分影响理解。'],
        ['第四档 3–4 分', '格式错误明显，遗漏主要内容；语言错误多，影响理解。'],
        ['第五档 1–2 分', '格式混乱，内容严重不足或无法理解。']
      ],
      paragraphs: [
        ['p1', '开头（称呼 + 写信目的）'],
        ['p2', '主体（具体信息）'],
        ['p3', '结尾（客套 + 落款）'],
        ['all', '全文']
      ]
    },
    e2_big: {
      label: '英语二 · 大作文（图表，15 分）',
      max: 15,
      words: '150 词以上',
      kind: 'big',
      bands: [
        ['第一档 13–15 分', '内容切题，数据描述准确完整；语言丰富准确，句式有变化；结构清晰，衔接自然。'],
        ['第二档 10–12 分', '内容较切题，数据描述较完整；语言基本准确，有少量错误。'],
        ['第三档 7–9 分', '内容基本切题，数据描述有遗漏或误读；语言单一，错误较多，部分影响理解。'],
        ['第四档 4–6 分', '内容偏离或数据描述严重不足；词汇贫乏，错误多且影响理解。'],
        ['第五档 1–3 分', '内容空洞或跑题；语言错误密集，难以理解。']
      ],
      paragraphs: [
        ['p1', '第一段（描述图表数据）'],
        ['p2', '第二段（分析原因）'],
        ['p3', '第三段（评论/趋势判断）'],
        ['all', '全文']
      ]
    },
    e2_small: {
      label: '英语二 · 小作文（应用文，10 分）',
      max: 10,
      words: '约 100 词',
      kind: 'small',
      bands: [
        ['第一档 9–10 分', '格式规范，信息完整，语域得体；语言准确，仅有个别小错，衔接自然。'],
        ['第二档 7–8 分', '格式基本正确，信息较完整，语域基本得体；语言基本准确，存在少量错误。'],
        ['第三档 5–6 分', '格式有缺漏，信息不完整；语言错误较多，部分影响理解。'],
        ['第四档 3–4 分', '格式错误明显，遗漏主要内容；语言错误多，影响理解。'],
        ['第五档 1–2 分', '格式混乱，内容严重不足或无法理解。']
      ],
      paragraphs: [
        ['p1', '开头（称呼 + 写信目的）'],
        ['p2', '主体（具体信息）'],
        ['p3', '结尾（客套 + 落款）'],
        ['all', '全文']
      ]
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

  function rewriteMessages(text, type) {
    const isAuto = type === 'auto';
    const rules = [
      '你是考研英语写作教练，帮学生把平铺直叙的表达改成阅卷人愿意给分的写法。',
      '不要改变原意，不要堆砌辞藻，不要写成模板腔。'
    ];

    if (isAuto) {
      rules.push(
        '先替学生挑手法。可选方向：强调句、倒装、非限制性定语从句、分词短语、同位语、名词化、抽象名词作主语、比较结构、平行结构、因果递进衔接。',
        '只挑一个主手法，不要叠加；如果原句本身已经干净，硬改反而扣分，就直接说「这句不建议魔改」，再给一版轻微润色。',
        '严格按下面五个小标题输出，标题文字一字不改：',
        '## 一、推荐手法',
        '## 二、高级英文',
        '## 三、中文翻译',
        '## 四、结构简析',
        '## 五、适用提醒',
        '「推荐手法」先写手法名，再用 30–60 字说明为什么这句适合它，要结合语义或逻辑关系，不要泛泛而谈。'
      );
    } else {
      rules.push(
        '本次指定手法：' + type + '。',
        '先判断这个手法是否适合该句语义。不适合就直接说明原因，再给出一种更合适的写法，不要硬凑。',
        '严格按下面四个小标题输出，标题文字一字不改：',
        '## 一、高级英文',
        '## 二、中文翻译',
        '## 三、结构简析',
        '## 四、适用提醒'
      );
    }

    rules.push(
      '「高级英文」只给一句，不要给多个版本，也不要加例句。',
      '「结构简析」30–80 字，说明句子成分如何重组；原句若有语法或搭配问题，先指出再讲结构。',
      '「适用提醒」说明这句适合大作文还是小作文、什么题材，以及阅卷人可能怎么看，不要鼓励堆模板。'
    );

    return [{ role: 'system', content: rules.join('\n') }, { role: 'user', content: text }];
  }

  function ocrMessages(dataURL) {
    return [{
      role: 'system',
      content: [
        '你是一位只做转录的助手。任务：把图片中学生手写的英文原样转成文本。',
        '只转录，不批改、不润色、不补全、不翻译。',
        '学生写错的拼写和语法必须原样保留，不要替他改。',
        '看不清的单词写成 [?]，不要猜；连续看不清用一行 [?]。',
        '保留原有的分段和换行。',
        '不要输出任何解释、标题或评语。',
        '如果图片里没有可辨认的英文，只输出：NO_TEXT'
      ].join('\n')
    }, {
      role: 'user',
      content: [
        { type: 'text', text: '请转录这张图片中的手写英文。' },
        { type: 'image_url', image_url: { url: dataURL } }
      ]
    }];
  }

  function gradingMessages(essay, paragraphText) {
    const type = ESSAY_TYPES[essay.typeKey];
    const bandText = type.bands.map(function (b) { return BULLET + b[0] + '：' + b[1]; }).join('\n');
    const samples = App.calibration.select(type.kind, essay.typeKey);
    const paraLabel = (type.paragraphs.find(function (p) { return p[0] === essay.para; }) || ['all', '全文'])[1];

    const head = [
      '你是考研英语阅卷组组长，按教育部考试中心大纲的评分档位批改中国学生的作文。',
      '',
      '【本次设定】',
      '题型：' + type.label + '，满分 ' + type.max + ' 分，建议长度 ' + type.words + '。',
      '批改范围：' + paraLabel + '。',
      essay.topic ? '题目/图画信息（学生提供）：' + essay.topic : '题目/图画信息：学生未提供，判分时按「缺少题干，估分保守」处理。',
      '',
      '【评分档位（必须严格使用，不得自创档位）】',
      bandText,
      '档内具体分：在所选档位区间内取整数，并说明为什么落在该档的上沿或下沿。',
      '',
      '【评分标尺样本（校准宽严度用，不是官方单篇得分）】',
      samples,
      '请按上面的宽严度打分，不要一律给中间分。',
      '',
      '【硬性规则】',
      '1. 若批改范围不是全文：先说明该段在整篇中的功能，再给该段的质量档位，最后给整篇预估分区间，并注明「基于单段的估算」。',
      '2. 所有错误必须能在给定文本里找到原句，不得虚构；疑似手写识别导致的错误标【疑似识别】，并提醒学生核对。',
      '3. 禁止空泛表扬（如「语言流畅」「内容充实」）。每条建议都要给出可直接替换的写法。',
      '4. 学生原文里已经正确、且符合档位要求的表达不要改写。',
      '5. 不评判字迹与卷面美观，只评判语言与任务完成度。',
      '',
      '【输出格式】严格使用以下小标题，顺序不变，不增删：',
      '## 一、档位与分数',
      '## 二、硬伤清单',
      '## 三、中式英语与表达',
      '## 四、可升级句',
      '## 五、下一步练习',
      '',
      '「一、档位与分数」：档位 + 具体分/满分 + 三句以内的判分依据。',
      '「二、硬伤清单」：Markdown 表格，列为 原文 | 改为 | 类型 | 说明；没有明显硬伤就写「未发现明显硬伤」。',
      '「三、中式英语与表达」：最多 3 条，给出原文与更地道的说法。',
      '「四、可升级句」：表格，列为 原句 | 升级句 | 手法；最多 3 条，必须贴合该段在整篇中的功能。',
      '「五、下一步练习」：2 条今天就能做的动作，针对本次暴露的问题。'
    ].join('\n');

    return [
      { role: 'system', content: head },
      { role: 'user', content: '以下是我要批改的内容（已由我确认识别无误）：\n\n' + paragraphText }
    ];
  }

  const BULLET = '· ';

  App.config = {
    PROVIDERS: PROVIDERS,
    ESSAY_TYPES: ESSAY_TYPES,
    sentenceMessages: sentenceMessages,
    rewriteMessages: rewriteMessages,
    ocrMessages: ocrMessages,
    gradingMessages: gradingMessages
  };
})(window.App);
