/* 语法手册：21 个考研高频语法点，每个配结构公式、经典例句与易错提醒。
   全部本地数据，断网也能查。 */
window.App = window.App || {};

(function (App) {
  'use strict';

  const CATS = ['从句', '非谓语', '虚拟语气', '倒装与强调', '时态与语态', '一致与比较', '冠词与搭配', '写作升级'];

  const ITEMS = [
    {
      id: 'attr-clause',
      cat: '从句',
      title: '定语从句：限制性与非限制性',
      formula: '先行词 + who / which / that / whose / where / when + 从句',
      note: '限制性从句不加逗号，用来限定「哪一类」；非限制性从句加逗号，只补充信息，删掉不影响主句成立。',
      examples: [
        ['Students who rely solely on memorization often fail to think independently.', '只靠背诵的学生往往不能独立思考。'],
        ['The old library, which was built in 1912, still attracts readers.', '那座建于 1912 年的老图书馆至今仍吸引读者。'],
        ['He lives in a village where most families grow tea.', '他住在一个多数家庭种茶的村子。']
      ],
      pitfall: '非限制性从句不能用 that；逗号后的 which 可以指代前面整句话。'
    },
    {
      id: 'noun-clause',
      cat: '从句',
      title: '名词性从句：主语 / 宾语 / 表语 / 同位语',
      formula: 'that / whether / what / who / why + 从句，可放在四种名词位置',
      note: '从句在句中当名词用。that 只起连接作用、不作成分；what 本身要在从句里当主语或宾语。',
      examples: [
        ['What matters is not how fast we read but how deeply we think.', '重要的不是读得多快，而是想得多深。'],
        ['It is widely acknowledged that cultural confidence grows out of daily exposure.', '公认的是，文化自信来自日常浸润。'],
        ['The question whether the plan is affordable remains unanswered.', '这个计划是否负担得起，仍无答案。']
      ],
      pitfall: '主语从句开头用 that，不要用 what 表示「是否」；介词后用 whether，不用 if。'
    },
    {
      id: 'adv-concession',
      cat: '从句',
      title: '状语从句：让步与条件',
      formula: 'although / even if / unless / as long as / no matter how + 从句',
      note: '让步是「虽然…」，条件是「只有…才」。写作文第二段讲局限、第三段讲前提时最常用。',
      examples: [
        ['Although the policy was well designed, it failed in practice.', '尽管政策设计得不错，实践中还是失败了。'],
        ['Unless local governments act, the reform will stall.', '除非地方政府行动，否则改革会停滞。'],
        ['No matter how advanced the technology is, it cannot replace judgment.', '技术再先进，也无法取代判断力。']
      ],
      pitfall: 'although 不与 but 连用；unless 已含否定，别再写 unless ... not。'
    },
    {
      id: 'adv-result',
      cat: '从句',
      title: '状语从句：结果与目的',
      formula: 'so + 形容词/副词 + that；such + (a) 名词 + that；so that / in order that + 从句',
      note: 'so…that 表「如此…以至于」，so that 表「以便」。图表作文描述数据后果时好用。',
      examples: [
        ['The evidence was so convincing that no one raised a doubt.', '证据如此有说服力，没人提出质疑。'],
        ['Cities are investing in public transport so that residents can travel cheaply.', '城市投资公共交通，以便居民出行更便宜。'],
        ['Such was the confusion that the meeting had to be suspended.', '混乱到会议不得不暂停。']
      ],
      pitfall: 'so 后接形容词或副词，such 后接名词；别混成 so a good plan。'
    },
    {
      id: 'infinitive',
      cat: '非谓语',
      title: '不定式：目的、结果与后置定语',
      formula: 'to do（可放句首表目的，也可紧跟在名词后作定语）',
      note: '不定式自带「将要/为了」的含义。句首作目的状语时，逻辑主语必须和主句一致。',
      examples: [
        ['To curb plastic waste, many cities have banned free bags.', '为遏制塑料垃圾，许多城市禁止免费塑料袋。'],
        ['She was the first to question the data.', '她是第一个质疑这些数据的人。'],
        ['He turned out to be right after all.', '他最后证明是对的。']
      ],
      pitfall: '句首 To do 的逻辑主语要与主句主语一致，否则就是悬垂结构。'
    },
    {
      id: 'gerund',
      cat: '非谓语',
      title: '动名词：主语、宾语与介词宾语',
      formula: 'doing（可作主语、动词宾语、介词宾语）',
      note: '动名词把动作当名词用，适合讲「某种行为本身」的影响；介词后面只能用 doing。',
      examples: [
        ['Reading widely is the cheapest way to broaden one\'s horizon.', '广泛阅读是开阔视野最便宜的方式。'],
        ['The government is considering raising the tax on cigarettes.', '政府正在考虑提高香烟税。'],
        ['There is no point in arguing about it now.', '现在争论这个没有意义。']
      ],
      pitfall: '介词后接 doing；avoid / consider / suggest / mind 后也接 doing。'
    },
    {
      id: 'participle',
      cat: '非谓语',
      title: '分词：作定语与作状语',
      formula: 'doing（主动/进行）／ done（被动/完成）／ having done（先后）',
      note: '分词短语能把两个句子压成一个，是作文提档最省力的手段之一。',
      examples: [
        ['The figures released last week sparked a heated debate.', '上周公布的数据引发了激烈争论。'],
        ['Faced with fierce competition, many graduates start their own businesses.', '面对激烈竞争，许多毕业生选择自主创业。'],
        ['Having spent years in the countryside, she speaks with unusual authority.', '在乡下待了多年，她说话带着少见的底气。']
      ],
      pitfall: '分词的主语必须和主句主语一致；having done 强调动作先发生。'
    },
    {
      id: 'absolute',
      cat: '非谓语',
      title: '独立主格与 with 复合结构',
      formula: '名词 + doing / done / 形容词 / 介词短语；with + 名词 + doing / done',
      note: '独立主格自带逻辑主语，用来交代背景或伴随状态，比从句紧凑。',
      examples: [
        ['The economy growing steadily, more families can afford cultural consumption.', '经济稳步增长，更多家庭负担得起文化消费。'],
        ['Weather permitting, the festival will be held in the open square.', '天气允许的话，庆典将在露天广场举行。'],
        ['With incomes rising, spending on travel has surged.', '随着收入上升，旅行支出猛增。']
      ],
      pitfall: '独立主格有自己的主语，不要和主句主语重复；with 结构后不能用完整谓语。'
    },
    {
      id: 'if-subjunctive',
      cat: '虚拟语气',
      title: 'if 条件句的三种时间',
      formula: '与现在相反：if + did / were, would do；与过去相反：if + had done, would have done；与将来相反：if + were to do',
      note: '虚拟语气的核心是「与事实相反」。写作里常用 If it were not for… 讲「没有…会怎样」。',
      examples: [
        ['If it were not for public transport, the city would choke on its own traffic.', '要不是公共交通，这座城市早被自己的车流憋死了。'],
        ['Had the warning been taken seriously, the accident would have been avoided.', '要是当初重视了警告，这场事故本可避免。'],
        ['Were I to start college again, I would read more than memorize.', '如果能重新读大学，我会多读书少背书。']
      ],
      pitfall: '省略 if 时把 had / were / should 提到句首，此时不能再加 if。'
    },
    {
      id: 'should-subjunctive',
      cat: '虚拟语气',
      title: 'should 型虚拟：建议、命令与 It is time',
      formula: 'suggest / demand / insist / recommend + that + (should) do；It is necessary / high time that + (should) do',
      note: '这类从句里的 should 常省略，动词一律用原形，不受主语单复数影响。',
      examples: [
        ['The committee recommended that the policy (should) be reviewed annually.', '委员会建议每年审查该政策。'],
        ['It is essential that every student have access to the library.', '每个学生都能使用图书馆，这一点至关重要。'],
        ['It is high time that we took cultural preservation seriously.', '我们早该认真对待文化保护了。']
      ],
      pitfall: '这里用 have 而不是 has；It is high time that 后也可用过去式（took）。'
    },
    {
      id: 'neg-inversion',
      cat: '倒装与强调',
      title: '倒装：否定词提前',
      formula: 'Not only ... but also / Never / Hardly ... when / No sooner ... than + 倒装主句',
      note: '否定词放句首时主句要倒装（助动词提到主语前），是阅卷人一眼能看到的加分点。',
      examples: [
        ['Not only does reading broaden our horizons, but it also sharpens our judgment.', '阅读不仅开阔视野，也磨砺判断力。'],
        ['Hardly had the lecture ended when the audience rose to applaud.', '讲座刚结束，听众就起立鼓掌。'],
        ['Never have I seen so many young people queue for an exhibition.', '我从未见过这么多年轻人为展览排队。']
      ],
      pitfall: '只倒主句，不倒从句；Hardly 主句用过去完成，从句用一般过去。'
    },
    {
      id: 'only-inversion',
      cat: '倒装与强调',
      title: '倒装：Only + 状语提前',
      formula: 'Only + 状语 / 状语从句 + 助动词 + 主语 + 谓语',
      note: 'Only 修饰状语且置于句首时，主句倒装；修饰主语时不倒装。',
      examples: [
        ['Only by respecting cultural differences can we build a genuinely open society.', '只有尊重文化差异，才能建成真正开放的社会。'],
        ['Only when the data is presented clearly does the argument persuade.', '只有数据呈现清楚，论点才有说服力。'],
        ['Only he knew the answer at that moment.', '那一刻只有他知道答案。']
      ],
      pitfall: '第三句 Only 修饰主语，所以不倒装——这是最常见的误判点。'
    },
    {
      id: 'cleft',
      cat: '倒装与强调',
      title: '强调句：It is ... that ...',
      formula: 'It is / was + 被强调部分 + that / who + 其余部分',
      note: '判断方法：去掉 It is 和 that 后，剩下的词能组成完整句子，才是强调句。',
      examples: [
        ['It is persistent practice, rather than innate talent, that makes a fluent writer.', '让写作者流畅的是持续练习，而不是天赋。'],
        ['It was not until the haze shrouded the city that residents began to question growth.', '直到雾霾笼罩城市，居民才开始质疑增长。'],
        ['It is in everyday choices that environmental protection truly begins.', '环保真正开始于日常选择。']
      ],
      pitfall: '强调时间/条件用 not until，且 that 前不再加 when；去掉框架后不完整的就是主语从句。'
    },
    {
      id: 'tense-perfect',
      cat: '时态与语态',
      title: '现在完成 vs 一般过去',
      formula: 'have / has done（与现在有关）↔ did（有明确过去时间点）',
      note: 'since / so far / over the past decade / in recent years 后面用现在完成；一旦出现 in 2012 这类时间点，就用一般过去。',
      examples: [
        ['China has invested heavily in rural roads since 2012.', '自 2012 年以来，中国在农村公路上投入巨大。'],
        ['The government invested 3 billion yuan in rural roads in 2012.', '政府 2012 年在农村公路上投入了 30 亿元。'],
        ['Prices have risen sharply over the past decade.', '过去十年物价大幅上涨。']
      ],
      pitfall: '现在完成不能与明确过去时间点连用：× have finished it yesterday。'
    },
    {
      id: 'past-perfect',
      cat: '时态与语态',
      title: '过去完成：过去的过去',
      formula: 'had done（以另一个过去时间为参照）',
      note: '图表作文讲「到某年为止已经…」时最常用，保证两个过去动作的先后清楚。',
      examples: [
        ['By the time the policy was announced, critics had already gathered evidence.', '政策公布时，批评者已经收集好了证据。'],
        ['She had worked in the countryside for five years before she moved to the city.', '她在乡下工作五年后才搬进城市。'],
        ['The number had nearly doubled by 2023.', '到 2023 年，这个数字已接近翻倍。']
      ],
      pitfall: '必须有另一个过去时间作参照，否则不要用过去完成。'
    },
    {
      id: 'passive',
      cat: '时态与语态',
      title: '被动语态与 be said to',
      formula: 'be + done；get + done（口语/意外）；be said / believed to do',
      note: '受事是重点、或不必说施事时用被动；客观陈述和小作文的正式语气尤其常见。',
      examples: [
        ['Traditional villages are being turned into tourist attractions at an alarming rate.', '传统村落正以惊人速度被改造成旅游景点。'],
        ['The plan is said to have been postponed.', '据说该计划已被推迟。'],
        ['Many old crafts have been lost in the rush to modernize.', '许多老手艺在现代化浪潮中失传了。']
      ],
      pitfall: '不及物动词没有被动（happen / occur / rise）；be said to 后接完成式表示已经发生。'
    },
    {
      id: 'agreement',
      cat: '一致与比较',
      title: '主谓一致：就远、就近与数量短语',
      formula: 'neither A nor B + 就近；the number of + 单数；a number of + 复数',
      note: '作文里主语一长就容易错。先把真正的中心词找出来，再看它单复数。',
      examples: [
        ['Neither the students nor the teacher was aware of the change.', '学生和老师都没察觉这个变化。'],
        ['The number of private cars has risen sharply.', '私家车数量大幅上升。'],
        ['A number of students have signed up for the lecture.', '许多学生报名了这场讲座。']
      ],
      pitfall: 'the number of 谓语用单数，a number of 用复数；each / every + 单数。'
    },
    {
      id: 'comparison',
      cat: '一致与比较',
      title: '比较结构：as ... as、the more ... the more、倍数',
      formula: 'as + 形容词/副词 + as；the + 比较级 ..., the + 比较级 ...；倍数 + as ... as',
      note: '比较结构最忌前后不平行和比较级叠加，写图表作文的增减幅度时几乎必用。',
      examples: [
        ['The more choices we have, the harder it becomes to commit to one.', '选择越多，越难下定决心。'],
        ['Air conditioners per hundred households nearly doubled, from 75.2 to 145.9.', '每百户空调拥有量几乎翻倍，从 75.2 升到 145.9。'],
        ['Reading is twice as effective as scrolling for retention.', '论记忆效果，阅读是刷手机的两倍。']
      ],
      pitfall: '比较级不能叠加（× more better）；the more 后面的结构要一致。'
    },
    {
      id: 'articles',
      cat: '冠词与搭配',
      title: '冠词三条主线：泛指、特指、固定搭配',
      formula: 'a/an + 可数单数泛指；the + 特指/独一无二/最高级；零冠词 + 复数泛指',
      note: '冠词错是中式作文最高频的扣分点。判断顺序：可数吗 → 泛指还是特指 → 是否固定搭配。',
      examples: [
        ['A growing number of graduates prefer flexible jobs.', '越来越多毕业生偏爱灵活的工作。'],
        ['The rise in housing prices has slowed down.', '房价上涨已经放缓。'],
        ['She plays the piano, while her brother plays basketball.', '她弹钢琴，她弟弟打篮球。']
      ],
      pitfall: '复数泛指不加 the；play + 乐器加 the，球类不加；独一无二事物（the sun）要 the。'
    },
    {
      id: 'prep-collocation',
      cat: '冠词与搭配',
      title: '高频介词搭配：result in / result from 等',
      formula: 'account for 占/解释；contribute to 促成；be attributed to 归因于；result in 导致 ≠ result from 由…造成',
      note: '这四个短语几乎每年都能在范文里看到，用反方向就整句意思颠倒。',
      examples: [
        ['Rising incomes account for much of the growth in cultural spending.', '收入上升是文化消费增长的主要原因。'],
        ['The decline can be attributed to falling birth rates.', '这一下降可归因于出生率走低。'],
        ['Neglect resulted in the loss of many local dialects.', '忽视导致许多方言消失。']
      ],
      pitfall: 'result in 后面是结果，result from 后面是原因；contribute to 的 to 是介词，后接名词或 doing。'
    },
    {
      id: 'nominalization',
      cat: '写作升级',
      title: '名词化与抽象名词作主语',
      formula: '动词/形容词 → 抽象名词（rely → reliance；urban → urbanization）',
      note: '把动作压成名词，句子更书面、更像评论；但一段里用两次以上就会变得空洞。',
      examples: [
        ['The rapid urbanization of the region has brought both prosperity and anxiety.', '该地区的快速城市化既带来繁荣，也带来焦虑。'],
        ['Excessive reliance on short videos weakens our capacity for sustained concentration.', '过度依赖短视频削弱了持续专注的能力。'],
        ['Curiosity, rather than pressure, drives genuine learning.', '驱动真正学习的是好奇心，而非压力。']
      ],
      pitfall: '名词化堆太多会变成「抽象名词 + 弱动词」的空句，一段最多用一两次。'
    }
  ];

  function list() {
    return ITEMS;
  }

  function get(id) {
    return ITEMS.filter(function (item) { return item.id === id; })[0] || null;
  }

  function search(keyword, cat) {
    const kw = String(keyword || '').trim().toLowerCase();
    return ITEMS.filter(function (item) {
      if (cat && cat !== '全部' && item.cat !== cat) return false;
      if (!kw) return true;
      const hay = [
        item.title, item.cat, item.formula, item.note, item.pitfall
      ].concat(item.examples.reduce(function (all, pair) { return all.concat(pair); }, [])).join(' ').toLowerCase();
      return hay.indexOf(kw) >= 0;
    });
  }

  App.grammar = { CATS: CATS, list: list, get: get, search: search };
})(window.App);
