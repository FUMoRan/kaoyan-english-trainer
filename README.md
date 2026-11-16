# 考研英语高阶训练器

纯静态网页，托管在 GitHub Pages，直接调用你自己的大模型 API Key。三个模块：长难句拆解、模板填空、复盘。

## 目录结构

```
index.html               页面骨架
manifest.webmanifest     PWA 清单（名称、图标、独立窗口）
sw.js                    离线缓存（网络优先，断网回落缓存）
assets/icons/            桌面图标 192 / 512 / maskable
assets/styles.css        样式（含深色模式）
assets/config.js         服务商预设、长难句提示词、模板填空判定提示词
assets/storage.js        本机设置读写
assets/api.js            OpenAI 兼容调用、SSE 流式、中文错误映射
assets/markdown.js       Markdown 渲染、「## 小标题」切分
assets/runner.js         统一的流式生成、状态条、停止、错误展示
assets/review.js         判定报告解析、错空记录（仅存本机）
assets/templates-data.js 七篇整篇连排模板（段落、空位提示、示例）
assets/writing-topics.json 2000–2026 英语一写作题目（含配图与参考范文）
assets/tpl.js            模板填空交互
assets/ui.js             模块切换、设置、长难句、复盘
assets/papers/img/       写作题目配图
assets/vendor/           marked + DOMPurify（本地引入，不依赖 CDN）
proxy/worker.js          可选：Cloudflare Worker 代理（仅智谱等不开放跨域的接口需要）
```

## 部署到 GitHub Pages

1. 新建一个公开仓库，把本目录全部文件上传到仓库根目录。
2. 仓库 **Settings → Pages → Build and deployment**，Source 选 `Deploy from a branch`，Branch 选 `main`，目录选 `/ (root)`，保存。
3. 等一两分钟，访问 `https://你的用户名.github.io/仓库名/`。

不需要构建、不需要 Node 环境。`.nojekyll` 已经放好，避免 Jekyll 处理静态资源。

## 装成本地 App（PWA）

线上地址：<https://fumoran.github.io/kaoyan-english-trainer/>

- **桌面 Chrome / Edge**：打开地址，点地址栏右侧的「安装」图标。
- **Android Chrome**：菜单 →「安装应用」或「添加到主屏幕」。
- **iOS Safari**：分享菜单 →「添加到主屏幕」。

页面本身断网也能打开（`sw.js` 缓存了全部静态资源），但 AI 判定仍要联网。

## 配置 API Key

首次打开点右上角「设置」，选服务商、粘贴 Key、点「测试连接」。

Key 只存在本机浏览器 localStorage，页面没有中间服务器，请求由浏览器直接发给你选的服务商。

### 服务商与跨域

跨域结论来自对接口 OPTIONS 预检的实际测试（2026-10）：

| 服务商 | Base URL | 浏览器直连 |
|---|---|---|
| Kimi / Moonshot | `https://api.moonshot.cn/v1` | 可以 |
| 通义千问 / 阿里百炼 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 可以 |
| 硅基流动 | `https://api.siliconflow.cn/v1` | 可以 |
| OpenRouter | `https://openrouter.ai/api/v1` | 可以（需外网） |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | **不可以**，需代理 |

智谱需要先用 `proxy/worker.js` 建一个 Cloudflare Worker，再把 Worker 地址填到 Base URL。模板填空和长难句只需要普通文本模型，不必用视觉模型。

## 模板填空

- 七篇模板来自「27 考研英语大作文·整篇连排模板（图表·图画·文字）」，按题型分：动态图、静态图、双图表、单图非对话、单图对话、双图对比、文字观点。
- 每篇三段连排，编号 1、2、3… 是空位。同一个编号在文中出现多次时，只填一次，其余位置自动同步。
- 每空都给了汉语提示（说明该槽位要名词短语、完整分句还是动词原形），示例默认折叠，避免直接抄。
- 可以在下拉里选 2000–2026 英语一大作文真题作为练习题目，题干与配图会显示在模板上方，参考范文折叠。
- 填空草稿按模板自动存本机，关掉页面再回来可以接着填。

### AI 怎么判

- 只判空，不改写模板句式；输出分四节：逐空判定、必须改的空、誊写版、错空记录。
- 判定从宽：意思对、语法可接受就算通过，不要求和示例一致；同义表达和不同句式都算对。
- 语法错、槽位错（该填分句却填了名词短语）、空着没填、写中文，才判「需改」。
- 结果页可以点错空编号跳回原句改。
- 「复制我的全文」随时可用：把你填的内容填回模板拼成完整三段，没填的空以 `[编号]` 保留。
- 「复制 AI 修正版」在判定后出现：用 AI 的建议替换掉错空，去掉修改标记后复制整篇英文。

## 复盘

每次判定完成后，错的空位会记到「复盘」：按模板统计错误率，并按空位编号排高频失分点。记录只存本机（localStorage 键 `kaoyan-trainer-tpl-review-v1`），可一键清空。

## 长难句拆解

填一句英文，可选先自己划主干。输出绝对主干、修饰成分、地道翻译、语法点睛；填了主干会并排显示你的版本和参考主干。

## 本地预览

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```
