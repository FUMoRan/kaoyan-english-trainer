/* 考研英语小作文模板（英一英二通用，整理自用户提供的 PDF）
   书信（回复信 / 主动信）、通知、纪要共 4 篇，空位用 ① ② ③ 标记。
   paragraphs 与 ZH 按句一一对应，全文预览与空位指导直接复用。 */

window.App = window.App || {};

(function (App) {
  'use strict';

  const CIRCLE = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

  const LETTERS = [
    {
      id: 'ltr-01',
      no: '01',
      kind: '小作文 · 书信',
      title: '回复信（被动写信）',
      feature: '对方先来信，你只负责回复',
      example: '感谢、答复、邀请答复、分享感受',
      use: '收信人认识你，所以不用自我介绍。第一段先回应来信内容，再说明写信意图；第二段按题干给 2~3 个要点；第三段表示感谢并期待回信。',
      paragraphs: [
        'Dear ①,',
        'Thanks for your email. I am so pleased to hear that ②. I am writing this letter in order to ③.',
        'There are at least two factors accounting for my ④. First and foremost, ⑤. Moreover, ⑥. In the end, ⑦.',
        'I would like to express my gratitude for your kind consideration of my ④. I am looking forward to hearing from you soon.',
        'Yours sincerely, Li Ming'
      ],
      blanks: [
        {
          no: 1,
          label: '①',
          hint: '称呼主体（前面已有 Dear）：知道姓写 Mr. Lee / Ms. Lee；只知道名写 Paul；知道职位写 Professor / Editor / Manager；都不知道写 Sir or Madam。',
          sample: 'Paul'
        },
        {
          no: 2,
          label: '②',
          hint: '来信里让你高兴或关心的事，接在 hear that 后面写成完整从句，内容抄题干再改写。',
          sample: 'you are interested in the innovative craft-making exhibition'
        },
        {
          no: 3,
          label: '③',
          hint: '写信意图，in order to 后接动词原形：express my gratitude / clarify some misunderstandings / provide further details about the plan / share my feelings about the video 等。',
          sample: 'provide further details about the plan'
        },
        {
          no: 4,
          label: '④',
          hint: '意图的名词形式，全篇出现两次必须同形：suggestion、invitation、gratitude、apology、application、inquiry。',
          sample: 'suggestion'
        },
        {
          no: 5,
          label: '⑤',
          hint: '第一个要点，写完整句子：时间、地点、活动内容三选一，信息取自题干。',
          sample: 'the exhibition will be held in the student activity center at 8:00 a.m. on Sunday, December 20th'
        },
        {
          no: 6,
          label: '⑥',
          hint: '第二个要点，写完整句子：活动环节、对方需要做的准备或你想补充的细节。',
          sample: 'a series of activities such as craft shows and hands-on sessions will be arranged'
        },
        {
          no: 7,
          label: '⑦',
          hint: '第二段收尾的“画饼”句：这次经历会带来什么收获。',
          sample: 'the experience will be memorable and rewarding'
        }
      ],
      extra: ''
    },
    {
      id: 'ltr-02',
      no: '02',
      kind: '小作文 · 书信',
      title: '主动信（公务 / 邀请）',
      feature: '对方不一定认识你，需要自我介绍',
      example: '邀请信、建议信、申请信、推荐信',
      use: '第一段先自我介绍（题干给了身份就用题干的，没给默认是学生），再说写信意图；第二段给 2~3 个要点；第三段期待回复。',
      paragraphs: [
        'Dear ①,',
        'I am ② at ③. It is my honor to inform you that ④. I am writing to invite you to ⑤.',
        'There are at least three factors accounting for my ⑥. First and foremost, ⑦. Moreover, ⑧. In the end, ⑨.',
        'I would be grateful if you could reply at your earliest convenience.',
        'Yours sincerely, Li Ming'
      ],
      blanks: [
        {
          no: 1,
          label: '①',
          hint: '称呼主体（前面已有 Dear）：对方身份明确时写职位 Professor Smith / Manager / Editor；只知道姓写 Mr. Lee；完全不知道写 Sir or Madam。',
          sample: 'Professor Smith'
        },
        {
          no: 2,
          label: '②',
          hint: '自我介绍的身份：题干给了就照抄，没给默认学生，用 a student / an undergraduate。',
          sample: 'a student in the Art Department'
        },
        {
          no: 3,
          label: '③',
          hint: '所在学校或单位。',
          sample: 'our university'
        },
        {
          no: 4,
          label: '④',
          hint: '活动或事情的概况，接在 inform you that 后写成完整从句，包含时间、地点或主题。',
          sample: 'our university will host the International Innovation Contest'
        },
        {
          no: 5,
          label: '⑤',
          hint: '邀请对方做什么，接在 invite you to 后接动词原形。',
          sample: 'participate in the contest with your team'
        },
        {
          no: 6,
          label: '⑥',
          hint: '意图的名词形式：invitation、suggestion、application、recommendation、inquiry。',
          sample: 'invitation'
        },
        {
          no: 7,
          label: '⑦',
          hint: '第一个要点，写完整句子：活动的时间与地点，一句交代清楚。',
          sample: 'the contest will be held on the playground at 3:00 p.m. on Sunday, December 31st'
        },
        {
          no: 8,
          label: '⑧',
          hint: '第二个要点，写完整句子：活动环节、参与范围或对对方的要求。',
          sample: 'a series of competitions such as robot and aircraft competitions will be held'
        },
        {
          no: 9,
          label: '⑨',
          hint: '第三段的“画饼”或收尾句：对方能从中获得什么。',
          sample: 'this event will offer you a precious opportunity to broaden your horizons'
        }
      ],
      extra: ''
    },
    {
      id: 'ltr-03',
      no: '03',
      kind: '小作文 · 通知',
      title: '通知 / 告示（Notice）',
      feature: '面向全体，公开发布',
      example: '比赛通知、招募通知、活动告示',
      use: '通知等于换了格式的书信。开头写 Notice，第一段通知概况与目的，第二段具体内容（与书信第二段通用），第三段发出邀请并给报名方式。',
      paragraphs: [
        'Notice',
        'It is a pleasure to inform everyone that ① will be held in ② on ③. This notice is intended to introduce some details of ④.',
        'To begin with, ⑤. In addition, ⑥. In the end, ⑦.',
        'Welcome to join us. If you are interested in this activity, please email us at ⑧ to sign up.',
        'The Student Union · December 20, 2025'
      ],
      blanks: [
        {
          no: 1,
          label: '①',
          hint: '活动名称，带冠词：a singing contest / a career fair / an exhibition / a workshop。',
          sample: 'a singing contest'
        },
        {
          no: 2,
          label: '②',
          hint: '举办地点：the assembly hall / the playground / the student activity center / the library。',
          sample: 'the assembly hall'
        },
        {
          no: 3,
          label: '③',
          hint: '举办时间，星期 + 具体时段。',
          sample: 'Friday from 8:00 a.m. to 10:00 a.m.'
        },
        {
          no: 4,
          label: '④',
          hint: '要介绍细节的对象，通常回指活动本身：the contest / the activity / the project。',
          sample: 'the contest'
        },
        {
          no: 5,
          label: '⑤',
          hint: '第一点：时间地点或参与范围，写完整句子。',
          sample: 'students of all grades are eligible to enter the competition'
        },
        {
          no: 6,
          label: '⑥',
          hint: '第二点：活动目的或环节内容，写完整句子。',
          sample: 'the purpose of the contest is to celebrate the upcoming New Year'
        },
        {
          no: 7,
          label: '⑦',
          hint: '第三点：奖励、收获或注意事项，写完整句子。',
          sample: 'the top three winners will receive trophies and certificates'
        },
        {
          no: 8,
          label: '⑧',
          hint: '报名邮箱或联系方式；题目没给就编一个学校邮箱。',
          sample: 'studentunion@university.edu.cn'
        }
      ],
      extra: ''
    },
    {
      id: 'ltr-04',
      no: '04',
      kind: '小作文 · 纪要',
      title: '会议纪要（Minutes of Meeting）',
      feature: '23 年新增题型，尚未考过',
      example: '班会、社团例会、项目讨论',
      use: '纪要格式与通知类似：先写标题与时间、地点、主题、参会人，正文按“导入 → 目的 → 发言 → 赞同 → 决定”展开，最后写记录人与日期。',
      paragraphs: [
        'Minutes of Meeting',
        'Date: ①　Time: ②　Location: ③　Objective: ④　Attendees: ⑤',
        'The meeting commenced with a warm welcome from ⑥, followed by an introduction to the purpose of gathering. The meeting aimed to ⑦. ⑧ expressed the opinion that ⑨. The majority of those attendees were in favour of ⑩. As a concrete measure, the meeting decided that ⑪.',
        'Recorded by: Li Ming · December 23, 2023'
      ],
      blanks: [
        {
          no: 1,
          label: '①',
          hint: '会议日期，月 + 日 + 年。',
          sample: 'December 23, 2023'
        },
        {
          no: 2,
          label: '②',
          hint: '会议时间，起止时间写全。',
          sample: 'From 10:00 a.m. to 11:30 a.m.'
        },
        {
          no: 3,
          label: '③',
          hint: '会议地点：楼栋 + 房间 + 场地类型。',
          sample: 'A111, conference room'
        },
        {
          no: 4,
          label: '④',
          hint: '会议主题，短语即可，改写自题干。',
          sample: 'campus sports development'
        },
        {
          no: 5,
          label: '⑤',
          hint: '参会人，来自题干：All freshmen / Club members / All staff。',
          sample: 'All freshmen'
        },
        {
          no: 6,
          label: '⑥',
          hint: '主持人或致辞人；不确定身份就写 the chairman / the host。',
          sample: 'the chairman'
        },
        {
          no: 7,
          label: '⑦',
          hint: '会议目的，接在 aimed to 后接动词原形：review the activity / make a plan for the activity / discuss the problem。',
          sample: 'review the activity held last week'
        },
        {
          no: 8,
          label: '⑧',
          hint: '发言人，通常与⑥相同或写 the speaker。',
          sample: 'The chairman'
        },
        {
          no: 9,
          label: '⑨',
          hint: '发言人的核心观点，接在 the opinion that 后写成完整从句。',
          sample: 'enough attention must be paid to staff welfare'
        },
        {
          no: 10,
          label: '⑩',
          hint: '被大多数参会者赞同的内容：the statement / the plan / the decision。',
          sample: 'the plan'
        },
        {
          no: 11,
          label: '⑪',
          hint: '会议最终决定，接在 decided that 后写成完整从句。',
          sample: 'a follow-up meeting would be held next month'
        }
      ],
      extra: ''
    }
  ];

  const ZH = {
    'ltr-01': [
      ['亲爱的①：'],
      [
        '感谢你的来信。',
        '得知②，我非常高兴。',
        '我写这封信是为了③。'
      ],
      [
        '至少有两个因素可以解释我的④。',
        '首先，⑤。',
        '此外，⑥。',
        '最后，⑦。'
      ],
      [
        '感谢你认真考虑我的④。',
        '期待很快收到你的回信。'
      ],
      ['谨启，李明']
    ],
    'ltr-02': [
      ['尊敬的①：'],
      [
        '我是③的②。',
        '我很荣幸地通知您，④。',
        '我写信是想邀请您⑤。'
      ],
      [
        '至少有三个因素可以说明我的⑥。',
        '首先，⑦。',
        '此外，⑧。',
        '最后，⑨。'
      ],
      ['如果您能在方便时尽快回复，我将不胜感激。'],
      ['谨启，李明']
    ],
    'ltr-03': [
      ['通知'],
      [
        '很高兴通知大家，①将于③在②举行。',
        '本通知旨在介绍④的一些细节。'
      ],
      [
        '首先，⑤。',
        '此外，⑥。',
        '最后，⑦。'
      ],
      [
        '欢迎加入我们。',
        '如果你对这项活动感兴趣，请发邮件至⑧报名。'
      ],
      ['学生会 · 2025 年 12 月 20 日']
    ],
    'ltr-04': [
      ['会议纪要'],
      ['日期：①　时间：②　地点：③　会议目标：④　参会人：⑤'],
      [
        '会议以⑥的热情欢迎开始，随后介绍了此次会议的目的。',
        '本次会议旨在⑦。',
        '⑧认为，⑨。',
        '大多数参会者赞成⑩。',
        '作为一项具体措施，会议决定⑪。'
      ],
      ['记录人：李明 · 2023 年 12 月 23 日']
    ]
  };

  function get(id) {
    return LETTERS.filter(function (t) { return t.id === id; })[0] || null;
  }

  App.letters = {
    list: LETTERS,
    circles: CIRCLE,
    zh: ZH,
    get: get
  };
})(window.App);
