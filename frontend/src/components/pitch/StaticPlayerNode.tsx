import { circularRadius } from '@/lib/pitchMarkings'
import { positionInfoAt } from '@/lib/positions'
import { POSITION_LINE_COLORS } from '@/lib/theme'
import type { Player, Point } from '@/types/analysis'

interface StaticPlayerNodeProps {
  player: Player
  position: Point
  formation: string
  index: number
  /** A=내 전술(채움), B=상대 전술(테두리만) — 겹쳐진 두 팀을 눈으로 구분하기 위함 */
  variant: 'A' | 'B'
}

const RADIUS = circularRadius(2.6)

/**
 * 전술 대결 뷰(16번) 전용 읽기 전용 노드. PlayerNode/OpponentNode는
 * useAnalysisStore에서 현재 활성 분석의 formation/index/드래그 액션을
 * 끌어오는데, 대결 뷰의 두 분석은 둘 다 "활성 분석"이 아니므로 그 훅들을
 * 재사용하면 조용히 엉뚱한 데이터(또는 흰색 폴백)를 그리게 된다. 그래서
 * formation·index를 props로 직접 받는다.
 */
export function StaticPlayerNode({ player, position, formation, index, variant }: StaticPlayerNodeProps) {
  const info = positionInfoAt(formation, index)
  const lineColor = info ? POSITION_LINE_COLORS[info.line] : null
  const fill = lineColor?.fill ?? '#F8FAFC'

  return (
    <g>
      <ellipse
        cx={position.x}
        cy={position.y}
        rx={RADIUS.rx}
        ry={RADIUS.ry}
        fill={variant === 'A' ? fill : '#F8FAFC'}
        fillOpacity={variant === 'A' ? 1 : 0.9}
        stroke={variant === 'A' ? '#0F172A' : fill}
        strokeOpacity={variant === 'A' ? 0.4 : 1}
        strokeWidth={variant === 'A' ? 0.3 : 0.7}
      />
      <text
        x={position.x}
        y={position.y}
        fill={variant === 'A' ? (lineColor?.text ?? '#0F172A') : fill}
        fontSize={2.4}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ userSelect: 'none' }}
      >
        {player.number}
      </text>
      <text
        x={position.x}
        y={position.y + RADIUS.ry + 3}
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
