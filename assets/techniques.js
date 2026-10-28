/* 句型手法库：18 个手法，各配 2–3 个本地例句（不联网也能看） */
window.App = window.App || {};

(function (App) {
  'use strict';

  const GROUPS = [
    {
      label: '强调与倒装',
      items: [
        {
          prompt: '强调句（It is ... that ...）',
          label: '强调句 It is ... that ...',
          tip: '把要突出的成分放到 It is 和 that 之间；强调时间/条件常用 not until。',
          examples: [
            ['It is persistent practice, rather than innate talent, that separates a fluent writer from a hesitant one.', '区分流畅写作者与犹豫写作者的，是持续练习而非天赋。'],
            ['It was not until the haze shrouded the city that residents began to question the cost of rapid growth.', '直到雾霾笼罩城市，居民才开始质疑快速增长的代价。']
          ]
        },
        {
          prompt: '倒装（否定词 Not only / Never / Hardly 提前）',
          label: '倒装：否定词提前',
          tip: '否定词放句首，主谓要倒装；常配 but also、ever 等。',
          examples: [
            ['Not only does reading broaden our horizons, but it also sharpens our judgment.', '阅读不仅开阔视野，也磨砺判断力。'],
            ['Never have I seen so many young people queue for a museum exhibition.', '我从未见过这么多年轻人为一场展览排队。']
          ]
        },
        {
          prompt: '倒装（Only + 状语提前）',
          label: '倒装：Only + 状语提前',
          tip: 'Only + 状语/状语从句置句首，主句倒装；只倒主句，不倒从句。',
          examples: [
            ['Only by respecting cultural differences can we build a genuinely open society.', '只有尊重文化差异，才能建成真正开放的社会。'],
            ['Only when the data is presented clearly does the argument become persuasive.', '只有数据呈现清楚，论点才有说服力。']
          ]
        },
        {
          prompt: '让步倒装（Hardly ... when / No sooner ... than）',
          label: '让步倒装 Hardly…when',
          tip: '叙事型图画描述好用；主句用过去完成时，从句用一般过去时。',
          examples: [
            ['Hardly had the students stepped into the library when they were struck by the silence.', '学生刚踏进图书馆，就被那份安静震住了。'],
            ['No sooner had the new policy taken effect than complaints flooded in.', '新政策刚生效，投诉就涌了进来。']
          ]
        }
      ]
    },
    {
      label: '从句与非谓语',
      items: [
        {
          prompt: '非限制性定语从句（..., which ...）',
          label: '非限制性定语从句',
          tip: '逗号后补一句评价；which 可指代前面整句，是最省力的“加一句评论”。',
          examples: [
            ['Traditional operas, which once attracted packed audiences, now struggle to fill a single row.', '传统戏曲曾场场爆满，如今连一排座位都填不满。'],
            ['Most students learn grammar by rules alone, which explains why their writing still sounds stiff.', '多数学生只靠规则学语法，这解释了为什么他们的写作仍然生硬。']
          ]
        },
        {
          prompt: '限制性定语从句',
          label: '限制性定语从句',
          tip: '限定“哪一类人/事”，不加逗号，常用来下定义。',
          examples: [
            ['Students who rely solely on memorization often fail to express an original idea.', '只靠背诵的学生往往表达不出独立见解。'],
            ['Policies that ignore local conditions rarely survive the first year.', '忽视地方实际的政策很少能撑过第一年。']
          ]
        },
        {
          prompt: '主语从句 / 形式主语（It is ... to ...）',
          label: '主语从句 / 形式主语',
          tip: '长主语后置，用 it 占位；作文里说“重要的是……”最稳。',
          examples: [
            ['It is widely acknowledged that cultural confidence grows out of daily exposure, not slogans.', '公认的是，文化自信来自日常浸润而非口号。'],
            ['What matters most is not how fast we read but how deeply we think.', '最重要的不是读得多快，而是想得多深。']
          ]
        },
        {
          prompt: '同位语（用名词短语解释前文）',
          label: '同位语',
          tip: '用逗号夹一个名词短语解释前面的词，信息密度高且不另起一句。',
          examples: [
            ['The dragon boat race, a centuries-old ritual of communal effort, still binds villagers together.', '龙舟赛这一延续数百年的协力仪式，仍把村民连在一起。'],
            ['One factor, the rising cost of housing, weighs heavily on young graduates.', '住房成本上升这一因素，沉重地压在年轻毕业生身上。']
          ]
        },
        {
          prompt: '分词短语作状语（Faced with ..., ...）',
          label: '分词短语作状语',
          tip: '动作的主语必须和主句主语一致，否则会变成“悬垂分词”。',
          examples: [
            ['Faced with fierce competition, many graduates choose to start their own businesses.', '面对激烈竞争，许多毕业生选择自主创业。'],
            ['Having spent years in the countryside, she speaks with an authority that textbooks cannot provide.', '在乡下待了多年，她说话带着教科书给不了的底气。']
          ]
        },
        {
          prompt: '独立主格',
          label: '独立主格',
          tip: '自带主语的短语，用来交代背景或伴随状态，比从句更紧凑。',
          examples: [
            ['The economy growing steadily, more families can afford cultural consumption.', '经济稳步增长，更多家庭负担得起文化消费。'],
            ['Weather permitting, the festival will be held in the open square.', '天气允许的话，庆典将在露天广场举行。']
          ]
        },
        {
          prompt: 'with 复合结构',
          label: 'with 复合结构',
          tip: 'with + 宾语 + 分词/形容词/介词短语，描述伴随情况最自然。',
          examples: [
            ['With incomes rising, household spending on travel has surged.', '随着收入上升，家庭旅行支出猛增。'],
            ['With the internet at their fingertips, students can learn almost anything.', '网络触手可及，学生几乎什么都能学。']
          ]
        }
      ]
    },
    {
      label: '名词化与抽象表达',
      items: [
        {
          prompt: '名词化（动词或形容词转抽象名词）',
          label: '名词化',
          tip: '把动作压成名词，句子更书面；但连用两次以上会变得空洞。',
          examples: [
            ['The rapid urbanization of the region has brought both prosperity and anxiety.', '该地区的快速城市化既带来繁荣，也带来焦虑。'],
            ['Excessive reliance on short videos weakens our capacity for sustained concentration.', '过度依赖短视频削弱了我们持续专注的能力。']
          ]
        },
        {
          prompt: '抽象名词作主语',
          label: '抽象名词作主语',
          tip: '用 Curiosity / Trust / Poverty 这类词当主语，语气更概括、更像评论。',
          examples: [
            ['Curiosity, rather than pressure, drives genuine learning.', '驱动真正学习的是好奇心，而不是压力。'],
            ['Poverty of ambition, not poverty of resources, holds many students back.', '拦住许多学生的是志向的贫乏，而非资源的贫乏。']
          ]
        },
        {
          prompt: '被动语态（强调受事）',
          label: '被动语态',
          tip: '受事是重点、或不必说施事时用；小作文的客观陈述尤其常见。',
          examples: [
            ['Traditional villages are being turned into tourist attractions at an alarming rate.', '传统村落正以惊人的速度被改造成旅游景点。'],
            ['The issue has been widely discussed, yet little has been done.', '这个问题被广泛讨论，却几乎没人行动。']
          ]
        },
        {
          prompt: '虚拟语气（If it were not for ...）',
          label: '虚拟语气',
          tip: '与事实相反才用；Were I to ... 是 If I were to ... 的倒装版。',
          examples: [
            ['If it were not for public transport, the city would choke on its own traffic.', '要不是公共交通，这座城市早被自己的车流憋死了。'],
            ['It is high time that we took cultural preservation seriously.', '我们早该认真对待文化保护了。']
          ]
        }
      ]
    },
    {
      label: '比较与衔接',
      items: [
        {
          prompt: '比较结构（the more ..., the more ...）',
          label: '比较结构 the more…, the more…',
          tip: '前后都要用比较级且结构平行，别写成 the more ... the easy ...。',
          examples: [
            ['The more choices we have, the harder it becomes to commit to one.', '选择越多，越难下定决心。'],
            ['The earlier children are exposed to art, the more naturally they respond to it.', '孩子接触艺术越早，反应越自然。']
          ]
        },
        {
          prompt: '平行结构（not only ..., but also ...）',
          label: '平行结构',
          tip: '并列成分词性、形式必须一致，这是阅卷人一眼能看出的加分点。',
          examples: [
            ['Reading cultivates patience, sharpens judgment and enriches vocabulary.', '阅读培养耐心、磨砺判断、丰富词汇。'],
            ['The plan is neither realistic nor affordable.', '这个计划既不现实，也负担不起。']
          ]
        },
        {
          prompt: '因果递进衔接（Consequently / What\'s more）',
          label: '因果递进衔接',
          tip: '连接副词后面要逗号，且不能当连词用（别写 and consequently 混用）。',
          examples: [
            ['Cities have invested heavily in roads; consequently, the number of private cars has risen rather than fallen.', '城市大力投资道路，结果私家车数量不降反升。'],
            ['The app saves time; what\'s more, it makes learning visible and measurable.', '这款应用省时间，更重要的是让学习可见、可测。']
          ]
        }
      ]
    }
  ];

  function all() {
    const list = [];
    GROUPS.forEach(function (group) {
      group.items.forEach(function (item) {
        list.push(Object.assign({ group: group.label }, item));
      });
    });
    return list;
  }

  function get(prompt) {
    return all().filter(function (item) { return item.prompt === prompt; })[0] || null;
  }

  App.techniques = { GROUPS: GROUPS, all: all, get: get };
})(window.App);
