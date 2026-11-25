# 5 Content Archetypes & 3–15 Minute Long-Form Director Guide

## 1. Archetype Routing Matrix (5 Video Genres)

| Archetype ID | Use Case | Scene Mix (Live Stream : Diagram : Breathing/Evidence) | Signature Sequence Pattern |
| :--- | :--- | :---: | :--- |
| **`teardown`** | 海外 SaaS / 独立开发产品商业拆解 | `30% : 40% : 30%` | `focus_hud_demo` (痛点钩子) &rarr; `live_web_showcase` (官网/定价实录) &rarr; `evidence_clip` (条款底牌) &rarr; `flow_3node` (技术栈与毛利) &rarr; `matrix_compare` (竞品与差评) &rarr; `chapter_card` (7天微创新结论) |
| **`yt-explainer`** | YouTube 深度演讲 / 外文长视频二创精讲 | `20% : 50% : 30%` | `persona_quote` (原作者背书+核心暴论) &rarr; `dot_matrix_stat` (反常识数据) &rarr; `chapter_card` (章节设问) &rarr; `flow_3node` / `ranked_bars` (把抽象原话翻译成白话视觉) &rarr; `chapter_card` (个人实战洞察) |
| **`science`** | AI / 编程 / 商业底层原理动画科普 | `15% : 60% : 25%` | `focus_hud_demo` (具象生活/开发困惑) &rarr; `evidence_clip` (经典论文/事故引出) &rarr; `flow_3node` &rarr; `ranked_bars` &rarr; `matrix_compare` (层层递进拆黑盒) &rarr; `chapter_card` (一句话本质记忆锚点) |
| **`github`** | GitHub 开源项目拆解与跑通实战 | `35% : 40% : 25%` | `live_web_showcase` (Repo 首页与 Star 趋势) &rarr; `terminal_code_live` (三行命令跑通实况) &rarr; `flow_3node` (核心目录与数据流) &rarr; `matrix_compare` (对比同类闭源/开源方案) &rarr; `chapter_card` (商业化或自用建议) |
| **`hands-on`** | 新产品 / 新模型第一时间上手实测 | `50% : 25% : 25%` | `chapter_card` (实测悬念开场) &rarr; 多段 `live_web_showcase` / `terminal_code_live` (核心 Case 实测流) &rarr; `ranked_bars` (速度/价格/准确率实测分) &rarr; `matrix_compare` (红绿优缺点总结) &rarr; `chapter_card` (值不值得冲) |

---

## 2. Scaling to 3–5 Minute and 10–15 Minute Videos Without Fatigue or Crashes

### 2.1 Word Count & Chapter Budgeting (`~345 CPM` Golden Cadence)
At the empirically verified comfort cadence (`340~355` Chinese characters + English words per minute, `speed_factor: 1.08 ~ 1.12`):
- **60–90s Short Video**: `350 ~ 520` units &rarr; **2 Chapters** (`6 ~ 9` scenes total)
- **3–5 Minute Mid-Form Video**: `1,050 ~ 1,750` units &rarr; **4 ~ 6 Chapters** (`45~55s` per chapter, `22 ~ 36` scenes total)
- **8–12 Minute Deep-Dive Video**: `2,750 ~ 4,150` units &rarr; **8 ~ 12 Chapters** (`50~60s` per chapter, `50 ~ 75` scenes total)

### 2.2 Four Mandatory Anti-Fatigue Laws for Long Videos (`> 2 Minutes`)
1. **Flexible Cold Open (`ch1_s1`) + Macro Chapter Reset Every `45~60s`**:
   - **Cold Open (`ch1_s1`) is NOT fixed**: Choose the best opening primitive for the story's strongest hook (`dot_matrix_stat` for shocking numbers, `live_web_showcase` for visual product reveal, `evidence_clip` for document/clause forensics, `persona_quote` for authority/founder thesis, `focus_hud_demo` for concrete UX pain points, or `chapter_card` for a sharp contrarian question).
   - **Chapter 2+ Reset**: Every chapter after Chapter 1 should open with a high-whitespace `chapter_card`, `persona_quote`, or `evidence_clip` posing a sharp conversational question (e.g., *"既然算力成本是零，为什么它首周流水还不到一千美金？"*), paired with `chapter_tail_pause_ms: 600` at the end of the preceding chapter so the viewer's brain gets a clean breath reset.
2. **Zero Adjacent Primitive Repeats**:
   Never use `flow_3node` twice in a row or `ranked_bars` twice in a row. Rotate across all 10 primitives (`build_video.py --lint-only` automatically audits this).
3. **Dual Voice-Anchor Modulation (`mix` ↔ `zh`)**:
   - Use `"preset": "mix"` on technical mechanisms, live demos, code walkthroughs, and data comparisons (crisp, brisk rhythm).
   - Switch to `"preset": "zh"` on macro chapter openings, storytelling analogies, and final takeaways (deeper, calmer narrative gravitas).
4. **Multi-Clip Capture Pool**:
   For a 5-minute video, define `3 ~ 5` distinct `4.5s` entries in `captures[]` targeting different URLs or page sections (e.g., Hero section, Pricing calculator, GitHub Issues page, Documentation architecture diagram) rather than replaying a single clip.

---

## 3. Conversational Scriptwriting Checklist (Anti-AI-Script Tone)

- **Short Breath Clauses**: `8 ~ 16` units per clause (hard cap `19`). Break every `"通过...从而实现了..."` into two active spoken beats.
- **Zero Throat-Clearing Openers**: Never start with *"大家好，今天我们来聊一聊..."*. Start at `0.0s` with a concrete conflict, counter-intuitive number, or sharp question.
- **Rhetorical Question Hooks (`≥ 8%` of clauses)**: Drop a short question (`"问题出在哪？"`, `"真有这么神吗？"`) before unveiling key insights — `build_video.py` automatically detects `？`/`?` and inserts a `420ms` suspense pause before the answer!
