import { autoPressingLine } from '@/lib/compactness'
import { LAYER_COLORS } from '@/lib/theme'
import type { PlayerPosition } from '@/types/analysis'

/**
 * pressingLineY가 수동 지정돼 있으면 그 값을 그대로 쓰고, 없으면 자동 산출한다
 * (GK 제외 최대 y). 사용자가 수동 지정한 경우 자동 산출은 호출되지 않는다.
 */
export function PressingLine({ positions, pressingLineY }: { positions: PlayerPosition[]; pressingLineY?: number }) {
  const y = pressingLineY ?? autoPressingLine(positions)

  return (
    <g>
      <line
        x1={0}
        y1={y}
        x2={100}
        y2={y}
        stroke={LAYER_COLORS.pressingLine.color}
        strokeWidth={LAYER_COLORS.pressingLine.width}
      />
      <text x={98} y={y - 1.2} fill={LAYER_COLORS.pressingLine.color} fontSize={2} textAnchor="end">
        압박 라인 y={Math.round(y)}
      </text>
    </g>
  )
}
