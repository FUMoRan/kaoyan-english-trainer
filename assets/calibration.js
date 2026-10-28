/* 评分标尺样本：用近几年真题题目 + 按大纲档位构造的学生样本，校准模型宽严度。
   分数是按评分档位设定的教学参照，不是官方公布的单篇得分（官方从不公布）。 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const SAMPLES = [
    {
      kind: 'big',
      title: '2024 英语一 大作文 · 第一段',
      band: '第四档 5–8 分，给 7/20',
      text: 'There are two pictures. In the first picture, some people are running and walking in a park. One man says the new park near his home is very good. In the second picture, a bar chart shows the number of parks in a city: 406 in 2020, 532 in 2021 and 670 in 2022. The number is increasing very fast.',
      reason: '信息点齐全，但全是 There be 和主谓简单句，图与表之间没有衔接，数据像清单，属第四档上沿。'
    },
    {
      kind: 'big',
      title: '2023 英语一 大作文 · 第三段（龙舟赛）',
      band: '第三档 9–12 分，给 11/20',
      text: 'All in all, this picture reflects a heartwarming scene that the dragon boat race makes the village more lively. As a college student, I think we should taking action to protect our traditional culture. Only in this way can our society become more and more better.',
      reason: '有观点也有递进连接，但 should taking、more and more better 两处硬伤，建议停在口号层面，属第三档上沿。'
    },
    {
      kind: 'big',
      title: '2025 英语一 大作文 · 第二段（耐用消费品表格）',
      band: '第二档 13–16 分，给 14/20',
      text: 'The table reveals a marked upward trend in household appliance ownership. Between 2014 and 2023, air conditioners per hundred households nearly doubled, rising from 75.2 to 145.9, while washing machines grew at a steadier pace. This surge is largely attributable to rising disposable incomes and the government\u2019s push for consumption upgrading. It also reflects a deeper shift: families now treat comfort and efficiency, rather than mere durability, as the benchmark of a decent life.',
      reason: '数据引用具体，有因果解释和一层抽象提升，衔接自然，仅 attributable to 这类固定搭配需注意，属第二档上沿。'
    },
    {
      kind: 'small',
      title: '2023 英语一 小作文 · 通知（招募项目学生）',
      band: '第二档 7–8 分，给 8/10',
      text: 'Notice\n\nIn order to help Professor Smith complete his research project, we are recruiting one student to join the team. The work includes collecting data in the field and sorting the records. Applicants should be patient, responsible and available on weekends. Those who are interested please send your application to Professor Smith before March 1. We look forward to your participation.',
      reason: '格式完整、要点齐全、语域得体、语言准确；句式偏平但不影响任务，属第二档上沿。'
    }
  ];

  function select(kind, typeKey) {
    const list = SAMPLES.filter(function (s) { return s.kind === kind; });
    return list.map(function (s, i) {
      return [
        '【样本 ' + (i + 1) + '｜' + s.title + '｜' + s.band + '】',
        '学生原文：' + s.text,
        '判分理由：' + s.reason
      ].join('\n');
    }).join('\n\n');
  }

  App.calibration = { samples: SAMPLES, select: select };
})(window.App);
