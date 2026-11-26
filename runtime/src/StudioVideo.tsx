import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  ArcGaugeThresholdTripwireMode,
  FocusHudBlurHandoffMode,
  PrimitiveAutonomousBotUiTester,
  PrimitiveDualTrackPipelineRace,
  PrimitiveEnvIsolationCompare,
  PrimitiveGitBranchMergeGraph,
  PrimitivePrChecksGateCard,
  PrimitiveRegressionLoopStage,
  PrimitiveSlotValidationAndStopwatch,
  PrimitiveSurfaceVsBackgroundIceberg,
  PrimitiveSwissCheeseDefenseLayers,
  SkillEditorLintCleanupMode,
  StudioVectorIcon,
  SynergyPuzzleExtendedModes,
} from './CicdGeneralizedPrimitives';

export type Tone = 'neutral' | 'amber' | 'emerald' | 'coral';

export type PrimitiveType =
  | 'chapter_card'
  | 'persona_quote'
  | 'dot_matrix_stat'
  | 'flow_3node'
  | 'matrix_compare'
  | 'focus_hud_demo'
  | 'live_web_showcase'
  | 'terminal_code_live'
  | 'ranked_bars'
  | 'evidence_clip'
  | 'skill_editor_spotlight'
  | 'stack_slice_builder'
  | 'traffic_gate_box'
  | 'deep_module_box'
  | 'split_tree_chat_dispatch'
  | 'annotated_ui_tour'
  | 'org_tree_radiate'
  | 'pipeline_timeline_flow'
  | 'defense_boundary_flow'
  | 'row_permission_table'
  | 'acronym_token_slot'
  | 'metaphor_canvas'
  | 'before_after_transformer'
  | 'synergy_puzzle_pair'
  | 'multi_perspective_ring'
  | 'convergent_hub_bus'
  | 'arc_gauge_audit'
  | 'idle_waste_vs_event_wake'
  | 'binary_decision_tree'
  | 'spotlight_window_tour'
  | 'vignette_metaphor_stage'
  | 'surface_vs_background_iceberg'
  | 'git_branch_merge_graph'
  | 'pr_checks_gate_card'
  | 'slot_validation_and_stopwatch'
  | 'autonomous_bot_ui_tester'
  | 'env_isolation_compare'
  | 'swiss_cheese_defense_layers'
  | 'regression_loop_stage'
  | 'dual_track_pipeline_race';

export interface CharTiming {
  text: string;
  start: number; // chapter-relative seconds
  end: number;
}

export interface ClauseTiming {
  sceneId: string;
  clauseIndex: number;
  displayText: string;
  ttsText: string;
  start: number; // chapter-relative seconds
  end: number;
  chars: CharTiming[];
}

export interface StudioScene {
  id: string;
  primitive: PrimitiveType;
  start: number; // chapter-relative seconds
  end: number;
  duration: number;
  clauses: ClauseTiming[];
  data: Record<string, any>;
}

export interface ChapterRenderPayload {
  fps: number;
  chapterIndex: number;
  totalChapters: number;
  chapterTitle: string;
  chapterStartOffsetSec: number;
  chapterDurationSec: number;
  globalTotalDurationSec: number;
  chapterDurationsSec?: number[];
  audioFile: string; // filename inside runtime/public/render_job/
  showWaveform?: boolean;
  subtitleFontSize?: number;
  waveform?: number[][];
  scenes: StudioScene[];
  captions: ClauseTiming[];
}

const TOKENS = {
  canvas: '#262626',
  card: '#323232',
  cardElevated: '#3B3B3D',
  paper: '#F7F6F2',
  paperInk: '#161618',
  border: '#3D3D3D',
  ink: '#FFFFFF',
  inkSecondary: '#A3A3A3',
  inkMuted: '#7A7A7A',
  amber: '#FE8A00',
  amberSoft: 'rgba(254, 138, 0, 0.14)',
  amberBorder: 'rgba(254, 138, 0, 0.50)',
  emerald: '#139F6B',
  emeraldMint: '#17B7A6',
  emeraldSoft: 'rgba(19, 159, 107, 0.15)',
  emeraldBorder: 'rgba(23, 183, 166, 0.48)',
  coral: '#E05549',
  coralSoft: 'rgba(224, 85, 73, 0.14)',
  coralBorder: 'rgba(224, 85, 73, 0.48)',
  slate: '#5E7898',
  slateLight: '#8BB6EE',
  slateFill: '#3B4252',
  violet: '#7C5BFD',
  subtitleBg: 'rgba(9, 9, 9, 0.94)',
  fontSans: '"Noto Sans TC", "PingFang TC", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", -apple-system, sans-serif',
  fontMono: '"JetBrains Mono", "SF Mono", "Menlo", "Noto Sans Mono CJK SC", ui-monospace, monospace',
};

const SPRING_SNAPPY = { damping: 28, stiffness: 185, mass: 0.85, overshootClamping: true };
const SPRING_SILKY = { damping: 32, stiffness: 145, mass: 0.92, overshootClamping: true };
const SPRING_BOUNCE = { damping: 26, stiffness: 190, mass: 0.82, overshootClamping: true };
const SPRING_PUZZLE = { damping: 24, stiffness: 210, mass: 0.8, overshootClamping: false };

function settle(p: number): number {
  return p >= 0.995 ? 1 : p;
}

function formatRollingMetric(raw: string, progress: number): string {
  if (progress >= 0.99) return raw;
  return raw.replace(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, (match) => {
    const hasComma = match.includes(',');
    const clean = match.replace(/,/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return match;
    const cur = num * progress;
    if (clean.includes('.')) {
      const decimals = clean.split('.')[1]?.length || 1;
      const [intPart, decPart] = cur.toFixed(decimals).split('.');
      const fmtInt = hasComma ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : intPart;
      return `${fmtInt}.${decPart}`;
    }
    const rounded = String(Math.round(cur));
    return hasComma ? rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : rounded;
  });
}

type FocusTarget = number | 'all' | 'overview';

function resolveFocusedTarget(
  clauseIdx: number,
  numClauses: number,
  numItems: number,
  customFocus?: FocusTarget[]
): FocusTarget {
  if (Array.isArray(customFocus) && customFocus[clauseIdx] !== undefined) {
    return customFocus[clauseIdx];
  }
  if (numItems <= 0) return 0;
  if (numClauses === numItems + 1 && numItems >= 2) {
    return clauseIdx === 0 ? 'overview' : Math.min(numItems - 1, clauseIdx - 1);
  }
  return Math.min(numItems - 1, Math.max(0, clauseIdx));
}

function getSmoothClauseValue(
  scene: StudioScene,
  frame: number,
  fps: number,
  valueAtClause: (clauseIdx: number) => number
): number {
  const n = Math.max(1, scene.clauses.length);
  let val = valueAtClause(0);
  for (let k = 1; k < n; k++) {
    const prevV = valueAtClause(k - 1);
    const nextV = valueAtClause(k);
    if (Math.abs(nextV - prevV) > 0.001) {
      const triggerF = Math.max(2, Math.round((scene.clauses[k].start - scene.start - 0.04) * fps));
      if (frame >= triggerF) {
        const sp = settle(spring({ frame: frame - triggerF, fps, config: SPRING_SILKY }));
        val += (nextV - prevV) * sp;
      }
    }
  }
  if (Math.abs(val - 1) <= 0.005) return 1;
  if (Math.abs(val) <= 0.005) return 0;
  return Math.max(0, Math.min(1, val));
}

const SceneStageTransition: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterP = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const exitFrames = 8;
  const isExiting = durationInFrames > 20 && frame > durationInFrames - exitFrames;
  const exitP = isExiting
    ? interpolate(frame, [durationInFrames - exitFrames, durationInFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.cubic),
      })
    : 1;
  const isStationary = enterP === 1 && !isExiting;
  const scale = interpolate(enterP, [0, 1], [0.985, 1]) * interpolate(exitP, [0, 1], [0.99, 1]);
  const translateY = interpolate(enterP, [0, 1], [14, 0]);

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enterP, exitP),
        transform: isStationary ? 'none' : `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

function tonePalette(tone: Tone = 'neutral') {
  if (tone === 'amber') {
    return { fg: TOKENS.amber, bg: TOKENS.amberSoft, border: TOKENS.amberBorder };
  }
  if (tone === 'emerald') {
    return { fg: TOKENS.emerald, bg: TOKENS.emeraldSoft, border: TOKENS.emeraldBorder };
  }
  if (tone === 'coral') {
    return { fg: TOKENS.coral, bg: TOKENS.coralSoft, border: TOKENS.coralBorder };
  }
  return { fg: TOKENS.ink, bg: TOKENS.card, border: TOKENS.border };
}

function getBeatFrame(scene: StudioScene, clauseIdx: number, fps: number, fallbackRatio = 0.48): number {
  const cl = scene.clauses[clauseIdx];
  if (cl) {
    return Math.max(4, Math.round((cl.start - scene.start) * fps));
  }
  return Math.max(8, Math.round(scene.duration * fallbackRatio * fps));
}

function getActiveClauseIdx(scene: StudioScene, frame: number, fps: number): number {
  const absSec = scene.start + frame / fps;
  let active = 0;
  for (let i = 0; i < scene.clauses.length; i++) {
    if (absSec >= scene.clauses[i].start - 0.08) {
      active = i;
    }
  }
  return active;
}

// Universal Top Scene Thesis Header + Context Pill + Connected Multi-Stage Stepper Bar
const SceneThesisHeader: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const rawSteps: Array<string | { label: string; status?: 'done' | 'active' | 'pending' }> = Array.isArray(d.stepper)
    ? d.stepper
    : [];
  const subSteps: string[] = Array.isArray(d.subStepper) ? d.subStepper : [];

  if (!d.topPill && !d.topTitle && rawSteps.length === 0) return null;

  const enter = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
  const activeClause = getActiveClauseIdx(scene, frame, fps);
  const accentPal = tonePalette(d.topAccentTone || 'amber');
  const titleStr = String(d.topTitle || '');
  const accentWord = String(d.topAccentWord || '');
  const activeStepIdx = typeof d.activeStepIndex === 'number' ? d.activeStepIndex : 0;
  const activeSubIdx =
    typeof d.activeSubStepIndex === 'number'
      ? d.activeSubStepIndex
      : Math.min(Math.max(0, subSteps.length - 1), activeClause);

  const renderTitle = () => {
    if (!accentWord || !titleStr.includes(accentWord)) {
      return titleStr;
    }
    const parts = titleStr.split(accentWord);
    return (
      <>
        {parts[0]}
        <span style={{ color: accentPal.fg }}>{accentWord}</span>
        {parts.slice(1).join(accentWord)}
      </>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: rawSteps.length > 0 ? 76 : 86,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        zIndex: 40,
        opacity: enter,
        transform: enter === 1 ? 'none' : `translate3d(0, ${interpolate(enter, [0, 1], [-14, 0]).toFixed(2)}px, 0)`,
        pointerEvents: 'none',
      }}
    >
      {rawSteps.length > 0 && (() => {
        const useCircleStepper =
          d.stepperStyle === 'circles' ||
          Boolean(d.stepperBracket) ||
          Array.isArray(d.stepperBrackets) ||
          (d.stepperStyle !== 'pills' && rawSteps.length >= 4);
        const brackets: Array<{ startIndex: number; endIndex: number; label: string }> = Array.isArray(d.stepperBrackets)
          ? d.stepperBrackets
          : d.stepperBracket
          ? [d.stepperBracket]
          : [];

        if (useCircleStepper) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                {rawSteps.map((st, idx) => {
                  const label = typeof st === 'string' ? st : st.label;
                  const status: 'done' | 'active' | 'pending' =
                    typeof st === 'object' && st.status
                      ? st.status
                      : idx < activeStepIdx
                      ? 'done'
                      : idx === activeStepIdx
                      ? 'active'
                      : 'pending';
                  const isDone = status === 'done';
                  const isActive = status === 'active';
                  const matchedBracket = brackets.find((b) => idx >= b.startIndex && idx <= b.endIndex);
                  const isBStart = matchedBracket && idx === matchedBracket.startIndex;
                  const isBEnd = matchedBracket && idx === matchedBracket.endIndex;
                  return (
                    <React.Fragment key={idx}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 162, position: 'relative' }}>
                        {matchedBracket && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -22,
                              left: isBStart ? 24 : -26,
                              right: isBEnd ? 24 : -26,
                              height: 12,
                              borderTop: `2.5px solid ${TOKENS.amber}`,
                              borderLeft: isBStart ? `2.5px solid ${TOKENS.amber}` : 'none',
                              borderRight: isBEnd ? `2.5px solid ${TOKENS.amber}` : 'none',
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            {idx === Math.floor((matchedBracket.startIndex + matchedBracket.endIndex) / 2) && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: -24,
                                  padding: '0 8px',
                                  background: TOKENS.canvas,
                                  fontFamily: TOKENS.fontMono,
                                  fontSize: 17,
                                  fontWeight: 900,
                                  color: TOKENS.amber,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {matchedBracket.label}
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: isActive ? TOKENS.amberSoft : '#343438',
                            border: `2.5px solid ${isActive ? TOKENS.amber : isDone ? '#8A8A90' : '#4E4E54'}`,
                            boxShadow: isActive ? '0 0 22px rgba(254, 138, 0, 0.42)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: TOKENS.fontMono,
                            fontSize: 20,
                            fontWeight: 900,
                            color: isActive || isDone ? TOKENS.ink : TOKENS.inkMuted,
                          }}
                        >
                          {isDone ? <StudioVectorIcon name="check" color="#FFFFFF" size={20} strokeWidth={2.8} /> : idx + 1}
                        </div>
                        <div
                          style={{
                            height: 42,
                            padding: '0 22px',
                            borderRadius: 999,
                            background: isActive ? TOKENS.amberSoft : '#303034',
                            border: `1.5px solid ${isActive ? TOKENS.amber : isDone ? '#5C5C62' : '#444449'}`,
                            boxShadow: isActive ? '0 6px 20px rgba(254, 138, 0, 0.24)' : 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            fontWeight: 800,
                            color: isActive || isDone ? TOKENS.ink : TOKENS.inkMuted,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {label}
                        </div>
                      </div>
                      {idx < rawSteps.length - 1 && (
                        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                          <svg width="52" height="18" viewBox="0 0 52 18" fill="none">
                            <line x1="2" y1="9" x2="44" y2="9" stroke={isDone ? '#C4C4CC' : '#525258'} strokeWidth="2.2" />
                            <polyline points="38 4 45 9 38 14" stroke={isDone ? '#C4C4CC' : '#525258'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {rawSteps.map((st, idx) => {
                const label = typeof st === 'string' ? st : st.label;
                const status: 'done' | 'active' | 'pending' =
                  typeof st === 'object' && st.status
                    ? st.status
                    : idx < activeStepIdx
                    ? 'done'
                    : idx === activeStepIdx
                    ? 'active'
                    : 'pending';
                const isDone = status === 'done';
                const isActive = status === 'active';
                return (
                  <React.Fragment key={idx}>
                    <div
                      style={{
                        minWidth: 210,
                        height: 46,
                        padding: '0 28px',
                        borderRadius: 999,
                        background: isActive ? TOKENS.amber : '#38383A',
                        border: `1.5px solid ${isActive ? TOKENS.amber : '#4A4A4E'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        fontSize: 23,
                        fontWeight: 800,
                        color: isActive ? '#141416' : isDone ? TOKENS.ink : TOKENS.inkSecondary,
                        boxShadow: isActive ? '0 8px 24px rgba(254, 138, 0, 0.28)' : 'none',
                      }}
                    >
                      {isDone && (
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: TOKENS.emeraldMint,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <StudioVectorIcon name="check" color="#0B1F1A" size={14} strokeWidth={3} />
                        </span>
                      )}
                      <span>{label}</span>
                    </div>
                    {idx < rawSteps.length - 1 && (
                      <div
                        style={{
                          width: 38,
                          height: 2.5,
                          background: isDone ? TOKENS.emerald : '#4A4A4E',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {subSteps.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {subSteps.map((sub, sIdx) => {
                  const isSubActive = sIdx === activeSubIdx;
                  const isSubDone = sIdx < activeSubIdx;
                  return (
                    <div
                      key={sIdx}
                      style={{
                        minWidth: 168,
                        height: 44,
                        padding: '0 24px',
                        borderRadius: 999,
                        background: isSubActive ? TOKENS.amber : isSubDone ? '#343438' : 'transparent',
                        border: isSubActive
                          ? `1.5px solid ${TOKENS.amber}`
                          : `1.5px dashed ${isSubDone ? TOKENS.emerald : '#66666B'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 21,
                        fontWeight: 800,
                        color: isSubActive ? '#141416' : TOKENS.inkSecondary,
                      }}
                    >
                      {sub}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
      {d.topPill && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 26px',
            borderRadius: 999,
            background: '#322F2B',
            border: '1.5px solid rgba(254, 138, 0, 0.38)',
            fontSize: 24,
            fontWeight: 800,
            color: TOKENS.ink,
            letterSpacing: '0.03em',
          }}
        >
          {d.topPillTag ? (
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 999,
                background: TOKENS.amberSoft,
                color: TOKENS.amber,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {d.topPillTag}
            </span>
          ) : (
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: TOKENS.amber }} />
          )}
          <span>{d.topPill}</span>
        </div>
      )}
      {d.topTitle && (
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: TOKENS.ink,
            letterSpacing: '-0.015em',
            textAlign: 'center',
          }}
        >
          {renderTitle()}
        </div>
      )}
    </div>
  );
};

// 1. chapter_card — High-Whitespace Editorial Chapter / Punch Card (85% Whitespace + Hero Underline Mode)
const PrimitiveChapterCard: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const accent = tonePalette(d.tone || 'emerald').fg;
  const pills: string[] = Array.isArray(d.pills) ? d.pills : [];

  const bar = spring({ frame, fps, config: SPRING_SNAPPY });
  const t1 = spring({ frame: frame - 4, fps, config: SPRING_SNAPPY });
  const t2 = spring({ frame: frame - getBeatFrame(scene, 1, fps, 0.35), fps, config: SPRING_SNAPPY });
  const pEnter = spring({ frame: frame - getBeatFrame(scene, Math.min(2, scene.clauses.length - 1), fps, 0.55), fps, config: SPRING_SNAPPY });

  if (d.heroUnderlineMode) {
    const targetPct = Number(d.underlineWidthPct ?? 76);
    const underlinePct = interpolate(frame, [3, 28], [0, targetPct], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: 'translateY(-12px)' }}>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t1, transform: `scale(${interpolate(t1, [0, 1], [0.92, 1])})` }}>
            <div
              style={{
                fontFamily: TOKENS.fontMono,
                fontSize: 112,
                fontWeight: 800,
                color: TOKENS.ink,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                textAlign: 'center',
              }}
            >
              {d.headline || 'grill-me'}
            </div>
            <div
              style={{
                marginTop: 14,
                height: 10,
                width: `${underlinePct.toFixed(2)}%`,
                background: TOKENS.amber,
                borderRadius: 999,
              }}
            />
          </div>
          {d.subheadline && (
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: TOKENS.inkSecondary,
                opacity: t2,
                transform: `translateY(${interpolate(t2, [0, 1], [14, 0])}px)`,
              }}
            >
              {d.subheadline}
            </div>
          )}
          {pills.length > 0 && (
            <div style={{ display: 'flex', gap: 20, marginTop: 8, opacity: pEnter, transform: `translateY(${interpolate(pEnter, [0, 1], [16, 0])}px)` }}>
              {pills.map((p, i) => (
                <span
                  key={i}
                  style={{
                    padding: '12px 26px',
                    borderRadius: 14,
                    background: i === 0 ? TOKENS.amberSoft : TOKENS.card,
                    border: `1.5px solid ${i === 0 ? TOKENS.amberBorder : TOKENS.border}`,
                    color: i === 0 ? TOKENS.amber : TOKENS.ink,
                    fontFamily: TOKENS.fontMono,
                    fontSize: 26,
                    fontWeight: 800,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 160px' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 30, maxWidth: 1280, transform: 'translateY(-24px)' }}>
        <div
          style={{
            width: 6,
            borderRadius: 999,
            background: TOKENS.amber,
            transform: `scaleY(${bar})`,
            transformOrigin: 'top',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {d.eyebrow && (
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 21, fontWeight: 700, color: TOKENS.amber, letterSpacing: '0.05em', opacity: t1 }}>
              {d.eyebrow}
            </div>
          )}
          <div
            style={{
              fontSize: 70,
              fontWeight: 800,
              color: TOKENS.ink,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              opacity: t1,
              transform: `translateX(${interpolate(t1, [0, 1], [20, 0])}px)`,
            }}
          >
            {d.headline || scene.clauses[0]?.displayText || ''}
          </div>
          {d.subheadline && (
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: accent,
                lineHeight: 1.24,
                letterSpacing: '-0.015em',
                opacity: scene.clauses.length > 1 ? t2 : t1,
                transform: `translateX(${interpolate(scene.clauses.length > 1 ? t2 : t1, [0, 1], [18, 0])}px)`,
              }}
            >
              {d.subheadline}
            </div>
          )}
          {pills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
              {pills.map((p, i) => {
                const pillStart = getBeatFrame(scene, Math.min(2, scene.clauses.length - 1), fps, 0.52) + i * 6;
                const pillP = settle(spring({ frame: frame - pillStart, fps, config: SPRING_SILKY }));
                const isAccentPill = i === 0 || i === pills.length - 1;
                return (
                  <span
                    key={i}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 999,
                      background: i === pills.length - 1 ? TOKENS.amberSoft : TOKENS.card,
                      border: `1px solid ${isAccentPill ? TOKENS.amberBorder : TOKENS.border}`,
                      color: i === pills.length - 1 ? TOKENS.amber : TOKENS.ink,
                      fontFamily: TOKENS.fontMono,
                      fontSize: 20,
                      fontWeight: 600,
                      opacity: pillP,
                      transform: pillP === 1 ? 'none' : `translate3d(0, ${interpolate(pillP, [0, 1], [14, 0]).toFixed(2)}px, 0)`,
                    }}
                  >
                    {p}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 2. persona_quote — Centered Avatar Intro -> Silky Left Glide + Breathing Halo + Quote Underline
const PrimitivePersonaQuote: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const badges: string[] = Array.isArray(d.badges) ? d.badges : [];
  const beat2 = getBeatFrame(scene, 1, fps, 0.34);
  const beat3 = getBeatFrame(scene, Math.min(2, scene.clauses.length - 1), fps, 0.62);

  const avEnter = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const quoteEnter = settle(spring({ frame: frame - beat2, fps, config: SPRING_SILKY }));
  const avatarCenterOffset = d.quote ? interpolate(quoteEnter, [0, 1], [230, 0]) : 0;
  const underlineP = interpolate(frame, [beat3 - 2, beat3 + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const quoteEmphasis = getSmoothClauseValue(scene, frame, fps, (c) => (c >= Math.min(2, scene.clauses.length - 1) ? 1 : 0));
  const haloPulse = 0.5 + 0.5 * Math.sin(frame / 14);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 160px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 56,
          transform: 'translateY(-24px)',
        }}
      >
        {/* Circular Avatar Badge (Starts near center on Clause 0, glides left cleanly as Quote unfolds!) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            opacity: avEnter,
            transform:
              avEnter === 1 && avatarCenterOffset === 0
                ? 'none'
                : `translate3d(${avatarCenterOffset.toFixed(2)}px, 0, 0) scale(${interpolate(avEnter, [0, 1], [0.88, 1]).toFixed(4)})`,
          }}
        >
          <div style={{ position: 'relative', width: 184, height: 184, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                border: `1.5px solid rgba(245, 158, 11, ${0.22 + haloPulse * 0.28})`,
                transform: `scale(${1 + haloPulse * 0.045})`,
              }}
            />
            <div
              style={{
                width: 176,
                height: 176,
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #343438, #222225)',
                border: `3px solid ${TOKENS.amber}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: `0 20px 50px rgba(0,0,0,0.48), 0 0 ${18 + haloPulse * 14}px rgba(245, 158, 11, 0.22)`,
              }}
            >
              {d.avatarFile ? (
                <Img
                  src={staticFile(d.avatarFile)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${1 + Math.sin(frame / 45) * 0.03})`,
                  }}
                />
              ) : (
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 58, fontWeight: 800, color: TOKENS.amber }}>
                  {(d.avatarMonogram || d.name || 'AI').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: TOKENS.ink }}>{d.name || 'Creator'}</div>
          {d.role && (
            <div
              style={{
                padding: '5px 16px',
                borderRadius: 999,
                background: TOKENS.card,
                border: `1px solid ${TOKENS.border}`,
                fontSize: 18,
                color: TOKENS.inkSecondary,
              }}
            >
              {d.role}
            </div>
          )}
        </div>

        {/* Right Progressive Pills + Quote Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 800,
            opacity: quoteEnter,
            transform: quoteEnter === 1 ? 'none' : `translate3d(${interpolate(quoteEnter, [0, 1], [28, 0]).toFixed(2)}px, 0, 0)`,
          }}
        >
          {badges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {badges.map((b, idx) => {
                const p = settle(spring({ frame: frame - (beat2 + idx * 5), fps, config: SPRING_SILKY }));
                const focusW = getSmoothClauseValue(scene, frame, fps, (c) => (c === idx + 1 ? 1 : 0));
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 12,
                      background: focusW > 0.3 ? `rgba(245, 158, 11, ${(0.05 + 0.1 * focusW).toFixed(3)})` : TOKENS.card,
                      border: `1.5px solid ${focusW > 0.4 ? TOKENS.amberBorder : TOKENS.border}`,
                      fontSize: 22,
                      fontWeight: 700,
                      color: focusW > 0.5 ? TOKENS.amber : TOKENS.ink,
                      opacity: p,
                      transform: p === 1 ? 'none' : `translate3d(${interpolate(p, [0, 1], [16, 0]).toFixed(2)}px, 0, 0)`,
                    }}
                  >
                    {b}
                  </div>
                );
              })}
            </div>
          )}

          {d.quote && (
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: TOKENS.card,
                border: `1.5px solid ${quoteEmphasis > 0.5 ? TOKENS.amber : TOKENS.amberBorder}`,
                borderRadius: 18,
                padding: '30px 34px',
                transform: quoteEmphasis === 0 ? 'none' : `translate3d(0, ${(-4 * quoteEmphasis).toFixed(2)}px, 0)`,
                boxShadow: `0 24px 56px rgba(0,0,0,0.46), 0 0 ${Math.round(28 * quoteEmphasis)}px rgba(245, 158, 11, ${(0.15 * quoteEmphasis).toFixed(3)})`,
              }}
            >
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 46, lineHeight: 0.8, color: TOKENS.amber, marginBottom: 10 }}>
                “
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.44 }}>
                {d.quote}
              </div>
              <div
                style={{
                  marginTop: 16,
                  height: 4,
                  width: `${Math.round(underlineP * 100)}%`,
                  background: `linear-gradient(90deg, ${TOKENS.amber}, ${TOKENS.emerald})`,
                  borderRadius: 999,
                }}
              />
              {d.source && (
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 18, color: TOKENS.inkMuted, marginTop: 12 }}>
                  — {d.source}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 3. dot_matrix_stat — Diagonal Wave-Ripple Dot Grid + Kinetic Rolling Counter + Clause-Synced Badges
const PrimitiveDotMatrixStat: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const is100Grid = Number(d.totalDots) === 100;
  const cols = Number(d.cols || (is100Grid ? 10 : 20));
  const rows = Number(d.rows || 10);
  const totalDots = cols * rows;
  const cellSize = cols <= 12 ? 36 : 26;
  const cellGap = cols <= 12 ? 14 : 12;
  const labelText = String(d.metricLabel || '');
  const activeCount = Math.max(1, Math.min(totalDots, Number(d.highlightDots ?? 4)));
  const pal = tonePalette(d.tone || 'amber');
  const beat2 = getBeatFrame(scene, 1, fps, 0.35);
  const beat3 = getBeatFrame(scene, Math.min(2, scene.clauses.length - 1), fps, 0.62);
  const activeClause = getActiveClauseIdx(scene, frame, fps);

  const gridEnter = spring({ frame, fps, config: SPRING_SILKY });
  const statEnter = spring({ frame: frame - Math.min(10, beat2), fps, config: SPRING_SILKY });
  const countProgress = interpolate(frame, [6, Math.max(28, beat2 + 16)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const badges: string[] = Array.isArray(d.badges) ? d.badges : [];
  const litThresholdIdx = totalDots - activeCount;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 76,
          transform: 'translateY(-22px)',
          maxWidth: 1680,
          padding: '0 80px',
        }}
      >
        <div style={{ opacity: gridEnter, flexShrink: 0 }}>
          {d.gridCaption && (
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, color: TOKENS.inkSecondary, marginBottom: 16 }}>
              {d.gridCaption}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gap: cellGap,
            }}
          >
            {Array.from({ length: totalDots }).map((_, idx) => {
              const r = Math.floor(idx / cols);
              const c = idx % cols;
              const diagDelay = (r + c) * 0.75;
              const dotAppear = spring({ frame: frame - diagDelay, fps, config: SPRING_BOUNCE });
              const shouldLight = idx >= litThresholdIdx;
              const lightOrder = Math.max(0, idx - litThresholdIdx);
              const lightFrame = 8 + (lightOrder / Math.max(1, activeCount)) * 24;
              const lightP = shouldLight
                ? spring({ frame: frame - lightFrame, fps, config: SPRING_BOUNCE })
                : 0;
              const pulse = shouldLight && frame > lightFrame + 12 ? 1 + Math.sin((frame + idx) / 15) * 0.06 : 1;
              const size = interpolate(lightP, [0, 1], [cols <= 12 ? 13 : 10, cols <= 12 ? 22 : 18]) * pulse;

              return (
                <div
                  key={idx}
                  style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: lightP > 0.15 ? pal.fg : '#48484C',
                    boxShadow: lightP > 0.3 ? `0 0 ${Math.round(16 * lightP)}px ${pal.fg}` : 'none',
                    placeSelf: 'center',
                    opacity: dotAppear,
                    transform: `scale(${dotAppear})`,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            opacity: statEnter,
            transform: `translateY(${interpolate(statEnter, [0, 1], [22, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: TOKENS.fontMono,
              fontSize: 110,
              fontWeight: 800,
              color: pal.fg,
              lineHeight: 1,
              textShadow: `0 12px 36px ${pal.bg}`,
              whiteSpace: 'nowrap',
            }}
          >
            {formatRollingMetric(String(d.metricValue || '0.2%'), countProgress)}
          </div>
          <div
            style={{
              fontSize: labelText.length <= 14 ? 36 : 31,
              fontWeight: 800,
              color: TOKENS.ink,
              marginTop: 18,
              lineHeight: 1.35,
              textWrap: 'balance' as any,
            }}
          >
            {labelText}
          </div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
              {badges.map((b, i) => {
                const bStart = i === 0 ? beat2 : beat3;
                const bP = spring({ frame: frame - bStart, fps, config: SPRING_BOUNCE });
                const isFocused = activeClause >= i + 1;
                return (
                  <span
                    key={i}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 999,
                      border: `1.5px solid ${isFocused ? pal.fg : pal.border}`,
                      background: pal.bg,
                      color: pal.fg,
                      fontFamily: TOKENS.fontMono,
                      fontSize: 20,
                      fontWeight: 700,
                      opacity: bP,
                      transform: bP >= 0.995 ? 'none' : `translate3d(0, ${interpolate(bP, [0, 1], [14, 0]).toFixed(2)}px, 0)`,
                      boxShadow: isFocused ? `0 8px 22px rgba(0,0,0,0.32)` : 'none',
                    }}
                  >
                    {b}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 4. flow_3node — Smart Beat-Aligned Progressive SVG Architecture Flow + Bidirectional Smooth Focus
const PrimitiveFlow3Node: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes: Array<{ tag?: string; title: string; subtitle?: string; bigValue?: string; badge?: string; tone?: Tone }> =
    Array.isArray(scene.data?.nodes) ? scene.data.nodes.slice(0, 4) : [];
  const customFocus: FocusTarget[] | undefined = scene.data?.clauseFocus;
  const numClauses = Math.max(1, scene.clauses.length);
  const hasIntroOverview = !customFocus && numClauses === nodes.length + 1 && nodes.length >= 2;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 22,
          transform: 'translateY(-22px)',
        }}
      >
        {nodes.map((nd, idx) => {
          const startF = hasIntroOverview
            ? idx * 6
            : idx === 0
            ? 0
            : getBeatFrame(scene, Math.min(idx, numClauses - 1), fps, idx / Math.max(1, nodes.length));
          const enter = settle(spring({ frame: frame - startF, fps, config: SPRING_SILKY }));
          const focusW = getSmoothClauseValue(scene, frame, fps, (c) => {
            const target = resolveFocusedTarget(c, numClauses, nodes.length, customFocus);
            return target === 'all' || target === idx ? 1 : 0;
          });
          const visW = getSmoothClauseValue(scene, frame, fps, (c) => {
            const target = resolveFocusedTarget(c, numClauses, nodes.length, customFocus);
            if (target === 'all' || target === idx) return 1;
            if (target === 'overview') return 0.86;
            if (typeof target === 'number' && idx < target) return 0.64;
            return hasIntroOverview ? 0.56 : 0.25;
          });

          const lineP = interpolate(frame, [startF + 3, startF + 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const pal = tonePalette(nd.tone || (idx === 0 ? 'amber' : 'neutral'));
          const isTinted = nd.tone === 'emerald' || nd.tone === 'coral' || focusW > 0.35;
          const pulseX = ((frame * 2.2) % 66);
          const liftY = enter === 1 ? -6 * focusW : interpolate(enter, [0, 1], [20, -6 * focusW]);

          return (
            <React.Fragment key={idx}>
              <div
                style={{
                  width: Math.min(430, Math.floor(1520 / Math.max(2, nodes.length))),
                  minHeight: 205,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: isTinted ? pal.bg : TOKENS.card,
                  border: `2px solid ${focusW > 0.45 ? pal.fg : isTinted ? pal.border : TOKENS.border}`,
                  borderLeft: idx === 0 && !isTinted ? `4px solid ${TOKENS.amber}` : undefined,
                  borderRadius: 18,
                  padding: '26px 28px',
                  opacity: enter * visW,
                  transform: Math.abs(liftY) < 0.05 ? 'none' : `translate3d(0, ${liftY.toFixed(2)}px, 0)`,
                  boxShadow:
                    focusW > 0.05
                      ? `0 24px 54px rgba(0,0,0,${(0.25 + 0.25 * focusW).toFixed(2)}), 0 0 ${Math.round(28 * focusW)}px ${pal.bg}`
                      : '0 12px 30px rgba(0,0,0,0.25)',
                }}
              >
                {nd.tag && (
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 17, fontWeight: 700, color: pal.fg, marginBottom: 8 }}>
                    {nd.tag}
                  </div>
                )}
                {nd.bigValue && (
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 58, fontWeight: 800, color: pal.fg, lineHeight: 1.08, marginBottom: 6 }}>
                    {formatRollingMetric(nd.bigValue, enter)}
                  </div>
                )}
                <div
                  style={{
                    fontSize: !nd.subtitle && !nd.bigValue ? 34 : 30,
                    fontWeight: 800,
                    color: TOKENS.ink,
                    marginBottom: nd.subtitle ? 8 : 0,
                    textWrap: 'balance' as any,
                  }}
                >
                  {nd.title}
                </div>
                {nd.subtitle && (
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary, lineHeight: 1.42, textWrap: 'balance' as any }}>
                    {nd.subtitle}
                  </div>
                )}
                {nd.badge && (
                  <div
                    style={{
                      marginTop: 12,
                      alignSelf: 'flex-start',
                      padding: '5px 16px',
                      borderRadius: 999,
                      background: pal.bg,
                      border: `1px solid ${pal.border}`,
                      color: pal.fg,
                      fontFamily: TOKENS.fontMono,
                      fontSize: 18,
                      fontWeight: 700,
                      whiteSpace: nd.badge.length <= 12 ? 'nowrap' : 'normal',
                      textWrap: 'balance' as any,
                    }}
                  >
                    {nd.badge}
                  </div>
                )}
              </div>

              {idx < nodes.length - 1 && (
                <svg
                  width={74}
                  height={36}
                  viewBox="0 0 74 36"
                  style={{ opacity: lineP > 0.03 ? 1 : 0.15, flexShrink: 0 }}
                >
                  <line x1="4" y1="18" x2="70" y2="18" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeDasharray="4 4" />
                  <line x1="4" y1="18" x2={4 + 66 * lineP} y2="18" stroke={TOKENS.amber} strokeWidth="3.5" strokeLinecap="round" />
                  {lineP > 0.85 && (
                    <circle cx={4 + pulseX} cy="18" r="4.5" fill={TOKENS.emerald} />
                  )}
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 5. matrix_compare — Bidirectional Smooth Column & Sub-Item Spotlight Matrix
const PrimitiveMatrixCompare: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols: Array<{ header: string; tone?: Tone; items: Array<{ title: string; detail?: string; badge?: string }> }> =
    Array.isArray(scene.data?.columns) ? scene.data.columns.slice(0, 3) : [];
  const customFocus: FocusTarget[] | undefined = scene.data?.clauseFocus;
  const itemFocusMap: Array<[number, number] | null> | undefined = scene.data?.itemFocus;
  const numClauses = Math.max(1, scene.clauses.length);

  const defaultColTarget = (c: number): FocusTarget => {
    if (Array.isArray(customFocus) && customFocus[c] !== undefined) return customFocus[c];
    if (cols.length === 2 && numClauses === 4) {
      if (c === 0) return 'overview';
      if (c === 1) return 0;
      if (c === 2) return 1;
      return 'all';
    }
    if (cols.length === 3 && numClauses === 4) {
      if (c < 3) return c;
      return 'all';
    }
    return resolveFocusedTarget(c, numClauses, cols.length);
  };

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 110px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(1, cols.length)}, 1fr)`,
          gap: 26,
          width: '100%',
          maxWidth: 1640,
          transform: 'translateY(-22px)',
        }}
      >
        {cols.map((col, cIdx) => {
          const enter = settle(spring({ frame: frame - cIdx * 6, fps, config: SPRING_SILKY }));
          const pal = tonePalette(col.tone || 'neutral');
          const tinted = col.tone && col.tone !== 'neutral';

          const focusW = getSmoothClauseValue(scene, frame, fps, (c) => {
            const t = defaultColTarget(c);
            return t === 'all' || t === cIdx ? 1 : 0;
          });
          const visW = getSmoothClauseValue(scene, frame, fps, (c) => {
            const t = defaultColTarget(c);
            if (t === 'all' || t === cIdx) return 1;
            if (t === 'overview') return 0.88;
            return 0.50;
          });
          const liftY = enter === 1 ? -6 * focusW : interpolate(enter, [0, 1], [22, -6 * focusW]);
          const barWidthPct = Math.round(24 + 48 * focusW);

          return (
            <div
              key={cIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '20px 18px',
                borderRadius: 20,
                background: `rgba(255, 255, 255, ${(0.03 * focusW).toFixed(3)})`,
                border: `1.5px solid ${focusW > 0.45 ? pal.border : 'rgba(255,255,255,0.06)'}`,
                opacity: enter * visW,
                transform: Math.abs(liftY) < 0.05 ? 'none' : `translate3d(0, ${liftY.toFixed(2)}px, 0)`,
                boxShadow: focusW > 0.05 ? `0 24px 56px rgba(0,0,0,${(0.44 * focusW).toFixed(2)})` : 'none',
              }}
            >
              <div
                style={{
                  height: 4,
                  width: `${barWidthPct}%`,
                  alignSelf: 'center',
                  borderRadius: 999,
                  background: focusW > 0.35 ? pal.fg : TOKENS.border,
                  marginBottom: 2,
                }}
              />
              <div style={{ fontSize: 28, fontWeight: 800, color: pal.fg, textAlign: 'center', marginBottom: 4 }}>
                {col.header}
              </div>
              {(col.items || []).map((it, rIdx) => {
                const itemP = settle(spring({ frame: frame - (cIdx * 6 + rIdx * 5 + 4), fps, config: SPRING_SILKY }));
                const subFocusW = Array.isArray(itemFocusMap)
                  ? getSmoothClauseValue(scene, frame, fps, (c) => {
                      const pair = itemFocusMap[c];
                      if (!pair) return 1;
                      if (pair[0] !== cIdx) return 1;
                      return pair[1] === rIdx ? 1 : 0.58;
                    })
                  : 1;
                const itemActive = focusW > 0.5 && subFocusW > 0.8;

                return (
                  <div
                    key={rIdx}
                    style={{
                      background: tinted ? pal.bg : TOKENS.card,
                      border: `1.5px solid ${itemActive && tinted ? pal.fg : tinted ? pal.border : TOKENS.border}`,
                      borderLeft: !tinted ? `4px solid ${itemActive ? TOKENS.amber : TOKENS.border}` : undefined,
                      borderRadius: 14,
                      padding: '20px 22px',
                      opacity: itemP * subFocusW,
                      transform: itemP === 1 ? 'none' : `translate3d(0, ${interpolate(itemP, [0, 1], [12, 0]).toFixed(2)}px, 0)`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: it.detail ? 26 : 29,
                          fontWeight: 800,
                          color: TOKENS.ink,
                          textWrap: 'balance' as any,
                        }}
                      >
                        {it.title}
                      </span>
                      {it.badge && (
                        <span
                          style={{
                            padding: '4px 14px',
                            borderRadius: 999,
                            background: itemActive ? pal.fg : pal.bg,
                            border: `1px solid ${pal.border}`,
                            color: itemActive && col.tone !== 'neutral' ? '#141416' : pal.fg,
                            fontFamily: TOKENS.fontMono,
                            fontSize: 16,
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {it.badge}
                        </span>
                      )}
                    </div>
                    {it.detail && (
                      <div style={{ fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary, marginTop: 8, lineHeight: 1.4 }}>
                        {it.detail}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 6. focus_hud_demo — Warm Matte Editorial (#323232) Backdrop Blur + Universal Interactive Action Card
const PrimitiveFocusHudDemo: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  if (d.mode === 'blur_handoff' || d.mode === 'blur_strikethrough') {
    return <FocusHudBlurHandoffMode scene={scene} />;
  }
  const backCards: Array<{
    title: string;
    detail?: string;
    code?: string;
    status?: string;
    tone?: Tone;
  }> = Array.isArray(d.backdropCards) ? d.backdropCards : [];
  const metaPills: string[] = Array.isArray(d.metaPills) ? d.metaPills : [];

  const activeClause = getActiveClauseIdx(scene, frame, fps);
  const beat2 = getBeatFrame(scene, 1, fps, 0.32);
  const beat3 = getBeatFrame(scene, Math.min(2, scene.clauses.length - 1), fps, 0.58);
  const beat4 = getBeatFrame(scene, Math.min(3, scene.clauses.length - 1), fps, 0.78);
  const clickFrame = scene.clauses.length >= 4 ? beat4 : beat3;

  const focus = settle(spring({ frame: frame - (beat2 - 4), fps, config: SPRING_SILKY }));
  const hoverP = settle(spring({ frame: frame - beat3, fps, config: SPRING_SILKY }));
  const click = settle(spring({ frame: frame - clickFrame, fps, config: SPRING_BOUNCE }));
  const rippleP = interpolate(frame, [clickFrame, clickFrame + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const btnPressScale =
    frame >= clickFrame && frame < clickFrame + 12
      ? interpolate(frame, [clickFrame, clickFrame + 4, clickFrame + 12], [1, 0.93, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const cursorOpacity = isNaN(click)
    ? 1
    : frame >= clickFrame + 8
    ? interpolate(frame, [clickFrame + 8, clickFrame + 22], [1, 0.36], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const isHovering = frame >= beat3 - 2 && frame < clickFrame + 2;
  const isClicked = frame >= clickFrame + 2 || activeClause >= 3;
  const hasTopHeader = Boolean(d.topTitle || d.topPill || (Array.isArray(d.stepper) && d.stepper.length > 0));

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Backdrop Context Cards (Warm Matte #323232, gracefully blurring out as foreground HUD arrives) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          opacity: interpolate(focus, [0, 1], [1, 0.28]),
          filter: focus > 0.01 ? `blur(${interpolate(focus, [0, 1], [0, 5]).toFixed(2)}px)` : 'none',
          transform: `translateY(${hasTopHeader ? 18 : -16}px) scale(${interpolate(focus, [0, 1], [1, 0.95]).toFixed(4)})`,
        }}
      >
        {backCards.slice(0, 3).map((bc, i) => {
          const p = settle(spring({ frame: frame - i * 5, fps, config: SPRING_SILKY }));
          const bcPal = tonePalette(bc.tone || 'amber');
          const bodyText = bc.detail || bc.code || '';
          const isMono = Boolean(bc.code && !bc.detail);
          return (
            <div
              key={i}
              style={{
                width: 456,
                background: TOKENS.card,
                border: `1.5px solid ${focus < 0.2 && i === Math.min(2, Math.floor(frame / 10)) ? TOKENS.amberBorder : TOKENS.border}`,
                borderRadius: 18,
                padding: '24px 26px',
                opacity: p,
                transform: p === 1 ? 'none' : `translate3d(0, ${interpolate(p, [0, 1], [16, 0]).toFixed(2)}px, 0)`,
                boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: TOKENS.inkSecondary }}>{bc.title}</span>
                {bc.status && (
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: bcPal.fg,
                      background: bcPal.bg,
                      border: `1px solid ${bcPal.border}`,
                      padding: '3px 12px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bc.status}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: isMono ? TOKENS.fontMono : TOKENS.fontSans,
                  fontSize: 21,
                  fontWeight: isMono ? 600 : 700,
                  color: TOKENS.ink,
                  background: '#29292B',
                  border: `1px solid ${TOKENS.border}`,
                  padding: '14px 16px',
                  borderRadius: 12,
                  lineHeight: 1.42,
                }}
              >
                {bodyText}
              </div>
            </div>
          );
        })}
      </div>

      {/* Foreground Warm Matte Editorial Interactive Spotlight Card (#323232 + #3B3B3D) */}
      <div
        style={{
          position: 'absolute',
          top: hasTopHeader ? 245 : 215,
          opacity: focus,
          transform: focus === 1 ? 'none' : `translate3d(0, ${interpolate(focus, [0, 1], [36, 0]).toFixed(2)}px, 0) scale(${interpolate(focus, [0, 1], [0.96, 1]).toFixed(4)})`,
        }}
      >
        <div
          style={{
            width: 880,
            background: TOKENS.card,
            borderRadius: 22,
            border: `2px solid ${isClicked ? TOKENS.emerald : isHovering ? TOKENS.amber : '#4A4A4F'}`,
            borderTop: `4px solid ${isClicked ? TOKENS.emerald : TOKENS.amber}`,
            padding: '30px 36px',
            boxShadow: isClicked
              ? '0 32px 72px rgba(0,0,0,0.58), 0 0 36px rgba(19, 159, 107, 0.24)'
              : '0 32px 72px rgba(0,0,0,0.56)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.hudEyebrow && (
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 15, fontWeight: 800, color: TOKENS.amber, letterSpacing: '0.04em' }}>
                  {d.hudEyebrow}
                </span>
              )}
              <span style={{ fontSize: 26, fontWeight: 800, color: TOKENS.ink }}>
                {d.hudTitle || '關鍵決策確認'}
              </span>
            </div>
            {d.hudBadge && (
              <span
                style={{
                  fontFamily: TOKENS.fontMono,
                  fontSize: 17,
                  color: isClicked ? TOKENS.emeraldMint : TOKENS.amber,
                  background: isClicked ? TOKENS.emeraldSoft : TOKENS.amberSoft,
                  border: `1px solid ${isClicked ? TOKENS.emeraldBorder : TOKENS.amberBorder}`,
                  padding: '5px 16px',
                  borderRadius: 999,
                  fontWeight: 800,
                }}
              >
                {d.hudBadge}
              </span>
            )}
          </div>

          {metaPills.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {metaPills.map((mp, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 14px',
                    borderRadius: 999,
                    background: '#29292B',
                    border: `1px solid ${TOKENS.border}`,
                    fontSize: 17,
                    fontWeight: 700,
                    color: TOKENS.inkSecondary,
                  }}
                >
                  {mp}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 24,
              background: '#28282A',
              border: `1px solid ${TOKENS.border}`,
              padding: '18px 24px',
              borderRadius: 16,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span
                style={{
                  fontFamily: d.monoPrompt ? TOKENS.fontMono : TOKENS.fontSans,
                  fontSize: 23,
                  fontWeight: 700,
                  color: TOKENS.ink,
                  lineHeight: 1.4,
                }}
              >
                {d.promptText || ''}
              </span>
              {d.hudSubtext && (
                <span style={{ fontSize: 17, fontWeight: 600, color: TOKENS.inkSecondary }}>{d.hudSubtext}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                {rippleP > 0 && rippleP < 1 && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: -5,
                      borderRadius: 999,
                      border: `2.5px solid ${TOKENS.emeraldMint}`,
                      opacity: 1 - rippleP,
                      transform: `scale(${(1 + rippleP * 0.45).toFixed(3)})`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <span
                  style={{
                    minWidth: 146,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    padding: '10px 24px',
                    borderRadius: 999,
                    background: isClicked ? TOKENS.emerald : isHovering ? TOKENS.amber : TOKENS.amberSoft,
                    border: `1.5px solid ${isClicked ? TOKENS.emeraldMint : TOKENS.amber}`,
                    color: isClicked ? '#FFFFFF' : isHovering ? '#141416' : TOKENS.amber,
                    fontSize: 20,
                    fontWeight: 800,
                    transform: btnPressScale === 1 ? 'none' : `scale(${btnPressScale.toFixed(3)})`,
                    boxShadow: isClicked ? '0 0 24px rgba(19, 159, 107, 0.45)' : 'none',
                  }}
                >
                  {isClicked ? `✓ ${d.clickedLabel || '已啟用'}` : d.primaryAction || '一鍵啟用'}
                </span>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  style={{
                    position: 'absolute',
                    right: interpolate(hoverP, [0, 1], [-26, 6]),
                    bottom: interpolate(hoverP, [0, 1], [-28, -14]),
                    opacity: cursorOpacity,
                    transform: `scale(${btnPressScale === 1 ? 1 : 0.86})`,
                    pointerEvents: 'none',
                    zIndex: 4,
                  }}
                >
                  <path d="M4 2L20 11L13 13L16 20L13 21.5L10 14.5L5 19Z" fill="#FFF" stroke="#141416" strokeWidth="1.5" />
                </svg>
              </div>
              {d.secondaryAction && (
                <span
                  style={{
                    minWidth: 92,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    padding: '10px 18px',
                    borderRadius: 999,
                    background: '#323235',
                    border: `1px solid ${TOKENS.border}`,
                    color: TOKENS.inkSecondary,
                    fontSize: 19,
                    fontWeight: 700,
                    opacity: isClicked ? 0.35 : 0.9,
                  }}
                >
                  {d.secondaryAction}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 7. live_web_showcase — True 60fps Video Stream + Footnote + Non-Overlapping Side Forensic Callout
const PrimitiveLiveWebShowcase: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const callout = d.callout;
  const beat2 = getBeatFrame(scene, 1, fps, 0.48);

  const enter = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
  const sideEnter = settle(spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY }));
  const pal = tonePalette(callout?.tone || 'coral');

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 38,
          transform: 'translateY(-20px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: enter,
            transform: `translateX(${callout ? interpolate(sideEnter, [0, 1], [235, 0]) : 0}px) scale(${interpolate(enter, [0, 1], [0.95, 1]) * (callout ? interpolate(sideEnter, [0, 1], [1.05, 1]) : 1)})`,
          }}
        >
          <div
            style={{
              width: callout ? 1040 : 1160,
              height: callout ? 640 : 700,
              borderRadius: 16,
              overflow: 'hidden',
              border: `1.5px solid ${TOKENS.border}`,
              boxShadow: '0 28px 68px rgba(0,0,0,0.52)',
              background: '#1A1A1D',
            }}
          >
            {d.videoFile ? (
              <OffthreadVideo src={staticFile(d.videoFile)} muted style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#141416' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TOKENS.fontMono, fontSize: 28, color: TOKENS.inkMuted }}>
                {d.placeholderLabel || 'Live Stream'}
              </div>
            )}
          </div>
          {d.footnote && (
            <div style={{ marginTop: 14, fontFamily: TOKENS.fontMono, fontSize: 20, color: TOKENS.inkSecondary }}>
              {d.footnote}
            </div>
          )}
        </div>

        {callout && (
          <div
            style={{
              width: 440,
              background: TOKENS.card,
              border: `2px solid ${pal.border}`,
              borderRadius: 18,
              padding: '30px 32px',
              boxShadow: '0 24px 54px rgba(0,0,0,0.52)',
              opacity: sideEnter,
              transform: `translateX(${interpolate(sideEnter, [0, 1], [28, 0])}px)`,
              flexShrink: 0,
            }}
          >
            {callout.badge && (
              <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 999, background: pal.bg, border: `1px solid ${pal.border}`, color: pal.fg, fontFamily: TOKENS.fontMono, fontSize: 17, fontWeight: 800, marginBottom: 14 }}>
                {callout.badge}
              </div>
            )}
            <div style={{ fontSize: 30, fontWeight: 800, color: TOKENS.ink, marginBottom: 12, lineHeight: 1.28, textWrap: 'balance' as any }}>{callout.title}</div>
            {callout.bigMetric && (
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 54, fontWeight: 800, color: pal.fg, lineHeight: 1.08 }}>
                {callout.bigMetric}
              </div>
            )}
            {callout.note && (
              <div style={{ fontSize: 21, fontWeight: 600, color: TOKENS.inkSecondary, marginTop: 10, lineHeight: 1.42, textWrap: 'balance' as any }}>{callout.note}</div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 8. terminal_code_live — Clause-Synced Typewriter CLI / Code Stream + Blinking Cursor & Focus Bar
const PrimitiveTerminalCodeLive: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const lines: Array<{
    text: string;
    kind?: 'cmd' | 'out' | 'comment' | 'bullet' | 'tree' | 'input';
    highlight?: boolean;
    circleWord?: string;
    stepClause?: number;
  }> = Array.isArray(d.lines) ? d.lines : [];
  const winEnter = spring({ frame, fps, config: SPRING_SILKY });
  const isAgentChat = lines.some((l) => l.kind === 'bullet' || l.kind === 'tree' || l.kind === 'input');

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: isAgentChat ? 960 : 1340,
          background: isAgentChat ? '#28282B' : '#191A1D',
          border: `1.5px solid ${TOKENS.border}`,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 32px 72px rgba(0,0,0,0.54)',
          opacity: winEnter,
          transform: `translateY(${interpolate(winEnter, [0, 1], [22, -20])}px)`,
        }}
      >
        <div
          style={{
            padding: '15px 24px',
            background: '#222327',
            borderBottom: `1px solid ${TOKENS.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: isAgentChat ? '#55555A' : '#FF5F56' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: isAgentChat ? '#55555A' : '#FFBD2E' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: isAgentChat ? '#55555A' : '#27C93F' }} />
            {!isAgentChat && (
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary, fontWeight: 600, marginLeft: 8 }}>
                {d.windowTitle || 'zsh · terminal'}
              </span>
            )}
          </div>
          {isAgentChat && (
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 20, color: TOKENS.inkSecondary, fontWeight: 700 }}>
              {d.windowTitle || 'agent'}
            </span>
          )}
          {d.badge ? (
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 16, color: TOKENS.emerald, background: TOKENS.emeraldSoft, padding: '4px 14px', borderRadius: 999, fontWeight: 700 }}>
              {d.badge}
            </span>
          ) : (
            <span style={{ width: isAgentChat ? 56 : 0 }} />
          )}
        </div>
        <div style={{ padding: isAgentChat ? '32px 42px' : '28px 34px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lines.map((ln, idx) => {
            const numClauses = Math.max(1, scene.clauses.length);
            const lineForClause = (c: number) =>
              lines.length > numClauses ? Math.min(lines.length - 1, c + 1) : Math.min(lines.length - 1, c);
            const targetClause = typeof ln.stepClause === 'number'
              ? ln.stepClause
              : Math.min(numClauses - 1, Math.max(0, lines.length > numClauses ? idx - 1 : idx));
            const startF = idx === 0 ? 0 : getBeatFrame(scene, targetClause, fps, idx / Math.max(1, lines.length));
            const p = settle(spring({ frame: frame - startF, fps, config: SPRING_SILKY }));
            const typeP = interpolate(frame, [startF, startF + 16], [0.12, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const charsToShow = frame >= startF ? Math.ceil(ln.text.length * typeP) : 0;
            const focusW = getSmoothClauseValue(scene, frame, fps, (c) => (lineForClause(c) === idx ? 1 : 0));
            const visW = isAgentChat
              ? frame >= startF ? 1 : 0
              : getSmoothClauseValue(scene, frame, fps, (c) => {
                  const cur = lineForClause(c);
                  if (cur === idx) return 1;
                  if (idx < cur) return 0.66;
                  return 0.24;
                });
            const isCurrentActive = focusW > 0.45 && frame >= startF;
            const color = isAgentChat
              ? ln.kind === 'tree'
                ? TOKENS.inkSecondary
                : TOKENS.ink
              : isCurrentActive
              ? ln.kind === 'out'
                ? TOKENS.emerald
                : TOKENS.amber
              : ln.kind === 'comment'
              ? TOKENS.inkMuted
              : ln.kind === 'out'
              ? TOKENS.emerald
              : TOKENS.ink;
            const slideX = isAgentChat ? 0 : p === 1 ? 6 * focusW : interpolate(p, [0, 1], [16, 6 * focusW]);
            const visibleStr = ln.text.slice(0, charsToShow);
            const circleDrawP = ln.circleWord
              ? interpolate(frame, [startF + 6, startF + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
              : 0;

            const renderTextWithCircle = () => {
              if (!ln.circleWord || !visibleStr.includes(ln.circleWord)) {
                return visibleStr;
              }
              const parts = visibleStr.split(ln.circleWord);
              return (
                <>
                  {parts[0]}
                  <span style={{ position: 'relative', display: 'inline-block', padding: '0 8px' }}>
                    {ln.circleWord}
                    <svg
                      viewBox="0 0 110 56"
                      style={{
                        position: 'absolute',
                        left: -8,
                        top: -8,
                        width: 'calc(100% + 16px)',
                        height: 'calc(100% + 16px)',
                        overflow: 'visible',
                        pointerEvents: 'none',
                      }}
                    >
                      <ellipse
                        cx="55"
                        cy="28"
                        rx="50"
                        ry="23"
                        fill="none"
                        stroke={TOKENS.amber}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        strokeDasharray="240"
                        strokeDashoffset={240 * (1 - circleDrawP)}
                      />
                    </svg>
                  </span>
                  {parts.slice(1).join(ln.circleWord)}
                </>
              );
            };

            if (ln.kind === 'input') {
              return (
                <div
                  key={idx}
                  style={{
                    background: '#3D3D42',
                    borderRadius: 12,
                    padding: '12px 20px',
                    fontFamily: TOKENS.fontSans,
                    fontSize: 26,
                    fontWeight: 800,
                    color: TOKENS.ink,
                    opacity: p * visW,
                  }}
                >
                  &gt; {renderTextWithCircle()}
                </div>
              );
            }

            return (
              <div
                key={idx}
                style={{
                  fontFamily: isAgentChat && ln.kind !== 'tree' ? TOKENS.fontSans : TOKENS.fontMono,
                  fontSize: isAgentChat ? (ln.kind === 'tree' ? 23 : 28) : 25,
                  fontWeight: isAgentChat ? (ln.kind === 'tree' ? 600 : 800) : 600,
                  color,
                  background: !isAgentChat && focusW > 0.02 ? `rgba(245, 158, 11, ${(0.13 * focusW).toFixed(3)})` : 'transparent',
                  borderLeft: isAgentChat ? 'none' : `3.5px solid rgba(245, 158, 11, ${focusW.toFixed(3)})`,
                  padding: isAgentChat ? (ln.kind === 'tree' ? '2px 0 2px 24px' : '4px 0') : '8px 16px',
                  borderRadius: 8,
                  opacity: p * visW,
                  transform: Math.abs(slideX) < 0.05 ? 'none' : `translate3d(${slideX.toFixed(2)}px, 0, 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {ln.kind === 'bullet' && (
                  <span style={{ width: 13, height: 13, borderRadius: '50%', background: TOKENS.amber, flexShrink: 0 }} />
                )}
                {ln.kind === 'tree' && <span style={{ color: TOKENS.inkMuted, fontFamily: TOKENS.fontMono }}>└</span>}
                <span>
                  {renderTextWithCircle()}
                  <span
                    style={{
                      display: 'inline-block',
                      width: isAgentChat ? 3 : 10,
                      height: 24,
                      background: color,
                      marginLeft: 5,
                      verticalAlign: 'middle',
                      opacity: (typeP < 1 || (isCurrentActive && frame % 18 < 10)) && frame >= startF ? 1 : 0,
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 9. ranked_bars — Smart Beat-Aligned Progress Bars + Bidirectional Smooth Spotlight
const PrimitiveRankedBars: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const bars: Array<{ label: string; pct: number; valueText: string; tone?: Tone }> = Array.isArray(d.bars)
    ? d.bars
    : [];
  const customFocus: FocusTarget[] | undefined = d.clauseFocus;
  const numClauses = Math.max(1, scene.clauses.length);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1320, transform: 'translateY(-22px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {d.heading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: TOKENS.ink }}>{d.heading}</span>
            {d.heroStat && (
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 46, fontWeight: 800, color: TOKENS.amber }}>
                {formatRollingMetric(
                  String(d.heroStat),
                  interpolate(frame, [0, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
                )}
              </span>
            )}
          </div>
        )}
        {bars.map((b, idx) => {
          const startF = idx * 7;
          const p = settle(spring({ frame: frame - startF, fps, config: SPRING_SILKY }));
          const focusW = getSmoothClauseValue(scene, frame, fps, (c) => {
            const t = resolveFocusedTarget(c, numClauses, bars.length, customFocus);
            return t === 'all' || t === idx ? 1 : 0;
          });
          const visW = getSmoothClauseValue(scene, frame, fps, (c) => {
            const t = resolveFocusedTarget(c, numClauses, bars.length, customFocus);
            if (t === 'all' || t === idx) return 1;
            if (t === 'overview') return 0.88;
            return 0.66;
          });
          const pal = tonePalette(b.tone || (idx === 0 ? 'amber' : 'neutral'));
          const widthPct = Math.max(2, Math.min(100, b.pct)) * p;
          const barColor = pal.fg === TOKENS.ink ? '#8E8E98' : pal.fg;
          const slideX = p === 1 ? 8 * focusW : interpolate(p, [0, 1], [-18, 8 * focusW]);

          return (
            <div
              key={idx}
              style={{
                background: focusW > 0.35 ? TOKENS.cardElevated : TOKENS.card,
                border: `1.5px solid ${focusW > 0.45 ? pal.fg : TOKENS.border}`,
                borderRadius: 16,
                padding: '18px 24px',
                opacity: p * visW,
                transform: Math.abs(slideX) < 0.05 ? 'none' : `translate3d(${slideX.toFixed(2)}px, 0, 0)`,
                boxShadow: focusW > 0.05 ? `0 18px 44px rgba(0,0,0,${(0.38 * focusW).toFixed(2)})` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 25, fontWeight: 700, color: TOKENS.ink }}>{b.label}</span>
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 25, fontWeight: 800, color: pal.fg }}>
                  {formatRollingMetric(b.valueText, p)}
                </span>
              </div>
              <div style={{ height: 14, background: '#202022', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: 999,
                    boxShadow: focusW > 0.3 ? `0 0 ${Math.round(16 * focusW)}px ${barColor}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 10. evidence_clip — Warm Paper Document + Smart Beat-Aligned Smooth Excerpt Highlighter
const PrimitiveEvidenceClip: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const excerpts: Array<{ text: string; highlight?: boolean }> = Array.isArray(d.excerpts) ? d.excerpts : [];
  const customFocus: FocusTarget[] | undefined = d.clauseFocus;
  const numClauses = Math.max(1, scene.clauses.length);
  const hasTitleIntroBeat = !customFocus && numClauses === excerpts.length + 1 && excerpts.length >= 2;

  const cardEnter = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const titleFocusW = hasTitleIntroBeat
    ? getSmoothClauseValue(scene, frame, fps, (c) => (c === 0 ? 1 : 0))
    : 0;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1180,
          background: TOKENS.paper,
          color: TOKENS.paperInk,
          borderRadius: 18,
          padding: '38px 48px',
          boxShadow: '0 32px 76px rgba(0,0,0,0.54)',
          opacity: cardEnter,
          transform: cardEnter === 1 ? 'translateY(-22px)' : `translateY(${interpolate(cardEnter, [0, 1], [26, -22]).toFixed(2)}px)`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)', paddingBottom: 16, marginBottom: 22 }}>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 18, fontWeight: 800, color: '#B45309', letterSpacing: '0.05em' }}>
            {d.docType || 'PRIMARY EVIDENCE'}
          </span>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 18, color: '#52525B' }}>{d.docMeta || ''}</span>
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: '#111113',
            marginBottom: 22,
            lineHeight: 1.28,
            borderLeft: titleFocusW > 0.05 ? `5px solid rgba(217, 119, 6, ${titleFocusW.toFixed(3)})` : 'none',
            paddingLeft: titleFocusW > 0.05 ? `${Math.round(14 * titleFocusW)}px` : 0,
          }}
        >
          {d.docTitle || ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {excerpts.map((ex, i) => {
            const targetClauseIdx = hasTitleIntroBeat ? i + 1 : Math.min(i, numClauses - 1);
            const startF = targetClauseIdx === 0 ? 4 : getBeatFrame(scene, targetClauseIdx, fps, i / Math.max(1, excerpts.length));
            const appearP = settle(spring({ frame: frame - i * 5, fps, config: SPRING_SILKY }));
            const hiSweep = interpolate(frame, [startF, startF + 20], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });

            const focusW = getSmoothClauseValue(scene, frame, fps, (c) => {
              const t = resolveFocusedTarget(c, numClauses, excerpts.length, customFocus);
              return t === i ? 1 : 0;
            });
            const visW = getSmoothClauseValue(scene, frame, fps, (c) => {
              const t = resolveFocusedTarget(c, numClauses, excerpts.length, customFocus);
              if (t === i) return 1;
              if (t === 'overview') return 0.72;
              if (typeof t === 'number' && i < t) return 0.54;
              return 0.36;
            });
            const slideX = 8 * focusW;

            return (
              <div
                key={i}
                style={{
                  fontSize: 25,
                  lineHeight: 1.55,
                  color: focusW > 0.5 ? '#111113' : '#3F3F46',
                  fontWeight: focusW > 0.5 ? 700 : 500,
                  background:
                    focusW > 0.02
                      ? `linear-gradient(90deg, rgba(245, 158, 11, ${(0.34 * focusW).toFixed(3)}) ${(hiSweep * 100).toFixed(1)}%, rgba(0,0,0,0.02) ${(hiSweep * 100).toFixed(1)}%)`
                      : 'transparent',
                  borderLeft: `4px solid rgba(217, 119, 6, ${focusW.toFixed(3)})`,
                  padding: '8px 14px',
                  borderRadius: 8,
                  opacity: appearP * visW,
                  transform: slideX < 0.05 ? 'none' : `translate3d(${slideX.toFixed(2)}px, 0, 0)`,
                }}
              >
                {ex.text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 11. skill_editor_spotlight — macOS Editor / Security Report with Clause-by-Clause Typing & Spotlight Translation
const PrimitiveSkillEditorSpotlight: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  if (d.mode === 'lint_cleanup' || Array.isArray(d.codeLines)) {
    return <SkillEditorLintCleanupMode scene={scene} />;
  }
  const items: Array<{
    code: string;
    translation?: string;
    badge?: string;
    tone?: Tone;
    stepClause?: number;
  }> = Array.isArray(d.items) ? d.items : [];

  const activeClause = getActiveClauseIdx(scene, frame, fps);
  const winEnter = spring({ frame, fps, config: SPRING_SNAPPY });

  // Find which item is currently spotlighted based on activeClause
  let activeItemIdx = 0;
  for (let i = 0; i < items.length; i++) {
    const scIdx = items[i].stepClause ?? i;
    if (activeClause >= scIdx) {
      activeItemIdx = i;
    }
  }

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1460,
          background: '#1C1C1F',
          border: `1.5px solid ${TOKENS.border}`,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.58)',
          opacity: winEnter,
          transform: `translateY(${interpolate(winEnter, [0, 1], [24, d.topTitle || d.topPill ? 18 : -18])}px)`,
        }}
      >
        {/* macOS Traffic Lights + File Path Header */}
        <div
          style={{
            padding: '15px 24px',
            background: '#252529',
            borderBottom: `1px solid ${TOKENS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#FF5F56' }} />
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#FFBD2E' }} />
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#27C93F' }} />
          </div>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 20, fontWeight: 700, color: TOKENS.inkSecondary }}>
            {d.filePath || 'skills/grill-me/SKILL.md'}
          </span>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 17, color: TOKENS.amber, background: TOKENS.amberSoft, padding: '4px 14px', borderRadius: 999, fontWeight: 700 }}>
            {d.rightBadge || 'Markdown · 5 Lines'}
          </span>
        </div>

        {/* Progressive Clause-by-Clause Lines */}
        <div style={{ padding: '30px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.map((it, idx) => {
            const triggerClause = it.stepClause ?? idx;
            const startF = triggerClause === 0 ? 4 : getBeatFrame(scene, triggerClause, fps);
            const isRevealed = frame >= startF - 2;
            const p = settle(spring({ frame: frame - startF, fps, config: SPRING_SILKY }));
            const focusW = getSmoothClauseValue(scene, frame, fps, (c) => {
              let activeIdxAtC = 0;
              for (let j = 0; j < items.length; j++) {
                if (c >= (items[j].stepClause ?? j)) activeIdxAtC = j;
              }
              return activeIdxAtC === idx ? 1 : 0;
            });
            const visW = getSmoothClauseValue(scene, frame, fps, (c) => {
              let activeIdxAtC = 0;
              for (let j = 0; j < items.length; j++) {
                if (c >= (items[j].stepClause ?? j)) activeIdxAtC = j;
              }
              if (c < triggerClause) return 0.12;
              return activeIdxAtC === idx ? 1 : 0.48;
            });
            const isCurrentFocus = focusW > 0.45 && isRevealed;
            const pal = tonePalette(it.tone || 'amber');

            const typeP = interpolate(frame, [startF, startF + 18], [0.15, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const charsToShow = isRevealed ? Math.ceil(it.code.length * typeP) : 0;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 24,
                  padding: '15px 22px',
                  borderRadius: 14,
                  background: isCurrentFocus ? pal.bg : 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${isCurrentFocus ? pal.border : 'rgba(255,255,255,0.06)'}`,
                  opacity: isRevealed ? visW : 0.12,
                  transform: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                  <span
                    style={{
                      fontFamily: TOKENS.fontMono,
                      fontSize: 19,
                      fontWeight: 800,
                      color: isCurrentFocus ? pal.fg : TOKENS.inkMuted,
                      width: 32,
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 23, fontWeight: 600, color: TOKENS.ink, lineHeight: 1.4, flex: 1 }}>
                    {isRevealed ? (
                      <>
                        {it.code.slice(0, charsToShow)}
                        <span
                          style={{
                            display: 'inline-block',
                            width: 11,
                            height: 22,
                            background: pal.fg,
                            marginLeft: 4,
                            verticalAlign: 'middle',
                            opacity: isCurrentFocus && typeP < 1 ? 1 : 0,
                          }}
                        />
                      </>
                    ) : (
                      <div
                        style={{
                          width: `${Math.min(72, 34 + ((idx * 13) % 28))}%`,
                          height: 14,
                          borderRadius: 999,
                          background: 'rgba(255, 255, 255, 0.14)',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Right White-Language Translation Spotlight Pill */}
                {it.translation && isRevealed && (
                  <div
                    style={{
                      padding: '8px 20px',
                      borderRadius: 999,
                      background: isCurrentFocus ? pal.fg : TOKENS.cardElevated,
                      color: isCurrentFocus ? '#141416' : TOKENS.inkSecondary,
                      fontSize: 21,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      opacity: p,
                      transform: p === 1 ? 'none' : `translate3d(${interpolate(p, [0, 1], [18, 0]).toFixed(2)}px, 0, 0)`,
                      boxShadow: focusW > 0.2 ? `0 8px 24px rgba(0,0,0,${(0.35 * focusW).toFixed(2)})` : 'none',
                    }}
                  >
                    {it.translation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Status Bar */}
        <div
          style={{
            padding: '10px 26px',
            background: '#17171A',
            borderTop: `1px solid ${TOKENS.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: TOKENS.fontMono,
            fontSize: 16,
            color: TOKENS.inkMuted,
          }}
        >
          <span>{d.statusLeft || 'UTF-8 · Prompt Pruning Enabled'}</span>
          <span>{d.statusRight || `Active Line: ${activeItemIdx + 1} / ${items.length}`}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 12. stack_slice_builder — Clean Side-by-Side Modular Vertical Slice Stack Builder
const PrimitiveStackSliceBuilder: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const columns: Array<{
    badge: string;
    title: string;
    stepClause?: number;
    footerBadge?: string;
    footerClause?: number;
    layers: Array<{ label: string; sub?: string; color: 'blue' | 'purple' | 'amber' | 'emerald' | 'coral'; stepClause: number }>;
  }> = Array.isArray(d.columns) ? d.columns : [];

  const layerColorMap = {
    blue: { bg: '#2F3642', border: '#6E8CA8', text: '#FFFFFF', sub: '#CBD5E1' },
    purple: { bg: 'rgba(124, 91, 253, 0.18)', border: '#8B70FD', text: '#FFFFFF', sub: '#DDD6FE' },
    amber: { bg: 'rgba(254, 138, 0, 0.18)', border: '#FE8A00', text: '#FFFFFF', sub: '#FDBA74' },
    emerald: { bg: 'rgba(19, 159, 107, 0.20)', border: '#17B7A6', text: '#FFFFFF', sub: '#6EE7B7' },
    coral: { bg: 'rgba(224, 85, 73, 0.18)', border: '#E05549', text: '#FFFFFF', sub: '#FCA5A5' },
  };

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 48,
          transform: `translateY(${d.topTitle || d.topPill ? 24 : -14}px)`,
        }}
      >
        {columns.map((col, cIdx) => {
          const colClause = col.stepClause ?? cIdx;
          const colStartF = colClause === 0 ? 2 : getBeatFrame(scene, Math.min(colClause, Math.max(0, scene.clauses.length - 1)), fps);
          const colP = settle(spring({ frame: frame - colStartF, fps, config: SPRING_SNAPPY }));
          const headerVisible = frame >= colStartF - 2;
          const defaultVerifyClause = Math.max(1, scene.clauses.length - 1);
          const verifyClause = col.footerClause !== undefined ? col.footerClause : defaultVerifyClause;
          const verifyStartF = getBeatFrame(scene, Math.min(verifyClause, Math.max(0, scene.clauses.length - 1)), fps);
          const isVerifiedGreen = frame >= verifyStartF - 2;
          const verifyP = settle(spring({ frame: frame - verifyStartF, fps, config: SPRING_SNAPPY }));

          return (
            <div
              key={cIdx}
              style={{
                position: 'relative',
                width: 470,
                minHeight: 500,
                background: '#27272B',
                border: `2.5px solid ${
                  isVerifiedGreen
                    ? TOKENS.emerald
                    : headerVisible
                    ? 'rgba(245, 158, 11, 0.42)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
                borderRadius: 22,
                padding: '26px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 20,
                boxShadow: isVerifiedGreen
                  ? '0 0 38px rgba(16, 185, 129, 0.25), 0 24px 60px rgba(0,0,0,0.45)'
                  : '0 24px 60px rgba(0,0,0,0.45)',
              }}
            >
              {isVerifiedGreen && (
                <div
                  style={{
                    position: 'absolute',
                    top: -18,
                    right: -18,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: TOKENS.emerald,
                    color: '#0D1F17',
                    fontSize: 26,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.5)',
                    transform: `scale(${verifyP})`,
                  }}
                >
                  ✓
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  opacity: headerVisible ? colP : 0,
                  transform: `translateY(${interpolate(colP, [0, 1], [14, 0])}px)`,
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: isVerifiedGreen ? TOKENS.emerald : TOKENS.amber,
                    color: '#141416',
                    fontFamily: TOKENS.fontMono,
                    fontSize: 22,
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {col.badge || cIdx + 1}
                </span>
                <span style={{ fontSize: 32, fontWeight: 800, color: TOKENS.ink }}>{col.title}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 'auto' }}>
                {col.layers.map((ly, lIdx) => {
                  const lyClause = ly.stepClause ?? 0;
                  const lyF = lyClause === 0 ? 4 : getBeatFrame(scene, Math.min(lyClause, Math.max(0, scene.clauses.length - 1)), fps);
                  const lp = settle(spring({ frame: frame - lyF, fps, config: SPRING_SILKY }));
                  const focusW = getSmoothClauseValue(scene, frame, fps, (c) => (c === lyClause ? 1 : 0));
                  const shownW = getSmoothClauseValue(scene, frame, fps, (c) => (c >= lyClause ? (c === lyClause ? 1 : 0.82) : 0.08));
                  const isShown = frame >= lyF - 2;
                  const cStyle = layerColorMap[ly.color || 'blue'];
                  const liftY = isShown ? interpolate(lp, [0, 1], [24, -4 * focusW]) : 22;

                  return (
                    <div
                      key={lIdx}
                      style={{
                        height: col.layers.length <= 2 ? 128 : 86,
                        padding: '0 18px',
                        borderRadius: 14,
                        background: cStyle.bg,
                        border: `2.5px solid ${focusW > 0.45 ? '#FFFFFF' : cStyle.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        opacity: isShown ? lp * shownW : 0.08,
                        transform: Math.abs(liftY) < 0.05 ? 'none' : `translate3d(0, ${liftY.toFixed(2)}px, 0)`,
                        boxShadow:
                          focusW > 0.05
                            ? `0 0 ${Math.round(28 * focusW)}px ${cStyle.border}, 0 16px 36px rgba(0,0,0,0.45)`
                            : '0 10px 26px rgba(0,0,0,0.28)',
                      }}
                    >
                      <span style={{ fontSize: 25, fontWeight: 900, color: cStyle.text, textAlign: 'center', textWrap: 'balance' as any }}>{ly.label}</span>
                      {ly.sub && (
                        <span style={{ fontFamily: TOKENS.fontMono, fontSize: 16, fontWeight: 700, color: (cStyle as any).sub || cStyle.text, opacity: 0.92, textAlign: 'center' }}>
                          {ly.sub}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {col.footerBadge && isVerifiedGreen && (
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: TOKENS.emeraldSoft,
                    border: `1.5px solid ${TOKENS.emeraldBorder}`,
                    color: TOKENS.emeraldMint,
                    fontSize: 18,
                    fontWeight: 800,
                    textAlign: 'center',
                    opacity: verifyP,
                  }}
                >
                  {col.footerBadge}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 13. traffic_gate_box — Invariant Rule Lock Card + Red-to-Green Verification Gate
const PrimitiveTrafficGateBox: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  if (d.mode === 'deep_module') {
    return <PrimitiveDeepModuleBox scene={scene} />;
  }

  const redF = getBeatFrame(scene, d.redClause ?? 1, fps);
  const greenF = getBeatFrame(scene, d.greenClause ?? 2, fps);
  const leftP = spring({ frame, fps, config: SPRING_SNAPPY });
  const redP = spring({ frame: frame - redF, fps, config: SPRING_SNAPPY });
  const greenP = spring({ frame: frame - greenF, fps, config: SPRING_SNAPPY });
  const isRedLit = frame >= redF - 2;
  const isGreenLit = frame >= greenF - 2;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, transform: 'translateY(22px)' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 56 }}>
          <div
            style={{
              width: 680,
              background: '#2B2927',
              border: `2px solid ${TOKENS.amber}`,
              borderRadius: 20,
              padding: '36px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
              opacity: leftP,
              transform: `translateX(${interpolate(leftP, [0, 1], [-24, 0])}px)`,
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: TOKENS.inkSecondary }}>
              {d.lockTitle || '先把測試死規矩定死'}
            </div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 44, fontWeight: 900, color: TOKENS.ink }}>
              {d.ruleLeft || '滿 $1,000'} <span style={{ color: TOKENS.amber }}>→ {d.ruleRight || '只能 -$100'}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: TOKENS.coral, opacity: isRedLit ? 1 : 0.35 }}>
              {d.lockNote || '未達驗收條件前直接攔截，禁止帶病放行'}
            </div>
          </div>

          <div
            style={{
              width: 520,
              background: '#252528',
              border: `2px solid ${TOKENS.border}`,
              borderRadius: 22,
              padding: '32px 36px',
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
              boxShadow: '0 24px 60px rgba(0,0,0,0.48)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: isRedLit ? 1 : 0.3 }}>
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: '50%',
                  background: isRedLit ? '#EF4444' : '#3F2324',
                  boxShadow: isRedLit && !isGreenLit ? '0 0 34px rgba(239,68,68,0.75)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#1A1111',
                  transform: `scale(${isRedLit ? interpolate(redP, [0, 1], [0.85, 1]) : 0.9})`,
                }}
              >
                ✗
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: TOKENS.coral }}>{d.redTitle || '測試失敗'}</div>
                <div style={{ fontSize: 23, fontWeight: 700, color: TOKENS.inkSecondary }}>{d.redSub || '紅燈：先確認規則鎖死'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: isGreenLit ? 1 : 0.28 }}>
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: '50%',
                  background: isGreenLit ? '#10B981' : '#1F352B',
                  boxShadow: isGreenLit ? '0 0 36px rgba(16,185,129,0.8)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#0D1F17',
                  transform: `scale(${isGreenLit ? interpolate(greenP, [0, 1], [0.85, 1]) : 0.9})`,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: TOKENS.emerald }}>{d.greenTitle || '測試通過'}</div>
                <div style={{ fontSize: 23, fontWeight: 700, color: TOKENS.ink }}>{d.greenSub || '綠燈：符合標準准許放行'}</div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            width: 1256,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            opacity: isRedLit ? redP : 0,
          }}
        >
          <div style={{ width: '100%', height: 10, background: '#38383C', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${isGreenLit ? 100 : isRedLit ? 52 : 10}%`,
                height: '100%',
                background: isGreenLit ? TOKENS.emerald : TOKENS.amber,
              }}
            />
          </div>
          <div
            style={{
              padding: '10px 30px',
              borderRadius: 12,
              background: '#222428',
              border: `1.5px solid ${isGreenLit ? TOKENS.emeraldBorder : TOKENS.amberBorder}`,
              fontSize: 26,
              fontWeight: 800,
              color: TOKENS.ink,
            }}
          >
            {d.bottomCaption || '先鎖定驗收底線 → 再執行實作交付'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 14. deep_module_box — Dedicated Single-Door Facade Encapsulation Architecture Diagram
const PrimitiveDeepModuleBox: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const step2F = getBeatFrame(scene, d.gateClause ?? 1, fps);
  const step3F = getBeatFrame(scene, d.innerClause ?? 2, fps);
  const p1 = spring({ frame, fps, config: SPRING_SNAPPY });
  const p2 = spring({ frame: frame - step2F, fps, config: SPRING_SNAPPY });
  const p3 = spring({ frame: frame - step3F, fps, config: SPRING_SNAPPY });
  const rooms: string[] = Array.isArray(d.rooms)
    ? d.rooms
    : ['計算折扣', '驗證信用卡', '建立訂單', '扣除庫存', '寄信通知'];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          transform: 'translateY(22px)',
        }}
      >
        <div
          style={{
            padding: '14px 44px',
            borderRadius: 14,
            background: '#2E2E33',
            border: `2px solid ${TOKENS.border}`,
            fontSize: 28,
            fontWeight: 800,
            color: TOKENS.ink,
            opacity: p1,
          }}
        >
          {d.callerLabel || '主控調用層 (Main Controller)'}
        </div>

        <div style={{ fontSize: 32, color: TOKENS.emerald, fontWeight: 900, opacity: p2 }}>↓</div>

        <div
          style={{
            width: 1320,
            background: 'rgba(16, 185, 129, 0.07)',
            border: `2.5px solid ${TOKENS.emerald}`,
            borderRadius: 22,
            padding: '28px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            boxShadow: '0 28px 70px rgba(0,0,0,0.48)',
            opacity: p2,
            transform: `scale(${interpolate(p2, [0, 1], [0.95, 1])})`,
          }}
        >
          <div
            style={{
              padding: '12px 36px',
              borderRadius: 12,
              background: '#162922',
              border: `2px solid ${TOKENS.emerald}`,
              fontFamily: TOKENS.fontMono,
              fontSize: 30,
              fontWeight: 800,
              color: TOKENS.emerald,
            }}
          >
            {d.doorFunction || 'processCheckout()'}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              flexWrap: 'nowrap',
              justifyContent: 'center',
            }}
          >
            {(rooms as Array<string | { title: string; sub?: string }>).map((rm, idx) => {
              const rmP = settle(spring({ frame: frame - (step3F + idx * 3), fps, config: SPRING_SNAPPY }));
              let mainLabel = typeof rm === 'string' ? rm : rm.title;
              let subLabel = typeof rm === 'string' ? undefined : rm.sub;
              if (typeof rm === 'string' && rm.includes(' · ')) {
                const [p1Str, ...rest] = rm.split(' · ');
                mainLabel = p1Str.trim();
                subLabel = rest.join(' · ').trim();
              }
              const cardW = Math.min(240, Math.floor((1240 - (rooms.length - 1) * 16) / Math.max(1, rooms.length)));
              const titleSize = mainLabel.length > 10 ? 20 : mainLabel.length > 7 ? 22 : 26;
              return (
                <div
                  key={idx}
                  style={{
                    width: cardW,
                    minHeight: 106,
                    padding: '20px 14px',
                    borderRadius: 16,
                    background: '#23272A',
                    border: `1.5px solid rgba(52, 211, 153, ${(0.26 + 0.30 * rmP).toFixed(2)})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    textAlign: 'center',
                    opacity: rmP,
                    transform: rmP === 1 ? 'none' : `translate3d(0, ${interpolate(rmP, [0, 1], [18, 0]).toFixed(2)}px, 0)`,
                    boxShadow: rmP > 0.6 ? '0 10px 24px rgba(0,0,0,0.32)' : 'none',
                  }}
                >
                  <div
                    style={{
                      fontFamily: /^[A-Za-z0-9_.\- ]+$/.test(mainLabel) ? TOKENS.fontMono : TOKENS.fontSans,
                      fontSize: titleSize,
                      fontWeight: 800,
                      color: TOKENS.ink,
                      whiteSpace: mainLabel.length <= 13 ? 'nowrap' : 'normal',
                      textWrap: 'balance' as any,
                    }}
                  >
                    {mainLabel}
                  </div>
                  {subLabel && (
                    <span
                      style={{
                        padding: '3px 12px',
                        borderRadius: 999,
                        background: TOKENS.emeraldSoft,
                        color: TOKENS.emeraldMint,
                        fontSize: 18,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {subLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 24, fontWeight: 800, color: TOKENS.emerald, opacity: p3 }}>
            {d.bottomCaption || '✓ 對外暴露單一極簡入口，對內隱藏所有複雜細節'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 15. split_tree_chat_dispatch — Universal Center-Grow Directory Tree -> Smooth Shift Left -> Right Dispatch Handoff & Output Preview
const PrimitiveSplitTreeChatDispatch: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const folders: Array<{ name: string; files: string; stepClause?: number; highlight?: boolean }> = Array.isArray(d.folders)
    ? d.folders
    : [
        { name: 'context', files: 'spec.md · rules.md', stepClause: 0 },
        { name: 'inputs', files: 'requirements.md', stepClause: 1, highlight: true },
        { name: 'outputs', files: 'build_artifact', stepClause: 2 },
      ];

  const shiftClause = d.shiftClause ?? Math.min(2, Math.max(1, scene.clauses.length - 2));
  const typeClause = d.typeClause ?? Math.min(3, Math.max(1, scene.clauses.length - 1));
  const shiftF = getBeatFrame(scene, shiftClause, fps, 0.52);
  const typeF = getBeatFrame(scene, typeClause, fps, 0.72);

  const shiftP = spring({ frame: frame - shiftF, fps, config: SPRING_SNAPPY });
  const typeP = interpolate(frame, [typeF, typeF + 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isTypingStarted = frame >= typeF - 2;
  const sourceLabel = d.sourceNode || d.fromBot || '調度核心';
  const targetLabel = d.targetNode || d.toBot || '執行單元';
  const sourceIcon = d.sourceIcon || '★';
  const targetIcon = d.targetIcon || '</>';
  const chatPrompt = String(d.dispatchText || d.chatPrompt || '讀取 inputs 規格與 context 規範，完成實作後輸出至 outputs 目錄');
  const shownChars = Math.ceil(chatPrompt.length * typeP);
  const hasTopBar = Boolean(d.topTitle || d.topPill || (Array.isArray(d.stepper) && d.stepper.length > 0));

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 1520,
          height: 580,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${hasTopBar ? 28 : -12}px)`,
        }}
      >
        {/* Left / Center File Tree Card (Starts centered, shifts left by -370px at shiftClause!) */}
        <div
          style={{
            width: 680,
            background: '#222225',
            border: `1.5px solid ${TOKENS.border}`,
            borderRadius: 20,
            padding: '28px 34px',
            boxShadow: '0 28px 70px rgba(0,0,0,0.52)',
            transform: `translateX(${interpolate(shiftP, [0, 1], [0, -370])}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, fontWeight: 800, color: TOKENS.inkSecondary, marginBottom: 18 }}>
            <span>📁</span>
            <span>{d.rootLabel || '共用工作區 · Shared Workspace'}</span>
          </div>

          <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 23, fontWeight: 700, color: TOKENS.ink }}>
              ▾ 📂 {d.workspaceName || 'workspace'}
            </div>

            {folders.map((fd, idx) => {
              const fStart = (fd.stepClause ?? idx) === 0 ? 2 : getBeatFrame(scene, fd.stepClause ?? idx, fps);
              const fp = spring({ frame: frame - fStart, fps, config: SPRING_SNAPPY });
              const isShown = frame >= fStart - 1;
              const isLit = isTypingStarted && (fd.highlight || idx === (d.highlightFolderIndex ?? 1));

              return (
                <div
                  key={idx}
                  style={{
                    marginLeft: 26,
                    padding: '12px 18px',
                    borderRadius: 12,
                    background: isLit ? TOKENS.amberSoft : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${isLit ? TOKENS.amber : 'transparent'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isShown ? fp : 0,
                    transform: `translateY(${interpolate(fp, [0, 1], [14, 0])}px)`,
                  }}
                >
                  <span style={{ fontFamily: TOKENS.fontMono, fontSize: 23, fontWeight: 700, color: isLit ? TOKENS.amber : TOKENS.ink }}>
                    ▸ 📁 {fd.name}
                  </span>
                  <span
                    style={{
                      padding: '4px 14px',
                      borderRadius: 999,
                      background: TOKENS.cardElevated,
                      fontFamily: TOKENS.fontMono,
                      fontSize: 18,
                      fontWeight: 700,
                      color: TOKENS.ink,
                    }}
                  >
                    {fd.files}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Dispatch Topology + Live Specification Bubble */}
        <div
          style={{
            position: 'absolute',
            right: 40,
            width: 660,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            opacity: shiftP,
            transform: `translateX(${interpolate(shiftP, [0, 1], [48, 0])}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 78, height: 78, borderRadius: '50%', background: TOKENS.ink, color: '#141416', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, border: `3px solid ${TOKENS.amber}` }}>
                {sourceIcon}
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: TOKENS.ink }}>{sourceLabel}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 32, color: TOKENS.amber, fontWeight: 900 }}>───────→</div>
              <span style={{ padding: '4px 16px', borderRadius: 999, background: '#322F2B', border: `1px solid ${TOKENS.amberBorder}`, fontSize: 18, fontWeight: 800, color: TOKENS.amber }}>
                {d.dispatchBadge || '上下文零重複交接'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 78, height: 78, borderRadius: '50%', background: TOKENS.emeraldMint, color: '#0B1F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TOKENS.fontMono, fontSize: 26, fontWeight: 900 }}>
                {targetIcon}
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: TOKENS.emeraldMint }}>{targetLabel}</span>
            </div>
          </div>

          {isTypingStarted && (
            <div
              style={{
                width: '100%',
                background: TOKENS.card,
                border: `1.5px solid ${TOKENS.amberBorder}`,
                borderRadius: 18,
                padding: '24px 28px',
                fontSize: 25,
                fontWeight: 700,
                color: TOKENS.ink,
                lineHeight: 1.48,
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
              }}
            >
              {chatPrompt.slice(0, shownChars)}
              <span style={{ display: 'inline-block', width: 3, height: 26, background: TOKENS.amber, marginLeft: 4, verticalAlign: 'middle' }} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 16. annotated_ui_tour — Universal 3-Zone App UI Tour with Moving Amber Spotlight + ① ② ③ Badges + Optional Countdown Ring
const PrimitiveAnnotatedUiTour: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const zones: Array<{
    badge: string;
    title: string;
    subtitle: string;
    items: string[];
    stepClause?: number;
  }> = Array.isArray(d.zones)
    ? d.zones
    : [
        { badge: '1', title: '左側：模組與清單導覽', subtitle: '分類分組與常用釘選', items: ['★ 核心入口釘選', '📂 專案工作區分組', '⚡ 快速切換通道'], stepClause: 0 },
        { badge: '2', title: '中間：核心互動主畫布', subtitle: '指令輸入與關鍵確認卡', items: ['即時呈現執行狀態', '主動推薦下一步動作', '敏感變更前跳出預覽卡'], stepClause: 1 },
        { badge: '3', title: '右側：狀態 · 資源庫 · 監控', subtitle: '展開檢視底層細節', items: ['⏰ 自動化排程與觸發器', '📚 專案知識與檔案庫', '🖥️ 即時運行環境預覽'], stepClause: 2 },
      ];

  const activeClause = getActiveClauseIdx(scene, frame, fps);
  let activeZoneIdx = 0;
  for (let i = 0; i < zones.length; i++) {
    const sc = zones[i].stepClause ?? i;
    if (activeClause >= sc) {
      activeZoneIdx = i;
    }
  }
  const countdownSec = typeof d.countdownSec === 'number' ? d.countdownSec : 0;
  const remainSec = countdownSec > 0 ? Math.max(0, Math.ceil(countdownSec - frame / fps)) : 0;
  const ringRatio = countdownSec > 0 ? Math.max(0, Math.min(1, 1 - frame / (countdownSec * fps))) : 0;
  const hasTopBar = Boolean(d.topTitle || d.topPill || (Array.isArray(d.stepper) && d.stepper.length > 0));

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 1580,
          height: 620,
          background: '#18181A',
          borderRadius: 20,
          border: `1.5px solid ${TOKENS.border}`,
          padding: 20,
          display: 'grid',
          gridTemplateColumns: '380px 1fr 440px',
          gap: 18,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          transform: `translateY(${hasTopBar ? 28 : -16}px)`,
        }}
      >
        {countdownSec > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -26,
              right: -26,
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: '#1E1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.55)',
              zIndex: 10,
            }}
          >
            <svg width={76} height={76} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx={38} cy={38} r={32} fill="none" stroke="#38383D" strokeWidth={4.5} />
              <circle
                cx={38}
                cy={38}
                r={32}
                fill="none"
                stroke={TOKENS.amber}
                strokeWidth={4.5}
                strokeDasharray={201}
                strokeDashoffset={201 * (1 - ringRatio)}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 19, fontWeight: 800, color: TOKENS.ink }}>
              0:{String(remainSec).padStart(2, '0')}
            </span>
          </div>
        )}

        {zones.slice(0, 3).map((zn: any, idx) => {
          const zStartF = (zn.stepClause ?? idx) === 0 ? 2 : getBeatFrame(scene, zn.stepClause ?? idx, fps);
          const isLit = idx === activeZoneIdx;
          const isVisited = frame >= zStartF - 2;
          const zItems: string[] = Array.isArray(zn.items) ? zn.items : [];
          const isMinimal = zItems.length <= 2 && zItems.every((s) => String(s).length <= 14);

          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                background: isLit ? '#292622' : '#222225',
                border: `2.5px solid ${isLit ? TOKENS.amber : isVisited ? 'rgba(254,138,0,0.28)' : TOKENS.border}`,
                borderRadius: 18,
                padding: '30px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: isMinimal ? 'space-between' : 'flex-start',
                gap: 18,
                opacity: isLit ? 1 : isVisited ? 0.44 : 0.22,
                transform: isLit ? 'translate3d(0, -4px, 0)' : 'none',
                boxShadow: isLit ? '0 0 36px rgba(254, 138, 0, 0.22)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: TOKENS.amber,
                    color: '#141416',
                    fontFamily: TOKENS.fontMono,
                    fontSize: 25,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {zn.badge || idx + 1}
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: TOKENS.ink, lineHeight: 1.2, textWrap: 'balance' as any }}>{zn.title}</div>
                  {zn.subtitle && (
                    <div style={{ fontFamily: TOKENS.fontMono, fontSize: 18, fontWeight: 700, color: TOKENS.amber, marginTop: 4 }}>
                      {zn.subtitle}
                    </div>
                  )}
                </div>
              </div>

              {zn.heroValue && (
                <div
                  style={{
                    padding: '22px 20px',
                    borderRadius: 16,
                    background: 'rgba(0, 0, 0, 0.24)',
                    border: `1.5px solid ${isLit ? TOKENS.amberBorder : 'rgba(255,255,255,0.06)'}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 46, fontWeight: 900, color: isLit ? TOKENS.amber : TOKENS.ink, lineHeight: 1.1 }}>
                    {zn.heroValue}
                  </div>
                  {zn.heroLabel && (
                    <div style={{ fontSize: 19, fontWeight: 700, color: TOKENS.inkSecondary, marginTop: 6 }}>{zn.heroLabel}</div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: zn.heroValue ? 0 : 12 }}>
                {zItems.map((it, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      padding: isMinimal ? '18px 20px' : '14px 18px',
                      borderRadius: 14,
                      background: isLit && iIdx === zItems.length - 1 ? TOKENS.emeraldSoft : isLit && iIdx === 0 ? TOKENS.amberSoft : 'rgba(255,255,255,0.035)',
                      border: `1.5px solid ${
                        isLit && iIdx === zItems.length - 1
                          ? TOKENS.emeraldBorder
                          : isLit && iIdx === 0
                          ? TOKENS.amberBorder
                          : 'rgba(255,255,255,0.07)'
                      }`,
                      fontSize: isMinimal ? 24 : 21,
                      fontWeight: 800,
                      color: isLit && iIdx === zItems.length - 1 ? TOKENS.emeraldMint : TOKENS.ink,
                      textAlign: isMinimal ? 'center' : 'left',
                      textWrap: 'balance' as any,
                    }}
                  >
                    {it}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 17. org_tree_radiate — Collision-Free Elliptical Radial Coupling / Mindmap Burst
const PrimitiveOrgTreeRadiate: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const spokes: string[] = Array.isArray(d.spokes)
    ? d.spokes
    : Array.isArray(d.leafNodes)
    ? d.leafNodes
    : ['Card.tsx', 'Nav.tsx', 'Form.tsx', 'Modal.tsx', 'Input.tsx', 'utils.ts', 'config.ts', 'styles.ts', 'api.ts', 'hooks.ts'];
  const enterP = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
  const lineTone = d.tone === 'emerald' ? TOKENS.emeraldMint : d.tone === 'amber' ? TOKENS.amber : TOKENS.coral;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 1400, height: 600, transform: 'translateY(22px)' }}>
        <svg width={1400} height={600} style={{ position: 'absolute', inset: 0 }}>
          {spokes.map((_, idx) => {
            const angle = (idx / spokes.length) * Math.PI * 2 - Math.PI / 2;
            const rx = 470;
            const ry = 215;
            const x2 = 700 + Math.cos(angle) * rx;
            const y2 = 300 + Math.sin(angle) * ry;
            const sp = settle(spring({ frame: frame - idx * 3, fps, config: SPRING_SNAPPY }));
            return (
              <line
                key={idx}
                x1={700}
                y1={300}
                x2={700 + (x2 - 700) * sp}
                y2={300 + (y2 - 300) * sp}
                stroke={lineTone}
                strokeWidth={2.5}
                strokeOpacity={0.68}
              />
            );
          })}
        </svg>

        {spokes.map((label, idx) => {
          const angle = (idx / spokes.length) * Math.PI * 2 - Math.PI / 2;
          const x = 700 + Math.cos(angle) * 470;
          const y = 300 + Math.sin(angle) * 215;
          const sp = settle(spring({ frame: frame - idx * 3, fps, config: SPRING_SNAPPY }));
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: x - 98,
                top: y - 32,
                width: 196,
                height: 64,
                borderRadius: 12,
                background: TOKENS.card,
                border: `1.5px solid ${TOKENS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontFamily: TOKENS.fontMono,
                fontSize: 20,
                fontWeight: 700,
                color: TOKENS.ink,
                opacity: sp,
                transform: `scale(${interpolate(sp, [0, 1], [0.82, 1])})`,
                boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: lineTone, flexShrink: 0 }} />
              <span>{label}</span>
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: 700 - 155,
            top: 300 - 54,
            width: 310,
            height: 108,
            borderRadius: 18,
            background: TOKENS.amber,
            color: '#141416',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            fontWeight: 900,
            boxShadow: '0 0 45px rgba(254, 138, 0, 0.42)',
            transform: `scale(${enterP})`,
            padding: '0 18px',
            textAlign: 'center',
          }}
        >
          {d.centerTitle || '核心變更節點'}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 18. pipeline_timeline_flow — Multi-Step Domino Error Contagion Pipeline
const PrimitivePipelineTimelineFlow: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const steps: string[] = Array.isArray(d.steps)
    ? d.steps
    : ['釐清目標', '寫規格', '寫計畫', '拆任務', '設計架構', '寫測試', '實作程式碼', '審查', '收尾'];
  const failClause = d.failClause ?? 1;
  const failF = getBeatFrame(scene, failClause, fps, 0.45);
  const failStartIdx = d.failStartIndex ?? 1;
  const boxSize = steps.length > 9 ? Math.max(72, Math.floor(1180 / steps.length)) : 96;
  const connWidth = steps.length > 9 ? 20 : 36;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, transform: 'translateY(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {steps.map((st, idx) => {
            const enterP = settle(spring({ frame: frame - idx * 3, fps, config: SPRING_SNAPPY }));
            const dominoFrame = failF + Math.max(0, idx - failStartIdx) * 5;
            const isInfected = frame >= failF && idx >= failStartIdx && frame >= dominoFrame;

            return (
              <React.Fragment key={idx}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: enterP }}>
                  <div
                    style={{
                      width: boxSize,
                      height: boxSize,
                      borderRadius: 20,
                      background: isInfected ? TOKENS.coralSoft : TOKENS.card,
                      border: `2.5px solid ${isInfected ? TOKENS.coral : TOKENS.amber}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isInfected ? '0 0 28px rgba(224, 85, 73, 0.45)' : 'none',
                    }}
                  >
                    <span style={{ fontFamily: TOKENS.fontMono, fontSize: 28, fontWeight: 900, color: isInfected ? TOKENS.coral : TOKENS.amber }}>
                      {isInfected ? '✗' : idx + 1}
                    </span>
                  </div>
                  <span style={{ fontSize: steps.length > 9 ? 19 : 22, fontWeight: 800, color: isInfected ? TOKENS.coral : TOKENS.ink, whiteSpace: 'nowrap' }}>
                    {st}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    style={{
                      width: connWidth,
                      height: 4,
                      background: frame >= failF + Math.max(0, idx - failStartIdx) * 5 && idx >= failStartIdx ? TOKENS.coral : TOKENS.border,
                      marginBottom: 36,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {frame >= failF && (
          <div
            style={{
              padding: '16px 36px',
              borderRadius: 16,
              background: TOKENS.coralSoft,
              border: `2px solid ${TOKENS.coral}`,
              fontSize: 28,
              fontWeight: 900,
              color: TOKENS.coral,
            }}
          >
            {d.failBanner || '⚠️ 僵化長流程致命傷：前序一步偏差，錯誤順著整條鏈路骨牌式傳染！'}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 19. defense_boundary_flow — Two Arched Doors (AuthN vs AuthZ) OR Fully Parameterized Trust Boundary Architecture
const PrimitiveDefenseBoundaryFlow: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'two_arches';

  if (mode === 'trust_boundary') {
    const step2F = getBeatFrame(scene, d.rightClause ?? 1, fps, 0.45);
    const p1 = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
    const p2 = settle(spring({ frame: frame - step2F, fps, config: SPRING_SNAPPY }));

    const rawLeftItems: Array<string | { title: string; detail?: string }> = Array.isArray(d.leftItems)
      ? d.leftItems
      : [
          {
            title: d.leftCardTitle || '客戶端環境 (Untrusted Client)',
            detail: d.leftCardDetail || '暴露於外部網路，前端參數與本地狀態隨時可能被竄改或偽造請求',
          },
        ];
    const rawRightItems: Array<string | { title: string; detail?: string }> = Array.isArray(d.rightItems)
      ? d.rightItems
      : [
          { title: '後端服務層 · 獨立重算金額與業務校驗' },
          { title: '儲存資料層 · 行級權限隔離與原子事務鎖' },
        ];

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36, transform: 'translateY(22px)' }}>
          {/* Left Untrusted Zone */}
          <div
            style={{
              width: 560,
              minHeight: 460,
              borderRadius: 22,
              background: 'rgba(224, 85, 73, 0.06)',
              border: `2.5px dashed ${TOKENS.coral}`,
              padding: '30px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
              opacity: p1,
            }}
          >
            <div style={{ fontSize: 27, fontWeight: 900, color: TOKENS.coral }}>
              {d.leftZoneTitle || '✗ 外部不可控區（Untrusted Zone）'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {rawLeftItems.slice(0, 3).map((it, idx) => {
                const title = typeof it === 'string' ? it : it.title;
                const detail = typeof it === 'string' ? undefined : it.detail;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '20px 22px',
                      borderRadius: 16,
                      background: '#2B2323',
                      border: `1.5px solid ${TOKENS.coralBorder}`,
                    }}
                  >
                    <div style={{ fontSize: 23, fontWeight: 800, color: TOKENS.ink, marginBottom: detail ? 8 : 0 }}>{title}</div>
                    {detail && <div style={{ fontSize: 19, color: TOKENS.inkSecondary, lineHeight: 1.45 }}>{detail}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '13px 20px', borderRadius: 12, background: TOKENS.coralSoft, color: TOKENS.coral, fontSize: 21, fontWeight: 800, textAlign: 'center' }}>
              {d.leftFooter || '✗ 嚴禁在此層執行核心計費與權限判定'}
            </div>
          </div>

          {/* Center Trust Boundary Vertical Line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: '8px 22px', borderRadius: 999, background: TOKENS.amber, color: '#141416', fontSize: 19, fontWeight: 900, whiteSpace: 'nowrap' }}>
              {d.boundaryLabel || '信任邊界 Trust Boundary'}
            </div>
            <div style={{ width: 4, height: 340, borderLeft: `4px dashed ${TOKENS.amber}` }} />
          </div>

          {/* Right Trusted Zone */}
          <div
            style={{
              width: 590,
              minHeight: 460,
              borderRadius: 22,
              background: 'rgba(19, 159, 107, 0.06)',
              border: `2.5px solid ${TOKENS.emerald}`,
              padding: '30px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
              opacity: frame >= step2F - 2 ? p2 : 0.22,
              transform: `translateX(${frame >= step2F - 2 ? interpolate(p2, [0, 1], [22, 0]) : 22}px)`,
            }}
          >
            <div style={{ fontSize: 27, fontWeight: 900, color: TOKENS.emeraldMint }}>
              {d.rightZoneTitle || '✓ 內部受控安全區（Trusted Zone）'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {rawRightItems.slice(0, 3).map((it, idx) => {
                const title = typeof it === 'string' ? it : it.title;
                const detail = typeof it === 'string' ? undefined : it.detail;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '18px 22px',
                      borderRadius: 14,
                      background: '#1E2824',
                      border: `1.5px solid ${TOKENS.emeraldBorder}`,
                    }}
                  >
                    <div style={{ fontSize: 23, fontWeight: 800, color: TOKENS.ink, marginBottom: detail ? 6 : 0 }}>{title}</div>
                    {detail && <div style={{ fontSize: 18, color: TOKENS.inkSecondary, lineHeight: 1.4 }}>{detail}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '13px 20px', borderRadius: 12, background: TOKENS.emeraldSoft, color: TOKENS.emeraldMint, fontSize: 21, fontWeight: 800, textAlign: 'center' }}>
              {d.rightFooter || '✓ 跨邊界請求強制驗簽，核心資產自我防衛'}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Default: "two_arches" (Authentication vs Authorization Two Arched Doors, grid_v4_sec.jpg Row 2 Col 2)
  const arch2F = getBeatFrame(scene, 1, fps, 0.45);
  const p1 = spring({ frame, fps, config: SPRING_SNAPPY });
  const p2 = spring({ frame: frame - arch2F, fps, config: SPRING_SNAPPY });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 80, transform: 'translateY(24px)' }}>
        {/* Arch 1: Authentication */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, opacity: p1 }}>
          <div
            style={{
              width: 440,
              height: 460,
              borderTopLeftRadius: 220,
              borderTopRightRadius: 220,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
              background: '#2B2823',
              border: `3px solid ${TOKENS.amber}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 32px',
              gap: 16,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 900, color: TOKENS.amber }}>{d.arch1Title || '身分驗證'}</div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 24, fontWeight: 700, color: TOKENS.inkSecondary }}>
              {d.arch1En || 'Authentication'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: TOKENS.ink, textAlign: 'center', marginTop: 14 }}>
              {d.arch1Desc || '確認你是誰（例如 Google 登入）'}
            </div>
          </div>
          <div style={{ padding: '10px 30px', borderRadius: 999, background: TOKENS.card, border: `1.5px solid ${TOKENS.amberBorder}`, fontSize: 24, fontWeight: 800, color: TOKENS.amber }}>
            {d.arch1Footer || '🔑 第一道門：進門的資格'}
          </div>
        </div>

        {/* Arch 2: Authorization */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, opacity: frame >= arch2F - 2 ? p2 : 0.25 }}>
          <div
            style={{
              width: 440,
              height: 460,
              borderTopLeftRadius: 220,
              borderTopRightRadius: 220,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
              background: '#1E2925',
              border: `3px solid ${TOKENS.emerald}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 32px',
              gap: 16,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 900, color: TOKENS.emerald }}>{d.arch2Title || '權限授權'}</div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 24, fontWeight: 700, color: TOKENS.inkSecondary }}>
              {d.arch2En || 'Authorization'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: TOKENS.ink, textAlign: 'center', marginTop: 14 }}>
              {d.arch2Desc || '檢查這筆資料屬不屬於你'}
            </div>
          </div>
          <div style={{ padding: '10px 30px', borderRadius: 999, background: TOKENS.card, border: `1.5px solid ${TOKENS.emeraldBorder}`, fontSize: 24, fontWeight: 800, color: TOKENS.emerald }}>
            {d.arch2Footer || '🛡️ 第二道門：進門後能碰什麼？'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 20. row_permission_table — Horizontal Role Permission Matrix with ✓ Allowed & ✗ Blocked Pills (sec_06_15.jpg)
const PrimitiveRowPermissionTable: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const rows: Array<{
    icon?: string;
    role: string;
    sub?: string;
    allowed: string[];
    blocked: string[];
    stepClause?: number;
  }> = Array.isArray(d.rows)
    ? d.rows
    : [
        { icon: '🚶', role: '路人訪客', sub: '未註冊', allowed: ['公開首頁'], blocked: ['影片 / 專案', '系統後台'], stepClause: 0 },
        { icon: '🙂', role: '免費用戶', sub: '已註冊', allowed: ['自己的短影片'], blocked: ['別人的專案', '付費功能', '後台'], stepClause: 1 },
        { icon: '💎', role: '付費用戶', sub: '已買點數', allowed: ['自己的長影片', '付費點數'], blocked: ['系統後台'], stepClause: 2 },
        { icon: '🛠️', role: '管理員', sub: '最高權限', allowed: ['後台數據', '伺服器設定'], blocked: [], stepClause: 3 },
      ];

  const activeClause = getActiveClauseIdx(scene, frame, fps);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1520, display: 'flex', flexDirection: 'column', gap: 14, transform: `translateY(${d.topTitle || d.topPill ? 24 : -16}px)` }}>
        {/* Table Header Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr 1fr',
            padding: '0 28px 12px',
            borderBottom: `2.5px solid ${TOKENS.amber}`,
            fontSize: 26,
            fontWeight: 900,
            color: TOKENS.amber,
          }}
        >
          <span>{d.col1Header || '角色'}</span>
          <span>{d.col2Header || '可以碰'}</span>
          <span>{d.col3Header || '不能碰'}</span>
        </div>

        {/* Progressive Role Rows */}
        {rows.map((rw, idx) => {
          const rStartF = (rw.stepClause ?? idx) === 0 ? 2 : getBeatFrame(scene, rw.stepClause ?? idx, fps);
          const rp = spring({ frame: frame - rStartF, fps, config: SPRING_SNAPPY });
          const isShown = frame >= rStartF - 2;
          const isCurrent = activeClause === (rw.stepClause ?? idx);

          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '320px 1fr 1fr',
                alignItems: 'center',
                padding: '20px 28px',
                borderRadius: 16,
                background: isCurrent ? '#323237' : '#29292D',
                border: `1.5px solid ${isCurrent ? TOKENS.amberBorder : TOKENS.border}`,
                opacity: isShown ? rp : 0.15,
                transform: `translateX(${interpolate(rp, [0, 1], [20, 0])}px)`,
              }}
            >
              {/* Col 1: Role */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 32 }}>{rw.icon || '👤'}</span>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: TOKENS.ink }}>{rw.role}</div>
                  {rw.sub && <div style={{ fontSize: 18, fontWeight: 700, color: TOKENS.inkSecondary }}>{rw.sub}</div>}
                </div>
              </div>

              {/* Col 2: Allowed Green Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {(rw.allowed || []).map((al, aIdx) => (
                  <span
                    key={aIdx}
                    style={{
                      padding: '8px 22px',
                      borderRadius: 999,
                      background: TOKENS.emeraldSoft,
                      border: `1.5px solid ${TOKENS.emerald}`,
                      color: TOKENS.emerald,
                      fontSize: 23,
                      fontWeight: 800,
                    }}
                  >
                    ✓ {al}
                  </span>
                ))}
              </div>

              {/* Col 3: Blocked Coral Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {(rw.blocked || []).map((bl, bIdx) => (
                  <span
                    key={bIdx}
                    style={{
                      padding: '8px 22px',
                      borderRadius: 999,
                      background: TOKENS.coralSoft,
                      border: `1.5px solid ${TOKENS.coral}`,
                      color: TOKENS.coral,
                      fontSize: 23,
                      fontWeight: 800,
                    }}
                  >
                    ✗ {bl}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 21. acronym_token_slot — Next-Token Cloze Prediction Slot + Probability Bars OR Acronym Letter Unpack (grid_v1_llm.jpg)
const PrimitiveAcronymTokenSlot: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'token_slot';

  if (mode === 'acronym_cards') {
    const letters: Array<{ char: string; full: string; zh: string; stepClause?: number }> = Array.isArray(d.letters)
      ? d.letters
      : [
          { char: 'R', full: 'Reinforcement', zh: '強化', stepClause: 0 },
          { char: 'L', full: 'Learning', zh: '學習', stepClause: 0 },
          { char: 'H', full: 'Human', zh: '人類', stepClause: 1 },
          { char: 'F', full: 'Feedback', zh: '回饋', stepClause: 1 },
        ];

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 28, transform: 'translateY(16px)' }}>
          {letters.map((lt, idx) => {
            const stF = (lt.stepClause ?? 0) === 0 ? idx * 5 : getBeatFrame(scene, lt.stepClause ?? 0, fps);
            const p = spring({ frame: frame - stF, fps, config: SPRING_SNAPPY });
            const isHighlighted = idx >= letters.length - 2;
            return (
              <div
                key={idx}
                style={{
                  width: 280,
                  padding: '34px 24px',
                  borderRadius: 20,
                  background: isHighlighted ? '#312B22' : '#26262B',
                  border: `2.5px solid ${isHighlighted ? TOKENS.amber : TOKENS.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`,
                }}
              >
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 82, fontWeight: 900, color: isHighlighted ? TOKENS.amber : TOKENS.ink }}>
                  {lt.char}
                </div>
                <div style={{ fontFamily: TOKENS.fontMono, fontSize: 24, fontWeight: 700, color: TOKENS.inkSecondary }}>{lt.full}</div>
                <div style={{ padding: '6px 20px', borderRadius: 999, background: isHighlighted ? TOKENS.amberSoft : TOKENS.card, color: isHighlighted ? TOKENS.amber : TOKENS.ink, fontSize: 24, fontWeight: 800 }}>
                  {lt.zh}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  // Default: "token_slot" (Next-Token Cloze Prediction + Probability Distribution, grid_v1_llm.jpg Row 1 Col 3-4)
  const tokens: string[] = Array.isArray(d.tokens) ? d.tokens : ['今天', '出門', '記得', '帶傘', '，', '因為', '外面', '正在'];
  const candidates: Array<{ word: string; pct: number }> = Array.isArray(d.candidates)
    ? d.candidates
    : [
        { word: '下雨', pct: 72 },
        { word: '刮風', pct: 19 },
        { word: '下雪', pct: 9 },
      ];
  const probF = getBeatFrame(scene, 1, fps, 0.42);
  const fillF = getBeatFrame(scene, Math.min(2, scene.clauses.length - 1), fps, 0.72);
  const probP = spring({ frame: frame - probF, fps, config: SPRING_SNAPPY });
  const isFilled = frame >= fillF;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44, transform: 'translateY(18px)' }}>
        {/* Token Stream Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {tokens.map((tk, idx) => {
            const tp = spring({ frame: frame - idx * 3, fps, config: SPRING_SNAPPY });
            return (
              <div
                key={idx}
                style={{
                  padding: '16px 24px',
                  borderRadius: 12,
                  background: '#323237',
                  border: `1.5px solid ${TOKENS.border}`,
                  fontSize: 32,
                  fontWeight: 800,
                  color: TOKENS.ink,
                  opacity: tp,
                }}
              >
                {tk}
              </div>
            );
          })}

          {/* Target Prediction Slot [ ? ] -> [ 下雨 ] */}
          <div
            style={{
              padding: '16px 32px',
              borderRadius: 12,
              background: isFilled ? TOKENS.amber : '#342E24',
              border: `2.5px solid ${TOKENS.amber}`,
              fontSize: 34,
              fontWeight: 900,
              color: isFilled ? '#141416' : TOKENS.amber,
              boxShadow: '0 0 32px rgba(245, 158, 11, 0.45)',
            }}
          >
            {isFilled ? candidates[0]?.word || '下雨' : '？'}
          </div>
        </div>

        {/* Bottom Parameters Matrix -> Candidate Probability Bars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 56, opacity: probP }}>
          <div style={{ width: 240, padding: '22px', borderRadius: 16, background: '#212125', border: `1.5px solid ${TOKENS.amberBorder}`, textAlign: 'center' }}>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 20, fontWeight: 800, color: TOKENS.amber, marginBottom: 8 }}>
              parameters.bin
            </div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 15, color: TOKENS.inkMuted, lineHeight: 1.5 }}>
              0.418 -0.102 0.891<br />
              0.012  0.774 -0.331<br />
              -0.512 0.640  0.128
            </div>
          </div>

          <div style={{ fontSize: 36, color: TOKENS.amber, fontWeight: 900 }}>──→</div>

          <div style={{ width: 520, background: '#25252A', padding: '24px 30px', borderRadius: 18, border: `1.5px solid ${TOKENS.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {candidates.map((cd, cIdx) => (
              <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ width: 90, fontSize: 25, fontWeight: 800, color: cIdx === 0 ? TOKENS.amber : TOKENS.inkSecondary }}>
                  {cd.word}
                </span>
                <div style={{ flex: 1, height: 16, background: '#18181B', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${cd.pct * probP}%`, height: '100%', background: cIdx === 0 ? TOKENS.amber : '#71717A', borderRadius: 999 }} />
                </div>
                <span style={{ width: 70, fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 800, color: cIdx === 0 ? TOKENS.amber : TOKENS.inkSecondary, textAlign: 'right' }}>
                  {cd.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 22. metaphor_canvas — Rotary Weight Parameter Tuning Panel
const PrimitiveMetaphorCanvas: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const cols = Math.max(3, Math.min(10, Number(d.cols ?? 9)));
  const rows = Math.max(2, Math.min(4, Number(d.rows ?? 3)));
  const total = cols * rows;
  const enterP = settle(spring({ frame, fps, config: SPRING_SILKY }));

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, transform: 'translateY(20px)', opacity: enterP }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 96px)`,
            gap: 22,
            padding: '36px 44px',
            borderRadius: 24,
            background: '#222226',
            border: `2px solid ${TOKENS.border}`,
            boxShadow: '0 26px 64px rgba(0,0,0,0.48)',
          }}
        >
          {Array.from({ length: total }).map((_, idx) => {
            const baseAngle = ((idx * 47) % 260) - 130;
            const animAngle = baseAngle + Math.sin(frame / 14 + idx) * 42;
            return (
              <div
                key={idx}
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #3A3A40, #1C1C20)',
                  border: `2.5px solid ${idx % 4 === 0 ? TOKENS.amber : '#52525B'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 34,
                    background: idx % 4 === 0 ? TOKENS.amber : TOKENS.ink,
                    borderRadius: 999,
                    transformOrigin: 'bottom center',
                    transform: `translateY(-14px) rotate(${animAngle}deg)`,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: TOKENS.amber }}>
          {d.caption || '數百億個權重參數 = 數百億顆反覆微調角度的旋鈕'}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 23. before_after_transformer — Universal Bad-Approach Strikethrough -> Emerald Good-Strategy + Live Bottom Outcome Compression
const PrimitiveBeforeAfterTransformer: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const beat2 = getBeatFrame(scene, d.transformClause ?? 1, fps, 0.36);
  const beat3 = getBeatFrame(scene, d.compressClause ?? Math.min(2, scene.clauses.length - 1), fps, 0.66);

  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const p2 = settle(spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY }));
  const p3 = settle(spring({ frame: frame - beat3, fps, config: SPRING_SNAPPY }));
  const isTransformed = frame >= beat2 - 2;
  const isCompressed = frame >= beat3 - 2;

  const beforeItems: string[] = Array.isArray(d.beforeItems)
    ? d.beforeItems
    : ['原始雜訊紀錄 #01 · 未分類請求', '系統例行通知 #02 · 低優先級', '關鍵商業變更 #03 · 需人工決策', '重複狀態回報 #04 · 自動歸檔', '外部合作提案 #05 · 待回覆確認'];
  const afterItems: Array<{ text: string; badge?: string }> = Array.isArray(d.afterItems)
    ? d.afterItems
    : [
        { text: '關鍵商業變更 · 已提取風險摘要', badge: '優先決策' },
        { text: '外部合作提案 · 已生成回覆草案', badge: '一鍵審核' },
      ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, transform: 'translateY(-14px)', opacity: p1 }}>
        {d.subjectBadge && (
          <div style={{ padding: '8px 28px', borderRadius: 999, background: TOKENS.card, border: `1.5px solid ${TOKENS.border}`, fontSize: 25, fontWeight: 800, color: TOKENS.ink }}>
            {d.subjectBadge}
          </div>
        )}

        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: isTransformed ? '440px 1fr' : '1fr', gap: 26, alignItems: 'stretch' }}>
          <div
            style={{
              background: '#2C2C2E',
              border: `1.5px solid ${isTransformed ? TOKENS.border : TOKENS.coralBorder}`,
              borderRadius: 18,
              padding: '22px 28px',
              opacity: isTransformed ? 0.55 : 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: TOKENS.inkMuted }}>
              {d.beforeLabel || '反面做法 · 模糊表層操作'}
            </span>
            <div style={{ fontSize: 26, fontWeight: 700, color: isTransformed ? TOKENS.inkMuted : TOKENS.ink, textDecoration: isTransformed ? 'line-through' : 'none' }}>
              {d.beforeText || '只交代機械步驟，缺乏結果標準'}
            </div>
          </div>

          {isTransformed && (
            <div
              style={{
                background: TOKENS.emerald,
                border: `2px solid ${TOKENS.emeraldMint}`,
                borderRadius: 18,
                padding: '22px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 8,
                opacity: p2,
                transform: `translateX(${interpolate(p2, [0, 1], [28, 0])}px)`,
                boxShadow: '0 20px 50px rgba(19, 159, 107, 0.28)',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: '#071E15' }}>
                ✓ {d.afterLabel || '正面解法 · 明確目標與驗收結果'}
              </span>
              <div style={{ fontSize: 26, fontWeight: 800, color: TOKENS.ink, lineHeight: 1.4 }}>
                {d.afterText || '鎖定最終交付指標，過濾低價值雜訊並直接產出可執行結果'}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            width: '100%',
            background: TOKENS.card,
            border: `1.5px solid ${isCompressed ? TOKENS.emeraldBorder : TOKENS.border}`,
            borderRadius: 20,
            padding: '24px 32px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: TOKENS.ink }}>
              {d.outcomeTitle || '輸出結果對比'}
            </span>
            <span
              style={{
                fontFamily: TOKENS.fontMono,
                fontSize: 24,
                fontWeight: 900,
                color: isCompressed ? TOKENS.emeraldMint : TOKENS.inkSecondary,
              }}
            >
              {isCompressed ? d.afterMetric || '2 項高價值結論' : d.beforeMetric || '128 項未過濾雜訊'}
            </span>
          </div>

          {!isCompressed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {beforeItems.slice(0, 5).map((it, idx) => (
                <div key={idx} style={{ fontSize: 21, fontWeight: 600, color: TOKENS.inkSecondary, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: TOKENS.inkMuted }}>•</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: p3, transform: `translateY(${interpolate(p3, [0, 1], [12, 0])}px)` }}>
              {afterItems.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderRadius: 12,
                    background: 'rgba(19, 159, 107, 0.12)',
                    border: `1px solid ${TOKENS.emeraldBorder}`,
                  }}
                >
                  <span style={{ fontSize: 23, fontWeight: 800, color: TOKENS.ink }}>{it.text}</span>
                  {it.badge && (
                    <span style={{ padding: '5px 16px', borderRadius: 999, background: TOKENS.emerald, color: TOKENS.ink, fontSize: 18, fontWeight: 800 }}>
                      {it.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 24. synergy_puzzle_pair — Universal Interlocking Two-Piece Jigsaw Synergy Lock
const PrimitiveSynergyPuzzlePair: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  if (d.mode === 'n_piece_mismatch' || d.mode === 'bundler_funnel') {
    return <SynergyPuzzleExtendedModes scene={scene} />;
  }
  const rightEnterF = getBeatFrame(scene, 1, fps, 0.32);
  const snapF = getBeatFrame(scene, d.snapClause ?? Math.min(2, scene.clauses.length - 1), fps, 0.65);

  const leftP = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
  const rightP = settle(spring({ frame: frame - rightEnterF, fps, config: SPRING_SNAPPY }));
  const snapP = settle(spring({ frame: frame - snapF, fps, config: SPRING_PUZZLE }));
  const halfGap = interpolate(snapP, [0, 1], [68, 0]);
  const isSnapped = snapP > 0.85;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, transform: 'translateY(-12px)' }}>
        <div style={{ position: 'relative', width: 1180, height: 390, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: 552,
              height: 360,
              opacity: leftP,
              transform: `translateX(${-halfGap}px)`,
              zIndex: 2,
            }}
          >
            <svg width={600} height={360} viewBox="0 0 600 360" style={{ position: 'absolute', left: 0, top: 0 }}>
              <path
                d="M 22 4 H 534 Q 552 4 552 22 V 142 A 38 38 0 1 1 552 218 V 338 Q 552 356 534 356 H 22 Q 4 356 4 338 V 22 Q 4 4 22 4 Z"
                fill="#443019"
                stroke={TOKENS.amber}
                strokeWidth="3"
              />
            </svg>
            <div style={{ position: 'relative', width: 536, height: '100%', padding: '38px 42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 800, color: TOKENS.amber }}>
                {d.leftTag || 'MODULE A · DISPATCH'}
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: TOKENS.ink }}>{d.leftTitle || '輕量觸達與調度層'}</div>
              {d.leftSub && <div style={{ fontSize: 22, fontWeight: 600, color: TOKENS.inkSecondary }}>{d.leftSub}</div>}
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: 560,
              height: 360,
              opacity: frame >= rightEnterF - 2 ? rightP : 0.15,
              transform: `translateX(${halfGap}px)`,
              zIndex: 1,
            }}
          >
            <svg width={560} height={360} viewBox="0 0 560 360" style={{ position: 'absolute', left: 0, top: 0 }}>
              <path
                d="M 0 22 Q 0 4 18 4 H 538 Q 556 4 556 22 V 338 Q 556 356 538 356 H 18 Q 0 356 0 338 V 218 A 38 38 0 1 0 0 142 Z"
                fill={TOKENS.slateFill}
                stroke={TOKENS.slateLight}
                strokeWidth="3"
              />
            </svg>
            <div style={{ position: 'relative', width: 560, height: '100%', padding: '38px 42px 38px 66px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 800, color: TOKENS.slateLight }}>
                {d.rightTag || 'MODULE B · ENGINE'}
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: TOKENS.ink }}>{d.rightTitle || '重度運算與執行層'}</div>
              {d.rightSub && <div style={{ fontSize: 22, fontWeight: 600, color: TOKENS.inkSecondary }}>{d.rightSub}</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 160, alignItems: 'center' }}>
          <div style={{ padding: '12px 32px', borderRadius: 999, background: '#2E261D', border: `2px solid ${TOKENS.amber}`, fontSize: 24, fontWeight: 800, color: TOKENS.ink }}>
            {d.leftPill || '隨時隨地低門檻觸發'}
          </div>
          <div style={{ padding: '12px 32px', borderRadius: 999, background: TOKENS.card, border: `2px solid ${isSnapped ? TOKENS.emeraldMint : TOKENS.border}`, fontSize: 24, fontWeight: 800, color: isSnapped ? TOKENS.emeraldMint : TOKENS.ink }}>
            {d.rightPill || '專業穩定深度執行'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 25. multi_perspective_ring — Left Stream Spotlight (with Non-Focus Noise Blur) + Right Circular Multi-Node Consensus Ring
const PrimitiveMultiPerspectiveRing: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const activeClause = getActiveClauseIdx(scene, frame, fps);
  const enterP = settle(spring({ frame, fps, config: SPRING_SILKY }));

  const nodes: Array<{ label: string; icon?: string; color?: string }> = Array.isArray(d.nodes)
    ? d.nodes
    : [
        { label: '核心統籌', icon: '★', color: TOKENS.amber },
        { label: '產品規劃', icon: 'P', color: '#FF6911' },
        { label: '工程架構', icon: '</>', color: TOKENS.emeraldMint },
        { label: '體驗設計', icon: '✦', color: TOKENS.violet },
      ];
  const messages: Array<{ speaker: string; text: string; stepClause?: number }> = Array.isArray(d.messages)
    ? d.messages
    : [
        { speaker: '產品規劃', text: '優先穩定核心漏斗，再擴充次要功能模組', stepClause: 0 },
        { speaker: '工程架構', text: '先修補計費邊界條件並完成資料庫索引遷移', stepClause: 1 },
        { speaker: '核心統籌', text: '綜合各方盲點，收斂為兩項關鍵決策拍板執行', stepClause: 2 },
      ];

  let activeMsgIdx = 0;
  for (let i = 0; i < messages.length; i++) {
    if (activeClause >= (messages[i].stepClause ?? i)) activeMsgIdx = i;
  }
  const activeSpeaker = messages[activeMsgIdx]?.speaker || nodes[0]?.label;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1560,
          height: 600,
          background: '#161618',
          borderRadius: 22,
          border: `1.5px solid ${TOKENS.border}`,
          padding: '32px 40px',
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 36,
          alignItems: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.58)',
          opacity: enterP,
          transform: 'translateY(-14px)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.map((m, idx) => {
            const mF = (m.stepClause ?? idx) === 0 ? 2 : getBeatFrame(scene, m.stepClause ?? idx, fps);
            const mp = settle(spring({ frame: frame - mF, fps, config: SPRING_SNAPPY }));
            const isFocused = idx === activeMsgIdx;
            const isShown = frame >= mF - 2;
            return (
              <div
                key={idx}
                style={{
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: isFocused ? '#252529' : '#1D1D20',
                  border: `1.5px solid ${isFocused ? TOKENS.amber : TOKENS.border}`,
                  opacity: isShown ? (isFocused ? mp : 0.42) : 0.08,
                  filter: isShown && !isFocused ? 'blur(2.2px)' : 'none',
                  transform: `translateY(${interpolate(mp, [0, 1], [14, 0])}px)`,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: isFocused ? TOKENS.amber : TOKENS.inkSecondary, marginBottom: 6 }}>
                  {m.speaker}
                </div>
                <div style={{ fontSize: 23, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.44 }}>{m.text}</div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 520, height: 480, justifySelf: 'center' }}>
          <svg width={520} height={480} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={260} cy={240} r={155} fill="none" stroke="#4D4D52" strokeWidth={2} strokeDasharray="7 7" />
          </svg>
          {nodes.slice(0, 5).map((nd, idx, arr) => {
            const angle = (idx / arr.length) * Math.PI * 2 - Math.PI / 2;
            const cx = 260 + Math.cos(angle) * 155;
            const cy = 240 + Math.sin(angle) * 155;
            const isSpeaking = nd.label === activeSpeaker || idx === activeMsgIdx % arr.length;
            const col = nd.color || TOKENS.amber;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: cx - 64,
                  top: cy - 58,
                  width: 128,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  transform: `scale(${isSpeaking ? 1.1 : 0.96})`,
                }}
              >
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: '50%',
                    background: isSpeaking ? col : TOKENS.card,
                    color: isSpeaking ? '#141416' : TOKENS.ink,
                    border: `3px solid ${col}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: TOKENS.fontMono,
                    fontSize: 26,
                    fontWeight: 900,
                    boxShadow: isSpeaking ? `0 0 32px ${col}` : 'none',
                  }}
                >
                  {nd.icon || idx + 1}
                </div>
                <span style={{ padding: '4px 14px', borderRadius: 999, background: TOKENS.card, fontSize: 18, fontWeight: 800, color: TOKENS.ink, whiteSpace: 'nowrap' }}>
                  {nd.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 26. convergent_hub_bus — Universal N-to-1 Independent Surfaces Converging into Shared Substrate / Bus
const PrimitiveConvergentHubBus: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const baseF = getBeatFrame(scene, d.convergeClause ?? 1, fps, 0.44);
  const topP = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
  const baseP = settle(spring({ frame: frame - baseF, fps, config: SPRING_SILKY }));

  const topNodes: Array<{ title: string; sub?: string; color?: string }> = Array.isArray(d.topNodes)
    ? d.topNodes
    : [
        { title: '獨立視圖 A', sub: '專屬上下文', color: TOKENS.violet },
        { title: '獨立視圖 B', sub: '專屬工作流', color: TOKENS.emeraldMint },
        { title: '獨立視圖 C', sub: '專屬規則集', color: '#FF6911' },
      ];
  const syncPills: string[] = Array.isArray(d.syncPills) ? d.syncPills : ['狀態即時共享', '單次授權全通'];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, transform: 'translateY(-14px)' }}>
        <div style={{ display: 'flex', gap: 56, justifyContent: 'center', opacity: topP }}>
          {topNodes.slice(0, 4).map((nd, idx) => (
            <div
              key={idx}
              style={{
                width: 280,
                padding: '22px 24px',
                borderRadius: 18,
                background: TOKENS.card,
                border: `2px solid ${nd.color || TOKENS.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 16px 38px rgba(0,0,0,0.38)',
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 900, color: TOKENS.ink }}>{nd.title}</div>
              {nd.sub && <div style={{ fontSize: 18, fontWeight: 600, color: TOKENS.inkSecondary }}>{nd.sub}</div>}
            </div>
          ))}
        </div>

        <svg width={1040} height={120} viewBox="0 0 1040 120" style={{ opacity: baseP }}>
          {topNodes.slice(0, 4).map((nd, idx, arr) => {
            const span = (arr.length - 1) * 336;
            const startX = 520 - span / 2 + idx * 336;
            return (
              <path
                key={idx}
                d={`M ${startX} 4 C ${startX} 68, 520 52, 520 116`}
                fill="none"
                stroke={nd.color || TOKENS.amber}
                strokeWidth="3"
              />
            );
          })}
        </svg>

        <div
          style={{
            width: 960,
            padding: '30px 40px',
            borderRadius: 22,
            background: '#252B28',
            border: `2.5px solid ${TOKENS.emeraldMint}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            opacity: baseP,
            transform: `scale(${interpolate(baseP, [0, 1], [0.95, 1])})`,
            boxShadow: '0 26px 64px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 900, color: TOKENS.ink }}>
            {d.baseTitle || '底層共用單一底座與資料總線'}
          </div>
          {d.baseSub && <div style={{ fontSize: 22, fontWeight: 600, color: TOKENS.inkSecondary }}>{d.baseSub}</div>}
          <div style={{ display: 'flex', gap: 18 }}>
            {syncPills.map((pl, idx) => (
              <span key={idx} style={{ padding: '7px 22px', borderRadius: 999, background: TOKENS.emeraldSoft, border: `1.5px solid ${TOKENS.emeraldMint}`, color: TOKENS.emeraldMint, fontSize: 20, fontWeight: 800 }}>
                ✓ {pl}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Code-drawn vector icon helper for gauges & stages (zero emoji dependency)
const GaugeVectorIcon: React.FC<{ kind?: string; color: string; size?: number }> = ({ kind = 'eye', color, size = 38 }) => {
  const norm = (() => {
    const k = String(kind || '').trim().toLowerCase();
    if (k.includes('eye') || k.includes('read') || k.includes('open')) return 'eye';
    if (k.includes('lock') || k.includes('write') || k.includes('strict')) return 'lock';
    if (k.includes('shield') || k.includes('guard')) return 'shield';
    if (k.includes('bolt') || k.includes('speed') || k.includes('fast') || k.includes('zap')) return 'bolt';
    if (k.includes('chart') || k.includes('bar')) return 'chart';
    return 'eye';
  })();

  if (norm === 'lock') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <rect x="7" y="16" width="22" height="16" rx="4" stroke={color} strokeWidth="2.8" fill="rgba(224,85,73,0.12)" />
        <path d="M12 16V11.5C12 8.186 14.686 5.5 18 5.5C21.314 5.5 24 8.186 24 11.5V16" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="18" cy="24" r="2.5" fill={color} />
      </svg>
    );
  }
  if (norm === 'shield') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <path d="M18 4.5L29 9V17.5C29 24.8 24.2 30.2 18 32.5C11.8 30.2 7 24.8 7 17.5V9L18 4.5Z" stroke={color} strokeWidth="2.6" fill="rgba(23,183,166,0.12)" />
        <polyline points="13.2 18.2 16.6 21.6 23.2 14.8" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (norm === 'bolt') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <polygon points="20.5 4 9.5 20 17.5 20 15.5 32 26.5 16 18.5 16 20.5 4" stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill="rgba(254,138,0,0.16)" />
      </svg>
    );
  }
  if (norm === 'chart') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <rect x="6" y="20" width="5.5" height="10" rx="2" fill={color} opacity="0.55" />
        <rect x="15.2" y="13" width="5.5" height="17" rx="2" fill={color} opacity="0.8" />
        <rect x="24.5" y="7" width="5.5" height="23" rx="2" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M3.5 18C6.8 11.2 12 7.8 18 7.8C24 7.8 29.2 11.2 32.5 18C29.2 24.8 24 28.2 18 28.2C12 28.2 6.8 24.8 3.5 18Z" stroke={color} strokeWidth="2.6" fill="rgba(23,183,166,0.10)" />
      <circle cx="18" cy="18" r="5" stroke={color} strokeWidth="2.6" fill={color} fillOpacity="0.28" />
      <circle cx="18" cy="18" r="2.2" fill={color} />
    </svg>
  );
};

// 27. arc_gauge_audit — Exact 240° Dual Contrast Gauges (Vector Icon + Numeric %) OR High-Speed Scan with Named Audit Items
const PrimitiveArcGaugeAudit: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'dual_compare';
  if (mode === 'threshold_tripwire') {
    return <ArcGaugeThresholdTripwireMode scene={scene} />;
  }
  const beat2 = getBeatFrame(scene, 1, fps, 0.44);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const p2 = settle(spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY }));

  if (mode === 'speed_scan') {
    const scanStarted = frame >= beat2 - 2;
    // Exact 240° arc (r=152, cx=200, cy=196, -210° to +30° -> length = 152 * 4π/3 = 636.70)
    const SCAN_ARC_LEN = 152 * ((4 * Math.PI) / 3);
    const targetGaugeRatio = Math.max(0.08, Math.min(1, Number(d.gaugePct ?? 94) / 100));
    const rawScanItems: Array<string | { label: string; meta?: string }> = Array.isArray(d.scanItems)
      ? d.scanItems
      : [
          { label: '輸入結構與欄位完整性校驗', meta: 'SCHEMA OK' },
          { label: '關鍵邊界條件與空值防護', meta: 'GUARDED' },
          { label: '端側響應延遲預算達標', meta: '< 180ms' },
          { label: '權限隔離與敏感欄位脫敏', meta: 'VERIFIED' },
          { label: '輸出結果一致性與簽章核對', meta: '0 DRIFT' },
        ];
    const cleanGaugeVal = String(d.gaugeValue || '0.18s').replace(/^⚡\s*/, '');
    const activeCol = scanStarted ? TOKENS.emeraldMint : TOKENS.amber;
    let passedCount = 0;
    rawScanItems.forEach((_, idx) => {
      if (frame >= beat2 + idx * 4) passedCount++;
    });

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 76, transform: 'translateY(-10px)' }}>
          <div style={{ position: 'relative', width: 400, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={400} height={360} viewBox="0 0 400 360">
              <path d="M 68.36 272 A 152 152 0 1 1 331.64 272" fill="none" stroke="#3B3B3F" strokeWidth="22" strokeLinecap="round" />
              <path
                d="M 68.36 272 A 152 152 0 1 1 331.64 272"
                fill="none"
                stroke={activeCol}
                strokeWidth="22"
                strokeLinecap="round"
                strokeDasharray={SCAN_ARC_LEN}
                strokeDashoffset={SCAN_ARC_LEN * (1 - targetGaugeRatio * p1)}
              />
            </svg>
            <div style={{ position: 'absolute', top: 112, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <GaugeVectorIcon kind={d.gaugeIcon || 'bolt'} color={activeCol} size={36} />
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 52, fontWeight: 900, color: TOKENS.ink, lineHeight: 1.05 }}>
                {formatRollingMetric(cleanGaugeVal, p1)}
              </span>
              <span style={{ fontSize: 21, fontWeight: 700, color: activeCol }}>{d.gaugeLabel || '毫秒級自動掃描'}</span>
            </div>
          </div>

          <div
            style={{
              width: 720,
              background: TOKENS.card,
              border: `1.5px solid ${scanStarted ? TOKENS.emeraldBorder : TOKENS.border}`,
              borderRadius: 20,
              padding: '26px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${TOKENS.border}` }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: TOKENS.ink }}>
                {d.scanTitle || '即時自動核驗清單'}
              </span>
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 17, fontWeight: 800, color: scanStarted ? TOKENS.emeraldMint : TOKENS.inkSecondary }}>
                {passedCount} / {rawScanItems.length} PASSED
              </span>
            </div>

            {rawScanItems.slice(0, 6).map((rawIt, idx) => {
              const label = typeof rawIt === 'string' ? rawIt : rawIt.label;
              const meta = typeof rawIt === 'string' ? 'PASS' : rawIt.meta || 'PASS';
              const checkF = beat2 + idx * 4;
              const checked = frame >= checkF;
              const rowP = settle(spring({ frame: frame - checkF, fps, config: SPRING_SNAPPY }));
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: checked ? 'rgba(23, 183, 166, 0.10)' : '#28282B',
                    border: `1px solid ${checked ? TOKENS.emeraldBorder : TOKENS.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: checked ? TOKENS.emeraldMint : '#38383D',
                        border: checked ? 'none' : '1.5px solid #525258',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: checked ? `scale(${interpolate(rowP, [0, 1], [0.82, 1])})` : 'none',
                      }}
                    >
                      {checked && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <polyline points="3.2 8.4 6.6 11.8 12.8 4.8" stroke="#081D16" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span style={{ fontSize: 21, fontWeight: 700, color: checked ? TOKENS.ink : TOKENS.inkSecondary }}>
                      {label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: TOKENS.fontMono,
                      fontSize: 15,
                      fontWeight: 800,
                      color: checked ? TOKENS.emeraldMint : TOKENS.inkMuted,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: checked ? 'rgba(23, 183, 166, 0.14)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {checked ? meta : 'PENDING'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Exact 240° symmetric arc (r=140, cx=190, cy=178, from -210° to +30° -> true length = 140 * 4π/3 = 586.4306px)
  const DUAL_ARC_LEN = 140 * ((4 * Math.PI) / 3);
  const rawLeftPct = Math.max(1, Math.min(100, Number(d.leftPct ?? 88)));
  const rawRightPct = Math.max(1, Math.min(100, Number(d.rightPct ?? 15)));

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 116, alignItems: 'center', transform: 'translateY(-6px)' }}>
        {[
          {
            title: d.leftTitle || '讀取與檢索',
            tag: d.leftTag || '寬鬆開放',
            rawPct: rawLeftPct,
            animP: p1,
            col: TOKENS.emeraldMint,
            icon: d.leftIcon || 'eye',
            valOverride: d.leftValueText,
          },
          {
            title: d.rightTitle || '寫入與變更',
            tag: d.rightTag || '嚴格收緊',
            rawPct: rawRightPct,
            animP: p2,
            col: TOKENS.coral,
            icon: d.rightIcon || 'lock',
            valOverride: d.rightValueText,
          },
        ].map((g, idx) => {
          const curRatio = (g.rawPct / 100) * g.animP;
          const displayNum = g.valOverride ? formatRollingMetric(String(g.valOverride), g.animP) : `${Math.round(g.rawPct * g.animP)}%`;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: idx === 0 ? p1 : Math.max(0.25, p2) }}>
              <div style={{ position: 'relative', width: 380, height: 286, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={380} height={286} viewBox="0 0 380 286">
                  <path d="M 68.76 248 A 140 140 0 1 1 311.24 248" fill="none" stroke="#3A3A3E" strokeWidth="20" strokeLinecap="round" />
                  <path
                    d="M 68.76 248 A 140 140 0 1 1 311.24 248"
                    fill="none"
                    stroke={g.col}
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={DUAL_ARC_LEN}
                    strokeDashoffset={DUAL_ARC_LEN * (1 - curRatio)}
                  />
                </svg>
                <div style={{ position: 'absolute', top: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <GaugeVectorIcon kind={g.icon} color={g.col} size={38} />
                  <span style={{ fontFamily: TOKENS.fontMono, fontSize: 56, fontWeight: 900, color: TOKENS.ink, lineHeight: 1.05 }}>
                    {displayNum}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: TOKENS.ink }}>{g.title}</div>
              <div style={{ padding: '8px 26px', borderRadius: 999, background: TOKENS.card, border: `1.5px solid ${g.col}`, color: g.col, fontSize: 22, fontWeight: 800 }}>
                {g.tag}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 28. idle_waste_vs_event_wake — Periodic Idle Polling Waste Slots vs Dormant Zero-Cost Instant Event Wake
const PrimitiveIdleWasteVsEventWake: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const wakeF = getBeatFrame(scene, d.wakeClause ?? 1, fps, 0.46);
  const p1 = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
  const p2 = settle(spring({ frame: frame - wakeF, fps, config: SPRING_SNAPPY }));
  const showWake = frame >= wakeF - 2;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1420, display: 'flex', flexDirection: 'column', gap: 28, transform: 'translateY(-14px)' }}>
        <div style={{ background: TOKENS.card, border: `1.5px solid ${showWake ? TOKENS.border : TOKENS.coral}`, borderRadius: 20, padding: '26px 34px', opacity: showWake ? 0.46 : p1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: TOKENS.coral }}>
              ✗ {d.wasteTitle || '固定週期輪詢：絕大多數時間在空轉消耗配額'}
            </span>
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 20, fontWeight: 800, color: TOKENS.inkSecondary }}>
              {d.wasteInterval || 'Every 10 mins'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: 68,
                  borderRadius: 12,
                  background: idx === 5 ? TOKENS.emeraldSoft : TOKENS.coralSoft,
                  border: `1.5px solid ${idx === 5 ? TOKENS.emeraldMint : TOKENS.coralBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                  color: idx === 5 ? TOKENS.emeraldMint : TOKENS.coral,
                }}
              >
                {idx === 5 ? '有效' : '空轉'}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#242927',
            border: `2px solid ${TOKENS.amber}`,
            borderRadius: 20,
            padding: '28px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: showWake ? p2 : 0.16,
            transform: `translateY(${showWake ? interpolate(p2, [0, 1], [20, 0]) : 20}px)`,
            boxShadow: showWake ? '0 24px 60px rgba(0,0,0,0.48)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ padding: '14px 26px', borderRadius: 14, background: '#1D1D20', border: `1.5px solid ${TOKENS.border}`, fontSize: 24, fontWeight: 800, color: TOKENS.inkSecondary }}>
              💤 {d.sleepLabel || '平時完全休眠 (0 消耗)'}
            </div>
            <span style={{ fontSize: 32, color: TOKENS.amber, fontWeight: 900 }}>──→</span>
            <div style={{ padding: '14px 28px', borderRadius: 14, background: TOKENS.amber, color: '#141416', fontSize: 25, fontWeight: 900, boxShadow: '0 0 28px rgba(254,138,0,0.45)' }}>
              🔔 {d.triggerLabel || '外部事件 / Webhook 觸發'}
            </div>
            <span style={{ fontSize: 32, color: TOKENS.emeraldMint, fontWeight: 900 }}>──→</span>
            <div style={{ padding: '14px 28px', borderRadius: 14, background: TOKENS.emerald, color: TOKENS.ink, fontSize: 25, fontWeight: 900 }}>
              ⚡ {d.wakeLabel || '1 秒喚醒精準執行'}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 29. binary_decision_tree — Universal Orthogonal Yes/No Decision Tree + Cost/Tradeoff Bar
const PrimitiveBinaryDecisionTree: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const rightF = getBeatFrame(scene, d.rightClause ?? 1, fps, 0.45);
  const leftP = settle(spring({ frame, fps, config: SPRING_SNAPPY }));
  const rightP = settle(spring({ frame: frame - rightF, fps, config: SPRING_SNAPPY }));
  const showRight = frame >= rightF - 2;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, transform: 'translateY(-14px)' }}>
        <div style={{ padding: '16px 46px', borderRadius: 999, background: TOKENS.cardElevated, border: `2px solid ${TOKENS.amber}`, fontSize: 30, fontWeight: 900, color: TOKENS.ink, opacity: leftP }}>
          {d.question || '執行路徑與目標已經確定了嗎？'}
        </div>

        <svg width={960} height={92} viewBox="0 0 960 92">
          <path d="M 480 0 V 42 H 190 V 90" fill="none" stroke={TOKENS.emeraldMint} strokeWidth="3" />
          <path d="M 480 42 H 770 V 90" fill="none" stroke={showRight ? TOKENS.amber : '#4A4A4E'} strokeWidth="3" />
        </svg>

        <div style={{ width: 1260, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
          <div style={{ background: TOKENS.card, border: `2px solid ${TOKENS.emeraldMint}`, borderRadius: 20, padding: '28px 34px', display: 'flex', flexDirection: 'column', gap: 12, opacity: leftP }}>
            <span style={{ alignSelf: 'flex-start', padding: '4px 16px', borderRadius: 999, background: TOKENS.emeraldSoft, color: TOKENS.emeraldMint, fontSize: 19, fontWeight: 800 }}>
              ✓ {d.leftBranchLabel || '已確定 · 追求效率'}
            </span>
            <div style={{ fontSize: 32, fontWeight: 900, color: TOKENS.ink }}>{d.leftTitle || '單一專職通道直接執行'}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: TOKENS.inkSecondary }}>{d.leftDetail || '路徑最短、延遲最低、資源消耗最省'}</div>
          </div>

          <div style={{ background: TOKENS.card, border: `2px solid ${showRight ? TOKENS.amber : TOKENS.border}`, borderRadius: 20, padding: '28px 34px', display: 'flex', flexDirection: 'column', gap: 12, opacity: showRight ? rightP : 0.2 }}>
            <span style={{ alignSelf: 'flex-start', padding: '4px 16px', borderRadius: 999, background: TOKENS.amberSoft, color: TOKENS.amber, fontSize: 19, fontWeight: 800 }}>
              ⚡ {d.rightBranchLabel || '不確定 · 需要抓盲點'}
            </span>
            <div style={{ fontSize: 32, fontWeight: 900, color: TOKENS.ink }}>{d.rightTitle || '多視角交叉評估決策'}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: TOKENS.inkSecondary }}>{d.rightDetail || '暴露跨領域盲點，但算力與時間成本較高'}</div>
          </div>
        </div>

        {d.footerWarning && showRight && (
          <div style={{ marginTop: 26, padding: '10px 30px', borderRadius: 999, background: TOKENS.coralSoft, border: `1.5px solid ${TOKENS.coralBorder}`, color: TOKENS.coral, fontSize: 21, fontWeight: 800, opacity: rightP }}>
            {d.footerWarning}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 30. spotlight_window_tour — Framed Media Window + Blur Masks + focusBox-Centered Camera Zoom + Optional Side Callout Card
const PrimitiveSpotlightWindowTour: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const activeClause = getActiveClauseIdx(scene, frame, fps);
  const focusSeq: Array<{
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    zoomScale?: number;
    tag?: string;
    stepClause?: number;
  }> = Array.isArray(d.focusSequence) ? d.focusSequence : [];
  const treeItems: Array<{ depth?: number; name: string; kind?: 'folder' | 'file'; focusStep?: number; sideTag?: string }> =
    Array.isArray(d.treeItems) ? d.treeItems : [];

  const zoomF = getBeatFrame(scene, d.focusClause ?? (focusSeq.length > 0 ? 0 : 1), fps, 0.35);
  const callout = d.callout;
  const calloutClauseIdx = d.calloutClause ?? Math.min(2, Math.max(1, scene.clauses.length - 1));
  const calloutF = getBeatFrame(scene, calloutClauseIdx, fps, 0.62);

  const enterP = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const focusP = settle(spring({ frame: frame - zoomF, fps, config: SPRING_SILKY }));
  const sideP = callout ? settle(spring({ frame: frame - calloutF, fps, config: SPRING_SNAPPY })) : 0;
  const calloutPal = tonePalette(callout?.tone || 'amber');

  let activeSeqIdx = 0;
  focusSeq.forEach((fs, idx) => {
    const scIdx = fs.stepClause ?? idx;
    if (activeClause >= scIdx) activeSeqIdx = idx;
  });
  const curSeqItem = focusSeq[activeSeqIdx];

  const focusBox: { xPct: number; yPct: number; wPct: number; hPct: number } = curSeqItem ||
    d.focusBox || {
      xPct: 28,
      yPct: 34,
      wPct: 44,
      hPct: 22,
    };
  const inlineTag = curSeqItem?.tag || d.focusTag;
  const blurZones: Array<{ xPct: number; yPct: number; wPct: number; hPct: number }> = Array.isArray(d.blurZones)
    ? d.blurZones
    : [];
  const targetScale = Number(curSeqItem?.zoomScale ?? d.zoomScale ?? 1.14);
  const curScale = interpolate(focusP, [0, 1], [1, targetScale]);

  // Zoom precisely around focusBox center with edge-safe clamping so focusBox never clips
  const originX = focusBox.xPct + focusBox.wPct / 2;
  const originY = focusBox.yPct + focusBox.hPct / 2;
  const scaledLeft = originX - (focusBox.wPct / 2) * curScale;
  const scaledRight = originX + (focusBox.wPct / 2) * curScale;
  const scaledTop = originY - (focusBox.hPct / 2) * curScale;
  const scaledBottom = originY + (focusBox.hPct / 2) * curScale;
  const nudgeX = scaledLeft < 2.5 ? 2.5 - scaledLeft : scaledRight > 97.5 ? 97.5 - scaledRight : 0;
  const nudgeY = scaledTop < 2.5 ? 2.5 - scaledTop : scaledBottom > 97.5 ? 97.5 - scaledBottom : 0;

  const pills: string[] = Array.isArray(d.pills) ? d.pills : [];
  const winWidth = callout ? 1080 : 1280;
  const winHeight = callout ? 590 : 640;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 38,
          opacity: enterP,
          transform: 'translateY(-16px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            transform: callout ? `translateX(${interpolate(sideP, [0, 1], [234, 0]).toFixed(2)}px)` : 'none',
          }}
        >
          <div
            style={{
              width: winWidth,
              height: winHeight,
              borderRadius: 18,
              overflow: 'hidden',
              background: '#141416',
              border: `1.5px solid ${TOKENS.border}`,
              boxShadow: '0 32px 80px rgba(0,0,0,0.62)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: 42, padding: '0 18px', background: '#222327', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F56' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FFBD2E' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27C93F' }} />
              </div>
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 17, fontWeight: 700, color: TOKENS.inkSecondary }}>
                {d.windowTitle || 'app.example.com'}
              </span>
              <span style={{ width: 36 }} />
            </div>

            <div
              style={{
                position: 'relative',
                flex: 1,
                overflow: 'hidden',
                transformOrigin: `${originX.toFixed(2)}% ${originY.toFixed(2)}%`,
                transform:
                  curScale === 1
                    ? 'none'
                    : `translate3d(${nudgeX.toFixed(2)}%, ${nudgeY.toFixed(2)}%, 0) scale(${curScale.toFixed(4)})`,
              }}
            >
              {d.videoFile ? (
                <OffthreadVideo src={staticFile(d.videoFile)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : d.imageFile ? (
                <Img src={staticFile(d.imageFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : treeItems.length > 0 ? (
                <div style={{ width: '100%', height: '100%', padding: '26px 36px', background: '#1D1E22', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {treeItems.map((ti, idx) => {
                    const isFocused = (ti.focusStep ?? idx) === Math.min(treeItems.length - 1, activeClause);
                    return (
                      <div
                        key={idx}
                        style={{
                          paddingLeft: (ti.depth ?? 0) * 32,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 14px',
                            borderRadius: 10,
                            border: `2px solid ${isFocused ? TOKENS.amber : 'transparent'}`,
                            background: isFocused ? TOKENS.amberSoft : 'transparent',
                            fontFamily: TOKENS.fontMono,
                            fontSize: 22,
                            fontWeight: isFocused ? 800 : 600,
                            color: isFocused ? TOKENS.ink : TOKENS.inkSecondary,
                          }}
                        >
                          <StudioVectorIcon
                            name={ti.kind === 'file' ? 'file' : 'folder'}
                            color={isFocused ? TOKENS.amber : TOKENS.slateLight}
                            size={22}
                          />
                          <span>{ti.name}</span>
                        </div>
                        {isFocused && ti.sideTag && (
                          <span
                            style={{
                              padding: '4px 16px',
                              borderRadius: 999,
                              background: '#3F2C1B',
                              border: `1.5px solid ${TOKENS.amber}`,
                              color: TOKENS.ink,
                              fontSize: 18,
                              fontWeight: 800,
                            }}
                          >
                            {ti.sideTag}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#1C1C1F' }}>
                  <div style={{ fontSize: 54, fontWeight: 900, color: TOKENS.ink }}>{d.heroText || 'Core Feature Spotlight'}</div>
                  {d.subText && <div style={{ fontSize: 22, color: TOKENS.inkSecondary }}>{d.subText}</div>}
                </div>
              )}

              {blurZones.map((bz, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${bz.xPct}%`,
                    top: `${bz.yPct}%`,
                    width: `${bz.wPct}%`,
                    height: `${bz.hPct}%`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    background: 'rgba(18, 18, 20, 0.56)',
                    borderRadius: 8,
                  }}
                />
              ))}

              {treeItems.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${focusBox.xPct}%`,
                    top: `${focusBox.yPct}%`,
                    width: `${focusBox.wPct}%`,
                    height: `${focusBox.hPct}%`,
                    border: `2.5px solid ${TOKENS.amber}`,
                    borderRadius: 14,
                    boxShadow: '0 0 32px rgba(254, 138, 0, 0.38)',
                    opacity: focusP,
                    pointerEvents: 'none',
                  }}
                >
                  {inlineTag && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 'calc(100% + 12px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '4px 14px',
                        borderRadius: 999,
                        background: '#3F2C1B',
                        border: `1.5px solid ${TOKENS.amber}`,
                        color: TOKENS.ink,
                        fontSize: 16,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {inlineTag}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {d.footnote && (
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary }}>
              {d.footnote}
            </div>
          )}

          {pills.length > 0 && (
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
              {pills.map((pl, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 28px',
                    borderRadius: 999,
                    background: idx === pills.length - 1 ? '#2E261C' : TOKENS.card,
                    border: `1.5px solid ${idx === pills.length - 1 ? TOKENS.amber : TOKENS.border}`,
                    fontSize: 22,
                    fontWeight: 800,
                    color: TOKENS.ink,
                  }}
                >
                  {pl}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integrated Non-Overlapping Side Forensic Callout Card (absorbing live_web_showcase capability) */}
        {callout && (
          <div
            style={{
              width: 430,
              background: TOKENS.card,
              border: `1.5px solid ${calloutPal.border}`,
              borderTop: `4px solid ${calloutPal.fg}`,
              borderRadius: 18,
              padding: '28px 30px',
              boxShadow: '0 26px 60px rgba(0,0,0,0.52)',
              opacity: sideP,
              transform: `translateX(${interpolate(sideP, [0, 1], [30, 0]).toFixed(2)}px)`,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {callout.badge && (
              <div style={{ alignSelf: 'flex-start', padding: '4px 14px', borderRadius: 999, background: calloutPal.bg, border: `1px solid ${calloutPal.border}`, color: calloutPal.fg, fontFamily: TOKENS.fontMono, fontSize: 16, fontWeight: 800 }}>
                {callout.badge}
              </div>
            )}
            <div style={{ fontSize: 28, fontWeight: 800, color: TOKENS.ink, lineHeight: 1.3 }}>{callout.title}</div>
            {callout.bigMetric && (
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 50, fontWeight: 900, color: calloutPal.fg, lineHeight: 1.08 }}>
                {formatRollingMetric(String(callout.bigMetric), sideP)}
              </div>
            )}
            {callout.note && (
              <div style={{ fontSize: 19, color: TOKENS.inkSecondary, lineHeight: 1.45 }}>{callout.note}</div>
            )}
            {Array.isArray(callout.items) && callout.items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {callout.items.map((ci: string, idx: number) => (
                  <div key={idx} style={{ fontSize: 18, fontWeight: 700, color: TOKENS.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: calloutPal.fg }}>•</span>
                    <span>{ci}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 31. vignette_metaphor_stage — Radial-Feathered Image Metaphor OR Collision-Free Flex Dual Contrast Stage
const PrimitiveVignetteMetaphorStage: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const beat2 = getBeatFrame(scene, 1, fps, 0.38);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const p2 = settle(spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY }));
  const checklist: string[] = Array.isArray(d.checklist) ? d.checklist : [];

  if (!d.imageFile) {
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: 1460,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1.08fr',
            gap: 36,
            alignItems: 'center',
            transform: `translateY(${d.topTitle || d.topPill ? 20 : -12}px)`,
          }}
        >
          {/* Left Risk / Fragile Column (Flex stacked — zero overlap!) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: p1 }}>
            {d.leftCallout && (
              <div
                style={{
                  padding: '10px 28px',
                  borderRadius: 999,
                  background: TOKENS.card,
                  border: `1.5px solid ${TOKENS.coralBorder}`,
                  fontSize: 22,
                  fontWeight: 800,
                  color: TOKENS.coral,
                }}
              >
                {d.leftCallout}
              </div>
            )}
            <div
              style={{
                width: '100%',
                minHeight: 330,
                borderRadius: 24,
                background: 'radial-gradient(circle at 50% 45%, rgba(224,85,73,0.20), rgba(50,50,50,0.35) 74%)',
                border: `2px dashed ${TOKENS.coralBorder}`,
                padding: '34px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 18,
              }}
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="26" stroke={TOKENS.coral} strokeWidth="3" strokeDasharray="6 5" fill="rgba(224,85,73,0.12)" />
                <path d="M32 18V35" stroke={TOKENS.coral} strokeWidth="4.2" strokeLinecap="round" />
                <circle cx="32" cy="44.5" r="2.8" fill={TOKENS.coral} />
              </svg>
              <span style={{ fontSize: 32, fontWeight: 900, color: TOKENS.coral, textAlign: 'center' }}>
                {d.leftLabel || '單點故障風險'}
              </span>
              {d.leftSub && (
                <span style={{ fontSize: 20, fontWeight: 600, color: TOKENS.inkSecondary, textAlign: 'center' }}>
                  {d.leftSub}
                </span>
              )}
            </div>
          </div>

          {/* Center Arrow */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: TOKENS.card,
              border: `1.5px solid ${TOKENS.amberBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: Math.max(0.35, p2),
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke={TOKENS.amber} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Right Resilient / Cloud Column (Flex stacked — zero overlap!) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
              opacity: Math.max(0.24, p2),
              transform: `translateY(${interpolate(p2, [0, 1], [18, 0]).toFixed(2)}px)`,
            }}
          >
            {d.rightCallout && (
              <div
                style={{
                  padding: '10px 28px',
                  borderRadius: 999,
                  background: '#1E2A26',
                  border: `1.5px solid ${TOKENS.emeraldMint}`,
                  fontSize: 22,
                  fontWeight: 800,
                  color: TOKENS.emeraldMint,
                }}
              >
                {d.rightCallout}
              </div>
            )}
            <div
              style={{
                width: '100%',
                minHeight: 330,
                borderRadius: 24,
                background: 'radial-gradient(circle at 50% 40%, rgba(23,183,166,0.20), rgba(50,50,50,0.45) 76%)',
                border: `2px solid ${TOKENS.emeraldBorder}`,
                padding: '32px 34px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                boxShadow: '0 24px 56px rgba(0,0,0,0.42)',
              }}
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path
                  d="M20 46H45.5C51.3 46 56 41.3 56 35.5C56 30.1 51.9 25.6 46.6 25.1C44.8 17.6 38.1 12 30 12C20.6 12 13 19.6 13 29C13 29.6 13 30.2 13.1 30.8C9.6 32.3 7.2 35.8 7.2 39.8C7.2 43.2 10 46 13.5 46H20Z"
                  stroke={TOKENS.emeraldMint}
                  strokeWidth="3"
                  fill="rgba(23,183,166,0.14)"
                  strokeLinejoin="round"
                />
                <polyline points="24 31.5 29.5 37 40.5 25.5" stroke={TOKENS.emeraldMint} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 32, fontWeight: 900, color: TOKENS.emeraldMint, textAlign: 'center' }}>
                {d.rightLabel || '雲端持續在線'}
              </span>

              {checklist.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 6 }}>
                  {checklist.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 999,
                        background: 'rgba(19, 159, 107, 0.16)',
                        border: `1px solid ${TOKENS.emeraldBorder}`,
                        fontSize: 18,
                        fontWeight: 800,
                        color: TOKENS.ink,
                      }}
                    >
                      <span style={{ color: TOKENS.emeraldMint, marginRight: 6 }}>✓</span>
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 1520, height: 680, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateY(-14px)' }}>
        <div
          style={{
            width: 1180,
            height: 620,
            overflow: 'hidden',
            opacity: p1,
            WebkitMaskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 58%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 72% 70% at 50% 50%, #000 58%, transparent 100%)',
          }}
        >
          <Img
            src={staticFile(d.imageFile)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${1 + Math.sin(frame / 90) * 0.02})`,
            }}
          />
        </div>

        {d.leftCallout && (
          <div
            style={{
              position: 'absolute',
              left: 90,
              top: 180,
              padding: '14px 30px',
              borderRadius: 999,
              background: TOKENS.card,
              border: `1.5px solid ${TOKENS.border}`,
              fontSize: 25,
              fontWeight: 800,
              color: TOKENS.ink,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              opacity: p1,
            }}
          >
            {d.leftCallout}
          </div>
        )}

        {(d.rightCallout || checklist.length > 0) && (
          <div
            style={{
              position: 'absolute',
              right: 90,
              top: checklist.length > 0 ? 310 : 180,
              padding: checklist.length > 0 ? '20px 26px' : '14px 30px',
              borderRadius: checklist.length > 0 ? 18 : 999,
              background: 'rgba(26, 26, 29, 0.92)',
              border: `2px solid ${TOKENS.amber}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
              opacity: p2,
              transform: `translateY(${interpolate(p2, [0, 1], [16, 0])}px)`,
            }}
          >
            {d.rightCallout && <div style={{ fontSize: 25, fontWeight: 900, color: TOKENS.ink, marginBottom: checklist.length > 0 ? 12 : 0 }}>{d.rightCallout}</div>}
            {checklist.map((item, idx) => (
              <div key={idx} style={{ fontSize: 20, fontWeight: 700, color: TOKENS.emeraldMint, marginTop: 6 }}>
                ✓ {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const StudioVideo: React.FC<{
  payload: ChapterRenderPayload;
}> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const curSec = frame / fps;

  const globalCurSec = payload.chapterStartOffsetSec + curSec;
  const globalPct = Math.min(100, (globalCurSec / Math.max(0.1, payload.globalTotalDurationSec)) * 100);

  // Prefer the most recently started caption; bridge short <0.38s breath pauses so the dark pill never flickers off/on between sentences!
  let activeCaption: ClauseTiming | undefined;
  for (let i = payload.captions.length - 1; i >= 0; i--) {
    const c = payload.captions[i];
    const nextC = payload.captions[i + 1];
    const gapToNext = nextC ? nextC.start - c.end : 999;
    const holdEnd = gapToNext > 0 && gapToNext <= 0.38 ? nextC.start : c.end + 0.14;
    if (curSec >= c.start - 0.02 && curSec <= holdEnd) {
      activeCaption = c;
      break;
    }
  }

  const chapIdxStr = `${String(payload.chapterIndex).padStart(2, '0')} / ${String(payload.totalChapters).padStart(2, '0')}`;
  const chapHudEnter = settle(spring({ frame, fps, config: SPRING_SILKY }));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: TOKENS.canvas,
        fontFamily: TOKENS.fontSans,
        color: TOKENS.ink,
        fontVariantNumeric: 'tabular-nums',
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'geometricPrecision',
      }}
    >
      {payload.audioFile ? <Audio src={staticFile(payload.audioFile)} /> : null}

      {/* Proportional Chapter-Segmented 4px Top Amber Progress Bar */}
      {Array.isArray(payload.chapterDurationsSec) && payload.chapterDurationsSec.length > 1 ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: TOKENS.canvas,
            display: 'flex',
            gap: 3,
            zIndex: 50,
          }}
        >
          {payload.chapterDurationsSec.map((chDur, idx) => {
            const cNum = idx + 1;
            const segPct =
              cNum < payload.chapterIndex
                ? 100
                : cNum > payload.chapterIndex
                ? 0
                : Math.min(100, Math.max(0, (curSec / Math.max(0.1, payload.chapterDurationSec)) * 100));
            return (
              <div
                key={idx}
                style={{
                  flex: Math.max(1, chDur),
                  height: '100%',
                  background: '#363636',
                  overflow: 'hidden',
                }}
              >
                <div style={{ width: `${segPct.toFixed(2)}%`, height: '100%', background: TOKENS.amber }} />
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: '#363636',
            zIndex: 50,
          }}
        >
          <div style={{ width: `${globalPct}%`, height: '100%', background: TOKENS.amber }} />
        </div>
      )}

      {/* Top-Left Chapter HUD with Smooth Entrance */}
      <div
        style={{
          position: 'absolute',
          top: 22,
          left: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 50,
          opacity: chapHudEnter,
          transform: chapHudEnter === 1 ? 'none' : `translate3d(${interpolate(chapHudEnter, [0, 1], [-16, 0]).toFixed(2)}px, 0, 0)`,
        }}
      >
        <span style={{ fontFamily: TOKENS.fontMono, fontSize: 21, fontWeight: 800, color: TOKENS.amber }}>
          {chapIdxStr}
        </span>
        <span style={{ fontSize: 21, fontWeight: 700, color: TOKENS.inkSecondary }}>
          {payload.chapterTitle}
        </span>
      </div>

      {/* Data-Driven 31-Primitive Scene Router + Universal Stepper/Thesis Header + Silky Stage Transition */}
      {payload.scenes.map((sc) => {
        const fromF = Math.round(sc.start * fps);
        const durF = Math.max(1, Math.round((sc.end - sc.start) * fps));
        return (
          <Sequence key={sc.id} from={fromF} durationInFrames={durF}>
            <SceneStageTransition durationInFrames={durF}>
              <SceneThesisHeader scene={sc} />
              {sc.primitive === 'chapter_card' && <PrimitiveChapterCard scene={sc} />}
              {sc.primitive === 'persona_quote' && <PrimitivePersonaQuote scene={sc} />}
              {sc.primitive === 'dot_matrix_stat' && <PrimitiveDotMatrixStat scene={sc} />}
              {sc.primitive === 'flow_3node' && <PrimitiveFlow3Node scene={sc} />}
              {sc.primitive === 'matrix_compare' && <PrimitiveMatrixCompare scene={sc} />}
              {sc.primitive === 'focus_hud_demo' && <PrimitiveFocusHudDemo scene={sc} />}
              {sc.primitive === 'live_web_showcase' && <PrimitiveLiveWebShowcase scene={sc} />}
              {sc.primitive === 'terminal_code_live' && <PrimitiveTerminalCodeLive scene={sc} />}
              {sc.primitive === 'ranked_bars' && <PrimitiveRankedBars scene={sc} />}
              {sc.primitive === 'evidence_clip' && <PrimitiveEvidenceClip scene={sc} />}
              {sc.primitive === 'skill_editor_spotlight' && <PrimitiveSkillEditorSpotlight scene={sc} />}
              {sc.primitive === 'stack_slice_builder' && <PrimitiveStackSliceBuilder scene={sc} />}
              {sc.primitive === 'traffic_gate_box' &&
                (sc.data?.mode === 'github_pr_checks' || sc.data?.mode === 'checks_gate' ? (
                  <PrimitivePrChecksGateCard scene={sc} />
                ) : (
                  <PrimitiveTrafficGateBox scene={sc} />
                ))}
              {sc.primitive === 'deep_module_box' && <PrimitiveDeepModuleBox scene={sc} />}
              {sc.primitive === 'split_tree_chat_dispatch' && <PrimitiveSplitTreeChatDispatch scene={sc} />}
              {sc.primitive === 'annotated_ui_tour' && <PrimitiveAnnotatedUiTour scene={sc} />}
              {sc.primitive === 'org_tree_radiate' && <PrimitiveOrgTreeRadiate scene={sc} />}
              {sc.primitive === 'pipeline_timeline_flow' &&
                (sc.data?.mode === 'dual_track_race' ? (
                  <PrimitiveDualTrackPipelineRace scene={sc} />
                ) : (
                  <PrimitivePipelineTimelineFlow scene={sc} />
                ))}
              {sc.primitive === 'defense_boundary_flow' && <PrimitiveDefenseBoundaryFlow scene={sc} />}
              {sc.primitive === 'row_permission_table' && <PrimitiveRowPermissionTable scene={sc} />}
              {sc.primitive === 'acronym_token_slot' && <PrimitiveAcronymTokenSlot scene={sc} />}
              {sc.primitive === 'metaphor_canvas' &&
                (sc.data?.mode === 'regression_loop' ? (
                  <PrimitiveRegressionLoopStage scene={sc} />
                ) : (
                  <PrimitiveMetaphorCanvas scene={sc} />
                ))}
              {sc.primitive === 'before_after_transformer' &&
                (sc.data?.mode === 'regression_loop' ? (
                  <PrimitiveRegressionLoopStage scene={sc} />
                ) : (
                  <PrimitiveBeforeAfterTransformer scene={sc} />
                ))}
              {sc.primitive === 'synergy_puzzle_pair' && <PrimitiveSynergyPuzzlePair scene={sc} />}
              {sc.primitive === 'multi_perspective_ring' && <PrimitiveMultiPerspectiveRing scene={sc} />}
              {sc.primitive === 'convergent_hub_bus' && <PrimitiveConvergentHubBus scene={sc} />}
              {sc.primitive === 'arc_gauge_audit' && <PrimitiveArcGaugeAudit scene={sc} />}
              {sc.primitive === 'idle_waste_vs_event_wake' &&
                (sc.data?.mode === 'dual_track_race' ? (
                  <PrimitiveDualTrackPipelineRace scene={sc} />
                ) : (
                  <PrimitiveIdleWasteVsEventWake scene={sc} />
                ))}
              {sc.primitive === 'binary_decision_tree' && <PrimitiveBinaryDecisionTree scene={sc} />}
              {sc.primitive === 'spotlight_window_tour' && <PrimitiveSpotlightWindowTour scene={sc} />}
              {sc.primitive === 'vignette_metaphor_stage' && <PrimitiveVignetteMetaphorStage scene={sc} />}
              {sc.primitive === 'surface_vs_background_iceberg' && <PrimitiveSurfaceVsBackgroundIceberg scene={sc} />}
              {sc.primitive === 'git_branch_merge_graph' && <PrimitiveGitBranchMergeGraph scene={sc} />}
              {sc.primitive === 'pr_checks_gate_card' && <PrimitivePrChecksGateCard scene={sc} />}
              {sc.primitive === 'slot_validation_and_stopwatch' && <PrimitiveSlotValidationAndStopwatch scene={sc} />}
              {sc.primitive === 'autonomous_bot_ui_tester' && <PrimitiveAutonomousBotUiTester scene={sc} />}
              {sc.primitive === 'env_isolation_compare' && <PrimitiveEnvIsolationCompare scene={sc} />}
              {sc.primitive === 'swiss_cheese_defense_layers' && <PrimitiveSwissCheeseDefenseLayers scene={sc} />}
              {sc.primitive === 'regression_loop_stage' && <PrimitiveRegressionLoopStage scene={sc} />}
              {sc.primitive === 'dual_track_pipeline_race' && <PrimitiveDualTrackPipelineRace scene={sc} />}
            </SceneStageTransition>
          </Sequence>
        );
      })}

      {/* Forensic Locked #090909 Borderless Subtitle Capsule (bottom: 61px standard, fontWeight: 800) */}
      {activeCaption && (() => {
        const subFontSize = payload.subtitleFontSize || 44;
        const isXlSub = subFontSize >= 54;
        const isLargeSub = subFontSize > 44;
        const capLocalFrame = Math.max(0, frame - Math.round(activeCaption.start * fps));
        const capFade = interpolate(capLocalFrame, [0, 5], [0.62, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: isXlSub ? 48 : isLargeSub ? 54 : 61,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 60,
            }}
          >
            <div
              style={{
                background: TOKENS.subtitleBg,
                borderRadius: 14,
                padding: isXlSub ? '16px 42px' : '16px 38px',
                fontSize: subFontSize,
                fontWeight: 800,
                color: TOKENS.ink,
                letterSpacing: '0.015em',
                boxShadow: '0 12px 32px rgba(0,0,0,0.46)',
                maxWidth: isXlSub ? '78%' : '76%',
                textAlign: 'center',
                opacity: capFade,
                transform: 'none',
              }}
            >
              {activeCaption.displayText}
            </div>
          </div>
        );
      })()}

      {/* Bottom-Right Real-Time Voice Waveform HUD */}
      {payload.showWaveform !== false && Array.isArray(payload.waveform) && payload.waveform.length > 0 && (() => {
        const wfIdx = Math.min(payload.waveform.length - 1, Math.max(0, frame));
        const bars = payload.waveform[wfIdx] || [];
        const avgEnergy = bars.length > 0 ? bars.reduce((a, b) => a + b, 0) / bars.length : 0;
        const isSpeaking = avgEnergy > 0.045;
        return (
          <div
            style={{
              position: 'absolute',
              right: 36,
              bottom: 58,
              height: 58,
              padding: '0 18px',
              borderRadius: 999,
              background: 'rgba(18, 18, 20, 0.86)',
              border: `1px solid ${isSpeaking ? 'rgba(245, 158, 11, 0.42)' : 'rgba(69, 69, 72, 0.75)'}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              pointerEvents: 'none',
              zIndex: 65,
            }}
          >
            {/* Amber Vocal Activity Pulse Dot */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: isSpeaking ? TOKENS.amber : TOKENS.inkMuted,
                boxShadow: isSpeaking ? `0 0 ${Math.round(6 + avgEnergy * 10)}px ${TOKENS.amber}` : 'none',
                opacity: isSpeaking ? 0.95 : 0.4,
                transform: `scale(${isSpeaking ? 1 + avgEnergy * 0.25 : 0.9})`,
              }}
            />
            {/* 16 Symmetric Multi-Band Vocal Bars */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3.5,
                height: 36,
              }}
            >
              {bars.map((v, bIdx) => {
                const clamped = Math.max(0, Math.min(1, v));
                const barH = Math.round(4 + Math.pow(clamped, 0.82) * 30);
                const isCenterPeak = clamped > 0.48;
                const isMidVoice = clamped > 0.14;
                const barColor = isCenterPeak
                  ? TOKENS.amber
                  : isMidVoice
                  ? TOKENS.ink
                  : 'rgba(161, 161, 170, 0.38)';
                return (
                  <div
                    key={bIdx}
                    style={{
                      width: 3.5,
                      height: barH,
                      borderRadius: 999,
                      background: barColor,
                      opacity: isCenterPeak ? 1 : isMidVoice ? 0.88 : 0.5,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
