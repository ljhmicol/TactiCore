import { transposePoint } from '@/lib/coords'
import { circularRadius, swapForLandscape } from '@/lib/pitchMarkings'
import { positionInfoAt } from '@/lib/positions'
import { VERSUS_TEAM_COLORS } from '@/lib/theme'
import type { Player, Point } from '@/types/analysis'

interface StaticPlayerNodeProps {
  player: Player
  position: Point
  formation: string
  index: number
  /** A=홈(파랑), B=원정(마젠타) — lib/theme.ts VERSUS_TEAM_COLORS */
  variant: 'A' | 'B'
  /** landscape는 전술 대결 뷰(TO-DO 21) 전용. position은 항상 원본(세로) 좌표계로 받는다. */
  orientation?: 'portrait' | 'landscape'
}

const PORTRAIT_RADIUS = circularRadius(2.6)
const LANDSCAPE_RADIUS = swapForLandscape(PORTRAIT_RADIUS)
const GK_RING_RADIUS_PORTRAIT = circularRadius(3.1)
const GK_RING_RADIUS_LANDSCAPE = swapForLandscape(GK_RING_RADIUS_PORTRAIT)

/**
 * 전술 대결 뷰(16번) 전용 읽기 전용 노드. PlayerNode/OpponentNode는
 * useAnalysisStore에서 현재 활성 분석의 formation/index/드래그 액션을
 * 끌어오는데, 대결 뷰의 두 분석은 둘 다 "활성 분석"이 아니므로 그 훅들을
 * 재사용하면 조용히 엉뚱한 데이터(또는 흰색 폴백)를 그리게 된다. 그래서
 * formation·index를 props로 직접 받는다.
 *
 * 색은 포지션 라인이 아니라 팀 단위로 칠한다 — 두 팀 다 같은 포지션
 * 팔레트(GK 노랑/DF 파랑…)를 쓰면 "다 같은 팀 선수 같다"는 문제가 생겼다
 * (2026-09-07 사용자 피드백). 실제 골키퍼 유니폼이 필드 플레이어와 다른
 * 것처럼, GK만 팀 색 위에 흰 링을 하나 더 둘러 구분한다.
 */
export function StaticPlayerNode({
  player,
  position,
  formation,
  index,
  variant,
  orientation = 'portrait',
}: StaticPlayerNodeProps) {
  const info = positionInfoAt(formation, index)
  const isGK = info?.line === 'GK'
  const team = VERSUS_TEAM_COLORS[variant]
  const landscape = orientation === 'landscape'
  const RADIUS = landscape ? LANDSCAPE_RADIUS : PORTRAIT_RADIUS
  const GK_RING_RADIUS = landscape ? GK_RING_RADIUS_LANDSCAPE : GK_RING_RADIUS_PORTRAIT
  const p = landscape ? transposePoint(position) : position

  return (
    <g>
      {isGK && (
        <ellipse cx={p.x} cy={p.y} rx={GK_RING_RADIUS.rx} ry={GK_RING_RADIUS.ry} fill="#F8FAFC" fillOpacity={0.9} />
      )}
      <ellipse
        cx={p.x}
        cy={p.y}
        rx={RADIUS.rx}
        ry={RADIUS.ry}
        fill={team.fill}
        stroke={variant === 'A' ? '#0F172A' : '#F8FAFC'}
        strokeOpacity={variant === 'A' ? 0.4 : 0.8}
        strokeWidth={variant === 'A' ? 0.3 : 0.5}
      />
      <text
        x={p.x}
        y={p.y}
        fill={team.text}
        fontSize={2.4}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ userSelect: 'none' }}
      >
        {player.number}
      </text>
      <text
        x={p.x}
        y={p.y + RADIUS.ry + 3}
        fill="#F8FAFC"
        fontSize={2}
        fontWeight={700}
        textAnchor="middle"
        style={{ userSelect: 'none', paintOrder: 'stroke' }}
        stroke="#0F172A"
        strokeWidth={0.35}
        strokeOpacity={0.55}
      >
        {player.name}
      </text>
    </g>
  )
}
