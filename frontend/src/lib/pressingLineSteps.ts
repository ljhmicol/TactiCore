import { clampCoord } from '@/lib/coords'
import { pressingLineLevel, type PressingLineLevel } from '@/lib/compactness'
import { positionInfoAt } from '@/lib/positions'
import type { Player, PlayerPosition } from '@/types/analysis'

/**
 * FM(풋볼매니저) 스타일로 압박 라인을 5단계 중 하나로 직접 지정한다
 * (2026-09-08 사용자 요청 — "포메이션과 공격 미들 수비 간격 비율은 유지
 * 하면서 압박 라인을 높이고 줄이게"). `pressingLineLevel`이 라인을 읽는
 * 데 쓰는 5단계 경계(50/65/80/90)와 같은 등급을 그대로 쓴다 — 그래야
 * "이 단계를 고르면 라벨도 그 단계로 보인다"가 항상 성립한다.
 *
 * 각 단계의 목표 y는 그 등급 구간 안에서 실제 축구에서 있을 법한 값으로
 * 골랐다(구간 중앙값이 아니다 — 특히 "매우 높음" 구간(0~50)은 폭이 넓어
 * 중앙값(25)을 쓰면 상대 문전까지 밀고 올라가는 비현실적인 라인이 된다).
 */
const STEP_TARGET_Y: Record<PressingLineLevel, number> = {
  '매우 높음': 40,
  높음: 58,
  보통: 73,
  낮음: 86,
  '매우 낮음': 95,
}

export const PRESSING_LINE_LEVELS: PressingLineLevel[] = ['매우 높음', '높음', '보통', '낮음', '매우 낮음']

/** GK는 항상 players 배열의 0번(formations.ts 규약)이지만, 만일을 대비해 실제로 찾는다. */
export function findGkPlayerId(players: Player[], formation: string): string | undefined {
  const gkIndex = players.findIndex((_, i) => positionInfoAt(formation, i)?.line === 'GK')
  return gkIndex >= 0 ? players[gkIndex].id : undefined
}

/** GK를 뺀 출전 선수 중 가장 깊은(y 최댓값) 위치 — 이 국면의 "현재 수비 라인" 기준점. */
export function currentBackLineY(positions: PlayerPosition[], gkPlayerId: string | undefined): number | null {
  const outfield = positions.filter((p) => p.playerId !== gkPlayerId)
  if (outfield.length === 0) return null
  return Math.max(...outfield.map((p) => p.y))
}

/** 지금 이 국면의 압박 라인이 5단계 중 어디에 해당하는지 — Select의 현재 선택값으로 쓴다. */
export function currentPressingLineLevel(positions: PlayerPosition[], gkPlayerId: string | undefined): PressingLineLevel | null {
  const y = currentBackLineY(positions, gkPlayerId)
  return y == null ? null : pressingLineLevel(y)
}

/**
 * targetLevel에 맞는 y로 GK를 제외한 전원을 같은 델타만큼 평행 이동한다 —
 * 순수 평행이동이라 공격/미드/수비 라인 사이 간격(비율)이 자동으로
 * 그대로 유지된다. GK는 움직이지 않는다(압박 라인은 백라인 얘기지 GK
 * 얘기가 아니다 — 실제로도 라인을 아무리 올려도 GK는 자기 골문 근처에
 * 남는다). 이동 후 누구도 피치 밖(0~99.9)으로 안 나가게 **델타 자체를**
 * 줄인다 — 선수 개개인을 따로 clamp하면 그 선수만 대형에서 어긋나
 * 간격 비율이 깨진다.
 */
export function shiftPositionsToPressingLevel(
  positions: PlayerPosition[],
  gkPlayerId: string | undefined,
  targetLevel: PressingLineLevel,
): { positions: PlayerPosition[]; pressingLineY: number } | null {
  const outfield = positions.filter((p) => p.playerId !== gkPlayerId)
  if (outfield.length === 0) return null

  const currentY = Math.max(...outfield.map((p) => p.y))
  const minY = Math.min(...outfield.map((p) => p.y))
  const maxY = currentY
  const rawDelta = STEP_TARGET_Y[targetLevel] - currentY
  const delta = Math.max(-minY, Math.min(rawDelta, 99.9 - maxY))

  return {
    positions: positions.map((p) => (p.playerId === gkPlayerId ? p : { ...p, y: clampCoord(p.y + delta) })),
    pressingLineY: currentY + delta,
  }
}
