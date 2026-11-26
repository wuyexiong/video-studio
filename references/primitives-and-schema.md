# `video_project.json` Schema & 40 Domain-Agnostic Remotion Primitives

All renders in `video-studio` are 100% data-driven via a single `video_project.json` manifest placed in the user's active workspace. You do NOT need to copy `node_modules` or scaffold a new React project in the user's workspace.

> **Zero-Emoji & 100% Domain-Agnostic Rule**: Never put raw emoji characters inside `scene.data`. Pass semantic vector icon keys rendered by `<StudioVectorIcon />`: `"check"`, `"x"`, `"lock"`, `"git-branch"`, `"git-pr"`, `"trash"`, `"alert"`, `"sparkles"`, `"bot"`, `"eye"`, `"stopwatch"`, `"globe"`, `"globe-off"`, `"package"`, `"cog"`, `"scale"`, `"link"`, `"zap"`, `"user"`, `"shield"`, `"bug"`, `"cloud"`, `"monitor"`, `"folder"`, `"file"`, `"infinity"`, `"layers"`.

---

## 0. Proportional Segmented Top Progress Bar & Two-Tier Stepper Header (`scene.data`)

- **Proportional Chapter-Segmented Top Progress Bar (`y = 0..4px`)**: Automatically divides the 1920px top bar into proportional chapter segments separated by `3px` `#262626` gaps (`#363636` track, `#FE8A00` fill) whenever a project has 2+ chapters.
- Every scene (regardless of `primitive`) supports an optional **Top Scene Header** rendered by `SceneThesisHeader`:
  - `stepper`: Connected progress steps. For 2–3 steps, renders classic pills (`stepperStyle: "pills"`); for `4+` steps (or when `stepperStyle: "circles"` / `stepperBracket` is set), automatically renders **Two-Tier Circle (`1..N` -> vector `check`) + Below-Capsule + Arrow Connectors**!
  - `stepperBracket` (or `stepperBrackets[]`): Optional top range bracket `┌── label ──┐`, e.g. `{ "startIndex": 2, "endIndex": 2, "label": "CORE GATE" }`.
- `activeStepIndex`: Zero-based index of the active pill when `stepper` is a string array (e.g. `1`).
- `subStepper`: Optional second-row sub-step pills (e.g. `["1 自然語言", "2 匯入規格", "3 錄製示範"]`), synced to `activeSubStepIndex` or current spoken clause.
- `topPill`: Top-center rounded capsule label (e.g. `"同一題 · 垂直功能切片"`).
- `topPillTag`: Optional highlighted tag prefix inside `topPill` (e.g. `"解法"`). If omitted, an amber dot is rendered.
- `topTitle`: Top-center bold thesis equation or question (e.g. `"TDD = 防作弊機制"`, `"好架構 = 深模組 (Deep Module)"`).
- `topAccentWord`: Substring inside `topTitle` to highlight in a semantic color (e.g. `"TDD"`, `"深模組"`).
- `topAccentTone`: `"amber"` (default) | `"emerald"` | `"coral"`.

### 0.1 Minimal Visual Copy Diet (`6-8-12` Law) & Natural Chinese Numerals
- **Spoken Script Carries Prose, Canvas Carries Distilled Keywords**: Never duplicate full spoken sentences onto Remotion cards! Let `clauses` explain *why/how* in natural speech while `scene.data` anchors the viewer's eye on crisp nouns, contrast labels, and metrics:
  - **`badge` / `pill` / `stepper` / `rooms`**: `<= 6` CJK chars (e.g. `"零算力成本"`, `"毛利 92%"`, `"訂閱閉環"`).
  - **Card / Node / Zone `title`**: `<= 8` CJK chars (e.g. `"本機會話監聽"`, `"腳本批量註冊"`, `"真實獲利引擎"`).
  - **`subtitle` / `detail` / `note` / `metricLabel`**: `<= 12` CJK chars (e.g. `"NSPanel 零焦點搶佔"`, `"單日硬上限熔斷"`).
  - **Total Canvas CJK Budget per Scene**: **`<= 45` CJK chars** across all `scene.data` fields (`build_video.py --lint-only` enforces `[Canvas Copy Diet]` & `[Canvas Overload]`).
- **No Fake `.sh` Scripts for Non-Code Steps**: Never disguise marketing, GTM, or operations checklists as `.sh` terminal commands inside `terminal_code_live` or `skill_editor_spotlight`. Use `flow_3node`, `annotated_ui_tour`, `matrix_compare`, or `stack_slice_builder` instead.
- **Natural Chinese Numeral Rule**: Use Arabic digits for concrete metrics, prices, percentages, counts, and durations (`$9.99`, `84.5%`, `30,000 张`, `3 分钟`), while keeping Chinese characters inside fixed idioms and general quantifiers (`一个`, `一遍`, `第三方`, `一人公司`, `一刀切` — NEVER `"1 个"` or `"第 3 方"`).

---

## 1. Top-Level `video_project.json` Structure

```json
{
  "slug": "adanotch_deepdive",
  "title": "Adanotch 深度拆解",
  "archetype": "teardown",
  "voice_mode": "clone",
  "default_voice": "hahaxiong",
  "default_preset": "mix",
  "speed_factor": 1.10,
  "fps": 30,
  "show_waveform": false,
  "subtitle_font_size": 44,
  "captures": [
    {
      "sceneId": "ch1_s2",
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
          "voice": "hahaxiong",
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

### Multi-Voice & Preset Rules (`/Users/hahaxiong/Toos/VoiceClone/voices/registry.json` & `AGENTS.md`)
- **Multi-Voice Routing (`default_voice` / `scene.voice` / `clause.voice` / CLI `--voice`)**:
  - `build_video.py` dynamically loads `/Users/hahaxiong/Toos/VoiceClone/voices/registry.json` and hot-swaps GPT + SoVITS weights via `127.0.0.1:9880/set_gpt_weights` & `/set_sovits_weights` (idempotent 0ms check when unchanged).
  - Default voice is `"hahaxiong"` (main male voice; aliases: `"男声"`, `"我"`, `"我的声音"`).
  - Secondary voices registered in `voices/registry.json` (e.g. `"female_01"`, alias `"女声"`) can be set globally via `"default_voice": "female_01"` or `--voice female_01`, or mixed per-scene / per-clause for multi-speaker dialogue!
- **Emotion Presets (`preset`)**:
  - `"mix"`: Default for Chinese + English tech terms (`Claude Code`, `SaaS`, `GitHub`, `Allow`). Automatically sends `text_lang: "zh"` so English words are never dropped.
  - `"zh"`: Grounded pure-Chinese deep narrative voice — ideal for opening theses, philosophical transitions, and closing takeaways. (Automatically falls back to `"mix"` if a secondary voice has not configured a `"zh"` prompt WAV yet.)
  - `"en"`: Pure English narration (`text_lang: "en"`) for global Product Hunt / X / YouTube English videos.
- **1:1 Verbatim Subtitle Law**: `display_text` must contain the **exact same words** spoken in `tts_text`! Only convert spoken digits/symbols into Arabic numerals/symbols (`tts_text: "首周流水不到一千美金。"` -> `display_text: "首周流水不到 $1,000"`). Never put unspoken summary words in `display_text` (put summary titles in `scene.data` card fields instead!). `build_video.py` enforces this automatically via `Subtitle Sync Violation` lint error.

---

## 2. The 40 Universal Visual Primitives (`scene.primitive` & `scene.data`)

Never place the same `primitive` back-to-back! Alternate across these 40 primitives:

### ① `chapter_card` — 全屏琥珀竖线呼吸转场 / 核心结论卡（支持 `heroUnderlineMode` 开场大字下划线模式）
Best for: Chapter openings (every 45–60s), thesis statements, final summary takeaways (`85%` whitespace), or hero keyword cold opens (`heroUnderlineMode: true`, optional `underlineWidthPct`: default `76`).
```json
"primitive": "chapter_card",
"data": {
  "eyebrow": "CHAPTER 02 · ARCHITECTURE",
  "headline": "砍掉桌面玩具",
  "subheadline": "专注审批止痛药",
  "tone": "emerald",
  "pills": ["工期 14 天", "毛利 92.3%"]
}
```
When `heroUnderlineMode: true`: renders giant centered monospace `headline` (e.g. `"grill-me"`) with a centered symmetric 10px amber underline bar growing smoothly from `0%` to `underlineWidthPct` (`76%` default), `subheadline` on clause 2, and `pills` on clause 3.

### ② `persona_quote` — 人物圆头像 + 身份胶囊 + 原话金句卡
Best for: YouTube secondary explainer speaker intros (e.g., Karpathy), founder profiles, expert quotes.
```json
"primitive": "persona_quote",
"data": {
  "name": "Andrej Karpathy",
  "avatarMonogram": "AK",
  "avatarFile": "./assets/karpathy.jpg",
  "role": "前 OpenAI 创始成员 · Tesla AI 总监",
  "badges": ["OpenAI 创始团队", "Vibe Coding"],
  "quote": "大模型本质只有两个文件：参数与运行代码。",
  "source": "Intro to LLMs · YouTube (4.3M Views)"
}
```
*(Note: `avatarFile` is optional; if omitted, `avatarMonogram` renders a clean matte monogram circle.)*

### ③ `dot_matrix_stat` — 百格/二百格点阵比例高亮 + 巨型等宽数字
Best for: Sharp proportions, conversion rates, rarity hooks (`0.2%`), benchmark dominance. Supports `"totalDots": 100` (crisp `10×10` large dots) or default `200` (`20×10`).
```json
"primitive": "dot_matrix_stat",
"data": {
  "gridCaption": "1,000 名用户抽样",
  "totalDots": 200,
  "highlightDots": 2,
  "tone": "amber",
  "metricValue": "0.2%",
  "metricLabel": "深度复杂推理占比",
  "badges": ["</> 深度编码", "Σ 数学推理"]
}
```

### ④ `flow_3node` — SVG 路径动态生长的 2~4 节点机制/漏斗流图
Best for: Technical pipelines, local-first cost structures, SaaS acquisition funnels, GitHub call chains.
```json
"primitive": "flow_3node",
"data": {
  "nodes": [
    { "tag": "01 · INPUT", "title": "本机会话监听", "subtitle": "~/.claude 免 Key", "tone": "amber" },
    { "tag": "02 · ENGINE", "title": "刘海悬浮面板", "subtitle": "NSPanel 零抢焦", "tone": "neutral" },
    { "tag": "03 · MARGIN", "bigValue": "$0.00", "title": "月均云成本", "badge": "毛利 92.3%", "tone": "emerald" }
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
      "header": "恶意刷量风险",
      "tone": "coral",
      "items": [
        { "title": "脚本批量注册", "detail": "1,000 号/分钟", "badge": "突破口" },
        { "title": "并发请求灌爆", "detail": "半小时 -$3,000", "badge": "高危" }
      ]
    },
    {
      "header": "防御止损底线",
      "tone": "emerald",
      "items": [
        { "title": "真人验证拦截", "detail": "CF Turnstile", "badge": "零成本" },
        { "title": "单日上限熔断", "detail": "Rate Limit 锁", "badge": "止损" }
      ]
    }
  ]
}
```

### ⑥ `focus_hud_demo` — 暖炭灰 `#323232` 景深虚化背景卡 + 通用前景交互确认卡与波纹点击
Best for: Opening pain-point hooks, SaaS 1-click workflow actions, feature toggles, risk circuit-breakers, or CLI permission approvals.
```json
"primitive": "focus_hud_demo",
"data": {
  "backdropCards": [
    { "title": "搜索广告", "detail": "CPC 飙至 $4.80", "status": "超支", "tone": "coral" },
    { "title": "社媒私信", "detail": "回复延迟 > 6h", "status": "流失", "tone": "amber" }
  ],
  "hudEyebrow": "AUTOMATION · 01",
  "hudTitle": "高意向实时拦截",
  "hudBadge": "转化 +3.2x",
  "metaPills": ["零人工", "秒级触发"],
  "promptText": "停留 > 25s 自动下发限时买断券",
  "primaryAction": "一键启用",
  "clickedLabel": "已生效",
  "secondaryAction": "稍后"
}
```

### ⑦ `live_web_showcase` — 60fps 真动态网页/录屏视频流 + 无遮挡侧滑取证卡
Best for: Real Chrome web recordings (`captures[]` with `sceneId`), Screen Studio `.mp4` hands-on clips, product demos.
```json
"primitive": "live_web_showcase",
"data": {
  "videoFile": "./assets/web_demo.mp4",
  "footnote": "adanotch.com · Live 60fps Capture",
  "callout": {
    "tone": "coral",
    "badge": "冷启动实证",
    "title": "功能堆砌陷阱",
    "bigMetric": "< $1,000",
    "note": "PH #25 · 首周预估流水"
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

### ⑪ `skill_editor_spotlight` — 一镜到底多节拍源码/报告逐行打字 + 聚光灯白话翻译卡
Best for: Prompt / `SKILL.md` line-by-line teardown, security scan report spotlighting, config file dissection. Each item reveals at `stepClause` with typewriter cursor `█`, highlights the active line with a right-side Chinese translation pill, and dims non-active lines to `0.46` opacity.
```json
"primitive": "skill_editor_spotlight",
"data": {
  "topTitle": "grill-me = AI 反过来拷问你",
  "topAccentWord": "grill-me",
  "topAccentTone": "amber",
  "filePath": "skills/grill-me/SKILL.md",
  "rightBadge": "Markdown · 5 Lines Only",
  "items": [
    {
      "code": "Interview me relentlessly until we reach a shared understanding.",
      "translation": "① 没达成共识前，把我往死里问",
      "tone": "amber",
      "stepClause": 1
    },
    {
      "code": "Do NOT write any code until the design is fully agreed upon.",
      "translation": "② 严禁在共识前偷偷跑去写程式",
      "tone": "coral",
      "stepClause": 2
    }
  ]
}
```

### ⑫ `stack_slice_builder` — 并排模块化容器垂直切片积木堆叠画布
Best for: End-to-end vertical feature slices, modular architecture stacks, and parallel deliverable milestones synchronized to `stepClause`, popping an emerald `✓` badge and optional `footerBadge` on `footerClause`.
```json
"primitive": "stack_slice_builder",
"data": {
  "topTitle": "模块化垂直交付架构",
  "topAccentWord": "垂直交付",
  "columns": [
    {
      "badge": "A",
      "title": "端侧推理模块",
      "stepClause": 0,
      "footerBadge": "✓ 独立闭环验收",
      "footerClause": 2,
      "layers": [
        { "label": "原生快捷键唤醒层", "sub": "SwiftUI HUD", "color": "amber", "stepClause": 0 },
        { "label": "量化模型推理核", "sub": "MLX 8-bit Engine", "color": "purple", "stepClause": 0 },
        { "label": "本地向量快取库", "sub": "SQLite Vec", "color": "blue", "stepClause": 0 }
      ]
    },
    {
      "badge": "B",
      "title": "商业授权模块",
      "stepClause": 1,
      "footerBadge": "✓ 全球税务合规",
      "footerClause": 2,
      "layers": [
        { "label": "激活码验证视窗", "sub": "License Gate", "color": "emerald", "stepClause": 1 },
        { "label": "全球税务结账", "sub": "Paddle MoR", "color": "amber", "stepClause": 1 },
        { "label": "设备绑定纪录", "sub": "Device Ledger", "color": "blue", "stepClause": 1 }
      ]
    }
  ]
}
```

### ⑬ `traffic_gate_box` — 不变量规则锁卡 + 红绿灯校验门禁状态机
Best for: TDD red-to-green verification gates, risk control rules, invariant policy checks. All right-side light titles and bottom captions are customizable.
```json
"primitive": "traffic_gate_box",
"data": {
  "topTitle": "TDD = 防作弊机制",
  "topAccentWord": "TDD",
  "topAccentTone": "amber",
  "lockTitle": "先把测试死规矩定死",
  "ruleLeft": "满 $1,000",
  "ruleRight": "只能 -$100",
  "lockNote": "未满足断言前直接拦截，禁止带病上线",
  "redTitle": "测试失败",
  "redSub": "红灯：先确认规则锁死",
  "greenTitle": "测试通过",
  "greenSub": "绿灯：符合标准准许放行",
  "bottomCaption": "先锁定验收底线 → 再执行实作交付",
  "redClause": 1,
  "greenClause": 2
}
```

### ⑭ `deep_module_box` — 单一极简大门封装架构图（Deep Module / Facade）
Best for: Deep module vs. shallow module encapsulation, API gateway / facade patterns, hiding internal complexity behind one clean interface (`rooms[]` supports `"Module · 标签"` auto-pill split or `{ "title": "...", "sub": "..." }`).
```json
"primitive": "deep_module_box",
"data": {
  "topTitle": "好架构 = 深模组",
  "topAccentWord": "深模组",
  "topAccentTone": "emerald",
  "callerLabel": "主控调用层",
  "doorFunction": "processCheckout()",
  "rooms": ["Discount · 算折扣", "Stripe · 验卡", "Order · 建单", "Stock · 扣库存"],
  "bottomCaption": "✓ 单一极简入口，内部复杂逻辑全封装",
  "gateClause": 1,
  "innerClause": 2
}
```

### ⑮ `split_tree_chat_dispatch` — 左树居中生长 ➔ 平滑左移分屏 ➔ 右侧模块交接流
Best for: Shared workspace / repository folder tree growing in center, then shifting left to reveal zero-duplication spec handoff between upstream & downstream modules.
```json
"primitive": "split_tree_chat_dispatch",
"data": {
  "rootLabel": "共用工作區 · Shared Repo",
  "workspaceName": "workspace",
  "folders": [
    { "name": "context", "files": "brand.md · rules.md", "stepClause": 0 },
    { "name": "specs", "files": "checkout_v2.md", "stepClause": 1, "highlight": true },
    { "name": "dist", "files": "build_bundle", "stepClause": 2 }
  ],
  "shiftClause": 2,
  "typeClause": 3,
  "sourceNode": "調度核心",
  "targetNode": "實作引擎",
  "dispatchBadge": "零重複交接",
  "dispatchText": "讀取 specs 與 context 實作結帳頁，輸出至 dist"
}
```

### ⑯ `annotated_ui_tour` — 三栏软件界面 + 暗化聚光灯移动 + `① ② ③` 序号导览（支持 `heroValue` 海报大字与 `countdownSec`）
Best for: 30-second UI walkthroughs or 3-stage strategic playbooks, lighting up each pane with an `#FE8A00` spotlight on `stepClause` (supports optional `heroValue` / `heroLabel` metric highlight per zone).
```json
"primitive": "annotated_ui_tour",
"data": {
  "countdownSec": 30,
  "zones": [
    { "badge": "1", "title": "模块导览区", "subtitle": "LEFT NAV", "items": ["核心入口钉选", "工作区分组"], "stepClause": 0 },
    { "badge": "2", "title": "互动主画布", "subtitle": "MAIN STAGE", "heroValue": "0.2s", "heroLabel": "实时状态响应", "items": ["敏感变更确认卡"], "stepClause": 1 },
    { "badge": "3", "title": "状态与监控", "subtitle": "INSPECTOR", "items": ["定时触发器", "实时预览"], "stepClause": 2 }
  ]
}
```

### ⑰ `org_tree_radiate` — 无碰撞椭圆星型耦合 / 影响范围放射导图
Best for: Showing how a single requirement/core change radiates outward to 6~10 coupled files, modules, or downstream channels (`spokes[]`).
```json
"primitive": "org_tree_radiate",
"data": {
  "topTitle": "高耦合灾难：改动一处牵连十个档案",
  "topAccentWord": "牵连十个档案",
  "topAccentTone": "coral",
  "centerTitle": "改动单一需求",
  "tone": "coral",
  "spokes": ["Card.tsx", "Nav.tsx", "Form.tsx", "Modal.tsx", "Input.tsx", "utils.ts", "config.ts", "styles.ts"]
}
```

### ⑱ `pipeline_timeline_flow` — 多步长流水线「错误多米诺骨牌传染」画布
Best for: Showing 6~10 sequential pipeline steps (`steps[]`) where an early mistake at `failStartIndex` cascades coral-red `✗` domino contagion across every downstream stage.
```json
"primitive": "pipeline_timeline_flow",
"data": {
  "topTitle": "僵化长流程：一步定歪、全线报废",
  "steps": ["厘清目标", "写规格", "写计划", "拆任务", "设计", "写测试", "实作", "审查", "收尾"],
  "failClause": 1,
  "failStartIndex": 1,
  "failBanner": "✗ 前序理解偏差，顺着整条链路骨牌传染"
}
```

### ⑲ `defense_boundary_flow` — 两扇圆拱门双防线（`two_arches`）或全参数化信任边界图（`trust_boundary`）
Best for: `"mode": "two_arches"` (Two grand arched doors: e.g. Authentication vs Authorization) OR `"mode": "trust_boundary"` (Fully parameterized Left Untrusted Zone crossing vertical amber `boundaryLabel` into Right Trusted Zone).
```json
"primitive": "defense_boundary_flow",
"data": {
  "mode": "trust_boundary",
  "topTitle": "严守客户端与服务端信任边界",
  "leftZoneTitle": "✗ 外部不可控区",
  "leftItems": [
    { "title": "浏览器参数", "detail": "抓包可篡改金额配额" }
  ],
  "leftFooter": "✗ 严禁前端扣费判定",
  "boundaryLabel": "Trust Boundary",
  "rightZoneTitle": "✓ 云端受控安全区",
  "rightItems": [
    { "title": "后端重算应付金额" },
    { "title": "数据库 RLS 行级隔离" }
  ],
  "rightFooter": "✓ 跨边界请求强制安检",
  "rightClause": 1
}
```

### ⑳ `row_permission_table` — 横向行级角色权限表（带绿勾 `✓ 可以碰` 与红叉 `✗ 不能碰` 胶囊）
Best for: Multi-role access control matrices, feature tier tables, or policy comparisons revealed row-by-row on `stepClause`.
```json
"primitive": "row_permission_table",
"data": {
  "topTitle": "角色權限配對表",
  "rows": [
    { "icon": "G", "role": "路人訪客", "sub": "未註冊", "allowed": ["公開首頁"], "blocked": ["專案庫", "後台"], "stepClause": 0 },
    { "icon": "F", "role": "免費用戶", "sub": "已註冊", "allowed": ["個人短片"], "blocked": ["他人專案", "付費池"], "stepClause": 1 },
    { "icon": "P", "role": "付費用戶", "sub": "專業版", "allowed": ["長片匯出", "專屬額度"], "blocked": ["系統後台"], "stepClause": 2 }
  ]
}
```

### ㉑ `acronym_token_slot` — 完形填空猜词机 + 概率分布实时联动 或 缩写字母逐词展开（复刻《AI 背後怎麼運作》03:15 & 08:35）
Best for: `"mode": "token_slot"` (`[今天] [出門] ... [外面] [正在] [ ? ]` connecting to `parameters.bin` and candidate probability bars `下雨 72%` snapping into the slot) OR `"mode": "acronym_cards"` (`[R] [L] [H] [F]` or `[G] [P] [T]` large letter cards expanding into English + Chinese badges).
```json
"primitive": "acronym_token_slot",
"data": {
  "mode": "token_slot",
  "topTitle": "預訓練的本質：瘋狂猜下一個字 (Next-Token Prediction)",
  "tokens": ["今天", "出門", "記得", "帶傘", "，", "因為", "外面", "正在"],
  "candidates": [
    { "word": "下雨", "pct": 72 },
    { "word": "刮風", "pct": 19 },
    { "word": "下雪", "pct": 9 }
  ]
}
```

### ㉒ `metaphor_canvas` — 神经网络权重参数旋钮微调阵列
Best for: Visualizing model training / parameter tuning as a configurable `cols × rows` (default `9×3`) grid of continuously oscillating rotary weight dials.
```json
"primitive": "metaphor_canvas",
"data": {
  "topTitle": "模型训练 = 反复微调数百亿颗参数旋钮",
  "topAccentWord": "参数旋钮",
  "cols": 9,
  "rows": 3,
  "caption": "数百亿个权重参数 = 数百亿颗反复微调角度的旋钮"
}
```

### ㉓ `before_after_transformer` — 「反面做法划除 ➔ 翡翠绿正面解法 + 下方结果实时收敛压缩器」
Best for: SQL slow-scan vs indexed query, bloated copy vs high-CVR copy, vague chores vs outcome-driven spec, noisy raw input vs filtered signal (`128 -> 2`).
```json
"primitive": "before_after_transformer",
"data": {
  "subjectBadge": "資料庫查詢優化",
  "beforeLabel": "反面做法 · 全表掃描",
  "beforeText": "SELECT * FROM events WHERE status = 'open'",
  "afterLabel": "正面解法 · 複合索引精準命中",
  "afterText": "建立 (tenant_id, status) 索引，僅取必要欄位",
  "outcomeTitle": "掃描行數與延遲變化",
  "beforeMetric": "124,000 行 · 3.8s",
  "afterMetric": "3 行 · 4.2ms",
  "beforeItems": ["全表逐頁 I/O 讀取 #01", "無關歷史冷數據 #02", "鎖競爭阻塞請求 #03"],
  "afterItems": [
    { "text": "B-Tree 索引直接定位目標分區", "badge": "耗時 -99.8%" },
    { "text": "覆蓋索引免回表查詢", "badge": "零阻塞" }
  ]
}
```

### ㉔ `synergy_puzzle_pair` — 互补双拼图滑入咬合锁定卡（Module A + Module B 强强联手）
Best for: Two complementary tools/layers snapping together (Lightweight UI + Heavy Engine, Free SEO Funnel + Paid Core, Local Client + Cloud Compute).
```json
"primitive": "synergy_puzzle_pair",
"data": {
  "leftTag": "LAYER A · ACQUISITION",
  "leftTitle": "免費網頁小工具",
  "leftSub": "零門檻 SEO 自然流量入口",
  "leftPill": "每月 85,000 精準訪客",
  "rightTag": "LAYER B · MONETIZATION",
  "rightTitle": "桌面端買斷專業版",
  "rightSub": "端側原生 API 零算力成本",
  "rightPill": "淨毛利率 94.2%",
  "snapClause": 2
}
```

### ㉕ `multi_perspective_ring` — 左屏观点流聚光（非焦点自动降噪虚化）+ 右侧多视角环形联动图
Best for: Multi-perspective product reviews (User / Business / Engineering / Security), microservice ring communication, architecture trade-off debates.
```json
"primitive": "multi_perspective_ring",
"data": {
  "nodes": [
    { "label": "商業決策", "icon": "B", "color": "#FE8A00" },
    { "label": "產品體驗", "icon": "P", "color": "#FF6911" },
    { "label": "工程架構", "icon": "</>", "color": "#17B7A6" },
    { "label": "合規風控", "icon": "S", "color": "#7C5BFD" }
  ],
  "messages": [
    { "speaker": "產品體驗", "text": "首屏 3 秒跑通首個結果", "stepClause": 0 },
    { "speaker": "工程架構", "text": "重度推理改走非同步佇列", "stepClause": 1 },
    { "speaker": "商業決策", "text": "高清匯出觸發付費牆", "stepClause": 2 }
  ]
}
```

### ㉖ `convergent_hub_bus` — 上排多端独立入口 ➔ 底层单一共享底座/数据总线汇聚图
Best for: Multi-client single-backend architectures, 2-tier global vs isolated memory, multi-product shared auth/billing hub.
```json
"primitive": "convergent_hub_bus",
"data": {
  "topNodes": [
    { "title": "iOS 行動端", "sub": "隨時隨地觸發", "color": "#7C5BFD" },
    { "title": "Web 管理台", "sub": "視覺化審閱", "color": "#17B7A6" },
    { "title": "CLI 自動化", "sub": "批次腳本調用", "color": "#FF6911" }
  ],
  "baseTitle": "單一共用底層狀態機與儲存底座",
  "baseSub": "任何一端寫入變更，全端毫秒級同步生效",
  "syncPills": ["免重複登入授權", "單一真實數據源"],
  "convergeClause": 1
}
```

### ㉗ `arc_gauge_audit` — 精确 240° 双圆弧反差仪表盘（`dual_compare`）或 极速表盘+具名核验清单扫描（`speed_scan`）
Best for: Permission boundaries (Read 88% vs Write 15%), unit economics contrast (Margin vs Churn), or high-speed audit verification (`speed_scan` with `scanItems[]`). Uses pure code-drawn SVG vector icons (`"eye" | "lock" | "shield" | "bolt" | "chart"`, zero emoji) and rolling numeric percentages.
```json
"primitive": "arc_gauge_audit",
"data": {
  "mode": "dual_compare",
  "leftTitle": "读取与分析权限",
  "leftTag": "大方开放 · 掌握完整脉络",
  "leftPct": 88,
  "leftIcon": "eye",
  "rightTitle": "外部写入与扣款",
  "rightTag": "严格收紧 · 必经人工确认",
  "rightPct": 15,
  "rightIcon": "lock"
}
```
When `"mode": "speed_scan"`: pass `"gaugeValue": "0.18s"`, `"gaugeLabel": "端侧毫秒级扫描"`, `"scanTitle": "自动核验清单"`, and `"scanItems": [{ "label": "语音包络无截断", "meta": "-16.5 LUFS" }, { "label": "字级时间戳毫秒对齐", "meta": "0ms DRIFT" }]`.

### ㉘ `idle_waste_vs_event_wake` — 周期空转损耗条 `[空轉][空轉]` vs 休眠零消耗按需秒醒状态机
Best for: Cron polling vs Webhook event triggers, fixed idle EC2 burn vs Serverless scale-to-zero, ad waste vs intent-driven conversion.
```json
"primitive": "idle_waste_vs_event_wake",
"data": {
  "wasteTitle": "固定每 10 分鐘輪詢：95% 喚醒都在空轉燒配額",
  "wasteInterval": "Every 10m Polling",
  "sleepLabel": "平時完全休眠 ($0 閒置成本)",
  "triggerLabel": "Webhook 事件到達",
  "wakeLabel": "1 秒喚醒精準處理",
  "wakeClause": 1
}
```

### ㉙ `binary_decision_tree` — 顶部设问 ➔ 正交二分法决策树与代价提示条
Best for: "When to use A vs. When to use B" decision frameworks (Monolith vs Microservices, One-time Purchase vs Subscription, Sync vs Async).
```json
"primitive": "binary_decision_tree",
"data": {
  "question": "買斷制 vs 月訂閱？",
  "leftBranchLabel": "零雲端算力",
  "leftTitle": "$29 終身買斷",
  "leftDetail": "首週現金流轉化高 3 倍",
  "rightBranchLabel": "持續消耗 API",
  "rightTitle": "$19/月 訂閱制",
  "rightDetail": "綁定月額度防倒貼",
  "footerWarning": "切忌：調昂貴大模型卻賣終身買斷"
}
```

### ㉚ `spotlight_window_tour` — 暗色实录窗 + `blurZones[]` 毛玻璃降噪 + 围绕 `focusBox` 中心推镜 + 可选侧边取证卡
Best for: Real app/website screenshots or `.mp4` clips where distracting sidebars/tables are blurred, `#FE8A00` frames and zooms precisely into the `focusBox` center, and an optional non-overlapping right-side `callout` card presents forensic metrics.
```json
"primitive": "spotlight_window_tour",
"data": {
  "windowTitle": "dashboard.stripe.com/billing",
  "imageFile": "./assets/billing_screen.png",
  "blurZones": [
    { "xPct": 0, "yPct": 0, "wPct": 22, "hPct": 100 },
    { "xPct": 25, "yPct": 58, "wPct": 75, "hPct": 42 }
  ],
  "focusBox": { "xPct": 26, "yPct": 18, "wPct": 52, "hPct": 36 },
  "zoomScale": 1.16,
  "footnote": "Stripe Billing · Live Dashboard",
  "callout": {
    "tone": "emerald",
    "badge": "✓ 留存引擎",
    "title": "自动重试挽回失败扣款",
    "bigMetric": "114.2%",
    "note": "净收入留存率 (NDR) · 零代码税务合规"
  }
}
```

### ㉛ `vignette_metaphor_stage` — 径向暗角羽化视觉隐喻剧场（有图）或 无遮挡 Flex 双栏矢量对照台（无图兜底）
Best for: High-memorability visual metaphor anchors (`imageFile` seamlessly blended into `#262626` via radial mask; or omit `imageFile` for a clean collision-free Flex 2-column risk-vs-resilience vector stage).
```json
"primitive": "vignette_metaphor_stage",
"data": {
  "imageFile": "./assets/cloud_vs_local.png",
  "leftCallout": "本机断电即中断",
  "rightCallout": "云端独立持续运行",
  "checklist": ["自动重试失败任务", "保留登入授权状态", "完成后主动推播通知"]
}
```

### ㉜ `surface_vs_background_iceberg` — 表象极简步骤 ➔ 底部展开「背后自动机制」冰山揭秘图
Best for: "On the surface it looks like 3 simple steps, but behind the scenes the platform silently runs an entire automated pipeline called X."
```json
"primitive": "surface_vs_background_iceberg",
"data": {
  "surfaceHeading": "3 步",
  "surfaceSteps": [
    { "title": "AI 寫程式", "icon": "sparkles" },
    { "title": "發起變更", "icon": "git-pr" },
    { "title": "部署上線", "icon": "package" }
  ],
  "backgroundLabel": "背後機制",
  "systemBadge": "自動化流水線",
  "hiddenChecklist": ["靜態規範掃描", "核心路徑驗算", "產物完整性打包"],
  "leftCaption": "自動檢查",
  "hiddenRightFlow": [
    { "label": "雲端節點拉取", "icon": "globe" },
    { "label": "零停機發布", "icon": "package" }
  ],
  "rightCaption": "自動部署",
  "revealClause": 1,
  "groupClause": 2
}
```

### ㉝ `git_branch_merge_graph` — 主干保护锁 · 分支分叉 · 栅栏拦截校验与丝滑合并图
Best for: Git branch workflows, draft-to-production gates, protected trunk lines, pre-merge automated verification fences. Pair with `stepper` (`stepperStyle: "circles"`).
```json
"primitive": "git_branch_merge_graph",
"data": {
  "stepper": ["開分支", "開 PR", "自動檢查", "合併主線", "自動部署"],
  "activeStepIndex": 1,
  "actorLabel": "開發者",
  "taskCardTitle": "新增報表模組",
  "taskIcon": "chart",
  "trunkLabel": "main",
  "showTrunkLock": true,
  "branchLabel": "feature/report",
  "prTitle": "新增報表模組",
  "prNumber": "#12",
  "openStatusLabel": "Open",
  "mergedStatusLabel": "Merged",
  "gateLabel": "檢查",
  "gateChecks": ["核心寫入", "權限校驗", "新報表模組"],
  "prClause": 1,
  "fenceClause": 2,
  "mergeClause": 3
}
```

### ㉞ `pr_checks_gate_card` — 多重检查状态机卡片（旋转等待 ➔ 逐项绿勾 ➔ 解锁点击核心按钮）
*(Also reachable via `traffic_gate_box` with `"mode": "github_pr_checks"`)*
Best for: Pull request status checks, pre-flight readiness gates, multi-condition unlock flows.
```json
"primitive": "pr_checks_gate_card",
"data": {
  "cardTitle": "新增報表模組",
  "cardIdTag": "#12",
  "statusBadge": "Open",
  "routeLabel": "feature/report -> main",
  "pendingHeading": "檢查執行中...",
  "passedHeading": "全部檢查通過",
  "checks": ["lint", "test", "build"],
  "actionButtonLabel": "Merge pull request",
  "passClause": 1,
  "clickClause": 2
}
```

### ㉟ `slot_validation_and_stopwatch` — 槽位类型塞错报红 / 算式 `NaN` 污染 / 秒表免开站静态扫描
Best for: Schema/type validation (`"mode": "slot_check"`), dirty data corrupting calculations (`"mode": "formula_nan"`), or fast static checks without spinning up runtime servers (`"mode": "static_stopwatch"`).
```json
"primitive": "slot_validation_and_stopwatch",
"data": {
  "mode": "static_stopwatch",
  "commandText": "npm run typecheck",
  "fileName": "total.ts",
  "codeLines": [
    { "text": "const itemA: number = 80" },
    { "text": "const itemB: number = '一百元'", "isError": true }
  ],
  "errorBadge": "型別不符",
  "scanDurationSec": 3.0,
  "skipRuntimeLabel": "免啟動伺服器"
}
```

### ㊱ `autonomous_bot_ui_tester` — 验收规范清单 + 自主游标点按仿真窗 + `REC` 录影与 `[放行]` 盖章
Best for: E2E automated browser testing, independent AI agent verification skills, pre-release live UI click-through with approval stamp.
```json
"primitive": "autonomous_bot_ui_tester",
"data": {
  "specTitle": "驗收檢查清單",
  "specItems": ["登入並建立紀錄", "觸發匯出動作", "異常重整與斷網測試"],
  "appTitle": "線上產品預覽",
  "showRecIndicator": true,
  "appRows": [
    { "label": "項目 A", "value": "$80" },
    { "label": "項目 B", "value": "$120" }
  ],
  "summaryRow": { "label": "總計核對", "value": "$200" },
  "primaryButtonLabel": "匯出報表",
  "cursorIcon": "bot",
  "cursorLabel": "test bot",
  "verificationPills": [
    { "tag": "新", "label": "匯出模組", "status": "pass" },
    { "tag": "舊", "label": "會員登入", "status": "pass" }
  ],
  "approvalStamp": "放行"
}
```

### ㊲ `env_isolation_compare` — 本机残留缓存假阳性（线上当机）vs 纯净云端容器精准抓漏对比
Best for: Explaining "It works on my machine!" dependency drift, Docker/CI clean-room runners, reproducible environments.
```json
"primitive": "env_isolation_compare",
"data": {
  "requirementLabel": "新模組依賴套件",
  "missingItem": "X",
  "localHostLabel": "開發者本機",
  "localCacheHint": "歷史殘留快取",
  "manifestTitle": "安裝清單",
  "listedItems": ["A", "B", "C"],
  "missingManifestNote": "漏寫 X",
  "prodTitle": "正式環境",
  "prodCrashLabel": "缺 X · 啟動失敗",
  "cleanVmTitle": "空白雲端容器",
  "cleanAccuracyBadge": "部署前精準攔截",
  "crashClause": 1,
  "cleanClause": 2
}
```

### ㊳ `swiss_cheese_defense_layers` — 瑞士奶酪四层孔洞防线漏网异常 + 理想直线剧本 vs 真实混乱轨迹
Best for: `"mode": "swiss_cheese"` (multi-layer defense stopping known issues while an unseen edge case snakes through aligned gaps) OR `"mode": "script_vs_chaos"` (straight `1 -> 2 -> 3` test script vs chaotic squiggly real-world user trajectories).
```json
"primitive": "swiss_cheese_defense_layers",
"data": {
  "mode": "swiss_cheese",
  "layers": [
    { "label": "靜態規範", "gapXPct": 28 },
    { "label": "單元測試", "gapXPct": 50 },
    { "label": "打包預演", "gapXPct": 24 },
    { "label": "瀏覽器測試", "gapXPct": 44 }
  ],
  "blockedLabel": "已知問題",
  "leakedLabel": "未知邊界問題"
}
```

### ㊴ `regression_loop_stage` — `修好 A ⇄ 壞了 B` 双态死循环 + 矢量打地鼠痛点舞台
*(Also reachable via `metaphor_canvas` or `before_after_transformer` with `"mode": "regression_loop"`)*
Best for: Whack-a-mole regression bugs, fixing one thing only to break another, endless firefighting loops.
```json
"primitive": "regression_loop_stage",
"data": {
  "positiveLabel": "修好模組 A",
  "negativeLabel": "搞壞模組 B"
}
```

### ㊵ `dual_track_pipeline_race` — 双轨平行流水线竞速：半自动人工卡点 vs 全自动闪电直达
*(Also reachable via `pipeline_timeline_flow` or `idle_waste_vs_event_wake` with `"mode": "dual_track_race"`)*
Best for: Comparing twin concepts (Continuous Delivery vs Deployment, manual approval bottleneck vs zero-touch automation, synchronous blocking vs async streaming).
```json
"primitive": "dual_track_pipeline_race",
"data": {
  "topTrack": {
    "title": "半自動交付",
    "subtitle": "人工確認卡點",
    "gateLabel": "人工放行",
    "endTitle": "用戶端",
    "endStatus": "等待手動觸發"
  },
  "bottomTrack": {
    "title": "全自動部署",
    "subtitle": "主線更新即上線",
    "engineLabel": "自動部署引擎",
    "autoBadge": "全自動",
    "endTitle": "用戶端",
    "unlockedFeatureLabel": "新功能即時生效"
  },
  "autoClause": 1
}
```

### Extended Sub-Modes on Existing Primitives (v2.1 Upgrades)
- **`terminal_code_live`**: `lines[]` items additionally support `kind: "bullet" | "tree" | "input"` (for AI CLI conversation trees) and `circleWord: "KEYWORD"` (hand-drawn SVG ellipse highlighting a confusing term).
- **`spotlight_window_tour`**: Supports multi-beat `focusSequence: [{ xPct, yPct, wPct, hPct, zoomScale, tag, stepClause }]` and screenshot-free dark directory browser `treeItems: [{ depth, name, kind: "folder"|"file", focusStep, sideTag }]`.
- **`skill_editor_spotlight`**: Supports `"mode": "lint_cleanup"` (`codeLines: [{ code, flagLabel, flagTone, flagIcon, removeOnClean, stepNumber, highlightClause }]`, left `rules[]`, `rejectStamp`, and `sidePreview` with `∞` infinite-loop freeze).
- **`synergy_puzzle_pair`**: Supports `"mode": "bundler_funnel"` (micro-files funneling into spinning `cog` bundler -> `.html/.css/.js` package) and `"mode": "n_piece_mismatch"` (5 pieces passing individually with green checks, then colliding with coral seam X's).
- **`focus_hud_demo`**: Supports `"mode": "blur_handoff"` (raw error log blurs & recedes left -> `link` connector pill -> right AI agent window fixes automatically) and `"mode": "blur_strikethrough"` (complex config blurs with diagonal line + centered `"不用自己寫"`-style relief badge).
- **`arc_gauge_audit`**: Supports `"mode": "threshold_tripwire"` (left `criteria[]` evaluator card + right `180°` gauge with `#FE8A00` `thresholdPct` tick mark that trips coral red when `scorePct < thresholdPct`).

---

## 3. Semantic Script-to-Primitive Router (Mandatory Anti-Monotony Matching Matrix)

Do NOT lazily default to `flow_3node` and `matrix_compare` for every scene! Match each scene's rhetorical intent to its dedicated primitive:

| Spoken Rhetorical Pattern / Scene Intent | Best-Fit Primitive |
| :--- | :--- |
| 「表面看起来只要简单 3 步，但其实背后默默跑了一整套自动机制」 | `surface_vs_background_iceberg` |
| 「开一条新分支写功能，合并回主线前先过一道检查栅栏」 | `git_branch_merge_graph` |
| 「底下跑出一排检查项转圈圈，全部亮绿灯后才解锁按钮」 | `pr_checks_gate_card` |
| 「把错误格式的数据塞进栏位报错 / 算出 NaN / 不用开站 3 秒扫完」 | `slot_validation_and_stopwatch` |
| 「虚拟机器人 / 独立 AI 像真人一样进软件点击验收、录影并盖章放行」 | `autonomous_bot_ui_tester` |
| 「在我自己电脑上明明能跑（有旧残留），推上线却当机 vs 空白云端电脑重跑」 | `env_isolation_compare` |
| 「多层关卡只能拦住已知问题，没见过的漏洞会顺着缝隙钻过去 / 真实世界不按剧本走」 | `swiss_cheese_defense_layers` |
| 「修好 A 却搞坏 B，陷入打地鼠一样的死循环」 | `regression_loop_stage` |
| 「上轨卡在人工按确认，下轨闪电全自动直达终端用户」 | `dual_track_pipeline_race` |
| 「不用自己看懂满屏英文报错/配置，虚化后直接连给 AI 修好」 | `focus_hud_demo` (`mode: "blur_handoff"`) |
| 「低于 90% 门槛线就直接亮红灯熔断退货」 | `arc_gauge_audit` (`mode: "threshold_tripwire"`) |
| 「单看每个零件都没错，拼在一起才发现接口对不上 / 几百个小档打包成一个成品」 | `synergy_puzzle_pair` (`mode: "n_piece_mismatch"` / `"bundler_funnel"`) |
| 「清掉代码里的垃圾和危险写法 / 语法没错但跑起来陷入无限回圈」 | `skill_editor_spotlight` (`mode: "lint_cleanup"`) |
| 「很多人常犯的错是 X（杂事/慢做法），正确做法应该是 Y，结果从 128 变成 3」 | `before_after_transformer` |
| 「A 强在... B 强在... 把两边接在一起刚好互补」 | `synergy_puzzle_pair` |
| 「到底什么时候该用 A，什么时候该用 B？一个最简单的判断标准…」 | `binary_decision_tree` |
| 「定时每 10 分钟检查都在白白空转浪费 vs 事件触发平时休眠一秒唤醒」 | `idle_waste_vs_event_wake` |
| 「上层各自有独立入口/记忆，但底层共用同一台主机/数据库/中台」 | `convergent_hub_bus` |
| 「从产品、工程、商业、风控多个视角轮流发言抓盲点」 | `multi_perspective_ring` |
| 「读的权限很大方（88%）vs 写的权限很吝啬（15%）」或「速度快到怀疑但逐行全对」 | `arc_gauge_audit` |
| 「真实软件/网页局部操作演示（支持多拍推镜或目录树定位）」 | `spotlight_window_tour` |
| 「30 秒快速看懂主界面左、中、右三块分区」 | `annotated_ui_tour` |
| 「改动单一核心节点/需求，瞬间牵连周围八到十个耦合模块」 | `org_tree_radiate` |
| 「共用目录结构（context / specs / dist）+ 一句话跨模块交接」 | `split_tree_chat_dispatch` |
| 「接下来分五步走：第一步…第二步…」（4步以上自动启用双层圆环+胶囊+范围括弧） | Add `stepper: [...]` + `activeStepIndex` + `stepperBracket` on `scene.data` |
| 「具象比喻金句锚点（如笔电着火 vs 云端安稳、微缩办公室、门铃）」 | `vignette_metaphor_stage` |

---

## 4. Clause-Synchronized Smooth Focus & Motion Hygiene (`scene.data`)

`StudioVideo.tsx` uses bidirectional `SPRING_SILKY` (`getSmoothClauseValue`) across clause boundaries so focus rings, border tints, scale elevations (`1.0 -> 1.022`), and dim opacities glide smoothly instead of hard-snapping on single frames, while snapping cleanly via `settle()` once stationary to prevent subpixel CJK anti-aliasing shimmer.

1. **Explicit Clause-to-Element Mapping (`clauseFocus`)**:
   - Supported on `flow_3node`, `matrix_compare`, `terminal_code_live`, `ranked_bars`, `evidence_clip`, and `skill_editor_spotlight`.
   - Pass `"clauseFocus": [0, 1, 2, -1]` (one integer per clause) whenever `clauses.length !== items.length`:
     - `0..N-1`: Smoothly spotlights that node / column / line / bar / excerpt on that clause.
     - `-1`: Intro or summary beat — keeps all items at balanced neutral visibility with zero single-item spotlight.
2. **Row-Level Sub-Item Focus in `matrix_compare` (`itemFocus`)**:
   - Optional `"itemFocus": [-1, 0, 1, 0, 1]` paired with `clauseFocus` highlights a specific row card inside the active `matrix_compare` column on each spoken beat.
3. **`evidence_clip` Title Intro Beat**:
   - When `clauses.length === excerpts.length + 1` (and `clauseFocus` is omitted), Clause `0` automatically acts as the document header / speaker intro beat (`focusedIdx = -1`), and Clauses `1..N` highlight Excerpts `0..N-1` exclusively one by one.
4. **Proportional `dot_matrix_stat` Ratios**:
   - Always match `highlightDots` proportionally to `totalDots` and the spoken percentage (e.g., `"90%"` with `"totalDots": 200` -> `"highlightDots": 180` or `"88%"` -> `176`), never an unscaled literal `88` out of `200`.
5. **Compact `focus_hud_demo` Button Labels**:
   - Keep `primaryAction`, `clickedLabel`, and `secondaryAction` concise (`<= 6` CJK chars or `<= 14` English chars, e.g. `"切换身份"` / `"已锁定"` / `"硬撑"`) so buttons never wrap or crowd the HUD footer; the animated cursor lands on the bottom-right corner of the primary button with a press-bounce + emerald ripple without covering button text.
