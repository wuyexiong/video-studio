#!/usr/bin/env python3
"""
AGY Global `video-studio` Master Production Engine (Short & 3-15+ Min Long-Form).

Key Architecture for 15s Shorts up to 15-Minute Deep-Dive Videos:
1. Storyboard Linter: Enforces zero adjacent primitive repetition, max 19 spoken units/caption,
   and macro chapter breathing resets every 45-75s on long videos.
2. Content-Hashed Clause Cache (SHA-256): Synthesizes via local GPT-SoVITS (127.0.0.1:9880/tts)
   with -58 dBFS onset-safe consonant preservation + Qwen3-ForcedAligner-0.6B-8bit millisecond timings.
   Editing 1 line in a 10-minute script only re-synthesizes that 1 clause!
3. Human Voice Passthrough Mode: Accepts raw .wav/.m4a, auto-trims hesitations (>550ms -> 280ms),
   normalizes to -16.5 LUFS, force-aligns the entire script, and slices per chapter automatically!
4. Chapter-Chunked Remotion Rendering + Zero-Reencode FFmpeg Concat:
   Each chapter (30-60s) renders independently with flat RAM usage and global progress-bar continuity,
   then stitches in <0.5s via `ffmpeg -f concat -c copy` + auto-exports `.srt` captions!
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

SKILL_ROOT = Path(__file__).resolve().parent.parent
RUNTIME_DIR = SKILL_ROOT / "runtime"
CAPTURE_SCRIPT = SKILL_ROOT / "scripts" / "capture_web.mjs"
REMOTION_BIN = RUNTIME_DIR / "node_modules" / ".bin" / "remotion"
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FFMPEG = "/opt/homebrew/bin/ffmpeg"

VOICE_CLONE_ROOT = Path("/Users/hahaxiong/Toos/VoiceClone")
VOICE_REGISTRY_PATH = VOICE_CLONE_ROOT / "voices" / "registry.json"
PROMPT_DIR = VOICE_CLONE_ROOT / "voices" / "hahaxiong" / "04_reference_prompt"
VOICE_PRESETS = {
    "mix": (
        str(PROMPT_DIR / "myvoice_v2_best_mix.wav"),
        "做海外 SaaS 产品的时候，我一般会先花一天时间写好一个清爽的 Landing Page。",
        "zh",
    ),
    "zh": (
        str(PROMPT_DIR / "myvoice_v2_best_zh.wav"),
        "真正聪明的创作者，懂得把重复枯燥的体力活全部交给自动化流程去处理。",
        "zh",
    ),
    "en": (
        str(PROMPT_DIR / "myvoice_v2_best_en.wav"),
        "Everything runs right on my MacBook, so your data stays safe and private.",
        "en",
    ),
}
_ACTIVE_SERVER_WEIGHTS: tuple[str, str] | None = None


def resolve_voice_aux_refs(vcfg: dict) -> list[str]:
    """Resolve auxiliary reference audio paths from voices/registry.json for multi-ref tone locking."""
    resolved = []
    for raw_p in vcfg.get("aux_ref_audio_paths", []) or []:
        if not raw_p:
            continue
        abs_p = Path(raw_p) if os.path.isabs(raw_p) else (VOICE_CLONE_ROOT / raw_p).resolve()
        if abs_p.is_file():
            resolved.append(str(abs_p))
    return resolved


def load_voice_registry() -> dict:
    if VOICE_REGISTRY_PATH.is_file():
        return json.loads(VOICE_REGISTRY_PATH.read_text(encoding="utf-8"))
    return {
        "default_voice": "hahaxiong",
        "voices": {
            "hahaxiong": {
                "name": "哈哈熊（主力男声）",
                "gender": "male",
                "status": "ready",
                "aliases": ["hahaxiong", "my_voice", "my_voice_v2", "male", "default", "我", "我的声音", "男声", "默认"],
                "gpt_weights": "GPT_weights_v2ProPlus/my_voice_v2-e15.ckpt",
                "sovits_weights": "SoVITS_weights_v2ProPlus/my_voice_v2_e12_s120.pth",
                "default_preset": "mix",
                "aux_ref_audio_paths": [
                    str(PROMPT_DIR / "myvoice_v2_aux_01.wav"),
                    str(PROMPT_DIR / "myvoice_v2_aux_02.wav"),
                    str(PROMPT_DIR / "myvoice_v2_aux_03.wav"),
                ],
                "presets": {
                    k: {"ref_audio_path": v[0], "prompt_text": v[1], "prompt_lang": v[2]}
                    for k, v in VOICE_PRESETS.items()
                },
            }
        },
    }


def resolve_voice_entry(query: str | None = None, reg: dict | None = None) -> tuple[str, dict]:
    reg = reg or load_voice_registry()
    voices = reg.get("voices", {})
    target = (query or reg.get("default_voice") or "hahaxiong").strip()
    if target in voices:
        return target, voices[target]
    t_low = target.lower()
    for vid, vcfg in voices.items():
        if vid.lower() == t_low or t_low in [a.lower() for a in vcfg.get("aliases", [])]:
            return vid, vcfg
    avail = ", ".join(f"{k} ({'/'.join(v.get('aliases', [])[:3])})" for k, v in voices.items())
    raise ValueError(f"Unknown voice '{target}'. Registered voices in {VOICE_REGISTRY_PATH}: {avail}")


def resolve_voice_preset(
    voice_query: str | None,
    preset_query: str | None,
    reg: dict | None = None,
) -> tuple[str, dict, str, str, str, str]:
    """
    Resolve (voice_id, voice_cfg, effective_preset_key, ref_wav_abs, prompt_text, prompt_lang)
    with automatic preset fallback if a secondary voice only configured 'mix'.
    """
    vid, vcfg = resolve_voice_entry(voice_query, reg)
    presets = vcfg.get("presets", {})
    req_p = (preset_query or vcfg.get("default_preset") or "mix").strip()

    order = [req_p]
    if "mix" not in order:
        order.append("mix")
    for k in presets.keys():
        if k not in order:
            order.append(k)

    for cand in order:
        if cand not in presets:
            continue
        p_obj = presets[cand]
        raw_p = p_obj.get("ref_audio_path", "")
        abs_p = Path(raw_p) if os.path.isabs(raw_p) else (VOICE_CLONE_ROOT / raw_p).resolve()
        if abs_p.is_file():
            if cand != req_p:
                print(f"[VoiceClone] Preset '{req_p}' not configured for voice '{vid}'; falling back to '{cand}'.")
            return vid, vcfg, cand, str(abs_p), p_obj.get("prompt_text", ""), p_obj.get("prompt_lang", "zh")

    # If no preset file exists on disk yet
    p_obj = presets.get(req_p) or next(iter(presets.values()))
    raw_p = p_obj.get("ref_audio_path", "")
    abs_p = Path(raw_p) if os.path.isabs(raw_p) else (VOICE_CLONE_ROOT / raw_p).resolve()
    return vid, vcfg, req_p, str(abs_p), p_obj.get("prompt_text", ""), p_obj.get("prompt_lang", "zh")


def ensure_voice_weights_on_server(vid: str, vcfg: dict) -> None:
    global _ACTIVE_SERVER_WEIGHTS
    gpt_rel = vcfg.get("gpt_weights", "")
    sov_rel = vcfg.get("sovits_weights", "")
    pair = (gpt_rel, sov_rel)
    if _ACTIVE_SERVER_WEIGHTS == pair:
        return

    gpt_abs = (VOICE_CLONE_ROOT / gpt_rel).resolve()
    sov_abs = (VOICE_CLONE_ROOT / sov_rel).resolve()
    if not gpt_abs.is_file() or not sov_abs.is_file():
        raise FileNotFoundError(
            f"Voice '{vid}' ({vcfg.get('name')}) weights not found on disk yet:\n"
            f"  GPT   : {gpt_abs} ({'OK' if gpt_abs.is_file() else 'MISSING'})\n"
            f"  SoVITS: {sov_abs} ({'OK' if sov_abs.is_file() else 'MISSING'})\n"
            f"Train '{vid}' in WebUI first, then run: /Users/hahaxiong/Toos/VoiceClone/3_test_tts.py --bind-voice {vid}"
        )

    for ep, w_rel, label in [
        ("/set_gpt_weights", gpt_rel, "GPT"),
        ("/set_sovits_weights", sov_rel, "SoVITS"),
    ]:
        url = f"http://127.0.0.1:9880{ep}?weights_path={urllib.parse.quote(w_rel)}"
        with urllib.request.urlopen(urllib.request.Request(url, method="GET"), timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8", errors="replace"))
            if not body.get("skipped", False):
                print(f"[VoiceClone] Hot-swapped {label} weights for '{vid}' -> {w_rel}")
    _ACTIVE_SERVER_WEIGHTS = pair


def normalize_clause_rms(wav_arr: np.ndarray, target_rms: float = 0.085) -> np.ndarray:
    """Balance per-clause active-speech RMS across different speaker models (e.g. male + female dialogue)."""
    if len(wav_arr) == 0:
        return wav_arr
    active = wav_arr[np.abs(wav_arr) > 0.008]
    cur_rms = float(np.sqrt(np.mean(active ** 2))) if len(active) > 64 else float(np.sqrt(np.mean(wav_arr ** 2)))
    if cur_rms < 1e-4:
        return wav_arr
    gain = np.clip(target_rms / cur_rms, 0.45, 2.40)
    scaled = wav_arr * float(gain)
    peak = float(np.max(np.abs(scaled)))
    if peak > 0.90:
        scaled = scaled * (0.90 / peak)
    return scaled.astype(np.float32)

VALID_PRIMITIVES = {
    "chapter_card",
    "persona_quote",
    "dot_matrix_stat",
    "flow_3node",
    "matrix_compare",
    "focus_hud_demo",
    "live_web_showcase",
    "terminal_code_live",
    "ranked_bars",
    "evidence_clip",
    "skill_editor_spotlight",
    "stack_slice_builder",
    "traffic_gate_box",
    "deep_module_box",
    "split_tree_chat_dispatch",
    "annotated_ui_tour",
    "org_tree_radiate",
    "pipeline_timeline_flow",
    "defense_boundary_flow",
    "row_permission_table",
    "acronym_token_slot",
    "metaphor_canvas",
    "before_after_transformer",
    "synergy_puzzle_pair",
    "multi_perspective_ring",
    "convergent_hub_bus",
    "arc_gauge_audit",
    "idle_waste_vs_event_wake",
    "binary_decision_tree",
    "spotlight_window_tour",
    "vignette_metaphor_stage",
}


def count_units(s: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fff]", s)) + len(re.findall(r"[A-Za-z0-9]+", s))


def normalize_tts_text(raw: str, lang: str = "zh") -> str:
    """
    Clean bilingual CJK + English tech text & numeric symbols for GPT-SoVITS without altering display_text:
    1. Strip thousand-separator commas inside digits ('1,000' -> '1000') so TTS never pauses mid-number.
    2. Expand '$N' shorthand naturally in Chinese mode ('$0' -> '0 美元', '$30' -> '30 美元').
    3. Replace hyphens inside CLI identifiers ('yt-dlp' -> 'yt dlp', 'grill-me' -> 'grill me').
    4. Insert clean space boundaries between CJK characters and ASCII words/digits.
    """
    t = raw.strip()
    if not t:
        return t
    # 1. Remove thousand commas inside numbers: 1,000,000 -> 1000000
    while re.search(r"(\d),(\d{3})(?!\d)", t):
        t = re.sub(r"(\d),(\d{3})(?!\d)", r"\1\2", t)
    # 2. Currency $N in zh/mix mode
    if lang != "en":
        t = re.sub(r"\$(\d+(?:\.\d+)?)", r"\1 美元", t)
    # 3. Hyphenated ASCII tech identifiers -> space
    t = re.sub(r"([A-Za-z])-([A-Za-z0-9])", r"\1 \2", t)
    # 4. Space CJK <-> ASCII boundaries for cleaner bilingual phoneme transitions
    t = re.sub(r"([\u4e00-\u9fff])([A-Za-z0-9])", r"\1 \2", t)
    t = re.sub(r"([A-Za-z0-9])([\u4e00-\u9fff])", r"\1 \2", t)
    t = re.sub(r"\s{2,}", " ", t)
    return t.strip()


def sha256_str(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


NUMBER_CHARS = set(
    "零一二三四五六七八九十百千万亿两点半负正百分之美元金块角分倍年月周天日时秒毫约超近多左右上下第号级版代人民币英镑欧元日元港币刀万亿千百十个位"
)


def lint_project(proj: dict, strict_sync: bool = False, voice_override: str | None = None) -> list[str]:
    warnings = []
    chapters = proj.get("chapters", [])
    if not chapters:
        raise ValueError("Project JSON must contain non-empty 'chapters' array.")

    reg = load_voice_registry()
    top_voice = voice_override or proj.get("default_voice") or proj.get("voice")
    if top_voice:
        vid, vcfg = resolve_voice_entry(top_voice, reg)
        if not (VOICE_CLONE_ROOT / vcfg.get("gpt_weights", "")).is_file():
            warnings.append(f"[Voice Pending] Default voice '{vid}' weights are not trained yet ({vcfg.get('gpt_weights')}).")

    prev_prim = None
    for c_idx, ch in enumerate(chapters, 1):
        scenes = ch.get("scenes", [])
        if len(scenes) > 12:
            warnings.append(
                f"[Chapter {c_idx}] Has {len(scenes)} scenes (>12). Split into 45-60s chapters for faster incremental rendering."
            )
        for sc in scenes:
            if sc.get("voice"):
                svid, svcfg = resolve_voice_entry(sc.get("voice"), reg)
                if not (VOICE_CLONE_ROOT / svcfg.get("gpt_weights", "")).is_file():
                    warnings.append(f"[Voice Pending] Scene '{sc.get('id')}' uses untrained voice '{svid}'.")
            prim = sc.get("primitive")
            if prim not in VALID_PRIMITIVES:
                raise ValueError(f"Scene '{sc.get('id')}' uses unknown primitive '{prim}'. Valid: {sorted(VALID_PRIMITIVES)}")
            if prim == prev_prim:
                warnings.append(f"[Anti-Fatigue] Scene '{sc.get('id')}' repeats adjacent primitive '{prim}'. Consider alternating!")
            prev_prim = prim

            for cl in sc.get("clauses", []):
                disp = cl.get("display_text", "")
                tts = cl.get("tts_text") or disp
                u = count_units(disp)
                if u > 21:
                    warnings.append(f"[Caption Length] Scene '{sc.get('id')}' display_text has {u} units (>21): {disp}")
                # Verbatim Sync Guard: check unspoken CJK words in display_text
                disp_cjk = set(re.findall(r"[\u4e00-\u9fff]", disp)) - NUMBER_CHARS
                tts_cjk = set(re.findall(r"[\u4e00-\u9fff]", tts)) - NUMBER_CHARS
                extra_cjk = disp_cjk - tts_cjk
                if extra_cjk:
                    msg = (
                        f"[Subtitle Sync] Scene '{sc.get('id')}' display_text ({disp!r}) contains CJK chars "
                        f"{sorted(extra_cjk)} not in tts_text ({tts!r})."
                    )
                    if strict_sync:
                        raise ValueError(msg)
                    warnings.append(msg)
    return warnings


def ensure_tts_server() -> None:
    def is_up() -> bool:
        try:
            urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:9880/", method="GET"), timeout=2)
            return True
        except urllib.error.HTTPError:
            return True
        except Exception:
            return False

    if is_up():
        return
    print("[VoiceClone] Starting background GPT-SoVITS service on 127.0.0.1:9880...")
    log_f = open("/tmp/gsv_api.log", "ab")
    subprocess.Popen(
        ["/bin/bash", "/Users/hahaxiong/Toos/VoiceClone/2_start_api.sh"],
        stdout=log_f,
        stderr=log_f,
        start_new_session=True,
    )
    for _ in range(45):
        time.sleep(1.0)
        if is_up():
            print("[VoiceClone] API online!")
            return
    raise RuntimeError("VoiceClone API failed to start on 127.0.0.1:9880. Check /tmp/gsv_api.log")


def onset_safe_trim_48k(raw_wav: Path, out_wav: Path, sr_target: int = 48000) -> float:
    """Preserve 100% of initial unvoiced consonants (-58 dBFS envelope + >=65ms pre-roll + 8ms silent-edge fade)."""
    tmp = out_wav.with_suffix(".tmp48.wav")
    subprocess.run([
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(raw_wav), "-ac", "1", "-ar", str(sr_target), "-c:a", "pcm_s16le", str(tmp)
    ], check=True)
    wav, sr = sf.read(str(tmp), dtype="float32")
    tmp.unlink(missing_ok=True)
    if len(wav) == 0:
        sf.write(str(out_wav), np.zeros(int(0.1 * sr_target), dtype=np.float32), sr_target, subtype="PCM_16")
        return 0.1

    wav = wav - float(np.mean(wav))
    win = max(1, int(0.005 * sr))
    padded = np.pad(np.abs(wav), (0, (-len(wav)) % win))
    active = np.where(padded.reshape(-1, win).max(axis=1) > 0.0012)[0]

    if len(active) > 0:
        on = int(active[0] * win)
        off = min(len(wav), int((active[-1] + 1) * win))
        idx0 = max(0, on - int(0.085 * sr))
        idx1 = min(len(wav), off + int(0.095 * sr))
        clipped = wav[idx0:idx1].copy()
        lead = on - idx0
        if lead < int(0.065 * sr):
            clipped = np.concatenate([np.zeros(int(0.065 * sr) - lead, dtype=np.float32), clipped])
    else:
        clipped = wav.copy()

    fade_n = min(int(0.008 * sr), len(clipped) // 8)
    if fade_n > 1:
        f_curve = 0.5 * (1.0 - np.cos(np.pi * np.arange(fade_n, dtype=np.float32) / fade_n))
        clipped[:fade_n] *= f_curve
        clipped[-fade_n:] *= f_curve[::-1]

    sf.write(str(out_wav), clipped, sr, subtype="PCM_16")
    return len(clipped) / float(sr)


def is_healthy_clause_audio(wav_arr: np.ndarray, sr: int, chars: list, n_units: int) -> tuple[bool, str]:
    """
    Detect stochastic GPT-SoVITS attention collapse / silent output / early EOS truncation.
    Healthy 48kHz speech has RMS >= 0.018, Peak >= 0.12, duration >= max(0.50, n_units * 0.088),
    and does not collapse >65% of aligned characters into zero-length timestamps (start == end).
    """
    if len(wav_arr) == 0:
        return False, "empty_waveform"
    dur = len(wav_arr) / float(sr)
    rms = float(np.sqrt(np.mean(wav_arr ** 2)))
    peak = float(np.max(np.abs(wav_arr)))
    min_expected_dur = max(0.50, n_units * 0.088)
    if rms < 0.018 or peak < 0.12:
        return False, f"silent_collapse(rms={rms:.4f},peak={peak:.4f})"
    if dur < min_expected_dur:
        return False, f"early_eos_truncation(dur={dur:.3f}s<min={min_expected_dur:.3f}s,units={n_units})"
    if len(chars) >= 6:
        nonzero = sum(1 for c in chars if (float(c["end"]) - float(c["start"])) > 0.005)
        if nonzero < len(chars) * 0.35:
            return False, f"aligner_timestamp_collapse(nonzero={nonzero}/{len(chars)})"
    return True, "ok"


PODCAST_MASTER_AF = (
    "highpass=f=75,"
    "equalizer=f=175:t=q:w=1.1:g=1.3,"
    "equalizer=f=6400:t=q:w=2.0:g=-2.2,"
    "acompressor=threshold=-20dB:ratio=2.6:attack=12:release=140:makeup=1.8,"
    "loudnorm=I=-16.5:TP=-1.0:LRA=3.5"
)

KINETIC_SFX_PRIMITIVES = {
    "chapter_card",
    "synergy_puzzle_pair",
    "before_after_transformer",
    "focus_hud_demo",
    "spotlight_window_tour",
}


def compute_semantic_pause_ms(
    tts_txt: str,
    next_tts_txt: str | None,
    is_scene_end: bool,
    is_chapter_end: bool,
    scene_pause_override: int | None = None,
    chapter_tail_override: int | None = None,
    multi_chapter: bool = True,
) -> int:
    """
    Forensic 3-Tier Semantic Breath & Suspense Pause Engine:
    - Accounts for ~55ms trailing safety margin inside each sliced clause WAV:
      * L1 Intra-thought continuation (comma / enjambment): ~150ms silence -> ~205ms true acoustic breath
      * L2 Full statement / scene transition (period / exclamation): ~475ms silence -> ~530ms true reset
      * L3 Rhetorical question or contrast pivot ('但'/'不過'/'最關鍵'): ~690-820ms silence -> ~750-875ms suspense!
    """
    s = tts_txt.strip()
    jitter = (int(sha256_str(s)[:4], 16) % 31) - 15  # deterministic +-15ms human micro-variance

    if is_chapter_end:
        if chapter_tail_override is not None:
            return int(chapter_tail_override)
        return max(340, (620 if multi_chapter else 380) + jitter)

    is_question = bool(re.search(r"[？?]|嗎[。！]?$|呢[。！]?$|為什麼|怎麼|到底|什麼", s))
    next_is_contrast = bool(
        next_tts_txt and re.match(r"^\s*(但|不過|然而|結果|偏偏|關鍵是|最關鍵|問題是|反過來)", next_tts_txt)
    )
    ends_full_stop = s.endswith(("。", "！", "；", ".", "!", ";"))

    if is_scene_end:
        if scene_pause_override is not None:
            return int(scene_pause_override)
        if is_question:
            return max(520, 760 + jitter)
        if next_is_contrast:
            return max(460, 620 + jitter)
        return max(380, 485 + jitter)

    # Intra-scene boundary between clauses
    if is_question:
        return max(520, 690 + jitter)
    if ends_full_stop:
        return max(380, 465 + jitter)
    if next_is_contrast:
        return max(240, 310 + jitter)
    # Continuation comma / short breath
    return max(120, 152 + (jitter // 2))


def synth_and_align_clause(
    tts_text: str,
    preset: str,
    speed: float,
    cache_dir: Path,
    aligner,
    voice: str | None = None,
    reg: dict | None = None,
) -> tuple[Path, float, list, str, str]:
    """
    Aligner-Guided + Acoustic-Bounded Exact Trim & Timestamping (v6 Normalized + Tight Tail Margin):
    """
    vid, vcfg, eff_preset, ref_wav_init, _, _ = resolve_voice_preset(voice, preset, reg)
    resolved_lang_init = "en" if eff_preset == "en" else "zh"
    clean_tts = normalize_tts_text(tts_text, lang=resolved_lang_init)
    aux_refs = resolve_voice_aux_refs(vcfg)
    aux_sig = ",".join(Path(p).name for p in aux_refs)
    weight_sig = f"{vid}|{vcfg.get('gpt_weights', '')}|{vcfg.get('sovits_weights', '')}|{Path(ref_wav_init).name}|{aux_sig}"
    key = sha256_str(f"v6_norm_clause|{weight_sig}|{eff_preset}|{speed:.3f}|{clean_tts}")
    wav_cache = cache_dir / f"clause_{key}.wav"
    json_cache = cache_dir / f"clause_{key}.json"
    n_units = max(1, count_units(clean_tts))
    sr = 48000

    if wav_cache.exists() and json_cache.exists():
        try:
            meta = json.loads(json_cache.read_text(encoding="utf-8"))
            cached_wav, cached_sr = sf.read(str(wav_cache), dtype="float32")
            ok, reason = is_healthy_clause_audio(cached_wav, cached_sr, meta.get("chars", []), n_units)
            if ok:
                return wav_cache, float(meta["duration"]), meta["chars"], vid, eff_preset
            print(f"[VoiceClone Guard] Purging unhealthy cached clause ({reason}): {clean_tts}")
        except Exception:
            pass
        wav_cache.unlink(missing_ok=True)
        json_cache.unlink(missing_ok=True)

    ensure_voice_weights_on_server(vid, vcfg)

    eos_punct = "." if eff_preset == "en" else "。"
    punct_text = clean_tts.rstrip("，,；; ") + ("" if clean_tts.rstrip().endswith(("。", "！", "？", ".", "!", "?")) else eos_punct)
    retry_configs = [
        {"preset": eff_preset, "temp": 0.72, "top_p": 0.86, "top_k": 14, "split": "cut0", "parallel": False, "text": clean_tts},
        {"preset": eff_preset, "temp": 0.68, "top_p": 0.84, "top_k": 12, "split": "cut0", "parallel": False, "text": punct_text},
        {"preset": eff_preset, "temp": 0.64, "top_p": 0.82, "top_k": 12, "split": "cut5", "parallel": False, "text": punct_text},
        {"preset": eff_preset, "temp": 0.60, "top_p": 0.80, "top_k": 10, "split": "cut0", "parallel": False, "text": clean_tts},
    ]

    clipped = np.zeros(int(0.5 * sr), dtype=np.float32)
    chars = []

    for attempt_idx, cfg in enumerate(retry_configs, 1):
        _, _, cur_preset, ref_wav, ref_txt, ref_lang = resolve_voice_preset(vid, cfg["preset"], reg)
        if not os.path.isfile(ref_wav):
            raise FileNotFoundError(
                f"Reference audio for voice '{vid}' preset '{cur_preset}' does not exist: {ref_wav}"
            )
        resolved_lang = "en" if cur_preset == "en" else "zh"
        payload = {
            "text": cfg["text"],
            "text_lang": resolved_lang,
            "ref_audio_path": ref_wav,
            "aux_ref_audio_paths": aux_refs,
            "prompt_text": ref_txt,
            "prompt_lang": ref_lang,
            "top_k": cfg["top_k"],
            "top_p": cfg["top_p"],
            "temperature": cfg["temp"],
            "text_split_method": cfg["split"],
            "batch_size": 1,
            "speed_factor": speed,
            "fragment_interval": 0.18,
            "parallel_infer": cfg["parallel"],
            "repetition_penalty": 1.35,
            "media_type": "wav",
            "streaming_mode": False,
        }
        raw_tmp = cache_dir / f"raw_{key}.wav"
        pcm48_tmp = cache_dir / f"pcm48_{key}.wav"
        req = urllib.request.Request(
            "http://127.0.0.1:9880/tts",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw_tmp.write_bytes(resp.read())

        subprocess.run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(raw_tmp), "-ac", "1", "-ar", str(sr), "-c:a", "pcm_s16le", str(pcm48_tmp)
        ], check=True)
        raw_tmp.unlink(missing_ok=True)

        wav, _ = sf.read(str(pcm48_tmp), dtype="float32")
        wav = wav - float(np.mean(wav)) if len(wav) else np.zeros(int(0.1 * sr), dtype=np.float32)

        align_lang = "English" if cur_preset == "en" else "Chinese"
        res = aligner.align(pcm48_tmp, clean_tts, language=align_lang)
        pcm48_tmp.unlink(missing_ok=True)
        raw_segs = res.segments or []

        win = max(1, int(0.005 * sr))
        padded = np.pad(np.abs(wav), (0, (-len(wav)) % win))
        active_wins = np.where(padded.reshape(-1, win).max(axis=1) > 0.012)[0]
        ac_on_sec = float(active_wins[0] * win) / sr if len(active_wins) > 0 else 0.0
        ac_off_sec = float(min(len(wav), (active_wins[-1] + 1) * win)) / sr if len(active_wins) > 0 else (len(wav) / float(sr))

        if raw_segs:
            first_st = float(raw_segs[0]["start"])
            last_ed = float(raw_segs[-1]["end"])
            eff_start = min(first_st, ac_on_sec) if len(active_wins) > 0 else first_st
            eff_end = max(last_ed, ac_off_sec) if len(active_wins) > 0 else last_ed
            cut_start_sec = max(0.0, eff_start - 0.055)
            cut_end_sec = min(len(wav) / float(sr), eff_end + 0.055)
            i0 = int(round(cut_start_sec * sr))
            i1 = max(i0 + 1, int(round(cut_end_sec * sr)))
            clipped = wav[i0:i1].copy()
            extra_pre_sec = 0.0
            if (eff_start - cut_start_sec) < 0.045:
                extra_pre_sec = 0.045 - (eff_start - cut_start_sec)
                clipped = np.concatenate([np.zeros(int(round(extra_pre_sec * sr)), dtype=np.float32), clipped])

            fade_n = min(int(0.008 * sr), len(clipped) // 8)
            if fade_n > 1:
                fc = 0.5 * (1.0 - np.cos(np.pi * np.arange(fade_n, dtype=np.float32) / fade_n))
                clipped[:fade_n] *= fc
                clipped[-fade_n:] *= fc[::-1]

            clip_dur = round(len(clipped) / float(sr), 3)
            chars = [
                {
                    "text": s["text"],
                    "start": round(max(0.0, min(clip_dur, float(s["start"]) - cut_start_sec + extra_pre_sec)), 3),
                    "end": round(max(0.0, min(clip_dur, float(s["end"]) - cut_start_sec + extra_pre_sec)), 3),
                }
                for s in raw_segs
            ]
            if chars and chars[-1]["end"] < clip_dur - 0.22:
                chars[-1]["end"] = round(max(chars[-1]["start"] + 0.08, clip_dur - 0.05), 3)
        else:
            clipped = wav.copy()
            chars = []

        ok, reason = is_healthy_clause_audio(clipped, sr, chars, n_units)
        if ok:
            if attempt_idx > 1:
                print(f"[VoiceClone Guard] Retry #{attempt_idx} succeeded for: {clean_tts} (dur={len(clipped)/sr:.2f}s)")
            break
        print(f"[VoiceClone Guard] Attempt #{attempt_idx} unhealthy ({reason}) for '{clean_tts}' -> retrying...")

    clipped = normalize_clause_rms(clipped, target_rms=0.085)
    sf.write(str(wav_cache), clipped, sr, subtype="PCM_16")
    dur = round(len(clipped) / float(sr), 3)
    json_cache.write_text(
        json.dumps({"duration": dur, "chars": chars, "voice": vid, "preset": eff_preset}, ensure_ascii=False),
        encoding="utf-8",
    )
    return wav_cache, dur, chars, vid, eff_preset


def synth_and_align_group(
    raw_texts: list[str],
    preset: str,
    speed: float,
    cache_dir: Path,
    aligner,
    voice: str | None = None,
    reg: dict | None = None,
) -> list[tuple[Path, float, list, str, str]] | None:
    """
    Coherent Thought-Group Synthesis ('cut0' Single-Pass AR Prosody):
    Synthesizes 2-3 continuation clauses in ONE GPT-SoVITS pass so mid-sentence commas keep natural
    rising/suspended F0 pitch instead of dropping flat on every clause, then uses Qwen3-ForcedAligner
    + 5ms minimum-energy valley detection to slice clean per-clause WAVs for exact Remotion beat control.
    Returns None on any alignment ambiguity so caller seamlessly falls back to per-clause synthesis.
    """
    if len(raw_texts) < 2:
        return None
    vid, vcfg, eff_preset, ref_wav, ref_txt, ref_lang = resolve_voice_preset(voice, preset, reg)
    if not os.path.isfile(ref_wav):
        return None
    resolved_lang = "en" if eff_preset == "en" else "zh"
    norm_list = [normalize_tts_text(t, lang=resolved_lang) for t in raw_texts]
    sep = ", " if resolved_lang == "en" else "，"
    eos = "." if resolved_lang == "en" else "。"
    stripped = [t.rstrip("，,、；; ") for t in norm_list]
    joined = sep.join(stripped)
    if not joined.endswith(("。", "！", "？", ".", "!", "?")):
        joined += eos

    aux_refs = resolve_voice_aux_refs(vcfg)
    aux_sig = ",".join(Path(p).name for p in aux_refs)
    weight_sig = f"{vid}|{vcfg.get('gpt_weights', '')}|{vcfg.get('sovits_weights', '')}|{Path(ref_wav).name}|{aux_sig}"
    g_key = sha256_str(f"v6_group_cut0|{weight_sig}|{eff_preset}|{speed:.3f}|{'||'.join(norm_list)}")
    g_meta_path = cache_dir / f"group_{g_key}.json"
    sr = 48000

    if g_meta_path.exists():
        try:
            g_meta = json.loads(g_meta_path.read_text(encoding="utf-8"))
            out_cached = []
            for idx, item in enumerate(g_meta["items"]):
                wp = cache_dir / item["wav_name"]
                if not wp.exists():
                    out_cached = []
                    break
                out_cached.append((wp, float(item["duration"]), item["chars"], vid, eff_preset))
            if len(out_cached) == len(raw_texts):
                return out_cached
        except Exception:
            pass

    ensure_voice_weights_on_server(vid, vcfg)
    payload = {
        "text": joined,
        "text_lang": resolved_lang,
        "ref_audio_path": ref_wav,
        "aux_ref_audio_paths": aux_refs,
        "prompt_text": ref_txt,
        "prompt_lang": ref_lang,
        "top_k": 14,
        "top_p": 0.86,
        "temperature": 0.70,
        "text_split_method": "cut0",
        "batch_size": 1,
        "speed_factor": speed,
        "fragment_interval": 0.16,
        "parallel_infer": False,
        "repetition_penalty": 1.35,
        "media_type": "wav",
        "streaming_mode": False,
    }
    raw_tmp = cache_dir / f"raw_grp_{g_key}.wav"
    pcm48_tmp = cache_dir / f"pcm48_grp_{g_key}.wav"
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:9880/tts",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw_tmp.write_bytes(resp.read())
        subprocess.run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(raw_tmp), "-ac", "1", "-ar", str(sr), "-c:a", "pcm_s16le", str(pcm48_tmp)
        ], check=True)
        raw_tmp.unlink(missing_ok=True)
        wav, _ = sf.read(str(pcm48_tmp), dtype="float32")
        if len(wav) < int(0.6 * sr):
            pcm48_tmp.unlink(missing_ok=True)
            return None
        wav = normalize_clause_rms(wav - float(np.mean(wav)), target_rms=0.085)

        align_lang = "English" if eff_preset == "en" else "Chinese"
        res = aligner.align(pcm48_tmp, joined, language=align_lang)
        pcm48_tmp.unlink(missing_ok=True)
        raw_segs = res.segments or []
        if len(raw_segs) < len(norm_list) * 2:
            return None

        # Partition aligned segments across norm_list proportionally by spoken char count
        target_counts = [max(1, len(re.findall(r"[\u4e00-\u9fffA-Za-z0-9]", s))) for s in stripped]
        seg_weights = [max(1, len(re.findall(r"[\u4e00-\u9fffA-Za-z0-9]", str(sg.get("text", ""))))) for sg in raw_segs]
        if abs(sum(seg_weights) - sum(target_counts)) > max(4, int(0.25 * sum(target_counts))):
            return None

        buckets: list[list[dict]] = []
        seg_idx = 0
        for b_i, want in enumerate(target_counts):
            if b_i == len(target_counts) - 1:
                buckets.append(raw_segs[seg_idx:])
                break
            acc = 0
            b_segs = []
            while seg_idx < len(raw_segs) - (len(target_counts) - 1 - b_i):
                b_segs.append(raw_segs[seg_idx])
                acc += seg_weights[seg_idx]
                seg_idx += 1
                if acc >= want:
                    break
            if not b_segs:
                return None
            buckets.append(b_segs)

        if any(len(b) == 0 for b in buckets):
            return None

        # Locate clean 5ms minimum-RMS valleys between adjacent clauses
        total_sec = len(wav) / float(sr)
        win_5ms = max(1, int(0.005 * sr))
        boundaries = [max(0.0, float(buckets[0][0]["start"]) - 0.050)]
        for k in range(len(buckets) - 1):
            prev_ed = float(buckets[k][-1]["end"])
            next_st = float(buckets[k + 1][0]["start"])
            lo_s = max(0.0, min(prev_ed, next_st) - 0.030)
            hi_s = min(total_sec, max(prev_ed, next_st) + 0.030)
            i_lo = int(lo_s * sr)
            i_hi = max(i_lo + win_5ms, int(hi_s * sr))
            region = wav[i_lo:i_hi]
            n_w = max(1, len(region) // win_5ms)
            rms_w = np.sqrt(np.mean(region[:n_w * win_5ms].reshape(n_w, win_5ms) ** 2, axis=1) + 1e-12)
            best_s = lo_s + (int(np.argmin(rms_w)) + 0.5) * 0.005
            boundaries.append(best_s)
        boundaries.append(min(total_sec, float(buckets[-1][-1]["end"]) + 0.055))

        results = []
        meta_items = []
        for k, b_segs in enumerate(buckets):
            c0 = boundaries[k]
            c1 = max(c0 + 0.25, boundaries[k + 1])
            s0 = int(round(c0 * sr))
            s1 = min(len(wav), max(s0 + 1, int(round(c1 * sr))))
            sub_wav = wav[s0:s1].copy()
            fade_n = min(int(0.006 * sr), len(sub_wav) // 8)
            if fade_n > 1:
                fc = 0.5 * (1.0 - np.cos(np.pi * np.arange(fade_n, dtype=np.float32) / fade_n))
                sub_wav[:fade_n] *= fc
                sub_wav[-fade_n:] *= fc[::-1]
            sub_dur = round(len(sub_wav) / float(sr), 3)
            sub_chars = [
                {
                    "text": sg["text"],
                    "start": round(max(0.0, min(sub_dur, float(sg["start"]) - c0)), 3),
                    "end": round(max(0.0, min(sub_dur, float(sg["end"]) - c0)), 3),
                }
                for sg in b_segs
            ]
            n_u = max(1, count_units(norm_list[k]))
            ok, _ = is_healthy_clause_audio(sub_wav, sr, sub_chars, n_u)
            if not ok:
                return None
            wav_name = f"group_{g_key}_{k:02d}.wav"
            wp = cache_dir / wav_name
            sf.write(str(wp), sub_wav, sr, subtype="PCM_16")
            results.append((wp, sub_dur, sub_chars, vid, eff_preset))
            meta_items.append({"wav_name": wav_name, "duration": sub_dur, "chars": sub_chars})

        g_meta_path.write_text(json.dumps({"items": meta_items}, ensure_ascii=False), encoding="utf-8")
        return results
    except Exception as exc:
        raw_tmp.unlink(missing_ok=True)
        pcm48_tmp.unlink(missing_ok=True)
        print(f"[GroupProsody Fallback] Group synthesis fell back to single-clause ({exc})")
        return None


def make_warm_sfx(kind: str, sr: int = 48000) -> np.ndarray:
    if kind == "warm_pop":
        dur = 0.050
        t = np.linspace(0, dur, int(sr * dur), endpoint=False)
        freq = np.linspace(290, 135, len(t))
        env = np.exp(-t * 72.0) * np.sin(np.pi * np.minimum(1.0, t / 0.006) * 0.5)
        return (np.sin(2 * np.pi * np.cumsum(freq) / sr) * env * 0.032).astype(np.float32)
    else:
        dur = 0.12
        t = np.linspace(0, dur, int(sr * dur), endpoint=False)
        noise = np.random.default_rng(42).normal(0, 1, len(t))
        sos = signal.butter(3, [220, 980], btype="bandpass", fs=sr, output="sos")
        return (signal.sosfilt(sos, noise) * (np.sin(np.pi * (t / dur)) ** 1.8) * 0.016).astype(np.float32)


def build_chapters_clone_mode(
    proj: dict,
    cache_dir: Path,
    speed_default: float,
    fps: int = 30,
    voice_override: str | None = None,
) -> list[dict]:
    from rapid_mlx.audio.stt import STTEngine

    ensure_tts_server()
    reg = load_voice_registry()
    default_voice = voice_override or proj.get("default_voice") or proj.get("voice") or reg.get("default_voice", "hahaxiong")
    aligner = STTEngine("mlx-community/Qwen3-ForcedAligner-0.6B-8bit")
    aligner.load()

    sr = 48000
    chapters_out = []
    global_offset = 0.0
    chapters_in = proj["chapters"]
    enable_group_tts = bool(proj.get("coherent_group_tts", True))
    enable_ambient_bed = bool(proj.get("ambient_bed", False))

    for ch_idx, ch in enumerate(chapters_in):
        chunks = [np.zeros(int(0.10 * sr), dtype=np.float32)]
        cur = 0.10
        scenes_payload = []
        captions_payload = []
        sfx_list = []

        scenes_in = ch.get("scenes", [])
        for s_idx, sc in enumerate(scenes_in):
            sc_start = cur
            # Surgical Micro-SFX Law (~1.5-2.5/min max, zero per-clause pop spam!):
            # Only trigger at chapter gateway or high-kinetic structural primitives / explicit sc["sfx"]
            if sc.get("sfx") is True or (sc.get("sfx") is not False and (s_idx == 0 or sc.get("primitive") in KINETIC_SFX_PRIMITIVES)):
                sfx_list.append((max(0.01, sc_start - 0.045), "warm_pop" if s_idx == 0 else "soft_transition"))

            sc_voice = voice_override or sc.get("voice") or ch.get("voice") or default_voice
            preset = sc.get("preset") or proj.get("default_preset", "mix")
            speed = float(sc.get("speed") or speed_default)
            clauses_in = sc.get("clauses", [])
            clauses_out = []

            # Pre-synthesize scene clauses using Coherent Thought-Group batching (2-3 continuation clauses per AR pass)
            synthed_clauses: list[tuple[Path, float, list, str, str] | None] = [None] * len(clauses_in)
            idx_c = 0
            while idx_c < len(clauses_in):
                cl0 = clauses_in[idx_c]
                v0 = voice_override or cl0.get("voice") or sc_voice
                p0 = cl0.get("preset") or preset
                t0 = (cl0.get("tts_text") or cl0["display_text"]).strip()
                can_start_group = (
                    enable_group_tts
                    and idx_c + 1 < len(clauses_in)
                    and not t0.endswith(("。", "！", "？", ".", "!", "?", "；", ";"))
                )
                if can_start_group:
                    grp_indices = [idx_c]
                    grp_texts = [t0]
                    grp_units = count_units(t0)
                    j = idx_c + 1
                    while j < len(clauses_in) and len(grp_indices) < 3:
                        clj = clauses_in[j]
                        vj = voice_override or clj.get("voice") or sc_voice
                        pj = clj.get("preset") or preset
                        tj = (clj.get("tts_text") or clj["display_text"]).strip()
                        uj = count_units(tj)
                        if vj != v0 or pj != p0 or (grp_units + uj) > 42:
                            break
                        grp_indices.append(j)
                        grp_texts.append(tj)
                        grp_units += uj
                        j += 1
                        if tj.endswith(("。", "！", "？", ".", "!", "?", "；", ";")):
                            break
                    if len(grp_indices) >= 2:
                        grp_res = synth_and_align_group(
                            grp_texts, p0, speed, cache_dir, aligner, voice=v0, reg=reg
                        )
                        if grp_res and len(grp_res) == len(grp_indices):
                            for k_pos, orig_i in enumerate(grp_indices):
                                synthed_clauses[orig_i] = grp_res[k_pos]
                            idx_c = grp_indices[-1] + 1
                            continue

                synthed_clauses[idx_c] = synth_and_align_clause(
                    t0, p0, speed, cache_dir, aligner, voice=v0, reg=reg
                )
                idx_c += 1

            for c_idx, cl in enumerate(clauses_in):
                tts_txt = cl.get("tts_text") or cl["display_text"]
                disp_txt = cl["display_text"]
                res_tuple = synthed_clauses[c_idx]
                assert res_tuple is not None
                wav_p, c_dur, rel_chars, used_vid, used_preset = res_tuple
                samples, _ = sf.read(str(wav_p), dtype="float32")
                chunks.append(samples)

                abs_chars = [
                    {"text": it["text"], "start": round(cur + it["start"], 3), "end": round(cur + it["end"], 3)}
                    for it in rel_chars
                ]
                c_start = abs_chars[0]["start"] if abs_chars else round(cur, 3)
                c_end = abs_chars[-1]["end"] if abs_chars else round(cur + c_dur, 3)
                c_obj = {
                    "sceneId": sc["id"],
                    "clauseIndex": c_idx,
                    "voice": used_vid,
                    "preset": used_preset,
                    "displayText": disp_txt,
                    "ttsText": tts_txt,
                    "start": c_start,
                    "end": c_end,
                    "chars": abs_chars,
                }
                clauses_out.append(c_obj)
                captions_payload.append(c_obj)

                cur += c_dur
                # Determine next spoken clause text (for contrast-pivot pause expansion)
                next_tts: str | None = None
                if c_idx + 1 < len(clauses_in):
                    next_cl = clauses_in[c_idx + 1]
                    next_tts = next_cl.get("tts_text") or next_cl["display_text"]
                elif s_idx + 1 < len(scenes_in) and scenes_in[s_idx + 1].get("clauses"):
                    next_cl = scenes_in[s_idx + 1]["clauses"][0]
                    next_tts = next_cl.get("tts_text") or next_cl["display_text"]

                is_sc_end = c_idx == len(clauses_in) - 1
                is_ch_end = is_sc_end and (s_idx == len(scenes_in) - 1)
                if cl.get("pause_after_ms") is not None:
                    gap_ms = int(cl["pause_after_ms"])
                else:
                    gap_ms = compute_semantic_pause_ms(
                        tts_txt=tts_txt,
                        next_tts_txt=next_tts,
                        is_scene_end=is_sc_end,
                        is_chapter_end=is_ch_end,
                        scene_pause_override=sc.get("pause_after_ms"),
                        chapter_tail_override=ch.get("chapter_tail_pause_ms"),
                        multi_chapter=len(chapters_in) > 1,
                    )

                chunks.append(np.zeros(int((gap_ms / 1000.0) * sr), dtype=np.float32))
                cur += gap_ms / 1000.0

            sc_end = round(cur, 3)
            scenes_payload.append({
                "id": sc["id"],
                "primitive": sc["primitive"],
                "start": round(sc_start if s_idx > 0 else 0.0, 3),
                "end": sc_end,
                "duration": round(sc_end - (sc_start if s_idx > 0 else 0.0), 3),
                "clauses": clauses_out,
                "data": sc.get("data", {}),
            })

        dry_arr = np.concatenate(chunks) if chunks else np.zeros(int(0.5 * sr), dtype=np.float32)
        samples_per_frame = max(1, sr // max(1, fps))
        rem = len(dry_arr) % samples_per_frame
        if rem != 0:
            dry_arr = np.concatenate([dry_arr, np.zeros(samples_per_frame - rem, dtype=np.float32)])

        ch_hash_payload = {
            "v": "v7_prosody_master_lra35",
            "fps": fps,
            "speed_default": speed_default,
            "ambient_bed": enable_ambient_bed,
            "group_tts": enable_group_tts,
            "chapter_tail_pause_ms": ch.get("chapter_tail_pause_ms"),
            "scenes": [
                {
                    "id": s_out["id"],
                    "primitive": s_in.get("primitive"),
                    "sfx": s_in.get("sfx"),
                    "preset": s_in.get("preset") or proj.get("default_preset", "mix"),
                    "speed": float(s_in.get("speed") or speed_default),
                    "pause_after_ms": s_in.get("pause_after_ms"),
                    "clauses": [
                        (
                            c.get("voice", default_voice),
                            reg.get("voices", {}).get(c.get("voice", default_voice), {}).get("gpt_weights", ""),
                            reg.get("voices", {}).get(c.get("voice", default_voice), {}).get("sovits_weights", ""),
                            tuple(reg.get("voices", {}).get(c.get("voice", default_voice), {}).get("aux_ref_audio_paths", [])),
                            c.get("preset", "mix"),
                            c["ttsText"],
                            c["start"],
                            c["end"],
                        )
                        for c in s_out["clauses"]
                    ],
                }
                for s_out, s_in in zip(scenes_payload, scenes_in)
            ],
        }
        ch_hash = sha256_str(json.dumps(ch_hash_payload, ensure_ascii=False, sort_keys=True))
        ch_wav = cache_dir / f"chap_{ch_idx + 1:02d}_{ch_hash}.wav"
        if not ch_wav.exists():
            tmp_dry = cache_dir / f"tmp_dry_{ch_idx}.wav"
            tmp_norm = cache_dir / f"tmp_norm_{ch_idx}.wav"
            sf.write(str(tmp_dry), dry_arr, sr, subtype="PCM_16")
            subprocess.run([
                FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(tmp_dry), "-af", PODCAST_MASTER_AF,
                "-ar", str(sr), "-ac", "1", "-c:a", "pcm_s16le", str(tmp_norm)
            ], check=True)
            norm_v, _ = sf.read(str(tmp_norm), dtype="float32")
            tmp_dry.unlink(missing_ok=True)
            tmp_norm.unlink(missing_ok=True)

            n_len = len(norm_v)
            mix = norm_v.copy()
            if enable_ambient_bed:
                t_ax = np.arange(n_len, dtype=np.float32) / sr
                bed = 0.002 * np.sin(2 * np.pi * 110.0 * t_ax)
                fn = min(int(0.45 * sr), n_len // 4)
                bed[:fn] *= np.linspace(0, 1, fn)
                bed[-fn:] *= np.linspace(1, 0, fn)
                mix = mix + bed
            for st, sk in sfx_list:
                sfx = make_warm_sfx(sk, sr=sr)
                i0 = int(st * sr)
                i1 = min(n_len, i0 + len(sfx))
                if i1 > i0:
                    mix[i0:i1] += sfx[: i1 - i0]
            sf.write(str(ch_wav), np.clip(mix, -0.92, 0.92), sr, subtype="PCM_16")

        real_info = sf.info(str(ch_wav))
        ch_dur = round(real_info.frames / float(real_info.samplerate), 3)
        if scenes_payload:
            scenes_payload[-1]["end"] = ch_dur
            scenes_payload[-1]["duration"] = round(ch_dur - scenes_payload[-1]["start"], 3)

        chapters_out.append({
            "chapterIndex": ch_idx + 1,
            "chapterTitle": ch.get("title", f"Chapter {ch_idx + 1}"),
            "chapterStartOffsetSec": round(global_offset, 3),
            "chapterDurationSec": ch_dur,
            "audioAbsPath": str(ch_wav),
            "scenes": scenes_payload,
            "captions": captions_payload,
        })
        global_offset += ch_dur

    for ch_o in chapters_out:
        ch_o["globalTotalDurationSec"] = round(global_offset, 3)
    return chapters_out


def build_chapters_passthrough_mode(proj: dict, raw_voice_path: Path, cache_dir: Path) -> list[dict]:
    """
    Mode 2: Human Raw Recording Passthrough (.wav/.m4a/.mp3).
    Auto-trims stutters/dead-air (>550ms -> 280ms breath), masters to -16.5 LUFS (LRA 3.5 LU),
    force-aligns full script with Qwen3-ForcedAligner, and slices into chapter chunks.
    """
    from rapid_mlx.audio.stt import STTEngine

    sr = 48000
    clean_full = cache_dir / f"human_clean_v2_{sha256_str(str(raw_voice_path) + str(raw_voice_path.stat().st_mtime))}.wav"
    if not clean_full.exists():
        subprocess.run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(raw_voice_path),
            "-af", (
                "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-40dB:start_silence=0.08:"
                "stop_periods=-1:stop_duration=0.55:stop_threshold=-40dB:leave_silence=0.28,"
                + PODCAST_MASTER_AF
            ),
            "-ac", "1", "-ar", str(sr), "-c:a", "pcm_s16le", str(clean_full)
        ], check=True)

    full_audio, _ = sf.read(str(clean_full), dtype="float32")
    total_audio_sec = len(full_audio) / float(sr)

    # Flatten all clauses to align against the full recording
    flat_clauses = []
    for ch_i, ch in enumerate(proj["chapters"]):
        for sc_i, sc in enumerate(ch.get("scenes", [])):
            for cl_i, cl in enumerate(sc.get("clauses", [])):
                txt = cl.get("tts_text") or cl["display_text"]
                flat_clauses.append((ch_i, sc_i, cl_i, txt, cl["display_text"], sc))

    full_script = " ".join(item[3] for item in flat_clauses)
    align_lang = "English" if proj.get("default_preset") == "en" else "Chinese"
    aligner = STTEngine("mlx-community/Qwen3-ForcedAligner-0.6B-8bit")
    aligner.load()
    aligned = aligner.align(clean_full, full_script, language=align_lang)
    items = aligned.segments or []

    # Map aligned tokens sequentially back onto clauses by character count
    cursor = 0
    clause_spans = {}
    for ch_i, sc_i, cl_i, tts_txt, disp_txt, _ in flat_clauses:
        n_tok = max(1, count_units(tts_txt))
        sub = items[cursor: cursor + n_tok]
        cursor += len(sub)
        if sub:
            st = float(sub[0]["start"])
            ed = float(sub[-1]["end"])
            chars = [{"text": x["text"], "start": float(x["start"]), "end": float(x["end"])} for x in sub]
        else:
            st = ed = total_audio_sec
            chars = []
        clause_spans[(ch_i, sc_i, cl_i)] = (st, ed, tts_txt, disp_txt, chars)

    chapters_out = []
    chapters_in = proj["chapters"]
    for ch_i, ch in enumerate(chapters_in):
        sc_list = ch.get("scenes", [])
        first_st = clause_spans[(ch_i, 0, 0)][0]
        ch_start_abs = 0.0 if ch_i == 0 else max(0.0, first_st - 0.12)
        if ch_i < len(chapters_in) - 1:
            next_st = clause_spans[(ch_i + 1, 0, 0)][0]
            ch_end_abs = max(ch_start_abs + 0.5, next_st - 0.12)
        else:
            ch_end_abs = total_audio_sec

        s0 = int(ch_start_abs * sr)
        s1 = min(len(full_audio), int(ch_end_abs * sr))
        ch_wav = cache_dir / f"human_chap_{ch_i + 1:02d}.wav"
        sf.write(str(ch_wav), full_audio[s0:s1], sr, subtype="PCM_16")
        ch_dur = round((s1 - s0) / float(sr), 3)

        scenes_payload = []
        captions_payload = []
        for sc_i, sc in enumerate(sc_list):
            clauses_out = []
            for cl_i, _ in enumerate(sc.get("clauses", [])):
                st, ed, tts_t, disp_t, chs = clause_spans[(ch_i, sc_i, cl_i)]
                rel_st = round(max(0.0, st - ch_start_abs), 3)
                rel_ed = round(min(ch_dur, ed - ch_start_abs), 3)
                rel_chs = [
                    {"text": x["text"], "start": round(max(0.0, x["start"] - ch_start_abs), 3), "end": round(min(ch_dur, x["end"] - ch_start_abs), 3)}
                    for x in chs
                ]
                c_obj = {
                    "sceneId": sc["id"],
                    "clauseIndex": cl_i,
                    "displayText": disp_t,
                    "ttsText": tts_t,
                    "start": rel_st,
                    "end": rel_ed,
                    "chars": rel_chs,
                }
                clauses_out.append(c_obj)
                captions_payload.append(c_obj)

            sc_rel_start = 0.0 if sc_i == 0 else clauses_out[0]["start"]
            if sc_i < len(sc_list) - 1:
                next_cl_st = max(0.0, clause_spans[(ch_i, sc_i + 1, 0)][0] - ch_start_abs)
                sc_rel_end = round(next_cl_st, 3)
            else:
                sc_rel_end = ch_dur
            scenes_payload.append({
                "id": sc["id"],
                "primitive": sc["primitive"],
                "start": round(sc_rel_start, 3),
                "end": round(max(sc_rel_start + 0.2, sc_rel_end), 3),
                "duration": round(max(0.2, sc_rel_end - sc_rel_start), 3),
                "clauses": clauses_out,
                "data": sc.get("data", {}),
            })

        chapters_out.append({
            "chapterIndex": ch_i + 1,
            "chapterTitle": ch.get("title", f"Chapter {ch_i + 1}"),
            "chapterStartOffsetSec": round(ch_start_abs, 3),
            "chapterDurationSec": ch_dur,
            "globalTotalDurationSec": round(total_audio_sec, 3),
            "audioAbsPath": str(ch_wav),
            "scenes": scenes_payload,
            "captions": captions_payload,
        })
    return chapters_out


def export_srt(chapters: list[dict], out_srt: Path) -> None:
    def fmt_ts(sec: float) -> str:
        ms = int(round(sec * 1000))
        hh, rem = divmod(ms, 3600000)
        mm, rem = divmod(rem, 60000)
        ss, mmm = divmod(rem, 1000)
        return f"{hh:02d}:{mm:02d}:{ss:02d},{mmm:03d}"

    lines = []
    idx = 1
    for ch in chapters:
        off = ch["chapterStartOffsetSec"]
        for cap in ch["captions"]:
            lines.append(f"{idx}\n{fmt_ts(off + cap['start'])} --> {fmt_ts(off + cap['end'])}\n{cap['displayText']}\n")
            idx += 1
    out_srt.write_text("\n".join(lines), encoding="utf-8")


def compute_voice_waveform_frames(wav_path: str, fps: int = 30, n_bars: int = 16) -> list[list[float]]:
    """Compute per-frame multi-band vocal waveform bars (0.0..1.0) synchronized to actual voice pitch & RMS."""
    audio, sr = sf.read(wav_path, dtype="float32")
    if audio.ndim > 1:
        audio = audio[:, 0]
    total_samples = len(audio)
    if total_samples == 0:
        return []

    total_frames = max(1, int(np.ceil((total_samples / float(sr)) * fps)))
    win_half = max(256, int(sr * 0.024))  # ~48ms Hann window around each frame

    # Center-symmetric vocal frequency band edges (Hz): center bars = core F0/F1 voice energy, outer = harmonics
    band_edges_hz = np.geomspace(95.0, 4200.0, (n_bars // 2) + 1)
    mirror_order = list(range((n_bars // 2) - 1, -1, -1)) + list(range(n_bars // 2))

    raw_frames = np.zeros((total_frames, n_bars), dtype=np.float32)
    rms_track = np.zeros(total_frames, dtype=np.float32)

    for f_idx in range(total_frames):
        center = int(((f_idx + 0.5) / float(fps)) * sr)
        s0 = max(0, center - win_half)
        s1 = min(total_samples, center + win_half)
        seg = audio[s0:s1]
        if len(seg) < 64:
            continue
        rms = float(np.sqrt(np.mean(seg * seg)))
        rms_track[f_idx] = rms
        if rms < 0.004:
            continue

        windowed = seg * np.hanning(len(seg))
        spec = np.abs(np.fft.rfft(windowed))
        freqs = np.fft.rfftfreq(len(seg), d=1.0 / sr)

        half_bars = np.zeros(n_bars // 2, dtype=np.float32)
        for b_i in range(n_bars // 2):
            f_lo, f_hi = band_edges_hz[b_i], band_edges_hz[b_i + 1]
            mask = (freqs >= f_lo) & (freqs < f_hi)
            if np.any(mask):
                half_bars[b_i] = float(np.sqrt(np.mean(spec[mask] ** 2)))
            else:
                idx_near = int(np.argmin(np.abs(freqs - 0.5 * (f_lo + f_hi))))
                half_bars[b_i] = float(spec[idx_near])

        raw_frames[f_idx, :] = half_bars[mirror_order]

    # Normalize against 96th percentile of active speech frames so syllables pop dynamically
    active_rms = rms_track[rms_track > 0.006]
    rms_ref = float(np.percentile(active_rms, 95)) if len(active_rms) > 0 else 0.05
    rms_norm = np.clip(rms_track / max(1e-4, rms_ref), 0.0, 1.0)

    for col in range(n_bars):
        col_vals = raw_frames[:, col]
        active_col = col_vals[rms_track > 0.006]
        col_ref = float(np.percentile(active_col, 95)) if len(active_col) > 0 else 1.0
        band_norm = np.clip(col_vals / max(1e-4, col_ref), 0.0, 1.0)
        # Blend overall vocal envelope with per-band formant modulation
        raw_frames[:, col] = np.where(
            rms_track > 0.0045,
            np.clip(0.38 * rms_norm + 0.62 * band_norm, 0.0, 1.0),
            0.0,
        )

    # Temporal attack/release smoothing across frames for organic fluid motion
    smoothed = np.zeros_like(raw_frames)
    for f_idx in range(total_frames):
        if f_idx == 0:
            smoothed[f_idx] = raw_frames[f_idx]
        else:
            cur = raw_frames[f_idx]
            prev = smoothed[f_idx - 1]
            # Fast attack (0.72), smooth decay (0.42)
            alpha = np.where(cur >= prev, 0.72, 0.42)
            smoothed[f_idx] = alpha * cur + (1.0 - alpha) * prev

    return [[round(float(v), 3) for v in row] for row in smoothed]


def main():
    parser = argparse.ArgumentParser(description="AGY video-studio Master Builder (16:9 Widescreen)")
    parser.add_argument("--project", required=True, help="Path to video_project.json")
    parser.add_argument("--out-dir", required=True, help="Output directory for MP4 and SRT")
    parser.add_argument("--aspects", default="16x9", help="Deprecated/compatibility flag; always renders 16x9 (1920x1080)")
    parser.add_argument("--voice", type=str, default=None, help="Override voice ID or alias from voices/registry.json (e.g. hahaxiong, female_01, 女声)")
    parser.add_argument("--speed", type=float, default=None, help="Override TTS speed_factor")
    parser.add_argument("--voice-file", type=str, default=None, help="Optional raw human .wav/.m4a for passthrough mode")
    parser.add_argument("--lint-only", action="store_true")
    parser.add_argument("--strict-sync", action="store_true", help="Raise error on any CJK mismatch between display_text and tts_text")
    parser.add_argument("--force-render", action="store_true")
    args = parser.parse_args()

    proj_path = Path(args.project).resolve()
    proj_dir = proj_path.parent
    proj = json.loads(proj_path.read_text(encoding="utf-8"))

    warnings = lint_project(proj, strict_sync=args.strict_sync, voice_override=args.voice)
    for w in warnings:
        print("LINT WARN:", w)
    if args.lint_only:
        print("Lint passed!")
        return

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = out_dir / ".vstudio_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    # 1. Execute automated Chrome 60fps captures if declared (content-hashed cache invalidation)
    for cap_spec in proj.get("captures", []):
        target_mp4 = (proj_dir / cap_spec["output"]).resolve()
        resolved_spec = dict(cap_spec)
        resolved_spec["output"] = str(target_mp4)
        spec_json = json.dumps(resolved_spec, ensure_ascii=False, sort_keys=True, indent=2)
        spec_hash = sha256_str(spec_json)
        spec_tmp = cache_dir / f"cap_{spec_hash}.json"
        if args.force_render or not target_mp4.exists() or not spec_tmp.exists():
            spec_tmp.write_text(spec_json, encoding="utf-8")
            subprocess.run(["node", str(CAPTURE_SCRIPT), "--spec", str(spec_tmp)], check=True)

    # 2. Synthesize & align chapters (clone or human passthrough mode; calibrated 1.06 speed + 3-tier breath pauses -> ~350 CPM)
    speed = args.speed or float(proj.get("speed_factor", 1.06))
    fps = int(proj.get("fps", 30))
    voice_file = args.voice_file or proj.get("raw_voice_path")
    if voice_file or proj.get("voice_mode") == "passthrough":
        if not voice_file:
            raise ValueError("Passthrough mode requires --voice-file or 'raw_voice_path' in project JSON.")
        chapters = build_chapters_passthrough_mode(proj, (proj_dir / voice_file).resolve(), cache_dir)
    else:
        chapters = build_chapters_clone_mode(proj, cache_dir, speed_default=speed, fps=fps, voice_override=args.voice)

    slug = proj.get("slug", proj_path.stem)
    export_srt(chapters, out_dir / f"{slug}.srt")

    # 3. Stage media into runtime/public/job_<slug>/ & render each chapter chunk in 16:9 (1920x1080)
    job_rel = f"job_{slug}"
    job_pub_dir = RUNTIME_DIR / "public" / job_rel
    job_pub_dir.mkdir(parents=True, exist_ok=True)

    total_ch = len(chapters)
    comp_id = "Studio16x9"
    chap_mp4s = []

    for ch in chapters:
        c_num = ch["chapterIndex"]
        audio_name = f"chap_{c_num:02d}.wav"
        shutil.copy2(ch["audioAbsPath"], job_pub_dir / audio_name)

        # Stage any scene videoFile / avatarFile paths relative to project dir
        staged_scenes = json.loads(json.dumps(ch["scenes"]))
        for sc in staged_scenes:
            d = sc.get("data", {})
            for field in ("videoFile", "avatarFile", "imageFile"):
                if d.get(field):
                    src_f = (proj_dir / d[field]).resolve()
                    if src_f.exists():
                        dst_name = f"{src_f.stem}_{sha256_str(str(src_f))[:6]}{src_f.suffix}"
                        shutil.copy2(src_f, job_pub_dir / dst_name)
                        d[field] = f"{job_rel}/{dst_name}"

        waveform_frames = compute_voice_waveform_frames(ch["audioAbsPath"], fps=fps, n_bars=16)

        payload = {
            "fps": fps,
            "chapterIndex": c_num,
            "totalChapters": total_ch,
            "chapterTitle": ch["chapterTitle"],
            "chapterStartOffsetSec": ch["chapterStartOffsetSec"],
            "chapterDurationSec": ch["chapterDurationSec"],
            "globalTotalDurationSec": ch["globalTotalDurationSec"],
            "audioFile": f"{job_rel}/{audio_name}",
            "showWaveform": bool(proj.get("show_waveform", True)),
            "subtitleFontSize": int(proj.get("subtitle_font_size", 56)),
            "waveform": waveform_frames,
            "scenes": staged_scenes,
            "captions": ch["captions"],
        }
        props_json = json.dumps({"payload": payload}, ensure_ascii=False, sort_keys=True)
        render_key = sha256_str(props_json + "|" + Path(ch["audioAbsPath"]).name)
        chap_mp4 = cache_dir / f"render_{slug}_16x9_ch{c_num:02d}_{render_key}.mp4"
        props_file = cache_dir / f"props_{slug}_16x9_ch{c_num:02d}.json"
        props_file.write_text(props_json, encoding="utf-8")

        if args.force_render or not chap_mp4.exists():
            print(f"[Render 16x9] Chapter {c_num}/{total_ch} ({ch['chapterDurationSec']}s)...")
            subprocess.run([
                str(REMOTION_BIN), "render", "src/index.ts", comp_id, str(chap_mp4),
                f"--props={props_file}",
                f"--browser-executable={CHROME_PATH}",
                "--codec=h264", "--crf=17", "--pixel-format=yuv420p",
            ], cwd=str(RUNTIME_DIR), check=True)
        else:
            print(f"[Cache Hit 16x9] Chapter {c_num}/{total_ch} unchanged -> skipping render!")

        chap_mp4s.append(chap_mp4)

    final_mp4 = out_dir / f"{slug}_16x9.mp4"
    if len(chap_mp4s) == 1:
        shutil.copy2(chap_mp4s[0], final_mp4)
    else:
        # Concatenate lossless PCM chapter WAVs directly & mux onto concatenated H.264 video
        # to eliminate any per-chapter AAC encoder priming sample drift across 10-minute videos!
        concat_txt = cache_dir / f"concat_{slug}_16x9.txt"
        concat_txt.write_text("\n".join(f"file '{p}'" for p in chap_mp4s) + "\n", encoding="utf-8")
        master_pcm = np.concatenate([sf.read(ch["audioAbsPath"], dtype="float32")[0] for ch in chapters])
        master_wav_all = cache_dir / f"master_{slug}_full.wav"
        sf.write(str(master_wav_all), master_pcm, 48000, subtype="PCM_16")
        subprocess.run([
            FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(concat_txt),
            "-i", str(master_wav_all),
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", str(final_mp4)
        ], check=True)

    print(f"==> Finished 16x9 Master Video ({chapters[0]['globalTotalDurationSec']}s): {final_mp4}")

    # Clean temporary staged job assets inside skill runtime
    shutil.rmtree(job_pub_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
