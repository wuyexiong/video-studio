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
  | 'metaphor_canvas';

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
  audioFile: string; // filename inside runtime/public/render_job/
  showWaveform?: boolean;
  waveform?: number[][];
  scenes: StudioScene[];
  captions: ClauseTiming[];
}

const TOKENS = {
  canvas: '#262626',
  card: '#303030',
  cardElevated: '#36363A',
  paper: '#F7F6F2',
  paperInk: '#161618',
  border: '#454548',
  ink: '#F5F5F7',
  inkSecondary: '#A1A1AA',
  inkMuted: '#6E6E73',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.13)',
  amberBorder: 'rgba(245, 158, 11, 0.48)',
  emerald: '#34D399',
  emeraldSoft: 'rgba(52, 211, 153, 0.11)',
  emeraldBorder: 'rgba(52, 211, 153, 0.45)',
  coral: '#EF5350',
  coralSoft: 'rgba(239, 83, 80, 0.11)',
  coralBorder: 'rgba(239, 83, 80, 0.45)',
  subtitleBg: 'rgba(15, 15, 16, 0.88)',
  fontSans: '"Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  fontMono: '"JetBrains Mono", "Noto Sans Mono CJK SC", "MesloLGS NF", ui-monospace, monospace',
};

const SPRING_SNAPPY = { damping: 22, stiffness: 210, mass: 0.85 };

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

// Universal Top Scene Thesis Header & Context Pill
const SceneThesisHeader: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  if (!d.topPill && !d.topTitle) return null;

  const enter = spring({ frame, fps, config: SPRING_SNAPPY });
  const accentPal = tonePalette(d.topAccentTone || 'amber');
  const titleStr = String(d.topTitle || '');
  const accentWord = String(d.topAccentWord || '');

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
        top: 86,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        zIndex: 40,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [-14, 0])}px)`,
        pointerEvents: 'none',
      }}
    >
      {d.topPill && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 26px',
            borderRadius: 999,
            background: '#322F2B',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
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
            fontSize: 54,
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
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: 'translateY(-12px)' }}>
          <div style={{ position: 'relative', display: 'inline-block', opacity: t1, transform: `scale(${interpolate(t1, [0, 1], [0.92, 1])})` }}>
            <div
              style={{
                fontFamily: TOKENS.fontMono,
                fontSize: 118,
                fontWeight: 800,
                color: TOKENS.ink,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {d.headline || 'grill-me'}
            </div>
            <div
              style={{
                marginTop: 10,
                height: 12,
                width: `${Math.round(interpolate(bar, [0, 1], [0, 48]))}%`,
                background: TOKENS.amber,
                borderRadius: 6,
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, opacity: pEnter }}>
              {pills.map((p, i) => (
                <span
                  key={i}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: i === pills.length - 1 ? TOKENS.amberSoft : TOKENS.card,
                    border: `1px solid ${i === pills.length - 1 ? TOKENS.amberBorder : TOKENS.border}`,
                    color: i === pills.length - 1 ? TOKENS.amber : TOKENS.inkSecondary,
                    fontFamily: TOKENS.fontMono,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 2. persona_quote — Speaker / Founder Avatar Shift + Role Pills + Quote
const PrimitivePersonaQuote: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const badges: string[] = Array.isArray(d.badges) ? d.badges : [];
  const beat2 = getBeatFrame(scene, 1, fps, 0.42);

  const avEnter = spring({ frame, fps, config: SPRING_SNAPPY });
  const shift = spring({ frame: frame - 10, fps, config: SPRING_SNAPPY });
  const quoteEnter = spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY });

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
        {/* Circular Avatar Badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            opacity: avEnter,
            transform: `scale(${interpolate(avEnter, [0, 1], [0.85, 1])})`,
          }}
        >
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
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
            }}
          >
            {d.avatarFile ? (
              <Img src={staticFile(d.avatarFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 58, fontWeight: 800, color: TOKENS.amber }}>
                {(d.avatarMonogram || d.name || 'AI').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: TOKENS.ink }}>{d.name || 'Creator'}</div>
          {d.role && (
            <div
              style={{
                padding: '4px 14px',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 780 }}>
          {badges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {badges.map((b, idx) => {
                const p = spring({ frame: frame - (10 + idx * 5), fps, config: SPRING_SNAPPY });
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 12,
                      background: TOKENS.card,
                      border: `1px solid ${TOKENS.border}`,
                      fontSize: 22,
                      fontWeight: 600,
                      color: TOKENS.ink,
                      opacity: p,
                      transform: `translateX(${interpolate(p, [0, 1], [16, 0])}px)`,
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
                background: TOKENS.card,
                border: `1px solid ${TOKENS.amberBorder}`,
                borderRadius: 16,
                padding: '28px 32px',
                opacity: badges.length ? quoteEnter : shift,
                transform: `translateY(${interpolate(badges.length ? quoteEnter : shift, [0, 1], [20, 0])}px)`,
              }}
            >
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 44, lineHeight: 0.8, color: TOKENS.amber, marginBottom: 8 }}>
                “
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.4 }}>
                {d.quote}
              </div>
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

// 3. dot_matrix_stat — Proportion Dot Grid + Big Monospace Metric (1,000 -> 0.2% style)
const PrimitiveDotMatrixStat: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const cols = 20;
  const rows = 10;
  const totalDots = cols * rows;
  const activeCount = Math.max(1, Math.min(totalDots, Number(d.highlightDots ?? 4)));
  const pal = tonePalette(d.tone || 'amber');
  const beat2 = getBeatFrame(scene, 1, fps, 0.45);

  const gridEnter = spring({ frame, fps, config: SPRING_SNAPPY });
  const statEnter = spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY });
  const badges: string[] = Array.isArray(d.badges) ? d.badges : [];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 84,
          transform: 'translateY(-22px)',
        }}
      >
        <div style={{ opacity: gridEnter }}>
          {d.gridCaption && (
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 22, color: TOKENS.inkSecondary, marginBottom: 16 }}>
              {d.gridCaption}
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 26px)`,
              gap: 12,
            }}
          >
            {Array.from({ length: totalDots }).map((_, idx) => {
              const isLit = idx >= totalDots - activeCount && frame >= Math.min(beat2, 12);
              return (
                <div
                  key={idx}
                  style={{
                    width: isLit ? 18 : 10,
                    height: isLit ? 18 : 10,
                    borderRadius: '50%',
                    background: isLit ? pal.fg : '#48484C',
                    boxShadow: isLit ? `0 0 18px ${pal.fg}` : 'none',
                    placeSelf: 'center',
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
          <div style={{ fontFamily: TOKENS.fontMono, fontSize: 108, fontWeight: 800, color: pal.fg, lineHeight: 1 }}>
            {d.metricValue || '0.2%'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: TOKENS.ink, marginTop: 14 }}>
            {d.metricLabel || ''}
          </div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              {badges.map((b, i) => (
                <span
                  key={i}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 999,
                    border: `1px solid ${pal.border}`,
                    background: pal.bg,
                    color: pal.fg,
                    fontFamily: TOKENS.fontMono,
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 4. flow_3node — Progressive SVG-Connected Architecture / Funnel Flow (2 to 4 Nodes)
const PrimitiveFlow3Node: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes: Array<{ tag?: string; title: string; subtitle?: string; bigValue?: string; badge?: string; tone?: Tone }> =
    Array.isArray(scene.data?.nodes) ? scene.data.nodes.slice(0, 4) : [];

  const stepFrames = Math.max(10, Math.floor((scene.duration * fps * 0.62) / Math.max(1, nodes.length)));

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
          const startF = idx * stepFrames;
          const enter = spring({ frame: frame - startF, fps, config: SPRING_SNAPPY });
          const lineP = interpolate(frame, [startF + 4, startF + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const pal = tonePalette(nd.tone || (idx === 0 ? 'amber' : 'neutral'));
          const isHighlight = nd.tone === 'emerald' || nd.tone === 'coral';

          return (
            <React.Fragment key={idx}>
              <div
                style={{
                  width: Math.min(430, Math.floor(1520 / Math.max(2, nodes.length))),
                  background: isHighlight ? pal.bg : TOKENS.card,
                  border: `1.5px solid ${isHighlight ? pal.border : TOKENS.border}`,
                  borderLeft: idx === 0 && !isHighlight ? `4px solid ${TOKENS.amber}` : undefined,
                  borderRadius: 16,
                  padding: '26px 28px',
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
                }}
              >
                {nd.tag && (
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 17, fontWeight: 700, color: pal.fg, marginBottom: 8 }}>
                    {nd.tag}
                  </div>
                )}
                {nd.bigValue && (
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 58, fontWeight: 800, color: pal.fg, lineHeight: 1.08, marginBottom: 6 }}>
                    {nd.bigValue}
                  </div>
                )}
                <div style={{ fontSize: 30, fontWeight: 700, color: TOKENS.ink, marginBottom: nd.subtitle ? 8 : 0 }}>
                  {nd.title}
                </div>
                {nd.subtitle && (
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary }}>
                    {nd.subtitle}
                  </div>
                )}
                {nd.badge && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'inline-block',
                      padding: '5px 14px',
                      borderRadius: 999,
                      background: pal.bg,
                      border: `1px solid ${pal.border}`,
                      color: pal.fg,
                      fontFamily: TOKENS.fontMono,
                      fontSize: 18,
                      fontWeight: 700,
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
                  style={{ opacity: lineP > 0.03 ? 1 : 0, flexShrink: 0 }}
                >
                  <line x1="4" y1="18" x2={4 + 66 * lineP} y2="18" stroke={TOKENS.amber} strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 5. matrix_compare — 2 to 3 Column Semantic Matrix (Attack/Defense, Pros/Cons, Competitor Table)
const PrimitiveMatrixCompare: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols: Array<{ header: string; tone?: Tone; items: Array<{ title: string; detail?: string; badge?: string }> }> =
    Array.isArray(scene.data?.columns) ? scene.data.columns.slice(0, 3) : [];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 110px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(1, cols.length)}, 1fr)`,
          gap: 22,
          width: '100%',
          maxWidth: 1640,
          transform: 'translateY(-22px)',
        }}
      >
        {cols.map((col, cIdx) => {
          const enter = spring({ frame: frame - cIdx * 8, fps, config: SPRING_SNAPPY });
          const pal = tonePalette(col.tone || 'neutral');
          const tinted = col.tone && col.tone !== 'neutral';

          return (
            <div
              key={cIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: pal.fg, textAlign: 'center', marginBottom: 4 }}>
                {col.header}
              </div>
              {(col.items || []).map((it, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    background: tinted ? pal.bg : TOKENS.card,
                    border: `1px solid ${tinted ? pal.border : TOKENS.border}`,
                    borderLeft: !tinted ? `4px solid ${TOKENS.amber}` : undefined,
                    borderRadius: 14,
                    padding: '20px 22px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: TOKENS.ink }}>{it.title}</span>
                    {it.badge && (
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 999,
                          background: pal.bg,
                          border: `1px solid ${pal.border}`,
                          color: pal.fg,
                          fontFamily: TOKENS.fontMono,
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {it.badge}
                      </span>
                    )}
                  </div>
                  {it.detail && (
                    <div style={{ fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary, marginTop: 8 }}>
                      {it.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 6. focus_hud_demo — Dimmed/Blurred Background Context + Foreground Interactive HUD Click
const PrimitiveFocusHudDemo: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const backCards: Array<{ title: string; code: string; status: string }> = Array.isArray(d.backdropCards)
    ? d.backdropCards
    : [];

  const beat2 = getBeatFrame(scene, 1, fps, 0.45);
  let clickFrame = beat2 + Math.round(0.6 * fps);
  const kw = String(d.clickKeyword || 'allow').toLowerCase();
  if (scene.clauses[1]?.chars?.length) {
    const chList = scene.clauses[1].chars;
    let joined = '';
    const charOffsets: Array<{ idx: number; start: number }> = [];
    for (const c of chList) {
      charOffsets.push({ idx: joined.length, start: c.start });
      joined += (c.text || '').toLowerCase();
    }
    const matchIdx = joined.indexOf(kw);
    if (matchIdx >= 0) {
      const hit = charOffsets.find((o) => o.idx >= matchIdx) || charOffsets[0];
      if (hit) {
        clickFrame = Math.max(beat2 + 5, Math.round((hit.start - scene.start) * fps));
      }
    }
  }

  const focus = spring({ frame: frame - (beat2 - 4), fps, config: SPRING_SNAPPY });
  const click = spring({ frame: frame - clickFrame, fps, config: { damping: 18, stiffness: 250, mass: 0.7 } });
  const isClicked = frame >= clickFrame + 3;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 22,
          opacity: interpolate(focus, [0, 1], [1, 0.25]),
          filter: `blur(${interpolate(focus, [0, 1], [0, 4.5])}px)`,
          transform: `scale(${interpolate(focus, [0, 1], [1, 0.96])})`,
        }}
      >
        {backCards.slice(0, 3).map((bc, i) => {
          const p = spring({ frame: frame - i * 4, fps, config: SPRING_SNAPPY });
          return (
            <div
              key={i}
              style={{
                width: 450,
                background: TOKENS.card,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 16,
                padding: '22px 24px',
                opacity: p,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 18, color: TOKENS.inkSecondary }}>{bc.title}</span>
                <span style={{ fontSize: 15, color: TOKENS.amber, background: TOKENS.amberSoft, padding: '3px 10px', borderRadius: 999 }}>
                  {bc.status}
                </span>
              </div>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 20, color: TOKENS.ink, background: '#222224', padding: '12px 14px', borderRadius: 10 }}>
                {bc.code}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 140,
          opacity: focus,
          transform: `translateY(${interpolate(focus, [0, 1], [-110, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 780,
            background: '#0E0F12',
            borderRadius: 24,
            border: `1.5px solid ${isClicked ? TOKENS.emeraldBorder : 'rgba(255,255,255,0.18)'}`,
            padding: '26px 32px',
            boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 700, color: TOKENS.ink }}>
              {d.hudTitle || 'Action Required'}
            </span>
            {d.hudBadge && (
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 17, color: TOKENS.amber, background: TOKENS.amberSoft, padding: '4px 12px', borderRadius: 999 }}>
                {d.hudBadge}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#18191E', padding: '16px 20px', borderRadius: 14 }}>
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 21, color: '#E4E4E7' }}>
              {d.promptText || ''}
            </span>
            <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
              <span
                style={{
                  padding: '8px 22px',
                  borderRadius: 999,
                  background: isClicked ? TOKENS.emerald : TOKENS.emeraldSoft,
                  border: `1.5px solid ${TOKENS.emerald}`,
                  color: isClicked ? '#111113' : TOKENS.emerald,
                  fontFamily: TOKENS.fontMono,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                {isClicked ? `✓ ${d.clickedLabel || 'Done'}` : d.primaryAction || 'Allow'}
              </span>
              {d.secondaryAction && (
                <span style={{ padding: '8px 18px', borderRadius: 999, border: `1px solid ${TOKENS.coralBorder}`, color: TOKENS.coral, fontFamily: TOKENS.fontMono, fontSize: 20, opacity: isClicked ? 0.4 : 1 }}>
                  {d.secondaryAction}
                </span>
              )}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                style={{
                  position: 'absolute',
                  left: interpolate(click, [0, 1], [110, 38]),
                  top: interpolate(click, [0, 1], [54, 24]),
                }}
              >
                <path d="M4 2L20 11L13 13L16 20L13 21.5L10 14.5L5 19Z" fill="#FFF" stroke="#111" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 7. live_web_showcase — True 60fps Video Stream + Footnote + Side Forensic Callout
const PrimitiveLiveWebShowcase: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const callout = d.callout;
  const beat2 = getBeatFrame(scene, 1, fps, 0.48);

  const enter = spring({ frame, fps, config: SPRING_SNAPPY });
  const sideEnter = spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY });
  const pal = tonePalette(callout?.tone || 'coral');

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: enter,
          transform: `translateY(-24px) translateX(${callout ? interpolate(sideEnter, [0, 1], [0, -120]) : 0}px) scale(${interpolate(enter, [0, 1], [0.95, 1])})`,
        }}
      >
        <div
          style={{
            width: 1120,
            height: 700,
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 28px 68px rgba(0,0,0,0.52)',
            background: '#1A1A1D',
          }}
        >
          {d.videoFile ? (
            <OffthreadVideo src={staticFile(d.videoFile)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            position: 'absolute',
            right: 110,
            top: 270,
            width: 430,
            background: '#272426',
            border: `1.5px solid ${pal.border}`,
            borderRadius: 16,
            padding: '26px 28px',
            boxShadow: '0 24px 54px rgba(0,0,0,0.55)',
            opacity: sideEnter,
            transform: `translateY(${interpolate(sideEnter, [0, 1], [26, 0])}px)`,
          }}
        >
          {callout.badge && (
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: pal.bg, color: pal.fg, fontFamily: TOKENS.fontMono, fontSize: 17, fontWeight: 800, marginBottom: 12 }}>
              {callout.badge}
            </div>
          )}
          <div style={{ fontSize: 28, fontWeight: 700, color: TOKENS.ink, marginBottom: 10 }}>{callout.title}</div>
          {callout.bigMetric && (
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 48, fontWeight: 800, color: pal.fg, lineHeight: 1.1 }}>
              {callout.bigMetric}
            </div>
          )}
          {callout.note && (
            <div style={{ fontSize: 20, color: TOKENS.inkSecondary, marginTop: 8 }}>{callout.note}</div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// 8. terminal_code_live — Progressive CLI / Code Execution Stream (GitHub & Tech Deep-Dives)
const PrimitiveTerminalCodeLive: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const lines: Array<{ text: string; kind?: 'cmd' | 'out' | 'comment'; highlight?: boolean }> = Array.isArray(d.lines)
    ? d.lines
    : [];
  const stepF = Math.max(6, Math.floor((scene.duration * fps * 0.72) / Math.max(1, lines.length)));

  const winEnter = spring({ frame, fps, config: SPRING_SNAPPY });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1320,
          background: '#191A1D',
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 28px 64px rgba(0,0,0,0.48)',
          opacity: winEnter,
          transform: `translateY(${interpolate(winEnter, [0, 1], [22, -20])}px)`,
        }}
      >
        <div style={{ padding: '14px 22px', background: '#222327', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary, fontWeight: 600 }}>
            {d.windowTitle || 'zsh · terminal'}
          </span>
          {d.badge && (
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 16, color: TOKENS.emerald, background: TOKENS.emeraldSoft, padding: '3px 12px', borderRadius: 999 }}>
              {d.badge}
            </span>
          )}
        </div>
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lines.map((ln, idx) => {
            const p = spring({ frame: frame - idx * stepF, fps, config: SPRING_SNAPPY });
            const color =
              ln.kind === 'comment'
                ? TOKENS.inkMuted
                : ln.kind === 'out'
                ? TOKENS.emerald
                : ln.highlight
                ? TOKENS.amber
                : TOKENS.ink;
            return (
              <div
                key={idx}
                style={{
                  fontFamily: TOKENS.fontMono,
                  fontSize: 26,
                  color,
                  background: ln.highlight ? TOKENS.amberSoft : 'transparent',
                  borderLeft: ln.highlight ? `3px solid ${TOKENS.amber}` : '3px solid transparent',
                  padding: ln.highlight ? '8px 14px' : '2px 14px',
                  borderRadius: 6,
                  opacity: p,
                  transform: `translateX(${interpolate(p, [0, 1], [14, 0])}px)`,
                }}
              >
                {ln.text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 9. ranked_bars — Animated Horizontal Bars / Benchmark / Probability Distribution
const PrimitiveRankedBars: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const bars: Array<{ label: string; pct: number; valueText: string; tone?: Tone }> = Array.isArray(d.bars)
    ? d.bars
    : [];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1280, transform: 'translateY(-22px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {d.heading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: TOKENS.ink }}>{d.heading}</span>
            {d.heroStat && (
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 46, fontWeight: 800, color: TOKENS.amber }}>
                {d.heroStat}
              </span>
            )}
          </div>
        )}
        {bars.map((b, idx) => {
          const p = spring({ frame: frame - idx * 6, fps, config: SPRING_SNAPPY });
          const pal = tonePalette(b.tone || (idx === 0 ? 'amber' : 'neutral'));
          const widthPct = Math.max(2, Math.min(100, b.pct)) * p;
          return (
            <div key={idx} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}`, borderRadius: 14, padding: '18px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 25, fontWeight: 700, color: TOKENS.ink }}>{b.label}</span>
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 25, fontWeight: 800, color: pal.fg }}>{b.valueText}</span>
              </div>
              <div style={{ height: 14, background: '#202022', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${widthPct}%`, height: '100%', background: pal.fg === TOKENS.ink ? '#71717A' : pal.fg, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 10. evidence_clip — Warm Paper Document / ArXiv / GitHub README Excerpt + Highlighter
const PrimitiveEvidenceClip: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const excerpts: Array<{ text: string; highlight?: boolean }> = Array.isArray(d.excerpts) ? d.excerpts : [];
  const beat2 = getBeatFrame(scene, 1, fps, 0.42);

  const cardEnter = spring({ frame, fps, config: SPRING_SNAPPY });
  const hiProgress = interpolate(frame, [beat2 - 2, beat2 + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1160,
          background: TOKENS.paper,
          color: TOKENS.paperInk,
          borderRadius: 16,
          padding: '38px 46px',
          boxShadow: '0 32px 72px rgba(0,0,0,0.52)',
          opacity: cardEnter,
          transform: `translateY(${interpolate(cardEnter, [0, 1], [26, -22])}px)`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)', paddingBottom: 16, marginBottom: 22 }}>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 18, fontWeight: 800, color: '#B45309', letterSpacing: '0.05em' }}>
            {d.docType || 'PRIMARY EVIDENCE'}
          </span>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 18, color: '#52525B' }}>{d.docMeta || ''}</span>
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#111113', marginBottom: 22, lineHeight: 1.28 }}>
          {d.docTitle || ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {excerpts.map((ex, i) => (
            <div
              key={i}
              style={{
                fontSize: 25,
                lineHeight: 1.55,
                color: '#27272A',
                fontWeight: ex.highlight ? 700 : 500,
                background: ex.highlight ? `linear-gradient(90deg, rgba(245, 158, 11, 0.34) ${hiProgress * 100}%, transparent ${hiProgress * 100}%)` : 'transparent',
                padding: '6px 10px',
                borderRadius: 6,
              }}
            >
              {ex.text}
            </div>
          ))}
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
            const p = spring({ frame: frame - startF, fps, config: SPRING_SNAPPY });
            const isCurrentFocus = idx === activeItemIdx && isRevealed;
            const pal = tonePalette(it.tone || 'amber');

            // Typewriter progress during the first 18 frames after reveal
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
                  padding: isCurrentFocus ? '18px 24px' : '12px 20px',
                  borderRadius: 14,
                  background: isCurrentFocus ? pal.bg : 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${isCurrentFocus ? pal.border : 'rgba(255,255,255,0.06)'}`,
                  opacity: isRevealed ? (isCurrentFocus ? 1 : 0.46) : 0.12,
                  transform: `scale(${isCurrentFocus ? interpolate(p, [0, 1], [0.98, 1.015]) : 0.99})`,
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
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 23, fontWeight: 600, color: TOKENS.ink, lineHeight: 1.4 }}>
                    {isRevealed ? it.code.slice(0, charsToShow) : '........................................................'}
                    {isCurrentFocus && typeP < 1 && (
                      <span style={{ display: 'inline-block', width: 11, height: 22, background: pal.fg, marginLeft: 4, verticalAlign: 'middle' }} />
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
                      transform: `translateX(${interpolate(p, [0, 1], [18, 0])}px)`,
                      boxShadow: isCurrentFocus ? '0 8px 24px rgba(0,0,0,0.35)' : 'none',
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

// 12. stack_slice_builder — 3-Phase Vertical Slice Stack Builder:
// Phase 0 (Clause 0): Horizontal Technical Layer Anti-Pattern (🚫 無法測試)
// Phase 1 (Clauses 1-2): Bottom-Up Brick-by-Brick Stacking (資料庫 -> 後端邏輯 -> 前端畫面)
// Phase 2 (Clause 3): Green Verification Checkmark + White macOS Browser Preview (shop.example.com/login)
// Phase 3 (Clause 4+): Second Feature Container Bottom-Up Brick-by-Brick Stacking (② 加入購物車)
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
    blue: { bg: '#3B82F6', border: '#60A5FA', text: '#FFFFFF' },
    purple: { bg: '#8B5CF6', border: '#A78BFA', text: '#FFFFFF' },
    amber: { bg: '#F59E0B', border: '#FBBF24', text: '#141416' },
    emerald: { bg: '#10B981', border: '#34D399', text: '#141416' },
    coral: { bg: '#EF4444', border: '#F87171', text: '#FFFFFF' },
  };

  const clause1F = getBeatFrame(scene, 1, fps, 0.22);
  const clause2F = getBeatFrame(scene, 2, fps, 0.42);
  const clause3F = getBeatFrame(scene, 3, fps, 0.64);
  const clause4F = getBeatFrame(scene, 4, fps, 0.80);

  const inHorizontalBadPhase = d.showHorizontalContrast !== false && scene.clauses.length >= 4 && frame < clause1F - 2;
  const inBrowserVerifyPhase = d.showBrowserPreview !== false && scene.clauses.length >= 5 && frame >= clause3F - 2 && frame < clause4F - 2;

  // Phase 0: Horizontal Technical Layer Anti-Pattern
  if (inHorizontalBadPhase) {
    const enterP = spring({ frame, fps, config: SPRING_SNAPPY });
    const warnP = spring({ frame: frame - Math.min(18, Math.floor(clause1F * 0.35)), fps, config: SPRING_SNAPPY });
    const horizRows = [
      { title: '前端畫面', sub: 'UI', color: '#F59E0B', dimmed: true },
      { title: '後端邏輯', sub: 'Logic', color: '#8B5CF6', dimmed: true },
      { title: '資料庫', sub: 'Database', color: '#3B82F6', dimmed: false },
    ];
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            transform: 'translateY(26px)',
            opacity: enterP,
          }}
        >
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {horizRows.map((hr, rIdx) => (
              <div
                key={rIdx}
                style={{
                  width: 880,
                  height: 106,
                  borderRadius: 16,
                  background: '#252529',
                  border: `1.5px solid ${hr.dimmed ? 'rgba(239, 68, 68, 0.42)' : 'rgba(59, 130, 246, 0.45)'}`,
                  padding: '0 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: hr.dimmed ? interpolate(warnP, [0, 1], [0.9, 0.32]) : 0.95,
                }}
              >
                <div style={{ width: 120 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: hr.color }}>{hr.title}</div>
                  <div style={{ fontFamily: TOKENS.fontMono, fontSize: 17, color: TOKENS.inkSecondary }}>{hr.sub}</div>
                </div>
                <div style={{ display: 'flex', gap: 14, flex: 1, justifyContent: 'flex-end' }}>
                  {[0, 1, 2, 3, 4].map((bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        width: 122,
                        height: 68,
                        borderRadius: 10,
                        background: hr.color,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Red "🚫 無法測試" Overlay Banner across top 2 rows */}
            <div
              style={{
                position: 'absolute',
                top: 68,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                opacity: warnP,
                transform: `scale(${interpolate(warnP, [0, 1], [0.88, 1])})`,
              }}
            >
              <div
                style={{
                  padding: '10px 30px',
                  borderRadius: 14,
                  background: 'rgba(24, 18, 19, 0.92)',
                  border: `2px solid ${TOKENS.coral}`,
                  fontSize: 38,
                  fontWeight: 900,
                  color: TOKENS.coral,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                }}
              >
                🚫 按技術拆：畫面出來前完全無法測試
              </div>
            </div>
          </div>

          {/* Solution Pill at Bottom */}
          <div
            style={{
              marginTop: 8,
              padding: '10px 28px',
              borderRadius: 14,
              background: '#2E2A22',
              border: `2px solid ${TOKENS.amber}`,
              fontSize: 25,
              fontWeight: 800,
              color: TOKENS.ink,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: warnP,
            }}
          >
            <span style={{ padding: '2px 12px', borderRadius: 999, background: TOKENS.amber, color: '#141416', fontSize: 18, fontWeight: 900 }}>
              解法
            </span>
            <span>to-tickets 改用「使用者功能」垂直拆任務</span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

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
          // If we are in Browser Verify Phase (Clause 3), replace Column 2 temporarily with a white macOS Browser Window!
          if (cIdx === 1 && inBrowserVerifyPhase) {
            const brP = spring({ frame: frame - clause3F, fps, config: SPRING_SNAPPY });
            return (
              <div
                key="browser-verify"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                  opacity: brP,
                  transform: `translateY(${interpolate(brP, [0, 1], [24, 0])}px) scale(${interpolate(brP, [0, 1], [0.94, 1])})`,
                }}
              >
                <div
                  style={{
                    width: 560,
                    background: '#F4F4F6',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {/* Browser Titlebar */}
                  <div
                    style={{
                      padding: '12px 18px',
                      background: '#38383D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F56' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FFBD2E' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27C93F' }} />
                    </div>
                    <span style={{ fontFamily: TOKENS.fontMono, fontSize: 16, color: '#D4D4D8', fontWeight: 600 }}>
                      shop.example.com/login
                    </span>
                    <span style={{ width: 32 }} />
                  </div>

                  {/* White Login Form Body */}
                  <div style={{ padding: '28px 40px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#18181B', textAlign: 'center', marginBottom: 4 }}>
                      會員登入
                    </div>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: '#FFFFFF',
                        border: '1.5px solid #D4D4D8',
                        fontSize: 20,
                        color: '#71717A',
                        fontWeight: 600,
                      }}
                    >
                      電子郵件
                    </div>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: '#FFFFFF',
                        border: '1.5px solid #D4D4D8',
                        fontSize: 20,
                        color: '#71717A',
                        fontWeight: 600,
                      }}
                    >
                      密碼
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        padding: '13px 0',
                        borderRadius: 8,
                        background: TOKENS.amber,
                        color: '#141416',
                        fontSize: 23,
                        fontWeight: 900,
                        textAlign: 'center',
                      }}
                    >
                      登入
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 28px',
                    borderRadius: 999,
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: `2px solid ${TOKENS.emerald}`,
                    color: TOKENS.emerald,
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  ✓ 當場就能打開瀏覽器實測驗收
                </div>
              </div>
            );
          }

          const colStartF = (col.stepClause ?? 0) <= 1 && cIdx === 0 ? clause1F : getBeatFrame(scene, col.stepClause ?? 0, fps);
          const colP = spring({ frame: frame - colStartF, fps, config: SPRING_SNAPPY });
          const headerVisible = frame >= colStartF - 2;
          const footerStartF = col.footerClause !== undefined ? getBeatFrame(scene, col.footerClause, fps) : 9999;
          const isVerifiedGreen = (cIdx === 0 && frame >= clause3F - 2) || (cIdx === 1 && frame >= footerStartF + 16);
          const verifyP = spring({ frame: frame - (cIdx === 0 ? clause3F : footerStartF + 16), fps, config: SPRING_SNAPPY });

          return (
            <div
              key={cIdx}
              style={{
                position: 'relative',
                width: 470,
                height: 500,
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
                boxShadow: isVerifiedGreen
                  ? '0 0 38px rgba(16, 185, 129, 0.25), 0 24px 60px rgba(0,0,0,0.45)'
                  : '0 24px 60px rgba(0,0,0,0.45)',
              }}
            >
              {/* Floating Top-Right Emerald Checkmark Circle */}
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
                    fontSize: 28,
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

              {/* Top Column Title */}
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

              {/* Bottom-Up Brick-by-Brick Stacked Architecture Blocks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'auto' }}>
                {col.layers.map((ly, lIdx) => {
                  // Stagger from BOTTOM (lIdx = layers.length - 1 -> 0f delay) to TOP (lIdx = 0 -> +22f delay)
                  const bottomUpOrder = Math.max(0, col.layers.length - 1 - lIdx);
                  const baseClauseF = getBeatFrame(scene, ly.stepClause, fps);
                  const staggerFrames = bottomUpOrder * 11;
                  const lyF = baseClauseF + staggerFrames;
                  const isShown = frame >= lyF - 1;
                  const lp = spring({ frame: frame - lyF, fps, config: SPRING_SNAPPY });
                  const cStyle = layerColorMap[ly.color || 'blue'];

                  return (
                    <div
                      key={lIdx}
                      style={{
                        height: 86,
                        borderRadius: 12,
                        background: cStyle.bg,
                        border: `2px solid ${cStyle.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isShown ? lp : 0,
                        transform: `translateY(${interpolate(lp, [0, 1], [34, 0])}px) scale(${interpolate(lp, [0, 1], [0.9, 1])})`,
                        boxShadow: '0 10px 26px rgba(0,0,0,0.28)',
                      }}
                    >
                      <span style={{ fontSize: 27, fontWeight: 900, color: cStyle.text }}>{ly.label}</span>
                      {ly.sub && (
                        <span style={{ fontFamily: TOKENS.fontMono, fontSize: 16, fontWeight: 700, color: cStyle.text, opacity: 0.85 }}>
                          {ly.sub}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 13. traffic_gate_box — "TDD = 防作弊機制" Traffic Light & "好架構 = 深模組" Encapsulation Canvas
const PrimitiveTrafficGateBox: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'tdd_lights';

  if (mode === 'deep_module') {
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
          {/* Main Caller Box */}
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
            {d.callerLabel || '💻 主程式 (Main App)'}
          </div>

          {/* Arrow Down */}
          <div style={{ fontSize: 32, color: TOKENS.emerald, fontWeight: 900, opacity: p2 }}>↓</div>

          {/* Deep Module Encapsulated Boundary */}
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
            {/* Single Simple Door */}
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
              {d.doorFunction || '🚪 processCheckout()'}
            </div>

            {/* 5 Hidden Inner Rooms */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 18,
                opacity: p3,
                transform: `translateY(${interpolate(p3, [0, 1], [16, 0])}px)`,
              }}
            >
              {rooms.map((rm, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 220,
                    padding: '22px 16px',
                    borderRadius: 14,
                    background: '#23272A',
                    border: `1.5px solid rgba(52, 211, 153, 0.35)`,
                    fontSize: 25,
                    fontWeight: 800,
                    color: TOKENS.ink,
                    textAlign: 'center',
                  }}
                >
                  {rm}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 24, fontWeight: 800, color: TOKENS.emerald, opacity: p3 }}>
              {d.bottomCaption || '✓ 對外只有一扇極簡大門，對內隱藏所有複雜細節（AI 零迷路）'}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Default: "tdd_lights" mode (Replicating grill_07_55.jpg 1:1!)
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
          {/* Left Locked Rule Card */}
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
              🔒 {d.lockTitle || '先把測試死規矩定死'}
            </div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 44, fontWeight: 900, color: TOKENS.ink }}>
              {d.ruleLeft || '滿 $1,000'} <span style={{ color: TOKENS.amber }}>→ {d.ruleRight || '只能 -$100'}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: TOKENS.coral, opacity: isRedLit ? 1 : 0.35 }}>
              {d.lockNote || '此時算錢程式還沒寫 → 測試一跑必定失敗亮紅燈'}
            </div>
          </div>

          {/* Right Traffic Light Box */}
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
            {/* Red Light Row */}
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
                <div style={{ fontSize: 36, fontWeight: 900, color: TOKENS.coral }}>測試失敗</div>
                <div style={{ fontSize: 23, fontWeight: 700, color: TOKENS.inkSecondary }}>紅燈：先確認規則鎖死</div>
              </div>
            </div>

            {/* Green Light Row */}
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
                <div style={{ fontSize: 36, fontWeight: 900, color: TOKENS.emerald }}>測試通過</div>
                <div style={{ fontSize: 23, fontWeight: 700, color: TOKENS.ink }}>綠燈：准許寫程式直到過關</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Progress & Sequence Pill */}
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
            先寫測試 <span style={{ color: TOKENS.amber }}>→</span> 再寫程式（徹底鎖死 AI 作弊空間）
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 15. split_tree_chat_dispatch — Center-Grow File Tree -> Smooth Shift Left -> Right Agent Chat Dispatch (grok_seq_13_00.jpg)
const PrimitiveSplitTreeChatDispatch: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const folders: Array<{ name: string; files: string; stepClause?: number; highlight?: boolean }> = Array.isArray(d.folders)
    ? d.folders
    : [
        { name: 'context', files: 'about.md · brand.md', stepClause: 0 },
        { name: 'meetings', files: 'spec.md', stepClause: 1, highlight: true },
        { name: 'projects', files: '官網程式碼', stepClause: 2 },
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
  const chatPrompt = String(d.chatPrompt || '根據 meetings 裡面討論出來的規格幫我寫官網，品牌規範看 context，做完存到 projects');
  const shownChars = Math.ceil(chatPrompt.length * typeP);

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
          transform: `translateY(${d.topTitle || d.topPill ? 24 : -12}px)`,
        }}
      >
        {/* Left / Center File Tree Card (Starts centered, shifts left by -350px at shiftClause!) */}
        <div
          style={{
            width: 680,
            background: '#222226',
            border: `1.5px solid ${TOKENS.border}`,
            borderRadius: 20,
            padding: '28px 34px',
            boxShadow: '0 28px 70px rgba(0,0,0,0.52)',
            transform: `translateX(${interpolate(shiftP, [0, 1], [0, -370])}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, fontWeight: 800, color: TOKENS.inkSecondary, marginBottom: 18 }}>
            <span>📁</span>
            <span>{d.rootLabel || '雲端硬碟 · Shared Drive'}</span>
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
                    background: isLit ? TOKENS.amberSoft : 'rgba(255,255,255,0.025)',
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
                      background: '#323238',
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

        {/* Right Agent Dispatch Topology + Live Typewriter Bubble (Appears when tree shifts left) */}
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
          {/* Bot Dispatch Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 78, height: 78, borderRadius: '50%', background: '#F5F5F7', color: '#141416', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, border: `3px solid ${TOKENS.amber}` }}>
                ★
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: TOKENS.ink }}>{d.fromBot || '幕僚長'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 32, color: TOKENS.amber, fontWeight: 900 }}>───────→</div>
              <span style={{ padding: '4px 16px', borderRadius: 999, background: '#322F2B', border: `1px solid ${TOKENS.amberBorder}`, fontSize: 18, fontWeight: 800, color: TOKENS.amber }}>
                {d.dispatchBadge || '一句話派工'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 78, height: 78, borderRadius: '50%', background: TOKENS.emerald, color: '#0D1F17', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TOKENS.fontMono, fontSize: 28, fontWeight: 900 }}>
                {'</>'}
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: TOKENS.emerald }}>{d.toBot || 'Dev bot'}</span>
            </div>
          </div>

          {/* Live Chat Bubble */}
          {isTypingStarted && (
            <div
              style={{
                width: '100%',
                background: '#2B2B30',
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

// 16. annotated_ui_tour — 3-Zone App UI Tour with Moving Amber Spotlight + ① ② ③ Numbered Badges (grid_v3_grok.jpg)
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
        { badge: '1', title: '左側：專職 Bot 清單', subtitle: '釘選幕僚長與群組分區', items: ['★ Chief of Staff 幕僚長', '🎨 Chief of Design 設計主管', '📈 美股情報員', '💻 Dev 工程師'], stepClause: 0 },
        { badge: '2', title: '中間：自然語言對話區', subtitle: '交代目標或跳出確認小卡', items: ['「幫我規劃 Q4 產品路線圖」', '⚡ 主動彈出推薦任務選項', '✓ 敏感操作前跳出預覽確認卡'], stepClause: 1 },
        { badge: '3', title: '右側：Details · 資料庫 · 雲端電腦', subtitle: '隨時查看排程與遠端螢幕', items: ['⏰ Routines 定時與 Webhook', '📚 Library 共用專案文件', '🖥️ Computer 24h 雲端電腦畫面'], stepClause: 2 },
      ];

  const activeClause = getActiveClauseIdx(scene, frame, fps);
  let activeZoneIdx = 0;
  for (let i = 0; i < zones.length; i++) {
    const sc = zones[i].stepClause ?? i;
    if (activeClause >= sc) {
      activeZoneIdx = i;
    }
  }

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1580,
          height: 620,
          background: '#1B1B1E',
          borderRadius: 20,
          border: `1.5px solid ${TOKENS.border}`,
          padding: 20,
          display: 'grid',
          gridTemplateColumns: '380px 1fr 440px',
          gap: 18,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          transform: `translateY(${d.topTitle || d.topPill ? 24 : -16}px)`,
        }}
      >
        {zones.slice(0, 3).map((zn, idx) => {
          const zStartF = (zn.stepClause ?? idx) === 0 ? 2 : getBeatFrame(scene, zn.stepClause ?? idx, fps);
          const zp = spring({ frame: frame - zStartF, fps, config: SPRING_SNAPPY });
          const isLit = idx === activeZoneIdx;
          const isVisited = frame >= zStartF - 2;

          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                background: isLit ? '#282623' : '#222226',
                border: `2.5px solid ${isLit ? TOKENS.amber : isVisited ? 'rgba(245,158,11,0.28)' : TOKENS.border}`,
                borderRadius: 16,
                padding: '26px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                opacity: isLit ? 1 : isVisited ? 0.42 : 0.22,
                transform: `scale(${isLit ? interpolate(zp, [0, 1], [0.97, 1.015]) : 0.985})`,
                boxShadow: isLit ? '0 0 36px rgba(245, 158, 11, 0.22)' : 'none',
              }}
            >
              {/* Numbered Amber Circle Badge ① ② ③ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
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
                  <div style={{ fontSize: 26, fontWeight: 900, color: TOKENS.ink }}>{zn.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: TOKENS.amber }}>{zn.subtitle}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                {(zn.items || []).map((it, iIdx) => (
                  <div
                    key={iIdx}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: isLit && iIdx === 0 ? TOKENS.amberSoft : 'rgba(255,255,255,0.035)',
                      border: `1px solid ${isLit && iIdx === 0 ? TOKENS.amberBorder : 'rgba(255,255,255,0.06)'}`,
                      fontSize: 21,
                      fontWeight: 700,
                      color: TOKENS.ink,
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

// 17. org_tree_radiate — 1-to-Many Chief-of-Staff Hierarchy vs Messy Direct Lines OR Collision-Free Radial Mindmap
const PrimitiveOrgTreeRadiate: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'hierarchy_compare';

  if (mode === 'radial_mindmap') {
    const spokes: string[] = Array.isArray(d.spokes)
      ? d.spokes
      : ['Card.tsx', 'Nav.tsx', 'Form.tsx', 'Modal.tsx', 'Input.tsx', 'utils.ts', 'config.ts', 'styles.ts', 'api.ts', 'hooks.ts'];
    const enterP = spring({ frame, fps, config: SPRING_SNAPPY });

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 1400, height: 600, transform: 'translateY(22px)' }}>
          {/* SVG Radial Connecting Lines */}
          <svg width={1400} height={600} style={{ position: 'absolute', inset: 0 }}>
            {spokes.map((_, idx) => {
              const angle = (idx / spokes.length) * Math.PI * 2 - Math.PI / 2;
              const rx = 470;
              const ry = 215;
              const x2 = 700 + Math.cos(angle) * rx;
              const y2 = 300 + Math.sin(angle) * ry;
              const sp = spring({ frame: frame - idx * 3, fps, config: SPRING_SNAPPY });
              return (
                <line
                  key={idx}
                  x1={700}
                  y1={300}
                  x2={700 + (x2 - 700) * sp}
                  y2={300 + (y2 - 300) * sp}
                  stroke={TOKENS.coral}
                  strokeWidth={2.5}
                  strokeOpacity={0.65}
                />
              );
            })}
          </svg>

          {/* Surrounding File Nodes (Guaranteed Non-Overlapping Polar Ring!) */}
          {spokes.map((label, idx) => {
            const angle = (idx / spokes.length) * Math.PI * 2 - Math.PI / 2;
            const x = 700 + Math.cos(angle) * 470;
            const y = 300 + Math.sin(angle) * 215;
            const sp = spring({ frame: frame - idx * 3, fps, config: SPRING_SNAPPY });
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: x - 95,
                  top: y - 32,
                  width: 190,
                  height: 64,
                  borderRadius: 12,
                  background: '#2A2A2E',
                  border: `1.5px solid ${TOKENS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: TOKENS.fontMono,
                  fontSize: 21,
                  fontWeight: 700,
                  color: TOKENS.ink,
                  opacity: sp,
                  transform: `scale(${interpolate(sp, [0, 1], [0.8, 1])})`,
                  boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
                }}
              >
                <span>📄</span>
                <span>{label}</span>
              </div>
            );
          })}

          {/* Center Core Trigger Node */}
          <div
            style={{
              position: 'absolute',
              left: 700 - 150,
              top: 300 - 54,
              width: 300,
              height: 108,
              borderRadius: 18,
              background: TOKENS.amber,
              color: '#141416',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 900,
              boxShadow: '0 0 45px rgba(245, 158, 11, 0.5)',
              transform: `scale(${enterP})`,
            }}
          >
            {d.centerTitle || '改按鈕顏色'}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Default: "hierarchy_compare" (Left: No Middle Layer Messy vs Right: Chief of Staff Clean Tree)
  const rightF = getBeatFrame(scene, d.rightClause ?? 1, fps, 0.45);
  const leftP = spring({ frame, fps, config: SPRING_SNAPPY });
  const rightP = spring({ frame: frame - rightF, fps, config: SPRING_SNAPPY });
  const isRightActive = frame >= rightF - 2;
  const subBots: string[] = Array.isArray(d.subBots) ? d.subBots : ['晨間信箱秘書', '美股情報員', '全端工程師'];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 56, transform: 'translateY(22px)' }}>
        {/* Left: No Middle Layer (Management Fatigue) */}
        <div
          style={{
            width: 640,
            height: 520,
            background: '#232225',
            border: `2px solid ${isRightActive ? TOKENS.border : TOKENS.coral}`,
            borderRadius: 22,
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: isRightActive ? 0.42 : leftP,
          }}
        >
          <div style={{ padding: '6px 20px', borderRadius: 999, background: TOKENS.coralSoft, border: `1px solid ${TOKENS.coralBorder}`, color: TOKENS.coral, fontSize: 22, fontWeight: 800 }}>
            {d.leftBadge || '✗ 沒中間層：每件事都要自己想找誰（管理疲勞）'}
          </div>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#38383E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900 }}>
            你
          </div>
          <svg width={520} height={130}>
            {[60, 160, 260, 360, 460].map((x, i) => (
              <line key={i} x1={260} y1={10} x2={x} y2={120} stroke={TOKENS.coral} strokeWidth={2} strokeDasharray="5 5" />
            ))}
          </svg>
          <div style={{ display: 'flex', gap: 22 }}>
            {['Bot 1', 'Bot 2', 'Bot 3', 'Bot 4', 'Bot 5'].map((b, i) => (
              <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: '#2F2F35', fontSize: 20, fontWeight: 700, color: TOKENS.inkSecondary }}>
                🤖 {b}
              </div>
            ))}
          </div>
        </div>

        {/* Right: With Chief of Staff Middle Layer */}
        <div
          style={{
            width: 680,
            height: 520,
            background: '#252827',
            border: `2.5px solid ${TOKENS.emerald}`,
            borderRadius: 22,
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: isRightActive ? rightP : 0.15,
            transform: `scale(${isRightActive ? interpolate(rightP, [0, 1], [0.95, 1]) : 0.95})`,
            boxShadow: isRightActive ? '0 24px 64px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          <div style={{ padding: '6px 22px', borderRadius: 999, background: TOKENS.emeraldSoft, border: `1px solid ${TOKENS.emeraldBorder}`, color: TOKENS.emerald, fontSize: 22, fontWeight: 800 }}>
            {d.rightBadge || '✓ 有中間層：只對幕僚長下令，自動拆單派工'}
          </div>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: TOKENS.amber, color: '#141416', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900 }}>
            你
          </div>
          <div style={{ fontSize: 26, color: TOKENS.amber, fontWeight: 900 }}>↓</div>
          <div style={{ padding: '12px 32px', borderRadius: 999, background: '#F5F5F7', color: '#141416', fontSize: 26, fontWeight: 900, border: `3px solid ${TOKENS.amber}` }}>
            ★ {d.chiefTitle || '幕僚長 (Chief of Staff)'}
          </div>
          <div style={{ fontSize: 24, color: TOKENS.emerald, fontWeight: 900 }}>↙ 　　 ↓ 　　 ↘</div>
          <div style={{ display: 'flex', gap: 18 }}>
            {subBots.map((sb, i) => (
              <div key={i} style={{ padding: '14px 22px', borderRadius: 14, background: '#1A2E26', border: `1.5px solid ${TOKENS.emeraldBorder}`, fontSize: 22, fontWeight: 800, color: TOKENS.ink }}>
                🤖 {sb}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 18. pipeline_timeline_flow — 9-Step Domino Error Contagion Pipeline OR Race Condition Timeline
const PrimitivePipelineTimelineFlow: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'domino_pipeline';

  if (mode === 'race_timeline') {
    const attackF = getBeatFrame(scene, d.attackClause ?? 1, fps, 0.42);
    const fixF = getBeatFrame(scene, d.fixClause ?? 2, fps, 0.72);
    const p1 = spring({ frame, fps, config: SPRING_SNAPPY });
    const p2 = spring({ frame: frame - attackF, fps, config: SPRING_SNAPPY });
    const p3 = spring({ frame: frame - fixF, fps, config: SPRING_SNAPPY });
    const isFixed = frame >= fixF - 2;

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 1420, display: 'flex', flexDirection: 'column', gap: 32, transform: 'translateY(22px)' }}>
          {/* Horizontal Timeline Track */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#222226', padding: '36px 48px', borderRadius: 22, border: `2px solid ${isFixed ? TOKENS.emerald : TOKENS.border}`, opacity: p1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: '12px 26px', borderRadius: 12, background: TOKENS.emeraldSoft, border: `2px solid ${TOKENS.emerald}`, color: TOKENS.emerald, fontSize: 26, fontWeight: 900 }}>
                ① 查餘額：剩 10 點 ✓
              </div>
              <span style={{ fontSize: 19, color: TOKENS.inkSecondary }}>T = 0.00s</span>
            </div>

            <div style={{ flex: 1, margin: '0 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: '10px 26px', borderRadius: 999, background: isFixed ? TOKENS.emeraldSoft : TOKENS.coralSoft, border: `2px solid ${isFixed ? TOKENS.emerald : TOKENS.coral}`, color: isFixed ? TOKENS.emerald : TOKENS.coral, fontSize: 24, fontWeight: 900 }}>
                {isFixed ? '🔒 立即預扣凍結 8 點（可用餘額秒變 2 點）' : '⏱ 5.0 秒外部 AI 運算空檔（點數還沒扣！）'}
              </div>
              <div style={{ width: '100%', height: 8, background: isFixed ? TOKENS.emerald : TOKENS.coral, borderRadius: 999 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: '12px 26px', borderRadius: 12, background: '#2F2F35', border: `2px solid ${TOKENS.border}`, color: TOKENS.ink, fontSize: 26, fontWeight: 900 }}>
                ③ 運算完成才扣點
              </div>
              <span style={{ fontSize: 19, color: TOKENS.inkSecondary }}>T = 5.00s</span>
            </div>
          </div>

          {/* Attack vs Defense Bottom Card */}
          <div style={{ display: 'flex', gap: 28 }}>
            <div style={{ flex: 1, padding: '26px 32px', borderRadius: 18, background: '#2A2022', border: `2px solid ${TOKENS.coral}`, opacity: frame >= attackF ? p2 : 0.2 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: TOKENS.coral, marginBottom: 8 }}>
                ⚡ 攻擊者腳本：同一毫秒連發 10 個請求
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: TOKENS.inkSecondary }}>
                10 個請求同時查餘額都看到「剩 10 點」➔ 只付 8 點的錢，白嫖 80 點昂貴算力！
              </div>
            </div>

            {isFixed && (
              <div style={{ flex: 1, padding: '26px 32px', borderRadius: 18, background: '#1B2B24', border: `2px solid ${TOKENS.emerald}`, opacity: p3 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: TOKENS.emerald, marginBottom: 8 }}>
                  ✓ 預扣防禦：像飯店刷卡預授權
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: TOKENS.ink }}>
                  第 1 個請求進來秒凍 8 點 ➔ 後面 9 個請求看到餘額只剩 2 點當場全部攔截！
                </div>
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Default: "domino_pipeline" (9-Step Rigid Framework Domino Error Contagion, grid_v2_grill.jpg)
  const steps: string[] = Array.isArray(d.steps)
    ? d.steps
    : ['釐清目標', '寫規格', '寫計畫', '拆任務', '設計架構', '寫測試', '實作程式碼', '審查', '收尾'];
  const failClause = d.failClause ?? 1;
  const failF = getBeatFrame(scene, failClause, fps, 0.45);
  const failStartIdx = d.failStartIndex ?? 1;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, transform: 'translateY(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {steps.map((st, idx) => {
            const enterP = spring({ frame: frame - idx * 3, fps, config: SPRING_SNAPPY });
            const dominoFrame = failF + Math.max(0, idx - failStartIdx) * 5;
            const isInfected = frame >= failF && idx >= failStartIdx && frame >= dominoFrame;

            return (
              <React.Fragment key={idx}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: enterP }}>
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 20,
                      background: isInfected ? TOKENS.coralSoft : '#2C2C31',
                      border: `2.5px solid ${isInfected ? TOKENS.coral : TOKENS.amber}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isInfected ? '0 0 28px rgba(239, 68, 68, 0.45)' : 'none',
                    }}
                  >
                    <span style={{ fontFamily: TOKENS.fontMono, fontSize: 28, fontWeight: 900, color: isInfected ? TOKENS.coral : TOKENS.amber }}>
                      {isInfected ? '✗' : idx + 1}
                    </span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: isInfected ? TOKENS.coral : TOKENS.ink }}>{st}</span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    style={{
                      width: 38,
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
              fontSize: 30,
              fontWeight: 900,
              color: TOKENS.coral,
            }}
          >
            {d.failBanner || '⚠️ 死板長流程的致命傷：前面一步定歪，錯誤順著整條線傳染，整條都得重跑！'}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 19. defense_boundary_flow — Two Arched Doors (AuthN vs AuthZ) OR Trust Boundary Architecture (grid_v4_sec.jpg)
const PrimitiveDefenseBoundaryFlow: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'two_arches';

  if (mode === 'trust_boundary') {
    const step2F = getBeatFrame(scene, 1, fps, 0.45);
    const p1 = spring({ frame, fps, config: SPRING_SNAPPY });
    const p2 = spring({ frame: frame - step2F, fps, config: SPRING_SNAPPY });

    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36, transform: 'translateY(22px)' }}>
          {/* Left Untrusted Browser Zone */}
          <div
            style={{
              width: 540,
              height: 460,
              borderRadius: 22,
              background: 'rgba(239, 68, 68, 0.06)',
              border: `2.5px dashed ${TOKENS.coral}`,
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: p1,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 900, color: TOKENS.coral }}>⚠️ 外部不可控區（用戶瀏覽器）</div>
            <div style={{ padding: '22px', borderRadius: 16, background: '#262223', border: `1.5px solid ${TOKENS.coralBorder}` }}>
              <div style={{ fontSize: 25, fontWeight: 800, color: TOKENS.ink, marginBottom: 8 }}>🌐 前端網頁 (Client Browser)</div>
              <div style={{ fontSize: 20, color: TOKENS.inkSecondary }}>用戶隨時可打開 F12 竄改扣點數字或偽造請求</div>
            </div>
            <div style={{ padding: '14px 20px', borderRadius: 12, background: TOKENS.coralSoft, color: TOKENS.coral, fontSize: 22, fontWeight: 800, textAlign: 'center' }}>
              ✗ 絕不能把扣點與權限檢查寫在前端
            </div>
          </div>

          {/* Center Trust Boundary Vertical Line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: '8px 20px', borderRadius: 999, background: TOKENS.amber, color: '#141416', fontSize: 20, fontWeight: 900 }}>
              信任邊界 Trust Boundary
            </div>
            <div style={{ width: 4, height: 340, borderLeft: `4px dashed ${TOKENS.amber}` }} />
          </div>

          {/* Right Trusted Backend Zone */}
          <div
            style={{
              width: 580,
              height: 460,
              borderRadius: 22,
              background: 'rgba(16, 185, 129, 0.06)',
              border: `2.5px solid ${TOKENS.emerald}`,
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: p2,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 900, color: TOKENS.emerald }}>🛡️ 內部安全區（你的雲端主機）</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '18px 22px', borderRadius: 14, background: '#1E2824', border: `1.5px solid ${TOKENS.emeraldBorder}`, fontSize: 24, fontWeight: 800 }}>
                🖥️ 後端伺服器（親自重算金額與權限）
              </div>
              <div style={{ padding: '18px 22px', borderRadius: 14, background: '#1E2824', border: `1.5px solid ${TOKENS.emeraldBorder}`, fontSize: 24, fontWeight: 800 }}>
                🗄️ 資料庫底層（RLS 資料列層級隔離）
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderRadius: 12, background: TOKENS.emeraldSoft, color: TOKENS.emerald, fontSize: 22, fontWeight: 800, textAlign: 'center' }}>
              ✓ 外部包裹一律安檢，核心資產自我防衛
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

// 22. metaphor_canvas — Architectural Cross-Section Metaphor ("淺模組 = 沒有大門的房子") OR 36-Knob Neural Panel
const PrimitiveMetaphorCanvas: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode = d.mode || 'no_door_house';

  if (mode === 'rotary_knobs') {
    const cols = 9;
    const rows = 3;
    const total = cols * rows;
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, transform: 'translateY(20px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 96px)`, gap: 22, padding: '36px 44px', borderRadius: 24, background: '#222226', border: `2px solid ${TOKENS.border}` }}>
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
  }

  // Default: "no_door_house" (Replicating grill_11_45.jpg Cross-Section House without a Front Door!)
  const enterP = spring({ frame, fps, config: SPRING_SNAPPY });
  const callout1F = getBeatFrame(scene, 1, fps, 0.38);
  const callout2F = getBeatFrame(scene, Math.min(2, scene.clauses.length - 1), fps, 0.68);
  const c1P = spring({ frame: frame - callout1F, fps, config: SPRING_SNAPPY });
  const c2P = spring({ frame: frame - callout2F, fps, config: SPRING_SNAPPY });

  const rooms = [
    { name: '🍳 廚房 (計算折扣)', entry: '⚠️ 走左邊爬窗戶進', tone: TOKENS.amber },
    { name: '🛋️ 客廳 (驗證信用卡)', entry: '⚠️ 從屋頂鑽煙囪進', tone: TOKENS.coral },
    { name: '🛏️ 臥室 (扣除庫存)', entry: '⚠️ 記住獨立暗號進', tone: TOKENS.amber },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: 'translateY(24px)', opacity: enterP }}>
        {/* Warning Pill */}
        <div style={{ padding: '8px 26px', borderRadius: 999, background: '#332421', border: `1.5px solid ${TOKENS.coral}`, color: TOKENS.amber, fontSize: 23, fontWeight: 800 }}>
          {d.warningPill || '⚠️ 沒有統一大門：主程式必須死記每個房間的獨立路線（溝通成本極高）'}
        </div>

        {/* House Cross-Section Structure */}
        <div style={{ position: 'relative', width: 1120, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Roof Triangle */}
          <svg width={1120} height={110} viewBox="0 0 1120 110">
            <polygon points="560,8 120,108 1000,108" fill="#2A2320" stroke={TOKENS.amber} strokeWidth="3" />
            <rect x="740" y="18" width="54" height="80" fill="#3D2622" stroke={TOKENS.coral} strokeWidth="2.5" />
          </svg>

          {/* Rooms Grid */}
          <div
            style={{
              width: 880,
              background: '#261F1D',
              border: `3px solid ${TOKENS.amber}`,
              borderTop: 'none',
              borderRadius: '0 0 18px 18px',
              padding: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}
          >
            {rooms.map((rm, idx) => (
              <div
                key={idx}
                style={{
                  background: '#332824',
                  border: `2px solid ${rm.tone}`,
                  borderRadius: 14,
                  padding: '24px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 25, fontWeight: 900, color: TOKENS.ink }}>{rm.name}</div>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.16)',
                    border: `1.5px solid ${TOKENS.coral}`,
                    fontSize: 20,
                    fontWeight: 800,
                    color: TOKENS.coral,
                    opacity: idx === 0 ? c1P : c2P,
                  }}
                >
                  {rm.entry}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Blocked Front Door Indicator */}
          <div
            style={{
              marginTop: 18,
              padding: '12px 34px',
              borderRadius: 12,
              background: TOKENS.coralSoft,
              border: `2px solid ${TOKENS.coral}`,
              fontSize: 26,
              fontWeight: 900,
              color: TOKENS.coral,
              opacity: c2P,
            }}
          >
            🚫 缺少統一大門（主程式被迫在 5 個房間之間瘋狂跳轉，塞爆 AI Context Window）
          </div>
        </div>
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

  const activeCaption = payload.captions.find(
    (c) => curSec >= c.start - 0.04 && curSec <= c.end + 0.14
  );

  const chapIdxStr = `${String(payload.chapterIndex).padStart(2, '0')} / ${String(payload.totalChapters).padStart(2, '0')}`;

  return (
    <AbsoluteFill style={{ backgroundColor: TOKENS.canvas, fontFamily: TOKENS.fontSans, color: TOKENS.ink }}>
      {payload.audioFile ? <Audio src={staticFile(payload.audioFile)} /> : null}

      {/* Continuous Global 3px Top Amber Progress Bar (Seamless across multi-chapter 10-min videos!) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3.5,
          background: '#353538',
          zIndex: 50,
        }}
      >
        <div style={{ width: `${globalPct}%`, height: '100%', background: TOKENS.amber }} />
      </div>

      {/* Top-Left Chapter HUD */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 50,
        }}
      >
        <span style={{ fontFamily: TOKENS.fontMono, fontSize: 20, fontWeight: 800, color: TOKENS.amber }}>
          {chapIdxStr}
        </span>
        <span style={{ fontSize: 20, fontWeight: 600, color: TOKENS.inkSecondary }}>
          {payload.chapterTitle}
        </span>
      </div>

      {/* Data-Driven 22-Primitive Scene Router + Universal Thesis Header */}
      {payload.scenes.map((sc) => {
        const fromF = Math.round(sc.start * fps);
        const durF = Math.max(1, Math.round((sc.end - sc.start) * fps));
        return (
          <Sequence key={sc.id} from={fromF} durationInFrames={durF}>
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
            {(sc.primitive === 'traffic_gate_box' || sc.primitive === 'deep_module_box') && <PrimitiveTrafficGateBox scene={sc} />}
            {sc.primitive === 'split_tree_chat_dispatch' && <PrimitiveSplitTreeChatDispatch scene={sc} />}
            {sc.primitive === 'annotated_ui_tour' && <PrimitiveAnnotatedUiTour scene={sc} />}
            {sc.primitive === 'org_tree_radiate' && <PrimitiveOrgTreeRadiate scene={sc} />}
            {sc.primitive === 'pipeline_timeline_flow' && <PrimitivePipelineTimelineFlow scene={sc} />}
            {sc.primitive === 'defense_boundary_flow' && <PrimitiveDefenseBoundaryFlow scene={sc} />}
            {sc.primitive === 'row_permission_table' && <PrimitiveRowPermissionTable scene={sc} />}
            {sc.primitive === 'acronym_token_slot' && <PrimitiveAcronymTokenSlot scene={sc} />}
            {sc.primitive === 'metaphor_canvas' && <PrimitiveMetaphorCanvas scene={sc} />}
          </Sequence>
        );
      })}

      {/* Editorial Dark Matte Subtitle Pill */}
      {activeCaption && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 58,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 60,
          }}
        >
          <div
            style={{
              background: TOKENS.subtitleBg,
              borderRadius: 10,
              padding: '12px 34px',
              fontSize: 40,
              fontWeight: 700,
              color: TOKENS.ink,
              letterSpacing: '0.015em',
              boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
              maxWidth: '72%',
              textAlign: 'center',
            }}
          >
            {activeCaption.displayText}
          </div>
        </div>
      )}

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
