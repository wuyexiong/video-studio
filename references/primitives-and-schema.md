# `video_project.json` Schema & 22 Universal Remotion Primitives

All renders in `video-studio` are 100% data-driven via a single `video_project.json` manifest placed in the user's active workspace. You do NOT need to copy `node_modules` or scaffold a new React project in the user's workspace.

---

## 0. Universal Top Scene Thesis Header (`scene.data`)

Every scene (regardless of `primitive`) supports an optional **Top Scene Thesis Header** rendered by `SceneThesisHeader`:
- `topPill`: Top-center rounded capsule label (e.g. `"AI 圈最近爆红的 SKILL"` or `"电商网站，改用「使用者功能」垂直切分"`).
- `topPillTag`: Optional highlighted tag prefix inside `topPill` (e.g. `"同一题"`). If omitted, an amber dot is rendered.
- `topTitle`: Top-center bold thesis equation or question (e.g. `"grill-me = AI 反过来拷问你"`, `"TDD = 防作弊机制"`, `"好架构 = 深模组 (Deep Module)"`).
- `topAccentWord`: Substring inside `topTitle` to highlight in a semantic color (e.g. `"grill-me"`, `"TDD"`, `"深模组"`).
- `topAccentTone`: `"amber"` (default) | `"emerald"` | `"coral"`.

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

### ⑮ `split_tree_chat_dispatch` — 左树居中生长 ➔ 平滑左移分屏 ➔ 右侧聊天派工联动（复刻《Grok Bot》13:00）
Best for: Shared workspace / context folder tree growing in center, then shifting left to reveal multi-agent task handoff and live prompt typing while highlighting the referenced folder row.
```json
"primitive": "split_tree_chat_dispatch",
"data": {
  "rootLabel": "雲端硬碟 · Shared Drive",
  "workspaceName": "workspace",
  "folders": [
    { "name": "context", "files": "about.md · brand.md", "stepClause": 0 },
    { "name": "meetings", "files": "spec.md", "stepClause": 1, "highlight": true },
    { "name": "projects", "files": "官網程式碼", "stepClause": 2 }
  ],
  "shiftClause": 2,
  "typeClause": 3,
  "fromBot": "幕僚長",
  "toBot": "Dev bot",
  "dispatchBadge": "一句話派工",
  "chatPrompt": "根據 meetings 裡面討論出來的規格幫我寫官網，品牌規範看 context，做完存到 projects"
}
```

### ⑯ `annotated_ui_tour` — 三栏软件界面 + 暗化聚光灯移动 + `① ② ③` 序号分步导览（复刻《Grok Bot》04:20）
Best for: 30-second UI walkthroughs of any app (Left sidebar, Center chat/canvas, Right inspector), lighting up each pane with an amber spotlight and numbered circle `① ② ③` on `stepClause`.
```json
"primitive": "annotated_ui_tour",
"data": {
  "topTitle": "30 秒看懂軟體主介面",
  "zones": [
    { "badge": "1", "title": "左側：專職 Bot 清單", "subtitle": "釘選幕僚長與群組分區", "items": ["★ 幕僚長", "🎨 設計主管", "📈 美股情報員"], "stepClause": 0 },
    { "badge": "2", "title": "中間：自然語言對話區", "subtitle": "交代目標或跳出確認小卡", "items": ["主動彈出推薦任務", "敏感操作預覽確認"], "stepClause": 1 },
    { "badge": "3", "title": "右側：排程 · 資料庫 · 雲端電腦", "subtitle": "隨時接管遠端螢幕", "items": ["Routines 定時排程", "Library 檔案庫", "Computer 雲端桌面"], "stepClause": 2 }
  ]
}
```

### ⑰ `org_tree_radiate` — 1对多上下级组织树对比（没中间层 vs 幕僚长）或无碰撞星型放射导图（复刻《Grok Bot》05:50 & 《grill-me》08:50）
Best for: `"mode": "hierarchy_compare"` (Left tangled 1-to-5 lines management fatigue vs. Right clean Chief-of-Staff 1-to-3 tree) OR `"mode": "radial_mindmap"` (Center action radiating lines to 8~10 files in an elliptical polar ring, e.g., Shotgun Surgery).
```json
"primitive": "org_tree_radiate",
"data": {
  "mode": "hierarchy_compare",
  "topTitle": "為什麼第一隻 Bot 要設成幕僚長？",
  "rightClause": 1,
  "chiefTitle": "幕僚長 (Chief of Staff)",
  "subBots": ["晨間信箱秘書", "美股情報員", "全端工程師"]
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

### ㉒ `metaphor_canvas` — 核心比喻剖面剧场（「没有大门的房子」或「36 颗神经网络参数旋钮面板」，复刻《grill-me》11:45 & 《AI 背後怎麼運作》10:15）
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
