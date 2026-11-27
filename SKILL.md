---
name: video-studio
description: >-
  End-to-end automated 16:9 widescreen video production studio (15s shorts up to
  3-30+ minute deep-dive videos) in a warm matte editorial style (#262626
  high-whitespace canvas, #323232 cards, #FE8A00 amber accent, zero AI-PPT blue neon).
  Supports 5 content archetypes: product teardowns, YouTube secondary
  explainers, tech/science animations, GitHub repo deep-dives, and hands-on
  product reviews. Integrates dual-mode voiceover (personal GPT-SoVITS voice
  clone on 127.0.0.1:9880 with coherent thought-group prosody & 3-tier semantic pauses,
  or raw human recording auto-cleanup), podcast-grade LRA 3.5 LU zero-BGM mastering,
  Qwen3-ForcedAligner millisecond alignment, 60fps Chrome dynamic web capture,
  40 domain-agnostic Remotion primitives + proportional segmented chapter bar + 2-tier circle stepper HUD (100% code-drawn vector icons, zero emoji),
  chapter-chunked incremental rendering, and 16:9 (1920x1080) MP4 + SRT output.
  Use whenever the user invokes /video-studio or asks to turn a report, URL,
  GitHub repo, YouTube video/SRT, or draft script into a video.
---

# Video Studio (`video-studio`)

Turn any research artifact, product teardown HTML, YouTube transcript, GitHub repository, technical concept, or rough voice/text draft into a broadcast-ready `16:9` (`1920×1080`, YouTube / Bilibili / X / 小红书横屏 / 视频号横屏) video using the user's signature **Warm Matte Editorial (`#262626`)** visual language and personal cloned voice.

---

## 1. Non-Negotiable Redlines & Machine Environment

1. **System Safety Redlines**:
   - NEVER modify or uninstall `/opt/homebrew/bin/python3`.
   - NEVER delete, rename, or overwrite weights or reference prompts inside `/Users/hahaxiong/Toos/VoiceClone/`.
   - Always invoke Python audio/alignment scripts via `/opt/homebrew/Cellar/rapid-mlx/1.0.2/libexec/bin/python` (requires `BypassSandbox: true` for Apple Metal GPU access and localhost `9880` TTS).
   - Always invoke Chrome via `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (never download duplicate Chromium or Playwright FFmpeg binaries).
2. **5 Visual, Copy & Vocal Anti-Patterns (Strictly Banned)**:
   - **NO `#0f172a` cyber-blue neon glassmorphism cards**: Canvas is locked to neutral warm charcoal `#262626` (`≥72%` whitespace) + `#323232` `1px` `#3D3D3D` hairline cards + `≤4%` `#FE8A00` warm amber accent + `#090909` borderless subtitle capsule (`show_waveform: true`, `subtitle_font_size: 56`).
   - **NO verbose prose paragraphs on Remotion cards (`6-8-12 Minimal Copy Diet`) & NO fake `.sh` terminals**: Spoken `clauses` carry causal logic and full sentences; on-screen `scene.data` carries **only distilled keywords, contrast tags, and hard metrics** (`badge / pill / stepper / rooms <= 6` CJK chars, `title <= 8` CJK chars, `subtitle / detail / note <= 12` CJK chars, total canvas `<= 45` CJK chars/scene — enforced by `build_video.py` linter). Never disguise marketing/ops checklists as `.sh` commands inside `terminal_code_live` or `skill_editor_spotlight`; reserve CLI/editor primitives strictly for real commands, code, configs, or `SKILL.md` prompts.
   - **NO unframed raw desktop screen captures or static screenshots pretending to be video**: Wrap all app/web visuals inside `spotlight_window_tour` or `live_web_showcase` (with `blurZones[]` dimming non-focus clutter), or record real `60fps` Chrome streams via [capture_web.mjs](./scripts/capture_web.mjs) (bind `captures[].sceneId` so capture duration auto-matches spoken narration without freezing).
   - **NO single outer frame locked for the whole video, NO emoji icons, & NO drone/pop audio spam**: Never repeat the same `primitive` in two consecutive scenes (`scene[i].primitive != scene[i-1].primitive`). Never use raw emoji characters inside `scene.data` — always pass semantic vector icon keys (`"bot"`, `"lock"`, `"zap"`, `"scale"`, `"cog"`, `"trash"`, `"alert"`, `"git-branch"`, `"git-pr"`, `"globe"`, `"package"`, `"cloud"`, `"monitor"`, `"bug"`, `"shield"`) rendered by `<StudioVectorIcon />`. Keep `ambient_bed: false` (pure `-65 dBFS` black pause floor, `LRA ~ 3.5 LU`) and never spam per-clause pop SFX.
   - **NO bouncing karaoke captions, robotic isolated clauses, or unnatural `"1 个"` numerals**: Each clause must be `8~16` spoken units (median `12`, hard cap `19`). End continuation clauses with `，` so `build_video.py` synthesizes `2~3` continuation clauses in one coherent `cut0` pass (natural mid-sentence pitch suspension) while reserving `。` / `？` for true sentence drops and `700~850ms` suspense pauses! **CRITICAL SUBTITLE SYNC & NUMERAL LAW**: `display_text` MUST match spoken `tts_text` **1:1 word-for-word**! Use Arabic digits for concrete data, prices, percentages, and durations (`$9.99`, `84.5%`, `30,000 张`, `3 分钟`), while keeping Chinese characters in fixed idioms and general quantifiers (`一个`, `一遍`, `第三方`, `一人公司`, `一刀切` — NEVER `"1 个"` or `"第 3 方"`). NEVER paraphrase or insert unspoken words in `display_text`.

---

## 2. Step-by-Step Production Workflow

### Step 1: Route Content Archetype & Target Duration
Read [archetypes-and-longform.md](./references/archetypes-and-longform.md) to select the matching archetype preset and chapter structure:
- **`teardown`** (产品商业拆解 · `3:4:3` 实录/图解/呼吸卡)
- **`yt-explainer`** (YouTube 视频二次精讲 · `2:5:3` 原作者锚点/白话重绘图解/升华卡；若输入为无字幕参考视频，先用 `rapid-mlx` 的 `whisper-large-v3-turbo` 转写)
- **`science`** (硬核概念与技术科普 · `1.5:6:2.5` 剪报引出/点阵与节点推演/设问呼吸卡)
- **`github`** (GitHub 开源项目拆解 · `3.5:4:2.5` Repo 网页实录+终端 CLI 流/模块调用图/适用评估)
- **`hands-on`** (产品上手体验测评 · `5:2.5:2.5` 真机交互视频流/红绿优缺点矩阵/购买建议)

> **Approval Gate Rule for Long Videos (`> 60 seconds`)**:
> If the user asks for a **3~15 minute full video** without having approved the script/outline yet, first present the **Chapter Outline + Opening 15s Sample or Script Table** for quick confirmation (or render Chapter 1 first in ~15 seconds) before synthesizing 10 minutes of scenes. If the user explicitly says "直接直出全片", render all chapters directly.

### Step 2: Author `video_project.json` in the User's Active Workspace
Read [primitives-and-schema.md](./references/primitives-and-schema.md) for the exact JSON schema of `video_project.json`, the **Proportional Chapter-Segmented Top Bar**, the **Universal Scene Header (`topTitle` / `topPill` / `stepper` / `stepperStyle: "circles"` / `stepperBracket`)**, the **Semantic Script-to-Primitive Router**, and all **40 Domain-Agnostic Remotion Primitives**:
`chapter_card` (supports `heroUnderlineMode`), `persona_quote`, `dot_matrix_stat`, `flow_3node`, `matrix_compare`, `focus_hud_demo` (supports `blur_handoff` & `blur_strikethrough`), `live_web_showcase`, `terminal_code_live` (supports `bullet`/`tree`/`input` & SVG `circleWord`), `ranked_bars`, `evidence_clip`, `skill_editor_spotlight` (supports `lint_cleanup`, inline row removal & side `∞` crash preview), `stack_slice_builder`, `traffic_gate_box`, `deep_module_box`, `split_tree_chat_dispatch`, `annotated_ui_tour`, `org_tree_radiate`, `pipeline_timeline_flow`, `defense_boundary_flow`, `row_permission_table`, `acronym_token_slot`, `metaphor_canvas`, `before_after_transformer`, `synergy_puzzle_pair` (supports `n_piece_mismatch` & `bundler_funnel`), `multi_perspective_ring`, `convergent_hub_bus`, `arc_gauge_audit` (supports `threshold_tripwire`), `idle_waste_vs_event_wake`, `binary_decision_tree`, `spotlight_window_tour` (supports `focusSequence` & `treeItems`), `vignette_metaphor_stage`, `surface_vs_background_iceberg`, `git_branch_merge_graph`, `pr_checks_gate_card`, `slot_validation_and_stopwatch`, `autonomous_bot_ui_tester`, `env_isolation_compare`, `swiss_cheese_defense_layers`, `regression_loop_stage`, `dual_track_pipeline_race`.

Key authoring rules for **3~15 Minute Long Videos**:
- Partition into **chapters of `35~65 seconds` each** (`5~8 scenes` per chapter, ~`180~350` spoken units per chapter at `~345 CPM`).
- **Diverse Cold Open Hooks (`ch1_s1`)**: Never mechanically reuse the same opening primitive across videos. Pick the best hook primitive for the specific story (`dot_matrix_stat` for shocking numbers, `live_web_showcase` for eye-catching web UI, `evidence_clip` for paper/policy forensics, `persona_quote` for iconic quotes, `focus_hud_demo` for workflow friction, or `chapter_card` for a bold contrarian thesis).
- Start every new chapter (from Chapter 2 onward) with a `chapter_card`, `persona_quote`, or `evidence_clip` to reset viewer attention, and switch `preset` between `"mix"` (energetic bilingual demo/tech explanation) and `"zh"` (grounded narrative reflection/takeaways).
- Lint your JSON before rendering:
  ```bash
  /opt/homebrew/Cellar/rapid-mlx/1.0.2/libexec/bin/python \
    /Users/hahaxiong/.gemini/config/skills/video-studio/scripts/build_video.py \
    --project ./video_project.json \
    --out-dir ./video_output \
    --lint-only
  ```

### Step 3: Run Master Build Engine (Audio + Alignment + Capture + Render + Stitch)
Run [build_video.py](./scripts/build_video.py) (`BypassSandbox: true` required for Metal GPU `Qwen3-ForcedAligner`, localhost `9880` VoiceClone API, and Chrome headless renderer):

- **Mode A — Multi-Voice Cloned Voice (Default `hahaxiong`, or `--voice female_01` via `/Users/hahaxiong/Toos/VoiceClone/voices/registry.json` on `127.0.0.1:9880`)**:
  ```bash
  /opt/homebrew/Cellar/rapid-mlx/1.0.2/libexec/bin/python \
    /Users/hahaxiong/.gemini/config/skills/video-studio/scripts/build_video.py \
    --project ./video_project.json \
    --out-dir ./video_output \
    --voice hahaxiong
  ```
- **Mode B — Raw Human Voice Recording Passthrough (`.wav/.m4a`)**:
  ```bash
  /opt/homebrew/Cellar/rapid-mlx/1.0.2/libexec/bin/python \
    /Users/hahaxiong/.gemini/config/skills/video-studio/scripts/build_video.py \
    --project ./video_project.json \
    --out-dir ./video_output \
    --voice-file ./my_raw_recording.m4a
  ```

> **Incremental Fast Rebuild**: `build_video.py` caches every clause WAV, forced-alignment JSON, and rendered chapter MP4 by SHA-256 content hash inside `./video_output/.vstudio_cache/`. Revising one sentence in a 10-minute video only re-synthesizes that single clause and re-renders that single chapter (`~15s`), then stitches all chapters losslessly via `ffmpeg -f concat -c copy` in `<0.5s`!

### Step 4: Post-Render Audio-Visual QA Verification
Before delivering files to the user:
1. Verify output streams, duration, and EBU R128 loudness (`~ -16.5 LUFS`) with `/opt/homebrew/bin/ffprobe`.
2. Extract 4~6 sample frames across chapters with `/opt/homebrew/bin/ffmpeg` and visually inspect them with `read_file` to confirm zero text overflow, clean `≥72%` whitespace, and proper `16:9` (`1920×1080`) safe-zone alignment.
3. Deliver clickable `file://` links to `<slug>_16x9.mp4` and `<slug>.srt`.
