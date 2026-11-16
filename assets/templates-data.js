/* 27 考研英语大作文·整篇连排模板（数据来源：用户提供的 docx）
   每篇三段连排，空位用 ①②③ 标记；blanks 里是对应的汉语提示与英文示例。 */

window.App = window.App || {};

(function (App) {
  'use strict';

  const CIRCLE = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟';

  const TEMPLATES = [
  {
    "id": "tpl-01",
    "no": "01",
    "kind": "图表作文",
    "title": "动态图（单方向 / 多方向）",
    "feature": "有年份的折线、柱状变化",
    "example": "居民健康素养、快递业务量",
    "use": "看到有年份的折线或柱状变化，先用这一篇。趋势向下时，同步替换 upward → downward、rose → declined。",
    "paragraphs": [
      "The line chart above traces the evolution of ① between ② and ③, a period that witnessed a steady upward trajectory. To be specific, the figure rose gradually from ④ to ⑤ before climbing markedly to ⑥. These statistics point to a broader social reality: ⑦ has been gaining momentum at a remarkable pace in recent years.",
      "Several factors, in my view, converge to account for this encouraging trend. First and foremost, ⑧, which has made ⑨ far more accessible to ordinary people. Furthermore, a growing number of ⑩ now regard ⑪ as integral to ⑫. Most importantly, were we to underestimate the value of ①, we would deprive ourselves of ⑬.",
      "It is not difficult to conclude that due attention must continue to be paid to ①. For one thing, it is imperative that the authorities ⑭. For another, ⑮ ought to throw their weight behind ⑯. Only by pooling the efforts of all sectors of society can we ⑰."
    ],
    "blanks": [
      {
        "no": 1,
        "label": "①",
        "hint": "图表的核心对象：抽象指标写“水平 / 比率 / 数量”，实体写名词短语。全文出现三次，必须始终用同一个词。",
        "sample": "residents' health literacy level"
      },
      {
        "no": 2,
        "label": "②",
        "hint": "图中最早的年份，只写数字。",
        "sample": "2012"
      },
      {
        "no": 3,
        "label": "③",
        "hint": "图中最后的年份，只写数字。",
        "sample": "2021"
      },
      {
        "no": 4,
        "label": "④",
        "hint": "起始数值，必须带单位，并与⑥同一单位。",
        "sample": "8.8%"
      },
      {
        "no": 5,
        "label": "⑤",
        "hint": "中间拐点数值；图中没有拐点，就把 from ④ to ⑤ before 整段删掉。",
        "sample": "11.58%"
      },
      {
        "no": 6,
        "label": "⑥",
        "hint": "结束数值，带单位。",
        "sample": "25.40%"
      },
      {
        "no": 7,
        "label": "⑦",
        "hint": "社会现象概括，名词短语，作 has been gaining momentum 的主语。",
        "sample": "public health awareness"
      },
      {
        "no": 8,
        "label": "⑧",
        "hint": "原因一，写成一个完整分句（主语＋谓语），后面接 which 从句。",
        "sample": "the government has channeled more funds into health education"
      },
      {
        "no": 9,
        "label": "⑨",
        "hint": "因此变得更容易获得的东西。",
        "sample": "reliable medical knowledge"
      },
      {
        "no": 10,
        "label": "⑩",
        "hint": "人群，用复数。",
        "sample": "residents"
      },
      {
        "no": 11,
        "label": "⑪",
        "hint": "被重视的对象，名词或动名词短语。",
        "sample": "regular exercise and a balanced diet"
      },
      {
        "no": 12,
        "label": "⑫",
        "hint": "方面，与 integral to 搭配。",
        "sample": "their physical and mental well-being"
      },
      {
        "no": 13,
        "label": "⑬",
        "hint": "低估主题后会失去的东西，名词短语。",
        "sample": "the very foundation of a fulfilling life"
      },
      {
        "no": 14,
        "label": "⑭",
        "hint": "政府动作，动词原形（It is imperative that 后接虚拟语气）。",
        "sample": "allocate more resources to community health services"
      },
      {
        "no": 15,
        "label": "⑮",
        "hint": "第二个措施主体，复数。",
        "sample": "media outlets"
      },
      {
        "no": 16,
        "label": "⑯",
        "hint": "该主体要大力支持的对象。",
        "sample": "the spread of scientific health knowledge"
      },
      {
        "no": 17,
        "label": "⑰",
        "hint": "目标，动词短语，与 we 搭配。",
        "sample": "build a healthier and more harmonious society"
      }
    ],
    "extra": ""
  },
  {
    "id": "tpl-02",
    "no": "02",
    "kind": "图表作文",
    "title": "静态图（同一年份的占比、排序）",
    "feature": "同一年份的占比、排序",
    "example": "儿童户外活动、劳动课收获",
    "use": "看到饼图、一年之内的柱状对比，用这一篇。全篇不出现 from...to...，只写占比与排序。",
    "paragraphs": [
      "The bar chart above delineates the distribution of ① in ②, with ③ occupying the largest share. To be specific, the proportions of ③, ④, ⑤ and ⑥ stand at ⑦, ⑧, ⑨ and ⑩ respectively. This pattern reflects a broader social reality: ⑪.",
      "A combination of factors has given rise to this trend. To begin with, ⑫, which opens up a broader platform for ⑬ to ⑭. What is more, ⑮ increasingly attach importance to ⑯. Most importantly, were we to underestimate the value of ①, we would lose sight of ⑰.",
      "In summary, it is not difficult to conclude that due attention must be paid to ①. For one thing, it is imperative that the authorities ⑱. For another, ⑲ ought to throw their weight behind this cause. Only by doing so can we ⑳."
    ],
    "blanks": [
      {
        "no": 1,
        "label": "①",
        "hint": "调查或统计的主题，名词短语。",
        "sample": "respondents' views on children's outdoor activities"
      },
      {
        "no": 2,
        "label": "②",
        "hint": "年份；图中没有年份就写 in the survey。",
        "sample": "2026"
      },
      {
        "no": 3,
        "label": "③",
        "hint": "占比最高的那一项，动名词短语。它在首段出现两次，两处必须完全同形。",
        "sample": "satisfying curiosity"
      },
      {
        "no": 4,
        "label": "④",
        "hint": "第二项，与③同一语法形式。",
        "sample": "developing observational skills"
      },
      {
        "no": 5,
        "label": "⑤",
        "hint": "第三项。",
        "sample": "strengthening physical fitness"
      },
      {
        "no": 6,
        "label": "⑥",
        "hint": "第四项。项目多于四项时只留前三项，第四项改写成 and other items。",
        "sample": "enhancing parent-child interaction"
      },
      {
        "no": 7,
        "label": "⑦",
        "hint": "③对应的百分比。",
        "sample": "54.6%"
      },
      {
        "no": 8,
        "label": "⑧",
        "hint": "④对应的百分比。",
        "sample": "54.5%"
      },
      {
        "no": 9,
        "label": "⑨",
        "hint": "⑤对应的百分比。",
        "sample": "37.2%"
      },
      {
        "no": 10,
        "label": "⑩",
        "hint": "⑥对应的百分比。",
        "sample": "33.2%"
      },
      {
        "no": 11,
        "label": "⑪",
        "hint": "社会现象句的落点，写成完整从句（谁重视什么）。",
        "sample": "parents attach greater importance to children's all-round development"
      },
      {
        "no": 12,
        "label": "⑫",
        "hint": "原因一，完整分句，后面接 which 从句。",
        "sample": "public facilities have been improved considerably"
      },
      {
        "no": 13,
        "label": "⑬",
        "hint": "受益人群。",
        "sample": "children"
      },
      {
        "no": 14,
        "label": "⑭",
        "hint": "动词短语，与 open up a platform for sb. to 搭配。",
        "sample": "explore the natural world"
      },
      {
        "no": 15,
        "label": "⑮",
        "hint": "原因二的主体，用复数。",
        "sample": "parents"
      },
      {
        "no": 16,
        "label": "⑯",
        "hint": "他们越来越重视的对象。",
        "sample": "outdoor experience"
      },
      {
        "no": 17,
        "label": "⑰",
        "hint": "低估主题后会忽略的东西。",
        "sample": "the joy of a well-rounded childhood"
      },
      {
        "no": 18,
        "label": "⑱",
        "hint": "政府动作，动词原形。",
        "sample": "build more safe and accessible playgrounds"
      },
      {
        "no": 19,
        "label": "⑲",
        "hint": "第二个措施主体，复数。",
        "sample": "schools and communities"
      },
      {
        "no": 20,
        "label": "⑳",
        "hint": "目标，动词短语。",
        "sample": "strike a balance between physical exercise and intellectual growth"
      }
    ],
    "extra": ""
  },
  {
    "id": "tpl-03",
    "no": "03",
    "kind": "图表作文",
    "title": "双图表（左图＋右图）",
    "feature": "左右两幅图并列",
    "example": "养老机器人态度＋担忧",
    "use": "左右两幅图，无论静静、动静还是动动，都用这一篇；只换两幅图各自的主题词与数据。",
    "paragraphs": [
      "The chart on the left portrays ①, while the chart on the right delineates ②. To be specific, the proportions of ③, ④ and ⑤ stand at ⑥, ⑦ and ⑧ respectively. Notably, ⑨ tops the list of concerns at ⑩. The two charts jointly reveal that ⑪.",
      "Several factors converge to account for this mixed picture. First and foremost, ⑫, which explains why ⑬. Furthermore, ⑭ has gradually ⑮. Most importantly, were we to ignore ⑯, we would expose the public to avoidable risks.",
      "All in all, we should bear in mind that ① is not a mere option but a necessity. For one thing, it is imperative that the authorities ⑰. For another, ⑱ ought to ⑲. Only through their joint efforts can we ⑳."
    ],
    "blanks": [
      {
        "no": 1,
        "label": "①",
        "hint": "左图主题，名词短语。第三段还会复用，全文保持一致。",
        "sample": "consumers' attitudes towards elderly-care robots"
      },
      {
        "no": 2,
        "label": "②",
        "hint": "右图主题，名词短语，与①结构平行。",
        "sample": "their principal concerns about such devices"
      },
      {
        "no": 3,
        "label": "③",
        "hint": "左图第一项。",
        "sample": "full acceptance"
      },
      {
        "no": 4,
        "label": "④",
        "hint": "左图第二项。",
        "sample": "partial acceptance"
      },
      {
        "no": 5,
        "label": "⑤",
        "hint": "左图第三项。",
        "sample": "rejection"
      },
      {
        "no": 6,
        "label": "⑥",
        "hint": "③对应百分比。",
        "sample": "39.3%"
      },
      {
        "no": 7,
        "label": "⑦",
        "hint": "④对应百分比。",
        "sample": "32.8%"
      },
      {
        "no": 8,
        "label": "⑧",
        "hint": "⑤对应百分比。",
        "sample": "27.9%"
      },
      {
        "no": 9,
        "label": "⑨",
        "hint": "右图占比最高的那一项。",
        "sample": "safety"
      },
      {
        "no": 10,
        "label": "⑩",
        "hint": "⑨对应百分比。",
        "sample": "46.3%"
      },
      {
        "no": 11,
        "label": "⑪",
        "hint": "两图共同结论，一句话同时覆盖左右两图。",
        "sample": "robots are widely welcomed, yet safety remains a pressing worry"
      },
      {
        "no": 12,
        "label": "⑫",
        "hint": "原因一，完整分句。",
        "sample": "an ageing population has made round-the-clock care a pressing need"
      },
      {
        "no": 13,
        "label": "⑬",
        "hint": "被解释的现象。",
        "sample": "robotic assistance is widely accepted"
      },
      {
        "no": 14,
        "label": "⑭",
        "hint": "原因二主体（常写产业、技术、政策）。",
        "sample": "manufacturers' relentless pursuit of innovation"
      },
      {
        "no": 15,
        "label": "⑮",
        "hint": "过去分词，与 has gradually 构成现在完成时。",
        "sample": "improved the reliability of such products"
      },
      {
        "no": 16,
        "label": "⑯",
        "hint": "不可忽视的隐患。",
        "sample": "safety concerns"
      },
      {
        "no": 17,
        "label": "⑰",
        "hint": "政府动作，动词原形。",
        "sample": "formulate strict safety standards and supervise their implementation"
      },
      {
        "no": 18,
        "label": "⑱",
        "hint": "第二个措施主体，复数。",
        "sample": "enterprises and researchers"
      },
      {
        "no": 19,
        "label": "⑲",
        "hint": "他们的动作，动词原形。",
        "sample": "improve product quality and win public trust"
      },
      {
        "no": 20,
        "label": "⑳",
        "hint": "目标，动词短语。",
        "sample": "ensure that technology truly serves the elderly"
      }
    ],
    "extra": ""
  },
  {
    "id": "tpl-04",
    "no": "04",
    "kind": "图画作文",
    "title": "单图（非对话型）",
    "feature": "有画面无对话",
    "example": "龙舟、公园锻炼",
    "use": "画面里没有对话，只有环境、人物、动作与表情时，用这一篇；对话型见下一篇。",
    "paragraphs": [
      "As is symbolically depicted in the cartoon above, ① ② ③, ④, with ⑤. Simple as the drawing is, it conveys a truth that cannot be overstated: ⑥ is indispensable to ⑦.",
      "Several factors, in my view, converge to explain why ⑥ matters. To begin with, ⑧, which connects ⑨ with ⑩. What is more, ⑪ not only ⑫ but also ⑬. Most importantly, were we to turn a blind eye to ⑥, we would deprive future generations of ⑭.",
      "In summary, due attention must be paid to ⑥ by both individuals and society. For one thing, it is imperative that the authorities ⑮. For another, schools and the media ought to ⑯. Only by pooling the efforts of all sectors of society can we ⑰."
    ],
    "blanks": [
      {
        "no": 1,
        "label": "①",
        "hint": "环境状语，介词短语。环境看不清就写 in the middle of the picture。",
        "sample": "on a winding river"
      },
      {
        "no": 2,
        "label": "②",
        "hint": "倒装的谓语动词，与③的单复数一致。",
        "sample": "stand / stands / runs"
      },
      {
        "no": 3,
        "label": "③",
        "hint": "画面主体，名词短语。",
        "sample": "two girls"
      },
      {
        "no": 4,
        "label": "④",
        "hint": "现在分词短语，写主要动作。",
        "sample": "rowing a dragon boat in unison"
      },
      {
        "no": 5,
        "label": "⑤",
        "hint": "with 复合结构，写表情或心态；想不起来就把它和前面的逗号一起删掉。",
        "sample": "with determination gleaming in their eyes"
      },
      {
        "no": 6,
        "label": "⑥",
        "hint": "主题词，必须具体到事，不能只写 importance。",
        "sample": "traditional culture"
      },
      {
        "no": 7,
        "label": "⑦",
        "hint": "方面，与 indispensable to 搭配。",
        "sample": "a nation's identity and vitality"
      },
      {
        "no": 8,
        "label": "⑧",
        "hint": "原因一，完整分句。",
        "sample": "festivals carry the collective memory of a nation"
      },
      {
        "no": 9,
        "label": "⑨",
        "hint": "被连接的对象一。",
        "sample": "the young"
      },
      {
        "no": 10,
        "label": "⑩",
        "hint": "被连接的对象二。",
        "sample": "their cultural roots"
      },
      {
        "no": 11,
        "label": "⑪",
        "hint": "原因二主体，与 not only...but also... 搭配。",
        "sample": "such activities"
      },
      {
        "no": 12,
        "label": "⑫",
        "hint": "好处一，动词原形。",
        "sample": "strengthen physical fitness"
      },
      {
        "no": 13,
        "label": "⑬",
        "hint": "好处二，动词原形。",
        "sample": "foster a sense of belonging"
      },
      {
        "no": 14,
        "label": "⑭",
        "hint": "失去的东西，名词短语。",
        "sample": "the very identity that distinguishes us"
      },
      {
        "no": 15,
        "label": "⑮",
        "hint": "政府动作，动词原形。",
        "sample": "allocate more resources to the protection of intangible heritage"
      },
      {
        "no": 16,
        "label": "⑯",
        "hint": "学校与媒体的动作，动词原形。",
        "sample": "encourage the young to experience traditional customs firsthand"
      },
      {
        "no": 17,
        "label": "⑰",
        "hint": "目标，动词短语，与 we 搭配。",
        "sample": "keep our cultural heritage alive"
      }
    ],
    "extra": ""
  },
  {
    "id": "tpl-05",
    "no": "05",
    "kind": "图画作文",
    "title": "单图（对话型）",
    "feature": "人物在说话",
    "example": "校园讲座、读书",
    "use": "画面里有两个或多个人物在说话，用这一篇；不要直引原话，一律转述成 that 从句。",
    "paragraphs": [
      "As is symbolically depicted in the cartoon above, ① ② ③, ④. One remarks that ⑤; the other, however, contends that ⑥. Simple as the drawing is, it conveys a truth that cannot be overstated: ⑦ is of vital importance to ⑧.",
      "Several factors, in my view, converge to explain this divergence of opinion. To begin with, ⑨, which explains why ⑩. What is more, ⑪ tend to ⑫ when ⑬. Most importantly, were we to ⑭, we would ⑮.",
      "In summary, due attention must be paid to ⑦ by both individuals and society. For one thing, it is imperative that the authorities ⑯. For another, ⑰ ought to ⑱. Only by doing so can we embrace a more open-minded and inclusive world."
    ],
    "blanks": [
      {
        "no": 1,
        "label": "①",
        "hint": "环境状语，介词短语。",
        "sample": "in front of a notice board"
      },
      {
        "no": 2,
        "label": "②",
        "hint": "倒装谓语动词，与③单复数一致。",
        "sample": "stand / sits"
      },
      {
        "no": 3,
        "label": "③",
        "hint": "人物主体，用复数。",
        "sample": "two girls"
      },
      {
        "no": 4,
        "label": "④",
        "hint": "现在分词短语，写他们在谈论什么。",
        "sample": "talking about campus lectures"
      },
      {
        "no": 5,
        "label": "⑤",
        "hint": "第一个人的观点，转述成 that 从句。",
        "sample": "the lecture is irrelevant to her major and therefore a waste of time"
      },
      {
        "no": 6,
        "label": "⑥",
        "hint": "第二个人的观点，与⑤形成对照。",
        "sample": "such lectures are beneficial nonetheless"
      },
      {
        "no": 7,
        "label": "⑦",
        "hint": "讨论的主题词（多为抽象名词）。",
        "sample": "an open mind"
      },
      {
        "no": 8,
        "label": "⑧",
        "hint": "方面，与 of vital importance to 搭配。",
        "sample": "personal growth"
      },
      {
        "no": 9,
        "label": "⑨",
        "hint": "原因一，完整分句。",
        "sample": "students' horizons are broadened by subjects beyond their own field"
      },
      {
        "no": 10,
        "label": "⑩",
        "hint": "被解释的现象。",
        "sample": "such lectures deserve a place on campus"
      },
      {
        "no": 11,
        "label": "⑪",
        "hint": "原因二主体，用复数。",
        "sample": "young people"
      },
      {
        "no": 12,
        "label": "⑫",
        "hint": "动词短语，与 tend to 搭配。",
        "sample": "benefit from exposure to unfamiliar ideas"
      },
      {
        "no": 13,
        "label": "⑬",
        "hint": "条件状语从句（when 引导）。",
        "sample": "they step out of their comfort zone"
      },
      {
        "no": 14,
        "label": "⑭",
        "hint": "错误做法，动词短语。",
        "sample": "dismiss whatever lies beyond our own major"
      },
      {
        "no": 15,
        "label": "⑮",
        "hint": "后果，动词短语。",
        "sample": "shut ourselves off from a wider world"
      },
      {
        "no": 16,
        "label": "⑯",
        "hint": "政府或学校动作，动词原形。",
        "sample": "encourage interdisciplinary learning on campus"
      },
      {
        "no": 17,
        "label": "⑰",
        "hint": "第二个措施主体，用复数。",
        "sample": "teachers and student organizations"
      },
      {
        "no": 18,
        "label": "⑱",
        "hint": "他们的动作，动词原形。",
        "sample": "organize more accessible and diverse lectures"
      }
    ],
    "extra": ""
  },
  {
    "id": "tpl-06",
    "no": "06",
    "kind": "图画作文",
    "title": "双图对比（可套一图一表）",
    "feature": "左右两幅对比图",
    "example": "写作业 vs 躺沙发",
    "use": "左右两幅对比图用这一篇；若是一幅图画加一张图表，把首段换成表格下方的替换句即可，二、三段不动。",
    "paragraphs": [
      "The two cartoons, when placed side by side, present a thought-provoking contrast: ①, whereas ②. Simple as the drawings are, they convey a truth that cannot be overstated: ③.",
      "Several factors, in my view, converge to explain why ③ matters. To begin with, ④, which ⑤. What is more, ⑥ not only ⑦ but also ⑧. Most importantly, were we to ⑨, we would ⑩.",
      "In summary, due attention must be paid to ③ by both individuals and society. For one thing, it is imperative that ⑪. For another, ⑫ ought to ⑬. Only in this way can we ⑭."
    ],
    "blanks": [
      {
        "no": 1,
        "label": "①",
        "hint": "左图：主体＋主要动作，写成一个完整分句。",
        "sample": "the girl in the left picture sits at her desk, fully absorbed in her homework"
      },
      {
        "no": 2,
        "label": "②",
        "hint": "右图：主体＋主要动作，与①结构平行。",
        "sample": "the boy in the right picture lies on the sofa, putting off his work"
      },
      {
        "no": 3,
        "label": "③",
        "hint": "两图共同的寓意（一个名词短语，不要写成句子）。",
        "sample": "self-discipline"
      },
      {
        "no": 4,
        "label": "④",
        "hint": "原因一，完整分句。",
        "sample": "self-discipline determines how efficiently we use our time"
      },
      {
        "no": 5,
        "label": "⑤",
        "hint": "它带来的结果，动词短语。",
        "sample": "separates those who make steady progress from those who merely drift"
      },
      {
        "no": 6,
        "label": "⑥",
        "hint": "原因二主体。",
        "sample": "a disciplined routine"
      },
      {
        "no": 7,
        "label": "⑦",
        "hint": "好处一，动词原形。",
        "sample": "keep us focused on long-term goals"
      },
      {
        "no": 8,
        "label": "⑧",
        "hint": "好处二，动词原形。",
        "sample": "free us from endless distractions"
      },
      {
        "no": 9,
        "label": "⑨",
        "hint": "错误做法，动词短语。",
        "sample": "surrender to instant gratification"
      },
      {
        "no": 10,
        "label": "⑩",
        "hint": "后果，动词短语。",
        "sample": "find ourselves left behind in an increasingly competitive world"
      },
      {
        "no": 11,
        "label": "⑪",
        "hint": "措施一，写“谁＋做什么”，动词用原形。",
        "sample": "students set realistic schedules for themselves"
      },
      {
        "no": 12,
        "label": "⑫",
        "hint": "措施二主体，用复数。",
        "sample": "parents and teachers"
      },
      {
        "no": 13,
        "label": "⑬",
        "hint": "他们的动作，动词原形。",
        "sample": "guide the young towards healthy daily habits"
      },
      {
        "no": 14,
        "label": "⑭",
        "hint": "目标，动词短语。",
        "sample": "grow into self-reliant and responsible adults"
      }
    ],
    "extra": "替换｜一图一表的替换首段：As is vividly depicted in the cartoon and clearly illustrated in the chart above, ①, and ②. 其中①写图画里的人物与动作，②写图表的总体趋势或数值；第二、三段照用。"
  },
  {
    "id": "tpl-07",
    "no": "07",
    "kind": "文字作文",
    "title": "观点类材料（是否同意）",
    "feature": "英文材料＋是否同意",
    "example": "不确定性、坦诚与信任",
    "use": "题干给一段英文、要求评论作者观点时，用这一篇；先把原文改写，再表态，最后照搬通用二三段。",
    "paragraphs": [
      "Nowadays, ① has become a subject of widespread concern. The author maintains that ②. ③",
      "Several factors converge to account for the value of ④. First and foremost, ⑤, for it ⑥. Furthermore, ⑦. Most importantly, were we to ⑧, we would eventually ⑨.",
      "In summary, we should bear in mind that ④ matters more than ⑩. For one thing, it is imperative that ⑪. For another, ⑫ ought to ⑬. Only in this way can we ⑭."
    ],
    "blanks": [
      {
        "no": 1,
        "label": "①",
        "hint": "把原文描述的现象概括成名词短语，不要照抄整句。",
        "sample": "gaining trust in the workplace"
      },
      {
        "no": 2,
        "label": "②",
        "hint": "作者观点，写成一个 that 从句的内容（句中已有 that，这里不要再写 that），用一般现在时。",
        "sample": "people are perceived as less biased and more willing to tell the truth when uncertainty is communicated transparently"
      },
      {
        "no": 3,
        "label": "③",
        "hint": "表态句，三选一，不能省略。",
        "sample": "I find myself in full agreement with this viewpoint. / I strongly disagree with the author's opinion. / While I share the author's view to some extent, I would add that..."
      },
      {
        "no": 4,
        "label": "④",
        "hint": "讨论的核心概念，一个名词短语，全文复用。",
        "sample": "honesty about uncertainty"
      },
      {
        "no": 5,
        "label": "⑤",
        "hint": "原因一，完整分句。",
        "sample": "admitting what we do not know is the first step towards genuine expertise"
      },
      {
        "no": 6,
        "label": "⑥",
        "hint": "它带来的结果，动词短语。",
        "sample": "leaves room for learning and correction"
      },
      {
        "no": 7,
        "label": "⑦",
        "hint": "原因二，完整分句（可写他人或社会的反应）。",
        "sample": "colleagues and clients are more likely to trust those who speak frankly"
      },
      {
        "no": 8,
        "label": "⑧",
        "hint": "错误做法，动词短语。",
        "sample": "conceal our doubts behind overconfidence"
      },
      {
        "no": 9,
        "label": "⑨",
        "hint": "后果，动词短语。",
        "sample": "damage the very credibility we seek to protect"
      },
      {
        "no": 10,
        "label": "⑩",
        "hint": "与④形成对比的对象。",
        "sample": "a flawless facade"
      },
      {
        "no": 11,
        "label": "⑪",
        "hint": "机构动作，动词原形。",
        "sample": "institutions cultivate a culture in which admitting mistakes is respectable"
      },
      {
        "no": 12,
        "label": "⑫",
        "hint": "措施二主体。",
        "sample": "individuals"
      },
      {
        "no": 13,
        "label": "⑬",
        "hint": "他们的动作，动词原形。",
        "sample": "replace boastful claims with candid communication"
      },
      {
        "no": 14,
        "label": "⑭",
        "hint": "目标，动词短语。",
        "sample": "build relationships founded on mutual trust"
      }
    ],
    "extra": ""
  }
];

  const STEPS = [
    '选篇：按题型定编号，只背这一篇，不要七篇混着记。',
    '填词：先定主题词（全篇复用同一个词），再填数据，最后填原因与措施。',
    '删句：字数超了先删带逗号的插入语，再删第二个措施；不要临场改写长句。',
    '检查：主谓一致、时态、单复数、拼写，重点看每个句子的谓语。'
  ];

  function get(id) {
    return TEMPLATES.filter(function (t) { return t.id === id; })[0] || null;
  }

  /* 把段落拆成纯文本与空位交错的结构，便于渲染输入框 */
  function splitParagraph(text) {
    const out = [];
    let buf = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const n = CIRCLE.indexOf(ch);
      if (n >= 0) {
        if (buf) out.push({ type: 'text', text: buf });
        out.push({ type: 'blank', no: n + 1, label: ch });
        buf = '';
      } else {
        buf += ch;
      }
    }
    if (buf) out.push({ type: 'text', text: buf });
    return out;
  }

  App.templates = {
    list: TEMPLATES,
    steps: STEPS,
    circles: CIRCLE,
    get: get,
    splitParagraph: splitParagraph
  };
})(window.App);
