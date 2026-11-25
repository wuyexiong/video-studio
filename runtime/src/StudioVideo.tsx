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
  | 'traffic_gate_box';

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

      {/* Data-Driven 10-Primitive Scene Router */}
      {payload.scenes.map((sc) => {
        const fromF = Math.round(sc.start * fps);
        const durF = Math.max(1, Math.round((sc.end - sc.start) * fps));
        return (
          <Sequence key={sc.id} from={fromF} durationInFrames={durF}>
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
