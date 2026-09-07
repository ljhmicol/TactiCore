import { autoPressingLine, pressingLineLevel } from '@/lib/compactness'
import { LAYER_COLORS } from '@/lib/theme'
import type { PlayerPosition } from '@/types/analysis'

interface PressingLineProps {
  positions: PlayerPosition[]
  pressingLineY?: number
  /** landscape는 전술 대결 뷰(TO-DO 21) 전용. positions는 항상 원본(세로) 좌표계로 받는다 —
   * autoPressingLine이 y값(공격 방향 거리)을 기준으로 계산하기 때문이다. */
  orientation?: 'portrait' | 'landscape'
}

/**
 * pressingLineY가 수동 지정돼 있으면 그 값을 그대로 쓰고, 없으면 자동 산출한다
 * (GK 제외 최대 y). 사용자가 수동 지정한 경우 자동 산출은 호출되지 않는다.
 */
export function PressingLine({ positions, pressingLineY, orientation = 'portrait' }: PressingLineProps) {
  const y = pressingLineY ?? autoPressingLine(positions)
  const landscape = orientation === 'landscape'
  const line = landscape ? { x1: 100 - y, y1: 0, x2: 100 - y, y2: 100 } : { x1: 0, y1: y, x2: 100, y2: y }
  // 세로 모드는 라인이 항상 우측(x=98)에 붙어 end 정렬만 쓰면 되지만, 가로
  // 모드는 라인이 화면 어느 쪽 끝에나 올 수 있어(공수 교대) 화면 밖으로
  // 잘리지 않도록 라인 위치에 따라 정렬을 바꾼다.
  const landscapeX = 100 - y
  const label = landscape
    ? landscapeX < 12
      ? { x: landscapeX + 1.5, y: 3, anchor: 'start' as const }
      : landscapeX > 88
        ? { x: landscapeX - 1.5, y: 3, anchor: 'end' as const }
        : { x: landscapeX, y: 3, anchor: 'middle' as const }
    : { x: 98, y: y - 1.2, anchor: 'end' as const }

  return (
    <g>
      <line {...line} stroke={LAYER_COLORS.pressingLine.color} strokeWidth={LAYER_COLORS.pressingLine.width} />
      <text x={label.x} y={label.y} fill={LAYER_COLORS.pressingLine.color} fontSize={2} textAnchor={label.anchor}>
        압박 라인 {pressingLineLevel(y)}
      </text>
    </g>
  )
}
