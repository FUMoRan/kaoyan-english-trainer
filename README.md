# 考研英语高阶训练器

纯静态网页，托管在 GitHub Pages，直接调用你自己的大模型 API Key。三个模块：长难句拆解、高级句型改写、作文拍照批改。

## 目录结构

```
index.html              页面骨架
manifest.webmanifest    PWA 清单（名称、图标、独立窗口）
sw.js                   离线缓存（网络优先，断网回落缓存）
assets/icons/           桌面图标 192 / 512 / maskable
assets/styles.css       样式（含深色模式）
assets/config.js        服务商预设、题型与评分档位、提示词
assets/calibration.js   评分标尺样本（近几年真题题目 + 档位构造）
assets/storage.js       本机设置读写
assets/image.js         图片压缩、EXIF 方向校正、HEIC 兜底
assets/api.js           OpenAI 兼容调用、SSE 流式、中文错误映射
assets/markdown.js      Markdown 渲染与「## 小标题」切分
assets/ui.js            交互逻辑
assets/vendor/          marked + DOMPurify（本地引入，不依赖 CDN）
proxy/worker.js         可选：Cloudflare Worker 代理（仅智谱等不开放跨域的接口需要）
```

## 部署到 GitHub Pages

1. 新建一个公开仓库，把本目录全部文件上传到仓库根目录。
2. 仓库 **Settings → Pages → Build and deployment**，Source 选 `Deploy from a branch`，Branch 选 `main`，目录选 `/ (root)`，保存。
3. 等一两分钟，访问 `https://你的用户名.github.io/仓库名/`。

不需要构建、不需要 Node 环境。`.nojekyll` 已经放好，避免 Jekyll 处理静态资源。

如果 GitHub Pages 打开慢，多半是 `assets/vendor/` 没上传成功（marked/Purify 是本地文件，不走 CDN）。

## 装成本地 App（PWA）

线上地址：<https://fumoran.github.io/kaoyan-english-trainer/>

- **桌面 Chrome / Edge**：打开上面的地址，点地址栏右侧的「安装」图标（或在菜单里找「安装 考研英语高阶训练器」）。装好后开始菜单/桌面会出现独立图标，点开是无地址栏的独立窗口。
- **Android Chrome**：菜单 →「安装应用」或「添加到主屏幕」。
- **iOS Safari**：分享菜单 →「添加到主屏幕」。

装好之后页面本身断网也能打开（`sw.js` 缓存了全部静态资源），但批改仍要联网——模型接口是跨域的，Service Worker 不接管。

改版后不用手动清缓存：`sw.js` 用「网络优先、断网回缓存」的策略，联网打开一次就会自动更新。Key 存在浏览器 localStorage，桌面 App 和普通标签页是同一份。

## 配置 API Key

首次打开点右上角「设置」，三件事：

1. 选服务商（自动带出 Base URL 和模型名）
2. 粘贴 Key
3. 点「测试连接」，显示「连接正常」就可以用了

Key 只存在本机浏览器 localStorage，页面没有中间服务器，请求由浏览器直接发给你选的服务商。

### 服务商与跨域

跨域结论来自对接口 OPTIONS 预检的实际测试（2026-10）：

| 服务商 | Base URL | 视觉模型示例 | 浏览器直连 |
|---|---|---|---|
| Kimi / Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k-vision-preview` | 可以 |
| 通义千问 / 阿里百炼 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-vl-max` | 可以 |
| 硅基流动 | `https://api.siliconflow.cn/v1` | `Qwen/Qwen2.5-VL-72B-Instruct` | 可以 |
| OpenRouter | `https://openrouter.ai/api/v1` | `google/gemini-2.5-flash` | 可以（需外网） |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4v-plus` | **不可以**，需代理 |

智谱需要先用 `proxy/worker.js` 建一个 Cloudflare Worker（Key 存 Worker 变量里），再把 Worker 地址填到 Base URL。Worker 部署步骤写在该文件开头。

模型名会随厂商更新，报 404 时先回来改成账号里可用的视觉模型——普通文本模型看不懂图片。

## 评分是怎么定的

- 按英语一/英语二、大作文/小作文分别使用大纲档位（英一 20 分、英二 15 分、应用文 10 分），先定档，再在档内给具体分。
- 只批改单段时，先说明该段在整篇中的功能，再给该段档位和整篇预估区间，并标注「基于单段的估算」。
- `assets/calibration.js` 里有四份标尺样本，题目取自 2023/2024/2025 英语一真题（龙舟赛、公园与公园数量、耐用消费品拥有量、招募通知），每份给出档位和判分理由，用来校准模型的宽严度。
- 这些分数是按档位构造的教学参照，不是官方公布的单篇得分（官方不公布），样本原文也是按档位写的，不要当作官方范文背诵。

## 三点使用建议

1. **两阶段批改**：先「识别原文」，识别结果可以手动改，确认无误再批改。手写连笔容易认错字母，不改就直接批改会把识别错误算成你的拼写错误。
2. **拍清楚**：只拍要批改的那一段，字占满画面、光线均匀，识别率最高。
3. **填题目**：不填题目时模型只能保守估分，档位会偏中间。

## 本地预览

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```
