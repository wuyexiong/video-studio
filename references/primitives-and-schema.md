# `video_project.json` Schema & 10 Universal Remotion Primitives

All renders in `video-studio` are 100% data-driven via a single `video_project.json` manifest placed in the user's active workspace. You do NOT need to copy `node_modules` or scaffold a new React project in the user's workspace.

---

## 1. Top-Level `video_project.json` Structure

```json
{
  "slug": "adanotch_deepdive",
  "title": "Adanotch 深度拆解",
  "archetype": "teardown",
  "voice_mode": "clone",
  "default_preset": "mix",
  "speed_factor": 1.10,
  "fps": 30,
  "show_waveform": true,
  "captures": [
    {
      "url": "https://example.com",
      "output": "./assets/web_demo.mp4",
      "durationSec": 4.5,
      "fps": 60,
      "viewport": { "width": 1280, "height": 800 },
      "startScrollY": 0,
      "endScrollY": 850,
      "sliderActions": [
        { "selector": "#simUv", "from": 3000, "to": 22000, "step": 500, "startRatio": 0.55, "endRatio": 0.90 }
      ],
      "clickSelectors": [
        { "selector": "#pricing-tab", "atRatio": 0.30 }
      ]
    }
  ],
  "chapters": [
    {
      "title": "痛点钩子",
      "chapter_tail_pause_ms": 560,
      "scenes": [
        {
          "id": "ch1_s1",
          "primitive": "focus_hud_demo",
          "preset": "mix",
          "pause_after_ms": 340,
          "clauses": [
            {
              "tts_text": "挂三个终端跑 Claude Code，",
              "display_text": "挂三个终端跑 Claude Code"
            },
            {
              "tts_text": "最烦切窗口点 Allow？",
              "display_text": "最烦来回切窗口点 Allow？"
            }
          ],
          "data": { ... }
        }
      ]
    }
  ]
}
```

### Voice Preset Rules (`/Users/hahaxiong/Toos/VoiceClone/AGENTS.md`)
- `"mix"`: Default for Chinese + English tech terms (`Claude Code`, `SaaS`, `GitHub`, `Allow`). Automatically sends `text_lang: "zh"` so English words are never dropped.
- `"zh"`: Grounded pure-Chinese deep narrative voice — ideal for opening theses, philosophical transitions, and closing takeaways.
- `"en"`: Pure English narration (`text_lang: "en"`) for global Product Hunt / X / YouTube English videos.
- **1:1 Verbatim Subtitle Law**: `display_text` must contain the **exact same words** spoken in `tts_text`! Only convert spoken digits/symbols into Arabic numerals/symbols (`tts_text: "首周流水不到一千美金。"` -> `display_text: "首周流水不到 $1,000"`). Never put unspoken summary words in `display_text` (put summary titles in `scene.data` card fields instead!). `build_video.py` enforces this automatically via `Subtitle Sync Violation` lint error.

---

## 2. The 10 Universal Visual Primitives (`scene.primitive` & `scene.data`)

Never place the same `primitive` back-to-back! Alternate across these 10 primitives:

### ① `chapter_card` — 全屏琥珀竖线呼吸转场 / 核心结论卡
Best for: Chapter openings (every 45–60s), thesis statements, final summary takeaways (`85%` whitespace).
```json
"primitive": "chapter_card",
"data": {
  "eyebrow": "CHAPTER 02 · ARCHITECTURE",
  "headline": "砍掉 12 项桌面玩具",
  "subheadline": "只做 AI Agent 审批止痛药",
  "tone": "emerald",
  "pills": ["⚡ MVP 工期：10~14 天", "💰 买断毛利 92.3%"]
}
```

### ② `persona_quote` — 人物圆头像 + 身份胶囊 + 原话金句卡
Best for: YouTube secondary explainer speaker intros (e.g., Karpathy), founder profiles, expert quotes.
```json
"primitive": "persona_quote",
"data": {
  "name": "Andrej Karpathy",
  "avatarMonogram": "AK",
  "avatarFile": "./assets/karpathy.jpg",
  "role": "前 OpenAI 创始成员 · Tesla AI 总监",
  "badges": ["⚙️ OpenAI 创始团队", "⚡ Vibe Coding 提出者"],
  "quote": "大型语言模型本质上就只有两个文件：参数文件与运行代码。",
  "source": "Intro to Large Language Models · YouTube (4.3M Views)"
}
```
*(Note: `avatarFile` is optional; if omitted, `avatarMonogram` renders a clean matte monogram circle.)*

### ③ `dot_matrix_stat` — 百格/千人点阵比例高亮 + 巨型等宽数字
Best for: Sharp proportions, conversion rates, rarity hooks (`0.2%`), benchmark dominance.
```json
"primitive": "dot_matrix_stat",
"data": {
  "gridCaption": "全球 1,000 名 AI 使用者抽样",
  "highlightDots": 2,
  "tone": "amber",
  "metricValue": "0.2%",
  "metricLabel": "真正用前沿模型处理复杂编程与数学",
  "badges": ["</> 深度编码", "Σ 复杂推理"]
}
```

### ④ `flow_3node` — SVG 路径动态生长的 2~4 节点机制/漏斗流图
Best for: Technical pipelines, local-first cost structures, SaaS acquisition funnels, GitHub call chains.
```json
"primitive": "flow_3node",
"data": {
  "nodes": [
    { "tag": "01 · INPUT", "title": "本机会话监听", "subtitle": "~/.claude · 免 API Key", "tone": "amber" },
    { "tag": "02 · ENGINE", "title": "Swift 6 刘海面板", "subtitle": "NSPanel 零焦点抢占", "tone": "neutral" },
    { "tag": "03 · MARGIN", "bigValue": "$0.00", "title": "月均云算力成本", "badge": "净毛利 92.3%", "tone": "emerald" }
  ]
}
```

### ⑤ `matrix_compare` — 2~3 列红绿琥珀语义对比矩阵
Best for: Attack vs. Defense, Competitor teardowns, Hands-on Pros vs. Cons, Old vs. New paradigm.
```json
"primitive": "matrix_compare",
"data": {
  "columns": [
    {
      "header": "核心入口",
      "tone": "neutral",
      "items": [
        { "title": "① 免费试用注册", "detail": "赠送 5 分钟 AI 额度" },
        { "title": "② 异步转写任务", "detail": "调用云端 GPU 推理" }
      ]
    },
    {
      "header": "恶意薅羊毛攻击",
      "tone": "coral",
      "items": [
        { "title": "脚本批量注册", "detail": "1,000 账号 / 分钟", "badge": "突破口" },
        { "title": "并发请求灌爆", "detail": "30 分钟账单 -$3,000", "badge": "高危" }
      ]
    },
    {
      "header": "必做防御底线",
      "tone": "emerald",
      "items": [
        { "title": "真人验证拦截", "detail": "Cloudflare Turnstile", "badge": "零成本" },
        { "title": "单日硬上限熔断", "detail": "Rate Limit + 余额锁", "badge": "止损" }
      ]
    }
  ]
}
```

### ⑥ `focus_hud_demo` — 景深虚化背景卡 + 前景悬浮交互点击演示
Best for: Opening pain-point hooks, permission popups, UX micro-moment spotlights.
```json
"primitive": "focus_hud_demo",
"data": {
  "backdropCards": [
    { "title": "Terminal 01 · Claude Code", "code": "$ npm run build", "status": "⏸ 等待确认" },
    { "title": "Terminal 02 · Codex CLI", "code": "$ git push origin", "status": "⏸ 阻塞 40s" },
    { "title": "Terminal 03 · Cursor", "code": "$ pytest tests/", "status": "⏸ 待授权" }
  ],
  "hudTitle": "Claude Code · Tool Permission",
  "hudBadge": "5h Quota · 78%",
  "promptText": "⚡ Bash(npm run deploy:prod)",
  "primaryAction": "Allow",
  "clickedLabel": "Allowed",
  "secondaryAction": "Deny",
  "clickKeyword": "Allow"
}
```

### ⑦ `live_web_showcase` — 60fps 真动态网页/录屏视频流 + 侧边弹出取证卡
Best for: Real Chrome web recordings (`captures[]`), Screen Studio `.mp4` hands-on clips, product demos.
```json
"primitive": "live_web_showcase",
"data": {
  "videoFile": "./assets/web_demo.mp4",
  "footnote": "adanotch.com · Live Chrome 60fps Capture",
  "callout": {
    "tone": "coral",
    "badge": "⚠️ 冷启动实证",
    "title": "15 合 1 功能堆砌陷阱",
    "bigMetric": "< $1,000",
    "note": "Product Hunt #25 (64 票) · 首周真实流水预估"
  }
}
```

### ⑧ `terminal_code_live` — 极简终端 / 源码逐行生长与高亮流
Best for: GitHub repo install/run demos, CLI tools, code vulnerability vs. fix walkthroughs.
```json
"primitive": "terminal_code_live",
"data": {
  "windowTitle": "zsh · github.com/ browser-use/browser-use",
  "badge": "MIT License · 42.8k Stars",
  "lines": [
    { "kind": "comment", "text": "# 1. 一键安装本地浏览器自动化 Agent" },
    { "kind": "cmd", "text": "$ uv pip install browser-use && playwright install" },
    { "kind": "cmd", "text": "$ python run_agent.py --task 'Compare Stripe vs Paddle fees'", "highlight": true },
    { "kind": "out", "text": "✓ Extracted 14 pricing tiers in 6.2s (Local DOM Snapshot)" }
  ]
}
```

### ⑨ `ranked_bars` — 动态水平进度条 / 概率权重 / 跑分成本榜
Best for: Model benchmarks, token probabilities, cost/latency comparisons, pricing tiers.
```json
"primitive": "ranked_bars",
"data": {
  "heading": "注意力权重分配 (Self-Attention)",
  "heroStat": "70.0%",
  "bars": [
    { "label": "虎皮鹦鹉 (核心指代实体)", "pct": 70, "valueText": "0.70 · 最高关注", "tone": "amber" },
    { "label": "其余上下文修饰词", "pct": 15, "valueText": "0.15", "tone": "neutral" },
    { "label": "轩辕 (远距主语)", "pct": 10, "valueText": "0.10", "tone": "neutral" },
    { "label": "养了 (谓语动词)", "pct": 5, "valueText": "0.05", "tone": "neutral" }
  ]
}
```

### ⑩ `evidence_clip` — 暖白纸感文献 / README / 条款剪报 + 动态荧光笔高亮
Best for: ArXiv papers, GitHub README quotes, Privacy Policy subprocessor forensics, official changelogs.
```json
"primitive": "evidence_clip",
"data": {
  "docType": "PRIVACY POLICY FORENSICS",
  "docMeta": "adanotch.com/privacy · Verified",
  "docTitle": "零云端处理器声明：印证 100% 端侧免费 Vision API",
  "excerpts": [
    { "text": "• All OCR, background removal, and screen recordings are processed locally on your Mac." },
    { "text": "• Zero OpenAI / Anthropic API tokens consumed by the developer — marginal cost = $0.00.", "highlight": true },
    { "text": "• Billing and global EU VAT handled via Paddle.com Merchant of Record." }
  ]
}
```
