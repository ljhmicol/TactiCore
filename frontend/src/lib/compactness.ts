import { PITCH_LENGTH_M, PITCH_WIDTH_M } from '@/lib/zones'
import type { PlayerPosition } from '@/types/analysis'

/**
 * GK 판별은 role 문자열이 아니라 y가 가장 큰 선수 1명으로 한다 (2단계 §9).
 * role은 자유 입력이라 "골키퍼"/"GK"/빈 값이 섞여 신뢰할 수 없다.
 * 압박 라인과 콤팩트니스가 이 헬퍼를 공유한다 (4단계 §5.4/5.5).
 */
export function outfieldPlayers(positions: PlayerPosition[]): PlayerPosition[] {
  const sorted = [...positions].sort((a, b) => b.y - a.y)
  return sorted.slice(1)
}

/** pressingLineY가 수동 지정되어 있으면 이 함수를 호출하지 않고 그 값을 그대로 쓴다. */
export function autoPressingLine(positions: PlayerPosition[]): number {
  const sorted = [...positions].sort((a, b) => b.y - a.y)
  return sorted[1]?.y ?? sorted[0]?.y ?? 0
}

export interface CompactnessResult {
  box: { x: number; y: number; width: number; height: number }
  verticalM: number
  horizontalM: number
}

export function computeCompactness(positions: PlayerPosition[]): CompactnessResult | null {
  const outfield = outfieldPlayers(positions)
  if (outfield.length === 0) return null

  const minX = Math.min(...outfield.map((p) => p.x))
  const maxX = Math.max(...outfield.map((p) => p.x))
  const minY = Math.min(...outfield.map((p) => p.y))
  const maxY = Math.max(...outfield.map((p) => p.y))

  return {
    box: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    verticalM: +(((maxY - minY) * PITCH_LENGTH_M) / 100).toFixed(1), // y축 = 길이 105m
    horizontalM: +(((maxX - minX) * PITCH_WIDTH_M) / 100).toFixed(1), // x축 = 폭 68m
  }
}
