import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { StudioScene, Tone } from './StudioVideo';

const TOKENS = {
  canvas: '#262626',
  card: '#323232',
  cardCode: '#2B2B2B',
  cardElevated: '#3B3B3D',
  border: '#3D3D3D',
  borderCrisp: '#454549',
  dashed: '#595959',
  ink: '#FFFFFF',
  inkSecondary: '#A3A3A3',
  inkMuted: '#7A7A7A',
  amber: '#FE8A00',
  amberSoft: 'rgba(254, 138, 0, 0.14)',
  amberBorder: 'rgba(254, 138, 0, 0.52)',
  emerald: '#139F6B',
  emeraldMint: '#17B7A6',
  emeraldNeon: '#1EC286',
  emeraldSoft: 'rgba(19, 159, 107, 0.16)',
  emeraldBorder: 'rgba(23, 183, 166, 0.48)',
  coral: '#E05549',
  coralSoft: 'rgba(224, 85, 73, 0.16)',
  coralBorder: 'rgba(224, 85, 73, 0.52)',
  slate: '#6E82A2',
  slateLight: '#93B0D8',
  slateFill: '#243758',
  fontSans:
    '"Noto Sans TC", "PingFang TC", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", -apple-system, sans-serif',
  fontMono: '"JetBrains Mono", "SF Mono", "Menlo", "Noto Sans Mono CJK SC", ui-monospace, monospace',
};

const SPRING_SNAPPY = { damping: 28, stiffness: 185, mass: 0.85, overshootClamping: true };
const SPRING_SILKY = { damping: 32, stiffness: 145, mass: 0.92, overshootClamping: true };
const SPRING_BOUNCE = { damping: 22, stiffness: 210, mass: 0.78, overshootClamping: false };

function settle(p: number): number {
  return p >= 0.995 ? 1 : p;
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

function tonePalette(tone: Tone = 'neutral') {
  if (tone === 'amber') return { fg: TOKENS.amber, bg: TOKENS.amberSoft, border: TOKENS.amberBorder };
  if (tone === 'emerald') return { fg: TOKENS.emeraldMint, bg: TOKENS.emeraldSoft, border: TOKENS.emeraldBorder };
  if (tone === 'coral') return { fg: TOKENS.coral, bg: TOKENS.coralSoft, border: TOKENS.coralBorder };
  return { fg: TOKENS.ink, bg: TOKENS.card, border: TOKENS.border };
}

// ============================================================================
// Universal Code-Drawn Geometric Vector Icon Kit (100% Zero Emoji!)
// ============================================================================
export const StudioVectorIcon: React.FC<{
  name?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}> = ({ name = 'layers', color = TOKENS.ink, size = 24, strokeWidth = 2.2 }) => {
  const k = String(name || 'layers').trim().toLowerCase();
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    style: { flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' } as React.CSSProperties,
  };

  if (k === 'check' || k === 'pass' || k === 'ok') {
    return (
      <svg {...common}>
        <polyline points="4.5 12.5 9.5 17.5 19.5 6.5" stroke={color} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (k === 'x' || k === 'close' || k === 'fail' || k === 'error') {
    return (
      <svg {...common}>
        <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={strokeWidth + 0.3} strokeLinecap="round" />
        <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={strokeWidth + 0.3} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'lock') {
    return (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="10" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
        <path d="M8 11V7.5C8 5.29 9.79 3.5 12 3.5C14.21 3.5 16 5.29 16 7.5V11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'git-branch' || k === 'branch') {
    return (
      <svg {...common}>
        <line x1="6" y1="3" x2="6" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="18" cy="6" r="3" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="6" cy="18" r="3" stroke={color} strokeWidth={strokeWidth} />
        <path d="M18 9C18 13.5 14 15 6 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'git-pr' || k === 'pr' || k === 'pull-request') {
    return (
      <svg {...common}>
        <circle cx="6" cy="6" r="2.8" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="6" cy="18" r="2.8" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="18" cy="18" r="2.8" stroke={color} strokeWidth={strokeWidth} />
        <line x1="6" y1="8.8" x2="6" y2="15.2" stroke={color} strokeWidth={strokeWidth} />
        <path d="M13 6H15.5C16.88 6 18 7.12 18 8.5V15.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <polyline points="15 3.5 12.5 6 15 8.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (k === 'trash' || k === 'garbage' || k === 'delete') {
    return (
      <svg {...common}>
        <polyline points="4 7 20 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M9 7V4.5C9 3.95 9.45 3.5 10 3.5H14C14.55 3.5 15 3.95 15 4.5V7" stroke={color} strokeWidth={strokeWidth} />
        <path d="M6.5 7L7.5 19.5C7.55 20.3 8.2 21 9 21H15C15.8 21 16.45 20.3 16.5 19.5L17.5 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'alert' || k === 'warning' || k === 'danger') {
    return (
      <svg {...common}>
        <path d="M10.3 3.9L2.6 17.2C1.9 18.4 2.8 19.9 4.2 19.9H19.8C21.2 19.9 22.1 18.4 21.4 17.2L13.7 3.9C13 2.7 11 2.7 10.3 3.9Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        <line x1="12" y1="9.5" x2="12" y2="13.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="12" cy="16.8" r="1.1" fill={color} />
      </svg>
    );
  }
  if (k === 'sparkles' || k === 'ai') {
    return (
      <svg {...common}>
        <path d="M12 3L14.1 8.9L20 11L14.1 13.1L12 19L9.9 13.1L4 11L9.9 8.9L12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        <path d="M19 3V6M17.5 4.5H20.5" stroke={color} strokeWidth={strokeWidth - 0.3} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'bot' || k === 'agent' || k === 'robot') {
    return (
      <svg {...common}>
        <rect x="4" y="8" width="16" height="12" rx="3.5" stroke={color} strokeWidth={strokeWidth} />
        <line x1="12" y1="4" x2="12" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="12" cy="3.5" r="1.5" fill={color} />
        <circle cx="9" cy="13.5" r="1.4" fill={color} />
        <circle cx="15" cy="13.5" r="1.4" fill={color} />
        <line x1="9.5" y1="17" x2="14.5" y2="17" stroke={color} strokeWidth={strokeWidth - 0.3} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'eye') {
    return (
      <svg {...common}>
        <path d="M2.5 12C5 7.2 8.4 5 12 5C15.6 5 19 7.2 21.5 12C19 16.8 15.6 19 12 19C8.4 19 5 16.8 2.5 12Z" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    );
  }
  if (k === 'stopwatch' || k === 'timer' || k === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="13.5" r="8" stroke={color} strokeWidth={strokeWidth} />
        <line x1="9.5" y1="2.5" x2="14.5" y2="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="12" y1="2.5" x2="12" y2="5.5" stroke={color} strokeWidth={strokeWidth} />
        <line x1="12" y1="13.5" x2="15.5" y2="10.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'globe' || k === 'web' || k === 'browser') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
        <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth={strokeWidth - 0.3} />
        <ellipse cx="12" cy="12" rx="4.2" ry="9" stroke={color} strokeWidth={strokeWidth - 0.3} />
      </svg>
    );
  }
  if (k === 'globe-off' || k === 'no-browser') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.8" stroke={color} strokeWidth={strokeWidth - 0.2} opacity={0.62} />
        <line x1="3.5" y1="12" x2="20.5" y2="12" stroke={color} strokeWidth={strokeWidth - 0.4} opacity={0.62} />
        <line x1="4" y1="20" x2="20" y2="4" stroke={TOKENS.coral} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'package' || k === 'box' || k === 'bundle') {
    return (
      <svg {...common}>
        <path d="M12 2.8L20 7.3V16.7L12 21.2L4 16.7V7.3L12 2.8Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        <polyline points="4.2 7.5 12 12 19.8 7.5" stroke={color} strokeWidth={strokeWidth - 0.2} />
        <line x1="12" y1="12" x2="12" y2="21" stroke={color} strokeWidth={strokeWidth - 0.2} />
      </svg>
    );
  }
  if (k === 'cog' || k === 'gear' || k === 'build') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3.4" stroke={color} strokeWidth={strokeWidth} />
        <path d="M12 2.8V5.2M12 18.8V21.2M2.8 12H5.2M18.8 12H21.2M5.5 5.5L7.2 7.2M16.8 16.8L18.5 18.5M18.5 5.5L16.8 7.2M7.2 16.8L5.5 18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'scale' || k === 'judge' || k === 'balance') {
    return (
      <svg {...common}>
        <line x1="12" y1="3.5" x2="12" y2="20.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="5" y1="7" x2="19" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M5.5 7L3 13.5H8L5.5 7Z" stroke={color} strokeWidth={strokeWidth - 0.3} strokeLinejoin="round" />
        <path d="M18.5 7L16 13.5H21L18.5 7Z" stroke={color} strokeWidth={strokeWidth - 0.3} strokeLinejoin="round" />
        <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'link' || k === 'connector') {
    return (
      <svg {...common}>
        <path d="M10 14L14 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M7.5 16.5L6 18C4.3 19.7 4.3 22 6 22" stroke="none" />
        <path d="M14.5 6.5L16.5 4.5C18.2 2.8 20.8 2.8 22.2 4.5" stroke="none" />
        <rect x="3.5" y="11.5" width="8.5" height="6" rx="3" transform="rotate(-45 3.5 11.5)" stroke={color} strokeWidth={strokeWidth} />
        <rect x="11.5" y="6.5" width="8.5" height="6" rx="3" transform="rotate(-45 11.5 6.5)" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    );
  }
  if (k === 'zap' || k === 'bolt' || k === 'auto') {
    return (
      <svg {...common}>
        <polygon points="13.5 2.5 5.5 13.5 11.5 13.5 10.5 21.5 18.5 10.5 12.5 10.5 13.5 2.5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </svg>
    );
  }
  if (k === 'user' || k === 'person' || k === 'human') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.8" stroke={color} strokeWidth={strokeWidth} />
        <path d="M5 20C5 16.4 8.1 14 12 14C15.9 14 19 16.4 19 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 3L20 6.5V12.5C20 17.5 16.6 20.8 12 22.2C7.4 20.8 4 17.5 4 12.5V6.5L12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </svg>
    );
  }
  if (k === 'bug') {
    return (
      <svg {...common}>
        <rect x="7.5" y="7.5" width="9" height="11.5" rx="4.5" stroke={color} strokeWidth={strokeWidth} />
        <path d="M9.5 7.5V6C9.5 4.6 10.6 3.5 12 3.5C13.4 3.5 14.5 4.6 14.5 6V7.5" stroke={color} strokeWidth={strokeWidth - 0.2} />
        <line x1="3.5" y1="11" x2="7.5" y2="11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="16.5" y1="11" x2="20.5" y2="11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="4" y1="16" x2="7.5" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="20" y1="16" x2="16.5" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  }
  if (k === 'cloud') {
    return (
      <svg {...common}>
        <path d="M6.5 18.5H17.5C20 18.5 21.8 16.7 21.8 14.3C21.8 12.1 20.2 10.3 18 10.1C17.2 6.8 14.3 4.5 10.8 4.5C6.8 4.5 3.6 7.7 3.6 11.7C3.6 12 3.6 12.3 3.7 12.6C2.4 13.3 1.8 14.6 1.8 16C1.8 17.5 3.1 18.5 4.8 18.5H6.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </svg>
    );
  }
  if (k === 'monitor' || k === 'pc' || k === 'desktop') {
    return (
      <svg {...common}>
        <rect x="2.5" y="4" width="19" height="13" rx="2.2" stroke={color} strokeWidth={strokeWidth} />
        <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="20.5" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    );
  }
  if (k === 'folder') {
    return (
      <svg {...common}>
        <path d="M3 6.5C3 5.4 3.9 4.5 5 4.5H9.2L11.4 7H19C20.1 7 21 7.9 21 9V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V6.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </svg>
    );
  }
  if (k === 'file' || k === 'code' || k === 'file-code') {
    return (
      <svg {...common}>
        <path d="M6 3.5H14L19 8.5V19.5C19 20.3 18.3 21 17.5 21H6C5.2 21 4.5 20.3 4.5 19.5V5C4.5 4.2 5.2 3.5 6 3.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        <polyline points="13.8 3.5 13.8 8.8 19 8.8" stroke={color} strokeWidth={strokeWidth - 0.2} />
      </svg>
    );
  }
  if (k === 'infinity' || k === 'loop') {
    return (
      <svg {...common}>
        <path d="M18.2 8.8C16.5 8.8 15.1 10 12 13.2C8.9 16.4 7.5 17.6 5.8 17.6C3.7 17.6 2.2 15.9 2.2 13.2C2.2 10.5 3.7 8.8 5.8 8.8C7.5 8.8 8.9 10 12 13.2C15.1 16.4 16.5 17.6 18.2 17.6C20.3 17.6 21.8 15.9 21.8 13.2C21.8 10.5 20.3 8.8 18.2 8.8Z" stroke={color} strokeWidth={strokeWidth + 0.3} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <polygon points="12 3 21 8 12 13 3 8 12 3" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <polyline points="3 13 12 18 21 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="3 17.5 12 22.5 21 17.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ============================================================================
// NEW PRIMITIVE 1: surface_vs_background_iceberg
// ============================================================================
export const PrimitiveSurfaceVsBackgroundIceberg: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};

  const surfaceSteps: Array<{ title: string; subtitle?: string; icon?: string }> = Array.isArray(d.surfaceSteps)
    ? d.surfaceSteps
    : [
        { title: 'Step 01', icon: 'sparkles' },
        { title: 'Step 02', icon: 'git-pr' },
        { title: 'Step 03', icon: 'package' },
      ];
  const hiddenChecklist: string[] = Array.isArray(d.hiddenChecklist) ? d.hiddenChecklist : [];
  const hiddenRightFlow: Array<{ label: string; icon?: string }> = Array.isArray(d.hiddenRightFlow)
    ? d.hiddenRightFlow
    : [];

  const revealF = getBeatFrame(scene, d.revealClause ?? 1, fps, 0.36);
  const groupF = getBeatFrame(scene, d.groupClause ?? Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.68);

  const enterP = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const revealP = settle(spring({ frame: frame - revealF, fps, config: SPRING_SILKY }));
  const groupP = settle(spring({ frame: frame - groupF, fps, config: SPRING_SNAPPY }));
  const isGrouped = groupP > 0.5;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1380,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          transform: 'translateY(-14px)',
          opacity: enterP,
        }}
      >
        {d.surfaceHeading && revealP < 0.85 && (
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              color: TOKENS.amber,
              opacity: 1 - revealP,
              height: interpolate(revealP, [0, 1], [54, 0]),
              overflow: 'hidden',
            }}
          >
            {d.surfaceHeading}
          </div>
        )}

        {/* Top Surface Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            transform: `translateY(${interpolate(revealP, [0, 1], [34, 0]).toFixed(2)}px) scale(${interpolate(
              revealP,
              [0, 1],
              [1.04, 0.92]
            ).toFixed(4)})`,
            opacity: interpolate(revealP, [0, 1], [1, 0.68]),
          }}
        >
          {surfaceSteps.map((st, idx) => {
            const stP = settle(spring({ frame: frame - idx * 5, fps, config: SPRING_SNAPPY }));
            return (
              <React.Fragment key={idx}>
                <div
                  style={{
                    width: 310,
                    minHeight: 156,
                    background: TOKENS.card,
                    border: `1.5px solid ${TOKENS.borderCrisp}`,
                    borderRadius: 20,
                    padding: '22px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    position: 'relative',
                    opacity: stP,
                    boxShadow: '0 20px 48px rgba(0,0,0,0.4)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 16,
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: TOKENS.amber,
                      color: '#141416',
                      fontFamily: TOKENS.fontMono,
                      fontSize: 16,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <StudioVectorIcon name={st.icon || 'layers'} color={TOKENS.amber} size={38} />
                  <div style={{ fontSize: 27, fontWeight: 800, color: TOKENS.ink, textAlign: 'center' }}>{st.title}</div>
                  {st.subtitle && (
                    <div style={{ fontSize: 17, fontWeight: 600, color: TOKENS.inkSecondary }}>{st.subtitle}</div>
                  )}
                </div>
                {idx < surfaceSteps.length - 1 && (
                  <svg width="42" height="24" viewBox="0 0 42 24" fill="none">
                    <line x1="2" y1="12" x2="34" y2="12" stroke={TOKENS.inkMuted} strokeWidth="2.4" />
                    <polyline points="27 6 35 12 27 18" stroke={TOKENS.inkMuted} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Hidden Background Iceberg Layer */}
        <div
          style={{
            width: 1240,
            minHeight: 330,
            borderRadius: 24,
            border: isGrouped ? `2.5px solid ${TOKENS.amber}` : `2px dashed ${TOKENS.dashed}`,
            background: isGrouped ? 'rgba(254, 138, 0, 0.05)' : 'rgba(255, 255, 255, 0.018)',
            boxShadow: isGrouped ? '0 24px 64px rgba(0,0,0,0.5), 0 0 36px rgba(254,138,0,0.14)' : 'none',
            padding: '40px 56px 32px',
            position: 'relative',
            opacity: revealP,
            transform: `translateY(${interpolate(revealP, [0, 1], [28, 0]).toFixed(2)}px)`,
            display: 'grid',
            gridTemplateColumns: hiddenRightFlow.length > 0 ? '1.15fr 0.85fr' : '1fr',
            gap: 48,
            alignItems: 'center',
          }}
        >
          {/* Top-Left Layer Pill */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: 32,
              padding: '6px 22px',
              borderRadius: 999,
              background: isGrouped ? TOKENS.amber : '#38383C',
              border: `1.5px solid ${isGrouped ? TOKENS.amber : TOKENS.borderCrisp}`,
              color: isGrouped ? '#141416' : TOKENS.inkSecondary,
              fontFamily: TOKENS.fontMono,
              fontSize: 21,
              fontWeight: 900,
              letterSpacing: '0.02em',
            }}
          >
            {isGrouped ? d.systemBadge || d.backgroundLabel || 'SYSTEM' : d.backgroundLabel || 'BACKGROUND'}
          </div>

          {/* Left Automated Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(hiddenChecklist.length > 0 ? hiddenChecklist : ['Stage Check 01', 'Stage Check 02', 'Stage Check 03']).map(
              (item, idx) => {
                const chkF = revealF + 6 + idx * 5;
                const checked = frame >= chkF;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: checked ? TOKENS.emerald : 'transparent',
                        border: `2px solid ${checked ? TOKENS.emeraldNeon : TOKENS.dashed}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {checked && <StudioVectorIcon name="check" color="#FFFFFF" size={18} strokeWidth={2.8} />}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        padding: '10px 18px',
                        borderRadius: 12,
                        background: TOKENS.card,
                        border: `1px solid ${checked ? TOKENS.emeraldBorder : TOKENS.border}`,
                        fontSize: 22,
                        fontWeight: 700,
                        color: checked ? TOKENS.ink : TOKENS.inkSecondary,
                      }}
                    >
                      {item}
                    </div>
                  </div>
                );
              }
            )}
            {d.leftCaption && (
              <div style={{ fontSize: 21, fontWeight: 800, color: TOKENS.inkSecondary, textAlign: 'center', marginTop: 4 }}>
                {d.leftCaption}
              </div>
            )}
          </div>

          {/* Right Automated Flow Column */}
          {hiddenRightFlow.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {hiddenRightFlow.map((nd, idx) => (
                <React.Fragment key={idx}>
                  <div
                    style={{
                      minWidth: 250,
                      padding: '16px 26px',
                      borderRadius: 18,
                      background: TOKENS.card,
                      border: `1.5px solid ${isGrouped ? TOKENS.amberBorder : TOKENS.borderCrisp}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 14,
                    }}
                  >
                    <StudioVectorIcon name={nd.icon || 'globe'} color={isGrouped ? TOKENS.amber : TOKENS.ink} size={30} />
                    <span style={{ fontSize: 23, fontWeight: 800, color: TOKENS.ink }}>{nd.label}</span>
                  </div>
                  {idx < hiddenRightFlow.length - 1 && (
                    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                      <line x1="12" y1="2" x2="12" y2="26" stroke={TOKENS.amber} strokeWidth="2.5" />
                      <polyline points="6 20 12 28 18 20" stroke={TOKENS.amber} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </React.Fragment>
              ))}
              {d.rightCaption && (
                <div style={{ fontSize: 21, fontWeight: 800, color: TOKENS.inkSecondary, marginTop: 4 }}>{d.rightCaption}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 2: git_branch_merge_graph
// ============================================================================
export const PrimitiveGitBranchMergeGraph: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const hasTopHeader = Boolean(d.topTitle || d.topPill || (Array.isArray(d.stepper) && d.stepper.length > 0));

  const prF = getBeatFrame(scene, d.prClause ?? 1, fps, 0.35);
  const fenceF = getBeatFrame(scene, d.fenceClause ?? Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.62);
  const mergeF =
    typeof d.mergeClause === 'number'
      ? getBeatFrame(scene, d.mergeClause, fps, 0.84)
      : scene.clauses.length >= 4
      ? getBeatFrame(scene, 3, fps, 0.84)
      : 99999;

  const branchP = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const prP = settle(spring({ frame: frame - prF, fps, config: SPRING_SILKY }));
  const fenceP = settle(spring({ frame: frame - fenceF, fps, config: SPRING_SNAPPY }));
  const mergeP = frame >= mergeF ? settle(spring({ frame: frame - mergeF, fps, config: SPRING_SILKY })) : 0;
  const isMerged = mergeP > 0.75;

  const gateChecks: string[] = Array.isArray(d.gateChecks) ? d.gateChecks : [];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1520,
          height: 560,
          position: 'relative',
          transform: `translateY(${hasTopHeader ? 42 : -10}px)`,
        }}
      >
        {/* Top Row Context Cards (Actor Task on Left, PR Badge Card on Right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {d.actorLabel && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    border: `2.5px solid ${TOKENS.amber}`,
                    background: TOKENS.amberSoft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StudioVectorIcon name="user" color={TOKENS.ink} size={34} />
                </div>
                <span style={{ fontSize: 21, fontWeight: 800, color: TOKENS.ink }}>{d.actorLabel}</span>
              </div>
            )}
            {d.taskCardTitle && (
              <div
                style={{
                  padding: '16px 28px',
                  borderRadius: 16,
                  background: TOKENS.card,
                  border: `1.5px solid ${TOKENS.amberBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <StudioVectorIcon name={d.taskIcon || 'chart'} color={TOKENS.amber} size={26} />
                <span style={{ fontSize: 25, fontWeight: 800, color: TOKENS.ink }}>{d.taskCardTitle}</span>
              </div>
            )}
          </div>

          {d.prTitle && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                opacity: prP,
                transform: `translateY(${interpolate(prP, [0, 1], [16, 0]).toFixed(2)}px)`,
              }}
            >
              <div
                style={{
                  padding: '16px 26px',
                  borderRadius: 16,
                  background: TOKENS.card,
                  border: `1.5px solid ${isMerged ? TOKENS.emeraldBorder : TOKENS.borderCrisp}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  position: 'relative',
                  boxShadow: '0 18px 44px rgba(0,0,0,0.42)',
                }}
              >
                <StudioVectorIcon name="git-pr" color={isMerged ? TOKENS.emeraldNeon : TOKENS.ink} size={26} />
                <span style={{ fontSize: 25, fontWeight: 800, color: TOKENS.ink }}>{d.prTitle}</span>
                {d.prNumber && (
                  <span style={{ fontFamily: TOKENS.fontMono, fontSize: 22, color: TOKENS.inkSecondary }}>{d.prNumber}</span>
                )}
                <span
                  style={{
                    padding: '4px 16px',
                    borderRadius: 999,
                    background: isMerged ? TOKENS.emerald : '#198754',
                    color: '#FFFFFF',
                    fontFamily: TOKENS.fontMono,
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {isMerged ? d.mergedStatusLabel || 'Merged' : d.openStatusLabel || 'Open'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center SVG Git Branch / Lock / Fence / Merge Graph */}
        <svg width={1520} height={310} viewBox="0 0 1520 310" style={{ marginTop: 22, overflow: 'visible' }}>
          {/* Trunk Label & Line */}
          <text x="148" y="218" fill={TOKENS.inkSecondary} fontFamily={TOKENS.fontMono} fontSize="28" fontWeight="700">
            {d.trunkLabel || 'main'}
          </text>
          <line x1="240" y1="208" x2="1160" y2="208" stroke="#B0B0B6" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="310" cy="208" r="9" fill={TOKENS.canvas} stroke="#FFFFFF" strokeWidth="3.5" />
          <circle cx="460" cy="208" r="9" fill={TOKENS.canvas} stroke={TOKENS.amber} strokeWidth="3.5" />

          {/* Protected Trunk Lock Badge */}
          {d.showTrunkLock !== false && (
            <g transform="translate(760, 208)">
              <circle cx="0" cy="0" r="27" fill={TOKENS.canvas} stroke="#B0B0B6" strokeWidth="2.5" />
              <g transform="translate(-12, -12)">
                <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
                <path d="M7.5 10V7C7.5 4.8 9.5 3 12 3C14.5 3 16.5 4.8 16.5 7V10" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
              </g>
            </g>
          )}

          {/* Feature Branch Curve */}
          <path
            d="M 460 208 C 520 208, 535 92, 600 92 L 900 92"
            fill="none"
            stroke={TOKENS.amber}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="520"
            strokeDashoffset={520 * (1 - branchP)}
          />
          {branchP > 0.45 && (
            <>
              <circle cx="680" cy="92" r="8" fill={TOKENS.amber} />
              <circle cx="805" cy="92" r="8" fill={TOKENS.amber} />
              <circle cx="900" cy="92" r="8" fill={TOKENS.amber} />
            </>
          )}
          <text
            x="585"
            y="66"
            fill={TOKENS.amber}
            fontFamily={TOKENS.fontSans}
            fontSize="26"
            fontWeight="800"
            opacity={branchP}
          >
            {d.branchLabel || 'feature-branch'}
          </text>

          {/* Merge Return Curve (Dashed while gated -> Solid when merged!) */}
          {prP > 0.05 && (
            <path
              d="M 900 92 C 958 92, 972 208, 1042 208"
              fill="none"
              stroke={isMerged ? TOKENS.emeraldNeon : TOKENS.amber}
              strokeWidth="4.5"
              strokeDasharray={isMerged ? 'none' : '12 9'}
              opacity={prP}
            />
          )}

          {/* Gate Fence Blocking Premature Merge */}
          {fenceP > 0.05 && !isMerged && (
            <g transform={`translate(946, 134) scale(${fenceP})`}>
              <line x1="8" y1="0" x2="8" y2="54" stroke={TOKENS.amber} strokeWidth="5" strokeLinecap="round" />
              <line x1="28" y1="0" x2="28" y2="54" stroke={TOKENS.amber} strokeWidth="5" strokeLinecap="round" />
              <line x1="48" y1="0" x2="48" y2="54" stroke={TOKENS.amber} strokeWidth="5" strokeLinecap="round" />
              <line x1="0" y1="16" x2="56" y2="16" stroke={TOKENS.amber} strokeWidth="4.5" strokeLinecap="round" />
              <line x1="0" y1="38" x2="56" y2="38" stroke={TOKENS.amber} strokeWidth="4.5" strokeLinecap="round" />
              {d.gateLabel && (
                <g transform="translate(68, 6)">
                  <rect x="0" y="0" width="112" height="42" rx="21" fill={TOKENS.card} stroke={TOKENS.borderCrisp} strokeWidth="1.5" />
                  <text x="56" y="28" textAnchor="middle" fill={TOKENS.ink} fontSize="21" fontWeight="800">
                    {d.gateLabel}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Merged Commit Node */}
          {isMerged && <circle cx="1042" cy="208" r="11" fill={TOKENS.emeraldNeon} />}
        </svg>

        {/* Right-Bottom Gate Check Pills */}
        {gateChecks.length > 0 && fenceP > 0.1 && (
          <div
            style={{
              position: 'absolute',
              right: 54,
              bottom: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              opacity: fenceP,
            }}
          >
            {gateChecks.slice(0, 4).map((chk, idx) => {
              const isNew = idx === gateChecks.length - 1;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 14,
                    background: TOKENS.card,
                    border: `1.5px solid ${isNew ? TOKENS.amber : TOKENS.emeraldBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 18,
                    minWidth: 250,
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 800, color: TOKENS.ink }}>{chk}</span>
                  <StudioVectorIcon name="check" color={TOKENS.emeraldNeon} size={20} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 3: pr_checks_gate_card
// ============================================================================
export const PrimitivePrChecksGateCard: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const hasTopHeader = Boolean(d.topTitle || d.topPill || (Array.isArray(d.stepper) && d.stepper.length > 0));

  const rawChecks: Array<string | { label: string; status?: 'pass' | 'fail' }> = Array.isArray(d.checks)
    ? d.checks
    : ['lint', 'test', 'build'];

  const passStartF = getBeatFrame(scene, d.passClause ?? 1, fps, 0.42);
  const clickF = getBeatFrame(scene, d.clickClause ?? Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.76);

  const enterP = settle(spring({ frame, fps, config: SPRING_SILKY }));
  let allPassed = true;
  let anyFailed = false;
  rawChecks.forEach((c, idx) => {
    const st = typeof c === 'object' && c.status ? c.status : 'pass';
    if (frame < passStartF + idx * 6) allPassed = false;
    else if (st === 'fail') {
      allPassed = false;
      anyFailed = true;
    }
  });

  const isClicked = allPassed && frame >= clickF;
  const cursorP = settle(spring({ frame: frame - (clickF - 10), fps, config: SPRING_SILKY }));
  const pressScale =
    isClicked && frame < clickF + 10
      ? interpolate(frame, [clickF, clickF + 4, clickF + 10], [1, 0.94, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 820,
          background: TOKENS.card,
          border: `1.5px solid ${allPassed ? TOKENS.emeraldBorder : TOKENS.borderCrisp}`,
          borderRadius: 22,
          padding: '32px 38px',
          boxShadow: '0 28px 72px rgba(0,0,0,0.52)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          opacity: enterP,
          transform: `translateY(${hasTopHeader ? 38 : -12}px)`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: TOKENS.ink }}>{d.cardTitle || 'Pull Request'}</span>
            {d.cardIdTag && (
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 28, fontWeight: 700, color: TOKENS.inkSecondary }}>
                {d.cardIdTag}
              </span>
            )}
          </div>
          <StudioVectorIcon name="git-pr" color={TOKENS.inkSecondary} size={30} />
        </div>

        {/* Branch Route Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              padding: '5px 16px',
              borderRadius: 999,
              background: TOKENS.emerald,
              color: '#FFFFFF',
              fontFamily: TOKENS.fontMono,
              fontSize: 18,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <StudioVectorIcon name="git-branch" color="#FFFFFF" size={16} />
            {d.statusBadge || 'Open'}
          </span>
          <span style={{ fontFamily: TOKENS.fontMono, fontSize: 21, fontWeight: 600, color: TOKENS.inkSecondary }}>
            {d.routeLabel || 'feature -> main'}
          </span>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '2px 0' }} />

        {/* Status Summary Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {allPassed ? (
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: TOKENS.emerald,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StudioVectorIcon name="check" color="#FFFFFF" size={17} strokeWidth={2.8} />
            </span>
          ) : anyFailed ? (
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: TOKENS.coral,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StudioVectorIcon name="x" color="#FFFFFF" size={16} strokeWidth={2.8} />
            </span>
          ) : (
            <svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              style={{ transform: `rotate(${(frame * 12) % 360}deg)` }}
            >
              <circle cx="13" cy="13" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
              <path d="M 13 3 A 10 10 0 0 1 23 13" stroke={TOKENS.amber} strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          )}
          <span
            style={{
              fontSize: 23,
              fontWeight: 800,
              color: allPassed ? TOKENS.emeraldNeon : anyFailed ? TOKENS.coral : TOKENS.inkSecondary,
            }}
          >
            {allPassed
              ? d.passedHeading || 'All checks passed'
              : anyFailed
              ? d.failedHeading || 'Checks failed'
              : d.pendingHeading || 'Running automated checks...'}
          </span>
        </div>

        {/* Checks Rows Box */}
        <div
          style={{
            border: `2px solid ${!allPassed && !anyFailed ? TOKENS.amber : TOKENS.border}`,
            borderRadius: 16,
            padding: '14px 20px',
            background: '#28282B',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {rawChecks.map((chk, idx) => {
            const label = typeof chk === 'string' ? chk : chk.label;
            const targetSt = typeof chk === 'object' && chk.status ? chk.status : 'pass';
            const done = frame >= passStartF + idx * 6;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <StudioVectorIcon name="cog" color={TOKENS.inkSecondary} size={22} />
                  <span style={{ fontFamily: TOKENS.fontMono, fontSize: 24, fontWeight: 700, color: TOKENS.ink }}>
                    {label}
                  </span>
                </div>
                {done ? (
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: targetSt === 'fail' ? TOKENS.coral : TOKENS.emerald,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StudioVectorIcon name={targetSt === 'fail' ? 'x' : 'check'} color="#FFFFFF" size={16} strokeWidth={2.8} />
                  </span>
                ) : (
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2.5px solid #66666B',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button + Animated Vector Cursor */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, position: 'relative' }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div
              style={{
                padding: '14px 30px',
                borderRadius: 12,
                background: allPassed ? TOKENS.emerald : '#3D3D40',
                color: allPassed ? '#FFFFFF' : '#8A8A90',
                fontFamily: TOKENS.fontMono,
                fontSize: 22,
                fontWeight: 800,
                transform: `scale(${pressScale.toFixed(3)})`,
                boxShadow: allPassed ? '0 8px 28px rgba(19, 159, 107, 0.4)' : 'none',
              }}
            >
              {isClicked && d.clickedButtonLabel ? d.clickedButtonLabel : d.actionButtonLabel || 'Merge pull request'}
            </div>
            {allPassed && frame >= clickF - 12 && (
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                style={{
                  position: 'absolute',
                  right: interpolate(cursorP, [0, 1], [-48, 16]),
                  bottom: interpolate(cursorP, [0, 1], [-42, -16]),
                  pointerEvents: 'none',
                }}
              >
                <path d="M4 2L20 11L13 13L16 20L13 21.5L10 14.5L5 19Z" fill="#FFFFFF" stroke="#141416" strokeWidth="1.6" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 4: slot_validation_and_stopwatch
// ============================================================================
export const PrimitiveSlotValidationAndStopwatch: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode: 'slot_check' | 'formula_nan' | 'static_stopwatch' = d.mode || 'slot_check';

  const beat2 = getBeatFrame(scene, 1, fps, 0.4);
  const beat3 = getBeatFrame(scene, Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.72);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const p2 = settle(spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY }));
  const p3 = settle(spring({ frame: frame - beat3, fps, config: SPRING_SNAPPY }));

  if (mode === 'formula_nan') {
    const operands: Array<{ value: string; invalid?: boolean }> = Array.isArray(d.operands)
      ? d.operands
      : [{ value: '80' }, { value: '120' }, { value: '"Text"', invalid: true }];
    const hasErr = frame >= beat2;
    const showNan = frame >= beat3;
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: 580,
            background: TOKENS.card,
            border: `1.5px solid ${hasErr ? TOKENS.coralBorder : TOKENS.borderCrisp}`,
            borderRadius: 22,
            padding: '32px 38px',
            boxShadow: '0 28px 68px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            opacity: p1,
            transform: 'translateY(-12px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: TOKENS.ink }}>{d.formulaTitle || 'Calculation'}</span>
            {d.typeBadge && (
              <span
                style={{
                  padding: '4px 16px',
                  borderRadius: 999,
                  border: `1.5px solid ${TOKENS.amber}`,
                  background: TOKENS.amberSoft,
                  color: TOKENS.amber,
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {d.typeBadge}
              </span>
            )}
          </div>

          {operands.map((op, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ width: 28, fontFamily: TOKENS.fontMono, fontSize: 30, fontWeight: 700, color: TOKENS.inkSecondary }}>
                {idx === 0 ? '' : '+'}
              </span>
              <div
                style={{
                  flex: 1,
                  padding: '12px 22px',
                  borderRadius: 12,
                  background: '#262628',
                  border: `2px solid ${op.invalid && hasErr ? TOKENS.amber : TOKENS.border}`,
                  textAlign: 'right',
                  fontFamily: TOKENS.fontMono,
                  fontSize: 32,
                  fontWeight: 800,
                  color: op.invalid ? TOKENS.amber : TOKENS.ink,
                }}
              >
                {op.value}
              </div>
            </div>
          ))}

          <div style={{ height: 2, background: TOKENS.amber, opacity: 0.7, margin: '4px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 28, fontFamily: TOKENS.fontMono, fontSize: 30, fontWeight: 700, color: TOKENS.inkSecondary }}>
              =
            </span>
            <div
              style={{
                flex: 1,
                padding: '16px 22px',
                borderRadius: 14,
                background: hasErr ? TOKENS.coralSoft : '#262628',
                border: `2px solid ${hasErr ? TOKENS.coral : TOKENS.border}`,
                textAlign: 'center',
                fontFamily: TOKENS.fontMono,
                fontSize: 32,
                fontWeight: 900,
                color: hasErr ? TOKENS.coral : TOKENS.inkMuted,
              }}
            >
              {!hasErr
                ? '?'
                : showNan
                ? d.errorOutput || 'NaN (Not a Number)'
                : d.corruptedOutput || 'Invalid Concatenation'}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (mode === 'static_stopwatch') {
    const codeLines: Array<{ text: string; isError?: boolean }> = Array.isArray(d.codeLines) ? d.codeLines : [];
    const targetSec = Number(d.scanDurationSec ?? 3.0);
    const sweepP = interpolate(frame, [4, beat2 + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const caught = frame >= beat2 + 6;
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 68, opacity: p1, transform: 'translateY(-10px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            {d.commandText && (
              <div
                style={{
                  padding: '12px 28px',
                  borderRadius: 999,
                  background: '#1E1E21',
                  border: `1.5px solid ${caught ? TOKENS.coral : TOKENS.borderCrisp}`,
                  fontFamily: TOKENS.fontMono,
                  fontSize: 23,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <span style={{ color: TOKENS.amber }}>$</span>
                <span>{d.commandText}</span>
                {caught && (
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: TOKENS.coral, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StudioVectorIcon name="x" color="#FFFFFF" size={14} strokeWidth={2.8} />
                  </span>
                )}
              </div>
            )}
            <div
              style={{
                width: 760,
                background: TOKENS.cardCode,
                border: `1.5px solid ${TOKENS.borderCrisp}`,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0,0,0,0.48)',
              }}
            >
              <div style={{ padding: '12px 22px', borderBottom: `1px solid ${TOKENS.border}`, fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary }}>
                {d.fileName || 'schema.ts'}
              </div>
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {codeLines.map((ln, idx) => {
                  const errActive = Boolean(ln.isError && caught);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 26px',
                        background: errActive ? 'rgba(224, 85, 73, 0.22)' : 'transparent',
                        borderLeft: `4px solid ${errActive ? TOKENS.coral : 'transparent'}`,
                        fontFamily: TOKENS.fontMono,
                        fontSize: 23,
                        fontWeight: 600,
                        color: TOKENS.ink,
                        display: 'flex',
                        gap: 18,
                      }}
                    >
                      <span style={{ color: TOKENS.inkMuted, width: 24 }}>{idx + 1}</span>
                      <span>{ln.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {caught && d.errorBadge && (
              <div style={{ padding: '8px 24px', borderRadius: 999, background: TOKENS.coralSoft, border: `1.5px solid ${TOKENS.coral}`, color: TOKENS.coral, fontSize: 21, fontWeight: 800 }}>
                {d.errorBadge}
              </div>
            )}
          </div>

          {/* Right Stopwatch + Crossed-Out Browser */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <svg width="160" height="175" viewBox="0 0 160 175">
              <line x1="60" y1="12" x2="100" y2="12" stroke="#D4D4D8" strokeWidth="6" strokeLinecap="round" />
              <line x1="80" y1="12" x2="80" y2="28" stroke="#D4D4D8" strokeWidth="6" />
              <circle cx="80" cy="96" r="62" stroke="#525258" strokeWidth="7" fill="#2A2A2D" />
              <circle
                cx="80"
                cy="96"
                r="52"
                stroke={TOKENS.amber}
                strokeWidth="6"
                fill="none"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - sweepP * 0.78)}
                transform="rotate(-90 80 96)"
              />
              <line
                x1="80"
                y1="96"
                x2={80 + 38 * Math.sin(sweepP * Math.PI * 1.5)}
                y2={96 - 38 * Math.cos(sweepP * Math.PI * 1.5)}
                stroke="#FFFFFF"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="80" cy="96" r="5" fill="#FFFFFF" />
            </svg>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 38, fontWeight: 900, color: TOKENS.ink }}>
              {(targetSec * sweepP).toFixed(1)}s
            </div>
            <div
              style={{
                padding: '12px 24px',
                borderRadius: 16,
                background: TOKENS.card,
                border: `1.5px solid ${TOKENS.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: p2,
              }}
            >
              <StudioVectorIcon name="globe-off" color={TOKENS.inkSecondary} size={28} />
              {d.skipRuntimeLabel && (
                <span style={{ fontSize: 19, fontWeight: 700, color: TOKENS.inkSecondary }}>{d.skipRuntimeLabel}</span>
              )}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Default mode: 'slot_check'
  const slots: Array<{
    label: string;
    typeHint: string;
    placeholder?: string;
    inputValue: string;
    isValid: boolean;
    errorTag?: string;
    stepClause?: number;
  }> = Array.isArray(d.slots)
    ? d.slots
    : [
        { label: 'Amount', typeHint: 'Number', placeholder: '123', inputValue: '"Text"', isValid: false, errorTag: 'Type Mismatch', stepClause: 1 },
        { label: 'Note', typeHint: 'String', placeholder: 'Aa', inputValue: '"Lunch"', isValid: true, stepClause: 0 },
      ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 820,
          background: TOKENS.card,
          border: `1.5px solid ${TOKENS.borderCrisp}`,
          borderRadius: 24,
          padding: '36px 46px',
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
          boxShadow: '0 28px 68px rgba(0,0,0,0.5)',
          opacity: p1,
          transform: 'translateY(-10px)',
        }}
      >
        {slots.map((sl, idx) => {
          const trigF = getBeatFrame(scene, sl.stepClause ?? idx, fps, (idx + 1) * 0.35);
          const active = frame >= trigF;
          const slP = settle(spring({ frame: frame - trigF, fps, config: SPRING_SNAPPY }));
          const shakeX =
            active && !sl.isValid && frame < trigF + 18
              ? Math.sin((frame - trigF) * 1.4) * 9 * (1 - (frame - trigF) / 18)
              : 0;
          return (
            <React.Fragment key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: TOKENS.ink }}>{sl.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 600, color: TOKENS.inkSecondary }}>{sl.typeHint}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, transform: `translateX(${shakeX.toFixed(1)}px)` }}>
                  {!active ? (
                    <div
                      style={{
                        minWidth: 260,
                        padding: '14px 28px',
                        borderRadius: 16,
                        border: `2px dashed ${TOKENS.dashed}`,
                        textAlign: 'center',
                        fontFamily: TOKENS.fontMono,
                        fontSize: 26,
                        fontWeight: 700,
                        color: TOKENS.inkMuted,
                      }}
                    >
                      {sl.placeholder || '---'}
                    </div>
                  ) : (
                    <div
                      style={{
                        minWidth: 260,
                        padding: '14px 28px',
                        borderRadius: 999,
                        background: sl.isValid ? TOKENS.emeraldSoft : TOKENS.coralSoft,
                        border: `2px solid ${sl.isValid ? TOKENS.emeraldNeon : TOKENS.coral}`,
                        textAlign: 'center',
                        fontFamily: TOKENS.fontMono,
                        fontSize: 26,
                        fontWeight: 800,
                        color: TOKENS.ink,
                        transform: `scale(${interpolate(slP, [0, 1], [0.9, 1]).toFixed(3)})`,
                      }}
                    >
                      {sl.inputValue}
                    </div>
                  )}

                  {active &&
                    (sl.isValid ? (
                      <span style={{ width: 36, height: 36, borderRadius: '50%', background: TOKENS.emerald, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StudioVectorIcon name="check" color="#FFFFFF" size={20} strokeWidth={2.8} />
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '6px 16px',
                          borderRadius: 999,
                          background: TOKENS.coralSoft,
                          border: `1.5px solid ${TOKENS.coral}`,
                          color: TOKENS.coral,
                          fontSize: 18,
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sl.errorTag || 'Invalid'}
                      </span>
                    ))}
                </div>
              </div>
              {idx < slots.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 5: autonomous_bot_ui_tester
// ============================================================================
export const PrimitiveAutonomousBotUiTester: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};

  const appRows: Array<{ label: string; value: string }> = Array.isArray(d.appRows)
    ? d.appRows
    : [
        { label: 'Item A', value: '$80' },
        { label: 'Item B', value: '$120' },
        { label: 'Item C', value: '$35' },
      ];
  const verifyPills: Array<{ tag?: string; label: string; status?: 'pass' | 'fail' }> = Array.isArray(d.verificationPills)
    ? d.verificationPills
    : [];
  const specItems: string[] = Array.isArray(d.specItems) ? d.specItems : [];

  const beat2 = getBeatFrame(scene, 1, fps, 0.38);
  const beat3 = getBeatFrame(scene, Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.72);
  const enterP = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const clickP = settle(spring({ frame: frame - beat2, fps, config: SPRING_SILKY }));
  const stampP = d.approvalStamp && frame >= beat3 ? settle(spring({ frame: frame - beat3, fps, config: SPRING_BOUNCE })) : 0;

  const cursorX = interpolate(clickP, [0, 1], [190, 224]);
  const cursorY = interpolate(clickP, [0, 1], [150, 422]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 58, opacity: enterP, transform: 'translateY(-10px)' }}>
        {/* Optional Left Spec / Exam Card */}
        {specItems.length > 0 && (
          <div
            style={{
              width: 470,
              background: TOKENS.card,
              border: `1.5px solid ${TOKENS.borderCrisp}`,
              borderRadius: 20,
              padding: '28px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: `1px solid ${TOKENS.border}` }}>
              <StudioVectorIcon name="file-code" color={TOKENS.amber} size={24} />
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 800, color: TOKENS.ink }}>
                {d.specTitle || 'Verification Spec'}
              </span>
            </div>
            {specItems.map((sp, idx) => {
              const active = idx === Math.min(specItems.length - 1, Math.floor((frame / Math.max(1, scene.duration * fps)) * specItems.length));
              return (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: active ? TOKENS.amberSoft : 'transparent',
                    borderLeft: `3.5px solid ${active ? TOKENS.amber : 'transparent'}`,
                    fontSize: 21,
                    fontWeight: 700,
                    color: active ? TOKENS.ink : TOKENS.inkSecondary,
                  }}
                >
                  {idx + 1}. {sp}
                </div>
              );
            })}
          </div>
        )}

        {/* Simulated Mobile / Web App Frame with Autonomous Bot Cursor */}
        <div
          style={{
            width: 340,
            minHeight: 470,
            background: '#2C2C30',
            border: '2.5px solid #58585E',
            borderRadius: 34,
            padding: '28px 26px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 32px 72px rgba(0,0,0,0.55)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: TOKENS.ink }}>{d.appTitle || 'App Preview'}</span>
              {d.showRecIndicator !== false && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: TOKENS.fontMono, fontSize: 15, fontWeight: 800, color: TOKENS.inkSecondary }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: TOKENS.coral, opacity: frame % 24 < 16 ? 1 : 0.35 }} />
                  REC
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {appRows.map((r, idx) => {
                const rowVis = settle(spring({ frame: frame - idx * 6, fps, config: SPRING_SNAPPY }));
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 22,
                      fontWeight: 700,
                      color: TOKENS.inkSecondary,
                      opacity: rowVis,
                    }}
                  >
                    <span>{r.label}</span>
                    <span style={{ fontFamily: TOKENS.fontMono, color: TOKENS.ink }}>{r.value}</span>
                  </div>
                );
              })}
            </div>

            {d.summaryRow && (
              <div
                style={{
                  marginTop: 22,
                  paddingTop: 16,
                  borderTop: `1.5px solid ${TOKENS.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 23,
                  fontWeight: 900,
                }}
              >
                <span>{d.summaryRow.label}</span>
                <span style={{ fontFamily: TOKENS.fontMono, color: TOKENS.emeraldNeon }}>{d.summaryRow.value}</span>
              </div>
            )}
          </div>

          {d.primaryButtonLabel && (
            <div
              style={{
                marginTop: 24,
                padding: '14px 20px',
                borderRadius: 14,
                background: TOKENS.amber,
                color: '#141416',
                fontSize: 21,
                fontWeight: 900,
                textAlign: 'center',
                transform: frame >= beat2 && frame < beat2 + 8 ? 'scale(0.95)' : 'none',
              }}
            >
              {d.primaryButtonLabel}
            </div>
          )}

          {/* Autonomous Bot Cursor */}
          <div
            style={{
              position: 'absolute',
              left: cursorX,
              top: cursorY,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none',
              zIndex: 8,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24">
              <path d="M4 2L20 11L13 13L16 20L13 21.5L10 14.5L5 19Z" fill="#FFFFFF" stroke="#141416" strokeWidth="1.6" />
            </svg>
            <span
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                background: '#18181B',
                border: `1.5px solid ${TOKENS.amber}`,
                fontFamily: TOKENS.fontMono,
                fontSize: 15,
                fontWeight: 800,
                color: TOKENS.ink,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <StudioVectorIcon name={d.cursorIcon || 'bot'} color={TOKENS.amber} size={15} />
              {d.cursorLabel || 'test bot'}
            </span>
          </div>

          {/* Neon Emerald Approval Stamp */}
          {stampP > 0.05 && d.approvalStamp && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '52%',
                transform: `translate(-50%, -50%) rotate(-8deg) scale(${interpolate(stampP, [0, 1], [1.45, 1]).toFixed(3)})`,
                padding: '12px 34px',
                borderRadius: 12,
                border: `4px solid ${TOKENS.emeraldNeon}`,
                background: 'rgba(14, 38, 29, 0.90)',
                color: TOKENS.emeraldNeon,
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: '0.06em',
                opacity: stampP,
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                zIndex: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {d.approvalStamp}
            </div>
          )}
        </div>

        {/* Right Verification Result Pills */}
        {verifyPills.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {verifyPills.map((vp, idx) => {
              const vpF = beat2 + idx * 8;
              const done = frame >= vpF;
              const isFail = vp.status === 'fail' && frame >= beat3;
              const col = isFail ? TOKENS.coral : TOKENS.emeraldNeon;
              return (
                <div
                  key={idx}
                  style={{
                    minWidth: 300,
                    padding: '16px 26px',
                    borderRadius: 999,
                    background: isFail ? TOKENS.coralSoft : TOKENS.emeraldSoft,
                    border: `1.5px solid ${col}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 18,
                    opacity: done ? 1 : 0.28,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {vp.tag && (
                      <span style={{ padding: '2px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.3)', fontSize: 16, fontWeight: 800, color: TOKENS.inkSecondary }}>
                        {vp.tag}
                      </span>
                    )}
                    <span style={{ fontSize: 23, fontWeight: 800, color: TOKENS.ink }}>{vp.label}</span>
                  </div>
                  <StudioVectorIcon name={isFail ? 'x' : 'check'} color={col} size={22} strokeWidth={2.8} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 6: env_isolation_compare
// ============================================================================
export const PrimitiveEnvIsolationCompare: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};

  const crashF = getBeatFrame(scene, d.crashClause ?? 1, fps, 0.36);
  const cleanF = getBeatFrame(scene, d.cleanClause ?? Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.68);

  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const crashP = settle(spring({ frame: frame - crashF, fps, config: SPRING_SNAPPY }));
  const cleanP = settle(spring({ frame: frame - cleanF, fps, config: SPRING_SILKY }));
  const showCleanMode = cleanP > 0.45;

  const listedItems: string[] = Array.isArray(d.listedItems) ? d.listedItems : ['A', 'B', 'C'];
  const missingItem = String(d.missingItem || 'X');

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1460,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          opacity: p1,
          transform: 'translateY(-12px)',
        }}
      >
        {/* Top Requirement Pill */}
        {d.requirementLabel && (
          <div
            style={{
              padding: '12px 30px',
              borderRadius: 999,
              background: TOKENS.card,
              border: `1.5px solid ${TOKENS.amberBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 23,
              fontWeight: 800,
            }}
          >
            <StudioVectorIcon name="sparkles" color={TOKENS.amber} size={22} />
            <span>{d.requirementLabel}</span>
            <span style={{ padding: '2px 12px', borderRadius: 8, background: TOKENS.amberSoft, border: `1px solid ${TOKENS.amber}`, fontFamily: TOKENS.fontMono, color: TOKENS.amber }}>
              {missingItem}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 38, width: '100%' }}>
          {/* Left Monitor: Dirty Local Machine */}
          <div
            style={{
              width: 440,
              background: TOKENS.card,
              border: `2.5px solid ${showCleanMode ? TOKENS.border : TOKENS.amber}`,
              borderRadius: 22,
              padding: '28px 28px',
              opacity: showCleanMode ? 0.42 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
              position: 'relative',
            }}
          >
            {!showCleanMode && (
              <span
                style={{
                  position: 'absolute',
                  top: -16,
                  right: -12,
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: TOKENS.emerald,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StudioVectorIcon name="check" color="#FFFFFF" size={24} strokeWidth={2.8} />
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StudioVectorIcon name="monitor" color={TOKENS.amber} size={28} />
              <span style={{ fontSize: 24, fontWeight: 800 }}>{d.localHostLabel || 'Local Dev Machine'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {listedItems.map((it, idx) => (
                <span key={idx} style={{ padding: '10px 18px', borderRadius: 10, background: '#262628', border: `1px solid ${TOKENS.border}`, fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 800 }}>
                  {it}
                </span>
              ))}
              <span style={{ padding: '10px 18px', borderRadius: 10, background: TOKENS.amberSoft, border: `2px solid ${TOKENS.amber}`, fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 900, color: TOKENS.amber }}>
                {missingItem}
              </span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: TOKENS.inkSecondary }}>
              {d.localCacheHint || 'Cached locally'}
            </span>
          </div>

          {/* Center Dependency Manifest Card */}
          <div
            style={{
              width: 280,
              background: TOKENS.cardCode,
              border: `1.5px solid ${TOKENS.borderCrisp}`,
              borderRadius: 18,
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 21, fontWeight: 800, color: TOKENS.inkSecondary, borderBottom: `1px solid ${TOKENS.border}`, paddingBottom: 8 }}>
              {d.manifestTitle || 'Manifest'}
            </div>
            {listedItems.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: TOKENS.fontMono, fontSize: 21, fontWeight: 700 }}>
                <span>[{it}]</span>
                <StudioVectorIcon name="check" color={TOKENS.emeraldNeon} size={18} />
              </div>
            ))}
            <div style={{ padding: '8px 12px', borderRadius: 10, border: `1.5px dashed ${TOKENS.amber}`, fontFamily: TOKENS.fontMono, fontSize: 17, fontWeight: 700, color: TOKENS.amber, textAlign: 'center' }}>
              {d.missingManifestNote || `Missing ${missingItem}`}
            </div>
          </div>

          {/* Right Card: Flips from Production Crash (Beat 2) to Clean Cloud VM Catching Bug (Beat 3) */}
          {!showCleanMode ? (
            <div
              style={{
                width: 440,
                background: TOKENS.coralSoft,
                border: `2.5px solid ${TOKENS.coral}`,
                borderRadius: 22,
                padding: '28px 28px',
                opacity: Math.max(0.2, crashP),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StudioVectorIcon name="globe" color={TOKENS.coral} size={28} />
                <span style={{ fontSize: 24, fontWeight: 800, color: TOKENS.ink }}>
                  {d.prodTitle || 'Live Production'}
                </span>
              </div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${TOKENS.coral}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StudioVectorIcon name="x" color={TOKENS.coral} size={34} strokeWidth={3} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: TOKENS.coral }}>
                {d.prodCrashLabel || `Missing ${missingItem} · Crash`}
              </div>
            </div>
          ) : (
            <div
              style={{
                width: 440,
                background: TOKENS.card,
                border: `2.5px solid ${TOKENS.emeraldNeon}`,
                borderRadius: 22,
                padding: '28px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StudioVectorIcon name="cloud" color={TOKENS.emeraldNeon} size={28} />
                <span style={{ fontSize: 24, fontWeight: 800, color: TOKENS.ink }}>
                  {d.cleanVmTitle || 'Clean Cloud Runner'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, fontFamily: TOKENS.fontMono, fontSize: 19, fontWeight: 800 }}>
                {listedItems.map((it, idx) => (
                  <span key={idx} style={{ padding: '6px 14px', borderRadius: 8, background: '#262628' }}>{it}</span>
                ))}
                <span style={{ padding: '6px 14px', borderRadius: 8, background: TOKENS.coralSoft, border: `1.5px solid ${TOKENS.coral}`, color: TOKENS.coral }}>
                  ! {missingItem}
                </span>
              </div>
              <div style={{ padding: '8px 22px', borderRadius: 999, background: TOKENS.emeraldSoft, border: `1.5px solid ${TOKENS.emeraldNeon}`, color: TOKENS.emeraldNeon, fontSize: 20, fontWeight: 800 }}>
                {d.cleanAccuracyBadge || 'Caught Before Deploy'}
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 7: swiss_cheese_defense_layers
// ============================================================================
export const PrimitiveSwissCheeseDefenseLayers: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const mode: 'swiss_cheese' | 'script_vs_chaos' = d.mode || 'swiss_cheese';

  const beat2 = getBeatFrame(scene, 1, fps, 0.45);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const leakP = interpolate(frame, [beat2 - 4, beat2 + 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (mode === 'script_vs_chaos') {
    const scriptSteps: string[] = Array.isArray(d.scriptSteps) ? d.scriptSteps : ['1', '2', '3'];
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: 1420,
            height: 620,
            borderRadius: 26,
            overflow: 'hidden',
            position: 'relative',
            background: 'radial-gradient(circle at 50% 45%, #2D333F 0%, #1C1D22 85%)',
            border: `1.5px solid ${TOKENS.borderCrisp}`,
            boxShadow: '0 30px 72px rgba(0,0,0,0.55)',
            opacity: p1,
            transform: 'translateY(-12px)',
          }}
        >
          {d.imageFile && (
            <Img
              src={staticFile(d.imageFile)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.34, filter: 'contrast(1.05)' }}
            />
          )}

          {d.contextPill && (
            <div style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)', padding: '8px 26px', borderRadius: 999, background: 'rgba(26,26,29,0.9)', border: `1.5px solid ${TOKENS.borderCrisp}`, fontSize: 22, fontWeight: 800 }}>
              {d.contextPill}
            </div>
          )}

          <svg width={1420} height={620} viewBox="0 0 1420 620" style={{ position: 'absolute', inset: 0 }}>
            {/* Straight Ideal Script Path */}
            <line x1="710" y1="530" x2="710" y2="145" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="10 8" />
            <polyline points="698 162 710 142 722 162" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {scriptSteps.slice(0, 3).map((st, idx) => {
              const cy = 485 - idx * 135;
              return (
                <g key={idx}>
                  <circle cx="710" cy={cy} r="22" fill="#FFFFFF" />
                  <text x="710" y={cy + 8} textAnchor="middle" fill="#141416" fontFamily={TOKENS.fontMono} fontSize="22" fontWeight="900">
                    {st}
                  </text>
                </g>
              );
            })}
            {d.scriptLabel && (
              <g transform="translate(560, 355)">
                <rect x="0" y="0" width="124" height="42" rx="21" fill="rgba(26,26,29,0.92)" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="62" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="800">
                  {d.scriptLabel}
                </text>
              </g>
            )}

            {/* Chaotic Real-World User Trajectories */}
            {[
              'M 220 490 C 310 210, 520 560, 650 280 S 940 160, 1080 440',
              'M 390 540 C 190 340, 810 140, 960 360 S 1220 220, 1180 490',
              'M 860 520 C 1060 440, 790 210, 1140 190',
            ].map((pathD, idx) => (
              <path
                key={idx}
                d={pathD}
                fill="none"
                stroke={TOKENS.amber}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="1200"
                strokeDashoffset={1200 * (1 - leakP)}
                opacity={0.92}
              />
            ))}
          </svg>
        </div>
      </AbsoluteFill>
    );
  }

  const layers: Array<{ label: string; gapXPct?: number }> = Array.isArray(d.layers)
    ? d.layers
    : [
        { label: 'Layer 01', gapXPct: 30 },
        { label: 'Layer 02', gapXPct: 48 },
        { label: 'Layer 03', gapXPct: 26 },
        { label: 'Layer 04', gapXPct: 42 },
      ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1320, height: 560, position: 'relative', opacity: p1, transform: 'translateY(-10px)' }}>
        <svg width={1320} height={560} viewBox="0 0 1320 560" style={{ overflow: 'visible' }}>
          {layers.slice(0, 4).map((ly, idx) => {
            const y = 96 + idx * 105;
            const gapX = 240 + ((ly.gapXPct ?? (idx % 2 === 0 ? 30 : 48)) / 100) * 760;
            const gapW = 84;
            return (
              <g key={idx}>
                <text x="195" y={y + 20} textAnchor="end" fill={TOKENS.inkSecondary} fontFamily={TOKENS.fontMono} fontSize="22" fontWeight="800">
                  {ly.label}
                </text>
                {/* Left Solid Slotted Segment */}
                <rect x="230" y={y} width={Math.max(40, gapX - 230)} height="28" rx="14" fill="rgba(255,255,255,0.04)" stroke="#C4C4CA" strokeWidth="2.2" />
                {/* Right Solid Slotted Segment */}
                <rect x={gapX + gapW} y={y} width={Math.max(40, 1020 - (gapX + gapW))} height="28" rx="14" fill="rgba(255,255,255,0.04)" stroke="#C4C4CA" strokeWidth="2.2" />
              </g>
            );
          })}

          {/* Blocked Known Issues on Top Right */}
          <g transform="translate(830, 56)">
            <circle cx="0" cy="16" r="15" fill="#323236" stroke="#FFFFFF" strokeWidth="2.2" />
            <line x1="-6" y1="10" x2="6" y2="22" stroke="#FFFFFF" strokeWidth="2.2" />
            <line x1="6" y1="10" x2="-6" y2="22" stroke="#FFFFFF" strokeWidth="2.2" />
          </g>
          {d.blockedLabel && (
            <g transform="translate(1055, 86)">
              <rect x="0" y="0" width="180" height="46" rx="23" fill={TOKENS.card} stroke={TOKENS.borderCrisp} strokeWidth="1.5" />
              <text x="90" y="30" textAnchor="middle" fill={TOKENS.ink} fontSize="21" fontWeight="800">
                {d.blockedLabel}
              </text>
            </g>
          )}

          {/* Unseen Red Anomaly Snaking Through Aligned Gaps */}
          {(() => {
            const g = layers.slice(0, 4).map((ly, idx) => 240 + ((ly.gapXPct ?? (idx % 2 === 0 ? 30 : 48)) / 100) * 760 + 42);
            const pathStr = `M ${g[0]} 28 L ${g[0]} 155 L ${g[1] ?? g[0]} 155 L ${g[1] ?? g[0]} 260 L ${g[2] ?? g[0]} 260 L ${g[2] ?? g[0]} 365 L ${g[3] ?? g[0]} 365 L ${g[3] ?? g[0]} 478`;
            const endX = g[Math.min(3, layers.length - 1)] ?? g[0];
            return (
              <>
                <path
                  d={pathStr}
                  fill="none"
                  stroke={TOKENS.coral}
                  strokeWidth="4"
                  strokeDasharray="8 7"
                  opacity={leakP > 0.05 ? 1 : 0}
                />
                {leakP > 0.65 && (
                  <g transform={`translate(${endX}, 498)`}>
                    <circle cx="0" cy="0" r="20" fill={TOKENS.coralSoft} stroke={TOKENS.coral} strokeWidth="2.8" />
                    <circle cx="0" cy="0" r="8" fill={TOKENS.coral} />
                    {d.leakedLabel && (
                      <g transform="translate(-85, 28)">
                        <rect x="0" y="0" width="170" height="44" rx="22" fill={TOKENS.coralSoft} stroke={TOKENS.coral} strokeWidth="1.8" />
                        <text x="85" y="29" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="800">
                          {d.leakedLabel}
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </>
            );
          })()}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 8: regression_loop_stage (Fix A <-> Break B + Vector Whack-a-Mole)
// ============================================================================
export const PrimitiveRegressionLoopStage: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};

  const beat2 = getBeatFrame(scene, 1, fps, 0.42);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const loopStarted = frame >= beat2;
  const cyclePhase = loopStarted ? Math.floor((frame - beat2) / 24) % 2 : 0;
  const rotDeg = loopStarted ? interpolate((frame - beat2) % 48, [0, 48], [0, 360]) : 0;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 96, opacity: p1, transform: 'translateY(-10px)' }}>
        {/* Left Alternating Status Loop */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              minWidth: 290,
              padding: '18px 34px',
              borderRadius: 18,
              background: cyclePhase === 0 ? TOKENS.emeraldSoft : TOKENS.card,
              border: `2px solid ${cyclePhase === 0 ? TOKENS.emeraldNeon : TOKENS.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: TOKENS.emerald, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <StudioVectorIcon name="check" color="#FFFFFF" size={20} strokeWidth={2.8} />
            </span>
            <span style={{ fontSize: 28, fontWeight: 900, color: TOKENS.ink }}>{d.positiveLabel || 'Fixed Module A'}</span>
          </div>

          <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: `rotate(${rotDeg.toFixed(1)}deg)` }}>
            <path d="M 16 28 A 20 20 0 0 1 52 28" fill="none" stroke="#E4E4E7" strokeWidth="3.5" strokeLinecap="round" />
            <polyline points="46 20 53 29 43 31" fill="none" stroke="#E4E4E7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 52 40 A 20 20 0 0 1 16 40" fill="none" stroke="#E4E4E7" strokeWidth="3.5" strokeLinecap="round" />
            <polyline points="22 48 15 39 25 37" fill="none" stroke="#E4E4E7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div
            style={{
              minWidth: 290,
              padding: '18px 34px',
              borderRadius: 18,
              background: loopStarted && cyclePhase === 1 ? TOKENS.coralSoft : TOKENS.card,
              border: `2px solid ${loopStarted ? TOKENS.coral : TOKENS.border}`,
              opacity: loopStarted ? 1 : 0.35,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: TOKENS.coral, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <StudioVectorIcon name="x" color="#FFFFFF" size={18} strokeWidth={2.8} />
            </span>
            <span style={{ fontSize: 28, fontWeight: 900, color: TOKENS.ink }}>{d.negativeLabel || 'Broke Module B'}</span>
          </div>
        </div>

        {/* Right Code-Drawn Isometric Bug Whack Board */}
        <div
          style={{
            width: 560,
            height: 360,
            borderRadius: 28,
            background: '#2D2D31',
            border: `2px solid ${TOKENS.borderCrisp}`,
            boxShadow: '0 28px 68px rgba(0,0,0,0.52)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '44px 56px',
            gap: 32,
            alignItems: 'center',
            justifyItems: 'center',
            position: 'relative',
          }}
        >
          {[0, 1, 2, 3].map((holeIdx) => {
            const bugUp = (cyclePhase === 0 && holeIdx === 0) || (cyclePhase === 1 && holeIdx === 3);
            const col = holeIdx === 3 ? TOKENS.amber : TOKENS.slateLight;
            return (
              <div
                key={holeIdx}
                style={{
                  width: 146,
                  height: 82,
                  borderRadius: '50%',
                  background: '#19191C',
                  border: `2.5px solid ${bugUp ? col : '#3F3F44'}`,
                  boxShadow: bugUp ? `0 0 28px ${holeIdx === 3 ? 'rgba(254,138,0,0.4)' : 'rgba(147,176,216,0.35)'}` : 'inset 0 8px 18px rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {bugUp && (
                  <div style={{ transform: 'translateY(-10px)' }}>
                    <StudioVectorIcon name="bug" color={col} size={44} strokeWidth={2.4} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// NEW PRIMITIVE 9: dual_track_pipeline_race (Manual Gate vs Full-Auto Track)
// ============================================================================
export const PrimitiveDualTrackPipelineRace: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const hasTopHeader = Boolean(d.topTitle || d.topPill || (Array.isArray(d.stepper) && d.stepper.length > 0));

  const autoF = getBeatFrame(scene, d.autoClause ?? 1, fps, 0.45);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const pAuto = settle(spring({ frame: frame - autoF, fps, config: SPRING_SILKY }));

  const top = d.topTrack || {};
  const bot = d.bottomTrack || {};

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1520,
          display: 'flex',
          flexDirection: 'column',
          gap: 44,
          opacity: p1,
          transform: `translateY(${hasTopHeader ? 36 : -10}px)`,
        }}
      >
        {/* Track 1: Semi-Auto / Manual Gate (Slate-Blue) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 310,
              padding: '22px 26px',
              borderRadius: 18,
              background: TOKENS.slateFill,
              border: `2px solid ${TOKENS.slate}`,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 900, color: TOKENS.slateLight }}>{top.title || 'Manual Gate'}</div>
            {top.subtitle && <div style={{ fontSize: 20, fontWeight: 700, color: TOKENS.ink, marginTop: 4 }}>{top.subtitle}</div>}
          </div>

          <div style={{ flex: 1, position: 'relative', height: 96, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 3.5, background: TOKENS.slate, opacity: 0.65 }} />
            <div style={{ width: 68, height: 68, borderRadius: 16, background: TOKENS.card, border: `1.5px solid ${TOKENS.borderCrisp}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <StudioVectorIcon name="package" color={TOKENS.ink} size={32} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
              <span style={{ padding: '6px 20px', borderRadius: 999, background: TOKENS.card, border: `1.5px solid ${TOKENS.inkSecondary}`, fontSize: 19, fontWeight: 800 }}>
                {top.gateLabel || 'Manual Confirm'}
              </span>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: TOKENS.card, border: `1.5px solid ${TOKENS.inkSecondary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StudioVectorIcon name="user" color={TOKENS.inkSecondary} size={26} />
              </div>
            </div>
          </div>

          <div style={{ width: 290, padding: '18px 22px', borderRadius: 18, background: TOKENS.card, border: `1.5px solid ${TOKENS.border}`, opacity: 0.65, flexShrink: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800 }}>{top.endTitle || 'Live Target'}</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: TOKENS.inkMuted, marginTop: 6 }}>{top.endStatus || 'Waiting for approval'}</div>
          </div>
        </div>

        {/* Track 2: Full-Auto Pipeline (Warm Amber) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 310,
              padding: '22px 26px',
              borderRadius: 18,
              background: '#3F2C1B',
              border: `2px solid ${TOKENS.amber}`,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 900, color: TOKENS.amber }}>{bot.title || 'Full Auto'}</div>
            {bot.subtitle && <div style={{ fontSize: 20, fontWeight: 700, color: TOKENS.ink, marginTop: 4 }}>{bot.subtitle}</div>}
          </div>

          <div style={{ flex: 1, position: 'relative', height: 96, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ position: 'absolute', left: 0, width: `${Math.round(pAuto * 100)}%`, height: 4, background: TOKENS.amber }} />
            <div style={{ padding: '14px 24px', borderRadius: 16, background: TOKENS.card, border: `2px solid ${TOKENS.amber}`, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
              <StudioVectorIcon name="cog" color={TOKENS.amber} size={26} />
              <span style={{ fontSize: 21, fontWeight: 800 }}>{bot.engineLabel || 'Auto Runner'}</span>
            </div>
            <div
              style={{
                padding: '8px 22px',
                borderRadius: 999,
                background: TOKENS.amber,
                color: '#141416',
                fontSize: 19,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 2,
                opacity: pAuto,
              }}
            >
              <StudioVectorIcon name="zap" color="#141416" size={18} strokeWidth={2.6} />
              {bot.autoBadge || 'Automated'}
            </div>
          </div>

          <div
            style={{
              width: 290,
              padding: '18px 22px',
              borderRadius: 18,
              background: TOKENS.card,
              border: `2px solid ${pAuto > 0.7 ? TOKENS.amber : TOKENS.border}`,
              flexShrink: 0,
              boxShadow: pAuto > 0.7 ? '0 0 28px rgba(254,138,0,0.22)' : 'none',
            }}
          >
            <div style={{ fontSize: 21, fontWeight: 800 }}>{bot.endTitle || 'Live Target'}</div>
            <div
              style={{
                marginTop: 8,
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 8,
                background: pAuto > 0.7 ? TOKENS.amber : '#3A3A3E',
                color: pAuto > 0.7 ? '#141416' : TOKENS.inkMuted,
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              {bot.unlockedFeatureLabel || 'Updated Live'}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// UPGRADED SUB-MODES FOR EXISTING PRIMITIVES (Zero Regression!)
// ============================================================================

// 1. focus_hud_demo -> mode: 'blur_handoff' | 'blur_strikethrough'
export const FocusHudBlurHandoffMode: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const isStrikethrough = d.mode === 'blur_strikethrough';

  const handoffF = getBeatFrame(scene, d.handoffClause ?? 1, fps, 0.4);
  const replyF = getBeatFrame(scene, d.replyClause ?? Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.72);

  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const blurP = settle(spring({ frame: frame - handoffF, fps, config: SPRING_SILKY }));
  const replyP = settle(spring({ frame: frame - replyF, fps, config: SPRING_SNAPPY }));

  const rawLines: Array<string | { text: string; isError?: boolean }> = Array.isArray(d.rawLines)
    ? d.rawLines
    : ['Process exited with error code 1', 'at module.load (index.ts:42:15)'];

  if (isStrikethrough) {
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 920, opacity: p1, transform: 'translateY(-12px)' }}>
          <div
            style={{
              background: TOKENS.cardCode,
              border: `1.5px solid ${TOKENS.borderCrisp}`,
              borderRadius: 20,
              padding: '32px 38px',
              filter: `blur(${(blurP * 9).toFixed(2)}px)`,
              opacity: interpolate(blurP, [0, 1], [1, 0.45]),
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {d.rawTitle && <div style={{ fontFamily: TOKENS.fontMono, fontSize: 20, color: TOKENS.inkSecondary }}>{d.rawTitle}</div>}
            {rawLines.map((ln, idx) => {
              const txt = typeof ln === 'string' ? ln : ln.text;
              return (
                <div key={idx} style={{ fontFamily: TOKENS.fontMono, fontSize: 23, color: TOKENS.ink }}>
                  {txt}
                </div>
              );
            })}
          </div>
          {blurP > 0.05 && (
            <>
              <svg width="920" height="320" viewBox="0 0 920 320" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <line
                  x1="180"
                  y1="270"
                  x2={180 + 560 * blurP}
                  y2={270 - 220 * blurP}
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) scale(${interpolate(blurP, [0, 1], [0.88, 1]).toFixed(3)})`,
                  padding: '14px 36px',
                  borderRadius: 999,
                  background: '#1E1E22',
                  border: `2px solid ${TOKENS.amber}`,
                  fontSize: 30,
                  fontWeight: 900,
                  color: TOKENS.ink,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.65)',
                }}
              >
                {d.skipBadgeLabel || 'Handled Automatically'}
              </div>
            </>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 34, width: 1460, justifyContent: 'center', opacity: p1, transform: 'translateY(-10px)' }}>
        {/* Left Raw Error / Config Card that Blurs & Recedes */}
        <div
          style={{
            width: 600,
            background: TOKENS.cardCode,
            border: `1.5px solid ${TOKENS.borderCrisp}`,
            borderRadius: 20,
            padding: '28px 32px',
            filter: blurP > 0.02 ? `blur(${(blurP * 7.5).toFixed(2)}px)` : 'none',
            opacity: interpolate(blurP, [0, 1], [1, 0.52]),
            transform: `scale(${interpolate(blurP, [0, 1], [1.04, 0.94]).toFixed(3)})`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: TOKENS.fontMono, fontSize: 19, color: TOKENS.inkSecondary }}>
            <StudioVectorIcon name="alert" color={TOKENS.coral} size={20} />
            <span>{d.rawTitle || 'Raw Diagnostic Log'}</span>
          </div>
          {rawLines.map((ln, idx) => {
            const txt = typeof ln === 'string' ? ln : ln.text;
            const isErr = typeof ln === 'object' && ln.isError;
            return (
              <div
                key={idx}
                style={{
                  fontFamily: TOKENS.fontMono,
                  fontSize: 21,
                  fontWeight: 600,
                  color: isErr ? TOKENS.coral : TOKENS.ink,
                  background: isErr ? TOKENS.coralSoft : 'transparent',
                  padding: isErr ? '6px 10px' : '2px 0',
                  borderRadius: 8,
                }}
              >
                {txt}
              </div>
            );
          })}
        </div>

        {/* Center Connector Pill */}
        {blurP > 0.1 && (
          <div
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              background: '#3F2C1B',
              border: `2px solid ${TOKENS.amber}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: blurP,
              flexShrink: 0,
            }}
          >
            <StudioVectorIcon name="link" color={TOKENS.amber} size={24} />
            {d.connectorLabel && <span style={{ fontSize: 19, fontWeight: 800, color: TOKENS.amber }}>{d.connectorLabel}</span>}
          </div>
        )}

        {/* Right Clean AI Agent Fix Window */}
        {blurP > 0.1 && (
          <div
            style={{
              width: 620,
              background: '#28282B',
              border: `2px solid ${replyP > 0.5 ? TOKENS.emeraldBorder : TOKENS.borderCrisp}`,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 28px 68px rgba(0,0,0,0.55)',
              opacity: blurP,
              transform: `translateX(${interpolate(blurP, [0, 1], [28, 0]).toFixed(1)}px)`,
            }}
          >
            <div style={{ padding: '12px 22px', background: '#202024', borderBottom: `1px solid ${TOKENS.border}`, fontFamily: TOKENS.fontMono, fontSize: 18, color: TOKENS.inkSecondary, textAlign: 'center' }}>
              {d.agentWindowTitle || 'agent'}
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '12px 18px', borderRadius: 12, background: '#3B3B40', fontFamily: TOKENS.fontSans, fontSize: 22, fontWeight: 700, color: TOKENS.ink }}>
                &gt; {d.agentPrompt || 'Read error log and fix automatically'}
              </div>
              {replyP > 0.05 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: replyP }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 23, fontWeight: 800, color: TOKENS.ink }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: TOKENS.amber }} />
                    <span>{d.agentReply || 'Fixed and pushed'}</span>
                  </div>
                  {d.agentSubTree && (
                    <div style={{ paddingLeft: 22, fontFamily: TOKENS.fontMono, fontSize: 20, color: TOKENS.emeraldNeon }}>
                      └ {d.agentSubTree}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 2. skill_editor_spotlight -> mode: 'lint_cleanup'
export const SkillEditorLintCleanupMode: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};

  const cleanF = getBeatFrame(scene, d.cleanClause ?? 1, fps, 0.45);
  const stampF = getBeatFrame(scene, d.stampClause ?? Math.min(2, Math.max(1, scene.clauses.length - 1)), fps, 0.75);

  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const cleanP = settle(spring({ frame: frame - cleanF, fps, config: SPRING_SILKY }));
  const stampP = settle(spring({ frame: frame - stampF, fps, config: SPRING_BOUNCE }));

  const activeClause = getActiveClauseIdx(scene, frame, fps);
  const codeLines: Array<{
    code: string;
    flagLabel?: string;
    flagTone?: Tone;
    flagIcon?: string;
    removeOnClean?: boolean;
    stepNumber?: number;
    highlightClause?: number;
  }> = Array.isArray(d.codeLines) ? d.codeLines : [];
  const rules: string[] = Array.isArray(d.rules) ? d.rules : [];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 38, width: 1480, justifyContent: 'center', opacity: p1, transform: 'translateY(-10px)' }}>
        {/* Optional Left Rule Card */}
        {rules.length > 0 && (
          <div
            style={{
              width: 420,
              background: TOKENS.card,
              border: `1.5px solid ${cleanP > 0.2 ? TOKENS.amber : TOKENS.borderCrisp}`,
              borderRadius: 20,
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 24px 56px rgba(0,0,0,0.42)',
            }}
          >
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 19, fontWeight: 700, color: TOKENS.inkSecondary, borderBottom: `1px solid ${TOKENS.border}`, paddingBottom: 8 }}>
              {d.ruleFile || 'rules.config'}
            </div>
            {rules.map((r, idx) => (
              <div key={idx} style={{ fontSize: 21, fontWeight: 800, color: idx === rules.length - 1 && d.highlightLastRule ? TOKENS.coral : TOKENS.ink }}>
                • {r}
              </div>
            ))}
          </div>
        )}

        {/* Main Code Window with Inline Semantic Badges & Smooth Row Removal */}
        <div
          style={{
            width: rules.length > 0 || d.sidePreview ? 820 : 1080,
            background: TOKENS.cardCode,
            border: `1.5px solid ${TOKENS.borderCrisp}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 28px 68px rgba(0,0,0,0.52)',
            position: 'relative',
          }}
        >
          <div style={{ padding: '14px 24px', background: '#232327', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 20, fontWeight: 700, color: TOKENS.inkSecondary }}>
              {d.filePath || 'Component.tsx'}
            </span>
            {cleanP > 0.8 && !d.rejectStamp ? (
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: TOKENS.emerald, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StudioVectorIcon name="check" color="#FFFFFF" size={16} strokeWidth={2.8} />
              </span>
            ) : (
              <StudioVectorIcon name="sparkles" color={TOKENS.amber} size={22} />
            )}
          </div>

          <div style={{ padding: '22px 0', display: 'flex', flexDirection: 'column' }}>
            {codeLines.map((ln, idx) => {
              const collapsing = Boolean(ln.removeOnClean && cleanP > 0.05);
              const rowScaleY = collapsing ? 1 - cleanP : 1;
              if (rowScaleY <= 0.03) return null;
              const isRangeHighlighted =
                typeof ln.highlightClause === 'number' && activeClause >= ln.highlightClause;
              const pal = tonePalette(ln.flagTone || (isRangeHighlighted ? 'amber' : 'neutral'));
              return (
                <div
                  key={idx}
                  style={{
                    padding: `${(9 * rowScaleY).toFixed(1)}px 28px`,
                    opacity: rowScaleY,
                    background: isRangeHighlighted
                      ? 'rgba(254, 138, 0, 0.20)'
                      : ln.flagLabel
                      ? ln.flagTone === 'coral'
                        ? 'rgba(224, 85, 73, 0.20)'
                        : 'rgba(255, 255, 255, 0.06)'
                      : 'transparent',
                    borderLeft: `4px solid ${isRangeHighlighted ? TOKENS.amber : ln.flagLabel ? pal.fg : 'transparent'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {typeof ln.stepNumber === 'number' && isRangeHighlighted && (
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: TOKENS.amber,
                          color: '#141416',
                          fontFamily: TOKENS.fontMono,
                          fontSize: 15,
                          fontWeight: 900,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {ln.stepNumber}
                      </span>
                    )}
                    <span style={{ fontFamily: TOKENS.fontMono, fontSize: 22, fontWeight: 600, color: TOKENS.ink }}>
                      {ln.code}
                    </span>
                  </div>
                  {ln.flagLabel && (
                    <span
                      style={{
                        padding: '4px 14px',
                        borderRadius: 999,
                        background: pal.bg,
                        border: `1.5px solid ${pal.border}`,
                        color: pal.fg,
                        fontSize: 17,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <StudioVectorIcon name={ln.flagIcon || (ln.flagTone === 'coral' ? 'alert' : 'trash')} color={pal.fg} size={15} />
                      {ln.flagLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {d.rejectStamp && stampP > 0.05 && (
            <div
              style={{
                position: 'absolute',
                right: 36,
                bottom: 26,
                transform: `rotate(-8deg) scale(${interpolate(stampP, [0, 1], [1.4, 1]).toFixed(3)})`,
                padding: '8px 26px',
                borderRadius: 10,
                border: `3.5px solid ${TOKENS.coral}`,
                background: 'rgba(42, 16, 16, 0.92)',
                color: TOKENS.coral,
                fontSize: 32,
                fontWeight: 900,
              }}
            >
              {d.rejectStamp}
            </div>
          )}
        </div>

        {/* Optional Side Infinite-Loop App Crash Preview */}
        {d.sidePreview && (
          <div
            style={{
              width: 340,
              background: TOKENS.card,
              border: `1.5px solid ${cleanP > 0.4 ? TOKENS.coralBorder : TOKENS.borderCrisp}`,
              borderRadius: 20,
              padding: '26px 26px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: TOKENS.inkSecondary }}>{d.sidePreview.title || 'Runtime Preview'}</div>
            <div style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {frame < cleanF + 10 ? (
                <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: `rotate(${(frame * 16) % 360}deg)` }}>
                  <circle cx="32" cy="32" r="24" stroke="rgba(255,255,255,0.18)" strokeWidth="6" fill="none" />
                  <path d="M 32 8 A 24 24 0 0 1 56 32" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" />
                </svg>
              ) : (
                <StudioVectorIcon name="infinity" color="#FFFFFF" size={82} strokeWidth={2.8} />
              )}
            </div>
            {d.sidePreview.caption && (
              <div style={{ fontSize: 19, fontWeight: 800, color: TOKENS.coral }}>{d.sidePreview.caption}</div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 3. synergy_puzzle_pair -> mode: 'n_piece_mismatch' | 'bundler_funnel'
export const SynergyPuzzleExtendedModes: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};
  const beat2 = getBeatFrame(scene, d.snapClause ?? 1, fps, 0.48);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const p2 = settle(spring({ frame: frame - beat2, fps, config: SPRING_SNAPPY }));

  if (d.mode === 'bundler_funnel') {
    const exts: string[] = Array.isArray(d.fragmentExts) ? d.fragmentExts : ['.tsx', '.ts', '.css', '.json'];
    const outputs: string[] = Array.isArray(d.outputArtifacts) ? d.outputArtifacts : ['.html', '.css', '.js'];
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 42, opacity: p1, transform: 'translateY(-10px)' }}>
          {/* Micro-file Fragment Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 7, width: 390 }}>
            {Array.from({ length: 36 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 4px',
                  borderRadius: 6,
                  background: '#38383C',
                  fontFamily: TOKENS.fontMono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: TOKENS.inkSecondary,
                  textAlign: 'center',
                }}
              >
                {exts[idx % exts.length]}
              </div>
            ))}
          </div>

          <svg width="90" height="220" viewBox="0 0 90 220" fill="none">
            <line x1="0" y1="20" x2="88" y2="85" stroke={TOKENS.amber} strokeWidth="3" />
            <line x1="0" y1="110" x2="88" y2="110" stroke={TOKENS.amber} strokeWidth="3" />
            <line x1="0" y1="200" x2="88" y2="135" stroke={TOKENS.amber} strokeWidth="3" />
          </svg>

          {/* Bundler Engine Box */}
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: 26,
              background: TOKENS.card,
              border: `2.5px solid ${TOKENS.amber}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <div style={{ transform: `rotate(${(frame * 4) % 360}deg)` }}>
              <StudioVectorIcon name="cog" color="#FFFFFF" size={64} />
            </div>
            <span style={{ fontSize: 34, fontWeight: 900, color: TOKENS.ink }}>{d.bundlerLabel || 'Build'}</span>
          </div>

          <svg width="70" height="160" viewBox="0 0 70 160" fill="none" style={{ opacity: p2 }}>
            <line x1="0" y1="80" x2="66" y2="30" stroke={TOKENS.amber} strokeWidth="3" />
            <line x1="0" y1="80" x2="66" y2="80" stroke={TOKENS.amber} strokeWidth="3" />
            <line x1="0" y1="80" x2="66" y2="130" stroke={TOKENS.amber} strokeWidth="3" />
          </svg>

          {/* Standardized Bundle Outputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, opacity: p2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {outputs.map((o, idx) => (
                <div key={idx} style={{ padding: '12px 28px', borderRadius: 12, background: TOKENS.card, border: `1.5px solid ${TOKENS.borderCrisp}`, fontFamily: TOKENS.fontMono, fontSize: 23, fontWeight: 800 }}>
                  {o}
                </div>
              ))}
            </div>
            {d.finalPackageLabel && (
              <div style={{ padding: '24px 28px', borderRadius: 20, background: TOKENS.card, border: `2px solid ${TOKENS.amber}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <StudioVectorIcon name="package" color={TOKENS.amber} size={44} />
                <span style={{ fontSize: 21, fontWeight: 800 }}>{d.finalPackageLabel}</span>
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // mode: 'n_piece_mismatch'
  const pieceLabels: string[] = Array.isArray(d.pieces) ? d.pieces : ['</> 01', '</> 02', '</> 03', '</> 04', '</> 05'];
  const mismatchJoints: number[] = Array.isArray(d.mismatchJoints) ? d.mismatchJoints : [0, 3];
  const gapPx = interpolate(p2, [0, 1], [34, 2]);
  const collided = p2 > 0.75;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: gapPx, opacity: p1, transform: 'translateY(-10px)' }}>
        {pieceLabels.slice(0, 6).map((lbl, idx) => {
          const hasSeamErr = collided && mismatchJoints.includes(idx);
          return (
            <div
              key={idx}
              style={{
                width: 196,
                height: 196,
                borderRadius: 20,
                background: '#38383C',
                border: `2.5px solid ${hasSeamErr ? TOKENS.coral : '#5A5A60'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontFamily: TOKENS.fontMono,
                fontSize: 26,
                fontWeight: 800,
                color: TOKENS.ink,
              }}
            >
              {lbl}
              {!collided && (
                <span
                  style={{
                    position: 'absolute',
                    top: -14,
                    right: -10,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: TOKENS.emerald,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StudioVectorIcon name="check" color="#FFFFFF" size={20} strokeWidth={2.8} />
                </span>
              )}
              {hasSeamErr && (
                <span
                  style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: TOKENS.coral,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5,
                    boxShadow: '0 8px 24px rgba(224,85,73,0.5)',
                  }}
                >
                  <StudioVectorIcon name="x" color="#FFFFFF" size={22} strokeWidth={3} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 4. arc_gauge_audit -> mode: 'threshold_tripwire'
export const ArcGaugeThresholdTripwireMode: React.FC<{ scene: StudioScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = scene.data || {};

  const tripF = getBeatFrame(scene, d.tripClause ?? 1, fps, 0.48);
  const p1 = settle(spring({ frame, fps, config: SPRING_SILKY }));
  const pTrip = settle(spring({ frame: frame - tripF, fps, config: SPRING_SILKY }));

  const initialPct = Number(d.initialPct ?? 92);
  const finalPct = Number(d.scorePct ?? d.finalPct ?? 75);
  const thresholdPct = Number(d.thresholdPct ?? 90);
  const curPct = interpolate(pTrip, [0, 1], [initialPct, finalPct]);
  const isTripped = frame >= tripF + 4 && curPct < thresholdPct;

  const criteria: string[] = Array.isArray(d.criteria) ? d.criteria : [];
  const R = 175;
  const SEMI_LEN = Math.PI * R; // 180 deg semi-circle from (-R,0) to (+R,0)
  const thAngle = Math.PI * (1 - thresholdPct / 100);
  const tx1 = 220 + (R - 20) * Math.cos(thAngle);
  const ty1 = 230 - (R - 20) * Math.sin(thAngle);
  const tx2 = 220 + (R + 24) * Math.cos(thAngle);
  const ty2 = 230 - (R + 24) * Math.sin(thAngle);

  const needleAngle = Math.PI * (1 - curPct / 100);
  const nx = 220 + (R + 12) * Math.cos(needleAngle);
  const ny = 230 - (R + 12) * Math.sin(needleAngle);

  const arcCol = isTripped ? TOKENS.coral : curPct >= thresholdPct ? TOKENS.emeraldNeon : '#E4E4E7';

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 86, opacity: p1, transform: 'translateY(-10px)' }}>
        {criteria.length > 0 && (
          <div
            style={{
              width: 520,
              background: TOKENS.card,
              border: `1.5px solid ${TOKENS.borderCrisp}`,
              borderRadius: 22,
              padding: '32px 36px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 28px 68px rgba(0,0,0,0.48)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, borderBottom: `1px solid ${TOKENS.border}` }}>
              <span style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${TOKENS.amber}`, background: TOKENS.amberSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StudioVectorIcon name={d.criteriaIcon || 'scale'} color={TOKENS.amber} size={28} />
              </span>
              <span style={{ fontSize: 30, fontWeight: 900, color: TOKENS.ink }}>{d.criteriaTitle || 'Evaluator'}</span>
            </div>
            {criteria.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 25, fontWeight: 800 }}>
                <span style={{ width: 28, height: 28, borderRadius: 7, border: '2px solid #8E8E93', flexShrink: 0 }} />
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 480, height: 270 }}>
            <svg width={480} height={270} viewBox="0 0 440 260" style={{ overflow: 'visible' }}>
              <path d={`M ${220 - R} 230 A ${R} ${R} 0 0 1 ${220 + R} 230`} fill="none" stroke="#45454A" strokeWidth="24" strokeLinecap="round" />
              <path
                d={`M ${220 - R} 230 A ${R} ${R} 0 0 1 ${220 + R} 230`}
                fill="none"
                stroke={arcCol}
                strokeWidth="24"
                strokeLinecap="round"
                strokeDasharray={SEMI_LEN}
                strokeDashoffset={SEMI_LEN * (1 - (curPct / 100) * p1)}
              />
              {/* Threshold Marker Tick */}
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={TOKENS.amber} strokeWidth="5" strokeLinecap="round" />
              <text x={tx2 + 12} y={ty2 + 4} fill={TOKENS.ink} fontSize="21" fontWeight="800">
                {d.thresholdLabel || `Threshold ${thresholdPct}%`}
              </text>
              {/* Crisp Outer-Rim Needle (zero collision with centered percentage readout) */}
              <line x1={220 + 124 * Math.cos(needleAngle)} y1={230 - 124 * Math.sin(needleAngle)} x2={nx} y2={ny} stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center' }}>
              <div style={{ fontFamily: TOKENS.fontMono, fontSize: 64, fontWeight: 900, color: isTripped ? TOKENS.coral : TOKENS.ink, lineHeight: 1 }}>
                {Math.round(curPct)}%
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: TOKENS.inkSecondary, marginTop: 8 }}>
                {d.metricLabel || 'Pass Rate'}
              </div>
            </div>
          </div>

          {frame >= tripF + 4 && (
            <div
              style={{
                padding: '10px 28px',
                borderRadius: 999,
                background: isTripped ? TOKENS.coralSoft : TOKENS.emeraldSoft,
                border: `2px solid ${isTripped ? TOKENS.coral : TOKENS.emeraldNeon}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 23,
                fontWeight: 900,
                color: TOKENS.ink,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isTripped ? TOKENS.coral : TOKENS.emerald,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StudioVectorIcon name={isTripped ? 'x' : 'check'} color="#FFFFFF" size={16} strokeWidth={2.8} />
              </span>
              <span>{isTripped ? d.failBadge || 'Rejected' : d.passBadge || 'Passed'}</span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
