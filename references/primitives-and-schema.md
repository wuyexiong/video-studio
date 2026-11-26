# `video_project.json` Schema & 31 Domain-Agnostic Remotion Primitives

All renders in `video-studio` are 100% data-driven via a single `video_project.json` manifest placed in the user's active workspace. You do NOT need to copy `node_modules` or scaffold a new React project in the user's workspace.

---

## 0. Universal Scene Thesis & Connected Multi-Stage Stepper Header (`scene.data`)

Every scene (regardless of `primitive`) supports an optional **Top Scene Header** rendered by `SceneThesisHeader`:
- `stepper`: Connected horizontal progress pills for multi-part chapters, e.g. `["獲客漏斗", "定價策略", "技術護城河"]` or `[{ "label": "外掛整合", "status": "done" }, { "label": "標準流程", "status": "active" }, { "label": "自動觸發", "status": "pending" }]`. Completed items automatically show an emerald `✓` circle; active item lights up in solid `#FE8A00`.
- `activeStepIndex`: Zero-based index of the active pill when `stepper` is a string array (e.g. `1`).
- `subStepper`: Optional second-row sub-step pills (e.g. `["1 自然語言", "2 匯入規格", "3 錄製示範"]`), synced to `activeSubStepIndex` or current spoken clause.
- `topPill`: Top-center rounded capsule label (e.g. `"同一題 · 垂直功能切片"`).
- `topPillTag`: Optional highlighted tag prefix inside `topPill` (e.g. `"解法"`). If omitted, an amber dot is rendered.
- `topTitle`: Top-center bold thesis equation or question (e.g. `"TDD = 防作弊機制"`, `"好架構 = 深模組 (Deep Module)"`).
- `topAccentWord`: Substring inside `topTitle` to highlight in a semantic color (e.g. `"TDD"`, `"深模組"`).
- `topAccentTone`: `"amber"` (default) | `"emerald"` | `"coral"`.

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
  "show_waveform": true,
  "subtitle_font_size": 56,
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

## 2. The 22 Universal Visual Primitives (`scene.primitive` & `scene.data`)

Never place the same `primitive` back-to-back! Alternate across these 22 primitives:

### ① `chapter_card` — 全屏琥珀竖线呼吸转场 / 核心结论卡（支持 `heroUnderlineMode` 开场大字下划线模式）
Best for: Chapter openings (every 45–60s), thesis statements, final summary takeaways (`85%` whitespace), or hero keyword cold opens (`heroUnderlineMode: true`).
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
When `heroUnderlineMode: true`: renders giant centered monospace `headline` (e.g. `"grill-me"`) with a dynamically growing amber underline bar, `subheadline` on clause 2, and `pills` on clause 3.

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

### ⑫ `stack_slice_builder` — 并排容器垂直切片积木堆叠画布
Best for: Vertical slice (`to-tickets` by user feature) vs. horizontal layer comparison, multi-agent task allocation, modular stack building synchronized to `stepClause`.
```json
"primitive": "stack_slice_builder",
"data": {
  "topPillTag": "同一题",
  "topPill": "电商网站，改用「使用者功能」垂直切分",
  "columns": [
    {
      "badge": "1",
      "title": "会员登入功能",
      "stepClause": 1,
      "footerBadge": "✓ 做完第 1 步就能立刻开浏览器实测",
      "footerClause": 3,
      "layers": [
        { "label": "前端登入画面", "sub": "Login UI Component", "color": "amber", "stepClause": 2 },
        { "label": "后端登入逻辑", "sub": "Auth API & Session", "color": "purple", "stepClause": 2 },
        { "label": "专属登入资料库", "sub": "Users Table Schema", "color": "blue", "stepClause": 2 }
      ]
    }
  ]
}
```

### ⑬ `traffic_gate_box` — `TDD = 防作弊机制` 死规矩锁卡 + 红绿灯状态机画布
Best for: TDD red-to-green verification gates, permission boundary checks, invariant rules.
```json
"primitive": "traffic_gate_box",
"data": {
  "mode": "tdd_lights",
  "topTitle": "TDD = 防作弊机制",
  "topAccentWord": "TDD",
  "topAccentTone": "amber",
  "lockTitle": "先把测试死规矩定死",
  "ruleLeft": "满 $1,000",
  "ruleRight": "只能 -$100",
  "lockNote": "防止 AI 把程式写错成扣 $200，再伪造一份假测试骗过关",
  "redClause": 2,
  "greenClause": 3
}
```

### ⑭ `deep_module_box` — `好架构 = 深模组` 统一大门封装架构图
Best for: Deep module vs. shallow module encapsulation, API gateway / facade patterns, Chief-of-Staff bot routing.
```json
"primitive": "deep_module_box",
"data": {
  "mode": "deep_module",
  "topTitle": "好架构 = 深模组 (Deep Module)",
  "topAccentWord": "深模组",
  "topAccentTone": "emerald",
  "callerLabel": "💻 主程式 (Main Controller)",
  "doorFunction": "🚪 processCheckout() 统一大门",
  "rooms": ["计算折扣", "验证信用卡", "建立订单", "扣除库存", "寄确认信"],
  "bottomCaption": "✓ 对外只有一扇门，对内全封装（保护 AI Context Window 不迷路）",
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
  "dispatchBadge": "上下文零重複交接",
  "dispatchText": "依據 specs 規格與 context 規範實作結帳頁，產物輸出至 dist"
}
```

### ⑯ `annotated_ui_tour` — 三栏软件界面 + 暗化聚光灯移动 + `① ② ③` 序号导览（支持右上倒数环 `countdownSec`）
Best for: 30-second UI walkthroughs of any SaaS/desktop app (Left nav, Center canvas, Right inspector), lighting up each pane with an `#FE8A00` spotlight on `stepClause`.
```json
"primitive": "annotated_ui_tour",
"data": {
  "countdownSec": 30,
  "zones": [
    { "badge": "1", "title": "左側：模組導覽清單", "subtitle": "分類分組與高頻釘選", "items": ["★ 核心入口釘選", "📂 專案工作區分組"], "stepClause": 0 },
    { "badge": "2", "title": "中間：核心互動主畫布", "subtitle": "指令輸入與確認預覽", "items": ["主動推薦下一步動作", "敏感變更前跳出確認卡"], "stepClause": 1 },
    { "badge": "3", "title": "右側：狀態 · 資源庫 · 監控", "subtitle": "展開檢視底層運行環境", "items": ["定時排程與 Webhook", "共用知識庫", "即時運行畫面"], "stepClause": 2 }
  ]
}
```

### ⑰ `org_tree_radiate` — 无框高留白「1对多散乱直连 vs 统一中枢层」对比 或 无碰撞星型放射导图
Best for: `"mode": "hierarchy_compare"` (Left direct 1-to-5 fanout overhead vs. Right clean single-hub routing layer) OR `"mode": "radial_mindmap"` (Center change radiating to 8~10 coupled files).
```json
"primitive": "org_tree_radiate",
"data": {
  "mode": "hierarchy_compare",
  "rightClause": 1,
  "topActor": "調用端",
  "hubTitle": "統一閘道中樞 (API Gateway)",
  "leafNodes": ["帳務服務", "風控引擎", "通知模組"]
}
```

### ⑱ `pipeline_timeline_flow` — 9步长流水线「错误多米诺骨牌传染」或并发时间轴竞态漏洞（复刻《grill-me》01:58 & 《资安》19:30）
Best for: `"mode": "domino_pipeline"` (Steps 1..9 where an early failure at `failStartIndex` cascades coral-red domino contagion across all downstream steps) OR `"mode": "race_timeline"` (T=0s balance check -> 5.0s external AI window -> T=5s deduction, showing concurrent script exploit vs. instant freeze pre-deduction).
```json
"primitive": "pipeline_timeline_flow",
"data": {
  "mode": "domino_pipeline",
  "topTitle": "大框架的通病：從頭到尾全部替你做主",
  "steps": ["釐清目標", "寫規格", "寫計畫", "拆任務", "設計", "寫測試", "實作", "審查", "收尾"],
  "failClause": 1,
  "failStartIndex": 1
}
```

### ⑲ `defense_boundary_flow` — 两扇圆拱门防线（Authentication vs Authorization）或信任边界架构图（复刻《资安》05:30 & 07:40）
Best for: `"mode": "two_arches"` (Two grand arched doors: Authentication vs Authorization) OR `"mode": "trust_boundary"` (Red dashed Untrusted Browser Zone crossing the vertical amber Trust Boundary into the green solid Trusted Backend + Database RLS Zone).
```json
"primitive": "defense_boundary_flow",
"data": {
  "mode": "two_arches",
  "topTitle": "資安最關鍵的兩道防線",
  "arch1Title": "身分驗證",
  "arch1En": "Authentication",
  "arch1Footer": "🔑 第一道門：進門的資格",
  "arch2Title": "權限授權",
  "arch2En": "Authorization",
  "arch2Footer": "🛡️ 第二道門：進門後能碰什麼？"
}
```

### ⑳ `row_permission_table` — 横向行级角色权限表（带绿勾 `✓ 可以碰` 与红叉 `✗ 不能碰` 胶囊，复刻《资安》06:15）
Best for: Multi-role access control matrices, feature tier tables, or policy comparisons revealed row-by-row on `stepClause`.
```json
"primitive": "row_permission_table",
"data": {
  "topTitle": "誰能碰什麼資產？角色權限配對表",
  "rows": [
    { "icon": "🚶", "role": "路人訪客", "sub": "未註冊", "allowed": ["公開首頁"], "blocked": ["影片 / 專案", "後台"], "stepClause": 0 },
    { "icon": "🙂", "role": "免費用戶", "sub": "已註冊", "allowed": ["自己的短影片"], "blocked": ["別人的專案", "付費功能"], "stepClause": 1 },
    { "icon": "💎", "role": "付費用戶", "sub": "已買點數", "allowed": ["自己的長影片", "付費點數"], "blocked": ["系統後台"], "stepClause": 2 }
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

### ㉒ `metaphor_canvas` — 核心比喻剖面剧场（「没有大门的房子」或「36 颗神经网络参数旋钮面板」）
Best for: `"mode": "no_door_house"` (Architectural cross-section house without a front door where kitchen/living-room/bedroom require climbing windows or chimneys) OR `"mode": "rotary_knobs"` (27 rotary weight knobs continuously turning and tuning angles).
```json
"primitive": "metaphor_canvas",
"data": {
  "mode": "no_door_house",
  "topTitle": "淺模組 = 沒有大門的房子",
  "topAccentWord": "沒有大門",
  "topAccentTone": "coral"
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
    { "label": "商業決策", "icon": "★", "color": "#FE8A00" },
    { "label": "產品體驗", "icon": "P", "color": "#FF6911" },
    { "label": "工程架構", "icon": "</>", "color": "#17B7A6" },
    { "label": "合規風控", "icon": "🛡️", "color": "#7C5BFD" }
  ],
  "messages": [
    { "speaker": "產品體驗", "text": "首屏三秒內讓免費用戶跑通第一個結果", "stepClause": 0 },
    { "speaker": "工程架構", "text": "重度推理改走非同步佇列，避免阻塞主執行緒", "stepClause": 1 },
    { "speaker": "商業決策", "text": "免費額度設單日硬上限，匯出高清版觸發付費牆", "stepClause": 2 }
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

### ㉗ `arc_gauge_audit` — 双半圆反差仪表盘（`dual_compare`）或 极速指针+骨架屏逐行绿勾扫描（`speed_scan`）
Best for: Permission boundaries (Read Wide vs Write Strict), unit economics contrast (Margin vs CAC), or ultra-fast response + accuracy verification.
```json
"primitive": "arc_gauge_audit",
"data": {
  "mode": "dual_compare",
  "leftTitle": "讀取與分析權限",
  "leftTag": "大方開放 · 掌握完整脈絡",
  "leftPct": 88,
  "leftIcon": "👁️",
  "rightTitle": "外部寫入與扣款",
  "rightTag": "嚴格收緊 · 必經人工確認",
  "rightPct": 15,
  "rightIcon": "🔒"
}
```

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
  "question": "產品商業化該選「買斷制」還是「月訂閱」？",
  "leftBranchLabel": "零雲端算力成本",
  "leftTitle": "$29 終身買斷制",
  "leftDetail": "消除用戶訂閱疲勞，首週現金流轉化率高 3 倍",
  "rightBranchLabel": "持續消耗外部 API",
  "rightTitle": "$19/月 分級訂閱制",
  "rightDetail": "綁定每月額度上限，嚴防重度用戶倒貼算力費",
  "footerWarning": "⚠️ 切忌：後端調用昂貴大模型卻賣終身買斷，必將坐吃山空"
}
```

### ㉚ `spotlight_window_tour` — 暗色圆角实录窗 + `blurZones[]` 非焦点打码压暗 + `#FE8A00` 聚光框推镜
Best for: Any real app/website screenshot or `.mp4` clip where distracting sidebars/text are automatically blurred while `#FE8A00` frames the exact target control.
```json
"primitive": "spotlight_window_tour",
"data": {
  "windowTitle": "dashboard.stripe.com/billing",
  "imageFile": "./assets/billing_screen.png",
  "blurZones": [
    { "xPct": 0, "yPct": 0, "wPct": 24, "hPct": 100 },
    { "xPct": 25, "yPct": 62, "wPct": 75, "hPct": 38 }
  ],
  "focusBox": { "xPct": 28, "yPct": 22, "wPct": 48, "hPct": 32 },
  "zoomScale": 1.16,
  "pills": ["零代碼接入", "自動稅務合規"]
}
```

### ㉛ `vignette_metaphor_stage` — 径向暗角羽化视觉隐喻剧场 + 动态悬浮批注与清单卡
Best for: High-memorability visual metaphor anchors (`imageFile` seamlessly blended into `#262626` via radial mask, or built-in vector contrast stage) paired with spring callout pills.
```json
"primitive": "vignette_metaphor_stage",
"data": {
  "imageFile": "./assets/cloud_vs_local.png",
  "leftCallout": "本機斷電即中斷",
  "rightCallout": "雲端獨立持續運行",
  "checklist": ["自動重試失敗任務", "保留登入授權狀態", "完成後主動推播通知"]
}
```

---

## 3. Semantic Script-to-Primitive Router (Mandatory Anti-Monotony Matching Matrix)

Do NOT lazily default to `flow_3node` and `matrix_compare` for every scene! Match each scene's rhetorical intent to its dedicated primitive:

| Spoken Rhetorical Pattern / Scene Intent | Best-Fit Primitive |
| :--- | :--- |
| 「很多人常犯的错是 X（杂事/慢做法），正确做法应该是 Y，结果从 128 变成 3」 | `before_after_transformer` |
| 「A 强在... B 强在... 把两边接在一起刚好互补」 | `synergy_puzzle_pair` |
| 「到底什么时候该用 A，什么时候该用 B？一个最简单的判断标准…」 | `binary_decision_tree` |
| 「定时每 10 分钟检查都在白白空转浪费 vs 事件触发平时休眠一秒唤醒」 | `idle_waste_vs_event_wake` |
| 「上层各自有独立入口/记忆，但底层共用同一台主机/数据库/中台」 | `convergent_hub_bus` |
| 「从产品、工程、商业、风控多个视角轮流发言抓盲点」 | `multi_perspective_ring` |
| 「读的权限很大方（88%）vs 写的权限很吝啬（15%）」或「速度快到怀疑但逐行全对」 | `arc_gauge_audit` |
| 「真实软件/网页局部操作演示（需虚化周围杂乱文字并框选按钮）」 | `spotlight_window_tour` |
| 「30 秒快速看懂主界面左、中、右三块分区」 | `annotated_ui_tour` |
| 「没有中间层一对多管理疲劳 vs 设一个统一调度层收敛分发」 | `org_tree_radiate` |
| 「共用目录结构（context / specs / dist）+ 一句话跨模块交接」 | `split_tree_chat_dispatch` |
| 「接下来需要做三件事：第一…第二…第三…」（跨多场持续显示当前进度） | Add `stepper: [...]` + `activeStepIndex` on `scene.data` |
| 「具象比喻金句锚点（如笔电着火 vs 云端安稳、微缩办公室、门铃）」 | `vignette_metaphor_stage` |

---

## 3. Clause-Synchronized Smooth Focus & Motion Hygiene (`scene.data`)

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
