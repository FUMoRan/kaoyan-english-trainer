/* AI 归来 · 大作文句库（数据来源：用户提供的《27 考研英语大作文模板》PDF）
   句子里的 {占位名} 由 app 统一换成空位；同名占位全文只填一次。
   slot = { id, para, name, hint, optional, options: [{ id, name, en, zh, note }] } */

window.App = window.App || {};

(function (App) {
  'use strict';

  const TYPES = [
    {
      id: 'chart',
      label: '图表作文',
      desc: '表格、柱状图、折线图、饼图',
      scenes: ['chart-dyn-one', 'chart-dyn-multi', 'chart-static', 'chart-double', 'chart-universal']
    },
    {
      id: 'picture',
      label: '图画作文',
      desc: '单图、双图、一图一表',
      scenes: ['picture']
    },
    {
      id: 'text',
      label: '文字作文',
      desc: '大纲样题：文字改写 + 表明态度',
      scenes: ['text']
    }
  ];

  /* ---------- 通用：社会现象句 ---------- */

  const PHENOMENON = [
    {
      id: 'ph-1',
      name: '统计 + 持续变好',
      en: 'It is apparent from the statistics that {主题词} has been improving rapidly in recent years.',
      zh: '从统计数据可明显看出，主题词近年来迅速提高。',
      note: '主题词是实体（行业/品牌）时，improving 改为 developing。'
    },
    {
      id: 'ph-2',
      name: '结论 + 越来越多的人',
      en: 'These data lead us to the conclusion that an increasing number of {人群} tend to {行为}.',
      zh: '这些数据使我们得出结论：越来越多的人倾向于做某事。',
      note: '人群要具体：residents / undergraduates / parents / consumers。'
    },
    {
      id: 'ph-3',
      name: '统计 + 变得普遍',
      en: 'It is apparent from the statistics that {主题词} is becoming common among {人群}.',
      zh: '从统计数据可以明显看出，主题词在某人群体中正变得常见。'
    },
    {
      id: 'ph-4',
      name: '统计 + 受到关注',
      en: 'It is apparent from the statistics that {主题词} has drawn growing attention from the public.',
      zh: '从统计数据可以明显看出，主题词日益受到公众关注。',
      note: '态度型图表优先用这一句。'
    },
    {
      id: 'ph-5',
      name: '万能现象句',
      en: 'This is a common phenomenon in modern society.',
      zh: '在当今社会，这是一个很常见的现象。',
      note: '不需要再补充内容，时间紧时用。'
    },
    {
      id: 'ph-6',
      name: '图表传达 + 自写从句',
      en: 'The chart clearly communicates its intended meaning: {社会现象}.',
      zh: '这幅图清楚地传达了它的意图：某事正在发生。',
      note: '冒号后要写一个完整从句（谁怎么样）。'
    }
  ];

  /* ---------- 图表：动态图 ---------- */

  const CHART_DYN_ONE = {
    id: 'chart-dyn-one',
    type: 'chart',
    label: '动态图 · 单方向',
    feature: '一条折线或一组柱子，有年份，持续上升或下降',
    example: '2023 英二 · 居民健康素养（8.8% → 25.4%）',
    hint: '总体描述说清上升/下降，细节句必须带具体数值。趋势向下时把 rose 换成 declined、rise 换成 decline。',
    slots: [
      {
        id: 'c11',
        para: 1,
        name: '总体描述',
        hint: '一句话概括标题、时间与趋势。',
        options: [
          {
            id: 'a',
            name: 'Which 从句',
            en: 'The chart above illustrates the changes in {主题词} from {年份1} to {年份2}, during which it rose steadily.',
            zh: '上图展示了年份 1 至年份 2 间主题词的变化，其在这一时期稳步上升。'
          },
          {
            id: 'b',
            name: '趋势作宾语',
            en: '{主题词} saw a steady rise from {年份1} to {年份2}, as illustrated in the chart.',
            zh: '如该图表所示，主题词在年份 1 至年份 2 间稳步上升。',
            note: '主题词是数据（水平/率/数量）时，改用：The period from 年份1 to 年份2 saw a steady rise in 主题词。'
          },
          {
            id: 'c',
            name: '状语式',
            en: 'According to the data given in the chart, the number of {主题词} climbed steadily from {年份1} to {年份2}.',
            zh: '根据图中数据，主题词的数量在年份 1 至年份 2 间稳步攀升。',
            note: 'the number of 可换成 the level / rate / proportion of。'
          }
        ]
      },
      {
        id: 'c12',
        para: 1,
        name: '细节描述',
        hint: '用具体数据证明趋势。',
        options: [
          {
            id: 'a',
            name: '公式 1：起止数据',
            en: 'To be specific, {主题词} increased gradually from {数据1} in {年份1} to {数据2} in {年份2}.',
            zh: '具体而言，主题词从年份 1 的数据 1 逐渐增长到年份 2 的数据 2。'
          },
          {
            id: 'b',
            name: '公式 2：前后对比 + 增量',
            en: 'Specifically, {主题词} stood at {数据1} in {年份1}, compared with {数据2} in {年份2}, showing an increase of {增量}.',
            zh: '具体而言，主题词在年份 1 为数据 1，年份 2 为数据 2，增长了若干。'
          },
          {
            id: 'c',
            name: '公式 3：倍数',
            en: 'Specifically, {主题词} in {年份2} was nearly {倍数} that in {年份1}.',
            zh: '具体而言，年份 2 的主题词几乎是年份 1 的若干倍。',
            note: '2 倍写 twice，3 倍写 three times。'
          },
          {
            id: 'd',
            name: '两阶段上升',
            en: 'To be specific, {主题词} rose gradually from {数据1} in {年份1} to {数据2} in {年份2}. In the following years, it climbed remarkably to {数据3}.',
            zh: '具体而言，主题词先从数据 1 升到数据 2，随后几年又显著攀升到数据 3。'
          }
        ]
      },
      { id: 'c13', para: 1, name: '社会现象', hint: '从数据看现象。', options: PHENOMENON }
    ]
  };

  const CHART_DYN_MULTI = {
    id: 'chart-dyn-multi',
    type: 'chart',
    label: '动态图 · 多方向',
    feature: '多个变量，有升有降，走向不一致',
    example: '2019 英二 · 毕业生选择（就业降、深造升、创业微升）',
    hint: '总体描述只挑对比最鲜明的两个变量，第三个留给细节句。',
    slots: [
      {
        id: 'c21',
        para: 1,
        name: '总体描述',
        hint: '一句话概括多个变量的分化趋势。',
        options: [
          {
            id: 'a',
            name: 'Among which 从句',
            en: 'The chart above illustrates the changes in {主题词} from {年份1} to {年份2}, among which the rise in {单项} was the most striking.',
            zh: '上图展示了年份 1 至年份 2 间主题词的变化，其中单项的上升最为显著。'
          },
          {
            id: 'b',
            name: '分化趋势 + with',
            en: '{主题词} experienced divergent trends from {年份1} to {年份2}, with {单项} rising most sharply.',
            zh: '主题词在年份 1 至年份 2 间经历了分化趋势，其中单项上升最剧烈。'
          },
          {
            id: 'c',
            name: '相反方向 + 对比',
            en: 'As reflected in the chart, {主题词} moved in opposite directions from {年份1} to {年份2}, {单项} rising while {另一单项} falling.',
            zh: '如图中数据所示，主题词在年份 1 至年份 2 间朝不同方向变化，单项上升而另一单项下降。'
          }
        ]
      },
      {
        id: 'c22',
        para: 1,
        name: '细节描述',
        hint: '至少给出两组对比数据。',
        options: [
          {
            id: 'a',
            name: '一升一降',
            en: 'To be specific, the proportion of {单项} climbed significantly from {数据1} to {数据2}. However, that of {另一单项} fell remarkably from {数据3} to {数据4}.',
            zh: '具体而言，单项比例从数据 1 显著升至数据 2；而另一单项则从数据 3 大幅降至数据 4。'
          },
          {
            id: 'b',
            name: '同期对比',
            en: 'Specifically, {单项} rose from {数据1} in {年份1} to {数据2} in {年份2}, while {另一单项} declined from {数据3} to {数据4} during the same period.',
            zh: '具体而言，单项从数据 1 升至数据 2，而另一单项同期从数据 3 降到数据 4。'
          },
          {
            id: 'c',
            name: '三项并列',
            en: 'Specifically, {单项} rose from {数据1} to {数据2}, {另一单项} fell from {数据3} to {数据4}, and the remaining items changed only slightly.',
            zh: '具体而言，单项从数据 1 升到数据 2，另一单项从数据 3 降到数据 4，其余项目变化不大。'
          }
        ]
      },
      { id: 'c23', para: 1, name: '社会现象', hint: '从分化趋势看社会现象。', options: PHENOMENON }
    ]
  };

  const CHART_STATIC = {
    id: 'chart-static',
    type: 'chart',
    label: '静态图 · 占比 / 格局',
    feature: '同一年份的占比、排序，没有时间趋势',
    example: '2024 英二 · 劳动实践课收获（91.3% 等四项）',
    hint: '全篇不出现 from...to...，只写占比与排序。记住 3D：distribution 分布 / dominance 主导 / disparity 差距。',
    slots: [
      {
        id: 'c31',
        para: 1,
        name: '总体描述',
        hint: '一句话概括分布格局。',
        options: [
          {
            id: 'a',
            name: 'Distribution + with',
            en: 'The bar chart above presents the distribution of {主题词} in {年份1}, with {主题词1} accounting for the largest share.',
            zh: '上图呈现了年份 1 主题词的分布，其中项目 1 占比最高。'
          },
          {
            id: 'b',
            name: 'Dominance + with',
            en: 'The pie chart above highlights the dominance of {主题词1} in {主题词}, with it overshadowing all other components.',
            zh: '上图突出了项目 1 在主题词中的主导地位，其远超其他各项。',
            note: '只在第一名断崖式领先时使用。'
          },
          {
            id: 'c',
            name: 'Disparity + with',
            en: 'The chart above reveals a striking disparity in {主题词}, with the proportions ranging from {数据1} to {数据2}.',
            zh: '上图揭示了主题词中显著的差距，各项占比从数据 1 到数据 2 不等。'
          }
        ]
      },
      {
        id: 'c32',
        para: 1,
        name: '细节描述',
        hint: '列出前三到四项及其占比。',
        options: [
          {
            id: 'a',
            name: '四项占比 + 前二排序',
            en: 'To be specific, the percentages of {主题词1}, {主题词2}, {主题词3} and {主题词4} account for {数据1}, {数据2}, {数据3} and {数据4} respectively. Notably, {主题词1} tops the list, at {数据1}, followed by {主题词2} at {数据2}.',
            zh: '具体而言，四项占比分别为数据 1 至数据 4。值得注意的是，项目 1 居首，项目 2 次之。',
            note: '项目多于四项时，第四项写成 and other items。'
          },
          {
            id: 'b',
            name: '前三排序',
            en: 'Specifically, {主题词1} ranks first at {数据1}, followed by {主题词2} at {数据2}, while {主题词3} accounts for only {数据3}.',
            zh: '具体而言，项目 1 以数据 1 居首，项目 2 次之，项目 3 仅占数据 3。'
          },
          {
            id: 'c',
            name: '同一年份倍数对比',
            en: 'Specifically, the proportion of {主题词1} in {年份1} was about {倍数} that of {主题词2}.',
            zh: '具体而言，年份 1 项目 1 的占比约为项目 2 的若干倍。'
          }
        ]
      },
      { id: 'c33', para: 1, name: '社会现象', hint: '从占比格局看现象。', options: PHENOMENON }
    ]
  };

  const CHART_DOUBLE = {
    id: 'chart-double',
    type: 'chart',
    label: '双图表',
    feature: '左右两幅图并列（静静 / 动静 / 动动）',
    example: '2026 英一 · 养老机器人（接受度 + 担忧）',
    hint: '双图只换两幅图各自的主题词和数据，骨架不变。',
    slots: [
      {
        id: 'c41',
        para: 1,
        name: '总体描述',
        hint: '一句话说清左右两幅图各画了什么。',
        options: [
          {
            id: 'a',
            name: 'While 并列',
            en: 'The chart on the left illustrates {左图主题}, while the chart on the right presents {右图主题}.',
            zh: '左侧图展示了左图主题，而右侧图呈现了右图主题。'
          },
          {
            id: 'b',
            name: 'As for 另起一句',
            en: 'The pie chart above presents {左图主题}. As for the chart on the right, it shows {右图主题}.',
            zh: '上图呈现了左图主题。至于右图，它展示了右图主题。'
          },
          {
            id: 'c',
            name: '总分结构',
            en: 'The two charts present {总主题}: the pie chart shows {左图主题}, while the bar chart on the right lists {右图主题}.',
            zh: '两幅图呈现了总主题：饼图显示左图主题，右侧柱状图列出右图主题。'
          }
        ]
      },
      {
        id: 'c42',
        para: 1,
        name: '细节描述',
        hint: '两幅图各给一组数据。',
        options: [
          {
            id: 'a',
            name: '左图占比 + 右图首位',
            en: 'To be specific, the proportions of {主题词1}, {主题词2} and {主题词3} stand at {数据1}, {数据2} and {数据3} respectively. Meanwhile, {单项} tops the list of concerns at {数据4}.',
            zh: '具体而言，左图三项占比分别为数据 1 至数据 3；右图中单项以数据 4 居首。'
          },
          {
            id: 'b',
            name: '排序 + 首位',
            en: 'Specifically, {主题词1} accounts for {数据1}, followed by {主题词2} at {数据2}, while {单项} ranks first among the concerns at {数据3}.',
            zh: '具体而言，项目 1 占数据 1，项目 2 次之，而单项在担忧中居首，为数据 3。',
            note: '动静结合时，把左图写成 from 数据1 to 数据2 的变化句。'
          }
        ]
      },
      { id: 'c43', para: 1, name: '社会现象', hint: '从两幅图共同看现象。', options: PHENOMENON }
    ]
  };

  const CHART_UNIVERSAL = {
    id: 'chart-universal',
    type: 'chart',
    label: '万能图表',
    feature: '看不懂、没把握、时间紧时的保底写法',
    example: '2025 英一 · 耐用消费品拥有量',
    hint: '万能场景只求稳：有变化用 1–3，有占比用 4–6。',
    slots: [
      {
        id: 'c51',
        para: 1,
        name: '总体描述',
        hint: '选一句最贴合的，不必纠结。',
        options: [
          {
            id: 'a',
            name: '变化 · 万能 1',
            en: 'Some remarkable changes in {主题词} have taken place in the past few years.',
            zh: '过去几年中，主题词发生了一些显著变化。'
          },
          {
            id: 'b',
            name: '变化 · 万能 2',
            en: 'The chart above shows the variation in {主题词} from {年份1} to {年份2}.',
            zh: '上图展示了年份 1 至年份 2 间主题词的变化。'
          },
          {
            id: 'c',
            name: '变化 · 万能 3',
            en: 'The proportions of {主题词} had visible changes during the period from {年份1} to {年份2}.',
            zh: '主题词的占比在年份 1 至年份 2 间发生明显变化。'
          },
          {
            id: 'd',
            name: '占比 · 万能 1',
            en: 'The chart shows the distribution of {主题词} at a glance, revealing a striking disparity among the options.',
            zh: '该图一目了然地展示了主题词的分布，揭示了各项之间的巨大差异。'
          },
          {
            id: 'e',
            name: '占比 · 万能 2',
            en: 'The chart above presents {主题词}, offering a clear picture of the overall situation.',
            zh: '上图呈现了主题词，清晰展示了整体情况。'
          },
          {
            id: 'f',
            name: '信息 · 万能 3',
            en: 'The chart above provides information about {主题词} from {年份1} to {年份2}.',
            zh: '上图提供了年份 1 至年份 2 间关于主题词的信息。'
          }
        ]
      },
      {
        id: 'c52',
        para: 1,
        name: '细节描述',
        hint: '至少写一个具体数据。',
        options: [
          {
            id: 'a',
            name: '变化数据',
            en: 'To be specific, {主题词} rose from {数据1} in {年份1} to {数据2} in {年份2}.',
            zh: '具体而言，主题词从年份 1 的数据 1 升到年份 2 的数据 2。'
          },
          {
            id: 'b',
            name: '占比数据',
            en: 'Specifically, the proportions of {主题词1}, {主题词2} and {主题词3} stand at {数据1}, {数据2} and {数据3} respectively.',
            zh: '具体而言，三项占比分别为数据 1 至数据 3。'
          },
          {
            id: 'c',
            name: '持平数据',
            en: 'Specifically, the figure remained stable at about {数据1} throughout the period.',
            zh: '具体而言，该数据在整个时期内基本保持在数据 1 左右。'
          }
        ]
      },
      { id: 'c53', para: 1, name: '社会现象', hint: '选一句最稳的现象句。', options: PHENOMENON }
    ]
  };

  /* ---------- 图画第一段 ---------- */

  const PICTURE = {
    id: 'picture',
    type: 'picture',
    label: '图画作文',
    feature: '单图 / 对话图 / 双图 / 一图一表',
    example: '2023 英一 · 龙舟；2022 英一 · 听讲座；2020 英一 · 习惯',
    hint: '图画描述 = 环境 + 基本动作 + 主体 + 主要动作 + 细节；细节想不起来可以不写。',
    slots: [
      {
        id: 'p11',
        para: 1,
        name: '图画描述',
        hint: '按「分类、拆分、组合」写清谁在做什么。',
        options: [
          {
            id: 'a',
            name: '单图公式',
            en: 'As is symbolically depicted in the picture above, {主体} {基本动作} {环境}, {主要动作}, with {细节}.',
            zh: '如图所示，主体在某环境中做基本动作，同时做主要动作，带着某细节。'
          },
          {
            id: 'b',
            name: '单图 + 形容词',
            en: 'As is symbolically depicted in the picture above, {主体}, {形容词1} as well as {形容词2}, {主要动作}, with {细节}.',
            zh: '如图所示，主体既形容词 1 又形容词 2，正在做主要动作，带着某细节。',
            note: '形容词要成对：active as well as vigorous / confident as well as optimistic。'
          },
          {
            id: 'c',
            name: '对话型',
            en: 'As is symbolically depicted in the picture above, {主体} {基本动作} {环境}, {主要动作}. One argues that {左图观点}. By contrast, the other maintains that {右图观点}.',
            zh: '如图所示，主体在某环境做基本动作并谈论某事。一人认为左图观点，另一人则认为右图观点。',
            note: '推荐转述，不要逐字翻译对话。'
          },
          {
            id: 'd',
            name: '两幅图',
            en: 'The cartoons provide us with a thought-provoking scene: {左图主体} {左图动作}. However, {右图主体} {右图动作}.',
            zh: '漫画呈现了一个发人深省的场景：左图主体在做某事，而右图主体在做另一件事。'
          },
          {
            id: 'e',
            name: '一图一表',
            en: 'As is vividly depicted in the cartoon and clearly shown in the chart above, {图画描述}, and {图表描述}.',
            zh: '正如漫画和图表所示，图画描述，并且图表描述。'
          },
          {
            id: 'f',
            name: 'There be 例外',
            en: 'The cartoon provides us with a socially symbolic scene: there are {多个元素} in {场景}, such as {元素1}, {元素2} and {元素3}.',
            zh: '漫画呈现了一个具有象征意义的场景：场景中有多个元素，例如元素 1、元素 2 和元素 3。',
            note: '元素太多、没有明显人物动作时用。'
          }
        ]
      },
      {
        id: 'p12',
        para: 1,
        name: '主题阐述',
        hint: '透过图画看寓意：某事很重要。',
        options: [
          {
            id: 'a',
            name: '如此重要以至于',
            en: 'The purpose of the drawing is to remind {对象} that {主题词} is so indispensable that the subject deserves the highest level of attention and consideration.',
            zh: '这幅图旨在提醒对象：主题词不可或缺，值得最高程度的关注与考虑。'
          },
          {
            id: 'b',
            name: '给予高度重视',
            en: 'Simple as the drawing is, it conveys a truth that the utmost importance ought to be attached to {主题词} by {对象}.',
            zh: '图画虽然简单，却传达了一个道理：对象应当高度重视主题词。'
          },
          {
            id: 'c',
            name: '放在首位',
            en: 'Simple as the drawing is, it conveys a truth that {对象} should give the highest priority to {主题词}.',
            zh: '图画虽然简单，却传达了一个道理：对象应当把主题词放在首位。'
          },
          {
            id: 'd',
            name: '取得重大成就',
            en: 'Without a doubt, the drawing emphasizes the truth that great accomplishments have been made in {主题词} by {对象}.',
            zh: '毫无疑问，图画强调了一个事实：对象在主题词方面取得了巨大成就。',
            note: '适用于「已经受到重视」的题目，如公园建设。'
          },
          {
            id: 'e',
            name: '双重否定',
            en: 'The drawing conveys a clear message: at no time should {对象} underestimate the significance of {主题词}.',
            zh: '这幅图传达了一个明确信息：对象任何时候都不应低估主题词的重要性。'
          },
          {
            id: 'f',
            name: '强调句型',
            en: 'The drawing, undoubtedly, highlights the core idea that it is {主题词} that deserves greater attention.',
            zh: '毫无疑问，图画强调了这一核心观点：主题词值得更多关注。'
          }
        ]
      }
    ]
  };

  /* ---------- 文字第一段 ---------- */

  const TEXT = {
    id: 'text',
    type: 'text',
    label: '文字作文',
    feature: '大纲样题：一段英文节选，要求评论作者观点',
    example: '大纲样题 · 诚信与坦诚；儿童与屏幕',
    hint: '不会改写原文时，用「引出主题 + 改写观点 + 表明态度」三句保底。',
    slots: [
      {
        id: 't11',
        para: 1,
        name: '引出主题',
        hint: '概括文字讨论的话题。',
        options: [
          {
            id: 'a',
            name: '不可否认',
            en: 'It cannot be denied that {主题词} plays a key role in people\'s work and life.',
            zh: '不可否认，主题词在人们的工作和生活中扮演重要角色。'
          },
          {
            id: 'b',
            name: '普遍认为',
            en: 'It is widely accepted that {主题词}, a strong and positive life attitude, is the key element for individuals to achieve success.',
            zh: '人们普遍认为，主题词作为一种积极的生活态度，是个人成功的关键。',
            note: '只适用于品质、心态类主题。'
          },
          {
            id: 'c',
            name: '引起关注',
            en: 'Nowadays, it is well-known that the phenomenon of {主题词} has caused wide concern.',
            zh: '如今，众所周知，主题词这一现象已引起广泛关注。'
          },
          {
            id: 'd',
            name: '成为普遍现象',
            en: 'With the rapid advancement of society and technology, {主题词} has become a common phenomenon in our daily lives.',
            zh: '随着社会和科技快速发展，主题词已成为日常生活中的普遍现象。'
          },
          {
            id: 'e',
            name: '两种选择之争',
            en: 'Currently, whether to {选择1} or {选择2} has become a hot topic among people, especially among the young.',
            zh: '目前，选择 1 还是选择 2 已成为人们尤其是年轻人中的热门话题。'
          }
        ]
      },
      {
        id: 't12',
        para: 1,
        name: '改写观点',
        hint: '用一句话转述作者的观点。',
        options: [
          {
            id: 'a',
            name: 'The author believes',
            en: 'The author believes that {作者观点}.',
            zh: '作者认为，作者观点。'
          },
          {
            id: 'b',
            name: 'Therefore, the author holds',
            en: 'Therefore, the author holds that {作者观点}.',
            zh: '因此，作者认为，作者观点。'
          },
          {
            id: 'c',
            name: 'According to the author',
            en: 'According to the author, {作者观点}.',
            zh: '根据作者，作者观点。'
          },
          {
            id: 'd',
            name: 'In the opinion of the author',
            en: 'In the opinion of the author, {作者观点}.',
            zh: '在作者看来，作者观点。'
          }
        ]
      },
      {
        id: 't13',
        para: 1,
        name: '表明态度',
        hint: '题干要求必须表态。',
        options: [
          {
            id: 'a',
            name: '完全同意',
            en: 'I fully agree with the author\'s viewpoint.',
            zh: '我完全同意作者的观点。'
          },
          {
            id: 'b',
            name: '强烈反对',
            en: 'I strongly disagree with the author\'s opinion.',
            zh: '我强烈反对作者的观点。'
          },
          {
            id: 'c',
            name: '部分同意',
            en: 'I share the author\'s view to a large extent, but I also believe that {补充看法}.',
            zh: '我在很大程度上同意作者，但我也认为补充看法。'
          }
        ]
      }
    ]
  };

  /* ---------- 第二段（通用） ---------- */

  const SECOND = {
    transition: {
      id: 's0',
      para: 2,
      name: '过渡句',
      hint: '引出原因分析，选一句即可。',
      options: [
        {
          id: 'a',
          name: '三个关键原因',
          en: 'Three key reasons, from my perspective, account for this phenomenon.',
          zh: '在我看来，三个关键原因可以解释这一现象。'
        },
        {
          id: 'b',
          name: '归结为三个方面',
          en: 'From my perspective, the causes of {主题词} can be summarized as three main aspects.',
          zh: '在我看来，主题词的成因可以归结为三个主要方面。'
        },
        {
          id: 'c',
          name: '几个因素',
          en: 'Several factors contribute to this phenomenon.',
          zh: '几个因素促成了这一现象。'
        },
        {
          id: 'd',
          name: '多种原因',
          en: 'A variety of reasons can be cited to account for this phenomenon.',
          zh: '有很多原因可以用来解释这一现象。'
        },
        {
          id: 'e',
          name: '多种因素促成趋势',
          en: 'A combination of factors has contributed to the tendency reflected in this chart.',
          zh: '多种因素共同促成了图表所反映的趋势。'
        }
      ]
    },
    reasons: {
      id: 's1',
      para: 2,
      name: '原因分析',
      count: 3,
      hint: '七选三，按选中顺序依次作为原因 1、2、3。',
      plans: [
        {
          id: 'r1',
          name: '方案一 · 举例论证',
          tag: '个人路线',
          hint: '举身边例子，四步组装：引出例子 + 具体行为 + which 结果 + 另一角度结果。',
          options: [
            {
              id: 'a',
              name: '四步组装',
              en: 'For instance, {举例主体}, {身份补充}, {具体行为}, which {带来的好处}. Consequently, {结果}.',
              zh: '例如，举例主体，身份补充，具体行为，这带来好处。因此，结果。'
            },
            {
              id: 'b',
              name: '热爱某事',
              en: 'For example, {举例主体} is passionate about {举例对象}, which {带来的好处}. As a result, {结果}.',
              zh: '例如，举例主体热爱举例对象，这带来好处。因此，结果。'
            },
            {
              id: 'c',
              name: '常见例子',
              en: 'To give a common example, {举例主体} {具体行为}, which {带来的好处}. Gradually, {结果}.',
              zh: '举个常见的例子，举例主体具体行为，这带来好处。渐渐地，结果。'
            }
          ]
        },
        {
          id: 'r2',
          name: '方案二 · 群众路线',
          tag: '宾语从句 + 定语从句',
          hint: '大多数人认为主题词会带来更广阔的平台。',
          options: [
            {
              id: 'a',
              name: '更广阔的平台',
              en: 'The majority of {人群} believe that {主题词} will provide them with a broader platform to {好处行为}, which may put them in a beneficial position in the future.',
              zh: '大多数人群认为，主题词会为他们提供更广阔的平台去做某事，这让他们在未来处于有利位置。'
            },
            {
              id: 'b',
              name: '更多机会',
              en: 'The majority of {人群} maintain that {主题词} will create more opportunities for them to {好处行为}, which is likely to secure a competitive edge in the future.',
              zh: '大多数人群坚持认为，主题词会为他们创造更多机会，这有望在未来获得竞争优势。'
            },
            {
              id: 'c',
              name: '不可或缺',
              en: 'The majority of {人群} are convinced that {主题词} will bring them {好处}, which is indispensable in their daily lives.',
              zh: '大多数人群深信，主题词会带给他们好处，这在日常生活中不可或缺。'
            }
          ]
        },
        {
          id: 'r3',
          name: '方案三 · 从句拉长',
          tag: '主语/宾语/同位语从句',
          hint: '从句 + 六大方面，最通用。',
          options: [
            {
              id: 'a',
              name: 'play a crucial role',
              en: 'Definitely no one can deny the fact that {主题词} plays a crucial role in {某方面}.',
              zh: '没有人能否认，主题词在某方面起着至关重要的作用。'
            },
            {
              id: 'b',
              name: 'inextricably linked',
              en: 'There is no doubt that {主题词} is inextricably linked to {某方面}.',
              zh: '毫无疑问，主题词与某方面密不可分。'
            },
            {
              id: 'c',
              name: 'strongly dependent on',
              en: 'An increasing number of {人群} are beginning to realize that {某方面} is strongly dependent on {主题词}.',
              zh: '越来越多的人群开始意识到，某方面高度依赖主题词。'
            },
            {
              id: 'd',
              name: 'lay the foundation',
              en: 'It is widely believed that {主题词} lays the foundation of {某方面}.',
              zh: '人们普遍认为，主题词为某方面奠定基础。'
            }
          ]
        },
        {
          id: 'r4',
          name: '方案四 · not only 倒装',
          tag: '倒装',
          hint: '主题词单数用 does，复数用 do。',
          options: [
            {
              id: 'a',
              name: '单数主语',
              en: 'Not only does {主题词} improve {某方面1}, but it also enables {人群} to {某方面2}.',
              zh: '主题词不仅改善方面 1，还使人群能够方面 2。'
            },
            {
              id: 'b',
              name: '单数主语 · 促进',
              en: 'Not only does {主题词} boost {某方面1}, but it also promotes {某方面2}.',
              zh: '主题词不仅提升方面 1，还促进方面 2。'
            },
            {
              id: 'c',
              name: '复数主语',
              en: 'Not only do {主题词} improve {某方面1}, but they also cultivate {某方面2}.',
              zh: '主题词不仅改善方面 1，还培养方面 2。',
              note: '主题词是复数（activities / robots / courses）时用这一句。'
            }
          ]
        },
        {
          id: 'r5',
          name: '方案五 · 虚拟语气',
          tag: '扣帽子、上高度',
          hint: '建议放在原因三，段尾警醒。不要扣得太狠。',
          options: [
            {
              id: 'a',
              name: '个人层面',
              en: 'If we ignored the importance of {主题词}, we would never become a better version of ourselves.',
              zh: '如果我们忽视主题词的重要性，就永远无法成为更好的自己。'
            },
            {
              id: 'b',
              name: '社会层面',
              en: 'If everyone failed to {具体行为}, our society would be confronted with an unpromising and fruitless future.',
              zh: '如果每个人都没能做到某事，社会将面临没有希望的未来。'
            },
            {
              id: 'c',
              name: '国家层面',
              en: 'If we underestimated the importance of {主题词}, our nation would permanently lag behind in the new era of rapid development.',
              zh: '如果我们低估主题词的重要性，国家将在快速发展的新时代永远落后。'
            }
          ]
        },
        {
          id: 'r6',
          name: '方案六 · 对比论证',
          tag: '没有对比就创造对比',
          hint: 'A 是主要内容，B 是次要内容。',
          options: [
            {
              id: 'a',
              name: 'Compared with',
              en: 'Compared with {对比对象}, {主题词} can {小方面}, so as to {大方面}.',
              zh: '与对比对象相比，主题词能小方面，从而大方面。'
            },
            {
              id: 'b',
              name: 'In contrast to',
              en: 'In contrast to {对比对象}, the advantage of {主题词} lies in {某方面}.',
              zh: '与对比对象相反，主题词的优势在于某方面。'
            }
          ]
        },
        {
          id: 'r7',
          name: '方案七 · 比喻句',
          tag: '明喻 / 暗喻',
          hint: '写不出来别硬套，建议只背 1–2 句。',
          options: [
            {
              id: 'a',
              name: '灯塔',
              en: '{主题词} is as important as a lighthouse, providing guidance in difficult times.',
              zh: '主题词像灯塔一样重要，在困难时提供指引。'
            },
            {
              id: 'b',
              name: '指南针',
              en: '{主题词} is as essential as a compass, helping us navigate through life\'s challenges.',
              zh: '主题词像指南针一样不可或缺，帮助我们应对生活挑战。'
            },
            {
              id: 'c',
              name: '钥匙',
              en: '{主题词} is the key that unlocks the door to success.',
              zh: '主题词是开启成功之门的钥匙。'
            },
            {
              id: 'd',
              name: '引擎',
              en: '{主题词} is the engine that propels personal growth and social progress.',
              zh: '主题词是推动个人成长与社会进步的引擎。'
            },
            {
              id: 'e',
              name: '桥梁',
              en: '{主题词} is the bridge between {目标1} and {目标2}.',
              zh: '主题词是连接目标 1 与目标 2 的桥梁。'
            },
            {
              id: 'f',
              name: '基石',
              en: '{主题词} is the foundation upon which we build a sustainable future.',
              zh: '主题词是我们构建可持续未来的基石。'
            }
          ]
        }
      ]
    },
    connectives: {
      id: 's2',
      name: '连接词',
      hint: '按原因顺序自动加在句首。',
      groups: [
        { id: 'k1', name: 'Firstly / Secondly / Thirdly', parts: ['Firstly,', 'Secondly,', 'Thirdly,'] },
        { id: 'k2', name: 'To begin with / What\'s more / Last but not least', parts: ['To begin with,', 'What\'s more,', 'Last but not least,'] },
        { id: 'k3', name: 'To begin with / More importantly / Most importantly', parts: ['To begin with,', 'More importantly,', 'Most importantly,'] },
        { id: 'k4', name: 'First and foremost / Furthermore / Last but not least', parts: ['First and foremost,', 'Furthermore,', 'Last but not least,'] }
      ]
    }
  };

  /* ---------- 第三段（通用） ---------- */

  const THIRD = {
    slots: [
      {
        id: 't31',
        para: 3,
        name: '总结全文',
        hint: '重申中心思想，开头可加 All in all / To sum up。',
        options: [
          {
            id: 'a',
            name: '给予足够重视',
            en: 'It is not difficult to draw the conclusion that enough attention must be paid to {主题词} by ourselves and our community.',
            zh: '不难得出结论，我们和全社会都必须对主题词给予足够重视。'
          },
          {
            id: 'b',
            name: '牢记重要性',
            en: 'We should bear in mind that {主题词} is of great importance to {某方面}.',
            zh: '我们应牢记，主题词对某方面非常重要。'
          },
          {
            id: 'c',
            name: '不是选择而是必需',
            en: 'The discussion leads us to the realization that {主题词} is not an option, but a necessity.',
            zh: '讨论使我们认识到，主题词不是一种选择，而是必需。'
          },
          {
            id: 'd',
            name: '不可否认的事实',
            en: 'We are faced with the undeniable fact that {主题词} has become an integral part of {某方面}.',
            zh: '我们面临一个不可否认的事实：主题词已成为某方面不可或缺的一部分。'
          },
          {
            id: 'e',
            name: '否定词倒装',
            en: 'Never can we underestimate the profound impact of {主题词} on {某方面}.',
            zh: '我们绝不能低估主题词对某方面的深远影响。'
          },
          {
            id: 'f',
            name: '万能总结',
            en: 'It is evident that the trend reflected in the chart deserves our careful consideration.',
            zh: '很明显，图表反映的趋势值得我们认真思考。',
            note: '应急用，不需要填空。'
          }
        ]
      },
      {
        id: 't32',
        para: 3,
        name: '具体措施',
        hint: '政府、企业、媒体、学校、家庭几个角度任选两个。',
        options: [
          {
            id: 'a',
            name: '两个角度并列',
            en: 'For one thing, it is imperative for the authorities to {措施1}. For another, {措施主体2} ought to {措施2}.',
            zh: '一方面，当局必须措施 1；另一方面，措施主体 2 应该措施 2。'
          },
          {
            id: 'b',
            name: '老子说的才是对的',
            en: 'When it comes to concrete solutions, some people hold that {实施方1} must take responsibility for {责任对象}. In fact, it is {实施方2} that plays a crucial role in {目标}.',
            zh: '谈到具体方案，有人认为实施方 1 必须为责任对象负责；事实上，实施方 2 才对目标起关键作用。'
          },
          {
            id: 'c',
            name: '表面 vs 实际上',
            en: 'On the surface, {措施1} seems to be a sound solution, but on careful consideration, we find that {措施2} is a more reasonable and effective approach.',
            zh: '表面上，措施 1 似乎是合理方案，但仔细考虑后，措施 2 才更合理有效。'
          }
        ]
      },
      {
        id: 't33',
        para: 3,
        name: '畅想未来',
        hint: '图表题也可以用「趋势预测」代替展望。',
        optional: true,
        options: [
          {
            id: 'a',
            name: '和谐平衡',
            en: 'If these proposed measures are implemented, a harmonious balance between {展望A} and {展望B} will be within our reach.',
            zh: '如果这些措施得以实施，展望 A 与展望 B 之间的和谐平衡将触手可及。'
          },
          {
            id: 'b',
            name: '共同努力',
            en: 'Only through the joint efforts of all people can we {展望结果}.',
            zh: '只有通过所有人的共同努力，我们才能展望结果。'
          },
          {
            id: 'c',
            name: '光明未来',
            en: 'In this way, hopefully, we may embrace a brighter and more promising future.',
            zh: '这样，我们才有希望拥抱更光明、更有希望的未来。'
          },
          {
            id: 'd',
            name: '现在行动',
            en: 'There is no better time than now for us to take collective and decisive action to address this pressing issue.',
            zh: '现在是我们采取集体果断行动解决这一紧迫问题的最佳时机。'
          },
          {
            id: 'e',
            name: '趋势预测 · 人数继续变化',
            en: 'Taking into account all the factors discussed above, we may reasonably conclude that, with the passage of time and the advancement of society, the number of people who choose to {行为} will continue to {趋势} in the coming years.',
            zh: '综合考虑上述因素，可以合理得出结论：未来几年选择做某事的人数将继续上升或下降。'
          },
          {
            id: 'f',
            name: '趋势预测 · 越来越多',
            en: 'For the reasons given above, we can predict that an increasing number of people will focus on {主题词}, and this trend is likely to continue in the near future.',
            zh: '基于上述原因，可以预测越来越多的人将关注主题词，这一趋势在不久的将来很可能持续。'
          },
          {
            id: 'g',
            name: '趋势预测 · 更大规模',
            en: 'Given the arguments above, the next few years will also witness larger-scale, faster-paced and higher-quality development in {主题词}.',
            zh: '鉴于上述论点，未来几年主题词也将迎来更大规模、更快速度和更高水平的发展。'
          },
          {
            id: 'h',
            name: '趋势预测 · 积极影响',
            en: 'In conclusion, the phenomenon reflected in the chart is bound to continue, and it will keep exerting a positive influence on {受到影响的对象}.',
            zh: '总之，图表反映的现象必将持续，并将继续对受到影响的对象产生积极影响。'
          },
          {
            id: 'i',
            name: '趋势预测 · 更重要',
            en: 'In a word, as society keeps moving forward, {主题词} is likely to gain even greater significance in the days to come.',
            zh: '总之，随着社会不断前进，主题词在未来很可能变得更加重要。'
          },
          {
            id: 'j',
            name: '趋势预测 · 获得认可',
            en: 'Given the arguments above, we can predict that {主题词} will win growing recognition among {人群}.',
            zh: '鉴于上述论点，可以预测主题词将赢得越来越多人群的认可。'
          }
        ]
      }
    ]
  };

  /* ---------- 占位词提示 ---------- */

  const PLACEHOLDERS = {
    '主题词': { hint: '全文核心对象，名词短语。图表题写指标，图画题写品质。全文只填一次。', sample: "residents' health literacy level" },
    '年份1': { hint: '图中最早的年份，只写数字。', sample: '2012' },
    '年份2': { hint: '图中最后的年份，只写数字。', sample: '2021' },
    '数据1': { hint: '第一个数值，必须带单位。', sample: '8.8%' },
    '数据2': { hint: '第二个数值，与数据 1 同一单位。', sample: '25.4%' },
    '数据3': { hint: '第三个数值。', sample: '34.0%' },
    '数据4': { hint: '第四个数值。', sample: '2.6%' },
    '增量': { hint: '增长量，带单位；百分点写 percentage points。', sample: '16.6 percentage points' },
    '倍数': { hint: '倍数。2 倍写 twice，3 倍写 three times。', sample: 'twice' },
    '单项': { hint: '变化最突出的那一项，名词或动名词短语。', sample: 'the proportion pursuing further study' },
    '另一单项': { hint: '与单项走向相反的另一项。', sample: 'the proportion entering the workforce' },
    '主题词1': { hint: '占比最高的项目。', sample: 'acquiring relevant knowledge' },
    '主题词2': { hint: '占比第二的项目。', sample: 'improving practical skills' },
    '主题词3': { hint: '占比第三的项目。', sample: 'satisfying curiosity' },
    '主题词4': { hint: '占比第四的项目；项目多时写 and other items 前的最后一项。', sample: 'enhancing parent-child interaction' },
    '左图主题': { hint: '左图主题，名词短语。', sample: "consumers' attitudes towards elderly-care robots" },
    '右图主题': { hint: '右图主题，与左图结构平行。', sample: 'their major concerns about such devices' },
    '总主题': { hint: '两幅图共同的上位主题。', sample: "consumers' perceptions of elderly-care robots" },
    '社会现象': { hint: '一句完整从句，概括数据背后的现象（谁怎么样）。', sample: 'the public attaches greater importance to elderly care' },
    '人群': { hint: '具体人群，用复数。', sample: 'undergraduates' },
    '行为': { hint: '人们倾向做的动作，动词短语。', sample: 'choose a healthy lifestyle' },
    '环境': { hint: '图画环境；看不清就写 in front of us。', sample: 'on the playground' },
    '主体': { hint: '图画主体，人或物。', sample: 'a young man' },
    '基本动作': { hint: '主体的存在方式：stands / sits / lies / stays。', sample: 'stands' },
    '主要动作': { hint: '作者突出的动作，现在分词。', sample: 'rushing to the finish line' },
    '细节': { hint: '表情或心态，with 短语。', sample: 'with a confident smile on his face' },
    '形容词1': { hint: '正面形容词 1。', sample: 'active' },
    '形容词2': { hint: '与形容词 1 并列的正面形容词。', sample: 'vigorous' },
    '左图主体': { hint: '左图人物或事物。', sample: 'the girl' },
    '左图动作': { hint: '左图主要动作，现在进行时。', sample: 'is fully focused on her homework' },
    '右图主体': { hint: '右图人物或事物。', sample: 'the boy' },
    '右图动作': { hint: '右图主要动作，现在进行时。', sample: 'is lying on the sofa' },
    '左图观点': { hint: '左图人物说的话或想法，转述。', sample: 'campus lectures are irrelevant to her major' },
    '右图观点': { hint: '右图人物说的话或想法，转述。', sample: 'attending such lectures is highly beneficial' },
    '图画描述': { hint: '一句话描述图画：主体 + 动作 + 细节。', sample: 'several residents are exercising in a park' },
    '图表描述': { hint: '一句话总体描述图表。', sample: 'the number of parks rose from 406 to 670' },
    '多个元素': { hint: '场景中的元素总称。', sample: 'cultural elements' },
    '场景': { hint: '元素所在场景。', sample: 'the hotpot' },
    '元素1': { hint: '具体元素 1。', sample: 'Peking Opera' },
    '元素2': { hint: '具体元素 2。', sample: 'Kung fu' },
    '元素3': { hint: '具体元素 3。', sample: 'Shakespeare' },
    '对象': { hint: '图画提醒的对象。', sample: 'teenagers and youngsters' },
    '现象': { hint: '图画反映的现象，完整从句。', sample: 'young people are losing the habit of reading' },
    '作者观点': { hint: '原文作者的观点，用自己的话转述。', sample: 'showing uncertainty can win trust' },
    '补充看法': { hint: '部分同意时补充的条件。', sample: 'schools should also guide children' },
    '选择1': { hint: '两种对立选择之一。', sample: 'work' },
    '选择2': { hint: '另一种选择。', sample: 'pursue further study' },
    '举例主体': { hint: '身边的例子主体。', sample: 'my roommate, Kevin' },
    '身份补充': { hint: '对举例主体的补充说明。', sample: 'a diligent student' },
    '具体行为': { hint: '该主体的具体做法，动词短语。', sample: 'is passionate about reading' },
    '举例对象': { hint: '行为涉及的对象。', sample: 'reading' },
    '带来的好处': { hint: 'which 从句里的结果，动词短语。', sample: 'helps him develop sharp observation skills' },
    '结果': { hint: '另一角度的结果。', sample: 'he earns the respect of our class' },
    '好处行为': { hint: 'to 后面的好处动作，动词原形。', sample: 'develop themselves' },
    '好处': { hint: '名词性好处。', sample: 'great convenience' },
    '某方面': { hint: '六大方面之一。', sample: 'personal growth' },
    '某方面1': { hint: '第一个方面。', sample: 'physical and mental health' },
    '某方面2': { hint: '第二个方面。', sample: 'curiosity and observational skills' },
    '对比对象': { hint: '用来对比的次要事物。', sample: 'indoor activities' },
    '小方面': { hint: '直接好处，动词短语。', sample: "cultivate children's curiosity" },
    '大方面': { hint: '更高层的结果。', sample: 'promote their all-round development' },
    '目标1': { hint: '比喻连接的一端。', sample: 'children' },
    '目标2': { hint: '比喻连接的另一端。', sample: 'the natural world' },
    '措施1': { hint: '具体措施 1，动词短语。', sample: 'formulate strict regulations' },
    '措施2': { hint: '具体措施 2，动词短语。', sample: "improve product quality" },
    '措施主体2': { hint: '第二个措施主体。', sample: 'enterprises' },
    '实施方1': { hint: '别人认为的实施方。', sample: 'the government' },
    '责任对象': { hint: '实施方要负责的对象。', sample: 'the protection of the environment' },
    '实施方2': { hint: '你认为更关键的实施方或做法。', sample: "cultivating citizens' awareness" },
    '目标': { hint: '要实现的目标。', sample: 'protecting the environment' },
    '展望A': { hint: '展望平衡的一端。', sample: 'economic development' },
    '展望B': { hint: '展望平衡的另一端。', sample: 'environmental protection' },
    '展望结果': { hint: '展望结果，动词短语。', sample: 'build a harmonious society' },
    '趋势': { hint: 'continue to 后面的动词。', sample: 'increase' },
    '受到影响的对象': { hint: '受到积极影响的对象。', sample: 'the well-being of the elderly' }
  };

  const SCENES = {
    'chart-dyn-one': CHART_DYN_ONE,
    'chart-dyn-multi': CHART_DYN_MULTI,
    'chart-static': CHART_STATIC,
    'chart-double': CHART_DOUBLE,
    'chart-universal': CHART_UNIVERSAL,
    'picture': PICTURE,
    'text': TEXT
  };

  function scene(id) {
    return SCENES[id] || null;
  }

  function placeholder(name) {
    return PLACEHOLDERS[name] || null;
  }

  function typeOf(id) {
    return TYPES.filter(function (t) { return t.scenes.indexOf(id) >= 0; })[0] || null;
  }

  App.aiTemplates = {
    types: TYPES,
    scenes: SCENES,
    second: SECOND,
    third: THIRD,
    placeholders: PLACEHOLDERS,
    scene: scene,
    typeOf: typeOf,
    placeholder: placeholder
  };
})(window.App);
