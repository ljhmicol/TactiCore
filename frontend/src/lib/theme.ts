/**
 * 2단계 §12 색 및 시각 규정을 상수로 고정한다.
 * 이 프로젝트에서 색은 장식이 아니라 데이터다 — 즉흥적으로 바꾸지 않는다.
 */

export const PITCH_COLORS = {
  background: '#1B5E3F',
  line: '#FFFFFF',
  lineOpacity: 0.55,
  lineWidth: 0.3,
} as const

export const PLAYER_COLORS = {
  own: {
    fill: '#F8FAFC',
    stroke: '#0F172A',
    strokeOpacity: 0.4,
    text: '#0F172A',
    radius: 2.6,
  },
  opponent: {
    fill: '#94A3B8',
    fillOpacity: 0.55,
    radius: 2.2,
  },
  ghost: {
    fillOpacity: 0.25,
    pathStroke: '#F8FAFC',
    pathStrokeOpacity: 0.35,
    pathDasharray: '1 1.5',
  },
} as const

/**
 * 포지션 라인별 노드 색 (2026-09-01 사용자 요청 — 가시성):
 * 골키퍼=노랑, 수비=파랑, 미드필더=초록, 공격=빨강.
 * 초록은 피치 배경(#1B5E3F) 위에서 구분되도록 밝은 톤. text는 원 안
 * 등번호 색 — 채도가 낮은 노랑·초록 위에는 어두운 글자로 대비를 맞춘다.
 * 도출 규칙(lib/positions.ts)과 함께 쓴다.
 */
export const POSITION_LINE_COLORS = {
  GK: { fill: '#FACC15', text: '#0F172A' },
  DF: { fill: '#3B82F6', text: '#F8FAFC' },
  MF: { fill: '#4ADE80', text: '#0F172A' },
  FW: { fill: '#EF4444', text: '#F8FAFC' },
} as const

export const LAYER_COLORS = {
  channelGrid: { color: '#FFFFFF', opacity: 0.2 },
  halfSpaces: { color: '#FFFFFF', opacity: 0.08 },
  pressingLine: { color: '#FB923C', width: 0.5 },
  compactness: { color: '#38BDF8' },
  overload: {
    strong: { color: '#FACC15', opacity: 0.35 },
    weak: { color: '#FACC15', opacity: 0.15 },
  },
} as const

export const SHARE_CARD_COLORS = {
  background: '#0F172A',
  title: '#F8FAFC',
  subtitle: '#94A3B8',
  phaseLabel: '#34D399',
  body: '#E2E8F0',
} as const
